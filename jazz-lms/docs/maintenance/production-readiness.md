# Production recovery checkpoint — 2026-10-20

The old Vercel application is now protected and paused. Production Supabase
remains INACTIVE; no production SQL, production backend resume or production
application deployment occurred in this checkpoint. The improved application
remains unreleased. The isolated preview was separately paused and restored in
the control experiment below.

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

Fresh readback at 16:55 UTC still confirms the four active/`www` requests return
503, including the retained bypass. The current CLI identity is `neurofactory`;
its default project listing establishes no access to the separate Gabriel scope.
GitHub reports successful Preview deployments for `cdaefdf` and `fc1f144` there,
but both authenticated deployment lookups return404 and anonymous roots redirect
to SSO. These are automatic preview records, not verified isolated deployments.
No alternative CLI login was found in ten standard Behemoth locations.

The installed Vercel63.1.2 help and pinned official CLI source support cron
`add`, `list` and `run`, with no global disable command. A bounded primary-source
review also found no supported disable route/body in the OpenAPI, SDK or public
dashboard code examined. This does not prove a private endpoint cannot exist.
Current docs establish explicit disable behavior across promotions/rollbacks;
they do not establish scheduler or in-flight behavior during project pause.
`disabledAt=null` is configured state, not proof that an invocation continues.
The dashboard action remains pending; no cron was run.
[Official CLI commands](https://vercel.com/docs/cli/crons),
[pinned list-command source](https://api.github.com/repos/vercel/vercel/git/blobs/ce608c57b01769e23881d33b08b006b7c87cf694).

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

### Actual isolated control result

The experiment on `tvmhuacxctdgmejziaxg` closes at 17:19:36 UTC with
`CLOSED_PAUSED_CONTROL_NOT_ESTABLISHED`. The sole empty-schema PATCH, issued
only after INACTIVE was independently confirmed, returns404. One restore with
literal `{}` returns200 and reaches ACTIVE_HEALTHY. Original exposed schemas
remain `public,graphql_public`; no active-disable fallback was attempted.

Independent comparison verifies every row-count/hash fingerprint across all25
public and four Auth tables, the hardened catalog, and exact Auth/PostgREST
settings are unchanged. The isolated public tables contain1,517 rows. REST
returns the same zero-row `Purchase` probe's401/`42501` table-permission denial
before and after; GraphQL's extension was already disabled. This verifies
preservation and original routing, not a newly effective API restriction.

Two earlier controller limits remain recorded. A publishable key cannot read
the OpenAPI root, so the first attempt stops before mutations and preserves all
data/settings. The next attempt's sole pause returns200, but its35-second
observation limit ends while PAUSING. A separately reviewed continuation finishes
the unspent stages on that same pause; it does not pause again or reset ledgers.
Its pausedGET404 handling was corrected and tested before activation.

Cumulative execution uses one pause, one rejected schema PATCH, one restore,
eight fixed read-only SQL calls,90 management requests and21 public probes.
The final source packages independently pass17,20 and16 offline cases; those
overlapping helper suites are not application-test or live-health totals.
All windows are closed. A separately discovered older two-process Next.js
preview was stopped with SIGTERM before testing; no app/tunnel/browser was
started by this control. Prior scope-specific closures had not covered it.

This negative result rules out relying on this inactive-project PATCH for
production recovery. REST/GraphQL containment also does not disable Auth,
Storage, Realtime or direct SQL. Old-server protection alone cannot contain
direct Supabase access. Production remains INACTIVE, freshly verified at
17:13 UTC; no production schema PATCH or resume was attempted.

Read-only key metadata is also inconclusive: inactive production returns200
with an empty key list and `legacy.enabled=true`, while the healthy preview
lists two legacy and two new keys. An empty paused inventory is not evidence
that no keys exist. The documented legacy-key switch is reversible, but covers
legacy keys only; the new-key PATCH contract has no `enabled` field. No key was
created, changed, disabled, deleted or rotated in that schema-control scope.
The later isolated legacy-key control is recorded below; it cannot by itself
prove all-key containment or paused-project applicability.
[Legacy switch](https://supabase.com/docs/reference/api/v1-update-project-legacy-api-keys),
[new-key update](https://supabase.com/docs/reference/api/v1-update-project-api-key).

### Legacy-key control and free replacement candidate

The separate legacy-key test now verifies an actual gateway denial followed by
restoration of the same existing key. Its disable and re-enable PUTs both return
200. Immediate flag reads lag each change; the runner stops on its first stale
restore readback rather than repeating a mutation. Subsequent bounded read-only
closure verifies enabled=true and the original service-role zero-row200/[] route
at17:41 UTC. Independent Python comparison matches all29 full fingerprints,
the complete catalog and exact Auth/PostgREST settings. Cumulative control usage
is21 management requests, including four read-only SQL calls, seven public probes
and exactly two legacy PUTs. The original stopped result remains preserved.

This establishes the selected legacy key's denial and restoration on the active
preview. It does not establish newer-key coverage, paused-project behavior or
safe production exposure. No app, tunnel, browser, key rotation or financial
operation is started by this test. Production remains paused.

A replacement backend is a conditional alternative to waking the unsafe source.
The current account read at17:59 UTC confirms one Free organization, the caller
as sole Owner/Admin, one active preview and one paused production project. This
supports a candidate second active Free slot; no project is created or reserved.
The current [Free policy](https://supabase.com/docs/guides/platform/billing-on-supabase)
excludes paused projects from that active-project limit.

The restore design must harden an empty destination before a data-only import;
replaying the full original archive can restore unsafe ACLs. The retained
October13 snapshot is not proven equal to current production. Two current
read-only backup metadata responses list zero logical backups and no physical
backup dates; they do not prove the underlying paused data or backups absent.
Preserving later data or deciding an accepted recovery point remains a prerequisite.
Archive-only checks verify zero Vault secret/MFA-factor/challenge/recovery rows,
25 MFA authentication-method claims, and zero parsed pgsodium column labels.
These facts do not establish complete encryption or managed-platform portability.

Official [Auth migration guidance](https://supabase.com/docs/guides/troubleshooting/migrating-auth-users-between-projects)
supports password-hash/user migration, with re-login after changing signing keys.
Actual new-target schema/role compatibility, Auth identity behavior, Storage bytes
and associations, OAuth/SMTP settings, hosting and rollback still need proof.
No source guard is relaxed, no database is imported and no destination is created.

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

A preparation-only SQL stage operator now passes21 independently repeated
offline checks for exact sources/order, durable reservations, stale-proof
rejection and ambiguous-write stopping. Its CLI remains inert. Genuine current
containment evidence and reviewed executor/receipt-validator implementations are
still required; this package does not make production execution ready.

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

The separate16:31 UTC read-only payment/line-item pair still finds succeeded,
zero refunds and the full USD8997 refundable; canonical line-item currency is
independently checked. The old spent reservation's bytes remain unchanged.
New recovery-phase and runtime-adapter packages independently pass59 and32
offline checks. They preserve the old marker, capture errors privately, require
fresh same-payment/native proofs and create no checkout/card/account path.
The composer preserves the sealed build's native origin while binding a fresh
webhook origin separately. Actual transport, current receipts, endpoint/runtime
setup, bounded continuation and reversal/closure proof remain unfinished. No
additional refund request was made in this checkpoint.

Concrete readback/wiring now passes43 independently repeated offline cases. It
retains the original SQL exclusions and UTC projections, validates actual scoped
rows and signed-core journal/ledger provenance, and deliberately does not invent
missing historical raw webhook bytes. A separate root endpoint controller passes
12 cases, including private409 capture, ownership before writes, fixed deadlines
and ambiguous-disable cleanup without retry. Its copied native/tunnel/listener
helpers remain inactive. Historical input hashes and the original spent marker
are rechecked; no new lease, endpoint, service or financial reservation is created.
Fresh native HTTP probes, dynamic receipt wiring, actual execution and closure
remain required. These offline suites are not live refund or reversal evidence.

Selected finite evidence/source is retained privately under
`/home/gabriel/backups/culturadeljazz-maintenance/review-checkpoint-production-readiness-20261020`.
Raw provider responses, rollback credentials, browser state and active/private
configuration are excluded. All64 selected files/13,322,451 bytes rehash exactly;
four current used secret values have zero literal matches. Manifest SHA256 is
`c1e2b5ee41c18d21b80955f50ece22508e824ae6e7da9c9e02e9d9c488976733`.
This local unencrypted package is not off-site
backup or activation authority. Full maintenance and release remain incomplete.

The later isolated-control/source checkpoint retains75 files/515,165 bytes,
with exact copy hashes,0600 files/0700 directories and zero matches for nine
selected current credential values. Raw provider responses, Auth snapshots,
keys and enabled runtime inputs are excluded; the Dodo TEST key was not loaded
for that scan. Its local unencrypted receipt SHA256 is
`b48e8aff6ab08433a193c36310455b9da00a6f8cc67524eda22c57c195fa6ebe`
under `review-checkpoint-isolated-control-20261020` in the same backup root.
The separate public cron-source copy verifies56 files/5,284,290 bytes, receipt
`0601f9c582d4c89ddc07b1551cde2cda5f89f4895b78677f89e423ce526adb0a`.
Neither package establishes off-site recovery or grants activation authority.

The later legacy-control/free-recovery/source checkpoint retains86 selected
files/5,498,641 bytes under `review-checkpoint-legacy-and-free-recovery-20261020`.
Its receipt is `b0d192502f3c7ec4113c2cb0ea911da658a4b75e9a57892a0f0b11af1cff7ef6`.
Exact source/copy hashes and0600/0700 permissions pass; the selected current
management token and legacy JWT have zero literal matches. The Dodo TEST key
is not loaded for this scan. Actual credential/input registries, enabled plans,
financial reservations and raw provider/Auth/customer/browser bodies are excluded.
This local unencrypted evidence is not an off-site backup or activation authority.
