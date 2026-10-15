# Production review and rollback checklist

Updated 2026-10-15. Preparation only: **no production release is authorized**.
Source repairs have not been released. The owner separately approved one
production Supabase resume, private preservation and unsafe-state re-pause;
those operations completed. Production is INACTIVE again. No production
SQL/configuration repair or another resume is authorized by that approval.

## Recorded production baseline

- Authenticated Vercel alias/domain APIs identify Neurofactory's **jazz-lms**,
  project **prj_lEwrHldvtbnCByMPA9gvGzqVqpts**, team
  **team_u4fDHjN9J7mqJuDlulZmzrPc**, exact live deployment
  **dpl_6Xo6rUDVdh9jTWg4KoH1ok6iyU3D**.
- Deployment: https://jazz-4k7e4unoj-neurofactorys-orgs-projects.vercel.app,
  created **2026-06-11 05:21:22 UTC**, READY **05:23:39 UTC**, Node **20.x**,
  source **redeploy**; reported source **50c2f87fa0b4d458b90f88943720817bc690db58**.
- Both custom domains point to that deployment; apex redirects to www. Public
  homepage/auth script-path fingerprints match its direct URL. No Git project
  link/gitSource exists, so the source SHA is metadata rather than clean-checkout proof.
- GitHub Production record **4786399978** for **c897f36** on May 22 belongs to
  the earlier Gabriel deployment history; it is not the current live alias.
- Exact live target is verified; prior deployment compatibility and rollback
  usability remain untested. Supabase public DNS is unavailable; code rollback
  cannot repair that. [Vercel audit](vercel.md).

## Review gates

- [x] Close newly confirmed dashboard/course account-switch privacy and stale
  progress-intent verification: source4f395e0 repairs pass111 client cases/49
  route regressions, exact CI2,130/47 and actual native cross-tab/empty-account/
  account-UX/stale-hint409 checks. Separate4f pointer baseline confirms paywall
  interference; final414 source/CI and native24/24 verify both logout clicks,
  private retirement, reachable paywall CTA and full-viewport modal open/cancel.
  Actual artificial delayed replies/provider payments remain separate gaps.
  [Current follow-up](review-status.md#contained-paywall-and-complete-native-account-verification).
- [x] Document and repair substantial auth/payment/media/quiz/notes/privacy/UX defects.
- [x] Node 24, clean lockfile installation and Prisma generation succeed.
- [x] Local webpack production build and clean Turbopack build succeed.
- [x] Actual isolated OTP/recovery, free/buyer/legacy media, notes, quiz/medals,
  certificate and voucher journeys have evidence.
- [x] Public responsive/privacy/SEO browser checks and real guarded PostgreSQL
  accounting/security checks pass.
- [x] Finish private mobile quiz/header review and prove native PDF rendering; final source review complete.
- [x] Reviewed source checkpoint d46b214 passes actual GitHub Quality, CodeQL,
  secret scan and Vercel build. Job logs confirm 990 normal tests and separate
  37 persisted PostgreSQL checks, types/build/lint; intentional skips remain.
  [Immutable checks](review-status.md#published-pdf-audit-source-verification).
- [x] Diagnostics repair checkpoint `27d7b4c` passes actual remote Quality,
  Secret Scan, CodeQL and protected Vercel build. Downloaded logs confirm 1,077
  normal tests/40 skips and 39 real PostgreSQL checks/one REST skip, types/build/
  lint 0 errors/25 warnings. Included 38 new confidentiality regressions.
  [Latest source evidence](review-status.md#diagnostics-confidentiality-source-follow-up).
- [x] Broader source `530e9bb` passes actual remote Quality/Secret Scan/CodeQL
  and protected build. Downloaded logs confirm1,175 normal/40 skips and 39 actual
  PostgreSQL/one skip, types/build/lint 0 errors/25 warnings;53 additional application
  confidentiality and45 exact-project analytics cases are included.
  [Latest source](review-status.md#application-diagnostics-and-exact-project-analytics).
- [x] Source `98db3b1` limiter/sweep/read safeguards pass 76 new regressions and
  combined 1,251/40 clean checks, types/build/lint. Exact-source Quality, Secret
  Scan and CodeQL pass; downloaded CI verifies 39 persisted tests/one skip.
- [x] Verify exact e32 private Unix ingress/start, writable cache, actual restart,
  unexpected worker exit, separate-UID denial and sealed reinspection. Disabled
  runner prepared with 49 regressions; no service/timer/DNS activation.
  [Source and runtime limits](native-runtime.md).
- [x] Exact9bd native fresh-actor notes/watch/completion/two quizzes pass with
  independent strict-CA row verification and original-four preservation; all
  owned browser state/runtime/tunnel closed. Interrupted helper reports retained.
- [x] Latestcade late-auth-event and completion-label repairs pass16 AuthPage
  and seven existing player cases, full CI1,931/40, persisted39/1, types/build/
  lint0/25 and exact554-file secret scan0; fresh sealed Unix19/HTTPS11 pass.
- [x] Latest57 mobile drawer geometry/hit/keyboard/route entry320/390, all-five
 12-model read-only preservation, closure and sealed reinspection pass. Exact
 CI1,935/40, persisted39/1 and source555-file scan0 pass.
- [x] Scoped FB hydrated-editor text and BC35/35 actual four-language controls
  verified; raw57 browser12/9/3 remains historical. Financial currency/tax/journal
  and provider journeys remain separate. [Exact verification](review-status.md#scoped-notes-editor-and-language-controls).
- [ ] Review production resource/recovery/timer policy, durable CA/configuration,
  named-tunnel identity and unavailable-queue/manual historical recovery before
  any production activation.
- [x] Verify live Vercel team/project, aliases, environment scope, Node 20 runtime,
  daily cron and missing CRON_SECRET; read-only owner/member/plan evidence.
- [x] Record the owner's zero-cost hosting constraint; no paid Vercel upgrade.
- [ ] Verify isolated target build settings, usage/logs and previous deployment
  compatibility/rollback; verify stable hosting account/DNS control and continuous
  host availability. [Free hosting and quarantine plan](hosting.md) is prepared;
  existing Hobby commercial-use mismatch remains.
- [x] Locate deployed Supabase project through manager inventory; feav exists,
  INACTIVE, eu-west-1/PG17, matching production server reference.
- [x] Execute explicitly approved same-project recovery/preservation/rollback:
  private DB and 68 Storage files exported, offline archived-data restore verified,
  unsafe browser permissions confirmed, same project re-paused. Extension ACL and
  platform/off-site recovery limits remain explicit. [Outcome](supabase.md).
- [x] Create and harden a separate Free Supabase preview with synthetic accounts,
  course and private PDFs; actual native password login and direct-REST denial
  verified. No production clone or paid resource. [Isolation](preview.md).
- [x] Actual cloud-backend native four-role/media/PDF/mobile browser checks pass
  29/29 under strict-CA database runtime. Payment reconciliation was intercepted;
  this proves neither Dodo nor an HTTPS Vercel frontend.
- [x] Existing publishable/secret keys pass 20 overlapping native Auth/SDK/access
  checks on the synthetic backend; no production key change or rotation.
- [x] Verified checkpoint `27d7b4c`, isolated data/providers and production-built
  HTTPS frontend pass 45 distinct role/media/native-PDF/mobile/profile/certificate
  checks. Independent final read-only snapshot preserves notes/learning/purchases.
  Separate actual PDF page/text diagnostic passes at1440/320/390; restricted
  preview excludes Spotify/Cast. Earlier44/29/20/26/19 reports remain immutable.
  Owned temporary servers closed; this is not Vercel runtime or stable hosting
  proof. [Scope](preview.md#current-diagnostics-source-https-follow-up).
- [x] Verify fresh sealed application source e32 in its private Unix/HTTPS runtime:
  19 runtime/11 transport checks,12 public layouts/48 computed contrast checks,
  four native roles, actual Mux/PDF/certificate proof. Browser reports remain
  primary 96/98, guest 2/2, completion 7/7 and visual 7/7; observations and earlier
  unclassified exceptions are retained. [Current scope](preview.md#protected-native-preview-and-contrast).
- [x] Current e32 local and downloaded remote Quality logs confirm 1,915/40 normal,
  39/1 real PostgreSQL, types/build and lint0/25; Secret Scan/CodeQL pass.
- [ ] Classify earlier source 2058 buyer exceptions if they recur. Current runs
  have no recurrence; the earlier cause remains unknown. Complete Dodo/Google/SMTP journeys and
  the remaining production gates before declaring the maintenance goal complete.
- [x] Inspect production schema/roles/table/function/view grants and private
  Storage; verify offline archive counts/hashes and durable local backup.
- [x] Compare archived media/PDF mappings offline: 15 distinct signed lesson
  assets plus separate promo, 68 unique exported object references and valid PDFs;
  60 class files cover all four languages. Structural/label proof is not content
  correctness. Local extraction of six unclear auxiliary filenames confirms
  declared EN2/FR2/PT2 content languages across 15 pages; translation accuracy
  remains outside that check. All original hashes unchanged.
- [x] Actual pinned native Prisma engine verifies strict TLS and rejects wrong
  CA, trusted-chain/wrong-hostname, missing CA and non-TLS endpoints in a separate
  disposable loopback fixture; nine checks pass, container removed. [Scope](local-verification.md#separate-native-prisma-tls-verification).
- [x] Offline-validate exact baseline-bound production hardening revision 2:
  25 checks / 422 zero-row operations, unchanged archive content and 14 Auth/app
  identities; private SQL/inverse hashes and durable review copy recorded.
- [ ] Approve exact 26-table/RPC/default-privilege hardening and runtime
  compatibility before another resume. Existing June code has additional
  undeployed security defects; SQL-only recovery is not a complete release.
- [x] Verify live Dodo product/business, €29.90 EUR tax-exclusive base price,
  active webhook route/filters and exact signing-secret match through GETs.
- [x] Verify supplied Dodo TEST key and matching business; create exactly one
  dedicated synthetic product. Verified test-only price alignment to EUR80 and
  two coupon API acceptances preserve live resources and app fixture rows.
- [ ] Review customer/team/webhook-alert recipients, dashboard/currency/tax
  decisions and actual isolated checkout, delivery, reconciliation/coupon/reversal.
- [x] Read stored Google/SMTP/Auth/storage/network settings; missing production
  PKCE reset callback and global preview Auth allowances documented.
- [ ] Review exact production Auth redirect changes and Google console settings;
  verify actual isolated OAuth/SMTP/recovery after service restoration.
- [ ] Prepare exact production configuration/SQL diff and approved sequence.
- [x] Draft PR #46 and [review checkpoints](review-status.md) record exact source,
  protected preview, actual follow-up CI/CodeQL success and remaining gaps.

## Configuration review package

Values remain in provider stores. Publish names, targets and status only.

| Configuration | Review before release |
| --- | --- |
| DB/Supabase URL, anon/service keys and storage bucket | Existing Vercel targets share feavujcllgbzlvdvkkxx. New separate preview tvmhuacxctdgmejziaxg has verified trusted CRUD and denied browser grants; use only its keys/bucket in the reviewed preview. Preserve customer project and reconcile EU/US connection strings. |
| Database TLS / CA resource | Synthetic runtime and production read-only session export verify the published CA/hostname; actual pinned native engine passes nine isolated chain/hostname/no-TLS checks. Prepare a durable reviewed CA path and strict URLs for the selected free host; Vercel would additionally need build tracing. The temporary path is not a release resource; actual production app TLS remains unverified. |
| APP_URL/NEXT_PUBLIC_APP_URL and Auth allowlist | Current stored apex Auth lacks /auth/reset-password/callback and allows global *.vercel.app. Prepare canonical www with exact callback/reset paths; separate preview Auth, remove broad production preview/local allowances in reviewed release. |
| Runtime/root/build | Live Node 20.x with root/framework/build overrides unset; prepare Node 24.x and source-root/build settings for the exact deployment method. Verify isolated build before production change. |
| CRON_SECRET | Currently absent in live project/deployment env names; prepare nonempty random per-environment secret with hardened release. 03:15 UTC bearer sweep; missing/wrong denied. |
| Dodo keys/product/environment | Existing deployed preview shares live resources; deployed development wrong-mode key still returns 401. Separate private TEST key/business/product are verified; review notifications and bind a dedicated verified test webhook before enabling the isolated runtime. Synthetic checkout stays loopback-only. |
| Mux signer | Match registered key/signed assets; trim CSV trailing comma. Never apply stale mapping script to live lessons. |
| Resend/from/professor/reply/signing | Verified sending identity; inbound needs approved receiving DNS and enabled signed webhook. Native RESEND_WEBHOOK_SECRET differs from optional relay secret. [Runbook](resend.md). |
| GA/OpenReplay | Replay enabled across current targets; prepare initial disabled configuration. Review retention/provider settings and prove choice/withdrawal/private exclusions before enablement. Disable GA automatic history/forms/outbound/video/download capture. |
| Owner/admin identity | Validated Auth identity and intended role; no invented Auth ID via legacy admin:create. |

## Database change package

No blanket migration replay is proposed. A complete initial PostgreSQL migration
is unverified; db push was used only on disposable local databases. The new
empty cloud preview was bootstrapped from the current datamodel plus explicit
messaging/RLS SQL in a guarded transaction, without legacy history replay.

1. Inspect sanitized ownership/grant/RLS/function/view/migration metadata,
   runtime-role capability, backups and restore evidence.
2. Compare actual schema with Prisma and messaging definitions. If absent,
   prepare only reviewed setup-messaging.sql and required missing columns.
3. Review harden-lms-rls.sql and harden-messaging-rls.sql separately. Confirm
   owner/BYPASSRLS and trusted CRUD, shared dependencies and function/view grants.
4. Get explicit approval for exact SQL and sequence. No production seed, db push,
   reset, wipe, full legacy-policy replay or financial schema migration.
5. Verify browser denial/server continuity with approved synthetic identities;
   retain pre-change metadata for reviewed forward repair.

## Release after explicit approval

Changing DNS alone does not retire trusted old servers. The June deployment's
direct vercel.app URL and cron may still reach production with their immutable
credentials after Supabase resumes. Prepare and approve a verified old-project/
deployment quarantine before another resume, covering generated URLs and cron.
The prepared free scope is All Deployments Vercel Authentication, explicit cron
disable and paused active production. Verify actual targets/bypasses before
claiming coverage; [hosting review](hosting.md) records current primary policy.
The separate Gabriel-scoped historical/previews remain unreconciled and could
also carry customer credentials; their isolation must be verified or access
retired through the correct account. No project pause/delete, credential rotation,
DNS move or deployment-protection change has been performed for this plan.

1. Confirm approved commit, deployment target, exact configuration/SQL changes,
   prerequisites and verified previous deployment/rollback target.
2. Apply only approved prerequisites through the verified project's supported
   path; deploy the approved code revision.
3. Verify public discovery/noindex, identity/recovery/OAuth, video/private PDFs,
   free/paid negatives, quiz/notes/certificate/admin and cron access. Provider
   tests and any third-party messages need the explicit approved scope.
4. Inspect sanitized deployment/webhook/media/accounting failures. No unapproved
   real charge, refund or customer email.
5. Record actual deployment ID/commit and each check before reporting success.

## Rollback / forward repair

- Use a verified previous secure release on the selected host or a closed
  maintenance page. The unsafe June Vercel deployment is not a repaired rollback;
  any earlier candidate requires environment/runtime/provider compatibility and
  security review. Code rollback does not restore failed Supabase DNS, lost data
  or disabled inbound email.
- Restore reviewed previous config from provider stores, never reports. Changed
  public build-time values require a rebuild.
- Handle SQL separately: application rollback does not reverse grants/schema.
  Proposed hardening preserves data and is atomic; repair a proven server-role
  dependency before considering restoration of unsafe browser grants. Broader
  restoration requires its own approval and backup evidence.
- Preserve IDs, purchases, reversal ledger, voucher accounting, progress,
  attempts, notes and messages. Never use seed/wipe/reset as recovery or delete
  reversal events to force reconciliation.
- If core checks fail, retain failed revision/sanitized evidence, stop further
  production mutation, and use only approved rollback/forward repair.

## Native package prerequisite

The exact e32 producer/Unix launcher passes fresh installation/build/sealing,
actual protected HTTPS journeys, runtime cache/restart/cleanup and separate-UID
boundary checks. The bounded reconciliation runner is prepared and disabled;
no timer/service was activated. Initial browser observations and older failures
remain separate. The temporary app/tunnel are closed, not a continuous host.
Package durable CA/configuration and a reviewed named-tunnel profile; verify
provider identity separately from key shape. Preserve artifact/failure receipts
and rebuild if public values or application source change. Account/DNS/continuous-
host control, resource/recovery policy, old Vercel quarantine, unfinished provider
journeys and explicit SQL/config/deploy/resume approval remain release gates.
[Verified source/package limits](native-runtime.md).


## Earlier accounting and language checkpoint

- [x] Source133 exact Quality/Secret Scan/CodeQL/protected build succeed; downloaded
  logs confirm1,973/47 normal and46/1 persisted,types/build/lint0/25.
- [x] Nullable provider accounting preserves true zero, same-payment facts and
  late coupon linkage;260 targeted checks include18 actual PostgreSQL cases.
- [x] Dedicated saved editor text/styles pass onFB at320/390. BC35/35 browser
  checks include12 real language clicks at1440/320/390 and matching reachable
  completion names. Previous failures remain separate; no learning/payment writes.
- [x] All-five12-model strict-CA preservation and actual app/tunnel/browser cleanup
  pass; purpose session deleted and both45,769-file seals reverified.
- [ ] Complete actual provider journeys, notification recipients, continuous host/
  account/DNS and old deployment quarantine; review exact production SQL/config/
  source/resume changes. Temporary closed previews and local source checks do not
  satisfy these gates. No paid upgrade or production release occurred.

[Exact source and limits](review-status.md#provider-amount-availability).

## Current payment history checkpoint

- [x] Exact a207 Quality/Secret Scan/CodeQL and actual protected Vercel build
  status pass; downloaded logs confirm1,995/47 normal and46/1 persisted,
  types/build/lint0/25. Clean556-file committed export secret scan0.
- [x] Failed/malformed history has localized recovery; successful empty remains
  empty. Account epochs reject stale rows and server cookie/expected-owner
  mismatch returns409 before the DB read. Independent review and page19/19 pass.
- [x] Fresh551-application-blob/45,770-file/158-client-file build, Unix19/HTTPS11
  and actual native history31/31 successful phases pass. Four locales, mobile/
  desktop, unknown/zero/80, controlled failure/real retry and server409 verified.
- [x] Sole synthetic grant restored to exact original row/timestamp; strict-CA
  all-five12-model/global comparisons match. One login/session/own-avatar,
  browser/app/tunnel closure, session deletion and complete seal inspection pass.
- [ ] Verify actual Dodo/notification, Google/mail, continuous-host/account/DNS
  and old-deployment quarantine gates, then review exact production actions.
  Root fixture amount variants do not prove a provider transaction. Account-
  switch/empty-account browser journeys remain excluded from this scoped window.

[Exact source, retained diagnostics and limits](review-status.md#payment-history-recovery-and-account-isolation).

## Local credentials and closed fallback

- [x] Restrict ignored credential CSV and private app.env from0664 to0600,
  preserving contents/keys. Retain TEST key bytes in a durable owner-only
  configuration directory; one bounded GET verifies the unchanged test target.
- [x] Build a concrete branded standalone fallback with four languages and
  exact503/header contract, no backend/providers/tracking/storage dependency.
  Actual browser/HTTP138/138 and separate file4/4 checks pass, independent
  review passes and all owned processes close; initial109/110 zoom failure kept.
- [ ] Review exact host/domain/quarantine/status/header behavior and approve
  production activation. The file/JSON alone do not configure the host or retire
  immutable old deployments/cron. Continuous hosting and provider journeys remain.

[Fallback artifact and reviewed serving contract](maintenance-fallback.md).


## Catalog quote follow-up

- [x] Repair paired selected-course pricing, unknown catalog free-grant handling,
  voucher course/open lifetime and synchronous removed-frame action retirement.
  Source44ec58b passes61 new cases included in clean2,191/47,46/1 persisted,
  types/build/lint0/23, independent review and exact remote checks.
- [x] Verify current catalog80 with a separately scoped B-only32/32 native run:
  24 quote/dialog cases in four languages at1440/390, real class2 denial/details80,
  normal sign-out and zero client errors. All-five/12-model preservation/owned
  browser/app/tunnel closure and sealed reinspection pass. Earlier21/22 and20/21
  helper timing diagnostics remain raw; prior41424/24 is separate. No native
  player-modal or artificial delayed-response/provider-charge claim.
- [ ] Reconcile positive catalog/UI price, existing29.99 checkout metadata and
  actual Dodo product charge/tax/currency before a production purchase flow. No
  catalog/provider mutation or actual charge is approved by the source repair.

[Exact source and limits](review-status.md#catalog-prices-and-course-action-lifetime).


## Checkout publication and account-intent follow-up

- [x] Sourcecd20569a rejects unpublished courses and stale/ambiguous owner hints
  before grants/payment work. Verified cookie identity remains authoritative;
  genuine published0/admin and legacy controls pass. Four clients carry captured
  owner IDs and show precise409 refresh guidance in four languages.
- [x] Independent review and meaningful frozen baselines;2,221/51 normal,50/1
  actual isolated PostgreSQL, types/build/lint0/23 and exact remote checks pass.
  CI includes the new guarded persistence suite. Exact581-file source scans0.
- [x] Native12 three-surface/four-locale controlled409 relay cases pass; original
  B checkout never continues, URL/body/hint remain unchanged and actual native409
  is relayed untouched. Page errors/forbidden mutations0. Raw no-checkout preflight
  and later logout assertion interruption remain separate; all browsers close.
- [x] Separate sign-out-only browser passes actual global204/private retirement
  for both accounts, then strict-CA all-five/12-model preservation, runtime/tunnel
  closure and sealed reinspection pass. Six sign-in/session pairs this preview/21
  cumulative;0 avatar metadata writes. Earlier partials remain unchanged. No
  repeat of the matrix, natural cookie-lag claim or matching provider checkout.
- [ ] Before production recovery, separately review an index-definition guard
  integrated after deterministic locks, plus unresolved column/extension ACL
  equivalence. The separate93-index/18-check proposal never authorizes SQL or
  removes revision2's capture-to-lock race. Original SQL/inverse remain frozen.
- [ ] Resolve catalog/provider price,29.99 metadata, tax/currency, actual Dodo
  transaction/delivery/recipient, OAuth/SMTP, stable free hosting/DNS and production
  recovery/quarantine gates. No new spend or production action is inferred.

[Exact scope](review-status.md#checkout-publication-and-account-intent).


## Voucher authority and recorded admin amounts

- [x] Published/known-price voucher validation and verified cookie/expected-owner
  denial, active redemption response/timer retirement and four-language recovery
  pass meaningful frozen regressions and actual local PostgreSQL persistence.
- [x] Recorded0/unknown amounts and number-only known sums replace catalog-based
  financial fiction; analytics.read gates financial query and whole display.
- [x] Sourcea16c1abc clean2,311/57 normal,56/1 real PostgreSQL, types/build/lint0/22,
  exact remote checks and committed-source/downloaded-log scans pass.
- [x] Two fresh582/45,802/158 artifacts/Unix19/HTTPS11; second native passes12
  actual503/409 cases. Eight acknowledged price transitions restore80 with full
  row/timestamps unchanged; all-five/12-model preservation, owned app/tunnel/
  browser closure and complete seal inspection pass. Original zero-traffic and
  later12/13 partial reports stay separate; cumulative sign-in/session pairs24.
- [x] Separately repair/verify admin320/390/768/1024/1440; actual logout204 in
  each separate admin window. Original voucher-window logouts were not reached;
  do not relabel that partial.
- [ ] Complete source quote/payment provenance and concurrent course intent
  repairs; resolve actual provider charge/tax/currency, notification recipients,
  OAuth/mail, stable free hosting/DNS and reviewed production hardening/quarantine.

[Exact scope](review-status.md#voucher-availability-and-redemption-intent).


## Quote provenance and transactional course intent

- [x] Tag catalog quotes separately from provider facts; actual final0/null,
  coupon identity and known same-reference facts remain. Legacy discounts need
  explicit compatible basis/ordering; product/cart unchanged. Frozen26+3, focused
  222 and independent13-file review pass. No real provider payment is proven.
- [x] Retain course no-key-update lock/recheck through free grant writes; real
  post-validation edit failures and actual lock blocking/after-commit liveness
  pass. Checkout6 new+4 existing PG and direct11 PG retain valid grant controls.
  Administrative voucher-term edits remain a separate limitation.
- [x] Finalsourcea631 fresh2355/68,67/1 actual PG in eight suites, types/lint0/22,
  mandatory commit/push hooks. Initialc1a whole-QA four fixture failures retained;
  later three-file fixture commit changes no runtime application code.
- [x] Freshc1a586/45,806/158 artifact, Unix19/HTTPS11, five-width light-theme admin
  eight geometry/three keyboard menus/all permitted44px links/actual logout204.
  Separate before390/683 preserved. All-five/12-model/raw-course/timestamp hashes,
  owned closure and sealed inspection pass; cumulative pairs26.
- [x] Implement PAY-22 nullable canonical currency/minor facts, explicit ISO
  exponents, same-snapshot extraction, retry/replacement guards, student display
  and separate admin currency totals; frozen failures become focused passes.
- [ ] Complete the new currency candidate's clean-install full checks/remote CI,
  then a fresh isolated preview migration with old-field/NULL preservation and
  source-bound native history/admin/contrast checks. Production needs separate
  migration/deployment approval. See [migration compatibility and rollback](payment-currency.md).
  Actual provider transactions and the full tax/refund journal remain unverified.
- [x] Retain five existing synthetic login credentials separately from selected
  review evidence, with durable private provider input/CA. Owner-only0700/0600;
  no rotation, role assignment, browser session retention or automatic loading.
  Local unencrypted copy does not establish off-site recovery.
- [x] Exacta631 Quality/Secret Scan/CodeQL/Vercel status and downloaded logs agree;
  source591/log26 scans0. Durable selected102+manifest/receipt hashes and0700/0600
  modes match; nonempty candidate scan0. Remote provider isolation unverified.
- [ ] Verify docs-head remote checks and actual Dodo/recipient/OAuth/mail/stable-host
  and approved production recovery/quarantine/hardening gates. Keep zero new spend.

[Exact scope](review-status.md#quote-provenance-and-transactional-course-intent).
