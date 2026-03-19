# Voucher + Checkout Sandbox (Lemon Squeezy / PayPal)

Este guia prepara o ambiente para testar pagamento com desconto via voucher usando Lemon Squeezy.

## 1) Variáveis obrigatórias

Preencha no `.env.local`:

- `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- `LEMON_SQUEEZY_API_KEY=...`
- `LEMON_SQUEEZY_WEBHOOK_SECRET=...`
- `LEMON_SQUEEZY_STORE_ID=317886`
- `LEMON_SQUEEZY_PRODUCT_ID=896872`
- `LEMON_SQUEEZY_VARIANT_ID=1411237`

Opcional (quando usar Supabase local/externo):

- `NEXT_PUBLIC_SUPABASE_URL=...`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`
- `SUPABASE_SERVICE_ROLE_KEY=...`

## 2) Subir app local

Terminal 1:

- `npm run dev`

## 3) Validar webhook

No Lemon Squeezy Webhooks:

- Endpoint: `https://culturadeljazz.com/api/webhooks/lemon-squeezy`
- Eventos: `order_created`, `order_refunded`

Para teste local com webhook real, use um túnel e aponte o endpoint para `https://<tunnel>/api/webhooks/lemon-squeezy`.

## 4) Validar método PayPal

No checkout hospedado da Lemon Squeezy:

- Verifique se PayPal aparece para sua conta/região em modo de teste.
- Se não aparecer, finalize o teste com cartão.

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
3. No modal de método de pagamento, selecione cartão ou PayPal.
4. Preencha o campo opcional de voucher.
5. Continue para o checkout da Lemon Squeezy.

Resultado esperado:

- Valor final da compra sai com desconto.
- Após pagamento, webhook grava `finalPrice`, `discountAmount`, `voucherId` e contabiliza uso do voucher.

## 7) Verificações pós-compra

- Compra criada com preço final (descontado).
- Voucher com `currentUses` incrementado.
- Registro em `VoucherRedemption` e `DiscountApplied`.
- Histórico de compras exibindo valor final.

## 8) Operational audit/reset commands

- Audit geral em JSON: `npm run audit:vouchers -- --json`
- Audit de usuário/curso: `npm run audit:vouchers -- --user-id=<userId> --course-id=<courseId>`
- Audit de códigos específicos: `npm run audit:vouchers -- --codes=CDJLMS1001,CDJLMS2001`
- Reset em simulação: `npm run reset:user:vouchers -- --user-id=<userId> --dry-run`
- Reset real por usuário+curso: `npm run reset:user:vouchers -- --user-id=<userId> --course-id=<courseId>`
- Reset com safety-sync de códigos: `npm run reset:user:vouchers -- --user-id=<userId> --codes=CDJLMS1001,CDJLMS2001`
