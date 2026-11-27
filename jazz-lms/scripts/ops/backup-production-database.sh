#!/usr/bin/env bash
# Nightly backup of the production Supabase database (public, auth and storage
# metadata schemas) plus a keep-alive request so the Free project is never idle
# for seven days. Runs from the `jazz-db-backup` user systemd timer on Monster.
#
# Usage: backup-production-database.sh /path/to/runtime-private.json
#
# The runtime config supplies DATABASE_URL (session pooler), the provider CA,
# the public Supabase URL/anon key and the Resend key used to email
# admin@neurofactory.net if the backup fails. Secrets travel only through the
# environment, never on a command line.
set -euo pipefail
umask 077

CONFIG=${1:?usage: $0 /path/to/runtime-private.json}
BACKUP_DIR=${JAZZ_BACKUP_DIR:-$HOME/backups/culturadeljazz-production/db}
REMOTE=${JAZZ_BACKUP_REMOTE:-behemoth:backups/culturadeljazz-production/db}
KEEP_DAYS=${JAZZ_BACKUP_KEEP_DAYS:-30}
IMAGE=${JAZZ_BACKUP_IMAGE:-postgres:17-alpine}
ALERT_TO=${JAZZ_BACKUP_ALERT_TO:-admin@neurofactory.net}

STAMP=$(date -u +%Y%m%dT%H%M%SZ)
NAME="culturadeljazz-$STAMP.dump"
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

log() { printf '%s %s\n' "$(date -u +%FT%TZ)" "$*"; }

# Export libpq settings and helper values from the config without echoing them.
eval "$(python3 -I - "$CONFIG" <<'EOF'
import json, shlex, sys
from urllib.parse import urlparse, unquote
cfg = json.load(open(sys.argv[1]))
env = cfg["env"]
u = urlparse(env["DATABASE_URL"])
out = {
    "PGHOST": u.hostname, "PGPORT": str(u.port or 5432),
    "PGUSER": unquote(u.username or ""), "PGPASSWORD": unquote(u.password or ""),
    "PGDATABASE": (u.path or "/postgres").lstrip("/") or "postgres",
    "PGSSLMODE": "verify-full", "CA_FILE": cfg["ca"]["path"],
    "SUPABASE_URL": env["NEXT_PUBLIC_SUPABASE_URL"], "SUPABASE_ANON_KEY": env["NEXT_PUBLIC_SUPABASE_ANON_KEY"],
    "RESEND_KEY": env.get("RESEND_API_KEY", ""), "RESEND_FROM": env.get("RESEND_FROM_EMAIL", ""),
}
for k, v in out.items():
    print(f"export {k}={shlex.quote(v)}")
EOF
)"

alert() {
  local reason=$1
  log "FAILED: $reason"
  if [[ -n "$RESEND_KEY" && -n "$RESEND_FROM" ]]; then
    printf 'Authorization: Bearer %s\n' "$RESEND_KEY" > "$WORK/auth-header"
    python3 -I -c 'import json,sys; print(json.dumps({"from": sys.argv[1], "to": [sys.argv[2]], "subject": "[culturadeljazz] Database backup FAILED", "text": "The nightly database backup on Monster failed: " + sys.argv[3] + "\nCheck: journalctl --user -u jazz-db-backup.service"}))' \
      "$RESEND_FROM" "$ALERT_TO" "$reason" > "$WORK/alert.json"
    curl -sS --max-time 20 -o /dev/null -X POST https://api.resend.com/emails \
      -H @"$WORK/auth-header" -H 'Content-Type: application/json' --data @"$WORK/alert.json" || true
  fi
  exit 1
}

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

# 1. Keep-alive: an Auth health request counts as project activity.
printf 'apikey: %s\n' "$SUPABASE_ANON_KEY" > "$WORK/apikey-header"
health=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 -H @"$WORK/apikey-header" "$SUPABASE_URL/auth/v1/health" || true)
log "auth health: $health"
[[ "$health" == 200 ]] || alert "Supabase Auth health returned '$health' (project paused or down?)"

# 2. Dump with a pg_dump that matches the server major version.
docker run --rm --network bridge --user "$(id -u):$(id -g)" \
  -e PGHOST -e PGPORT -e PGUSER -e PGPASSWORD -e PGDATABASE -e PGSSLMODE -e PGSSLROOTCERT=/ca.crt \
  -v "$CA_FILE:/ca.crt:ro" -v "$WORK:/out" "$IMAGE" \
  pg_dump --format=custom --compress=9 --schema=public --schema=auth --schema=storage \
    --no-publications --no-subscriptions --file="/out/$NAME" \
  || alert "pg_dump exited with an error"

# 3. Sanity-check the archive before keeping it.
entries=$(docker run --rm --user "$(id -u):$(id -g)" -v "$WORK:/out:ro" "$IMAGE" pg_restore --list "/out/$NAME" | grep -c ' TABLE DATA ' || true)
size=$(stat -c %s "$WORK/$NAME")
log "dump $NAME: $size bytes, $entries table-data entries"
(( entries >= 26 && size > 100000 )) || alert "dump looks incomplete ($entries table-data entries, $size bytes)"
chmod 600 "$WORK/$NAME"
sha256sum "$WORK/$NAME" | sed "s#$WORK/##" > "$WORK/$NAME.sha256"
mv "$WORK/$NAME" "$WORK/$NAME.sha256" "$BACKUP_DIR/"

# 4. Copy off this host.
ssh -o BatchMode=yes -o ConnectTimeout=20 "${REMOTE%%:*}" "mkdir -p ${REMOTE#*:} && chmod 700 ${REMOTE#*:}" \
  && scp -q -o BatchMode=yes -p "$BACKUP_DIR/$NAME" "$BACKUP_DIR/$NAME.sha256" "$REMOTE/" \
  && ssh -o BatchMode=yes "${REMOTE%%:*}" "cd ${REMOTE#*:} && sha256sum -c --quiet $NAME.sha256 && find . -maxdepth 1 -name 'culturadeljazz-*.dump*' -mtime +$KEEP_DAYS -delete" \
  || alert "copy to ${REMOTE%%:*} failed (local copy kept in $BACKUP_DIR)"

# 5. Local retention.
find "$BACKUP_DIR" -maxdepth 1 -name 'culturadeljazz-*.dump*' -mtime +"$KEEP_DAYS" -delete
log "ok: $NAME stored locally and on ${REMOTE%%:*}"
