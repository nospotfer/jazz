# La Cultura del Jazz - LMS Platform

This is a custom, high-performance video course platform built with Next.js, Tailwind CSS, Shadcn UI, Supabase, Prisma, Mux, and Dodo Payments.

## Prerequisites

- Node.js 20.x
- npm 9+

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/jazz-lms.git
cd jazz-lms
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root of the project and add the following environment variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_URL=http://localhost:3000
DATABASE_URL="postgresql://user:password@host:port/database"

# Dodo Payments
DODO_PAYMENTS_API_KEY=YOUR_DODO_PAYMENTS_API_KEY
DODO_PAYMENTS_WEBHOOK_SECRET=YOUR_DODO_PAYMENTS_WEBHOOK_SECRET
DODO_BUSINESS_ID=YOUR_DODO_BUSINESS_ID
DODO_PRODUCT_ID=YOUR_PRODUCT_ID
DODO_ENVIRONMENT=test_mode
```

### 4. Seed the database

Run the following command to seed the database with the course structure:

```bash
npx prisma db push
npm run seed
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Google OAuth URLs (Required)

For Google login/register to work, configure both Supabase and Google Console URLs exactly.

### Supabase Dashboard

Go to **Authentication → URL Configuration** and set:

- **Site URL (dev):** `http://localhost:3000`
- **Additional Redirect URLs:**
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/auth/reset-password`
  - `https://jazz-lms.vercel.app/auth/callback`
  - `https://jazz-lms.vercel.app/auth/reset-password`
  - `https://*.vercel.app/auth/callback`
  - `https://*.vercel.app/auth/reset-password`

### Google Cloud Console

Go to **APIs & Services → Credentials → OAuth 2.0 Client IDs** and set:

- **Authorized JavaScript origins:**
  - `https://feavujcllgbzlvdvkkxx.supabase.co`
- **Authorized redirect URIs:**
  - `https://feavujcllgbzlvdvkkxx.supabase.co/auth/v1/callback`

Go to **Google Auth Platform → Branding** and set:

- **App name:** `Jazz LMS`
- **Support email:** your project support email

> Note: For Supabase OAuth providers, Google redirects back to Supabase (`/auth/v1/callback`), and Supabase then redirects to your app callback (`/auth/callback`).
> Note: In Google's account selector, "Continue to ...supabase.co" is expected when using Supabase-hosted OAuth endpoints.

## Registration Onboarding

- After a new user verifies email and signs in, the dashboard receives a one-time welcome query flag.
- This triggers the same unlock animation used for purchases, with a registration-specific message.
- Only the first class remains free; all other classes stay locked and purchasable.

## Dodo Payments Webhook (MVP)

Use Dodo Payments test mode and configure your webhook endpoint:

- Endpoint: `/api/webhooks/dodo-jazzlms`
- Required events: `order_created`, `order_refunded`
- Signature header: `X-Signature` (validated against `DODO_PAYMENTS_WEBHOOK_SECRET`)

Local automated checkout tests still support a localhost-only fallback path that creates a synthetic purchase record without calling the payment provider. This is intended for QA and Playwright/Vitest flows only and stays disabled in production.

## Gamification Rules

- Quiz medals and the jazz gamification progress remain backend-authoritative.
- A medal is only shown when the user has valid access to the related lesson content through a full course purchase or an individual lesson purchase.
- Users without paid access do not see stored medals in the header or profile, even if historical quiz summary rows exist.
- The profile/header medal badge must not cover the user avatar.
- Before the supreme unlock, the profile medal board is rendered as a fixed 3x5 grid for the 15 lesson slots.
- After all 15 platinum medals are unlocked, the grid disappears and only the supreme medal remains in the profile.
- Lesson video progress is persisted gradually every 5% with backend sync and playback-end auto-complete preserved.
- The profile now includes a shared jazz playlist widget with previous/play-next controls, and the lesson player uses the same music-link source as the profile.
- The jazz arcade quiz overlay now uses the course playlist as an interactive left-side panel, with track switching and platform links tied to the current lesson flow.
- The Spotify player inside the gamification quiz overlay keeps a stable embedded size across desktop breakpoints to avoid stretched or compressed rendering.
- The Complete button stays gray, disabled, and text-only until the student watches at least 80% of the lesson. After reaching this threshold, the button becomes enabled and shows the check icon next to the label, opening gamification on click. For already completed lesson+quiz revisits, the button remains green and clickable.
- A second recognition icon (scroll style) appears in the dashboard header when the student has 100% watched lessons and completed all lesson quizzes with at least a medal; this opens the course completion recognition page.
- The course completion recognition certificate now follows an A4-style formal layout, uses a larger professor signature with teacher name, highlights the supreme medal tier visually, and downloads directly as PDF from the same page.

## Deployment

We recommend deploying this project to [Vercel](https://vercel.com/), the creators of Next.js. Vercel provides a seamless deployment experience for Next.js applications.

### 1. Push to GitHub

Push your code to a GitHub repository.

### 2. Import project on Vercel

Go to your Vercel dashboard and import the project from your GitHub repository.

### 3. Configure environment variables

Add the environment variables from your `.env` file to the Vercel project settings.

### 4. Deploy

Vercel will automatically build and deploy your application.

## Security

Hardening and operational security checklist: see `SECURITY_HARDENING.md`.

Current repository security automation:

- Secret scanning with Gitleaks: `../.github/workflows/secret-scan.yml`
- Static code scanning with CodeQL (JavaScript/TypeScript): `../.github/workflows/codeql-analysis.yml`
- CodeQL query and scope configuration: `../.github/codeql/codeql-config.yml`
- Dependency and GitHub Actions update monitoring via Dependabot: `../.github/dependabot.yml`

## Admin — Painel de Métricas

Em `/admin/stats` os administradores (permissão `analytics.read`) veem um **Painel de Métricas** otimizado para leitura rápida por gestores 50+:

- 8 KPIs em cartões grandes (receita total, matrículas pagas, vouchers, ticket médio, conclusão média, alunos ativos, sessões e conversão — os dois últimos via GA4).
- 3 gráficos (receita, matrículas pagas vs. voucher, conclusão por curso) com Recharts.
- Filtro de período (7d / 30d / 60d / 90d / 12m) via query string `?range=`.
- Moeda oficial: **EUR (€)** com locale `es-ES` em toda formatação de valores.
- Cache de 5 minutos (`unstable_cache` do Next.js) em todas as agregações, invalidável por tag `admin-metrics`.
- Índices dedicados em `Purchase.createdAt`, `User.createdAt`, `UserProgress.createdAt`, `UserProgress.updatedAt`, `VoucherRedemption.redeemedAt` e `LessonQuizSummary.lastAttemptAt` — aplique `prisma/migrations/202604220001_admin_metrics_indexes/migration.sql` em Supabase antes de usar em produção.
- Dados do banco em tempo real (Prisma) + integração opcional com Google Analytics 4. Na ausência das variáveis `GA4_PROPERTY_ID`, `GA4_SERVICE_ACCOUNT_EMAIL`, `GA4_PRIVATE_KEY`, o painel exibe o KPI correspondente como "Indisponível" sem travar a página.

Documentação completa: `docs/painel-metricas-admin.md`.

## Idiomas

- Idioma padrão: **Español (es)**.
- A área administrativa (`/admin/*`) é 100% em espanhol e **não expõe** o seletor de idioma — o idioma fica fixo em `es`.
- A área pública (landing, auth, dashboard do aluno) suporta ES/EN/FR/PT via `LanguageProvider` (`src/lib/language.ts`) e oferece o `<LanguageSelector />` no topo.
- Cookie `jazz_lang` e `localStorage.jazz-language-v1` persistem a escolha do usuário. Quando ausentes, `detectLanguageFromAcceptLanguage` recai em `es`.

## Heatmap — Microsoft Clarity

Coleta de heatmap e gravação de sessões via Microsoft Clarity apenas na área
pública do site (landing, auth, cursos, dashboard do aluno). O admin
(`/admin/*`) é deliberadamente excluído.

- Project ID padrão embutido: `wgmaqx3k1n` (produção Jazz LMS).
- Override opcional via `NEXT_PUBLIC_CLARITY_PROJECT_ID` (staging/QA).
- Data Export API (server-side): `CLARITY_DATA_EXPORT_TOKEN` — JWT secreto,
  configurado apenas como env no Vercel. Endpoint:
  `https://www.clarity.ms/export-data/api/v1/project-live-insights`.
- Código: `src/components/third-parties/clarity-script.tsx`.

## Google Analytics 4 — gtag no browser (opcional)

Coleta de tráfego client-side via `gtag.js`, complementar ao GA4 Data API
usado pelo painel admin. Também excluído de `/admin/*`.

- Requer env `NEXT_PUBLIC_GA_MEASUREMENT_ID` (formato `G-XXXXXXXXXX`).
- Sem o ID configurado, o script não é injetado (fail-safe).
- `anonymize_ip: true` por padrão.
- Código: `src/components/third-parties/google-analytics-script.tsx`.

## Scripts administrativos

- `npm run admin:create` — cria/atualiza usuário admin (lê `ADMIN_EMAIL`/`ADMIN_USER_ID`/`ADMIN_ROLE`).
- `npm run admin:seed-test-voucher` — upsert idempotente do cupom interno `ADMIN99TEST` (99,98% de desconto).
- `npm run admin:wipe-user-activity` — **destrutivo.** Limpa todas as atividades de usuário (compras, progresso, redempções, quizzes) preservando conteúdo (cursos, lições, traduções), vouchers configurados e usuários admin. Requer `CONFIRM=WIPE-USER-ACTIVITY`; opcional `DELETE_REGULAR_USERS=true`.
