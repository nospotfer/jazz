# Database and Supabase Data API security

Authenticated [manager inspection and approved recovery](supabase.md) identifies
the deployed feav project in Free Neurofactory Org, eu-west-1/PG17. It is now
INACTIVE after the approved rollback: brief recovery allowed private DB/Storage
exports and read-only inspection, which confirmed unsafe production grants.
No production hardening SQL or code release has been applied. Current
maintenance authorization is recorded in the root operating contract; older
approval labels below are historical. The [Oct20 recovery checkpoint](production-readiness.md)
identifies authoritative V4 → literal currency → strict227 sources and current
containment/target/TLS/preservation prerequisites. Vercel protection/pause is now
applied, but direct Supabase Data API containment remains unverified.

## Confirmed recovered production exposure

All 26 public tables have effective browser privileges. The payment-event
ledger and both messaging tables have RLS disabled; anonymous users have read
and write privileges. A zero-row anonymous HEAD on PaymentWebhookEvent returns
200, confirming the Data API exposes it without reading customer records.
Authenticated users have UPDATE privilege on User.role, and the existing
self-ID update policy does not restrict that column. These are actual
production metadata/API findings, not an inference from the local fixture.
No exploit write, forged role, entitlement or payment event was submitted.

The owner-approved same-project rollback restored backend unavailability after
the exports succeeded. Archives and current Storage bytes are preserved
privately; archived-data restore is verified with explicit extension ACL/platform
limits. The reviewed corrective SQL/release package remains separate. Four public functions exist, three SECURITY DEFINER
and browser-executable; their legacy access helpers require a scoped RPC review
alongside table/column grants and future default privileges. No public views or
foreign tables were observed. Storage contains one private bucket, not a public
course-file bucket. No compromise or historical data completeness is inferred.

The LMS uses Supabase for authentication and private object storage. Application
`.from()` calls found in this review target storage buckets; no application
table `.from()` or `.rpc()` queries were found. Course data, accounts,
entitlements, vouchers, progress, notes and quizzes use Prisma/server routes;
messages use server-side SQL. Browser access to their underlying tables is not
required by the current application.

## Earlier isolated exposure and regression proof

The dedicated Supabase maintenance stack (`127.0.0.1:56121`, database
`127.0.0.1:56122/postgres`) was created from the current Prisma schema using
`db push`. At 2026-10-12 23:29 UTC, all 23 Prisma model tables had RLS disabled,
no policies, and effective SELECT/INSERT/UPDATE/DELETE grants for both `anon`
and `authenticated`. The lowercase messaging tables had the same read exposure.
The trusted database connection was `postgres`, with BYPASSRLS and table
ownership, without superuser status.

Fixture-scoped GET requests returned HTTP 200 for both an anonymous request and
an ordinary student JWT:

| Endpoint | Confirmed result |
| --- | --- |
| `User`, filtered to a different synthetic administrator | One account row, including its role, readable. |
| `Purchase`, filtered to a different synthetic buyer/course | One entitlement/payment-reference row readable. |
| `LessonQuizOption`, filtered to one synthetic question | Option IDs and `isCorrect` flags readable. |
| `LessonNote`, `PaymentWebhookEvent`, `message`, `messagethread`, filtered to absent fixture rows | HTTP 200 with empty arrays, so table access was permitted; no actual private contents were inspected. |

Before hardening, browser modification privileges were confirmed through
PostgreSQL metadata; no exploit write was performed against the existing
fixtures. With RLS absent, those grants permit account role changes, forged
entitlements and data deletion without the application routes' checks. This is
a critical fresh-schema security defect. It does **not** establish production
grants, policy deployment, exposure or compromise. Production inspection is a
release gate and must remain read-only until a reviewed change is approved.
Sanitized local evidence is private at
`/tmp/jazz-maintenance/local-database-audit-before.json`.

Supabase documents that exposed-schema tables require RLS and that existing
projects may automatically grant browser roles access to new public tables.
Grants and policies are separate checks; policies do not remove grants. See
[Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
and [securing the Data API](https://supabase.com/docs/guides/api/securing-your-api).

## Legacy policy risks and migration gaps

Existing SQL is not a safe alternative to this fix:

- `supabase/migrations/20260305163830_security_hardening.sql:70` allows inserting
  one's own `User` without constraining `role`; line 82 allows self-update of
  the complete row. With browser table/column grants, either can introduce
  `SUPER_ADMIN`. Its admin helper reads that same role.
- That file's `Purchase` policy at line 210 permits a user to insert their own
  entitlement without payment verification; historical `LessonPurchase`
  policies similarly permit self-insertion.
- `supabase/migrations/202603200001_rls_quiz_voucher_and_system.sql:291` grants
  course holders row-level SELECT on quiz options, including `isCorrect`.
  Row-level policies do not hide the answer column. Other legacy policies let
  clients edit their own quiz attempt/answer/summary state and enumerate active
  voucher codes, bypassing the current server authority.

These are concrete source policy defects conditional on browser grants. The
local fresh stack did not have these policy/helper migrations installed. Their
recovered production self-update/role metadata confirms that risk; do not
reapply these scripts as a security fix.

The repository has separate Prisma and Supabase SQL histories plus standalone
messaging setup/hardening files. Prisma migration folders contain additions
such as translations, quizzes and the webhook ledger, but no complete initial
creation of core `Course`, `Chapter`, `Lesson`, purchase or voucher tables. The
first translation migration references already-existing core tables. The local
`db push` stack has no `_prisma_migrations` table. Thus `db push` success is not
evidence that a clean `prisma migrate deploy` or production upgrade is safe.
Reconcile the actual production schema and both histories, then prepare a
reviewed PostgreSQL baseline; do not reset production or auto-run legacy
SQLite/bootstrap scripts. See [Prisma's db push workflow](https://www.prisma.io/docs/orm/prisma-migrate/workflows/prototyping-your-schema).

## Scoped fix and required server-role precondition

`prisma/harden-lms-rls.sql` enables RLS and revokes all table privileges from
`PUBLIC`, `anon` and `authenticated` on exactly the 23 current Prisma LMS
tables. Effective table and column privileges are checked afterward; inherited
grants cause the atomic operation to abort for manual review. No shared role
membership is changed. PostgreSQL table revocation also removes corresponding
column grants. See [PostgreSQL REVOKE](https://www.postgresql.org/docs/current/sql-revoke.html).

The script adds no browser policies, uses no `FORCE ROW LEVEL SECURITY`, and
leaves existing policies in place with their direct client grants removed. It
does not change auth, storage, unrelated tables, shared-schema default
privileges, data, sequences or server grants. Messaging has a separate reviewed
script, `prisma/harden-messaging-rls.sql`, now using the same owner precondition,
PUBLIC/browser revocation and effective grant checks on exactly `message` and
`messagethread`. Both scripts are transactional and fail closed on inherited
access; review their production application separately.

**Before production application:** inspect the actual runtime Prisma connection
role. It must retain CRUD privileges and either own each target table without
FORCE RLS, or have BYPASSRLS. A separate non-owner role with only table grants
would lose access under enabled RLS; establish a reviewed server-only policy or
appropriate server role first. Apply as the owner/an inheriting owner role or a
superuser. The SQL deliberately aborts if a current model table is missing or
the executor lacks ownership. Keep API/service credentials server-side.

Existing legacy security-definer functions or views must also be inventoried in
production before approval: revoking table grants alone does not disable a
separately granted function or a view owned by a privileged role. None of the
legacy helper functions were present in the fresh local stack. No unknown
production functions were changed by this patch.

New tables can inherit the same unsafe defaults. Every future LMS schema change
must include its reviewed hardening and extend the model coverage check. A
schema-wide `ALTER DEFAULT PRIVILEGES` or disabling the entire Data API could
affect shared integrations, so neither was introduced without an ownership
inventory and explicit decision.

## Isolated verification

The opt-in suite derives the required tables from `prisma/schema.prisma` and the
messaging CREATE TABLE definitions, so a new model/table missing from the SQL
fails coverage. It never inherits `DATABASE_URL`
or loads application `.env`. It only accepts the named loopback maintenance
databases. Missing `anon`/`authenticated` roles may be created only there. SQL
hardening is applied locally; no provider writes or production connections are
possible through this suite. Synthetic owner CRUD is rolled back, and cleanup
is restricted to unique rows belonging to the run.

Standalone PostgreSQL, after preparing the disposable schema:

```bash
LMS_DATABASE_SECURITY_DATABASE_URL=postgresql://postgres@127.0.0.1:55432/jazz_maintenance npx vitest run tests/security/lms-database-postgres.test.ts
```

Dedicated local Supabase, with its private JSON-quoted service configuration and
existing synthetic fixture state:

```bash
LMS_DATABASE_SECURITY_CONFIG=/tmp/jazz-maintenance/local-services.env npx vitest run tests/security/lms-database-postgres.test.ts
```

Results: standalone 4 passed, REST case skipped; Supabase 5 passed. The suite
checks physical SELECT/INSERT/UPDATE/DELETE denial for both browser roles across
all 23 models and both messaging tables, effective column grants,
enabled/non-forced RLS, preserved owner Prisma and messaging CRUD, and unchanged
auth/storage/unrelated table ACL/RLS. REST requests
for anonymous, student and application-admin identities deny all model reads,
all messaging reads, role PATCH/DELETE, forged entitlement INSERT and attempted
message changes with `42501`. The administrator
JWT still has database role `authenticated`; application admin access remains
through trusted server routes.

Both fixes were applied only to the isolated databases, after coordinating with
active owner-role journey tests. The actual messaging API regression suite also
passed all 4 tests against the hardened standalone database, with provider
calls mocked:

```bash
MESSAGING_TEST_DATABASE_URL=postgresql://postgres@127.0.0.1:55432/jazz_maintenance npx vitest run tests/integration/messages-postgres.test.ts
```

Re-run registration, reset, free/buyer/admin
course, quiz, notes, messages and private-storage journeys before release. Local
API behavior does not prove the production connection role or production policy
deployment.

## Historical V2 production proposal

An exact private archived-baseline package is now prepared and tested outside
Git. Revision2 passes **25/25 offline checks**, including default-off/manual
rollback gates and wrong project/name/org rejection before locks. It closes
browser access to all 26 public tables / 225 columns and three SECURITY DEFINER
RPCs, enables missing RLS without FORCE, and preserves trusted postgres/service
CRUD. A total of 422 actual zero-row operations exercise effective permissions.
All 65 archived table contents / 2,239 records and two sequence states remain
unchanged through apply, manual inverse and reapply. Auth/app users are14↔14,
with zero missing/email/confirmation/duplicate mismatches. Verifiers are removed.

Candidate SHA256:
`cb8933f257d283175aa8cffb32b72fe62cb4a6b747972e5cbcb7c4c10b793dfd`.
Manual inverse SHA256:
`709db9d29473c9094f42bf6ec34331af23f145f256bb3ff0a177c2223726c740`.
Private review: `/tmp/jazz-maintenance/production-hardening-review/review.md`.
No production connection or repair was made by this validation; approval remains
false. The unsafe-grant inverse is manual-only with services closed; keep closed
or approved re-pause is the preferred operational rollback.

The candidate removes existing postgres/public browser default additions only.
Built-in PUBLIC EXECUTE on future functions and unchanged supabase_admin creator
defaults remain: future migrations must explicitly revoke access in their
creation transaction. Schema/typmod/index-definition drift, external consumers,
old June server-code vulnerabilities and extension/platform recovery limits need
review before any new production resume. SQL-only reopening is not a safe code
release. This tested private package does not authorize deployment or another
resume and is not a blanket migration replay.

1. Capture sanitized read-only table ownership/RLS/effective browser grants,
   relevant function/view privileges and actual migration history; inspect only
   metadata and explicitly approved project records.
2. Confirm server-role preconditions, backups/recovery and unrelated service
   boundaries. Review the exact SQL and messaging script separately.
3. Obtain explicit user approval before production database changes. Apply only
   those reviewed statements in a transaction; never `db push`, reset, seed or
   replay the complete legacy history as part of this hardening.
4. Verify browser denial with approved synthetic identities and server-route
   continuity. Preserve the captured pre-change metadata for reviewed recovery;
   do not automatically restore broad browser grants if a server-role issue
   appears.
