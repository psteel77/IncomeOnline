# Income Online - Migration Guide & Export Documentation

## Quick Start for Migration

### Step 1: Export Code to GitHub
1. Click **"Save to GitHub"** button in the Emergent chat interface
2. Select or create a repository
3. Your complete codebase will be pushed

### Step 2: Export Your Data
Run this command in Emergent to get a MongoDB dump (ask the agent):
```
mongodump --uri="$MONGO_URL" --out=/app/mongo_backup
```

---

## Project Architecture

```
/app
├── backend/                 # FastAPI Python Backend
│   ├── server.py           # Main API server
│   ├── cms_routes.py       # Admin CMS routes
│   ├── seed_data.py        # Platform data (137 platforms)
│   ├── requirements.txt    # Python dependencies
│   └── .env                # Environment variables (COPY THIS!)
│
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── pages/         # Main pages (Home, Donate, SuccessStories)
│   │   └── components/    # Reusable components
│   ├── public/
│   │   ├── robots.txt     # SEO robots file
│   │   └── sitemap.xml    # SEO sitemap
│   ├── package.json       # Node dependencies
│   └── .env               # Frontend environment variables
│
└── pdf_output/            # Generated files (CSV, XLSX, PDF)
```

---

## Environment Variables You MUST Copy

### Backend (.env)
```
MONGO_URL=<your-mongodb-connection-string>
DB_NAME=<your-database-name>
CORS_ORIGINS=<frontend-url>
FRONTEND_URL=<frontend-url>
MAILGUN_API_KEY=<your-mailgun-key>
MAILGUN_DOMAIN=<your-mailgun-domain>
MAILGUN_SENDER_EMAIL=<sender-email>
JWT_SECRET_KEY=<your-jwt-secret>
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=<bcrypt-hash>
```

### Frontend (.env)
```
REACT_APP_BACKEND_URL=<your-backend-url>
REACT_APP_PAYPAL_CLIENT_ID=<your-paypal-client-id>
REACT_APP_PAYPAL_BUTTON_ID=<your-paypal-button-id>
```

---

## Third-Party Services to Reconnect

| Service | Purpose | Where to Get Keys |
|---------|---------|-------------------|
| MongoDB Atlas | Database | https://cloud.mongodb.com |
| Mailgun | Transactional emails | https://mailgun.com |
| PayPal | Donations/Payments | https://developer.paypal.com |

---

## Recommended Deployment Options

### Option A: Vercel + Railway (Recommended)
- **Frontend:** Deploy to Vercel (free tier available)
- **Backend:** Deploy to Railway ($5/month)
- **Database:** MongoDB Atlas (free tier available)

**Steps:**
1. Push code to GitHub
2. Connect Vercel to your repo → deploy frontend
3. Connect Railway to your repo → deploy backend
4. Create MongoDB Atlas cluster
5. Update environment variables on each platform
6. Point your domain DNS to Vercel

### Option B: Render (All-in-One)
- **Both frontend & backend** on Render
- Simpler setup, single platform
- Free tier available with limitations

### Option C: DigitalOcean App Platform
- Full-stack deployment
- Managed services
- ~$12-20/month

---

## DNS Changes Required

When you move, update these DNS records at your domain registrar:

**Remove:**
- Current A/CNAME records pointing to Emergent

**Add (example for Vercel):**
- A record: `76.76.21.21`
- CNAME for www: `cname.vercel-dns.com`

---

## Pre-Migration Checklist

- [ ] Export code to GitHub via "Save to GitHub"
- [ ] Copy all .env values (backend & frontend)
- [ ] Export MongoDB data (platforms, users, donations)
- [ ] Note your PayPal configuration
- [ ] Note your Mailgun configuration
- [ ] Test locally before shutting down Emergent
- [ ] Set up new hosting platform
- [ ] Update DNS records
- [ ] Verify site works on new platform
- [ ] Cancel Emergent subscription (if desired)

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `/app/backend/seed_data.py` | All 137 platform data |
| `/app/backend/server.py` | Main API endpoints |
| `/app/frontend/src/pages/Home.jsx` | Homepage with all sections |
| `/app/frontend/src/pages/SuccessStories.jsx` | 60 success stories |
| `/app/frontend/public/sitemap.xml` | SEO sitemap |

---

## Admin Credentials

- **URL:** /admin/login
- **Username:** admin
- **Password:** Gulluk*9

---

## Questions?

If you need help with migration, you can:
1. Hire a developer on Upwork/Fiverr
2. Follow deployment docs for Vercel/Railway/Render
3. Ask in their Discord communities for help
