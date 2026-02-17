# AGENTS.md

## Project Overview

Jazz LMS ("La Cultura del Jazz") — a video course platform built with Next.js 14 (App Router), Supabase Auth, Prisma (SQLite), Stripe payments, and Tailwind CSS. Single-course sales model with chapter/lesson hierarchy.

## Architecture

- **Auth**: Supabase handles authentication. Two client factories exist: `src/utils/supabase/server.ts` (Server Components/API routes) and `src/utils/supabase/client.ts` (Client Components). Both return safe stubs when env vars are missing so local dev doesn't crash.
- **Database**: Prisma with SQLite. Singleton in `src/lib/db.ts` (`db` export). Schema at `prisma/schema.prisma`. Models: `User`, `Course → Chapter → Lesson → Attachment`, `Purchase`, `UserProgress`.
- **Admin system**: Role-based via `User.role` field (string: `"USER"` | `"ADMIN"`). Guard helpers in `src/lib/admin.ts` (`requireAdmin()` redirects non-admins). Admin pages under `src/app/admin/` are layout-protected.
- **User sync**: On auth callback (`src/app/auth/callback/route.ts`), `syncUserWithDatabase()` from `src/lib/sync-user.ts` creates a Prisma `User` record matching the Supabase user.
- **Payments**: Stripe checkout in `src/app/api/checkout/route.ts`. Webhook at `src/app/api/webhooks/stripe/route.ts` creates `Purchase` records on `checkout.session.completed`.

## Key Conventions

- **Server Components by default**. Only add `'use client'` when needed (interactivity, browser APIs). See `src/app/auth/page.tsx` for client example.
- **Import alias**: `@/*` maps to `./src/*`. Always use `@/` imports.
- **Auth pattern in pages**: Call `createClient()` → `supabase.auth.getUser()` → redirect to `/auth` if null. See `src/app/dashboard/page.tsx`.
- **Supabase stubs**: Both Supabase client factories return minimal stubs when `NEXT_PUBLIC_SUPABASE_URL` is unset, allowing the app to render without Supabase configured.
- **Component organization**: `src/components/landing/` (homepage sections), `src/components/course/` (player/sidebar), `src/components/layout/` (header, nav), `src/components/ui/` (shadcn primitives).
- **Fonts**: Playfair Display (serif, `--font-serif`) and Inter (sans, `--font-sans`) loaded in root layout.
- **Theme**: Dark theme, black/gray backgrounds, yellow-500 accent color throughout.

## Commands

```bash
npm run dev          # Start Next.js dev server
npm run build        # Production build
npm run seed         # Seed database (ts-node prisma/seed.ts)
npm run seed:sample  # Sample data (npx tsx prisma/seed-sample.ts)
npm run admin:create # Create admin user (needs ADMIN_EMAIL env var)
npm run admin:studio # Open Prisma Studio
npx prisma migrate dev --name <name>  # Apply migrations
npx prisma generate  # Regenerate Prisma Client after schema changes
```

## File Patterns

| Pattern | Location |
|---------|----------|
| Pages (server) | `src/app/**/page.tsx` |
| API routes | `src/app/api/**/route.ts` |
| Server actions | `src/actions/*.ts` |
| Shared libs | `src/lib/*.ts` (db, stripe, admin, sync-user, utils) |
| Auth utilities | `src/utils/supabase/{client,server,middleware}.ts` |
| UI primitives | `src/components/ui/*.tsx` (shadcn/radix-based) |

## Gotchas

- **SQLite has no enums**: `User.role` is a `String` with `@default("USER")`, not a Prisma enum. Compare with `"ADMIN"` string literal.
- **Prisma Client must be regenerated** after any `schema.prisma` change: run `npx prisma generate`.
- **Middleware runs on all routes** (except static/image/favicon). Session refresh happens via `src/utils/supabase/middleware.ts`.
- **No test framework** is configured. No test runner or test files exist.
- **Admin pages are layout-protected** — the `src/app/admin/layout.tsx` calls `requireAdmin()` which redirects non-admins. Individual admin pages don't need their own auth checks.
