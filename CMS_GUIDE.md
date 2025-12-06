# Content Management System (CMS) Guide

## Overview
Your Income Online platform now includes a powerful Content Management System that allows you to edit website text content without any coding knowledge.

## Admin Access

### Login Credentials
- **URL:** https://earnhub-8.preview.emergentagent.com/admin/login
- **Username:** `admin`
- **Password:** `admin123`

⚠️ **IMPORTANT:** Please change these default credentials in production for security!

### Changing Admin Credentials
To change the admin username and password:
1. Open `/app/backend/.env`
2. Add or update these lines:
   ```
   ADMIN_USERNAME=your-new-username
   ADMIN_PASSWORD=your-new-password
   ```
3. Restart the backend service: `sudo supervisorctl restart backend`

## Using the CMS

### 1. Login
- Navigate to the admin login page
- Enter your username and password
- Click "Login"
- You'll be automatically redirected to the dashboard

### 2. Dashboard Overview
The dashboard contains 6 editable content sections:

#### **Hero Section**
- **Title:** Main homepage heading
- **Subtitle:** Description text below the title
- **CTA Button Text:** Text displayed on the "Get Started" button

#### **Categories Section**
- **Title:** "Browse by Category" heading
- **Subtitle:** Description text for the categories section

#### **Donation Section**
- **Title:** Donation section heading
- **Description:** Main donation message
- **Why Donate Title:** Heading for the "Why Your Support Matters" section
- **Why Donate Description:** Description text

#### **Featured Platforms Section**
- **Title:** Section heading for featured platforms
- **Subtitle:** Description text
- **Locked Title:** Message shown to unauthenticated users (with lock icon)
- **Locked Description:** Description for locked content

#### **All Platforms Section**
- **Title:** Section heading for all platforms
- **Subtitle:** Description text
- **Locked Title:** Message shown to unauthenticated users
- **Locked Description:** Description for locked content

#### **Footer Section**
- **Tagline:** Short description in footer
- **Copyright:** Copyright text at bottom of page

### 3. Editing Content
1. Find the section you want to edit
2. Type your new content in the input fields
3. Click the "Save" button for that section
4. Wait for the green success message
5. View your changes on the live site by clicking "View Site"

### 4. Viewing Your Changes
- Click the "View Site" button in the top right
- Or simply navigate to the homepage
- Your changes will be visible immediately
- No page refresh needed for most changes

### 5. Logging Out
- Click the "Logout" button in the top right corner
- You'll be redirected to the login page

## Technical Details

### Backend APIs
- **Login:** `POST /api/cms/login`
- **Get All Content:** `GET /api/cms/content` (requires authentication)
- **Get Section:** `GET /api/cms/content/{section_id}` (requires authentication)
- **Update Section:** `PUT /api/cms/content/{section_id}` (requires authentication)
- **Verify Session:** `GET /api/cms/verify` (requires authentication)

### Frontend Routes
- **Admin Login:** `/admin/login`
- **Admin Dashboard:** `/admin/dashboard`

### Database
Content is stored in the `content` collection in MongoDB with the following structure:
```json
{
  "section_id": "hero",
  "content": {
    "title": "...",
    "subtitle": "...",
    "cta_text": "..."
  },
  "updated_at": "2025-01-28T14:00:00Z",
  "updated_by": "admin"
}
```

### Authentication
- Uses JWT tokens with 24-hour expiration
- Tokens stored in localStorage
- Password hashing using bcrypt

## Best Practices

1. **Regular Backups:** Content is stored in MongoDB, ensure regular database backups
2. **Test Changes:** Preview changes before major updates
3. **Keep It Concise:** Shorter, clearer content often performs better
4. **Maintain Consistency:** Keep tone and style consistent across sections
5. **SEO-Friendly:** Use relevant keywords in titles and descriptions

## Troubleshooting

### Can't Login
- Verify you're using the correct credentials
- Check that the backend service is running
- Clear browser cache and try again

### Changes Not Showing
- Refresh the homepage with Ctrl+F5 (hard refresh)
- Check browser console for errors
- Verify you clicked "Save" after editing

### Lost Access
- Check `/app/backend/.env` for current credentials
- Reset password by updating the `.env` file
- Restart backend after changes

## Support
For any issues or questions about the CMS, please refer to the backend logs:
```bash
tail -f /var/log/supervisor/backend.err.log
```
