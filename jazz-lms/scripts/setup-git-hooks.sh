#!/usr/bin/env bash
set -euo pipefail

git config core.hooksPath .githooks
chmod +x .githooks/pre-commit .githooks/pre-push scripts/precommit-secret-scan.sh

echo "✅ Git hooks configurados em .githooks"
