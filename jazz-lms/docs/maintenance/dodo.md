# Dodo product and webhook audit

Observed 2026-10-13 using credentials recovered from authorized Vercel environment
reads. Eight documented GETs only; no checkout, payment, refund, coupon, product,
key, webhook or configuration write, customer-row query or message was performed.
Credentials and raw responses remain private outside Git.

## Verified live configuration

| Area | Evidence |
| --- | --- |
| API access | Live product list/detail return 200; configured product and business IDs match returned records. |
| Product | La Cultura del Jazz, one-time digital product, EUR 2990 minor units (€29.90), tax_inclusive false. |
| Pricing options | No product discount, PPP or pay-what-you-want; zero localized-price rules. These are base-price facts, not an actual customer tax/settlement breakdown. |
| Entitlements | One attached license-key entitlement; no addon/file delivery. Intended customer use needs review before cleanup. |
| Brand | Enabled, unarchived, no hold reason, matching business/product; URL uses culturadeljazz.com; support_email absent. Verification fields do not prove legal ownership, KYC or payout status. |
| Live webhook | One enabled endpoint: https://culturadeljazz.com/api/webhooks/dodo-jazzlms. |
| Event filters | Payment success/failure/processing/cancellation, refund success/failure, dispute opened/lost/won, and subscription events. |
| Signing | Retrieved webhook signing key exactly matches configured DODO_PAYMENTS_WEBHOOK_SECRET and valid standard base64 material. This does not establish actual delivery success. |

DODO_WEBHOOK_PUBLIC_URL has the same host but a different path from the active
provider webhook. That variable is unused at runtime; the provider already
targets the implemented route. Do not change a working endpoint based only on
the stale informational value.

## Verified environment isolation failures

Production and preview both select live_mode and share the live API key,
product, business and signing secret. The preview can reach live payment
resources and is unsuitable for isolated checkout tests. Development selects
test_mode but shares the same live-only key; test product-list and configured
product GETs return 401. Development has different product/business references
whose test ownership/pricing remain unverified.

Dodo documents [separate live/test credentials and resources](https://docs.dodopayments.com/miscellaneous/test-mode-vs-live-mode).
Recover suitable test-mode credentials and verify their matching product,
business and webhook before constructing the isolated remote preview. Review
any changes to the production-attached Vercel project's configuration separately.
Synthetic loopback checkout proves application behavior only.

## Remaining verification and decisions

- Authenticate the matching business dashboard to inspect owner/member roles,
  recovery/MFA, API key permissions, KYC/payout status and delivery/error history.
- Inspect the business Adaptive Currency setting and FX/fee treatment. Product
  pricing_mode null, PPP false and zero localized rules do not prove this
  dashboard setting disabled; see [Adaptive Currency](https://docs.dodopayments.com/features/adaptive-currency).
- Compare the €29.90 tax-exclusive product with the actual database course price,
  advertised price and guarantee/terms. Historical local defaults use €29.99;
  do not run the broad legacy price fixer or silently change business pricing.
- Review the intended license entitlement and support contact before proposing
  provider product/brand changes.
- After isolation, exercise actual test-mode checkout/return, signed delivery,
  reconciliation, coupons, duplicate/out-of-order events and refund/dispute
  entitlement barriers. Live real charges/refunds require separate approval.
- Review currency, tax, refund and settlement persistence before proposing a
  financial-journal migration. Existing purchase Float records and the event
  ledger do not constitute a full accounting journal.

Primary API references: [product list](https://docs.dodopayments.com/api-reference/products/get-products),
[product detail](https://docs.dodopayments.com/api-reference/products/get-products-1),
[localized pricing](https://docs.dodopayments.com/api-reference/products/get-products-localized-prices),
[brand](https://docs.dodopayments.com/api-reference/brands/get-brand),
[webhooks](https://docs.dodopayments.com/api-reference/webhooks/list-webhooks) and
[signing key](https://docs.dodopayments.com/api-reference/webhooks/get-webhook-signing-key).
Sanitized local evidence: `/tmp/jazz-maintenance/dodo-provider-access-summary.json`.
