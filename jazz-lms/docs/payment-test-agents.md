# Payment Test Agents (Lemon-only)

Este documento define os “agentes operacionais” de validação de pagamentos que podem ser acionados rapidamente quando uma solicitação exigir validação crítica.

## 1) Agente backend

Comando:

`npm run test:payments:backend`

Executa:
- checkout route
- purchases route
- lemon webhook route
- reset dev route
- helpers/sync de compra/voucher
- contratos e segurança relacionados a pagamentos

Quando usar:
- qualquer alteração em `src/app/api/checkout/route.ts`
- qualquer alteração em `src/app/api/webhooks/lemon-squeezy/route.ts`
- qualquer alteração em `src/lib/course-purchase-sync.ts`

## 2) Agente frontend real (Lemon sandbox)

Comando:

`npm run test:payments:frontend:real`

Pré-requisitos obrigatórios:
- `PAYMENTS_E2E_REAL_ENABLED=1`
- `PAYMENTS_E2E_STORAGE_STATE` apontando para arquivo válido do Playwright com sessão autenticada
- `PAYMENTS_E2E_COURSE_ID` de curso ainda não comprado pelo usuário do storage state
- porta `3000` livre (por padrão o script não reutiliza servidor já aberto)
- opcional: `PAYMENTS_E2E_EXPECT_HOST` (default `checkout.lemonsqueezy.com`)
- opcional: `PAYMENTS_E2E_ALLOW_SERVER_REUSE=1` para reutilizar servidor já em execução em `:3000`
- opcional: `PLAYWRIGHT_REUSE_EXISTING_SERVER=1` para forçar reuse no Playwright

Fluxo validado:
- usuário autenticado abre página do curso
- abre modal de método de pagamento
- escolhe cartão e continua
- redireciona para host de checkout Lemon

## 2.1) Agente matrix de vouchers (Lemon sandbox)

Comando:

`npm run test:payments:vouchers:real`

Pré-requisitos obrigatórios:
- `PAYMENTS_E2E_REAL_ENABLED=1`
- `PAYMENTS_E2E_STORAGE_STATE` apontando para arquivo válido do Playwright com sessão autenticada
- `PAYMENTS_E2E_COURSE_ID` de curso ainda não comprado pelo usuário do storage state
- `PAYMENTS_E2E_VOUCHER_CODES` em CSV (ex.: `CODE10,CODE20,CODE100`)
- opcional: `PAYMENTS_E2E_METHODS` em CSV (`card,paypal` por padrão)

Fluxo validado:
- abre modal de pagamento
- aplica voucher e valida resposta visual
- testa redirecionamento para checkout Lemon por método (card/paypal)
- executa um a um para cada voucher configurado

## 3) Agente full crítico

Comando:

`npm run test:payments:all`

Executa em sequência:
1. backend payment suite
2. frontend real Lemon E2E
3. build completo (`npm run build`)

Use este comando quando a solicitação for “passada final” ou “certificar que tudo está funcionando”.

## 4) Trigger operacional recomendado

Quando você solicitar explicitamente validação crítica de pagamentos, o fluxo padrão deve ser:
1. `npm run test:payments:backend`
2. `npm run test:payments:frontend:real`
3. `npm run build`

Ou apenas:

`npm run test:payments:all`
