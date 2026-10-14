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
| [Separate preview](preview.md) | Guarded Free cloud backend, synthetic fixtures and customer-journey evidence | Native9bd learning, FB hydrated mobile editors, BC35/35 real language controls; earlier four-role/media/PDF/layout scopes preserved |
| [Resend audit](resend.md) | Read-only account evidence and activation sequence | Documented; receiving disabled |
| [Vercel audit](vercel.md) | Authoritative live target, environments, runtime, cron and account gates | Authenticated; shared production/preview dependencies verified |
| [Zero-cost hosting](hosting.md) | Conditional stable hosting, old deployment quarantine and rollback | Monster + free named tunnel preferred if availability/account/DNS control exists; no setup or cutover performed |
| [Dodo audit](dodo.md) | Live product, tax setting, webhook and test-mode access | Test product and two coupon APIs verified; transactions and notification review pending |
| [Native safeguards](native-runtime.md) | Counters, sweeps, trusted ingress and reproducible release builds | Fresh sealed artifact, Unix launcher/HTTPS/restart/cleanup verified; runner prepared and disabled; production activation pending |
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
all 29 initial cloud-backend browser checks pass. Historical source `e32a370` was
freshly built, sealed and verified through a Basic-protected temporary HTTPS
tunnel and private Unix sockets. Four native roles, actual Mux playback,
certificates and fresh mobile PDF text pass. Twelve public layouts and 48
computed contrast checks pass after a three-line gold-text contrast repair.
Separate browser reports retain initial observations; the final independent
snapshot preserves learning, purchases and zero business records.
Earlier source 27's 45 checks and other reports remain historical and immutable.
The temporary app and tunnel closed cleanly before their deadlines.
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

Historical source `e32a370` includes the bounded limiter/sweep, validated
ingress, explicit environment, immutable release producer, private preview
launcher and disabled reconciliation runner. Clean verification and downloaded
exact-source CI confirm 1,915 normal tests/40 skips, 39 actual PostgreSQL tests/
one skip, types/build and lint 0 errors/25 existing warnings. Fresh locked
configured build matches 548 archived application Git blobs, verifies 45,766
sealed files and excludes supplied server secrets from 157 client files.
Actual restart, worker-exit cleanup, separate-UID denial and reinspection pass.
Production hosting/account/DNS/quarantine, Google/mail and Dodo notification/
transaction verification remain open. Goal is active and incomplete.
[Latest checkpoint](review-status.md#protected-native-preview-and-contrast).


Earlier source `57f5de1` fixes password navigation ordering/late auth events,
adds the drawer link to saved notes and aligns accessible completion labels in
ES/EN/FR/PT. Exact CI confirms1,935 normal passes/40 skips,39 actual PostgreSQL
passes/one skip,types/build/lint0/25 and committed555-file secret scan0. Fresh
sealed550/45,769/158-file build and Unix19/HTTPS11 pass. Exact9bd browser learning
independently persists two notes/two completed lessons/two quizzes24answers with
PLATINUM/GOLD, preserving original-four records. Browser and source scopes remain
separate; latest mobile notes-entry verification is tracked in the
[current checkpoint](review-status.md#mobile-drawer-recovery-and-recorded-payment-amounts).
The goal remains active and incomplete; no paid upgrade or production release.

The mobile drawer picker/editor link is verified at320/390 after its scroll/space
repair. Unknown historical payment amounts are now explicit instead of borrowing
current catalog price. Hydrated editor text and actual locale controls remain
separate browser checks.


Earlier source `133716b` preserves missing/malformed provider amounts asNULL,
retains same-payment known facts and correct voucher links, and clears stale
accounting on replacement payments. Exact CI/downloaded logs confirm1,973 normal
passes/47 skips and46 actual PostgreSQL passes/one skip; types/build/lint0/25 and
556-file source scan0. The260 targeted payment checks include18 actual PostgreSQL
cases. Actual browser proof stays bound to FB editors/BC35/35 language controls;
all temporary processes are closed and all-five12-model preservation passes.
[Current source and remaining gates](review-status.md#provider-amount-availability).

Current source `a207f36` makes payment-history failures recoverable and prevents
stale financial rows across account changes. Exact CI confirms 1,995 normal
passes/47 skips and 46 PostgreSQL passes/one skip. A fresh sealed native HTTPS
window passes 31/31 history checks across four languages/mobile/desktop: €80,
unavailable, €0 and restored €80, plus controlled error/real retry and actual
owner-mismatch409. Bounded root SQL touched only one synthetic grant, restored
exactly; all-five12-model fingerprints match, temporary services are closed and
the session deleted. No actual provider payment, spend or production change.
[Current source, evidence and open gates](review-status.md#payment-history-recovery-and-account-isolation).

The rollback proposal now includes a concrete [static maintenance fallback](maintenance-fallback.md)
with original branding, four languages and a reviewable503/header contract.
Actual browser/HTTP138/138 and separate local-file4/4 checks pass; initial zoom
failure remains preserved. No activation occurred. Ignored credential CSV/app.env
permissions are now0600, and the TEST key has protected durable local retention.
[Operational checkpoint](review-status.md#local-credential-boundaries-and-static-rollback-fallback).
