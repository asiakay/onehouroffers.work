# 🤖 Automated Setup Guide via GitHub Actions

## Overview

You can now set up everything automatically using GitHub Actions workflows - no manual Cloudflare dashboard work needed!

---

## 📋 Prerequisites

**Before running workflows, add these GitHub Secrets:**

1. Go to your repo → **Settings** → **Secrets and variables** → **Actions**
2. Add these secrets:

| Secret Name | Where to Get It |
|-------------|----------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare Dashboard → Profile → API Tokens → Create Token → "Edit Cloudflare Workers" template |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Dashboard → Workers & Pages → Account ID (right sidebar) |

**That's it! Just those 2 secrets to start.**

---

## 🚀 Step-by-Step Automated Setup

### Step 1: Upload Workflow Files

Upload these files from `/mnt/user-data/outputs/` to your GitHub repo:

```
.github/workflows/
├── setup-cloudflare.yml      # Creates D1, KV, R2
├── deploy-worker.yml          # Deploys Worker
└── deploy-frontend.yml        # Deploys Frontend
```

**How to upload:**
1. In GitHub, create folder `.github/workflows/`
2. Click "Add file" → "Upload files"
3. Drag the 3 `.yml` files
4. Commit directly to `main`

### Step 2: Upload Your Code Files

Upload all other files from `/mnt/user-data/outputs/`:

```
worker/
├── src/
│   ├── index.js                    (from worker-index.js)
│   ├── services/
│   │   ├── database.js             (from worker-database.js)
│   │   ├── email.js                (from worker-email.js)
│   │   ├── stripe.js               (split from worker-services.js)
│   │   └── crm.js                  (split from worker-services.js)
│   └── utils/
│       ├── responses.js            (from worker-utils.js)
│       └── validation.js           (from worker-utils.js)
├── package.json                    (create new)
└── wrangler.toml                   (from worker-wrangler.toml)

database/
└── schema-d1-clean.sql             (your database schema)

frontend/
└── one-hour-services-library.html  (your landing page)
```

### Step 3: Run Setup Workflow

1. Go to your repo → **Actions** tab
2. Click **"Setup Cloudflare Resources"** workflow
3. Click **"Run workflow"** button → **"Run workflow"**
4. Wait 2-3 minutes ⏱️

**This will automatically:**
- ✅ Create D1 database `onehouroffers-db`
- ✅ Run schema.sql to create tables
- ✅ Create KV namespace `BOOKINGS_CACHE`
- ✅ Create R2 bucket `onehouroffers-files`
- ✅ Update `wrangler.toml` with all IDs
- ✅ Commit the updated config back to repo

### Step 4: Add Additional Secrets

Now add the rest of your secrets:

| Secret Name | Where to Get It | Required? |
|-------------|----------------|-----------|
| `STRIPE_SECRET_KEY` | Stripe Dashboard → API Keys | Yes |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Webhooks → Add endpoint | Yes |
| `SENDGRID_API_KEY` | SendGrid → API Keys | Yes (or use Resend) |
| `RESEND_API_KEY` | Resend → API Keys | Alternative to SendGrid |
| `HUBSPOT_API_KEY` | HubSpot → Private Apps | Optional |

### Step 5: Deploy Everything

Just push any change to `main` branch, or manually trigger:

1. Go to **Actions** tab
2. Run **"Deploy Worker to Cloudflare"** workflow
3. Run **"Deploy Frontend to Cloudflare Pages"** workflow

**Or simply:**
- Make any edit to your repo
- Commit and push to `main`
- Both workflows run automatically! 🎉

---

## 🎯 Workflow Summary

### 1️⃣ Setup Cloudflare Resources
**File:** `.github/workflows/setup-cloudflare.yml`  
**Trigger:** Manual only (workflow_dispatch)  
**What it does:**
- Creates D1 database
- Initializes database schema
- Creates KV namespace  
- Creates R2 bucket
- Updates wrangler.toml automatically

**When to run:** Once, during initial setup

### 2️⃣ Deploy Worker
**File:** `.github/workflows/deploy-worker.yml`  
**Trigger:** 
- Push to `main` (when `worker/**` files change)
- Manual trigger

**What it does:**
- Installs dependencies
- Deploys Worker to Cloudflare
- Sets all secrets automatically
- Makes API live at `api.onehouroffers.work`

**When to run:** Automatically on every push, or manually

### 3️⃣ Deploy Frontend
**File:** `.github/workflows/deploy-frontend.yml`  
**Trigger:**
- Push to `main` (when `frontend/**` files change)
- Manual trigger

**What it does:**
- Updates API URLs in HTML
- Deploys to Cloudflare Pages
- Makes site live at `onehouroffers.work`

**When to run:** Automatically on every push, or manually

---

## 🧪 Testing the Setup

After workflows complete:

**1. Check D1 Database:**
```bash
# In Cloudflare Dashboard → D1 → onehouroffers-db → Console
SELECT * FROM customers;
```
Should return empty results (no error) ✅

**2. Test API Health:**
```bash
curl https://api.onehouroffers.work/api/health
```
Should return:
```json
{
  "status": "healthy",
  "timestamp": "...",
  "version": "1.0.0"
}
```

**3. Test Frontend:**
Visit https://onehouroffers.work - Should load your site ✅

**4. Test Full Booking Flow:**
1. Click "Get Started" on any service
2. Fill out form
3. Submit
4. Check D1 for new booking entry

---

## 📊 Monitoring Workflows

**View Workflow Runs:**
- Repo → Actions tab
- Click on any workflow run
- View logs for each step

**Green checkmark** ✅ = Success  
**Red X** ❌ = Failed (click to see error logs)

---

## 🔧 Troubleshooting

**"Setup Cloudflare Resources" failed:**
- Check `CLOUDFLARE_API_TOKEN` is correct
- Verify token has "Edit Cloudflare Workers" permissions
- Check `CLOUDFLARE_ACCOUNT_ID` matches your account

**"Deploy Worker" failed:**
- Make sure "Setup Cloudflare Resources" ran successfully first
- Check all secrets are added
- Verify wrangler.toml has correct IDs

**"Deploy Frontend" failed:**
- Verify Cloudflare Pages project `onehouroffers-work` exists
- Check `CLOUDFLARE_API_TOKEN` has Pages permissions

**Resource already exists:**
- Workflows are idempotent - running twice is safe
- If resource exists, it will use the existing one

---

## 🎉 What You Get

After running all workflows:

✅ **Fully automated infrastructure**
- D1 database with schema
- KV namespace for caching
- R2 bucket for files
- Worker deployed at `api.onehouroffers.work`
- Frontend deployed at `onehouroffers.work`

✅ **Continuous deployment**
- Push code → Automatic deployment
- No manual steps needed
- Full CI/CD pipeline

✅ **Zero cost**
- Everything on Cloudflare free tier
- GitHub Actions free for public repos
- 2000 minutes/month for private repos

---

## 🚀 Next Steps

1. ✅ Run "Setup Cloudflare Resources" workflow
2. ✅ Add all GitHub secrets
3. ✅ Push your code
4. ✅ Workflows deploy everything automatically
5. 🎉 Your site is live!

**Questions?** Check workflow logs in the Actions tab!

---

## 📝 Advanced: Custom Workflows

You can create custom workflows for:
- **Database migrations** - Run schema updates
- **Testing** - Run tests before deployment
- **Staging environment** - Deploy to staging first
- **Scheduled tasks** - Backup databases, send reports

Example workflow trigger options:
```yaml
on:
  push:                    # On every push
  schedule:                # Run on schedule (cron)
  workflow_dispatch:       # Manual trigger
  pull_request:            # On PR creation
```

---

**Ready to automate?** Start with Step 1! 🚀
