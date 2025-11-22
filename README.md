# One Hour Offers

🚀 Fast, professional digital solutions delivered in 60 minutes or less.

## 🌐 Live Site
- **Frontend:** https://onehouroffers.work
- **API:** https://api.onehouroffers.work

---

## ⚡ Quick Start (Automated Setup)

### 1. Upload to GitHub

Upload this entire folder to your GitHub repository at `asiakay/onehouroffers.work`

### 2. Add GitHub Secrets

Go to **Settings** → **Secrets and variables** → **Actions** and add:

| Secret Name | Where to Get It |
|-------------|----------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare → Profile → API Tokens → Create Token |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare → Workers & Pages → Account ID |

### 3. Run Setup Workflow

1. Go to **Actions** tab
2. Click **"Setup Cloudflare Resources"**
3. Click **"Run workflow"** → **"Run workflow"**
4. Wait 2-3 minutes

This automatically creates:
- ✅ D1 Database
- ✅ KV Namespace
- ✅ R2 Bucket
- ✅ Updates wrangler.toml with IDs

### 4. Add Additional Secrets

After setup completes, add these secrets:

| Secret Name | Required? |
|-------------|-----------|
| `STRIPE_SECRET_KEY` | Yes |
| `STRIPE_WEBHOOK_SECRET` | Yes |
| `SENDGRID_API_KEY` or `RESEND_API_KEY` | Yes |
| `HUBSPOT_API_KEY` | Optional |

### 5. Deploy

Push any change to `main` branch, or manually trigger:
- **Deploy Worker to Cloudflare** workflow
- **Deploy Frontend to Cloudflare Pages** workflow

🎉 **Done!** Your site is live!

---

## 📁 Project Structure

```
onehouroffers.work/
├── .github/workflows/           # GitHub Actions automation
│   ├── setup-cloudflare.yml    # Creates D1, KV, R2
│   ├── deploy-worker.yml       # Deploys API
│   └── deploy-frontend.yml     # Deploys frontend
├── frontend/
│   └── index.html              # Landing page with booking form
├── worker/
│   ├── src/
│   │   ├── index.js           # Main API entry point
│   │   ├── services/          # Email, Stripe, CRM, Database
│   │   └── utils/             # Validation & responses
│   ├── package.json
│   └── wrangler.toml          # Cloudflare configuration
├── database/
│   └── schema-d1-clean.sql    # Database schema
└── docs/                       # Documentation
    ├── SETUP_GUIDE.md
    ├── QUICK_REFERENCE.md
    ├── AUTOMATION_GUIDE.md
    └── CLOUDFLARE_INTEGRATION_GUIDE.md
```

---

## 🛠️ Tech Stack

- **Cloudflare Pages** - Frontend hosting
- **Cloudflare Workers** - Serverless API
- **D1 Database** - SQLite database (5GB free)
- **KV Storage** - Caching & rate limiting
- **R2 Storage** - File storage (10GB free)
- **Stripe** - Payment processing
- **SendGrid/Resend** - Email delivery
- **HubSpot/Salesforce/Pipedrive** - CRM integration

---

## 💰 Cost

**$0/month** on Cloudflare free tier!

Includes:
- ✅ 100,000 Worker requests/day
- ✅ 5GB D1 database storage
- ✅ 100,000 KV reads/day
- ✅ 10GB R2 storage + 1M reads/month
- ✅ Unlimited Pages deployments

---

## 📚 Documentation

- **[AUTOMATION_GUIDE.md](AUTOMATION_GUIDE.md)** - Complete automated setup guide
- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Manual setup instructions
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Checklists & quick commands
- **[CLOUDFLARE_INTEGRATION_GUIDE.md](CLOUDFLARE_INTEGRATION_GUIDE.md)** - Technical deep dive

---

## 🧪 Testing

After deployment:

```bash
# Test API health
curl https://api.onehouroffers.work/api/health

# Test booking submission
curl -X POST https://api.onehouroffers.work/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@onehouroffers.work",
    "phone": "555-1234",
    "serviceId": "listing_enhancement",
    "serviceName": "Listing Enhancement Pack",
    "servicePrice": "250-500",
    "preferredDate": "2024-12-25"
  }'
```

---

## 🔧 Local Development (Optional)

```bash
# Install dependencies
cd worker
npm install

# Run locally
npm run dev

# Worker will be available at http://localhost:8787
```

---

## 🆘 Support

**Common Issues:**
- Check GitHub Actions logs for deployment errors
- Verify all secrets are added correctly
- Ensure Cloudflare resources were created successfully

**View logs:**
- Cloudflare Dashboard → Workers & Pages → Your worker → Logs
- GitHub → Actions tab → Click on workflow run

---

## 📝 License

MIT

---

**Ready to launch?** Start with the [Automation Guide](AUTOMATION_GUIDE.md)! 🚀
