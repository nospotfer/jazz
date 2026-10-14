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
[verification matrix](verification-matrix.md). The earlier exact-source,
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

## Historical native producer verification

Source `ab14628` passes 1,763 normal cases/40 skips (101 files with passes/five
all-skipped), types and lint 0 errors/25 existing warnings without private env.
The 512 new indexing/configuration/ingress/inspection/preparation cases include
20 actual HTTP and 48 actual release-I/O checks. A separately fresh locked
configured webpack package matches 541 committed application files and verifies
45,759 immutable files; 157 client files omit supplied server secrets and contain
the expected public key/origin. Its synthetic origin is unrouted and no process
was started. [Commands and limits](native-runtime.md).

Private evidence: `/tmp/jazz-maintenance/native-release-package-verification/`.
The earlier type/scan/quiz-fixture and first esbuild sealing failures are retained;
final corrections pass. Fixture-only `3cbb17c` preserves the malformed key value
while satisfying the existing plain-text scanner, with 189 scoped tests passing.
Source27's HTTPS45 report remains historical. This package is not a credential,
tunnel, runtime cache, restart or production health check.

## Current native verification

Exact application source `e32a370` passes 1,915 normal tests/40 skips (105 files
with passes/five all-skipped), 39 actual PostgreSQL tests/one REST-only skip,
types, webpack and lint0/25. Clean combined-check source bytes match a 553-file
committed export; that check copy reused dependencies. A separate artifact uses
fresh locked npm ci and configured webpack, matching 548 application Git blobs,
45,766 sealed files and 157 client files with expected public values and no
supplied server secrets. The prelaunch producer receipt and actual startup
receipt remain separate. Source CI independently confirms the same test counts.

The artifact actually passes 19 Unix runtime checks, 11 HTTPS transport checks,
image-cache writes, home200 restart, forced owned-worker exit, cleanup, separate
UID65534 EACCES for both sockets and final complete inspection. Only .next/cache
is writable; compiled directories remain sealed. Main preview/tunnel and later
private lifecycle probes closed cleanly. Nothing was installed as a service/timer.

Browser primary 96/98, guest 2/2, completion 7/7 and full-frame visual 7/7 remain
separate, with initial observations retained. Twelve public layouts, 48 computed
contrast states, four native roles, Mux decoding, PDF text and certificates have
actual proof. The strict-CA read-only final snapshot preserves learning and
entitlements. No learning/payment/mail/provider changes occurred; only six e32
native password/session syncs were allowed, eleven overall with source 2058.
Earlier two buyer exceptions remain unclassified despite zero current errors.
Private exact-source evidence is under
`/tmp/jazz-maintenance/native-preview-contrast-verification/` and
`/tmp/jazz-maintenance/native-preview-contrast-browser-evidence/`.
[Detailed scope and gaps](review-status.md#protected-native-preview-and-contrast).


## Fresh native learning and latest-source UI follow-up

Exact application source `cadeac7` passes1,931 normal tests/40 skips,39 actual
PostgreSQL checks/one REST skip,types/webpack/lint0errors/25existingwarnings. Its
sixteen AuthPage cases include ten initial reproduced failures and two separately
reproduced late-event failures. Existing seven player cases now verify accessible
completion names in ES/EN/FR/PT across ready/saving/completed states. These suites
are included in the normal total.

Fresh locked configured build matches549 app Git blobs,45,768 sealed files and
158 inspected client files; Unix19/HTTPS11 pass. Exact9bd actual normal UI saved
and cache-cleared/reloaded two notes, watched two52-second clips to80%, explicitly
completed both lessons and answered24 quiz questions (100%PLATINUM/92%GOLD).
Strict-CA read-only final snapshots confirm every expected row and preserve
original-four User/learning/entitlement fingerprints and zero business rows.
Three native logins/session syncs and one own-avatar update belong to that closed
window; saved-state continuations add none. Source9bd reports retain all helper
failures and unresolved mobile entry separately. Purpose-created session state
was deleted and owned processes closed before expiry; complete seal reinspection
passes. Latestcade read-only UI window uses one further normal login/session,
blocks learning/provider/payment/mail mutators and compares12 model hashes for
all five synthetic actors. [Exact completed scopes](review-status.md#late-auth-events-and-localized-completion-labels).


Earlier57 exact CI confirms1,935/40 normal,39/1 persisted,types/build/lint0/25;
555-file committed scan0. Nullable historical amounts have33 frozen targeted
passes plus an explicit updated contract; no financial data/provider mutation.
A550/45,769/158-file fresh sealed artifact passes Unix19/HTTPS11/reinspection.
Actual320/390 drawer geometry/hit/keyboard/navigation is repaired; report12/9/3
retains early unscoped textarea assertions and locale timeout. All-five12-model
read-only comparison passes after closure. [Current scope](review-status.md#mobile-drawer-recovery-and-recorded-payment-amounts).


## Provider amount regression checkpoint

Source `133716b` passes1,973 normal tests/47 intentional skips,108 passed files/
five all-skipped,46 actual PostgreSQL checks/one REST skip,types/webpack and
lint0errors/25existingwarnings. The seven added guarded PostgreSQL cases are
skipped in the normal suite and pass in the separate database run; they extend
`dodo-entitlement-postgres.test.ts`, so the command above and Quality job include
them automatically. Frozen partial/invalid/zero/retry/coupon regressions and
existing caller controls pass260/260,including18 actual PostgreSQL cases.
Fresh locked installation/build use a clean556-file Git archive without private
env files or builder server credentials. No schema, backfill or provider call.
[Exact source/CI and distinct UI scopes](review-status.md#provider-amount-availability).

## Payment history regression checkpoint

Source `a207f36` passes 1,995 normal tests/47 intentional skips in108 passed/
five all-skipped files,46 actual PostgreSQL checks/one REST-only skip, types,
configured webpack and lint0errors/25existingwarnings. Frozen failure/owner/
malformed-response baselines remain separate; final page cases pass19/19.
GET identity-hint cases reproduce three baseline failures/33 controls and
verify mismatch/blank denial before database reads. Direct API fixtures supply
the Request required by Next's generated route types. Exact downloaded CI and
556-file committed export secret scan pass.

Actual native HTTPS history checks pass31/31 successful phases with reversible
root SQL variants on one existing synthetic grant, not Dodo transactions. The
initial readiness and zero-traffic CLI diagnostics remain separate. Strict-CA
all-five12-model comparison, original-row restoration, owned app/tunnel/browser
closure, session deletion and45,770-file seal reinspection pass. No extra
learning mutation or whole-course replay was needed.
[Exact source and limits](review-status.md#payment-history-recovery-and-account-isolation).
