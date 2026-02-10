# Vercel Environment Variables Setup Guide

## Overview
Your Supabase database is **IPv6-only**, which means Vercel (IPv4-only platform) must use the **Session Pooler** to connect.

---

## Required Environment Variables

### How to Add Environment Variables in Vercel:
1. Go to your Vercel project dashboard
2. Click on "Settings" tab
3. Click on "Environment Variables" in the left sidebar
4. Add each variable below
5. **For each variable, select: Production ☑, Preview ☑, and Development ☑**

---

## Variables to Add (6 total):

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
eyJhbGc...your-anon-key
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

### 4. Stripe Secret Key
**Name:** `STRIPE_SECRET_KEY`  
**Value:** Get from Stripe Dashboard → Developers → API keys
```
sk_test_your_secret_key_here
```

### 5. Stripe Publishable Key
**Name:** `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`  
**Value:** Get from Stripe Dashboard → Developers → API keys
```
pk_test_your_publishable_key_here
```

### 6. Stripe Webhook Secret
**Name:** `STRIPE_WEBHOOK_SECRET`  
**Value:** Get from Stripe Dashboard → Developers → Webhooks
```
whsec_your_webhook_secret_here
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

- [ ] All 6 environment variables added in Vercel
- [ ] Each variable has Production, Preview, AND Development selected
- [ ] DATABASE_URL uses Session Pooler host (ends with `.pooler.supabase.com`)
- [ ] DATABASE_URL user format is: `postgres.{your-project-ref}`
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

