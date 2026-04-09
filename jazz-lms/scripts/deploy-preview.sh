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

echo "▶ Deploy to Vercel preview (test)"
vercel --yes

echo "✅ Preview deployment finished"
