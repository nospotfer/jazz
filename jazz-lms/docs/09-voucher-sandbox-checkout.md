# Voucher + Checkout Sandbox (Dodo Payments / PayPal)

Este guia prepara o ambiente para testar pagamento com desconto via voucher usando Dodo Payments.

## 1) Variáveis obrigatórias

Preencha no `.env.local`:

- `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- `DODO_PAYMENTS_API_KEY=...`
- `DODO_PAYMENTS_WEBHOOK_SECRET=...`
- `DODO_BUSINESS_ID=bus_xxx`
- `DODO_PRODUCT_ID=<ID do produto deste curso em test_mode>`
- `DODO_ENVIRONMENT=test_mode`

Opcional (quando usar Supabase local/externo):

- `NEXT_PUBLIC_SUPABASE_URL=...`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`
- `SUPABASE_SERVICE_ROLE_KEY=...`

## 2) Subir app local

Terminal 1:

- `npm run dev`

## 3) Validar webhook

No Dodo Payments Webhooks:

- Use um endpoint em **test_mode** apontando para o app local ou preview com banco isolado.
- Eventos: `payment.succeeded`, `refund.succeeded`, `refund.failed` e os eventos
  `dispute.*` usados pelo app. A lista e o contrato de assinatura estão em
  [Dodo local setup](./10-dodo-local-setup.md).

Para teste local com webhook real, use um túnel e aponte o endpoint para `https://<tunnel>/api/webhooks/dodo-jazzlms`.

## 4) Validar método PayPal

No checkout hospedado da Dodo Payments:

- Verifique se PayPal aparece para sua conta/região em modo de teste.
- Se não aparecer, finalize o teste com cartão.

## 5) Criar vouchers rápidos no admin

Tela admin vouchers:

- Use botões de atalho `10%`, `20%`, `30%`, `50%`, `100%`.
- Copie os códigos que a tela realmente gerar; cada voucher deve ter um código
  único, e cupons antigos com esses prefixos podem não corresponder à geração atual.

## 5.1) Apagar vouchers errados

No admin de vouchers:

- **Eliminar**: apaga 1 voucher por linha.
- **Eliminar seleccionados**: marca vários e remove em uma ação.
- **Eliminar lote**: remove todos os vouchers do lote (somente os que ainda não foram usados).

Observação: a exclusão normal bloqueia vouchers usados; a exclusão forçada remove
também seu histórico local. Cupons pagos precisam ser desativados no provedor antes
da exclusão local. Faça testes de exclusão apenas com dados isolados.

## 6) Testar checkout com desconto

Fluxo recomendado:

1. Copie um código criado.
2. Abra compra do curso (dashboard ou página do curso).
3. Abra o modal de compra; o checkout hospedado determinará os métodos disponíveis.
4. Preencha o campo opcional de voucher.
5. Continue para o checkout da Dodo Payments.

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
