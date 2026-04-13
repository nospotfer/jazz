#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

CANONICAL_TEST_URL="https://jazz-lms-neurofactory-neurofactorys-orgs-projects.vercel.app"

sanitize_cli_output() {
  printf '%s\n' "$1" | tr -d '\r' | sed -E 's/\x1B\[[0-9;?]*[ -\/]*[@-~]//g'
}

current_branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
if [[ "$current_branch" != "jazz-lms-dev-vercel" ]]; then
  echo "❌ Test deploy is only allowed from branch 'jazz-lms-dev-vercel'."
  echo "   Current branch: '${current_branch:-unknown}'"
  echo "   Switch with: git checkout jazz-lms-dev-vercel"
  exit 1
fi

if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
  echo "❌ Tracked local changes detected. Commit/stash before test deploy."
  git status --short
  exit 1
fi

echo "▶ Lint preflight"
npm run lint

echo "▶ Integration preflight"
npm run test:integration

echo "▶ Build preflight"
npm run build

echo "▶ Deploy to Vercel preview (test)"
deploy_output_raw="$(NO_COLOR=1 vercel --yes 2>&1)"
deploy_output="$(sanitize_cli_output "$deploy_output_raw")"
echo "$deploy_output"

deployment_url="$(printf '%s\n' "$deploy_output" | grep -Eo 'https://[^[:space:]]+\.vercel\.app' | tail -n1 || true)"
if [[ -z "$deployment_url" ]]; then
  echo "❌ Nao foi possivel detectar a URL do deploy no output da Vercel."
  exit 1
fi

inspect_output_raw="$(NO_COLOR=1 vercel inspect "$deployment_url" 2>&1 || true)"
inspect_output="$(sanitize_cli_output "$inspect_output_raw")"

if ! printf '%s\n' "$inspect_output" | grep -Fq "$CANONICAL_TEST_URL"; then
  echo "❌ Deploy concluido sem alias canônico de testes."
  echo "   Deploy URL: $deployment_url"
  echo "   Alias exigido: $CANONICAL_TEST_URL"
  exit 1
fi

echo "✅ Preview deployment finished"
echo "🔗 Link de teste (estavel): $CANONICAL_TEST_URL"
