import os
import logging
import resend
from pathlib import Path

logger = logging.getLogger(__name__)

# Configure Resend API key
resend.api_key = os.environ.get('RESEND_API_KEY')

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
    Send verification email to user using Resend API
    """
    # Get Resend credentials from environment
    sender_email = os.environ.get('RESEND_SENDER_EMAIL', 'onboarding@resend.dev')
    
    if not resend.api_key:
        logger.error("RESEND_API_KEY not set in environment")
        return False
    
    # Prepare email content
    email_data = prepare_verification_email(email, verification_token)
    
    try:
        # Send email via Resend API
        params = {
            "from": f"Income Online <{sender_email}>",
            "to": [email],
            "subject": email_data['subject'],
            "html": email_data['html'],
            "text": email_data['text']
        }
        
        response = resend.Emails.send(params)
        
        # Get message ID from response
        if hasattr(response, 'get') and response.get('id'):
            message_id = response.get('id')
        elif hasattr(response, 'id'):
            message_id = response.id
        else:
            message_id = 'unknown'
        
        logger.info(f"✅ Verification email sent successfully to {email}. Message ID: {message_id}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to send email via Resend: {str(e)}")
        return False
