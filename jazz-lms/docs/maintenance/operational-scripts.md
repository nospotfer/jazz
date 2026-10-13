# Operational script review

Source review completed during the October 2026 maintenance audit. No deployment,
seed, wipe, reset, price change, media mapping or production migration command
was executed. Commands below identify existing entrypoints; they are not
approval to run them against the supplied production credentials.

The 15 inventoried legacy mutators are now quarantined by a shared CLI guard
before any Prisma/provider client is constructed. Execution requires the
separate, literal `ENABLE_LOCAL_LEGACY_MUTATIONS=1` flag, `NODE_ENV=development`
or `test`, and a known disposable loopback database. Production runtime or
`VERCEL_ENV=production` is always denied; no production override exists.
Read-only diagnostics retain their existing configuration behavior. Confirm
their resolved provider/database identity privately before collecting evidence.
Do not print configuration values or signed media URLs during that inspection.

## Diagnostic output fixed in this pass

`npm run check:integrations` runs `scripts/check-integrations.ts`. It reads
lessons, requests signed Mux manifests, creates temporary Supabase signed URLs
and HEAD-checks an attachment. It does not verify the Dodo provider; it checks
that the required Dodo environment variables are present.

The previous failure handler printed arbitrary exception messages/non-Error
objects. Storage failures also included raw object paths and provider messages.
Those strings can carry connection credentials, signing material or bearer URL
parameters. The bounded fix emits only controlled errors, environment variable
names, counts and HTTP statuses. Unknown provider/Prisma/fetch details stay out
of output; constructor and cleanup failures are covered. Failure sets a
nonzero exit code after cleanup. The Dodo success message now distinguishes
environment presence from actual provider verification.

`tests/security/integration-check-logging.test.ts` exercises those failures with
synthetic private strings, an ephemeral test signer and mocked clients/fetch.
All 11 cases passed; the scoped lint and full TypeScript check passed. The
regressions perform no real database or provider calls:

```bash
npx vitest run tests/security/integration-check-logging.test.ts
```

The integration checker remains a sample check: up to 15 lessons with recognized
playback IDs and the first usable attachment among up to 25. It does not prove
every published lesson/PDF, account ownership, actual Dodo price/currency/tax,
webhook delivery or recovery readiness.

## Deployment entrypoints now validate explicit scope

| Existing command | Confirmed source behavior | Required review before use |
| --- | --- | --- |
| `npm run deploy:test` | Allows a reviewed branch, validates its exact commit and linked project/team, runs lint/types/tests/webpack build, rechecks scope, then invokes `vercel --yes --non-interactive`. No hardcoded preview alias or CLI-text alias guessing remains. | Confirm isolated provider configuration and deployment protection before exercising accounts/payments. Verify actual deployment ID, source revision and URL through provider metadata. |
| `npm run deploy:prod` | Requires `main`, the reviewed exact commit and linked project/team. Checks required configuration names, canonical app origins, live Dodo mode/origin, disabled synthetic checkout and paired optional native receiving configuration. Runs the same preflights and rechecks before `vercel --prod --yes --non-interactive`. | Explicit approval for this exact production operation remains required. Review remote environments, prerequisites, schema and rollback separately; the scope guard is not approval. |

`scripts/check-deploy-target.mjs` requires `VERCEL_DEPLOY_COMMIT` to match the
full HEAD SHA and rejects tracked or untracked source changes, both before
preflights and immediately before upload. Explicit `VERCEL_PROJECT_ID` and
`VERCEL_ORG_ID` must match the private local `.vercel/project.json` link. Supply
`VERCEL_TOKEN` through the environment; the script never puts it in command
arguments. Vercel documents these environment variables and the agent-friendly
flag in its [CLI global options](https://vercel.com/docs/cli/global-options).
The example environment leaves all four names empty.

Automatic integration probing was removed from deployment preflights; an
unverified ambient database/provider must not be queried as a side effect of
preparing a deploy. Native receiving requires both `RESEND_WEBHOOK_SECRET` and
`MESSAGES_REPLY_TO_EMAIL`, or both unset. The old relay secret is optional.
No receiving activation or email is performed by the guard.

The guard validates local scope and configuration presence. It does not prove
remote Vercel environment values, root directory, token permissions, alias
assignment, provider health/isolation, database migrations or restorable backups.
Ignored local files and ordinary CLI/build output still require appropriate
secret handling. A clean Git status alone does not establish those facts.

All 19 deployment regressions passed, including wrong project/team/commit,
untracked source, production gates and a source file created during preflights.
Wrapper checks use temporary Git repositories and mock npm/Vercel executables;
no actual deployment or live provider is invoked. These checks do not establish
that a real Vercel CLI/account deployment will succeed.

## Administrative and destructive entrypoints

| Existing command | Confirmed hazard | Safe preparation |
| --- | --- | --- |
| `npm run admin:create` | `scripts/create-admin.ts:8` defaults to `SUPER_ADMIN`; lines 21–24 supply a placeholder email and invented non-Supabase ID if omitted. Upsert is by email, and no authenticated account ownership is verified. | Require an explicit Jazz Auth user ID/email pair and intended role, verify both against the selected project, and review the exact existing row before an approved role change. Never rely on fallback values. |
| `npm run admin:seed-test-voucher` | `scripts/seed-admin-test-voucher.ts:26` creates/reactivates a named 99.98% coupon with no expiry or global usage cap, using the ambient database. Its internal metadata has no matching admin-only enforcement in checkout/voucher code. | Keep test coupons confined to disposable fixtures. Before any approved shared-environment coupon change, review ownership, user/course scope, expiry, limits and provider lifecycle. |
| `npx tsx scripts/seed-cleanup-vouchers.ts` | Its confirmation string gates deletion of every coupon except two legacy codes, associated redemption/discount history, and usage counter resets. It also reactivates unrestricted test/free codes. | Treat as a destructive legacy fixture tool; do not use for live voucher maintenance. Prepare an explicit scoped plan and recoverable export if a replacement operation is needed. |
| `npm run admin:wipe-user-activity` | `scripts/wipe-user-activity.ts:28` deletes broad activity/payment/quiz tables, including the webhook ledger at line 46, and resets all voucher counters. Optional user deletion preserves only roles from its hardcoded set. Messaging tables are omitted despite the “ALL user activity” label. | Restrict to a verified disposable database. Any production retention/deletion request needs its own scoped plan, accounting/refund history decision and recovery verification; the static confirmation string provides no target/backup assurance. |
| `npx tsx scripts/wipe-auth-users.ts` | Defaults to protecting one legacy email at line 65, rather than verified Jazz owners/admin roles. It deletes while advancing offset pages (lines 86–116), which can skip users as the result shrinks. Individual deletion failures only log and can leave the overall exit status successful. Emails/IDs and raw errors are logged. | Do not run on the live/shared project. A future approved deletion workflow needs explicit owner protection, a stable enumerated target list, dry-run output with PII minimized, reliable failure reporting and an account recovery plan. |
| `npm run reset:user:vouchers -- --user-id=... --course-id=...` | Defaults to a read-only plan; both user and course are required. `--apply` explicitly enables writes, and `--codes` can sync only vouchers belonging to the selected purchases. The shared quarantine blocks other environments/targets. | Review the scoped plan first. This remains a disposable fixture reset, not a production accounting/refund workflow. |
| `npm run course:price:fix` | `scripts/fix-course-price.ts:8` changes every positive-priced course to the hardcoded €29.99, without course/provider comparison or confirmation. | Review an explicit course and its actual Dodo product currency/price first. Do not use this broad historical default for maintenance. |
| `npm run seed` / `npm run seed:sample` | After the shared local quarantine, the main seed creates another placeholder course each run. The sample seed upserts fixed IDs and published €29.99 sample content. | Use disposable local fixtures only. Confirm intended catalogue identity and schema preparation; do not seed production to repair missing data. |

Their legacy business behavior remains suitable only for disposable fixtures;
the quarantine does not validate admin account pairing, repair Auth wipe
pagination, correct stale media maps or establish a restoration procedure.
No actual mutator was executed during this change: accepted write branches were
tested with mocked clients only. Deleting the payment webhook ledger still
discards durable refund/dispute evidence, even in a disposable database.

## Media and PDF maintenance

- `npm run mux:apply -- COURSE_ID` runs `scripts/apply-mux-playback-ids.ts` and
  writes immediately after the local quarantine guard. If the course ID is
  omitted, it chooses the course
  with the most lessons, then assign a positional hardcoded map. Account audit
  already proved its 15 slots contain only 14 unique playback IDs, with a
  duplicated final slot and stale class mappings. Compare the current lesson
  IDs/titles/order with actual selected-environment assets before preparing an
  approved map; do not run the existing mapping as a repair.
- `npx tsx scripts/update-mux-playback-ids.ts` writes a separate fixed-ID map
  after the local quarantine guard. Title-fragment checks help identify some
  mismatches, but do not
  prove environment ownership; updates are per row, so earlier changes can
  persist when later rows fail. Output now contains controlled statuses,
  lesson IDs and counts; old video URLs/titles and arbitrary provider exceptions
  are omitted.
- `npx tsx scripts/remap-attachments-to-bucket.ts` defaults to a dry run, with
  `--apply` enabling writes, after the local quarantine guard. Output contains
  attachment IDs and counts, including unmatched/duplicate file counts; old
  names/URLs and arbitrary provider exceptions are omitted even during dry runs.
- `npm run pdf:sync -- --course-id=COURSE_ID --storage-prefix=PREFIX` writes
  attachment upserts after the local quarantine guard; it has no dry-run flag.
  An omitted course ID
  only triggers a guard when the lesson count exceeds the expected class count.
  Review explicit course/bucket/prefix and the full proposed mapping privately.
- `npx tsx scripts/check-attachments-bucket.ts` and
  `npx tsx scripts/dump-attachments-and-bucket.ts` are diagnostic reads using
  `.env.local` and a service key. They emit filenames/attachment metadata; the
  former also prints raw SDK errors. Keep outputs private and redact provider
  error/URL details before collecting a shared report. Listing filenames is not
  a backup of database state or stored objects.

No private keys, credentials or old signed URLs are included in this document.
The deferred credential rotation remains the user's separate decision; logging
hardening should precede any further credential-backed diagnostics.

## Target, dry-run and recovery requirements

### HTTP fixture helpers hardened locally

The production-callable admin test routes previously allowed a user with
`vouchers.update` to delete paid entitlement/activity rows. Reset defaulted to
execution and omitted course/user filters could select broad state. They now
use a separate, server-only `ENABLE_LOCAL_TEST_RESETS` flag, default `0` in
`.env.example`, and a strict shared isolation guard:

- `NODE_ENV` must be `development` or `test`; production and a production
  `VERCEL_ENV` are always blocked, regardless of request headers or flags.
- `DATABASE_URL` must select the disposable loopback
  `55432/jazz_maintenance` or `56122/postgres` target, with public schema and
  no host/service/target override parameters. Missing, remote or other local
  databases are blocked.
- The parsed request URL must be loopback. Supplied Host/forwarded Host and
  Origin must be well-formed and match that local request; a localhost header
  cannot override a remote request URL. Rejected helpers return 404 before
  authentication or database access.

| Route | Local request requirements and behavior |
| --- | --- |
| `POST /api/admin/vouchers/reset-user-state` | Existing admin permission plus explicit JSON `userId` and `courseId`. Defaults to a dry-run plan; writes require literal `dryRun: false`. Progress/lesson purchases are scoped to that user/course. |
| `POST /api/admin/vouchers/revert-test-use` | Existing admin permission plus explicit JSON `userId`, `courseId` and `voucherCode`. Defaults to a reversal plan; writes require literal `dryRun: false` and the matching voucher purchase. |
| `POST /api/dev/reset-test-purchases` | Verified authenticated self plus explicit JSON `courseId`. Optional supplied `userId` must match that identity. Defaults to counts only; writes require literal `dryRun: false`. Unrelated courses and orphan redemptions are excluded. |

The dashboard's local query trigger now requires both `resetTestPurchases=1`
and `resetTestCourseId` containing the intended course; a missing course clears
the trigger without making an API request. Its explicit JSON remains bound to
the authenticated self. The voucher matrix E2E helper supplies its configured
course in JSON. Neither consumer can enable the server feature or bypass its
database/environment checks.

Synthetic checkout retains its separate `ENABLE_LOCAL_TEST_CHECKOUT` opt-in and
now uses the same strict local request/database guard. A development server
accidentally loading a production `.env`, or a remote request with localhost
headers, can no longer create a synthetic entitlement. Ordinary provider
checkout behavior is preserved; provider calls are mocked in its boundary
regressions. Checkout opt-in does not enable resets.

Focused checks: 137 tests across helper isolation, admin/self reset behavior,
consumer scope and checkout regressions. Positive mutation paths use mocks
only; no reset, reversal or synthetic-purchase mutator was executed against an
actual database/provider in this task. The separate CLI quarantine below does
not inherit the HTTP reset or checkout opt-in.

### Legacy CLI quarantine

`scripts/lib/legacy-local-guard.ts` now guards these entrypoints before client
construction:

- `prisma/seed.ts`, `prisma/seed-sample.ts`.
- `scripts/create-admin.ts`, `scripts/seed-admin-test-voucher.ts`,
  `scripts/seed-cleanup-vouchers.ts`, `scripts/wipe-user-activity.ts`,
  `scripts/wipe-auth-users.ts`, `scripts/reset-user-voucher-state.ts`,
  `scripts/fix-course-price.ts`.
- `scripts/apply-mux-playback-ids.ts`, `scripts/update-mux-playback-ids.ts`,
  `scripts/remap-attachments-to-bucket.ts`,
  `scripts/sync-supabase-pdf-attachments.ts`,
  `scripts/sync-jazz-lesson-metadata.ts`, `scripts/import-lesson-quiz-bank.ts`.

The new flag defaults to `0` in `.env.example`. It must be set to literal `1`,
independently of the HTTP test-helper flags or the older `CONFIRM` strings.
`NODE_ENV` must be `development` or `test`; production is denied regardless of
flags. `DATABASE_URL` must use postgres/postgresql and `localhost` or
`127.0.0.1`, selecting exactly `55432/jazz_maintenance` or `56122/postgres`.
Only public schema and numeric pool/timeout query parameters are permitted;
duplicate parameters, fragments, service/host overrides and other targets fail
closed. The guard never emits datasource or service-key values.

Auth wipe and both Supabase-backed attachment tools additionally require every
configured `NEXT_PUBLIC_SUPABASE_URL`/`SUPABASE_URL` alias to select the dedicated
HTTP loopback API on port `56121`, with no credentials, path or query overrides.
The Auth wipe and attachment remapper no longer auto-load `.env`/`.env.local`.
Supply disposable configuration explicitly before invocation. Prisma's own
environment loading cannot authorize a missing flag or datasource because the
guard executes before construction.
Supabase-backed tools also retain the validated target snapshot and pass an
explicit Prisma datasource/provider URL, so later ambient environment loading
cannot switch a fallback local alias to a production project.

Voucher reset requires explicit `--user-id` and `--course-id`, defaults to a
dry-run plan and writes only with `--apply`. Supplying both `--apply` and
`--dry-run` is rejected. Named voucher count sync is restricted to vouchers
found on the selected user/course purchases. The other quarantined tools retain
their legacy local-only behavior, including immediate writes where noted;
do not assume every tool now has a dry-run mode.

Focused regressions cover guard parsing, every entrypoint's default-off/remote/
production rejection before construction, remote Supabase alias rejection,
read-only reset defaults and explicit reset scope, and signed-media logging.
All 110 quarantine/reset/logging cases passed. Running the existing 11 read-only
integration-check confidentiality cases alongside them passed 121 tests across
three files. Full TypeScript, targeted ESLint and whitespace checks passed.
All client/write branches are mocked; no actual mutator or live provider runs.

```bash
npx vitest run tests/security/legacy-cli-guard.test.ts tests/security/legacy-cli-entrypoints.test.ts
```

This closes accidental ambient-production execution of the inventoried legacy
tools. It does not provide a production maintenance CLI, correct the retained
fixture mappings/administrative defaults, quarantine unrelated migration or
deployment commands, or establish backup/restore capability. A future
production operation needs its own reviewed tool and recovery plan.

### Review before operational writes

Prepare a concrete plan before approving an operational write: identify the
database/provider project and executing role without publishing credentials,
select exact record IDs, capture relevant counts and approved before-values,
and show the intended changes. Run that plan against disposable fixtures first.
Use an existing dry-run mode explicitly where available; where none exists,
prepare a read-only plan instead of invoking the mutator to inspect its output.

Before production database/data changes, confirm a recent appropriate backup,
its retention/ownership and a tested restore path. Supabase Auth users, storage
objects and relational records have distinct recovery requirements. No
backup/restore procedure was found in the reviewed operational scripts; this
does not prove that provider backups are absent. Actual provider recovery
capability remains a release verification gap.

The incomplete Prisma/Supabase baseline and approval-gated RLS scripts are
documented in [database.md](database.md). Do not run `db push`, reset, seeds or
the complete legacy migration history against production as an operational
shortcut. Production deployment/config/DNS/data changes require the review and
explicit approval recorded in [release-checklist.md](release-checklist.md).
