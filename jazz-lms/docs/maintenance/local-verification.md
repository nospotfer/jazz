# Isolated verification and local preview

The maintenance checks use synthetic data and actual loopback services. No test
inherits a production database/provider configuration. The verified setup uses
Node 24.21.0, PostgreSQL 17, Supabase CLI 2.120.0 and Chromium/Playwright.
Installation and both production build paths were checked in a fresh source copy.

## Fast reproducible checks

From jazz-lms with Node 24 selected:

```bash
npm ci
export DATABASE_URL=postgresql://jazz_test:jazz_test@127.0.0.1:5432/jazz_test
export NEXT_PUBLIC_SUPABASE_URL='' NEXT_PUBLIC_SUPABASE_ANON_KEY=''
export APP_URL=http://127.0.0.1:3000 NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000
export NEXT_PUBLIC_OPENREPLAY_ENABLED=false NEXT_TELEMETRY_DISABLED=1
npm run lint
npm run typecheck
npm test
npm run build:webpack
```

The synthetic DATABASE_URL is required for module validation in both tests and
builds; it does not point to a running provider. Leave public Supabase
configuration empty and optional analytics/replay disabled for this limited
public preview. This does not exercise accounts or persistence. Do not copy
private environment files into a clean verification checkout.

## Persisted regression database

Start a disposable PostgreSQL 17 container bound only to 127.0.0.1:55432,
with database jazz_maintenance, user postgres and local trust authentication.
Never expose its port publicly. Use a dedicated name, volume and project.
The Quality workflow records the tested creation/command sequence.

Set DATABASE_URL explicitly to:
`postgresql://postgres@127.0.0.1:55432/jazz_maintenance`.
Only in this disposable database, create the Prisma schema with
`npx prisma db push --skip-generate` and execute prisma/setup-messaging.sql.
Do not pass force-reset or accept-data-loss, or use the legacy seed/migration
history to reconstruct production.

Then run the actual persisted suites:

```bash
PAYMENTS_TEST_DATABASE_URL=postgresql://postgres@127.0.0.1:55432/jazz_maintenance \
MAINTENANCE_DATABASE_URL=postgresql://postgres@127.0.0.1:55432/jazz_maintenance \
MESSAGING_TEST_DATABASE_URL=postgresql://postgres@127.0.0.1:55432/jazz_maintenance \
LMS_DATABASE_SECURITY_DATABASE_URL=postgresql://postgres@127.0.0.1:55432/jazz_maintenance \
npx vitest run --no-file-parallelism \
  tests/integration/dodo-entitlement-postgres.test.ts \
  tests/security/lesson-quiz-postgres.test.ts \
  tests/security/lesson-notes-postgres.test.ts \
  tests/integration/messages-postgres.test.ts \
  tests/security/lms-database-postgres.test.ts
```

Verified at source85f4e12: five suites, 39 passed, one Supabase REST-only case skipped. The
two added quiz queue cases hold the only connection read-only for three seconds,
then verify bounded acquisition and single persisted launch/answer. Unique
fixture rows are cleaned up or transactions rolled back. The role suite applies
scoped security SQL and refuses remote targets. Do not treat skipped database
checks in the normal suite as equivalent evidence.

## Separate native Prisma TLS verification

A new disposable PostgreSQL 17.11 loopback fixture independently passes **9/9**
native-engine checks with the actual Prisma 5.17.0 engine
`393aa359c9ad4a4bb28630fb5613f9c281cde053`. Positive read-only queries confirm
`pg_stat_ssl.ssl=true`. With `sslmode=require`, `sslaccept=strict` and a supplied
synthetic CA, unrelated CA, trusted-chain/wrong-hostname, missing CA file and
non-TLS server cases all reject before a query; strict positives succeed between
negative groups. Both server certificates validate under the same synthetic CA,
so the wrong-host case isolates hostname validation.

The first fixture preparation incorrectly set command-line `ssl=off`, which
overrode its subsequent reload; it ran zero engine checks and is retained as a
configuration diagnostic. The corrected fixture changed only its own disposable
container, bound port 55436 to loopback, and removed that container in `finally`.
Existing local/cloud/production services and application source were unchanged.
The private runner, driver and result are in
`/tmp/jazz-maintenance/prisma-native-tls-verification-v2/` (owner-only files).
These nine checks are separate from normal and persisted CI totals. They prove
the pinned engine's strict chain/hostname behavior, not deployed CA packaging,
exclusive CA trust or actual production TLS configuration.

## Diagnostics verification follow-up

The later diagnostics source `27d7b4c` passes **1,077 normal tests / 40 skips**
(90 files with passes / five all-skipped), the same five guarded PostgreSQL suites
**39 passed / one REST-only skip**, TypeScript, webpack build and lint
**0 errors / 25 existing warnings** in a clean copy with no private env files.
Its 38 added regressions test omission of private response/error/email/voucher
details from logs and failure metadata while preserving actual helper/route
decisions. Those 38 are part of the 1,077 total. Downloaded GitHub Quality logs
independently confirm counts. [Source checkpoint](review-status.md#diagnostics-confidentiality-source-follow-up).

The broader diagnostic source `491a02c` adds 53 closed-mock regressions for
Auth/provider responses, vouchers, messages, media and server fallbacks. A
corrected baseline reproduces disclosure in all53; the repair passes all53 and
the normal1,130/40 suite. Source `530e9bb` additionally requires exact OpenReplay
project selection and honest failed-query reporting, adding45 closed-fetch
cases. The combined clean source and downloaded GitHub logs confirm **1,175
normal passes/40 skips** (92 files with passes/five all-skipped), **39 persisted
passes/one REST skip**, types/build and lint0errors/25warnings. These added cases
are included, not additional totals. No provider/customer analytics query was
made. Existing source27 HTTPS45/TLS9 evidence remains a distinct checkpoint.

## Actual local Auth/storage/email stack

Use a separate Supabase CLI work directory outside this repository so the
project's legacy migration/policy history is never auto-applied. Keep the
existing maintenance stack if present; do not reset its volumes or clear users.
The running stack is /tmp/jazz-maintenance/supabase-local. Required settings:

| Setting | Tested value |
| --- | --- |
| project_id | supabase-local |
| API / PostgreSQL | 56121 / 56122, loopback only |
| Local mail UI/API | 56124 |
| PostgreSQL version | 17 |
| Auth site_url | http://127.0.0.1:3010 |
| additional_redirect_urls | Same origin /auth/callback, /auth/reset-password and /auth/reset-password/callback |
| email.enable_confirmations | true |
| email.otp_length | 6 |
| email.max_frequency | 1s, isolated test stack only |
| confirmation/magic-link email template | Includes the local six-digit Token for the actual verification-code UI |

Core running services are database, Auth, REST, storage, Kong and Mailpit. Other
services are unnecessary for these checks. Confirm the Docker published bindings
are loopback; an open development API is not an acceptable isolated stack.

Save CLI status environment output into a mode-0600 file with umask 077. Never
print it. Tests/seed expect JSON-quoted KEY=VALUE lines containing API_URL,
DB_URL, ANON_KEY, SERVICE_ROLE_KEY and JWT_SECRET. The current private file is
/tmp/jazz-maintenance/local-services.env. It is outside Git and reports.

Use an environment-loading process that validates API_URL as loopback:56121 and
DB_URL as loopback:56122/postgres before invoking Prisma. Explicitly override
DATABASE_URL in child processes; do not rely on the repository's real .env.
Create only the disposable Prisma/messaging schema, then apply the scoped LMS
and messaging hardening SQL. No production migration has been performed.

Seed only this stack:

```bash
MAINTENANCE_LOCAL_CONFIG=/tmp/jazz-maintenance/local-services.env \
node scripts/maintenance/seed-local-fixtures.mjs
```

The seed independently rejects other hosts/ports/database targets. It creates
four synthetic identities (free/buyer/admin/legacy), one published 15-lesson
course, 60 private PDFs and 180 five-option quiz questions. Random passwords stay
in mode-0600 /tmp/jazz-maintenance/fixture-users.json. Re-running preserves
existing actor IDs/progress/purchases; it is not a reset/cleanup command.

The synthetic lessons reference an existing signed Mux playback ID. Actual
playback requires the authorized project signer in the private app environment;
it is read-only media access, not a provider asset mutation. Local storage and
quiz persistence do not need a Mux management/API token.

## Full local application and browser evidence

The current isolated app copy is /tmp/jazz-maintenance/fixture-app, serving
http://127.0.0.1:3010. Its private launcher loads loopback Auth/database/storage
and the Mux signer, leaves Dodo/Resend sending keys empty, disables optional
analytics, and explicitly enables loopback synthetic checkout. It uses webpack
dev because the copy's node_modules symlink crosses Turbopack's project root.
A clean ordinary copy successfully builds with Turbopack.

When recreating the app, copy source and public assets without .env, CSV,
provider sessions, .auth or generated output; populate only the private isolated
environment. Sync source before making a final revision claim. A normal public
server with empty Supabase settings cannot replace this actual customer test.

Opt-in browser checks, with that isolated app already running:

```bash
PLAYWRIGHT_E2E_PORT=3010 \
MAINTENANCE_LOCAL_E2E_CONFIG=/tmp/jazz-maintenance/local-services.env \
npx playwright test tests/e2e/local-onboarding.spec.ts --workers=1

PLAYWRIGHT_E2E_PORT=3010 \
MAINTENANCE_LOCAL_E2E_CONFIG=/tmp/jazz-maintenance/local-services.env \
npx playwright test tests/e2e/local-voucher-redemption.spec.ts --workers=1

PLAYWRIGHT_E2E_PORT=3010 MAINTENANCE_CUSTOMER_JOURNEY_ENABLED=1 \
MAINTENANCE_FIXTURE_USERS_FILE=/tmp/jazz-maintenance/fixture-users.json \
npx playwright test tests/e2e/customer-certificates.spec.ts --workers=1
```

Tests guard their loopback service/app targets. Private browser tests disable
trace/video/screenshots; credentials and recovery links must never be printed.
Supply PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH only when using an existing local
Chromium instead of the installed Playwright browser. Private reports stay
ignored; safe visual evidence contains only synthetic names/content.

The onboarding flow uses actual Supabase email OTP and recovery with local
Mailpit, then application-only synthetic checkout. It does not prove Google
OAuth, Dodo checkout/webhook, SMTP delivery or production recovery settings.
Voucher tests use a new account and voucher and clean only their own records.
Certificate tests require the persisted buyer's prior 15-lesson completion;
they do not fabricate eligibility or mutate the legacy actor's purchases.

Local browser evidence and verified Mux requests are recorded in the
[verification matrix](verification-matrix.md). The separate exact-source,
production-built HTTPS frontend at source `27d7b4c` passes 45 distinct checks
through a protected free temporary tunnel; the earlier 44-check report is
preserved. Final read-only comparison preserves fixture learning and purchases.
The owned temporary servers were closed after verification.
[Runtime and scope](preview.md#current-diagnostics-source-https-follow-up).
This does not prove Dodo, Google/SMTP, Vercel runtime or stable production hosting.
The owner selected a zero-cost budget; no paid upgrade is authorized.

The newer [separate cloud preview](preview.md) uses an independent Free Supabase
project and a different loopback frontend at 3012. Its credentials/actor file
are separate from the local stack. Existing local test and mutator guards must
not be bypassed to target that remote database; purpose-bound private checks
verify its exact project instead. Neither frontend is an HTTPS Vercel preview.
