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
    long_desc = _esc(p.get("longDescription"))
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
        "description": p.get("longDescription") or p.get("description"),
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
<html lang="en-GB">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>{title}</title>
<meta name="description" content="{meta_desc}"/>
<meta name="robots" content="index, follow"/>
<link rel="canonical" href="{canonical}"/>
<link rel="alternate" hreflang="en-gb" href="{canonical}"/>
<link rel="alternate" hreflang="x-default" href="{canonical}"/>
<meta property="og:locale" content="en_GB"/>
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
{f"<h2>About {name}</h2><p>{long_desc}</p>" if long_desc else ""}
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
            '<!DOCTYPE html><html lang="en-GB"><head><meta charset="utf-8"/>'
            '<title>Platform not found | Income Online</title>'
            '<meta name="robots" content="noindex, follow"/>'
            f'<link rel="canonical" href="{SITE_URL}/"/></head>'
            '<body><h1>Platform not found</h1>'
            f'<p><a href="{SITE_URL}/">Browse all platforms</a></p></body></html>'
        )
        return HTMLResponse(content=notfound, status_code=404)

    # Same-category platforms first for stronger internal linking / crawl depth.
    related = _pick_related(platforms, slug, match.get("category") or "", limit=12)

    html_doc = _render_platform_html(match, related)
    return HTMLResponse(
        content=html_doc,
        headers={"Cache-Control": "public, max-age=3600"},
    )



# =============================================================================
# Category-aware related platforms (used by both bot HTML + the human React page)
# =============================================================================

def _pick_related(platforms: list, current_slug: str, current_category: str, limit: int = 6) -> list:
    """Prefer same-category platforms, then fill from others, for internal linking."""
    same_cat, others = [], []
    for p in platforms:
        s = slugify(p.get("name") or "")
        if not s or s == current_slug:
            continue
        if (p.get("category") or "") == (current_category or ""):
            same_cat.append(p)
        else:
            others.append(p)
    return (same_cat + others)[:limit]


@router.get("/related-platforms/{slug}")
async def related_platforms(slug: str, limit: int = 6):
    """Same-category platforms for the bottom of a platform page (humans + crawl depth)."""
    from server import db
    slug = slug.lower().strip()
    platforms = await db.platforms.find({}, {"_id": 0}).to_list(5000)

    current = next((p for p in platforms if slugify(p.get("name") or "") == slug), None)
    if not current:
        return {"related": [], "category": None}

    related = _pick_related(platforms, slug, current.get("category") or "", max(1, min(limit, 12)))
    out = [
        {
            "name": r.get("name"),
            "slug": slugify(r.get("name") or ""),
            "category": r.get("category"),
            "earningsPotential": r.get("earningsPotential"),
            "difficulty": r.get("difficulty"),
            "rating": r.get("rating"),
        }
        for r in related
    ]
    return {"related": out, "category": current.get("category")}


# =============================================================================
# Crawler-facing server-rendered HTML for the homepage, /donate, /success-stories
# (same dynamic-rendering pattern as platform pages; Vercel routes bots here)
# =============================================================================

def _doc(title: str, meta_desc: str, canonical: str, body: str, json_ld: dict | None = None) -> str:
    import json as _json
    ld = f'<script type="application/ld+json">{_json.dumps(json_ld)}</script>' if json_ld else ""
    return f"""<!DOCTYPE html>
<html lang="en-GB">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>{title}</title>
<meta name="description" content="{meta_desc}"/>
<meta name="robots" content="index, follow"/>
<link rel="canonical" href="{canonical}"/>
<link rel="alternate" hreflang="en-gb" href="{canonical}"/>
<link rel="alternate" hreflang="x-default" href="{canonical}"/>
<meta property="og:locale" content="en_GB"/>
<meta property="og:type" content="website"/>
<meta property="og:title" content="{title}"/>
<meta property="og:description" content="{meta_desc}"/>
<meta property="og:url" content="{canonical}"/>
<meta property="og:image" content="{SITE_URL}/earnhub-logo.png"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="{title}"/>
<meta name="twitter:description" content="{meta_desc}"/>
{ld}
</head>
<body>
<header><a href="{SITE_URL}/">Income Online</a></header>
{body}
<footer><a href="{SITE_URL}/">Browse all 199+ verified earning platforms</a> &middot; <a href="{SITE_URL}/donate">Unlock full access (£9.99/yr)</a> &middot; <a href="{SITE_URL}/success-stories">Success stories</a></footer>
</body>
</html>"""


@router.get("/render/home")
async def render_home():
    """Crawler-facing server-rendered homepage built from the DB."""
    from server import db
    platforms = await db.platforms.find({}, {"_id": 0}).to_list(5000)

    # Group platforms by category for rich, internally-linked content.
    by_cat: dict[str, list] = {}
    for p in platforms:
        name = (p.get("name") or "").strip()
        if not name:
            continue
        by_cat.setdefault(p.get("category") or "Other", []).append(p)

    total = sum(len(v) for v in by_cat.values())
    title = "Income Online | Discover 199+ Legitimate Ways to Earn Money Online"
    meta_desc = (
        f"Browse {total}+ verified online earning platforms across {len(by_cat)} categories — "
        "freelancing, surveys, remote jobs, e-commerce, teaching, trading and more. "
        "Real reviews, payment info and success stories."
    )[:300]

    sections = []
    for category, items in sorted(by_cat.items(), key=lambda kv: -len(kv[1])):
        links = "".join(
            f'<li><a href="{SITE_URL}/platforms/{slugify(p.get("name") or "")}">{_esc(p.get("name"))}</a>'
            f' — {_esc(p.get("earningsPotential"))}</li>'
            for p in items[:25]
        )
        sections.append(
            f'<section><h2>{_esc(category)} ({len(items)} platforms)</h2><ul>{links}</ul></section>'
        )

    json_ld = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "Income Online",
        "url": SITE_URL,
        "description": meta_desc,
    }
    body = (
        f"<main><h1>Discover {total}+ Legitimate Ways to Earn Money Online</h1>"
        "<p>Income Online is a curated directory of verified online earning platforms across "
        f"{len(by_cat)} categories. Every listing includes earnings potential, difficulty, minimum "
        "payout, payment methods and UK availability. We don't take platform commissions, so our "
        "reviews stay unbiased.</p>"
        '<p><a href="' + SITE_URL + '/donate">Unlock the full directory for a one-time £9.99 yearly contribution</a>, '
        'or <a href="' + SITE_URL + '/success-stories">read real success stories</a>.</p>'
        + "".join(sections) + "</main>"
    )
    return HTMLResponse(_doc(title, meta_desc, f"{SITE_URL}/", body, json_ld),
                        headers={"Cache-Control": "public, max-age=3600"})


@router.get("/render/donate")
async def render_donate():
    """Crawler-facing server-rendered /donate page."""
    title = "Support Income Online — Unlock 199+ Earning Platforms for £9.99/yr"
    meta_desc = (
        "Make a one-time £9.99 yearly contribution to unlock full access to 199+ verified "
        "online earning platforms — detailed reviews, payment info and real success stories. "
        "Secure payment via PayPal."
    )[:300]
    canonical = f"{SITE_URL}/donate"
    json_ld = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "Income Online — Full Directory Access (12 months)",
        "description": meta_desc,
        "url": canonical,
        "offers": {
            "@type": "Offer",
            "price": "9.99",
            "priceCurrency": "GBP",
            "availability": "https://schema.org/InStock",
            "url": canonical,
        },
    }
    body = (
        "<main><h1>Support Income Online</h1>"
        "<p>Your one-time <strong>£9.99</strong> contribution unlocks 12 months of full access to our "
        "directory of 199+ verified online earning platforms, and keeps the directory free, live and "
        "up to date for everyone.</p>"
        "<h2>What you get</h2><ul>"
        "<li>Full details for all 199+ platforms — earnings potential, difficulty, minimum payout and payment methods</li>"
        "<li>12 months of access from the date of your contribution</li>"
        "<li>Real, source-cited success stories to model your own journey on</li>"
        "<li>New platforms and features funded by your support</li>"
        "</ul>"
        "<h2>Secure payment</h2><p>Payments are processed securely by PayPal. We never see or store "
        "your payment information.</p>"
        f'<p><a href="{canonical}">Make your £9.99 contribution</a> or '
        f'<a href="{SITE_URL}/">browse the directory first</a>.</p></main>'
    )
    return HTMLResponse(_doc(title, meta_desc, canonical, body, json_ld),
                        headers={"Cache-Control": "public, max-age=3600"})


# A source-cited set of success stories, loaded from the canonical data module
# (shared with the human-facing React pages).
from success_stories_data import get_all as _stories_all, get_by_slug as _story_by_slug, get_related as _story_related


@router.get("/success-stories")
async def list_success_stories():
    """Full list of success stories (slugged) — used by the React list page."""
    return {"stories": _stories_all(), "count": len(_stories_all())}


@router.get("/success-story/{slug}")
async def get_success_story(slug: str):
    """A single success story by slug — used by the React detail page."""
    story = _story_by_slug(slug)
    if not story:
        raise HTTPException(status_code=404, detail="Success story not found")
    return {"story": story, "related": _story_related(story, 4)}


@router.get("/render/success-story/{slug}")
async def render_success_story(slug: str):
    """Crawler-facing server-rendered HTML for a single success story."""
    story = _story_by_slug(slug)
    if not story:
        notfound = (
            '<!DOCTYPE html><html lang="en-GB"><head><meta charset="utf-8"/>'
            '<title>Success story not found | Income Online</title>'
            '<meta name="robots" content="noindex, follow"/>'
            f'<link rel="canonical" href="{SITE_URL}/success-stories"/></head>'
            '<body><h1>Success story not found</h1>'
            f'<p><a href="{SITE_URL}/success-stories">Read all success stories</a></p></body></html>'
        )
        return HTMLResponse(content=notfound, status_code=404)

    name = _esc(story["name"])
    platform = _esc(story["platform"])
    category = _esc(story["category"])
    canonical = f"{SITE_URL}/success-stories/{story['slug']}"
    title = f"{name} — {story['earnings']} on {platform} | Success Story | Income Online"
    meta_desc = (f"{name}'s success story: {story['before']} to {story['after']}. "
                 f"Earnings: {story['earnings']} via {platform} in {story['timeline']}. {story['highlight']}.")[:300]

    related = _story_related(story, 4)
    related_html = "".join(
        f'<li><a href="{SITE_URL}/success-stories/{r["slug"]}">{_esc(r["name"])} — {_esc(r["platform"])} ({_esc(r["earnings"])})</a></li>'
        for r in related
    )

    json_ld = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": title,
        "description": meta_desc,
        "url": canonical,
        "articleSection": story["category"],
        "publisher": {"@type": "Organization", "name": "Income Online", "url": SITE_URL},
        "mainEntityOfPage": canonical,
    }
    if story.get("sourceUrl"):
        json_ld["citation"] = story["sourceUrl"]

    body = (
        '<nav aria-label="Breadcrumb">'
        f'<a href="{SITE_URL}/">Home</a> &rsaquo; '
        f'<a href="{SITE_URL}/success-stories">Success Stories</a> &rsaquo; {name}</nav>'
        f"<main><article><h1>{name}: {_esc(story['after'])}</h1>"
        f"<p><strong>Platform:</strong> {platform} &middot; <strong>Category:</strong> {category} "
        f"&middot; <strong>Timeline:</strong> {_esc(story['timeline'])}</p>"
        f"<p><strong>Before:</strong> {_esc(story['before'])}<br/>"
        f"<strong>After:</strong> {_esc(story['after'])}</p>"
        f"<p><strong>Earnings:</strong> {_esc(story['earnings'])}</p>"
        f"<p>{_esc(story['story'])}</p>"
        f"<p><em>{_esc(story['highlight'])}</em></p>"
        f"<p><strong>Source:</strong> {_esc(story['source'])} — "
        f"<a href=\"{_esc(story['sourceUrl'])}\" rel=\"nofollow noopener\">view original source</a></p>"
        f'<p><a href="{SITE_URL}/platforms/{slugify(story["platform"])}">See the {platform} platform details</a> '
        f'or <a href="{SITE_URL}/donate">unlock the full directory for £9.99/yr</a>.</p>'
        f"<h2>More success stories</h2><ul>{related_html}</ul>"
        "</article></main>"
    )
    return HTMLResponse(_doc(title, meta_desc, canonical, body, json_ld),
                        headers={"Cache-Control": "public, max-age=3600"})


@router.get("/success-stories-sitemap.xml")
async def success_stories_sitemap():
    """XML sitemap of all individual success-story landing pages."""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    for s in _stories_all():
        lines.append('  <url>')
        lines.append(f'    <loc>{SITE_URL}/success-stories/{s["slug"]}</loc>')
        lines.append(f'    <lastmod>{today}</lastmod>')
        lines.append('    <changefreq>monthly</changefreq>')
        lines.append('    <priority>0.6</priority>')
        lines.append('  </url>')
    lines.append('</urlset>')
    return Response(content="\n".join(lines), media_type="application/xml",
                    headers={"Cache-Control": "public, max-age=3600"})


@router.get("/render/success-stories")
async def render_success_stories():
    """Crawler-facing server-rendered /success-stories index page (links to each story)."""
    title = "Success Stories | Real People Earning Money Online | Income Online"
    meta_desc = (
        "Read 60+ verified, source-cited success stories from real people earning money online — "
        "from freelancing on Upwork to surveys on Prolific and courses on Udemy."
    )[:300]
    canonical = f"{SITE_URL}/success-stories"

    cards = "".join(
        f'<article><h2><a href="{SITE_URL}/success-stories/{s["slug"]}">'
        f'{_esc(s["name"])} — {_esc(s["platform"])} ({_esc(s["category"])})</a></h2>'
        f'<p><strong>Earnings:</strong> {_esc(s["earnings"])} &middot; <strong>Timeline:</strong> {_esc(s["timeline"])}</p>'
        f'<p>{_esc(s["story"])}</p></article>'
        for s in _stories_all()
    )
    body = (
        "<main><h1>Real People, Real Success</h1>"
        "<p>Genuine, source-cited success stories from people who used online platforms to transform "
        "their income. Individual results vary; past performance doesn't guarantee future results.</p>"
        + cards +
        f'<p><a href="{SITE_URL}/">Browse the platforms these earners used</a> or '
        f'<a href="{SITE_URL}/donate">unlock full access for £9.99/yr</a>.</p></main>'
    )
    json_ld = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "Income Online Success Stories",
        "url": canonical,
        "description": meta_desc,
    }
    return HTMLResponse(_doc(title, meta_desc, canonical, body, json_ld),
                        headers={"Cache-Control": "public, max-age=3600"})


# =============================================================================
# Wealth Generator Guides — crawler-facing rendered HTML + sitemap
# =============================================================================
def _md_to_html(md_text: str) -> str:
    try:
        import markdown as _md
        return _md.markdown(md_text or "", extensions=["extra", "sane_lists"])
    except Exception:
        return "".join(f"<p>{_esc(p)}</p>" for p in (md_text or "").split("\n\n"))


@router.get("/guides-sitemap.xml")
async def guides_sitemap():
    """XML sitemap of all published guide landing pages."""
    from server import db
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    guides = await db.guides.find({"status": "published"}, {"_id": 0, "slug": 1}).to_list(2000)
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        '  <url>',
        f'    <loc>{SITE_URL}/guides</loc>',
        f'    <lastmod>{today}</lastmod>',
        '    <changefreq>weekly</changefreq>',
        '    <priority>0.7</priority>',
        '  </url>',
    ]
    for g in guides:
        lines.append('  <url>')
        lines.append(f'    <loc>{SITE_URL}/guides/{g["slug"]}</loc>')
        lines.append(f'    <lastmod>{today}</lastmod>')
        lines.append('    <changefreq>monthly</changefreq>')
        lines.append('    <priority>0.7</priority>')
        lines.append('  </url>')
    lines.append('</urlset>')
    return Response(content="\n".join(lines), media_type="application/xml",
                    headers={"Cache-Control": "public, max-age=3600"})


@router.get("/render/guides")
async def render_guides():
    """Crawler-facing server-rendered Wealth Generator Guides index page."""
    from server import db
    guides = await db.guides.find({"status": "published"}, {"_id": 0}).sort("published_at", -1).to_list(500)
    title = "Wealth Generator Guides | Make Money & Manage Money in the UK | Income Online"
    meta_desc = (
        "Free UK money guides — side hustles, freelancing, passive income, budgeting, "
        "ISAs, SIPPs and tax. Practical, British-English advice from Income Online."
    )[:300]
    canonical = f"{SITE_URL}/guides"

    cards = "".join(
        f'<article><h2><a href="{SITE_URL}/guides/{_esc(g["slug"])}">{_esc(g["title"])}</a></h2>'
        f'<p>{_esc(g.get("excerpt"))}</p>'
        f'<p><em>{_esc(g.get("category"))} &middot; {_esc(g.get("read_minutes"))} min read</em></p></article>'
        for g in guides
    )
    body = (
        "<main><h1>Wealth Generator Guides</h1>"
        "<p>Free, practical guides for UK readers on making money online, side hustles, "
        "freelancing, budgeting, ISAs, SIPPs and tax. Written in plain British English.</p>"
        + (cards or "<p>New guides are on the way.</p>") +
        f'<p><a href="{SITE_URL}/">Browse 199+ verified earning platforms</a> or '
        f'<a href="{SITE_URL}/donate">unlock full access for £9.99/yr</a>.</p></main>'
    )
    json_ld = {
        "@context": "https://schema.org",
        "@type": "Blog",
        "name": "Wealth Generator Guides",
        "url": canonical,
        "description": meta_desc,
        "inLanguage": "en-GB",
    }
    return HTMLResponse(_doc(title, meta_desc, canonical, body, json_ld),
                        headers={"Cache-Control": "public, max-age=3600"})


@router.get("/render/guide/{slug}")
async def render_guide(slug: str):
    """Crawler-facing server-rendered HTML for a single guide article."""
    from server import db
    g = await db.guides.find_one({"slug": slug, "status": "published"}, {"_id": 0})
    if not g:
        notfound = (
            '<!DOCTYPE html><html lang="en-GB"><head><meta charset="utf-8"/>'
            '<title>Guide not found | Income Online</title>'
            '<meta name="robots" content="noindex, follow"/>'
            f'<link rel="canonical" href="{SITE_URL}/guides"/></head>'
            '<body><h1>Guide not found</h1>'
            f'<p><a href="{SITE_URL}/guides">Read all guides</a></p></body></html>'
        )
        return HTMLResponse(content=notfound, status_code=404)

    canonical = f"{SITE_URL}/guides/{g['slug']}"
    title = f"{_esc(g['title'])} | Wealth Generator Guides | Income Online"
    meta_desc = (g.get("meta_description") or g.get("excerpt") or "")[:300]

    related = await db.guides.find(
        {"status": "published", "slug": {"$ne": slug}}, {"_id": 0, "slug": 1, "title": 1},
    ).sort("published_at", -1).to_list(4)
    related_html = "".join(
        f'<li><a href="{SITE_URL}/guides/{_esc(r["slug"])}">{_esc(r["title"])}</a></li>' for r in related
    )

    json_ld = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": g["title"],
        "description": meta_desc,
        "url": canonical,
        "articleSection": g.get("category"),
        "datePublished": g.get("published_at"),
        "dateModified": g.get("updated_at"),
        "author": {"@type": "Organization", "name": g.get("author") or "Income Online"},
        "publisher": {"@type": "Organization", "name": "Income Online", "url": SITE_URL},
        "mainEntityOfPage": canonical,
        "inLanguage": "en-GB",
    }
    if g.get("hero_image"):
        json_ld["image"] = g["hero_image"]

    body = (
        '<nav aria-label="Breadcrumb">'
        f'<a href="{SITE_URL}/">Home</a> &rsaquo; '
        f'<a href="{SITE_URL}/guides">Wealth Generator Guides</a> &rsaquo; {_esc(g["title"])}</nav>'
        f"<main><article><h1>{_esc(g['title'])}</h1>"
        f"<p><em>{_esc(g.get('category'))} &middot; {_esc(g.get('read_minutes'))} min read</em></p>"
        + _md_to_html(g.get("content")) +
        f'<p><a href="{SITE_URL}/donate">Unlock the full directory of 199+ earning platforms for £9.99/yr</a>.</p>'
        f"<h2>More guides</h2><ul>{related_html}</ul>"
        "</article></main>"
    )
    return HTMLResponse(_doc(title, meta_desc, canonical, body, json_ld),
                        headers={"Cache-Control": "public, max-age=3600"})
