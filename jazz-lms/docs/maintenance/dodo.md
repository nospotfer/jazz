# Dodo product, webhook and sandbox audit

Observed 2026-10-13 using credentials recovered from authorized Vercel environment
reads. The initial live audit made eight documented GETs only. A subsequently
supplied TEST key is verified; one dedicated product and two coupons were
created in TEST mode, with a test-only product price alignment. No live resource
was written and no checkout, payment, refund, customer, key, webhook,
communication-preference change or message was performed.
Credentials and raw responses remain private outside Git.

## New test-mode checkpoint

The TEST product list and existing brand GETs return 200 and bind the same
business as live mode. The initial product inventory was empty. One one-time
digital maintenance product was created at **EUR 2990, tax-inclusive false**,
with the existing brand, no license entitlement and metadata binding the
separate synthetic Supabase project. No shared brand/profile setting changed.
The subsequent TEST webhook inventory returns 200 with zero endpoints.

An exact read-only check found the existing synthetic course price is 80 in the
app's major-unit field. Its learning/purchase fixtures are preserved; only the
dedicated TEST product was aligned to EUR8000 before coupon/checkout proof.
The original EUR2990 creation receipt remains historical. A single price-only
TEST PATCH200 and exact GET200 now verify EUR8000, tax-inclusive false, with all
nonprice fields and application rows unchanged. This is fixture preparation,
not a change to the live product or customer course pricing.

In-memory inspection of the preserved production Course COPY shows one course
with stored price 29.99 and no NULL price. The schema field has no currency;
app source interprets it as EUR major units. Under that interpretation the
live Dodo EUR29.90 base differs by EUR0.09. Customer tax/FX/settlement remains
unverified and no production price correction is authorized.

The key is held in an owner-only private file outside Git. The isolated loopback
frontend remains payment/sending-disabled; neither live nor test checkout is
enabled there yet. Private execution preparation records exact target checks,
provider payloads, fixtures and stop conditions with all execution/mail approval
flags false. The customer recipient is approved and recorded privately; actual
merchant/webhook-alert recipients need review before transactions. Existing preview purchases/learning
evidence must be preserved; fresh payment-only synthetic actors are planned.

The official CLI v3.6.2 is privately installed and publisher-checksum verified;
only version/preparation checks ran. It uses a fixed global configuration,
does not itself enforce TEST mode before relay creation, forwards business-wide
events and reserializes JSON while retaining original signature headers. The
prepared isolated profile avoids inherited live credentials, but a listener
has not been launched or proven. Never disable raw-body signature validation
to make a relay test pass. [CLI documentation](https://docs.dodopayments.com/developer-resources/sdks/cli).

Customer Test Mode Emails and merchant/team notifications are separate. Turning
off test customer emails does not establish merchant or webhook-alert suppression.
No reviewed API parameter suppresses them per checkout/refund. Live/shared
communication settings remain unchanged. [Communication preferences](https://docs.dodopayments.com/features/communication-preferences).

Rechecked2026-10-15: the documented customer switch is dashboard-only and
customer-only; team email preferences are configured per recipient. The pinned
[official SDK](https://github.com/dodopayments/dodopayments-node/tree/f38a877c6a466038097446729cb51e5f16892d3f/src/resources)
checkout/payment/refund create schemas provide no all-mail suppression field,
and its public resource index provides no merchant recipient/preferences API.
Portal `send_email` only controls portal-link mail. These checks did not access
the account or change settings.

Primary webhook documentation conflicts: the
[current guide](https://docs.dodopayments.com/developer-resources/webhooks#email-alerts)
says failing-delivery email alerts are unavailable, while the
[August5 changelog](https://docs.dodopayments.com/changelog/v1.112.0#2-a-rebuilt-webhooks-experience)
describes configurable recipients. Neither proves this account's actual settings.
Recipient/settings evidence or provider clarification remains necessary before
transactions; do not infer that alerts are absent or silently suppress shared
business notifications. No test transaction or mail was sent during this review.

The current source helper has now created and independently retrieved two
bounded TEST-only coupons: percentage10% (1000 basis points) and fixedEUR5
using the documented currency_options/default EUR row. Seven actual requests
consisted of one pinned product GET, two code-collision404 checks, two creates
and two exact discount GETs. Product restriction, business, metadata, one-use
limits, zero use count, expiry and returned amounts/shapes match. No broad list,
PATCH/delete, local voucher, customer, checkout, payment, refund or webhook call.
This proves provider acceptance of helper-generated coupon resources, not tax,
settlement or local redemption accounting. Resources and receipts are preserved.

A separate private direct-webhook exception is prepared with **110 in-process
checks** (63 raw-body/signature/receipt/duplicate cases plus 47 existing Basic
gate cases). Root reran it against source27's native verifier after checking
frozen hashes. It authenticates original bytes before scope parsing and only
forwards recorded owned TEST payment/refund receipts; completed identical
duplicates are acknowledged without a second forward, while mismatched or
uncertain deliveries stay denied. This is preparation, not provider delivery.
No exception is integrated, endpoint created or signer activated. The planned
four checkout sessions/two successes/two refunds use one fresh controlled-email
actor and two additional native-generated coupons, maximum four provider coupons
including the two completed acceptance resources. Existing learning/purchases
stay preserved. Merchant/webhook-alert recipients remain the execution gap.

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
Matching TEST credentials/business/product are now verified as described above;
the existing deployed development configuration remains unrepaired. Verify a
dedicated test webhook before constructing the isolated remote preview. Review
any changes to the production-attached Vercel project's configuration separately.
Synthetic loopback checkout proves application behavior only.

The native Dodo CLI also authenticates with an API key; it does not provide a
browser OAuth session that avoids obtaining the correct test key. The existing
live key cannot establish test access. Store a supplied test key privately on
the remote machine, not in chat, CLI arguments or Git.

Test-mode isolation has limits: business profile, account/bank information and
verification are shared with live mode, while keys, products, webhooks and
transactions are mode-specific. Test mode can send real emails. Before actual
sandbox transactions, use the privately approved controlled customer recipient
and finish merchant/webhook-alert recipient review; no test email was sent. Do not
alter shared business settings as routine sandbox setup. See the same
[mode documentation](https://docs.dodopayments.com/miscellaneous/test-mode-vs-live-mode)
and [CLI authentication](https://docs.dodopayments.com/developer-resources/sdks/cli).

## Remaining verification and decisions

- Authenticate the matching business dashboard to inspect owner/member roles,
  recovery/MFA, API key permissions, KYC/payout status and delivery/error history.
- Inspect the business Adaptive Currency setting and FX/fee treatment. Product
  pricing_mode null, PPP false and zero localized rules do not prove this
  dashboard setting disabled; see [Adaptive Currency](https://docs.dodopayments.com/features/adaptive-currency).
- Reconcile the verified live €29.90 tax-exclusive product with the archived
  database course price 29.99, advertised price and guarantee/terms. The source
  interprets that database value as EUR; the stored field has no currency. Local defaults use €29.99;
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

The later a207 native history window verifies actual own-record GET/UI display
of80, NULL and0 and restoration, plus controlled load recovery and server owner-
mismatch409. Its31 successful phase checks use one root-created synthetic grant
with bounded reversible SQL amount changes; they make **no provider transaction,
refund, delivery, tax or currency claim**. The original row/timestamp and all-five
12-model fingerprints match afterward. Accounting source260 targeted checks
and actual Dodo notification/transaction gates remain distinct.
[Exact scope](review-status.md#payment-history-recovery-and-account-isolation).

## Local test credential retention

The owner-supplied TEST key now has an identical durable private copy at
`/home/gabriel/.config/culturadeljazz-maintenance/dodo-test-api-key`, directory0700/
file0600. The original `/tmp/jazz-maintenance/dodo-test-api-key` is preserved.
One bounded test-mode product GET confirms the same previously created synthetic
product/business and unchanged8000EUR minor-unit price. No transaction, refund,
webhook, mail, shared-business setting or live resource was changed. Neither file
is automatically loaded; account rotation remains the owner's decision and must
account for both copies. Key contents and digest are excluded from evidence.

This addresses local loss on/tmp cleanup, without encryption, off-site recovery
or proof of merchant notification recipients. Those transaction gates remain.
