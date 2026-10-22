# LIVE payment recovery-point check

## Latest: October 22, 08:18 UTC

Exactly two LIVE GETs returned HTTP 200: a fresh exact Jazz product/business/
brand identity check and an all-status payment list for that product, created
from **2026-10-13T00:00:00Z through 2026-10-22T08:18:31.176Z**. The list returned
zero items on page 0 with a page size of 100, establishing complete pagination for
these fixed product/time filters. No status filter was applied. The current
[List Payments contract](https://docs.dodopayments.com/api-reference/payments/get-payments)
confirms the creation-date filters, page 0 start and maximum page size of 100.

This refreshes the earlier, narrower succeeded-only window. It is a creation-
range observation of current records, not settlement or status-transition
history, a full customer recovery point, or proof of application integration.
No provider write, backend, SQL or Auth operation occurred. Credentials and raw
customer records were not retained in the finite report.

Finite evidence: `payment-recovery-point-newer-window-20261022/finite-summary.json`,
SHA256 `70c600404ea20fc80fa6e5d0e4c57008eac54fbc24c94609fe4165f4ccc790c9`;
`primary-contract-review.json`, SHA256
`8ef008c3258043cb4161c2323322e44e4c0b14573fa9da519ab26fe6b8efc261`.
Eight finite/source/intent files (12,903 bytes) are retained in
`review-checkpoint-payment-recovery-window-20261022`, manifest SHA256
`1d2987e895117e947addda75fda83ff2cedaf05b3f4d0f5373091eb3a16ce1de`.
The packet excludes raw provider/customer bodies and credentials; retention is
local and unencrypted, with off-site recovery unestablished.

## Older archived payment references: October 21, 23:29 UTC

Five LIVE GETs/all200 checked the same known product, a complete pre-Oct13
all-status page and three archived paid-reference details. The page contained
three succeeded and three failed payments; the succeeded set exactly matched
the three archived `dodo-pay` references. Their detail responses contained no
refunds or disputes and null `refund_status`. The other four archived purchases
were voucher grants, not payment IDs; no additional succeeded reference was
found. This proves current older-created status for the known product at that
observation, without inventing historical status/refund or canonical money
fields absent from the archive. Finite review SHA256:
`e0ee101f9d254a756b933f86b5ecee3b4f1d16a016b20d16752662b048edab67` in
`payment-recovery-point-older-status-20261022/finite-review.json`.

## Initial succeeded-only window: October 21, 18:44–18:46 UTC

Observed October 21, 2026. Two read-only LIVE payment-list GETs returned HTTP 200
and zero items for the previously verified Cultura del Jazz product, current
status `succeeded`, and payment creation timestamps from
**2026-10-13T00:00:00Z through 2026-10-21T18:44:08.530859Z**. No successful LIVE
payment created within those filters was observed. No payment, refund, checkout,
account, webhook or configuration was changed; no message was sent.

The [official List Payments contract](https://docs.dodopayments.com/api-reference/payments/get-payments.md)
documents `created_at_gte`, `created_at_lte`, `product_id` and `status` filters,
page numbers starting at 0, and a maximum page size of 100. The checked contract
hash is `6e97c55cdf3b423b43912b942f4aee7d180bf9e82ff141c98a860216beeb3fec`.
The requests explicitly used page size 100 and pages 1 then 0. Both were empty,
so neither a skipped first page nor a full-page truncation remains unresolved
for these fixed filters. The SDK's page-number fallback of 1 was insufficient
to establish API indexing: the initial page-1-only zero conclusion was premature.
Its original receipt remains unchanged and is qualified by the page-0 correction.

The credential was explicitly loaded in RAM from the retained owner-only
project production configuration, which selects LIVE mode. Its configured
product/business match the earlier successful project product readback. No TEST
key or unrelated merchant product was queried. This uses the historical product
binding; it is not a fresh inventory of every merchant resource.

Full archive-to-provider payment continuity **remains unverified**. The initial date filters
refer to payment creation, while `succeeded` is the status at observation time.
That initial scope did not enumerate settlement/status-transition events or
reconcile archived purchases; the later checks above narrow those gaps without
establishing historical transitions or the currency of Auth, learning or other
customer data. The earlier Oct 13 LIVE
audit checked configuration, not payment records; the retained successful
maintenance transaction was TEST mode.

Finite local evidence is in `payment-recovery-point-20261021/` outside Git.
The authoritative correction is `corrected-page-zero-summary.json`, SHA256
`8cdf54ce688c36ce7080378de6da335fa49b8ea43a2fb672721020bf740e0a00`;
the original page1 summary is preserved at SHA256
`ad14b845968172221bfdc341aaf62559b101c3ab6726e020c952596470917a38`.
Reports contain counts, dates and response hashes; credentials and raw customer
or provider records were not retained. This check changes no deployed application
or provider configuration.
