import os
import logging
import smtplib
from pathlib import Path
from email.message import EmailMessage

logger = logging.getLogger(__name__)

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

def prepare_new_user_email(email, verification_token):
    """Prepare Email Template 1 for NEW users (PayPal donors)"""
    frontend_url = os.environ['FRONTEND_URL']
    verification_link = f"{frontend_url}/verify?token={verification_token}"
    
    # Load Template 1
    template = load_email_template('template_1_new_user')
    
    if not template:
        return {
            'subject': 'Welcome to Income Online!',
            'html': f'''
                <h1>Welcome!</h1>
                <p>Thank you for your donation! Click below to verify and access all platforms:</p>
                <p><a href="{verification_link}">Verify & Access Now</a></p>
            ''',
            'text': f'Welcome! Click this link to verify: {verification_link}'
        }
    
    html_content = template.replace('{{VERIFICATION_LINK}}', verification_link)
    
    return {
        'subject': 'Welcome to Income Online!',
        'html': html_content,
        'text': f'''
Welcome to Income Online!

Thank you for your donation and joining the Income Online community!

Click the link below to verify your email and unlock full access to all 20+ earning platforms:

{verification_link}

What You'll Get:
✓ Access to 20+ verified earning platforms with detailed information
✓ Ratings, reviews, and earning potential for each platform
✓ Direct links to start earning immediately
✓ Search and filter tools to find your perfect opportunity
✓ Lifetime access to all current and future platforms

If you didn't make this donation, please contact us at welcome@incomeonline.info

© 2025 Income Online. All rights reserved.
        '''
    }

def prepare_returning_user_email(email, verification_token):
    """Prepare Email Template 2 for RETURNING users (magic link)"""
    frontend_url = os.environ['FRONTEND_URL']
    verification_link = f"{frontend_url}/verify?token={verification_token}"
    
    # Load Template 2
    template = load_email_template('template_2_returning_user')
    
    if not template:
        return {
            'subject': 'Welcome Back to Income Online!',
            'html': f'''
                <h1>Welcome Back!</h1>
                <p>Click the link below to access all platforms:</p>
                <p><a href="{verification_link}">Access Now</a></p>
            ''',
            'text': f'Welcome Back! Click this link to access: {verification_link}'
        }
    
    html_content = template.replace('{{VERIFICATION_LINK}}', verification_link)
    
    return {
        'subject': 'Welcome Back to Income Online!',
        'html': html_content,
        'text': f'''
Welcome Back to Income Online!

Thank you for being part of the Income Online community!

Click the link below to verify your email and unlock full access to all 50+ income producing platforms:

{verification_link}

What You'll Get:
✓ Access to 50+ income producing platforms with detailed information
✓ Ratings, reviews, and earning potential for each platform
✓ Direct links to start earning immediately
✓ Search and filter tools to find your perfect opportunity
✓ Lifetime access to all current and future platforms

If you didn't request this email, you can safely ignore it.

Questions? Contact us at welcome@incomeonline.info

© 2025 Income Online. All rights reserved.
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


def prepare_expired_email(email):
    """Prepare Email Template 3 for EXPIRED subscription users"""
    frontend_url = os.environ.get('FRONTEND_URL', 'https://www.incomeonline.info')
    renewal_link = f"{frontend_url}/#support"
    
    # Load Template 3
    template = load_email_template('template_3_expired')
    
    if not template:
        return {
            'subject': 'Your Income Online Subscription Has Ended',
            'html': f'''
                <h1>Your Subscription Has Ended</h1>
                <p>Thank you for being part of Income Online. Your 12-month subscription has expired.</p>
                <p>If you'd like to renew: <a href="{renewal_link}">Renew Now</a></p>
            ''',
            'text': f'Your Income Online subscription has expired. Renew at: {renewal_link}'
        }
    
    html_content = template.replace('{{RENEWAL_LINK}}', renewal_link)
    
    return {
        'subject': 'Your Income Online Subscription Has Ended',
        'html': html_content,
        'text': f'''
Your Income Online Subscription Has Ended

Dear Valued Member,

Your 12-month subscription to Income Online has now come to an end. We wanted to take a moment to sincerely thank you for being part of our community.

We hope that during your time with us:
- You discovered valuable income opportunities that worked for you
- You're now in a stronger financial position than when we first met
- The platforms we recommended have helped you achieve your goals

If you've found your path and no longer need our services, we wish you continuing success in all your endeavours.

However, if you'd like to continue exploring new opportunities, you can renew here:
{renewal_link}

Thank you for trusting Income Online.

Best regards,
The Income Online Team

© 2025 Income Online. All rights reserved.
        '''
    }


def prepare_expiry_warning_email(email, expiry_date):
    """Prepare Email Template 4 for 7-day expiry warning"""
    frontend_url = os.environ.get('FRONTEND_URL', 'https://www.incomeonline.info')
    renewal_link = f"{frontend_url}/#support"
    
    # Format expiry date
    expiry_date_str = expiry_date.strftime('%B %d, %Y') if hasattr(expiry_date, 'strftime') else str(expiry_date)
    
    # Load Template 4
    template = load_email_template('template_4_expiry_warning')
    
    if not template:
        return {
            'subject': 'Your Income Online Subscription Expires in 7 Days',
            'html': f'''
                <h1>7 Days Until Expiry</h1>
                <p>Your subscription expires on {expiry_date_str}.</p>
                <p>Renew now: <a href="{renewal_link}">Renew</a></p>
                <p><em>This is a courtesy email. We will not contact you again unless you ask us to do so.</em></p>
            ''',
            'text': f'Your subscription expires on {expiry_date_str}. Renew at: {renewal_link}'
        }
    
    html_content = template.replace('{{RENEWAL_LINK}}', renewal_link)
    html_content = html_content.replace('{{EXPIRY_DATE}}', expiry_date_str)
    
    return {
        'subject': 'Your Income Online Subscription Expires in 7 Days',
        'html': html_content,
        'text': f'''
Your Income Online Subscription Expires in 7 Days

Dear Valued Member,

This is a courtesy reminder that your 12-month subscription will expire on {expiry_date_str}.

What you'll lose access to:
- 110+ verified earning platforms with detailed information
- Platform ratings, reviews, and earning potential guides
- Direct links to all income opportunities
- New platforms added regularly

If you'd like to continue, you can renew here:
{renewal_link}

Please Note: This is a courtesy email. We will not contact you again regarding this subscription unless you request us to do so.

Thank you for being part of the Income Online community.

Best regards,
The Income Online Team

© 2025 Income Online. All rights reserved.
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
    html = f"""
    <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 640px; margin: 0 auto; padding: 32px 24px; color: #1f2937;">
      <h1 style="background: linear-gradient(90deg,#7c3aed,#db2777,#ea580c); -webkit-background-clip: text; background-clip: text; color: transparent; font-size: 28px; margin: 0 0 12px;">Your MoneyRules guide is attached</h1>
      <p style="font-size: 16px; line-height: 1.6;">Thank you for downloading <strong>{resource_title}</strong> from Income Online.</p>
      <p style="font-size: 15px; line-height: 1.6;">Open the attachment — it's a print-ready Word document you can edit, annotate, and keep forever.</p>
      <p style="font-size: 15px; line-height: 1.6;">When you're ready to go deeper, our <a href="{frontend_url}/#premium-pack" style="color:#7c3aed;">$12.99 Premium Pack</a> bundles all 10 free guides plus 2 exclusive premium guides and 5 editable Excel spreadsheets.</p>
      <p style="font-size: 14px; color: #6b7280; margin-top: 32px;">Sent with love from Income Online · <a href="{frontend_url}" style="color:#7c3aed;">www.incomeonline.info</a></p>
    </div>
    """
    text = (
        f"Your MoneyRules guide is attached\n\n"
        f"Thank you for downloading '{resource_title}' from Income Online.\n"
        f"Open the attachment — it's a print-ready Word document you can edit, annotate, and keep forever.\n\n"
        f"Want to go deeper? Upgrade to the $12.99 Premium Pack: {frontend_url}/#premium-pack\n\n"
        f"— Income Online · {frontend_url}\n"
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


def send_abandoned_donation_email(email: str) -> bool:
    """
    Send a friendly recovery email to visitors who opened the PayPal popup
    but never completed the donation. Triggered from /api/paypal/run-recovery.
    """
    frontend_url = os.environ.get("FRONTEND_URL", "https://www.incomeonline.info")
    # Pre-fill the visitor's email on the resume link so they only need to
    # click the PayPal button when they arrive — no re-typing.
    resume_link = f"{frontend_url}/#support?resume={email}"
    brand_url = "https://www.incomeonline.info"
    logo_url = f"{frontend_url}/earnhub-logo.png"

    subject = "Your Income Online access is one click away"

    html = f"""\
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta http-equiv="X-UA-Compatible" content="IE=edge"/>
<title>Your Income Online access is one click away</title>
</head>
<body style="margin:0; padding:0; background-color:#f3f4f6;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f3f4f6;">
  <tr>
    <td align="center" style="padding:24px 12px;">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px; max-width:100%; background-color:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e5e7eb;">
        <!-- Brand header -->
        <tr>
          <td align="center" bgcolor="#6d28d9" style="background-color:#6d28d9; padding:24px;">
            <img src="{logo_url}" width="160" alt="Income Online" style="display:block; border:0; max-width:160px; height:auto;"/>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 40px 8px 40px; font-family:Arial,Helvetica,sans-serif;">
            <h1 style="margin:0 0 16px 0; font-size:26px; line-height:1.25; color:#111827; font-weight:bold;">
              You're one click from full access
            </h1>
            <p style="margin:0 0 16px 0; font-size:16px; line-height:1.6; color:#374151;">
              You started unlocking <strong>199+ verified online earning platforms</strong> but didn't quite finish. Your spot is saved — pick up right where you left off.
            </p>
            <p style="margin:0 0 12px 0; font-size:16px; line-height:1.6; color:#374151;">
              A one-time <strong>$9.99</strong> contribution gives you <strong>12 full months</strong> of:
            </p>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 8px 0;">
              <tr><td style="padding:4px 0; font-family:Arial,Helvetica,sans-serif; font-size:15px; line-height:1.5; color:#374151;">&#10003;&nbsp; 199+ verified online earning platforms</td></tr>
              <tr><td style="padding:4px 0; font-family:Arial,Helvetica,sans-serif; font-size:15px; line-height:1.5; color:#374151;">&#10003;&nbsp; Detailed ratings, payouts &amp; category filters</td></tr>
              <tr><td style="padding:4px 0; font-family:Arial,Helvetica,sans-serif; font-size:15px; line-height:1.5; color:#374151;">&#10003;&nbsp; 10 free MoneyRules guides + 2 premium guides + 5 editable spreadsheets</td></tr>
            </table>
          </td>
        </tr>
        <!-- Bulletproof button -->
        <tr>
          <td align="center" style="padding:20px 40px 8px 40px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
              <tr>
                <td align="center" bgcolor="#6d28d9" style="background-color:#6d28d9; border-radius:8px;">
                  <a href="{resume_link}" target="_blank" style="display:inline-block; padding:15px 36px; font-family:Arial,Helvetica,sans-serif; font-size:16px; font-weight:bold; color:#ffffff; text-decoration:none; border-radius:8px;">
                    Complete my $9.99 access &rarr;
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:14px 0 0 0; font-family:Arial,Helvetica,sans-serif; font-size:13px; color:#9ca3af;">
              Secure checkout via PayPal
            </p>
          </td>
        </tr>
        <!-- P.S. callout -->
        <tr>
          <td style="padding:16px 40px 0 40px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#fef3c7; border-radius:8px;">
              <tr>
                <td style="padding:14px 18px; font-family:Arial,Helvetica,sans-serif; font-size:14px; line-height:1.6; color:#92400e;">
                  <strong>Worth it from day one:</strong> a single job from these platforms can more than cover the $9.99 — after that, it's all profit.
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:28px 40px 36px 40px; font-family:Arial,Helvetica,sans-serif;">
            <p style="margin:0 0 12px 0; font-size:13px; line-height:1.6; color:#9ca3af;">
              If a button doesn't work, copy and paste this link into your browser:<br/>
              <a href="{resume_link}" style="color:#6d28d9; word-break:break-all;">{resume_link}</a>
            </p>
            <hr style="border:none; border-top:1px solid #e5e7eb; margin:16px 0;"/>
            <p style="margin:0; font-size:12px; line-height:1.6; color:#9ca3af;">
              You're receiving this because you started a donation at Income Online. If that wasn't you, you can safely ignore this — we won't email you about it again.<br/>
              Income Online &middot; <a href="{brand_url}" style="color:#6d28d9; text-decoration:none;">www.incomeonline.info</a>
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
        "You started unlocking 199+ verified online earning platforms but didn't quite finish. "
        "Your spot is saved.\n\n"
        "A one-time $9.99 contribution gives you 12 full months of:\n"
        "  - 199+ verified online earning platforms\n"
        "  - Detailed ratings, payouts & category filters\n"
        "  - 10 free MoneyRules guides + 2 premium guides + 5 editable spreadsheets\n\n"
        f"Complete your $9.99 access here: {resume_link}\n\n"
        "Worth it from day one: a single job from these platforms can more than cover the $9.99.\n\n"
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
        f'<p style="font-size:16px;line-height:1.7;margin:0 0 16px;color:#1f2937;">'
        f'{_html.escape(b.strip()).replace(chr(10), "<br/>")}</p>'
        for b in blocks
    ) or f'<p style="font-size:16px;line-height:1.7;color:#1f2937;">{_html.escape(message)}</p>'

    html_body = f"""
    <div style="font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background:#ffffff;">
      <div style="background: linear-gradient(90deg,#7c3aed,#db2777,#ea580c); padding: 24px 28px;">
        <h1 style="margin:0; color:#ffffff; font-size:22px; letter-spacing:0.5px;">Income Online</h1>
      </div>
      <div style="padding: 28px;">
        {paragraphs}
        <div style="margin-top:28px; text-align:center;">
          <a href="{frontend_url}" style="display:inline-block; padding:12px 26px; background:linear-gradient(90deg,#7c3aed,#db2777); color:#ffffff; font-weight:700; text-decoration:none; border-radius:999px; font-size:15px;">Visit Income Online</a>
        </div>
      </div>
      <div style="padding: 18px 28px; border-top:1px solid #eee; color:#9ca3af; font-size:12px; line-height:1.6;">
        You're receiving this because you signed up for free guides or updates at Income Online.<br/>
        <a href="{unsubscribe_mailto}" style="color:#9ca3af;">Unsubscribe</a> · <a href="{frontend_url}" style="color:#9ca3af;">{frontend_url}</a>
      </div>
    </div>
    """

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
