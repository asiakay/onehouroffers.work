# Quick Setup Guide for onehouroffers.work

## ✅ What You Already Have

**Cloudflare Pages Project:** `onehouroffers-work`
- Default URL: https://onehouroffers-work.pages.dev
- Custom Domain: https://onehouroffers.work

**Status:** Both domains are live! ✨

---

## 🎯 What You Need to Set Up

### 1. Create Cloudflare Worker for API

Your API will be at: `https://api.onehouroffers.work`

**In Cloudflare Dashboard:**

1. Go to **Workers & Pages** → **Create Application** → **Create Worker**
2. Name it: `onehouroffers-api` (or any name)
3. Click **Deploy**
4. After deployment, add custom domain:
   - Click **Triggers** tab
   - Under **Custom Domains** → **Add Custom Domain**
   - Enter: `api.onehouroffers.work`
   - Click **Add**

### 2. Create D1 Database

**In Cloudflare Dashboard:**

1. Go to **Workers & Pages** → **D1**
2. Click **Create database**
3. Name: `onehouroffers-db`
4. Click **Create**
5. Copy the **Database ID** (you'll need this)

**Initialize Schema:**

1. In the D1 database, click **Console**
2. Copy the entire contents of `database/schema.sql` file
3. Paste into console
4. Click **Execute**
5. Verify tables created: `customers`, `bookings`, `payments`

### 3. Create KV Namespace

**In Cloudflare Dashboard:**

1. Go to **Workers & Pages** → **KV**
2. Click **Create namespace**
3. Name: `ONEHOUROFFERS_CACHE`
4. Click **Add**
5. Copy the **Namespace ID** (you'll need this)

### 4. Create R2 Bucket

**In Cloudflare Dashboard:**

1. Go to **R2**
2. Click **Create bucket**
3. Name: `onehouroffers-files`
4. Click **Create bucket**

**What it's for:** File storage (invoices, uploads, attachments)
**Cost:** FREE (10GB storage + 1M reads/month included)

---

## 📝 Update Configuration Files

### Update `worker/wrangler.toml`

Replace these placeholders:

```toml
account_id = "YOUR_CLOUDFLARE_ACCOUNT_ID"  # From dashboard

[[d1_databases]]
binding = "DB"
database_name = "onehouroffers-db"
database_id = "YOUR_D1_DATABASE_ID"  # From step 2 above

[[kv_namespaces]]
binding = "CACHE"
id = "YOUR_KV_NAMESPACE_ID"  # From step 3 above

[[r2_buckets]]
binding = "FILES"
bucket_name = "onehouroffers-files"
```

---

## 🔐 GitHub Secrets Setup

Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these secrets:

### Required Secrets:

1. **CLOUDFLARE_API_TOKEN**
   - Cloudflare Dashboard → My Profile → API Tokens
   - Create Token → Use "Edit Cloudflare Workers" template
   - Copy the token

2. **CLOUDFLARE_ACCOUNT_ID**
   - Dashboard → Workers & Pages → Overview
   - Copy Account ID from right sidebar

3. **STRIPE_SECRET_KEY**
   - https://dashboard.stripe.com/apikeys
   - Copy Secret key (starts with `sk_test_` or `sk_live_`)

4. **STRIPE_WEBHOOK_SECRET**
   - Stripe Dashboard → Developers → Webhooks
   - Add endpoint: `https://api.onehouroffers.work/api/webhooks/stripe`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy Signing secret (starts with `whsec_`)

5. **SENDGRID_API_KEY** (or RESEND_API_KEY)
   - SendGrid: https://app.sendgrid.com/settings/api_keys
   - Or Resend: https://resend.com/api-keys

6. **HUBSPOT_API_KEY** (optional - for CRM)
   - HubSpot → Settings → Integrations → Private Apps
   - Create app with contacts write permission

---

## 📁 GitHub Repository Structure

Your repo should look like this:

```
onehouroffers-work/
├── .github/
│   └── workflows/
│       ├── deploy-worker.yml
│       └── deploy-frontend.yml
├── frontend/
│   └── one-hour-services-library.html
├── worker/
│   ├── src/
│   │   ├── index.js
│   │   ├── services/
│   │   │   ├── database.js
│   │   │   ├── email.js
│   │   │   ├── stripe.js
│   │   │   └── crm.js
│   │   └── utils/
│   │       ├── responses.js
│   │       └── validation.js
│   ├── package.json
│   └── wrangler.toml
├── database/
│   └── schema.sql
└── README.md
```

---

## 🚀 Deployment

### Option 1: Automatic (Recommended)

1. Push all files to your GitHub repo
2. GitHub Actions will automatically:
   - Deploy Worker to Cloudflare
   - Deploy Frontend to Pages
   - Set all secrets

### Option 2: Manual Cloudflare Pages Connection

If you want Pages to auto-deploy from GitHub:

1. Cloudflare Dashboard → Pages → `onehouroffers-work`
2. Click **Settings** → **Builds & deployments**
3. Under **Build configuration**, connect to your GitHub repo
4. Set:
   - **Production branch:** `main`
   - **Build output directory:** `frontend`
5. Click **Save**

---

## 🧪 Testing Checklist

After deployment:

- [ ] Visit https://onehouroffers.work - Frontend loads ✅
- [ ] Visit https://onehouroffers-work.pages.dev - Same site ✅
- [ ] Test https://api.onehouroffers.work/api/health - Returns healthy status ✅
- [ ] Click "Get Started" on any service - Modal opens ✅
- [ ] Fill out booking form - Submits successfully ✅
- [ ] Check email - Confirmation received ✅
- [ ] Check D1 database - Booking recorded ✅
- [ ] Check CRM - Contact added ✅

---

## 🔗 Your URLs

**Production:**
- Frontend: https://onehouroffers.work
- API: https://api.onehouroffers.work
- Pages (alternative): https://onehouroffers-work.pages.dev

**API Endpoints:**
```
GET  https://api.onehouroffers.work/api/health
POST https://api.onehouroffers.work/api/bookings
POST https://api.onehouroffers.work/api/create-payment-intent
POST https://api.onehouroffers.work/api/webhooks/stripe
GET  https://api.onehouroffers.work/api/services
```

---

## 💡 Quick Commands

**Check if domain is working:**
```bash
curl https://onehouroffers.work
curl https://api.onehouroffers.work/api/health
```

**Test booking submission:**
```bash
curl -X POST https://api.onehouroffers.work/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "phone": "555-1234",
    "serviceId": "listing_enhancement",
    "serviceName": "Listing Enhancement Pack",
    "servicePrice": "250-500",
    "preferredDate": "2024-12-25"
  }'
```

---

## 📊 Monitoring

**View Logs:**
1. Cloudflare Dashboard → Workers & Pages
2. Click on `onehouroffers-api`
3. Go to **Logs** tab

**Check Database:**
1. Cloudflare Dashboard → D1
2. Click `onehouroffers-db`
3. Go to **Console** tab
4. Run: `SELECT * FROM bookings;`

---

## ⚡ Next Steps

1. ✅ Create Worker, D1, KV, R2 in Cloudflare Dashboard
2. ✅ Update `wrangler.toml` with IDs
3. ✅ Add GitHub secrets
4. ✅ Push code to GitHub
5. ✅ GitHub Actions deploys everything automatically!
6. 🎉 Test your live site!

---

## 🆘 Need Help?

**Common Issues:**

**"Worker not found"**
- Make sure Worker is deployed
- Check custom domain is added to Worker

**"Database error"**
- Verify D1 database ID in wrangler.toml
- Check schema is initialized

**"Email not sending"**
- Verify SendGrid/Resend API key
- Check FROM_EMAIL is verified in email service

**"Payment not working"**
- Verify Stripe webhook endpoint
- Check webhook secret matches

**View detailed logs in Cloudflare Dashboard!**
