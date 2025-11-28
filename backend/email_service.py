import os
import logging
from pathlib import Path

def load_email_template(template_name):
    """Load an email template from the email_templates directory"""
    template_path = Path(__file__).parent / 'email_templates' / f'{template_name}.html'
    
    try:
        with open(template_path, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        logging.error(f"Email template not found: {template_path}")
        return None

def prepare_verification_email(email, verification_token):
    """Prepare the verification email content"""
    # Get the frontend URL from environment
    frontend_url = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:3000')
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
    Send verification email to user
    
    For development: Logs email to console
    For production: Integrate with SendGrid, AWS SES, or other email service
    """
    email_data = prepare_verification_email(email, verification_token)
    
    # For now, log the email to console
    logging.info("\n" + "="*60)
    logging.info("📧 VERIFICATION EMAIL")
    logging.info("="*60)
    logging.info(f"From: welcome@incomeonline.info")
    logging.info(f"To: {email}")
    logging.info(f"Subject: {email_data['subject']}")
    logging.info("-"*60)
    logging.info("TEXT VERSION:")
    logging.info(email_data['text'])
    logging.info("-"*60)
    logging.info("HTML VERSION: Check /app/backend/email_templates/verify_email.html")
    logging.info("="*60 + "\n")
    
    # TODO: In production, use a real email service
    # Example with SendGrid:
    # import sendgrid
    # from sendgrid.helpers.mail import Mail
    # 
    # sg = sendgrid.SendGridAPIClient(api_key=os.environ.get('SENDGRID_API_KEY'))
    # message = Mail(
    #     from_email='welcome@incomeonline.info',
    #     to_emails=email,
    #     subject=email_data['subject'],
    #     html_content=email_data['html']
    # )
    # response = sg.send(message)
    
    return True
