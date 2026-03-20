#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ "${PAYMENTS_E2E_REAL_ENABLED:-0}" != "1" ]]; then
  echo "❌ PAYMENTS_E2E_REAL_ENABLED must be 1 to run real Lemon E2E"
  exit 1
fi

if [[ -z "${PAYMENTS_E2E_STORAGE_STATE:-}" ]]; then
  echo "❌ Missing PAYMENTS_E2E_STORAGE_STATE"
  exit 1
fi

if [[ -z "${PAYMENTS_E2E_COURSE_ID:-}" ]]; then
  echo "❌ Missing PAYMENTS_E2E_COURSE_ID"
  exit 1
fi

if [[ -z "${PAYMENTS_E2E_VOUCHER_CODES:-}" ]]; then
  echo "❌ Missing PAYMENTS_E2E_VOUCHER_CODES"
  exit 1
fi

if [[ ! -f "$PAYMENTS_E2E_STORAGE_STATE" ]]; then
  echo "❌ PAYMENTS_E2E_STORAGE_STATE file not found: $PAYMENTS_E2E_STORAGE_STATE"
  exit 1
fi

echo "▶ Running real Lemon voucher matrix E2E"
npx playwright test tests/e2e/payments-voucher-matrix-real.spec.ts
echo "✅ Real Lemon voucher matrix E2E passed"
