# Initial maintenance and stabilization

Started 2026-10-13 on `maintenance/initial-audit`; updated 2026-10-20.
[Draft PR #46](https://github.com/nospotfer/jazz/pull/46) contains the maintenance
changes. **The goal is incomplete and the changes are unreleased in production.** The owner
requested a stable, tested project and a more attractive, usable website while
preserving its jazz identity. The hosting budget is zero incremental spend.

## Current verified checkpoint

Production Vercel is now protected and paused; public roots return503 after
verified propagation, including the existing bypass. Supabase remains INACTIVE.
[Current security/hosting/recovery checkpoint](production-readiness.md) separates
completed containment from the remaining Data API, cron and hosting gates.

The isolated pause/control/restore experiment closes at17:19 UTC with all29
table fingerprints and exact settings preserved. Its inactive schema PATCH
returns404, so it does not establish a safe production recovery control. The
preview is healthy again; production stays paused. [Result and next action](production-readiness.md#actual-isolated-control-result).

- Preceding verified publication `59a58f0` passes all five Quality PR/push,
  Secret Scan PR/push and CodeQL workflows, with zero open head-ref alerts.
  Downloaded logs verify 2,674 normal passes/80 intentional skips, 80 persisted
  passes/one skip, types, webpack build and lint 0 errors/22 existing warnings.
  Later documentation checkpoints do not extend the source-bound browser proofs.
- A separate legacy-key control verifies actual denial and same-key restoration,
  with all29 fingerprints/permissions/settings preserved after delayed readbacks.
  It covers that legacy key only. Current account metadata supports a candidate
  free replacement slot, but source-data currency and managed restore/cutover
  prerequisites remain unresolved; no replacement project is created.
  [Current recovery options](production-readiness.md#legacy-key-control-and-free-replacement-candidate).
- Landing changes improve the hero, mobile actions/menu, contrast, touch targets
  and keyboard focus. Application `1e381a3` has 12 local production-browser cases;
  the later whole-page review covers 390/1440px in both themes. Voucher amount
  wrapping is separately verified at `8053c1b`. [Visual evidence](review-status.md#landing-press-and-footer-accessibility).
- Earlier `5f9597a` verifies an authenticated monetary preview: 19 Unix-runtime checks,
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
- The original preservation now has an encrypted second-host copy on Behemoth:
  all80 files/7,757,784 plaintext bytes pass decrypted hashes and full integrity,
  including a second run from durable receiver files. The receiver-only private
  key is online without a passphrase; physical off-site separation, independent
  key custody and periodic retention remain open. [Verifier and custody](supabase.md#encrypted-second-host-preservation--oct20).
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
- Oct20 fresh registration passes uninterrupted on sealed `3e5b2c1`: one actual
  confirmation email, code verification, normal password login, matching dashboard
  and logout. Independent checks preserve all eight prior accounts,1,513 public
  rows and23 existing sessions; the new confirmed USER has zero sessions. Every
  Auth field is restored, owned services are closed and all45,831 sealed files
  pass reinspection. Seven blocked requests/seven console errors remain
  unclassified; private SSH does not prove public HTTPS. The earlier stale-readiness
  setup failure and pending actor are retained. [Registration evidence](cloud-auth-mail.md).
- Oct20 sealed `30d848a` passes hosted recovery: actual provider303/callback307/
  reset200, verified account identity, one password update, old-password rejection,
  new-password dashboard login and normal logout to the main page. The test
  adapter needed an SDK request-shape repair and same-profile session continuation;
  this is not an uninterrupted fresh current-source run. All original rows and
  Auth settings are preserved/restored, actor sessions are zero, services are
  closed and the45,830-file seal passes. Browser diagnostics remain qualified.
  [Actual recovery evidence](cloud-auth-mail.md).
- A separate uninterrupted fresh recovery run also passes on sealed `3e5b2c1`,
  without controller repair, browser restart or session/profile resume: one reset
  email and verification, one password update, old400/new200/dashboard and normal
  logout. All nine accounts/1,514 public rows/23 existing sessions remain preserved,
  with only the intended password/sign-in timestamps changed. Auth is restored,
  services closed and the45,831-file seal passes. Nine blocks/11 console errors
  remain incompletely attributed; the scoped private redirect adapter does not
  prove public HTTPS. [Current recovery](cloud-auth-mail.md).

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
The Oct20 hosted-recovery checkpoint retains45 selected code/finite-proof
files/247,001 bytes, excluding credentials, provider snapshots, mail bodies,
recovery URLs and browser state. Its separate current test credential fixture is
owner-only and must not be copied into review evidence.
The separate fresh-registration checkpoint retains44 selected files/294,368
bytes with zero actual-input/private-pattern matches. Its manifest is
`6b9648aa1386bc05507cfd86cf1439dc691a2e896edb7518e82a937c10a35b7d`;
credentials and provider/message bodies remain excluded.
The current recovery checkpoint separately retains49 selected files/266,630
bytes, manifest`a89011efae3877029bedb3abb0525496b1a73285655def28baab198c9258f285`,
with zero actual-input/private-pattern/recovery-URL matches. Credentials stay
separate; selected review evidence is local and unencrypted.

## Remaining verification and decisions

| Gate | Evidence or decision still needed |
| --- | --- |
| Dodo coupons, reconciliation and reversals | Actual sealedba105 TEST payment, signed native delivery and canonical purchase pass. A separate refund-only POST409 leaves the purchase retained; cause and reversal remain unverified. Private error-capture repair passes12 offline tests without another Dodo call or allowance. Fresh same-payment checks/bindings precede continuation. Dashboard account/team and alert settings remain unobserved. |
| Cloud auth mail and production Google transition | Isolated Google login and uninterrupted fresh registration on sealed3e5 pass. Separate uninterrupted current-application recovery also passes on sealed3e5; earlier sealed30d848a controller repair/profile continuation stays historical. Production client/template/callback/customer continuity remain release prerequisites. [Email evidence](cloud-auth-mail.md). |
| Price, currency and tax authority | Reconcile the archived EUR 29.99 catalog interpretation with the live EUR 29.90 tax-exclusive product before purchase activation. Current source stores server quotes separately from canonical charged facts; no catalog/provider price change has been performed. |
| Stable zero-cost hosting and DNS | Confirm continuous Monster operation and legitimate Cloudflare/registrar DNS access, or provide an existing suitable free host. Temporary protected HTTPS preview is verified; no stable host or domain cutover is provisioned. |
| Production recovery and release | Verify fresh target compatibility/backup, exact SQL/Auth/runtime configuration, old-deployment/cron quarantine and deployment/rollback sequence under the owner's continuing authorization. Offline success alone does not establish production readiness. |

A fresh Oct20 Quick Tunnel capability check resolves a newly allocated hostname
through system/Cloudflare/Google resolvers and verifies TLS edge routing. Its502
is expected for the deliberately absent origin; no application or data was
exposed. Both probes are closed. This supersedes a general tunnel-DNS blocker;
each actual webhook still needs its own fresh ingress check and stable hosting
remains unprovisioned.

The existing Vercel production and preview settings share the customer Supabase
backend and live Dodo resources; they are unsuitable for isolated testing. The
separate Free Supabase preview uses synthetic actors/private generated PDFs.
Its archived-data recovery checks run in other disposable containers; customer
backup data is never loaded into the journey preview. Paid Vercel upgrades and
real charges/refunds remain excluded; controlled project test messages use
bounded plans under the owner's continuing authorization.

## Deliverables

| Artifact | Purpose |
| --- | --- |
| [Maintenance log](maintenance-log.md) | Findings, changes, checks and next action |
| [Service inventory](service-inventory.md) | Infrastructure, ownership, account access and billing gaps |
| [Prioritized backlog](backlog.md) | Repaired defects, deferred work and release gates |
| [Verification matrix](verification-matrix.md) | Requirement-by-requirement evidence and remaining gaps |
| [Release and rollback](release-checklist.md) | Production review, activation and rollback requirements |
| [Current production checkpoint](production-readiness.md) | Applied Vercel quarantine, actual edge checks, authoritative SQL order and remaining containment/access gates |
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

The owner explicitly approved the pending maintenance actions on Oct20 and asked
us to continue without repeated permission questions. The [root operating contract](../../../AGENTS.md)
records continuing authorization for prepared bounded tests, controlled project
messages and reviewed production recovery/release operations once technical
prerequisites and rollback are ready. Historical approval gates are not new
permission requests. Keep the zero-cost budget, isolated test data/providers,
unrelated Neurofactory services and owner-led credential rotation. Real charges/
refunds and paid plan changes remain outside this maintenance scope.

Completion requires the full audited scope, fixed and verified accessible
critical/high defects, reproducible installation/build/checks, passing relevant
preview journeys and a production review package. Missing integration evidence
and deferred requirements remain explicit; a green build alone does not complete
the goal.
