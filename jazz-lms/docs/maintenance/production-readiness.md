# Production recovery checkpoint — 2026-10-20

The old Vercel application is now protected and paused. Production Supabase
remains INACTIVE; no production SQL, backend resume or application deployment
occurred in this checkpoint. The improved application remains unreleased.

## Actual Vercel changes and verification

The exact Neurofactory `jazz-lms` project
`prj_lEwrHldvtbnCByMPA9gvGzqVqpts` received two reviewed operations: All
Deployments Vercel Authentication, then project pause. Both returned200.
Independent project GETs confirm `paused=true`, `deploymentType=all`,
`autoAssignCustomDomains=false` and the unchanged active deployment
`dpl_6Xo6rUDVdh9jTWg4KoH1ok6iyU3D`. The existing automation bypass is retained;
no credentials, deployment, environment, domain, runtime or plan were changed.

The immediate bypass-bearing homepage HEAD at16:20:55 UTC still returned200.
The controller stopped with `ACTIVE_PAUSE_NOT_PROVEN`; its two spent write
reservations and original failure remain unchanged. Separate read-only checks
at16:21:54 and16:22:53 prove503 `DEPLOYMENT_PAUSED` on both `www` and the direct
production URL, with and without that existing bypass. There was no write retry.

Nine anonymous root HEADs at16:22:53 separately show:

| Surface | Actual result | Limit |
| --- | --- | --- |
| Apex, `www`, project alias and active generated URL |503 `DEPLOYMENT_PAUSED` | Root paths checked; no mutating application endpoint invoked. |
| Three historical generated URLs in this project |302 to Vercel `/sso-api` | Anonymous access is gated; authorized users/bypasses are not proven retired. |
| Earlier Gabriel-scoped generated URL |302 to Vercel `/sso-api`; authenticated deployment lookup404 | Its underlying account/runtime/credentials remain unreconciled. |
| `dev.culturadeljazz.com` |Transport failure | Not proof of retirement or protection. |

The payment cron remains enabled in control-plane metadata. Its deployment ID
matches paused production, but this is not evidence that the scheduler is
disabled or that an already-running invocation stopped. The owner has been asked
to use the exact project's **Settings → Cron Jobs → Disable Cron Jobs** control.
No supported public REST toggle was found in the current339-path OpenAPI; the
project PATCH input does not accept `crons`. No payment-sweep request was made.
[Authentication scope](https://vercel.com/docs/deployment-protection),
[pause contract](https://vercel.com/docs/rest-api/projects/pause-a-project),
[cron control](https://vercel.com/docs/cron-jobs/manage-cron-jobs).

Six offline guard tests and independent source review pass. They cover exact
team/project/current deployment, allowed writes, deadline/headroom, baseline
drift and the pause outcome. The original immediate edge failure is preserved
separately from subsequent successful propagation checks.

Rollback is manual: prefer keep closed. Only while the exact backend is still
INACTIVE may a reviewed rollback unpause this same project and restore its saved
previous `ssoProtection=null`. Unpause enables automatic domain assignment;
that matches this project's captured original `true` value. Do not restore the
unsafe old application as a repaired release or automatically re-enable cron.

## Supabase containment remains a technical prerequisite

Production project GETs confirm exact `feavujcllgbzlvdvkkxx` / Jazz-LMS-Project /
INACTIVE. Its documented PostgREST configuration GET returns404; the effective
v2 configuration GET returns500. Neither proves the Data API disabled. The same
PostgREST route returns200 for the distinct ACTIVE_HEALTHY isolated preview.

Official CLI encoder/tests establish the narrow disable request
`PATCH /v1/projects/{ref}/postgrest` with `{"db_schema":""}`. Desired readback is
empty; effective platform records use `pg_pgrst_no_exposed_schemas`. There is
no verified paused-project application or pre-exposure startup guarantee yet.
Stored configuration alone also does not exclude a role-level override.
[API contract](https://supabase.com/docs/reference/api/v1-update-postgrest-service-config),
[official encoder](https://github.com/supabase/cli/blob/8803a3e90dd18ca14c857026da20f7a073bc6b22/apps/cli/src/commands/config/push/push.encoders.ts#L392),
[effective-config limits](https://supabase.com/docs/reference/api/v2-get-project-config).

Next is a bounded isolated control-plane test, preserving settings and data,
to establish the actual disable/pause/resume behavior before relying on it in
production. REST/GraphQL containment does not by itself disable Auth, Storage,
Realtime or direct SQL. Old-server protection alone cannot contain direct
Supabase access. No blind production PATCH or resume was attempted here.

## Current SQL source and order

The source/evidence review rehashes11 authoritative sources,13 finite receipts,
12 frozen SQL copies and all seven repository migration checksums. It does not
repeat the successful offline database rehearsals or execute production SQL.

| Stage | Authoritative source | SHA256 |
| --- | --- | --- |
| Atomic225-column hardening |`production-column-structure-v4/candidate-hardening-column-v4.sql` |`8cfc5faddf45826b65593c51abc2aa75e79c7c785d64fd4661cdec0fd869436c` |
| Literal additive currency migration |`prisma/migrations/202610150001_purchase_payment_currency/migration.sql` |`0f1b4fe34690e6bb46b34500c64fb84ea87579928edd51deb8d2eafa1fcf2fac` |
| Strict read-only227-column postcheck |`production-currency-hardening-v5/verify-hardened-currency227-v5.sql` |`b83acc623cce83f70169bc5b2dd434a4a593828311b30ad926f08d8e4de19dde` |

Private SQL paths above are relative to `/tmp/jazz-maintenance/`, except the
literal repository migration. The older V2 proposal is historical. Before any
in-place apply, independently verify current target/TLS, executor/runtime roles,
fresh preservation and the guarded catalog/ACL/membership/index baseline. Keep
applications closed; do not launch the new Prisma client before its columns
exist. Preserve the four original history rows and acknowledge only the three
proven missing migrations with reviewed official tooling; no broad migrate
deploy. Prefer closed service/re-pause over reintroducing unsafe grants.
Full extension initial-ACL recovery and clean database bootstrap remain broader
recovery claims, not inherent blockers to correctly scoped in-place revokes.

## Hosting and refund work

Fresh DNS/RDAP still identify Squarespace registration, Google Domains
nameservers and Vercel apex/`www` routing. No project-scoped registrar,
Cloudflare or Netlify access was established locally. The owner has been asked
to check whether the Squarespace Domains dashboard lists this exact domain.
Monster plus a named Cloudflare Tunnel remains conditional on DNS/account
authority and durable operation. Netlify Free is a conditional adapter-based
fallback; its current new-account limit is300 credits/month with a hard cap.
No paid upgrade, signup, DNS change or hosting move occurred.
[Current free limits](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/).

The sandbox payment and signed fulfillment remain verified; the refund409 cause
remains unknown. A separate response-capture helper now passes12 offline tests,
including reproduction of the old body loss, bounded private error capture,
timeouts and zero automatic retries. The recovery plan requires fresh exact
same-payment reads and bindings before any separately recorded continuation;
it creates no financial allowance and leaves all spent records unchanged.
SDK retry defaults and a generic idempotency option do not establish refund
replay safety. No Dodo request occurs in that offline preparation.
[Refund error contract](https://docs.dodopayments.com/api-reference/error-codes).

Selected finite evidence/source is retained privately under
`/home/gabriel/backups/culturadeljazz-maintenance/review-checkpoint-production-readiness-20261020`.
Raw provider responses, rollback credentials, browser state and active/private
configuration are excluded. All64 selected files/13,322,451 bytes rehash exactly;
four current used secret values have zero literal matches. Manifest SHA256 is
`c1e2b5ee41c18d21b80955f50ece22508e824ae6e7da9c9e02e9d9c488976733`.
This local unencrypted package is not off-site
backup or activation authority. Full maintenance and release remain incomplete.
