#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
	echo "ℹ️ Ambiente sem repositório git; pulando setup de hooks."
	exit 0
fi

REPO_ROOT="$(git rev-parse --show-toplevel)"
HOOKS_DIR="$ROOT_DIR/.githooks"

if [[ "$HOOKS_DIR" == "$REPO_ROOT" ]]; then
	HOOKS_PATH=".githooks"
elif [[ "$HOOKS_DIR" == "$REPO_ROOT/"* ]]; then
	HOOKS_PATH="${HOOKS_DIR#$REPO_ROOT/}"
else
	echo "❌ Não foi possível resolver o caminho de hooks relativo ao repositório."
	echo "   Repo root: $REPO_ROOT"
	echo "   Hooks dir: $HOOKS_DIR"
	exit 1
fi

git config core.hooksPath "$HOOKS_PATH"
chmod +x "$HOOKS_DIR/pre-commit" "$HOOKS_DIR/pre-push" "$ROOT_DIR/scripts/precommit-secret-scan.sh"

echo "✅ Git hooks configurados em $HOOKS_PATH"
