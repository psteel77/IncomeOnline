import os
import re
import hashlib
import logging
import smtplib
from pathlib import Path
from email.message import EmailMessage

logger = logging.getLogger(__name__)


def _friendly_name(email: str) -> str:
    """Derive a friendly first name from an email local-part.

    e.g. paul-steel@outlook.com -> "Paul", john.doe@x.com -> "John".
    Returns "" when nothing usable can be extracted (so callers fall back to a
    generic greeting). Junk/numeric/very-short tokens are rejected.
    """
    if not email or "@" not in email:
        return ""
    local = email.split("@", 1)[0]
    token = re.split(r"[._+\-0-9]+", local)[0].strip()
    if len(token) < 2 or not token.isalpha():
        return ""
    generic = {"info", "admin", "hello", "team", "mail", "email", "contact",
               "support", "sales", "no", "noreply", "donotreply", "user"}
    if token.lower() in generic:
        return ""
    return token[:1].upper() + token[1:].lower()


def _greeting(email: str) -> str:
    """A personalized greeting line that gracefully falls back to "Hi there,"."""
    name = _friendly_name(email)
    return f"Hi {name}," if name else "Hi there,"


# -----------------------------------------------------------------------------
# Abandoned-donation recovery — subject-line A/B test
# -----------------------------------------------------------------------------
# Each recipient is deterministically (and evenly) bucketed into one variant by
# hashing their email, so a given person always sees the same subject. The
# chosen variant key is recorded on their donation_intent so recovery-stats can
# report which subject converts better.
RECOVERY_SUBJECT_VARIANTS = {
    "A": "Your Income Online access is one click away",
    "B": "You left 199+ ways to earn online — finish in one click",
}


def pick_recovery_subject(email: str):
    """Return (variant_key, subject) deterministically bucketed by email."""
    digest = hashlib.md5((email or "").strip().lower().encode("utf-8")).hexdigest()
    key = "A" if int(digest, 16) % 2 == 0 else "B"
    return key, RECOVERY_SUBJECT_VARIANTS[key]

# -----------------------------------------------------------------------------
# Email delivery via Google Workspace SMTP (smtp.gmail.com)
# -----------------------------------------------------------------------------
# The sending domain (incomeonline.info) is already on Google Workspace with
# Google MX + SPF (include:_spf.google.com) and Google-managed DKIM, so mail
# sent through Gmail's authenticated SMTP passes SPF/DKIM/DMARC with NO extra
# DNS records. This replaces the previous Resend integration which required a
# subdomain MX record that the Wix registrar would not allow.
#
# Required env vars:
#   SMTP_HOST      (default smtp.gmail.com)
#   SMTP_PORT      (default 587, STARTTLS)
#   SMTP_USERNAME  full Workspace address, e.g. welcome@incomeonline.info
#   SMTP_PASSWORD  16-char Google App Password (NOT the normal password)
#   SMTP_FROM      "Display Name <welcome@incomeonline.info>" (defaults to username)
SMTP_FROM_DEFAULT = "Income Online <welcome@incomeonline.info>"


def _send_email(to_email, subject, html, text, attachments=None, extra_headers=None):
    """
    Send an email via Google Workspace SMTP.

    Returns True on success, False (with logged error) on any failure.
    `attachments` is an optional list of dicts: [{"filename": str, "content_bytes": bytes}]
    `extra_headers` is an optional dict of additional headers (e.g. List-Unsubscribe).
    """
    host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
    port = int(os.environ.get("SMTP_PORT", "587"))
    username = os.environ.get("SMTP_USERNAME")
    password = os.environ.get("SMTP_PASSWORD")
    from_addr = os.environ.get("SMTP_FROM") or username or SMTP_FROM_DEFAULT

    print(f"[SMTP] _send_email called: to={to_email} subject={subject!r}", flush=True)
    print(f"[SMTP] host={host}:{port} user set? {bool(username)} from={from_addr!r}", flush=True)

    if not username or not password:
        logger.error("SMTP_USERNAME/SMTP_PASSWORD not set in environment; email not sent")
        print("[SMTP] ABORT: SMTP credentials missing", flush=True)
        return False

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = from_addr
    msg["To"] = to_email
    msg["Reply-To"] = from_addr
    if extra_headers:
        for key, value in extra_headers.items():
            msg[key] = value
    msg.set_content(text or "")
    msg.add_alternative(html, subtype="html")

    if attachments:
        for a in attachments:
            msg.add_attachment(
                a["content_bytes"],
                maintype="application",
                subtype="octet-stream",
                filename=a["filename"],
            )

    try:
        with smtplib.SMTP(host, port, timeout=30) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(username, password)
            server.send_message(msg)
        logger.info(f"✅ SMTP delivered to {to_email} · subject='{subject}'")
        print("[SMTP] SUCCESS", flush=True)
        return True
    except Exception as e:
        logger.error(f"❌ SMTP send failed for {to_email}: {e}")
        print(f"[SMTP] EXCEPTION: {type(e).__name__}: {e}", flush=True)
        return False


def load_email_template(template_name):
    """Load an email template from the email_templates directory"""
    template_path = Path(__file__).parent / 'email_templates' / f'{template_name}.html'
    
    try:
        with open(template_path, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        logger.error(f"Email template not found: {template_path}")
        return None

_BRAND_HEADER = "#4c1d95"
_BRAND_FOOTER = "#2e1065"
_BRAND_PURPLE = "#6d28d9"
_FEATURE_PALETTE = [("#6d28d9", "#ede9fe"), ("#db2777", "#fce7f3"), ("#ea580c", "#ffedd5")]


def _cta_button(text: str, url: str) -> str:
    """A bulletproof (VML-backed) rounded CTA button that renders in Outlook too."""
    return f'''<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:6px auto 0 auto;">
      <tr><td align="center">
        <!--[if mso]>
        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="{url}" style="height:52px;v-text-anchor:middle;width:300px;" arcsize="50%" stroke="f" fillcolor="{_BRAND_PURPLE}">
        <w:anchorlock/>
        <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">{text}</center>
        </v:roundrect>
        <![endif]-->
        <!--[if !mso]><!-- -->
        <a href="{url}" target="_blank" style="display:inline-block; padding:16px 38px; font-family:Arial,Helvetica,sans-serif; font-size:16px; font-weight:bold; color:#ffffff; background-color:{_BRAND_PURPLE}; border-radius:999px;">{text}</a>
        <!--<![endif]-->
      </td></tr>
    </table>'''


def _cta_block(text: str, url: str, subtext: str = "") -> str:
    sub = (f'<div style="font-family:Arial,Helvetica,sans-serif; font-size:12px; color:#9ca3af; padding-top:12px;">{subtext}</div>'
           if subtext else "")
    return f'<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding:24px 0 6px 0;">{_cta_button(text, url)}{sub}</td></tr></table>'


def _features_block(label: str, items_html: list) -> str:
    """A scannable list of feature rows with colour-coded check badges."""
    rows = ""
    for i, html in enumerate(items_html):
        accent, bg = _FEATURE_PALETTE[i % len(_FEATURE_PALETTE)]
        rows += f'''<tr>
          <td width="40" valign="top" style="padding:6px 0;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td width="28" height="28" align="center" valign="middle" bgcolor="{bg}" style="background-color:{bg}; border-radius:8px; font-family:Arial,sans-serif; font-size:15px; color:{accent}; font-weight:bold;">&#10003;</td></tr></table>
          </td>
          <td valign="middle" style="padding:6px 0 6px 12px; font-family:Arial,Helvetica,sans-serif; font-size:15px; line-height:1.5; color:#374151;">{html}</td>
        </tr>'''
    label_html = (f'<div style="font-family:Arial,Helvetica,sans-serif; font-size:13px; letter-spacing:1.5px; text-transform:uppercase; color:#9ca3af; font-weight:bold; padding:10px 0 14px 0;">{label}</div>'
                  if label else "")
    return f'{label_html}<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">{rows}</table>'


def _callout_band(html: str, bar="#f59e0b", bg="#fffbeb", color="#92400e") -> str:
    """A full-width tinted reassurance band with a coloured left bar (adds depth)."""
    return f'''<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="{bg}" style="background-color:{bg}; border-radius:12px; margin:22px 0 0 0;">
      <tr>
        <td width="6" bgcolor="{bar}" style="background-color:{bar}; font-size:0; line-height:0;">&nbsp;</td>
        <td style="padding:16px 20px; font-family:Arial,Helvetica,sans-serif; font-size:14px; line-height:1.6; color:{color};">{html}</td>
      </tr>
    </table>'''


def _premium_email(*, eyebrow: str, title: str, body_html: str, footer_note: str, preheader: str = "") -> str:
    """Wrap content in the shared premium shell: hero band, brand accent stripe,
    white body and a grounded dark footer. Email-client-safe (incl. Outlook)."""
    frontend_url = os.environ.get("FRONTEND_URL", "https://www.incomeonline.info")
    logo_url = f"{frontend_url}/earnhub-logo.png"
    brand_url = "https://www.incomeonline.info"
    return f'''<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta http-equiv="X-UA-Compatible" content="IE=edge"/>
<title>{title}</title>
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<![endif]-->
<style>
  table {{ border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; }}
  img {{ border:0; line-height:100%; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; }}
  body {{ margin:0; padding:0; width:100%; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }}
  a {{ text-decoration:none; }}
</style>
</head>
<body style="margin:0; padding:0; background-color:#ece9fb;">
<div style="display:none; max-height:0; overflow:hidden; opacity:0;">{preheader}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#ece9fb;">
  <tr>
    <td align="center" style="padding:28px 12px;">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px; max-width:100%; background-color:#ffffff; border-radius:18px; overflow:hidden;">
        <tr>
          <td bgcolor="{_BRAND_HEADER}" style="background-color:{_BRAND_HEADER}; padding:32px 40px 26px 40px;" align="center">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto;">
              <tr><td bgcolor="#ffffff" align="center" style="background-color:#ffffff; border-radius:12px; padding:12px 18px;">
                <img src="{logo_url}" width="140" alt="Income Online" style="display:block; max-width:140px; height:auto;"/>
              </td></tr>
            </table>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td height="14" style="font-size:0; line-height:14px; height:14px; mso-line-height-rule:exactly;">&nbsp;</td></tr></table>
            <div style="font-family:Arial,Helvetica,sans-serif; font-size:13px; letter-spacing:2px; text-transform:uppercase; color:#c4b5fd; font-weight:bold;">{eyebrow}</div>
            <div style="font-family:'Trebuchet MS',Arial,Helvetica,sans-serif; font-size:28px; line-height:1.25; color:#ffffff; font-weight:bold; padding-top:8px;">{title}</div>
          </td>
        </tr>
        <tr>
          <td style="font-size:0; line-height:0;" height="6">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
              <td bgcolor="#7c3aed" height="6" style="background-color:#7c3aed; font-size:0; line-height:0;">&nbsp;</td>
              <td bgcolor="#db2777" height="6" style="background-color:#db2777; font-size:0; line-height:0;">&nbsp;</td>
              <td bgcolor="#ea580c" height="6" style="background-color:#ea580c; font-size:0; line-height:0;">&nbsp;</td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px 20px 40px; font-family:Arial,Helvetica,sans-serif;">{body_html}</td>
        </tr>
        <tr>
          <td bgcolor="{_BRAND_FOOTER}" style="background-color:{_BRAND_FOOTER}; padding:24px 40px; font-family:Arial,Helvetica,sans-serif;">
            <p style="margin:0 0 6px 0; font-size:13px; color:#ffffff; font-weight:bold;">Income Online</p>
            <p style="margin:0; font-size:12px; line-height:1.6; color:#a78bda;">{footer_note}<br/>
              <a href="{brand_url}" style="color:#c4b5fd;">www.incomeonline.info</a>
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>'''


def prepare_new_user_email(email, verification_token):
    """Prepare the premium Welcome email for NEW users (PayPal donors)."""
    frontend_url = os.environ['FRONTEND_URL']
    verification_link = f"{frontend_url}/verify?token={verification_token}"

    body = (
        f'<p style="margin:0 0 12px 0; font-size:17px; line-height:1.6; color:#1f2937;">{_greeting(email)}</p>'
        '<p style="margin:0 0 16px 0; font-size:17px; line-height:1.6; color:#1f2937;">'
        'Thank you for your donation &mdash; welcome to <strong style="color:#4c1d95;">Income Online</strong>! '
        'You\'re one click from unlocking everything.</p>'
        '<p style="margin:0 0 4px 0; font-size:16px; line-height:1.6; color:#374151;">'
        'Verify your email to activate <strong>12 months</strong> of full access:</p>'
        + _cta_block('Verify &amp; unlock access &rarr;', verification_link, 'Takes one click &middot; nothing else to enter')
        + _features_block('What you unlock', [
            '<strong style="color:#111827;">199+ verified platforms</strong> with details, ratings &amp; earning potential',
            '<strong style="color:#111827;">Direct links</strong> to start earning immediately',
            '<strong style="color:#111827;">Search &amp; filter tools</strong> to find your perfect opportunity',
        ])
        + _callout_band("<strong>Tip:</strong> bookmark the site after you verify so you can jump back in anytime.")
    )
    html_content = _premium_email(
        eyebrow="Welcome aboard",
        title="Your access is ready",
        body_html=body,
        footer_note="You're receiving this because you donated to unlock Income Online. If this wasn't you, contact welcome@incomeonline.info.",
        preheader="Verify your email to unlock 199+ verified ways to earn online.",
    )

    return {
        'subject': 'Welcome to Income Online! Verify to unlock access',
        'html': html_content,
        'text': f'''Welcome to Income Online!

{_greeting(email)}

Thank you for your donation. Verify your email to unlock 12 months of full access to 199+ verified earning platforms:

{verification_link}

What you unlock:
- 199+ verified platforms with details, ratings & earning potential
- Direct links to start earning immediately
- Search & filter tools to find your perfect opportunity

If you didn't make this donation, contact us at welcome@incomeonline.info
- Income Online | https://www.incomeonline.info
'''
    }

def prepare_returning_user_email(email, verification_token):
    """Prepare the premium magic-link email for RETURNING users."""
    frontend_url = os.environ['FRONTEND_URL']
    verification_link = f"{frontend_url}/verify?token={verification_token}"

    body = (
        '<p style="margin:0 0 16px 0; font-size:17px; line-height:1.6; color:#1f2937;">'
        'Good to see you again! Use the secure link below to sign back in &mdash; no password needed.</p>'
        + _cta_block('Access my platforms &rarr;', verification_link, 'Secure one-click sign-in')
        + _features_block('Waiting for you', [
            '<strong style="color:#111827;">All your platforms</strong> with ratings, payouts &amp; filters',
            '<strong style="color:#111827;">Newly added</strong> opportunities since your last visit',
            '<strong style="color:#111827;">Your MoneyRules guides</strong> &amp; resources',
        ])
    )
    html_content = _premium_email(
        eyebrow="Welcome back",
        title="Sign in with one click",
        body_html=body,
        footer_note="If you didn't request this sign-in link, you can safely ignore this email.",
        preheader="Your secure one-click sign-in link is inside.",
    )

    return {
        'subject': 'Welcome back to Income Online — sign in',
        'html': html_content,
        'text': f'''Welcome back to Income Online!

Use this secure link to sign back in (no password needed):

{verification_link}

If you didn't request this email, you can safely ignore it.
Questions? welcome@incomeonline.info
- Income Online | https://www.incomeonline.info
'''
    }

def send_new_user_email(email, verification_token):
    """
    Send Email Template 1 (Welcome!) to NEW users after PayPal donation
    """
    email_data = prepare_new_user_email(email, verification_token)
    frontend_url = os.environ['FRONTEND_URL']
    verification_link = f"{frontend_url}/verify?token={verification_token}"

    ok = _send_email(
        to_email=email,
        subject=email_data['subject'],
        html=email_data['html'],
        text=email_data['text'],
    )
    if ok:
        logger.info(f"Email Template 1 (NEW user) verification link: {verification_link}")
    return ok

def send_returning_user_email(email, verification_token):
    """
    Send Email Template 2 (Welcome back!) to RETURNING users requesting magic link
    """
    email_data = prepare_returning_user_email(email, verification_token)
    frontend_url = os.environ['FRONTEND_URL']
    verification_link = f"{frontend_url}/verify?token={verification_token}"

    ok = _send_email(
        to_email=email,
        subject=email_data['subject'],
        html=email_data['html'],
        text=email_data['text'],
    )
    if ok:
        logger.info(f"Email Template 2 (RETURNING user) verification link: {verification_link}")
    return ok


def prepare_premium_pack_email(email, download_url):
    """Prepare the Premium Pack delivery email (sent after a verified £14.99 purchase)."""
    body = (
        f'<p style="margin:0 0 12px 0; font-size:17px; line-height:1.6; color:#1f2937;">{_greeting(email)}</p>'
        '<p style="margin:0 0 16px 0; font-size:17px; line-height:1.6; color:#1f2937;">'
        'Thank you for upgrading to <strong style="color:#4c1d95;">Income Online Premium</strong>! '
        'Your payment is confirmed &mdash; your account now has <strong>12 months of full platform access</strong> '
        'plus the complete <strong>Wealth Generator</strong> bundle.</p>'
        '<p style="margin:0 0 4px 0; font-size:16px; line-height:1.6; color:#374151;">'
        'Download your Premium Pack (a single ZIP) here:</p>'
        + _cta_block('Download my Premium Pack &darr;', download_url, 'Direct download &middot; yours to keep forever')
        + _features_block("What's inside", [
            '<strong style="color:#111827;">Full access to 199+ platforms</strong> for 12 months',
            '<strong style="color:#111827;">10 MoneyRules guides</strong> (print-ready PDFs)',
            '<strong style="color:#111827;">4 premium Strategy documents</strong>',
            '<strong style="color:#111827;">6 interactive calculators</strong> with live, auto-updating charts',
        ])
        + _callout_band("<strong>Tip:</strong> open the calculators in Excel, Google Sheets or Numbers &mdash; type your numbers into the highlighted cells and the charts redraw instantly.")
    )
    html_content = _premium_email(
        eyebrow="Premium unlocked",
        title="Your Wealth Generator pack is ready",
        body_html=body,
        footer_note="You're receiving this because you purchased Income Online Premium. Questions? welcome@incomeonline.info.",
        preheader="Download your Premium Pack and start using your interactive calculators.",
    )
    return {
        'subject': 'Your Income Online Premium Pack is ready to download',
        'html': html_content,
        'text': f'''Thank you for upgrading to Income Online Premium!

{_greeting(email)}

Your payment is confirmed. You now have 12 months of full platform access PLUS the Wealth Generator bundle.

Download your Premium Pack (ZIP):
{download_url}

Inside:
- Full access to 199+ platforms for 12 months
- 10 MoneyRules guides (PDF)
- 4 premium Strategy documents
- 6 interactive calculators with live charts

Questions? welcome@incomeonline.info
- Income Online | https://www.incomeonline.info
'''
    }


def send_premium_pack_email(email, download_url):
    """Send the Premium Pack delivery email with the one-time download link."""
    data = prepare_premium_pack_email(email, download_url)
    ok = _send_email(
        to_email=email,
        subject=data['subject'],
        html=data['html'],
        text=data['text'],
    )
    if ok:
        logger.info(f"Premium pack delivery email sent to {email}")
    return ok


def prepare_expired_email(email):
    """Prepare the premium expired-subscription email."""
    frontend_url = os.environ.get('FRONTEND_URL', 'https://www.incomeonline.info')
    renewal_link = f"{frontend_url}/#support"

    body = (
        '<p style="margin:0 0 16px 0; font-size:17px; line-height:1.6; color:#1f2937;">'
        'Your <strong style="color:#4c1d95;">12 months</strong> of Income Online access has come to an end &mdash; '
        'thank you for being part of the community.</p>'
        '<p style="margin:0 0 4px 0; font-size:16px; line-height:1.6; color:#374151;">'
        'We hope the platforms helped you find real opportunities. If you\'d like to keep exploring '
        'what\'s new, you can renew for another 12 months:</p>'
        + _cta_block('Renew for £9.99 &rarr;', renewal_link, 'One-time &middot; 12 months access')
        + _callout_band(
            'If you\'ve found your path and no longer need us, we wish you continued success &mdash; '
            'and you\'re welcome back anytime.',
            bar="#6d28d9", bg="#f5f3ff", color="#4c1d95")
    )
    html_content = _premium_email(
        eyebrow="Membership update",
        title="Your 12 months are up",
        body_html=body,
        footer_note="You're receiving this because your Income Online access has ended.",
        preheader="Thank you for being a member — renew anytime for another 12 months.",
    )

    return {
        'subject': 'Your Income Online membership has ended',
        'html': html_content,
        'text': f'''Your Income Online membership has ended

Thank you for being part of Income Online. Your 12-month access has now ended.

If you'd like to continue exploring new opportunities, you can renew for £9.99:
{renewal_link}

We wish you continued success either way.
- The Income Online Team | https://www.incomeonline.info
'''
    }


def prepare_expiry_warning_email(email, expiry_date):
    """Prepare the premium 7-day expiry warning email."""
    frontend_url = os.environ.get('FRONTEND_URL', 'https://www.incomeonline.info')
    renewal_link = f"{frontend_url}/#support"
    expiry_date_str = expiry_date.strftime('%B %d, %Y') if hasattr(expiry_date, 'strftime') else str(expiry_date)

    body = (
        '<p style="margin:0 0 16px 0; font-size:17px; line-height:1.6; color:#1f2937;">'
        f'A quick, friendly heads-up: your Income Online access expires on '
        f'<strong style="color:#4c1d95;">{expiry_date_str}</strong>.</p>'
        '<p style="margin:0 0 4px 0; font-size:16px; line-height:1.6; color:#374151;">'
        'Renew now to keep uninterrupted access to everything:</p>'
        + _cta_block('Renew now &rarr;', renewal_link, 'One-time £9.99 &middot; 12 more months')
        + _features_block('What you keep', [
            '<strong style="color:#111827;">199+ verified platforms</strong> &amp; earning guides',
            '<strong style="color:#111827;">Ratings, payouts &amp; filters</strong> for every platform',
            '<strong style="color:#111827;">New platforms</strong> added regularly',
        ])
        + _callout_band(
            'This is a one-time courtesy reminder &mdash; we won\'t email you about this again unless you ask.',
            bar="#6d28d9", bg="#f5f3ff", color="#4c1d95")
    )
    html_content = _premium_email(
        eyebrow="Heads up",
        title="7 days left on your access",
        body_html=body,
        footer_note="A one-time courtesy reminder from Income Online.",
        preheader=f"Your access expires on {expiry_date_str} — renew to stay in.",
    )

    return {
        'subject': 'Your Income Online access expires in 7 days',
        'html': html_content,
        'text': f'''Your Income Online access expires in 7 days

This is a courtesy reminder that your access expires on {expiry_date_str}.

Renew for £9.99 to keep 12 more months of access:
{renewal_link}

This is a one-time courtesy email — we won't contact you about this again unless you ask.
- The Income Online Team | https://www.incomeonline.info
'''
    }


def send_expired_email(email):
    """
    Send Email Template 3 to users whose subscription has expired
    """
    email_data = prepare_expired_email(email)
    return _send_email(
        to_email=email,
        subject=email_data['subject'],
        html=email_data['html'],
        text=email_data['text'],
    )


def send_expiry_warning_email(email, expiry_date):
    """
    Send Email Template 4 - 7 day warning before expiry
    """
    email_data = prepare_expiry_warning_email(email, expiry_date)
    return _send_email(
        to_email=email,
        subject=email_data['subject'],
        html=email_data['html'],
        text=email_data['text'],
    )


DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'


def send_resource_email(email: str, resource_title: str, attachment_path: str, attachment_filename: str) -> bool:
    """
    Email a MoneyRules free guide to the subscriber with the .docx attached.

    Used by the Free Resources gateway when the visitor chooses "Email me the guide"
    instead of an in-browser download.
    """
    frontend_url = os.environ.get('FRONTEND_URL', 'https://www.incomeonline.info')

    if not os.path.exists(attachment_path):
        logger.error(f"Resource attachment missing on disk: {attachment_path}")
        return False

    subject = f"Your free guide: {resource_title}"
    safe_title = _html.escape(resource_title)
    body = (
        '<p style="margin:0 0 16px 0; font-size:17px; line-height:1.6; color:#1f2937;">'
        f'Your guide <strong style="color:#4c1d95;">{safe_title}</strong> is attached &mdash; thank you for grabbing it!</p>'
        '<p style="margin:0 0 4px 0; font-size:16px; line-height:1.6; color:#374151;">'
        'It\'s a print-ready PDF you can save, print and keep forever.</p>'
        + _callout_band(
            'Ready to go deeper? The <strong>£14.99 Premium Pack</strong> bundles all 10 free guides + '
            '2 exclusive premium guides + 5 editable spreadsheets.',
            bar="#6d28d9", bg="#f5f3ff", color="#4c1d95")
        + _cta_block('Get the Premium Pack &rarr;', f"{frontend_url}/#premium-pack", 'One-time £14.99')
    )
    html = _premium_email(
        eyebrow="Your free guide",
        title="Your MoneyRules guide is attached",
        body_html=body,
        footer_note="You're receiving this because you requested a free guide at Income Online.",
        preheader=f"{resource_title} is attached — enjoy!",
    )
    text = (
        f"Your MoneyRules guide is attached\n\n"
        f"Thank you for downloading '{resource_title}' from Income Online.\n"
        f"It's a print-ready PDF you can save, print, and keep forever.\n\n"
        f"Want to go deeper? Upgrade to the £14.99 Premium Pack: {frontend_url}/#premium-pack\n\n"
        f"- Income Online | https://www.incomeonline.info\n"
    )

    try:
        with open(attachment_path, 'rb') as fh:
            file_bytes = fh.read()
    except OSError as e:
        logger.error(f"❌ Could not read resource attachment {attachment_path}: {e}")
        return False

    return _send_email(
        to_email=email,
        subject=subject,
        html=html,
        text=text,
        attachments=[{"filename": attachment_filename, "content_bytes": file_bytes}],
    )


def send_abandoned_donation_email(email: str, subject: str = None) -> bool:
    """
    Send a friendly recovery email to visitors who opened the PayPal popup
    but never completed the donation. Triggered from /api/paypal/run-recovery.

    `subject` lets the caller pass an A/B-test variant (see pick_recovery_subject).
    When omitted, a variant is chosen deterministically from the email.
    """
    frontend_url = os.environ.get("FRONTEND_URL", "https://www.incomeonline.info")
    # Pre-fill the visitor's email on the resume link so they only need to
    # click the PayPal button when they arrive — no re-typing.
    resume_link = f"{frontend_url}/#support?resume={email}"
    brand_url = "https://www.incomeonline.info"
    logo_url = f"{frontend_url}/earnhub-logo.png"

    if subject is None:
        _, subject = pick_recovery_subject(email)

    html = f"""\
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta http-equiv="X-UA-Compatible" content="IE=edge"/>
<title>Your Income Online access is one click away</title>
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<![endif]-->
<style>
  table {{ border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; }}
  img {{ border:0; line-height:100%; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; }}
  body {{ margin:0; padding:0; width:100%; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }}
  a {{ text-decoration:none; }}
</style>
</head>
<body style="margin:0; padding:0; background-color:#ece9fb;">
<div style="display:none; max-height:0; overflow:hidden; opacity:0;">Your spot is saved — finish in one click and unlock 199+ verified ways to earn online.</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#ece9fb;">
  <tr>
    <td align="center" style="padding:28px 12px;">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px; max-width:100%; background-color:#ffffff; border-radius:18px; overflow:hidden;">

        <!-- ===== Hero header (deep purple) ===== -->
        <tr>
          <td bgcolor="#4c1d95" style="background-color:#4c1d95; padding:32px 40px 26px 40px;" align="center">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto;">
              <tr>
                <td bgcolor="#ffffff" align="center" style="background-color:#ffffff; border-radius:12px; padding:12px 18px;">
                  <img src="{logo_url}" width="140" alt="Income Online" style="display:block; max-width:140px; height:auto;"/>
                </td>
              </tr>
            </table>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td height="14" style="font-size:0; line-height:14px; height:14px; mso-line-height-rule:exactly;">&nbsp;</td></tr></table>
            <div style="font-family:Arial,Helvetica,sans-serif; font-size:13px; letter-spacing:2px; text-transform:uppercase; color:#c4b5fd; font-weight:bold;">You're almost in</div>
            <div style="font-family:'Trebuchet MS',Arial,Helvetica,sans-serif; font-size:30px; line-height:1.2; color:#ffffff; font-weight:bold; padding-top:8px;">Your access is one click away</div>
          </td>
        </tr>
        <!-- 3-colour brand accent stripe -->
        <tr>
          <td style="font-size:0; line-height:0;" height="6">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
              <td bgcolor="#7c3aed" height="6" style="background-color:#7c3aed; font-size:0; line-height:0;">&nbsp;</td>
              <td bgcolor="#db2777" height="6" style="background-color:#db2777; font-size:0; line-height:0;">&nbsp;</td>
              <td bgcolor="#ea580c" height="6" style="background-color:#ea580c; font-size:0; line-height:0;">&nbsp;</td>
            </tr></table>
          </td>
        </tr>

        <!-- ===== Intro ===== -->
        <tr>
          <td style="padding:34px 40px 6px 40px; font-family:Arial,Helvetica,sans-serif;">
            <p style="margin:0 0 12px 0; font-size:17px; line-height:1.6; color:#1f2937;">{_greeting(email)}</p>
            <p style="margin:0 0 14px 0; font-size:17px; line-height:1.6; color:#1f2937;">
              You started unlocking <strong style="color:#4c1d95;">199+ verified online earning platforms</strong> but didn't quite finish &mdash; and we saved your spot.
            </p>
          </td>
        </tr>

        <!-- ===== Price spotlight (tinted block for depth) ===== -->
        <tr>
          <td style="padding:8px 40px 0 40px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f5f3ff" style="background-color:#f5f3ff; border-radius:14px;">
              <tr>
                <td align="center" style="padding:26px 24px;">
                  <div style="font-family:'Trebuchet MS',Arial,sans-serif; font-size:46px; line-height:1; color:#4c1d95; font-weight:bold;">£9.99</div>
                  <div style="font-family:Arial,Helvetica,sans-serif; font-size:14px; color:#6d28d9; padding-top:6px; font-weight:bold; letter-spacing:0.5px;">ONE-TIME &middot; 12 MONTHS FULL ACCESS</div>
                  <!-- CTA button -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:22px auto 0 auto;">
                    <tr><td align="center">
                      <!--[if mso]>
                      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="{resume_link}" style="height:52px;v-text-anchor:middle;width:300px;" arcsize="50%" stroke="f" fillcolor="#6d28d9">
                      <w:anchorlock/>
                      <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">Complete my £9.99 access &rarr;</center>
                      </v:roundrect>
                      <![endif]-->
                      <!--[if !mso]><!-- -->
                      <a href="{resume_link}" target="_blank" style="display:inline-block; padding:16px 38px; font-family:Arial,Helvetica,sans-serif; font-size:16px; font-weight:bold; color:#ffffff; background-color:#6d28d9; border-radius:999px;">Complete my £9.99 access &rarr;</a>
                      <!--<![endif]-->
                    </td></tr>
                  </table>
                  <div style="font-family:Arial,Helvetica,sans-serif; font-size:12px; color:#9ca3af; padding-top:12px;">&#128274; Secure checkout via PayPal</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ===== What you get (icon rows) ===== -->
        <tr>
          <td style="padding:30px 40px 6px 40px; font-family:Arial,Helvetica,sans-serif;">
            <div style="font-size:13px; letter-spacing:1.5px; text-transform:uppercase; color:#9ca3af; font-weight:bold; padding-bottom:14px;">What you unlock today</div>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td width="40" valign="top" style="padding:6px 0;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td width="28" height="28" align="center" valign="middle" bgcolor="#ede9fe" style="background-color:#ede9fe; border-radius:8px; font-family:Arial,sans-serif; font-size:15px; color:#6d28d9; font-weight:bold;">&#10003;</td></tr></table>
                </td>
                <td valign="middle" style="padding:6px 0 6px 12px; font-size:15px; line-height:1.5; color:#374151;"><strong style="color:#111827;">199+ verified platforms</strong> across freelancing, surveys, remote jobs &amp; more</td>
              </tr>
              <tr>
                <td width="40" valign="top" style="padding:6px 0;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td width="28" height="28" align="center" valign="middle" bgcolor="#fce7f3" style="background-color:#fce7f3; border-radius:8px; font-family:Arial,sans-serif; font-size:15px; color:#db2777; font-weight:bold;">&#10003;</td></tr></table>
                </td>
                <td valign="middle" style="padding:6px 0 6px 12px; font-size:15px; line-height:1.5; color:#374151;"><strong style="color:#111827;">Ratings, payouts &amp; filters</strong> so you pick the right opportunity fast</td>
              </tr>
              <tr>
                <td width="40" valign="top" style="padding:6px 0;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td width="28" height="28" align="center" valign="middle" bgcolor="#ffedd5" style="background-color:#ffedd5; border-radius:8px; font-family:Arial,sans-serif; font-size:15px; color:#ea580c; font-weight:bold;">&#10003;</td></tr></table>
                </td>
                <td valign="middle" style="padding:6px 0 6px 12px; font-size:15px; line-height:1.5; color:#374151;"><strong style="color:#111827;">12 bonus resources:</strong> 10 free + 2 premium MoneyRules guides &amp; 5 editable spreadsheets</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ===== Reassurance band (full-width tinted) ===== -->
        <tr>
          <td style="padding:26px 40px 4px 40px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#fffbeb" style="background-color:#fffbeb; border-radius:12px;">
              <tr>
                <td width="6" bgcolor="#f59e0b" style="background-color:#f59e0b; font-size:0; line-height:0;">&nbsp;</td>
                <td style="padding:16px 20px; font-family:Arial,Helvetica,sans-serif; font-size:14px; line-height:1.6; color:#92400e;">
                  <strong>Worth it from day one.</strong> A single job from these platforms can more than cover the £9.99 &mdash; everything after that is profit.
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ===== Fallback link ===== -->
        <tr>
          <td style="padding:24px 40px 10px 40px; font-family:Arial,Helvetica,sans-serif;">
            <p style="margin:0; font-size:12px; line-height:1.6; color:#9ca3af;">
              Button not working? Paste this into your browser:<br/>
              <a href="{resume_link}" style="color:#6d28d9; word-break:break-all;">{resume_link}</a>
            </p>
          </td>
        </tr>

        <!-- ===== Dark footer band ===== -->
        <tr>
          <td bgcolor="#2e1065" style="background-color:#2e1065; padding:24px 40px; font-family:Arial,Helvetica,sans-serif;">
            <p style="margin:0 0 6px 0; font-size:13px; color:#ffffff; font-weight:bold;">Income Online</p>
            <p style="margin:0; font-size:12px; line-height:1.6; color:#a78bda;">
              You're receiving this because you started a donation at Income Online. If that wasn't you, ignore this &mdash; we won't email you about it again.<br/>
              <a href="{brand_url}" style="color:#c4b5fd;">www.incomeonline.info</a>
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>
"""

    text = (
        "You're one click from full access\n\n"
        f"{_greeting(email)}\n\n"
        "You started unlocking 199+ verified online earning platforms but didn't quite finish. "
        "Your spot is saved.\n\n"
        "A one-time £9.99 contribution gives you 12 full months of:\n"
        "  - 199+ verified online earning platforms\n"
        "  - Detailed ratings, payouts & category filters\n"
        "  - 10 free MoneyRules guides + 2 premium guides + 5 editable spreadsheets\n\n"
        f"Complete your £9.99 access here: {resume_link}\n\n"
        "Worth it from day one: a single job from these platforms can more than cover the £9.99.\n\n"
        "If you didn't start a donation, you can safely ignore this email.\n"
        f"- Income Online | {brand_url}\n"
    )

    return _send_email(to_email=email, subject=subject, html=html, text=text)


import html as _html


def build_broadcast_content(subject: str, message: str):
    """Wrap an admin broadcast message in a branded HTML shell + plain-text version."""
    frontend_url = os.environ.get("FRONTEND_URL", "https://www.incomeonline.info").rstrip("/")
    unsubscribe_mailto = "mailto:welcome@incomeonline.info?subject=Unsubscribe"

    # Convert the plain message into HTML paragraphs, preserving line breaks and
    # escaping any HTML so admin input can't break the layout.
    blocks = [b for b in message.split("\n\n") if b.strip()]
    paragraphs = "".join(
        f'<p style="font-size:16px;line-height:1.7;margin:0 0 16px;color:#1f2937;font-family:Arial,Helvetica,sans-serif;">'
        f'{_html.escape(b.strip()).replace(chr(10), "<br/>")}</p>'
        for b in blocks
    ) or f'<p style="font-size:16px;line-height:1.7;color:#1f2937;font-family:Arial,Helvetica,sans-serif;">{_html.escape(message)}</p>'

    body = paragraphs + _cta_block('Visit Income Online &rarr;', frontend_url)
    html_body = _premium_email(
        eyebrow="News &amp; updates",
        title=_html.escape(subject),
        body_html=body,
        footer_note=('You\'re receiving this because you signed up for free guides or updates at Income Online. '
                     f'<a href="{unsubscribe_mailto}" style="color:#c4b5fd;">Unsubscribe</a>.'),
        preheader=subject,
    )

    text_body = (
        f"{message}\n\n"
        f"—\nIncome Online · {frontend_url}\n"
        f"Unsubscribe: reply to this email with the word 'Unsubscribe'.\n"
    )
    return html_body, text_body


def send_broadcast_email(email: str, subject: str, message: str) -> bool:
    """Send a one-time admin broadcast to a single subscriber."""
    html_body, text_body = build_broadcast_content(subject, message)
    return _send_email(
        to_email=email,
        subject=subject,
        html=html_body,
        text=text_body,
        extra_headers={"List-Unsubscribe": "<mailto:welcome@incomeonline.info?subject=Unsubscribe>"},
    )
