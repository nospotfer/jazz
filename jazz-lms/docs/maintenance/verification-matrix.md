# Goal verification matrix

## Current verification — Oct22 02:05 Madrid

| Requirement | Actual result | Status |
| --- | --- | --- |
| Public production | Vercel remains paused/503; original/replacement customer backends paused | Unreleased; no new production change |
| Protected owner preview | ace0804, public401/authorized200, fixed Oct22 22:17UTC expiry; all3 specific handles freshly live | Available on synthetic data |
| Student/media/UI | Actual isolated login/signed Mux/PDF, current desktop/mobile light/dark | Passed in recorded preview scope |
| Recovered database/files/admin | Accepted1,621rows/all68PDF; R14 admin login/dashboard/logout | Complete; do not replay |
| Real existing-student password | Owner uses only admin, no controlled USER credential identified | Unverified limitation; separate ordinary-student tests |
| Selected candidate |509fa06 locked build/45,857 files,10 remote checks/Vercel success | Passed with synthetic server inputs |
| Checkout initiation switch |272 native config +126 route/UI/control cases; actual built four-language503/voucher JSON503 | Passed; staged settingtrue, not deployed |
| Native container dependency | Old slim image fails Prisma/OpenSSL; full-image native load and API/worker liveness pass | Corrected image pinned; not DB/provider health |
| Actual built service lifecycle | Rendered unit starts actual Next, restarts after worker SIGTERM, stops/removes; exact maintenance503/HEAD/webhook pass | Passed network-none/test overrides; no real tunnel or boot recovery |
| Older LIVE payments |5 GETs200;3 paid successes match archive, no refunds/disputes/extra older known-product successes | Passed current older status; full RPO unverified |
| Domain access | Owner names Gmail; Squarespace login/listing requested; Google NS can be Squarespace defaults | Access unestablished; no DNS change |

[Source-bound outcomes and evidence](production-readiness.md#day-preview--oct21-2230-utc).

## Current verification — Oct21 22:03 UTC

| Requirement | Actual result | Status |
| --- | --- | --- |
| Coupon/billing/payment creation | Quote80/8/72; one actual checkout; six nonempty fields; one Continue; exact unpaid payment/document | Passed through payment creation |
| SDK/card/fulfillment | One initialization NO_GO, wrapper GET denied; card/refund0 | Incomplete; further launches deferred |
| Data and logout | Normal global logout, sessions/purchases0, original fingerprints/core preserved | Passed |
| Resource closure | Endpoint404; native/browser/listener/tunnels/builder closed;45,846 recorded hashes match | SSH255 and exact stale-socket cleanup disclosed |
| Diagnostics |105 blocked requests/120 console errors | Unclassified; no blanket health claim |
| Usable public release | Production503, UI unreleased, no stable preview | Open; preview/restoration plan now prioritized |

[Authoritative result](production-readiness.md#coupon-billing--oct21-2203-utc).
The matrix below describes the earlier closed attempt.

## Current verification — Oct21 coupon attempt

| Requirement | Authoritative result | Status |
| --- | --- | --- |
| Current-source coupon quote | Application4b320b1; real provider coupon readback and native Apply80/8/72 | Passed; failure branches remain source-only |
| Checkout creation | One native TEST POST200 and two exact provider checkout GETs200 | Passed; no payment ID/card submission |
| Paid coupon, currency, signed fulfillment | Empty name/address fixture leaves hosted billing form after one Continue | Incomplete; SDK/card/refund attempts0 |
| Billing correction | Six synthetic inputs pass actual validators and offline required-form validation | Source fixed; provider rerun pending |
| Data/session preservation | Final read-only phase matches29 original fingerprints and selected account core; sessions0/purchases0 | Passed; new alias retained with usage0 |
| Resource/endpoint closure | Independent owned endpoint404, browser/profile/socket closure; native/tunnels/bridge closed;45,846 recorded hashes match | Passed with holder255/strict-cleanup failure retained; no unrecorded-file enumeration |
| Runtime diagnostics |33 blocked requests/44 console errors | Unclassified; not blanket runtime-health proof |
| Broader goal/release | R14 admin remains passed; student/media, complete payment/refund, recovery currency and free hosting remain | Incomplete; production paused, UI unreleased |

[Actual outcome and qualifications](production-readiness.md#coupon-test--oct21-2125-utc).

## Earlier verification — Oct21 20:33 UTC

| Requirement | Authoritative result | Status |
| --- | --- | --- |
| Recovered admin access | R14/application `4b320b1`: public HTTPS auth200→password200→dashboard→admin panel→normal global logout204→admin redirects to auth | Verified for this exact source and scope |
| Native session flow | Password2001/user2003/sync2001/logout2041;172 application reads,0 blocked,0 unexpected denials | Passed; broader customer/role journeys remain open |
| Credential startup and optional prefetch | Hydration fix exercised;13/13 canonical optional prefetches locally403/no-store, no forwarding | Passed within this journey; disabled promo0 remains source-only |
| Current preservation | Two DB phases/151 SQL;1,621rows/14,270cells with only2 new sign-in timestamps, prior/protected exact | Passed; global logout leaves session/refresh/AMR/audit0, cleanupCOMMIT0 |
| Auth/config/resource closure | Full Auth restored, active desired/original equal; both frontends/native/browser closed, independent9GET paused closure; builder/tunnel terminal | Closed; paused desired404 qualified by separate active-parent equality |
| Diagnostics | Page errors/DNS/TLS/connection0;other28 | Other counter unclassified; no blanket runtime-health claim |
| Source publication | `3ecf93`: all10 remote checks pass; app `4b320b1` | Source/closed-preview proof, no production deployment or live preview |
| Remaining goal | Broader customer/content/media, current coupon TEST/refund/currency, recovery currency, free hosting and release/rollback | Incomplete; public503/paused, UI unreleased |

[R14 exact outcome and limits](production-readiness.md#current-checkpoint--oct21-2033-utc).
Earlier dated matrices retain historical results, not instructions to rerun
accepted recovery, correction, uploads or completed cleanup.

## Earlier recovery check — Oct21 18:41 UTC

| Requirement | Authoritative result | Status |
| --- | --- | --- |
| Existing hosted password authentication | R9 password200/user200/session-sync200, same confirmed admin | Passed in the recorded scope |
| Dashboard | Exact controller reaches dashboard URL and visible search before its failed-request predicate rejects | Partial DOM observed; complete journey failed |
| Admin and normal logout | Controller stops at dashboard; no logout request | Unverified |
| Initial customer state |1,621rows/14,270 typed cells match compatible profile; prior transients0 | Passed before login |
| Cleanup/final preservation | SQL73 fails57P01 before cleanup writes; one captured session; no final readback | Fresh exact cleanup required before another login |
| Auth/config/resource closure | Full Auth restored, active desired same, native/browser/frontend closed, paused; independent nineGET old settings/fullAuth/pause pass | Passed; paused desired404 remains qualified |
| Owned build/tunnel |17597exit0, edge socket absent | Closed |
| Health scheduling | R8 actual9.994395s denial reproduced;16 focused controls and R9 boundary pass after fix | Fixed; old failure retained |
| Source publication/release |68f5233 remote10checks success; application31ad6ba/UI unreleased | Public release/full goal incomplete |

[Exact evidence and limitations](production-readiness.md#current-checkpoint--oct21-1841-utc).

## Earlier recovery check — Oct21 18:15 UTC

| Requirement | Authoritative result | Status |
| --- | --- | --- |
| Auth-flow compatibility | R7 confirms COMMIT and readback for 56 declared reset cells; original archive, 14,130 stable cells, other 70 reset cells and 14 money NULLs preserved | Committed and verified; do not repeat |
| Existing admin login/dashboard/logout | R7 stops at `FULL_AUTH_SETTINGS_CHANGED`; runtime null, no login | Unverified; next journey uses corrected baseline |
| Current typed/prior/protected preservation | R7 final checks pass; accepted database and all 68 PDFs remain restored | Verified in the recorded window; fresh journey gates remain |
| Original R7 Auth/closure result | Raw Auth restoration and closure remain failed | Preserved; not relabelled by later recovery |
| Separate settings recovery | 18:13:02 `OWNED_EMAIL_RESUMED_RESTORED_PAUSED_VERIFIED`, zero SQL/login | Full Auth, pause and old settings verified |
| Independent closure | 18:15:28 nine GETs confirm pause/full Auth/old settings; paused PostgREST 404 | Passed with desired-settings comparison qualified; R7 active equality separate |
| Next policy/adoption helpers | 19 policy checks and 18 adoption checks | Source-only preparation |
| Source publication | HEAD `9b23130`, 10 exact-head checks successful | Source checks; no deployment |
| Public release/full goal | Vercel paused, UI unreleased; remaining journeys, recovery currency and free hosting open | Incomplete |

[Exact finite outcomes and limits](production-readiness.md#current-checkpoint--oct21-1815-utc).


## Earlier recovery check — Oct21 17:42 UTC

This dated snapshot precedes the committed correction and separate settings recovery above.

| Requirement | Authoritative result | Status |
| --- | --- | --- |
| Current application build/runtime |31ad6ba locked build; actual native starts/stops, warn0/error0 | Passed within bounded preview |
| Protected public login page | Actual13885exit0, HTTPS200, email/password visible,19 admitted reads/0 blocks | Passed; synthetic server inputs/backend paused |
| Native browser interfaces | Real short-TMP Chromium render; actual policy/reservation factory;22 R5 controls and peer review | Passed; first failed smoke retained |
| Customer/protected preservation | R2/R3 each117 READ ONLY SQL, all original rows/cells/prior/protected state match | Passed in closed windows |
| Hosted Auth/prerequisites | Actual direct healthv2.197.0; fresh two-FK/no-active-trigger cleanup catalog | Passed for observed windows |
| Existing admin login/dashboard/logout | R4 one password request500; no observed session, clean native/browser,117 READ ONLY SQL and full original preservation | Not verified |
| Auth-flow compatibility | Real archive/model checks and30 controls/independent review pass; exact56-cell overlay only | Prepared; actual correction not applied |
| Fresh transaction boundary | Actual94325exit0: six metadata SQL calls on one5432 session, RO rollback/RW serializable BEGIN/identity/rollback, same actual backend/postmaster | Passed in current window; no DML/COMMIT and earlier57P01 cause remains unproven |
| Latest final preservation |73 initial readonly calls match baseline; closed connection prevents final readback/rollback proof | Unproven; preserve this gap |
| Provider closure | Latest metadata scope:63 Management/one resume-pause, parent Auth/desired/original equality; independent nine GETs confirm paused/full Auth/original equality | Passed with paused desired404 limit; no serving resources started |
| Public release/full goal | Vercel paused/UI unreleased; remaining journeys, recovery currency, free hosting/release review open | Incomplete |

[Actual outcomes and limits](production-readiness.md#current-checkpoint--oct21-1742-utc).


## Current recovery result — Oct21 14:48 UTC

| Requirement | Actual evidence | Status / limit |
| --- | --- | --- |
| Restored customer data | Initial/final26-table readback,1,621 rows/14,270 typed cells | PASS for October13 recovery point; later currency unproven |
| Complete course files | Adopt2/upload66; all68 downloads and metadata/6,423,774 bytes match | PASS; no overwrite/delete/bucket recreation |
| Preservation and cleanup |440 READ ONLY SQL; protected metadata equal; rollback/frontend/worker closed | PASS in actual89467exit0 |
| Lifecycle |99 Management, one resume/pause, target INACTIVE, original states/settings equal | PASS; independent9GET complete |
| Independent target settings | Auth200/full equality, PostgREST404 after pause | Auth PASS; desired comparison unavailable, parent active equality retained |
| Connection readiness | Exact six-service/two-spaced-health gate, fresh capture,379ms actual connect | PASS for one diagnostic and successful full recovery window; old causes unproven |
| Restored Auth version | Actual direct healthv2.197.0 in later R2/R3 windows | Direct health verified; login pending |
| Current protected preview | Later16:29 actual HTTPS login page200/visible fields, native/browser clean | Page verified; hosted login pending and UI unreleased |

Dated matrices below retain their original limits; their incomplete file/
connection checks are superseded for this recovery window. [Receipts and custody](production-readiness.md#oct21-all68-files-accepted-and-replacement-paused).

## Oct21 reproduced closed-worker failure

| Check | Result and limit |
| --- | --- |
| Actual28370 | Terminalexit1/13:03:21; one native connect fails after1,990ms, OperationalError/no SQLSTATE/unclassified. SQL0/Storage HTTP0/new POST0; no current preservation/adoption/rollback. |
| Independent14382 | Terminalexit0/13:04:33; sevenGET0SQL0mutation, exact target paused, old states/settings equal. |
| Caller comparison | Same route/credential-file/CA/factory bindings; inherited parent versus closed child environment. Current library-byte probes match; historical cause remains unknown. |
| Prepared admin access | 25 Python/11 JS source-only checks and root adapter review; no hosted login, actual artifact or runtime. |
| Next | Reviewed connection-only private-sanitized diagnostic, then current customer/file checks before any new upload. |

[Evidence and custody](production-readiness.md#oct21-closed-worker-connect-failure-reproduced).

## Oct21 session route and subsequent Storage connection stop

| Check | Actual result and limit |
| --- | --- |
| Published31ad6ba | Five workflows/four Quality jobs pass; each app2,885/80skip plus lint/types/build, each PostgreSQL80/1skip; two zero-result CodeQL analyses/alerts0; independent draft PR46 readback. Not deployed. |
| Session5432 diagnostic | Seven metadata SQL calls/30.030s same SQL session, READ ONLY rollback/close pass; independent12:17:21 paused/settings closure. Earlier local process guard stops with zero provider calls. Documented derivation, not provider-returned route or automatic fallback. |
| Subsequent Storage scope | Actual29019exit1 at12:45:01: TLS-only passes; sole native connect fails OperationalError/no SQLSTATE, cause unknown. SQL0/Storage HTTP0/new POST0/COMMIT0. Current preservation/adoption/rollback not performed. |
| Independent closure | Actual77990exit0 at12:47:25; sevenGET0POST0SQL, exact replacement/production INACTIVE, preview healthy, old observed settings equal. No customer/file health proof. |
| Next | Add finite connect classification/timing before a fresh bounded scope; preserve all spent results. Remaining files, restored login/native build/HTTPS and release remain open. |

[Evidence and custody](production-readiness.md#oct21-session-route-passes-once-storage-continuation-stops-at-connect).

## Oct21 coupon failure decisions

Seven integrated source/test files match the independently reviewed patch;
13 pre-fix failures are retained and114 focused cases/types/scoped lint pass.
Contradictory campaign tags deny repair; customer/unknown limits preserve global
usage; initial checkout5xx returns503 without repair/retry/mutation. Managed and
legacy repair, same-code retry and no-full-price controls remain. This is local
source evidence. Actual current-source native coupon/fulfillment, legacy untagged
ownership, idempotency and paid concurrency remain open.
[Evidence and limits](dodo.md#oct21-checkout-discount-failure-handling-repaired-locally).

## Oct21 dedicated read-only connection diagnostic

| Requirement | Actual evidence and remaining limit |
| --- | --- |
| R1 admission failure | Zero SQL, frontend closed and independent paused closure; rejected protocol identifier's original value/type remains unknown. Original records and spent markers preserved. |
| R2 route and identity | Published a30bc17; one verified-TLS 6543 PRIMARY transaction-pooler frontend, seven metadata SQL calls, positive SQL PID/start/transaction/role continuity through30.012s idle. Protocol identifiers are separate observations, signed-negative at all three samples. Frontend TLS verification passes; upstream SQL TLS is false, with no end-to-end claim. |
| Settings | Ten rows; statement_timeout120000ms and idle-in-transaction/idle-session/transaction settings0. Zero scoped role/database default rows for the ten queried timeout/connection settings; unrelated overrides not assessed. |
| Cleanup | Confirmed READ ONLY rollback/client close;61 Management calls44work17closure, one resume/pause/two process captures. Independent11:40:12 sevenGET closure verifies paused replacement/production, preview healthy and unchanged original settings. |
| Limits | No customer/PDF reread, uploads, native COMMIT, configuration writes or deployment. No prior shutdown cause/remedy or full488SQL/66PDF stability proof; R5 final preservation/rollback gap remains. |
| Next work | Fresh bounded adopt2/upload66 with current typed/protected checks, or separately derive and verify documented5432 session routing using the current provider host for native preview. Auth/admin/file continuity, coupon/refund, recovery-point/hosting/release and full goal remain open. |

[Current diagnostic evidence and limits](production-readiness.md#oct21-read-only-connection-diagnostic-completes). Earlier tables retain their dated results.

## Oct21 R5 two-object adoption and interrupted stability check

| Requirement | Actual evidence and remaining limit |
| --- | --- |
| Publication | Exact 8ac31bd documentation checkpoint passes five workflows/four Quality jobs, two zero-result/error CodeQL analyses, alerts 0 and PR46 readback; eight-file custody complete. App code stays 105f8b9, undeployed. |
| Existing objects | Both current PDFs pass read-only identity/version/path, byte and API/SQL metadata adoption: 98,661+73,085=171,746 bytes. Frozen verifiedObjects2; new uploads0, no object POST replay/bucket creation. |
| Diagnostic stability | One recorded stability SELECT returns; source-derived second request048 fails AdminShutdown57P01. The three-observation sequence does not complete; no cause or proven remedy follows. |
| Data and cleanup | Initial 1,621 rows/14,270 cells match. Closed/UNKNOWN connection; final customer/protected preservation and explicit rollback remain unverified, with both cleanup skips CONNECTION_CLOSED. |
| Closure | Frontend/worker close, sole pause confirmed; independent 10:41:54 sevenGETs verify replacement/production INACTIVE, preview healthy and old settings equal. No new Storage/SQL operations in that closure. |
| Logs and next work | Two bounded metadata-only log GETs complete: 11 PostgreSQL events all precede the first returned stability sample, no retained-frontend PID match; Supavisor result []. No cause/completeness proof. Outcome/log custody 17+9 files retained; observed R5 route port 6543/transaction pooler. Next: read-only settings/identity/persistence diagnostics. Remaining 66 files and account/hosting/release goals stay open. |

[R5 evidence and limits](production-readiness.md#oct21-r5-adopts-both-pdfs-before-sql-shutdown). Earlier tables retain their dated results.

## Oct21 R4 partial file continuation and published source

| Requirement | Actual evidence and remaining limit |
| --- | --- |
| Publication | Exact105f8b9/five workflows/four Quality jobs pass; two zero-result/error CodeQL analyses, open alerts0 and PR46 readback. Source publication is not deployment/login proof. |
| First-object adoption | Fresh read-only bytes/ID/version/path/API+SQL acceptance and both empty selected-policy checks pass. Frozen verifiedObjects1/98,661 bytes; no first-object POST or bucket recreation. R3 verifiedObjects0 stays unchanged. |
| New upload | One POST/download/info200 and source-bound byte verification, then SQL014 AdminShutdown57P01. New-object SQL metadata is unverified; two fully restored objects or accepted remaining66 are not established. |
| Preservation and closure | Initial1,621 rows/14,270 cells pass; final customer/protected preservation and explicit READ ONLY rollback are unverified. Frontend closes/child1. Parent pause and independent10:01:33 sevenGET closure verify replacement/production INACTIVE, preview healthy and old settings equal. |
| R4 custody |162 private finite members, manifest3f2e091a; no PDF/raw SQL/provider bodies/keys/enabled plans. Local unencrypted retention; off-site recovery unestablished. Original R3 receipts and qualification preserved. |
| Next operation | Fresh read-only current checks of both existing objects and customer/protected state before further uploads; no replay/overwrite/delete/bucket creation. Runtime cause, Auth/file continuity, recovery-point/hosting/release and full goal remain open. |

[R4 evidence and limits](production-readiness.md#oct21-r4-adopts-first-object-then-stops-on-sql-shutdown). Earlier tables retain their dated results.

## Oct21 session synchronization and metadata review

| Requirement | Evidence and remaining limit |
| --- | --- |
| Login CSRF | Original foreign text/plain form reaches real SDK cookie writes with a synthetic provider and no prior session. Same30 regressions:22 fail/eight controls pass before the fix; isolated proposal32 pass. No hosted exploit demonstrated. |
| Origin boundary | Configured exact Origin plus application/json checked before body/SDK; forwarded headers grant no authority. Integrated67 cases/five files and typecheck pass. Fix is unreleased; actual protected login remains unverified. |
| Storage metadata | Root accepts only original SQLNULL to exact actual empty-object representation, preserving original/actual distinction. The later R4 scope passes policy/adoption, then stops on the next object SQL read; current two-object/customer read-only checks are required before further uploads. |
| Custody | Separate source/finite packets retained with hashes/private permissions; credentials/raw customer values/enabled plans excluded. Local unencrypted retention, no established off-site recovery. |

[Evidence and custody](maintenance-log.md#oct21-session-synchronization-origin-fix).

## Oct21 first PDF and offline admin source

| Requirement | Actual evidence and remaining limit |
| --- | --- |
| First object |One PDF POST/download/info200; pinned downloaded bytes match. Frozen verifiedObjects0 because actual user_metadata{} differs from archived SQLNULL. Owner/archived fields NULL, version flagsfalse; complete acceptance is unresolved. |
| Data and resource closure |99 READ ONLY SQL/sixHTTP preserve1,621 rows/14,270 cells/protected metadata; rollback/frontend close, child1. Parent confirms pause; independent09:19:59.842538 sevenGETs verify replacement/production INACTIVE, preview healthy and old settings equal. |
| Next file operation |Review read-only adoption or a bounded remedy for the existing object, then67 remaining uploads. Never repeat the first POST/overwrite/recreate the bucket. R3 predates the R4 outcome above. R3 finite custody retained. |
| Offline admin source |44rows/three tables: original controlled SUPER_ADMIN confirmed EMAIL identity/password hash, one of14CSV candidates matches offline. Finite custody retained; private source reference stays separate. No online login/reset or restored access proof. |
| Access source |This maintenance checkpoint includes bbec8b1/748a50c. Prior source tests remain qualified; no recovery artifact/runtime/deployment. |

[Latest evidence and remaining limits](production-readiness.md#oct21-first-pdf-stored-metadata-acceptance-still-open).

## Oct21 Storage bucket and pending access source

| Requirement | Actual evidence and remaining limit |
| --- | --- |
| R1 stop |ZeroPOST/oneHTTP400 with exact NoSuchBucket; independent safe closure. Closed scope is not replayed. |
| R2 Storage state |One confirmed bucket POST200, API type omitted/SQL STANDARD; stops before PDFs.93 READ ONLY SQL/three HTTP calls, rollback/frontend closure and child1. |
| Customer preservation |Initial/final1,621 rows/14,270 typed cells and protected metadata remain checked. No repeat import or empty-only verifier. |
| Final closure |08:56:22 independent12GET/zeroPOST/noSQL verifies exact replacement/production INACTIVE, healthy preview and old settings equal. Parent paused:false/closure failure and corrective-pause unknown result remain unchanged. |
| Unreleased authorization |bbec8b1 requires verified identity plus matching existing persisted role;41 regressions/76 related pass. Integrated locally, not deployed or actual restored access proof. |
| Unreleased recovery profile |748a50c fixed replacement/leased gate-worker/request surface and side-effect controls:939 native cases,753 integration/29skip, types/lint pass. No real artifact or provider/browser journey. |
| Open gates |All68 PDF uploads/bytes/ownership/defaults/bijection, controlled customer/admin Auth, recovery-point currency, stable free hosting and release. This dated row precedes the R3 result above. |

[Actual results, custody and limits](production-readiness.md#oct21-storage-bucket-created-pdfs-still-pending). Earlier tables retain their dated scope limits.

## Oct21 actual hosted customer restore

| Requirement | Actual evidence and remaining limit |
| --- | --- |
| Customer values |26 COPY batches/1,621 rows, one confirmed COMMIT. All14,270 typed cells match precommit and fresh persisted READ ONLY readback:14,130stable/126documented token resets/14newNULL. Historical four-row migration ledger preserved. |
| Native integrity |151 calls18precheck+133executor. Protected schema/rights/managed definitions preserved; no DDL/new migration acknowledgment/retry/reconnect. Initial and postcommit READ ONLY rollbacks pass; write phase commits. Frontend closes/child0. |
| Actual evidence review |136 durable events,104 independently source-derived SQL hashes and26 COPY hashes/order/counts match. Three live-inventory hashes qualified. Parent authorship disclosed; customer values/raw COMMIT acknowledgment are not independently decoded/retained by the review. |
| Resource closure |One restore/pause; independent07:39:29 sevenGETs verify exact replacement/production INACTIVE, preview healthy, old settings unchanged. Safe desired/effective schema and49 disabled Auth values/noSMTP checked while active. |
| Semantic metadata |Original private capture replay resolves narrow internal-RI owner predicate; selected signatures/constraints/columns/277INSERT rights pass.18 offline controls. No whole-locale equivalence or fresh GoTrue claim. |
| Files and release |Storage client16 closed controls/three syntax/three inert checks, actualuploads0.68PDF byte/metadata/bijection and customer login still needed. Publicwww503; UI/source unreleased. Recovery-point currency/stable free hosting/release open. |

[Original evidence, custody and limits](production-readiness.md#oct21-customer-data-restored-and-replacement-paused).
Earlier dated tables below describe their historical scopes.

## Oct21 import metadata capture and qualified review

| Requirement | Actual evidence and remaining limit |
| --- | --- |
| Import-specific metadata | One frontend/18 empty-state plus11 metadata READ ONLY calls, nine retained SELECTs, both ROLLBACKs and final client/worker closure pass. Full private capture precedes validation. |
| Semantic readiness | Native-RI signature review required; no validation-report success or import approval. Existing empty-state proof cannot replace data-aware post-import checks. |
| Resource closure | Parent/worker0, one pause; independent07:00:02 sevenGETs confirm exact replacement/production INACTIVE, preview healthy, old settings equal. No configuration changes/public probes/import. |
| Storage preparation | Exact68-object bijection/NULL ownership/path validator,16 closed controls and independent source review. No upload or destination bytes/defaults/ownership proof. |
| Remaining recovery | Resolve actual managed metadata; mapped hosted restore and Auth/file continuity, recovery point, stable free hosting and release remain open. |

[Evidence and custody](production-readiness.md#oct21-import-metadata-captured-and-replacement-paused).

## Oct21 selected REST API scope passes

| Requirement | Actual evidence and remaining limit |
| --- | --- |
| Database state | Both18-request READ ONLY/strict227/namespace/managed/rights/empty/override checks pass; both ROLLBACKs/frontend close, no new DDL/COMMIT. |
| Selected API matrix | Four existing key kinds×six cells=24 complete GETs/no retry. Elevated canonical200/default404/profile406 pass; non-elevated root401 remains only expected observation. User JWT/GraphQL/all-key/write/full health unproven. |
| Closure | Parent/worker/Node0; retained safe API schema/one pause; independent06:20:22 sevenGETs verify exact replacement/production INACTIVE, preview healthy and old settings equal. |
| Recovery | Local/source recovery evidence remains valid within its limits. Hosted managed triggers/permissions/collations, exact file import/account continuity/current recovery point and release remain open. |

[Evidence and limits](production-readiness.md#oct21-selected-rest-api-scope-verified-and-paused).

## Oct21 second transaction failure and closure

| Requirement | Evidence and limit |
| --- | --- |
| Current pre-PATCH state | Actual18 READ ONLY requests verify namespace/strict227/managed/rights/empty/overrides and confirm ROLLBACK. Same frontend retained. |
| Post-PATCH/API verification | Second BEGIN and cleanup ROLLBACK attempts lack successful receipts; rollback unconfirmed/client closed. No public GET; full matrix stays incomplete. |
| Safe closure | Parent restores desired setting once/pauses once; independent05:58:38 sevenGETs confirm exact replacement/production INACTIVE, preview healthy and original settings equal. No claim of confirmed SQL rollback from provider pause. |
| Failure diagnostics | Seven installed-psycopg synthetic cases expose dropped SQLSTATE subclasses. One bounded log GET has seven ERROR3F000 events but no causal correlation. Original runtime cause unknown. |
| Import triggers | Parse1,329 archived statements: eight explicit triggers/zero on26 selected restore tables/seven Storage. Native constraint triggers/current hosted triggers remain separate; prepared SELECT is inert. |

[Evidence and custody](production-readiness.md#oct21-second-transaction-stops-independent-closure-verified).

## Oct21 native restoration and hosted API boundary

| Requirement | Actual result and limit |
| --- | --- |
| Customer restore rehearsal | Real local PG17 COPY 1,617 data+4 historical rows; 14,270 typed cells match pre/postcommit, native Auth/public constraints enforced. Deliberate 23505/RB leaves zero committed rows; root confirms container/socket absence. No hosted import/GoTrue/collation/Storage proof. |
| File-source preparation |68 PDFs/6,423,774 bytes match; 69 Storage records bind private bucket/paths/IDs/metadata and NULL SQL ownership/custom metadata. API empty owner is qualified. No upload; actual defaults/ownership/bytes/exact planner bijection remain. |
| Existing safe API schema | Confirmed COMMIT28 SQL then 18 READ ONLY; later 18 + 18 READ ONLY reverify namespace/protected 227/managed/rights/empty/overrides and rollback/close. No later DDL/COMMIT/customer import. |
| Selected API scope | First 24 GETs: elevated 200/default 404/profile 406 pass, old contract rejects root 401 s. R3 fixes that observation. Latest third GET5,015 ms deadline/no HTTP leaves matrix incomplete; no cause/full-health/user-token/GraphQL proof. |
| Closure/custody | Both rollback/pause/independent closures pass; latest 05:30:48 sevenGETs confirm exact replacement INACTIVE/old settings equal. Source/finite custody excludes raw customer inputs/credentials/active plans; local retention is not off-site recovery. |

[Evidence and remaining work](production-readiness.md#oct21-native-customer-recovery-and-file-source-checks).

## Oct21 fresh persisted schema and offline continuity

| Area | Actual result and limits |
| --- | --- |
| Persisted replacement | Fresh READ ONLY Python18/Node8 requests; strict26 tables/four RPCs/227 columns, effective rights/empty guards and authenticated managed baseline pass. Both rollback/close; parent/child0. No DDL/COMMIT/customer import. |
| Independent closure | Final04:08:57 pause; separate04:09:08 seven GETs confirm target/production INACTIVE, preview healthy and old settings equal. No POST/SQL replay; API containment remains open. |
| Selected managed definitions | Actual4relations/26constraints/25sourceindexes/one enum match. Four extra nonunique auth.users indexes pass separate exact key/predicate/flag review and remain untouched; original four-difference result retained. Values, login and storage upload remain unverified. |
| Catalog tooling | Actual local PG17 query/read-only write rejection/rollback/cleanup verifies one-line noInherit projector fix; six mutation controls. Verifier25Python/18Node closed checks and source review remain distinct. |
| Archive continuity | Memory-only185-row check:14accounts/16identities/seven purchases and checked references/collision sets consistent. Preserve13USER/oneSUPER_ADMIN and two confirmation disagreements. Controlled project-address admin match is source evidence. Nine controls pass. |
| Current ORM | Static23models/202scalarcols/five ordered enums/23FK endpoints match expected227; five controls/independent review. Generated28model-enum blocks match; generator.output differs. No precision/default/index/check/FK-action/live-data equivalence claim. |

[Original results and remaining work](production-readiness.md#oct21-persisted-schema-and-managed-catalog-verified).

## Oct21 hosted schema checkpoint

| Requirement | Evidence and current limit |
| --- | --- |
| Actual isolated schema preparation | R8 commits after42 SQL calls, strict227/effective rights/managed preservation and stable positive PID/XID; sole COMMIT confirmed/client closed. Customer import/serving/cutover remain false. |
| Resource and original-state closure | Parent/child0;65 management calls, one restore/pause, two clean process scans. Final03:31:00 pause plus independent03:31:59 seven-GET exact identity/settings readback pass. |
| Recovery-helper correction | Actual local same-connection old-reject/new-pass and wrong-CA rejection; E2/V6/D7 controls40/39/37, R8 controls59 pass. This does not recover earlier uncaptured failure details. |
| Persisted schema and import compatibility | Fresh post-commit227 and selected managed-definition checks now pass as recorded above. Data-value/import/Auth/Storage continuity remain open; earlier18 preparation controls are not the hosted proof. |

[Evidence and custody](production-readiness.md#oct21-empty-replacement-schema-committed-and-paused).

## Oct21 actual hosted comparison and explicit recovery mapping

| Requirement | Evidence and current limit |
| --- | --- |
| Actual psycopg/Node connectivity | Same original credential/current PRIMARY6543/CA; TLS-only verification then unchanged D6/Python3SQL and Node4SQL pass PG17/read-only identity, rollback and close. Historical R6 cause remains unknown; upstream SQL SSL is false. |
| Managed column evidence | Node captures344 Auth/Storage catalog columns privately. Offline comparison finds all344 source/destination type/null/generated/identity shapes equal,343 exact expression ASTs/one equivalent omitted-sequence reference; three generated columns excluded and nine old-flow resets explicit. Constraints/enum labels and actual Auth/import continuity remain unverified. |
| Scope closure | Parent0/child0,79management calls, one restore/pause, two zero-candidate scans; final02:45:17 replacement paused/settings equal. Separate seven-GET readback confirms exact target INACTIVE, production INACTIVE and preview healthy/settings equal. No DDL/import/COMMIT. |
| Offline source mapping |65tables/2,239records;1,690candidates incl historical4 Prisma,549transient/managed exclusions; two transient sequences omitted. Root reproduces mapping and verifies both archive hashes; actual import remains unproven. |
| Attachment/Storage source consistency | Six exact TABLE DATA entries/167rows exported in memory without Auth rows. All68 relative paths uniquely cover68 retained objects with matching IDs/versions/byte metadata; both owner fields NULL. Destination reconciliation/rich-text references/current recovery point remain separate. |
| Vercel access | Installed CLI refreshes saved OAuth login; three GETs verify same project/deployment, paused/protected, configured cron enabled. No project write/cron invocation or production release. |

[Actual comparison](production-readiness.md#oct21-hosted-client-comparison-passes),
[mapping and source boundaries](production-readiness.md#oct21-explicit-archive-mapping-and-source-file-consistency),
[Vercel refresh](vercel.md). Earlier checkpoint statements below retain their
original scope and timestamps.

## Oct21 actual source handoff; hosted connection incomplete

| Requirement | Evidence and current limit |
| --- | --- |
| Source-bound local process classification | R4 full-read 57 controls and actual root scan pass; both actual R5/R6 preflight/current scans have zero unresolved candidates. Local snapshots do not cover all users/machines or a future window. |
| Real child environment and original provider URI | Actual child/unchanged-driver controls reproduce/remove the PG-variable conflict. Both original URI aliases are preserved and validated through parsing-only placeholder encoding; parent 45/verifier 39/driver 24 closed controls pass. |
| Original provider capture integration | Qualified historical seven-pair parent/verifier replays pass without changing raw bytes/timestamps. Actual R6 independently reacquires seven sources and reaches real source construction. |
| Actual hosted schema | NOT VERIFIED: one psycopg connection attempt fails before executor entry/commit; generic diagnostics do not identify its cause. Prior Node `pg` success and local Unix-client SQL rehearsal do not prove this TLS function. |
| Exact psycopg connection API | Actual local PG17 TLS passes with unchanged D5 function, verify-full/dict-row/autocommit/IDLE, then closes before SQL. Untrusted CA rejects; owned fixture is removed. This is not hosted success or a hosted failure diagnosis. |
| Connection diagnostics | D6 adds only finite type/SQLSTATE/errno/bounded phrase categories; 37 closed controls pass and root verifies unchanged connection factory. Not yet used for a hosted diagnosis. |
| Closure/preservation | R6 child exits1 without termination; observed original settings match. Pause200 remains PAUSING at the original bound; independent01:49:47 confirms the exact target INACTIVE with no further POST. Original stopped/closure receipts stay unchanged. |
| Customer recovery point | Latest retained October 13 export has an unverified roughly eight-minute gap before pause request; DB/Storage/roles are not atomic. Mapped rehearsal is possible after hosted setup; current-source cutover proof remains missing. |
| Coupon runtime | Four actual parent/worker IPC cases pass with synthetic Next/runtime observations; no live server/browser/coupon/payment is proven by this rehearsal. |
| Old local test services | One exact-ID stop of five siblings; independent readback confirms all six namespace members stopped/former listeners gone, retained objects/volumes and unrelated states preserved. Original stdout mismatch remains unknown; no whole-config/volume-byte/global-consumer claim. |

[Exact outcomes, source bindings and custody](production-readiness.md#oct21-hosted-attempts-and-independent-closure).

## Oct20 complete review; transaction integration gates

All actual300 defaults/24 memberships/60 schema rights/30 roles/five extensions/
six event bodies/three Auth helpers pass independent capability review for the
empty atomic scope. Transaction-specific compiler/executor pass44/35 closed
controls and actual local PG17 success/forced rollback: BEGIN first after durable
intent, positive PID/XID, final227/all rights and managed preservation. External
proofs remain synthetic. The original300-vs256 baseline rejection is preserved;
the narrow R2 parser passes root's actual baseline retest and27/20 closed tests.
Real-verifier/local-SQL success and final-claim rejection/rollback also pass.
An exact owned local Kong gateway is separately stopped with siblings preserved;
aggregate config equality is unproven and fresh process classification remains
open. Hosted DDL/import/serving remain unverified.
[Scope and custody](production-readiness.md#complete-capability-review-and-transaction-rehearsal).

## Oct20 complete hosted read-only metadata capture

The exact advertised transaction endpoint passes actual verify-full TLS,
PG17/postgres role, 54 SQL queries in one READ ONLY transaction with stable
positive XID/PID, full bounded metadata and empty-state checks, ROLLBACK/end and
same-target pause/original observed-settings preservation. Complete capability
review subsequently passes as above; hosted atomic preparation remains open.
Collection does not establish serving/import authority or API containment.
[Actual evidence](production-readiness.md#advertised-transaction-connection-complete-metadata-captured).

## Oct20 whole executor: local SQL success and rollback

Actual local PG17/real psycopg execution reaches strict227 with one COMMIT and
verified effective rights. A separate forced final rejection rolls back to zero
public structure without changing managed metadata. R2 passes28 closed controls;
the25-file source/finite-result package is retained with exact hashes. Provider,
TLS and verifier fixtures are synthetic, so hosted preparation, customer import
and production readiness remain unverified.
[Actual scope and custody](production-readiness.md#whole-atomic-executor-actual-local-success-and-rollback).

## Oct20 actual replacement connection; metadata review incomplete

The separate management read-only query returns HTTP201 under the actual
`supabase_read_only_user` role, PG170011, non-super/BYPASS/login/read-only and
SQL SSL observed. The postgres-only reader stops after one retained result;
complete provenance remains unverified. Final 22:17:32 confirms the replacement
paused and original observed settings unchanged. The next native inspection
uses the exact advertised transaction endpoint and begins READ ONLY before
collecting metadata. This does not prove hosted DDL or recovery.

Actual client verify-full TLS, PG17 and non-super/BYPASSRLS postgres identity
pass. Seven counted SQL attempts retain six results, including30 roles and six
event definitions; default-ACL rows exceed256 and the remaining checks stop.
Upstream SQL TLS is observed false, separately from the client connection.
Partial event-source review is complete; managed emptiness, complete permission
provenance, final session continuity and hosted bootstrap remain unverified.
The following metadata reader exits without a report; cause/SQL count are
unknown. Both scopes verify pause and observed original settings preservation.
[Exact scope and failures](production-readiness.md#read-only-connection-attempts-and-the-provider-ca).

## Oct20 replacement backend preparation

Actual Free create201/unique ownership and minimal Auth PATCH200/all49 desired
values pass. Desired/effective disabled API schemas pass; public503/PGRST002 is
not a typed profile-denial proof. Final19:47:59 reads confirm replacement and
production INACTIVE, preview healthy and observed original settings preserved.
All operation handles are terminal; hosted SQL/TLS/managed-empty/bootstrap and
customer import remain unproven. Real local15/17 checks and422 permission
operations per run use synthetic managed helpers.
[Full scope](production-readiness.md#free-replacement-auth-verified-api-readiness-unresolved).

## Oct20 inactive-schema control is negative; preservation passes

The isolated preview completes one pause/restore and is healthy at17:19 UTC.
The sole inactive schema PATCH returns404; full29-table fingerprints, hardened
catalog and exact Auth/PostgREST settings remain unchanged. Production stays
INACTIVE. Offline source checks are not a production containment proof.
[Actual control, earlier failures and retained evidence](production-readiness.md#actual-isolated-control-result).

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

Latest18:36 UTC same-payment refund recovery captures409
`INSUFFICIENT_WALLET_FUNDS`; final reads no refund/fullUSD8997 refundable and
purchase preserved. All29 fingerprints/23 prior sessions/actor sessions0, four
terminal0 services/endpoint404/full45,831-file seal and formal closure pass.
Actual16 Dodo calls/12 read-only runtime SQL; separate preflight3 SQL and separate
wallet-ledger1 GET. Historical credit8997/fee535/after8462 is not today's account
balance. Refund/reversal remains open pending a free merchant-sandbox remedy;
no retry, checkout/card or production action. [Actual scope](dodo.md#latest-oct20-checkpoint-captured-sandbox-wallet-denial).

Updated 2026-10-20. Local source is not a deployed production repair. Counts below
are completed checkpoints; overlapping targeted suites must not be added together.

The owner's Oct20 continuing authorization covers bounded controlled tests and
reviewed project operations once technical prerequisites and rollback are ready.
Historical approval questions are not current blockers; use fresh plans/ledgers
and the [root contract](../../../AGENTS.md). Closed scopes stay closed.

Oct20 sealed3e5b2c1/45,831 fresh registration passes uninterrupted: registration200,
one metadata/body GET, verification200, password login/dashboard and normal204
logout to home. Independent closure preserves all eight prior accounts/1,513
public rows/28 projections/23 session rows; the pinned new verified USER has one
identity/sessions0, full Auth is restored and production remains INACTIVE.
Browser7 blocks/7 console errors/0 page errors remain partially unclassified.
Private SSH does not establish public HTTPS or later-ba105 Auth proof.
[Fresh registration](cloud-auth-mail.md#oct20-fresh-registration-on-sealed-source-3e5b2c1).
Separate uninterrupted3e5b2c1 recovery now passes: one reset200/metadata GET/body
GET/provider303/callback307/reset200/PUT200, automatic204, old400/new200/dashboard
and final normal204→home, without controller repair/restart/profile continuation
or verification replay. Independent closure retains all nine accounts/1,514
public rows/23 original sessions and all other eight actors exactly; the same
confirmed USER has one identity/sessions0. Only encrypted password/last-sign-in/
updated-at Auth fields change. Full Auth restoration, resource closure and the
45,831-file post-seal pass. Browser9 blocks/11 console errors/0 page errors/
0 command failures remain incompletely attributed; native0/0 is separate.
Seven closed scopes consume nine actions/seven observed Resend emails; earlier
built-in delivery remains unverified. Sealed30d848a recovery retains its
historical repair/continuation qualification. [Current recovery](cloud-auth-mail.md#oct20-uninterrupted-recovery-on-sealed-source-3e5b2c1).

Oct20 hosted-SDK follow-up confirms a test-controller incompatibility with own
payment-prefixed client secrets. A separate preparation copy repairs it, with
foreign-ID and existing host/frame/document/phase checks retained. Passive
readiness reporting and offline tests are implemented; actual SDK/API health
and payment acceptance remain unverified. No fresh financial scope is active.
[Source contract and verification](dodo.md#deployed-hosted-sdk-contract-and-scoped-secret-repair).

Verified publication checkpoint4eab0b5 has five successful exact-head workflow runs:
Quality PR/push, Secret Scan PR/push and dynamic CodeQL ([IDs/events](review-status.md)).
Both downloaded Quality logs show2,656 normal/80 skips,80 persisted/one skip,
types/webpack31/lint0errors22warnings; actual PR-head alerts0 and both analyses
match the commit. Actualba105 settled-document scope spends one UI card action;
transport/acceptance remain unverified and last provider GET is unpaid. Empty
observed responses do not establish zero actual requests. Data/logout/resource/
endpoint/full-seal/retention64 files412,746 bytes pass, with raw STRICT_NO_CARD
helper label explicitly qualified. Financial-test loop stopped; next work offline
per-phase counts/SDK readiness. Auth remains sealed3e5; production unreleased.

Earlier published verification checkpoint46a4dc9 passes exact Quality PR/push, Secret
Scan PR/push and CodeQL, with0 open PR-ref alerts. Downloaded Quality logs
verify2,584 normal passes/80 intentional skips and80 persisted passes/one skip
(79 actual SQL cases plus one metadata case), types/webpack/static31-of-31 and
lint0errors/22 existing warnings. Five legacy main alerts remain open. The table
below preserves earlier journey-specific source bindings; its older counts are
not latest totals.

Latest recovery evidence: revision4 checks225 archived columns plus93 indexes,
with24 actual isolated checks and nine closed checks. Corrected restore matches
51 member owners/557 ACL/67 role statements. A separate combined restore/apply/
manual inverse/reapply preserves65 tables/2,239 records/two sequences at all four
stages and passes422 zero-row permission operations after each apply. Source
extension ownership/initial/effective privileges and platform reconstruction
remain unverified. A later actual offline run verifies unchangedV4 at225 →
literal additive migration → strict read-only227 postcheck. Original65-table
projections/2,239 records/two sequences and initialNULL fields are preserved;
446 zero-row operations pass after migration and reapply. Six negative stages
include rejecting the old225 inverse at227. A separate manual227 cycle retains
one owned synthetic Purchase and canonical facts, followed by full-row CAS
cleanup. Independent inverse-export comparison matches557 ACL/member-owner
metadata; all inputs and container cleanup pass. Current production compatibility
remains separate. The completed offline history rehearsal below closes its
isolated ledger-reconciliation gate. No production changes follow from these checks. [Recovery scope](review-status.md#recovery-permissions-and-index-checks).

Exact5f fresh native artifact605 Git files/45,825 sealed/158 client files passes
Unix19/HTTPS11 and17 monetary/auth browser checks. Independent final capture
matches12 models/18 protected hashes and both complete Purchase rows; two owned
voucher rows are removed, both canonical pairsNULL/business0 and all browsers/
app/tunnel closed. The27 private money crops expose character-wrapping problems
despite correct facts; readability follow-up is separate. No actual provider
transaction. [Native scope](review-status.md#native-voucher-and-payment-facts).

Presentation8053c1b addresses that discovered wrapping while preserving formatted
text and bounded table scrolling. Five actual local after renders pass against
five problematic before renders, including64-digit scroll endpoints. Existing18
integration cases/types/scoped lint pass. This uses real async page markup/CSS
with synthetic read mocks, separately from the authenticated5f native journey.

| Requirement | Completed evidence | Remaining gap |
| --- | --- | --- |
| Recovery error privacy/localization | Eight rendered-component regressions fail before repair and pass after;47 focused tests/types/scoped lint pass. Four log surfaces omit private diagnostics, update failures use owned copy in all four languages and three Portuguese strings are corrected. Actual uninterrupted recovery also passes on repaired sealed3e5b2c1. | The successful hosted journey does not exercise every failure diagnostic or all four languages. Mocked error-path checks and the older30d848a repaired/continued-profile pass remain distinct; production is unreleased. |
| Public UX/UI | Source-e32 native HTTPS:12 public layouts at 1440/320/390 in both themes and48 computed contrast checks pass; light gold fixed with three lines. Earlier actual responsive/focus/privacy suite15/15 remains separate. Guest selector diagnostic2/2 passes. | Initial primary selector ambiguity remains documented; no application cause established. Inherited certificate/guarantee and price/tax promises require owner evidence. |
| Registration / verification | Fresh sealed3e5b2c1/45,831 registration200→one fresh Resend email/one metadata GET/one body GET→verification200→password login/dashboard→normal204→home passes in one uninterrupted protected browser. Actual transport requires a provider GET within five seconds and a live PID-bound permit. Independent closure preserves eight prior accounts/1,513 public rows/28 projections/23 sessions; the pinned new USER is confirmed/app-verified with one identity/sessions0; Auth/resources/full seal pass. | Browser7 blocks/7 console errors/0 page errors are not fully attributed. Latest totals are seven closed scopes/nine actions/seven observed Resend emails; earlier built-in delivery remains unverified. No public HTTPS, production continuity or later-ba105 journey claim. Current-source recovery passes in its separate scope. [Registration](cloud-auth-mail.md#oct20-fresh-registration-on-sealed-source-3e5b2c1). |
| Password recovery / Google | Oct20 uninterrupted sealed3e5b2c1 recovery passes one reset200/metadata GET/body GET/provider303/callback307/reset200/getUser/form/PUT200, automatic204, old400/new200/dashboard and final normal204→home. Fresh form-ready/current-provider permit is enforced within five seconds; no controller repair/restart/profile continuation or provider URL replay. Independent closure preserves all nine accounts/1,514 public rows/23 original sessions and every other eight actors' rows; same confirmed/app-verified USER, one identity/sessions0, changed password fingerprint, exact Auth restoration/resources/full45,831 seal pass. Oct19 fc8d813 first/returning Google retains its exact identity/preservation/closure scope. | Browser9 blocks/11 console errors/0 page errors/0 command failures remain incompletely attributed; native0/0 is separate. Historical30d848a recovery retains its controller-repair/same-profile-continuation qualification. Google's two earlier runtime errors, public HTTPS, later-ba105 journeys and production/customer continuity remain separate. [Current recovery](cloud-auth-mail.md#oct20-uninterrupted-recovery-on-sealed-source-3e5b2c1), [Google](google-oauth.md). |
| Private redirect continuation preparation | The protocol module passes60 synthetic guards,16 copied-ledger/marker cases and27 inherited assertions plus actual loopback303-bypass/307/200/cookie/form/replay checks. Its current3e5b2c1 hosted use reaches provider303, app307 and reset200 once each without verification replay, in one fresh uninterrupted browser through password update/login/logout. Scope/source/history bindings change; the redirect algorithm is preserved. | The loopback proof uses synthetic providers/backends, and private SSH establishes no public DNS/TLS. The older30d848a repair/continued-profile result remains historical; the separate current-source recovery closes that journey gap without establishing production continuity or general integration health. [Current scope](cloud-auth-mail.md#oct20-uninterrupted-recovery-on-sealed-source-3e5b2c1). |
| Unconfigured automatic reconciliation | Source33dd19f: actual provider helper with no/blank key reproduces route500 before the fix; desired503 regression fails2/7. Authenticated guard now returns503 provider_unavailable without provider/fetch/DB/upsert/log work; unauthenticated401 and configured historical fulfillment without product ID remain.164 focused tests/types/scoped lint pass. | Auth/DB/upsert are synthetic and fetch intercepted. This is source behavior proof, not Dodo health or identification of the two earlier Google-window diagnostic errors. |
| Free / paid / legacy access | Four persisted roles: free first lesson only; course buyer all lessons; legacy lesson 2 plus free first; admin preview. Free paid-media/progress/quiz denied. Synthetic checkout grants course access; repeat purchase denied. Four native roles/access denials also pass on the production-built HTTPS frontend. | This earlier four-role scope did not exercise the complete provider flow. Later TEST payment/fulfillment is recorded below; refund remains open. New individual lesson sales remain intentionally410. |
| Vouchers | Actual local actor: invalid denied/no purchase; FREE_ACCESS → paid access; one purchase/redemption/use; retry denied/cleanup verified. Four-language feedback and 19 component/atomic-error cases pass. Current helper created and retrieved scoped TEST percentage10% / flat EUR5 coupons in seven bounded provider requests. | Provider coupon acceptance is not redemption or native voucher binding. Actual checkout and tax/FX/settlement/account settings remain unverified. |
| Video / PDFs | Source-e32 actual Mux decode and four-language private PDF bytes pass. Fresh viewport-before-navigation320/390 PDF text is visibly confirmed in both themes, separate visual 7/7; completion 7/7 is narrower. Mux inventory16 and archived 15 lesson mappings plus promo match;68 original PDF hashes/structures and60 class labels verified. | Earlier sad-document screenshots and incomplete primary response remain preserved. Structure/labels do not establish video semantics or translation accuracy. Restricted preview excludes Spotify/Cast. No remapping/deletion justified. |
| Notes / progress / quizzes | Local persistence/locales/mobile and PostgreSQL concurrency/ownership tests pass. Cloud learning26/26:15 completed lessons,16 attempts/192 answers/15 PLATINUM summaries. Cache leak fixed; final notes pointer/privacy/recovery19/19 includes real manual-save200 after labeled intercepted500. Separate9bd actual native UI adds fresh-actor2notes/2completedlessons/2attempts24answers2summaries100PLATINUM/92GOLD, independently verified; original-four preserved. | Latest57 mobile drawer320/390 geometry/hit/keyboard/route entry passes. FB scoped hydrated editor text/styles pass at both widths; BC35/35 browser checks include12 real language clicks at1440/320/390.16auth/seven label cases are distinct. Earlier interrupted11 logic checks remain distinct; quiz contention has real local PG proof with no repeated cloud quiz mutation after patch. [Cloud evidence](preview.md#learning-and-note-recovery-follow-up). |
| Medals / certificates | 1–15 numbering, 15/15 SUPREME and full-course eligibility; legacy 1/15 gets no whole-course certificate. Local vector PDF/Unicode proof; exact-source HTTPS normal button click downloads valid 862,196-byte A4 vector certificate. | Four-theme/viewport private layout and medal contrast checks pass. Historical forged awards cannot be assumed repaired. |
| Messaging | Persisted route/role tests and native signature/trusted-authentication/deduplication checks. Student-owned threads, cross-student denial and authorized local professor reply tested with outbound disabled. Bounded HTML parser and actual inbox text-encoding regressions pass; CodeQL marks alerts 14/15 fixed. | Live receiving/webhook disabled, MX absent; real delivery/notification/inbound reply require approved activation and controlled mail. |
| Administration | Local users/vouchers render; ordinary roles denied; staff notes reviewed. API permission/validated owner identity covered. HTTP resets and CLI voucher reset require explicit isolated targets and default to plans. All 15 legacy mutators are quarantined locally. | Unsupported course create/edit links and inert delete button removed; course preview retained. Course authoring is not implemented. Remaining legacy tools retain their documented local write behavior. R14 verifies the exact-source restored admin panel/login/logout flow; broader administration/account changes remain unverified. |
| Vercel / DNS / accounts | Vercel OWNER/live target/config/Hobby; Supabase sole Owner (MFA false), approved recovery/export/rollback; Dodo/Mux/Resend inventories; GitHub ADMIN, DNS/RDAP. Owner selected zero-cost hosting; free protected HTTPS preview verified. [Vercel](vercel.md), [Supabase](supabase.md), [Dodo](dodo.md). | Stable free production hosting, old credential-bearing deployment quarantine, usage/logs/recovery, separate GitHub scope, registrar controls and Dodo dashboard ownership/payout. No paid upgrade authorized. |
| Dodo provider — current | Sealedba105 payment/signed fulfillment/canonical USD8997 purchase verified. Latest same-payment recovery captures409 INSUFFICIENT_WALLET_FUNDS; final no refunds/full8997 refundable/purchase retained. Original29 fingerprints/nine prior accounts/23 sessions preserved, actor sessions0, all four services/endpoint/full45,831 seal/formal closure pass. Separate own-payment ledger records historical credit8997/fee535/after8462. | Refund/access reversal and free merchant-sandbox balance remedy remain open. Historical ledger is not current account balance; earlier409 body remains unknown. Preserve both spent reservations; no financial retry, customer-wallet substitution or checkout/card replay. [Current evidence](dodo.md#latest-oct20-checkpoint-captured-sandbox-wallet-denial). |
| Dodo provider — earlier settled-document scope | Earlierba105/45,831 settled-document scope is CLOSED_INCOMPLETE_CARD_TRANSPORT_UNVERIFIED: same browser/login/new checkout/billing/Continue, revision1/exact GET/ADOPT without navigation, three card fields in a provider iframe. One UI action spent RESERVED→UI_CLICKED; no retry/refund/positive journal/purchase, last provider GET requires_payment_method. Normal logout/independent29 fingerprints/nine prior accounts/23 sessions/current10 accounts1,515 rows/USERidentity1sessions0purchases0, five terminal0 services/endpoint404/full seal and retention64 files412,746 bytes pass. | An empty list of observed card-write responses proves neither zero requests nor acceptance.92 blocks/93 console errors remain incompletely attributed. Preserve the qualified STRICT_NO_CARD label and original spent action. This historical attempt is distinct from the later successful SDK-verified scope above. [Earlier scope](dodo.md#oct20-settled-document-ui-card-action-spent-transport-unverified). |
| Dodo provider — earlier SPA scope | Earlierba105/45,831 SPA scope is CLOSED_INCOMPLETE_TRANSIENT_SPA_OBSERVATION_CONTROLLER_FAILURE: one new app checkout/unpaid TEST payment, no actor/card/refund. Same profile/one password-token attempt; first from-only URL retained, root exact document GET matches original checkout/payment/path, no later-current-URL receipt. Independent29 fingerprints/nine prior accounts/23 sessions/current10 accounts1,515 rows/confirmedUSERidentity1sessions0purchases0, normal logout/profile removal, five terminal0 services/socket absent/endpoint404/full seal and retention59 files389,335 bytes pass. |106 blocks/107 console errors/three command failures/one observation failure remain incompletely attributed; the dashboard times out over the private Unix transport with an unproven underlying cause; the later-query guard rejection is a controller limit. First malformed negative400 is retained separately from corrected401;19/11/DNS3/TLS502 is setup only. No completed card/payment/refund/positive fulfillment or provider/app defect proven. The then-prepared settled-document scope later closes separately. [Earlier scope and manifest](dodo.md#oct20-spa-scope-transient-observation-does-not-establish-a-card-journey). |
| Supabase / schema / storage | Approved production resume/export/re-pause completed. Actual26 public table grants, ledger/messaging RLS gaps and self-role escalation confirmed. Offline archive65 COPY tables/2,239 records/two sequences and68 Storage object hashes match. Oct20 exact80-file encrypted Monster/Behemoth copy passes full GPG/member hashes and a second run from durable receiver files; original inputs unchanged. | New hardening/code/config/resume review required. Receiver-only key is online/no passphrase; independent key escrow, physical off-site separation, periodic retention, extension ACL equivalence/full platform/atomic snapshot remain explicit limits. Production INACTIVE again; no exploit write or SQL repair. [Recovery outcome](supabase.md). |
| Security / accounting | Auth/cron/media/quiz/notes/signatures/reversals/coupon/privacy defects fixed with regressions. Native limiter/sweep76, producer/ingress512 and launcher/transport/disabled-runner 152 cases are included in current1,995 normal passes. Actual runtime/restart/cleanup/UID denial and sealed reinspection pass. | Process-local/restart/uncancellable Prisma and unavailable-queue recovery limits remain. Production config/hardening, financial journal/currency/tax and historic exposure need review. No timer/production execution enabled. |
| Install / runtime / build | Node24.21.0/Next16.4/Prisma5.17. Source-a207 fresh locked configured webpack artifact:551 application Git blobs/45,770 sealed files/158 client files checked. Actual Unix19/HTTPS11, closure/reinspection pass; e32 restart/worker/UID remains separate. Native engine9 strict TLS checks pass. | Production audit0/dev lint-chain5 high findings remain. Live Node20/settings await verified release prerequisites. Durable CA/config, continuous host, resource/recovery policy and named-tunnel identity remain unverified. |
| Normal automated checks | Exact a207 source and downloaded CI:1,995 normal passes/47 intentional skips,108 files with passes/five all-skipped;46 actual PostgreSQL passes/one REST skip; types/build and lint0/25. Quality/Secret Scan/CodeQL and actual protected Vercel build status pass.556-file committed export scan0. | Existing Vercel account/provider isolation remains unreconciled; build success is not customer-journey or production proof. Earlier reports remain immutable. |
| Separate cloud backend | Free tvm25 hardened tables/five synthetic actors/60 private PDFs. Native9bd fresh UI2notes/2completedlessons/2attempts24answers and100PLATINUM/92GOLD independently verified. 57 drawer320/390 picker96/link225×44 hit/keyboard/route entry, FB hydrated editors and BC35/35 real language controls pass. All-five12-model preservation passes at02:42:36; apps/tunnel/browser state closed. | Historical correction12/9/3, FB10/9/1 clipping and purpose preflight1/0/1 remain separate. Older two buyer errors remain unclassified. Auth budgets remain distinct: earlier11, fresh-learning3, later-nominal3, focused-editor1; correction state reuse adds0. Dodo/SMTP/stable hosting/production and production Google continuity remain gates; Oct19 isolated OAuth is verified separately. |
| Real persisted checks | Five guarded PostgreSQL suites pass46/one REST skip on exact a207 and3cc CI, including seven nullable-accounting regressions and earlier real3-second acquisition cases. Dedicated local Supabase security mode separately5/5 passes. | Fixtures cannot prove production grant repair; actual production remains paused and unsafe until reviewed hardening. |
| Privacy / SEO | 72 focused cases, 15 public browser cases, actual promo playback at 320/390/1440 both themes without optional cookies; on/off/withdrawal works, language retained. Private routes excluded; preview noindex. | HTTPS replay/provider settings and GA Enhanced Measurement review before enabling ID; historic recordings/retention/account recovery unknown. |
| Release / rollback / preview | DraftPR46, exact a207 CI/native payment-history proof and distinct FB/BC editor/language artifacts. Supabase approved preservation/rollback and offline hardening25 checks verified. Disabled reconciliation runner and free stable-host/quarantine proposal prepared. [Checkpoint](review-status.md#payment-history-recovery-and-account-isolation). | Continuous-host/account/DNS/durable configuration, actual old deployment quarantine/compatibility, unfinished provider journeys and exact SQL/config/code/resume technical readiness under continuing authorization. Existing Vercel preview is not isolated; no production release. |

A zero scanner result does not revoke or remove the known historical test
passwords. Private credential/environment/provider-session files are intentionally
excluded from published artifacts. See [local verification](local-verification.md),
[public provider evidence](public-provider-evidence.md),
[backlog](backlog.md) and [release checklist](release-checklist.md).

Historical source `98db3b1` passes 1,251 normal tests/40 intentional skips (95 files with
passes/five all-skipped), lint 0 errors/25 warnings, types and webpack in a clean
Node24 copy with no private env. The 76 new cases are included in1,251. Exact-source Quality/Secret Scan/CodeQL pass; downloaded Quality logs verify
1,251/40 normal and 39/1 persisted PostgreSQL counts. Earlier reports remain
immutable. No latest-head HTTPS/browser or
production verification is inferred. [Native behavior and limits](native-runtime.md).

Historical native source `ab14628` passes 1,763 normal tests/40 skips, types and lint0/25.
Its 512 new cases are included: indexing35, configuration189, policy170,
actual HTTP20, actual release I/O48 and preparation50. A fresh configured locked
package matches 541 Git application blobs and verifies45,759 sealed files;
157 client files contain the public key/origin without supplied server secrets.
Reinspection passes, but its origin is synthetic/unrouted and it was never
started. Fixture-only successor `3cbb17c` has189 scoped passes and preserves the
same malformed-key test value without a scanner suppression. Native launcher,
runtime cache/restart, disabled daily runner and current-source HTTPS/customer
journeys were unverified at that checkpoint. The exact-e32 checks above supersede
those gaps; production activation remains separate. [Current package scope](native-runtime.md).


Latest57 all-five12-model strict-CA read-only fingerprints/global counts are
unchanged after closed apps/tunnel. Browser report12/9/3 remains separate; native
9bd two-lesson learning and earlier e32 public/PDF scopes are not relabeled.
Unknown historical and malformed provider amounts now stay unknown. Historical
display has33 targeted passes; provider accounting has260 including18 actual
PostgreSQL cases. Stored currency/tax/financial journal remain deferred. [Exact scopes](review-status.md#mobile-drawer-recovery-and-recorded-payment-amounts).

Latest source accounting and exact CI are in [provider amount availability](review-status.md#provider-amount-availability); hydrated editor and real language controls are in [the scoped UI checkpoint](review-status.md#scoped-notes-editor-and-language-controls).

Current a207 history source cases distinguish failed/malformed requests from
successful empty history and reject stale owner results/cookie mismatches.
Page19/19 and API frozen baseline/controls pass. Actual HTTPS31/31 successful
phases show80, unavailable,0 and restored80 in ES320/EN390/FR1440/PT320, controlled
500/real retry, and server409. Root SQL variants touch only one synthetic grant;
exact original row restored and all-five12-model hashes unchanged. Browser
account-switch/empty-account journeys and actual Dodo transactions are excluded.
One login/session/own-avatar,19 intercepted reconciliation intents, clean
process closure/session deletion/seals verified; earlier3/2/1 and no-traffic
CLI1/0/1 diagnostics retained. [Current scope](review-status.md#payment-history-recovery-and-account-isolation).

Operational fallback9cb is a separate standalone HTML/CSP/503 contract, with
138/138 actual loopback HTTP/browser checks and4/4 local-file checks. Initial
109/110 CSS-zoom failure is preserved; no production activation/provider journey.
Credential CSV/app.env0664→0600 and identical durable TEST-key retention are
actual local changes; six durable preview provider values match a207 inputs.
No key rotation, automatic loading or production configuration proof follows.
[Operational scope](review-status.md#local-credential-boundaries-and-static-rollback-fallback).

Latest published fallback/docs HEAD `8e68f68` has exact successful remote checks,
downloaded 1,995/47 normal and 46/1 persisted counts, two 559-file committed
exports with zero findings, and retained 48-file evidence outside `/tmp` with
matching hashes/owner-only modes. No separate intermediate `9cb3d3f` CI run or
production fallback activation is claimed.

**Private dashboard/admin/course/lesson ownership is repaired in source4f395e0.**
Frozen component/parent12 failures/five controls, separate admin/checkout cases,
original six-route24 failures/18 controls and seventh-route four failures/three
controls remain distinct. Final111 client cases/49 route regressions pass;
independent18-file review binds to committed blobs. Fresh root/CI2,130/47 normal,
46/1 PostgreSQL, types/build/lint0/23 and570-file secret scan0 pass. Actual native
cross-tab sign-out/sign-in, B empty payment history/current-owner controls and
stale-hint409 pass. A separate foreground4f observation confirms the paywall
physically intercepts B's logout; final414 repairs the stacking and passes24/24
actual owner/account/menu/modal checks with both normal logouts. The earlier
19/20 report and unclassified timeouts remain retained, and actual delayed-reply
privacy remains a separate unproved scope.
[Current scope](review-status.md#contained-paywall-and-complete-native-account-verification).

Registered account access is corrected in source: profile, settings and payment
history are available without a full-course purchase, while the authenticated
owner boundary and paid content rules remain. Exact-HEAD frozen six failures /
nine controls become 15 passes, plus seven notes/paywall controls. Genuine
unobstructed native free-account views and own identity are verified; profile/
preference edits and actual provider payments remain excluded.
[Scope](review-status.md#private-view-ownership-and-account-access-source-verification).


Current catalog/action source44ec58b has clean2,191/47 normal,46/1 persisted,
types/build/lint0/23 and exact remote Quality/Secret Scan/CodeQL success. The61
new cases cover paired prices, unknown free-grant rejection, voucher/course/open
lifetime, removed-frame cleanup and finite duplicate diagnostics. Fresh locked
artifact572/45,792/158, Unix19/HTTPS11 and577-file secret scan0 pass. Native
owner reports retain separate21/22 and20/21 helper timing diagnostics; an additional
B-only browser32/32 verifies24 catalog/dialog cases across four languages and
1440/390, real paid-class2 denial/details80 and normal sign-out. All-five/12-model
preservation, clean owned closure and sealed reinspection pass;15 total observed
owner/catalog password/session pairs remain explicit. Prior41424/24 stays separate;
actual player-modal reachability, artificial delayed replies and positive provider
price/metadata/tax/currency parity remain unresolved.
[Current source scope](review-status.md#catalog-prices-and-course-action-lifetime).


Current checkout publication/intent sourcecd20569a passes2,221 normal/51 opt-in
skips and50 real isolated PostgreSQL/one REST skip, types/configured webpack and
lint0/23. Publication9, server intent8 and client13 new normal cases retain frozen
before failures and meaningful controls. Four new actual PostgreSQL cases prove
before/after draft and wrong-cookie grant persistence. The older plain-URL fixture
failure is retained. Exact CI logs and581-file source scan agree; all15 independently
reviewed hashes match the final source. Fresh576/45,796/158 native artifact and
Unix19/HTTPS11 pass. Current native12 actual-response relay matrix passes on three reachable screens
and four languages at390; the whole run retains an unawaited logout assertion
interruption. A prior preflight has0 checkout. Both browser groups close, with
page errors/forbidden mutations0 and cumulative19 sign-in/session pairs. Final
separate sign-out-only checks later pass both actual global204 responses, with
six pairs in that window/21 cumulative; all-five/12-model preservation, owned
runtime/tunnel closure and seal inspection pass. Original partial is retained;
natural cookie lag and locked-player reachability are not established.

Offline93 public index definitions/18 closed checks expose the prepared name-only
guard's uniqueness limitation. Original SQL/inverse hashes remain unchanged; no
live SQL/drift/column/extension equivalence or atomic-preflight claim follows.
[Current checkout evidence and limits](review-status.md#checkout-publication-and-account-intent).


Latest published voucher sourcea16c1abc passes2,311/57 normal and56/1 real
PostgreSQL in seven suites, types/configured build/lint0/22. Two fresh
582/45,802/158 artifacts and Unix19/HTTPS11 pass. First browser attempt has zero
traffic and fails a proof-file mode guard. Second passes12 actual four-language
503/409 cases but fails admin mobile overflow: whole-run PARTIAL12/13. Eight
price transitions restore80, with publication/other public-table writes0.
All-five/12-model/global/business/learning/entitlement and complete raw course/
timestamps match after clean expiry closure and seal inspection. Three further
password/session pairs bring the cumulative count to24; normal logouts were
not reached. Separate admin before/after and quote-provenance/concurrent-intent
repairs remain work. [Exact scope](review-status.md#voucher-availability-and-redemption-intent).


Sourcea631e166 now passes2355/68 normal,67/1 real PostgreSQL in eight suites,
types/lint0/22, with meaningful quote/provenance and transactional course fixes.
The source-confirmed JPY/KWD conversion/precision issue remains High PAY-22.
Freshc1a has identical application code; its586/45,806/158 build/Unix19/HTTPS11
and native admin320/390/768/1024/1440 pass eight geometry observations, three
keyboard menus and six permitted44px links per width (light theme). Two separate
admin pairs bring cumulative count26, each with actual logout204. All-five/
12-model/course timestamps unchanged and owned closure/seal pass. Originala16
voucher12/13 andc1a2351/4/68 fixture diagnostic remain immutable. Actual Dodo,
OAuth/mail, stable hosting and approved production hardening remain essential
gaps. [Current source and bounds](review-status.md#quote-provenance-and-transactional-course-intent).

The next currency candidate fixes PAY-22 in source: nullable exact payment
currency/minor text, explicit ISO exponents, coherent snapshot extraction,
retry/replacement guards, honest history and separate admin currency totals.
Frozen backend52, admin13, student23 and DTO17 cases retain their exact-d05
failures and now pass. A separate intermediate snapshot-mixing eight cases
(six failures/two controls) also pass after correction. Local schema6 preserves
the old row/timestamps and includes five actual PostgreSQL representation
checks. Light amount contrast now uses the existing title-accent token; actual
post-class offline ratios pass both themes. Full clean-source QA/remote CI and
a fresh migrated native preview remain pending; prior c1a evidence is not
rebound to the candidate. [Currency scope and rollout](payment-currency.md).


Latest currency checkpoint: exact97e5e06 clean2533/80 normal, types/build and
lint0/22. Exact188 ten persisted suites80/1 (79 actual PostgreSQL cases plus one
client-metadata case) pass after file serialization; real within-test races stay
active. Fresh602/45,822/158 artifact, isolated nullable-column migration,
Unix19/HTTPS11 and native58 pass. Independent final12-model/18-protected-hash
comparison restores both pairsNULL and preserves raw timestamps/roles/policy/
indexes; all owned browser/app/tunnel resources close and seal inspection passes.
Native statistics are KWD7d/restored30d only;36 representative amount geometry/
contrast observations cover320/390/1440 in both themes. Later voucher/legacy
precision/unknown-zero follow-ups have55 targeted source/component checks,
not a new native execution. No Dodo transaction, production migration or paid
hosting change. Broader landing-page visual polish is the next UX pass.
[Exact scope](review-status.md#currency-facts-and-readable-amounts).


Public landing source5c improves the hero and repairs actual390 mobile-menu
clipping while preserving the different320 toggle position.154 assertions across
six viewport/theme cases and four locales, plus four existing E2E cases, pass.
Exact5c full2533/80/types/build/lint0/22 passes; f8 adds test coverage only. Before18/
after19 public PNGs and88 selected artifacts are retained privately; owned
browsers/local wrappers close. Promo video is an explicit local503 fixture, no
provider/account/mail/DB flow. Existing Secure OAuth hint writes are clarified
for static analysis;10 before/after controls pass. Exactf8 remote Quality/Secret
Scan/CodeQL checks pass; fresh head-ref alert query0, no dismissal.
[Exact landing evidence](review-status.md#landing-hero-and-usable-mobile-navigation).

Application1e381a3 separately repairs press hover/focus contrast and footer touch/
focus appearance. Actual isolated local production12-case matrix (ES320/390/1440
both themes plus EN/FR/PT390 both) passes with actual Inter/Playfair, no overflow,
broken loaded images, client errors, external reads or mutations. Painted press
ring contrast5.86/7.34 and solid2px footer outline7.26/8.59 pass; back-to-top is44px
tall and keyboard activation returns to top. Build/types/scoped lint pass. Root
preserves earlier fallback-font and focus-predicate diagnostics, and retains117
selected files/90 public crops outside/tmp. Browsers/server closed; no provider
or full accessibility-audit claim. [Scope](review-status.md#landing-press-and-footer-accessibility).

Whole-page follow-up: four ES renders at390/1440 in light/dark, with four original
full-page captures and four derived inspection crops, verify page composition
and readable default mobile course titles/biography. No further layout change
is justified. Source bytes match1e across302 runtime/public files; build producer
is91e plus two reviewed edits, so this remains a limited local visual proof.
Requests193 local/four promo503 fixtures/eight optional prefetch blocks, external/
mutating traffic and errors0; owned browser/server closure independently checked.
Low-resolution original photos remain a medium-priority asset limitation after
a bounded21-blob search and8 selected ES/EN lesson PDFs with0 embedded bitmaps.
Other languages/unrelated PDFs remain unopened. No generic clamp, all-language
or healthy Mux claim.

Historical migration source: exact237-byte March18 restoration changes the four
checksum cases from3PASS/1FAIL to4PASS; clean local sourceac62f4a normal suite
passes2,537/80. Two earlier offline attempts stop before any resolve; their
empty-log predicate and PID1 container-reaping diagnostics remain preserved.
An empty trace identifies the correct Prisma engine as the SIGTERM target;
Docker init prevents the demonstrated database recovery in a controlled run.

Completed actual run-a5ec90a2205e then verifies corrected restore, exactV4 at225,
literal currency SQL, strict227, initial status, exactly3 official Prisma5.17
resolves and final status. All7 literal SQL checksums match; all4 original full
ledger rows and microsecond-precision raw bytes are unchanged. Independent
archive/before/final comparisons preserve65 tables/2,239 original records/two
sequences, excluding only3 validated new ledger ID/name pairs (2,242 final
records). Strict227 and446 zero-row permission operations pass; no customer/
Auth/User/Purchase fixture is created or edited. Root rehashes286 captured files,
all5 backup inputs remain unchanged and the owned container is confirmed absent.
Independent acceptance checks59 targeted captures, incremental IDs/acknowledgements,
raw originals, data, sequences and permission outputs. The owner-only durable
352-file/4,023,885-byte selected checkpoint excludes customer COPY, raw ledger IDs,
credentials and enabled approvals. Offline history reconciliation is complete;
current production compatibility, unknown source extension privileges, general
schema drift and clean migration bootstrap remain unproved.
[Scope and retained diagnostics](payment-currency.md#historical-sql-source-and-bookkeeping).
