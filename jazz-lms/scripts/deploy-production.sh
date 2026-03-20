#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

required_envs=(
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  NEXT_PUBLIC_APP_URL
  DATABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  LEMON_SQUEEZY_API_KEY
  LEMON_SQUEEZY_WEBHOOK_SECRET
  LEMON_SQUEEZY_STORE_ID
  LEMON_SQUEEZY_VARIANT_ID
  SUPABASE_STORAGE_BUCKET
  MUX_SIGNING_KEY_ID
  MUX_SIGNING_PRIVATE_KEY
  SIGNED_URL_TTL_SECONDS
  PROFESSOR_EMAIL
  RESEND_API_KEY
  RESEND_FROM_EMAIL
  INBOUND_EMAIL_WEBHOOK_SECRET
  ADMIN_OWNER_EMAIL
)

missing=()
for key in "${required_envs[@]}"; do
  if [[ -z "${!key:-}" ]]; then
    missing+=("$key")
  fi
done

if (( ${#missing[@]} > 0 )); then
  echo "❌ Missing required env vars: ${missing[*]}"
  echo "   Load production envs first, then rerun."
  exit 1
fi

echo "▶ Build production"
npm run build

echo "▶ Integration preflight"
npm run check:integrations

echo "▶ Deploy to Vercel production"
vercel --prod --yes

echo "✅ Deployment finished"
