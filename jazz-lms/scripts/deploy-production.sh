#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Explicit owner approval for this exact production operation remains required.
# This guard establishes scope; an environment variable is not that approval.
node scripts/check-deploy-target.mjs production

echo "▶ Lint preflight"
npm run lint

echo "▶ Types and automated tests"
npm run typecheck
npm test

echo "▶ Build production"
npm run build:webpack

# Recheck after preflights, including newly generated untracked source.
node scripts/check-deploy-target.mjs production

echo "▶ Deploy to Vercel production"
vercel --prod --yes --non-interactive

echo "✅ Deployment finished"
