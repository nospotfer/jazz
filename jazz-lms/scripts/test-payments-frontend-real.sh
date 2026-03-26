#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ "${PAYMENTS_E2E_REAL_ENABLED:-0}" != "1" ]]; then
  echo "❌ PAYMENTS_E2E_REAL_ENABLED must be 1 to run real Dodo E2E"
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

if [[ ! -f "$PAYMENTS_E2E_STORAGE_STATE" ]]; then
  echo "❌ PAYMENTS_E2E_STORAGE_STATE file not found: $PAYMENTS_E2E_STORAGE_STATE"
  exit 1
fi

is_port_3000_busy() {
  if command -v ss >/dev/null 2>&1; then
    ss -ltn 2>/dev/null | grep -q ':3000 '
    return
  fi

  if command -v lsof >/dev/null 2>&1; then
    lsof -nP -iTCP:3000 >/dev/null 2>&1
    return
  fi

  return 1
}

if is_port_3000_busy && [[ "${PAYMENTS_E2E_ALLOW_SERVER_REUSE:-0}" != "1" ]]; then
  echo "❌ Port 3000 is already in use."
  echo "   Stop existing dev servers before running real payment E2E, or set PAYMENTS_E2E_ALLOW_SERVER_REUSE=1 if you intentionally want to reuse the current server."
  exit 1
fi

echo "▶ Running real Dodo frontend E2E"
PLAYWRIGHT_REUSE_EXISTING_SERVER="${PLAYWRIGHT_REUSE_EXISTING_SERVER:-0}" \
  npx playwright test tests/e2e/payments-dodo-real.spec.ts
echo "✅ Real Dodo frontend E2E passed"
