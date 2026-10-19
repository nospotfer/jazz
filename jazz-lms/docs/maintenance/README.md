# Initial maintenance and stabilization

Started 2026-10-13 on `maintenance/initial-audit`; updated 2026-10-19.
[Draft PR #46](https://github.com/nospotfer/jazz/pull/46) contains the maintenance
changes. **The goal is incomplete and the changes are not deployed.** The owner
requested a stable, tested project and a more attractive, usable website while
preserving its jazz identity. The hosting budget is zero incremental spend.

## Current verified checkpoint

- Published source/test checkpoint `fc8d813` passes Quality PR/push, Secret Scan and CodeQL,
  with zero open head-ref alerts. Downloaded logs verify 2,537 normal passes/80
  intentional skips, 80 persisted passes/one REST skip (79 actual PostgreSQL cases
  plus one metadata case), types, webpack build and lint 0 errors/22 existing warnings.
- Landing changes improve the hero, mobile actions/menu, contrast, touch targets
  and keyboard focus. Application `1e381a3` has 12 local production-browser cases;
  the later whole-page review covers 390/1440px in both themes. Voucher amount
  wrapping is separately verified at `8053c1b`. [Visual evidence](review-status.md#landing-press-and-footer-accessibility).
- Exact `5f9597a` is the latest configured authenticated monetary preview: 19 Unix-runtime checks,
  11 HTTPS checks and 17 native checks, with independent 12-model/18-hash/full-Purchase
  restoration and owned-resource cleanup. Earlier registration/recovery,
  four-role access, learning, Mux, native PDFs and certificates retain their
  individual source bindings. These checks do not prove Dodo, Google or real mail
  delivery. [Journey matrix](verification-matrix.md).
- The approved customer Supabase resume/preservation/unsafe-state rollback is
  complete. Its private archive preserves 65 tables/2,239 records/two sequences;
  all 68 exported Storage files are verified. Production was last confirmed
  INACTIVE. Critical browser grants and self-role escalation require the prepared
  hardening together with repaired code/configuration before another resume.
- Offline recovery now verifies exact 225-column hardening, literal additive
  currency SQL and strict 227 postchecks. The completed Prisma5.17 history
  rehearsal preserves all four original ledger records byte-for-byte, adds
  exactly three official acknowledgements and matches all seven SQL checksums.
  Original data/sequences and 446 permission operations pass. This is offline
  evidence, not current production or complete hosted-platform equivalence.
  [Recovery and history](payment-currency.md#historical-sql-source-and-bookkeeping).
- Google first and returning login now pass on exact `fc8d813` in the isolated
  preview, reusing the same Auth/application/Google identity with USER role and
  no purchases. Final normal sign-out leaves zero sessions. The fresh locked
  build/seal45,827, Unix19/HTTPS11, authorize-start7 and147 client-asset secret
  exclusions pass. All original25 public/three Auth tables remain unchanged;
  every Auth field is restored and app/tunnel are closed. Two runtime error
  counters have no established cause; this is not an error-free dashboard or
  production-customer continuity claim. [Google evidence](google-oauth.md).
- Source33dd19f: automatic reconciliation returns explicit503 when its payment
  key is absent instead of internal500. Actual-helper closed-network regressions
  preserve401, configured historical grants and failure diagnostics;164 focused
  checks pass. This independently fixes missing-configuration behavior without
  attributing the two historical Google-window error counters.

Reviewed evidence is retained owner-only outside `/tmp`, including the
`review-checkpoint-history-completed-9544d13-20261015` checkpoint under
`/home/gabriel/backups/culturadeljazz-maintenance/`. Credentials, customer COPY
rows, raw ledger IDs and enabled execution approvals are excluded from that
selected package. Retention is local and unencrypted; off-site recovery is not
established. Temporary preview processes and disposable recovery containers are
closed. Historical reports remain unchanged in [review checkpoints](review-status.md).
The separate `review-checkpoint-google-oauth-preparation-f1df347-20261017`
package retains24 selected files/33,251 bytes without credential files, temporary
gate HTML/password or raw Auth configuration. The later actual Google login
package `review-checkpoint-google-login-fc8d813-20261019` retains22 selected
files/39,349 bytes, including the explicit two-error diagnostic limitation.

## Remaining verification and decisions

| Gate | Evidence or decision still needed |
| --- | --- |
| Dodo checkout, coupons, webhook delivery/reconciliation and reversals | Account evidence for customer, merchant/team and webhook-alert recipients before the prepared sandbox transactions. The controlled customer email is known; it does not authorize mail to unknown team recipients. TEST product/coupon API acceptance and synthetic app journeys are already verified. |
| Cloud auth mail and production Google transition | Actual first/returning isolated Google login and normal final sign-out pass. Production client/callback/customer continuity remain a reviewed release operation. Controlled SMTP recipients and bounded cloud registration/reset delivery remain unverified; local emailed OTP/PKCE proof is separate. |
| Price, currency and tax authority | Review the archived EUR 29.99 catalog interpretation against the live EUR 29.90 tax-exclusive product. Current source stores server quotes separately from canonical charged facts. No production catalog/provider change is authorized. |
| Stable zero-cost hosting and DNS | Confirm continuous Monster operation and legitimate Cloudflare/registrar DNS access, or provide an existing suitable free host. Temporary protected HTTPS preview is verified; no stable host or domain cutover is provisioned. |
| Production recovery and release | Fresh target compatibility/backup, exact SQL/Auth/runtime configuration, old-deployment/cron quarantine and deployment/rollback sequence, followed by explicit owner approval. Offline success does not authorize production changes. |

The existing Vercel production and preview settings share the customer Supabase
backend and live Dodo resources; they are unsuitable for isolated testing. The
separate Free Supabase preview uses synthetic actors/private generated PDFs.
Its archived-data recovery checks run in other disposable containers; customer
backup data is never loaded into the journey preview. No paid Vercel upgrade,
real charge/refund or third-party message is included.

## Deliverables

| Artifact | Purpose |
| --- | --- |
| [Maintenance log](maintenance-log.md) | Findings, changes, checks and next action |
| [Service inventory](service-inventory.md) | Infrastructure, ownership, account access and billing gaps |
| [Prioritized backlog](backlog.md) | Repaired defects, deferred work and release gates |
| [Verification matrix](verification-matrix.md) | Requirement-by-requirement evidence and remaining gaps |
| [Release and rollback](release-checklist.md) | Production review, activation and rollback requirements |
| [Local verification](local-verification.md) | Guarded databases, native Auth/storage and browser reproduction |
| [Public provider evidence](public-provider-evidence.md) | Observed deployed failures and inspection limits |
| [Database review](database.md) / [Supabase recovery](supabase.md) | Permissions, preservation and hosted-platform recovery limits |
| [Payment currency and migration history](payment-currency.md) | Canonical facts, additive migration, exact recovery order and ledger reconciliation |
| [Separate preview](preview.md) | Isolated backend, synthetic fixtures and source-bound customer journeys |
| [Dodo](dodo.md) / [Resend](resend.md) / [Vercel](vercel.md) | Provider inventories and remaining account/configuration gates |
| [Google sign-in](google-oauth.md) | Replacement ownership, private credential locations, expired-window evidence and the bounded login/release runbook |
| [Zero-cost hosting](hosting.md) / [Maintenance fallback](maintenance-fallback.md) | Conditional stable host, quarantine and verified static rollback asset |
| [Native safeguards](native-runtime.md) | Reproducible artifacts, private ingress, lifecycle and disabled daily runner |
| [Operational scripts](operational-scripts.md) | Mutator hazards and explicit disposable-target prerequisites |
| [Review checkpoints](review-status.md) | Exact revisions, PR, CI, preview evidence and historical limits |

## Authorized work

Local changes, tooling, commits, pushes, pull requests, previews and bounded
subagents are authorized. Production inspection is authorized. Production writes,
migrations, deployments, destructive operations, real charges/refunds, plan
changes and messages to third parties require explicit owner approval. Credentials
remain local and redacted; rotation is left to the owner. Test customer data and
payment environments must stay isolated from production.

Completion requires the full audited scope, fixed and verified accessible
critical/high defects, reproducible installation/build/checks, passing relevant
preview journeys and a production review package. Missing integration evidence
and deferred requirements remain explicit; a green build alone does not complete
the goal.
