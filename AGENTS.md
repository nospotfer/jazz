# Cultura del Jazz maintenance

The application is in `jazz-lms/`; read its `AGENTS.md` before editing. The public
site is https://www.culturadeljazz.com and GitHub is `nospotfer/jazz`.

## Current operating contract

The user has authorized an initial maintenance and stabilization goal, including
UX/UI improvements. Its requirements and evidence live in
`jazz-lms/docs/maintenance/`. Resume existing work instead of repeating audits.

Work on `maintenance/initial-audit` or a coordinated maintenance branch. The user
has authorized installation of tooling, local changes, commits, pushes, pull
requests, preview deployments and bounded subagent work for this goal. Coordinate
file ownership when agents share the checkout.

On 2026-10-20 the owner explicitly approved the pending maintenance actions
("I aprove everything, don't get blocked by such things please"). This is
continuing authorization for the prepared project maintenance plans, including
bounded isolated account/payment tests and controlled messages, and reviewed
production recovery, configuration, migration, deployment and rollback operations
once their technical prerequisites and rollback are ready. Do not ask for the
same permission again or treat historical approval gates as still unanswered.
Keep each operation concrete and bounded, record its evidence, and resolve
implementation failures autonomously. Ask only for genuinely missing access,
information or a material action outside this project scope. Use isolated test
data and provider test environments; a preview connected to production data is
not an isolated test environment. Keep real charges/refunds, paid plan changes,
unrelated Neurofactory services and credential rotation outside this maintenance
scope.

The owner selected a zero-cost hosting budget. Do not request or perform a paid
Vercel upgrade. Use the existing machine and free resources for a protected
HTTPS preview; a temporary tunnel is testing infrastructure, not a production
hosting replacement. Keep any production hosting/domain move for concrete review.

## Credentials

The local credential CSV and environment files contain secrets. Never print,
commit, copy into reports, or capture them in screenshots. Inspect through code
that emits only redacted metadata. Exclude the CSV from Git. Use credentials only
for this project and leave credential rotation to the user. Preserve unrelated
local changes and shared Neurofactory services.

Keep ignored credential CSV/private environment files owner-only (0600); ignored
files can still expose credentials through filesystem permissions. The Dodo TEST
key also has a protected durable copy at
`/home/gabriel/.config/culturadeljazz-maintenance/dodo-test-api-key` (parent0700).
Read it explicitly only for the isolated test API. No automatic loading, key
rotation or payment/email authority follows from that copy. Credentials remain
separate from published and retained review evidence.

Existing preview provider inputs/CA and the five synthetic login credentials have
separate owner-only recovery files under
`/home/gabriel/backups/culturadeljazz-maintenance/native-preview-configuration/`.
The synthetic file is `synthetic-preview-auth-fixtures-private.json`; it does not
assign roles or restore sessions. Verify current database roles and construct a
fresh source/origin/gate plan before use. Do not copy these credential files into
the review evidence package or load them automatically. Retention is local and
unencrypted; off-site recovery is not established.

The separately controlled email-test USER now has a verified changed password.
Its current credentials are in the owner-only, explicitly loaded recovery file
`/home/gabriel/backups/culturadeljazz-maintenance/native-preview-configuration/mail-test-auth-fixture-20261020-current-source-private.json`.
Earlier Oct20 and older email-test password files are historical. The fixture grants no role or
session authority and must stay separate from retained review evidence. Oct20
hosted recovery passes callback/form/identity, one password update, old-password
rejection, new-password dashboard login and normal logout on sealed source30d848a.
Original data is preserved, settings are restored and owned services are closed. A test
adapter repair required a same-profile session continuation; an uninterrupted
fresh current-source journey subsequently passes on sealed3e5b2c1 without a
browser/controller restart or profile/session resume. It preserves all nine
accounts/1,514 public rows/23 original sessions; only the controlled password and
sign-in timestamps change, actor sessions0, full Auth restored and45,831-file seal
passes. Private redirect adaptation remains distinct from public HTTPS. Further
controlled tests use the owner's continuing authorization and a fresh bounded
plan; do not reuse a closed window or spent action ledger.

Fresh registration also passes uninterrupted on sealed application source
`3e5b2c1` (Oct20), including actual confirmation, password login, dashboard and
normal logout. Original data/settings are preserved/restored and resources are
closed. The new registration USER's separate owner-only fixture is
`/home/gabriel/backups/culturadeljazz-maintenance/native-preview-configuration/registration-auth-fixture-20261020b-private.json`.
It grants no role/session authority and stays outside review evidence. The first
fresh-registration scope remains a closed setup failure with a separate pending
actor; never overwrite it or reset its spent ledger. Private browser transport
does not prove public HTTPS; seven blocks/seven console errors are unclassified.

The controlled Dodo TEST USER has separate credentials in the owner-only
`native-preview-configuration/dodo-test-auth-fixture-20261020-private.json`
under the same maintenance backup root. Its first closed scope verifies USER,
zero sessions and no purchases. The separate owner-only
`dodo-unpaid-test-checkout-20261020-private.json` in that directory preserves the
original checkout, unpaid TEST payment, private provider links and all five spent
billing reservations. It contains no provider key or account password. Keep both
files outside retained review evidence; neither permits automatic loading,
role/session restoration or activation. Any continuation needs fresh independent
actor/provider checks and a new source/origin/gate plan. Preserve original
timestamps and spent actions; do not recreate the account or checkout to resume.

The Oct20 continuation closes without a card attempt: both the bare payment API
link and the original checkout redirect to a provider `link-expired` status page.
Dodo documents checkout URLs as single-use, so do not assume a closed checkout
can resume or that its payment API link replaces the observed browser URL.
Preserve the old unpaid payment, captures and ledgers. A subsequent payment test
is a separate, reviewed fixed scope with at most one new normal application
checkout, one card attempt and one full TEST refund, reusing the confirmed USER
without creating an account. Prepare its helpers before creating the checkout;
retain one browser profile and carry the actual observed redirect, including its
opaque session query, unchanged after matching it to the exact provider receipt.
Never reconstruct that query or silently renew a closed action allowance. The
owner's continuing authorization covers this bounded isolated test; another
routine approval is not required. The provider rejection alone does not prove
whether expiry, consumption or missing browser context caused it.

Two subsequent fresh TEST scopes also close without a card attempt. Their
separate owner-only recovery records are
`dodo-unpaid-fresh-session-20261020-private.json` and
`dodo-unpaid-fresh-spa-20261020-private.json` in the same private recovery
directory. Preserve their unpaid payments, observations and spent ledgers;
neither record authorizes automatic loading or checkout replay. The first scope
missed an SPA URL change; the second captured a transient `from` URL before the
page changed to a `session` query. Its exact provider payment/path readback
passes, but its controller cannot bind the later URL. These are test-controller
failures, not proof of a provider or application defect. Both scopes verify
normal logout, original-data preservation, zero actor sessions/purchases,
endpoint deletion, stopped services and the full source seal.

Prepare and test controller changes offline before another bounded scope. Capture
the settled current payment document in the same browser, retain immutable
observations if it changes again, and bind each selected observation to an exact
provider readback before card submission. Binding alone must not navigate back
to an earlier URL. Preserve the original financial reservations even when a UI
operation fails; do not create repeated checkout attempts to debug the controller.

The final settled-document scope records one spent UI card attempt, with no
verified provider acceptance: the last exact GET remains
`requires_payment_method`, no positive signed delivery or purchase is proven,
and no refund is requested. Stable observation/adoption and normal logout pass;
independent data/session, resource, endpoint and full source closure pass. Its
separate owner-only record is
`dodo-unpaid-settled-document-20261020-private.json`. The raw closure helper's
`STRICT_NO_CARD` label is qualified by a separate interpretation receipt: it
proves unchanged data, not absence of this UI attempt. Preserve both receipts
and the spent marker. The automatic financial-test loop is stopped; first improve
offline phase-specific diagnostics and verify SDK readiness. Visible inputs and
a Pay click do not establish accepted transport, and an empty response list does
not prove that no request occurred. Do not silently grant a second card attempt.

The later SDK-verified scope now proves one successful TEST payment, matching
signed native webhook and canonical purchase (USD89.97/tax0). Corrected storage
reference and explicit UTC readbacks preserve all29 original fingerprints/nine
prior accounts/23 sessions; actor sessions0. Its six services/endpoint/profile
are closed and the full45,831-file artifact seal passes. This supersedes the
earlier unpaid-only status without changing those historical scopes or budgets.

A separate refund-only continuation creates no actor/checkout/card. Its sole
full-refund POST returns409 with no refund ID; readback shows no refunds and
USD8997 still refundable. The helper discarded the error body, so the cause is
unknown. All four services/endpoint are closed, original data is preserved and
the same purchase remains; no refund/access reversal is claimed. The owner-only
recovery record is `native-preview-configuration/dodo-paid-test-refund-conflict-20261020-private.json`
under the maintenance backup root. The durable spent refund reservation is
`/home/gabriel/.config/culturadeljazz-maintenance/dodo-succeeded-test-payment-20261020-refund-attempt-private.json`.
Keep both separate from review evidence; neither authorizes automatic loading,
role/session restoration, expired-scope reuse or financial retry. Do not clear
spent markers or replay checkout/card to diagnose this409. Establish bounded
private failure capture and a concrete provider recovery plan before any further
request; continuing maintenance authorization remains in force.

The later Oct20 same-payment recovery scope is closed with a captured409 code
`INSUFFICIENT_WALLET_FUNDS`. Its sole additional TEST refund request creates no
refund; final reads retain fullUSD8997 refundable and the canonical purchase.
All29 original fingerprints/23 prior sessions remain unchanged, actor sessions0,
all four actual services exit0, endpoint404 and the full45,831-file seal pass.
The original409's discarded body remains unknown; this new diagnosis does not
rewrite that evidence. Keep both spent markers, including
`/home/gabriel/.config/culturadeljazz-maintenance/refund-recovery-jazz-refund-recovery-oct20-reservation.json`.
The separate owner-only recovery file is
`native-preview-configuration/dodo-paid-test-refund-wallet-denial-20261020-private.json`
under the same backup root. It grants no autoload, retry or activation authority.
A separate one-GET TEST balance-ledger read verifies this payment's historical
credit8997 and fee535, leaving8462 at that event; it is not a current account-total
check. Investigate a free merchant-sandbox balance remedy before another financial
scope. Customer-wallet credits and real funding are not established remedies.
Dodo documents additional TEST payments as a sandbox balance workaround. The
separate unfinished coupon journey may use a fresh bounded checkout/card plan
under the owner's continuing authorization; it cannot reuse this closed scope,
reset spent reservations or replay payments merely to debug a controller.
Registered-email support is an optional fallback, not the sole documented path.
See `jazz-lms/docs/maintenance/dodo.md`.

## Evidence

Current R5 freshly adopts both existing PDFs read-only (171,746 bytes), with
initial1,621 rows/14,270 typed cells matching. It uploads nothing. The second
stability SELECT fails57P01 after one successful sample; the failed query's role
is derived from pinned control flow, not a retained query hash. Connection state
is closed/UNKNOWN; final preservation and explicit rollback are skipped with
CONNECTION_CLOSED and remain unverified. Frontend/worker close; parent pause and
independent10:41:54 sevenGET closure confirm replacement/production INACTIVE,
preview healthy and old settings equal. Preserve R5 receipts/ledgers and both
objects. Before another upload scope, diagnose the connection read-only using
actual settings/identity/persistence observations; do not assume a timeout cause,
change routes silently, re-POST/overwrite files, recreate the bucket or repeat
customer import. Exact8ac31bd publication/CI passes without deployment. The
filtered PostgreSQL events match no retained frontend PID; empty Supavisor logs
do not prove absence of a pooler failure. See production-readiness.md.

Earlier R4 freshly adopts the first PDF read-only and passes two actual empty
selected-policy checks, then sends one new PDF POST/download/info200 with source-
bound bytes. SQL014 AdminShutdown57P01 stops its metadata read. Frozen verified
objects1; initial1,621 rows/14,270 cells match, but final customer/protected
preservation and explicit rollback remain unverified. Frontend/worker close;
parent pause and independent10:01:33 sevenGET closure confirm replacement and
production INACTIVE, preview healthy and old settings equal. Preserve all R4
receipts/ledgers. Freshly check both existing objects and customer/protected
state read-only before further uploads; never re-POST/overwrite either object or
recreate the bucket. The owned pause follows the failure; its external cause
remains unknown. Source105f8b9 publication/CI passes, without deployment.
See production-readiness.md for actual evidence, filtered log limits and custody.

Earlier R3 stores the first PDF: POST/download/info200 and pinned bytes match,
but frozen verifiedObjects0 because actual user_metadata{} differs from archived
SQLNULL. Owners/archivedNULL, version flagsfalse.99 READ ONLY SQL/sixHTTP preserve
1,621 rows/14,270 cells/protected metadata; rollback/frontend close, child1.
Parent pause and independent09:19:59.842538 sevenGET closure confirm replacement/
production INACTIVE, preview healthy and old settings equal. Adopt the existing
first object read-only under an explicitly reviewed mapping or prepare a bounded
remedy; never POST/overwrite it again or recreate the bucket. Before R4, verify
fresh same-frontend Storage policy dependencies, then first-object hash/ID/version/
path adoption and a new bounded67-upload plan. Prior finite captures lack actual
pg_policies rows. No R4 outcome is established; R3 custody/qualification retained.

This maintenance checkpoint integrates bbec8b1/748a50c. No recovery artifact
build, runtime or deployment has occurred. Offline44rows/three-table source review confirms original
controlled SUPER_ADMIN EMAIL identity and one of14 CSV candidates matches its
bcrypt hash. No online login/reset is proven. Finite source custody is retained;
the owner-only native-preview-configuration/restored-admin-password-source-selection-20261021-private.json
is an explicit source reference only, grants no autoload/role/session authority
and stays outside retained evidence. Use only in a fresh bounded target/origin/
gate plan. Never print or copy plaintext, hashes or reference contents into reports.

Earlier Storage checkpoint: R1 sends zeroPOST/oneHTTP400 NoSuchBucket and closes
safely. R2 confirms one bucket POST200, then stops on omitted API type while SQL
STANDARD passes; PDF uploads remain0.93 READ ONLY SQL/threeHTTP preserve1,621 rows/
14,270 cells. Original parent paused:false/closure failure and corrective-pause
unknown outcome stay unchanged. Independent08:56:22 twelveGET/zeroPOST/noSQL
readback confirms replacement/production INACTIVE, preview healthy and old
settings equal. Reuse the existing bucket only through a fresh bounded scope;
never recreate it, repeat customer import or replay R1/R2. The later R3 outcome
is recorded above.

Separate bbec8b1/748a50c now locally provide persisted-role authorization
and protected replacement-only recovery access; tests/custody pass but neither
is deployed or hosted GoTrue proof. Build a fresh artifact for a new bounded
access scope after the pinned Storage scope closes. The recovered backend contains real customer data, not
isolated test data; actual provider/session/data/closure evidence remains required.
See the latest production-readiness.md Storage/source checkpoint for custody.

Earlier Oct21 actual customer restore finishes07:37:36 with one confirmed COMMIT:
26 COPY batches/1,621rows (1,617data+four historical migration rows), all14,270
typed cells match before commit and in fresh persisted readback. Both separate
READ ONLY transactions roll back, frontend/worker exit0; the write transaction
commits rather than rolls back. Protected metadata/rights/managed definitions
are preserved. Independent07:39:29 seven-GET closure confirms replacement and
production INACTIVE, preview healthy and old settings unchanged. No API-schema
PATCH/key/Auth/mail/Storage operation or serving occurs. Original import-specific
metadata review is now resolved offline: only the native internal-RI owner
predicate admits actual supabase_admin alongside postgres; other signature and
constraint checks stay fixed. Original stopped receipts remain unchanged.

Driver/executor/event evidence review passes with parent authorship disclosed;
it does not independently decode customer values. Source/finite actual custody
and review are retained separately from credentials and raw values. Storage
client preparation had16 closed controls; subsequent R3 state is recorded above.
Accept the existing first file through reviewed read-only adoption or a remedy,
then restore the remaining67 with byte/ownership/default/bijection checks while
preserving populated customer tables. Do not reuse the old empty-only verifier after import,
replay spent scopes or repeat the confirmed customer import. Login/GoTrue,
recovery-point currency, stable zero-cost hosting and release remain open. Public
www still returns503. See production-readiness.md and separate custody packets.

The Oct20 Free replacement is `klaiiikojgdfclzhqfgt`, named
`Jazz-LMS-Empty-Replacement-20261020`. Final state is INACTIVE. A minimal
three-field Auth PATCH passes actual readback of all49 intended values with
unrelated settings unchanged. Stored/effective API schemas are disabled, but the
sole live probe returns503/PGRST002; that alone is not containment proof. Do not
repeat successful Auth changes or recreate the project. Oct21 R8 now commits the
guarded empty application225→227 schema with strict rights/managed-preservation
checks and one confirmed COMMIT. Fresh source0769 read-only verification then
passes persisted227/effective rights/empty guards/original managed baseline,
both client rollbacks/closes and parent/child0. Final04:08:57 pause and independent
04:09:08 seven-GET closure preserve original observed states/settings. Four extra
nonunique auth.users indexes are separately reviewed and retained; original
selected constraints/indexes/types match. No customer import/serving/cutover has
occurred in that earlier schema-only scope; customer import now passes above.
Preserve every spent create/configuration/restore/pause marker.
Continue actual Auth/Storage continuity with a fresh
bounded plan. Offline14accounts/16identities/seven purchases have consistent
checked links; preserve original roles and two confirmation disagreements.
The source admin matches an explicitly controlled project address, but actual
restored access remains unverified. See the current production-readiness.md
checkpoint rather than replaying closed preparation/verification scopes.
Its server-created timestamp predates the accepted create request, unexplained;
exact201/preinventory absence/current ownership are independently verified.
Separate owner-only `empty-hosted-target-20261020-database-password-private.json`
and `empty-hosted-target-20261020-owned-target-private.json` recovery files live
under the existing native-preview-configuration backup directory. They grant no
automatic loading/import/cutover authority. See production-readiness.md.

Keep the maintenance log, inventory, prioritized backlog, verification matrix
and release checklist current. Record actual checks and failures, distinguish
local fixes from deployed fixes, and do not treat mocks as proof of live service
health. Do not mark the goal complete until its full completion criteria are
verified. Follow the goal's blocked-state rules when essential access prevents
progress; newly available access is a reason to resume useful work.
