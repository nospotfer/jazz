# Production Go-Live Checklist (Sidromel QA)

Checklist operacional para subir o Jazz LMS em produção com validação funcional, segurança e integrações.

## 0) Pré-flight local (obrigatório)

- [ ] `npm run lint` sem erros
- [ ] `npm run build` sem erros
- [ ] `.env`, `.env.local` e `.env.example` com todas as variáveis exigidas
- [ ] `npm run check:integrations` executado

Se `check:integrations` falhar com `Object not found` no Supabase Storage, existe inconsistência entre links salvos no banco e arquivos no bucket (corrigir dados/upload antes de produção).

## 1) DNS + domínio

- [ ] Domínio configurado no provedor DNS
- [ ] Projeto conectado no Vercel com domínio principal
- [ ] Registro(s) DNS propagados
- [ ] HTTPS ativo (certificado provisionado pelo Vercel)

Validação rápida:

```bash
dig +short seu-dominio.com
curl -I https://seu-dominio.com
```

Critério de aceite: resposta HTTPS com status `200`, `301` ou `308`.

## 2) Vercel env vars (produção)

Configurar no Vercel (Production + Preview + Development):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL` (ex.: `https://seu-dominio.com`)
- `DATABASE_URL` (Session Pooler)
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`
- `SIGNED_URL_TTL_SECONDS`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `MUX_SIGNING_KEY_ID`
- `MUX_SIGNING_PRIVATE_KEY`
- `PROFESSOR_EMAIL`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `INBOUND_EMAIL_WEBHOOK_SECRET`
- `ADMIN_OWNER_EMAIL`

## 3) Supabase (Auth + DB + Storage)

### 3.1 Banco
- [ ] Rodou `supabase-migration.sql` no SQL Editor
- [ ] Tabelas existem: `Course`, `Chapter`, `Lesson`, `Attachment`, `Purchase`, `UserProgress`, `User`

### 3.2 Auth/OAuth
- [ ] Supabase Authentication > URL Configuration
  - Site URL: `https://seu-dominio.com`
  - Redirects:
    - `https://seu-dominio.com/auth/callback`
    - `https://*.vercel.app/auth/callback`

### 3.3 Storage
- [ ] Bucket configurado em `SUPABASE_STORAGE_BUCKET`
- [ ] Arquivos de anexo realmente existentes no bucket
- [ ] Links em `Attachment.url` apontam para objetos válidos

## 4) Google OAuth

No Google Cloud Console (OAuth Client):

- [ ] Authorized JavaScript origins: `https://<project-ref>.supabase.co`
- [ ] Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`

Critério de aceite:
- [ ] Login com Google cria sessão e redireciona para `/dashboard`
- [ ] Falhas OAuth retornam para `/auth` com mensagem amigável

## 5) Stripe (pagamentos)

### 5.1 Dashboard Stripe
- [ ] Chaves corretas (produção: `sk_live` e `pk_live`)
- [ ] Webhook cadastrado para `https://seu-dominio.com/api/webhooks/stripe`
- [ ] Evento `checkout.session.completed` ativo
- [ ] `STRIPE_WEBHOOK_SECRET` atualizado no Vercel

### 5.2 Fluxo funcional
- [ ] Usuário sem compra não acessa aulas bloqueadas
- [ ] Primeira aula segue liberada (preview)
- [ ] Checkout cria sessão Stripe
- [ ] Webhook grava compra em `Purchase`/`LessonPurchase`
- [ ] Após compra, acesso liberado corretamente

## 6) Controle de acesso

- [ ] Usuário deslogado é redirecionado de `/dashboard` para `/auth`
- [ ] Usuário comum não acessa `/admin`
- [ ] Apenas roles admin acessam telas administrativas
- [ ] APIs críticas retornam `401/403` quando aplicável

## 7) Smoke E2E (manual)

Executar em produção:

1. Acessar landing (`/`) e página de auth (`/auth`)
2. Registrar usuário novo por email/senha
3. Login/logout
4. Login com Google
5. Abrir curso sem compra e validar bloqueio
6. Validar preview da primeira aula
7. Realizar compra teste/real conforme ambiente
8. Voltar ao curso e validar desbloqueio
9. Abrir vídeo e PDF (signed URL)
10. Validar área admin com usuário autorizado

Critério de aceite: todos os passos concluídos sem erro de autorização, integração ou renderização.

## 8) Segurança mínima

- [ ] `npm run security:secrets` sem vazamento
- [ ] Headers de segurança ativos em produção
- [ ] Sem segredo exposto em frontend (ver DevTools/Network)

## 9) Comandos úteis

```bash
# local
npm run lint
npm run build
npm run check:integrations

# stripe sandbox (local)
npm run stripe:sandbox:check
npm run stripe:sandbox:webhook -- --webhook-url=http://localhost:3000/api/webhooks/stripe --cleanup

# deploy assistido
npm run deploy:prod
```

## Status final (preencher)

- [ ] Go-live aprovado
- [ ] Go-live bloqueado (anotar motivo)

Bloqueios encontrados:

1. 
2. 
3. 
