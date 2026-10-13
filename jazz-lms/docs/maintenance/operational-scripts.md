# Operational script review

Source review completed during the October 2026 maintenance audit. No deployment,
seed, wipe, reset, price change, media mapping or production migration command
was executed. Commands below identify existing entrypoints; they are not
approval to run them against the supplied production credentials.

Most scripts use ambient Prisma/provider configuration. Several diagnostic and
mapping scripts explicitly read `.env.local`; the auth wipe reads `.env` before
`.env.local`, without overriding an already-set value. A local-looking filename
does not establish a local target. Confirm the resolved database, provider
project/team and affected records privately before any operational execution.
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

## Deployment entrypoints need release review

| Existing command | Confirmed source behavior | Required review before use |
| --- | --- | --- |
| `npm run deploy:test` | `scripts/deploy-preview.sh:7` hardcodes an old canonical alias; line 14 requires `jazz-lms-dev-vercel`, so the current maintenance branch is rejected. It invokes `vercel --yes`, then searches CLI text for an alias. | Use the approved maintenance commit and verified Jazz project/team. Confirm preview environment isolation and deployment protection. Verify deployment/alias metadata directly rather than trusting text from a stale alias assumption. |
| `npm run deploy:prod` | `scripts/deploy-production.sh:8` requires `main`; line 38 requires the legacy `INBOUND_EMAIL_WEBHOOK_SECRET`. It omits native `RESEND_WEBHOOK_SECRET` and `MESSAGES_REPLY_TO_EMAIL`, then invokes `vercel --prod --yes`. | Review the final commit, verified project/team, environment changes and production approval. Native receiving must use its matching webhook secret and approved Reply-To; the legacy relay should remain unset unless separately approved. |

Both scripts inspect tracked changes with `--untracked-files=no`, so their clean
check excludes untracked source files that can affect a build/upload. Neither
validates the expected project/team before deploying; they rely on the current
CLI account/project link. Existing branch gates do not establish that identity.
Their lint/integration/build preflights do not inspect applied database
migrations or backups.

The preview `sanitize_cli_output` helper removes carriage returns and ANSI
control sequences; it is not a credential redactor. No literal credential
printing was found in these deployment scripts, but echoed CLI/build output
must not be treated as guaranteed safe. Review app logging and keep secrets
out of build commands/config dumps. No deployment behavior was changed here.

## Administrative and destructive entrypoints

| Existing command | Confirmed hazard | Safe preparation |
| --- | --- | --- |
| `npm run admin:create` | `scripts/create-admin.ts:8` defaults to `SUPER_ADMIN`; lines 21–24 supply a placeholder email and invented non-Supabase ID if omitted. Upsert is by email, and no authenticated account ownership is verified. | Require an explicit Jazz Auth user ID/email pair and intended role, verify both against the selected project, and review the exact existing row before an approved role change. Never rely on fallback values. |
| `npm run admin:seed-test-voucher` | `scripts/seed-admin-test-voucher.ts:26` creates/reactivates a named 99.98% coupon with no expiry or global usage cap, using the ambient database. Its internal metadata has no matching admin-only enforcement in checkout/voucher code. | Keep test coupons confined to disposable fixtures. Before any approved shared-environment coupon change, review ownership, user/course scope, expiry, limits and provider lifecycle. |
| `npx tsx scripts/seed-cleanup-vouchers.ts` | Its confirmation string gates deletion of every coupon except two legacy codes, associated redemption/discount history, and usage counter resets. It also reactivates unrestricted test/free codes. | Treat as a destructive legacy fixture tool; do not use for live voucher maintenance. Prepare an explicit scoped plan and recoverable export if a replacement operation is needed. |
| `npm run admin:wipe-user-activity` | `scripts/wipe-user-activity.ts:28` deletes broad activity/payment/quiz tables, including the webhook ledger at line 46, and resets all voucher counters. Optional user deletion preserves only roles from its hardcoded set. Messaging tables are omitted despite the “ALL user activity” label. | Restrict to a verified disposable database. Any production retention/deletion request needs its own scoped plan, accounting/refund history decision and recovery verification; the static confirmation string provides no target/backup assurance. |
| `npx tsx scripts/wipe-auth-users.ts` | Defaults to protecting one legacy email at line 65, rather than verified Jazz owners/admin roles. It deletes while advancing offset pages (lines 86–116), which can skip users as the result shrinks. Individual deletion failures only log and can leave the overall exit status successful. Emails/IDs and raw errors are logged. | Do not run on the live/shared project. A future approved deletion workflow needs explicit owner protection, a stable enumerated target list, dry-run output with PII minimized, reliable failure reporting and an account recovery plan. |
| `npm run reset:user:vouchers -- --user-id=...` | `scripts/reset-user-voucher-state.ts:15` defaults `dryRun=false`; omitting course scope spans that user's courses. It deletes purchase/activity rows and adjusts voucher counts, with no environment/backup guard. | Review only with explicit `--dry-run`, explicit user/course and a verified isolated target. Reconcile provider/financial consequences before approving an actual reset. |
| `npm run course:price:fix` | `scripts/fix-course-price.ts:8` changes every positive-priced course to the hardcoded €29.99, without course/provider comparison or confirmation. | Review an explicit course and its actual Dodo product currency/price first. Do not use this broad historical default for maintenance. |
| `npm run seed` / `npm run seed:sample` | The main seed creates another placeholder course each run. The sample seed upserts fixed IDs and published €29.99 sample content. Neither checks target environment. | Use disposable local fixtures only. Confirm intended catalogue identity and schema preparation; do not seed production to repair missing data. |

The scripts above were inspected only. Their static confirmation strings,
idempotent upserts or transactions do not provide project identity, business
approval or restoration evidence. Committed deletion requires a tested recovery
procedure. In particular, deleting the payment webhook ledger discards durable
refund/dispute evidence used by the entitlement safeguards.

## Media and PDF maintenance

- `npm run mux:apply -- COURSE_ID` runs `scripts/apply-mux-playback-ids.ts` and
  writes immediately. If the course ID is omitted, lines 40–48 choose the course
  with the most lessons, then assign a positional hardcoded map. Account audit
  already proved its 15 slots contain only 14 unique playback IDs, with a
  duplicated final slot and stale class mappings. Compare the current lesson
  IDs/titles/order with actual selected-environment assets before preparing an
  approved map; do not run the existing mapping as a repair.
- `npx tsx scripts/update-mux-playback-ids.ts` writes a separate fixed-ID map
  immediately. Title-fragment checks help identify some mismatches, but do not
  prove environment ownership; updates are per row, so earlier changes can
  persist when later rows fail. Line 128 prints the previous `videoUrl`, which
  can contain a signed bearer query. A minimal logging fix would retain counts
  and record IDs while omitting old URLs.
- `npx tsx scripts/remap-attachments-to-bucket.ts` defaults to a dry run, with
  `--apply` enabling writes. Line 194 nevertheless prints complete old
  attachment URLs before that gate. Signed URLs stored there would leak even
  during the dry run. Omit old URLs or emit only a reviewed token-free identifier
  before using the diagnostic; no such script was run in this audit.
- `npm run pdf:sync -- --course-id=COURSE_ID --storage-prefix=PREFIX` writes
  attachment upserts immediately; it has no dry-run flag. An omitted course ID
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
actual database/provider in this task. Existing CLI mutators above still need
their own target/dry-run/recovery review; these API changes do not guard them.

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
