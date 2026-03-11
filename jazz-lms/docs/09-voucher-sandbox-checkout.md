# Voucher + Checkout Sandbox (Stripe / Bizum)

Este guia prepara o ambiente para testar pagamento com desconto via voucher.

## 1) Variáveis obrigatórias

Preencha no `.env.local`:

- `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...`
- `STRIPE_SECRET_KEY=sk_test_...`
- `STRIPE_WEBHOOK_SECRET=whsec_...`

Onde obter cada chave:

- `STRIPE_SECRET_KEY`: Stripe Dashboard (modo Test) → Developers → API keys → Secret key.
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Stripe Dashboard (modo Test) → Developers → API keys → Publishable key.
- `STRIPE_WEBHOOK_SECRET`: Stripe CLI (`stripe listen --forward-to localhost:3000/api/webhooks/stripe`) ou Dashboard do endpoint webhook.

Opcional (quando usar Supabase local/externo):

- `NEXT_PUBLIC_SUPABASE_URL=...`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`
- `SUPABASE_SERVICE_ROLE_KEY=...`

## 2) Validar Stripe sandbox

No projeto:

- `npm run stripe:sandbox:check`

Se retornar `STRIPE_SANDBOX_CHECK_OK`, as chaves de teste estão corretas.

## 3) Subir app e webhook local

Terminal 1:

- `npm run dev`

Terminal 2:

- `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

Copie o `whsec_...` mostrado pelo Stripe CLI para `STRIPE_WEBHOOK_SECRET`.

## 4) Habilitar método Bizum no Stripe

No Stripe Dashboard (modo Test):

- Ative `Bizum` em Payment methods.
- Confirme que o país/conta permite Bizum no sandbox.

Observação: no código, Bizum já está habilitado via Stripe Checkout quando disponível.

## 5) Criar vouchers rápidos no admin

Tela admin vouchers:

- Use botões de atalho `10%`, `20%`, `30%`, `50%`, `100%`.
- Cada clique cria 5 vouchers com código determinístico no padrão `CDJLMS1001`, `CDJLMS2001`, `CDJLMS5001`, etc.

## 5.1) Apagar vouchers errados

No admin de vouchers:

- **Eliminar**: apaga 1 voucher por linha.
- **Eliminar seleccionados**: marca vários e remove em uma ação.
- **Eliminar lote**: remove todos os vouchers do lote (somente os que ainda não foram usados).

Observação: vouchers já usados/resgatados não são apagados por segurança.

## 6) Testar checkout com desconto

Fluxo recomendado:

1. Copie um código criado.
2. Abra compra do curso (dashboard ou página do curso).
3. No modal de método de pagamento, selecione cartão/PayPal/Bizum.
4. Preencha o campo opcional de voucher.
5. Continue para Stripe Checkout.

Resultado esperado:

- Valor da sessão Stripe já vai com desconto.
- Após pagamento, webhook grava `finalPrice`, `discountAmount`, `voucherId` e contabiliza uso do voucher.

## 7) Cartão de teste

Use o cartão de teste padrão da Stripe que vocês já utilizam no sandbox (ex.: `4242 4242 4242 4242`).

## 8) Verificações pós-compra

- Compra criada com preço final (descontado).
- Voucher com `currentUses` incrementado.
- Registro em `VoucherRedemption` e `DiscountApplied`.
- Histórico de compras exibindo valor final.
