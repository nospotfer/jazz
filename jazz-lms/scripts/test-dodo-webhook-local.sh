#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
ENDPOINT="${BASE_URL}/api/webhooks/dodo-jazzlms"
WEBHOOK_SECRET="${DODO_PAYMENTS_WEBHOOK_SECRET:-}"

if [[ -z "$WEBHOOK_SECRET" ]]; then
  echo "❌ DODO_PAYMENTS_WEBHOOK_SECRET is required"
  exit 1
fi

USER_ID="${USER_ID:-}"
COURSE_ID="${COURSE_ID:-}"
if [[ -z "$USER_ID" || -z "$COURSE_ID" ]]; then
  echo "❌ USER_ID and COURSE_ID are required"
  echo "   Example: USER_ID=u1 COURSE_ID=course_1 scripts/test-dodo-webhook-local.sh"
  exit 1
fi

PAYMENT_ID="${PAYMENT_ID:-pay_local_$(date +%s)}"
WEBHOOK_ID="${WEBHOOK_ID:-evt_local_$(date +%s)}"
WEBHOOK_TIMESTAMP="$(date +%s)"
CUSTOMER_EMAIL="${CUSTOMER_EMAIL:-test@example.com}"
AMOUNT_CENTS="${AMOUNT_CENTS:-2990}"
ORIGINAL_PRICE="${ORIGINAL_PRICE:-29.90}"
VOUCHER_CODE="${VOUCHER_CODE:-}"
PROVIDER_DISCOUNT_CODE="${PROVIDER_DISCOUNT_CODE:-}"

PAYLOAD=$(cat <<JSON
{
  "type": "payment.succeeded",
  "business_id": "${DODO_BUSINESS_ID:-bus_local}",
  "data": {
    "payment": {
      "id": "${PAYMENT_ID}",
      "amount": ${AMOUNT_CENTS},
      "subtotal_amount": ${AMOUNT_CENTS},
      "customer": {
        "email": "${CUSTOMER_EMAIL}"
      }
    },
    "metadata": {
      "userId": "${USER_ID}",
      "courseId": "${COURSE_ID}",
      "originalPrice": "${ORIGINAL_PRICE}",
      "voucherCode": "${VOUCHER_CODE}",
      "providerDiscountCode": "${PROVIDER_DISCOUNT_CODE}"
    }
  }
}
JSON
)

SIGNED_PAYLOAD="${WEBHOOK_ID}.${WEBHOOK_TIMESTAMP}.${PAYLOAD}"
WEBHOOK_SIGNATURE=$(printf '%s' "$SIGNED_PAYLOAD" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" -binary | base64)

echo "▶ POST ${ENDPOINT}"
HTTP_STATUS=$(curl -sS -o /tmp/dodo_webhook_response.json -w "%{http_code}" \
  -X POST "$ENDPOINT" \
  -H "content-type: application/json" \
  -H "webhook-id: ${WEBHOOK_ID}" \
  -H "webhook-timestamp: ${WEBHOOK_TIMESTAMP}" \
  -H "webhook-signature: v1,${WEBHOOK_SIGNATURE}" \
  --data "$PAYLOAD")

echo "HTTP ${HTTP_STATUS}"
cat /tmp/dodo_webhook_response.json
echo
