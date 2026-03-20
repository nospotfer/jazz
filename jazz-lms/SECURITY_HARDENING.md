# Security Hardening Guide

Este projeto possui proteção em três camadas:

## 1) Antes de subir para o Git (local)

- Hooks em `.githooks/`:
  - `pre-commit`: escaneia conteúdo staged
  - `pre-push`: escaneia arquivos rastreados
- Script de scan: `scripts/precommit-secret-scan.sh`
- Configuração automática dos hooks:
  - `npm run hooks:install`
  - também roda automaticamente via `prepare`

### Comandos úteis

```bash
npm run security:staged
npm run security:secrets
```

## 2) No GitHub (CI)

- Workflow: `.github/workflows/secret-scan.yml`
- Scanner: Gitleaks
- Configuração: `.gitleaks.toml`

O CI bloqueia credenciais reais em `push` e `pull_request`.

## 3) Em produção (internet)

Hardening em `next.config.mjs`:

- `Content-Security-Policy`
- `Strict-Transport-Security`
- `X-Content-Type-Options`
- `X-Frame-Options`
- `Referrer-Policy`
- `Permissions-Policy`
- `Cross-Origin-Opener-Policy`
- `Cross-Origin-Resource-Policy`
- `poweredByHeader: false`

## Rotação de segredos (obrigatório após exposição)

1. Stripe: rotacionar `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET`.
2. Supabase: rotacionar `SUPABASE_SERVICE_ROLE_KEY`.
3. Atualizar variáveis no Vercel (Production/Preview/Development).
4. Validar app e webhooks após rotação.

## Observações

- Use placeholders neutros em docs (`your_*`, `YOUR_*`).
- Não commite `.env` e `.env.local`.
- Se um segredo já foi commitado no passado, considere comprometido e rotacione.
