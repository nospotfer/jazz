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
| [Database review](database.md) | Schema, RLS, role prerequisites and backup gates | Production exposure confirmed; hardening prepared separately, not applied |
| [Supabase manager and recovery](supabase.md) | Existing customer-project status, preservation and bounded rollback | Approved recovery and private exports completed; offline data restore verified; INACTIVE after unsafe-state rollback |
| [Separate preview](preview.md) | Guarded Free cloud backend, synthetic fixtures and customer-journey evidence | Healthy/hardened; immutable 29/20/26/19/44 reports; current source27 free HTTPS frontend passes45 distinct checks |
| [Resend audit](resend.md) | Read-only account evidence and activation sequence | Documented; receiving disabled |
| [Vercel audit](vercel.md) | Authoritative live target, environments, runtime, cron and account gates | Authenticated; shared production/preview dependencies verified |
| [Zero-cost hosting](hosting.md) | Conditional stable hosting, old deployment quarantine and rollback | Monster + free named tunnel preferred if availability/account/DNS control exists; no setup or cutover performed |
| [Dodo audit](dodo.md) | Live product, tax setting, webhook and test-mode access | Test product and two coupon APIs verified; transactions and notification review pending |
| [Native safeguards](native-runtime.md) | Counters, sweeps, trusted ingress and reproducible release builds | Guard tests and fresh sealed artifact verified; launcher/runner/activation pending |
| [Operational scripts](operational-scripts.md) | Deployment/mutator hazards and safe prerequisites | Legacy mutators quarantined to explicit disposable local targets |
| [Review checkpoints](review-status.md) | Exact revisions, draft PR, remote checks and protected preview | Follow-up Quality, Secret Scan, CodeQL and Vercel build passed |

The goal is not complete until installation/build/checks are reproducible,
accessible critical/high defects are fixed and verified, relevant customer
journeys pass in a verified preview, and the production review package is ready.
Unverified integrations and deferred requirements must remain explicit.

The customer Supabase project is paused again after the explicitly approved
resume/preservation/unsafe-state rollback. A private database archive and all
68 current Storage files were preserved, and an isolated offline restore matched
65 table COPY counts / 2,239 archived records and all file hashes. Exact extension
ACL equivalence, full platform recovery and encrypted off-site retention remain
separate gaps. Inspection confirmed critical browser grants and unrestricted
self-role updates; production hardening and code release need a concrete new
review. The older local project is absent from this account's inventory.
Vercel configuration
confirms the deployed server and all three target environments use the same
Supabase project. Production and preview also share live Dodo credentials; the
existing Vercel configuration is unsuitable for isolated customer/payment testing.
An independent Free Supabase preview now has hardened tables, synthetic accounts
and private generated PDFs. Its local frontend uses only the new backend;
all 29 initial cloud-backend browser checks pass. A separate exact-source,
production-built HTTPS frontend at source `27d7b4c` passes 45 distinct checks
through a protected free temporary tunnel; its independent final snapshot
preserves learning and purchases. The earlier 44-check report remains immutable.
The temporary servers were closed after verification, before their deadline.
This is neither Vercel runtime proof nor stable production hosting. The owner
selected a zero incremental hosting budget. The offline customer archive was never loaded
into the customer-journey preview or existing fixture databases. Dodo test access
is now valid, but transactions await notification/recipient review.

## Authorized work

Local changes, tooling, commits, pushes, pull requests, previews and bounded
subagents are authorized. Production inspection is authorized. Production writes,
migrations, deployment, destructive operations, real charges/refunds, plan
changes and messages to third parties require explicit approval. Credentials
remain local and redacted; rotation is left to the user. Test customer data and
payment environments must be isolated from production.

Application source `3cbb17c` includes the bounded limiter/sweep, validated
ingress, explicit environment and immutable release producer. Clean verification
passes 1,763 normal tests/40 skips, types and lint 0 errors/25 existing warnings.
A fresh locked configured build at package source `ab14628` matches 541 archived Git application files,
verifies 45,759 sealed files and excludes server secrets from 157 client files.
Its origin is synthetic/unrouted and it was never started. Native launcher,
disabled runner and current-source HTTPS/browser proof remain separate work.
The earlier source27 45-check HTTPS report remains historical.
[Latest checkpoint](review-status.md#native-ingress-and-release-producer).
