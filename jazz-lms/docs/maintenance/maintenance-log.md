# Maintenance log

## 2026-10-13 — Initial evidence and first fixes

- Fetched GitHub: local starting commit matches `origin/main`. Maintenance branch
  created; root `.idea/` remains unrelated user state.
- Public root redirects to `www.culturadeljazz.com`. Homepage and auth return 200;
  anonymous dashboard/admin navigation redirects to auth.
- Public promo endpoint returns signed playback tokens; Mux HLS manifest returns
  200 with video variants. Desktop/mobile browser review confirmed advancing
  video (`readyState=4`). This does not verify all paid lesson assets.
- Local `.env` contains Supabase/PostgreSQL plus obsolete Stripe variables, and
  omits current Dodo/Mux/Resend/Vercel configuration. Read-only database connection
  attempt failed with an unavailable pooler tenant. No migration or data write
  was attempted.
- User supplied the credential CSV. It contains service login information and
  Mux signing/Resend/Google credential material. Values are never emitted. CSV and
  root IDE directory are now excluded from Git.
- Installed lockfile dependencies with lifecycle scripts disabled and regenerated
  Prisma Client 5.17.0 after reviewing helpers. Lint: zero errors, one existing
  course-player image optimization warning.
- Initial npm audit: 36 package findings (3 critical, 20 high, 11 moderate, 2 low).
  Raw dependency evidence is in `/tmp/jazz-maintenance/audit-initial.json` (no
  credentials). Upgrade compatibility is under review.
- Runtime declarations disagree: package requires Node 20 while `.nvmrc` and
  `.node-version` require 24. Local execution initially used Node 22. Node 24
  installation initiated to align supported runtime and checks.
- Working test baseline: 330 passed, 4 failed across 53 files. This ran while
  fixes were being edited, so it is not a pristine pre-change baseline. PDF-count
  tests invoke a request-taking route without a request; a signature test raced
  with the provider-contract fix. Both need final-state revalidation.
- Independent auth/cron regressions demonstrated cookie impersonation and a
  spoofed cron header. Local fixes plus 13 targeted tests now pass; production
  remains unchanged. Pending-registration password replacement was additionally
  reproduced and is being fixed.
- Payment review demonstrated incorrect Standard Webhooks signing-key decoding.
  Local fix and provider-shaped vectors pass targeted tests. Further confirmed
  issues: payment ID normalization, cross-customer reconciliation, refund/dispute
  event classification, and restored access after refunds. Fixes are in progress.
- Browser evidence at desktop 1440x900 and mobile 390x844/320px confirmed header
  overflow, clipped course/contact dialog actions, missing Escape/focus behavior,
  and light-theme password-reset contrast. Accessible layouts/dialogs and
  localization fixes are in progress. Public screenshots and sanitized evidence
  are under `/tmp/jazz-maintenance/`.
- GitHub has administrator access and default CodeQL scanning enabled. There is
  no checked-in CodeQL workflow despite README claims. Branch-protection endpoint
  returns unprotected; ruleset enforcement still needs inspection. Dependabot's
  npm path points at `/` instead of `/jazz-lms`.

Next actions: finish security/payment regressions, align dependencies/runtime and
CI, obtain read-only provider evidence from supplied credentials, repair public
UX, run final checks, and establish an isolated preview for customer journeys.

## 2026-10-13 — Security, provider and persisted-browser checkpoint

- Aligned Node 24 (tested 24.21.0), Next 16.4.0 and updated compatible dependencies.
  Removed unused PDF viewer/worker packages/assets and restored Prisma generation,
  builds and Vitest 5 configuration. Audit dropped from 36 findings to five high
  development lint-chain findings; no critical. Do not force a framework downgrade
  to suppress the remaining braces advisory.
- Added build/lint/type/test CI plus an isolated PostgreSQL service/job for real
  payment/quiz/notes/messaging/database-role tests. Corrected Dependabot npm path.
  Secret reports now redact content, retain failure evidence and scan documentation
  instead of excluding it wholesale. Local hook output no longer echoes matches.
  Native GitHub secret scanning is disabled, rulesets empty, main unprotected;
  repository configuration was not changed. Existing CodeQL OAuth-cookie findings
  concern already-Secure nonsensitive flow hints; regression evidence retained,
  no alerts dismissed. CSP origin sets avoid the earlier URL-substring alert.
- Server identity verifies `getUser`; pending registration cannot replace a
  password/profile before email proof. Cron requires configured bearer secret.
  Quiz membership/verdicts/scoring are server-owned, immutable and serialized;
  no correct answers are disclosed before submission. Notes use existing Prisma
  schema/Boolean fields. Media routes reject missing owner email and unpublished
  hierarchy for ordinary users while preserving legitimate access.
- Standard webhook decoding, actual payment IDs, customer filtering/ownership,
  refund/dispute eligibility and durable reversal barriers are fixed locally.
  Concurrent voucher limits are atomic; provider coupon writes require ownership
  and preserve intended limits/product scope. Detail snapshots now establish
  applied vouchers, including tax-inclusive totals; removed metadata-only coupons
  do not consume uses. Provider outages/invalid lists now fail reconciliation
  instead of being reported as an empty successful payment history.
- Public desktop/mobile dark/light layouts improved: compact visual hierarchy,
  reachable signup/menu, scrollable focus-safe dialogs, clearer full-course/free
  lesson language, corrected PT copy and contrast. Nine initial public browser
  checks passed; final consent/SEO pass is in progress.
- Created dedicated local Supabase Auth/PostgreSQL/private-storage and synthetic
  users/course/15 lessons/60 PDFs/180 quiz questions. Each quiz question needs five
  options; corrected fixture seed and scoped local records to 900 options.
  Application copies exclude production environment files/CSV. Real Dodo/Resend
  calls are disabled; localhost-only synthetic checkout is explicitly separate.
- Actual four-role browser/API matrix verifies free, course buyer, admin and
  historical lesson access; unauthorized paid progress/quizzes/other-user notes
  are denied. Buyer video advances with native Mux; private PDF iframe/download
  return valid matching bytes. Persisted 15×12 graded answers produce 15 platinum
  medals/SUPREME and full recognition. Fixed duplicate zero-based class numbering.
- A legacy single purchased lesson incorrectly qualified for a full-course
  certificate. Recognition now counts every published lesson and requires full
  entitlement/progress/quiz coverage. Local legacy 1/15 is denied; buyer 15/15
  still qualifies. CSS screenshot PDF export failed on Tailwind oklch; direct
  jsPDF export now yields a branded A4 document, proven by actual browser download.
- Slow/no-JavaScript credential forms were confirmed to submit password in GET
  query parameters. Explicit POST fallback now has a passing browser regression.
  Contact input is bounded/typed with linear email checks and HTML-escaped mail.
  Optional replay recorded auth without a choice; opt-in/homepage-only controls,
  private-route exclusion, SDK capture restrictions and SEO are being verified.
- Fresh local Supabase schema exposed all 23 LMS models plus messaging tables to
  browser roles. Scoped owner-checked RLS/revocation SQL now denies direct reads,
  forged purchases/roles/senders and deletes locally, preserves trusted server
  CRUD, and leaves Auth/storage/unrelated tables unchanged. Production state is
  unverified; SQL production application needs schema/role/backup review/approval.
- Authenticated Mux inventory confirms 16 signed ready assets (15 lessons/promo),
  matching CSV signer after trimming a trailing comma, no public copies/static
  MP4s/live streams/webhooks/API tokens. Legacy assignment script is stale and
  duplicates its final slot; no live mapping update/deletion was performed.
  Usage $1.45 is plan credits used, not verified invoice amount due.
- Authenticated Resend inventory confirms sending domain verified; incoming
  receiving/webhook disabled and apex MX absent. No real replies/history to
  validate. Strict provider-computed DKIM/DMARC checks retained; Gmail gray-result
  compatibility needs proof. Activation sequence is documented without writes.
- Public DNS/Verisign registry read confirms expiry 2027-08-14; account renewal
  control remains unverified. Supabase/Vercel management and Dodo credentials are
  still missing/unusable; no live migration, deployment or provider write.
- Latest completed broad baseline before additional changes: typecheck and
  webpack production build passed; normal Vitest 490 passed with 33 opt-in skips;
  explicit PostgreSQL four suites 33/33 passed. Additional contact/CSP 28 cases,
  reconciliation/payment 113 cases and recovery 11 cases pass. These overlap;
  counts are not additive. Final combined checks/clean install/CI still required.

Next: finish native registration/recovery/synthetic checkout and voucher checks,
final analytics/mobile/private browser checks, combine source review and tests,
clean install/build/secret scan, coherent commits/PR, and isolated remote preview.
Keep all provider/production verification gates explicit in the release package.

## 2026-10-13 reviewable source checkpoint (c963cec)

- Completed normal suite: 78 files passed, 5 opt-in files skipped; **775 tests
  passed, 38 skipped**. TypeScript passes; lint has zero errors and 25 existing
  warnings. The five explicitly guarded PostgreSQL suites pass 37 cases, with
  one Supabase-only REST case skipped; dedicated local REST/role suite passed 5.
- Fresh Git-visible source installation with Node 24.21.0 succeeds. Clean webpack
  and Turbopack production builds pass; final webpack build includes the newest
  isolation/mobile changes. No local credentials/env/provider state were copied.
- Final public browser checks pass 15/15. Native OTP → login → emailed recovery
  → replacement-password login → synthetic checkout passes. The new isolated
  request guard initially rejected Next's localhost/127 host normalization; it
  now accepts only same-port/protocol loopback aliases, retaining production,
  remote URL, overridden DB and external-origin denial regressions.
- Real voucher UI passes with a new synthetic account/code, invalid/retry
  negatives, one purchase/redemption/use and verified scoped cleanup. A cold
  development rerun timed out during dashboard navigation; the bounded warmed
  rerun passed in 6.5s and no application redirect defect was reproduced.
- Private mobile quiz passes four cases at 320/390 in both themes with 640px
  height: normal scrolling reaches submit/close/result. Fixed overlapping launch
  responses resetting an answer, bounded content and result scroll reset. Header
  controls/popovers pass four actual cases, all controls visible, no overflow.
- Branch comparison found an unmerged June protected-PDF CSP fix. Earlier byte
  checks did not prove rendering. Ported attachment-only frame-ancestors self;
  every normal page remains frame-ancestors none. Native Chrome PDF renderer
  succeeds with visible fixture text at desktop/mobile; two durable cases pass.
  Mobile lesson title now clears its 44px menu by 10px.
- Full/partial recognition browser cases pass 2/2 with real A4 download/denial.
  Certificate accents and long-name wrapping improved. Actual large branding PNG
  decoding exceeded the 5s test deadline under concurrent build/worker load; that
  case now has a bounded 15s timeout, retaining file/A4/text assertions.
- Removed inactive individual-lesson checkout component and unsupported admin
  course links/inert delete control; valid course preview remains. Authoring is
  not implemented and is explicitly deferred.
- Admin/dev test-reset endpoints were production-callable and broadly destructive.
  They now require separate explicit opt-in, nonproduction loopback requests,
  exact disposable DB and explicit targets, default to dry runs, and remain
  disabled in production even with spoofed headers/flags. Synthetic checkout
  shares the isolation checks. No actual reset/revert was executed.
- Git-visible and history Gitleaks scans report zero findings with redacted
  reports. Known historical test-account passwords remain despite removal from
  current tracking; this result does not revoke them. Owner deferred rotation.
- npm production-only audit reports zero; complete audit retains five high
  development lint-chain findings for braces <=3.0.3 with no upstream patch.
  Exact advisory, reachability limits and monitoring are in security guidance.
- Public frontend embeds feavujcllgbzlvdvkkxx.supabase.co; old local .env uses
  wmujuzheurvrfyebobcj.supabase.co. Both return independent NXDOMAIN. No project
  deletion/pause/data-loss conclusion is justified. Preserve/locate customer data
  before preparing any replacement or production environment change.
- Three newer June preview deployments redirect to Vercel SSO; protection was
  respected. No additional provider configuration could be inspected. Recorded
  latest GitHub production deployment/commit and concrete config/schema/rollback
  package; actual Vercel target and restoration remain unverified.

Next: publish maintenance commits/draft PR and inspect actual Quality/CodeQL/
secret-scan results. Finish a verified isolated remote preview when project access
is available. Keep the goal active and preserve the production/account/backup/
Dodo/OAuth/mail gates; no production release or provider mutation has occurred.

## Published review and parser/operations follow-up — 2026-10-13

- Opened draft [PR #46](https://github.com/nospotfer/jazz/pull/46), with eight
  focused maintenance commits. On 8e67b0d, actual GitHub Quality and Secret Scan
  checks passed, including 775 normal and 37 persisted tests. Vercel built
  deployment 7027429907 successfully; the exact preview redirects to SSO and
  has not been verified as isolated or exercised for customer journeys.
- CodeQL's aggregate check failed on two new high regex-conversion findings
  (14/15). Replaced that converter with bounded parser-based plain text in
  0619b69, retaining actual React encoding/text-only notification sinks. Added
  malformed/nested/entity/resource-limit and actual inbox regressions. Remote
  rescan remains pending; no exploit or closure is inferred from mocks.
- Commit 37df1a0 quarantines all 15 legacy mutators to dedicated disposable
  loopback targets with a separate default-off flag; production is always
  blocked. Voucher CLI reset defaults to a scoped plan and writes only with
  --apply. Provider selection is captured before ambient Prisma env loading.
  Legacy local-only defaults/mappings/pagination and production recovery remain
  documented limits. No actual mutator was run.
- Deployment wrappers validate explicit project/team/exact clean commit,
  including untracked source and changes during preflights. Removed stale
  branch/alias guessing and automatic provider probes. Token stays in the
  environment; production scope validation is not owner approval. Nineteen
  temporary-repository/mock-executable cases pass; no deployment was invoked.
- Fresh source-only npm ci, lint/types/webpack and Turbopack builds pass. Normal suite now
  **925 passed, 38 skipped**, 82 passed/5 skipped files. Guarded PostgreSQL
  rerun: **37 passed, one REST skip**. Production audit and redacted source
  scanner report zero; five documented development lint-chain highs remain.
  Empty-environment metrics imports/build collection require a synthetic
  DATABASE_URL; the corrected explicit reproduction is documented.

Next: publish the follow-up, inspect its exact remote CI/CodeQL/preview and
preserve essential provider-access gates. Detailed immutable checkpoint links
are in [review-status.md](review-status.md). Goal remains active.

## Follow-up remote checks complete — 2026-10-13

On c6a0556264f803aceb99311d8efc588f52ff2208, both push/PR Quality and
Secret Scan passed. The downloaded PR Quality log confirms 925 normal tests,
38 intentional skips, 37 actual PostgreSQL tests/one REST skip, lint 0 errors/
25 warnings, TypeScript and webpack build. CodeQL analysis and aggregate check
passed; PR-scoped alerts 14/15 are fixed and no open PR alerts remain.
Local redacted history scan covered 285 commits with zero findings, preserving
the explicitly deferred historical-password rotation caveat.

Vercel Preview deployment 7027902333 succeeded on this exact source. Its
immutable URL redirects all three tested HEAD paths to Vercel SSO; no protection
bypass or remote customer flow was attempted. Provider/data isolation and
management settings remain unknown. See [review-status.md](review-status.md)
for the exact preview and immutable check links.

No independent source-critical/high issue remains actionable without current
provider/account/data evidence. Next: obtain current Supabase inventory/customer
database, scoped Vercel access with an isolated preview and Dodo test access;
then finish production metadata/backup/OAuth and approved-mail verification.
The goal is not complete and production remains unchanged.

## Authenticated Vercel and recovered live Dodo — 2026-10-13

- Owner completed native Vercel CLI login on monster. Read-only team/project/
  domain/alias/env/deployment inspection identifies actual live jazz-lms under
  Neurofactory, deployment dpl_6Xo6rUDVdh9jTWg4KoH1ok6iyU3D, June 11 redeploy,
  reported source 50c2f87f, Node 20 and no Git link. Both custom-domain pointers
  and homepage/auth script-path fingerprints agree. The May GitHub Production
  record is historical rather than the current live target. Separate Gabriel
  GitHub preview configuration remains unreconciled.
- Documented environment GETs recovered readable integration configuration,
  respecting sensitive values not returned as plaintext. All three targets use
  the same feav Supabase project; EU/US historical pooler strings differ. Cron
  remains enabled at 03:15 UTC with CRON_SECRET absent from project and live
  deployment env names. No live sweep invoked. Replay enablement true in all
  targets; consent/private-route repairs remain undeployed.
- Neurofactory account metadata confirms one owner and active Hobby plan. The
  course site's commercial use conflicts with current Hobby policy; recorded
  an owner plan/hosting decision without upgrade, transfer or billing writes.
- Recovered Dodo live credentials support eight documented GETs. Product and
  business match configuration, €29.90 EUR base excluding tax; active webhook
  targets current handler and its signing secret exactly matches configuration.
  No customer/payment/payout rows, charges/refunds, coupons, keys or webhook
  writes. License-key entitlement and absent support contact need business review.
- Production and preview share live Dodo resources; development selects test
  mode with the live-only key and test GETs return 401. Existing preview is not
  isolated. Dashboard owner/MFA/KYC/payout/Adaptive Currency and actual signed
  test delivery/checkout/reversal remain unverified.
- One native Supabase manager session check is unauthenticated. Supabase login
  on monster is pending; CAPTCHA-bound headless password login did not establish
  a session. No pause/deletion/restore conclusion or production DB write.
- Added authoritative Vercel/Dodo audits and reconciled inventory, backlog,
  verification, README and release baseline/gates. Earlier checkpoint statements
  about missing credentials/target reflect the evidence available at that time.

Next: finish native Supabase manager login, locate/preserve customer project and
inspect metadata/recovery/backups. Prepare separate preview dependencies and
test credentials, then repeat relevant remote customer journeys. Production is
unchanged; completion and production approval remain pending.

## Supabase manager access and bounded recovery review — 2026-10-13

- Native CLI login now works. Exactly one accessible project: deployed feav
  Jazz-LMS-Project, INACTIVE, eu-west-1/PG17, created February 17. Legacy wmuj
  absent from this account; no deletion/other-account ownership inference.
  Neurofactory Org is Free with one Owner; profile confirms caller is that
  Owner, member MFA false. Recovery/ownership hygiene remains an owner decision.
- Documented project/restore-version/backup/org/member/entitlement GETs confirm
  matching PG17 restore version, empty managed backup list/physical timestamps,
  WAL-G true/PITR false and zero managed backup retention entitlement. Empty
  results do not prove a missing pause snapshot or customer-data loss. No SQL,
  customer rows or project mutation requested.
- Current official pausing docs specify a one-year in-place restore window,
  superseding historical 90-day guidance. Prepared exact existing-project
  POST /restore proposal with preflight, private DB/separate Storage export,
  isolated recovery verification and explicitly bounded re-pause rollback.
  It would reconnect the live site's existing backend and may apply a minor
  platform update. Explicit production approval requested and still pending.
- Five Auth/storage/network/SSL/PostgREST GETs: Google and Resend SMTP stored
  configured, confirmation/rotation/reauth on. Production reset callback missing
  for current PKCE source; global *.vercel.app allowances need release review.
  Stored network rules allow all IPs. PostgREST404/SSL500 remain inspection limits;
  no service protection/health inferred. No email or OAuth test performed.
- Standalone synthetic preview is the intended separate Supabase option. Free
  quota is two active projects across Owner/Admin organizations; reserve customer
  resume capacity and verify all affected quotas before creation. Billing is
  organization-wide; no paid branch, clone, upgrade or new project was created.
- Actual ad61d7c remote Quality/Secret Scan/CodeQL/Vercel pass. Exact new protected
  preview recorded in review-status; HEAD homepage/auth/robots still SSO302.

Next: await the required resume decision while finishing independent source/UX
work. Resume/preservation, actual schema/storage/RLS/backups and isolated remote
test-provider/OAuth/mail journeys remain essential. The goal is incomplete.

## Voucher and sidebar localization — source 47c383d

- Both voucher entry points now map stable error/reason contracts into selected
  ES/EN/FR/PT, including language changes after feedback. Unknown API/provider
  prose stays out of customer feedback; localized free/price/success text retained.
- Atomic redeem failures add a reason while retaining status/error/message and
  purchase/discount/voucher accounting. Nineteen actual component/route cases
  pass; 201 focused payment cases overlap the final normal suite, not extra totals.
- Sidebar menu/unread accessibility labels use dashboard translations. Existing
  Spanish PDF/browser selector updated to assert the correct accessible label.
- Final normal suite: 944 passed/38 intentional skips, 84 passed/5 skipped files.
  TypeScript/webpack build pass; lint zero errors/25 existing warnings. A browser
  launch first used an absent system Chromium path; bounded rerun with installed
  full Chromium and no fallback app server passes native PDF desktop/mobile and
  actual new local voucher redemption with scoped cleanup, 3/3. Private recordings
  disabled; production env not copied. Only affected source was synced for these
  targeted browser checks; this is not a remote/exact-whole-preview claim.

Next: publish source plus manager/recovery evidence, inspect exact remote checks,
and execute only the owner-approved recovery operation when approval arrives.

## Separate cloud preview and bounded PDF audit — 2026-10-13

- Complete Free-capacity preflight observed one related organization/Owner,
  one inactive customer project and no next inventory page. Created only the
  independent eu-west-1 Free preview tvmhuacxctdgmejziaxg; healthy, one active
  preview and one customer-resume slot reserved. No paid branch/add-on/upgrade.
  Production feav remains inactive and untouched; its resume question remains
  unanswered. Initial one-project inventory is historical, not the new total.
- Verified the new public schema empty, then applied the current datamodel,
  explicit messaging definitions and scoped RLS/grants in a guarded transaction.
  All 25 table owners postgres, RLS enabled/no FORCE, no browser/PUBLIC effective
  grants, trusted CRUD retained. Actual Prisma CRUD/messaging probes roll back
  with no remaining rows. Anonymous REST HTTP 401 and authenticated REST HTTP 403 / SQL 42501
  denials verified. No legacy migration replay or customer clone.
- Added four confirmed synthetic Auth/app accounts with fixed avatars, a
  15-lesson course, 60 generated private PDFs, 180 questions/900 options and
  bounded buyer/historical entitlements. Payment ledger empty. Signup, Google,
  custom SMTP and messaging/payment keys disabled; only exact loopback 3012
  callback/reset paths allowed. No invites/OTP/recovery emails requested.
- Separate Git-visible app copy at `835d22c` runs on 127.0.0.1:3012 using only the new
  backend; analytics/replay/Resend/Dodo/synthetic checkout disabled. No existing
  local guard was bypassed. Strict database certificate verification is now
  explicit, with Supabase's published CA; actual pooler CA/hostname verification returns code 0.
  Preview SSL-enforcement metadata reports `database: false`; no config change.
  Browser journey verification is being completed separately from HTTPS Vercel.
- Compared maintained source with reported live June commits; restored only
  the June PDF cache default and optional `.docx.pdf` normalization in `835d22c`.
  Scoped lint and 83 relevant tests pass. The historical ambient all-PDF checker
  was not ported because its scope/budgets/raw diagnostics were unsafe.
- New source `3dc76f3` adds a private-config, exact-project/course, read-only PDF
  auditor. Foreign URLs/buckets/traversal rejected, streaming byte/time/file/
  concurrency caps enforced, statuses controlled and no names/URLs/provider
  prose/content printed. 45 targeted regressions pass, including FIFO rejection.
  Strict CA-bound actual cloud audit covers all 60 synthetic PDFs/200,304 accepted
  checked bytes/60 hashes; IDs match the independent 15 × 4 fixture manifest.
  Headers/full streams/hashes do not prove full parsing or semantic mapping.
- Pinned the already-used tsx 4.23.15 runner; removed the stale global esbuild 0.25
  override so its supported locked 0.28.2 dependency is used. Fresh Node 24/npm 11
  source-only npm ci, 989 normal tests/38 skips, TypeScript, webpack build and
  lint 0 errors/25 existing warnings pass. Real CLI with the installed runner repeats
  the complete synthetic audit. Production npm audit reports zero vulnerabilities; full audit retains the
  same five high development lint-chain findings. No additional persisted payment
  tests were invented or counted twice.
- Confirmed Prisma may auto-read local `.env`, but this tool's explicit datasource/
  private credentials override ambient values. A bounded actual synthetic
  constructor/disconnect with DEBUG=prisma:* produced debug output but no
  synthetic password/URL leak; no query or remote request was attempted. No
  broader logging guarantee or invented defect was inferred.
- Actual d02b1b1 remote Quality/Secret Scan/CodeQL/Vercel pass at 944 normal/37 PostgreSQL tests.
  New source follow-up publication/checks pending. Vercel usage read failed to
  yield a parseable report; no zero-cost inference. Dodo test key still absent;
  current docs confirm CLI uses a key and test mode can send real email, while
  business/bank/verification settings are shared. No sandbox messages or shared
  business changes were made.
- One authorized production pooler-metadata GET returned HTTP 200/empty. This is an
  inspection limit while inactive, not data-loss proof. Prepared preservation
  must use a verified session/direct connection after approved resume, not the
  recovered transaction-mode port-6543 URL. No production TLS/DB probe or customer rows.

Final cloud-backend browser run passes 29/29, with no uncaught client errors or
app 5xx. Actual native sessions for all four roles, access negatives, Mux decoder/
time advancement, native same-origin PDF/four language files, administrator API
and 320/390 navigation/profile controls pass under independently checked strict
CA runtime. Five auto-reconciliation POSTs were blocked before the app server;
this is an explicit Dodo exclusion, not a provider success. Initial harness
timing/hydration/CDN/frame mistakes were corrected privately before the final
run. No screenshots/traces/videos/saved sessions or provider writes.

Next: publish the checkpoint and inspect
actual remote checks. Production resume/preservation approval, Dodo test key,
HTTPS preview/account/commercial-hosting decision, OAuth/mail and actual customer
schema/storage/backup recovery remain essential. The goal is incomplete; the
controller still reports its previous `blocked` status until user/system resume.

## Approved recovery, archived-data verification and source repairs — 2026-10-13

- The owner explicitly approved existing production resume, immediate private
  DB/Storage preservation and bounded same-project unsafe-state re-pause rollback.
  A single restore POST 200 reached ACTIVE_HEALTHY. The separately reviewed
  session-pooler port 5432 connection authenticated with published-CA/hostname verification;
  the original transaction port 6543 packet remained unchanged. No blind mutation retry.
- Full DB archive/password-free roles/schema/TOC and 68 private Storage objects
  (6,423,774 bytes) exported with matching inventories/hashes. An initial auxiliary
  schema extraction failed because pg_restore needed an explicit output target;
  the corrected fresh export completed and the incomplete run is retained.
- Actual read-only inspection confirms browser grants on 26 public tables,
  RLS disabled on PaymentWebhookEvent/message/messagethread and authenticated
  self-role updates. Anonymous zero-row ledger HEAD 200 verifies exposure without
  reading rows or attempting an exploit. One approved re-pausePOST 200 returned
  the project to INACTIVE. No production SQL/config/code repair performed.
- Network-disabled, unpublished, resource-bounded offline recovery verifies all
  65 archive COPY tables/2,239 records, both sequences, role/table metadata and
  public/LMS ACLs, six LMS user-reference aggregates, quiz best-attempt ownership
  and all 68 Storage IDs/hashes. ExistingNOT VALID realtimeCHECK remains unvalidated;
  exact extension ACL creator/initial-privilege equivalence differs for49 function /
  two view revocation clauses. No full platform/atomic snapshot/historic-completeness
  claim. All five verifier containers removed; journey fixtures untouched.
- 79 export artifacts are hash-copied into a private local backup outside /tmp,
  excluding API-key responses/credential packets. Five offline verification
  reports plus their manifest were preserved there too. This is not encrypted
  off-site retention. Private directories700/files600; no customer archive in Git.
- Supplied Dodo TEST key now returns200 and matches existing business/brand;
  exactly one EUR29.90 tax-exclusive, no-license test product created. TEST
  webhook inventory200/zero. Native CLIv3.6.2 privately checksum-verified, version
  only. Workflow/preflight/listener template prepared with execution/mail flags
  false; four wrong-target negatives deny before key/provider access. Customer
  controlled address selected privately; merchant/webhook-alert recipients still
  need review. No transaction/customer/coupon/refund/webhook/listener/mail yet.
- Actual cloud learning continuation26/26 yields15 completed lessons,16 attempts/
  192 answers and15 PLATINUM summaries, SUPREME and actual A4 vector certificate.
  A second class2 attempt scores11/12→92GOLD while retaining bestPLATINUM. Pending
  resume/answer409/final replay pass. Initial realP2028 diagnostic is preserved.
- Native account switch reproduced another student's cached note and normal
  autosave re-authoring. Source 8716dd3 uses owned atomic drafts, initial-session
  gating, expected identity409 beforeDB, stale request/timer cancellation and
  dirty-draft/manual recovery. Server notes remain intact. Actual pointer testing
  found the full-course overlay incorrectly blocked permitted free/historical
  notes; exact protected-route exemption retains server access enforcement.
- Final actual pointer/privacy/recovery19/19 passes: free/historical click/focus,
  paid403/lockedredirect, stale409/crossstudent403, explicitly intercepted500→
  dirty draft over older realGET/nohydrationPUT→ordinarymanualPUT200→cache-cleared
  serverreload. Earlier11 logic checks remain incomplete and are not added to
  totals. Original29/20 reports unchanged; no extra logout or reset. Independent
  final snapshot confirms buyer2/free1/legacy1/admin0 notes, unchanged learning/
  purchases and zero business activity. Nine automatic reconciliationPOSTs blocked.
- Source 85f4e12 adds10-second transaction acquisition waits retaining5-second
  execution bounds. Two real single-connection3-second blocking regressions
  prove launch/answer persistence; no new cloud quiz mutations after patch.
  Clean Node24 source:1,039normal/40skips, types, webpack build, lint0/25warnings;
  five persisted suites39/oneRESTskip. An extraneous preserved private.cjs helper
  first broke clean-copy ESLint plugin matching; moving it outside source restored
  the unchanged lint configuration. Actual GitHub Quality/Secret Scan/CodeQL pass,
  downloaded logs independently confirm counts. [Immutable source checks](review-status.md#approved-preservation-and-source-follow-up).
- Owner rejected paid hosting: zero-cost budget, no Pro upgrade. Official
  Cloudflare Quick Tunnels can provide temporary HTTPS without account/domain;
  a protected separate production-built source-exact preview is being prepared,
  not yet launched. Existing Hobby commercial-use mismatch and stable production
  hosting/rollback remain documented; no policy exception or domain change assumed.

Next: validate the exact private production hardening package offline, complete
free HTTPS preview/cookie/journey proof, and review bounded test notification/
signature/transaction scope. Production stays paused; no SQL/config/deploy or
another resume is authorized by the executed preservation approval. OAuth,
SMTP/receiving, account recovery/off-site retention and release gates remain open.
The controller's old blocked state needs the user's /goal resume for unattended
continuation; independent work is actively progressing.

## Offline hardening and zero-cost HTTPS preparation follow-up

- Exact private production hardening revision2 passes 25/25 offline checks,
  including target attestations before locks, default-off/manual inverse gates,
  422 actual zero-row operations and effective denials on 26 tables / 225 columns /
  three definer RPCs. Trusted CRUD retained; all 65 archived table content hashes/
  2,239 records and two sequences unchanged. Auth/app 14↔14 with no missing/email/
  confirmation/duplicate mismatches. Verifier containers removed; tested package
  hash-copied into durable private backup. No production approval or connection.
- Archive-only in-memory Course parsing finds one stored price 29.99 / no NULL;
  under the app's EUR interpretation this differs from live Dodo 29.90 by 0.09.
  No actual tax/FX/settlement or price correction claim.
- Existing synthetic Course.price 80 remains unchanged. A single price-only
  TEST product PATCH 200 plus exact GET 200 aligns only the dedicated product to EUR 8000,
  preserving all nonprice fields/app rows and the original 2990 creation receipt.
  Current source helper actually creates/retrieves two TEST coupons (10% and EUR 5),
  seven requests with scoped collision checks/product/metadata/limit/expiry/shape
  assertions. No local voucher/customer/checkout/payment/refund/webhook/mail.
- Latest publisher-verified cloudflared 2026.10.0 and private external Basic gate
  have 59 local checks (47 gate / 7 env / 5 browser credential cases), not app/provider proof.
  Root starts closed gate 3015 and bounded free Quick Tunnel, learns random HTTPS origin,
  rebuilds exact source 85f4e12 with that compiled public origin/modern synthetic
  keys and strict CA, then starts production frontend 3014. Actual env/source/build/
  loopback and all private credential-byte exclusions from clientstatic pass
  before opening Basic access. Current 3012 remains untouched; no DNS/account/paid
  hosting change. Webhook exception remains disabled. Actual HTTPS browser proof
  is being recorded separately from immutable29/20/26/19 loopback reports.
- Native HTTPS media revealed one legitimate sibling Mux chunk CDN not in initial
  narrow allowlist. Root approved that exact observed host only; no wildcard or
  source change. Preserve the initial allowlist diagnostic and unproved playback
  separately from the completed browser verdict. No forced successful result.

## Completed free HTTPS preview checkpoint

- Production-built source `85f4e12` passes **44/44 distinct HTTPS checks** through
  the protected free Quick Tunnel, using only the separate synthetic backend.
  Native sessions/access restrictions for all four actors, actual signed Mux
  decoding/time advancement, native PDFs at 320/390, completed profile and an
  ordinary vector-certificate download pass. All 255 application/schema/config
  source hashes and final runtime isolation guards match.
- Preserve attempt accounting: initial 39/41, continuation 14/14 with nine
  overlaps, hence 55 attempts / 53 passed attempts / two retained harness
  diagnostics. The corrected exact Mux host and native certificate click resolved
  the media allowlist and React-internal probe diagnostics. They are not erased,
  added to unique counts or claimed as application fixes.
- All browsers closed before the independent strict-CA read-only snapshot at
  16:27 UTC. Notes remain buyer/free/historical/admin 2/1/1/0; buyer learning
  remains 15 completed lessons, 16 attempts, 192 answers and 15 PLATINUM summaries.
  Full timeline, exact purchases/historical ownership and zero business records
  match the previous final baseline; synthetic price remains 80. No learning
  writes occurred. Five normal native session synchronizations were permitted;
  17 automatic payment reconciliations were intercepted before the backend.
- No client errors or actual app 5xx; browser Basic credentials were restricted
  to the exact preview origin. Source/payment/mail/provider configuration and
  production were unchanged by this browser run. Earlier 29/20/26/19 evidence
  remains immutable. The free preview deadline is 2026-10-13 17:59:42 UTC;
  access details are private, and this is temporary testing infrastructure.

Next: finish the sustainable free hosting/quarantine review, compare archived
media/PDF mappings against preserved provider inventories, and prepare signed
Dodo delivery while merchant/webhook-alert recipients are clarified. Actual
checkout/refund, Google/SMTP, stable production hosting and approved code/config/
hardening/reopening remain outstanding. No paid upgrade or new resume occurred.

## Archived mapping, native TLS and stable free hosting follow-up

- Offline production mapping comparison finds 15 distinct lesson playback IDs,
  all matching one cached ready signed Mux asset and intended class labels 1–15;
  promo is separate. All 68 attachments map uniquely to exported objects with
  matching SHA-256/size and valid PDF structure, totaling 6,423,774 bytes. All
  60 class PDFs cover 15 lessons × four matching filename language/number labels.
  Six auxiliary filenames are unclear; local text review of their 15 pages
  confirms declared EN2/FR2/PT2 content languages. No translation/video semantic
  claim or mutation; original files/input hashes remain unchanged.
- Actual Prisma 5.17 native engine passes nine isolated TLS checks in a new
  PostgreSQL 17.11 loopback fixture. Real TLSv1.3 positives and unrelated CA,
  trusted-chain/wrong-hostname, missing CA and non-TLS-server negatives pass,
  with positives repeated between groups. Its owned container is removed;
  zero cloud/provider/production connections. Initial command-line SSL override
  preparation ran zero engine checks and is preserved as a harness diagnostic.
  Production artifact/durable CA/runtime portability is still a release gate.
- [Stable free hosting proposal](hosting.md) conditionally prefers native Node
  on Monster plus a named Cloudflare Tunnel, retaining managed integrations.
  Account/DNS control and continuous operational availability are not verified.
  Full zone preservation/delegation, trusted-header normalization, durable TLS,
  exact callbacks, isolated services/timer and rollback are prepared, unexecuted.
  Netlify Free is a candidate fallback with adapter/native-engine/quota gates.
- Root's current primary-policy review corrected the private quarantine proposal:
  All Deployments Vercel Authentication is available on all plans without a paid
  add-on. Revised plan combines it with explicit cron disable and paused active
  production, requiring actual coverage/bypass/historical-scope proof. Original
  proposal/hashes remain preserved. No provider quarantine, DNS, service/account
  setup, paid upgrade or another production resume occurred.

## Diagnostic privacy repair and final free HTTPS checkpoint

- Closed mocks reproduced raw error/provider response/email/voucher details in
  failure logs and metadata. Source `27d7b4c` replaces these with finite safe
  categories, allowlisted database codes and validated HTTP statuses, preserving
  retry/discount/limit and localized customer-response behavior. No historic
  data scrub or production change. The 38 new regressions are included in the
  clean suite's 1,077 passes/40 skips; separate guarded PostgreSQL39/1, types,
  webpack and lint0/25 pass. Actual GitHub checks and downloaded logs agree.
- Exact full523-file committed source27 was production-built at the private
  HTTPS origin; core256 hashes, modern keys, strict CA, loopback bindings and
  client-secret checks pass. An initial incomplete copy omitted support scripts,
  failed typecheck and was retained as a preparation diagnostic; the corrected
  full archive builds. Earlier source85 app/build/evidence remains immutable.
- Separate browser run passes45/45 distinct checks with four native role
  sessions and actual secure-cookie/access/video/native-PDF/mobile/profile/vector
  certificate proof. Four normal session syncs only;14 automatic payment
  reconciles intercepted. Final independent strict-CA read-only snapshot at
  17:36 UTC matches both earlier baselines for learning timeline, notes, exact
  purchases and zero payment/voucher/discount/messaging records.
- A separate synthetic PDF diagnostic visually confirms actual page/text at
  1440/320/390. Enforced policy events identify Spotify frames and optional Mux
  Google Cast in course HTML, not PDF violations. Initial substring labels had
  matched allowed blob/inline policy text; records remain preserved. One extra
  normal buyer session sync and one intercepted reconciliation, no learning/
  financial/mail/config writes or CSP changes; all88 prior artifacts unchanged.
- Prepared direct raw-signed Dodo exception remains disabled. Frozen templates
  pass110 in-process checks against the native verifier; no endpoint, signer,
  customer, checkout, transaction, refund or mail activation. Merchant/team/
  webhook-alert recipient scope remains unanswered.
- Closed only owned app/gate/tunnel groups and loopback3014/3015/3016 at17:50 UTC,
  before expiry. Existing3010/3012 and fixture data preserved. The first cleanup
  inventory stopped before any signal on an inaccessible unrelated `/proc` cwd;
  corrected group-scoped inspection verified ownership before termination.

Next: record the host-availability/account/DNS selection and Dodo notification
scope when supplied, then activate only the reviewed isolated workflow within
those bounds. Stable-host compatibility/quarantine, Google/SMTP, actual Dodo
transactions and a concrete production code/config/hardening/reopening review
remain open. No paid plan or production deployment is authorized. The goal
controller still reports blocked; the owner must use `/goal resume` to enable
overnight continuation. This checkpoint does not complete the maintenance goal.

## Resumed ownership review and application diagnostics follow-up

- The owner reactivated the goal. Earlier checkpoint work was progress: source
  repairs, tested preview, published runbooks/PR and durable private evidence.
  Production remains paused; the zero-new-paid-services constraint continues.
- Read-only account follow-up found no authenticated Dodo dashboard session or
  explicit Dodo login entry. Its login offers email OTP/Google; inspection stopped
  before delivery or submission. Merchant/team/refund/webhook-alert recipient
  scope is still unverified; the existing controlled customer address is retained.
- Existing native Google sessions require reauthentication (`invalid_grant` /
  `invalid_rapt`). Ordinary owned Chrome was rejected before password submission.
  No project/customer API request, new scopes, account policy or mail action.
  GA4 property/stream/service-account mapping remains absent from the inspected
  configuration; OpenReplay account credentials/settings remain inaccessible.
- Fresh npm/primary advisory evidence confirms zero production findings and the
  same five development lint-chain findings; braces3.0.3 remains the latest and
  has no published patch. No forced downgrade or dependency suppression.
  [Current advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
- Further source inspection reproduced raw exception/provider-prose disclosure
  beyond the earlier payment repair. The existing finite diagnostic contract is
  now used across application-owned Auth/voucher/media/messaging/dashboard/admin
  logs and browser error boundaries. Provider error text no longer enters
  registration/resend responses; auth/video failures use customer-facing copy
  instead of server environment/key instructions. Successful identity/payment/
  access behavior and existing failure statuses/rate-limit handling are preserved.
- All53 new isolated regressions fail for private-data disclosure on the baseline
  and pass after repair. Initial fixture diagnostics (React cache, short Mux ID,
  omitted PDF bucket) are retained and corrected before the meaningful53-case
  baseline. Clean verification passes1,130 normal/40 skips,91 files with passes/
  five all-skipped, types, webpack and lint. A first typecheck caught the new
  test's unnecessary GET argument; corrected signature and focused53 cases pass.
  No private env copied, external fetch permitted, provider mutation or data scrub.
- Native-host compatibility inspection also reproduced expired limiter retention
  and a spoofable forwarding-header assumption. A client timeout cannot bound
  the current payment sweep inside `next start`; server deadline/non-overlap and
  ingress verification remain concrete work. No service/DNS/timer setup occurred.

Next: finish exact-project analytics selection and native-process limiter/sweep
repairs, then verify the updated source and prepare the smallest free-host
package. Dodo recipients, account reauthentication and continuous host/domain
access remain specific external inputs; continue independent work meanwhile.

## Exact-project analytics repair

- Source-only closed fetch reproduced the OpenReplay client choosing another
  application in the same organization when the configured project was missing.
  This is not evidence of live/cross-tenant access; account keys remain unreadable.
- The client now accepts only positive safe decimal project IDs, requires an
  exact inventory match and nonempty key, and URL-encodes that key as one path
  segment. No fallback user search occurs on missing/malformed configuration or
  inventory. Main/daily query failures report unavailable data rather than a
  healthy zero. Authorized healthy metrics and genuine zero days are preserved.
-45 new closed-fetch regressions pass. The clean combined source passes1,175
  normal tests/40 intentional skips (92 files with passes/five all-skipped),
  lint, types and webpack build. No provider/customer query, secret/config change
  or account mutation. Previous source491a02c's1,130-case report stays distinct.
- First source491a02c pre-push stopped on a missing synthetic DATABASE_URL in
  the test environment, before upload. Retrying with the documented explicit
  loopback placeholder passes the required integration gate; no cloud URL/env
  file was loaded. Source491a02c is pushed; its remote Quality runs are being
  verified separately from the newest local analytics repair.

Source `530e9bb` is now pushed; Quality/Secret Scan/CodeQL and the existing protected
build pass. Downloaded Quality logs confirm1,175/40 normal and 39/1 actual
PostgreSQL tests, types/build/lint 0 errors/25 warnings. The Gitleaks source export
covers531 committed files with zero findings. Existing protected Vercel scope
remains unreconciled, and no current-head browser/production proof is inferred.

Additional native helper mocks show abort signals ignored, body-read aborts
collapsed to missing data, and full ten-page lists silently truncated. The
prepared continuation design must propagate cancellation, retain single-flight
until in-flight operations settle, report incomplete pagination, and advance
a stable user cursor with bounded retry cutoffs and overlapping pass windows.
No financial ledger marker/migration, provider call or running process was used
in these five helper observations. Fourteen proposed cases remain preparation;
they are not added to passing test totals. Goal remains active and incomplete.

## Bounded counters and interrupted payment sweeps

- Commit `822e6cd` bounds the three known limiter buckets to 4,096 hashed identifiers
  each, lazily prunes expiry and retains live counters on capacity denial. Denied
  counters saturate. All 26 regression cases pass; an isolated previous-source VM
  reproduced unbounded/raw-key retention and growing denied counts.
- Source `98db3b1` composes caller cancellation with Dodo's 12-second read timeout,
  rethrows body-read aborts and rejects full final tenth pages as incomplete.
  The 30 read regressions pass; previous source passes 5/fails 25 in the same suite.
  Provider HTTP/ownership/filter/dedupe behavior and ordinary callers remain.
- The sweep holds process single-flight through awaited work, checks a 50-second
  cooperative deadline and reports partial/aborted/busy work distinctly. Stable
  user/payment rotation, frozen/overlapping pass windows and earliest retry
  cutoffs prevent slow prefixes and rolling windows from losing the tail. Fresh
  detail/owner/course/reversal/applied-discount gates remain in place.
- Independent review found a capacity deadlock in the first draft. A bounded
  pending-only recovery cursor now frees slots without moving the ordinary tail.
  Twenty final sweep cases pass; separate closed mocks verify 500 terminal retries
  free capacity and the next normal call reaches that tail. Unavailable/deleted
  saturated queues still require explicit manual recovery; no windows are evicted.
- One clean 535-file copy passes 1,251 normal tests/40 skips (95 passed/five skipped
  files), lint 0 errors/25 warnings, types and webpack. All tested file hashes match
  root source; no private env/provider/DB/financial work was used. The 76 new cases
  are included, not added again. Source/fixture reports remain private.

Next: preserve the review checkpoint, then prepare the
smallest native ingress/cache/configuration/disabled-runner package and transport
proof. Current-head HTTPS/browser evidence is still outstanding; source27's 45
checks stay historical. No timer/service/DNS/account/production activation.

Source `98db3b1` is pushed. Quality/Secret Scan/CodeQL pass; downloaded Quality
logs verify 1,251/40 normal and 39/1 real PostgreSQL, types/build and lint 0/25.
The initial count parser missed ANSI formatting; the corrected report is
verified and the initial diagnostic retained. Committed-source Gitleaks covers
534 files with zero findings. Protected Vercel scope remains unreconciled.

## Native ingress and release producer

- Source `5aafd14` adds explicit native deployment indexing, bounded HTTP ingress,
  provider-routing/credential-kind validation and a complete release inspector.
  Header spoofing/ambiguous paths/public cron are denied; raw webhook bodies and
  streamed private responses are preserved. Twenty real loopback cases pass.
- Independent local review reproduced cache-symlink escapes through actual Next
  image-cache read/write, identical-byte npm-link retargeting with changed module
  behavior, and ambient npm configuration loading. Recursive cache validation,
  exact link-target receipts and empty explicit npm user/global config fix them.
- The producer exports exact clean Git source and uses a fresh locked install and
  configured webpack build with only public values and a closed loopback DB.
  Source additions/removals/edits and source symlink/hardlink replacement are
  rejected after both phases. No server credentials reach the builder.
- The first actual package built but could not seal esbuild's legitimate linked
  executables. Source `ab14628` materializes generated hardlinks without modifying
  outside files; original source is validated before any link is split.
  Seven real filesystem regressions cover that repair and traversal order.
- Clean verification now passes 1,763 normal tests/40 skips, 101 files with passes
  and five all-skipped, types and lint 0 errors/25 existing warnings. The 512 new
  safeguard cases are included. Initial type/scan and intermittent quiz-fixture
  diagnostics are retained; awaited enabled-button interaction preserves the
  quiz's exact server-answer/grading assertions without an application change.
- Actual `ab14628` package: 541 archived Git files match committed blobs, fresh
  npm ci/configured webpack pass, 45,759 sealed files verify, one esbuild link is
  materialized, and 157 client files omit supplied server secrets while matching
  public key/origin. Reinspection passes. The origin is synthetic/unrouted and
  nothing was started. This is not current HTTPS/provider/production proof.
- The first push was stopped by the existing plain-text scanner's benign malformed
  PEM fixture marker. Fixture-only `3cbb17c` constructs the identical value without
  contiguous marker text; 189 focused cases and both scanners pass, with no
  suppression. Required pre-push checks pass on the retry; source is published.

Next: private launcher/runtime umask/cache/cold restart, disabled bounded daily
runner and refreshed exact-source protected HTTPS/customer journeys. Existing
account/recipient/DNS/continuous-host and production-review gates remain. No paid
upgrade, service/DNS/production activation, transaction or mail occurred.

## Protected native preview, bounded runner and contrast

- Application source 0dfa999 adds the Node24/Linux private preview launcher and
  release-local Next worker; source 2058ad1 adds the leased/authenticated Quick
  Worker exception and preparation-only reconciliation runner. General ingress
  still denies Worker browsing. Fixed leases, Unix600/private700 paths, finite
  diagnostics and owned-resource/process cleanup have 152 new regressions total.
- The actual Cloudflare CLI --url unix form failed with 502; explicit YAML Unix
  ingress supplies the origin, while a closed-loopback URL only selects Quick
  mode. Actual cf-worker metadata needed the explicit private-preview exception.
  Managed robots rewriting and consumed Cloudflare cache header remain explicit
  provider behavior. Initial transport diagnostics are retained.
- Exact application source e32a370 changes three UI lines: light-surface gold text
  #8a5b0a and bright-gold overrides in always-dark professor/footer containers.
  Twelve public layouts and48 computed contrast checks pass; light hero5.33:1
  and header hover5.85:1. Dark gold and CTA color remain unchanged.
- Clean source checks and downloaded exact-source CI verify 1,915 normal passes/
  40 skips,39 actual PostgreSQL passes/one skip, types/build and lint0/25.
  Required push hooks were not bypassed. Exact553-file committed scan has 0
  findings. Fresh locked build separately matches548 application Git blobs,
  verifies 45,766 sealed files and157 client files without supplied server secrets.
- Actual e32 Unix runtime 19 and HTTPS transport 11 pass; no compiled files were
  unlocked. Exact-source restart/home200, forced owned-worker exit, separate
  UID65534 EACCES and final complete reinspection pass. Main app/tunnel closed
  cleanly23:35UTC before expiry; later private lifecycle probes closed cleanly.
- Browser reports remain primary 96/98, guest 2/2, completion 7/7, full-frame visual
  7/7. Four native roles, Mux decoding, PDFs/profile/certificate pass. Fresh
  320/390 mobile-before-navigation captures visibly show synthetic PDF text in
  both themes. Initial selector/incomplete-response observations remain; earlier
  sad-document captures and two unclassified source 2058 buyer errors are retained.
  Zero current page errors does not establish their earlier cause.
- Exactly11 native password/session syncs overall, six at e32/five at 2058.
  Reconciliation was intercepted and all other mutations blocked. Strict-CA
  read-only final comparison23:29:43UTC preserves scoped learning fingerprints,
  entitlements, price 80 and zero business records. All browsers closed and
  purpose-created credential state was deleted. No payment/refund/mail/provider
  configuration or production mutation occurred.

Next: preserve this checkpoint and complete independent provider/release work
within the zero-cost budget. Dodo recipient/signed-transaction and Google/SMTP
access, continuous-host/account/DNS control, durable configuration, old Vercel
quarantine and production SQL/config/deploy/resume review remain open. The
runner stays disabled and no timer/service is installed. Goal remains active
and incomplete. [Exact evidence](review-status.md#protected-native-preview-and-contrast).


## Native login, saved notes, mobile drawer and payment history

- Sourcece5577f keeps password navigation behind cookie/profile setup. Frozen14
  behavioral cases reproduce10 failures/four controls; repair passes14/14. An
  independent review identifies two late-event gaps, reproduced on9bd; e342a89
  guards the whole password attempt and all16 pass. Native9bd deliberately holds
  its normal own-avatar update: session200, stable auth/loading, profile200 then
  dashboard/editor navigation. Later sources retain distinct proof.
- Source9bd09a6 links the notes drawer to its account-saved editor with44px target,
  focus and ES/EN/FR/PT draft/sync guidance.49 existing privacy/access tests pass.
  Cadeac7 aligns completion accessible names with visible localized action labels;
  seven existing locale/state cases are strengthened and pass.
- One fresh synthetic USER/fixture grant in Free tvm starts with zero learning
  rows. Actual9bd UI writes two notes, normally watches two52-second clips, explicitly
  completes lessons and answers24 quiz questions. Independent strict-CA read-only
  proof confirms2notes/2completedprogress/2attempts/24answered/2summaries,100PLATINUM/
  92GOLD, one attempt per lesson, no other scope, no SUPREME/course certificate.
  Original-four User/learning/entitlement hashes and zero business rows preserved.
- Initial CDP response-body lookup, null-field guard, numeric fetch.status misuse,
  missing progress-field and ambiguous score selectors remain separate diagnostics.
  Core final continuation9/9 does not rewrite interrupted reports. No actual old-
  source live race reproduction is claimed; behavioral baseline provides that proof.
- Latestcade readonly preparation incorrectly assumed random avatar avoidedPUT.
  Profile intentionally changes it on each login. Two intents were intercepted;
  one subsequent nominal avatar200 is strictly scoped. Latestwindow3password/3sync;
  correction uses retained purpose600 state and zero further auth/mutations.
- Actual nominal mobile320/390 diagnosis proves class picker0px/scroll956, class
  hit blocked by textarea and44px editor link clipped behind footer.57f5de1 makes
  panel flex/scroll, reserves96px picker and prevents footer/title shrinking.
  Actual corrected picker96/editor225×44 hit/keyboard/route entry passes both
  widths. Raw12/9/3 retains two premature generic-textarea assertions and locale
  selector timeout; scoped hydrated-editor text/four-language controls stay pending.
- c64c0fa stops deriving missing historical amounts from current course price;
  API null and localized unavailable UI preserve real0/positive amounts. Same
  frozen tests reproduce3fail/1control then33pass. InitialCI1934pass/1 outdated
  numeric-only contract failure retained; f5fc45e explicitly tests nullable contract.
  No schema, history, price, provider currency or financial-journal inference.
- Final57 exact CI1935/40 normal (107 passed files/five skipped),39/1 actualPG,
  types/webpack/lint0/25; Quality/Secret/CodeQL/protected Vercel build allgreen.
  Exact555-file secret scan0. Required push checks not bypassed; initial missing
  synthetic DATABASE_URL diagnostic retained and retry explicitly supplies fixture.
- Fresh57 locked/configured native550app/45,769sealed/158client matches Git and
  public inputs without supplied server secrets; Unix19/HTTPS11/full reinspect pass.
  Earliercade45,768 separately reinspects. CA and private preview inputs have
  verified owner-only local copies outside/tmp; production configuration remains
  separate, and local backup is neither encrypted nor off-site.
- All-five12-model strict-CA read-only AFTER01:41:29 matches full row hashes/global
  counts/price80/zero business rows. Apps closed by leases01:29/01:37 and tunnel
  01:38(exit0); all browsers closed, Chromium0 and purpose state deleted safely.
  Root actor preparation and source artifacts remain separate from customer archive.

Next: finish scoped editor/actual locale checks with reviewed selectors; preserve
and publish this exact-source checkpoint. Dodo recipient/signed transactions,
OAuth/SMTP, continuous-host/account/DNS, old deployment quarantine and production
SQL/config/resume/deploy review remain open. No new spend, upgrade, service/timer,
transaction/refund/mail or production activation. Goal active and incomplete.
[Exact revisions and report scopes](review-status.md#mobile-drawer-recovery-and-recorded-payment-amounts).


## 2026-10-14 — scoped editor, real language controls and nullable provider amounts

- FB scoped hydrated editors show the saved note hashes/styles at320/390. The
  locale failure is now reproduced: four44px controls clipped into a2px wrapper.
  bc17899 adds only shared selector `shrink-0`; separate fresh550/45,769/158-file
  build passes Unix19/HTTPS11, then35/35 actual browser checks, including12 real
  ES/EN/FR/PT clicks at1440/320/390 and matching reachable completion labels.
  FB10/9/1 and a no-traffic purpose preflight1/0/1 remain immutable.
- One native login/session sync/scoped own-avatar update belongs to that window;
  corrected state reuse adds none. No learning/payment/mail writes or playback.
  Strict-CA AFTER02:42:36 preserves all12 model hashes/five-actor global counts,
  price80 and zero business rows. Both apps/tunnel/browsers close cleanly, state
  is safely deleted and both complete seals pass.26 selected evidence files are
  privately preserved locally;1,508 scanner matches are verified manifest hashes,
  with0other findings/0suppressions. No encryption/off-site claim.
- 133716b fixes missing/invalid/negative provider money becoming zero/phantom
  discount. Canonical total has presence-aware precedence; real0 stays0. Partial
  retries retain known facts only for the same payment; late coupons update only
  existing voucher links; replacement references clear stale money rows. Unknown
  voucher amounts are not classified asfree. No entitlement/reversal/coupon policy,
  schema/backfill/currency/tax/journal or actual provider incident claim.
- Separate failing freezes precede260 final targeted passes,including18 actual
  PostgreSQL cases/seven new persisted regressions. Independent review passes;
  existing caller fixtures remain valid. Root full normal1,973/47 and persisted
  46/1,types/lint0/25,clean locked build and556-file source scan0 pass. Exact remote
  Quality/Secret/CodeQL/protected build and downloaded Quality logs confirm them;
  required push hooks pass without bypass. Earlier browser/runtime sources remain
  distinct from this latest financial source.

Next: preserve the exact-source CI/frozen failures and publish the updated draft
review package. Essential Dodo recipient/signed-transaction, Google/SMTP, stable
host/account/DNS, old Vercel quarantine and production review gates remain open.
Zero new spend; no production mutation, transaction/refund/mail or service/timer.
The maintenance goal remains active and incomplete.
[Source checkpoint](review-status.md#provider-amount-availability).

## 2026-10-14 — Recoverable payment history and account privacy

- Confirmed failed history GET falsely rendered empty, malformed200 was
  unhandled, and mounted account changes retained/accepted previous-owner rows.
  Sourcea207 adds localized error/44px Retry/status, response validation, owner
  epochs and synchronous clearing/abort. Server GET expectedUserId mismatch
  returns409 before DB access; verified cookie identity remains authority.
- Frozen page baselines7FAIL/3controls and15FAIL/4controls; final19/19PASS.
  API baseline3FAIL/33controls retained. Next required-Request type diagnostic
  retained; existing direct fixtures now pass Request without expected-behavior
  change. Independent review passes. Normal1,995/47,types/lint0/25; actual exact
  CI PostgreSQL46/1,Quality/Secret Scan/CodeQL/protected build all pass.
- Clean556-file committed export scan0; fresh locked configured Node24 artifact
  matches551 application Git blobs/45,770 sealed files/158 client files. Actual
  Unix19/HTTPS11 and complete final seal inspection pass.
- Bounded native window reuses the fifth synthetic USER/grant. Root changes only
  final/discount amounts toNULL/NULL,0/80,then exactly restores80/0 and updatedAt.
  Browser successful phases10+7+7+7=31/31 show80/unavailable/0/restored80 in
  ES320/EN390/FR1440/PT320; controlled500/real44px Retry and actual409 pass.
  Initial3/2/1 early assertion and1/0/1 zero-traffic CLI diagnostics stay frozen.
  No actual browser switch/empty-account or provider transaction claim.
- Entire budget1password/1session/1owned-avatar;19 reconciliation intents
  intercepted. Root strict-CA03:38:15/03:55:44 all-five12-model/global comparison
  passes after exact restoration. Explicit restore guard fallback unused.
  Session deleted, all Chromium/app/tunnel processes close and sealed artifact
  reinspection passes. Existing services preserved; zero spend/production change.
- Earlier learning/editor/language/media sources remain distinct. Actual Dodo
  recipients/transactions,Google/mail,continuous host/account/DNS,old Vercel
  quarantine and concrete production review remain open. Goal active/incomplete.
- Initial48 selected evidence files are copied outside/tmp with matching hashes
  and owner-only permissions. All753 scan matches are exact sealed-manifest
  path/hash records; zero other findings. Quality ZIP26 expanded text entries
  separately scan0. Credentials/config/env/actor/session inputs excluded; local
  retention is neither encrypted nor off-site.

[Exact source checks and retained limits](review-status.md#payment-history-recovery-and-account-isolation).

## 2026-10-14 — Credential file boundaries and concrete fallback

- Actual metadata finds ignored CSV/private app.env0664; exact owned regular
  single-link files now0600, contents unchanged. Existing durable private preview
  configuration holds the same six provider values as the a207 window; its old
  source/origin still needs a new build/gate before any reuse.
- Supplied Dodo TEST key existed only under/tmp. Identical bytes now live in
  ~/.config/culturadeljazz-maintenance/dodo-test-api-key, directory0700/file0600,
  excluded from review evidence. One bounded test GET matches the previously
  created product/business/8000EUR price. No rotation, activation, transaction,
  refund, mail or webhook; both copies documented for the owner's later rotation.
- Source9cb3d3f adds the missing concrete rollback asset: standalone original-
  logo/jazz-gold maintenance HTML, ES/EN/FR/PT44px controls, JS-disabled Spanish,
  strict hashedCSP and exact503/header review contract. Manual recheck is a fresh
  rootGET dropping query/hash/userinfo, without priorPOST retry or background work.
- Initial real109/110 browser run found320px 200%CSS-zoom overflow; original
  source/report/screenshots kept. Wrapping repair then138/138 actual loopback
  HTTP/browser checks and separate4/4 file checks pass. Minimum textcontrast5.72,
  both preferences/three widths/24 real language switches, keyboard/recheck/noJS,
  HEAD/body0 and unavailable API/mutating paths verified.14 expected503 console
  messages distinguished; client/CSP/external/storage/cookie activity0.
- Root verifies exact original logo/style/script hashes and contract; independent
  review passes. All browsers/owned loopback server close. No shared service,
  production/domain/account change or spend. The fallback requires actual host/
  quarantine/activation review; it does not replace the native/provider scope.

[Exact operational evidence and limits](review-status.md#local-credential-boundaries-and-static-rollback-fallback).

## 2026-10-14 — Published fallback evidence and account-switch repair

- Exact `8e68f68` Quality/Secret Scan/CodeQL and existing Vercel build status pass.
  Downloaded Quality logs confirm 1,995 normal passes / 47 skips and 46 actual
  PostgreSQL passes / one REST skip, build, types and lint 0 errors / 25 warnings.
  Both 559-file committed exports and expanded CI logs scan clean. Intermediate
  `9cb3d3f` has no separate CI run; only nine documents differ at the final HEAD.
- Retain 48 selected fallback/publication and secret-free local-security receipts
  outside `/tmp`, with matching byte hashes and files 0600/directories 0700.
  All 34 scanner matches are exact committed-manifest path/hash records; zero
  other findings or new suppressions. No credential/config/actor/session inputs
  are copied. Retention remains local, unencrypted and not off-site.
- New closed component/actual-parent proof freezes 12 failures / five controls
  for previous-account dashboard identity, private SSR children, avatars and
  counters. The course-player consumer also needs retirement. Existing notes
  guards are preserved; no notes leak or backend privilege bypass is inferred.
- Separate exact-HEAD route proof freezes 24 failures / 18 controls: stale owner
  hints still read/update the verified cookie account, including progress. Repair
  both private-view lifetime and server consistency; preserve server role/access
  authority. Fresh-source cross-tab and empty-account browser checks are pending.
- The draft PR accurately records this work as incomplete. No production operation,
  new spend, payment transaction or mail is performed; the goal remains active.

[Current follow-up](review-status.md#fallback-publication-and-private-view-owner-follow-up).

## 2026-10-14 — Registered account access

- Confirm the purchase overlay blocks a free user's own profile, preferences and
  payment history. Freeze a separate exact `8e68f68` component baseline with six
  failures and nine passing controls, before changing the route policy.
- Exempt only the three exact profile/payment/settings routes (plus trailing
  slash). Server authentication, private-view ownership and course/lesson/medal/
  message access remain intact; no price, entitlement or API change.
- The unchanged 15 new cases and seven existing notes/paywall controls pass.
  Replace the former locked-profile control with the paid videos route, retaining
  free restrictions and paid access checks. No network/provider/database calls.
- Fresh-source browser verification will exercise genuine empty free-account
  history and unobstructed profile/settings. Earlier protected-view scopes and
  immutable reports remain separate; nothing is released to production.

[Account access evidence](review-status.md#account-pages-without-a-course-purchase).

## 2026-10-14 — Private-view source verification and native account evidence

- Publish source4f395e0 after required hooks: whole private-frame owner retirement,
  synchronous late-work generations, bounded refresh/recovery and seven verified
  server expected-user contracts. Independent18-file review matches committed
  blobs. Distinct frozen dashboard/admin/checkout/route failures are preserved;
  final111 client cases,49 route regressions and22 account/paywall cases pass.
- Fresh clean-source root QA and downloaded exact remote Quality logs agree:
  2,130 normal/47 skips,46 actual PostgreSQL/one REST skip, types/build/lint0/23.
  Exact570-file source and26 expanded CI text entries scan0. Quality/Secret Scan/
  CodeQL and actual Vercel completed status pass; provider isolation remains open.
- Fresh sealed native artifacts verify565 Git application blobs/45,785 immutable
  files/158 client files, Unix19 and HTTPS11. Preserve original8/9 detector and
  two5/6 menu diagnostics without overwriting or relabeling them as passes.
- Normal-network native19/20 verifies real two-tab A sign-out/B sign-in,
  refreshed own incomplete lesson, B's empty receipts/zero paid counts/current
  identity, unobstructed readonly profile/settings, paid-course restriction and
  actual stale A hint409. The final B menu click times out; physical actionability/
  trusted dispatch remains unobserved, rather than assuming an application defect.
- All browsers/owned app/tunnels close; strict-CA before/after all-five/12-model
  hashes, global counts, learning and entitlements remain unchanged; sealed
  reinspection passes. Six password/session requests across closed windows are
  retained explicitly. Native artificial late-response privacy is unproved;
  source regressions and actual normal-network observations have separate scope.
- Prepare one fresh bounded foreground-tab/actionability observation. Zero
  production change, new spend, provider transaction, mail or learning mutation.
  Goal remains active; provider/production/hosting gates still require review.

[Exact current evidence](review-status.md#private-view-ownership-and-account-access-source-verification).

## 2026-10-14 — Confirmed paywall obstruction and complete account check

- A fresh foreground4f19/20 observation resolves the narrower menu failure:
  B's visible/focused/font-ready logout center hits an outside DIV; ordinary
  trial click reports pointer interception, without unstable/detached/navigation
  evidence. The later paywallz30 escapes its content and covers headerz30's menu.
- Contain only content/paywall stacking. Independent source review finds inline
  modalz90 would also be trapped, so final414 keeps the unchanged dialog as a
  sibling. Only one application file changes; all18 original ownership-review
  hashes remain unchanged, and supplemental source review/existing22 cases pass.
- Required hooks pass on explicit synthetic DATABASE_URL/Node24; initial missing-
  URL rejection stays retained. Exact414 remote Quality/Secret Scan/CodeQL/
  Vercel status pass; downloaded logs2,130/47 normal,46/1 PostgreSQL, build/types/
  lint0/23 agree. Exact570-file source and26 expanded CI entries scan0.
- Fresh sealed configured414 build565/45,785/158, Unix19 and HTTPS11 pass.
  Native24/24 verifies both real trusted logout clicks, SDK cross-tab retirement,
  refreshed own B course/history/profile/settings/counters, actual409, paid gate,
  physical paywall CTA and full-viewport header/sidebar modal coverage/cancel.
  No checkout continue, voucher interaction, provider amount/payment/mail proof.
- Strict-CA13:07:24→13:10:59 all-five/12-model/global/business/learning/entitlement
  preservation passes; all browsers/owned app/tunnel close and sealed inspection
  passes. Ten total password/session requests across all owner-test windows are
  explicit, with bounded own-avatar/logout lifecycle actions outside model hashes.
  Initial diagnostics are not relabeled. Zero new spend or production change;
  broader provider/hosting/production gates remain, and the goal stays active.

[Final source and native scope](review-status.md#contained-paywall-and-complete-native-account-verification).


## 2026-10-14 — Catalog availability and course-intent repair

- Freeze distinct actual source regressions for hardcoded/missing/zero catalog
  quotes, late voucher callbacks, malformed free grants, duplicate identifiers
  and the React layout/passive-cleanup window. Preserve initial harness errors
  separately.61 new cases are included in the whole suite.
- Commit22 coherent source/test files as44ec58b. Two authors independently
  review the other scope;12 earlier owner-source files remain unchanged and six
  changed owner files have a fresh explicit review. No production/provider edit.
- Fresh private clean clone:2,191/47 normal,46/1 actual local PostgreSQL, types/
  lint0/23 pass. Required hooks are not bypassed. Exact remote checks pass and
  downloaded Quality logs agree;577 committed files/26 log entries scan0.
- Fresh configured locked build572/45,792/158, Unix19/HTTPS11 pass. Correct a
  launch timestamp formatting rejection before startup without extending expiry.
  Preserve raw21/22 dynamic-control and20/21 immediate-redirect helper diagnostics,
  with no established app defect and no relabeled pass. B-only addon32/32 verifies
  24 catalog/dialog cases in four languages at1440/390, actual class2 denial/
  details80 and trusted normal B sign-out. Its launched a12b helper is distinct
  from the later unused preparation revision. Source/expiry are unchanged.
- Strict-CA14:37:48→14:51:12 all-five/12-model/global/business/learning/entitlement
  fingerprints match; browsers/owned app/tunnel close cleanly and final seal passes.
  Three password/session pairs in this preview and15 across owner/catalog windows
  are explicit. Earlier41424/24 stays separate. No checkout continuation, voucher
  validation, provider payment/mail or learning write; player modal remains
  unreachable natively under the preserved access policy.
- Positive backend29.99 metadata/provider catalog parity remains unresolved;
  source availability/quote fixes do not authorize billing policy, SQL/provider
  changes or production release. Zero new spend; the goal remains active.

[Current evidence](review-status.md#catalog-prices-and-course-action-lifetime).


## 2026-10-14 — Published-course checkout and captured-account intent

- Confirm four draft checkout paths and missing client/server account consistency
  on frozen44 source. Preserve9 publication,8 server,28 client baselines and four
  actual local PostgreSQL cases; the latter really persist draft/wrong-cookie
  grants before and reject both after, preserving valid0/unauth controls.
- Publish3ce58a8 pluscd20569a old lifecycle-URL assertion correction. Thirty new
  normal and four opt-in persisted cases; mandatory hooks and independent15-file
  hash review pass. Retain initial client selector/whole-QA fixture diagnostics.
- Final private2,221/51 normal,50/1 actual PostgreSQL, types/lint0/23 pass; exact
  source CI and downloaded Quality logs agree.581 Git files/26 logs scan0.
  Fresh locked576/45,796/158 configured artifact, Unix19/HTTPS11 pass.
- First native preflight stops on a helper's
  JSON assumption for an existing purchases409 plaintext response, with no checkout
  or relay traffic. Browsers close, two password/session pairs remain consumed,
  and the exact failed report/helper are immutable. Distinct correction uses the
  same source/artifact/origin/gate and unchanged expiry, with cumulative17 before
  its separate bounded two-sign-in window. No response shape is fabricated.
- Native12 actual-response checkout cases pass at390 across three screens/four
  locales, with unchanged B intent, actual A-cookie409 and unchanged relay; no
  original B POST is continued. Page errors/forbidden mutations0. The whole run
  stops on immediate unawaited logout count, without established app defect or
  whole-run success. Both browser groups close; cumulative19 sign-in/session pairs
  remain explicit. A separate sign-out-only browser passes actual global204 for
  both accounts, trusted ordinary click events and signed-out private boundaries.
  Two more pairs bring this preview to6/cumulative21; no matrix repeat. Three
  optional own-avatar intents blocked,0 metadata writes. Strict-CA15:54:34→16:24:08
  all-five/12-model/global/business/learning/entitlement hashes match; all browsers/
  owned app/tunnel close, sockets retire and sealed inspection passes.
- Prepare a private93-index definition comparator and18 meaningful closed checks;
  root verifies frozen files/protected hashes. Same-name uniqueness drift is an
  actual counterexample to the prepared name-only guard, not observed production
  drift. SQL/inverse unchanged; locked integration and column/extension gaps remain.
- Zero new spend, production change, provider transaction/refund, third-party mail
  or learning write. Goal remains active/incomplete; broader gates retained.

[Current evidence](review-status.md#checkout-publication-and-account-intent).


## 2026-10-14 — Voucher availability, account intent and financial permissions

- Publish four coherent source commits througha16c1abc. Preserve actual before
  failures for published/known-price voucher grants, active redemption owner/
  page retirement and recorded admin amounts. Catch an intermediate staff
  financial disclosure in independent review; gate query/display withanalytics.read.
- Fresh private2,311/57 normal,56/1 actual local PostgreSQL, types/build/lint0/22
  and exact remote checks pass. Downloaded CI agrees;587 source/26 log scans0.
- Two fresh582/45,802/158 artifacts pass Unix19/HTTPS11. First native attempt
  correctly rejects a proof mode0664 before traffic; preserve original report,
  correct writer/private-input verification and close that expiry window.
- Corrected native window passes12 real four-language503/409 cases, then confirms
  admin horizontal overflow at390. Whole run remains PARTIAL12/13; no natural
  cookie-lag or provider transaction claim. Four acknowledged NULL/80 pairs
  restore all course fields/timestamps. Three logins/session syncs bring cumulative
  count24; normal logouts were not reached. Optional avatar intent blocked1/write0.
- Browser contexts close; app/tunnel expiry closure and seal inspection pass.
  Strict-CA22:45:26 all-five/12-model/global/business/learning/entitlement/raw-course
  comparison is unchanged. Prepare separate read-only admin before/after proof.
- Source quote/payment provenance and concurrent course edit guards remain
  independent work; actual provider/OAuth/mail/hosting/production gates remain.
  No new spend, provider charge/refund, third-party mail or production change.

[Source and retained partials](review-status.md#voucher-availability-and-redemption-intent).


## 2026-10-15 — Payment facts, transactional course intent and mobile admin

- Commitb91/e8/bd/c1 fixes mobile shell, course grant lock/revalidation, quote
  provenance and broken course shortcut. Preserve pricing26 baseline21fail/
  5controls and ordering3 intermediate1fail/2controls; author222/independent13-file
  checks pass. No merchant quote becomes a guessed payment base/discount.
- Real PG interleavings preserve five direct and four checkout before failures;
  after all stale writes0, exact0/full-voucher controls survive and250ms admin
  lock waits through grant then proceeds. Use FOR NO KEY UPDATE for FK compatibility;
  no early voucher row lock or paid-fulfillment policy change. Term-edit race kept.
- Whole-QA2351/4/68 exposes three remaining fixture files. Preserve that report,
  exact before bodies/names/counts; fixture-onlya631 final2355/0/68,67/1 actual PG
  across eight suites, types/lint0/22 and mandatory source push pass.
- Separate actuala16 admin baseline390/683 (sidebar288/content102),1440 fits;
  freshc1a after320/390/768/1024/1440 eight geometry/three keyboard menu observations
  and6permitted44px links per width pass in light theme. Actual logout204 in each
  window, cumulative pairs26; no price/learning/public-table writes. Original
  voucher12/13 not relabeled. Before/after strict-CA five/12-model/raw-course
  timestamps match; browsers/app/tunnel/sockets close and complete seal passes.
- Independent primary-contract review discovers PAY-22: /100 and2dp misread
  explicit JPY/KWD. Record High source work with precision/persistence/display
  regressions next; EUR provenance tests do not close it. Remote exact-source
  Quality/downloaded logs/docs CI and durable selected evidence are finalizing.
  No new spend, provider charge/refund, third-party mail or production mutation.
- Retain the existing five synthetic login credentials separately from review
  evidence under the durable private preview configuration directory,0700/0600.
  No password rotation/provider call/session persistence or role assignment.
  Existing provider input/CA remain separately private; local unencrypted retention
  does not prove off-site recovery.

[Current scope](review-status.md#quote-provenance-and-transactional-course-intent).

- Exacta631 Quality PR/push, Secret Scan, CodeQL aggregate/analyses and classic
  Vercel status pass; branch open CodeQL alerts0. Downloaded26-file Quality ZIP
  agrees2355/68,67/1,eight persisted suites,types/build/lint0/22.591 source/26 log
  scans0; remote provider isolation still unverified. Retain102 selected files
  plus manifest/receipt under durable private review-checkpoint-quote-admin-a631e166,
  copied hashes/modes verified and nonempty candidate scan0. Credentials/raw course
  rows/sessions/screenshots excluded; local unencrypted/non-off-site limits kept.


## 2026-10-15 — Exact currency facts and readable payment records

- PAY-22 source now stores a nullable canonical currency/minor-unit snapshot,
  uses explicit SIX exponents, carries both fields through all paid ingestion
  paths, preserves legacy facts separately on retries and clears unrelated facts
  on replacement/free grants. No catalog/product/cart or hosting plan changed.
- History no longer assumes EUR or two decimals. Admin sums/averages/series are
  per currency, unknown records are excluded explicitly, exact large totals
  remain displayable and unsafe chart/comparison projections are unavailable.
- Frozen exactd05 regressions preserve backend52 (48fail/four controls), admin13
  (11fail/two controls), student23 (18fail/five controls), DTO17
  (14fail/three controls); each passes after correction. Existing financial,
  ownership, permission and reversal controls remain. Independent review caught
  a separate intermediate nested/outer snapshot binding and an unsafe comparison
  incorrectly labeled Nuevo; both receive targeted fixes and retained evidence.
- Disposable local PostgreSQL received two nullable TEXT columns with no
  defaults/backfill. An existing scoped row, raw timestamps and table metadata
  remained unchanged; schema6 includes five actual representation checks.
  Production and the isolated cloud preview have not received this migration.
- Offline browser measurement confirmed light amount contrast3.057student and
  2.103admin. Both now use the existing darker title-accent token, preserving
  branding; offline candidate ratios exceed5.5light/7.3dark. Native contrast and
  rendering are separate pending evidence.
- New [currency migration/rollback runbook](payment-currency.md) requires columns
  before new generated clients; rollback retains additive columns/exact facts.
  No production migration/deployment, real payment/refund, email, paid upgrade,
  provider setting change or whole-goal completion is claimed. Clean exact-source
  full QA/remote CI and a fresh migrated preview are the next verification steps.


## 2026-10-15 — Currency preview verified and financial views completed

- Commitf0aa6de implements exact nullable payment facts. Three obsolete fixtures
  are corrected in862c614;188f7b8 serializes shared PostgreSQL files after an
  actual40P01 deadlock. Normal2491/80, persisted80/1 and build pass;79 persisted
  cases are actual SQL and one is client metadata. Initial reports are retained.
- Fresh sealed188 artifact602/45,822/158 passes Unix19/HTTPS11. The isolated Free
  preview receives only two nullable TEXT columns/no backfill. Migration and
  final independent read-only comparisons preserve18 protected/12 model hashes,
  five roles, raw course/purchase fields/timestamps, policy and indexes.
- Native58 passes currencies EUR/JPY/KWD/IQD/MGA, zero/unknown/restored history
  and overview. Statistics cover KWD7d/restored30d only;36 representative amount
  geometry/contrast observations pass320/390/1440 light/dark. Both actual global
  logouts return204; seven variants/one restore are acknowledged by18-entry
  verified journal. Both pairsNULL again; all browsers/app/tunnel close, owned
  processes/sockets absent, final seal passes. Cumulative tracked pairs28.
- f5cc174 removes assumed EUR in voucher redemptions and preserves legacy
  precision.97e5e06 aligns unknown-currency raw0 with student/metric behavior;
  unknown positive units never acquire a scale. Frozen voucher18, precision16
  and zero8 preserve meaningful failures/controls and now pass; combined55.
  Initial NBSP control fixture diagnostic remains separate. Final97 whole2533/80,
  types/build/lint0/22 pass. These later UI changes are not rebound to188 native.
- No paid upgrade, production change, real Dodo payment/refund or mail. Release
  still needs actual provider/Google/mail/host and reviewed production authority.
  Owner asked about UI progress: landing mobile actions/dialogs/readability and
  student/admin usability are repaired; broader landing visual polish is next.

- Exact97 GitHub Quality PR/push, Secret Scan and CodeQL checks pass; downloaded26
  logs agree2533/80 and80/1, pattern scan0. Exact head-ref alert query finds three
  medium OAuth-hint cookie records despite Secure in actual source/tests; direct
  literal clarification/static rescan is prepared separately, no dismissal.
- Retain214 selected files plus manifest/receipt privately outside/tmp. Nonempty
  pattern gate first stops on a generated synthetic webhook-vector test label;
  four derived JSON reports redact only title/fullName, preserving statuses and
  recording original/retained hashes. Actual private-input scan0; raw rows,
  credentials/sessions/screenshots excluded. Local unencrypted/non-off-site.
