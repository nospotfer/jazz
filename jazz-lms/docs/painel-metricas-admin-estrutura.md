# Painel de Métricas (Admin) — Estrutura do Dashboard

> Commit 2/3. Define **o que** o painel vai mostrar, **de onde** os dados vêm, **como** é acessado e **por que** cada escolha foi feita. A base é o inventário de [docs/painel-metricas-admin-review.md](./painel-metricas-admin-review.md).
>
> **Escopo desta etapa:** ainda só documentação. Nenhum código de produto é alterado.

## 1. Princípios estruturais (público 50+ aposentado)

Todas as decisões abaixo derivam destes princípios, que vão guiar também o commit 3 (documento completo de UX/UI):

1. **Uma ideia por tela, um número por card.** Densidade baixa, respiro alto.
2. **Rótulos diretos em português claro.** "Matrículas pagas" em vez de "Conversions". "Receita" em vez de "MRR".
3. **Nunca depender só de cor.** Cada delta traz ícone + sinal (▲ / ▼) + texto.
4. **Alvos grandes.** Mínimo 44×44 px para botões e abas, fonte base ≥ 17 px, número principal dos KPIs ≥ 40 px.
5. **Contraste AA+ obrigatório** em tema claro e escuro (ver paleta no commit 3).
6. **Tudo sensível no backend.** Agregações e permissões calculadas no servidor; o cliente só renderiza.
7. **Falha graciosa.** Se GA4 estiver indisponível, o painel segue funcionando só com dados do banco e um bloco explica o que está offline.

## 2. Decisões técnicas travadas

| Item                 | Decisão                                              | Motivo                                                                                   |
| -------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Fonte de dados       | Híbrida: Prisma + Google Analytics 4 (Data API)      | Cobre receita/conteúdo/gamificação (DB) e tráfego/origem (GA4) sem duplicar              |
| Biblioteca de gráfico | **Recharts**                                         | SVG acessível, integra bem com Tailwind/shadcn, leve, amplamente usada                   |
| Renderização         | Server component com `revalidate = 300` + client refetch para filtro de período | Primeiro render rápido, interação fluida sem reload de página          |
| Cache GA4            | Em memória, 5 minutos                                | Reduz custo e respeita limites de quota da Data API                                      |
| Rota                 | Reaproveita `/admin/stats` (reconstruída)            | Já está linkada no sidebar, evita rota órfã                                              |
| Permissão            | `analytics.read` (já concedida a SUPER_ADMIN e COURSE_ADMIN) | Sem mudança no modelo de permissões                                              |
| Label do sidebar     | "Analíticas" → **"Métricas"**                         | Mais direto para o público administrativo                                                |
| Idioma da UI do painel | pt-BR fixo na V1                                     | Usuários do admin são a equipe; conteúdo dos cursos continua multilíngue                |
| Agregações           | 100% server-side via `prisma.$queryRaw` + `DATE_TRUNC` | Regra do projeto: sensível no backend; evita cálculos pesados no cliente                |

## 3. KPIs da V1 (8 cards)

Cada KPI tem: **valor atual**, **delta vs. período anterior**, **rótulo claro**, **ícone**, **formato**. Nenhum KPI usa só cor para indicar variação.

| #  | KPI                     | Fórmula (período P, período anterior P-1)                                                       | Fonte                                     | Formato        |
| -- | ----------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------- | -------------- |
| 1  | Receita total           | `SUM(Purchase.finalPrice) WHERE createdAt ∈ P`                                                  | DB — `Purchase`                           | Moeda (BRL/USD)|
| 2  | Matrículas              | `COUNT(Purchase) WHERE createdAt ∈ P`                                                            | DB — `Purchase`                           | Inteiro        |
| 3  | Ticket médio            | `SUM(finalPrice) / COUNT(*) WHERE finalPrice > 0 AND createdAt ∈ P`                              | DB — `Purchase` (exclui vouchers 100%)    | Moeda          |
| 4  | Novos alunos            | `COUNT(User) WHERE createdAt ∈ P`                                                                | DB — `User`                               | Inteiro        |
| 5  | Taxa de conclusão       | `COUNT(UserProgress WHERE isCompleted ∧ updatedAt ∈ P) / COUNT(UserProgress WHERE createdAt ∈ P)` | DB — `UserProgress`                      | Percentual     |
| 6  | Vouchers resgatados     | `COUNT(VoucherRedemption) WHERE redeemedAt ∈ P`                                                 | DB — `VoucherRedemption`                  | Inteiro        |
| 7  | Medalhas conquistadas   | `COUNT(LessonQuizSummary WHERE bestMedal ≠ 'NONE' AND lastAttemptAt ∈ P)`                        | DB — `LessonQuizSummary`                  | Inteiro        |
| 8  | Sessões no site         | GA4 metric `sessions` para o intervalo P                                                          | GA4 Data API (fallback: "Indisponível")   | Inteiro        |

**Delta:** `(valor_P − valor_P_anterior) / valor_P_anterior`, limitado a duas casas. Se `valor_P_anterior == 0` e `valor_P > 0` → exibe "Novo" em vez de %.

## 4. Gráficos da V1 (3)

### 4.1 Receita por dia (linha)
- Eixo X: datas do período (granularidade automática: `day` ≤ 90d, `week` ≤ 365d, `month` acima).
- Eixo Y: `SUM(finalPrice)` por bucket.
- Fonte: DB.
- Acessibilidade: `<title>` no SVG, tooltip grande com data por extenso e valor formatado, eixos com labels completos.

### 4.2 Matrículas por dia (barras empilhadas)
- Eixo X: datas.
- Segmentação: **pagas** (sem `voucherId`) vs. **voucher** (com `voucherId`).
- Fonte: DB.
- Leitura esperada: volume total e peso dos vouchers na aquisição.

### 4.3 Conclusão por curso (barras horizontais)
- Eixo Y: nome completo do curso (nunca truncado sem tooltip).
- Eixo X: % de conclusão no período.
- Acompanha contagem absoluta ao lado da barra (nunca só %).
- Fonte: DB.

Um quarto gráfico — **Distribuição de medalhas** (donut) — fica planejado como **V1.1** para não poluir a primeira entrega.

## 5. Hierarquia visual

```
┌─────────────────────────────────────────────────────────────┐
│  Painel de Métricas                         [Período: 30d]  │ ← H1 + filtro
│  Como está o Jazz LMS nos últimos 30 dias                    │ ← subtítulo
├─────────────────────────────────────────────────────────────┤
│  [Receita]   [Matrículas]   [Ticket médio]   [Novos alunos] │ ← KPIs 1-4
│  [Conclusão] [Vouchers]     [Medalhas]       [Sessões]      │ ← KPIs 5-8
├─────────────────────────────────────────────────────────────┤
│  Receita por dia                                             │
│  [ gráfico linha ocupando largura total ]                    │
├─────────────────────────────────────────────────────────────┤
│  Matrículas por dia (pagas vs. voucher)                      │
│  [ gráfico barras empilhadas ]                               │
├─────────────────────────────────────────────────────────────┤
│  Conclusão por curso                                         │
│  [ barras horizontais — top 10 cursos ]                      │
├─────────────────────────────────────────────────────────────┤
│  Top cursos no período                                       │
│  [ tabela: curso | matrículas | receita | conclusão ]        │
└─────────────────────────────────────────────────────────────┘
```

**Breakpoints:**
- `≥ 1280 px`: grid de 4 colunas nos KPIs.
- `768–1279 px`: grid de 2 colunas.
- `< 768 px`: 1 coluna; gráficos viram cards empilhados com scroll horizontal interno se necessário.

## 6. Filtro de período

Abas acessíveis (role `tablist`): **7d · 30d · 90d · 12m**. Seleção persiste em query string (`?range=30d`). Server component faz o primeiro render; a troca de aba usa `router.replace` para atualizar a query e revalidar os dados sem full reload.

- Default: **30d** (melhor balanço entre volume e granularidade diária).
- Navegação por teclado: setas ← → mudam aba; `Enter` confirma; foco visível espesso (`ring-2 ring-jazz-accent`).

## 7. Estados do painel

| Estado              | Quando ocorre                                       | Comportamento                                                                 |
| ------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Loading inicial     | Server component buscando dados                     | Skeletons dos KPIs e gráficos; não bloqueia cabeçalho                          |
| Loading de filtro   | Usuário trocou o período                            | Overlay leve (≤ 200 ms) com `aria-busy="true"` no container                   |
| Sem dados no período | Período selecionado retorna zero para todos os KPIs | `empty-state` com ilustração simples e copy "Nenhum dado no período escolhido" |
| Erro do DB          | Prisma falhou                                       | `error-state` com botão "Tentar de novo"; log server-side; sem stack para o usuário |
| GA4 indisponível    | Envs ausentes ou API retornou erro                  | KPI "Sessões no site" mostra "Indisponível" com ícone neutro; demais KPIs seguem normais |

## 8. Contratos de API

Todas as rotas:
- Método: `GET`.
- Autorização: `ensureAdminApiPermission('analytics.read')` → 403 se faltar.
- Cache HTTP: `Cache-Control: private, max-age=300`.
- Shape base: `{ ok: boolean, data: T, range: Range, generatedAt: string }`.

Tipo `Range` comum:

```ts
type Range = {
  key: '7d' | '30d' | '90d' | '12m';
  from: string;  // ISO date
  to: string;    // ISO date
  previousFrom: string;
  previousTo: string;
  granularity: 'day' | 'week' | 'month';
};
```

### 8.1 `GET /api/admin/metrics/overview?range=30d`

Agrega os 8 KPIs em uma única chamada.

```ts
type OverviewResponse = {
  ok: true;
  range: Range;
  generatedAt: string;
  data: {
    revenue: { value: number; delta: number | null; currency: 'BRL' | 'USD' };
    enrollments: { value: number; delta: number | null };
    averageTicket: { value: number; delta: number | null; currency: 'BRL' | 'USD' };
    newStudents: { value: number; delta: number | null };
    completionRate: { value: number; delta: number | null }; // 0..1
    vouchersRedeemed: { value: number; delta: number | null };
    medalsEarned: { value: number; delta: number | null };
    traffic: { value: number; delta: number | null } | { unavailable: true; reason: string };
  };
};
```

### 8.2 `GET /api/admin/metrics/revenue?range=30d`

Série temporal de receita.

```ts
type RevenueResponse = {
  ok: true;
  range: Range;
  data: Array<{ bucket: string /* ISO date */; revenue: number }>;
};
```

### 8.3 `GET /api/admin/metrics/enrollments?range=30d`

Série temporal de matrículas segmentada.

```ts
type EnrollmentsResponse = {
  ok: true;
  range: Range;
  data: Array<{ bucket: string; paid: number; voucher: number; total: number }>;
};
```

### 8.4 `GET /api/admin/metrics/completion?range=30d`

Conclusão por curso.

```ts
type CompletionResponse = {
  ok: true;
  range: Range;
  data: Array<{
    courseId: string;
    courseTitle: string;
    startedCount: number;
    completedCount: number;
    completionRate: number; // 0..1
  }>;
};
```

### 8.5 `GET /api/admin/metrics/traffic?range=30d`

Dados do GA4. Sempre responde 200; diferencia sucesso de `unavailable`.

```ts
type TrafficResponse =
  | {
      ok: true;
      range: Range;
      data: {
        sessions: number;
        users: number;
        topPages: Array<{ path: string; views: number }>;
        sources: Array<{ source: string; sessions: number }>;
      };
    }
  | {
      ok: true;
      range: Range;
      unavailable: true;
      reason: 'missing_env' | 'api_error' | 'timeout';
    };
```

## 9. Permissão e autorização

- Frontend: [src/components/admin/sidebar.tsx](../src/components/admin/sidebar.tsx) já filtra pelo `analytics.read`.
- Backend da página: `requirePermission('analytics.read')` em `/admin/stats`.
- Backend das rotas: `ensureAdminApiPermission('analytics.read')` em cada rota de métricas.
- Nenhuma mudança em [src/lib/admin/permissions.ts](../src/lib/admin/permissions.ts) — `analytics.read` já cobre SUPER_ADMIN e COURSE_ADMIN.

## 10. Observações para o commit 3 (documento completo)

O commit 3 traz, com mais profundidade:
- Paleta semântica completa com contraste verificado em light e dark.
- Especificação tipográfica e de espaçamento em pixels.
- Mocks visuais por breakpoint.
- Estratégia de copywriting para 50+.
- Checklist de acessibilidade manual (WCAG 2.2 AA, zoom 200%, navegação por teclado, leitor de tela).
- Plano de implementação por arquivo (helpers `metrics-db.ts`, `metrics-ga.ts`, rotas, componentes, testes).
- Guia "Como ler o painel" para a equipe.

## 11. Resumo de referências

- Review técnico: [docs/painel-metricas-admin-review.md](./painel-metricas-admin-review.md).
- Página atual a ser reconstruída: [src/app/admin/stats/page.tsx](../src/app/admin/stats/page.tsx).
- Card atual a ser evoluído: [src/components/admin/analytics-card.tsx](../src/components/admin/analytics-card.tsx).
- Sidebar: [src/components/admin/sidebar.tsx](../src/components/admin/sidebar.tsx).
- Permissões: [src/lib/admin/permissions.ts](../src/lib/admin/permissions.ts).
- Padrão de rota admin protegida: [src/app/api/admin/vouchers/route.ts](../src/app/api/admin/vouchers/route.ts).
- Padrão de teste de rota: [tests/integration/admin-vouchers-route.test.ts](../tests/integration/admin-vouchers-route.test.ts).
