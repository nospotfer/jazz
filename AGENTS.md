# Cultura del Jazz maintenance

The application is in `jazz-lms/`; read its `AGENTS.md` before editing. The public
site is https://www.culturadeljazz.com and GitHub is `nospotfer/jazz`.

## Current operating contract

The user has authorized an initial maintenance and stabilization goal, including
UX/UI improvements. Its requirements and evidence live in
`jazz-lms/docs/maintenance/`. Resume existing work instead of repeating audits.

Work on `maintenance/initial-audit` or a coordinated maintenance branch. The user
has authorized installation of tooling, local changes, commits, pushes, pull
requests, preview deployments and bounded subagent work for this goal. Coordinate
file ownership when agents share the checkout.

Production inspection is authorized. Production deployments, configuration
changes, migrations, destructive operations, real charges or refunds, plan
changes and messages to third parties require explicit user approval. Prepare
those operations and their rollback for review. Existing specific approvals
persist; do not ask again for an already approved bounded operation. Use isolated
test data and provider test environments; a preview connected to production data
is not an isolated test environment.

The owner selected a zero-cost hosting budget. Do not request or perform a paid
Vercel upgrade. Use the existing machine and free resources for a protected
HTTPS preview; a temporary tunnel is testing infrastructure, not a production
hosting replacement. Keep any production hosting/domain move for concrete review.

## Credentials

The local credential CSV and environment files contain secrets. Never print,
commit, copy into reports, or capture them in screenshots. Inspect through code
that emits only redacted metadata. Exclude the CSV from Git. Use credentials only
for this project and leave credential rotation to the user. Preserve unrelated
local changes and shared Neurofactory services.

Keep ignored credential CSV/private environment files owner-only (0600); ignored
files can still expose credentials through filesystem permissions. The Dodo TEST
key also has a protected durable copy at
`/home/gabriel/.config/culturadeljazz-maintenance/dodo-test-api-key` (parent0700).
Read it explicitly only for the isolated test API. No automatic loading, key
rotation or payment/email authority follows from that copy. Credentials remain
separate from published and retained review evidence.

Existing preview provider inputs/CA and the five synthetic login credentials have
separate owner-only recovery files under
`/home/gabriel/backups/culturadeljazz-maintenance/native-preview-configuration/`.
The synthetic file is `synthetic-preview-auth-fixtures-private.json`; it does not
assign roles or restore sessions. Verify current database roles and construct a
fresh source/origin/gate plan before use. Do not copy these credential files into
the review evidence package or load them automatically. Retention is local and
unencrypted; off-site recovery is not established.

## Evidence and continuation

Use `production-readiness.md` and `backlog.md` in the maintenance directory for
the latest checkpoint and next action. Keep the maintenance log, inventory,
verification matrix and release checklist current. Record actual checks and
failures, distinguish source fixes from deployed fixes, and do not treat mocks
as proof of live service health. Do not mark the goal complete until its full
completion criteria are verified. Follow the goal's blocked-state rules when
essential access prevents progress; newly available access is a reason to resume
useful work.

The accepted database/PDF recovery is complete. Do not repeat accepted imports,
uploads, the committed Auth correction or completed session cleanups. Preserve
spent action ledgers. Dated failed attempts are history, not instructions to
repeat recovery. Keep their detailed receipts in the maintenance records rather
than accumulating transient status in this instruction file.
