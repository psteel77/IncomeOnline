# Email Templates Guide

## Overview
You now have two email templates for your Income Online platform:

### Template 1: New User Welcome
**File:** `/app/backend/email_templates/template_1_new_user.html`
**Use Case:** First-time users who just donated and need to verify their email
**Button Text:** "Take me to Income Online"
**Content:** Welcome message for new community members

### Template 2: Returning User Welcome
**File:** `/app/backend/email_templates/template_2_returning_user.html`
**Use Case:** Returning users requesting access again
**Button Text:** "Take me back to Income Online"
**Content:** Welcome back message for existing members

---

## How to Add Templates to Mailgun

### Method 1: Via Mailgun Dashboard (Recommended)

**Step 1: Access Mailgun Templates**
1. Login to Mailgun: https://app.mailgun.com
2. Click on **"Sending"** in the left sidebar
3. Click on **"Templates"**
4. Click **"Create Template"** button

**Step 2: Create Template 1 (New User)**
1. Template Name: `new-user-verification`
2. Description: `Welcome email for new users with verification link`
3. Click on **"HTML"** tab
4. Copy the entire content from `/app/backend/email_templates/template_1_new_user.html`
5. Paste it into the HTML editor
6. Click **"Save Template"**

**Step 3: Create Template 2 (Returning User)**
1. Click **"Create Template"** again
2. Template Name: `returning-user-verification`
3. Description: `Welcome back email for returning users`
4. Click on **"HTML"** tab
5. Copy the entire content from `/app/backend/email_templates/template_2_returning_user.html`
6. Paste it into the HTML editor
7. Click **"Save Template"**

**Step 4: Test Your Templates**
1. Select a template
2. Click **"Send Test Email"**
3. Enter your email: avatarps1977@gmail.com
4. Click **"Send"**
5. Check your inbox to verify it looks correct

---

### Method 2: Via Mailgun API (Advanced)

You can upload templates programmatically using the Mailgun API:

```bash
# Upload Template 1
curl -s --user 'api:YOUR_MAILGUN_API_KEY' \
    https://api.mailgun.net/v3/YOUR_DOMAIN/templates \
    -F name='new-user-verification' \
    -F description='Welcome email for new users' \
    -F template='@/app/backend/email_templates/template_1_new_user.html'

# Upload Template 2
curl -s --user 'api:YOUR_MAILGUN_API_KEY' \
    https://api.mailgun.net/v3/YOUR_DOMAIN/templates \
    -F name='returning-user-verification' \
    -F description='Welcome back email for returning users' \
    -F template='@/app/backend/email_templates/template_2_returning_user.html'
```

Replace:
- `YOUR_MAILGUN_API_KEY` with your actual API key
- `YOUR_DOMAIN` with your sandbox domain

---

## Using Templates in Your Application

### Current Setup
Right now, the system uses `/app/backend/email_templates/verify_email.html` which is Template 1.

### To Switch Templates
If you want to use different templates for new vs returning users:

**Option 1: Update email_service.py to detect user type**
```python
def load_email_template(template_name, is_returning_user=False):
    if is_returning_user:
        template_name = 'template_2_returning_user'
    else:
        template_name = 'template_1_new_user'
    # ... rest of the code
```

**Option 2: Keep it simple**
Just use Template 1 for all users (current setup works fine)

---

## Template Variables

Both templates support the following variable:
- `{{VERIFICATION_LINK}}` - Replaced with the actual verification URL

The system automatically replaces this when sending emails.

---

## Template Features

Both templates include:
- ✅ Montserrat font
- ✅ Teal branding (#165e84)
- ✅ Responsive design (50% width on desktop, full on mobile)
- ✅ Large "Welcome" heading (56px)
- ✅ Centered text layout
- ✅ Ghost button style (transparent with teal border)
- ✅ Teal header and footer
- ✅ Light teal benefits section
- ✅ Security note
- ✅ Fallback link
- ✅ Contact information

---

## Quick Reference

### Template Files Location
```
/app/backend/email_templates/
├── verify_email.html                    # Currently active (Template 1)
├── template_1_new_user.html            # Template 1 backup
└── template_2_returning_user.html      # Template 2
```

### Active Template
The system currently uses: `/app/backend/email_templates/verify_email.html`

This is a copy of Template 1 (new user version).

---

## Next Steps

1. **Add templates to Mailgun** using Method 1 above
2. **Test both templates** by sending test emails
3. **Decide** if you want to use different templates for new vs returning users
4. **Optional:** Update the code to use Mailgun's template feature instead of local HTML files

---

## Support

If you need help with:
- Adding templates to Mailgun
- Customizing template content
- Switching between templates

Feel free to ask for assistance!
