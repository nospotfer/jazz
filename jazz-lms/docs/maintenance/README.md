# Initial maintenance and stabilization

Started 2026-10-13 on `maintenance/initial-audit` from repository `main` commit
`c897f36`. Authenticated Vercel inspection subsequently identified the actual
live deployment as a June 11 redeploy with reported source `50c2f87f`; see the
[Vercel audit](vercel.md). The user explicitly requested UX/UI improvements that make the
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
| [Supabase manager and recovery](supabase.md) | Existing customer-project status, stored Auth/config and bounded resume proposal | Authenticated; production project INACTIVE, resume approval pending |
| [Resend audit](resend.md) | Read-only account evidence and activation sequence | Documented; receiving disabled |
| [Vercel audit](vercel.md) | Authoritative live target, environments, runtime, cron and account gates | Authenticated; shared production/preview dependencies verified |
| [Dodo audit](dodo.md) | Live product, tax setting, webhook and test-mode access | Read-only live access works; test credentials still needed |
| [Operational scripts](operational-scripts.md) | Deployment/mutator hazards and safe prerequisites | Legacy mutators quarantined to explicit disposable local targets |
| [Review checkpoints](review-status.md) | Exact revisions, draft PR, remote checks and protected preview | Follow-up Quality, Secret Scan, CodeQL and Vercel build passed |

The goal is not complete until installation/build/checks are reproducible,
accessible critical/high defects are fixed and verified, relevant customer
journeys pass in a verified preview, and the production review package is ready.
Unverified integrations and deferred requirements must remain explicit.

The largest current availability gate is the inactive Supabase customer project.
Authenticated manager access identifies the deployed feav project in Neurofactory
Org; no usable backup/restore has yet been verified. The older local project is
absent from this account's inventory. A bounded same-project resume/preservation
proposal awaits production approval. Preserve the source before any replacement.
Vercel configuration
confirms the deployed server and all three target environments use the same
Supabase project. Production and preview also share live Dodo credentials; the
existing preview is unsuitable for isolated customer/payment testing.

## Authorized work

Local changes, tooling, commits, pushes, pull requests, previews and bounded
subagents are authorized. Production inspection is authorized. Production writes,
migrations, deployment, destructive operations, real charges/refunds, plan
changes and messages to third parties require explicit approval. Credentials
remain local and redacted; rotation is left to the user. Test customer data and
payment environments must be isolated from production.
