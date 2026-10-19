# AGENTS.md

## Project Overview

Jazz LMS ("La Cultura del Jazz") is a Next.js 16 App Router video course platform with Supabase Auth, Prisma/PostgreSQL, Mux, Dodo Payments, Resend, and Tailwind CSS. It sells the complete course; new individual lesson checkout intentionally returns HTTP 410. Historical lesson purchases still exist in the schema/access policy. The first lesson is free after registration. ES is the default language, with EN/FR/PT available in the public/student experience.

## Architecture

- **Auth**: Supabase handles authentication. Two client factories exist: `src/utils/supabase/server.ts` (Server Components/API routes) and `src/utils/supabase/client.ts` (Client Components). Both return safe stubs when env vars are missing so local dev doesn't crash.
- **Database**: Prisma with PostgreSQL. Singleton in `src/lib/db.ts` (`db` export). Schema at `prisma/schema.prisma`. Models include `User`, `Course → Chapter → Lesson → Attachment`, course/lesson purchases, vouchers, progress, quiz attempts and a payment webhook event ledger. SQLite instructions and old Stripe environment variables are legacy.
- **Admin system**: Role-based via `User.role` field (string: `"USER" | "SUPER_ADMIN" | "COURSE_ADMIN" | "CONTENT_CREATOR" | "MODERATOR"`). Guard helpers in `src/lib/admin.ts` (`requireAdmin()`/`requirePermission()`). Admin pages under `src/app/admin/` are layout-protected.
- **User sync**: On auth callback (`src/app/auth/callback/route.ts`), `syncUserWithDatabase()` from `src/lib/sync-user.ts` creates a Prisma `User` record matching the Supabase user.
- **Payments**: Dodo checkout in `src/app/api/checkout/route.ts` and `src/app/api/lesson-checkout/route.ts`. Standard signed webhooks at `src/app/api/webhooks/dodo-jazzlms/route.ts`; reconciliation in the purchases route and cron. Provider helpers are under `src/lib/payments/providers/`. Do not assume a mocked payload matches the documented provider contract.
- **Payment facts**: Checkout metadata records catalog quotes, not charged amounts. Missing provider original/discount facts stay nullable; do not infer them from merchant metadata or a gross total. `Purchase.paymentCurrency` and `paymentAmountMinor` store a nullable canonical provider snapshot; currency and total must come from the same payment object. Use `payment-money.ts` for explicit ISO scales and exact display. Never assign its currency to retained legacy floats. Preserve coupon identity and complete pairs on partial same-reference retries; replacements inherit neither. The additive columns must exist before starting a new generated client. Production migration needs separate approval; see `docs/maintenance/payment-currency.md`.
- **Free grants**: Recheck publication and the exact server-read catalog price inside the grant transaction. Voucher grants take the existing voucher advisory lock before the course `FOR NO KEY UPDATE` lock, then revalidate the server quote. Keep the course lock through entitlement/accounting writes. Paid historical fulfillment does not inherit current catalog restrictions. Administrative voucher-term edits remain a separate concurrency limitation.
- **Media**: Mux signed playback via `src/lib/mux.ts` and lesson access checks. PDF viewing uses a same-origin attachment proxy and native iframe viewer.
- **Messaging**: Resend outbound email and inbound webhook, with messaging tables managed outside the main Prisma models. Review runtime table-creation helpers before using a production database.

## Key Conventions

- **Server Components by default**. Only add `'use client'` when needed (interactivity, browser APIs). See `src/app/auth/page.tsx` for client example.
- **Import alias**: `@/*` maps to `./src/*`. Always use `@/` imports.
- **Auth pattern in pages**: Call `createClient()` → `supabase.auth.getUser()` → redirect to `/auth` if null. See `src/app/dashboard/page.tsx`.
- **Release flow policy**: Use the user-authorized maintenance branch for this goal and previews. Deployment scripts require a clean exact `VERCEL_DEPLOY_COMMIT`, explicit project/team/token configuration and a matching local Vercel project link. Validate remote provider isolation separately. `main` and production changes require the review/approval described in the root instructions; passing a scope guard is not approval.
- **Supabase stubs**: Both Supabase client factories return minimal stubs when `NEXT_PUBLIC_SUPABASE_URL` is unset, allowing the app to render without Supabase configured.
- **Google sign-in operations**: The owner-controlled replacement app/client passes actual first and returning Google login on the isolated preview (Oct19, source fc8d813), with the same Auth/application/Google identity, USER role, original-row preservation and final sessions zero. Provider settings/app/tunnel are restored and closed; two finite runtime error counters remain unclassified. Credentials stay protected on both machines. Follow `docs/maintenance/google-oauth.md` before another fresh target/source/origin/gate window; do not reuse closed access, recreate the actor or expose client secrets. Production credentials/customer continuity and SMTP remain separate release gates.
- **Auth email operations**: With public signup disabled, send pending-account confirmation through `auth.resend({type: "signup", email})`, not login OTP; the latter enters disabled Signup for unconfirmed users. The confirmation template must expose the code. Oct19 source30d848a passes actual hosted confirmation/password login/logout; later evening and automated reset emails are delivered. The latest automated link reaches actual provider303, but Playwright redirected requests bypass the private native adapter before the app callback. Recovery exchange remains incomplete and the password unchanged. All windows preserve original data and restore/close settings/resources. The initial three-action and two separate one-reset budgets are consumed. Follow `docs/maintenance/cloud-auth-mail.md`; retained profiles, credentials and future test preparation grant no further mail or production authority.
- **Component organization**: `src/components/landing/` (homepage sections), `src/components/course/` (player/sidebar), `src/components/layout/` (header, nav), `src/components/ui/` (shadcn primitives).
- **Fonts**: Playfair Display (serif, `--font-serif`) and Inter (sans, `--font-sans`) loaded in root layout.
- **Theme**: Dark and light themes with jazz gold accents. Verify contrast and mobile layouts in both; do not use dark-only text colors on shared surfaces.
- **Server identity**: Verify cookie-backed identity through `supabase.auth.getUser()` before authorization. `getSession().user` is not trusted server-side identity.

## Commands

```bash
npm run dev          # Start Next.js dev server
npm run build        # Production build
npm run seed         # Seed database (ts-node prisma/seed.ts)
npm run seed:sample  # Sample data (npx tsx prisma/seed-sample.ts)
npm run admin:create # Create admin user (needs ADMIN_EMAIL env var)
npm run admin:studio # Open Prisma Studio
npm run check:integrations # Validate Mux + Supabase storage + env
npm run audit:pdfs -- --config /private/pdf-audit.json --project-ref PROJECT_REF --course-id COURSE_ID # Bounded read-only PDF audit; see maintenance runbook
npm run test:payments:backend # Targeted backend payment validation
npm run test:payments:frontend:real # Real Dodo checkout frontend E2E
npm run test:payments:all # Backend + frontend real + build
npx prisma generate  # Regenerate Prisma Client after schema changes
```

The legacy migration chain has no complete initial PostgreSQL baseline. Follow
the README's `db push` setup only for a new disposable database; do not treat
`migrate dev` or `migrate deploy` as a verified bootstrap or recovery command.
Existing databases need individually reviewed SQL and migration-history handling
from `docs/maintenance/payment-currency.md`, with separate production approval.

The inventoried legacy seeds/admin/media mutators require a separate literal
`ENABLE_LOCAL_LEGACY_MUTATIONS=1`, development/test runtime and the dedicated
disposable loopback target. They cannot run in production. Voucher reset requires
explicit user/course scope and defaults to a plan; writes need `--apply`.
See `docs/maintenance/operational-scripts.md` before using operational commands.

Native release helpers under `scripts/native/` use an explicit owner-only JSON
configuration and Node 24. `prepare-release.mjs --inspect` is read-only;
`--build` creates a new private artifact from an exact clean Git checkout without
server credentials in the builder. Neither command starts services.
`launch-preview.mjs` starts only a bounded Linux preview after release inspection,
using owner-only Unix sockets and a fixed-expiry Basic gate. Production startup
is denied. Its explicit Quick Tunnel Worker exception is preview-only; general
ingress continues to deny Worker browsing. `reconcile-runner.mjs` has a
preparation-only CLI and no activation flag. A separately verified tunnel boundary
is still required; plain `npm start` does not establish it. See
`docs/maintenance/native-runtime.md` before startup or hosting changes.

## File Patterns

| Pattern | Location |
|---------|----------|
| Pages (server) | `src/app/**/page.tsx` |
| API routes | `src/app/api/**/route.ts` |
| Server actions | `src/actions/*.ts` |
| Shared libs | `src/lib/**` (db, admin, sync-user, payments/provider, payments/providers/dodo) |
| Auth utilities | `src/utils/supabase/{client,server,middleware}.ts` |
| UI primitives | `src/components/ui/*.tsx` (shadcn/radix-based) |

## Gotchas

- **Role field is string-based**: `User.role` is a `String` with `@default("USER")`, not a Prisma enum. Use constants from `src/lib/admin/permissions.ts`.
- **Prisma Client must be regenerated** after any `schema.prisma` change: run `npx prisma generate`.
- **Applied migration SQL is immutable**: keep the bytes of recorded migrations unchanged; put later changes in a new migration. The four historically recorded checksums are protected by `tests/security/historical-migration-integrity.test.ts`. Source restoration does not update a database ledger; see `docs/maintenance/payment-currency.md` before reconciliation or replay.
- **Next.js proxy**: `src/proxy.ts` handles language cookies and root/dashboard/admin session processing. API routes must enforce their own authentication and authorization.
- **Test framework is configured**: Vitest for unit/integration/contract/security/system and Playwright for E2E.
- **Real Dodo frontend E2E requires env preconditions** (`PAYMENTS_E2E_REAL_ENABLED=1`, `PAYMENTS_E2E_STORAGE_STATE`, `PAYMENTS_E2E_COURSE_ID`).
- **Admin pages are layout-protected**, but privileged data reads, API routes and actions must also enforce the permission relevant to their operation. Do not rely on a layout to authorize an API/action.
- **Maintenance evidence**: See `docs/maintenance/` for inventory, verified issues, checks and remaining work. Use synthetic environment values for mocked tests; never run seeds, test purchase resets, migrations or payment scripts against production during unattended work.
