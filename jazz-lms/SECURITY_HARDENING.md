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

- Workflow: `../.github/workflows/secret-scan.yml`
- Scanner: Gitleaks
- Configuração: `.gitleaks.toml`

- Workflow: `../.github/workflows/codeql-analysis.yml`
- Scanner: GitHub CodeQL (JavaScript/TypeScript)
- Objetivo: detectar vulnerabilidades de código (SAST) em `pull_request`, `push` e execução semanal.
- Config dedicada: `../.github/codeql/codeql-config.yml` (query pack `security-and-quality` + escopo de análise)

- Configuração de atualizações: `../.github/dependabot.yml`
- Objetivo: abrir PRs automáticos para dependências `npm` e GitHub Actions com advisories de segurança.

O CI bloqueia credenciais reais em `push` e `pull_request`.

### Triage recomendado

1. Classificar alertas do CodeQL por severidade e impacto (auth, checkout, webhooks, admin).
2. Corrigir imediatamente alertas `high`/`critical` antes de merge em `main`.
3. Para falso positivo, registrar justificativa no alerta e revisar em cada mudança relacionada.
4. Revisar PRs do Dependabot semanalmente e priorizar updates com CVE conhecido.

### Conexão e enforcement no GitHub

1. Verificar em `Actions` que o workflow `CodeQL` executa com sucesso em PR para `main`.
2. Verificar em `Security > Code scanning alerts` que os resultados do CodeQL estão visíveis.
3. Em `Settings > Branches`, exigir o status check `Analyze (JavaScript/TypeScript)` para merge na `main`.
4. Executar `workflow_dispatch` manual quando houver mudanças estruturais em rotas/API/auth para validação imediata.

### Pré-requisitos operacionais do CodeQL

1. Repositório precisa estar em plano/licença com CodeQL habilitado para code scanning.
2. Em PRs de forks públicos, permissões do `GITHUB_TOKEN` podem limitar upload de resultados.
3. Sempre validar o primeiro run no branch padrão (`main`) para garantir indexação inicial no Security tab.

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

1. Lemon Squeezy: rotacionar `LEMON_SQUEEZY_API_KEY` e `LEMON_SQUEEZY_WEBHOOK_SECRET`.
2. Supabase: rotacionar `SUPABASE_SERVICE_ROLE_KEY`.
3. Atualizar variáveis no Vercel (Production/Preview/Development).
4. Validar app e webhooks após rotação.

## Observações

- Use placeholders neutros em docs (`your_*`, `YOUR_*`).
- Não commite `.env` e `.env.local`.
- Se um segredo já foi commitado no passado, considere comprometido e rotacione.
