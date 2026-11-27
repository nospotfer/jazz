#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Any reviewed commit may be previewed in the explicitly linked project/team.
# Validate isolated provider settings separately before exercising accounts.
node scripts/check-deploy-target.mjs preview

echo "▶ Lint preflight"
npm run lint

echo "▶ Types and automated tests"
npm run typecheck
npm test

echo "▶ Build preflight"
npm run build:webpack

echo "▶ Deploy to Vercel preview (test)"
node scripts/check-deploy-target.mjs preview
vercel --yes --non-interactive

echo "✅ Preview deployment finished"
