# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

`AGENTS.md` (repo root: operating contract, approvals, credential rules) and
`jazz-lms/AGENTS.md` (app architecture, payment/auth invariants, native release
tooling) are authoritative and are loaded alongside this file. This file adds what
they leave out; it does not restate them.

## Repository layout

The repo root holds only the instructions, CI (`.github/workflows/`) and an ignored
credential CSV. All application code lives in `jazz-lms/` (Next.js 16 App Router,
React 18, Prisma 5.17, Supabase, Mux, Dodo Payments, Resend, Tailwind 4). Run every
npm command from `jazz-lms/`.

## Commands

**Node 24 is required.** The shell's default `node` on this machine is v22. Under v22
about 212 native-runtime security tests fail with `NATIVE_RUNTIME_VERSION` and
similar errors that look real but are not. Run `nvm use` in `jazz-lms/` or prefix with
`PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`.

```bash
npm run lint              # eslint (0 errors expected; ~25 existing warnings)
npm run typecheck         # tsc --noEmit
npm test                  # all Vitest suites (~3,060 pass / 80 skip, ~30s)
npm run build:webpack     # the build CI and Vercel use; `npm run build` uses Turbopack
npm run security:secrets  # gitleaks-style scan of the whole tree

npx vitest run tests/unit/pricing.test.ts           # one file
npx vitest run tests/security -t "rejects expired"  # one test by name
npm run test:unit | test:integration | test:security | test:system | test:contract
npx playwright test tests/e2e/smoke.spec.ts          # E2E (starts `npm run dev` on 127.0.0.1:3000)
```

Persisted PostgreSQL tests (`*-postgres.test.ts`) skip unless their database URLs are
set. CI (`.github/workflows/quality.yml`, `postgres` job) shows the exact recipe:
a disposable PG17, `npx prisma db push --skip-generate`, then
`prisma db execute --file prisma/setup-messaging.sql`. It sets `DATABASE_URL`,
`PAYMENTS_TEST_DATABASE_URL`, `MAINTENANCE_DATABASE_URL`,
`MESSAGING_TEST_DATABASE_URL` and `LMS_DATABASE_SECURITY_DATABASE_URL` to that
database and runs the listed files serially with `--no-file-parallelism`. Never point
them at a provider database.

Git hooks (`jazz-lms/.githooks`, installed by `npm ci`) run the secret scan on commit.
On push they block `main`, and on `maintenance/initial-audit` they run lint plus
`test:integration`.

## Architecture: the parts that span many files

- **Request pipeline**: `src/proxy.ts` (Next 16 replacement for middleware) sets the
  language cookie and refreshes the Supabase session for root/dashboard/admin. It
  does not authorize anything. Each page, API route and action re-verifies identity
  via `supabase.auth.getUser()`, then loads the Prisma `User` row and its persisted
  role (`src/lib/server-user.ts`, `src/lib/admin.ts`, `src/lib/admin/permissions.ts`).
- **Entitlement model**: `resolveLessonAccessPolicy` (`src/lib/lesson-access.ts`)
  grants access for an admin role, a whole-course `Purchase`, a historical
  `LessonPurchase`, or the free first published lesson. Quizzes and medals require
  paid or admin access. Purchases are written only through
  `src/lib/course-purchase-sync.ts`, which also handles revocation on
  refund or dispute. Video (`/api/lessons/[id]/mux-playback`), PDFs
  (`/api/lessons/[id]/attachments/[id]`, a same-origin proxy to the private Supabase
  bucket), progress, quizzes and notes each enforce it independently.
- **Payments flow**: `/api/checkout` builds a server-side quote (`src/lib/pricing.ts`,
  vouchers in `src/lib/vouchers.ts`) and creates a Dodo checkout
  (`src/lib/payments/providers/dodo.ts`). Fulfillment is driven by the signed webhook
  `/api/webhooks/dodo-jazzlms` (`dodo-events.ts`, idempotent via the
  `PaymentWebhookEvent` ledger). Missed webhooks are covered by
  `/api/purchases/auto-reconcile` and the `/api/cron/payments-sweep` cron
  (`src/lib/payments/dodo-reconciliation.ts`). Free/100%-voucher grants skip Dodo and
  use row locks. `CHECKOUT_DISABLED=true` turns off all new purchases and grants
  without touching webhook or reconciliation paths.
- **Data access split**: the app never queries tables through the Supabase Data API.
  All data goes through Prisma (`src/lib/db.ts`) in server code; messaging uses raw
  SQL (`src/lib/messages-db.ts`) against tables created by
  `prisma/setup-messaging.sql`. Supabase supplies Auth and private Storage only.
  This is why browser-role grants on public tables are a pure liability (see the
  `harden-*.sql` files).
- **i18n**: there is no i18n library. Each component holds an inline
  `{ es, en, fr, pt }` dictionary and reads the language from
  `components/providers/language-provider.tsx` (cookie/localStorage, default `es`).
  Course content uses the `*Translation` Prisma models
  (`src/lib/course-translations.ts`). Admin UI is Spanish-only. A user-facing copy
  change must update all four languages.
- **Native runtime** (`jazz-lms/scripts/native/`): a self-hosting path that replaces
  Vercel. `prepare-release.mjs` builds a sealed, hash-manifested artifact from a clean
  commit. `release-inspect.mjs` verifies it. `next-worker.mjs` runs Next behind
  `ingress-server.mjs` on Unix sockets, and Cloudflare tunnels provide HTTPS.
  `launch-preview.mjs` serves Basic-gated, time-boxed previews.
  `launch-production*.mjs` and `production-service-plan.mjs` handle production and its
  container units. `ops/maintenance/` is the static 503 fallback page. Most
  `tests/security/native-*.test.ts` and `tests/system/` cover these scripts.

## Infrastructure map

Exact IDs, states and evidence are in `jazz-lms/docs/maintenance/service-inventory.md`.

| Piece | What it is |
| --- | --- |
| Monster (this host) | Development machine and, since 2026-11-20, the production host: user units `jazz-production.service` (container) + `jazz-production-tunnel.service` (named tunnel `culturadeljazz-production`), plus `jazz-db-backup.timer` (nightly DB dump to `~/backups/culturadeljazz-production/db/` and Behemoth; its unit names the current candidate's runtime config, so update it on each release). It also runs unrelated Neurofactory/"doneness" containers and tunnels; leave them alone. |
| Behemoth | Second owner host. Holds preview launchers for the owner and the encrypted second-host backup copy. |
| Vercel `jazz-lms` (Neurofactory team, Hobby) | Former production host. Paused since 2026-10-20 and no longer in DNS. Hobby forbids commercial use, so it is not the long-term host. Its payment cron is still configured. |
| Supabase `feavujcllgbzlvdvkkxx` | Original production backend, INACTIVE. Browser roles had read/write on every table, and users could change their own role. Never resume it without hardening. |
| Supabase `klaiiikojgdfclzhqfgt` | Production backend since 2026-11-20 (Free plan; pauses after 7 idle days). Restored 2026-10-13 archive, all 68 PDFs, hardened grants. |
| Supabase `tvmhuacxctdgmejziaxg` | Isolated synthetic preview backend. The only backend for free-form testing. |
| DNS | Squarespace registrar (owner's Google sign-in); nameservers moved to the owner Cloudflare account on 2026-11-20; apex/www route to the named tunnel. |
| Dodo Payments | LIVE and TEST modes. Standard Webhooks signatures (`webhook-id` / `webhook-timestamp` / `webhook-signature`). |

Private configs, fixtures and recovery inputs live outside Git under
`~/.config/culturadeljazz-maintenance/` and `~/backups/culturadeljazz-maintenance/`.
Read them only when a task needs them, and never print their values. Keep
`ps`/`pgrep` output redacted too: running tunnel processes carry tokens in their
command lines.

## Resuming maintenance work

The maintenance docs (`jazz-lms/docs/maintenance/`, ~1.4 MB) are mostly dated,
append-only evidence. Read the top of `backlog.md` and `production-readiness.md`
for the current checkpoint, and `release-review.md` for the owner-facing summary.
Everything under an "Earlier …" heading is history, not a to-do list.
`README.md` there indexes the rest. Open draft PR: nospotfer/jazz#46
(`maintenance/initial-audit` → `main`). The GitHub default branch is
`feat/jazz-lms-platform`, so set the base explicitly.
