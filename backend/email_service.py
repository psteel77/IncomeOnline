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

def prepare_verification_email(email, verification_token):
    """Prepare the verification email content"""
    # Get the frontend URL from environment
    frontend_url = os.environ.get('FRONTEND_URL', 'https://earninghub.preview.emergentagent.com')
    verification_link = f"{frontend_url}/verify?token={verification_token}"
    
    # Load the template
    template = load_email_template('verify_email')
    
    if not template:
        # Fallback to simple text email
        return {
            'subject': 'Welcome Back to Income Online - Verify Your Email',
            'html': f'''
                <h1>Welcome Back!</h1>
                <p>Click the link below to verify your email and access all platforms:</p>
                <p><a href="{verification_link}">Verify & Access Now</a></p>
            ''',
            'text': f'Welcome Back! Click this link to verify: {verification_link}'
        }
    
    # Replace placeholders in template
    html_content = template.replace('{{VERIFICATION_LINK}}', verification_link)
    
    return {
        'subject': 'Welcome Back to Income Online - Verify Your Email',
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

def send_verification_email(email, verification_token):
    """
    Send verification email to user using Mailgun API
    """
    # Get Mailgun credentials
    api_key = os.environ.get('MAILGUN_API_KEY')
    domain = os.environ.get('MAILGUN_DOMAIN')
    sender_email = os.environ.get('MAILGUN_SENDER_EMAIL')
    
    if not api_key or not domain:
        logger.error("MAILGUN_API_KEY and MAILGUN_DOMAIN not set in environment")
        return False
    
    # Prepare email content
    email_data = prepare_verification_email(email, verification_token)
    
    # Get frontend URL for verification link
    frontend_url = os.environ.get('FRONTEND_URL', 'https://earninghub.preview.emergentagent.com')
    verification_link = f"{frontend_url}/verify?token={verification_token}"
    
    # Mailgun API endpoint
    api_url = f"https://api.mailgun.net/v3/{domain}/messages"
    
    try:
        # Send email via Mailgun
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
        
        logger.info(f"✅ Verification email sent via Mailgun to {email}. Message ID: {message_id}")
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
