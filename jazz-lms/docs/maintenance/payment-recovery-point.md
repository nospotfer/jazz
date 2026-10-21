# LIVE payment recovery-point check

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

Archive-to-provider payment continuity **remains unverified**. The date filters
refer to payment creation, while `succeeded` is the status at observation time.
They do not enumerate settlement/status-transition events for payments created
before October 13, reconcile archived purchases to provider records, or establish
the currency of Auth, learning or other customer data. The earlier Oct 13 LIVE
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
