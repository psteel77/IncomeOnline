import os
import logging
import requests
from pathlib import Path

logger = logging.getLogger(__name__)

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
    api_key = os.environ.get('MAILGUN_API_KEY')
    domain = os.environ.get('MAILGUN_DOMAIN')
    sender_email = os.environ.get('MAILGUN_SENDER_EMAIL')
    
    if not api_key or not domain:
        logger.error("MAILGUN_API_KEY and MAILGUN_DOMAIN not set in environment")
        return False
    
    # Prepare Email Template 1
    email_data = prepare_new_user_email(email, verification_token)
    
    frontend_url = os.environ['FRONTEND_URL']
    verification_link = f"{frontend_url}/verify?token={verification_token}"
    
    api_url = f"https://api.mailgun.net/v3/{domain}/messages"
    
    try:
        response = requests.post(
            api_url,
            auth=("api", api_key),
            data={
                "from": f"Income Online <{sender_email}>",
                "to": email,
                "subject": email_data['subject'],
                "html": email_data['html'],
                "text": email_data['text']
            },
            timeout=10
        )
        response.raise_for_status()
        
        result = response.json()
        message_id = result.get('id', 'unknown')
        
        logger.info(f"✅ Email Template 1 (NEW user) sent via Mailgun to {email}. Message ID: {message_id}")
        logger.info(f"Verification link: {verification_link}")
        
        return True
        
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Failed to send email via Mailgun: {str(e)}")
        if hasattr(e, 'response') and e.response is not None:
            logger.error(f"Response: {e.response.text}")
        return False
    except Exception as e:
        logger.error(f"❌ Unexpected error sending email: {str(e)}")
        return False

def send_returning_user_email(email, verification_token):
    """
    Send Email Template 2 (Welcome back!) to RETURNING users requesting magic link
    """
    api_key = os.environ.get('MAILGUN_API_KEY')
    domain = os.environ.get('MAILGUN_DOMAIN')
    sender_email = os.environ.get('MAILGUN_SENDER_EMAIL')
    
    if not api_key or not domain:
        logger.error("MAILGUN_API_KEY and MAILGUN_DOMAIN not set in environment")
        return False
    
    # Prepare Email Template 2
    email_data = prepare_returning_user_email(email, verification_token)
    
    frontend_url = os.environ['FRONTEND_URL']
    verification_link = f"{frontend_url}/verify?token={verification_token}"
    
    api_url = f"https://api.mailgun.net/v3/{domain}/messages"
    
    try:
        response = requests.post(
            api_url,
            auth=("api", api_key),
            data={
                "from": f"Income Online <{sender_email}>",
                "to": email,
                "subject": email_data['subject'],
                "html": email_data['html'],
                "text": email_data['text']
            },
            timeout=10
        )
        response.raise_for_status()
        
        result = response.json()
        message_id = result.get('id', 'unknown')
        
        logger.info(f"✅ Email Template 2 (RETURNING user) sent via Mailgun to {email}. Message ID: {message_id}")
        logger.info(f"Verification link: {verification_link}")
        
        return True
        
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Failed to send email via Mailgun: {str(e)}")
        if hasattr(e, 'response') and e.response is not None:
            logger.error(f"Response: {e.response.text}")
        return False
    except Exception as e:
        logger.error(f"❌ Unexpected error sending email: {str(e)}")
        return False


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
    api_key = os.environ.get('MAILGUN_API_KEY')
    domain = os.environ.get('MAILGUN_DOMAIN')
    sender_email = os.environ.get('MAILGUN_SENDER_EMAIL')
    
    if not api_key or not domain:
        logger.error("MAILGUN_API_KEY and MAILGUN_DOMAIN not set in environment")
        return False
    
    email_data = prepare_expired_email(email)
    api_url = f"https://api.mailgun.net/v3/{domain}/messages"
    
    try:
        response = requests.post(
            api_url,
            auth=("api", api_key),
            data={
                "from": f"Income Online <{sender_email}>",
                "to": email,
                "subject": email_data['subject'],
                "html": email_data['html'],
                "text": email_data['text']
            },
            timeout=10
        )
        response.raise_for_status()
        
        result = response.json()
        message_id = result.get('id', 'unknown')
        
        logger.info(f"✅ Email Template 3 (EXPIRED) sent via Mailgun to {email}. Message ID: {message_id}")
        return True
        
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Failed to send expired email via Mailgun: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"❌ Unexpected error sending expired email: {str(e)}")
        return False


def send_expiry_warning_email(email, expiry_date):
    """
    Send Email Template 4 - 7 day warning before expiry
    """
    api_key = os.environ.get('MAILGUN_API_KEY')
    domain = os.environ.get('MAILGUN_DOMAIN')
    sender_email = os.environ.get('MAILGUN_SENDER_EMAIL')
    
    if not api_key or not domain:
        logger.error("MAILGUN_API_KEY and MAILGUN_DOMAIN not set in environment")
        return False
    
    email_data = prepare_expiry_warning_email(email, expiry_date)
    api_url = f"https://api.mailgun.net/v3/{domain}/messages"
    
    try:
        response = requests.post(
            api_url,
            auth=("api", api_key),
            data={
                "from": f"Income Online <{sender_email}>",
                "to": email,
                "subject": email_data['subject'],
                "html": email_data['html'],
                "text": email_data['text']
            },
            timeout=10
        )
        response.raise_for_status()
        
        result = response.json()
        message_id = result.get('id', 'unknown')
        
        logger.info(f"✅ Email Template 4 (EXPIRY WARNING) sent via Mailgun to {email}. Message ID: {message_id}")
        return True
        
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Failed to send expiry warning email via Mailgun: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"❌ Unexpected error sending expiry warning email: {str(e)}")
        return False
