#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "▶ Running payment backend validation suite"

npx vitest run \
  tests/integration/checkout-route.test.ts \
  tests/integration/purchases-route.test.ts \
  tests/integration/lemon-webhook-route.test.ts \
  tests/integration/dev-reset-purchases-route.test.ts \
  tests/unit/course-purchase-sync.test.ts \
  tests/unit/checkout-helpers.test.ts \
  tests/unit/test-mode.test.ts \
  tests/contract/api-contracts.test.ts \
  tests/security/security.test.ts

echo "✅ Payment backend validation passed"
