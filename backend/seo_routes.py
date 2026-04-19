"""
SEO admin routes — sitemap ping tracking.

Context (as of 2026): Google retired the /ping?sitemap= endpoint in June 2023,
and Bing retired theirs shortly after. Both now rely on sitemaps registered in
Search Console / Webmaster Tools. We still hit both endpoints best-effort so:

  - If either vendor ever restores the endpoint, it works again automatically.
  - Attempts are logged so the admin has a timestamped trail.
  - The call also doubles as a reachability check of the sitemap URL itself.
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from datetime import datetime, timezone
from urllib.parse import quote
import os
import re
import uuid
import logging
import aiohttp

router = APIRouter(prefix="/seo")

SITE_URL = os.environ.get('SITE_URL', 'https://www.incomeonline.info')
SITEMAP_URL = f"{SITE_URL}/sitemap.xml"


def slugify(name: str) -> str:
    """Convert a platform name to a URL-safe slug."""
    s = name.lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")

PING_TARGETS = [
    {
        'engine': 'google',
        'url': f"https://www.google.com/ping?sitemap={quote(SITEMAP_URL, safe='')}",
        'label': 'Google (legacy endpoint)',
    },
    {
        'engine': 'bing',
        'url': f"https://www.bing.com/ping?sitemap={quote(SITEMAP_URL, safe='')}",
        'label': 'Bing (legacy endpoint)',
    },
    {
        'engine': 'sitemap-self-check',
        'url': SITEMAP_URL,
        'label': 'Sitemap reachability',
    },
]


def _status_bucket(engine: str, status_code: int | None, ok: bool) -> str:
    """Classify the outcome into a human-friendly bucket."""
    if status_code == 200 and ok:
        return 'ok'
    if status_code in (404, 410):
        # Google/Bing ping endpoints are officially retired — not an error.
        return 'retired'
    if status_code is None:
        return 'unreachable'
    return 'error'


@router.post("/sitemap-ping")
async def ping_sitemap():
    """
    Ping all search engines with the sitemap URL and self-check reachability.
    Stores the event in MongoDB and returns per-engine status.
    """
    from server import db

    now = datetime.now(timezone.utc).isoformat()
    results = []

    async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as client:
        for target in PING_TARGETS:
            try:
                async with client.get(target['url'], allow_redirects=True) as resp:
                    status_code = resp.status
                    bucket = _status_bucket(target['engine'], status_code, 200 <= status_code < 300)
                    results.append({
                        'engine': target['engine'],
                        'label': target['label'],
                        'url': target['url'],
                        'status_code': status_code,
                        'bucket': bucket,
                    })
            except Exception as e:
                logging.warning(f"Sitemap ping failed for {target['engine']}: {e}")
                results.append({
                    'engine': target['engine'],
                    'label': target['label'],
                    'url': target['url'],
                    'status_code': None,
                    'bucket': 'unreachable',
                    'error': str(e)[:200],
                })

    event = {
        'id': str(uuid.uuid4()),
        'pinged_at': now,
        'sitemap_url': SITEMAP_URL,
        'results': results,
    }
    await db.sitemap_ping_events.insert_one(event.copy())

    # Remove _id in case MongoDB mutated our dict
    event.pop('_id', None)

    return {
        'success': True,
        'pinged_at': now,
        'sitemap_url': SITEMAP_URL,
        'results': results,
    }


@router.get("/sitemap-ping")
async def get_sitemap_ping_history(limit: int = 10):
    """Return the N most recent ping events."""
    from server import db
    events = await db.sitemap_ping_events.find(
        {}, {"_id": 0}
    ).sort('pinged_at', -1).to_list(max(1, min(limit, 50)))
    return {
        'count': len(events),
        'latest': events[0] if events else None,
        'history': events,
    }



# ======================================================================
# Dynamic sitemap: individual platform landing pages for SEO
# ======================================================================

@router.get("/platforms-sitemap.xml")
async def platforms_sitemap():
    """
    Dynamic XML sitemap of all platform landing pages, e.g.
    https://www.incomeonline.info/platforms/upwork
    Google + Bing can register this URL directly in Search Console.
    """
    from server import db

    platforms = await db.platforms.find({}, {"_id": 0, "name": 1}).to_list(5000)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    seen = set()
    for p in platforms:
        name = (p.get('name') or '').strip()
        if not name:
            continue
        slug = slugify(name)
        if not slug or slug in seen:
            continue
        seen.add(slug)
        lines.append('  <url>')
        lines.append(f'    <loc>{SITE_URL}/platforms/{slug}</loc>')
        lines.append(f'    <lastmod>{today}</lastmod>')
        lines.append('    <changefreq>monthly</changefreq>')
        lines.append('    <priority>0.6</priority>')
        lines.append('  </url>')
    lines.append('</urlset>')

    xml = "\n".join(lines)
    return Response(
        content=xml,
        media_type="application/xml",
        headers={"Cache-Control": "public, max-age=3600"},
    )


@router.get("/sitemap-index.xml")
async def sitemap_index():
    """
    Sitemap index file referencing both the static sitemap (main pages)
    and the dynamic platforms sitemap. Submit THIS single URL in Search
    Console and Google will discover both children automatically.
    """
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>{SITE_URL}/sitemap.xml</loc>
    <lastmod>{today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>{SITE_URL}/api/seo/platforms-sitemap.xml</loc>
    <lastmod>{today}</lastmod>
  </sitemap>
</sitemapindex>"""
    return Response(
        content=xml,
        media_type="application/xml",
        headers={"Cache-Control": "public, max-age=3600"},
    )


@router.get("/platform-by-slug/{slug}")
async def platform_by_slug(slug: str):
    """Fetch a single platform by its URL slug (derived from name)."""
    from server import db
    slug = slug.lower().strip()
    platforms = await db.platforms.find({}, {"_id": 0}).to_list(5000)
    for p in platforms:
        if slugify(p.get('name') or '') == slug:
            return p
    raise HTTPException(status_code=404, detail="Platform not found")
