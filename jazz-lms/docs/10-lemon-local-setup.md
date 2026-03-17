# Lemon Squeezy local setup (jazz-lms)

## 1) Create local env

Copy `.env.example` to `.env.local` and fill only what is needed to run checkout + webhook:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- `APP_URL=http://localhost:3000`

Lemon:

- `LEMON_SQUEEZY_API_KEY`
- `LEMON_SQUEEZY_WEBHOOK_SECRET`
- `LEMON_SQUEEZY_STORE_ID=317886`
- `LEMON_SQUEEZY_PRODUCT_ID=896872`
- `LEMON_SQUEEZY_VARIANT_ID=1411237`

Payment methods in app are currently limited to:

- Card
- PayPal

## 2) Start app

Run:

`npm run dev`

## 3) Local test modes

### Option A (provider bypass for QA)

Set `ENABLE_LOCAL_TEST_CHECKOUT=1` in `.env.local`.

Behavior:
- only works outside production
- only on localhost
- creates a synthetic purchase record without calling Lemon

### Option B (real Lemon checkout + webhook)

Use a tunnel so Lemon can reach your local webhook route.

Example with Cloudflare tunnel:

`cloudflared tunnel --url http://localhost:3000`

You will get an https URL such as:

`https://your-random-subdomain.trycloudflare.com`

In Lemon Webhooks, set callback to:

`https://your-random-subdomain.trycloudflare.com/api/webhooks/lemon-squeezy`

Enable events:
- `order_created`
- `order_refunded`

## 4) Verify webhook quickly

- In Lemon dashboard, send test event `order_created`
- Check app logs for HTTP 200 on `/api/webhooks/lemon-squeezy`
- Complete a test checkout and confirm `Purchase` is created in DB

## 5) Voucher behavior

- Voucher input on purchase screen validates against local DB
- If voucher is discount (not free), checkout sends `discount_code` to Lemon
- Voucher must exist in Lemon discounts with the same code
- `FREE_ACCESS` vouchers are handled directly by app (no provider payment)

## 6) Security notes

- Never commit `.env.local`
- If any API key was shared in chat/screenshots, rotate it before production
- Use a strong random `LEMON_SQUEEZY_WEBHOOK_SECRET` for production
