#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ "${PAYMENTS_E2E_REAL_ENABLED:-0}" != "1" ]]; then
  echo "❌ PAYMENTS_E2E_REAL_ENABLED must be 1"
  exit 1
fi

if [[ -z "${PAYMENTS_E2E_STORAGE_STATE:-}" || ! -f "${PAYMENTS_E2E_STORAGE_STATE:-}" ]]; then
  echo "❌ PAYMENTS_E2E_STORAGE_STATE is missing or file does not exist"
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

if [[ -z "${E2E_LOGIN_USER_ID:-}" ]]; then
  echo "❌ Missing E2E_LOGIN_USER_ID (required to reset state between scenarios)"
  exit 1
fi

PAYMENTS_E2E_EXPECT_HOST="${PAYMENTS_E2E_EXPECT_HOST:-lemonsqueezy.com}"

IFS=',' read -r -a VOUCHERS <<< "$PAYMENTS_E2E_VOUCHER_CODES"
IFS=',' read -r -a METHODS <<< "${PAYMENTS_E2E_METHODS:-card,paypal}"

TOTAL=0
PASSED=0
FAILED=0

echo "▶ Starting serial voucher matrix (${#VOUCHERS[@]} vouchers x ${#METHODS[@]} methods)"

for rawCode in "${VOUCHERS[@]}"; do
  CODE="$(echo "$rawCode" | xargs)"
  if [[ -z "$CODE" ]]; then
    continue
  fi

  for rawMethod in "${METHODS[@]}"; do
    METHOD="$(echo "$rawMethod" | xargs | tr '[:upper:]' '[:lower:]')"
    if [[ "$METHOD" != "card" && "$METHOD" != "paypal" ]]; then
      continue
    fi

    TOTAL=$((TOTAL + 1))

    echo "\n────────────────────────────────────────────────────────"
    echo "▶ Case $TOTAL: voucher=$CODE method=$METHOD"

    set +e
    PAYMENTS_E2E_EXPECT_HOST="$PAYMENTS_E2E_EXPECT_HOST" \
    npm run reset:user:vouchers -- --user-id="$E2E_LOGIN_USER_ID" --course-id="$PAYMENTS_E2E_COURSE_ID" >/tmp/payments-reset-case.log 2>&1
    RESET_EXIT=$?
    set -e

    if [[ $RESET_EXIT -ne 0 ]]; then
      echo "❌ Reset failed for case $TOTAL"
      tail -n 40 /tmp/payments-reset-case.log || true
      FAILED=$((FAILED + 1))
      continue
    fi

    set +e
    PAYMENTS_E2E_REAL_ENABLED=1 \
    PAYMENTS_E2E_STORAGE_STATE="$PAYMENTS_E2E_STORAGE_STATE" \
    PAYMENTS_E2E_COURSE_ID="$PAYMENTS_E2E_COURSE_ID" \
    PAYMENTS_E2E_EXPECT_HOST="$PAYMENTS_E2E_EXPECT_HOST" \
    PAYMENTS_E2E_METHODS="$METHOD" \
    PAYMENTS_E2E_VOUCHER_CODES="$CODE" \
    npx playwright test tests/e2e/payments-voucher-matrix-real.spec.ts --grep "voucher matrix responds and redirects" >/tmp/payments-case.log 2>&1
    CASE_EXIT=$?
    set -e

    if [[ $CASE_EXIT -eq 0 ]]; then
      echo "✅ Passed: voucher=$CODE method=$METHOD"
      PASSED=$((PASSED + 1))
    else
      echo "❌ Failed: voucher=$CODE method=$METHOD"
      tail -n 60 /tmp/payments-case.log || true
      FAILED=$((FAILED + 1))
    fi
  done
done

echo "\n========================================================"
echo "Serial voucher matrix done"
echo "Total:  $TOTAL"
echo "Passed: $PASSED"
echo "Failed: $FAILED"

if [[ $FAILED -gt 0 ]]; then
  exit 1
fi

echo "✅ All serial voucher matrix cases passed"
