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

On 2026-10-20 the owner explicitly approved the pending maintenance actions
("I aprove everything, don't get blocked by such things please"). This is
continuing authorization for the prepared project maintenance plans, including
bounded isolated account/payment tests and controlled messages, and reviewed
production recovery, configuration, migration, deployment and rollback operations
once their technical prerequisites and rollback are ready. Do not ask for the
same permission again or treat historical approval gates as still unanswered.
Keep each operation concrete and bounded, record its evidence, and resolve
implementation failures autonomously. Ask only for genuinely missing access,
information or a material action outside this project scope. Use isolated test
data and provider test environments; a preview connected to production data is
not an isolated test environment. Keep real charges/refunds, paid plan changes,
unrelated Neurofactory services and credential rotation outside this maintenance
scope.

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

The separately controlled email-test USER now has a verified changed password.
Its current credentials are in the owner-only, explicitly loaded recovery file
`/home/gabriel/backups/culturadeljazz-maintenance/native-preview-configuration/mail-test-auth-fixture-20261020-private.json`.
Older email-test password files are historical. The fixture grants no role or
session authority and must stay separate from retained review evidence. Oct20
hosted recovery passes callback/form/identity, one password update, old-password
rejection, new-password dashboard login and normal logout on sealed source30d848a.
Original data is preserved, settings are restored and owned services are closed. A test
adapter repair required a same-profile session continuation; an uninterrupted
fresh current-source journey remains a distinct verification scope. Further
controlled tests use the owner's continuing authorization and a fresh bounded
plan; do not reuse a closed window or spent action ledger.

## Evidence

Keep the maintenance log, inventory, prioritized backlog, verification matrix
and release checklist current. Record actual checks and failures, distinguish
local fixes from deployed fixes, and do not treat mocks as proof of live service
health. Do not mark the goal complete until its full completion criteria are
verified. Follow the goal's blocked-state rules when essential access prevents
progress; newly available access is a reason to resume useful work.
