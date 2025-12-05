# PayPal Configuration Guide for Income Online

## Overview
This guide will help you configure PayPal to:
1. **Redirect users back to www.incomeonline.info after payment**
2. **Automatically send Email Template 1 to new donors**

---

## Part 1: Configure Return URL in PayPal

### Step 1: Log into PayPal
1. Go to: https://www.paypal.com/
2. Log in to your PayPal business account

### Step 2: Access Your Hosted Button Settings
1. Click on **"Tools"** in the top menu
2. Click on **"All Tools"**
3. Find and click on **"PayPal Buttons"**
4. Find your donation button (ID: 8M5AKKB9LJW3S)
5. Click **"Edit"** or **"Manage"**

### Step 3: Set Return URL
1. Scroll down to find **"Step 3: Customize advanced features (optional)"**
2. Click to expand the section
3. Find **"Take customers to this URL when they finish checkout"**
4. Enter: `https://www.incomeonline.info`
5. Check the box **"Let PayPal choose where to take customers after checkout"** - **UNCHECK THIS**
6. Make sure **"Auto return"** is set to **"On"**
7. Click **"Save"** at the bottom

### Alternative Method: Payment Data Transfer (PDT) Settings
1. Go to **Account Settings** (click gear icon top right)
2. Click **"Website preferences"** or **"Website payments"**
3. Scroll to **"Auto Return"**
4. Set **Auto Return** to **"On"**
5. Set **"Return URL"** to: `https://www.incomeonline.info`
6. Click **"Save"**

---

## Part 2: Configure PayPal IPN for Automatic Emails

### What is IPN?
PayPal Instant Payment Notification (IPN) is a webhook that notifies your website when a payment is completed, allowing you to automatically send emails to donors.

### Step 1: Enable IPN in PayPal
1. Log into PayPal
2. Click **gear icon** (top right) → **"Account Settings"**
3. Click **"Website preferences"** or **"Notifications"**
4. Scroll to **"Instant payment notifications"**
5. Click **"Update"**

### Step 2: Set IPN URL
1. Check **"Receive IPN messages (Enabled)"**
2. Enter your **Notification URL**: `https://www.incomeonline.info/api/paypal/ipn`
3. Click **"Save"**

### Step 3: Test IPN (Optional but Recommended)
1. PayPal will send a test message to verify your endpoint
2. Check your backend logs: `tail -f /var/log/supervisor/backend.out.log`
3. You should see: "PayPal IPN received"

---

## Part 3: Alternative - Using PayPal Webhooks (Modern Method)

If IPN doesn't work, use PayPal's newer webhooks:

### Step 1: Access Webhooks
1. Log into PayPal
2. Go to: https://developer.paypal.com/dashboard/
3. Click on **"Apps & Credentials"**
4. Under **"REST API apps"**, find your app or create one
5. Scroll down to **"Webhooks"**
6. Click **"Add Webhook"**

### Step 2: Configure Webhook
1. **Webhook URL**: `https://www.incomeonline.info/api/paypal/ipn`
2. **Event types**: Select these events:
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.SALE.COMPLETED`
3. Click **"Save"**

---

## Part 4: Verify Configuration

### Test 1: Check Return URL
1. Make a small test donation (£0.01 if possible)
2. Complete payment
3. Click **"Close"** or **"Return to merchant"**
4. **Expected**: You should be redirected to www.incomeonline.info

### Test 2: Check Email Sending
1. Use an authorized email (paul-steel@outlook.com, avatarps1977@gmail.com, or welcome@incomeonline.info)
2. Make a donation
3. Complete payment
4. **Expected**: Within 1-2 minutes, you should receive Email Template 1 with verification link

### Test 3: Check Backend Logs
```bash
tail -f /var/log/supervisor/backend.out.log
```
Look for:
- "PayPal IPN received"
- "Created new donor and sent email: [email]"

---

## Troubleshooting

### Problem: Not redirected after payment
**Solution:**
- Make sure "Auto Return" is enabled in PayPal settings
- Verify Return URL is set to: `https://www.incomeonline.info`
- Check that "Let PayPal choose" is UNCHECKED

### Problem: No email received
**Possible causes:**
1. **Email not authorized in Mailgun sandbox**
   - Solution: Email must be paul-steel@outlook.com, avatarps1977@gmail.com, or welcome@incomeonline.info
   
2. **IPN not configured**
   - Solution: Follow Part 2 to enable IPN
   
3. **IPN URL incorrect**
   - Solution: Verify URL is exactly: `https://www.incomeonline.info/api/paypal/ipn`

4. **PayPal is in sandbox mode**
   - Solution: Make sure you're using live PayPal, not sandbox

### Problem: IPN not being received
**Check:**
1. PayPal Account Settings → Notifications → IPN is enabled
2. IPN URL matches exactly
3. Backend logs show: `tail -30 /var/log/supervisor/backend.out.log | grep PayPal`
4. Your server is publicly accessible (not localhost)

---

## Current System Status

✅ **Backend endpoint created**: `/api/paypal/ipn`
- Listens for PayPal notifications
- Automatically adds donors to database
- Sends Email Template 1 with verification link

✅ **Email service ready**: Mailgun configured
- Authorized recipients: paul-steel@outlook.com, avatarps1977@gmail.com, welcome@incomeonline.info
- Email Template 1 ready to send

⚠️ **Action Required**: Configure PayPal settings (Parts 1 & 2 above)

---

## Important Notes

1. **Mailgun Sandbox Limitation**: Currently using Mailgun sandbox mode. Emails can ONLY be sent to:
   - paul-steel@outlook.com
   - avatarps1977@gmail.com
   - welcome@incomeonline.info
   
   To send to any donor email, you need to verify your domain with Mailgun or upgrade your account.

2. **PayPal Button ID**: Your button ID is `8M5AKKB9LJW3S` - this is already configured in the code.

3. **PayPal Client ID**: Already configured in environment variables.

4. **Testing**: When testing, use one of the authorized emails to ensure you receive the verification email.

---

## Summary Checklist

- [ ] Set PayPal Return URL to `https://www.incomeonline.info`
- [ ] Enable Auto Return in PayPal
- [ ] Configure IPN URL: `https://www.incomeonline.info/api/paypal/ipn`
- [ ] Test with small donation
- [ ] Verify email is received
- [ ] Check that return to website works

---

## Need Help?

If you encounter issues:
1. Check backend logs: `tail -50 /var/log/supervisor/backend.out.log`
2. Look for PayPal IPN messages
3. Verify email is in authorized list
4. Contact PayPal support if IPN isn't working

---

**Last Updated**: December 2025
**Backend IPN Endpoint**: `/api/paypal/ipn`
**Frontend Return URL**: `https://www.incomeonline.info`
