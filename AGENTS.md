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
those operations and their rollback for review. Use isolated test data and
provider test environments; a preview connected to production data is not an
isolated test environment.

## Credentials

The local credential CSV and environment files contain secrets. Never print,
commit, copy into reports, or capture them in screenshots. Inspect through code
that emits only redacted metadata. Exclude the CSV from Git. Use credentials only
for this project and leave credential rotation to the user. Preserve unrelated
local changes and shared Neurofactory services.

## Evidence

Keep the maintenance log, inventory, prioritized backlog, verification matrix
and release checklist current. Record actual checks and failures, distinguish
local fixes from deployed fixes, and do not treat mocks as proof of live service
health. Do not mark the goal complete until its full completion criteria are
verified. Follow the goal's blocked-state rules when essential access prevents
progress; newly available access is a reason to resume useful work.
