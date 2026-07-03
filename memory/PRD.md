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

### Completed (3 Jul 2026 — paid members no longer shown payment demands) [PENDING DEPLOY]
- **Bug (user report):** a logged-in / already-paid member still saw "Get full access" (guide pages) and the "Make a Donation" PayPal card (`/donate` + homepage), i.e. a demand for money after they'd paid. Root cause: those CTAs didn't check `isAuthenticated`.
- **Fixes (all auth-gated via `useAuth`):**
  - `components/home/DonationSection.jsx` (homepage `#support`) → renders a green **"You have full access"** card for members instead of the PayPal payment card.
  - `pages/Donate.jsx` (`/donate` — the page "Get full access" links to) → members see **"You already have full access"** (signed-in email + "Browse all 199+ platforms"), non-members see the normal donation card.
  - `pages/GuideDetail.jsx` → the "Want the full toolkit? £9.99" band becomes a member "You have full access" band for logged-in users.
  - Confirmed `CategoryPreview` + `PlatformPreview` locks are already gated to non-members in `Home.jsx` (lines 634/639).
- Verified in preview with a real member JWT: `/donate` shows the member card (no "Make a Donation"), guide page shows member CTA (no paywall). Non-members unaffected.


### Completed (1 Jul 2026 — PayPal register flow HARDENED: crash-safe + idempotent) [PENDING DEPLOY]
- **Root problem solved:** a PayPal payment could be *captured* (money moved) but the account-creation step could fail → "paid but no access". Rebuilt `register-donor` + `register-premium` around a durable ledger so a captured payment is NEVER silently lost.
- **New durable ledger** `db.paypal_payments` (keyed by unique `order_id`). Shared helper `_verify_and_capture(order_id, kind, expected_amount)`: (1) idempotency — if the order is already `fulfilled`, returns immediately WITHOUT re-capturing/re-granting; (2) captures server-side; (3) **records the capture (`_record_capture`) BEFORE any verification/fulfillment**; (4) verifies COMPLETED + GBP + exact amount + payer email — on any failure it flags the ledger row `needs_review` (money preserved) instead of discarding. Fulfillment (`_upsert_donor` + `_mark_intents_converted`, premium adds bundle token/email) is wrapped so a throw sets `fulfillment_failed` and returns a graceful "payment received, activating shortly" message rather than 500-and-lose-money. Premium replays are idempotent (reuse existing token, no duplicate `premium_purchases`).
- **Admin reconciliation:** `GET /api/admin/paypal-payments` (ledger + `needs_attention` = captured/needs_review/fulfillment_failed) and `POST /api/admin/paypal-payments/{order_id}/fulfill` (one-click grant from recorded payer email + mark fulfilled; issues premium bundle if missing). Surfaced in the DonorsCard as a red **"N payments captured on PayPal but not activated"** banner with a **"Grant & activate"** button per row.
- Tests: `backend/tests/test_paypal_hardening.py` 4/4 pass (reconcile, idempotent replay, order_id required, admin auth-gated). Verified in preview: ledger lists needs-attention, idempotent register returns "already active" without a PayPal call, reconcile grants access, UI banner renders.


### Completed (1 Jul 2026 — Admin "Paying Members / Donors" list + payment-registration investigation) [PENDING DEPLOY]
- **New Admin "Paying Members (Donors)" card** (`frontend/src/components/admin/DonorsCard.jsx`, added to AdminDashboard above SubscribersCard): lists everyone in the `users` collection (+ `expired_users`) — i.e. people who completed a £9.99/£14.99 PayPal payment, which is DISTINCT from the free-guide "Subscribers" (`resource_subscribers`). Shows counts (total/active/expired/premium), a filter, CSV export (`paying_members_YYYY-MM-DD.csv`), and a table (Email, Plan Basic/Premium, Status, Paid, Expires). Includes a **manual "Grant access" form** (email → 12-month access) for confirmed PayPal payers who weren't auto-registered.
- **Backend**: new `GET /api/admin/donors` (admin-auth) aggregates users+expired_users, flags Premium via `premium_purchases.distinct("email")`, computes live active/expired from `expires_at`. Also **restored the lost `@api_router.post("/auth/add-donor")` route decorator** — it had been dropped in an earlier edit so manual donor entry returned 404 on production. Verified in preview: donors GET returns list+counts; add-donor creates a 12-mo donor (200).
- **INVESTIGATION (user report: 12 June PayPal payments not on site).** Production data: `psteelmail@gmail.com` has NO `users`/`expired_users` record (get-verify-link → 404) but has a `donation_intent` (12 Jun, status `recovery_sent`, converted=null). PayPal shows 2 Completed payments on 12 Jun from "Paul Steel" (£9.99 + £14.99). Root-cause hypothesis: `register-donor` extracts the **payer email from PayPal's own response**, so the donor was most likely registered under the **PayPal-account email** (≠ the `psteelmail@gmail.com` typed into the recovery field) — which is why the intent never flipped to converted and get-verify-link can't find psteelmail. The new Donors list (once deployed) will reveal exactly which email holds the 12 Jun access. If truly missing, use the "Grant access" box. NOTE: if register-donor threw AFTER server-side capture (amount/currency check), money could be captured without a user — worth watching in Railway logs for real customers.
- **PRODUCTION TODO (user):** Save to Github → deploy. Then open Admin → Paying Members to see the real donor list; grant `psteelmail@gmail.com` access if it's genuinely missing.


### Completed (13 June 2026 — UK platform directory audit) [PENDING DEPLOY]
- **~100-word UK precis added for the 66 new UK platforms** (13 June): generated via Claude (claude-sonnet-4-6, British English, GBP, accurate UK caveats — HMRC/self-assessment, FCA-regulated, capital at risk), stored in `backend/uk_long_descriptions.py` (`LONG_DESCRIPTIONS`). `reconcile_uk_platforms` sets a `longDescription` field on each. Renders as an "About {name}" card on the platform detail page (`PlatformDetail.jsx`) and in the crawler SEO HTML + Product JSON-LD (`seo_routes.py`). Short `description` still shows on cards. NOTE: originals only ever had a ~12-word one-liner — no long precis existed before; only the 66 new ones have the 100-word version (user scope choice "a"). Tests: 4/4 in `tests/test_uk_audit.py`.
- **Removed non-UK platforms + duplicates, backfilled real UK platforms.** New module `backend/uk_audit.py` is the single source of truth: `NON_UK_REMOVE` (48 names: DoorDash, Lyft, Instacart, Shipt, Spark Driver/Walmart, Postmates, Grubhub, Wonolo, Roadie, Wag!, Handy, Thumbtack, GigSmart, Instawork, Gigwalk, Steady, Poshmark, Mercari, ThredUp, Ruby Lane, Walmart Marketplace, VIPKid, Tutor.com, Wyzant, Varsity Tutors, TakeLessons, Chegg Tutors, Acorns, Betterment, Wealthfront, M1 Finance, SoFi, Stash, Fundrise, Groundfloor, Yieldstreet, Public/Public.com, InboxDollars, Crowdtap, MyPoints, Forthright, Opinion Outpost, Justworks, Speakwrite, Zirtual, Lensa, CloudPeeps) + `UK_REPLACEMENTS` (66 hand-curated, genuinely UK-available: Deliveroo, Just Eat Couriers, Stuart, Gophr, Evri, Bolt, Addison Lee, Airtasker, Bidvine, BorrowMyDoggy, Appen, TELUS AI, Premise, Streetbees, Roamler, TopCashback, Quidco, JustPark, Airbnb, Spacer, MyTutor, Tutorful, Superprof, First Tutors, The Profs, Tutor House, Freetrade, Trading 212, InvestEngine, Nutmeg, Moneybox, Moneyfarm, Wealthify, Plum, Hargreaves Lansdown, interactive investor, Dodl, Wombat, Chip, CrowdProperty, Assetz Capital, Kuflink, Gumtree, Preloved, Vestiaire Collective, Music Magpie, Folksy, OnBuy, Shpock, PopulusLive, 20Cogs, OnePoll, Triaba, The OpinionPanel, Reed.co.uk, CV-Library, Totaljobs, Otta, Buy Me a Coffee, Fanvue, YunoJuno, Malt, Worksome, Bark, Codementor, Designhill).
- `reconcile_uk_platforms(db)` is **idempotent**: deletes non-UK, collapses dupes (keep lowest id), inserts missing UK platforms (by name), recomputes category counts.
- New admin endpoint `POST /api/admin/audit-uk-platforms` (auth-gated, mirrors `migrate-currency-gbp`). **Preview DB done: 199→203 platforms, 0 non-UK, 0 duplicates.**
- Tests: `backend/tests/test_uk_audit.py` 3/3 pass (idempotency, no non-UK/dupes, all UK replacements present).
- **PRODUCTION TODO (user):** Save to Github → deploy → call `POST /api/admin/audit-uk-platforms` once with the admin token (or it can be wired to an admin button later) to sync Atlas.

### RESOLVED (11 June 2026 — Email migrated SMTP → Postmark HTTPS API)
- **Root cause of email failure:** Railway blocks ALL outbound SMTP ports (confirmed: `TimeoutError` on 587 every time). Google SMTP/Gmail-API service-account path was also blocked by the org policy `iam.disableServiceAccountKeyCreation`. Replaced the transport with the **Postmark HTTPS API** (`api.postmarkapp.com/email`), which works on Railway (port 443).
- **`backend/email_service.py`:** removed all SMTP code (`smtplib`/`socket`/`contextlib`/`EmailMessage`, `_force_ipv4`, `_smtp_send`) and the abandoned Gmail-API code (`_gmail_*`); rewrote the single core `_send_email()` to POST to Postmark with `X-Postmark-Server-Token`, building `From/To/ReplyTo/Subject/HtmlBody/TextBody/MessageStream`, mapping `extra_headers`→`Headers` and `attachments`→base64 `Attachments`. **All 8 template functions are unchanged** (send_new_user/returning_user/premium_pack/expired/expiry_warning/resource/broadcast/abandoned_donation) — they all route through `_send_email`, so every HTML+text body + the resource attachment + List-Unsubscribe header are preserved.
- **`backend/server.py`:** replaced `/api/admin/smtp-diagnostics` with `/api/admin/email-diagnostics` (admin-only) — sends a Postmark validation request to `test@blackhole.postmarkapp.com` and returns the exact error (token invalid=10, sender not confirmed=300). Never returns the token.
- **Env vars:** new `POSTMARK_SERVER_TOKEN` (required), optional `POSTMARK_FROM` / `POSTMARK_MESSAGE_STREAM`. Old `SMTP_*`/`MAILGUN_*`/`GMAIL_*`/`GOOGLE_CLIENT_*` no longer used. requirements.txt unchanged (`requests` already present; no new package).
- **Docs:** updated `VERCEL_RAILWAY_DEPLOYMENT_GUIDE.md` env list; added `POSTMARK_EMAIL_SETUP.md`.
- Verified in preview: 20/20 premium-pack tests pass; payload build unit-checked (plain + attachment + headers); no-token path returns False gracefully. **VERIFIED LIVE (11 June 2026):** production `/api/admin/email-diagnostics` returns ok; real sends to external inbox succeed both WITH and WITHOUT attachments (`email_delivery: sent`). Initial failure was Postmark new-account "pending approval" restriction — cleared after user requested approval. Optional next: verify `incomeonline.info` domain (DKIM) in Postmark for best inbox placement.


- Root cause chain fully diagnosed & fixed: (1) Apple Pay `ELIGIBLE_PAYMENT_METHOD_ERROR` → render only `fundingSource=PAYPAL`; (2) client-side `actions.order.create()` returned `403 NOT_AUTHORIZED` → migrated order create+capture **server-side** (`POST /api/paypal/create-order` + capture in register endpoints); (3) Railway `invalid_client` → backend PayPal **Live** credentials were wrong; user set correct Live `PAYPAL_CLIENT_ID`/`SECRET` (verified valid: created real GBP orders HTTP 200/201); (4) frontend `REACT_APP_PAYPAL_CLIENT_ID` was a DIFFERENT old id (`BAAb5Jv…`) on the live Vercel project `psteel77incomeonline2` → updated to matching `AUoxiOE…` + redeployed. Verified live: SDK now loads `client-id=AUoxiOE…`, backend create-order returns 200. **Awaiting user's final real-payment confirmation.**
- Diagnostics added: `_paypal_token_with_error()` surfaces real PayPal auth errors; `create-order` returns PayPal's actual error text (no secret leak); both buttons show backend error detail on createOrder failure.
- Key infra facts captured: Live PayPal Client ID `AUoxiOE…` must be IDENTICAL on Vercel (`REACT_APP_PAYPAL_CLIENT_ID`) and Railway (`PAYPAL_CLIENT_ID`); live Vercel project = `psteel77incomeonline2` (owns www.incomeonline.info); Railway backend = incomeonline-production.up.railway.app.

### Completed (10 June 2026 — Railway build fix + PayPal server-side order flow) [DEPLOYED]
- **Fixed Railway build failure**: `backend/requirements.txt` had `emergentintegrations==0.2.0` (private pkg, not on PyPI) → pip `No matching distribution`. Pinned the direct wheel URL `emergentintegrations @ https://d33sy5i8bnduwe.cloudfront.net/simple/emergentintegrations/emergentintegrations-0.2.0-py3-none-any.whl`. Also removed the `#sha256=...` fragment from the `litellm` line so it matches the URL `emergentintegrations` itself requires (otherwise pip hits a second `ResolutionImpossible` from two conflicting direct litellm URLs). Verified `pip install -r requirements.txt` resolves cleanly.
- **Fixed the REAL PayPal checkout error** (the Apple Pay fix only unmasked it): live console showed `/v2/checkout/orders 403 NOT_AUTHORIZED — "Authorization failed due to insufficient permissions"` at **client-side** `actions.order.create()`. PayPal also warned client-side actions are deprecated. Fix = migrate order **create + capture to the server** (the backend already had working `client_id`+`secret` OAuth via `_get_paypal_access_token`):
  - New `_create_paypal_order()`, `_capture_paypal_order()` helpers + `POST /api/paypal/create-order` (`{kind:'donation'|'premium'}` → returns `{id}`) in `server.py`.
  - `register-donor` / `register-premium` now `_capture_paypal_order(order_id)` (capture server-side) instead of expecting a client-captured COMPLETED order; same amount/currency/payer verification afterwards.
  - `PayPalDonateButton.jsx` / `PayPalPremiumButton.jsx`: `createOrder` now calls `POST /api/paypal/create-order`; `onApprove` drops `actions.order.capture()` and just posts `order_id`. Also render only `fundingSource={FUNDING.PAYPAL}` + `components:'buttons'`, removed `enable-funding:'card'` (its eligibility probe also errored). Card still works as guest inside PayPal's popup.
- Verified: 35/35 PayPal pytest pass; preview `create-order` returns 502 (no creds — expected) reaching the OAuth helper correctly; both services compile. **NEEDS DEPLOY + live retest by user** (preview has no PAYPAL_CLIENT_ID).


- **Fixed live "PayPal encountered an error"** on both the £14.99 Premium and £9.99 donation buttons. Root cause (from browser console): PayPal SDK marked Apple Pay eligible and the `GetApplepayConfig` GraphQL call failed with `ELIGIBLE_PAYMENT_METHOD_ERROR` (domain not registered for Apple Pay; user on Firefox) → bubbled to `onError`. Fix: added `'disable-funding': 'venmo,applepay'` + `'enable-funding': 'card'` to `PayPalScriptProvider` in `PayPalPremiumButton.jsx` and `PayPalDonateButton.jsx`. NOT a currency/account issue. **Needs deploy + live retest (preview has no PAYPAL_CLIENT_ID).**
- **Email-capture box at bottom of every Wealth Generator Guide** (`frontend/src/components/guides/GuideLeadCapture.jsx`, in `GuideDetail.jsx` after tags / before toolkit CTA): "Get our 10 free MoneyRules guides" → `POST /api/leads/capture` `source: 'guide'`, upserts into `resource_subscribers`. Added friendly label "Wealth Generator Guide" to `GET /api/leads/by-source`. Tested end-to-end in preview (renders, submits, lead stored, surfaces in Lead Sources card; test record cleaned).
- **Fixed CMS test pollution (P0)**: restored polluted preview hero ("TEST BADGE"/"X/Y") to correct UK copy; `test_iteration3.py` now self-restores CMS state in `finally` blocks (16/16 pass, DB clean after run).


### Completed (June 2026 — UK headline + one-click currency migration) [PENDING DEPLOY]
- Hero headline now UK-branded: "Discover the Best UK Ways to / Make Money Online" (HeroSection.jsx defaults + seed_content.py + live DB).
- hreflang en-gb + x-default added site-wide (index.html, useSEO hook, seo_routes renders) + og:locale en_GB; UK-targeted homepage title/description.
- Added a one-click **"Convert to £" button** in the admin Premium Pack Purchases card (calls POST /api/admin/migrate-currency-gbp) so the non-technical owner can convert live Atlas platform earnings $→£ after deploy without any API/command. Idempotent.

### Completed (June 2026 — Wealth Generator Guides (blog) for SEO/organic traffic) [PENDING DEPLOY]
- New **blog/articles system** at `/guides` ("Wealth Generator Guides") to win UK organic search & build linkable content.
- **Backend** (`guides_routes.py`, `guides_seed.py`): Markdown-based `guides` collection; public list/detail; admin CRUD (`POST/PUT/DELETE`), `PATCH /{id}/status` (publish toggle that never blanks content), `GET /admin/get/{id}` (full draft for editor), and **AI draft** `POST /generate-draft` using emergentintegrations **claude-sonnet-4-6** (British English, £, UK context). 3 UK starter articles seeded idempotently on startup (ISA vs SIPP, 11 Side Hustles, Freelancing in the UK).
- **SEO** (`seo_routes.py`): crawler-rendered `/api/seo/render/guides` + `/render/guide/{slug}` (BlogPosting JSON-LD, lang en-GB, hreflang) and `/api/seo/guides-sitemap.xml`. Added `guides-sitemap.xml` to the sitemap index + Vercel bot rewrites for `/guides` & `/guides/:slug`.
- **Frontend**: `Guides.jsx` (listing + category filter), `GuideDetail.jsx` (react-markdown article + useSEO BlogPosting), `GuidesManager.jsx` admin card (list/editor/AI button/publish toggle/delete). "Guides" added to desktop+mobile nav. Routes in App.js.
- **Deps**: emergentintegrations, python `markdown`, `react-markdown`, `remark-gfm`. `EMERGENT_LLM_KEY` added to backend/.env.
- **Tested**: 89/89 pytest (test_guides.py 12) + testing agent iteration_8 = 100% backend & frontend (incl. AI draft, draft privacy, publish-toggle content preservation), zero bugs.

## What's Been Implemented

### Completed (June 2026 — UK repositioning: USD → GBP + UK SEO) [PENDING DEPLOY]
- **Market decision**: Site repositioned **UK-first** (content is UK-specific: ISA/SIPP/HMRC/Section 24). Prices kept at parity: **£9.99 basic** (199+ platform access) / **£14.99 Premium** (superset: access + Wealth Generator bundle).
- **Currency sweep ($ → £, USD → GBP)** across: PayPal SDK buttons + server-side order verification (now requires `currency == "GBP"`), all emails, SEO Product schema (`priceCurrency: GBP`), admin cards (RecoveryStats, PremiumPurchases, conversion tile — incl. £ icon swap to lucide `PoundSterling`), DonationSection, PremiumPackSection, PlatformPreview, PlatformDetail, SuccessStoryDetail, AdminDashboard form defaults, CMS content (`cta_secondary`), `seed_data.py` (337 platform earnings/payout fields), `success_stories_data.py` (133 figures). Internal Python constants keep `_USD` names but hold GBP values (documented).
- **Left as factual $ (intentional)**: third-party amounts inside platform *descriptions* (e.g. "$80 million paid", "$5 signup bonus", "$10/hour" for US-paying platforms) — converting would misstate facts. Only structured earnings/payout columns + our pricing were converted.
- **UK SEO geo signals**: `index.html` → `lang="en-GB"`, `og:locale=en_GB`, `geo.region=GB`, `geo.placename=United Kingdom`; `useSEO` hook sets `og:locale=en_GB`; server-rendered SEO routes (`seo_routes.py`) → `lang="en-GB"` + `priceCurrency=GBP`.
- **Americanisms**: checked — none in user-facing copy (only JS `behavior:` API + UK-valid "fulfilling"; left untouched).
- **Production data migration**: added admin-only `POST /api/admin/migrate-currency-gbp` (idempotent) to convert live Atlas platform `earningsPotential`/`minPayout` $→£ with one authenticated call after deploy. Also `migrate_currency_gbp.py` script. Preview DB already migrated (199 platforms in £).
- **Tests**: full suite **78/78 pass** (fixed admin-gating breakages, removed obsolete `.docx`-era tests, added `test_gbp_currency_sweep.py` — 15 tests). Testing agent iteration_7 = 100% backend + frontend, zero bugs.

### Completed (June 2026 — Premium Pack $14.99→£14.99 + admin cards) [PENDING DEPLOY]
- See iteration_6: £14.99 "Wealth Generator" superset, server-verified `register-premium`, admin Premium Purchases card + Basic→Premium conversion tile, security hardening (premium buyer list + subscribers list now admin-only).


### Completed (June 2026 — Premium Pack reworked to $14.99 "Wealth Generator" superset) [PENDING DEPLOY]
- **Pricing model change**: Premium Pack is now **$14.99** and is a SUPERSET of the $9.99 basic platform-access plan. Buying Premium grants the same **12-month platform access** PLUS the Wealth Generator bundle. The $9.99 basic plan (platform access only) is unchanged.
- **New bundle (`MoneyRules_Premium_Pack.zip`, 21 files, ~474KB)**: welcome letter + **10 free MoneyRules PDF guides** + **4 premium Strategy PDFs** (A1 Investor's Starter Kit, A2 Buy-to-Let Profit, A3 Tax-Efficiency Masterclass, A4 12-Month Money Makeover) + **6 interactive Excel calculators** (`openpyxl` live charts: Investment Growth, Budget 50/30/20, Debt Payoff, Net Worth, FIRE, Mortgage). Generated by `generate_premium_pack.py`; PDFs built by `build_guide_pdfs.py` (LibreOffice + Montserrat). LibreOffice was (re)installed in this forked container.
- **Secure server-verified purchase flow** (`server.py` `POST /api/paypal/register-premium`): re-fetches the PayPal order, verifies `status=COMPLETED` + amount `14.99 USD` + payer email, then `_upsert_donor()` (grants 12-mo access) + inserts a one-time `premium_purchases` token + sends `send_premium_pack_email()` with the download link. Browser cannot fake a purchase.
- **Frontend**: `PayPalPremiumButton.jsx` (new — PayPal SDK button, $14.99, calls register-premium, auto-downloads ZIP on success). `PremiumPackSection.jsx` reworked → "Wealth Generator Pack", $14.99, new contents, inline SDK button (replaces the old unverified NCP "I've paid" trust flow). `DonationSection.jsx` got a Premium upsell pointer (`data-testid=premium-upsell-link` → `#premium-pack`).
- **Security hardening** (flagged by testing agent): REMOVED the old public `POST /api/pdf/premium-pack/purchase` token-issuer (it let anyone download the paid ZIP for free). Tokens are now issued ONLY by the PayPal-verified flow. `GET /api/pdf/premium-pack/purchases` is now admin-auth protected (`Depends(get_admin_user)`).
- **Tested**: `backend/tests/test_premium_pack_flow.py` 20/20 pass; testing agent iteration_6 = 100% backend + frontend, zero bugs. **Needs "Save to Github" to deploy.**
- **Env note (production)**: `BACKEND_PUBLIC_URL` (new, optional) — used to build the absolute download link in the delivery email; defaults to the Railway host so prod works without setting it. Preview .env sets it to the preview domain. No new PayPal setup needed — the $14.99 SDK button reuses `REACT_APP_PAYPAL_CLIENT_ID`.


### Completed (June 2026 — 3 backlog tasks: lead-source stats, email personalization, recovery subject A/B) [PENDING DEPLOY]
- **Leads-by-source admin card** (`frontend/src/components/admin/LeadSourcesCard.jsx`, added to AdminDashboard above Donation Recovery): bar-chart breakdown of captured leads by acquisition surface — `hero_pill`, `success_story`, `free-guide` — with per-source totals + newsletter opt-in counts. Backend `GET /api/leads/by-source` (admin-auth) aggregates `resource_subscribers.lead_sources` (unwind/group) plus free-guide downloaders (identified by `resources_downloaded`). Verified: counts correct, 401 without token.
- **Email personalization tokens** (`email_service.py`): added `_friendly_name()`/`_greeting()` that derive a first name from the email local-part (paul-steel→"Paul", john.doe→"John") with safe "Hi there," fallback for generic/numeric/short local-parts. Injected a personalized greeting line into the **new-user Welcome** and **abandoned-donation Recovery** emails (HTML + plain-text). Verified by rendering both templates.
- **Recovery subject-line A/B test** (`email_service.py` + `server.py`): `RECOVERY_SUBJECT_VARIANTS` (A/B) + `pick_recovery_subject(email)` deterministically (evenly) buckets each recipient by email hash. `_scan_and_recover` records `recovery_subject_variant` on the intent; `GET /api/paypal/recovery-stats` now returns a `subject_ab_test` array (per-variant emailed / converted / conversion_rate / revenue). Surfaced in `RecoveryStatsCard.jsx` as a 2-up comparison. Verified aggregation with seeded data (A=50%, B=100%). **Needs "Save to Github" to deploy.**

### Completed (June 2026 — full transactional email redesign) [PENDING DEPLOY]
- Built shared premium-email helpers in `email_service.py` (`_premium_email` shell, `_cta_button`/`_cta_block` bulletproof VML button, `_features_block` colour-coded badges, `_callout_band`).
- Refactored ALL transactional emails to the consistent layered style (hero band → brand accent stripe → structured body → dark footer; gridline-free with mso resets; clickable in Outlook): **new-user welcome, returning-user magic link, expired, 7-day expiry warning, free-guide resource email, admin broadcast** — plus the previously-redesigned abandoned-donation recovery email. Removed the old flat file-templates' usage (gradient-clip headlines that rendered invisible/scammy).
- Verified by rendering all + sending live samples to paul-steel@outlook.com (all SMTP SUCCESS). Lint clean. **Needs "Save to Github" to deploy.**
- Note: `load_email_template` + `email_templates/*.html` are now unused (left on disk, harmless).

### Completed (June 2026 — abandoned-donation email redesign) [PENDING DEPLOY]
- **Fixed the abandoned-donation recovery email** (`email_service.py send_abandoned_donation_email`): the old version used a gradient-clipped headline (`color:transparent`, invisible in Gmail/Outlook) and a CSS `linear-gradient` button background (dropped by Gmail/Outlook → button looked like unclickable plain text). User reported "nowhere to click + cheap/scammy".
- Rebuilt as a professional, email-client-safe template: table-based layout, web-safe fonts, solid brand-purple header w/ logo, a **bulletproof button** (`bgcolor` on td so it renders in Outlook), plain-text fallback link, PayPal trust cue, clean footer → `www.incomeonline.info`. Updated the plain-text alternative too.
- Verified by rendering the HTML (screenshot) + sent a live test to paul-steel@outlook.com via Google SMTP (SUCCESS). **Needs "Save to Github" to deploy.**
- NOTE: this is the *recovery* email, distinct from the "Returning User" magic-link email (`template_2_returning_user.html`).

### Completed (June 2026 — story-page email lead magnet) [PENDING DEPLOY]
- Added an inline email-capture card (`frontend/src/components/story/StoryLeadCapture.jsx`) to every success-story page (`SuccessStoryDetail.jsx`) — "Get the free guide that helps earners like this". Submits to the existing `POST /api/leads/capture` with `source: 'success_story'`, upserting into `resource_subscribers` (newsletter_opt_in, surfaced in admin Subscribers card + broadcastable). Shows a success state; prefills/persists email via localStorage.
- Tested: UI renders, submit → success state, lead persisted with `lead_sources:['success_story']` (verified in Mongo, test record cleaned). Lint clean. **Needs "Save to Github" to deploy.**

### Completed (June 2026 — individual Success Story SEO landing pages) [DEPLOYED & LIVE]
- **All 60 success stories are now deep-linkable SEO pages** at `/success-stories/{slug}` (e.g. `sarah-m-upwork`). Moved the 60 stories from the hardcoded React array into a single backend source of truth `backend/success_stories_data.py` (slug = slugify(name-platform), collision-safe; `get_all/get_by_slug/get_related`).
- Backend (`seo_routes.py`): `GET /api/seo/success-stories` (list), `/success-story/{slug}` (single + related), `/render/success-story/{slug}` (crawler HTML w/ Article JSON-LD + breadcrumb + internal links, 404+noindex for unknown), `/success-stories-sitemap.xml` (60 URLs), and `/render/success-stories` now lists all 60 linking to each page.
- Frontend: new `SuccessStoryDetail.jsx` (route `/success-stories/:slug`, useSEO Article schema, related grid, CTA); `SuccessStories.jsx` refactored to fetch from API with "Read full story" links; removed the 900-line hardcoded array. `vercel.json` adds bot rewrites for `/success-stories/:slug` + `/success-stories-sitemap.xml`; static `sitemap.xml` index references the new stories sitemap.
- **Tested (iteration_5): 13/13 backend + 8/8 frontend E2E pass, zero issues** (`backend/tests/test_success_stories_seo.py`). **Needs "Save to Github" to deploy.**

### Completed (June 2026 — SEO bot-render extended + related platforms) [PENDING DEPLOY]
- **Extended dynamic-rendering to homepage, /donate, /success-stories** (`backend/seo_routes.py`): new crawler-facing endpoints `GET /api/seo/render/home` (platforms grouped by category w/ internal links + WebSite JSON-LD), `/render/donate` (Product+Offer $9.99 schema), `/render/success-stories` (16 curated source-cited summaries + CollectionPage schema). `frontend/vercel.json` adds bot-UA rewrites for `/`, `/donate`, `/success-stories` (humans still get the React SPA).
- **Related platforms (category-aware)**: new `GET /api/seo/related-platforms/{slug}?limit=6` (same-category first, then fill). `PlatformDetail.jsx` renders a "Related platforms in {category}" card grid before the CTA (internal links → crawl depth + longer sessions). Platform bot HTML now also links same-category platforms first via shared `_pick_related()`.
- Tested locally (seeded 5 temp platforms in preview Mongo to verify grouping/related, then removed). Lint clean. **Needs "Save to Github" to deploy.**

### Completed (June 2026 — SEO DEPLOYED & VERIFIED LIVE)
- **Deployed to production** (user clicked "Save to Github"): bot-renderer + vercel.json dot-exclusion are now LIVE.
- Verified on `https://www.incomeonline.info`:
  - `GET /platforms/upwork` with Googlebot UA → returns unique server-rendered HTML (title "Upwork Review — Freelancing | Earn Money Online | Income Online"). ✅
  - `/google15cd92b16f0de7bf.html` now serves correct plain text `google-site-verification: google15cd92b16f0de7bf.html` (was previously serving the SPA shell due to a stale Vercel edge-cache on the bare path; cleared after deploy). ✅
  - `/sitemap.xml` (index) + `/platforms-sitemap.xml` (185 URLs) → HTTP 200. ✅
- **GSC path resolved**: user must use the **URL-prefix** property `https://www.incomeonline.info/` with the **HTML file** method → VERIFY (now passes). Then submit `sitemap.xml`. The "Domain"/DNS method was the wrong path (avoids Wix DNS).
- **Pending user action**: click VERIFY in GSC + submit sitemap; optionally submit same sitemap in Bing.

### Completed (3 Jun 2026 — SEO: crawler-facing server rendering)
- **Problem:** Site is a client-rendered React SPA → crawlers that don't run JS (Bing, Google's first pass) saw an empty shell for all 185 platform pages; every page also shared the homepage's generic `<title>`.
- **Rejected approach:** Build-time prerendering (react-snap) — fails on React 19/Node 20, and the Vercel↔Railway cross-origin (CORS) split risked shipping `noindex` "Platform not found" pages. Removed it entirely (no build risk).
- **Implemented (robust, build-safe):** **Dynamic rendering.** New backend endpoint `GET /api/seo/render/platform/{slug}` (in `seo_routes.py`) returns full server-rendered HTML from the DB — unique title, meta description, canonical, OG/Twitter, JSON-LD Product schema, and readable content + internal links. `frontend/vercel.json` rewrites **only search-engine bot user-agents** for `/platforms/:slug` to that endpoint; humans still get the React SPA at the same URL.
- Tested: render endpoint returns correct unique HTML per platform (title/meta/JSON-LD/content), 404+noindex for unknown slugs, lint clean, frontend build verified.
- **Needs user:** Save to Github (deploys backend endpoint + vercel.json), then submit sitemap in Google Search Console + Bing Webmaster Tools.
- Per-page meta for humans/Google already existed via `useSEO` hook (client-side). `BingSiteAuth.xml` already present (Bing verification done).

### Completed (3 Jun 2026 — recovery stats card)
- **Admin "Donation Recovery" stats card** (`frontend/src/components/admin/RecoveryStatsCard.jsx`): shows Pending, Emails Sent, Rescued (converted-after-recovery), **Revenue Rescued ($)**, recovery conversion rate, live scheduler status, and a **"Run recovery now"** button (manual trigger).
- Backend: `GET /api/paypal/recovery-stats` (admin-auth) aggregates the `donation_intents` funnel; revenue rescued = converted-after-recovery × $9.99.
- Tested: endpoint counts + revenue calc verified (1 rescued = $9.99, 50% recovery conversion), 401 without auth, card renders in dashboard.

### Completed (3 Jun 2026 — automated donation recovery)
- **Hourly abandoned-donation recovery now runs automatically** via an in-process APScheduler (`server.py`), no external cron needed (works inside the Railway web process). Refactored the scan into a shared `_scan_and_recover()` used by both the scheduler and the admin `POST /api/paypal/run-recovery` endpoint.
- Config via env (defaults sensible): `RECOVERY_SCHEDULER_ENABLED=true`, `RECOVERY_INTERVAL_HOURS=1`, `RECOVERY_DELAY_HOURS=2`, `RECOVERY_MAX_EMAILS=50`. Idempotent (each intent gets one email, marked `recovery_sent`). Added `apscheduler==3.11.2`.
- Tested: scheduler boots (`[recovery-cron] started`), and a manual run sent real recovery emails via Google SMTP + flipped intents to `recovery_sent`.
- **Multi-replica note:** if backend ever scaled >1 instance, disable the scheduler on extras to avoid duplicate sends.

### Completed (3 Jun 2026 — subscriber broadcast)
- **Admin "Broadcast to Subscribers" card** (`frontend/src/components/admin/BroadcastCard.jsx`, shown in AdminDashboard): subject + message → confirm dialog → sends a branded one-time email to all opted-in `resource_subscribers` (free-guide subscribers + hero-pill leads) via Google SMTP, paced for Gmail limits, with auto unsubscribe footer + List-Unsubscribe header.
- Backend (`cms_routes.py`): `GET /api/cms/broadcast` (recipient count + last broadcast) and `POST /api/cms/broadcast` (admin-auth, queues background send, logs to `broadcasts` collection). Email template: `email_service.send_broadcast_email()` / `build_broadcast_content()`.
- Tested: auth (401)/validation (400), recipient count, and a real branded broadcast email delivered via Google SMTP. Card renders with live recipient count.
- **Production note:** needs "Save to Github" to deploy (no new env vars — reuses the SMTP config already on Railway).

### Completed (3 Jun 2026 — email delivery FIXED)
- **Migrated email delivery from Resend → Google Workspace SMTP** (`backend/email_service.py` `_send_email()` via smtplib, `smtp.gmail.com:587` STARTTLS + App Password). This resolves the long-standing P0 blocker: the Wix registrar refuses subdomain MX records, which both Mailgun and Resend required for verification. Google SMTP needs **zero DNS changes** because `incomeonline.info` already has Google MX + SPF (`include:_spf.google.com`) + DKIM, so mail passes SPF/DKIM/DMARC automatically.
- Sender: `welcome@incomeonline.info`. All existing templates (new-user, returning-user, expired, expiry-warning, resource attachment, abandoned-donation) preserved — only the transport swapped.
- **Verified working**: live test email delivered to `paul-steel@outlook.com` from preview (user confirmed receipt).
- **Production TODO (user action):** add SMTP_* env vars to Railway + "Save to Github" to deploy. Old RESEND_* vars now unused.

### Completed (2 Jun 2026)
- **Hero "Free Guides" pill is now CMS-editable (Item 4)**: New `hero` CMS fields `pill_enabled` (show/hide), `pill_label`, `pill_target` (dropdown: Free Guides Library `free-resources` / Donation `support` / How It Works `how-it-works`), and `pill_capture_email`. Admin Dashboard → Hero Section has a dedicated "Free Guides Pill" control block. `HeroSection.jsx` reads these with safe fallbacks (pill defaults ON, label "Free MoneyRules Guides", target `free-resources`).
- **Hero pill email lead-capture (Item 6)**: When `pill_capture_email` is ON, clicking the pill opens `HeroLeadDialog.jsx` asking for an (optional) email before scrolling. Submit → `POST /api/leads/capture` (upserts into `resource_subscribers` with `newsletter_opt_in=true` + `lead_sources:['hero_pill']`, surfaced in the existing admin Subscribers card) → then scrolls to target. "Skip to guides" scrolls without capturing. When OFF, the pill scrolls directly (original behaviour).
- **Mobile donation→unlock smoke test (Item 5)**: Verified at 390×844 — hero + `#support` donation section have no horizontal overflow/squeezing; `$9.99` price pill and Secure Payment card stay within viewport (12px symmetric margin). NOTE: a real PayPal **sandbox payment** could not be run in preview because `REACT_APP_PAYPAL_CLIENT_ID` is intentionally unset there (button shows "not configured" fallback) — needs user's sandbox client ID to test the live purchase path.
- **`/admin` now redirects to `/admin/login`** (was an unmatched route).
- Tested via testing agent: 7/7 backend + 9/9 frontend E2E scenarios pass. Test file: `/app/backend/tests/test_iteration4_hero_pill.py`.

### Completed (29 May 2026 — previous session, third half)
- **Pricing bug fixed**: Platform-access donation was incorrectly coded as `$12.99` (which is actually the separate Premium Pack price). Now correctly **$9.99** for platform access. Updated `EXPECTED_DONATION_USD` in `server.py`, `DONATION_AMOUNT` in `PayPalDonateButton.jsx`, and the abandoned-donation email copy. The 14 other `$12.99` references in code (Premium Pack section, resource email upsells, admin CMS) are correctly tagged and unchanged.
- **Removed dead `/api/paypal/ipn` endpoint** (`backend/server.py`) — superseded by the new PayPal SDK flow. Now returns 404.
- **Abandoned-donation recovery system** (smart conversion lift, ~8–15% recovery typical):
  - New `db.donation_intents` MongoDB collection — stores `{email, created_at, last_seen_at, status, recovery_sent_at, converted_at}`.
  - `POST /api/paypal/intent` (public) — captures email when visitor opens the PayPal popup.
  - `GET /api/paypal/intents` (admin-only) — lists recent intents for visibility.
  - `POST /api/paypal/run-recovery?delay_hours=2&max_emails=50` (admin-only) — finds intents older than X hours that haven't converted, sends recovery email, marks `recovery_sent`. Idempotent.
  - New email template `send_abandoned_donation_email()` in `email_service.py` — branded "Your access is one click away" with a one-click resume link.
  - Frontend `PayPalDonateButton.jsx`:
    - New optional email input field above the PayPal button ("we'll save your place if you don't finish").
    - PayPal `onClick` callback fires `captureIntent()` so the moment a visitor opens the PayPal popup their email is stored as a pending intent.
    - On-mount URL-hash parser — if the donor arrives from a recovery email link (`#support?resume=foo@bar.com`), the field is pre-filled.
  - `/api/paypal/register-donor` automatically marks matching intents as `converted` on success — guarantees a completed donor never receives a recovery email.

### Completed (28 May 2026)
- **Success Stories mobile polish**: Fixed character-by-character header wrap (`Back` button + truncated `Success Stories` title); Earnings/Timeline cards now stack on mobile so long strings like `$8,000-$12,000/month` don't clip (`pages/SuccessStories.jsx`).
- **PayPal flow migrated from Hosted Buttons to JS SDK** (`components/PayPalDonateButton.jsx`, `DonationSection.jsx`, `Donate.jsx`, `package.json` → adds `@paypal/react-paypal-js@9.x`). Hosted buttons gave no `onApprove` callback so donors were never registered (root cause of the original "Returning User: email not found" bug).
- **Server-side PayPal order verification** (`backend/server.py` → new endpoint `POST /api/paypal/register-donor`). Frontend `onApprove` now sends only `order_id`; backend re-fetches the order from PayPal REST API, verifies `status=COMPLETED` + amount `9.99 USD`, extracts payer email from PayPal's response, then creates / renews user. **Browser cannot fake a donation.**
- **`POST /api/auth/add-donor` locked down**: was unauthenticated (anyone could POST an email and get 12 months of access). Now requires admin Bearer token via `Depends(get_admin_user)`. Kept available for manual donor entry by admins.
- **Email service migrated from Mailgun → Resend** (`backend/email_service.py`, adds `resend==2.19.0` to `requirements.txt`). Mailgun account was inaccessible (lost 2FA). Resend account is paul-steel's; uses test-mode `onboarding@resend.dev` until a custom domain is verified.
- **Break-glass admin verify-link endpoint** (`backend/cms_routes.py` → `POST /api/cms/get-verify-link`). Admin-only. Rotates user's `verification_token` and returns the full `/verify?token=...` URL — lets us unblock users when email delivery is down.
- **`paul-steel@outlook.com` registered as donor** in production MongoDB Atlas (1-year subscription).
- **User successfully logged into live site** using break-glass verify URL.

### Completed (27 May 2026)
- **Workspace restored**: Boilerplate workspace was missing IncomeOnline code. Re-cloned `psteel77/IncomeOnline` (main, `b27d94c`) into `/app`, preserved this container's `.env` files, added local `JWT_SECRET_KEY` + `FRONTEND_URL` to backend `.env` so backend boots.
- **Hero: removed "Scroll to explore" indicator** (`components/home/HeroSection.jsx`) — deleted the bouncing scroll-mouse glyph + label at the bottom of the hero.
- **Hero: added "Free MoneyRules Guides" pill** (`components/home/HeroSection.jsx`) — new amber/orange CTA below the "199+ Verified Earning Platforms" badge; click scrolls to existing `#free-resources` section. Used canonical brand spelling "MoneyRules" (user's "MonsyRules" assumed typo).
- **Donation section mobile overflow fixed** (`components/home/DonationSection.jsx`) — reduced nested mobile padding (section/card/inner cards) and added `max-w-full overflow-hidden` + iframe width caps in the PayPal style block. Verified `scrollWidth == clientWidth == 390` at every scroll position on 390×844 viewport.
- **Success Stories card overlap fixed** (`pages/SuccessStories.jsx`) — header flex now uses `gap-3 min-w-0 flex-1` on the title block and `flex-shrink-0 whitespace-nowrap` on the Verified badge; long names no longer crash into the badge. Before/After grid stacks on mobile (`grid-cols-1 sm:grid-cols-2`) with `break-words`.

## Required Railway env vars (production backend)
- `MONGO_URL`, `DB_NAME` — MongoDB Atlas connection
- `JWT_SECRET_KEY` — for admin JWT signing
- `FRONTEND_URL=https://www.incomeonline.info` — used in email links
- `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH` — admin login (fallback `admin` / `Gulluk*9` is hardcoded in `cms_routes.py:21`)
- `RESEND_API_KEY` — Resend transactional email
- `RESEND_FROM_EMAIL` — sender address; currently `onboarding@resend.dev` (test mode); change to `Income Online <noreply@<verified-domain>>` once a domain is verified
- `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` — for server-side order verification (live credentials)
- Optional: `PAYPAL_API_BASE=https://api-m.sandbox.paypal.com` to use sandbox

## Open backlog / next steps
1. **🔴 Verify a Resend custom domain** (e.g. `mg.incomeonline.info`) — without it, real donors don't receive welcome emails. DNS work needed at user's registrar + Resend dashboard.
2. **🟡 End-to-end PayPal donation test** — either sandbox flow or live $12.99 + self-refund — to confirm `onApprove → /api/paypal/register-donor → _upsert_donor` chain works on real PayPal data.
3. **🟢 Delete leftover `MAILGUN_DOMAIN` env var** from Railway (unused now).
4. **🟢 Consider deleting unused `/api/paypal/ipn` endpoint** — IPN was the old broken pipeline; the new PayPal SDK flow doesn't need it. Keeping it is harmless but dead code.



### Completed (Feb 2026)
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
