# Initial maintenance and stabilization

Started 2026-10-13 on `maintenance/initial-audit` from production commit
`c897f36`. The user also explicitly requested UX/UI improvements that make the
site attractive and easy to use while preserving its jazz identity.

## Deliverables

| Artifact | Purpose | Current state |
| --- | --- | --- |
| [Maintenance log](maintenance-log.md) | Findings, changes, checks, next action | In progress |
| [Service inventory](service-inventory.md) | Infrastructure, account access and verification gaps | In progress |
| [Prioritized backlog](backlog.md) | Confirmed defects and deferred work | In progress |
| [Verification matrix](verification-matrix.md) | Requirement-by-requirement evidence | In progress |
| [Release and rollback](release-checklist.md) | Concrete production review package | In progress |
| [Local verification](local-verification.md) | Guarded databases, native Auth/storage and browser reproduction | Documented |
| [Public provider evidence](public-provider-evidence.md) | Deployed/legacy Supabase DNS failure and inspection limits | Documented |
| [Database review](database.md) | Schema, RLS, role prerequisites and backup gates | Locally tested; production unverified |
| [Resend audit](resend.md) | Read-only account evidence and activation sequence | Documented; receiving disabled |
| [Operational scripts](operational-scripts.md) | Deployment/mutator hazards and safe prerequisites | Documented; do not run on production |

The goal is not complete until installation/build/checks are reproducible,
accessible critical/high defects are fixed and verified, relevant customer
journeys pass in a verified preview, and the production review package is ready.
Unverified integrations and deferred requirements must remain explicit.

The largest current availability gate is the Supabase public endpoint: both the
deployed frontend project and the older local project fail independent DNS
checks. Preserve and locate the actual customer database before preparing any
production configuration change or replacement project.

## Authorized work

Local changes, tooling, commits, pushes, pull requests, previews and bounded
subagents are authorized. Production inspection is authorized. Production writes,
migrations, deployment, destructive operations, real charges/refunds, plan
changes and messages to third parties require explicit approval. Credentials
remain local and redacted; rotation is left to the user. Test customer data and
payment environments must be isolated from production.
