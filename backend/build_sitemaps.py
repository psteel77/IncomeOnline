"""
Build-time script: generates static sitemap files into frontend/public/
so Vercel can serve them directly — no backend proxy needed.

Outputs:
  - frontend/public/sitemap.xml             (sitemap INDEX — this is what you submit to GSC)
  - frontend/public/main-sitemap.xml        (4 main pages)
  - frontend/public/platforms-sitemap.xml   (one <url> per platform)

Run this any time you add/remove platforms, or schedule it in CI.
"""
import os
import re
import sys
from datetime import datetime, timezone

# Allow running from /app/backend
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from seed_data import platforms_data  # noqa: E402

SITE_URL = "https://www.incomeonline.info"
PUBLIC_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), '..', 'frontend', 'public')
)


def slugify(name: str) -> str:
    s = name.lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def write_file(path: str, content: str):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  ✓ {os.path.relpath(path, PUBLIC_DIR)} ({len(content):,} bytes)")


def main():
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    print(f"Building sitemaps for {SITE_URL} (date: {today})")

    # 1. Main sitemap — the 4 primary pages
    main_urls = [
        ('/',                 '1.0', 'weekly'),
        ('/success-stories',  '0.9', 'weekly'),
        ('/about',            '0.7', 'monthly'),
        ('/donate',           '0.8', 'monthly'),
    ]
    main_xml = ['<?xml version="1.0" encoding="UTF-8"?>',
                '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for path, priority, changefreq in main_urls:
        main_xml.append('  <url>')
        main_xml.append(f'    <loc>{SITE_URL}{path}</loc>')
        main_xml.append(f'    <lastmod>{today}</lastmod>')
        main_xml.append(f'    <changefreq>{changefreq}</changefreq>')
        main_xml.append(f'    <priority>{priority}</priority>')
        main_xml.append('  </url>')
    main_xml.append('</urlset>')
    write_file(os.path.join(PUBLIC_DIR, 'main-sitemap.xml'), '\n'.join(main_xml))

    # 2. Platforms sitemap — one URL per unique platform slug
    platforms_xml = ['<?xml version="1.0" encoding="UTF-8"?>',
                     '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    seen = set()
    for p in platforms_data:
        name = (p.get('name') or '').strip()
        if not name:
            continue
        slug = slugify(name)
        if not slug or slug in seen:
            continue
        seen.add(slug)
        platforms_xml.append('  <url>')
        platforms_xml.append(f'    <loc>{SITE_URL}/platforms/{slug}</loc>')
        platforms_xml.append(f'    <lastmod>{today}</lastmod>')
        platforms_xml.append('    <changefreq>monthly</changefreq>')
        platforms_xml.append('    <priority>0.6</priority>')
        platforms_xml.append('  </url>')
    platforms_xml.append('</urlset>')
    write_file(
        os.path.join(PUBLIC_DIR, 'platforms-sitemap.xml'),
        '\n'.join(platforms_xml),
    )
    print(f"  → {len(seen)} unique platform URLs emitted")

    # 3. Sitemap INDEX — this is the single URL to submit to GSC
    index_xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>{SITE_URL}/main-sitemap.xml</loc>
    <lastmod>{today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>{SITE_URL}/platforms-sitemap.xml</loc>
    <lastmod>{today}</lastmod>
  </sitemap>
</sitemapindex>"""
    write_file(os.path.join(PUBLIC_DIR, 'sitemap.xml'), index_xml)

    print("\nDone. Submit ONLY https://www.incomeonline.info/sitemap.xml to Google Search Console.")


if __name__ == '__main__':
    main()
