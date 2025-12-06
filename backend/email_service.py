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

Click the link below to verify your email and unlock full access to all 20+ earning platforms:

{verification_link}

What You'll Get:
✓ Access to 20+ verified earning platforms with detailed information
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
