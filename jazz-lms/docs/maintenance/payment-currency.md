# Payment currency and exact amounts

PAY-22 replaces the assumption that every payment uses cents and two decimals.
This is a source and isolated-test change; production migration and deployment
still require the owner's approval. It does not establish a complete tax,
settlement, fees or refunds journal (LIVE-06).

## Representation and provider boundary

`Purchase.paymentCurrency` and `Purchase.paymentAmountMinor` are nullable TEXT
fields, without defaults or a historical backfill. The second field stores the
provider's exact nonnegative integer as canonical text, so large values survive
Prisma and JSON without floating-point or BigInt serialization loss. Existing
Float fields remain separate legacy facts and do not acquire a currency simply
because a later payment snapshot provides one.

Dodo documents `total_amount` in the payment currency's smallest unit, including
tax. Its settlement currency is a separate fact. Merchant metadata, catalog
quotes and settlement fields cannot establish the charged amount or currency.
A present malformed canonical total stays unknown rather than falling back to
an alias. Currency, totals and their tax/subtotal basis must come from the same
payment object; nested and outer payment facts cannot be combined. Zero stays
zero. Missing or unsupported currency permits raw units to
be retained without inventing a positive major-unit amount. See the
[Dodo payment contract](https://docs.dodopayments.com/api-reference/payments/get-payments-1).

The shared money helper uses the numeric exponents in the official
[SIX ISO 4217 List One](https://www.six-group.com/dam/download/financial-information/data-center/iso-currrency/lists/list-one.xml),
published 2026-09-17, SHA-256
`33139b438657d1cee116ba737807ea71d19d6de4b90f799a09c56f0cc6a1b0ff`.
Examples: JPY has zero decimals; EUR and MGA two; KWD and IQD three.
`Intl.NumberFormat` formats presentation with the explicit exponent; its default
digits do not determine provider units. Withdrawn or unsupported codes stay
unknown. Individual payment integers are bounded at 64 digits; exact aggregate
formatting permits a larger bound.

## Retries, history and reporting

A complete trusted pair refreshes together. An incomplete retry for the same
reference preserves a previously complete pair and cannot attach a new raw
amount to an old currency. Replacement references inherit neither that pair
nor unrelated legacy amounts. Free application grants do not acquire paid
provider facts. Existing refund/reversal and voucher entitlement guards remain
necessary independently of amount availability.

Student history uses the exact pair first. Known legacy numbers without a
complete pair use localized currency-unavailable guidance; unknown amounts stay
unavailable. The API exposes nullable currency and canonical minor-unit text.
Display never labels an old float with the new pair's currency.

Admin overview and metrics require `analytics.read` for financial reads and
display. They sum integers separately per verified currency and count excluded
records. They perform no currency conversion and do not treat unknown records
as zero revenue. Average tickets exclude zero amounts and round once to the
currency's minor unit. Unsafe numerical projections disable a chart or
percentage comparison while preserving the exact displayed total. The revenue
API returns currency-specific series, not a scalar mixed-currency series.

## Additive migration and rollback

Review `prisma/migrations/202610150001_purchase_payment_currency/migration.sql`
as an individual additive operation. Do not apply the repository's historical
migration chain to an existing provider database. This migration has a 5-second
lock timeout and 30-second statement timeout and adds only the two nullable
columns in one transaction. Existing columns cause a failure for explicit drift
review. It contains no backfill, role, grant, policy, index or plan change.

Apply and verify the columns before starting an application artifact generated
from the new schema: default Prisma Purchase reads can request the new fields.
Before migration, snapshot old Purchase fields explicitly using the old
projection; a new generated client cannot use its default select against the
old schema. After migration compare those same old fields and raw timestamps,
then separately prove the new fields are NULL. Preserve roles, all scoped model
hashes, course values and entitlement state.

The guarded disposable `127.0.0.1:55432/jazz_maintenance` migration passed its
existing-row control: old fields/timestamps and table owner/RLS/ACL/index
metadata were preserved. Six schema checks passed, including five actual
PostgreSQL representation checks. Neither production nor the cloud preview
received this migration in that local check.

Safe application rollback leaves the additive nullable columns and any exact
facts intact. Do not automatically drop the columns, clear facts, infer legacy
currency or rewrite old floats. Remote migrations, native journeys and actual
provider transactions require their own source-bound evidence; local tests do
not establish them.

## Verified recovery and migration order

The archived production schema has 225 public columns. Its unchanged revision4
hardening must run before the additive payment migration; revision4 deliberately
rejects the resulting 227-column schema. Do not weaken that check or remove the
new columns to make an old inverse run.

With services closed, the proposed order is: verify the current target and a
fresh preservation snapshot, apply exact revision4 at 225 columns, execute only
the reviewed additive SQL, then run the distinct read-only revision5 check for
the hardened 227-column state. The latter binds both the migration hash and the
derived column manifest, retains the 93-index guard and verifies effective
browser denials and trusted CRUD privileges before application activation.

An actual network-isolated PostgreSQL17 archive restore verified that order.
All 65 original-column table projections, 2,239 records and two sequence states
match after migration and final fixture cleanup. Both new fields are initially
NULL. Each of the two hardened 227-column checks executes 446 zero-row permission
operations; this is repeated coverage, not 892 unique cases. Premature 227
verification, partial-column collision, an injected transaction fault, migration
replay, the old 225-column inverse and a new-column grant all fail as expected.

A separately approved offline manual revision5 inverse/reapply preserves one
owned synthetic Purchase and its exact currency facts. Full-row compare-and-swap
deletion removes only that fixture; no existing customer, User or Auth row is
written. Independent comparison of the inverse schema export matches all 557
archived ACL statements and member-owner metadata. The container is removed and
all five original preservation inputs retain their hashes.

Normal code rollback keeps the new columns, payment facts and hardened grants.
The revision5 inverse restores unsafe permissions and is a separate manual
recovery operation with services closed. It is never automatic failure cleanup.
The literal migration leaves `_prisma_migrations` unchanged; historical migration
bookkeeping remains a separate review, and broad `prisma migrate deploy` is not
authorized. Source extension ownership/initial privileges, hosted-platform
equivalence and current production compatibility remain unproven. None of these
offline checks authorizes production resume, SQL or deployment.

The owner-only local review checkpoint is
`/home/gabriel/backups/culturadeljazz-maintenance/review-checkpoint-currency-ordering-20261015`.
Its 103 selected files (4,656,377 bytes), plus manifest/receipt, retain exact
sources, disabled templates and normalized results. Files are0600/directories0700
and destination hashes were checked. Raw archive/COPY, whole schema/role exports,
owned rows, credentials and enabled approvals are excluded. This is unencrypted
local review evidence; off-site or full-platform recovery is not established.


## Verified isolated preview and later display follow-ups

The exact188f7b8 sealed artifact received a separately scoped migration on the
existing Free maintenance preview only. Two nullable TEXT columns/no defaults or
backfill were verified, with all18 old protected hashes unchanged. Native58
checks pass: student/overview currency variants, representative KWD/restored
statistics and320/390/1440 light/dark amount geometry/contrast, actual logins and
global204 logouts. Seven temporary pair updates plus one restoration are
acknowledged; independent final read-only comparison preserves all12 models,
raw course/purchase timestamps, roles, policy and indexes, and both pairs areNULL.
All owned browser/app/tunnel resources are closed and the artifact seal passes.
Production has not received these columns.

Later97e5e06 source separately repairs voucher redemption display and legacy
precision. The final charge uses a complete canonical pair first; canonical raw0
can be shown as0 with currency unavailable because zero is scale-independent.
Unknown positive raw units never acquire a guessed scale. Original/discount
legacy floats remain unlabelled even when the final charge has a currency, and
small positive legacy amounts must not round to0. These changes pass meaningful
before/after cases and the final2533-test clean build; they were not part of the
188 native execution. Full tax/refund journal and actual Dodo delivery remain gaps.

A fresh exact5f native window now verifies those later display facts:17 checks
cover two normal logins,13 student/admin/voucher observations and two actual
global204 logouts. CanonicalKWD final, independent legacy base/discount, tiny
nonzero legacy values and unknown-currency canonical0 are exercised. The existing
synthetic Purchase receives three temporary five-field phases and one exact
restoration; one inactive expired voucher/redemption pair is created and removed.
Independent final read-only comparison matches all12 models/18 protected hashes
and both full original Purchase rows/timestamps, with both canonical pairsNULL
and business0. All owned runtime/browser/tunnel resources close. This updates
native rendering evidence without making an actual provider/payment claim.

The27 amount-only crops also expose awkward voucher character wrapping. Visible
correct digits and complete DOM text do not prove readable number/currency groups;
the subsequent presentation fix needs separate visual evidence. Production
compatibility, tax/refund journal and provider delivery remain separate gates.
The later offline ordering proof above does not authorize a production migration.

Presentation8053c1b addresses the observed wrapping without changing formatted
text or monetary logic. A complete amount/ISO span cannot break inside the token;
guidance keeps ordinary word wrapping, and wide values stay horizontally
scrollable. Eighteen existing integration cases/types/scoped lint pass. Five
local after renders of the actual async page with synthetic read mocks and
compiled CSS pass against five problematic before cases, including both scroll
ends of a64-digit value. The font fixture differs from the native preview, so
this does not relabel or repeat the authenticated5f backend/transport evidence.
