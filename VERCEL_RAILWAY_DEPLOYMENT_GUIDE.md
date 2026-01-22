# Complete Deployment Guide: Vercel + Railway + MongoDB Atlas

This guide will help you deploy your Income Online website away from Emergent.

---

## Overview

| Component | Platform | Cost |
|-----------|----------|------|
| Frontend (React) | Vercel | FREE |
| Backend (FastAPI) | Railway | ~$5/month |
| Database (MongoDB) | MongoDB Atlas | FREE tier |

**Total: ~$5/month** (compared to Emergent)

---

## STEP 1: Set Up MongoDB Atlas (FREE)

### 1.1 Create Account
1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Sign up with email or Google
3. Choose the **FREE** tier (M0 Sandbox)

### 1.2 Create Cluster
1. Click "Build a Database"
2. Select **FREE - Shared** option
3. Choose region closest to your users (e.g., London for UK)
4. Name your cluster: `income-online`
5. Click "Create Cluster" (takes 1-3 minutes)

### 1.3 Set Up Database Access
1. Go to "Database Access" in left sidebar
2. Click "Add New Database User"
3. Create username: `incomeonline`
4. Create a strong password (SAVE THIS!)
5. Set privileges: "Read and write to any database"
6. Click "Add User"

### 1.4 Set Up Network Access
1. Go to "Network Access" in left sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
4. Click "Confirm"

### 1.5 Get Your Connection String
1. Go to "Database" in left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string, it looks like:
   ```
   mongodb+srv://incomeonline:<password>@income-online.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your actual password
6. **SAVE THIS CONNECTION STRING!**

---

## STEP 2: Deploy Backend to Railway

### 2.1 Create Railway Account
1. Go to: https://railway.app/
2. Sign up with GitHub (recommended) or email
3. You get $5 free credit to start

### 2.2 Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Connect your GitHub account if not already
4. Select your `income-online` repository
5. Railway will auto-detect it's a Python app

### 2.3 Configure Backend Service
1. Click on your service
2. Go to "Settings" tab
3. Set the following:
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn server:app --host 0.0.0.0 --port $PORT`

### 2.4 Add Environment Variables
1. Go to "Variables" tab
2. Add these variables (click "+ New Variable" for each):

```
MONGO_URL=mongodb+srv://incomeonline:YOUR_PASSWORD@income-online.xxxxx.mongodb.net/income_online?retryWrites=true&w=majority
DB_NAME=income_online
CORS_ORIGINS=https://your-app.vercel.app,https://www.incomeonline.info
FRONTEND_URL=https://www.incomeonline.info
MAILGUN_API_KEY=6c956bc08cf876056b04d0b49067f764-67edcffb-4f54a2ac
MAILGUN_DOMAIN=sandboxf3d94eabdd05440a9c13e182e7fc8a9c.mailgun.org
MAILGUN_SENDER_EMAIL=noreply@sandboxf3d94eabdd05440a9c13e182e7fc8a9c.mailgun.org
JWT_SECRET_KEY=ksGZbi67-ZXRunBb88v37bWDtShwJ2gAFSogizO3o_E
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2b$12$fmR3qimgLkI.zxs.aDSaIuXRjTcLuNwplwiuoGSdd7ibWS0xUb/Ia
```

### 2.5 Deploy
1. Railway will auto-deploy when you add variables
2. Wait for deployment to complete (2-5 minutes)
3. Click "Settings" → find your Railway URL (looks like: `income-online-backend.up.railway.app`)
4. **SAVE THIS BACKEND URL!**

### 2.6 Test Backend
Open in browser: `https://your-railway-url.up.railway.app/api/health`
Should return: `{"status": "healthy"}`

---

## STEP 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Account
1. Go to: https://vercel.com/
2. Sign up with GitHub (recommended)

### 3.2 Import Project
1. Click "Add New..." → "Project"
2. Select your `income-online` repository
3. Vercel will detect it's a React app

### 3.3 Configure Build Settings
1. Set **Root Directory:** `frontend`
2. Framework Preset: Create React App
3. Build Command: `yarn build` (should auto-detect)
4. Output Directory: `build` (should auto-detect)

### 3.4 Add Environment Variables
Before deploying, add these environment variables:

```
REACT_APP_BACKEND_URL=https://your-railway-url.up.railway.app
REACT_APP_PAYPAL_CLIENT_ID=BAAb5JvCWdn7JYDqhUeZ_O2MbGr5ASqqkdLndrBFU6s5q0EGRu3VHw5cgW6zHe7Vd-bh5gwq6kenrUGuzY
REACT_APP_PAYPAL_BUTTON_ID=8M5AKKB9LJW3S
```

**IMPORTANT:** Replace `your-railway-url` with your actual Railway backend URL!

### 3.5 Deploy
1. Click "Deploy"
2. Wait for deployment (2-3 minutes)
3. You'll get a Vercel URL like: `income-online.vercel.app`

### 3.6 Test Frontend
1. Open your Vercel URL
2. Verify the site loads correctly
3. Test login, platforms list, etc.

---

## STEP 4: Connect Your Custom Domain

### 4.1 Add Domain to Vercel
1. In Vercel, go to your project
2. Click "Settings" → "Domains"
3. Add: `www.incomeonline.info`
4. Add: `incomeonline.info`

### 4.2 Update DNS at Your Registrar

**For www.incomeonline.info:**
- Type: CNAME
- Name: www
- Value: `cname.vercel-dns.com`

**For incomeonline.info (root domain):**
- Type: A
- Name: @ (or blank)
- Value: `76.76.21.21`

### 4.3 Wait for DNS Propagation
- Can take 1-48 hours
- Vercel will show "Valid Configuration" when ready

### 4.4 Update Backend CORS
1. Go to Railway → your backend → Variables
2. Update `CORS_ORIGINS` to include your domain:
   ```
   CORS_ORIGINS=https://www.incomeonline.info,https://incomeonline.info,https://income-online.vercel.app
   ```

---

## STEP 5: Seed Your Database

Your platforms data is stored in `backend/seed_data.py`. When the backend starts, it should auto-seed if the database is empty.

**If platforms don't appear:**
1. Go to Railway → your service → "Logs"
2. Check for any seeding errors
3. You may need to manually trigger by calling: `https://your-backend-url/api/seed` (if such endpoint exists)

---

## STEP 6: Verify Everything Works

### Checklist:
- [ ] Homepage loads at www.incomeonline.info
- [ ] All 135+ platforms display correctly
- [ ] Magic link login works
- [ ] PayPal donation works
- [ ] Admin login works (/admin/login)
- [ ] Success stories page loads
- [ ] No console errors in browser

---

## STEP 7: Submit to Google Search Console

Once your site is live on Vercel (no Cloudflare blocking!):

1. Go to: https://search.google.com/search-console
2. Add your property: `www.incomeonline.info`
3. Verify ownership (Vercel makes this easy)
4. Submit your sitemap: `https://www.incomeonline.info/sitemap.xml`
5. Request indexing for your main pages

**This should fix your SEO problem!** Vercel doesn't have the aggressive bot protection that was blocking crawlers.

---

## Troubleshooting

### Backend won't start on Railway
- Check logs for import errors
- Make sure all dependencies are in requirements.txt
- Verify environment variables are set correctly

### Frontend can't connect to backend
- Verify REACT_APP_BACKEND_URL is correct
- Check CORS_ORIGINS includes your frontend URL
- Look at browser console for errors

### Database connection fails
- Verify MongoDB Atlas password is correct
- Check Network Access allows 0.0.0.0/0
- Ensure connection string format is correct

### Domain not working
- DNS can take up to 48 hours to propagate
- Use https://dnschecker.org to verify DNS records
- Clear browser cache

---

## Cost Summary

| Service | Monthly Cost |
|---------|-------------|
| Vercel (Frontend) | FREE |
| Railway (Backend) | ~$5 |
| MongoDB Atlas | FREE (M0) |
| **TOTAL** | **~$5/month** |

---

## Support Resources

- **Vercel Docs:** https://vercel.com/docs
- **Railway Docs:** https://docs.railway.app/
- **MongoDB Atlas Docs:** https://www.mongodb.com/docs/atlas/
- **Vercel Discord:** https://vercel.com/discord
- **Railway Discord:** https://discord.gg/railway

Good luck with your migration! 🚀
