# Maintenance review checkpoints

## Current status — Oct22 10:09 Madrid

**The public website remains paused/503. The release candidate is verified
locally; application and UI improvements are not deployed to production.**

- **Completed:** security/authentication/payment repairs, responsive landing and
  student UI work, accepted database and all 68 PDFs recovered, administrator
  login/dashboard/logout verified. Isolated student login, signed video, PDF
  rendering and desktop/mobile/light/dark checks pass.
- **Selected release: `509fa06`.** Clean locked production build seals 45,857
  files; all 10 remote checks and Vercel status pass. The actual built Next app
  runs through the proposed container service, survives native module loading,
  restarts after its worker is terminated, stops cleanly and serves the exact
  maintenance fallback. These use synthetic server inputs with networking
  disabled; real production credentials/provider health remain unverified.
- **Production inputs prepared:** a new private configuration passes inspection
  against the selected release, CA and public build settings. It uses the
  accepted file-recovery key/bucket and playback-verified video signer. No
  provider calls, backend resume or service startup occurred; live health is
  still unverified.
- **Staged reopening:** `CHECKOUT_DISABLED=true` blocks new checkout and voucher
  grants while preserving existing customer access and payment fulfillment.
  Actual built responses pass in four languages. The original slim image failed
  Prisma native loading; the corrected full Bookworm image is pinned and tested.
- **Owner preview:** Behemoth's separate review browser remains available until
  Oct23 00:17 Madrid. Reopen with
  `/home/gabriel/.local/share/culturadeljazz-maintenance/review-20261022/open-preview.sh`.
  It uses synthetic data; payment/application-mail/cron are disabled.
- **Still required:** recovered-media inspection with the controlled admin,
  remaining provider/recovery-point decisions, domain access and exact cutover
  review. The owner only uses the administrator; real student password continuity
  stays unverified, separate from ordinary-student tests. No other customer's
  credentials are required from the owner.
- **Recovered-media preparation:** narrow read-only video/PDF dispatch now passes
  390 local checks, types and lint, including the actual private worker. This
  needs its own fresh recovery window; it has not been run on customer
  data and does not replace the selected production artifact.
  Source `9da4370` is published with all10 remote checks passing. One direct
  signed recovered-video master GET returns200/five variants without segments,
  SQL or backend resume. The media display helper passes43 local controls and
  an actual offline Chrome CSP/cookie-fetch check; recovered decoding/rendering
  remains pending the fresh bounded backend/Auth scope.
  Its separate clean recovery build now seals45,858 files with public/CA/cache
  inspection passing. Ten Mux playlist GETs200 pin three referenced hosts;
  segment access is untested. Controller integration is now prepared:17 Python,
  22 browser and22 process controls pass separately;18 pinned modules import in
  the existing maintenance venv. Actual sealed native inspection accepts media
  inputs/synthetic DB password. The inactive one-admin/video/PDF plan needs
  explicit approval and a fresh <=30min window, full preservation and restoration/
  re-pause. No recovered app/customer lease, SQL/Auth or backend resume occurs.
  The new temporary transport has no application attached or customer access.
- **Current owner action:** sign into Squarespace using Google account
  `gabriel.barra@gmail.com` and confirm whether the domain is listed. Google
  nameservers can be Squarespace defaults; another gcloud login is not yet needed.

Latest read-only Dodo check matches all three archived paid references, with no
refunds/disputes or extra successes in the complete older known-product list.
Four voucher grants remain separate; full recovery-point currency stays qualified.
[Full evidence](production-readiness.md#day-preview--oct21-2230-utc),
[startup and rollback](production-startup.md), [remaining work](backlog.md).
Everything below is dated history with superseded pending actions.

## Oct21 R5 verifies both existing files; continuation remains stopped

Exact 8ac31bd documentation publication/CI/PR readback and eight-file custody
pass; application code remains 105f8b9 and undeployed. R5 freshly verifies/adopts
both existing PDFs read-only, 171,746 bytes total, with zero new uploads.
Initial 1,621 rows/14,270 typed cells match, then source-derived second
stability request048 fails AdminShutdown57P01. The connection closes; final
customer/protected preservation
and explicit rollback are unverified with CONNECTION_CLOSED cleanup dispositions.

Frontend/worker close; sole pause and independent 10:41:54 sevenGET closure verify
replacement/production INACTIVE, preview healthy and old settings equal.
Bounded log GETs complete without matching the retained frontend or identifying
a cause. R5 outcome/log custody 17+9 files is retained. The selected route is
observed as port 6543/transaction pooler, without causal inference. Next: read-only settings/
identity/persistence diagnostics. Preserve R4's earlier verified1
result and all spent scopes; neither existing object may be re-POSTed/overwritten
and the bucket must not be recreated. No cause, remedy, complete stability
observation, serving or full recovery is established. [R5 evidence and limits](production-readiness.md#oct21-r5-adopts-both-pdfs-before-sql-shutdown).

Earlier dated checkpoints retain their historical results and scope limits.

## Oct21 published source and R4 partial continuation

Exact105f8b9 publication passes all five workflows/four Quality jobs, both zero
CodeQL results/errors and zero open PR-head alerts; PR46 head/title/body readback
passes. Session-origin and recovery-access source changes remain undeployed.

R4 passes fresh first-object read-only adoption and two empty selected-policy
checks, then sends one new PDF POST/download/info200 with source-bound bytes.
Client SQL014 AdminShutdown57P01 stops its metadata check: verifiedObjects1,
new-object SQL metadata/final customer-protected preservation/explicit rollback
unverified. Frontend/worker close; parent pauses and independent10:01:33 sevenGETs
confirm exact replacement/production INACTIVE, preview healthy and old settings.
Do not label two objects fully restored or infer an accepted remaining count.

Review the retained failure, then freshly inspect both existing objects and
customer/protected state read-only before more uploads. No object re-POST,
overwrite or bucket recreation; previous reports/ledgers remain unchanged.
Account/file continuity, recovery point, zero-cost hosting/release and full-goal
completion remain open. [R4 evidence and limits](production-readiness.md#oct21-r4-adopts-first-object-then-stops-on-sql-shutdown).

## Oct21 session synchronization source fix

The integrated session endpoint now checks configured exact Origin and JSON
content type before parsing or Supabase work. Closed synthetic-provider/real-SDK
review confirms the original login-CSRF defect;67 integrated cases and typecheck
pass. Source/finite custody is retained. Exact105f8b9 publication/CI now passes;
the fix remains undeployed and actual restored-account login unverified.

Root also accepts the narrow Storage metadata representation mapping. Fresh
actual policy checks and read-only first-object adoption remain prerequisites
for new uploads. The later R4 stop above is the current outcome. The public site remains
paused/503. [Evidence and custody](maintenance-log.md#oct21-session-synchronization-origin-fix).

## Oct21 first file stored; source changes integrated locally

R3's first PDF POST/download/info each return200 and source bytes match. Frozen
verifiedObjects remains0 because actual user_metadata{} differs from archived
SQLNULL.99 READ ONLY SQL/sixHTTP preserve1,621 rows/14,270 cells/protected metadata;
rollback/frontend close pass, child1. Parent pause and independent09:19:59.842538
sevenGET closure confirm paused replacement/production, healthy preview and old
settings equal. Reuse/adopt that object read-only under reviewed semantics or
prepare a remedy; never repeat its POST/overwrite/recreate the bucket.67 files
remain, with no R4 plan/outcome claimed.

The maintenance source includes bbec8b1/748a50c; both remain undeployed.
Offline matching of one controlled admin password candidate is source evidence
only; no hosted login/reset or GoTrue continuity is proven. R3 source/finite custody is
retained. [Latest evidence and remaining limits](production-readiness.md#oct21-first-pdf-stored-metadata-acceptance-still-open).

## Oct21 Storage bucket exists; access fixes remain unreleased

R2 confirms one bucket POST200 and zero PDF uploads, then stops because the API
omits `type` while SQL verifies STANDARD.93 READ ONLY SQL/three HTTP calls retain
all1,621 rows/14,270 cells. Final08:56:22 independent12GET/zeroPOST/noSQL closure
confirms replacement/production INACTIVE, preview healthy and old settings equal.
The parent paused:false/closure failure and unconfirmed corrective pause remain
historical facts. R1's zeroPOST/oneHTTP400 NoSuchBucket scope stays closed.

Now-locally-integrated bbec8b1/748a50c prepare persisted-role authorization and a restricted
recovery preview.41+76 authorization checks,939 native cases and753 integration/
29skip pass; they are not deployed or hosted Auth proof. Next complete a
fresh existing-bucket PDF scope, then controlled customer/admin access. The later R3 result is recorded above;
GoTrue continuity, current recovery point, stable free hosting and release are
unproven. [Actual results, custody and limits](production-readiness.md#oct21-storage-bucket-created-pdfs-still-pending).

## Oct21 hosted customer restore passes

Actual sourceb11f780 commits1,621 rows in26 COPY batches and verifies all14,270
typed cells before COMMIT and in fresh persisted readback. Protected metadata
and rights remain; both separate READ ONLY rollbacks and frontend/child closure
pass. One restore/pause and independent07:39:29 sevenGETs confirm replacement
and production INACTIVE, preview healthy and original settings equal. Native-RI
review is resolved offline without rewriting its earlier stopped result.

Actual driver/executor/event review passes; its parent authorship and lack of
independent customer redecoding are disclosed. Source/finite custody is retained
without credentials/raw values. Storage client16 closed controls pass, with no
actual upload yet. Next68PDF destination recovery and customer Auth/application
continuity; recovery-point/zero-cost hosting/release remain open. Publicwww503;
UI changes remain unreleased. [Evidence and limits](production-readiness.md#oct21-customer-data-restored-and-replacement-paused).

## Oct21 import metadata capture passes with explicit semantic review

Actual source5d56307 inspection captures current selected managed metadata and
passes18+11 READ ONLY calls, both rollbacks, frontend/worker closure and one pause.
Independent07:00:02 confirms replacement/production INACTIVE, preview healthy and
original settings equal. Metadata validation requires native-RI signature review;
no import GO is claimed. The exact68-object Storage plan has16 closed controls
and independent source review, without uploads. Next resolve actual metadata and
perform mapped data-aware recovery. [Evidence and limits](production-readiness.md#oct21-import-metadata-captured-and-replacement-paused).

## Oct21 selected REST API matrix passes

Fresh source213e041 actual scope passes both18-request READ ONLY checks/rollbacks,
all24 GETs across four existing credential kinds/no retry, frontend/worker/Node0,
one pause and retained safe desired schema. Independent06:20:22 confirms exact
replacement/production INACTIVE, preview healthy and original settings equal.
Earlier failures stay unchanged. Next: import-specific managed metadata and
Storage bijection, then actual hosted recovery. No customer import or release.
[Evidence and limits](production-readiness.md#oct21-selected-rest-api-scope-verified-and-paused).

## Oct21 transport scope closes before API probes

The fresh source6c3ec31 run passes its first18-request READ ONLY check and rollback,
then stops at second BEGIN setup after the schema PATCH. Two attempts include an
unconfirmed cleanup rollback; frontend closure is confirmed. Public GET0/newDDL/
COMMIT0; the API matrix remains unverified. Parent restores the prior desired
setting once, pauses once and preserves original observed settings. Independent
05:58:38 seven-GET closure confirms exact replacement/production INACTIVE and
preview healthy. Seven offline installed-library cases expose a diagnostic
SQLSTATE-subclass gap; a bounded provider log read does not identify this failure.

Next: finite SQL-phase/cleanup diagnostics, a separately bounded verification,
then hosted recovery. Archive trigger analysis also identifies the need for an
actual current table-trigger capture before import. [Evidence and custody](production-readiness.md#oct21-second-transaction-stops-independent-closure-verified).

## Oct21 native recovery pass and qualified API results

Real local PG17 COPY/native constraints and 14,270 typed cells pass for 1,621 rows;
deliberate 23505 rolls back to zero committed rows. Root independently verifies
container/socket absence. All 68 PDFs pass integrity/source privacy/ownership;
no destination upload or hosted Auth continuity follows.

Actual empty API schema COMMIT/protected 227/managed checks pass. First 24 GETs stop
on two root 401 s outside the old contract; R3 corrects that observation narrowly.
A distinct 18 + 18 READ ONLY continuation stops at third GET deadline/no HTTP. Neither
is a complete successful runtime proof. Both guarded rollbacks/pauses/independent
closures pass; latest 05:30:48 confirms replacement/production INACTIVE and old
settings equal. Customer recovery/serving remain incomplete.
[Evidence and next scope](production-readiness.md#oct21-empty-api-namespace-committed-runtime-verification-incomplete).

## Oct21 persisted schema and selected compatibility pass

Fresh source0769 actual read-only verification passes strict227/effective rights/
empty-state and original managed baseline,18 Python/eight Node requests,
both rollback/close and terminal parent/child0. Final04:08:57 pause and independent
04:09:08 seven-GET exact identity/original-state/settings closure pass. Actual
catalog comparison matches4relations/26constraints/25sourceindexes/one enum;
four nonunique platform indexes pass separate exact key/predicate/flag review.

Offline14accounts/16identities/seven purchases have consistent checked links;
preserve original roles and two confirmation disagreements. Source admin matches
an explicitly controlled project address, without proving destination access.
Static current Prisma23models/202columns/5enums/23FK endpoints and five controls
pass with independent review. Next: actual mapped restore and Auth/Storage
continuity; recovery-point, hosting, containment and remaining journeys stay open.
[Actual evidence and retention limits](production-readiness.md#oct21-persisted-schema-and-managed-catalog-verified).

## Oct21 hosted empty schema setup succeeds

The isolated Free replacement now has the guarded application schema: R8 performs
42 SQL calls, strict227/effective-rights and managed-preservation checks, then one
confirmed COMMIT with stable positive PID/XID and client closure. Parent/child0,
final03:31:00 pause and independent03:31:59 seven-GET identity/settings closure
pass. Production remains INACTIVE and the improved application is unreleased.

The earlier R7 route-check stop executes no SQL; its original conservative flag
and receipts remain unchanged. Actual local same-client TLS reproduction proves
the guard rejected psycopg's internally generated address. The narrow repair
preserves route/TLS and pinned-driver input checks; E/V/D40/39/37 and parent59
closed controls pass. Next is a fresh persisted227/managed-constraint read-only
check, then restoration and continuity testing. No customer import or cutover
has occurred. [Actual evidence, custody and remaining work](production-readiness.md#oct21-empty-replacement-schema-committed-and-paused).

## Oct21 hosted clients pass and backup mapping advances

Fresh source-e3 read-only comparison passes TLS1.3/CA/hostname, unchanged D6
psycopg and Node `pg`8.23.1 using the same current PRIMARY6543/CA/original password.
Both identity/rollback/client-close checks pass; Node adds344 actual Auth/Storage
column definitions. Earlier R6's discarded exception stays unknown. Parent/child
exit0; one pause is confirmed at02:45:17 and independent seven-GET closure
confirms replacement/production INACTIVE, preview healthy and old settings equal.
No hosted DDL/import/serving/release follows.44-file source/finite custody manifest:
`759163b65f28a374e91b819aaf13ec6feb69718535c5fa6b4f70ef1985b1f996`.
[Actual comparison and limits](production-readiness.md#oct21-hosted-client-comparison-passes).

Offline mapping now accounts for all65tables/2,239records/two sequences/68blobs;
root reproduces it and checks both archive artifact hashes. A separate selected
six-table/167-row memory-only export verifies all68 relative Attachment paths,
source object IDs/versions/byte metadata and SQL-NULL owners. Destination uploads,
managed compatibility/Auth continuity, rich-text references and the October13
recovery-point qualification remain open. Vercel CLI login refresh also succeeds
without another owner login; exact production stays paused/protected and cron
configured enabled. [Mapping/source scope](production-readiness.md#oct21-explicit-archive-mapping-and-source-file-consistency),
[Vercel access](vercel.md).

## Oct21 actual hosted handoff and independent pause closure

R4 process full-read repair passes 57 closed controls and actual source-bound
inspection; both R5/R6 current/preflight scans pass. Root catches the PG-variable
handoff conflict before activation; actual R5 then exposes the original provider
URI placeholder rejection before activating its child. Both failures are retained.
The separate R6/V5/D5 repair passes 45/39/24 closed controls plus qualified
historical actual-capture replays, without weakening target or connection checks.

Actual R6 verifies fresh sources and attempts one real psycopg connection, which
fails before SQL executor entry/commit with discarded diagnostics. Hosted schema,
import and release remain unverified. Its child closes; observed original
settings match. Pause200 outlasts the initial observation, then independent
01:49:47 UTC confirms the exact replacement INACTIVE without another POST/SQL.
The original result is not rewritten. The exact unchanged D5 function then
passes actual local PG17 TLS/verify-full/close-before-SQL and rejects an untrusted
CA, with owned fixture removal. D6 finite diagnostics now pass 37 closed controls
with unchanged connection factory; hosted cause remains open. No connection-
parameter change follows from the generic error. Backup chronology identifies the
October 13 archive's unverified export-to-pause interval; mapped rehearsal and
authoritative customer recovery are distinct.
[Actual evidence, limitations and retained manifests](production-readiness.md#oct21-hosted-attempts-and-independent-closure).

Five old local test-stack siblings are then stopped once after fresh identity/
connection/dependency checks. Independent readback confirms all six namespace
members stopped, former listeners absent, declared static metadata/config and
unrelated inventory states preserved. Objects/volumes/private restart inputs
remain; original stdout-set uncertainty is not rewritten or retried. Exact
TLS/D6/cleanup custody:36 files/219,706 bytes, manifest
`0e07e7c147bbe4e1d0208ee5702f03fa799eee6d86f442fd7f4fb9bd035567cb`.
[Actual cleanup and scope](production-readiness.md#oct21-old-local-test-stack-closed).

## Oct21 publication 73620f9 verification

All five exact-head runs pass: Quality PR 39512762422/push 39512756307, Secret Scan
PR 39512762418/push 39512756299 and CodeQL 39512757969. CodeQL analyses 1992630368/
1992628008 have zero results/errors; PR-head open alerts are zero. The required
local push hook passes its quiet secret scan, lint 0 errors/22existingwarnings and
753 integration/29 skips; these local counts are not assigned to remote logs.
PR 46 remains open/draft with independently read-back matching head/body. Finite
publication custody manifest:
`457c62f79a9850a486393428e375b078f7025fcbf2e5797f7b4a213c168e32d2`.
No deployment or later browser journey follows from these checks.

## Oct20 complete capability review and transaction rehearsal

Full actual metadata review passes for conditional customer-free atomic setup.
The transaction-specific compiler/executor pass44/35 closed tests and actual local
BEGIN-first success/forced rollback with stable PID/XID, final227/effective rights
and managed preservation. External proofs remain synthetic. Root actual-baseline
preflight exposes a300-vs256 parser bound before provider/SQL calls; the narrow R2
fix passes root actual retest and27/20 closed controls. Real-verifier/local-SQL
success/final-claim rejection rollback pass too. The exact local Kong gateway is
stopped with sibling/core-identity preservation; aggregate config equality remains
unproven. Fresh tooling classification and hosted execution remain open.
[Evidence and custody](production-readiness.md#complete-capability-review-and-transaction-rehearsal).

## Oct20 publication c72c269

All five exact-head workflows pass: Quality PR39508992208/push39508986794 (all four
jobs), Secret Scan PR39508992396/push39508986899 and CodeQL39508988830. Both matching
CodeQL analyses1992470141/1992467422 have zero results/errors; PR-head open alerts
are zero. Local required push checks pass secrets/lint0errors22existingwarnings/
753integration29skips, without assigning those totals to remote logs. PR46 is
independently verified open/draft with exact head and updated description.
Two-file finite publication custody manifest:
`dd3738bbc47e54ea95c51bbd7348e0e9422417268e7c2fc1d0473c56c16597f9`.
No application deployment or later browser proof follows.

## Oct20 complete hosted metadata capture

The exact advertised transaction endpoint passes actual TLS/PG17/postgres role,
54 SQL queries in one READ ONLY transaction, stable positive XID/PID and complete
bounded metadata/empty-state checks. ROLLBACK/end and final22:26:35 pause preserve
original observed settings. Complete capability review, hosted atomic schema
preparation, data recovery and release remain open; this is not a deployment.
[Current evidence](production-readiness.md#advertised-transaction-connection-complete-metadata-captured).

## Oct20 publication aa92423

Documentation checkpoint `aa92423` has five successful exact-head workflows:
Quality [PR](https://github.com/nospotfer/jazz/actions/runs/39503736855)/
[push](https://github.com/nospotfer/jazz/actions/runs/39503730800), Secret Scan
[PR](https://github.com/nospotfer/jazz/actions/runs/39503736844)/
[push](https://github.com/nospotfer/jazz/actions/runs/39503730719), and
[CodeQL](https://github.com/nospotfer/jazz/actions/runs/39503733086).
All four Quality jobs and both analysis jobs pass. The two exact-head analyses
have zero results/errors and PR-head open CodeQL alerts are zero. Local mandatory
push checks pass secret scanning, lint 0 errors/22 existing warnings and
753 integration tests/29 skips; full remote logs are not reparsed and those local
totals are not assigned to CI. PR46 remains open/draft with matching head.
Finite publication custody is retained separately with manifest
`c05e2419dd90b398453d360db9228fc1147a91227006c29ab092884add681903`.
Application browser proofs retain their earlier sources; no release occurs.

## Oct20 current lockfile and publication

Published checkpoint `8e6b7c2` has five successful exact-head workflows: Quality
[PR](https://github.com/nospotfer/jazz/actions/runs/39487728459)/
[push](https://github.com/nospotfer/jazz/actions/runs/39487723014), Secret Scan
[PR](https://github.com/nospotfer/jazz/actions/runs/39487728301)/
[push](https://github.com/nospotfer/jazz/actions/runs/39487723020), and
[CodeQL](https://github.com/nospotfer/jazz/actions/runs/39487724852).
All four Quality jobs pass; two matching CodeQL analyses have zero results/errors
and the actual PR-head open alert count is zero. Full Quality logs were not
reparsed for this checkpoint, so earlier suite totals are not reassigned to it.
PR46 remains open/draft with independently matching head and description.

A separate fresh Node24.21.0/npm11.19.0 lockfile audit reports production0 and
full5 high entries, all in the existing development lint dependency chain from
Next ESLint through fast-glob/micromatch/braces. They share one advisory,
[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
No patched braces version is available at this check; npm's suggested major
lint downgrade is not applied. Development scope does not make the possible
process-terminating stack exhaustion harmless. Static locked-source/config
inspection finds the affected Next callsite requires an explicit rootDir glob,
which maintained configuration does not supply; this is not deployed-reachability
proof. DEP-01 stays open. The push warning's168 default-branch findings were not
independently inventoried and cannot be closed or called stale by this audit.

Finite publication and dependency summaries are retained separately under
`review-checkpoint-publication-8e6b7c2` and
`review-checkpoint-dependency-refresh-8e6b7c2` in the maintenance backup root,
with exact-copy hashes and0600/0700. Local unencrypted retention is not off-site
recovery. No application/lockfile/dependency, deployment or provider change
follows from those checks.

## Oct20 whole local executor and hosted review

The real local PG17/psycopg whole-sequence rehearsal now passes one COMMIT and
a separate forced final rejection/ROLLBACK, with effective rights and managed
metadata preserved. R2 passes28 closed controls. Provider/TLS/verifier inputs
remain synthetic; this is not hosted bootstrap or customer-data recovery.
Actual hosted SQL separately verifies client TLS/PG17 identity and partial
metadata, but subsequent inspection failures leave complete provenance open.
[Current evidence and limits](production-readiness.md#whole-atomic-executor-actual-local-success-and-rollback).

## Earlier Oct20 replacement Auth and schema rehearsals

One new Free replacement is verified as the sole inventory addition. Minimal
Auth PATCH200 matches all49 desired values and preserves unrelated settings.
Stored/effective disabled API schemas pass, but public503/PGRST002 leaves runtime
containment unproven; the bounded scope pauses the replacement. Independent
19:47:59 reads confirm replacement/production INACTIVE, preview healthy and
observed original settings unchanged. No hosted SQL/TLS/empty-data/bootstrap
proof or customer import follows.

Separate real local PG17 rehearsals pass15/17 checks and422 zero-row permission
operations per run with exact225→227 structure and synthetic managed helpers.
Coupon runtime/controller sources pass26/29 closed checks, separate from the
original61 guard/plan checks; no actual coupon journey is activated.
[Hosted evidence and next step](production-readiness.md#free-replacement-auth-verified-api-readiness-unresolved),
[coupon scope](dodo.md#coupon-follow-up-preparation).

## Oct20 refund recovery identifies a sandbox wallet denial

Actual bounded same-payment execution captures409 `INSUFFICIENT_WALLET_FUNDS`;
final canonical reads find no refund/full8997 refundable and retain the purchase.
All29 original fingerprints/23 prior sessions/actor sessions0, four actual service
exits0/endpoint404/full45,831-file seal and formal closure pass. No actor/checkout/
card or financial retry. Separate one-GET ledger evidence verifies historical
credit8997/fee535/after8462, not current account totals. Merchant-sandbox funding
or settlement remains unresolved. The earlier discarded409 body stays unknown.
[Actual scope, costs and limits](dodo.md#latest-oct20-checkpoint-captured-sandbox-wallet-denial).

## Oct20 legacy-key restoration and free recovery capacity

The separate isolated legacy-key control verifies gateway denial and restoration
of the same key at17:41 UTC. All29 fingerprints, catalog and exact settings match;
delayed flag reads and the runner's initial stop remain preserved. Current17:59
account metadata confirms one active/one paused Free project and sole ownership,
supporting a candidate replacement slot. No destination is created. The October13
archive is not proven current; managed restore/Auth/Storage/hosting and refund
execution remain unfinished. [Actual evidence and limits](production-readiness.md#legacy-key-control-and-free-replacement-candidate).

## Oct20 isolated API control closes with preserved data

The exact preview is healthy again at17:19 UTC. Its sole inactive empty-schema
PATCH returns404; one pause/restore is completed and every full29-table
fingerprint, hardened catalog and exact Auth/PostgREST setting is preserved.
Earlier probe-contract and short-observation failures remain separate. This
does not establish production containment; production remains INACTIVE.
[Actual results, source checks and remaining work](production-readiness.md#actual-isolated-control-result).

## Oct20 current production checkpoint

Exact Jazz Vercel protection and pause are applied. Two independent read-only
checks confirm503 on production even with the retained bypass; Supabase stays
INACTIVE. Cron disable, direct Data API containment and stable free hosting
remain incomplete. [Actual effects, limits and rollback](production-readiness.md).

## Earlier Oct20 checkpoint: payment verified; refund409 unresolved

The sealedba105 TEST payment and signed native fulfillment now pass fresh
independent readback: canonical USD89.97/tax0, one exact purchase/processed event,
all29 original fingerprints/nine prior accounts/23 sessions preserved, actor
sessions0. Both closed scopes pass complete45,831-file artifact hashing.

A separate refund-only scope creates no actor/checkout/card. Its sole full-refund
POST returns409/no refund ID; subsequent GETs show zero refunds and USD8997 still
refundable. The error body was discarded by the helper, so the cause is unknown.
All four temporary services finish0, endpoint404/socket absence pass, and the
purchase remains. Refund/access reversal is unverified; spent local/global
reservations are preserved. No retry or production change occurs. Next: bounded
failure diagnostics/provider recovery, plus independent production-hardening,
hosting and release work. [Scope and limits](dodo.md#oct20-sdk-verified-scope-details).
Earlier unpaid-only/preparation-only checkpoint statements below are historical.

Updated 2026-10-20. Draft review: [PR #46](https://github.com/nospotfer/jazz/pull/46)
on `maintenance/initial-audit`. Source is unreleased and maintenance remains
incomplete. The separately approved production Supabase recovery/export/unsafe-state
rollback completed; production is paused again. A provider build success is not
proof of an isolated, working preview. Historical checkpoints below retain the
evidence available at their dates; the latest sections supersede old access gates.
Earlier source/test checkpoint `ac62f4a` restores an applied migration's exact
historical SQL and adds four checksum regressions. A clean env-free local suite
passes2,537 normal tests with80 intentional skips. Landing changes remain bound
to`1e381a3`; the latest authenticated monetary browser proof is`5f9597a`, with
later voucher presentation checked separately. Remote checks and earlier
accounting, editor, language, learning and media evidence retain their exact
source bindings below.

## Oct20 hosted SDK and controller follow-up

Verified publication4eab0b5 has five successful exact-head checks; both Quality
logs show2,656 normal/80 skips and80 persisted/one skip, with types/webpack31/
lint0errors22warnings and exact PR-head CodeQL alerts0. Later offline work
identifies a real deployed-SDK client-secret request shape rejected by the test
controller. A separate preparation copy repairs that comparison and adds passive
readiness/capture evidence; original sources/ledgers stay preserved. Actual SDK
initialization, payment acceptance and production release remain unverified.
[Exact scope and tests](dodo.md#deployed-hosted-sdk-contract-and-scoped-secret-repair).

Exact4eab0b5 runs: Quality [PR](https://github.com/nospotfer/jazz/actions/runs/39429704843)/
[push](https://github.com/nospotfer/jazz/actions/runs/39429696433), Secret Scan
[PR](https://github.com/nospotfer/jazz/actions/runs/39429704748)/
[push](https://github.com/nospotfer/jazz/actions/runs/39429697049), and
[CodeQL](https://github.com/nospotfer/jazz/actions/runs/39429701009).

## Oct20 Dodo UI card action is spent; transport remains unverified

Latest actualba105/45,831 scope is `CLOSED_INCOMPLETE_CARD_TRANSPORT_UNVERIFIED`,
under fixed12:24:22.078–12:54:22.078 UTC lease. Same browser/login/new checkout/
two manual-fill POST200s/one Continue POST200; stable session-query revision1,
actual document GET12:27:42.318 and ADOPT without navigation expose three card
fields in a provider iframe. One UI action moves RESERVED-before-typing12:27:55.275→
UI_CLICKED12:28:10.275; GET age12.957s, no initialization/reload/retry. The empty
card-response list proves no observed guard-admitted write response, not zero
actual requests or acceptance. Last exact provider GET after closure remains
requires_payment_method12:30:47.215; no positive journal/purchase/refund verified.
Cause is unknown; first16 global denials cannot attribute the card phase.

Browser92 blocks/93 console errors remain incompletely attributed; command and
observation failures0. Normal UI logout/profile deletion/browser terminal0 pass
12:29:09.607. Independent three read-only SELECT201s pass12:30:07.133, preserving
29 original fingerprints/nine prior accounts/23 sessions/current10 accounts/
1,515 rows/confirmedUSERidentity1sessions0purchases0. Raw `STRICT_NO_CARD` helper
label is preserved and explicitly qualified: it describes valid unchanged-data
queries, not absence of the spent UI card action. Five services terminal0/socket
absent/Cloudflare group0, endpoint40412:31:10.343/full seal12:31:15.403 pass.

Retention64 files/412,746 bytes passes exact source/copy rehash and zero actual-
used secret/private provider URL/query matches, manifest
`fd0c1aff61d0871010d8016c1f40f14aa6316734f5580ace807139da5213d337`.
Raw provider/DB/mail/browser state/enabled inputs/credentials/recovery excluded;
local/unencrypted, no off-site claim. Actual corrected handoff helper and agent
original/frozen manifest are retained separately; offline71/5/24/16/2 preparation
checks are not live proof. Separate0600 private recovery grants no second-card
authority. Financial-test loop stopped; next is offline per-phase counts/SDK
readiness, no new activated scope. [Latest scope and custody](dodo.md#oct20-settled-document-ui-card-action-spent-transport-unverified).

## Earlier Oct20 Dodo SPA scope closes after a transient observation

This earlier completed actualba105/45,831 scope is
`CLOSED_INCOMPLETE_TRANSIENT_SPA_OBSERVATION_CONTROLLER_FAILURE`, under the fixed
11:59:34.199–12:29:34.199 UTC lease. Same existing USER/profile, one password-token
attempt, one new app checkout and one new unpaid TEST requires_payment_method;
two manual-fill POST200s/one Continue POST200, no new actor/card/refund. The first
dashboard wait times out after verified identity. The observer freezes the first
actual from-only SPA URL12:02:50.630. A later URL change rejects current binding;
no later-current-URL receipt is captured. One root exact document GET passes
12:03:07.266 against the first observed opaque path/checkout/payment/API facts.
One same-profile initialization uses that first URL verbatim12:03:46.925 and
another SPA query change fails the document guard. Provider/app defect unproven.

Browser106 blocks/107 console errors/three command failures/one observation
failure remain incompletely attributed. Normal logout/profile removal/browser
terminal0 pass12:04:39.397. Initial malformed negative probe400 stays separate
from corrected actual401; setup19/private-SSH11/DNS3/TLS502 proves no positive
fulfillment. Independent closure12:05:05.166 preserves29 original fingerprints/
nine prior accounts/23 sessions/refresh tokens/ledger, current10 accounts/1,515
rows/confirmedUSER/identity1/sessions0/purchases0. All five services terminal0,
socket/Cloudflare group0, endpoint40412:05:44.413/full seal12:05:49.555 pass.

Retention59 files/389,335 bytes passes exact rehash and zero actual-used secret/
private provider URL/query matches, manifest
`f1212ae03b2015a2be97a1984fb4b7e49ff3f91ee46d02f4b9b1564171fd450c`.
It excludes raw provider/DB/mail/browser state/enabled inputs/credentials/recovery;
local/unencrypted, not off-site. The separate0600 SPA unpaid-record recovery file
grants no autoload/role/session/activation authority. The then-prepared settled-
document scope subsequently runs and closes above; no financial success follows.
[Earlier scope, custody and guards](dodo.md#oct20-spa-scope-transient-observation-does-not-establish-a-card-journey).

## Earlier Oct20 Dodo fresh session closes at an SPA observation limit

This earlier completed actualba105/45,831 scope is
`CLOSED_INCOMPLETE_SPA_OBSERVATION_CONTROLLER_FAILURE`, under the fixed
11:42:53.694–12:12:53.694 UTC lease. One new normal app checkout and one new
unpaid TEST payment (`requires_payment_method`, EUR9680 total/tax1680) are
verified; one checkout/Continue reservation each is spent. No new actor/card/
refund action occurs. In the same browser, two manual-fill POST200s and one
Continue POST200 precede an SPA URL change to one opaque path/session query
without HTTP document navigation. No observed raw document receipt is created;
its producer fails before GET/attempt reservation. No provider/app defect follows.
Browser158 blocks/162 console errors/zero command failures remain incompletely
attributed; normal logout/profile deletion pass11:51:57.832.

Independent11:56:41.195 closure preserves29 original fingerprints/nine prior
accounts/23 sessions/refresh tokens/ledger, with current10 Auth/app accounts/
1,515 rows and confirmedUSER/identity1/sessions0/purchases0. All five services
and browser finish terminal0; profile/socket are absent, exact endpoint404
passes11:57:36.728 and full45,831 seal passes11:57:55.530. Retention56 files/
376,422 bytes passes exact rehash/zero actual-used secret/private provider URL
matches, manifest `57e3140682cdc0aca9d7e00009c6d30a4984e9574fa2f3fc3fc37964fff04c56`.
The local/unencrypted package excludes raw provider/DB/mail/browser state,
enabled inputs/credentials/recovery; no off-site claim. The separate0600 fresh
unpaid-session recovery file grants no loading/role/session/activation authority.
[Earlier scope, destination and limits](dodo.md#oct20-fresh-session-unpaid-payment-and-spa-observation-limit).

The subsequent SPA controller's67 synthetic/22 syntax/16 barrier checks remain
preparation-only evidence; its actual closed result is separately recorded above.
Financial proof and the full goal/production release remain incomplete.

## Earlier Oct20 Dodo continuation closes after link-expired redirects

This earlier actualba105/45,831 scope is
`CLOSED_INCOMPLETE_UNSUPPORTED_CHECKOUT_RESUME`: the fixed11:24:16.375–11:54:16.375
UTC lease closes early around11:34. Two fresh browsers redirect to the same TEST
origin's `/status/[opaque]/link-expired` shape. No new actor/checkout/payment,
billing/card/refund action occurs; the original before-state and all six effect
ledgers remain exact. The earlier unpaid payment remains `requires_payment_method`.
The first browser logs out normally. The second normal logout fails before any
Auth POST; exact-profile cleanup verifies live identity, uses one global204
without password login, then independent sessions0 proof precedes profile deletion.
The cause beyond observed provider rejection remains unproven.

Independent11:32:28.530 closure preserves29 original fingerprints/nine prior
accounts/23 sessions/refresh tokens/ledger, with current10 Auth/app accounts/
1,515 public rows and confirmedUSER/identity1/sessions0/purchases0. All five
services finish terminal0, profiles/socket are absent, exact endpoint GET404
passes11:34:19.664 and the full45,831-file seal passes11:34:24.291. Selected
retention passes51 files/249,223 bytes, exact rehash and zero actual-used secret/
private provider URL matches; local/unencrypted, no off-site claim. Its directory
is `review-checkpoint-dodo-continuation-ba105-20261020` under the maintenance
backup root, manifest
`4d3f3ce80e696aabdc2e134fadabe2dd6be48d2b2b915232a7ae7e38820aacf7`.
[Earlier finite scope and exclusions](dodo.md#oct20-continuation-reused-checkout-links-are-rejected).

The documented single-use `checkout_url` contract supersedes the earlier reuse
proposal; neither a bare API payment link nor a reconstructed opaque query has
a documented resume guarantee. The then-prepared fresh-session scope executes
and closes separately above, retaining the same USER/profile and single-use
constraints.
No payment/refund/positive fulfillment, account membership or production-release
proof follows.

## Earlier Oct20 follow-up closes with an unpaid TEST payment

The10:31:06.315–11:01:06.315 UTC follow-up on actualba105/45,831 closes early
around10:59. It reuses the original confirmed USER and exact checkout created
10:03:12.238626 UTC, with no recreation/new checkout. Five own-host POST200s
cover two initial fills/two manual fills/Continue5; the four older reservations
remain spent. Continue5 creates a TEST payment10:39:39.286317 with status
`requires_payment_method`, canonical EUR9680 total minor units/tax1680/base€80.
Exact GET200 binds checkout/cart/actor/business/brand and observed payment path.
This is an unpaid quote/record, not a completed charge, settlement or fulfillment.
Card marker remains absent, refunds0 and app purchases0.

Five fresh browsers do not form an uninterrupted/error-free journey. They expose
manual/path/SDK guard restrictions; the final own-first-party top-navigation
block's cause remains unclassified, not an established provider failure. One
normal UI logout fails: cleanup-only live Auth GET verifies the exact actor,
then one global logout204 without password login and independent sessions0/
original23-session preservation precede matching profile deletion. The fifth
reports normal logout/profile removal without card use. Runtime19/private-SSH11/
invalid-signature401/public-host DNS3/TLS/actual-path502 are bounded setup checks;
58 synthetic SDK checks are preparation only.

Independent closure PASS11:00:27.663 preserves25 public tables/29 original
fingerprints/all nine original accounts/23 sessions/refresh tokens/ledger;
current10 Auth+10app accounts/1,515 rows, confirmedUSER/identity1/sessions0/
purchases0 and owner SUPER_ADMIN. Three read-only SELECT201s verify the read-only
role/transaction; receipt SHA256
`773ed0fa2bb3a1095f42e242623931358c2ed69b3a0a025b941281f4320f0442`.
Services are confirmed terminal0; independent endpoint GET40411:00:29 follows
DELETE/disable. Final owned browser/cleanup process count is0, profile/socket
are absent, Card/Continue6 markers are absent and the full45,831-file post-seal
passes11:02:03.581. Current v2 retention passes51 files/387,062 bytes, exact rehash
and zero actual-used credential/private checkout/payment/document URL matches:
`/home/gabriel/backups/culturadeljazz-maintenance/review-checkpoint-dodo-followup-ba105-20261020-v2`,
manifest `e2450f3d3b9302c33c407bd12e4717683b8223a0267477c1d3285869bbba0466`.
The selection includes the actual closure checker and excludes raw provider/DB/
mail data, browser state, enabled inputs and the separate private recovery file;
it is local and unencrypted, not off-site. Comprehensive status remains
`CLOSED_INCOMPLETE_TEST_CONTROLLER_FAILURE`. Its then-proposed old-checkout reuse
is superseded by the closed continuation and single-use contract above.
No completed payment/refund/signed fulfillment, account membership or production
release is inferred. [Historical scoped evidence](dodo.md#oct20-follow-up-existing-checkout-creates-an-unpaid-test-payment).

## Oct20 current-source Auth passes and published TEST setup

Exact sealed `3e5b2c180316997d732ac96e64e7937bf41d8341`/45,831 now passes
fresh registration and separate uninterrupted recovery. Registration observes
register200/pending=false, one fresh Resend email/one metadata GET/one body GET,
verification200, password login/matching dashboard and normal logout204→home.
Independent closure preserves the eight prior actors/1,513 public rows/23
sessions; the new pinned USER is confirmed/app-verified with one identity/
sessions0. Recovery separately observes one reset200/provider303/callback307/
reset200/getUser/form/PUT200, automatic204, old400/new200/dashboard and final
normal204→home. The actual reset starts within five seconds of the independent
current provider GET/live guardian identity check. No controller repair,
browser restart, authenticated/profile resume or provider verification replay
occurs during that run; the scoped redirect adapter retains the original request.

Recovery closure retains all nine accounts/1,514 public rows/25 public+three Auth
tables/23 original sessions and every other eight actors' rows. The same
confirmed/app-verified USER has one email identity/sessions0. Only
`auth.users.encrypted_password`, `last_sign_in_at` and `updated_at` change;
the selected current fixture's old password fingerprint matches before and
differs afterward alongside actual old400/new200. Both scopes restore every Auth
field, close owned resources and pass complete45,831-file reinspection.
Production remains INACTIVE with zero production writes. Registration records
7 blocks/7 console errors/0 page errors; recovery9 blocks/11 console errors/
0 page errors/0 command failures, with native0/0. Attribution remains incomplete;
neither journey certifies an error-free dashboard or general integration health.

Selected local/unencrypted retention excludes credentials, raw provider/DB/mail
data, browser state and enabled inputs:

- Registration:44 files/294,368 bytes at
  `/home/gabriel/backups/culturadeljazz-maintenance/review-checkpoint-fresh-registration-3e5b2c1-20261020`,
  manifest `6b9648aa1386bc05507cfd86cf1439dc691a2e896edb7518e82a937c10a35b7d`.
- Recovery:49 files/266,630 bytes, including six normalized actual browser stage
  snapshots, at
  `/home/gabriel/backups/culturadeljazz-maintenance/review-checkpoint-current-recovery-3e5b2c1-20261020`,
  manifest `a89011efae3877029bedb3abb0525496b1a73285655def28baab198c9258f285`.

Both selected packages have zero actual-input/private-value matches; recovery's
actual recovery-URL scan also has zero matches. No off-site retention is claimed.
The current mail fixture is separately0600 at
`/home/gabriel/backups/culturadeljazz-maintenance/native-preview-configuration/mail-test-auth-fixture-20261020-current-source-private.json`;
the earlier Oct20 fixture is historical. Seven closed mail scopes consume nine
send actions/seven observed Resend emails. Built-in delivery after the earlier
stale-readiness setup is unverified. Historical ledgers and fixtures grant no
live authority. The older30d848a controller-repair/same-profile-continuation
result stays distinct. [Exact Auth evidence](cloud-auth-mail.md).

Latest published source
[`81eef3fe5efe378b54646d8612533f0f2bac7d91`](https://github.com/nospotfer/jazz/commit/81eef3fe5efe378b54646d8612533f0f2bac7d91)
has five successful exact-head workflow runs: Quality
[pull request39416735300](https://github.com/nospotfer/jazz/actions/runs/39416735300)/
[push39416729197](https://github.com/nospotfer/jazz/actions/runs/39416729197),
Secret Scan
[pull request39416735438](https://github.com/nospotfer/jazz/actions/runs/39416735438)/
[push39416728981](https://github.com/nospotfer/jazz/actions/runs/39416728981),
and one [dynamic CodeQL run39416732263](https://github.com/nospotfer/jazz/actions/runs/39416732263).
An exact-head Actions API readback confirms these five runs; CodeQL's actions
and JavaScript/TypeScript Analyze jobs both succeed. No separate CodeQL push run
is listed. Downloaded Quality logs verify2,628 normal
passes/80 intentional skips,80 persisted passes/one skip, types/webpack/
static31-of-31 and lint0errors/22warnings; actual `refs/pull/46/head` CodeQL
alerts0. Both analyses match the exact commit; maintenance/PR heads are equal
and stable before/after the read. No maintenance-branch analysis ref is inferred.
Finite downloaded-log/API evidence is at
`/tmp/jazz-maintenance/fresh-auth-publication-20261020/81eef3f-publication-ci-summary.json`.
The earlierba105 TEST-profile feature's exact Quality PR39400258917/
push39400254159 and Secret Scan PR39400258966/push39400254060 remain historical.
CI does not extend hosted proof beyond its actual artifact or release production.

Fresh QuickTunnel capability now passes DNS on the system/1.1.1.1/8.8.8.8
resolvers and verified HTTPS to the deliberately absent origin's expected502;
the owned probe closes cleanly. The earlier closed hostname's NXDOMAIN is not a
current general DNS blocker. Each actual hostname still requires a fresh check;
the dedicated Dodo host passes its own public DNS/TLS checks. Stable free hosting
and production migration remain separate.

The following first-baseline checkpoint and its then-proposed follow-up remain
historical; the latest closed follow-up is recorded above.

The Dodo baseline window closes10:22:08 UTC on actualba105/45,831, with product
GET200/dedicated public DNS/TLS/native19/private-SSH11/invalid-signature401 and
full post-closure seal PASS. One actual app TEST checkout is opened/reopened as
the same checkout. Four billing-Continue reservations are recorded, but the card
attempt marker is absent and no actual completed payment/refund/signed
fulfillment is verified. Browser1 fails a selector before click; browser2 has
readonly-email/manual-address controller bugs; both close normally. Browser3
denies its delayed own-host billing POST after immediately revoking its arm, a
controller bug rather than an application/provider failure. Its `LEASE_GUARD`
closure logs out/removes the profile; remote processes0/socket identity removal
and native/SSH/listener/Cloudflare terminal0 follow. Endpoint DELETE/disable is
accepted at10:21:09. Negative401 is not positive signed-delivery evidence.

Independent final closure PASS10:26:40.651 UTC preserves29 original table fingerprints, nine
original accounts/23 sessions/refresh tokens/ledger, with current10 accounts/
1,515 public rows and confirmedUSER/identity1/sessions0/purchases0. The initial
checker FAIL is retained separately: one additional read-only SELECT classifies
the managed principal as `supabase_read_only_user` on `postgres` with
transaction_read_only=on. The three original data reads are not repeated; all
four responses are201 and writes0. This corrects an unnecessary helper assumption,
not a provider/application failure. Data/resource closure passes while the
payment scope remains CLOSED_INCOMPLETE_TEST_CONTROLLER_FAILURE. Finite receipts stay under
`/tmp/jazz-maintenance/dodo-baseline-actual-20261020`.
Selected local/unencrypted retention is29 files/192,091 bytes at
`/home/gabriel/backups/culturadeljazz-maintenance/review-checkpoint-dodo-baseline-ba105-20261020`,
manifest `cc1038f103d451e1f27cdfbd0d39f980f3ee03477ad13215ee1576699b7ddc59`.
Exact rehash and actual-used credential/private-checkout-URL scans pass with zero
matches; raw provider/DB/mail/browser data and enabled inputs are excluded.
Follow-up preparation reuses the original actor/same checkout only under a fresh
unactivated window and explicit budgets. The owner supplied a likely login email,
without verified membership/login/dashboard settings; no further approval question
is needed. Payment/return/reconciliation/reversal, account settings, stable free
hosting, full integration and production release remain open. [Current Dodo closure](dodo.md#oct20-actual-test-checkout-and-closed-window).

## Oct20 actual hosted recovery and continuing authorization

This source30 checkpoint, its then-current fixture/totals and its then-open fresh
registration/recovery gates are historical; the current capsule above supersedes
those gates without changing the qualified result below.

Sealed source30d848a now passes actual hosted recovery: one reset request200,
one metadata GET/body GET of the same fresh controlled record, one provider303,
application callback307 and reset200, exact confirmed USER/getUser and visible
form, one password PUT200, automatic logout204, old-password400, new-password200
with dashboard access and final normal logout204 to home. No provider link is
replayed. This is a same-profile continuation after repairing the test controller's
strict handling of the SDK's two null PKCE fields, not an uninterrupted fresh
current-source run or an application payload repair.

The first controller has one policy block/one command failure; the resumed
controller has12 blocks and14 console errors, zero warnings/page errors/command
failures. Native counters are0/0. Embedded-Python compilation, pre-transport SDK
rejection, stale-lock assertion and wrong expected logout destination are retained
harness failures. These results do not establish an error-free dashboard.

Independent final checks restore every Auth field and preserve the original25
public tables/1,511 rows, three Auth projections and six accounts. The mail actor
remains USER, now has its verified changed password and sessions0; current private
credentials are separate from review evidence. All owned services close and the
45,830-file seal passes. Production stays INACTIVE/unchanged. Retain/re-hash45
selected files/247,001 bytes, manifest
`73c507f4669d2f0186640d4801a168fb4b9f7e1099d791fa448a2cf7072fab49`.
Local unencrypted evidence excludes provider snapshots, credentials, email bodies
and browser state. No new Oct20 provider-quota reading is claimed.

The owner has given continuing authorization for bounded controlled tests and
reviewed project operations after technical prerequisites/rollback are ready;
historical unanswered-approval statements are superseded by the
[root contract](../../../AGENTS.md). Six historical send actions/five emails are
spent; closed windows stay closed. Fresh complete registration and an
uninterrupted fresh current-source recovery journey remain next work, alongside
Dodo, hosting and production readiness. [Exact recovery evidence](cloud-auth-mail.md#oct20-hosted-recovery-with-controller-repair).

## Oct20 encrypted second-host preservation

The original79 production preservation artifacts plus their unchanged manifest
are encrypted and hash-verified on Monster and Behemoth:80 files/7,757,784
plaintext bytes,7,827,280 ciphertext bytes. Actual receiver decryption verifies
every member hash and complete GnuPG integrity without extraction. A second
successful run uses only the five durable receiver verifier/spec/receipt/help
files; it requires neither Monster nor provider/email access. Original source
signatures/hashes are unchanged, files/directories are0600/0700 and both scoped
GnuPG agents close. Preparation separately passes13 real synthetic checks.

The dedicated private key is only on Behemoth and has no passphrase; Monster has
only public material. Physical off-site separation, independent key escrow,
periodic retention and full platform/configuration recovery remain unverified.
No production/provider/Auth/mail operation occurs. [Exact paths, checksums and
re-verification command](supabase.md#encrypted-second-host-preservation--oct20).

## Oct20 recovery error privacy and localization

The reset page still logged arbitrary URL error descriptions/type and raw
OTP/session provider prose. Four rendered-component regressions reproduce those
private-detail emissions; four further cases reject unlocalized update errors
across ES/EN/FR/PT. All eight fail before the repair and pass afterward.
Diagnostics now retain only owned stages, booleans and the existing finite
error categories/statuses. Update failures use localized copy, and three
Portuguese messages no longer fall back to Spanish.

The three focused files pass 47 tests; full types and touched-file lint pass
without errors or warnings. Independent diff review finds no identity, PKCE,
session, update-payload, success-timing or logout/navigation change. These are
mocked component/route checks, with no email/provider operation or deployment.
The subsequent hosted test remains bound to the earlier sealed source30d848a
and passes with the controller repair/profile continuation recorded above. The
later source-only privacy/copy proof is not an actual current-source journey.

Published application/test source46a4dc9 passes exact Quality PR/push and Secret
Scan PR/push plus CodeQL. Downloaded logs verify2,584 normal passes/80 skips,
753 integration passes/29 skips,80 persisted passes/one REST skip,
types/webpack/static31-of-31 and lint0errors/22 existing warnings. Exact analyses
have0 results/errors/open PR-ref alerts; the300-changed-file diff retrieval
warning and five earlier main alerts remain separate.

## Oct19 late automated reset delivery and redirect gap

One newly approved automated reset on the same sealed source30d848a produces
one delivered test email; observed usage rises3→4. The same message is retrieved
twice after a matched-text-wrapper parser repair, with no body/link in review
evidence and no owner Gmail action. Actual provider verification303 is observed,
but Playwright's redirected-request behavior bypasses the private native adapter
before the application callback. No password update or old/new login check occurs.
The initial password remains unchanged and actor sessions are zero.

The original25-minute deadline is unchanged despite one pre-send guardian
readback failure and restored retry. Every Auth field, all six original accounts/
1,511 public rows/25 public+three Auth projections/table set are preserved. All
owned services/sockets/profile lock close normally, native warn0/error0, and the
45,830-file seal passes after closure. Narrow browser counters are zero; this is
not recovery/dashboard health. Selected30 files/30,301 bytes are retained and
rehashed owner-only, without raw inputs or credentials. Across all three
approvals five actions are spent and four emails sent; no further mail authority.
[Exact automated test and limits](cloud-auth-mail.md#automated-one-reset-window-and-private-redirect-limit).

The preceding documentation head1da1b0a passes exact Quality/Secret PR+push and
CodeQL with the same source30 test/build counts. Exact analyses have zero
results/errors/open PR-ref alerts; CodeQL warns that full PR-diff retrieval is
limited to300 changed files. Documentation verification does not extend hosted
runtime proof beyond source30d848a. A subsequent disabled redirect correction
passes103 synthetic checks and an actual loopback-only before/after browser proof:
real303 bypass before, same-context307/200 once each after, cookies/form/replay
checks and complete owned cleanup. All profiles/temp directories are removed.
Source hashes and17 selected preparation files are retained owner-only outside
/tmp. This remains separate from hosted recovery and grants no new mail scope.
[Prepared correction](cloud-auth-mail.md#separate-loopback-redirect-correction).

## Oct19 evening reset delivery and closed window

The owner separately approves one additional reset email to the existing
controlled USER. Exact30d848a reuses its completely inspected45,830-file artifact
with a fresh gate and native19/private-SSH11 proof. The25-minute lease starts
21:46UTC; its eight-field SMTP/origin scope changes no template or metadata.
The one action is reserved before transport; `/recover`200 and Resend usage2→3
pass. Exactly one new controlled-alias email at21:49:18 has provider metadata
`delivered`.

The owner opens the link in the usual browser, then copies an `otp_expired`
callback without a code. Finite Auth metadata shows recovery/S256 code issuance
21:49:31, empty recovery token and zero sessions; no code value is read. The
private browser observes no verification/callback/user/password-update request.
Its20 scope/clipboard assertions and guardian11 fake checks are boundary proof,
not successful recovery. A later27-check callback/resume extension is prepared
but never executed. The password is unchanged; no new app defect is inferred.

Early SMTP restoration completes21:57:43UTC. Independent21:58:47 reads verify
all original Auth fields, six pre-mail accounts/1,511 original public rows,
25 public/three Auth projections/table set, USER role and zero actor sessions.
Production is INACTIVE/unchanged. Browser/native/SSH close; exact owned sockets,
run directory and Chrome lock are absent. Narrow forgot/reset-request browser
counters are all zero; no general dashboard/recovery-health claim follows.
All four approved send actions are used, with exactly three total emails. No
further email follows from a prepared future provider-retrieval test.
[Current scope and evidence](cloud-auth-mail.md#evening-one-reset-window-and-delivery).

Post-closure45,830-file inspection passes21:59:52UTC. Selected23-file/37,470-byte
evidence is retained/rehashed owner-only outside/tmp, with0 supplied-secret/raw
recovery-value matches; raw inputs and personal-browser state are excluded.
Local unencrypted retention does not establish off-site recovery.

## Oct19 cloud confirmation and registration repair

Actual source910f216 registration creates a pending USER but returns400 because
the provider rejects its OTP request with422 `signup_disabled`; no email is sent.
Source30d848a changes registration and resend to signup confirmation, with four
closed real-SDK regression failures before repair and85 focused checks passing
after. Source0de3c28 also repairs email prefill, resend timing and light-theme
verification text, covered by52 focused checks.

Both source commits are pushed. Exact30d848a Quality PR/push, Secret Scan
PR/push and CodeQL complete successfully. Downloaded Quality logs verify2,576
normal passes/80 intentional skips,80 persisted passes/one skip, successful
types/webpack/static31-of-31 and lint0errors/22 existing warnings. Persisted
counts include79 actual SQL cases and one metadata case. Exact PR-ref
JavaScript/Actions analyses report0 results/errors; open PR-ref alerts0. Five
legacy main alerts remain open. The local pre-push gate separately passes745
integration cases/29 skips; overlapping suites are not added together.

Fresh30d848a build/seal45,830,158 client credential exclusions, native19 and
private-SSH11 pass. The owner receives and verifies the code; the initial password
fingerprint is unchanged, password login reaches the dashboard and normal logout
removes all actor sessions. Recovery email is accepted, but the owner-reported
new-password form is not observed in the controlled browser. The guarded update
stops with RESET_FORM_REQUIRED and the window expires before clarification;
password unchanged, no recovery exchange or update observed. All three email
actions are consumed, with exactly two actual sends recorded; no further send
is authorized.

Final independent reads preserve every original row/account and the25-table
public set, with the new verified USER at sessions0. Every Auth field matches
its original snapshot. Native/browser/tunnel resources close, exact owned sockets
are absent and all three full build seals pass again. Native diagnostics are
warn0/error0; the separately counted browser13 console errors/12 deliberate
blocks are not fully attributed. Production remains INACTIVE and unchanged.
Public temporary-hostname DNS fails; actual native responses use private Unix
sockets and verified SSH while Auth uses actual provider HTTPS. This does not
establish public HTTPS, a complete fresh repaired registration or a released
production fix. [Full email evidence and limits](cloud-auth-mail.md).

The owner-only local `review-checkpoint-auth-mail-30d848a-20261019` retains32
selected files/93,263 bytes outside/tmp. Destination hashes/modes and supplied
secret exclusions pass; raw Auth/configuration/actor/browser/gate/credential
inputs are excluded. Local unencrypted retention establishes no off-site backup.

## Oct19 actual Google login and closed preview

Exact source `fc8d813` passes a fresh locked build and45,827-file seal,147
client-asset secret exclusions, Unix19/HTTPS11 and seven authorize-start checks.
The owner completes Google login, normal sign-out, returning Google login and
final normal sign-out in Chrome on Behemoth. Independent reads prove matching
Auth/application/Google identity, unchanged application ID/creation fingerprint,
a fresh returning session, USER role and no purchases. Final sessions are zero.
All original25 public tables/1,510 rows and three Auth tables are unchanged,
excluding only the declared test actor.

The guardian restores every Auth field to the pre-window snapshot. App/tunnel
exit0 with clean owned cleanup, the run directory/processes are absent, Behemoth
has a closed access notice and the full seal passes again. Production remains
INACTIVE with no writes. The22-file/39,349-byte selected package
`review-checkpoint-google-login-fc8d813-20261019` is retained/rehashed owner-only
without credentials, raw Auth config, gate HTML or personal-browser state.

Runtime diagnostics are warn0/error2 with no retained cause; neither actual
OAuth success nor clean shutdown proves an error-free dashboard. Automatic
reconciliation with intentionally absent payment credentials is a source-backed
candidate; its missing-key500 is separately reproduced/repaired in33dd19f to
explicit503 with164 focused closed-network checks. That does not identify the
past events. Existing production-customer continuity,
controlled SMTP, Dodo and final hosting/release gates remain open. See the
[Google runbook](google-oauth.md).

## Oct16–17 Google preparation and expired preview

Oct16 Google preparation uses exact application source `f1df347`. Replacement
project ownership/billing-off and the supplied isolated Web client are verified;
the owner reports app/test-user/minimal-scope setup complete. Fresh build/seal,
Unix19/HTTPS11 and seven actual authorize-start checks pass. The owner did not
complete Google login before the window expired.

Oct17 fresh reads confirm restored preview Auth settings, Google/signup disabled,
clean app/tunnel shutdown, every original row preserved across25 public/three
Auth tables and the complete45,826-file seal. The new confirmed Auth actor has
no Google identity/session/sign-in/application row. Selected24-file/33,251-byte
evidence is retained outside/tmp without credentials. See the
[Google ownership and test runbook](google-oauth.md) for exact scope, private
credential locations and a fresh-window plan. Production remains INACTIVE and
unchanged; actual OAuth exchange and existing-customer continuity remain gates.

## Historical migration source and offline ledger verification

Sourceac62f4a restores the exact237-byte March18 SQL matching the archived
checksum; four immutable-file regressions pass. Production history is unchanged.
Two earlier offline attempts stop before any resolve. The first exposes valid
empty historical log strings; the second reaches strict227/initial status but
its next read encounters database recovery. Their failures remain recorded.

An empty signal trace proves the SIGTERM target is Prisma's engine, correcting
the earlier inference that PostgreSQL's generic log identified a backend.
Primary source review and an empty `--init` control support a PID1 orphan-reaping
artifact: the same engine shutdown no longer triggers database recovery.

The complete corrected rehearsal then passes in `run-a5ec90a2205e`: initial
status, exactly three official Prisma5.17 resolves and final status. All seven
literal SQL checksums match and the four original ledger records retain their
complete raw bytes. Archived/before/final comparisons preserve65 tables/2,239
original rows/two sequences; only the three validated new ledger records are
excluded from the final projection. Strict227 and446 zero-row permission checks
pass. Root rehashes286 captured files, all five backup inputs remain unchanged
and the owned container is confirmed absent. Production/platform compatibility,
fresh migration bootstrap and provider/release gates remain open.
[Exact scope and diagnostics](payment-currency.md#historical-sql-source-and-bookkeeping).

## Landing press and footer accessibility

Application checkpoint `1e381a3` changes three class strings in the public press
and footer components. Press hover titles use the existing jazz accent, raising
light-mode contrast from1.91:1 to5.86:1. Back-to-top becomes at least44px tall and
has a solid2px outline with an explicit bright accent on its dark footer surface.
Hero, navigation, voucher presentation, copy and click handlers are unchanged.

Actual isolated local Next production browser checks pass all12 cases:
ES320/390/1440 light/dark, plus EN/FR/PT390 light/dark. Inter and Playfair load;
below-fold widths, loaded images, target hits, keyboard activation and return to
top pass without page errors, external reads or mutations. Painted focus checks
wait for transitions and inspect the actual colored2px ring layer. Press focus
contrast is5.86/7.34 and footer outline7.26/8.59 in light/dark. Build including
TypeScript and scoped lint pass; no mirrored CSS tests are added.

Earlier fallback-font reports and two interrupted screenshot helpers remain
diagnostics. The initial non-none shadow/outline-width predicates did not prove
painted contrast; root review exposed the faint2.24/1.85 footer outline, leading
to the final source correction and separate proof. All browser/server resources
close. This is public frontend evidence, not provider/Auth/media/payment proof.
The owner-only local `review-checkpoint-landing-accessibility-1e381a3` retains117
selected files/4,070,273 bytes, including90 public crops, plus manifest/receipt.
Destination hashes/modes and credential-pattern scan pass; no credentials or
runtime state are included. Local unencrypted retention is not off-site backup.

A later whole-page review captures the complete Spanish homepage at390 and1440
in both themes. All seven sections render coherently; the15 course subtitles
and three biography paragraphs are readable in the inspected mobile crops.
No card, biography or section-order change is justified by these captures.
Four original full-page PNGs and four clearly labeled derived inspection crops
remain distinct. A misleading scaled preview suggested missing dark-mode cats;
the original-resolution crops show the complete illustration in both dark views.
The subtitle scrollHeight check is not a general unclamped-text proof, and these
four cases do not replace320px, translated or interaction checks.

The reused public-only build was made from91e plus two reviewed files;302 runtime/
public source files match1e byte-for-byte. It is not a new exact-Git producer or
provider proof. The run allows193 local reads, four explicit promo503 fixtures,
eight blocked optional prefetches and no external/mutating requests or page
errors. All browsers and the owned3081 server close; root independently confirms
the PID and listener are absent. The owner-only local whole-landing checkpoint
retains16 selected files/7,785,058 bytes, including the eight images.

The remaining visual limitation is source-image quality: several lesson photos
are only102–191px wide, while desktop cards display219px and the promo fallback
550px. A bounded review of21 historical/public blobs finds no sharper original
of the same composition. A separate selection of eight ES/EN lesson1/2/4/7 PDFs
(26 pages) contains no embedded bitmaps; FR/PT and unrelated PDFs were not opened.
Larger authorized originals remain a medium-priority
asset follow-up; CSS enlargement cannot restore detail. This is not a finding
about healthy Mux playback. The public image README now points to the active
components and explains the local fallback boundary.

## Native voucher and payment facts

A fresh exact5f9597a configured artifact matches605 application Git blobs and
45,825 sealed files;158 client files contain the expected public configuration
and no scanned server secrets. Actual Unix19/HTTPS11 checks pass. Seventeen
native browser checks pass: two normal password/session logins,13 monetary
observations and two actual normal global204 logouts. Both contexts and Chromium
close; there is no stored browser session.

Three temporary synthetic history phases verify a canonical1.233KWD final with
independent unlabelled legacy base/discount, a nonzero1e-7 legacy final, and an
unknown-currency canonical zero that overrides a legacy80. Student history,
admin overview and voucher history display the intended facts at the scoped
desktop/phone sizes and themes. These are synthetic data/rendering checks, not
Dodo checkout, tax, exchange-rate, refund or notification proof.

The controller acknowledges three five-field Purchase changes and one exact
restoration, plus one insert/delete each for an inactive expired voucher and its
owned redemption. Its ten-record journal and ownership backup pass independent
file review. A separate read-only final capture matches all12 model/18 protected
hashes, all five roles/learning state and both complete original Purchase rows,
including microsecond timestamps. Both canonical pairs return NULL; business
rows return0. Source-bound operation counts are not a provider/server audit.
This window adds two password/session pairs,30 cumulative.

All27 amount-only PNGs pass individual privacy review. That review also catches
awkward character wrapping in voucher cells: correct visible characters alone
do not establish comfortable readability. The presentation follow-up is separate
from these authenticated5f checks. Owned app/socket/tunnel shutdown and final seal
reinspection pass, with zero runtime warning/error counters. A fresh production
Management API GET at08:19UTC confirms INACTIVE; no production change occurred.

Presentation commit `8053c1b` repairs that wrapping: complete formatted amount/ISO
tokens stay together, guidance wraps between words, and natural table width stays
inside its horizontal scroller. Formatter output/text, queries and permissions
are unchanged. Eighteen existing integration cases, source types and scoped lint
pass. Local Chromium uses the actual async page output with synthetic read mocks
and compiled application CSS: five before observations expose readability defects,
five after observations pass, including KWD desktop/phone, tiny320, unknown zero
and64-digit values. Long values reach both ends by ordinary horizontal scrolling
without document overflow. The local font fixture differs from native; it does
not reproduce every individual old line break and is not another authenticated
Next/Flight/backend proof. Thirty new amount-only crops preserve that scope.

The original exact5f native evidence is retained separately in the owner-only
local `review-checkpoint-final-money-ui-5f-20261015` directory:85 selected files/
495,020 bytes plus retention manifest/receipt, with verified hashes and0600/0700
modes. Raw snapshots, ownership backup/ledger, configuration, actor references,
credentials, enabled approvals and tunnel/build logs are excluded. Its historical
readability finding remains intact; later presentation proof does not rewrite it.


## Recovery permissions and index checks

Revision4 now also checks the 225 archived column definitions inside both locked
scope checks: type and modifier, logical column order, nullability/default,
collation identity, array dimensions, identity/generated markers and local/inherited
status. Nine closed checks and24 actual isolated PostgreSQL checks pass. Real
varchar-length, timestamp-precision and collation changes evade the old projection
but are rejected before permission changes. The93-index guard and original
permission bodies remain byte-identical. This225-column proposal deliberately
rejects the later227-column currency schema. The separately verified ordering
below preserves that guard. It does not establish collation provider/version equivalence.

A corrected, isolated archive restore now matches all51 extension-member owners,
557 serialized ACL statements,67 role statements,65 tables/2,239 records and two
sequence states. The bootstrap precreates three exact extension versions as
postgres, restores its original non-superuser flags immediately, and restores
every other archive entry without ignoring ACL clauses. This corrects the earlier
member-owner drift; the source extension owners and initial privileges remain
unknown. Effective source privileges and full hosted-platform recovery are unproven.

A separate integration run verifies corrected restore → exact revision4 apply →
manual inverse → reapply. All65 archived table hashes/counts and two sequences
match at every stage. Both applications pass422 actual zero-row permission
operations each; these repeat the same coverage. Inverse restores all557 ACL
statements and member owners. All67 role statements and same-run nonpublic
extension owner/ACL/initial/effective metadata stay unchanged. All owned containers
and tmpfs are removed. No production or provider connection occurred, and the
unsafe inverse is an explicitly isolated manual test, never failure cleanup.

A later actual offline run verifies corrected restore → unchanged revision4 at
225 columns → literal additive payment migration → distinct read-only revision5
227-column postcheck. Original-column projections preserve all 65 tables, 2,239
records and both sequences. The two new fields start NULL. Wrong ordering,
second-column collision, an injected pre-commit fault, replay, the old inverse
and explicit new-column ACL drift are rejected. The hardened 227-column state
passes 446 zero-row permission operations after migration and again after a
separate manual inverse/reapply; repeated operations are not unique new cases.

One owned offline synthetic Purchase proves exact payment facts survive that
manual cycle. Its full-row CAS cleanup restores the original data; no existing
customer or User/Auth row is written. Independent comparison of the already
captured inverse export also matches all 557 ACL statements and member-owner
metadata. All five archive inputs retain their hashes and the owned container
is absent. The literal migration does not reconcile `_prisma_migrations`.
Application rollback keeps the columns, facts and safe permissions; the unsafe
inverse remains separately reviewed/manual-only. Current production/platform
compatibility and production approval are still required.

Executed ordering verifier SHA256:
`f6ebdfd4c1049457d9ffcdae7451d0e6a4886c1c9c2ca78c43886301e8b10a9e`.
Read-only 227-column check SHA256:
`b83acc623cce83f70169bc5b2dd434a4a593828311b30ad926f08d8e4de19dde`.

The following revision3 results remain historical evidence:

The proposed hardening revision3 checks all 93 archived index definitions inside
the existing locked transaction, before and after permission changes. It also
requires current indexes to be valid, ready and live; these flags are new safety
preconditions, not facts captured by the old dump. Distinct action and manifest
attestations are required before taking locks. Earlier SQL and inverse remain
unchanged; no production operation is authorized by the new proposal.

An actual isolated PostgreSQL17 test passes20 checks, including same-name changes
to uniqueness, key order and predicates that the old name-only projection misses.
Wrong target, manifest and action fail before a contended lock. A failure after
permission changes rolls the transaction back. Apply, manual inverse and reapply
preserve all65 archive COPY content hashes/counts,2,239 records and two sequences;
422 zero-row operations confirm browser denials and trusted-role CRUD. The fresh
network-disabled container is removed. This does not prove full column-definition
fidelity, hosted-platform reconstruction or production schema compatibility.

The separate recovery comparison now preserves owner metadata as well as ACL
clauses. Its16 closed tests pass. All51 retained extension ACL differences are
49 function and two view revocations, with corresponding member owners changing
from postgres to supabase_admin. Public/column ACL SQL matches. These observations
belong to the earlier e7 comparison, separately from the later successful1f data
restore, which has no retained final schema dump. A synthetic owner-permission
reproduction passes, but source extension owners and initial ACLs remain unknown.
[Recovery evidence and limits](supabase.md#offline-archived-data-recovery-verification).

## Landing hero and usable mobile navigation

Application artifact `5c98715` now gives the first free-lesson offer a compact
callout, puts registration and a localized lesson-exploration link together,
fills the phone content width with both actions and centers the desktop hero
columns. Existing typography, imagery, four-language course copy, content and
pricing are preserved. These are incremental visual and usability improvements;
the rest of the landing page remains available for further review.

Actual97 before renders exposed an opened390px navigation panel atx330/right538,
expanding document width to538. At320 the toggle wraps to the left, so simply
flipping its popup alignment would introduce another clipped layout. The menu
now uses the positioned header as its boundary: actual390 bounds16–374 and320
bounds16–304, with all seven links wholly visible and at least44px tall.

Actual after verification passes154 assertions across six viewport/theme cases
(320/390/1440, light/dark) and four locale checks. Keyboard and pointer menu
navigation scroll to courses and close the panel; the new native exploration
link works. Primary actions are342px/272px wide on390/320 phones,60px tall, and
appear about42px/58px earlier than before. The secondary action also fits the
initial844px fold in those Spanish views. Desktop column center difference0.
These observations do not prove every translation fits every possible screen.

Four targeted existing Playwright cases pass: offer/hero geometry, unavailable
promo fallback and both mobile course/menu journeys. `f8d9254` strengthens the
opened-menu regression to check the panel, all links and document width after
opening, preventing Playwright auto-scrolling from hiding clipping. That later
commit changes one test file only; application files remain identical to5c.
Exact5c clean Node24 QA passes2533 normal tests/80 skips, types, webpack build and
lint0errors/22 existing warnings.

Before18/after19 public screenshots and88 selected artifacts plus manifest/
receipt are retained privately in `review-checkpoint-landing-5c98715`, with
verified bytes/hashes and0700/0600 modes. Initial timeout attempts remain separate
harness diagnostics; final drivers settle after DOMContentLoaded. Browser
requests stay on the loopback app, promo playback is a local503 fixture and
prefetched auth routes are blocked. No actual video/provider/account/form/DB
journey ran. First-visit privacy banners and clear views after the ordinary
necessary-only choice are retained separately; consent policy is unchanged.
All browsers and both finite local preview wrappers are closed.

The same source includes `b7f77ab`: the already-Secure OAuth hint cookie options
are written directly in each assignment to clarify static analysis. Existing
intercepted-write and real-SDK controls pass10/10 before and after, types pass
and the two scoped lint warnings are unchanged. This does not repair an actual
insecure cookie or prove OAuth works. Exactf8d9254
[Quality PR](https://github.com/nospotfer/jazz/actions/runs/38693579620),
[Quality push](https://github.com/nospotfer/jazz/actions/runs/38693574139),
[Secret Scan](https://github.com/nospotfer/jazz/actions/runs/38693579614) and
[CodeQL analyses](https://github.com/nospotfer/jazz/actions/runs/38693575709)
pass. Its fresh exact head-ref alert query returns0, removing those three
medium97 records from this PR scope without dismissal. This is static clarity,
not an insecure-cookie incident or actual OAuth integration verification.

Latest source is published for draft review; downloaded Quality evidence and
final documentation-head checks remain separately recorded. Production
is unchanged and the maintenance goal remains incomplete.

## Currency facts and readable amounts

Application source `97e5e06` carries PAY-22 through provider extraction, all paid
ingest paths, persistence, student history and admin reporting. It stores exact
nullable currency/minor-unit facts, uses explicit SIX exponents and prevents
partial retries or nested/outer objects from mixing units. Legacy floats retain
their independent provenance. Admin totals/averages/charts stay separate by
verified currency; unsafe numeric chart/comparison values remain unavailable.
See [payment currency, compatibility and rollback](payment-currency.md).

Exact prior-source failures are retained: backend52 (48fail/four controls),
admin13 (11fail/two controls), student23 (18fail/five controls), DTO17
(14fail/three auth controls). All pass after correction. A fresh private Node24
install precedes the full checks. Three obsolete whole-suite amount fixtures
were corrected in `862c614` without runtime changes. Shared-schema PostgreSQL
files ran in parallel and reproduced an actual40P01 fixture deadlock; `188f7b8`
serializes files while preserving real races inside tests. That exact source
passes80 checks in ten persisted suites (79 actual PostgreSQL cases and one
client-metadata case), with one REST-only skip. Initial failures stay separate.

A fresh sealed `188f7b8` artifact matches602 Git application files/45,822 sealed
files/158 inspected client assets. The isolated Free cloud preview received only
two nullable TEXT columns, with no defaults/backfill. Before/after migration
preserves old fields/raw timestamps, all12 model hashes and six additional
protected hashes; both new pairs initially remain NULL. Production received no
migration. Unix19 and actual protected HTTPS11 checks pass.

Native browser verification passes58: two actual logins, eight student histories,
eight admin overviews, two scheduled statistics variants,36 representative
geometry/amount-contrast observations and two actual normal global204 logouts.
EUR/JPY/KWD/IQD/MGA, real0, unknown currency and original legacy values display as
planned. KWD and restored records are checked at320/390/1440 in both themes;
statistics cover KWD7d and restored30d only, with unscheduled range prefetches
blocked. Minimum amount contrast is5.521light/7.663dark student,
5.864/7.336overview and7.557/12.167statistics. This is amount/KPI evidence,
not a whole-page accessibility certification or every chart/currency combination.

Seven scoped two-column variants and one restoration are acknowledged in an
18-entry verified hash-chain journal. Independent final read-only SQL confirms
all18 protected/12 model hashes, five roles, original raw course/purchases and
timestamps unchanged, with both pairs NULL again. Browser contexts/owned Chrome,
app/tunnel processes and sockets are gone; clean closure and complete sealed
reinspection pass. This window consumes two login/session pairs, bringing the
tracked cumulative windows to28. No Dodo transaction, mail or learning write ran.

Separate follow-ups `f5cc174` and `97e5e06` remove assumed EUR from voucher
redemption records, preserve unlabelled legacy precision and show canonical raw0
as0 even when currency is unknown. Frozen voucher18 (14fail/four controls),
precision16 (eight fail/eight controls) and unknown-zero8 (four fail/four controls)
now pass; combined55 controls pass. Initial nonbreaking-space fixture diagnostics
are retained. Final `97e5e06` clean-source checks pass2533 normal tests/80
intentional skips, types, lint0errors/22 existing warnings and webpack build.
These later display fixes have source/component evidence, not a new native run;
the completed native artifact remains bound to `188f7b8`.

Exact97e5e06 [Quality PR](https://github.com/nospotfer/jazz/actions/runs/38690838575),
[Quality push](https://github.com/nospotfer/jazz/actions/runs/38690833263),
[Secret Scan](https://github.com/nospotfer/jazz/actions/runs/38690838583) and
[CodeQL checks](https://github.com/nospotfer/jazz/actions/runs/38690835304) pass.
Downloaded26-file Quality logs agree with2533/80 normal and80/1 persisted checks.
The exact head-ref alert query nevertheless returns three medium cookie records
(5/6/12), while merge/branch filters return0; their investigation is separate from
successful check status. Actual source and existing intercepted-write tests show
Secure on all three OAuth hint cookies. The later direct-literal clarification
and successful fresh head-ref rescan are recorded in the landing checkpoint
above; no alert dismissal or exploit claim follows.

Selected214 review files plus manifest/receipt are retained under the private
`review-checkpoint-currency-97e5e06` recovery directory. Bytes/hashes and0700/0600
modes are verified; nonempty candidate scans exclude actual private inputs. Four
retained whole-test JSON reports redact only a generated synthetic webhook-key
label in title/fullName; original hashes and transformation are recorded, with
statuses/counts unchanged. The initial pattern gate stopped before copying that
label. Credentials, raw model snapshots, sessions and screenshots are excluded.
This is local unencrypted retention, not off-site recovery.

Actual provider transactions, OAuth/mail, continuous free hosting/DNS and approved
production hardening/recovery/release remain gates. No new spend,
production rollout or whole-goal completion follows. The next UX pass returns to
the public landing page for broader visual hierarchy, spacing and mobile polish.

## Voucher availability and redemption intent

Four source commits (`b2ca5c3`, `9e5524b`, `730a28b`, `a16c1abc`) require
published voucher courses with known numeric prices, verify captured redemption
account intent, localize unavailable-price recovery, retire stale page work,
and show recorded purchase amounts only with `analytics.read`. Known zero
stays zero; unknown amounts do not become free access or revenue. The active
`/redeem` caller was found in the App Router after an earlier components-only
search missed it. Signed-out users must sign in and reopen the voucher link;
`/auth` has no return-to contract.

Frozen regressions retain actual before failures: backend36 (30 mocks/six real
PostgreSQL), checkout seven, feedback ten, admin13 plus six permission cases on
the intermediate patch, and redemption client24 plus the existing11 localization
cases. Real NULL-price/draft/stale-account grants persisted before; after they
are denied without purchase/discount/redemption/use writes. Static checks and
voucher-limit races do not prove a concurrent course edit is protected.

A fresh private Node24 clone passes **2,311 normal tests/57 intentional skips**,
**56 real PostgreSQL tests/one REST-only skip** in seven guarded suites, types
and lint0errors/22 existing warnings. Exact-source
[Quality PR](https://github.com/nospotfer/jazz/actions/runs/38606950717),
[Quality push](https://github.com/nospotfer/jazz/actions/runs/38606941010),
[Secret Scan](https://github.com/nospotfer/jazz/actions/runs/38606950659) and
[CodeQL analyses](https://github.com/nospotfer/jazz/actions/runs/38606944470)
pass. Downloaded Quality logs agree;587 committed files/26 expanded logs scan0.
Classic Vercel success does not establish remote provider isolation.

Two fresh configured artifacts each match582 application Git files/45,802 sealed
files/158 inspected client assets and pass Unix19/HTTPS11. First native attempt
stops before sign-in/browser creation/SQL on an artifact-proof mode0664 guard;
original helper/report and expiry closure remain separate. Corrected writer uses
umask077 and a fresh origin/artifact/gate. Root's earlier private-input assertion
checked too few files; the correction is explicitly retained.

Second native window passes **12 actual cases**: both voucher forms show the real
price-unavailable503 in ES/EN/FR/PT; redemption shows the actual A-cookie409
relayed unchanged in all four languages. Original browser POST never continues.
Four NULL/80 pairs are acknowledged and restored; publication/other public-table
writes0. Admin records and known sum160 are checked before its390px geometry
assertion discovers horizontal overflow. Admin case does not pass; the whole
run stays **PARTIAL12/13** and the original report is preserved.

All browser contexts close. Three password/session pairs bring the cumulative
owner/catalog/checkout/voucher count to24; normal provider logouts were not
reached. One optional own-avatar intent is blocked; avatar writes0. App/tunnel
expire cleanly and their processes/sockets are absent. Strict-CA22:45:26 read-only
comparison confirms all-five/12-model/global/business/learning/entitlement hashes
and complete raw course row/timestamps unchanged. Complete seal inspection passes.

The following checkpoint verifies the separate mobile admin repair and closes
quote-versus-payment provenance (PAY-21) and course intent (SEC-22); it does not
relabel that original12/13 report. Currency precision (PAY-22) remains source work. Provider price/tax/currency authority, actual
Dodo tests/notification recipients, Google/mail, continuous free hosting/DNS and
exact production recovery/quarantine approval remain release gates. Zero new
spend, provider transactions/refunds, third-party mail or production change.

## First published checkpoint

Revision `8e67b0d3303fc9858ad41cb97400b0c1ae38408e`:

| Remote check | Observed result |
| --- | --- |
| [Quality PR run](https://github.com/nospotfer/jazz/actions/runs/38329849521) | Build, lint, types, 775 normal tests and 37 persisted PostgreSQL tests passed; intentional opt-in/REST skips remain. |
| [Secret Scan PR run](https://github.com/nospotfer/jazz/actions/runs/38329849560) | Gitleaks passed. This does not revoke known historical test passwords. |
| [CodeQL analysis](https://github.com/nospotfer/jazz/actions/runs/38329847791) | Both analysis jobs passed, but the aggregate [CodeQL check failed](https://github.com/nospotfer/jazz/runs/115077040192) on two new high findings, alerts 14/15, in regex-based email conversion. |
| [Vercel build](https://vercel.com/gabriels-projects-bd92791f/jazz/CtxSA8pWACv4ypYfr8efEPpdisyo) | Success; GitHub deployment 7027429907. Exact URL: https://jazz-39g0lz0kf-gabriels-projects-bd92791f.vercel.app. HEAD checks of /, /auth and /robots.txt redirect to Vercel SSO; protection was respected. Remote provider isolation and customer journeys are unverified. |

The public repository's default-branch dependency banner still reports its
existing alerts. Maintenance-branch audit results do not resolve deployed or
default-branch dependency findings until the reviewed changes are released.

## Follow-up source checkpoint

Revision `37df1a0089d64dfd5c11975caf0aedd7ffa5055e` includes:

- `0619b69`: bounded parser-based HTML-to-plain-text conversion and actual inbox
  encoding regressions. Plain text remains preferred; signatures, authenticated
  sender checks, deduplication and text-only notifications remain enforced.
  The sinks did not establish executable HTML; the CodeQL findings were not
  dismissed. Their follow-up remote rescan marks both fixed.
- `37df1a0`: all 15 inventoried legacy mutators reject ambient production and
  unexpected local targets before client construction. Voucher reset requires
  user/course scope and explicit application. Deployment wrappers require the
  exact reviewed commit and linked project/team and recheck after preflights.
  They do not grant production approval or prove remote configuration.

An isolated Git-visible source copy, without private environment files, passed
fresh Node 24/npm 11 `npm ci`, lint (0 errors/25 existing warnings), TypeScript,
webpack and Turbopack builds and **925 normal tests, 38 intentional skips** in 82 passed/5
skipped files. Five guarded PostgreSQL suites separately passed **37 tests,
one REST-only skip**. The source Gitleaks scan found zero leaks; production npm
audit found zero vulnerabilities. The five documented high development-only
lint-chain findings remain.

These checks require explicit synthetic DATABASE_URL configuration; an initial
empty-environment run correctly rejected imports/build collection that require
that setting. The reproducible sequence is in [local verification](local-verification.md).
No real mutator or deployment was invoked by the wrapper/CLI regressions.

## Follow-up published verification

Revision `c6a0556264f803aceb99311d8efc588f52ff2208` contains the reviewed source
above plus checkpoint documentation. Actual remote checks all passed:

| Remote check | Verified result |
| --- | --- |
| [Quality PR run](https://github.com/nospotfer/jazz/actions/runs/38332857386) | Lint 0 errors/25 warnings, TypeScript, webpack build, 925 normal tests/38 intentional skips and 37 persisted PostgreSQL tests/one REST skip. Push Quality run 38332853063 also passed. |
| [Secret Scan PR run](https://github.com/nospotfer/jazz/actions/runs/38332857318) | Success; push Secret Scan run 38332853065 also passed. Local redacted history scan covered 285 commits with zero findings. Known historical test passwords remain the owner's rotation task. |
| [CodeQL analysis](https://github.com/nospotfer/jazz/actions/runs/38332854151) and [aggregate check](https://github.com/nospotfer/jazz/runs/115086427261) | Success. PR-scoped alerts 14/15 have state fixed, and the open-alert query for PR #46 returns zero. This is branch evidence, not proof that production/default-branch issues are resolved. |
| [Vercel build](https://vercel.com/gabriels-projects-bd92791f/jazz/EiBBxrnsEzA4UP2NdFbWtgCwoLxD) | Success; GitHub Preview deployment 7027902333, exact source c6a0556, exact URL https://jazz-gaqqmqu84-gabriels-projects-bd92791f.vercel.app. All three HEAD checks (/ /auth /robots.txt) return 302 to Vercel SSO; no bypass or customer flow was attempted. |

Next: preserve the account/provider gaps in the
[verification matrix](verification-matrix.md) and [release gates](release-checklist.md).
Both known Supabase endpoints fail DNS; customer data preservation, current
Supabase manager/test-Dodo access, Google OAuth and approved email evidence remain
essential requirements. Do not merge or release this draft as proof of those
integrations. The newer authenticated provider checkpoint below supersedes the
earlier Vercel-access and live-target assumptions.

## Documentation HEAD verification

Revision `de5e634821cae5ffc21f56d1a1fdea3b92569d52` also passed actual
[Quality PR](https://github.com/nospotfer/jazz/actions/runs/38333404521),
[Secret Scan PR](https://github.com/nospotfer/jazz/actions/runs/38333404534),
[CodeQL](https://github.com/nospotfer/jazz/actions/runs/38333400204) and
[Vercel build](https://vercel.com/gabriels-projects-bd92791f/jazz/3eELf1x88UEgGdsGsiTf9CKCy2bo).
Preview deployment 7027980406 has exact URL
https://jazz-awf49dt6l-gabriels-projects-bd92791f.vercel.app; homepage/auth/robots
HEAD requests redirect to SSO. Isolation and customer journeys remain unverified.

## Authenticated provider checkpoint

Vercel CLI login on the remote machine now works. Neurofactory OWNER access
identifies the actual live custom-domain target as jazz-lms deployment
`dpl_6Xo6rUDVdh9jTWg4KoH1ok6iyU3D`, June 11 redeploy, reported source `50c2f87f`,
Node 20, no Git link. Both aliases and public script-path fingerprints agree.
This supersedes the historical May GitHub Production record as the live baseline.
One confirmed owner and active Hobby plan are verified; commercial hosting needs
an owner plan/hosting decision. [Vercel audit](vercel.md).

Readable configuration recovers valid Dodo live access. Eight GETs verify the
€29.90 EUR tax-exclusive product/business, enabled webhook and matching signing
key. Production and preview share live resources; development's live-only key
returns 401 in test mode. Separate test access and dashboard/delivery evidence
remain required. [Dodo audit](dodo.md).

At that checkpoint the manager CLI was unauthenticated. Native Supabase login
now works and the subsequent evidence below identifies the existing customer
project. Public DNS failure alone never established pause/deletion/data loss.

## Provider-evidence documentation verification

Revision `ad61d7c5de717e11a21cbdf1b505d857f8206bf0` passed
[Quality PR](https://github.com/nospotfer/jazz/actions/runs/38381709357),
[Secret Scan PR](https://github.com/nospotfer/jazz/actions/runs/38381709464),
[CodeQL](https://github.com/nospotfer/jazz/actions/runs/38381706185) and
[Vercel build](https://vercel.com/gabriels-projects-bd92791f/jazz/BWjWURduMqj2nkLdiU4C2auYYQEz).
Push Quality/Secret Scan also pass. Exact Preview deployment 7035778099:
https://jazz-q16rbw7pb-gabriels-projects-bd92791f.vercel.app. HEAD homepage/auth/
robots all redirect to SSO; no bypass, remote customer journey or isolation proof.

## Supabase manager and UX follow-up

Authenticated inventory/project GET finds feav Jazz-LMS-Project INACTIVE,
eu-west-1/PG17 in Free Neurofactory Org. Caller matches its sole Owner; member
MFA false. Matching restore engine/version is advertised; backup list empty,
PITR off, managed backup retention entitlement zero. This is not recovered-data
proof. Stored Google/SMTP configured, production PKCE reset callback missing,
global Vercel redirect allowance present. [Recovery proposal](supabase.md).
The bounded same-project resume/preservation/re-pause proposal awaits explicit
production approval; no production mutation or SQL has occurred.

Source `47c383d996c1346a39bf5e6dd07a460b18a04afb` localizes voucher success/error
feedback in both entry points, retains stable failure reasons through atomic
rechecks, and localizes sidebar accessibility labels. Fresh local suite:
**944 passed, 38 skipped**, 84 passed/5 skipped files; TypeScript and webpack
build pass, lint 0 errors/25 warnings. Updated affected source in the isolated
app passes native PDF desktop/mobile and actual voucher redemption/cleanup:
**3/3 browser cases**. Component tests use actual language providers with mocked
API responses; they do not prove Dodo.

Published revision `d02b1b13cb9dbb3b1e46a024a75f6b18103096e0` includes that
source and manager/recovery documentation. Actual remote checks all pass:

| Remote check | Verified result |
| --- | --- |
| [Quality PR](https://github.com/nospotfer/jazz/actions/runs/38387928895) | 944 normal tests/38 skips, 37 persisted PostgreSQL tests/one REST skip, lint 0 errors/25 warnings, TypeScript and webpack build pass. Push run 38387923077 also passes. |
| [Secret Scan PR](https://github.com/nospotfer/jazz/actions/runs/38387929034) | Success; push run 38387923038 also passes. |
| [CodeQL](https://github.com/nospotfer/jazz/actions/runs/38387923923) and [aggregate](https://github.com/nospotfer/jazz/runs/115264435276) | Success. |
| [Vercel build](https://vercel.com/gabriels-projects-bd92791f/jazz/FkFBKD4tyyEMxVJCPwC4i3LQMES3) | Success; exact Preview deployment 7036803945, https://jazz-2skowqoe3-gabriels-projects-bd92791f.vercel.app. Its account/configuration remains unreconciled with authenticated Neurofactory access. No SSO bypass or remote customer journey. |

Source `835d22c` subsequently retains the deployed June PDF cache default and
optional `.docx.pdf` filename normalization. Scoped lint and 83 relevant tests
pass. No PDF mutator or provider write was executed by that change.

An independent Free cloud Supabase preview is now healthy, with hardened tables
and synthetic accounts/course/private PDFs. Its local frontend runs on loopback
3012 with sending/payments/tracking disabled. [Preview identity and evidence](preview.md).
This does not establish customer-project recovery or a verified HTTPS Vercel
preview. Production remains untouched, and resume approval is still pending.

## Scoped PDF audit and reproducible runner

Source `3dc76f3eb69fb5f6dedbe35c95f33c83e1f8e61c` adds the explicit-project/course,
read-only, bounded PDF audit and 45 focused regressions. A newly copied Git-visible
application without private env files passes Node24/npm11 `npm ci`, **989 normal
tests/38 intentional skips** in 85 passed/5 skipped files, TypeScript, webpack
build and lint 0 errors/25 existing warnings. Production dependency audit remains
zero; full audit remains the same five high development lint-chain findings.

The pinned tsx 4.23.15 runner uses its supported locked esbuild 0.28.2 dependency;
the stale global 0.25 override was removed. The new installed CLI, not an on-demand
runner, independently succeeds against all 60 synthetic cloud attachments with
strict CA-bound TLS and read-only metadata. Accepted checked bytes 200,304, unique
hashes 60 and complete independent fixture-ID coverage. [Audit boundaries](operational-scripts.md#scoped-read-only-pdf-audit).
No production query, signed URL creation or attachment write. The later
published source checkpoint below includes this audit and its compatibility fix.

Follow-up source `d46b21430e2d5f6425eb80717aa25c7d1251745a` fixes opaque secret-key
headers according to the current Supabase contract. The focused suite now passes
46 cases, and the fresh full suite passes **990 normal tests/38 intentional skips**
in the same 85 passed/5 skipped files; types/scoped lint pass. Actual cached
opaque-key authentication reads all 60 synthetic PDFs/200,304 accepted bytes,
with every fingerprint identical to the prior legacy-key read. No key creation,
rotation or production request. These overlapping reads are not extra coverage
counts. The frontend's separate 29-case cloud proof, 20 overlapping modern-key
compatibility checks and HTTPS/Dodo limits remain
in [preview evidence](preview.md).

## Published PDF-audit source verification

Exact revision `d46b21430e2d5f6425eb80717aa25c7d1251745a` is pushed. Actual
remote checks all pass:

| Remote check | Verified result |
| --- | --- |
| [Quality PR](https://github.com/nospotfer/jazz/actions/runs/38400304553) | Downloaded job logs confirm 990 normal tests/38 intentional skips, 37 persisted PostgreSQL tests/one REST skip, lint 0 errors/25 warnings, TypeScript and webpack build. Push run 38400298133 also passes. |
| [Secret Scan PR](https://github.com/nospotfer/jazz/actions/runs/38400304478) | Gitleaks success; push run 38400298011 also passes. |
| [CodeQL analysis](https://github.com/nospotfer/jazz/actions/runs/38400297891) and [aggregate](https://github.com/nospotfer/jazz/runs/115306092279) | Success. |
| [Vercel build](https://vercel.com/gabriels-projects-bd92791f/jazz/DMwcH6ZDDEzT4kCB4xm4SWKM25QM) | Success; exact Preview deployment 7038968173, https://jazz-5k246l58y-gabriels-projects-bd92791f.vercel.app. HEAD /, /auth and /robots.txt return 302 to Vercel SSO. Account/configuration remain unreconciled; no protection bypass or remote customer journey. |

The separate synthetic cloud backend works through its loopback frontend;
that evidence does not verify this protected HTTPS deployment or customer-data
recovery. At that checkpoint production had not yet been resumed. Later documentation-only commits do not
alter the immutable source/check checkpoint above.

## Approved preservation and source follow-up

The owner approved exactly the existing production Supabase resume, immediate
private preservation and bounded same-project re-pause rollback. The project
became healthy; full DB and 68 private Storage objects were exported, catalog
inspection confirmed critical unsafe browser permissions, and the approved
rollback returned it to INACTIVE. No production SQL/configuration/code repair
or another resume is authorized. Offline restore matches 65 archive COPY table
counts / 2,239 records, two sequences and every Storage object/hash, with explicit
extension ACL/platform/atomic-snapshot/off-site limits. A durable private local
copy and verification reports exist. [Recovery outcome](supabase.md).

The supplied Dodo TEST key works for the matching business. One dedicated
product was created at EUR29.90, then a verified price-only test-resource change
aligned it to the unchanged synthetic course price, EUR80. Two provider coupons
(10% and EUR5) were created and retrieved through seven bounded requests.
Transactions/listener/mail remain disabled. Controlled customer email is recorded
privately; merchant and webhook-alert recipients remain pending. [Sandbox preparation](dodo.md).

Source `8716dd3` fixes the actually reproduced cross-account note cache/autosave
leak, binds writes to expected verified identity, preserves owned dirty drafts
and adds explicit save recovery. It also removes the dashboard overlay only for
the exact lesson-authorized notes page. Source `85f4e12e5b5c8ae8cf1059b70d15bf0ada2b41ac`
adds bounded quiz transaction acquisition waits after real cloud P2028 and local
single-connection reproduction. Both are pushed; neither is deployed to production.

A Git-visible source copy with no private env files passes **1,039 normal tests /
40 intentional skips**, 88 passed / five all-skipped files, TypeScript, webpack
build and lint **0 errors / 25 existing warnings**. Five actual guarded PostgreSQL
suites pass **39 tests / one REST-only skip**. An extraneous private debug .cjs
helper initially caused an ESLint configuration failure in the copy; preserving
it outside the source tree restored the actual clean-source lint pass. No source
rule was suppressed to hide that preparation mistake.

Actual remote source checks pass:

| Remote check | Verified result |
| --- | --- |
| [Quality PR](https://github.com/nospotfer/jazz/actions/runs/38420660371) | Downloaded logs confirm 1,039 normal tests/40 skips, 39 persisted tests/one REST skip, lint 0 errors/25 warnings, types and webpack build. Push run 38420650782 also passes. |
| [Secret Scan PR](https://github.com/nospotfer/jazz/actions/runs/38420660437) | Gitleaks success; push run 38420650864 also passes. |
| [CodeQL analysis](https://github.com/nospotfer/jazz/actions/runs/38420651969) and [aggregate](https://github.com/nospotfer/jazz/runs/115377041415) | Both analysis jobs and aggregate pass. |
| [Existing GitHub Vercel build](https://vercel.com/gabriels-projects-bd92791f/jazz/G1Fm9sp8iR9yhJW5BoakYCG1QABK) | Success; Preview7042420678, https://jazz-bzv4fjqr7-gabriels-projects-bd92791f.vercel.app. Account/provider isolation remains unreconciled; no customer journey or paid hosting decision inferred. |

The exact 235-file source copy on the separate cloud backend passes the distinct
26-check learning continuation and 19-check actual-pointer notes/privacy/recovery
run. Existing 29-case and overlapping 20-case reports remain immutable. The
intercepted PUT500 is explicitly mocked; the subsequent manual PUT200 and server
reload are actual app persistence. Final independent counts and exact purchase
fields are unchanged. [Detailed boundaries](preview.md#learning-and-note-recovery-follow-up).

The owner has set a zero-cost hosting budget. A separate production-built
frontend now passes **44/44 unique HTTPS checks** through a protected free
temporary tunnel: native secure sessions, role/access denials, actual video,
native mobile PDFs, profile and vector certificate download. Independent
post-browser read-only verification confirms unchanged learning, notes, exact
purchases and zero payment/voucher/discount/messaging activity. Two earlier
harness diagnostics and overlapping continuation attempts remain explicit.
[HTTPS evidence and deadline](preview.md#free-https-frontend-checkpoint).

No paid upgrade, production release or domain move occurred. Stable free hosting,
old credential-bearing deployment quarantine, production hardening/configuration,
signed Dodo delivery/transactions, Google/SMTP/receiving, account recovery and
release/rollback gates remain open.

## Diagnostics confidentiality source follow-up

Source `27d7b4c07fb8b440be979909b5b140bb4dc50c48` is pushed. A bounded closed-mock
review reproduced raw payment-provider/error/email/voucher-code diagnostic
exposure. The repair emits only finite categories, known database codes and
validated numeric HTTP statuses; provider bodies/arbitrary exceptions cannot
enter new voucher or webhook failure diagnostics. Auth callbacks/session and
reconciliation logs use the same contract. Existing discount backfill, retry,
usage-limit decisions and localized customer responses remain unchanged.

Clean no-env verification passes **1,077 normal tests / 40 intentional skips**
(90 files with passes / five all-skipped), **39 real PostgreSQL tests / one
REST-only skip**, TypeScript, webpack build and lint **0 errors / 25 warnings**.
The 38 new confidentiality regressions are included in the normal total.

| Remote check | Verified result |
| --- | --- |
| [Quality PR](https://github.com/nospotfer/jazz/actions/runs/38437695616) | Downloaded logs independently confirm 1,077/40 normal, 39/1 persisted, lint0/25, types and webpack build. Push38437687326 passes. |
| [Secret Scan PR](https://github.com/nospotfer/jazz/actions/runs/38437695531) | Success; push38437687360 passes. |
| [CodeQL](https://github.com/nospotfer/jazz/actions/runs/38437691191) and [aggregate](https://github.com/nospotfer/jazz/runs/115436162401) | Success. |
| [Existing GitHub Vercel build](https://vercel.com/gabriels-projects-bd92791f/jazz/co1MCaNGi1e24f87uTbr6526Xs9k) | Success in the same unreconciled protected scope; no isolated-journey/production claim. |

The free frontend is freshly rebuilt at the same HTTPS origin with all 523
committed files, including 256 application/schema/config hashes, modern keys and
strict TLS. Source85's app/build/evidence are preserved. A first incomplete
private copy omitted support scripts and failed typecheck; the corrected full
archive configured build passes. The gate stayed closed until actual runtime
and client-secret checks passed. Source27 browser follow-up is separate from
the immutable 44-check source85 report. It passes45/45 distinct checks with four
fresh native role sessions, identity/permission/media/native-PDF/mobile/profile/
certificate proof and no learning/payment/mail writes. All75 earlier evidence
files remain unchanged. The final independent strict-CA read-only snapshot at
17:36 UTC matches both prior baselines, including learning timeline, notes,
exact purchases and zero payment/voucher/discount/messaging records.

A separate PDF diagnostic verifies visible synthetic page/text at 1440/320/390.
Enforced policy events identify excluded Spotify frames and optional Google Cast
in course HTML, with no PDF rendering failure or policy change. One additional
native buyer session only; all 88 prior artifacts unchanged. The three owned
temporary process groups were closed at 17:50 UTC, retaining local3010/3012 and
fixture data. [Exact scope](preview.md#current-diagnostics-source-https-follow-up).
No production release, payment, mail or DNS change occurred.

## Application diagnostics and exact-project analytics

Source `491a02cb984b5b8e9364afa824e8aca2a51c0298` extends the finite diagnostic
contract to application-owned Auth/voucher/media/messaging/dashboard/admin logs
and client error boundaries. Registration/resend responses omit provider prose;
customer Auth/video failures omit server setup instructions. All53 new closed-
mock disclosure regressions reproduce before the repair and pass after it.
Successful operations and existing failure/rate-limit statuses are preserved.

Latest source `530e9bb50f0eae6dea9679f23a15f0045a4a80e1` prevents OpenReplay from
falling back to another project in the same organization. IDs must be valid,
inventory/key must exactly match, and main/daily failures are unavailable data,
not healthy zero activity.45 new closed-fetch ownership/request/failure/healthy-
data cases pass. This is source proof, not actual account access/cross-tenant
exposure. The admin page retains its `analytics.read` permission guard.

Clean verification and downloaded exact-source Quality logs confirm **1,175
normal passes/40 skips**,92 files with passes/five all-skipped, **39 actual
PostgreSQL passes/one REST-only skip**, TypeScript, webpack and lint0errors/
25existingwarnings. Exported531 committed files pass redacted Gitleaks with
zero findings; no private env copied. Source491's first pre-push lacked the
documented synthetic DATABASE_URL; the explicit loopback retry passed, with
the failed environment diagnostic preserved.

| Remote check | Verified result |
| --- | --- |
| [Quality PR](https://github.com/nospotfer/jazz/actions/runs/38454048826) | Downloaded counts1,175/40 and 39/1, lint0/25, types/build pass. Push38454039034 passes. |
| [Secret Scan PR](https://github.com/nospotfer/jazz/actions/runs/38454048944) | Success; push38454039024 passes. |
| [CodeQL analyses](https://github.com/nospotfer/jazz/actions/runs/38454041280) and [aggregate](https://github.com/nospotfer/jazz/runs/115492310165) | Success. |
| [Existing protected Vercel build](https://vercel.com/gabriels-projects-bd92791f/jazz/EX22ccMmPSikyguSmNpKEgRzgrtS) | Success; account/provider isolation remains unreconciled. |

Earlier source27's 45 HTTPS checks and visual PDF/unchanged-data comparison
remain immutable; they are not current-head browser proof. Native isolated
review confirms forwarded-IP assumptions, expired limiter retention, continuing
work after client abort and a writable-cache requirement. Limiter/sweep/ingress/
cache repairs and a final package verification remain outstanding. All owned
native/account browsers/processes closed; no production/provider configuration,
mail, transaction, DNS or paid-plan change. The goal is active and incomplete.

## Native storage and sweep source checkpoint

Source `98db3b1` includes limiter `822e6cd` and the cooperative sweep/read/continuation
repair. A clean 535-file copy passes 1,251/40 normal, types, webpack and
lint 0 errors/25 warnings. The 76 new regressions comprise 26 storage, 30 Dodo read and 20
sweep cases. Independent mocks also verify 500 queued retries free capacity and
normal cursor work resumes; they are not added to the normal suite total.

Previous Dodo source passes 5/fails 25 in the new 30-case suite; original capacity
retention/raw-key/denied-growth defects were independently reproduced. The
first-draft live-queue deadlock was repaired before the final tests.
[Operational behavior](native-runtime.md) states uncancellable Prisma, process
restart/distributed limits, unavailable-user saturation and historical recovery
gaps. No ledger migration, provider/DB request or production write occurred.

Exact-source Quality, Secret Scan and CodeQL pass. Downloaded
[Quality logs](https://github.com/nospotfer/jazz/actions/runs/38461175029) verify
1,251/40 normal and 39/1 persisted PostgreSQL counts, types/build and lint 0/25.
The first count parser omitted ANSI controls; the corrected parser verifies both
counts while retaining that diagnostic. Source27's 45 HTTPS checks remain
separate historical evidence. The
final native ingress/cache/start/runner package and latest-source frontend proof
are still outstanding. Goal remains active and incomplete.

## Native ingress and release producer

Application/package source `ab146288efdb05cbfa3cc7454710966d3d08bccd` adds the
trusted ingress/configuration/immutable producer. Fixture-only successor
`3cbb17ce86adeb3ee974e4c3f911f7a2f0ccabfd` preserves a malformed test key's
value while satisfying the existing plain-text scanner; no suppression was added.
The initial stopped push and type/scan/quiz-fixture/esbuild sealing diagnostics
remain private rather than being counted as application/customer failures.

Clean local checks and downloaded exact-source Quality logs confirm **1,763
normal passes/40 skips**, **39 actual PostgreSQL passes/one REST-only skip**,
types/build and lint **0 errors/25 existing warnings**. The 512 new guard cases
are included. The stronger real package proof belongs specifically to source
`ab14628`: fresh npm ci/configured webpack, 541 archived Git blobs matched,
45,759 sealed files verified, 157 client files free of supplied server secrets,
cache write/reinspection pass and one esbuild link materialized. Its origin is
synthetic/unrouted and nothing was started. [Native behavior](native-runtime.md).

| Source3cbb remote check | Verified result |
| --- | --- |
| [Quality PR](https://github.com/nospotfer/jazz/actions/runs/38472541482) | Success; downloaded logs verify1,763/40 normal,39/1 persisted and lint0/25. Push38472537144 also passes. |
| [Secret Scan PR](https://github.com/nospotfer/jazz/actions/runs/38472541525) | Success; push38472536950 passes. |
| [CodeQL analyses](https://github.com/nospotfer/jazz/actions/runs/38472539108) and [aggregate](https://github.com/nospotfer/jazz/runs/115555242907) | Success. |

The existing protected Vercel build subsequently passes; its account/provider
isolation remains unreconciled regardless of build outcome.
No latest-head browser, credential, DNS/tunnel or production health claim follows.
Private launcher/runtime cache/restart, disabled runner and a fresh exact-source
protected HTTPS window remain outstanding. Goal is active and incomplete; budget
remains zero new paid services and production stays paused.

## Protected native preview and contrast

Application source **`e32a3707a7ff647ebc8528798dc81df9415fa983`** is published
on the maintenance branch. `0dfa999` added the bounded Unix preview launcher;
`2058ad1` added the authenticated Quick transport exception and disabled runner.
The latest three-line UI repair makes gold text readable on light surfaces while
preserving bright gold in the always-dark professor/footer panels and dark theme.
Actual computed ratios include light hero 5.33:1 and header hover 5.85:1.
All 48 checked contrast states and 12 public layouts pass.

Clean exact-source checks and downloaded Quality logs confirm **1,915 normal
passes/40 intentional skips** (105 files with passes/five all-skipped), **39
actual PostgreSQL passes/one REST-only skip**, types, webpack and lint **0 errors/
25 existing warnings**. The 152 new cases are included: launcher38, Unix ingress45,
Quick transport 20 and disabled runner 49. Earlier actual TCP20 remains part of the
previous 512; repeated runs are not additional distinct coverage.
Exact committed-source export covers 553 files with zero Gitleaks findings.

| Exact e32 source check | Verified result |
| --- | --- |
| [Quality PR](https://github.com/nospotfer/jazz/actions/runs/38483345959) | Success; downloaded ZIP verifies 1,915/40 normal and 39/1 persisted. Push38483338908 also succeeds. |
| [Secret Scan PR](https://github.com/nospotfer/jazz/actions/runs/38483345945) | Success; push38483338800 also succeeds. |
| [CodeQL](https://github.com/nospotfer/jazz/actions/runs/38483340092) and [aggregate](https://github.com/nospotfer/jazz/runs/115591157460) | Success. |
| Existing protected Vercel build | Success at 23:23:57 UTC; account/provider isolation remains unreconciled. No customer-journey or production claim. |

Downloaded Quality ZIP SHA256:
`69d0397afd156b2486ec6a19a3d4de714acc2b4c4d8955a883e4180c5d322e39`.
The separate fresh locked npm-ci/configured-webpack artifact matches **548
application Git blobs**, verifies **45,766 sealed files** and excludes supplied
server secrets from **157 client files**. Only `.next/cache` is writable.
The producer's prelaunch `started:false` receipt is preserved; actual startup has
its own receipt. **19 actual Unix runtime checks** and **11 external HTTPS
transport checks** pass through explicit Cloudflare Unix ingress. The preview's
leased Basic gate protects pages and assets. Managed robots rewriting and edge
consumption of the Cloudflare-specific cache header are recorded separately.

Browser evidence deliberately retains separate scopes:

| Report | Result and practical limit |
| --- | --- |
| Source2058 initial | 53/55; public immediate-state assertion and two buyer page errors retained. Earlier mobile sad-document captures remain failures. |
| Source2058 diagnostics | First 3/4; eventual-state guest 3/3; resized loaded PDF visibly renders. These do not rewrite the initial report. |
| Exact e32 primary | 96/98; selector ambiguity and one initially incomplete fresh mobile PDF response retained. Four native roles, Mux decoding, profile/medals, vector certificate and four-language PDF bytes pass. Zero page errors. |
| Exact e32 guest continuation | 2/2; stage-specific selectors each match once. No application cause established for the initial selector ambiguity. |
| Exact e32 PDF completion | 7/7; native viewer load100/success/one page and complete authenticated private document response. Completion alone is not visible-text proof. |
| Exact e32 full-frame visual continuation | 7/7; fresh viewport-before-navigation at 320/390 in both themes visibly shows synthetic title/disclaimer. Earlier cropped images omitted the top text; full-frame captures were manually inspected. |

There are exactly **11 native password logins/11 normal session syncs overall**,
six at e32 and five at source 2058. All learning/payment/mail/provider writes were
blocked; automatic reconciliation was intercepted before the app. The strict-CA
read-only AFTER comparison at **23:29:43 UTC** preserves full scoped learning
hashes, entitlements, fixture price 80 and zero financial/voucher/messaging rows.
All owned browsers closed and the purpose-created credential state was deleted.
The two source 2058 buyer exceptions remain **unclassified**; zero current errors
does not establish their cause or prove a repair.

The actual e32 app and tunnel closed cleanly at **23:35 UTC**, before expiry.
The same artifact subsequently passes home200 restart, unexpected owned-worker
exit/cleanup, separate UID65534 denial of both sockets and final complete
reinspection at **23:37:06 UTC**, without unlocking compiled files. Each owned
lifecycle probe also closed cleanly. Private evidence is under
`/tmp/jazz-maintenance/native-preview-contrast-verification/` and
`/tmp/jazz-maintenance/native-preview-contrast-browser-evidence/`.
Selected receipts, CI logs, artifact manifest and safe synthetic visuals have
hash-verified owner-only copies outside /tmp at
`/home/gabriel/backups/culturadeljazz-maintenance/2026-10-13-recovery-689f1b24/review-checkpoint-native-e32a370/`.
This is local preservation, not encrypted or off-site retention. A separate
selected-evidence scan flagged 752 filename/SHA256 manifest entries; every match
was parsed and checked against inspected file hashes. No other finding or scanner
suppression; the raw report is retained. This is separate from the zero-finding
committed-source scan.

The runner is prepared and disabled; no service/timer, account/DNS activation,
production resume/SQL/deploy, transaction/refund or mail occurred. Stable-host
control, durable CA/config, old Vercel quarantine, Google/SMTP and Dodo recipient/
signed-transaction verification remain open. The goal remains active and
incomplete under the zero-cost constraint. [Release gates](release-checklist.md).


## Native password navigation and fresh learning

Application source **`9bd09a65edc0c5c6d80a7f928fec85683e6ce8b0`** follows the
contrast checkpoint above. Commit `ce5577f` fixes password-login navigation:
SIGNED_IN and the initial session check previously redirected before the active
password handler finished cookie synchronization and profile setup. The handler
could then redirect again after unmount. Fourteen behavioral component cases
produce **10 failures/four passing controls on unchanged source**, then **14/14
passes after repair**. Duplicate submits and late post-unmount work are guarded;
ordinary existing-session/non-password events retain navigation.

Commit `9bd09a6` adds a usable link from the lesson notes drawer to its dedicated
saved-notes editor, with selected course/lesson, keyboard focus and a 44px minimum
target. ES/EN/FR/PT copy explains local drafts and account-saved notes. Previously
that editor existed without a reachable drawer link. Forty-nine existing
notes/privacy/access regressions and TypeScript pass; persistence and ownership
checks are unchanged.

Clean exact-source CI and downloaded Quality logs confirm **1,929 normal passes/
40 intentional skips** (106 files with passes/five all-skipped), **39 actual
PostgreSQL passes/one REST-only skip**, types/webpack and **lint 0 errors/25
existing warnings**. The fourteen new auth cases are included in this total.
Required pre-push checks were not bypassed. An exact committed **554-file export
has zero Gitleaks findings**.

| Exact 9bd source check | Verified result |
| --- | --- |
| [Quality PR](https://github.com/nospotfer/jazz/actions/runs/38490691109) | Success; downloaded logs verify 1,929/40 normal and 39/1 persisted. Push38490686737 also succeeds. |
| [Secret Scan PR](https://github.com/nospotfer/jazz/actions/runs/38490691135) | Success; push38490686851 succeeds. |
| [CodeQL](https://github.com/nospotfer/jazz/actions/runs/38490688049) and [aggregate](https://github.com/nospotfer/jazz/runs/115615082154) | Success. |
| Existing protected Vercel build | Success; account/provider isolation remains unreconciled. No customer-journey or production claim. |

Downloaded Quality ZIP SHA256:
`5f7533101b7c339e608acb37083993007f794c27a3460de1007f38750f7320aa`.
A separate fresh locked/configured native build matches **549 application Git
blobs**, verifies **45,768 sealed files** and **158 client files** with the
expected public key/origin and without supplied server secrets. Its prelaunch
receipt remains separate from actual readiness. **19 Unix runtime/11 HTTPS
transport checks pass** on this exact source; only `.next/cache` is writable.

The actual corrected native login deliberately holds its own normal Supabase
avatar update. Session synchronization returns200 while the page remains `/auth`
with submission disabled; the successful avatar update is followed by dashboard
navigation. The notes-editor link then navigates stably. This verifies the fixed
ordering against the actual deployed frontend, independently of component tests.

A fifth confirmed synthetic USER and one explicit fixture course entitlement
were created only in the separate Free preview. The original four actors and
customer archive remain separate. That grant is **not Dodo checkout evidence**.
Fresh learning starts with zero notes/progress/attempts/answers/summaries;
continuation records explicitly retain an earlier successfully saved note.
Native password/session requests are bounded to three for this learning window,
with one normal own-avatar update. Subsequent browser continuations reuse the
purpose-created private session without another login.

Browser scopes remain separate; continuations never rewrite interrupted reports:

| Learning report | Result and practical limit |
| --- | --- |
| Initial e3 |2/3; the note persisted, then Chromium CDP response-body lookup failed. Independent SQL confirms the save. One forbidden avatar intent was intercepted. |
| e3 race diagnostic |Preflight1/1 only, followed by abrupt private guard failure on the SDK's two inert null fields. This is not live navigation-race reproduction. Its browsers were subsequently closed. |
| Corrected 9bd auth/link |4/5; held profile/login and desktop editor navigation pass; private fetch helper called numeric Response.status as a function. Saved-state continuation2/3 retained the same helper failure; independent read diagnostic3/3 passes. |
| Notes/playback class1 |4/5; actual manual save, cache-cleared reload and normal playback to80% pass. Completion selector timed out because the button's accessible name differed from visible Concluir. |
| Completion/quiz class1 |Earlier read-only resume3/4 assumed a nonexistent progress field. Corrected resume6/7 verifies explicit completion, pending same-attempt resume and all12 answers; its final result-text selector matched twice. SQL independently confirms100% PLATINUM. |
| Mobile notes entry |2/3; timeout before class2 writes. Reachability remains pending, with no inferred application cause. |
| Class2/profile final |**9/9**; actual note/save/reload, normal52-second playback, explicit100% completion,12 UI answers→92% GOLD,15-slot profile with one PLATINUM/one GOLD/no SUPREME and certificate ineligible2/15. Class2 learning runs at320px. |

Strict-CA, read-only final verification at **00:51:39 UTC on October14** confirms
exactly **two notes, two completed progress rows, two completed attempts,24
answered answers and two summaries** for the fresh actor. Note content hashes
and styles match; each lesson has one attempt, scores100/92 and medalsPLATINUM/
GOLD. No other lesson learning row was added. A separate **00:51:24 UTC** snapshot
preserves original-four full User/learning/entitlement hashes, fixture price80
and zero financial/voucher/messaging rows. Global users/purchases are now5/2
because the fifth actor has its explicit synthetic fixture grant.

There are three native password logins/three normal session syncs in this learning
window, one actual own-avatar update, and no further auth during saved-state
continuations. These are separate from the earlier11 logins above. Two earlier
avatar intents were intercepted, not forwarded. Current runs have zero uncaught
page errors. Automatic reconciliation and all out-of-scope mutations stay
blocked. The existing earlier source2058 buyer exceptions remain unclassified.

All browser contexts closed, no owned Chromium process remains, and the
purpose-created600 session file was deleted with owner/mode verification. The
9bd runtime and its temporary tunnel closed cleanly around **00:52 UTC**, before
fixed expiry. Final complete **45,768-file sealed reinspection** passes without
unlocking compiled files. The original e3 runtime had separately closed before
the corrected source started. This is temporary free testing infrastructure;
no service/timer/stable hosting was activated.

An independent source review subsequently finds a separate late-SIGNED_IN gap:
after cookie-sync failure or successful handler completion, clearing the pending
flag allowed an event to navigate. Commit **`e342a89`** suppresses those events
once password login has started. Two new frozen cases fail against9bd (14 pass/
two fail); all **16/16** then pass. That later correction is **not** relabeled as
9bd browser execution. Mobile notes-entry and latest-source frontend recheck
remain explicit next actions. Production, mail, OAuth and Dodo transactions
remain separate gates; the goal is active and incomplete.


## Late auth events and localized completion labels

Application source **`cadeac79dd4dc2f230d3a91629d9ac1626a2f292`** contains the
late-event repair `e342a89` above and the completion label fix. The visible
completion action previously had a dynamic accessible name, becoming “Ir a
gamificacion” before completion. Its accessible name now uses the same localized
label as the button: ES Concluir, EN Complete, FR Valider, PT Concluir. Existing
seven behavioral tests now query by accessible role/name through all four
languages and ready/saving/completed states, preserving tooltip, confirmation,
PDF localization and the single playback request. **7/7** pass; all **16 auth
navigation cases** pass. These counts overlap the full suite below.

Exact-source Quality logs confirm **1,931 normal passes/40 intentional skips**,
106 files with passes/five all-skipped, **39 persisted passes/one REST-only skip**,
types/webpack and **lint 0 errors/25 existing warnings**. The exact554-file
committed Gitleaks export has zero findings. The first local push check lacked
the documented synthetic DATABASE_URL and retained its two fixture-import
failures; the retry supplies the closed-loopback fixture, passes required hooks
and pushes without bypass.

| Exact cade source check | Verified result |
| --- | --- |
| [Quality PR](https://github.com/nospotfer/jazz/actions/runs/38493001441) | Success; downloaded ZIP verifies1,931/40 normal and39/1 persisted. Push38492996035 succeeds. |
| [Secret Scan PR](https://github.com/nospotfer/jazz/actions/runs/38493001463) | Success; push38492996016 succeeds. |
| [CodeQL](https://github.com/nospotfer/jazz/actions/runs/38492997685) and [aggregate](https://github.com/nospotfer/jazz/runs/115622483870) | Success. |
| Existing protected Vercel build | Success; account/provider isolation remains unreconciled. No customer-journey or production claim. |

Downloaded Quality ZIP SHA256:
`e9e6a541e54ddb8a6b666ff2e8e8a3d4176baaf6fb93293534e067fcb4b594b9`.
A second exact-source fresh locked/configured build matches549 application Git
blobs,45,768 sealed files and158 inspected client files, with expected public
values and no supplied server secrets. **19 actual Unix/11 HTTPS checks pass**.
The configured CA and exact preview input now have verified owner-only copies
outside /tmp; this runtime uses the durable CA. Values are excluded from reports.
This establishes preview packaging, not reviewed production configuration or
encrypted/off-site backup.

The subsequent browser window allows only one ordinary native password/session
setup for the existing synthetic actor. All learning/payment/mail/provider
mutators otherwise remain blocked. A strict-CA read-only BEFORE snapshot at
**01:01:42 UTC on October14** binds full row hashes across12 models and exact
five-actor globals5 users/2 purchases/6 notes/20 progress/18 attempts/216 answers/
17 summaries, plus unchanged zero business rows. No new actor or fixture grant
is created. Latest-source mobile navigation, all-five preservation and closure
receipts follow below after verification.


The latest test guard intercepts one normal own-avatar update before Supabase;
actual metadata writes are zero. The preparation incorrectly assumed an existing
random avatar would avoid that PUT. Profile copy explicitly says random mode
changes on every sign-in; only fixed mode skips it. Native password/session200
and dashboard navigation pass with this intercepted optional update, so that
scope is an intentional write-blocked profile path. The earlier9bd held-avatar200
proof remains the separate nominal profile-write evidence. No further login is
added to compensate for the incorrect preparation assumption.


## Mobile drawer recovery and recorded payment amounts

Application source **`57f5de1c03a83bdd215edd19ded104494024ba66`** is published.
Commit `c64c0fa` removes the historical-payment fallback to current catalog price.
A NULL recorded amount previously became today's course price, so changing that
price changed the apparent past charge. The API now returns `amount: null`, and
payment history shows a localized unavailable message in ES/EN/FR/PT. Recorded
zero and positive amounts are preserved. Frozen route/page regressions reproduce
three failures/one passing control on unchanged source, including the page's
null.toFixed crash; all **33 targeted cases** then pass with identical hashes.
No schema, historical price, currency inference or provider change is involved.
The first exact-source CI retained one outdated numeric-only contract failure
(1,934 passes/one failure/40 skips). Commit `f5fc45e` explicitly covers recorded
and unknown amounts; passing results below do not overwrite that diagnostic.
Currency, tax and financial-journal limitations remain separate release gaps.

The nominal `cadeac7` browser diagnostic confirms a real drawer defect at both
320×740 and390×740: matching browser owner and opened notes panel,15 hydrated
class buttons, yet picker clientHeight0/scrollHeight956. Class1 has a56px rectangle
but zero effective visible height; its center hits the draft textarea. The44px
editor link lies beyond the card and its center hits the footer. Earlier two
write-blocked diagnostics captured an absent subtree; those observations remain
separate and are not relabeled as the clipping cause.

Commit `57f5de1` makes the panel use available flex space, allows its card to
scroll, reserves96px for the class picker and prevents title/footer shrinkage.
No owner, draft, route or persistence logic changes. Fresh production-built
browser measurements at **320 and390** confirm picker height96 and correct
class-button hit-testing. The editor link is **225×44**, fully in the viewport
after focus/scroll, passes center hit-testing and keyboard Tab, and Enter reaches
the corresponding dedicated editor route. Owned server note hashes/styles are
unchanged. The correction report remains **12 checks/9 passes/3 diagnostics**:
two early text assertions waited on a generic first textarea (the sidebar draft)
instead of scoped editor readiness; ES language selection also timed out. Exact
hydrated-editor text and four-language browser controls remain pending. Seven
localized completion-state component cases pass; those are a different scope.

The whole latest window uses **three native password/three normal session syncs**,
one actual strictly scoped own-avatar update and two earlier intercepted avatar
intents. Corrected-source state reuse adds **zero auth and zero mutators**;
no playback is needed. All browser contexts are closed, no owned Chromium
process remains, and the single purpose-created600 session file was deleted
with uid/regular-file/no-symlink/single-link/mode checks. The separate cleanup
receipt supersedes the summary's earlier retained-state flag.

A strict-CA read-only AFTER snapshot at **01:41:29 UTC on October14** matches
full row hashes across all12 bound app/content/learning/entitlement models and
global counts for all five synthetic actors. Price80 and zero financial/voucher/
messaging rows are unchanged. This comparison covers database rows; the one
normal synthetic Auth avatar update is separately recorded. The `cadeac7` app
closed cleanly by fixed expiry at01:29, the corrected app at01:37 and the tunnel
at01:38 (exit0). Complete sealed reinspections verify45,768/45,769 files for the
respective artifacts without unlocking compiled files.

Exact-source CI and downloaded logs confirm **1,935 normal passes/40 intentional
skips**,107 files with passes/five all-skipped, **39 actual PostgreSQL passes/one
REST-only skip**, types/webpack and **lint0 errors/25 existing warnings**. The four
new payment cases are included. Required push hooks pass without bypass.
An exact committed **555-file export has zero Gitleaks findings**.

| Exact57 source check | Verified result |
| --- | --- |
| [Quality PR](https://github.com/nospotfer/jazz/actions/runs/38495998186) | Success; downloaded ZIP verifies1,935/40 normal and39/1 persisted. Push38495993076 succeeds. |
| [Secret Scan PR](https://github.com/nospotfer/jazz/actions/runs/38495998182) | Success; push38495993046 succeeds. |
| [CodeQL](https://github.com/nospotfer/jazz/actions/runs/38495994946) and [aggregate](https://github.com/nospotfer/jazz/runs/115631915804) | Success. |
| Existing protected Vercel build | Success; account/provider isolation remains unreconciled. No Vercel journey or production claim. |

Downloaded Quality ZIP SHA256:
`fc7394a58ccfcd7613d4bec30e50f065266cddec05d2f18ef0125482e83c79fb`.
The fresh locked/configured native artifact matches **550 app Git blobs**,
**45,769 sealed files** and **158 inspected client files**, with expected public
values and no supplied server secrets. **19 Unix/11 HTTPS checks pass**. CA and
private preview input packaging outside/tmp is verified for the earliercade
configuration; it is not reviewed production configuration or encrypted/off-site
retention. All temporary preview processes are closed. No paid upgrade, service/
timer, production SQL/config/resume/deploy, transaction, refund or mail occurred.

Selected evidence is preserved locally under
`/home/gabriel/backups/culturadeljazz-maintenance/2026-10-13-recovery-689f1b24/review-checkpoint-native-learning-cadeac7/`;
final preservation/scan receipts accompany the checkpoint. Earlier reports remain
immutable. Next: scoped editor hydration and actual locale controls, then remaining
Dodo recipient/signed-transaction, OAuth/SMTP, stable-host/account/DNS, old Vercel
quarantine and production review gates. The goal remains active and incomplete.

## Scoped notes editor and language controls

The two remaining UI checks now have actual browser evidence. On source
`fb37f9e` (application code unchanged from `57f5de1`), the dedicated editor's
scoped **Mis notas** textbox becomes enabled after its owned GET returns 200.
At 320px for class 1 and 390px for class 2, displayed text hashes match the
saved notes, with 13px, normal weight and normal style. No note edits occur.

The same run reproduces the language-selector failure: four hydrated 44×44
buttons sit inside a flex item squeezed to 2px, with clientWidth 0 and hidden
overflow. The ES button has only 1px visible width; its center hits a neighboring
SVG. The frozen report remains **10 checks, 9 passes, 1 failure**. This confirms
the cause of the earlier timeout without changing historical reports.

Commit `bc178997195afa3b0f5bf5e9e1cdb7720f57a6c3` adds `shrink-0` to the shared
language-selector wrapper. A separate fresh, locked build matches 550 app Git
blobs, 45,769 sealed files and 158 inspected client files. Unix **19/19** and
HTTPS **11/11** checks pass, and supplied server secrets are absent from client
files. The existing seven language component tests pass. An exact committed
555-file Gitleaks export has zero findings.

The corrected browser report passes **35/35 checks**, including 12 real ES, EN,
FR and PT-BR clicks at 1440, 320 and 390px. The wrapper now has 176px client
width; each language control is an unobstructed 44×44 target. Selected states
and visible/accessibility labels update normally. Completion labels match
Concluir, Complete, Valider and Concluir and remain reachable after normal
toolbar scrolling; completion buttons are not pressed. A separate initial
correction preflight rejected a mismatched purpose label before browser traffic
(1 failed check); that diagnostic remains preserved.

The whole window uses one native password request, one normal session sync and
one strictly scoped normal synthetic avatar update. Corrected-source session
reuse adds zero authentication or profile writes. No learning, financial, mail
or playback mutation occurs. All browsers are closed and the purpose-created
0600 session file is deleted after owner/type/link/mode checks.

The strict-CA read-only AFTER snapshot at **02:42:36 UTC on October 14** matches
the 02:23 baseline's full row hashes across all 12 app/content/learning/entitlement
models, all five actors' global counts, course price 80 and zero business rows.
The Auth avatar update is separate from this application-row comparison. Both
source-bound apps and the temporary tunnel close cleanly before their deadlines;
both full sealed reinspections pass without unlocking compiled files. This closes
the scoped editor and language-control gaps. Dodo signed transactions and
notification recipients, Google/SMTP, continuous hosting/account/DNS, old Vercel
quarantine and production review remain open. No new spend or production change.

Selected UI evidence is preserved in 26 files under
`/home/gabriel/backups/culturadeljazz-maintenance/2026-10-13-recovery-689f1b24/review-checkpoint-editor-locale-bc17899/`.
All copies have matching hashes and owner-only permissions. The evidence scan's
1,508 matches are individually verified manifest path/SHA256 pairs from the two
fully inspected artifacts; there are zero other findings or scanner suppressions.
This is local retention, without encryption or off-site recovery.

## Provider amount availability

Application source **`133716b582ce729ed2b41a548b17204841ff795c`** is published
on the maintenance branch. Missing, NULL or malformed provider amounts previously
became a zero charge and a phantom full discount. A synthetic helper probe with
metadata originalPrice 29.99 and no total reproduced finalPrice 0 and discount
29.99. This establishes a source defect, not an observed customer incident.

The documented `total_amount` field is required integer minor units including
tax. It now takes precedence over legacy `amount`, including genuine zero.
Present malformed totals, negative facts and present invalid subtotal/metadata
prices stay NULL; missing derived discounts stay NULL. Valid legacy decimal
amount aliases retain their existing conversion. The exported general money
helper, currency assumptions and gross/subtotal/tax inference remain unchanged.
[Dodo payment contract](https://docs.dodopayments.com/api-reference/payments/get-payments-1).

Purchase sync now stores nullable facts. An incomplete retry for the same payment
keeps previously known amounts and fills only previously NULL fields; a complete
snapshot retains existing replacement behavior. A new payment reference cannot
inherit another payment's amounts. The nonnullable DiscountApplied row is never
created from unknown amounts: incomplete same-payment retries preserve its money
and update only an existing voucher link when needed; replacement payments clear
stale monetary rows. Actual coupon identity, usage counting, owner/status checks
and refund/dispute barriers keep their existing policy. Enrollment metrics count
only an explicitly recorded zero as a free voucher enrollment.

Frozen regression stages remain distinct: initial four-file baseline 30 failures/
47 passing controls, a nested malformed-total follow-up, eight negative/late-coupon
failures, and a present-malformed-metadata failure. No passing result overwrites
those reports. The final targeted suite passes **260/260** across 12 files,
including **18 actual PostgreSQL cases**, seven newly persisted regressions.
Independent source review passes; existing caller contract fixtures need no
adjustment. No schema, historical backfill or actual provider transaction occurs.

Root verification on matching committed source/test hashes passes **1,973 normal
tests/47 intentional skips** in 108 passed/five all-skipped files, **46 actual
PostgreSQL tests/one REST-only skip** across five suites, types and lint **0 errors/
25 existing warnings**. The normal skip count includes seven new guarded database
cases, which pass in the separate PostgreSQL run. A clean 556-file Git archive
without private env files passes fresh locked installation and webpack build;
the builder receives no server credentials. Its source Gitleaks scan has zero
findings. Required push hooks pass without bypass.

These are source/local-database checks. Actual editor and language browser proof
remains bound to FB/BC, fresh learning to 9bd and earlier Mux/PDF/contrast/runtime
proof to e32. No new-source Dodo delivery, customer transaction, production fix or
stable-host claim follows from these results. Financial journal/currency/tax,
notification recipients, Google/SMTP, continuous-host/account/DNS and old Vercel
quarantine remain release gates. The maintenance goal is active and incomplete.


| Exact133 source check | Verified result |
| --- | --- |
| [Quality PR](https://github.com/nospotfer/jazz/actions/runs/38503514876) | Success; downloaded ZIP confirms1,973/47 normal and46/1 persisted. Push38503510218 also succeeds. |
| [Secret Scan PR](https://github.com/nospotfer/jazz/actions/runs/38503514872) | Success; push38503510177 also succeeds. |
| [CodeQL](https://github.com/nospotfer/jazz/actions/runs/38503511409) and [aggregate](https://github.com/nospotfer/jazz/runs/115655785613) | Success on exact133 source. |
| Existing protected Vercel build | Combined status success. Account/provider isolation remains unreconciled; no Vercel journey or production release claim. |

Downloaded Quality ZIP SHA256:
`7ace5fd49962f62157b390fbd3314e0159578e10dc3157591e4024fe1178ba78`.

## Payment history recovery and account isolation

Source **`a207f36feb804486f7b3ba926bb44a2bacaa86a2`** fixes three confirmed
history defects. Failed requests previously displayed “no purchases”; failures
and malformed successful responses now show a generic localized error and a
44px Retry control. A successful empty array retains the empty state, including
corrected Portuguese wording. Loading exposes an accessible status.

A mounted account switch could retain the previous account's financial rows or
accept its late response. The page now waits for the initial Auth session,
clears/aborts on identity change, and rejects stale results with an owner epoch
even if cancellation is ignored. Same-owner token refresh preserves the loaded
history. Each GET supplies `expectedUserId`; the server verifies cookie-backed
identity before reading purchases and returns 409 on a mismatching or blank
hint, closing the cookie-update race. The hint grants no access. Unauthenticated
requests remain 401; callers without a hint retain their own-record response.
POST, accounting, currency, schema and historical data policy are unchanged.

Frozen page baselines retain seven failures/three controls and a later owner/
response-shape baseline of 15 failures/four controls. Final component cases pass
**19/19**. The GET regression baseline has three failures/33 controls; five added
cases cover mismatch/blank, matching-empty and unauthenticated hints. Existing
direct route fixtures now pass a Request required by Next's generated types,
without changing expected behavior. Independent source review passes. Root and
downloaded CI verify **1,995 normal passes/47 intentional skips**, 108 passed/
five all-skipped files, **46 PostgreSQL passes/one REST-only skip**, types/build
and lint **0 errors/25 existing warnings**. The clean 556-file committed export
has zero secret findings. Required hooks pass without bypass.

A fresh Node24.21.0 locked configured webpack build matches **551 application
Git blobs**, seals **45,770 files**, and checks **158 client files** for correct
public key/origin and absence of supplied server secrets. Actual Unix transport
passes **19/19** and protected temporary HTTPS passes **11/11**. This independent
window reuses the fifth synthetic USER and its existing root-created course
grant; no provider payment is implied.

Root bounded SQL changes only that grant's final/discount amounts from 80/0 to
NULL/NULL, then 0/80, then exactly back to the original row including updatedAt.
Actual owner-bound API/UI checks pass separately: recorded80 **10/10**, unknown
**7/7**, real-zero fixture **7/7**, restored80 **7/7**. These **31/31** successful
phase checks include ES320, EN390, FR1440 and PT320, 16 real locale clicks,
44px language controls and no horizontal overflow. One controlled intercepted
500 displays an error instead of empty history; a real Retry GET200 recovers.
An actual server owner-mismatch GET returns 409. The initial **3/2/1** report
retains a helper assertion before GET completion; a separate **1/0/1** optional-
label CLI diagnostic stopped before any browser traffic. Neither is erased or
counted as an application failure. Empty-account and mounted account-switch
behavior have source regressions, not an actual browser journey claim.

The whole window uses exactly one password login, one normal session sync and
one normal own-avatar update; saved-state continuations add none. Nineteen
automatic reconciliation intents are intercepted before the app. No browser
learning/financial/mail write, actual Dodo transaction or playback occurs.
Root strict-CA read-only snapshots at **03:38:15.510Z / 03:55:44.840Z** confirm
all five actors' **12 model hashes**, global counts, original four accounts,
learning/entitlements, price80 and zero business rows unchanged after restoration.
The restore guard observes explicit restoration without executing its fallback.
All browser contexts and Chromium processes close, the purpose session is deleted,
and owned app/tunnel shutdown and full sealed reinspection pass. Earlier learning,
editor, media/PDF and restart/UID proofs remain separate. No spend or production
change; provider notification/transaction, Google/mail, continuous-host/account/
DNS, old Vercel quarantine and production review gates remain open.

| Exact a207 source check | Verified result |
| --- | --- |
| [Quality PR](https://github.com/nospotfer/jazz/actions/runs/38507290995) | Success; downloaded logs confirm 1,995/47 normal and 46/1 persisted. Push38507286850 also succeeds. |
| [Secret Scan PR](https://github.com/nospotfer/jazz/actions/runs/38507291080) | Success; push38507286857 also succeeds. |
| [CodeQL](https://github.com/nospotfer/jazz/actions/runs/38507289757) and [aggregate](https://github.com/nospotfer/jazz/runs/115667755523) | Success on exact source. |
| Existing protected Vercel build | Actual combined Vercel status is success, “Deployment has completed.” Account/provider isolation remains unreconciled; no Vercel journey or production release claim. |

Downloaded Quality ZIP SHA256:
`90342e5a3dbdf2f31d0e3d0b4c170c275d94173f0b0df35d2e9a03d6dc6c4c51`.

An initial48 selected regression/native/browser/CI files are retained with
matching byte hashes, files600/directories700, under
`/home/gabriel/backups/culturadeljazz-maintenance/2026-10-13-recovery-689f1b24/review-checkpoint-payment-history-a207f36/`.
Credential, launch/config/env, actor and session inputs are excluded. All753
scanner matches are individually verified as exact path/SHA256 records in the
fully inspected seal manifest; zero other findings or new suppressions. The
Quality ZIP's26 expanded text entries separately scan with zero findings. This
is local retention, without encryption or off-site recovery.

## Local credential boundaries and static rollback fallback

The previous goal turn made concrete source/browser/CI progress. This follow-up
finds ignored credential CSV and private app.env at0664. Owned regular/single-link
metadata is verified, both files become0600, and Git exclusions/contents remain
unchanged. This is a local permission correction, not evidence of an exposure
incident or production account-policy change. The durable private preview input
already holds the same six provider values as the verified a207 window; its old
source/origin cannot be reused as a fresh launch. No credential values/digests
are emitted. The TEST key is additionally retained in an owner-only durable
configuration path; one bounded test product GET verifies the existing target/
business/8000EUR price. No automatic loading, rotation, mail or transaction.
[Dodo credential retention](dodo.md#local-test-credential-retention).

Source **`9cb3d3f`** adds the actual closed maintenance fallback proposed by the
rollback plan: standalone original-logo/jazz-gold HTML plus exact503/header JSON
and [operator runbook](maintenance-fallback.md). No Next/backend/provider/analytics,
forms, external assets, cookies/storage or background requests are required.
Default Spanish remains readable without JS; actual native44px controls select
ES/EN/FR/PT and matching document language/title. Manual recheck strips query,
fragment/userinfo and makes a fresh same-origin rootGET, not a POST replay; file
review preserves its local path. The precise meta style/script hashes and
header-only frame-ancestors contract match the frozen artifact.

Initial **109/110** real browser checks preserve the320px200%CSS-zoom overflow,
source and screenshots. A wrapping/min-width correction then passes **138/138**
actual loopback HTTP/browser checks:320/390/1440 both color preferences,24 real
language clicks, keyboard/recheck/JS-disabled content, contrast minimum**5.72:1**,
no horizontal overflow including200%CSS zoom, actual503/RetryAfter300/no-store/
noindex/no-referrer/nosniff/CSP, HEAD503/body0 and unavailable nonGET/API/checkout/
webhook requests with no forwarding. Fourteen expected503 resource console
messages are separately classified; client/CSP errors and outside/storage/cookie/
fetch/XHR/beacon activity are zero. Separate **4/4** local-file checks verify
French and clean same-file recheck. Native-browser zoom/fullWCAG are not claimed.

HTML SHA256 **`9dd0b14b1e06cf0ff002197c028bf798abbcd860996ab61e5c56f6d423587830`**
matches actual receipts and the committed source; exact original logo bytes and
JSON/CSP digests are independently checked. Source review passes. All owned
browsers/server close, zero Chromium processes remain, and no shared runtime,
DNS/account/production change or spend occurs. This is a prepared asset with
local serving-contract evidence, not an activated host or a repaired production
backend. Native e32/9bd/FB/BC/a207 app scopes remain distinct. Provider/merchant
recipients/OAuth/mail/continuous-host/account/DNS/quarantine/production review
gates remain essential; the goal is active and incomplete.

## Fallback publication and private-view owner follow-up

Documentation HEAD `8e68f68d63eebca6da89a5c11203467cb16ec62c` includes the prepared
`9cb3d3f` fallback. Its exact [Quality PR run](https://github.com/nospotfer/jazz/actions/runs/38514816671)
and push run 38514810716 pass; downloaded logs confirm **1,995 normal passes /
47 skips**, **46 PostgreSQL passes / one REST skip**, build, types and lint
0 errors / 25 warnings. Secret Scan PR 38514816735 and push 38514810694 pass,
as do CodeQL run 38514813078 and aggregate 115691258799. The actual Vercel
combined status reports a completed deployment; provider isolation remains
unreconciled. There is no separate CI run for intermediate `9cb3d3f`.

Both exact committed exports contain 559 files and scan with zero findings;
expanded Quality logs also scan clean. The nine changed files between these
commits are instruction/maintenance documents. Forty-eight selected fallback,
publication and secret-free permission/credential-retention receipts are kept
outside `/tmp` at
`/home/gabriel/backups/culturadeljazz-maintenance/2026-10-13-recovery-689f1b24/review-checkpoint-maintenance-fallback-9cb3d3f/`.
Every copied byte hash and owner-only permission matches. All 34 scanner matches
are independently verified path/SHA256 entries in the committed-file manifests;
there are no other findings or new suppressions. Actual credentials, environments,
configuration, actors and sessions are excluded. This retention is local,
unencrypted and not off-site; the fallback remains inactive.

A new high confidentiality/correctness issue is **confirmed and being repaired**.
On `9cb3d3f`, a frozen closed-mock suite reproduces 12 failures with five passing
controls: dashboard account changes retain old identity, protected SSR children,
avatars or counters. Actual parent composition executes, with synthetic private
children; the course player has the same unguarded sidebar consumer. Notes have
their own existing owner guard and are not claimed to leak by this proof.

On exact `8e68f68`, six user-scoped routes additionally have 24 frozen failing
owner-consistency cases and 18 passing controls. A stale client identity hint
does not stop reads or a progress update for the different, verified cookie
owner. These are closed mocks with no provider/database calls, not a backend
authorization bypass: the server still selects the authenticated account.
Whole-view retirement, guarded late results and expected-user checks are in
progress. Real cross-tab transport, refreshed SSR ownership and the empty-account
native journey remain pending on a fresh exact-source preview.

The same private-view retirement is being applied to the admin layout; two
separate frozen actual-parent cases reproduce retained privileged children after
account change/sign-out. Two checkout components have a separate frozen baseline
of eight stale-response failures and two current-owner controls. These proofs
remain distinct from the original 17 component cases. Source review also finds
the active course-progress read: its separate exact-HEAD baseline has four
failures and three controls. All seven read/progress routes now pass 49 closed
owner-consistency regressions; full combined checks and native verification are
still pending.

## Account pages without a course purchase

A separate local UX correction permits registered users to open their own
`/dashboard/profile`, `/dashboard/payment` and `/dashboard/settings`, including
canonical trailing-slash variants. Requiring a full-course purchase to manage
an account or inspect its own receipts prevented useful account recovery and
made successful empty history inaccessible. The server dashboard authentication
and private owner boundary still apply; this changes the purchase overlay for
these three exact pages only. Lessons, videos, messaging and course recognition
retain their existing access rules. No API, entitlement, price or provider
configuration is changed by this policy correction.

On frozen exact `8e68f68`, the new component suite has **six failing account-page
cases and nine passing paid/free controls**. The unchanged 15 cases now pass,
alongside seven existing lesson-notes/paywall controls. A former locked-profile
control is deliberately replaced with a paid-video-route control, so both unpaid
restriction and paid access still have useful coverage. These are closed
component checks without network/provider/database calls. Actual unobstructed
free-account profile/settings/history and ownership verification were pending at
this source-preparation checkpoint; the fresh-source observations below supersede
that gap. Older A207 browser evidence is not relabeled.

## Private-view ownership and account access source verification

Source **`4f395e0569ab4037de7fe32a33a8e48cb8e4e35c`** retires the entire private
dashboard, administration, course and lesson frame when the SDK account changes
or signs out. Private children render only when the current SDK owner matches the
verified server owner. A synchronous generation invalidates previous-owner reads,
avatars, checkout replies, player progress/completion work and reconciliation
refreshes; account changes remount the private frame. Same-owner token refreshes
preserve it. A changed generation has one automatic refresh, followed by localized
manual recovery; unresolved initialization has a finite fallback. The SDK hint
does not grant roles or replace server authentication/entitlement checks. Already
delivered HTML, cached bytes and previously issued media tokens are not erased.

All seven affected read/progress routes verify the cookie identity first, then
reject mismatching, blank or duplicate optional `expectedUserId` hints with409
before database/access/mutation work. Missing hints remain compatible; unauthenticated
requests remain401. The earlier purchases hint contract remains separate.

Frozen before/after proofs remain distinct: dashboard/component17 cases had12
failures/five controls; admin parent two failures; two checkout components eight
failures/two controls; additional CourseView checkout four failures/one control.
The original six-route42-case baseline had24 failures/18 controls; the seventh
route separately had four failures/three controls. All49 route regressions now
pass; the original server package passes134 cases with its existing controls.
The final client package passes111 cases across seven suites, including27 parent/
owner-boundary cases. Independent review's18 frozen runtime-file hashes match
the committed blobs. Fixture/setup failures remain retained diagnostics.

The exact three account-route exemptions pass22 component checks, preserving
paid-content restrictions. Fresh Node24 clean-source verification passes **2,130
normal tests /47 skips**, **46 actual PostgreSQL tests /one REST skip**, types,
and lint **0 errors /23 warnings**. There are114 files with passing assertions and
five without executed cases; Vitest's nested suite count is not a file count.
The exact570-file committed export scans with zero findings/new suppressions.
Required commit/push hooks pass without bypass.

Actual [Quality PR](https://github.com/nospotfer/jazz/actions/runs/38522879886)
and push38522874985, Secret Scan PR38522879906/push38522874988, and
[CodeQL](https://github.com/nospotfer/jazz/actions/runs/38522876079)/aggregate115716562170
all pass. Downloaded Quality ZIP SHA256
`8867462c07803ae3c655b40bca69be0c6251cefeb74fbb47b2659a2a76b54425`
confirms those test/build/type/lint counts; its26 expanded text entries scan clean.
The actual Vercel combined status reports deployment completed; its provider
isolation remains unreconciled and no customer journey there is claimed.

Fresh private HTTPS artifacts match565 Git application blobs,45,785 sealed files
and158 inspected client files. Locked installation, configured webpack build,
public-origin/key binding, server-secret exclusion, strict published CA, actual
Unix19/19 and HTTPS11/11 checks pass. The latest normal-network native browser
run passes19 of20 checks: actual A sign-out removes private course controls;
real cross-tab B sign-in retires the generation and refreshes B's incomplete first
lesson; current B authenticated reads return200 and a stale A purchases hint409.
Free B sees its own empty history, identity, zero paid counters, unobstructed
read-only profile/settings, and the paid dashboard route remains gated.
Matching SSR identity is explicitly a source-derived equality inference,
corroborated by actual B-owned reads and incomplete-course UI, not serialized-byte
proof. No playback, learning, payment, mail or preference/profile edits occur.

This run stops at B's final normal menu click timeout; physical hit/stability and
trusted dispatch were not observed. It does not establish an application defect
or prove B sign-out. Earlier8/9 detector and two5/6 menu diagnostics remain
immutable and distinct. Actual artificial delayed-response privacy is unproved;
closed source regressions cover it separately. All browser contexts and owned
app/tunnel processes close; strict-CA all-five/12-model before/after hashes,
global counts, learning/entitlements and business rows remain unchanged, and
sealed reinspection passes. Six total password/session requests across those
closed windows are recorded rather than resetting a consumed budget. A fresh
bounded foreground/actionability observation is in preparation.

The source and account UX are unreleased. Dodo recipients/transactions/delivery,
Google/SMTP, continuous host/account/DNS, previous Vercel quarantine and production
hardening/release remain required gates. No new spend or production change.

## Contained paywall and complete native account verification

A further foreground observation on exact4f preserves the **19/20** failing
native baseline. The free account's sign-out button has a visible, focused,
font-ready222×40 rectangle, but its center hits a DIV outside the menu. An ordinary
Playwright trial confirms pointer interception, with no instability, detachment,
viewport or scheduled-navigation issue; no B logout request is made. Header and
later paywall both havez30, so the paywall escapes its content stacking context
and covers the header dropdown. Earlier menu timeouts remain unclassified raw
diagnostics; this new observation establishes the narrower actual defect.

Final source **`4145268936bfd7b386dd51fd9f794459f7daa41c`** contains the paywall
inside its own stacking context. Independent review catches and corrects the
inline fixedz90 payment dialog being trapped there: the unchanged dialog is a
sibling outside the isolated content/paywall. Only one application file differs
from4f. Intermediatea056 is pushed together with its final correction and has
no separate remote/native proof. All18 frozen ownership-review file hashes remain
unchanged; the additional paywall/modal change has independent source review.
The unchanged22 account/paywall component cases pass. Required hooks pass with
explicit synthetic DATABASE_URL/Node24; the initial push rejection for a missing
required synthetic URL is preserved, and hooks are not bypassed.

Exact [Quality PR](https://github.com/nospotfer/jazz/actions/runs/38569228404)
and push38569223223, Secret Scan PR38569228825/push38569223311,
[CodeQL](https://github.com/nospotfer/jazz/actions/runs/38569225324)/aggregate115869968073
and the actual Vercel completed status all pass. Downloaded Quality ZIP SHA256
`e0e74433ee4a925af288c78cf1659648b00d221854e9ef1cc2eb83fb6c35cf82`
confirms2,130 normal/47 skips,46 actual PostgreSQL/one REST skip, types/build and
lint0/23. The570-file exact committed export and26 expanded log entries scan0.
Vercel provider isolation and customer journeys there remain unverified.

A fresh414 locked-install/configured build again matches565 Git application
blobs/45,785 immutable files/158 client files, compiled origin/public key, strict
CA and server-secret exclusion; actual Unix19/19 and HTTPS11/11 pass. The
normal-network native browser now passes **24/24**: actual SDK cross-tab A
sign-out/B sign-in, private course retirement/refreshed B incomplete state,
owned empty receipts/header/counters/profile/settings, actual stale-hint409,
retained paid-course restriction, reachable purchase option, and dialog open/
cancel with full-viewport physical coverage of header/sidebar/menu. Both actual
sign-out buttons have unobstructed physical targets, pass ordinary trial clicks,
receive trusted pointer/mouse/click events and perform normal logout; B's final
sign-out removes the other tab's private frame. No forced clicks/fake SDK events.

This window uses two password requests/two normal session syncs/one normal own
avatar metadata PUT/two normal logouts. Ten password/session requests total
across all closed owner-test windows remain explicit. There are no checkout
continuations, voucher interactions, provider payments/mail, playback or learning
writes, profile-form or preference edits. Actual delayed-response privacy and
provider payment amounts are not proved by these geometry/ownership checks.
Strict-CA before13:07:24/after13:10:59 all-five/12-model/global/learning/business/
entitlement hashes remain unchanged. All contexts/Chromium/app/tunnel processes
close cleanly; final sealed inspection passes. Existing services are preserved.
The source remains unreleased, with zero new spend and all provider/production/
hosting gates retained; the maintenance goal remains active and incomplete.


## Catalog prices and course-action lifetime

Source **`44ec58bebffd9735f9af6b4f51b6f5b1eb86a4f6`** repairs a confirmed
catalog/UI family. Dashboard summaries and outlines fetch the price and ID from
the same oldest published course; changed cache keys avoid reusing the earlier
ID-only shape. The dashboard course widget, paywall, course details/enrolment and
lesson-player modal now receive that known catalog price. Real numeric zero stays
zero; missing, negative, nonfinite or nonnumeric values stay unavailable. The
shared dialog displays a coherent voucher original/discount/final snapshot;
unknown voucher amounts disable continuation and validation. Omitted legacy
callers retain the prior default, while explicit NULL has an unavailable label
and recovery hint. All current course callers provide an explicit price.

The backend previously coerced NULL and malformed amounts into its free-grant
branch. It now returns localized503 before voucher evaluation, purchase writes
or provider checkout for an unavailable catalog price; explicit numeric0 retains
the intended free path. Duplicate-purchase diagnostics now retain only the finite
`already_purchased` category, removing customer/course/purchase identifiers and
role. There is no claim of an actual provider incident or historic log scrubbing.

Course/open epochs reject voucher callbacks from removed courses, closed dialogs
and earlier openings, and reset displayed vouchers and parent checkout intent
together. Course-ID keys retire course-specific purchase state. A frozen actual
React commit-order test shows old course DOM removed while its action guard is
still valid during the replacement's layout phase; synchronous cleanup now retires
that guard and the player's mounted flag. Same-owner token refresh and immediate
SDK owner invalidation retain their existing behavior.

Frozen source baselines remain distinct: catalog10 has5 failures/5 controls;
modal lifetime8 has6 failures/2 controls; checkout availability13 has9 failures/4
controls; duplicate logging1 fails; customer caller20 has18 failures/2 controls;
commit-order lifetime3 has1 failure/2 controls. Six additional modal safeguards
pass. These61 new cases are included in the full suite. Initial harness diagnostics
are preserved separately and excluded from the application failure counts.
Independent review binds all22 source/test files to committed hashes. Twelve of
the previous18 ownership-review source files remain unchanged; the six changed
files have explicit current independent review.

Fresh clean Node24 verification passes **2,191 normal tests/47 skips**,
**46 actual PostgreSQL checks/one REST skip**, types and lint0 errors/23 existing
warnings. Exact [Quality PR38579918169](https://github.com/nospotfer/jazz/actions/runs/38579918169)
and push38579904074, Secret Scan PR38579918261/push38579904114,
[CodeQL38579909536](https://github.com/nospotfer/jazz/actions/runs/38579909536)/aggregate115907021445
and the actual Vercel completed status pass. Downloaded Quality ZIP SHA256
`4e9281fe1ad80dc599182024f4c245bb826115b379e0d7d2deaa91932596117d`
confirms those normal/persisted counts, types/build/lint;26 expanded entries scan0.
The exact577-file committed export scans0 without new suppressions. Vercel
provider isolation and journeys there remain unverified.

A fresh configured locked-install artifact matches572 Git application blobs,
45,792 sealed files and158 inspected client files. Public origin/key binding,
server-secret exclusion, strict published CA and actual Unix19/HTTPS11 checks
pass. A timestamp-shape rejection occurs before app/browser startup; canonical
normalization preserves the original expiry and credentials. The first native
run retains21/22 checks: current owner/account flows and class2 denial/details80
pass, then the new helper checks a dynamic language wrapper before waiting for
mount. The second retains20/21, stopping on an immediate redirect assertion.
Neither old report records enough timing detail to relabel its failure as a pass.
Both browser reports remain immutable; no application defect is established by
those assertions. Prior414 native24/24 also remains a distinct historical scope.

A separately scoped fresh B-only browser on the same verified source44 artifact,
active gate and **unchanged expiry** passes **32/32**. Its24 quote/dialog cases
cover dashboard CourseView, course details/enrolment and the dashboard paywall,
ES/EN/FR/PT at1440/390. Actual ordinary language clicks set matching cookie and
HTML language; the current trace observes the dynamic control count0 before the
wait and1 after it. Catalog80 appears in CourseView/details and dialog base/total,
with genuine zero discount; ordinary unobstructed open/cancel clicks pass. No
voucher entry/validation or checkout continuation occurs. Paid class2 returns
actual200 document responses for the requested lesson and redirected course
details, then a locked course-details URL/owned frame/quote80 with no player.
Normal B sign-out uses trusted clicks and an unobstructed target; zero uncaught
client errors, forbidden mutations or session artifacts remain. This addon does
not repeat or claim the earlier full cross-tab owner journey. The lesson-player
payment dialog remains natively unexecuted: existing server access checks prevent
B reaching its locked branch, while A already owns the course. Its caller/NULL/0
behavior is covered by the separate real-component regressions.

The originally launched helper SHA256
`a12b38b1ef927e09f468cb0cbcaaa0f1d045ddae098cdac7537340b956d580a7`
is retained separately. A later preparation-only revision is not the executed
input and cannot be counted as evidence. The addon uses one B password request,
one normal session sync, no avatar PUT and one normal logout. Together with the
preceding two-actor run this active preview uses three password/session pairs;
all closed owner/catalog windows total15, without resetting consumed budgets.
Strict-CA before14:37:48/after14:51:12 all-five/12-model/global/business/learning/
entitlement hashes remain unchanged. All browsers/Chromium/app/tunnel processes
close cleanly and sealed reinspection passes. The first21/22 window separately
preserves its own before14:25:45/after14:31:52 comparison and closure. Actual
artificial delayed replies, provider charges and the unreachable player dialog
are not proved by this catalog addon.

**Positive billing parity remains unresolved:** checkout metadata still uses the
existing29.99 default, while Dodo's cart charges its configured product price.
Catalog/UI alignment does not verify the provider's charge, tax or currency.
The dialog says the final amount is confirmed in checkout; this is not a
reconciliation or a substitute for provider verification. No catalog SQL, provider
price, schema, tax/currency policy, real transaction/refund or third-party mail
change is authorized or performed. Production remains unreleased; all broader
provider/hosting/hardening gates remain and the goal is incomplete.


## Checkout publication and account intent

Application source **`cd20569a4460374518bfd20c3a21a9957abac5c5`** contains
`3ce58a8` plus a lifecycle-test URL correction. Checkout now requires an explicitly
published course before free grants, voucher work or provider checkout, including
for admins. A verified cookie identity remains the sole purchase authority. An
optional `expectedUserId` consistency hint is checked immediately after server
`getUser`, before all database reads and financial work. Wrong, blank or duplicate
hints return409 `Session changed`; omitted legacy hints and unauthenticated401
retain their behavior. All four active clients send their captured owner ID and
show localized manual-refresh guidance for that precise JSON409. Ordinary voucher
conflicts and current-owner/frame/lesson guards remain intact; no retry is added.

Frozen source44 baselines are separate: publication9 has4 failures/5 controls;
server intent8 has4 failures/4 controls; client28 has8 failures/20 controls. A
real disposable PostgreSQL baseline4 actually persists a draft grant and a
wrong-cookie grant in its two failures, with two legitimate controls. The same
frozen server/PG bodies pass after the repair. Initial client selector diagnostics
are preserved; revised assertions target the actual modal. Thirty new normal
cases and four opt-in PostgreSQL cases are included in full verification. The
first full run has2,219 passes/two failures/51 skips: two older lifecycle afterEach
checks allowed only a plain checkout URL. Their exact captured-owner URL update
preserves the behavior assertions; the failed report remains retained.

Final clean private Node24 checks pass **2,221 normal tests/51 skips**, **50 actual
PostgreSQL tests/one REST skip** in six guarded suites, types and lint0 errors/23
existing warnings. Independent review binds15 relevant source/test/unchanged
safeguard hashes to the final commit; the sole author-manifest delta is a root
type-import alias correction. Mandatory hooks pass. Exact
[Quality PR38593319613](https://github.com/nospotfer/jazz/actions/runs/38593319613)
and push38593308747, Secret Scan PR38593319973/push38593308748,
[CodeQL38593310891](https://github.com/nospotfer/jazz/actions/runs/38593310891)/aggregate115953795818
and actual Vercel status pass. Quality ZIP SHA256
`c544613385e75f088092d20cd77e2031b0faa5e4a92575a684e56f2eeb0d78ea`
confirms these counts/types/build/lint;26 expanded entries scan0. The exact581-file
Git export scans0 without new suppressions. Vercel isolation remains unverified.

A new configured locked artifact matches576 Git application blobs/45,796 sealed
files/158 inspected client files, with public origin/key binding and no supplied
server secrets in client assets. Actual Unix19/HTTPS11 checks pass. Payments,
mail and cron credentials are absent. The actual native checkout matrix passes
**12/12**: dashboard CourseView, details/enrolment and the paywall ×ES/EN/FR/PT
at390. Real B actions produce unchanged B owner hints/body; A's independently
verified live API cookie jar gets actual409 JSON, relayed without body/status/
header rewriting. Original B POSTs are never continued. The actual modal shows
manual-refresh copy, without redirect or retry. No provider payment/mail occurs.
This controlled transport relay is not naturally occurring Chromium cookie lag.
The locked-player modal remains covered by actual components, not native claims.

The first browser stops before checkout on a wrong purchases409 JSON assumption;
that older route returns plaintext. Its two sign-in/session pairs remain consumed.
A distinct frozen correction on the same artifact/origin/gate and unchanged expiry
passes the12 matrix cases and both identity preflights, then stops on an immediate
logout-counter assertion without awaiting its response. Both raw reports and
executed helper hashes remain separate; no established application logout defect
or whole-run success is inferred. All their contexts/Chromium close; page errors
and forbidden mutations are0. Four total password/session pairs in this preview
bring cumulative owner/catalog/checkout windows to19. A separately bounded
sign-out-only browser uses two additional password/session pairs and no checkout.
Ordinary native clicks produce trusted pointer/mouse/click events, actual global
logout204 for both accounts and signed-out private boundaries before assertions.
This independent two-sign-out proof passes; neither earlier partial is relabeled.
Six pairs in this preview and21 cumulative remain explicit; three recognized
optional own-avatar PUTs are blocked, with0 metadata writes. Strict-CA before
15:54:34→after16:24:08 all-five/12-model/global/business/learning/entitlement hashes
remain unchanged. Every context/Chromium/app/tunnel closes, owned sockets are
removed and final sealed inspection passes. No matching provider checkout,
natural cookie-lag reproduction or native locked-player pass is claimed.

A separate private offline package fingerprints **93 public index definitions**,
including standalone uniqueness that the hardening revision2 table/name guard
does not prove. Its18 closed checks pass, including a same-name UNIQUE→nonunique
counterexample; no production drift is observed or SQL executed. Root verifies
all12 frozen artifact hashes and four protected original hashes. This is a
review-only preflight proposal: a future locked-transaction integration is needed
to remove the separate-capture race. Revision2 SQL/inverse remain unchanged;
column equivalence and the extension ACL recovery gap remain unproved.

The published-course check is a read snapshot, not a transactional publication
lock or a historical-entitlement revocation. Positive29.99 metadata and Dodo
product/catalog/tax/currency parity remain separate release gates. No provider
transaction/refund, third-party mail, pricing/config/schema or production change
occurred. Zero new spend; the goal remains active and incomplete.


## Quote provenance and transactional course intent

Commits `b91a7fb`, `e8b9fab`, `bd49f00`, `c1a419c` and fixture-only `a631e166`
repair mobile administration, transactional course intent and payment provenance.
Checkout labels catalog80/coupon72 as quote metadata rather than29.99 payment
facts. Provider cart/product configuration is unchanged. Extraction preserves
actual final amounts including0; merchant metadata and gross totals cannot
supply absent original/discount amounts. Legacy explicit provider subtotal can
produce a difference only with EUR/zero-tax evidence and subtotal>=total;
otherwise discount stays unknown. Applied coupon identity, entitlement/reversal
rules and known same-reference facts remain intact. No historical backfill.

The exacta16 pricing freeze has26 cases/21 failures/five controls; corrected26
pass. A separate intermediate ordering boundary has one failure/two controls,
then three passes. Author222 focused passes and independent13-file review cover
quotes, actual totals, coupon usage, partial/same-reference/replacement/refund
behavior and meaningful compatibility fixtures. These are closed mocks, not
provider transactions. Whole source initially fails four older expectations;
three fixture-only files correct guessed amount contracts and the missing mocked
lock read, retaining names/counts and original assertions. Original2351/4/68
report stays immutable; final fresh **2355/0/68**, types and lint0errors/22warnings
pass. Eight guarded PostgreSQL suites separately pass **67/one REST-only skip**.

Free-grant transactions retain a course `FOR NO KEY UPDATE` lock after the
existing voucher advisory lock, rechecking publication/exact server price and
revalidating the server voucher quote through the transaction client. Genuine
free grants and voucher limits remain. The lock blocks publication/price edits
while permitting ordinary FK KEY SHARE, avoiding the stronger lock's ordering
risk. No early VoucherCode row lock is introduced; concurrent administrative
voucher-term edits remain a separate gap. Paid historical fulfillment keeps its
existing policy. Direct redemption course conflicts return400/503/409; checkout
maps them to404/503/409. Quote409 does not use the session-conflict JSON shape.

Frozen real PostgreSQL evidence proves five new direct-redemption interleavings
and four checkout races: stale unpublish/NULL/known-price/zero-to-paid grants
really persist before and leave all grant/accounting/use counts0 after. A real
250ms lock timeout confirms the admin edit waits until the grant transaction
finishes, then proceeds. Root's six new checkout cases preserve two legitimate
0/full-voucher grants; together with four older owner/publication controls they
pass10/10. Exact UUID-only fixture cleanup preserves unrelated data.

Mobile admin now stacks the sidebar/content and exposes native expandable
navigation with keyboard support and44px targets. Email and purchase identities
wrap; recorded amounts/permission guards are unchanged. The broken creation
shortcut now links to the existing course list; course authoring is still absent.
Actuala16 baseline has390px viewport/683px document,288px sidebar/102px content;
1440 fits. Separate freshc1a preview passes eight geometry observations at
320/390/768/1024/1440 (including three open-menu states), three actual keyboard
menu cases and six permitted44px links at every width. This is light-theme
admin evidence; no new dark-theme visual claim. Actual normal global logout204
and zero page errors/forbidden mutations pass. One pair in each separate admin
window brings cumulative owner/catalog/checkout/voucher pairs to26. Original
voucher12/13 and zero-traffic preflight reports remain unchanged.

Fresh configuredc1a build matches586 Git application files/45,806 sealed files/
158 inspected client files and passes Unix19/HTTPS11. Root before23:08:44 to
after23:13:51 UTC strict-CA all-five/12-model/global/business/learning/entitlement
and complete raw course/timestamp comparisons match. Browser/app/tunnel close
cleanly, owned processes/sockets retire and seal reinspection passes. Both admin
windows have zero course/learning/public-table writes. Sourcea631 differs from
that runtime only in three test files; it is not a new native execution.

Exact-source [Quality PR](https://github.com/nospotfer/jazz/actions/runs/38652699048)
and [Quality push](https://github.com/nospotfer/jazz/actions/runs/38652694052)
pass; [Secret Scan](https://github.com/nospotfer/jazz/actions/runs/38652699044)
and [CodeQL analyses](https://github.com/nospotfer/jazz/actions/runs/38652694888)
pass, with no open branch CodeQL alerts at inspection. Classic Vercel status is success;
remote provider isolation remains unverified. Downloaded26-file Quality logs
confirm2355/68 and67/1, types/build/lint0/22 and all eight persisted suites.
591 committed files/26 expanded logs scan0. Selected102 evidence files plus
manifest/retention receipt are copied byte-for-byte to the private durable
`review-checkpoint-quote-admin-a631e166` directory under the existing
`2026-10-13-recovery-689f1b24` backup. The nonempty103-file candidate scan finds0;
credentials/raw course rows/session state/screenshots are excluded. All retained
directories/files are0700/0600. This local unencrypted copy does not establish
off-site recovery. Docs-head checks remain a separate finalization step.

**PAY-22 remains High source work:** current currency-independent /100 conversion
and two-decimal sync misread explicit JPY/KWD. These fixes establish bounded EUR
provenance, not currency-aware persistence/display. Dodo documents
[currency-specific smallest units](https://docs.dodopayments.com/api-reference/payments/get-payments-1).
Sourcecounterexamples: JPY2990 becomes29.9 instead of2990; KWD2990 becomes29.9
instead of2.990, and1.234 would round to1.23. No customer incident is claimed.
Next: implement currency/precision representation and meaningful persisted
regressions, preparing any schema change without production migration. Provider
price authority/actual test transactions/notification recipients, OAuth/mail,
continuous free hosting/DNS and exact production recovery/quarantine review remain
gates. Zero new spend, real charge/refund, third-party mail or production change.
