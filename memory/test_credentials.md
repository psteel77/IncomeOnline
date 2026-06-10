# Test credentials — IncomeOnline

## Admin (CMS, break-glass endpoints)
- **Backend admin login** (`POST /api/cms/login`)
  - Username: `admin`
  - Password: `Gulluk*9`
  - This works regardless of `ADMIN_PASSWORD_HASH` env var (hardcoded fallback in `backend/cms_routes.py:21`).
  - Production backend: `https://incomeonline-production.up.railway.app`
- **Frontend admin dashboard** (`/admin` on the live site)
  - Same credentials as above.

## Member account (paywall test user)
- **Email:** `paul-steel@outlook.com`
- **MongoDB collection:** `users`
- **Subscription expires:** 2027-05-27 (12 months from registration)
- **How they logged in:** Used the break-glass `POST /api/cms/get-verify-link` endpoint to obtain a one-time `verify?token=...` URL.

## Break-glass URL generator (when email delivery is broken)
```bash
BACKEND="https://incomeonline-production.up.railway.app"
TOKEN=$(curl -s -X POST "$BACKEND/api/cms/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Gulluk*9"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")

curl -s -X POST "$BACKEND/api/cms/get-verify-link" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"<recipient-email>"}'
```
Response includes `verify_url` — paste it into a browser to log in as that user.

## Preview environment (this container)
- **Backend:** `https://income-uk-checkout.preview.emergentagent.com/api`
- **MongoDB:** local in-container Mongo, mostly empty test data.
- Admin credentials in preview are the same (`admin` / `Gulluk*9`).

## Email delivery — Google Workspace SMTP (NEW, replaces Resend)
- Email now sends via **Google Workspace SMTP** (`smtp.gmail.com:587`, STARTTLS) using a Google **App Password** — NOT Resend/Mailgun. This was the fix for the Wix "no subdomain MX" blocker (Google SMTP needs zero DNS changes because the domain already has Google MX + SPF + DKIM).
- Env vars (set in `/app/backend/.env` for preview AND must be set on Railway for prod):
  - `SMTP_HOST=smtp.gmail.com`
  - `SMTP_PORT=587`
  - `SMTP_USERNAME=welcome@incomeonline.info`
  - `SMTP_PASSWORD=tkvazezdlhqauqnt` (16-char Google App Password, spaces removed)
  - `SMTP_FROM=Income Online <welcome@incomeonline.info>`
- Verified working: a live test email sent from preview was received in `paul-steel@outlook.com` (2026-06-03).
- Code: `backend/email_service.py` → `_send_email()` (smtplib). All template functions unchanged.

## Notes
- The PayPal flow on preview will show a "PayPal is not configured" fallback because `REACT_APP_PAYPAL_CLIENT_ID` is intentionally not set in this preview's `.env`. On production, the real PayPal SDK button renders.
- Old Resend vars (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`) are no longer used and can be deleted from Railway.
