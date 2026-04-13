#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

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
deploy_output="$(vercel --yes)"
echo "$deploy_output"

deployment_url="$(printf '%s\n' "$deploy_output" | grep -Eo 'https://[^[:space:]]+\.vercel\.app' | tail -n1 || true)"
stable_test_url=""

if [[ -n "$deployment_url" ]]; then
  inspect_output="$(vercel inspect "$deployment_url" || true)"
  stable_test_url="$(printf '%s\n' "$inspect_output" | awk '
    /Aliases/ { in_aliases=1; next }
    /Builds/ { in_aliases=0 }
    in_aliases && /https:\/\// {
      for (i = 1; i <= NF; i++) {
        if ($i ~ /^https:\/\//) {
          print $i
          exit
        }
      }
    }
  ')"
fi

if [[ -n "$stable_test_url" ]]; then
  echo "✅ Preview deployment finished"
  echo "🔗 Stable test URL: $stable_test_url"
elif [[ -n "$deployment_url" ]]; then
  echo "✅ Preview deployment finished"
  echo "🔗 Preview URL: $deployment_url"
else
  echo "✅ Preview deployment finished"
  echo "⚠ Could not detect deployment URL from Vercel output."
fi
