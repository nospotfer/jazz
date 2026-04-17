# Painel de Métricas (Admin) — Documentação Completa

> **Guia principal** para a equipe implementar, validar e operar o Painel de Métricas da área administrativa do Jazz LMS. Este é o documento de referência único; os outros dois (review e estrutura) são anexos técnicos.
>
> **Commits antecedentes:**
> - [docs/painel-metricas-admin-review.md](./painel-metricas-admin-review.md) — inventário do repositório.
> - [docs/painel-metricas-admin-estrutura.md](./painel-metricas-admin-estrutura.md) — estrutura, KPIs e contratos.
>
> **Branch:** `jazz-lms-dev-vercel` · **Rota final:** `/admin/stats` · **Permissão:** `analytics.read`.

---

## 1. Visão geral

O Painel de Métricas é a tela interna que permite à equipe administrativa do Jazz LMS acompanhar, em um só lugar, os sinais que importam para o negócio:

- **Quanto entrou?** (receita, ticket médio)
- **Quantos novos alunos?** (aquisição)
- **O conteúdo está sendo consumido?** (conclusão, engajamento)
- **A gamificação está funcionando?** (medalhas)
- **De onde vem o público?** (tráfego e origem — via Google Analytics 4)

É uma ferramenta **de leitura**. Não edita dados, não roda processos, não expõe informações pessoais. Mostra **agregados** sobre períodos (7, 30, 90 dias e 12 meses).

## 2. Público-alvo e princípios de design

### 2.1 Quem usa

- **Equipe administrativa da Cultura de Jazz** — perfil predominante 50+, aposentado, alfabetização digital intermediária.
- Navegação principal em desktop; suporte a tablet e celular sem quebras.
- Expectativa de clareza alta e ruído visual baixo.

### 2.2 Princípios (em ordem de prioridade)

1. **Legibilidade antes de estética.** Fonte base ≥ 17 px, número principal de KPI ≥ 40 px, entrelinha ≥ 1.5.
2. **Contraste obrigatório.** Texto principal ≥ 7:1 (AAA). Texto secundário e estados não textuais ≥ 4.5:1 (AA). Verificado em tema claro e escuro.
3. **Zoom até 200% sem quebra.** Layout fluido, sem cortes, sem sobreposições.
4. **Alvos grandes.** Mínimo 44×44 px para abas, botões e links. Espaçamento de 8 px entre alvos clicáveis.
5. **Cor nunca sozinha.** Deltas positivos e negativos sempre trazem ícone (▲/▼) e sinal textual ("+12%", "−3%"); estado "indisponível" tem ícone e rótulo escrito.
6. **Copy direto.** Frases curtas, verbos concretos, zero jargão. "Matrículas pagas" em vez de "Conversões". "Vouchers resgatados" em vez de "Redemptions".
7. **Previsibilidade.** Posição fixa dos elementos entre breakpoints; o mesmo KPI aparece sempre na mesma ordem.
8. **Foco visível em tudo.** Anel de foco 2 px dourado (`jazz.accent`) para teclado. Nenhum elemento interativo sem foco perceptível.
9. **Nada depende de movimento.** Sem animações obrigatórias; transições respeitam `prefers-reduced-motion`.
10. **Erros gentis.** Nunca expor stack trace, nunca bloquear a página inteira por um bloco que falhou.

## 3. Estratégia de cor

### 3.1 Paleta base (já existente no projeto)

Extraída de [tailwind.config.ts](../tailwind.config.ts):

| Token          | Hex       | Uso no painel                                         |
| -------------- | --------- | ----------------------------------------------------- |
| `jazz.accent`  | `#D4AF37` | Cor de destaque: anel de foco, ícone de KPI principal |
| `jazz.dark`    | `#1A1A1A` | Fundo do tema escuro, texto em tema claro             |
| `jazz.light`   | `#FAFAFA` | Fundo do tema claro, texto em tema escuro             |
| `burgundy`     | `#8B3A3A` | Acento secundário (uso moderado, evitar em texto)     |
| `cream`        | `#F5EBE0` | Fundo alternativo de cards no tema claro              |

### 3.2 Tokens semânticos do painel

Tokens usados **apenas** para sinalizar estado. Nunca carregam texto crítico sozinhos — sempre vêm com ícone + rótulo.

| Token       | Light (sobre fundo branco) | Dark (sobre `jazz.dark`) | Significado             |
| ----------- | -------------------------- | ------------------------ | ----------------------- |
| `success`   | `#166534` (verde escuro)   | `#4ADE80` (verde claro)  | Delta positivo, saudável|
| `warn`      | `#92400E` (âmbar escuro)   | `#FBBF24` (âmbar claro)  | Atenção, abaixo da meta |
| `danger`    | `#991B1B` (vermelho escuro)| `#F87171` (vermelho claro)| Queda relevante, erro   |
| `info`      | `#1E3A8A` (azul escuro)    | `#93C5FD` (azul claro)   | Estado informativo      |
| `neutral`   | `#4B5563` (cinza escuro)   | `#D1D5DB` (cinza claro)  | "Indisponível", sem dado|

**Verificação de contraste** (alvo): cada par texto ÷ fundo acima foi escolhido para atingir no mínimo 4.5:1 em estado AA — validar antes do merge com ferramenta (DevTools Lighthouse / axe).

### 3.3 Cores dos gráficos

Gráficos têm paleta própria, distinguível mesmo em tons de cinza (atenção a daltonismo):

| Série                  | Light       | Dark        |
| ---------------------- | ----------- | ----------- |
| `chart.1` (principal)  | `#B8860B`   | `#E5B84B`   |
| `chart.2` (secundário) | `#1F4E79`   | `#7FB3FF`   |
| `chart.3` (terciário)  | `#4B5563`   | `#D1D5DB`   |
| `chart.4` (alerta)     | `#8B3A3A`   | `#F87171`   |

Cada série nos gráficos deve trazer também **marcador diferente** (ponto cheio / triângulo / quadrado) para não depender de cor.

## 4. Tipografia

Fonte: pilha nativa do projeto (Inter / system-ui). Escala fixa:

| Papel              | Tamanho | Entrelinha | Peso | Uso                                   |
| ------------------ | ------- | ---------- | ---- | ------------------------------------- |
| Título da página   | 28 px   | 40 px      | 700  | "Painel de Métricas"                  |
| Subtítulo          | 18 px   | 28 px      | 400  | Frase explicativa abaixo do título    |
| Seção              | 22 px   | 32 px      | 600  | "Receita por dia", "Top cursos"       |
| Rótulo de KPI      | 17 px   | 24 px      | 500  | "Receita total"                       |
| Número principal   | 40 px   | 48 px      | 700  | Valor do KPI                          |
| Delta              | 17 px   | 24 px      | 600  | "+12% vs. período anterior"           |
| Corpo              | 17 px   | 28 px      | 400  | Texto de apoio, legendas, tabela      |
| Auxiliar           | 14 px   | 20 px      | 400  | Metadados discretos (nunca crítico)   |

**Regra:** nenhum texto informativo abaixo de 14 px. Nenhum texto em maiúsculas contínuas (exceto rótulos curtos como "BRL").

## 5. Layout por breakpoint

### 5.1 Desktop (≥ 1280 px)

```
╔══════════════════════════════════════════════════════════════════════════╗
║  Painel de Métricas                                  [7d|30d|90d|12m]    ║
║  Como está o Jazz LMS nos últimos 30 dias                                ║
╠══════════════════════════════════════════════════════════════════════════╣
║ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                      ║
║ │ Receita  │ │Matrículas│ │Tkt. médio│ │  Novos   │                      ║
║ │ R$ 12.4k │ │    87    │ │  R$ 143  │ │    34    │                      ║
║ │ ▲ +12%   │ │ ▲ +8%    │ │ ▼ −2%    │ │ ▲ +20%   │                      ║
║ └──────────┘ └──────────┘ └──────────┘ └──────────┘                      ║
║ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                      ║
║ │Conclusão │ │ Vouchers │ │ Medalhas │ │ Sessões  │                      ║
║ │   62%    │ │    14    │ │   152    │ │Indisponí-│                      ║
║ │ ▲ +3pp   │ │ ▲ +4     │ │ ▲ +25    │ │ vel (GA4)│                      ║
║ └──────────┘ └──────────┘ └──────────┘ └──────────┘                      ║
╠══════════════════════════════════════════════════════════════════════════╣
║  Receita por dia                                                         ║
║  [ gráfico linha — largura total — altura ~280 px ]                      ║
╠══════════════════════════════════════════════════════════════════════════╣
║  Matrículas por dia (pagas × vouchers)                                   ║
║  [ barras empilhadas ]                                                   ║
╠══════════════════════════════════════════════════════════════════════════╣
║  Conclusão por curso                                                     ║
║  [ barras horizontais, top 10 ]                                          ║
╠══════════════════════════════════════════════════════════════════════════╣
║  Top cursos no período                                                   ║
║  [ tabela: curso | matrículas | receita | conclusão ]                    ║
╚══════════════════════════════════════════════════════════════════════════╝
```

### 5.2 Tablet (768–1279 px)
- KPIs: grid 2×4.
- Gráficos mantêm largura total.
- Tabela com rolagem horizontal se necessário; cabeçalho fixo.

### 5.3 Celular (< 768 px)
- KPIs em coluna única.
- Gráficos em cards que ocupam a tela inteira com rolagem vertical.
- Filtro de período vira seletor tipo dropdown acessível.
- Número principal do KPI cai para 32 px mas nunca abaixo disso.

## 6. Seleção de métricas e rationale

Cada KPI está aqui porque responde a uma pergunta concreta de negócio. Métricas "bonitas mas sem decisão" (page views genéricos, bounce rate, etc.) ficam de fora.

| KPI                     | Pergunta que responde                                       | Decisão que habilita                                     |
| ----------------------- | ----------------------------------------------------------- | -------------------------------------------------------- |
| Receita total           | "Quanto faturamos no período?"                               | Ajuste de preço, intensidade de campanhas                |
| Matrículas              | "Quantas pessoas entraram como alunas?"                      | Leitura direta de aquisição                              |
| Ticket médio            | "Vouchers e descontos estão esmagando a margem?"             | Calibrar quantidade e tipo de voucher                    |
| Novos alunos            | "Quantas contas novas foram criadas?"                        | Medir topo do funil (não converte sem contar)            |
| Taxa de conclusão       | "O conteúdo está sendo consumido até o fim?"                 | Revisão de currículo, ajuste de duração/ritmo            |
| Vouchers resgatados     | "A estratégia promocional está sendo usada?"                 | Validar ROI das campanhas com código                     |
| Medalhas conquistadas   | "A gamificação está engajando?"                              | Calibrar dificuldade dos quizzes                         |
| Sessões no site         | "Há público chegando? De onde?"                              | Avaliar canais de aquisição e sazonalidade               |

### 6.1 Definições precisas (para evitar ambiguidade)

- **Período P** = intervalo selecionado no filtro, em UTC, começando 00:00 do dia inicial.
- **Período P-1** = mesmo tamanho de P, imediatamente antes.
- **Matrícula** = linha em `Purchase` com `createdAt ∈ P`. **Uma por aluno por curso** (garantido por `@@unique([userId, courseId])`).
- **Matrícula paga** = `Purchase` com `voucherId IS NULL` ou voucher com desconto parcial que resultou em `finalPrice > 0`.
- **Matrícula voucher** = `Purchase` com `voucherId IS NOT NULL` **e** `finalPrice = 0`.
- **Ticket médio** = `AVG(finalPrice)` **apenas** sobre matrículas pagas. Vouchers 100% não entram (distorceriam a média para baixo).
- **Conclusão** = razão entre `UserProgress` marcadas como `isCompleted = true` no período e o total de `UserProgress` iniciadas (qualquer status) no mesmo período.
- **Medalha conquistada** = `LessonQuizSummary` com `bestMedal ≠ 'NONE'` cujo `lastAttemptAt ∈ P`.

## 7. Alinhamento com comportamento do usuário e metas de negócio

- **Aquisição** (novos alunos, sessões) → cabeça do funil. Quedas aqui antecipam queda de receita em 2–4 semanas.
- **Conversão** (matrículas, ticket médio, vouchers) → núcleo financeiro. É o único bloco onde delta negativo sustentado deve disparar revisão imediata.
- **Engajamento** (conclusão, medalhas) → saúde do produto. Sustenta retenção e recomendação. Não responde em dias, responde em semanas.
- **Tráfego** → contexto. Explica movimentos dos outros KPIs ("caiu matrícula porque caiu sessão" vs. "caiu matrícula mesmo com sessão estável → problema no funil").

Em cada ciclo semanal, a equipe lê o painel nesta ordem: **Aquisição → Conversão → Engajamento → Tráfego (contexto)**. O layout (KPIs 1–4 em cima, 5–8 embaixo) já respeita essa ordem de leitura.

## 8. Guia de implementação

### 8.1 Arquivos a criar

```
docs/painel-metricas-admin.md                                  ← este documento (commit 3)
src/lib/admin/metrics-db.ts                                    ← agregações Prisma tipadas
src/lib/admin/metrics-ga.ts                                    ← client GA4 Data API + cache + fallback
src/app/api/admin/metrics/overview/route.ts                    ← 200 com 8 KPIs + Range
src/app/api/admin/metrics/revenue/route.ts                     ← série temporal de receita
src/app/api/admin/metrics/enrollments/route.ts                 ← série temporal de matrículas
src/app/api/admin/metrics/completion/route.ts                  ← conclusão por curso
src/app/api/admin/metrics/traffic/route.ts                     ← dados GA4 ou unavailable
src/components/admin/analytics/kpi-card.tsx                    ← evolução do analytics-card
src/components/admin/analytics/period-filter.tsx               ← abas 7d/30d/90d/12m
src/components/admin/analytics/revenue-chart.tsx               ← Recharts linha
src/components/admin/analytics/enrollments-chart.tsx           ← Recharts barras empilhadas
src/components/admin/analytics/completion-chart.tsx            ← Recharts barras horizontais
src/components/admin/analytics/empty-state.tsx                 ← estado sem dados
src/components/admin/analytics/error-state.tsx                 ← estado de erro do servidor
src/lib/i18n/admin-analytics.ts                                ← strings pt-BR (ponto de expansão)
tests/unit/metrics-db.test.ts                                  ← bucketização + delta
tests/integration/admin-metrics-overview-route.test.ts         ← 403, 200, GA4 offline
tests/integration/admin-analytics-page.test.tsx                ← render + filtro + empty state
```

### 8.2 Arquivos a modificar

```
src/app/admin/stats/page.tsx                ← reconstrução: server component + grid KPIs + gráficos
src/components/admin/sidebar.tsx            ← label "Analíticas" → "Métricas"
package.json                                 ← adicionar recharts e @google-analytics/data
VERCEL_SETUP.md                              ← documentar GA4_PROPERTY_ID / GA4_SERVICE_ACCOUNT_EMAIL / GA4_PRIVATE_KEY
README.md                                    ← seção curta "Admin — Painel de Métricas"
tailwind.config.ts                           ← adicionar tokens chart.1..4 e semânticos success/warn/danger/info/neutral
```

### 8.3 Ordem de implementação recomendada

1. Infra e helpers (puros, sem UI): `metrics-db.ts`, `metrics-ga.ts`, tokens Tailwind, envs.
2. Rotas de API + testes de integração.
3. Componentes `kpi-card` e `period-filter` (testados em isolamento).
4. Gráficos (testados com dados fixture).
5. Página `/admin/stats` reconstruída + label do sidebar.
6. Teste de integração da página.
7. Validação local: lint, `vitest run`, `next build`.
8. Deploy: `npm run deploy:test` + validação manual no alias canônico.

### 8.4 Variáveis de ambiente GA4

Nunca prefixar com `NEXT_PUBLIC_`. Ficam **apenas** no servidor.

| Nome                        | Tipo   | Onde obter                                                 |
| --------------------------- | ------ | ---------------------------------------------------------- |
| `GA4_PROPERTY_ID`           | string | Propriedade GA4 (ex.: "properties/123456789")              |
| `GA4_SERVICE_ACCOUNT_EMAIL` | string | E-mail da conta de serviço criada no Google Cloud          |
| `GA4_PRIVATE_KEY`           | string | Chave privada da conta de serviço (com `\n` escapado)      |

Regra de fallback gracioso: se **qualquer** uma faltar, o client GA4 responde `{ unavailable: true, reason: 'missing_env' }` e a página renderiza normalmente.

### 8.5 Padrão para rotas novas (espelhado de `/api/admin/vouchers`)

```ts
import { NextResponse } from 'next/server';
import { ensureAdminApiPermission } from '@/lib/admin-api';
import { getOverview } from '@/lib/admin/metrics-db';

export async function GET(request: Request) {
  const check = await ensureAdminApiPermission('analytics.read');
  if (!check.ok) return check.response!;

  const url = new URL(request.url);
  const rangeKey = url.searchParams.get('range') ?? '30d';

  const data = await getOverview(rangeKey);

  return NextResponse.json(
    { ok: true, range: data.range, generatedAt: new Date().toISOString(), data: data.metrics },
    { headers: { 'Cache-Control': 'private, max-age=300' } },
  );
}
```

## 9. Guia de validação

### 9.1 Comandos locais (obrigatórios)

```bash
npm run lint
npm exec vitest run tests/unit/metrics-db.test.ts
npm exec vitest run tests/integration/admin-metrics-overview-route.test.ts
npm exec vitest run tests/integration/admin-analytics-page.test.tsx
npm run test:integration   # suíte completa, sem regressão
npm run build              # build Turbopack + prisma generate
```

Critério: todos verdes, sem warnings novos relevantes.

### 9.2 Checklist de acessibilidade manual

- [ ] Zoom 200% mantém layout legível, sem corte horizontal.
- [ ] Tab navega por todos os controles (filtro, KPIs clicáveis, linhas da tabela) em ordem lógica.
- [ ] Foco sempre visível com anel dourado de 2 px.
- [ ] Deltas trazem ícone + sinal textual (não dependem só de cor).
- [ ] Gráficos têm `<title>` e `aria-label` descritivos ("Receita por dia nos últimos 30 dias").
- [ ] Leitor de tela (NVDA ou macOS VoiceOver) lê cada KPI como "Rótulo. Valor. Variação em relação ao período anterior."
- [ ] `prefers-reduced-motion: reduce` desativa animações dos gráficos.
- [ ] Contraste do texto principal ≥ 7:1 em claro e escuro (verificado no axe ou Lighthouse).
- [ ] Lighthouse Accessibility ≥ 95 na rota `/admin/stats`.

### 9.3 Checklist de fluxo real

- [ ] Logado como SUPER_ADMIN → acessa `/admin/stats`, vê os 8 KPIs.
- [ ] Logado como COURSE_ADMIN → mesmo acesso.
- [ ] Logado como CONTENT_CREATOR → rota redireciona (sem acesso), link não aparece no sidebar.
- [ ] Filtro troca para 7d/90d/12m → gráficos atualizam, URL reflete `?range=`.
- [ ] Envs GA4 ausentes em preview → KPI "Sessões" mostra "Indisponível"; demais KPIs saudáveis.
- [ ] Período sem dados (ex.: 7d quando base é nova) → `empty-state` claro, sem erro.
- [ ] Tema claro e escuro renderizam corretamente (toggle do próprio app).

### 9.4 Deploy

Após tudo verde:

```bash
npm run deploy:test
```

Validar em: <https://jazz-lms-neurofactory-neurofactorys-orgs-projects.vercel.app/admin/stats>.

## 10. Seção "Para a equipe"

### 10.1 Como ler o painel em 30 segundos

1. Olhe o filtro de período — certifique-se de estar no recorte que você quer.
2. Passe os olhos pelos 8 KPIs na ordem natural (esquerda → direita, cima → baixo).
3. Para cada KPI, leia: valor atual + delta. Deltas ▲ em verde são saudáveis; ▼ em vermelho pedem atenção; amarelo (warn) pede observação.
4. Desça aos gráficos só se algum KPI chamou atenção — eles explicam o "quando" do movimento.
5. A tabela no fim dá o "onde" (qual curso).

### 10.2 FAQ rápido

**O número mudou, mas acabei de fazer a compra. Por quê?**  
O painel cacheia por 5 minutos. Espere esse ciclo ou recarregue.

**O KPI "Sessões" diz "Indisponível". O site está com problema?**  
Não. Isso significa que a integração com Google Analytics 4 ainda não foi configurada neste ambiente, ou a chave expirou. O resto do painel segue preciso.

**Posso exportar para planilha?**  
Não na V1. Está planejado para V1.1 (CSV dos KPIs e gráficos).

**Por que o ticket médio exclui vouchers 100%?**  
Porque incluí-los faria a média cair artificialmente para perto de zero toda vez que um voucher grátis fosse resgatado. O que o ticket médio quer responder é "quanto em média um aluno pagante gastou".

**Por que a taxa de conclusão parece baixa?**  
Ela compara conclusões no período com início no mesmo período — o que é exigente em recortes curtos (7 dias). Em recortes mensais ou trimestrais ela tende a ser mais representativa.

### 10.3 O que **não** está no painel (e por quê)

- **Dados pessoais de usuários.** Painel é agregado. Para detalhe de aluno, use `/admin/users`.
- **Ações de edição.** Painel é leitura. Edições ficam em `/admin/courses` e `/admin/vouchers`.
- **Métricas de infraestrutura** (latência, erros 5xx). Essas moram no Vercel Observability.
- **Exportação, alertas, anotações colaborativas.** Fora da V1; entram em V1.1+ conforme demanda.

## 11. Histórico e próximos passos

- **Commit 1** — Review do repositório: [docs/painel-metricas-admin-review.md](./painel-metricas-admin-review.md).
- **Commit 2** — Estrutura do dashboard: [docs/painel-metricas-admin-estrutura.md](./painel-metricas-admin-estrutura.md).
- **Commit 3** — Este documento.
- **Próximo** — Implementação do código, seguindo a ordem da seção 8.3, em commits separados e deployados em `jazz-lms-dev-vercel`.
