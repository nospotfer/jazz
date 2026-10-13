# La Cultura del Jazz

Course platform for [culturadeljazz.com](https://www.culturadeljazz.com), maintained
in the `jazz-lms/` directory of [nospotfer/jazz](https://github.com/nospotfer/jazz).
Next.js 16, React 18, Node 24, Supabase Auth/storage, PostgreSQL/Prisma, signed Mux
video, Dodo Payments and Resend.

The product sells the **complete course**. Registration unlocks the first
published lesson. New individual lesson checkout intentionally returns HTTP 410;
historical lesson purchases remain valid. Spanish is the default student
language, with English, French and Portuguese available; administration uses
Spanish.

## Local setup

```bash
git clone https://github.com/nospotfer/jazz.git
cd jazz/jazz-lms
nvm use
npm ci
cp .env.example .env.local
npm run dev
```

Use Node 24.x (`.nvmrc`, `.node-version` and `package.json` agree). `npm ci`
regenerates Prisma Client and installs the repository's secret-scan hooks.
Populate `.env.local` with an **isolated development** Supabase project and
PostgreSQL database. Configure both `APP_URL` and `NEXT_PUBLIC_APP_URL` for the
local origin. Missing Supabase configuration renders a limited public preview;
it cannot verify accounts, media entitlements or persistence.

The original local environment is legacy and its Supabase/pooler connection
failed during the maintenance audit. Verify the active provider project before
using any saved credentials. Keep environment files, provider sessions, test
passwords and the credential CSV out of Git and logs.

For a new disposable database only, `npx prisma db push` creates the Prisma
schema. Messaging additionally requires `prisma/setup-messaging.sql`; it is not
created during HTTP requests. The migration directory contains incremental SQL
and a legacy SQLite file, rather than a verified complete PostgreSQL baseline.
**Do not run seeds, db push, migration or wipe/reset scripts on production.**
Inspect existing schema/applied migrations and a restorable backup first.
See [messaging operations](docs/maintenance/messaging.md).

The maintenance fixture seed in `scripts/maintenance/seed-local-fixtures.mjs`
rejects non-loopback databases and creates synthetic users/content. It is
intended for the isolated local Supabase stack, never the live course.

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build:webpack
npm run security:secrets
```

Vercel's checked-in build uses webpack (`vercel.json`); `npm run build` also
supports Turbopack. Browser tests use Playwright; install a browser before use.
Tests needing real PostgreSQL are opt-in and skip without their guarded test
connection variables. A passing mocked suite does not prove live provider
configuration. See [verification evidence](docs/maintenance/verification-matrix.md)
for the real database/browser checks and remaining gaps.

## Authentication and access

Supabase verifies server identities through `auth.getUser()`. Registration/email
verification must prove ownership before changing an existing account. OAuth
flows return through `/auth/callback`; password recovery exchanges its PKCE code
at `/auth/reset-password/callback`, then opens `/auth/reset-password`.

In each isolated Supabase environment, configure the app origin and exact
callback/recovery URLs. Google's OAuth redirect points to the **active Supabase
project's** `/auth/v1/callback`, then Supabase returns to the app. Do not copy the
retired project reference or grant every `*.vercel.app` preview access to
production authentication.

Lesson video/PDF/progress/quiz/notes endpoints enforce identity, publication and
purchase access independently of the page layout. Free first-lesson progress is
supported; paid quizzes require an eligible course or historical lesson purchase.
Quiz scoring and stored medals are server-authoritative. Certificate eligibility
uses persisted progress and quiz results; browser verification is tracked in the
maintenance matrix.

## Payments and email

Dodo test mode is required for local/staging transactions. Checkout, provider
signature verification, refund/dispute barriers and coupon accounting have
regression coverage. Actual account products/settings and real test checkout
remain unverified until current Dodo access is available.

Dodo webhooks use `webhook-id`, `webhook-timestamp` and `webhook-signature` with a
Standard Webhooks signing secret; the old `order_created`/`X-Signature` guide was
incorrect. Follow [local Dodo setup](docs/10-dodo-local-setup.md) and
[voucher checks](docs/09-voucher-sandbox-checkout.md).

The daily payment sweep is scheduled for **03:15 UTC**. `CRON_SECRET` must be
configured; the endpoint rejects missing/incorrect bearer credentials and
spoofed Vercel headers. Reconciliation fetches payment detail before accounting
for applied coupons. Purchase records represent entitlements and do not yet
constitute a complete currency/tax/refund financial journal.

Resend outbound contact and professor notifications use `RESEND_API_KEY` and
`RESEND_FROM_EMAIL`. Native inbound replies additionally need receiving DNS,
an enabled `email.received` webhook, `RESEND_WEBHOOK_SECRET`, a receiving
`MESSAGES_REPLY_TO_EMAIL`, and validated professor sender authentication.
See [messaging operations](docs/maintenance/messaging.md). The optional legacy
relay secret is separate from Resend's signing secret.

## Operations and release

Read [AGENTS.md](AGENTS.md) and the [maintenance handover](docs/maintenance/README.md).
The maintenance branch is `maintenance/initial-audit`. Preview deployments are
authorized when provider data is isolated. Production deployment/configuration,
migrations, destructive operations, real payments/refunds, plan changes and
third-party messages require the owner's explicit approval.

Legacy deploy scripts still encode old branch/account assumptions. Verify their
actual target and environment before use. Preserve the previous production
commit/deployment and migration-specific rollback before release; an app rollback
does not undo a database migration. See the [release checklist](docs/maintenance/release-checklist.md).

Quality checks run through `.github/workflows/quality.yml`; redacted Gitleaks
reports run through `.github/workflows/secret-scan.yml`. GitHub **default CodeQL
setup** is enabled; there is no checked-in CodeQL workflow. Native secret
scanning and branch/ruleset enforcement were not enabled at inspection. Passing
CI alone currently cannot enforce protected merges. See
[security operations](SECURITY_HARDENING.md).

Optional analytics and session replay are configured separately from core
course services. The updated source disables them on account/student/admin/payment
pages and requires an explicit homepage preference. Provider privacy settings
and live configuration verification remain release gates; do not infer compliance
from a single browser setting.
