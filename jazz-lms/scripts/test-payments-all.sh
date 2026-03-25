#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "▶ Step 1/3: Payment backend tests"
bash scripts/test-payments-backend.sh

echo "▶ Step 2/3: Real Dodo frontend E2E"
bash scripts/test-payments-frontend-real.sh

echo "▶ Step 3/3: Production build"
rm -rf .next
npm run build

echo "✅ Full payment validation (backend + frontend real + build) completed"
