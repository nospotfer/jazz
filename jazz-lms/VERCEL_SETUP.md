# Vercel Environment Variables Setup Guide

## Overview
Your Supabase database is **IPv6-only**, which means Vercel (IPv4-only platform) must use the **Session Pooler** to connect.

Use **Node.js 20.x** in Vercel Project Settings -> General -> Node.js Version.

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

### 4. Lemon Squeezy API Key
**Name:** `LEMON_SQUEEZY_API_KEY`  
**Value:** Lemon Squeezy Dashboard → Settings → API
```
your_lemon_squeezy_api_key_here
```

### 5. Lemon Squeezy Store ID
**Name:** `LEMON_SQUEEZY_STORE_ID`  
**Value:** Your Lemon store id
```
317886
```

### 6. Lemon Squeezy Product ID
**Name:** `LEMON_SQUEEZY_PRODUCT_ID`  
**Value:** Your Lemon product id
```
896872
```

### 7. Lemon Squeezy Variant ID
**Name:** `LEMON_SQUEEZY_VARIANT_ID`  
**Value:** Your Lemon variant id
```
1411237
```

### 8. Lemon Squeezy Webhook Secret
**Name:** `LEMON_SQUEEZY_WEBHOOK_SECRET`  
**Value:** Lemon Squeezy Dashboard → Settings → Webhooks
```
your_lemon_squeezy_webhook_secret_here
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
- [ ] Lemon webhook points to `/api/webhooks/lemon-squeezy`
- [ ] Lemon webhook events enabled: `order_created`, `order_refunded`
- [ ] Database tables created in Supabase (see SUPABASE_DATABASE_SETUP.md)

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

