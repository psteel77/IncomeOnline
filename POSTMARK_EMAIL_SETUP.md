# Postmark Email Setup (IncomeOnline)

Email is sent via the **Postmark HTTPS API** (`https://api.postmarkapp.com/email`).
Railway blocks outbound SMTP, so the previous Gmail/SMTP transport was replaced
with Postmark, which sends over HTTPS (port 443) and works on Railway.

All email goes through one function: `_send_email()` in `backend/email_service.py`.
Every template function (`send_new_user_email`, `send_returning_user_email`,
`send_premium_pack_email`, `send_expired_email`, `send_expiry_warning_email`,
`send_resource_email`, `send_broadcast_email`, `send_abandoned_donation_email`)
routes through it, so all HTML + text bodies and attachments are preserved.

## One-time Postmark account setup

1. Create a free account at https://postmarkapp.com and sign in.
2. **Confirm the sender** — Postmark will not send from an unverified address:
   - Easiest: **Sender Signatures → Add Signature →** `welcome@incomeonline.info`
     → click the confirmation link emailed to that address.
   - Best deliverability: **Domains → Add Domain →** `incomeonline.info`, then add
     the SPF/DKIM DNS records Postmark shows (CNAME/TXT).
3. **Get the Server API Token:** Postmark → **Servers → [your server] → API Tokens**.
   Copy the **Server** token (NOT the Account token).

## Railway environment variables (backend service)

| Variable | Required | Value |
|---|---|---|
| `POSTMARK_SERVER_TOKEN` | ✅ | the Server API Token from step 3 |
| `POSTMARK_FROM` | optional | `Income Online <welcome@incomeonline.info>` (default) |
| `POSTMARK_MESSAGE_STREAM` | optional | `outbound` (default) |

After saving, Railway redeploys automatically.

> The old `SMTP_*`, `MAILGUN_*`, `RESEND_*`, and `GMAIL_*` / `GOOGLE_CLIENT_*`
> variables are no longer used and can be deleted from Railway.

## Verify it works

Hit the admin diagnostic endpoint (replace token):

```
GET https://<your-backend>/api/admin/email-diagnostics
Authorization: Bearer <admin-jwt>
```

- `ok: true` → token valid + sender accepted; real emails will send.
- `ok: false` with `Postmark error 300` → sender signature not confirmed.
- `ok: false` with `Postmark error 10` → invalid/wrong token (use the Server token).

## API contract used (reference)

`POST https://api.postmarkapp.com/email`
Headers: `X-Postmark-Server-Token`, `Content-Type: application/json`, `Accept: application/json`
Body: `From`, `To`, `ReplyTo`, `Subject`, `HtmlBody`, `TextBody`, `MessageStream`,
optional `Headers` (List-Unsubscribe etc.) and `Attachments` (`Name` /
base64 `Content` / `ContentType`).

No extra pip package is required — sending uses the already-installed `requests`.
