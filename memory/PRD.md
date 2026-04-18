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
- **50/30/20 Budget Rule 10-page Word guide**: `/api/pdf/budget-503020` with branded card on Home Free Resources section (pink/orange gradient to complement the purple/pink Rule of 72 card)
- **Blog feature fully removed**: deleted `blog_routes.py`, `Blog.jsx`, `BlogPost.jsx`, `BlogAdmin.jsx`, removed blog_router registration from `server.py`

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
- `GET /api/pdf/budget-503020` — 50/30/20 Budget Rule Word guide (NEW)
- `GET /api/pdf/moneyrules-template` — Blank branded template

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
