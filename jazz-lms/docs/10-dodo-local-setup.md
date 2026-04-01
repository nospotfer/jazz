# Dodo Payments local setup (jazz-lms)

## 1) Create local env

Copy `.env.example` to `.env.local` and fill only what is needed to run checkout + webhook:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- `APP_URL=http://localhost:3000`

Dodo:

- `DODO_PAYMENTS_API_KEY`
- `DODO_PAYMENTS_WEBHOOK_SECRET`
- `DODO_BUSINESS_ID=bus_xxx`
- `DODO_PRODUCT_ID=896872`
- `DODO_ENVIRONMENT=test_mode`

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
- creates a synthetic purchase record without calling Dodo

### Option B (real Dodo checkout + webhook)

Use a tunnel so Dodo can reach your local webhook route.

Example with Cloudflare tunnel:

`cloudflared tunnel --url http://localhost:3000`

You will get an https URL such as:

`https://your-random-subdomain.trycloudflare.com`

In Dodo Webhooks, set callback to:

`https://your-random-subdomain.trycloudflare.com/api/webhooks/dodo-jazzlms`

Enable events:

- `order_created`
- `order_refunded`

## 4) Verify webhook quickly

- In Dodo dashboard, send test event `order_created`
- Check app logs for HTTP 200 on `/api/webhooks/dodo-jazzlms`
- Complete a test checkout and confirm `Purchase` is created in DB

## 5) Voucher behavior

- Voucher input on purchase screen validates against local DB
- If voucher is discount (not free), checkout sends `discount_code` to Dodo
- Voucher must exist in Dodo discounts with the same code
- `FREE_ACCESS` vouchers are handled directly by app (no provider payment)

## 6) Security notes

- Never commit `.env.local`
- If any API key was shared in chat/screenshots, rotate it before production
- Use a strong random `DODO_PAYMENTS_WEBHOOK_SECRET` for production

## 7) Payment test agents

- Backend payment validation:
  - `npm run test:payments:backend`
- Frontend real Dodo checkout validation:
  - `npm run test:payments:frontend:real`
- Full critical pass (backend + frontend real + build):
  - `npm run test:payments:all`
