# ⚡ Quick Reference Card

## 🌐 Your Domains

✅ **Frontend (Already Set Up):**
- https://onehouroffers.work
- https://onehouroffers-work.pages.dev

🔧 **API (Need to Set Up):**
- https://api.onehouroffers.work

---

## 📋 Setup Checklist

### In Cloudflare Dashboard:

- [ ] Create Worker named `onehouroffers-api`
- [ ] Add custom domain `api.onehouroffers.work` to Worker
- [ ] Create D1 database: `onehouroffers-db`
- [ ] Run schema.sql in D1 Console
- [ ] Create KV namespace: `ONEHOUROFFERS_CACHE`
- [ ] Create R2 bucket: `onehouroffers-files`
- [ ] Copy all IDs to `worker/wrangler.toml`

### In GitHub:

- [ ] Add secret: `CLOUDFLARE_API_TOKEN`
- [ ] Add secret: `CLOUDFLARE_ACCOUNT_ID`
- [ ] Add secret: `STRIPE_SECRET_KEY`
- [ ] Add secret: `STRIPE_WEBHOOK_SECRET`
- [ ] Add secret: `SENDGRID_API_KEY` or `RESEND_API_KEY`
- [ ] Upload all project files
- [ ] Push to main branch

### External Services:

- [ ] Create Stripe webhook pointing to `https://api.onehouroffers.work/api/webhooks/stripe`
- [ ] Verify email sender domain in SendGrid/Resend
- [ ] (Optional) Set up HubSpot/Salesforce/Pipedrive CRM

---

## 🎯 File Locations

Download these from `/mnt/user-data/outputs/`:

**Configuration:**
- `worker-wrangler.toml` → Save as `worker/wrangler.toml`
- `schema.sql` → Save as `database/schema.sql`

**GitHub Actions:**
- `deploy-worker.yml` → Save as `.github/workflows/deploy-worker.yml`
- `deploy-frontend.yml` → Save as `.github/workflows/deploy-frontend.yml`

**Worker Code:**
- `worker-index.js` → Save as `worker/src/index.js`
- `worker-database.js` → Save as `worker/src/services/database.js`
- `worker-email.js` → Save as `worker/src/services/email.js`
- `worker-services.js` → Split into `worker/src/services/stripe.js` and `crm.js`
- `worker-utils.js` → Split into `worker/src/utils/responses.js` and `validation.js`

**Frontend:**
- `one-hour-services-library.html` → Save as `frontend/one-hour-services-library.html`

**Package Files:**
Create `worker/package.json`:
```json
{
  "name": "onehouroffers-worker",
  "version": "1.0.0",
  "main": "src/index.js",
  "dependencies": {
    "itty-router": "^4.0.0"
  },
  "devDependencies": {
    "wrangler": "^3.0.0"
  }
}
```

---

## 🧪 Test Commands

```bash
# Test frontend
curl https://onehouroffers.work

# Test API health
curl https://api.onehouroffers.work/api/health

# Test booking
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

## 📚 Documentation Files

- **SETUP_GUIDE.md** - Step-by-step setup instructions
- **CLOUDFLARE_INTEGRATION_GUIDE.md** - Technical architecture overview
- **DEPLOYMENT_README.md** - Complete deployment guide

---

## 🆘 Quick Troubleshooting

**Frontend not updating?**
- Check Cloudflare Pages deployment logs
- Clear browser cache
- Wait 1-2 minutes for CDN propagation

**API not responding?**
- Verify Worker is deployed
- Check custom domain is added in Triggers
- Review Worker logs in dashboard

**Database errors?**
- Confirm D1 database ID in wrangler.toml
- Check schema.sql was executed
- Verify database binding name is "DB"

**Email not sending?**
- Verify API key in GitHub secrets
- Check EMAIL_PROVIDER in wrangler.toml
- Confirm FROM_EMAIL is verified in email service

---

## 💰 Cost Breakdown

**Cloudflare Free Tier:**
- ✅ 100,000 Worker requests/day
- ✅ 5GB D1 database storage
- ✅ 100,000 KV reads/day
- ✅ 10GB R2 storage + 1M reads/month
- ✅ Unlimited Pages deployments

**Estimated Monthly Cost:** $0 (everything included in free tier!)

**Paid only if you exceed:**
- 100k requests/day = ~3M requests/month
- Need more than 5GB database storage
- Need advanced features

---

## 🚀 Deployment Flow

```
1. Push code to GitHub main branch
   ↓
2. GitHub Actions triggered automatically
   ↓
3. Worker deployed to Cloudflare
   ↓
4. Frontend deployed to Pages
   ↓
5. Secrets set automatically
   ↓
6. Live at onehouroffers.work! 🎉
```

---

## 📞 Support Resources

- Cloudflare Docs: https://developers.cloudflare.com
- Stripe Docs: https://stripe.com/docs
- SendGrid Docs: https://docs.sendgrid.com
- Cloudflare Community: https://community.cloudflare.com

---

**Ready to deploy? Start with SETUP_GUIDE.md!**
