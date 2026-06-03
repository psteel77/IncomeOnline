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
from fastapi.responses import Response, HTMLResponse
from pydantic import BaseModel
from datetime import datetime, timezone
from urllib.parse import quote
import os
import re
import html
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


# -----------------------------------------------------------------------------
# Server-side rendered HTML for search-engine crawlers (dynamic rendering)
# -----------------------------------------------------------------------------
# The site is a client-side React SPA, so crawlers that don't execute JS (Bing,
# and Google's first crawl pass) see an empty shell. This endpoint returns a
# fully-rendered HTML page for a platform — built from the database, no browser
# required — with unique <title>, meta, canonical and JSON-LD. A Vercel rewrite
# routes bot user-agents here (see frontend/vercel.json), while humans continue
# to get the interactive React app at the same URL.

def _esc(value) -> str:
    return html.escape(str(value if value is not None else "")).strip()


def _render_platform_html(p: dict, related: list) -> str:
    name = _esc(p.get("name"))
    category = _esc(p.get("category"))
    description = _esc(p.get("description"))
    earnings = _esc(p.get("earningsPotential"))
    difficulty = _esc(p.get("difficulty"))
    rating = p.get("rating")
    min_payout = _esc(p.get("minPayout"))
    link = _esc(p.get("link"))
    uk = p.get("ukAvailable")
    methods = p.get("paymentMethods") or []
    slug = slugify(p.get("name") or "")
    canonical = f"{SITE_URL}/platforms/{slug}"

    title = f"{name} Review — {category} | Earn Money Online | Income Online"
    meta_desc = (
        f"{name}: {description[:150]}. Earnings: {earnings}. "
        f"Difficulty: {difficulty}. Min payout: {min_payout}."
    )[:300]

    methods_html = "".join(f"<li>{_esc(m)}</li>" for m in methods)
    related_html = "".join(
        f'<li><a href="{SITE_URL}/platforms/{slugify(r.get("name") or "")}">{_esc(r.get("name"))}</a></li>'
        for r in related
    )

    json_ld = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": p.get("name"),
        "description": p.get("description"),
        "category": p.get("category"),
        "url": canonical,
    }
    if isinstance(rating, (int, float)):
        json_ld["aggregateRating"] = {
            "@type": "AggregateRating",
            "ratingValue": rating,
            "bestRating": 5,
            "ratingCount": 1,
        }
    import json as _json
    json_ld_str = _json.dumps(json_ld)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>{title}</title>
<meta name="description" content="{meta_desc}"/>
<meta name="robots" content="index, follow"/>
<link rel="canonical" href="{canonical}"/>
<meta property="og:type" content="website"/>
<meta property="og:title" content="{title}"/>
<meta property="og:description" content="{meta_desc}"/>
<meta property="og:url" content="{canonical}"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="{title}"/>
<meta name="twitter:description" content="{meta_desc}"/>
<script type="application/ld+json">{json_ld_str}</script>
</head>
<body>
<header><a href="{SITE_URL}/">Income Online</a> &rsaquo; <a href="{SITE_URL}/">Platforms</a> &rsaquo; {name}</header>
<main>
<h1>{name}</h1>
<p><strong>Category:</strong> {category}</p>
<p>{description}</p>
<ul>
<li><strong>Earnings potential:</strong> {earnings}</li>
<li><strong>Difficulty:</strong> {difficulty}</li>
<li><strong>Rating:</strong> {_esc(rating)} / 5</li>
<li><strong>Minimum payout:</strong> {min_payout}</li>
<li><strong>Available in the UK:</strong> {"Yes" if uk else "No"}</li>
</ul>
<h2>Payment methods</h2>
<ul>{methods_html}</ul>
<p><a href="{link}" rel="nofollow noopener">Visit {name}</a></p>
<h2>Explore more earning platforms</h2>
<ul>{related_html}</ul>
</main>
<footer><a href="{SITE_URL}/">Browse all 199+ platforms on Income Online</a></footer>
</body>
</html>"""


@router.get("/render/platform/{slug}")
async def render_platform(slug: str):
    """Crawler-facing server-rendered HTML for a platform page."""
    from server import db
    slug = slug.lower().strip()
    platforms = await db.platforms.find({}, {"_id": 0}).to_list(5000)

    match = None
    for p in platforms:
        if slugify(p.get("name") or "") == slug:
            match = p
            break

    if not match:
        notfound = (
            '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/>'
            '<title>Platform not found | Income Online</title>'
            '<meta name="robots" content="noindex, follow"/>'
            f'<link rel="canonical" href="{SITE_URL}/"/></head>'
            '<body><h1>Platform not found</h1>'
            f'<p><a href="{SITE_URL}/">Browse all platforms</a></p></body></html>'
        )
        return HTMLResponse(content=notfound, status_code=404)

    # A handful of other platforms for internal linking / crawl depth.
    related = [
        p for p in platforms
        if slugify(p.get("name") or "") != slug and p.get("name")
    ][:12]

    html_doc = _render_platform_html(match, related)
    return HTMLResponse(
        content=html_doc,
        headers={"Cache-Control": "public, max-age=3600"},
    )
