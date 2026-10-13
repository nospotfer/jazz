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
