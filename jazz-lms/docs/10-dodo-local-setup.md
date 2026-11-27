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
- `DODO_PRODUCT_ID=<test-mode product ID for this course>`
- `DODO_ENVIRONMENT=test_mode`

The hosted Dodo checkout controls available payment methods for the customer's
region and the merchant's configuration. The app does not force a method.

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

- `payment.succeeded`
- `refund.succeeded`
- `refund.failed`
- `dispute.opened`, `dispute.challenged`, `dispute.accepted`, `dispute.expired`, `dispute.lost`
- `dispute.won`, `dispute.cancelled`

Use a test-mode endpoint and its actual signing secret. Dodo uses Standard
Webhooks: remove the optional `whsec_` prefix and base64-decode the secret to
obtain the HMAC key. Do not replace the provider secret with an arbitrary password.
See [Dodo webhook verification](https://docs.dodopayments.com/developer-resources/webhooks).

## 4) Verify webhook quickly

- In the test-mode Dodo dashboard, send a `payment.succeeded` example that includes
  metadata for an isolated local user and course.
- Check app logs for HTTP 200 on `/api/webhooks/dodo-jazzlms`
- Complete a test checkout and confirm `Purchase` is created in DB

`scripts/test-dodo-webhook-local.sh` also generates a synthetic signed paid event.
It writes purchase/accounting rows in whichever database the target app uses.
Run it only against a local app configured with a disposable test database.

## 5) Voucher behavior

- Voucher input on purchase screen validates against local DB
- If voucher is discount (not free), checkout sends `discount_code` to Dodo
- Provider codes are restricted to this project's `DODO_PRODUCT_ID` and carry
  local usage limits. Fixed discounts use an explicit EUR currency option;
  percentages use basis points (20% = 2000).
- Deactivation expires a managed provider discount before changing the local
  flag. Re-enabling restores the configured expiry and preserves provider usage.
- Existing unowned or unrestricted provider codes require an ownership review;
  a duplicate-code response is not proof of successful synchronization.
- `FREE_ACCESS` vouchers are handled directly by app (no provider payment)

## 6) Security notes

- Never commit `.env.local`
- Copy `DODO_PAYMENTS_WEBHOOK_SECRET` from the relevant Dodo webhook endpoint.
- A successful refund revokes course access under the existing product policy,
  including partial refunds. Failed refunds and won/cancelled disputes do not
  revoke. Changing partial-refund policy requires a separate product decision.
- The authenticated webhook ledger prevents a refunded payment from granting
  access again; a different successful payment can grant a legitimate repurchase.
- Payment listing resolves customers by email, then uses Dodo's documented
  `customer_id` filter and verifies each payment owner locally.
- Voucher accounting uses actual `discounts[]` / `discount_id`, matched to a local
  voucher. Checkout metadata alone cannot consume a voucher. Missing applied
  discount detail preserves paid access and leaves the voucher unassigned.

Before a production release, verify the actual Dodo product's price, currency,
tax-inclusion setting, adaptive-currency behavior, discount ownership, and test/live
webhook endpoints. The local schema has no purchase currency or tax fields and
currently compares metadata `originalPrice` with provider totals. Those values
must share a currency and a gross/net basis before revenue or discount reports
can be described as reconciled. A list-only payment snapshot may lack actual
discount detail; retrieve the payment before attributing voucher usage.

`Purchase` also doubles as the course entitlement, so a successful refund deletes
the purchase row and its local discount/redemption records. The authenticated
webhook ledger retains provider events. Durable sale/refund reporting requires a
separate financial-ledger/schema decision; do not treat remaining purchase rows
as a complete transaction history.

## 7) Payment test agents

Provider-contract and entitlement regressions use mocks and make no real charges:

```bash
npx vitest run tests/unit/dodo-provider.test.ts tests/unit/dodo-events.test.ts tests/unit/dodo-list-payments.test.ts tests/unit/dodo-entitlement-ledger.test.ts tests/unit/voucher-provider-sync.test.ts tests/integration/purchases-route.test.ts tests/integration/dodo-webhook-route.test.ts tests/integration/admin-voucher-provider-lifecycle.test.ts
```

The opt-in PostgreSQL suite also verifies real transactions and advisory locks.
Its URL guard accepts only the disposable local `jazz_maintenance` database on
port 55432. It creates uniquely scoped fixtures and removes only its own rows:

```bash
PAYMENTS_TEST_DATABASE_URL=postgresql://postgres@127.0.0.1:55432/jazz_maintenance npx vitest run tests/integration/dodo-entitlement-postgres.test.ts
```

- Backend payment validation:
  - `npm run test:payments:backend`
- Frontend real Dodo checkout validation:
  - `npm run test:payments:frontend:real`
- Full critical pass (backend + frontend real + build):
  - `npm run test:payments:all`
