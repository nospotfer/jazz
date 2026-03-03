#!/usr/bin/env bash
set -euo pipefail

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
	echo "ℹ️ Ambiente sem repositório git; pulando setup de hooks."
	exit 0
fi

git config core.hooksPath .githooks
chmod +x .githooks/pre-commit .githooks/pre-push scripts/precommit-secret-scan.sh

echo "✅ Git hooks configurados em .githooks"
