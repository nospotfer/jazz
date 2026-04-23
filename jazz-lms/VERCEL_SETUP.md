# Vercel Environment Variables Setup Guide

## Overview

Your Supabase database is **IPv6-only**, which means Vercel (IPv4-only platform) must use the **Session Pooler** to connect.

Use **Node.js 24.x** in Vercel Project Settings -> General -> Node.js Version.

> For full go-live (including Mux, PDFs, admin roles and messaging), use: `PRODUCTION_GO_LIVE_CHECKLIST.md`.

---

## Required Environment Variables

### How to Add Environment Variables in Vercel:

1. Go to your Vercel project dashboard
2. Click on "Settings" tab
3. Click on "Environment Variables" in the left sidebar
4. Add each variable below
5. **For each variable, select: Production ☑, Preview ☑, and Development ☑**

---

## Variables to Add (core for app/auth/checkout):

### 1. Supabase URL

**Name:** `NEXT_PUBLIC_SUPABASE_URL`
**Value:** Get from your Supabase project settings

```
https://your-project-ref.supabase.co
```

### 2. Supabase Anon Key

**Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
**Value:** Get from Supabase Dashboard → Settings → API → Project API keys → anon public

```
your_supabase_anon_key
```

### 3. Database URL (Session Pooler) 🔴 CRITICAL

**Name:** `DATABASE_URL`
**Value:** Get from Supabase Dashboard → Settings → Database → Connection Pooling → Session

```
postgresql://postgres.your-project-ref:[YOUR-PASSWORD]@aws-0-region.pooler.supabase.com:5432/postgres
```

**⚠️ Important:**

- Must use the **Session Pooler** host (ends with `.pooler.supabase.com`)
- User format is: `postgres.{your-project-ref}`
- Your Supabase database is IPv6-only, Vercel is IPv4-only
- Session Pooler bridges this compatibility gap
- Replace `[YOUR-PASSWORD]` with your actual database password

### 4. Dodo Payments API Key

**Name:** `DODO_PAYMENTS_API_KEY`
**Value:** Dodo Payments Dashboard → Settings → API

```
your_dodo_payments_api_key_here
```

### 5. Dodo Payments Business ID

**Name:** `DODO_BUSINESS_ID`
**Value:** Your Dodo business id

```
bus_xxx
```

### 6. Dodo Payments Product ID

**Name:** `DODO_PRODUCT_ID`
**Value:** Your Dodo product id

```
896872
```

### 7. Dodo Payments Environment

**Name:** `DODO_ENVIRONMENT`
**Value:** `test_mode` for local/staging, `live_mode` for production

```
test_mode
```

### 8. Dodo Payments Webhook Secret

**Name:** `DODO_PAYMENTS_WEBHOOK_SECRET`
**Value:** Dodo Payments Dashboard → Settings → Webhooks

```
your_dodo_payments_webhook_secret_here
```

---

## After Adding All Variables

1. Go to the **"Deployments"** tab in Vercel
2. Click the three dots (...) next to your latest deployment
3. Click **"Redeploy"**
4. Wait for the deployment to complete

---

## Why Session Pooler?

From your Supabase dashboard screenshot:

- **IPv6-only database** - Your Supabase database doesn't support IPv4
- **Vercel is IPv4-only** - Cannot directly connect to IPv6 databases
- **Solution:** Session Pooler (port 6543) provides IPv4 → IPv6 translation
- **Bonus:** Also provides connection pooling for serverless efficiency

---

## Checklist

Before deploying, verify:

- [ ] All required environment variables added in Vercel
- [ ] Each variable has Production, Preview, AND Development selected
- [ ] DATABASE_URL uses Session Pooler host (ends with `.pooler.supabase.com`)
- [ ] DATABASE_URL user format is: `postgres.{your-project-ref}`
- [ ] Dodo webhook points to `/api/webhooks/dodo-jazzlms`
- [ ] Dodo webhook events enabled: `order_created`, `order_refunded`
- [ ] Database tables created in Supabase (see SUPABASE_DATABASE_SETUP.md)

---

## Admin Analytic Metrics Dashboard — Google Analytics 4 (optional)

The admin metrics panel at `/admin/stats` can integrate with GA4 for traffic
data. All three variables below are **server-only** (never prefix with
`NEXT_PUBLIC_`). If any is missing, the panel degrades gracefully and shows
"Indisponível" for the traffic KPI while keeping all database-sourced KPIs
working normally.

### `GA4_PROPERTY_ID`

- **Format:** `properties/123456789`
- **Where:** GA4 Admin → Property Settings → Property ID.

### `GA4_SERVICE_ACCOUNT_EMAIL`

- **Format:** `jazz-metrics@your-project.iam.gserviceaccount.com`
- **Where:** Google Cloud → IAM & Admin → Service Accounts. The account must
  be granted the **Viewer** role on the GA4 property (GA4 Admin → Property
  Access Management).

### `GA4_PRIVATE_KEY`

- **Format:** full PEM string. Escape newlines as `\n` when pasting into the
  Vercel dashboard (the runtime restores them before the GA4 client uses the
  key).
- **Where:** generated together with the service account key JSON; copy the
  `private_key` field value.

> Reference documents: [docs/painel-metricas-admin.md](docs/painel-metricas-admin.md)
> and [docs/painel-metricas-admin-estrutura.md](docs/painel-metricas-admin-estrutura.md).

---

## Heatmap — Microsoft Clarity (optional)

Public-area heatmap and session recording for 50+ UX research. The script
only loads when the env below is present, and is **never** injected under
`/admin/*` (admin activity is intentionally excluded to avoid recording
operator data).

### `NEXT_PUBLIC_CLARITY_PROJECT_ID`

- **Format:** 10-character alphanumeric ID (ex.: `abc123xyz0`).
- **Where:** https://clarity.microsoft.com/ → create project → Settings →
  Setup → copy the project ID from the install snippet.
- **Scope:** Applies to landing, auth, courses, and student dashboard only.
  Absence disables the feature silently — no console errors.

---

## Google Analytics 4 — client-side gtag (optional)

Complements the server-side GA4 Data API already used by `/admin/stats` (via
`GA4_PROPERTY_ID` / `GA4_SERVICE_ACCOUNT_EMAIL` / `GA4_PRIVATE_KEY`). This
client-side loader collects real browser traffic. Like Clarity, it is
**never** injected on `/admin/*` and is **fail-safe**: without the env below
nothing is loaded.

### `NEXT_PUBLIC_GA_MEASUREMENT_ID`

- **Format:** `G-XXXXXXXXXX` (GA4 Measurement ID, not the tracking ID).
- **Where:** https://analytics.google.com/ → Admin → Data Streams →
  select the Jazz LMS stream → copy Measurement ID.
- **Behavior:** `anonymize_ip: true` enabled by default (GDPR-friendly).
- **Scope:** Public area only (landing, auth, courses, student dashboard).

---

## Troubleshooting

### Still getting database connection errors?

1. **Double-check DATABASE_URL**
   - Must use Session Pooler host (should end with `.pooler.supabase.com`)
   - User must be: `postgres.{your-project-ref}` (not just `postgres`)
   - Port is 5432 (the Session Pooler uses this port)
   - Copy the connection string from Supabase Dashboard → Database → Connection Pooling → Session

2. **Verify Supabase database is running**
   - Check Supabase dashboard
   - Database shouldn't be paused

3. **Ensure tables are created**
   - Run the SQL from `supabase-migration.sql` in Supabase SQL Editor
   - Verify in Supabase Table Editor

4. **Check Vercel deployment logs**
   - Go to Deployments → Click on deployment → View logs
   - Look for specific error messages

---

## Next Steps

1. ✅ Add all environment variables in Vercel
2. ✅ Run database migration in Supabase (see SUPABASE_DATABASE_SETUP.md)
3. ✅ Redeploy on Vercel
4. ✅ Test your application

**Ready to deploy!** 🚀
