#!/usr/bin/env bash
set -euo pipefail

MODE="${1:---staged}"

REGEX='(sk_(live|test)_[A-Za-z0-9]{16,}|pk_(live|test)_[A-Za-z0-9]{16,}|whsec_[A-Za-z0-9]{16,}|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{20,}|xox[baprs]-[A-Za-z0-9-]{20,}|-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----|SUPABASE_SERVICE_ROLE_KEY\s*=\s*["'"'"']?eyJ[A-Za-z0-9._-]{20,})'

scan_staged() {
  local patch
  patch="$(git diff --cached --no-color -U0 || true)"

  if [[ -z "$patch" ]]; then
    exit 0
  fi

  local matches
  matches="$(printf "%s\n" "$patch" | grep -E '^\+' | grep -v '^\+\+\+' | grep -nE "$REGEX" || true)"

  if [[ -n "$matches" ]]; then
    echo "❌ Segredo potencial detectado no conteúdo staged. Commit bloqueado."
    echo ""
    echo "$matches"
    echo ""
    echo "Se for falso positivo, revise o conteúdo ou use placeholders neutros."
    exit 1
  fi
}

scan_all() {
  local matches
  matches=""

  while IFS= read -r -d '' file; do
    case "$file" in
      node_modules/*|.next/*|.vercel/*)
        continue
        ;;
    esac

    local file_matches
    file_matches="$(grep -nE "$REGEX" "$file" || true)"

    if [[ -n "$file_matches" ]]; then
      matches+=$'\n'
      matches+="$file:$file_matches"
    fi
  done < <(git ls-files -z)

  if [[ -n "$matches" ]]; then
    echo "❌ Segredo potencial detectado em arquivos rastreados."
    echo ""
    echo "$matches"
    exit 1
  fi
}

case "$MODE" in
  --staged)
    scan_staged
    ;;
  --all)
    scan_all
    ;;
  *)
    echo "Uso: $0 [--staged|--all]"
    exit 1
    ;;
esac

exit 0
