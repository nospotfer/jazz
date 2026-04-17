# Painel de Métricas (Admin) — Repository Review

> Commit 1/3 da entrega do Painel de Métricas. Este documento é o **inventário técnico** do que já existe no repositório e serve de base para o commit 2 (estrutura) e o commit 3 (documentação completa).
>
> **Branch:** `jazz-lms-dev-vercel` · **Escopo:** apenas leitura/mapeamento, nenhum código de produto é alterado nesta etapa.

## 1. Objetivo desta etapa

Responder, com evidências do código, a três perguntas antes de desenhar o painel:

1. Que área administrativa já existe hoje?
2. Que dados estão disponíveis no banco para agregar em métricas?
3. Quais são os fluxos de usuário e pontos de conversão que o painel precisará observar?

O resultado alimenta o desenho de KPIs e a escolha de camada de dados (banco vs. Google Analytics 4).

## 2. Área administrativa atual

### 2.1 Rotas

Árvore atual em [src/app/admin](../src/app/admin):

- [src/app/admin/layout.tsx](../src/app/admin/layout.tsx) — layout base do admin.
- [src/app/admin/page.tsx](../src/app/admin/page.tsx) — "Panel" (home do admin).
- [src/app/admin/loading.tsx](../src/app/admin/loading.tsx) — skeleton de loading.
- [src/app/admin/courses/](../src/app/admin/courses) — gestão de cursos.
- [src/app/admin/users/](../src/app/admin/users) — gestão de usuários.
- [src/app/admin/vouchers/](../src/app/admin/vouchers) — gestão de vouchers.
- [src/app/admin/stats/page.tsx](../src/app/admin/stats/page.tsx) — **página atual de estatísticas** (será substituída pelo novo painel).

### 2.2 Componentes de chassi

- [src/components/admin/sidebar.tsx](../src/components/admin/sidebar.tsx) — navegação lateral.
- [src/components/admin/header.tsx](../src/components/admin/header.tsx) — topo.
- [src/components/admin/analytics-card.tsx](../src/components/admin/analytics-card.tsx) — card simples de métrica (será evoluído para `kpi-card`).
- [src/components/admin/vouchers-admin-client.tsx](../src/components/admin/vouchers-admin-client.tsx) — UI cliente de vouchers.

### 2.3 Itens atuais do sidebar

Definidos em `MENU_ITEMS` de [src/components/admin/sidebar.tsx](../src/components/admin/sidebar.tsx):

| Rota             | Label         | Permissão         |
| ---------------- | ------------- | ----------------- |
| `/admin`         | Panel         | `admin.access`    |
| `/admin/courses` | Cursos        | `courses.read`    |
| `/admin/users`   | Usuarios      | `users.read`      |
| `/admin/stats`   | Analíticas    | `analytics.read`  |
| `/admin/vouchers`| Vouchers      | `vouchers.read`   |

> Decisão (a ser validada no commit 2): renomear o label **"Analíticas" → "Métricas"** para ficar mais direto ao público administrativo 50+.

### 2.4 Autenticação e autorização

- [src/lib/admin.ts](../src/lib/admin.ts) expõe `requireAdmin()` e `requirePermission(permission)`.
- [src/app/admin/layout.tsx](../src/app/admin/layout.tsx) chama `requireAdmin()` antes de renderizar qualquer página.
- [src/lib/admin-api.ts](../src/lib/admin-api.ts) expõe `ensureAdminApiPermission(permission)` para proteger rotas de API.
- [src/lib/admin/permissions.ts](../src/lib/admin/permissions.ts) define 4 papéis e o mapa de permissões.

Permissão relevante para o painel: **`analytics.read`**, já concedida hoje a:

- `SUPER_ADMIN`
- `COURSE_ADMIN`

`CONTENT_CREATOR` e `MODERATOR` **não** acessam métricas — comportamento desejado.

## 3. APIs administrativas existentes

Árvore em [src/app/api/admin](../src/app/api/admin):

- `/api/admin/vouchers` (GET/POST) — lista com `stats` agregadas e criação.
- `/api/admin/vouchers/[voucherId]` (GET/PATCH) — detalhe e atualização.
- `/api/admin/vouchers/[voucherId]/toggle` (POST) — ativa/desativa.
- `/api/admin/vouchers/generate` (POST) — geração em lote.
- `/api/admin/vouchers/export` (GET) — CSV.
- `/api/admin/vouchers/bulk-delete` (DELETE).
- `/api/admin/vouchers/revert-test-use` (POST).
- `/api/admin/vouchers/purge-legacy` (DELETE).
- `/api/admin/vouchers/reset-user-state` (POST).

**Gap identificado:** não existe uma família `/api/admin/metrics/*` nem qualquer endpoint dedicado a agregações analíticas. A página [src/app/admin/stats/page.tsx](../src/app/admin/stats/page.tsx) hoje faz `db.course.findMany`, `db.purchase.findMany`, `db.user.findMany`, `db.userProgress.findMany` **sem filtro de período** e agrega em memória no servidor — abordagem que não escala e não suporta filtros de tempo.

## 4. Modelos Prisma relevantes para métricas

Todos em [prisma/schema.prisma](../prisma/schema.prisma). Campos de data indexados são os pilares para séries temporais.

### 4.1 `User`
- `id`, `email` (único), `name`, `role`.
- `createdAt` → **coorte de novos usuários** por período.

### 4.2 `Course`
- `id`, `title`, `price`, `isPublished`.
- `@@index([isPublished, createdAt])` → consultas rápidas de catálogo ativo.
- Relação `purchases` → conta de vendas por curso.

### 4.3 `Purchase` (pilar da receita)
- `userId`, `courseId`, `voucherId?`.
- `originalPrice`, `finalPrice`, `discountAmount`.
- `providerReferenceId` (Dodo Payments).
- `createdAt` **indexado** → séries temporais de receita/matrículas.
- `@@unique([userId, courseId])` → garante uma compra por curso por usuário.

### 4.4 `VoucherCode` + `VoucherRedemption`
- `VoucherCode`: `type` (`FREE_ACCESS` / `DISCOUNT_PERCENT` / `DISCOUNT_FIXED`), `discountPercent`, `discountAmount`, `maxUses`, `currentUses`, `isActive`, `expiresAt`.
- `VoucherRedemption`: `voucherId`, `userId`, `purchaseId` (único), `redeemedAt` → série temporal de resgates.

### 4.5 `UserProgress`
- `userId`, `lessonId`, `isCompleted`, `progressPercent`, `minutesRemaining`.
- `@@unique([userId, lessonId])`.
- `updatedAt` → base para taxa de conclusão no período.

### 4.6 `LessonQuizAttempt` + `LessonQuizSummary`
- `LessonQuizAttempt`: `scorePercent`, `correctCount`, `medal`, `completedAt`, `createdAt`. Índices em `[userId, lessonId, createdAt]` e `[lessonId, completedAt]`.
- `LessonQuizSummary`: agregado por usuário/aula — `bestScorePercent`, `bestMedal` (`NONE`/`BRONZE`/`SILVER`/`GOLD`/`PLATINUM`), `totalAttempts`, `lastAttemptAt`.

### 4.7 `LessonNote`
- Criação e edição de anotações do aluno — proxy de engajamento com conteúdo (opcional para V1).

### 4.8 `PaymentWebhookEvent`
- `status` (`RECEIVED` / `PROCESSING` / `PROCESSED` / `FAILED` / `IGNORED`), `attemptCount`, `lastError`, `processedAt`.
- Fonte para KPI de saúde de pagamentos (opcional para V1).

## 5. Fluxos críticos e pontos de conversão

Cada fluxo abaixo traz o ponto de entrada, o evento de sucesso observável e a tabela que registra o resultado.

### 5.1 Autenticação (aquisição)
- Entrada: [src/app/auth/page.tsx](../src/app/auth/page.tsx) (login/signup).
- Sucesso: registro concluído → nova linha em `User` (`createdAt`).
- Apoia KPI: **Novos alunos** no período.

### 5.2 Catálogo → detalhe do curso → checkout (conversão)
- Entrada: [src/app/courses/page.tsx](../src/app/courses/page.tsx) → [src/app/courses/[courseId]/page.tsx](../src/app/courses/[courseId]/page.tsx).
- Checkout: [src/app/api/checkout/route.ts](../src/app/api/checkout/route.ts) (Dodo Payments).
- Sucesso: nova linha em `Purchase`, com `finalPrice`, `discountAmount` e opcional `voucherId`.
- Apoia KPIs: **Receita total**, **Matrículas**, **Ticket médio**.

### 5.3 Resgate de voucher (FREE_ACCESS)
- Entrada: formulário de código no checkout.
- Sucesso: `Purchase` criada com `voucherId` **e** `VoucherRedemption` registrado.
- Apoia KPIs: **Vouchers resgatados**, composição de matrículas pagas vs. gratuitas.

### 5.4 Progresso de aula (engajamento)
- Entrada: aula no player [src/components/course/course-player.tsx](../src/components/course/course-player.tsx).
- Sucesso: `UserProgress.isCompleted = true` para a aula.
- Apoia KPI: **Taxa de conclusão** (concluídas ÷ iniciadas no período).

### 5.5 Quiz e medalhas (gamificação)
- Entrada: quiz final da aula.
- API: [src/app/api/dashboard/quiz-medals/route.ts](../src/app/api/dashboard/quiz-medals/route.ts).
- Sucesso: nova `LessonQuizAttempt`; `LessonQuizSummary` atualizado com `bestMedal ≠ NONE`.
- Apoia KPI: **Medalhas conquistadas** e distribuição por tier.

### 5.6 PDF / anotações (interação com conteúdo)
- Entrada: [src/components/dashboard/pdf-view-client.tsx](../src/components/dashboard/pdf-view-client.tsx).
- Fonte de URL: API de attachment com URL assinada (Supabase Storage).
- Sinal: `LessonNote` criada/atualizada. Opcional para V1.

## 6. Stack de UI disponível

- **Framework:** Next.js 16.2.x com App Router + Turbopack. Confirmado em [package.json](../package.json) e [next.config.mjs](../next.config.mjs).
- **Estilo:** Tailwind CSS + `next-themes` (dark mode por classe). Tokens de marca em [tailwind.config.ts](../tailwind.config.ts):
  - `jazz.dark` `#1A1A1A`
  - `jazz.light` `#FAFAFA`
  - `jazz.accent` `#D4AF37` (dourado, cor-assinatura)
  - `burgundy` `#8B3A3A`
  - `cream` `#F5EBE0`
- **Primitivos de UI:** Radix + composições próprias em [src/components/ui](../src/components/ui).
- **i18n de conteúdo:** via banco — `CourseTranslation`, `ChapterTranslation`, `LessonTranslation`, `Attachment.language` (`es`, `en`, `fr`, `pt`). **Não** há biblioteca de i18n para strings de UI; o admin é hoje predominantemente em espanhol.

## 7. Gaps identificados (alimentam o commit 2)

1. **Nenhuma biblioteca de gráficos** instalada. Nenhuma ocorrência de `recharts`, `chart.js`, `tremor`, `nivo`, `visx` em [package.json](../package.json).
2. **Nenhuma integração de Google Analytics / GA4 / gtag / @vercel/analytics / posthog / plausible** no código. Busca em `src/**` retornou zero ocorrências.
3. **Nenhuma API de agregação** dedicada a métricas (`/api/admin/metrics/*` inexistente).
4. **Nenhum filtro de período** na página atual de estatísticas — agrega sempre "tudo desde sempre".
5. **Acessibilidade não tratada explicitamente** para público 50+: tamanhos de fonte e contrastes dependem dos padrões Tailwind, sem diretriz documentada.
6. **Sem testes** específicos para a página `stats`.

## 8. Padrão de testes já estabelecido

- Unit: [tests/unit](../tests/unit) com Vitest (ex.: `lesson-quiz.test.ts`).
- Integração: [tests/integration](../tests/integration) com Vitest + `vi.doMock` das dependências (ex.: [tests/integration/admin-vouchers-route.test.ts](../tests/integration/admin-vouchers-route.test.ts) — modelo que o painel deve seguir para testar rotas).
- E2E: Playwright em [tests/e2e](../tests/e2e).
- Execução: `npm run lint`, `npm exec vitest run`, `npm run test:integration`.

## 9. Padrão de deploy

- Script: `npm run deploy:test` ([scripts/deploy-preview.sh](../scripts/deploy-preview.sh)).
- Pipeline: lint → testes de integração → build (`next build --turbopack` + `prisma generate` + sync do worker do PDF.js) → `vercel --yes`.
- **Regra obrigatória do projeto:** após qualquer mudança, rodar `deploy:test` na branch `jazz-lms-dev-vercel` e validar no alias canônico <https://jazz-lms-neurofactory-neurofactorys-orgs-projects.vercel.app>.

## 10. Conclusões que entram no commit 2

- A camada de dados do banco é **suficiente** para 7 dos 8 KPIs planejados (receita, matrículas, ticket médio, novos alunos, conclusão, vouchers, medalhas).
- O 8º KPI (tráfego) depende de **Google Analytics 4 Data API** — integração nova a ser adicionada no commit 2 como dependência opcional com *fallback* gracioso.
- O painel precisa de **uma nova família de APIs** (`/api/admin/metrics/*`) e de uma **biblioteca de gráficos** a ser escolhida no commit 2 (candidata principal: Recharts).
- A rota `/admin/stats` será **reconstruída** em vez de criar uma nova rota; o label do sidebar passa a ser **"Métricas"**.
- A autorização por `analytics.read` já está pronta e será reutilizada sem alterações.

---

**Próximo passo:** commit 2 — `docs/painel-metricas-admin-estrutura.md`, definindo KPIs, contratos de API, hierarquia visual e escolhas técnicas.
