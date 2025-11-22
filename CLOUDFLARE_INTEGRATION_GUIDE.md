# One-Hour Services Backend - Cloudflare Integration Guide

## Overview
Deploy your Node.js booking backend to Cloudflare's edge network using Workers, D1 (database), KV (cache), and R2 (file storage).

## Architecture

```
Frontend (Cloudflare Pages)
    ↓
Cloudflare Workers (API)
    ↓
├── D1 Database (bookings, customers)
├── KV Namespace (sessions, cache)
├── R2 Bucket (uploads, invoices)
└── External APIs (Stripe, SendGrid, CRM)
```

## 1. PROJECT STRUCTURE

```
one-hour-services/
├── .github/
│   └── workflows/
│       ├── deploy-frontend.yml
│       └── deploy-worker.yml
├── frontend/
│   └── one-hour-services-library.html
├── worker/
│   ├── src/
│   │   ├── index.js              # Main worker entry
│   │   ├── handlers/
│   │   │   ├── bookings.js       # Booking endpoints
│   │   │   ├── payments.js       # Stripe integration
│   │   │   └── webhooks.js       # Webhook handlers
│   │   ├── services/
│   │   │   ├── email.js          # Email templates & sending
│   │   │   ├── database.js       # D1 queries
│   │   │   └── crm.js            # CRM integration
│   │   └── utils/
│   │       ├── validation.js     # Input validation
│   │       └── responses.js      # Response helpers
│   ├── wrangler.toml             # Cloudflare config
│   └── package.json
├── database/
│   └── schema.sql                # D1 database schema
└── README.md
```

## 2. CLOUDFLARE RESOURCES SETUP

### D1 Database (for storing bookings)

**Schema (database/schema.sql):**
```sql
-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    business_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id TEXT UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL,
    service_id TEXT NOT NULL,
    service_name TEXT NOT NULL,
    service_price TEXT NOT NULL,
    preferred_date DATE NOT NULL,
    preferred_time TEXT,
    status TEXT DEFAULT 'pending',
    message TEXT,
    payment_status TEXT DEFAULT 'unpaid',
    payment_intent_id TEXT,
    crm_contact_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL,
    payment_intent_id TEXT UNIQUE NOT NULL,
    amount INTEGER NOT NULL,
    currency TEXT DEFAULT 'usd',
    status TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

-- Create indexes
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_payments_booking_id ON payments(booking_id);
```

**Setup Commands:**
```bash
# Create D1 database
wrangler d1 create one-hour-services-db

# Apply schema
wrangler d1 execute one-hour-services-db --file=./database/schema.sql
```

### KV Namespace (for caching)

**Use cases:**
- Rate limiting per IP
- Session management
- Caching service data
- Temporary booking holds

**Setup:**
```bash
# Create KV namespace for production
wrangler kv:namespace create "BOOKINGS_CACHE"

# Create KV namespace for preview/staging
wrangler kv:namespace create "BOOKINGS_CACHE" --preview
```

### R2 Bucket (for file storage)

**Use cases:**
- Invoice PDFs
- Service images
- Customer uploads
- Email attachments

**Setup:**
```bash
# Create R2 bucket
wrangler r2 bucket create one-hour-services-files
```

## 3. WRANGLER CONFIGURATION

**worker/wrangler.toml:**
```toml
name = "one-hour-services-api"
main = "src/index.js"
compatibility_date = "2024-01-01"
node_compat = true

# Account ID (get from Cloudflare dashboard)
account_id = "YOUR_ACCOUNT_ID"

# D1 Database binding
[[d1_databases]]
binding = "DB"
database_name = "one-hour-services-db"
database_id = "YOUR_D1_DATABASE_ID"

# KV Namespace binding
[[kv_namespaces]]
binding = "CACHE"
id = "YOUR_KV_NAMESPACE_ID"

# R2 Bucket binding
[[r2_buckets]]
binding = "FILES"
bucket_name = "one-hour-services-files"

# Environment variables (secrets set via CLI)
[vars]
FRONTEND_URL = "https://your-site.pages.dev"
ENVIRONMENT = "production"

# CORS settings
[env.production]
routes = [
  { pattern = "api.your-domain.com/*", zone_name = "your-domain.com" }
]

[env.staging]
name = "one-hour-services-api-staging"
vars = { ENVIRONMENT = "staging" }
```

## 4. WORKER CODE

**worker/src/index.js:**
```javascript
import { Router } from 'itty-router';
import { handleBooking } from './handlers/bookings';
import { handlePayment, handleWebhook } from './handlers/payments';
import { corsHeaders, errorResponse } from './utils/responses';

const router = Router();

// CORS preflight
router.options('*', () => new Response(null, { headers: corsHeaders }));

// Health check
router.get('/api/health', () => {
  return new Response(JSON.stringify({
    status: 'healthy',
    timestamp: new Date().toISOString()
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});

// Booking endpoints
router.post('/api/bookings', handleBooking);
router.get('/api/bookings/:id', async (request, env) => {
  // Get booking by ID
});

// Payment endpoints
router.post('/api/create-payment-intent', handlePayment);
router.post('/api/webhooks/stripe', handleWebhook);

// Services endpoint
router.get('/api/services', async (request, env) => {
  // Could cache in KV for performance
  const cached = await env.CACHE.get('services', 'json');
  if (cached) return new Response(JSON.stringify(cached), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
  
  // Fetch and cache
  // ...
});

// 404 handler
router.all('*', () => errorResponse('Not found', 404));

export default {
  async fetch(request, env, ctx) {
    return router.handle(request, env, ctx).catch(err => {
      console.error('Worker error:', err);
      return errorResponse(err.message, 500);
    });
  }
};
```

## 5. GITHUB ACTIONS WORKFLOWS

**Deploy Worker (.github/workflows/deploy-worker.yml):**
```yaml
name: Deploy Worker to Cloudflare

on:
  push:
    branches:
      - main
    paths:
      - 'worker/**'
      - '.github/workflows/deploy-worker.yml'
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy Worker
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        working-directory: ./worker
        run: npm ci

      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          workingDirectory: ./worker
          command: deploy --env production

      - name: Set secrets
        working-directory: ./worker
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        run: |
          npx wrangler secret put STRIPE_SECRET_KEY --env production <<< "${{ secrets.STRIPE_SECRET_KEY }}"
          npx wrangler secret put STRIPE_WEBHOOK_SECRET --env production <<< "${{ secrets.STRIPE_WEBHOOK_SECRET }}"
          npx wrangler secret put SENDGRID_API_KEY --env production <<< "${{ secrets.SENDGRID_API_KEY }}"
          npx wrangler secret put CRM_API_KEY --env production <<< "${{ secrets.CRM_API_KEY }}"
```

**Deploy Frontend (.github/workflows/deploy-frontend.yml):**
```yaml
name: Deploy Frontend to Cloudflare Pages

on:
  push:
    branches:
      - main
    paths:
      - 'frontend/**'
      - '.github/workflows/deploy-frontend.yml'
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy Frontend
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: one-hour-services
          directory: frontend
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

## 6. REQUIRED SECRETS

Add these to your GitHub repository secrets (Settings → Secrets → Actions):

```
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
CLOUDFLARE_ACCOUNT_ID=your_account_id
STRIPE_SECRET_KEY=sk_test_or_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
SENDGRID_API_KEY=SG.xxx (or other email service)
CRM_API_KEY=your_crm_api_key
```

## 7. LOCAL DEVELOPMENT

**worker/package.json:**
```json
{
  "name": "one-hour-services-worker",
  "version": "1.0.0",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "deploy:staging": "wrangler deploy --env staging"
  },
  "dependencies": {
    "itty-router": "^4.0.0"
  },
  "devDependencies": {
    "wrangler": "^3.0.0"
  }
}
```

**Start local development:**
```bash
cd worker
npm install
npm run dev
# Worker will be available at http://localhost:8787
```

## 8. DEPLOYMENT STEPS

### Initial Setup (One-time):

1. **Install Wrangler locally** (optional, for testing):
   ```bash
   npm install -g wrangler
   wrangler login
   ```

2. **Create Cloudflare resources via GitHub Actions or Wrangler CLI**:
   ```bash
   # D1 Database
   wrangler d1 create one-hour-services-db
   wrangler d1 execute one-hour-services-db --file=./database/schema.sql
   
   # KV Namespace
   wrangler kv:namespace create "BOOKINGS_CACHE"
   
   # R2 Bucket
   wrangler r2 bucket create one-hour-services-files
   ```

3. **Update wrangler.toml** with your IDs from step 2

4. **Set GitHub secrets** (listed in section 6)

5. **Push to GitHub** - workflows will auto-deploy

### Continuous Deployment:

- Push to `main` branch → Auto-deploys via GitHub Actions
- Changes to `/worker/**` → Deploys Worker
- Changes to `/frontend/**` → Deploys Frontend

## 9. API ENDPOINTS

Once deployed, your API will be available at:

```
https://one-hour-services-api.your-subdomain.workers.dev/

Endpoints:
- GET  /api/health
- POST /api/bookings
- GET  /api/bookings/:id
- POST /api/create-payment-intent
- POST /api/webhooks/stripe
- GET  /api/services
```

## 10. MONITORING & LOGS

View logs in Cloudflare dashboard:
- Workers → one-hour-services-api → Logs
- D1 → one-hour-services-db → Metrics
- Pages → one-hour-services → Deployment logs

## 11. COST ESTIMATE

**Cloudflare Free Tier includes:**
- Workers: 100,000 requests/day
- D1: 5 GB storage, 5M reads/day
- KV: 100,000 reads/day, 1,000 writes/day
- R2: 10 GB storage, 1M reads/month
- Pages: Unlimited requests

**Paid (if you exceed free tier):**
- Workers: $5/10M requests
- D1: $0.75/GB storage
- Very cost-effective at scale

## 12. TESTING

**Test the API:**
```bash
# Health check
curl https://your-worker.workers.dev/api/health

# Create booking
curl -X POST https://your-worker.workers.dev/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "555-1234",
    "serviceId": "listing_enhancement",
    "serviceName": "Listing Enhancement Pack",
    "servicePrice": "250-500",
    "preferredDate": "2024-12-15"
  }'
```

## 13. PRODUCTION CHECKLIST

- [ ] Set up custom domain for Workers API
- [ ] Configure custom domain for Pages frontend
- [ ] Add rate limiting in Workers
- [ ] Set up error monitoring (Sentry/LogFlare)
- [ ] Configure email service (SendGrid/Resend)
- [ ] Set up Stripe webhooks
- [ ] Test payment flow end-to-end
- [ ] Add database backups strategy
- [ ] Configure WAF rules if needed
- [ ] Set up analytics

---

## QUICK START COMMAND

For GitHub Actions deployment (no terminal access), just:

1. Create repository with this structure
2. Add GitHub secrets
3. Push to main branch
4. GitHub Actions handles everything automatically!

The workflows will:
- ✅ Install dependencies
- ✅ Deploy Worker to Cloudflare
- ✅ Deploy Frontend to Pages
- ✅ Set environment secrets
- ✅ Run tests (if configured)
