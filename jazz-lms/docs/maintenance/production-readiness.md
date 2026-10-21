# Production recovery checkpoint — 2026-10-21

## Oct21 second transaction stops; independent closure verified

A new bounded transport scope on source `6c3ec31` finishes at 05:57:45 UTC with
`REPLACEMENT_API_CONTINUATION_STOPPED`. Its first 18-request READ ONLY transaction
verifies the existing namespace, strict227/effective rights/empty state, original
managed metadata and no schema overrides; ROLLBACK is confirmed. The same frontend
is retained. After the sole API-schema PATCH, the second phase stops at
`BEGIN_READONLY`: two attempts include the failed BEGIN and cleanup ROLLBACK,
with no successful command receipt for either. Do not describe these as two
successful queries or claim the second rollback was confirmed. The client closes;
no new DDL/COMMIT, public API request or customer import occurs.

Parent and child exit1 without terminate/kill; frontend-close acknowledgment is
present. One readback-bound schema rollback restores the prior desired setting,
then the sole pause is confirmed. Management calls78 (52 normal/26 closure),
public GETs0, two zero-candidate process scans. Independent 05:58:38 seven-GET
readback verifies exact replacement INACTIVE, original production INACTIVE,
preview ACTIVE_HEALTHY and original observed settings equal. It does not establish
the second transaction's rollback or independently read paused target API config.

A separate one-GET provider log query selects only time/source/severity/SQLSTATE
for 05:56–05:57 UTC: HTTP200, no query error, seven PostgreSQL ERROR3F000 events.
There is no identity correlation with the failed transaction, so these records
establish no cause. The [documented logs endpoint](https://supabase.com/docs/guides/observability/advanced-log-filtering)
is read-only and distinct from a database SQL or lifecycle replay.

Independent installed-library controls confirm a diagnostic defect: D6's
connection-only exact-type whitelist drops several psycopg SQLSTATE subclasses,
including AdminShutdown, CrashShutdown, InvalidSchemaName and ConnectionFailure.
Seven synthetic cases reproduce that gap; they do not recover the original
exception. The identical stage previously completed both transactions. Keep the
connection factory and no-retry policy; prepare stage-specific finite failure and
cleanup diagnostics before a fresh separately bounded operation.

Parent result `92915d127c3ae45ef8ccb7a4bee271f29c4a761379d191ad58d3a47eabb55033`;
precheck `53ba3bd42f2553d32502e52b190b7e7acebb95235d49b0529e969ffbda767687`;
second phase `3f815b677675c21403261c9a46442a71bf85d0f910f963d288335c5f70d8eb66`;
independent closure `296f815920b64efb25d2f93cfbe9f6712dd2fd40e1ad931d723ff654a89be266`.
Source/finite custody retains47files/401,713member bytes, manifest
`4439784f1542006b66932e2eefa6869233486709390819a285e411d36644473b`.
Separate diagnosis/log-source manifests are `e0f3b340…`/`b08836d2…`.
Enabled plans, selected keys, passwords, original provider bodies, SQL row captures
and derived guards stay outside review custody. Retention remains local/unencrypted.

A separate metadata-only parser review reads1,329 archived statements: eight
explicit CREATE TRIGGER statements, zero on the26 selected restore tables and
seven on Storage tables. Native constraint triggers are outside this count.
Historical captured managed metadata lacks an explicit table-trigger collection;
current hosted trigger behavior is not established. A single inert catalog SELECT
is prepared for the future import scope; do not disable triggers or assume current
platform equivalence. Three-member source manifest `3c885d1a…` has a durable exact
copy. Hosted Auth/Storage/customer restoration, API matrix, recovery-point currency,
stable free hosting and production release remain incomplete.

The old Vercel application is now protected and paused. Production Supabase
remains INACTIVE; no production SQL, production backend resume or production
application deployment occurred in this checkpoint. The improved application
remains unreleased. The isolated preview was separately paused and restored in
the control experiment below.

## Oct21 native customer recovery and file-source checks

The real archived Auth/public data passes a confined local PostgreSQL 17 restore
rehearsal: native COPY imports 1,617 data rows plus four separate historical ledger
rows. All 14,270 typed cells match before and after commit: 14,130 stable cells,
126 explicit Auth-flow reset cells and 14 new money NULLs. UUIDs, roles, password
hashes, identity/provider links and confirmation facts are preserved; no new
migration acknowledgments or monetary facts are invented. A separate fresh
database rejects a deliberate duplicate with 23505; ROLLBACK and an independent
connection verify zero committed rows.

The fixture preserves 44 captured Auth columns/defaults/generated expressions,
six constraints/19 indexes, owners/RLS flags, and 50 public constraints/93 indexes
from immutable bootstrap/currency SQL. Execution grants/helpers are explicitly
synthetic. This proves neither hosted permissions, GoTrue/managed triggers,
destination collation, account login, Storage restoration nor a current recovery
point. Earlier 42501 and owner-fidelity fixture failures remain unchanged; discarded
error prose is not reconstructed. Actual confinement/logging is verified before
decoding rows: network none/no ports, read-only root, nonprivileged UID, dropped
capabilities,1 CPU/1 GiB, tmpfs/owner-protected Unix socket, empty Docker config,
no Docker logs and panic/terse server logging. Clients close and container/socket
are removed; root independently verifies absence.

All 68 retained PDF blobs also match hashes/sizes/headers: 6,423,774 bytes. Offline
checks bind 69 Storage SQL records to original inventory/download metadata. The
sole bucket is private, STANDARD, unversioned, AVIF false with NULL limits/lifecycle;
SQL owner/owner_id and all 68 user_metadata fields are NULL. The original API's
empty-string bucket owner remains explicitly distinct from SQL NULL.

Helpers prepare one-attempt, x-upsert false POSTs, exact-byte download checks and
private bucket creation; they contain no client/activation authority. No files
are uploaded. The configuration helper alone lacks manifest-path bijection;
the actual pinned manifest separately passes the blob loader's unique-path/ID/
content checks. A future upload planner must enforce exact bijection, actual
destination defaults/ownership and explicit NULL-metadata reconciliation. Do not
COPY managed Storage rows blindly.

Actual local result: `ff7bbe138ec30e85f003bcafc74df533bc6709b5ea4a46bd63fa170a9808a0d2`.
Separate encoder 16/blob 18/bucket 8/native-comparison 6 closed controls pass within
their scopes. Retained native source/finite evidence: 22 files/123,470 member bytes,
manifest `04fa3574b21b1bfe5fe9158135a3b5f5db8c77101a7c3c295debce4e26c7ea66`.
Encoder/file preparations have separate protected custody. Review packets contain
no raw customer values/passwords/credentials. Local unencrypted retention does
not establish off-site recovery.

## Oct21 empty API namespace committed; runtime verification incomplete

Actual source `67be` creates only locked empty `jazz_api_closed`:28 SQL requests,
strict 227/empty/effective-rights/managed preservation and one confirmed COMMIT.
One documented schema PATCH follows. The same frontend performs 18 requests in a
new READ ONLY transaction, verifies namespace/protected metadata/no overrides,
rolls back and closes. Frontend CA/hostname/TLS1.3 passes; upstream SQL SSL remains
separately false. Backend identity is stable within each transaction; equality
across pooled transactions is not claimed. No customer users/files are imported.

All 24 API GETs complete: both elevated roots return 200 with canonical root-only
introspection; four default User requests return 404/PGRST205 and 16 excluded-profile
requests return 406/PGRST106. Two non-elevated root 401 s fall outside R2's 403-only
expectation, so the result remains STOPPED. Legacy flag is TRUE. One guarded
setting rollback and pause pass; parent/child exit 1 with frontend-close acknowledgment,
77 management calls 52/25. Independent 05:12:07 eight-GET closure confirms exact
replacement INACTIVE and old settings unchanged. Paused target-config 404 is
unavailable readback; the parent's active readback supports setting restoration.

R2 had corrected the earlier zero-path assumption: PostgREST includes canonical
root introspection even for an empty schema. R3 recognizes bounded non-elevated 401
only as a root observation, retaining positive elevated 200/default/profile gates.
Supabase documents the [non-elevated root restriction](https://github.com/orgs/supabase/discussions/42949);
actual 401 status/body comes from this run, without identifying hosted gateway
build or denial cause. Original outcomes and spent markers stay unchanged.

A distinct source `67be` continuation reuses the namespace with no DDL/COMMIT:
two 18-request READ ONLY transactions verify current namespace, strict 227/rights/
empty/managed/overrides, roll back and close. R3 recognizes the first 401 and the
default User 404 passes. Third GET receives no headers/body before its five-second
deadline (5,015 ms); the matrix remains incomplete. The capture identifies no
DNS/TCP/TLS/server cause and does not show whether the provider received the
request. The generic incomplete-response label does not establish malformed or
oversized provider JSON.

This continuation remains STOPPED: 101 management calls 58/43, three public GETs,
one guarded configuration rollback/pause, child exit 1/frontend-close acknowledgment.
Final 05:28:05 and independent 05:30:48 seven-GET closure confirm replacement/
production INACTIVE, preview healthy and old settings equal. No production change,
customer import, serving or cutover. Full selected-credential API verification,
authenticated-user/GraphQL scope, actual account/file continuity and October 13
recovery-point qualification remain open. Next: bounded transport diagnostics
and a separately reviewed fresh GET scope, preserving all receipts/reservations.

Original parent results: `101ab7666d9f26c983e586dc77e1e890c2f670b63ed37cbbd50ec096311c8bf2`
and `6609137e7953e21a138da411a8870ac24f0e1af33246ce98d994da90154ee7d3`.
Latest independent closure:
`f8eace48a84a6c196711c2948d9c726ca3b5830782784fd512a150f3365aae92`.
Separate source/finite custody packets retain 67 files/680,734 member bytes
(manifest `334415b5b67bbb59ab39fa46965f91f00063ab04406b4cdf063017a4c43c7971`)
and 52 files/474,830 member bytes
(`f097d60a3e3f4558ded8cce67bd2fca1cf7e5a40a5452a1f1f87021cbb37f080`).
Actual enabled plans, credentials, provider bodies, SQL query results/derived
guards and public CA stay outside these review packets. Closed checks 19 per
lifecycle/R3's 27 and independent reviews are distinct from actual outcomes.

## Oct21 persisted schema and managed catalog verified

Fresh source `0769a01` read-only verification passes after a new replacement
resume. Python performs18 query requests in one REPEATABLE READ READ ONLY
transaction: actual identity, strict26 tables/four RPCs/227 columns, effective
rights/empty-data guards and managed-state preservation against the authenticated
original baseline. The strict verifier uses the real current catalog and pinned
original SQL; no discarded R8 catalog is reconstructed. Final identity/metadata,
ROLLBACK and client-close checks pass. The independent Node session performs
eight requests, captures344 managed columns and four bounded catalog queries,
then rolls back and closes. The two sessions have separate backend identities.

Both clients use the unchanged reviewed route/credential and verify the frontend
CA/hostname. Upstream SQL TLS remains separately observed false. Neither executes
DDL, COMMIT, customer import, Auth operations or mail. Parent/child exit0, with77
management calls (50normal/27closure), one resume/pause and two zero-candidate
process scans. Final04:08:57.603 UTC confirms replacement INACTIVE and original
observed settings equal. Independent04:09:08.445 seven-GET closure confirms the
exact paused target, production INACTIVE, preview ACTIVE_HEALTHY and unchanged
old settings, with no POST/SQL/replay. API containment/cache health remain open.

Offline comparison of that actual catalog finds four relations,26 constraints,
all25 source indexes and one enum exactly equal within the selected projection.
Four additional destination `auth.users` indexes are separately reviewed:
`idx_users_created_at_desc`, `idx_users_email`, `idx_users_last_sign_in_at_desc`
and `idx_users_name`. All are nonunique platform-owned btree indexes; the last
uses the JSON name text expression with an IS NOT NULL predicate. Exact key/
predicate ASTs and catalog flags match the explicit reviewed forms. They add no
primary/unique/exclusion rule and remain untouched. The original four-difference
result is preserved beside that acceptance. This proves selected definitions,
not successful insertion, login, storage upload or whole-platform equivalence.

Actual local PG17 testing exposes the old projector's non-CHECK `noInherit`
expectation. A one-line derivative fixes that projection while preserving all
four query bytes; actual catalog capture/read-only write rejection/rollback and
owned-fixture cleanup pass, with six mutation controls. The hosted verification
package's25 Python/18 Node closed checks and independent source review are
distinct from the hosted results above.

| Original finite receipt | SHA256 |
| --- | --- |
| Parent terminal result |`baeea48705e2e56c65d4fb4a1e3a079ea4fd065460b0ec220f7008e78d2ba30c` |
| Both-client result |`e9a907863b2bc5619de6b106e0da514c88a25cd6d923fd471ec8c724012e0f96` |
| Independent paused closure |`884123ed8fdb53943c3b3da72ed394c639b62408d3c0c442079ebbae61810ae0` |
| Original managed comparison |`2cc1e9ab0e93b3747dc049e2707236267b850b808a06ce5d9478ca6c096fd53c` |
| Separate four-index acceptance |`2f1df950c9900e963da97e212046d74c95f0c04c8371514ca8ad33e3d14f5b6d` |

Independent actual-evidence review finds no material issue, rehashes all17
private Python receipts and verifies the original result/closure/catalog links.
Its finite receipt is `a09352c482ce8bba3a1a55b9c5aee09d298ba167ca9b5a9e6511eb3544f07c73`.
Owner-only durable packet `review-checkpoint-persisted227-managed-20261021`
contains61 files including its manifest,463,811 member bytes; manifest
`e0f3b36f3a5092db7365bebd9c5e20684df21683772411101caf36a08cfaa4c7`.
It is source/finite evidence, with original private captures and executable plans
excluded; it is not a complete execution/recovery bundle or off-site backup.

Next: mapped customer restoration and actual Auth/Storage continuity, with
recovery-point qualification, hosting and serving gates still open. Original
private metadata/derived SQL, credentials and active plans stay outside retained
source/finite review packets. No customer import or production cutover occurred.

## Oct21 source accounts and application model continuity

An offline memory-only selected export checks185 rows from eight archive tables.
All14 Auth/public users have matching original UUID/email linkage;16 identities
and seven purchases have no missing user/course/voucher references or detected
key collisions. Eight email/eight Google identities match their associations.
Roles remain13 USER/one SUPER_ADMIN. Auth confirmation exists for12 accounts
while all14 public records have emailVerified: preserve the two disagreements
for review. Nine password fields classify as bcrypt and five as empty/null;
destination password/Google login remains unverified.

The personal owner address has no source match. A separate public.User-only
follow-up finds the original SUPER_ADMIN matches a second explicitly controlled
project address. It exports no further Auth rows and grants no role/session or
recovery authority. Destination identity/access still need verification. Raw
customer values/hashes, addresses, password hashes and provider JSON are not
retained in these reports. Nine offline controls pass; the initial incorrect
enum-role assumption remains beside the corrected TEXT role contract.

Independent static comparison covers all23 current Prisma models,202 scalar
columns, five ordered enums and23 FK endpoint relations against expected227.
Five mutation controls pass. The generated schema differs only in
generator.output outside its28 exact model/enum blocks; the initial whole-file
equality failure is retained. This is static model coverage, not live ORM,
precision/default/index/check/FK-action or data-value equivalence. Extra tables
and columns remain preserved.

Owner-only durable source/finite packets under the maintenance backup root:
`review-checkpoint-source-customer-continuity-20261021` (manifest `a745f366…`),
`review-checkpoint-controlled-address-continuity-20261021` (`80ad395e…`),
`review-checkpoint-current-prisma-restoration-20261021` (`14233d3c…`) and
`review-checkpoint-current-prisma-peer-review-20261021` (peer receipt `3e3c343e…`).
Local unencrypted retention does not establish off-site recovery. The October13
recovery-point qualification and actual import/Auth/Storage gates remain.

## Oct21 empty replacement schema committed and paused

R8 on application source `22cc57c` now completes actual hosted schema setup on
the existing isolated Free replacement. Its 42 SQL calls perform the guarded
225-column bootstrap, permissions hardening, additive currency migration and
strict 227-column/effective-rights checks in one transaction. The positive
backend PID/transaction ID stays stable; the sole COMMIT is confirmed, the final
verifier completes and the client closes. No customer rows, imports, serving or
cutover are authorized or performed. This is not a production deployment or a
separate post-commit persistence check.

Parent and child exit0. The parent uses65 management calls (43normal/22closure),
one restore/pause and two zero-candidate process scans. Final03:31:00.821 UTC
confirms the replacement INACTIVE and original observed settings unchanged.
Independent03:31:59 seven-GET readback confirms its exact identity/paused state,
production INACTIVE, preview ACTIVE_HEALTHY and the original settings equal.
No second write or SQL replay is used for that readback.

The preceding R7 stop remains immutable: it connected but the route attestor
rejected the client before SQL (queries/commit/rollback0, NOT_ATTEMPTED, closed).
Its conservative parent `ddlMayHaveRun:true` is preserved separately from those
facts. Independent closure passes. Exact local D6/psycopg3.3.6/libpq180006 testing
then reproduces the original guard rejecting psycopg's internally resolved
`hostaddr`; the repaired guard accepts the same TLS connection and still rejects
an untrusted CA. Only that peer-fact predicate changes; exact hostname, port,
user, database, options, CA/TLS and pinned-driver input provenance remain checked.
E2/V6/D7 pass40/39/37 closed controls; R8 passes59. Neither the local proof nor R8
success recovers R7's uncaptured parameters or the earlier R6 exception.

Original R8 parent/result/independent-closure SHA256s:

- `e970023649464a739f68070b9db6819b1f385ff0bcf13dd4a1687e3f2ba190a3`
- `479dc65ea5c6a0b616943263378d8b7430d76e9f0242a9af33bb82255aa36bb9`
- `5c2a12f226680b4552499f314ab853b578c264612205cc8bd2165bea9b8c8e66`

Owner-only local source/finite custody under the maintenance backup root:

| Package | Files including manifest; member bytes | Manifest SHA256 |
| --- | --- | --- |
| `review-checkpoint-route-attestation-repair-r7-closure-20261021` |61;458,395 |`22507ded07c6b4a878287fc7b330d17d782832dd6c56a1bfa7393f972ca80b2e` |
| `review-checkpoint-hosted-empty227-20261021` |55;447,596 |`9eddf590547f752a61782b6f827736e08e21a054ad26039870f6564429ebc52d` |

Raw provider/Auth responses, credentials, executable plans, customer rows and
raw SQL function bodies stay outside these packets. Retention remains local and
unencrypted, without established off-site recovery.

The fresh persisted227/managed-catalog verification now passes as recorded
above. This R8 checkpoint itself contains no post-commit query or managed-catalog
capture; its original result and spent actions remain unchanged.
Customer restoration, account/password and Storage continuity, recovery-point
currency, API containment, stable free hosting and remaining preview journeys
still require verification. The improved application remains unreleased.

## Oct21 hosted client comparison passes

A fresh, separate read-only scope on application source `e3f5796` now verifies
both database clients against the existing replacement. The TLS-only probe sends
one eight-byte PostgreSQL SSLRequest, verifies the CA/hostname with TLS1.3 and
closes before Startup/authentication. The exact unchanged D6 psycopg connection
factory then passes BEGIN READ ONLY, one identity query, ROLLBACK and close.
Node `pg`8.23.1 uses the same provider-selected PRIMARY6543 route, CA and original
credential; its four statements add a fixed Auth/Storage column-catalog query.
Both clients verify PG17/postgres/non-superuser/BYPASSRLS/read-only identity and
frontend TLS. Upstream SQL SSL is separately observed false; end-to-end TLS is
not established. No customer rows, function bodies, DDL or COMMIT are requested.

The Node capture contains344 column definitions, retained only in its original
private file. This supplies actual type/default/null/generated/identity metadata,
not constraints, enum labels, managed import compatibility or customer continuity.
The earlier R6 exception was discarded and its cause remains unknown. Today's
success requires no connection-parameter change or credential rotation; it does
not retrospectively diagnose that failure.

The parent uses79 management calls (45normal/34closure), one restore, one pause,
two zero-candidate process scans and one child. Both clients confirm rollback and
closure; the child and parent exit0 without termination. Final02:45:17 UTC
confirms replacement INACTIVE and original observed states/settings unchanged.
A separate seven-GET root readback independently confirms the exact paused
replacement, original production INACTIVE, preview ACTIVE_HEALTHY and all old
observed settings equal. No extra POST/SQL or closed-window replay occurs.
Hosted schema preparation, customer import, serving and production release remain
unverified. Next: the reviewed atomic227 setup using fresh transaction evidence.

Original finite receipts:

| Receipt | SHA256 |
| --- | --- |
| Parent terminal result |`030850bf4e03b305356028ed702235bdca752132615cc6f21cebea2b3c9baa1d` |
| Both-client result |`d8e4015640cee0c5bc9a65880ebbada7356e2bea342e46e53fc51c3e1c5f1368` |
| Independent closure |`c339077122b989dea43ba338d00f446876d3476326daf0d672be9440c071b727` |

The comparison source passes18 Python/12 Node closed controls, including actual
local IPC and unmodified original R6/separate closure receipt integration.
Provider/TLS/client fixtures in those tests are synthetic; the actual hosted
results above are separate. Root catches the initial mistaken `paused:true`
predecessor assumption before activation. Original R6 remains `paused:false`;
its independent closure receipts are composed without rewriting it. An inherited
read-helper/hash argument failure is also preserved and repaired before use.
The two inert templates remain inert; original enabled inputs and spent markers
are not reusable.

Owner-only local source/finite custody retains44 files/293,167bytes under
`review-checkpoint-hosted-connection-comparison-20261021`, manifest
`759163b65f28a374e91b819aaf13ec6feb69718535c5fa6b4f70ef1985b1f996`.
Raw provider/Auth/process/column inputs, credentials and enabled plans are
excluded. This is local unencrypted retention, not off-site recovery.

## Oct21 explicit archive mapping and source file consistency

The offline mapping accounts for all65 COPY tables/2,239records. Candidate
source accounting is1,690:1,587public business rows,30stable Auth user/identity
rows,69Storage bucket/object rows and four historical Prisma ledger rows handled
separately. Exclusions total549:319transient Auth rows and230managed migration
rows. The two archived sequences belong to omitted transient tables; keep the
destination sequence state. Three separately rehearsed official Prisma
acknowledgements are not part of the archived1,690 and require their individual
postconditions. The original225 public columns map unchanged to planned227;
the two new payment fields remain explicitly NULL.64 COPY column lists are
corroborated; empty extension-owned `vault.secrets` has unknown source columns
and is excluded. Root independently reproduces the complete mapping and rehashes
both631,584-byte archive copies against the original expected artifact hash.

A separate memory-only export selects six exact TABLE DATA entries/167records,
with no Auth tables. All68 Attachment references resolve through the current
TypeScript path extractor to68 distinct retained objects, with no missing,
ambiguous or unreferenced objects and no name fallback. All68 archived object
IDs, versions, paths and byte metadata match the Storage export. Both owner
fields are SQL NULL on every object; preserve NULL without substituting an actor.
No project-host rewrite is indicated by these relative Attachment references.
One Course image is an external HTTP URL;15 lesson video references are opaque.
These classifications do not establish external-image or Mux health. Rich text
and fields outside the selected explicit references remain unreviewed.

This checks source consistency; blob bytes are not reread in that review.
Destination upload-generated IDs/versions/timestamps/owners, managed constraints,
Auth continuity and actual restoration remain gates. The October13 non-atomic
recovery-point/export-to-pause qualification below is unchanged. The first export
attempt's unsupported pg_restore flag and the first owner report's NULL/empty
grouping remain preserved beside the corrected reports.13 parser/exact-extractor
controls and five owner controls pass; no database or provider call occurs.

The subsequent offline comparison of the actual344 destination columns against
the original schema finds all344 types/nullability/generated/identity shapes
equal across35 Auth/Storage tables, with no missing or added columns. Default/
generated-expression comparisons are exact for343 columns; the remaining difference is
equivalent quoting of the omitted refresh-token sequence reference. No type
casts or added-column transforms are indicated. Exclude the three generated
columns (`auth.users.confirmed_at`, `auth.identities.email`,
`storage.objects.path_tokens`) from inserts. Nine declared old-flow resets map
to four empty-string, four NULL and one zero value. This is a column/default
compatibility result, not an account/password restoration or login proof.
Fifteen columns in two non-imported tables have physical attribute-number gaps;
explicit name projections avoid equating those numbers with dense dump positions.
All four imported focus tables' column ordinals match. Six offline mutation
controls pass; they are not hosted restoration tests.
Destination constraints and labels of the ten source enum types are not
captured; those checks and actual hosted schema/import remain open. Raw column
metadata stays private; no customer row or credential is read by this comparison.

Owner-only local review custody:

| Package | Files/bytes | Manifest SHA256 |
| --- | --- | --- |
| `review-checkpoint-customer-data-mapping-20261021` |8/664,651 |`4dfa5697774c0dba9c81501fdac750ad1d8138bc8fca1fd454d0792d03ee4261` |
| `review-checkpoint-customer-storage-references-20261021` |18/117,548 |`02b1578e869ee6d138a794752aac544526828b5fe71ff901bf2694ac60e5427e` |
| `review-checkpoint-managed-column-compatibility-20261021` |14/72,708 |`6a6b8ecb73894aac963dab6e96b9c08617e0362f13bdfc7eeb62894c29fafe7a` |

These packets contain source/metadata/finite descriptors, not customer rows,
raw URLs/UUIDs/owners, blobs, password values/hashes or credentials. Local
unencrypted retention does not establish off-site recovery. Source archives and
private configuration remain separate. [Recovery-point limits](#customer-recovery-point-and-restoration-rehearsal).

## Oct21 hosted attempts and independent closure

Before the successful R8 checkpoint above, the replacement was empty and
INACTIVE and hosted schema preparation had not succeeded. The original customer
backend was INACTIVE and the preview ACTIVE_HEALTHY. No customer import, cutover
or application release occurred in these earlier scopes.
The 02:09 UTC public HEAD checks still return503 `DEPLOYMENT_PAUSED` on both apex
and `www`. These are timestamped observations, not continuous monitoring.

The R3 process classifier initially rejects seven actual maintenance processes.
Root traces this to short reads of Linux procfs network tables: a plausible
4,049-byte prefix omits sockets present in the complete 58 KB table. R4 reads both
process fields and classifier tables through EOF or cap+1, without exempting
unknown processes. Its 57 closed cases pass; the same pre-fix cases retain seven
failures. Root's actual 01:08 scan finds zero unresolved candidates across 69
same-user processes/10 running containers/37 container PIDs, with four verified
tools and one verified waiting shell. This is a local point-in-time observation,
not an all-users/all-machines or future-lease claim.

Root then catches an integration contradiction before activation: the child
injects two PG environment variables which the real driver prohibits. R5 removes
only those entries. Actual subprocess tests with the unchanged real driver
reproduce the old rejection and pass that guard after repair; they deliberately
stop at a synthetic invalid CA before credentials/network/SQL. The 39 closed
parent controls are not a live database proof.

The actual R5 lifecycle reaches two healthy observations, passes both fresh
process scans and verifies child READY. All seven original provider responses
arrive, but Python rejects the provider's literal `[YOUR-PASSWORD]` URI template
before child activation. The scope uses 65 management calls (43 normal/22 closure),
one restore/pause and zero public probes. The child closes without activation;
no driver config/journal or SQL executor starts. Final 01:29:50 verifies pause and
equal original observed settings. The finite parent summary has SHA256
`335510c69fb2f894d987ef870f76390e8fc53e0b1202e11fc72d237c85c08a9c`.

The separate R6 parent and V5/D5 derivatives encode only that exact password
placeholder in a parsing view. Original response bytes, aliases, target/PRIMARY/
transaction6543/user/database checks and structured connection arguments stay
unchanged. This matches the documented [Supabase pooler template](https://supabase.com/docs/guides/database/connecting-to-postgres).
Their 45 parent/39 verifier/24 driver controls pass. Historical replay of the
seven actual R5 receipt/body pairs passes both the parent handoff and the real
verifier builder, preserving original hashes/timestamps. The parent replay uses
synthetic process/review fixtures; the verifier replay uses the original process
capture and static review. Both use an explicitly historical clock and provide
no current lease or hosted SQL proof.

Actual R6 subsequently passes two fresh process scans, child READY, seven fresh
provider captures and real source-evidence construction. Its one real psycopg
connection attempt fails before executor entry. The finite result records
`CONNECT_ATTEMPTED`/`FINITE_DRIVER_FAILURE`, no returned client, no executor entry
and `NOT_ATTEMPTED` commit. The error body/type/SQLSTATE were not retained, so its
cause remains unknown. The earlier successful hosted inspector used Node `pg`;
the local psycopg executor rehearsal did not prove this actual TLS connection
function. Do not infer a password, certificate or provider defect from the
generic failure or replay the connection to diagnose it.

R6 uses 82 management calls (57 normal/25 closure), one restore/pause, one child
and zero public probes. The child exits1 without termination; observed original
settings match. The pause POST returns200, but the 18-poll observation ends at
PAUSING, so the original parent retains
`ATOMIC_CLOSURE_REQUIRES_INDEPENDENT_READBACK` and its conservative
`ddlMayHaveRun` flag. The actual source-bound driver never enters the SQL
executor; that flag is not evidence of DDL. Independent seven-GET readback at
01:48:08 again verifies original settings/states and PAUSING. One subsequent
GET at 01:49:47.598 confirms the exact owned replacement INACTIVE, without another
POST, driver invocation or SQL. The original result is unchanged; final pause
receipt SHA256:
`86d40faff1e885115654df9a9b12d895cbce732fb87e3cd2fc09f1c2648fd05a`.

The exact unchanged D5 connection function subsequently passes a real local
PG17 TLS test with psycopg 3.3.6/libpq 180006, generated localhost certificate/CA,
verify-full, dict-row/autocommit/initial-IDLE and matching structured route.
The client closes without any SQL after connection. The same function rejects
an untrusted CA with OperationalError; no raw error is retained. The owned
read-only/tmpfs container, loopback listener, setup socket and generated keys are
removed. A first staging failure is retained separately and proves no driver
defect. This verifies the local API/parameters, not the hosted failure's cause.

A separate D6 derivative now adds finite connection-stage type/SQLSTATE/errno
and bounded known-phrase categories. Its 37 closed controls pass, including
secret/DSN omission and unknown/oversize/custom input rejection. Root independently
checks that the connection function and every other original function except
the diagnostic caller remain byte-identical to D5. No parameter, retry or TLS
change is made. The earlier type-only candidate and 32-case result are retained.
Final D6 source SHA256:
`6c68c221e07519cc3b8ec8b3f1a12688b7498c20f67f1e537bd17ea72946ec40`.

Next prepare a separately bounded read-only hosted connection diagnostic with
fresh process/provider/readiness evidence and mandatory pause. The old discarded
error cannot be reconstructed. Do not substitute local success for hosted proof,
relax TLS verification, guess parameter changes or reuse spent scope markers.

Selected source/finite custody excludes credentials, raw provider/process/SQL
inputs and enabled plans. All files rehash with 0700/0600 permissions:

- Process/R4/coupon IPC package: 93 files/637,360 bytes, manifest
  `bdefa00252b5e4a714382255b7510318d368fc8c9dbb4357a9a4feba984ce45f`.
- Closed R5/recovery-point package: 31 files/196,748 bytes, manifest
  `95490efdcd78be4f65018e3644baf56839773d1ca1d53d7755bbd049769c9df0`.
- Closed R6/V5/D5 package: 69 files/426,033 bytes, manifest
  `db461af6d4053d371e45ccece33410ce9d92dd223483e1d13513bba833bf148b`.

These are owner-only local unencrypted review copies, not off-site recovery.
The four-case coupon parent/worker IPC rehearsal also passes with synthetic
Next/runtime boundaries; it proves neither a live server nor a coupon checkout.
The subsequent local stack closure and exact-driver TLS/D6 proof are recorded
below; they do not establish production availability or complete machine-wide
ingress closure.

## Oct21 old local test stack closed

Fresh Docker metadata identifies the five October12 siblings as Storage,
PostgREST, GoTrue, Mailpit and PostgreSQL17.11. The exact six-member namespace
includes the already-stopped Kong gateway. Both project/workdir labels, owned
project ID/config hash, creation/image/start/PID and named-volume identities
match. Observed established connections are stack-internal only. Root and all
three current agents confirm no test dependency. Immediately before stopping,
root rechecks 67 same-user processes: no argument/client references, unreadable
processes or cwd references to this package, and no host established connection
on the published ports. These checks do not exhaust Unix-socket, other-user or
future consumers. Mailpit and Postgres each have two non-loopback published
bindings before closure.

At 02:03:39 UTC root records one durable intent, then issues one exact-ID batch
stop for five containers. It exits 0. Immediate and independent readbacks verify all five
objects stopped/PID0, runtime ports empty, original port listeners zero, declared
static metadata/owned project config hash preserved, Kong still stopped and
unrelated container inventory states unchanged. Volumes/container objects are
retained; no remove/recreate/prune, SQL, provider or requested configuration
operation occurs. PostgreSQL shutdown may write its volume; no volume-byte or
whole-configuration equality is claimed. Restart is prepared only for these
acknowledged stopped objects, database first, and was not executed.

The original operator conservatively retains `STOP_OUTCOME_UNKNOWN` because its
stdout exact-ID-set comparison is false and raw stdout was not retained. Do not
invent an output-format cause or replay the stop. Independent stopped-state
receipt SHA256:
`115f90df0801689a9b51fabaf65e716a0443b47681e06caed6d155e0ccfe40cb`.
An earlier helper basename shadowed Python's standard `operator` module before
project input/service calls; original bytes and finite failure are retained,
and the corrected filename passes inert startup before the sole actual stop.
The earlier Kong aggregate-config qualification remains unchanged.

Exact-ID restart inputs are retained separately in owner-only native recovery
configuration. Selected local TLS/D6/cleanup source and finite receipts rehash as
36 files/219,706 bytes, manifest
`0e07e7c147bbe4e1d0208ee5702f03fa799eee6d86f442fd7f4fb9bd035567cb`.
The package excludes generated keys, raw provider/config/process bodies and
private rollback/activation inputs. Retention remains local and unencrypted.

## Customer recovery point and restoration rehearsal

Independent review and root rehash establish the October 13 archive as the latest
verified retained export, not a proven latest customer recovery point. Its TOC
header is 13:54:45 UTC; the pause request starts 14:02:44.801629, about 7 minutes 59.802 seconds
later at the header's one-second precision. The file mtime gives a separate
7 minutes 48.277 seconds interval. Neither is the exact database snapshot or pause-completion
instant. No quiescence barrier or final source comparison covers that gap.
Database/Storage exports are explicitly non-atomic and roles are separate.
No later intentional production resume/mutation is documented, but the available
observations are not complete mutation telemetry. October 20 encrypted copies
preserve the October 13 bytes; they are not a newer recovery point. Existing
paused-backup metadata supplies no usable current downloadable export.

After empty hosted schema preparation succeeds, a restoration rehearsal can use
that immutable archive with explicit accounting for all 65 COPY tables/2,239
records/two sequences and 68 blobs/6,423,774 bytes. Map old public 225 columns
explicitly and leave the two new canonical payment fields NULL. Preserve UUIDs,
timestamps, learning/entitlement/message/payment/webhook/voucher facts; reconcile
migration history without replaying migrations. Compare managed Auth columns,
preserve user UUID/password hashes/identity associations, account for transient
session exclusions and require re-login under destination keys. Preserve
destination managed roles/extensions/migrations/hardened rights instead of
restoring old roles/ACLs. Verify every private bucket/path/blob hash and account
for destination object IDs/timestamps; database metadata alone restores no bytes.

That rehearsal does not establish authoritative customer cutover. Cutover still
requires a newer preserved source or an explicitly accepted October 13 recovery
point, plus hosted Auth/Storage and preservation/continuity checks. Finite
recovery-point review SHA256:
`ecef1489d52aa616dd0ed7fe82a61c5c67d583a69150912d98118f9c1f271709`.

## Complete capability review and transaction rehearsal

The complete actual capture below passes independent review of all 300 default
ACL entries, 24 memberships, 60 schema-role privileges, 30 roles, five extensions,
six event bodies and three Auth helpers. Browser roles have no privileged
membership path or schema CREATE. Existing public default grants still require
the explicit revocation and final effective-rights barrier in one transaction.
Managed capabilities are preserved; this review does not certify the whole
provider platform or authorize customer import/serving. The finite review hash is
`c658072a1a5ff7fca929419c843bae173fa33b4c2d45c40e420ebaeb04eb6076`.

Separate transaction-only compiler/executor derivatives now preserve the original
advertised6543 route and begin before all SQL metadata. Their 44/35 closed tests
pass. Actual local PG17/psycopg execution verifies durable intent before the first
SQL/sole BEGIN, 12 same-positive-PID/XID samples, 42 SQL calls, one COMMIT,
26 tables/227 columns and all four effective-rights predicates. A separate final
verifier rejection has 40 guarded calls plus one cleanup ROLLBACK, 11 stable
identity samples and zero public structure afterward. Managed metadata matches
in both cases; actual multi-result queries are drained (up to318 result sets).
The owned network-none/no-port container and socket are removed. Provider/TLS/
verifier inputs in this rehearsal are synthetic; no hosted DDL follows.

An actual static-baseline preflight catches a verifier integration defect before
any provider/SQL call: its blanket256-row receipt bound rejects the captured
300-row default ACL query. The frozen failed source and finite failure are
preserved. The separate R2 accepts up to4096 rows only for that exact baseline
query; runtime/other-query bounds remain256. Its27 verifier/20 driver closed
controls pass. Root independently verifies all54 actual receipts/300 ACL rows,
actual Auth definition aliases/hashes, canonical payloads and source lineage
without truncation, provider calls or copying raw inputs. Acceptance receipt:
`5afdeabdf6c324e26b22a923a2dd9c1b53e8c5b766f33dbd8ec1b51c923b8698`.

Actual local PG17 integration also passes with the real R2 source builder/plain
verifier and unchanged transaction compiler/executor:42 SQL/one COMMIT/final227/
all rights/12 stable identity samples. An incorrect final225 claim is rejected
as `FINAL_RECEIPT_CHANGED`;41 calls including the sole ROLLBACK leave zero public
structure, preserve managed metadata and retain11 stable samples. Five actual
multi-result calls per case drain up to318 sets. Clients/container/socket close.
Provider/process/static-review/frontend-TLS fixtures remain synthetic; the
public hosted attestor is not bypassed for an actual provider connection.

Actual R2 process inspection observes71 same-user processes,11 containers and39
container PIDs, with eight conservative candidates. Project-directory Codex
tools/idle shells need source-bound classification; the owned local Supabase
Kong gateway is subsequently closed as recorded below. No zero-application
claim, arbitrary PID exclusion or live schema execution follows until a fresh
reviewed classifier passes. Local observations do not establish remote
reachability or cover other machines.

Selected sources and finite outcomes are retained as105 files/919,825 bytes,
manifest `1344877be3717b633ffd0ed8e5aea0d41ad2d5c4fb4e01ab0b301ce9ef06c1ac`.
Raw hosted definitions/provider inputs, credentials and enabled plans are
excluded. Owner-only local unencrypted retention is not off-site recovery.

A second selected70-file/545,969-byte package retains the repaired verifier/
driver, real-verifier local rehearsal, root actual-baseline retest and qualified
local gateway closure. Its manifest is
`d958ac7a375c4c367db045fa3b07032ad3a76bae3312f6be7c38c841ff801b7a`.
Raw synthetic HTTP/baseline fixtures are excluded; the runner regenerates them.
The exact-ID local gateway rollback input is retained separately from review
evidence. A source-only lifecycle candidate passes22 closed groups (16 synthetic
management/process/driver cases plus six real local subprocess/IPC cases).
Its original7-response capture/READY/one-activation/mandatory-pause contract is
not actual hosted startup proof. The reviewed classifier/source graph and fresh
actual evidence are still required; no enabled operation plan is retained here.

## Unused local test gateway stopped

The separately identified Oct12 local Supabase Kong gateway has two non-loopback
published bindings and two RW binds to the same owned test configuration. Exact
Docker labels match its adjacent local project ID. Five namespace siblings are
separate services; this is a real gateway, not a log collector or coding tool.
Root confirms no current team test uses that old gateway and rechecks zero
established connections, exact init PID/start identity, created/image/name,
labels and owned mount/config identity before the one permitted stop.

At22:58:31 UTC, the sole stop command exits0. Immediate and independent readback
verify the same container stopped/PID0, no runtime published ports/host listener,
and all five sibling identities/states unchanged. The same-ID start rollback is
prepared; restart policy remains `unless-stopped`. No database, volume, mounted
file, sibling or provider operation is requested. External future consumers were
not exhaustively proven absent; closure is reversible.

The original result retains `STOP_OUTCOME_UNKNOWN`: its target aggregate-config
hash comparison is false and raw stdout was not retained to explain the exact-ID
output mismatch. The before hashes were not saved, so do not claim whole-config
equality or invent that cause. A separate readback proves stopped state and exact
core image/name/creation/labels/owned mount shape; it does not rewrite the original
result. Its hash is
`89adcc0024a195fb709c8eb0273e180c3768b0a972db3d2c1f095f8d40f85ff9`.
Earlier strict preflight failures precede the intent/stop and remain preserved.
No second stop, automatic restart or zero-application claim follows.

## Advertised transaction connection: complete metadata captured

The actual provider-returned PRIMARY transaction endpoint passes one
CA/hostname-verified connection. A single READ ONLY transaction keeps the same
positive XID/backend PID across 54 SQL queries and final checks. PostgreSQL17,
postgres identity, non-superuser/BYPASSRLS/login, all 49 Auth values and disabled
API settings pass. Client TLS is verified; the separately observed
pooler-to-database SQL SSL boolean is false. No end-to-end TLS claim follows.

Complete private capture now includes the exact source-bound catalog/managed
aggregates, 300 default-ACL rows, 24 memberships, 60 schema-privilege records,
six event-trigger definitions and three Auth helper definitions. Public schema
is structurally empty; all 34 inspected Auth/Storage/Vault/business relations
have no rows, active jobs and pending HTTP requests are zero, and the bounded
override inspection has no review flags. Full function sources stay private.

The sole ROLLBACK and client closure pass. The lifecycle uses 67 management
calls, one restore and one pause; terminal 22:26:35 UTC verifies replacement and
production INACTIVE, preview healthy and original observed settings unchanged.
Parent summary SHA256:
`ce6266ecc842b09d7cdbd59b7f16335ff14af6394142ec70e2e6d9d08a929202`.
The exact 326,887-byte private evidence hash is
`fa43bd9c71be3b8075b283da15ca4b2c60c4e944301d32f88ec00d6665b31a8d`;
it is excluded from review custody because it contains raw function definitions.

Collection success alone is not approval of every captured capability. The
subsequent independent review and transaction rehearsal are recorded above.
Earlier session-only atomic sources cannot be port-flipped. Actual execution
still requires fresh original provider/process evidence, the reviewed real
verifier/driver and one guarded bootstrap/hardening/currency/strict227 sequence
before the sole COMMIT. The probe's closed PID/XID never represents that future
operation.
No hosted DDL, customer import, serving or cutover occurs in this scope.

## Read-only connection attempts and the provider CA

The first bounded diagnostic resumes only the new replacement. Its health GET
returns400 because the optional timeout parameter is rejected as a string;
no SQL client starts. The sole pause returns400 while a platform backup is in
progress. The48 management calls and original failure are preserved. Independent
reads verify the replacement is active; omitting that optional parameter gives
health200 with db/db_postgres_user healthy and rest/pooler unhealthy. Empty
backup metadata does not prove that the provider's backup has finished.
Separate actual settings reads still match all49 Auth values, desired empty
schemas and the effective sentinel.

A new active-only continuation performs no restore. It reaches the actual shared
pooler using an explicitly documented derivation from its returned transaction
entry to session5432, preserving the original metadata. The default Node CA
bundle fails with `SELF_SIGNED_CERT_IN_CHAIN`, before authentication/SQL. The
connection closes, a fresh pause returns200, and independent20:38:31 UTC reads
confirm the replacement/production INACTIVE, preview healthy and identical
observed original settings. This stage uses43 management calls, zero public
probes and zero SQL; its spent scope/pause markers remain unchanged.

[Supabase's SSL guide](https://supabase.com/docs/guides/platform/ssl-enforcement)
requires its database CA for full certificate verification. The official
[dashboard configuration](https://github.com/supabase/supabase/blob/master/apps/studio/hooks/custom-content/custom-content.json)
publishes the certificate distribution template. The production certificate's
PEM SHA256 is `700723581420dd1ac98fd7e9ac529f0ef210eadcaf87fc868a3ad7d114c2f3b7`;
its DER fingerprint is `807025ad50d4ed219d2c9c7d299c004f824eb00cf7f65afef607d07b72e6cafa`.
Its CA flag, self-signature and2021–2031 validity pass. Actual20:36:52 TLS1.3
negotiation verifies chain and hostname on the same actual shared host and
documented session port, sends no database authentication/startup or SQL payload,
and closes both sockets. This proves that handshake only. It does not establish
tenant database identity, read-only SQL, managed emptiness or API containment.
Existing successful configurations are not replayed and TLS verification stays
enabled. A separately reviewed provider-CA diagnostic retains those remaining
actual gates.

That provider-CA scope reaches ACTIVE_HEALTHY, then the v2 configuration GET
returns401 while the v1 Auth/PostgREST reads remain available. It stops before
starting the SQL inspector. Its74 management calls include one restore and one
accepted pause; the original short observation ends at PAUSING. Independent
20:53:56 UTC reads subsequently confirm replacement/production INACTIVE, preview
healthy and original observed states/settings equal. The original stopped
summary remains unchanged; a separate closure receipt has SHA256
`75a85540748af11dab7c5db86b0703972c1ba246d63bf776bacc325ae158259c`.
No SQL, public probe, successful configuration replay or customer import occurs.

The next read-only derivative records allowed non200 effective-configuration
reads as explicitly UNAVAILABLE, with no known schema value or containment claim.
It also distinguishes mandatory verified client-to-pooler TLS from the boolean
SQL observation of the pooler-to-database leg. Both observations remain bound
to one actual session. Its18 lifecycle and34 inspector closed tests are
synthetic; actual metadata still needs independent review before any DDL.

That observation scope also closes before SQL, with62 management calls and
no public probe. Project metadata is ACTIVE_HEALTHY at21:05:52, but the detailed
health read at21:05:56 reports db/db_postgres_user/rest/pooler UNHEALTHY,
Auth healthy and Storage COMING_UP. All49 Auth values, desired empty schema,
effective200 sentinel and original transaction-pooler metadata match. The
diagnostic's `DATABASE_HEALTH_REQUIRED` prerequisite stops it before generating
SQL-inspector inputs. One pause succeeds; terminal21:07:37 summary verifies
INACTIVE and matching original observed settings. Source summary SHA256 is
`9d218b4dd41a1533b66073be389b46db96ea0d5859ecd8cbbf3df974ec8f6ed7`.
The cause of the differing health observations is not established. A read-only
SQL diagnostic must record them honestly and establish connectivity through its
actual verified connection, rather than require their prior agreement.

The subsequent SQL-observation scope establishes actual client-to-pooler
verify-full TLS, PostgreSQL17 and the expected non-superuser/BYPASSRLS postgres
identity. It counts seven SQL attempts; six result receipts retain identity,
30 role records and six managed event-trigger definitions privately. The flat
default-ACL projection exceeds the256-row limit, so inspection stops before
membership/schema/empty-data/override collection and the final identity recheck.
Cleanup rolls back and closes the client; one accepted pause and terminal
21:17:30 summary verify INACTIVE and original observed settings unchanged.
This scope uses66 management calls and no public probe. Its summary SHA256 is
`50fd4ad8fc6098e19feb2d9561d26501198548e7c9d56511d188fa9f0e2d76ad`.

The actual `pg_stat_ssl` observation is false for the pooler-to-database leg;
it is separate from the verified client TLS connection. No end-to-end TLS
claim follows. The later empty-only compiler revision preserves this boolean
and still requires actual client CA/hostname verification; it grants no serving,
import or cutover authority.

Independent private source analysis verifies all six captured function hashes.
Four handlers have extension-only tags and can otherwise change grants/default
ACLs/roles/functions; CREATE/DROP EXTENSION stays outside this bootstrap. The
two untagged PostgREST watchers contain catalog reads/control flow and a fixed
schema-reload notification, with no detected data DML, grants, dynamic EXECUTE
or direct HTTP. Notifications take effect after commit. Two bodies match pinned
official source bytes; four are not claimed byte-identical. The finite review
SHA256 is `0745def02491334dc9a47d4a2242f02f6d2d4a5e2b9ed175b6ce7b5e0f680e3f`.
This is a partial review; it does not approve missing default ACLs, memberships,
schema CREATE, Auth-helper provenance, overrides or empty-state facts.

A separate metadata-limit derivative allows4096 rows only for the fixed default
ACL query, with an overflow sentinel; other query limits remain256. Its20/39
closed checks pass. Actual execution nevertheless closes with a child exit1,
zero stdout bytes and2,414 stderr bytes; only the error hash was retained and no
child report exists. Its cause and actual SQL count are unknown. The parent's
64 management calls include one restore/pause; terminal21:28:39 verifies
INACTIVE and original observed settings unchanged. Source contains read-only
queries only; no DDL/import or public probe is performed. The original unknown
failure remains preserved. Next repair finite child/error reporting and collect
complete, source-bound aggregate metadata before any hosted schema operation.

The repaired complete-metadata reader passes 73 closed controls. Its actual run
now retains a valid finite child report: connection stops with SQLSTATE `XX000`,
zero SQL attempts, zero error events and a closed client. The project and database
health observations are healthy; REST/pooler remain unhealthy. No aggregate
metadata is collected. The 67 management calls include one restore and one pause;
the terminal 21:54:01 UTC report confirms INACTIVE and matching original observed
settings. Its SHA256 is
`ef372a9d4b5d3d37ca0e47c7e82a2d13a2d6c42e5938aca63f51b40b71123fea`.

Two separate GETs confirm the target is paused and query only aggregate pooler
logs for 21:51–21:54 UTC. Logs HTTP200 returns one event matching the finite
tenant-not-found category, with zero password-failure/connection-limit/timeout
matches. This is correlated evidence, not the discarded original client message
or proof of that request's precise cause. The next metadata transport is the
authenticated management SQL endpoint with explicit `read_only: true`; no
password reset, further pooler retry or DDL follows from the log observation.

The management transport then returns HTTP201 for its first actual read-only
identity query. With `read_only: true`, the observed user and session are both
`supabase_read_only_user`, on PG170011/postgres database, non-superuser with
BYPASSRLS/login and read-only enabled. Its SQL SSL observation is true. The
metadata reader expected postgres and stops after this one retained result;
it does not relabel the restricted account or collect complete provenance.
The 71 management calls include one restore/pause and one query request.
Terminal 22:17:32 UTC verifies INACTIVE and original observed settings unchanged;
summary SHA256 is
`c40b49aed607fc2a5d100a8a3f210181baa902a05928f41872184ed87ae394b9`.
This is a reader identity-contract mismatch, not evidence of unavailable SQL.
A metadata-only revision may accept the observed restricted account while
preserving its identity and all read-only/provenance constraints. The separate
next native probe uses the provider's actual transaction-pooler entry, rather
than the derived session port, with all SQL inside one READ ONLY transaction.
No DDL, import or customer operation occurs in the management scope.

## Whole atomic executor: actual local success and rollback

The frozen R2 executor passes28 closed controls and a separate actual local
PostgreSQL17 rehearsal using the real psycopg driver. The original executor's
failure is reproduced after strict227 verification: only the intentional
current-session `search_path` change differs. It performs no COMMIT and rolls
back to zero public relations/functions/types/columns. R2 permits only that
exact final session value, `pg_catalog`; persistent role/database settings and
all other protected metadata must still match.

R2 then executes the whole225→227 sequence with one BEGIN/one COMMIT and39
actual queries, producing26 tables/four functions/62 types/227 columns. Effective
browser table/column, schema CREATE and gated-RPC denial and trusted privileges
pass. A separate forced final-verifier rejection, after strict227, performs one
BEGIN/one ROLLBACK/no COMMIT and restores zero public structure. Managed metadata
is preserved and clients/container/socket are closed in both cases.

These are real local SQL results. Managed fixtures, provider/TLS evidence and
the rehearsal verifier are synthetic; they do not establish hosted safety or
authorize importing data. A real verifier and freshly captured hosted facts
remain prerequisites. The executor SHA256 is
`40e80da06c300a71735119465f2c3ebf204bda58d7bf5f56b5eff29a275c805b`.
Selected25 files/177,951 bytes are retained in
`review-checkpoint-empty-atomic-local-20261020` under the maintenance backup root,
manifest `d5f6beef610cfce965b807f61adddeabc5c1920f6ec83647419fd00732fbe1b5`.
No credentials or raw query rows are copied; local unencrypted custody is not
off-site recovery or activation authority.

Selected operational sources and finite outcomes are separately retained as
78 files/1,026,363 bytes in `review-checkpoint-hosted-execution-sources-20261021`,
manifest `ae1e97465c4558cc43c55ea3bce1194031567f10f239bec059f71a2853d148e1`.
This excludes the later management execution's actual raw outcomes and enabled
inputs. A separate runtime-dependency selection retains 21 files plus recorded
Python/package versions, including exact compiler/envelope/customer-free SQL
inputs; manifest
`6a0c55888b94f26a3daaca9d15095317adf2e3535b005ea026b8b423b6502d73`.
Neither packet establishes a complete restored test environment or off-site
recovery. Actual managed function definitions and customer archives stay private
and outside these review selections.

The separate read-only recovery checkpoint retains13 finite reports/35,156
bytes, manifest
`0c25b1d01d6f7231ef36f28bdc2f2be9f2ef644f111c14d64189376df8f50e6c`.
It excludes raw provider/Auth/DB/function bodies, credentials and active plans;
it is not complete operational-source custody.

## Free replacement: Auth verified; API readiness unresolved

One Free project is created: `klaiiikojgdfclzhqfgt`,
`Jazz-LMS-Empty-Replacement-20261020`, in the existing organization/eu-west-1.
Fresh preflight verifies Free/sole-owner membership, one active/one paused project
and an available region. The sole create returns201. Its server-created timestamp
predates that request by about67 minutes; the original timestamp-guard failure
remains preserved and unexplained. Independent reads verify the exact returned
ref/name/organization/region, preinventory absence and sole inventory addition.
No create is retried.

The new empty-schema PATCH returns200. Desired configuration is empty; effective
configuration contains `pg_pgrst_no_exposed_schemas`. Two Auth attempts expose
provider constraints:49 fields return402 for already-disabled paid hooks;47
return400 because OAuth enable/path fields must be paired. Both stop and pause
the exact new target. The first pause capture fails; independent INACTIVE reads
prove its effect without retry. Historical failed receipts stay unchanged.

A corrected fixed PATCH changes only email login, signup and site URL. It returns
200. Independent actual capture review verifies all49 intended Auth values,
every unrelated setting unchanged, the unchanged null OAuth companion, zero
third-party/SSO providers and no custom SMTP credentials. No Auth-user/send
operation or application launch occurs.

The first live zero-row public-profile request returns503/PGRST002, failing the
controller's expected406 profile rejection. The scope stops and pauses this same
project. Independent19:47:59 UTC reads confirm replacement/production INACTIVE,
preview ACTIVE_HEALTHY and identical observed original Auth/PostgREST settings
and states. Paused production's unavailable endpoints prevent an underlying
settings-equality claim. All actual operation handles are terminal.

Cumulative hosted-preparation usage through the19:47 checkpoint is135 management
calls and one public probe:
one create, one schema PATCH, three Auth attempts, two restores, three pause
attempts and read-only management calls. No application SQL, customer import,
payment, key creation/rotation, paid upgrade or cutover occurs. Password/ownership
recovery inputs remain separately owner-only.

Hosted SQL/TLS/roles, managed emptiness, schema bootstrap and customer restore
remain unverified. PGRST002 describes schema-cache database connectivity;
503 alone proves neither the actual cause nor runtime schema containment.
Investigate readiness and role/database configuration before further recovery;
do not replay successful Auth writes or assume a typed406 is guaranteed by the
sentinel setting. [PostgREST definitions](https://docs.postgrest.org/en/stable/references/errors.html).

The [official Supabase troubleshooting article](https://supabase.com/docs/guides/troubleshooting/schema-pg_pgrst_no_exposed_schemas-does-not-exist)
confirms that disabling DataAPI leaves PostgREST running with the sentinel and
can produce missing-schema errors. Upstream v14.1 checks cache availability
before parsing the requested profile. Mandatory406 was therefore an overly
strict controller assumption; it is not a universal provider contract. This
does not identify the actual cause of this503 or turn it into containment proof.
Next collect actual role/database schema overrides, callback configuration and
browser-rights evidence through bounded read-only inspection. No extra schema or
role workaround is applied merely to satisfy the old response-code check.

Selected source and finite outcome custody is retained locally in
`review-checkpoint-empty-auth-coupon-20261020` under the maintenance backup root:
145 files/1,337,499 bytes, exact source/copy hashes and0600/0700 verified.
Manifest SHA256 is `1a99e7c1c93ca01bd7832d938d03648efe52af6c752bd085abe921ae34c75998`.
Credential/raw provider/Auth/DB/browser bodies, enabled inputs and financial
reservations are excluded. The Dodo TEST key is not loaded for custody scanning.
This is local unencrypted review evidence, without off-site recovery or activation
authority; the separate new-project credential recovery files are not included.

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

### Customer-free recovery schema rehearsals

Two separate real local PG17 rehearsals now execute the reviewed public-only225
bootstrap, permission hardening, additive currency columns and strict227
verification. The first passes15 checks; the separate empty-only compiler
revision passes17, including wrong-purpose/import-authority and actual nonempty
Auth-row rejection. Each runs422 zero-row permission operations: browser roles
are denied and trusted roles retain their intended operations. Final structure
is26 tables/227 columns/93 indexes/74 policies/50 constraints/four functions.
Both network-isolated containers/tmpfs are removed. These overlapping runs are
local proofs, with synthetic managed Auth/Storage helpers and external receipts.

The separate empty-only compiler passes20 focused controls. It requires a strict
empty-schema purpose with imports/cutover/customer-row authority false and
actually rehashes public-schema lineage. It removes the inappropriate RPO
prerequisite only for empty preparation; customer import/cutover still needs an
accepted recovery point/current-data preservation decision. The frozen original
compiler and its later-data gate remain unchanged.

Neither Monster nor Behemoth has a default IPv6 route in the actual local
inspection. A separate session-pooler derivative passes24 focused synthetic
controls and retains every non-transport guard. It requires the actual returned
new-target pooler entry, verified CA/hostname and real same-session postgres
identity; metadata alone and SQL custom GUCs do not prove transport. No paid IPv4
add-on is proposed. These preparation results do not establish hosted restore,
customer-data compatibility or release readiness.

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

A distinct empty-replacement compiler now passes14 independently repeated offline
controls and parses all three generated SQL/PLpgSQL stages. It rejects the
production/preview refs and nonempty targets, preserves the logical225→227 guards
and requires six fresh provenance-verified receipts. This is source preparation:
there is no real target, faithful secret-free bootstrap rehearsal, executor or
hosted restore. Its currency derivative preserves the exact migration interior
inside added guards; it is not the literal migration file. The current-data/RPO,
managed Auth/Storage and hosting/cutover gates remain. No project is created.

## Hosting and refund work

The later18:32–18:36 UTC same-payment TEST recovery now captures the actual409
code `INSUFFICIENT_WALLET_FUNDS`; no refund is created, full8997 remains refundable
and the purchase is preserved. All29 original fingerprints/23 prior sessions,
four services/endpoint and full45,831-file seal/formal closure pass. A separate
one-GET ledger verifies the payment's historical credit8997/fee535/after8462,
not current account totals. A free merchant-sandbox balance remedy remains open;
no real funding or checkout/card replay. Historical409 cause remains unknown.
[Latest evidence](dodo.md#latest-oct20-checkpoint-captured-sandbox-wallet-denial).
The preparation checkpoints below predate this actual execution.

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
