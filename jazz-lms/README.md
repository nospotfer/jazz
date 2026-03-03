# La Cultura del Jazz - LMS Platform

This is a custom, high-performance video course platform built with Next.js, Tailwind CSS, Shadcn UI, Supabase, Prisma, Mux, and Stripe.

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/jazz-lms.git
cd jazz-lms
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root of the project and add the following environment variables:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL="postgresql://user:password@host:port/database"

# Stripe
STRIPE_SECRET_KEY=YOUR_STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=YOUR_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=YOUR_STRIPE_WEBHOOK_SECRET
```

### 4. Seed the database

Run the following command to seed the database with the course structure:

```bash
npx prisma db push
npm run seed
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Google OAuth URLs (Required)

For Google login/register to work, configure both Supabase and Google Console URLs exactly.

### Supabase Dashboard

Go to **Authentication → URL Configuration** and set:

- **Site URL (dev):** `http://localhost:3000`
- **Additional Redirect URLs:**
	- `http://localhost:3000/auth/callback`
	- `https://your-domain.com/auth/callback`
	- `https://*.vercel.app/auth/callback`

### Google Cloud Console

Go to **APIs & Services → Credentials → OAuth 2.0 Client IDs** and set:

- **Authorized JavaScript origins:**
	- `https://feavujcllgbzlvdvkkxx.supabase.co`
- **Authorized redirect URIs:**
	- `https://feavujcllgbzlvdvkkxx.supabase.co/auth/v1/callback`

> Note: For Supabase OAuth providers, Google redirects back to Supabase (`/auth/v1/callback`), and Supabase then redirects to your app callback (`/auth/callback`).

## Stripe Sandbox

Use test mode (no real charges) with `sk_test` / `pk_test` keys.

```bash
# 1) Validate Stripe sandbox env + auth
npm run stripe:sandbox:check

# 2) Start app locally
npm run dev

# 3) Simulate a signed Stripe webhook locally
npm run stripe:sandbox:webhook -- --webhook-url=http://localhost:3000/api/webhooks/stripe --cleanup

# 4) Run full sandbox check in one command (requires app running)
npm run stripe:sandbox:all
```

## Deployment

We recommend deploying this project to [Vercel](https://vercel.com/), the creators of Next.js. Vercel provides a seamless deployment experience for Next.js applications.

### 1. Push to GitHub

Push your code to a GitHub repository.

### 2. Import project on Vercel

Go to your Vercel dashboard and import the project from your GitHub repository.

### 3. Configure environment variables

Add the environment variables from your `.env` file to the Vercel project settings.

### 4. Deploy

Vercel will automatically build and deploy your application.

## Security

Hardening and operational security checklist: see `SECURITY_HARDENING.md`.
