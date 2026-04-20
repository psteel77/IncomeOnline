# Income Online - Product Requirements Document

## Project Overview
A comprehensive website for discovering online earning opportunities. Features include a directory of 199+ platforms, search/filter, custom branding, PayPal-based paywall, magic link auth, and a full admin panel for content management.

## Core Requirements
1. **Platform Directory**: Searchable, filterable list of 199+ online earning platforms
2. **Paywall**: Full platform details restricted to users who have donated via PayPal
3. **Subscription**: User access valid for 12 months from donation date
4. **Automated Emails**: Warning 7 days before expiration + expiration notifications
5. **Admin Panel**: Full CMS for site content and platforms
6. **Custom Branding & UI**: Purple/pink/orange gradient theme with glass-morphism (strictly NO teal/cyan)
7. **SEO**: Site must be discoverable and indexable by search engines
8. **Free Resources**: Downloadable educational Word documents (MoneyRules series)

## Deployment
- **Frontend**: Vercel (https://www.incomeonline.info)
- **Backend**: Railway
- **Database**: MongoDB Atlas
- **Source Control**: GitHub (psteel77/IncomeOnline) — main branch → auto-deploy

## What's Been Implemented

### Completed (Feb 2026 — current session)
- **Hardcoded text moved to CMS (a)**: Hero section now reads `badge`, `headline_line1`, `headline_line2`, `subtitle_line1`, `subtitle_line2` from CMS with fallbacks. New CMS sections added: `library_banner` (badge/headline/description/cta_primary/cta_secondary) and `free_resources` (title/subtitle). Admin Dashboard expanded with edit forms for all 3. `POST /api/seed-content` is now idempotent — adds missing sections without clobbering admin edits.
- **Admin Subscribers page (b)**: New `SubscribersCard` in `/admin` dashboard shows captured emails in a table with filter, totals (total / newsletter opt-in), and CSV export (`resource_subscribers_YYYY-MM-DD.csv`).
- **Mailgun email-delivery of guides (d)**: Free Resources dialog now has an "Email me the guide" checkbox. When checked, POST `/api/pdf/resources/request-download` with `deliver_via_email=true` attaches the `.docx` and emails it via Mailgun (`send_resource_email` in `email_service.py`). Response includes `email_delivery: "sent" | "failed" | "skipped"`.

### Completed (earlier — see CHANGELOG context in previous sessions)

### Completed (Jan 2025)
- Full-stack React/FastAPI/MongoDB app; 199+ platforms across 8 categories
- PayPal donation integration with 12-month subscription
- Magic link authentication; Admin CMS; SEO meta + sitemap
- Google Search Console & Bing Webmaster Tools verified

### Completed (Mar 2025)
- SEO fixes, PDF generation for platforms, nav reorder
- Modern UI redesign (purple/pink/orange vibrant theme)

### Completed (Apr 2025)
- Rule of 72 10-page Word document + endpoint `/api/pdf/rule-of-72`
- MoneyRules reusable template (`moneyrules_template.py`) — Georgia serif, double-line borders, shadow effect
- Complete teal-to-purple theme migration (all components verified)

### Completed (Feb / Apr 2026)
- **SEO Cleanup**: sitemap.xml lastmod refreshed to 2026-04-18 (current); index.html cache-control + hidden H1 cleaned up
- **MoneyRules Library** — 7 free Word guides (was 2):
  - The Rule of 72 — Complete Investment Guide
  - The 50/30/20 Rule — Budget Guide
  - Beginner's Guide to Passive Income (NEW)
  - The Debt Snowball Method (NEW)
  - Build a 3-Month Emergency Fund (NEW)
  - The Compound Interest Handbook (NEW)
  - UK Tax Basics for Freelancers & Side-Hustlers (NEW)
- **Animated Resource Library Banner** directly below hero on Home — animated gradient, pulsing book icon, "Browse the Library" smooth-scroll CTA
- **Expanded Free Resources section** — 3-column grid of 7 cards, each with unique colour accent, sub-title, and 160-char description
- **Blog feature fully removed**: deleted `blog_routes.py`, `Blog.jsx`, `BlogPost.jsx`, `BlogAdmin.jsx`, removed blog_router registration from `server.py`
- **Colour-scheme final sweep**: replaced remaining yellow/amber legacy colours in "How It Works" section (title + step headings + conclusion) and "6 Top Rated Opportunities" title/subtitle in `PlatformPreview.jsx` → purple/pink/orange gradient. SAMPLE badges swapped to purple.
- **Email-capture gateway for Free Resources**: new `ResourceDownloadDialog` component asks for email before download; stored in `resource_subscribers` (unique by email, `$addToSet` resources, `$inc` download_count) and per-event log in `resource_download_events`. Newsletter opt-in checkbox (default checked) is one-way: True→never downgraded. Admin endpoint `GET /api/pdf/resources/subscribers` lists captured emails with opt-in counts.
- **Sitemap Ping admin card** (`/admin` dashboard top): "Ping Now" button calls `/api/seo/sitemap-ping` which attempts Google/Bing legacy endpoints + sitemap self-check reachability, stores event history in `sitemap_ping_events`. Per-engine status badges with honest note that legacy ping endpoints were retired in 2023.
- **Dynamic platform landing pages for SEO** (P0 win): 185 unique individual platform URLs (`/platforms/{slug}`) now exist as crawlable pages with full SEO — per-page title, meta description, canonical link, Open Graph, Twitter card, and JSON-LD Product schema with aggregateRating.
- **Static sitemap files** (Vercel-served, no Railway proxy required): `sitemap.xml` is now a sitemap INDEX referencing `main-sitemap.xml` (4 URLs) + `platforms-sitemap.xml` (185 platform URLs). Regenerated by `python backend/build_sitemaps.py`.
- **`useSEO` custom hook** replaces broken react-helmet-async v2 on Home, SuccessStories and PlatformDetail — title/description/canonical/OG/Twitter/JSON-LD all render correctly now.
- **Share panel** on every platform detail page — Copy link + X + Facebook + LinkedIn + WhatsApp; each platform becomes a shareable referral asset.
- **Library Progress Tracker** — returning visitors (email persisted in localStorage) see their completion state on the MoneyRules library: gradient progress bar ("3 of 10 downloaded · 7 guides left to unlock"), "DOWNLOADED" pills + purple ring on completed cards, "Download again" button state, "Library complete — time to upgrade to the Premium Pack!" celebration at 10/10. Backend: `GET /api/pdf/resources/progress?email=X`.
- **10 FREE MoneyRules guides** — added Credit Score Masterclass, ISA vs SIPP, Side-Hustle Quick-Start alongside existing 7. All email-gated and progress-tracked.
- **$12.99 MoneyRules Premium Pack** — ZIP bundle with all 10 free guides + 2 exclusive premium guides (Wealth Roadmap + FIRE Playbook) + 5 editable Excel spreadsheets (Budget, Debt, Compounding, Emergency Fund, Net Worth) + welcome letter. Generated by `generate_premium_pack.py`. `PremiumPackSection` renders dark-purple pricing section with PayPal Hosted Buttons. Endpoints: `POST /api/pdf/premium-pack/purchase` (token-issuing), `GET /api/pdf/premium-pack?token=X` (ZIP download), `GET /api/pdf/premium-pack/purchases` (admin list). Requires `REACT_APP_PAYPAL_PREMIUM_PACK_BUTTON_ID` env var — user creates a $12.99 PayPal Hosted Button in their business dashboard and pastes the ID.
- **Banner upgraded** — "100% Free · MoneyRules Library" gold pill, headline "10 FREE Financial Guides, Yours to Keep", primary CTA "Get My Free Guides" + secondary link to Premium Pack.

## Technical Architecture
```
/app
├── backend
│   ├── server.py                  # Main FastAPI server (blog removed)
│   ├── pdf_routes.py              # PDF + Word doc endpoints
│   ├── moneyrules_template.py     # Reusable MoneyRules brochure template
│   ├── generate_rule72_doc.py     # Rule of 72 content
│   ├── generate_503020_doc.py     # 50/30/20 Budget Rule content (NEW)
│   ├── cms_routes.py              # CMS admin routes
│   ├── email_service.py           # Email templates
│   └── seed_data.py               # 199 platforms data
├── frontend
│   ├── public
│   │   ├── index.html             # SEO meta tags (cleaned)
│   │   └── sitemap.xml            # lastmod: 2026-04-18
│   └── src/pages/Home.jsx         # Free Resources: 2 card grid
```

## Key API Endpoints
- `GET /api/pdf/platforms` — Download full platforms PDF
- `GET /api/pdf/rule-of-72` — Rule of 72 Word guide
- `GET /api/pdf/budget-503020` — 50/30/20 Budget Rule Word guide
- `GET /api/pdf/moneyrules-template` — Blank branded template
- `POST /api/pdf/resources/request-download` — Email-capture gateway (body: `{email, resource, consent}`) → returns `{download_url}`
- `GET /api/pdf/resources/subscribers` — Admin list of captured subscriber emails

## Admin Credentials
See `/app/memory/test_credentials.md`

## Pending / Backlog
1. **P0 — User Action**: Push current changes to GitHub `main` to trigger Vercel + Railway deploy
2. **P0 — User Action**: Add `www.incomeonline.info` as a property in Google Search Console (separate from `incomeonline.info`) and resubmit sitemap
3. **P2**: Expand Free Resources (e.g. Beginner's Guide to Passive Income, Debt Snowball Method) using MoneyRules template

## Future Enhancements
- Social sharing buttons for Free Resources (downloads are ready-made lead magnets)
- Email capture on download (newsletter list)
- Analytics dashboard (downloads per resource)
