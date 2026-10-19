# Goal verification matrix

Updated 2026-10-20. Local source is not a deployed production repair. Counts below
are completed checkpoints; overlapping targeted suites must not be added together.

Published verification checkpoint30d848a passes exact Quality PR/push, Secret
Scan PR/push and CodeQL, with0 open PR-ref alerts. Downloaded Quality logs
verify2,576 normal passes/80 intentional skips and80 persisted passes/one skip
(79 actual SQL cases plus one metadata case), types/webpack/static31-of-31 and
lint0errors/22 existing warnings. Five legacy main alerts remain open. The table
below preserves earlier journey-specific source bindings; its older counts are
not latest totals.

Latest recovery evidence: revision4 checks225 archived columns plus93 indexes,
with24 actual isolated checks and nine closed checks. Corrected restore matches
51 member owners/557 ACL/67 role statements. A separate combined restore/apply/
manual inverse/reapply preserves65 tables/2,239 records/two sequences at all four
stages and passes422 zero-row permission operations after each apply. Source
extension ownership/initial/effective privileges and platform reconstruction
remain unverified. A later actual offline run verifies unchangedV4 at225 →
literal additive migration → strict read-only227 postcheck. Original65-table
projections/2,239 records/two sequences and initialNULL fields are preserved;
446 zero-row operations pass after migration and reapply. Six negative stages
include rejecting the old225 inverse at227. A separate manual227 cycle retains
one owned synthetic Purchase and canonical facts, followed by full-row CAS
cleanup. Independent inverse-export comparison matches557 ACL/member-owner
metadata; all inputs and container cleanup pass. Current production compatibility
remains separate. The completed offline history rehearsal below closes its
isolated ledger-reconciliation gate. No production changes follow from these checks. [Recovery scope](review-status.md#recovery-permissions-and-index-checks).

Exact5f fresh native artifact605 Git files/45,825 sealed/158 client files passes
Unix19/HTTPS11 and17 monetary/auth browser checks. Independent final capture
matches12 models/18 protected hashes and both complete Purchase rows; two owned
voucher rows are removed, both canonical pairsNULL/business0 and all browsers/
app/tunnel closed. The27 private money crops expose character-wrapping problems
despite correct facts; readability follow-up is separate. No actual provider
transaction. [Native scope](review-status.md#native-voucher-and-payment-facts).

Presentation8053c1b addresses that discovered wrapping while preserving formatted
text and bounded table scrolling. Five actual local after renders pass against
five problematic before renders, including64-digit scroll endpoints. Existing18
integration cases/types/scoped lint pass. This uses real async page markup/CSS
with synthetic read mocks, separately from the authenticated5f native journey.

| Requirement | Completed evidence | Remaining gap |
| --- | --- | --- |
| Public UX/UI | Source-e32 native HTTPS:12 public layouts at 1440/320/390 in both themes and48 computed contrast checks pass; light gold fixed with three lines. Earlier actual responsive/focus/privacy suite15/15 remains separate. Guest selector diagnostic2/2 passes. | Initial primary selector ambiguity remains documented; no application cause established. Inherited certificate/guarantee and price/tax promises require owner evidence. |
| Registration / verification | Earlier local emailed OTP passes. Oct19 actual cloud source910 registration400/provider422 `signup_disabled` is repaired in30d848a using signup confirmation;85 focused contracts pass. Owner receives/verifies the code, password fingerprint is unchanged and original-password dashboard login/normal logout pass. Final original-row preservation, zero actor sessions, full Auth restoration and resource/seal closure verified. | Hosted recovery incomplete; initial3+evening1 send actions consumed, exactly three total emails. Private SSH browser transport proves actual app/provider behavior, not public HTTPS. Fresh complete registration on repaired source and production INACTIVE Auth continuity remain separate. [Email scope](cloud-auth-mail.md). |
| Password recovery / Google | Actual local emailed PKCE recovery/new-password login passes. Oct19 fc8d813 fresh sealed build45,827/client147, Unix19/HTTPS11/authorize-start7 pass. Owner first and returning Google login reuse identical Auth/application/Google identity with USER role; final normal sign-out leaves0 sessions. Original25 public/three Auth tables remain unchanged; every Auth field restored, app/tunnel closed and seal reverified. Separate30d848a hosted SMTP confirmation is received/verified; the separately approved evening reset is delivered, but its link is opened outside the private browser and the copied callback has otp_expired. No private-browser recovery exchange is observed. Password unchanged, zero actor sessions, full Auth/original-row preservation and owned resource/seal closure pass. | Two finite Google-window runtime error counters have no established cause; no personal-browser console/network capture. Production Google/customer continuity and reset callback/global preview redirects need separate reviewed configuration. [Google evidence](google-oauth.md), [cloud email scope](cloud-auth-mail.md), [stored production configuration](supabase.md). |
| Unconfigured automatic reconciliation | Source33dd19f: actual provider helper with no/blank key reproduces route500 before the fix; desired503 regression fails2/7. Authenticated guard now returns503 provider_unavailable without provider/fetch/DB/upsert/log work; unauthenticated401 and configured historical fulfillment without product ID remain.164 focused tests/types/scoped lint pass. | Auth/DB/upsert are synthetic and fetch intercepted. This is source behavior proof, not Dodo health or identification of the two earlier Google-window diagnostic errors. |
| Free / paid / legacy access | Four persisted roles: free first lesson only; course buyer all lessons; legacy lesson 2 plus free first; admin preview. Free paid-media/progress/quiz denied. Synthetic checkout grants course access; repeat purchase denied. Four native roles/access denials also pass on the production-built HTTPS frontend. | Actual Dodo test checkout/webhook/return/reversal. New individual lesson sales remain intentionally 410. |
| Vouchers | Actual local actor: invalid denied/no purchase; FREE_ACCESS → paid access; one purchase/redemption/use; retry denied/cleanup verified. Four-language feedback and 19 component/atomic-error cases pass. Current helper created and retrieved scoped TEST percentage10% / flat EUR5 coupons in seven bounded provider requests. | Provider coupon acceptance is not redemption or native voucher binding. Actual checkout and tax/FX/settlement/account settings remain unverified. |
| Video / PDFs | Source-e32 actual Mux decode and four-language private PDF bytes pass. Fresh viewport-before-navigation320/390 PDF text is visibly confirmed in both themes, separate visual 7/7; completion 7/7 is narrower. Mux inventory16 and archived 15 lesson mappings plus promo match;68 original PDF hashes/structures and60 class labels verified. | Earlier sad-document screenshots and incomplete primary response remain preserved. Structure/labels do not establish video semantics or translation accuracy. Restricted preview excludes Spotify/Cast. No remapping/deletion justified. |
| Notes / progress / quizzes | Local persistence/locales/mobile and PostgreSQL concurrency/ownership tests pass. Cloud learning26/26:15 completed lessons,16 attempts/192 answers/15 PLATINUM summaries. Cache leak fixed; final notes pointer/privacy/recovery19/19 includes real manual-save200 after labeled intercepted500. Separate9bd actual native UI adds fresh-actor2notes/2completedlessons/2attempts24answers2summaries100PLATINUM/92GOLD, independently verified; original-four preserved. | Latest57 mobile drawer320/390 geometry/hit/keyboard/route entry passes. FB scoped hydrated editor text/styles pass at both widths; BC35/35 browser checks include12 real language clicks at1440/320/390.16auth/seven label cases are distinct. Earlier interrupted11 logic checks remain distinct; quiz contention has real local PG proof with no repeated cloud quiz mutation after patch. [Cloud evidence](preview.md#learning-and-note-recovery-follow-up). |
| Medals / certificates | 1–15 numbering, 15/15 SUPREME and full-course eligibility; legacy 1/15 gets no whole-course certificate. Local vector PDF/Unicode proof; exact-source HTTPS normal button click downloads valid 862,196-byte A4 vector certificate. | Four-theme/viewport private layout and medal contrast checks pass. Historical forged awards cannot be assumed repaired. |
| Messaging | Persisted route/role tests and native signature/trusted-authentication/deduplication checks. Student-owned threads, cross-student denial and authorized local professor reply tested with outbound disabled. Bounded HTML parser and actual inbox text-encoding regressions pass; CodeQL marks alerts 14/15 fixed. | Live receiving/webhook disabled, MX absent; real delivery/notification/inbound reply require approved activation and controlled mail. |
| Administration | Local users/vouchers render; ordinary roles denied; staff notes reviewed. API permission/validated owner identity covered. HTTP resets and CLI voucher reset require explicit isolated targets and default to plans. All 15 legacy mutators are quarantined locally. | Unsupported course create/edit links and inert delete button removed; course preview retained. Course authoring is not implemented. Remaining legacy tools retain their documented local write behavior; broader admin/account and recovery evidence are unverified. |
| Vercel / DNS / accounts | Vercel OWNER/live target/config/Hobby; Supabase sole Owner (MFA false), approved recovery/export/rollback; Dodo/Mux/Resend inventories; GitHub ADMIN, DNS/RDAP. Owner selected zero-cost hosting; free protected HTTPS preview verified. [Vercel](vercel.md), [Supabase](supabase.md), [Dodo](dodo.md). | Stable free production hosting, old credential-bearing deployment quarantine, usage/logs/recovery, separate GitHub scope, registrar controls and Dodo dashboard ownership/payout. No paid upgrade authorized. |
| Dodo provider | Eight live GETs verify €29.90 tax-exclusive product/business and webhook/signing. TEST key/product verified; test-only product aligned to unchanged fixture EUR80, two coupon APIs accepted, webhook inventory0. Controlled customer address privately recorded. | Existing deployed preview shares live resources/development wrong-mode key401. Merchant/webhook-alert recipients, actual isolated transactions/signatures/reversal and dashboard currency/tax/settlement remain pending. |
| Supabase / schema / storage | Approved production resume/export/re-pause completed. Actual26 public table grants, ledger/messaging RLS gaps and self-role escalation confirmed. Offline archive65 COPY tables/2,239 records/two sequences and68 Storage object hashes match; durable private local backup exists. | New hardening/code/config/resume review required. Extension ACL equivalence/full platform/atomic snapshot/off-site retention remain explicit limits. Production INACTIVE again; no exploit write or SQL repair. [Recovery outcome](supabase.md). |
| Security / accounting | Auth/cron/media/quiz/notes/signatures/reversals/coupon/privacy defects fixed with regressions. Native limiter/sweep76, producer/ingress512 and launcher/transport/disabled-runner 152 cases are included in current1,995 normal passes. Actual runtime/restart/cleanup/UID denial and sealed reinspection pass. | Process-local/restart/uncancellable Prisma and unavailable-queue recovery limits remain. Production config/hardening, financial journal/currency/tax and historic exposure need review. No timer/production execution enabled. |
| Install / runtime / build | Node24.21.0/Next16.4/Prisma5.17. Source-a207 fresh locked configured webpack artifact:551 application Git blobs/45,770 sealed files/158 client files checked. Actual Unix19/HTTPS11, closure/reinspection pass; e32 restart/worker/UID remains separate. Native engine9 strict TLS checks pass. | Production audit0/dev lint-chain5 high findings remain. Live Node20/settings await approval. Durable CA/config, continuous host, resource/recovery policy and named-tunnel identity remain unverified. |
| Normal automated checks | Exact a207 source and downloaded CI:1,995 normal passes/47 intentional skips,108 files with passes/five all-skipped;46 actual PostgreSQL passes/one REST skip; types/build and lint0/25. Quality/Secret Scan/CodeQL and actual protected Vercel build status pass.556-file committed export scan0. | Existing Vercel account/provider isolation remains unreconciled; build success is not customer-journey or production proof. Earlier reports remain immutable. |
| Separate cloud backend | Free tvm25 hardened tables/five synthetic actors/60 private PDFs. Native9bd fresh UI2notes/2completedlessons/2attempts24answers and100PLATINUM/92GOLD independently verified. 57 drawer320/390 picker96/link225×44 hit/keyboard/route entry, FB hydrated editors and BC35/35 real language controls pass. All-five12-model preservation passes at02:42:36; apps/tunnel/browser state closed. | Historical correction12/9/3, FB10/9/1 clipping and purpose preflight1/0/1 remain separate. Older two buyer errors remain unclassified. Auth budgets remain distinct: earlier11, fresh-learning3, later-nominal3, focused-editor1; correction state reuse adds0. Dodo/SMTP/stable hosting/production and production Google continuity remain gates; Oct19 isolated OAuth is verified separately. |
| Real persisted checks | Five guarded PostgreSQL suites pass46/one REST skip on exact a207 and3cc CI, including seven nullable-accounting regressions and earlier real3-second acquisition cases. Dedicated local Supabase security mode separately5/5 passes. | Fixtures cannot prove production grant repair; actual production remains paused and unsafe until reviewed hardening. |
| Privacy / SEO | 72 focused cases, 15 public browser cases, actual promo playback at 320/390/1440 both themes without optional cookies; on/off/withdrawal works, language retained. Private routes excluded; preview noindex. | HTTPS replay/provider settings and GA Enhanced Measurement review before enabling ID; historic recordings/retention/account recovery unknown. |
| Release / rollback / preview | DraftPR46, exact a207 CI/native payment-history proof and distinct FB/BC editor/language artifacts. Supabase approved preservation/rollback and offline hardening25 checks verified. Disabled reconciliation runner and free stable-host/quarantine proposal prepared. [Checkpoint](review-status.md#payment-history-recovery-and-account-isolation). | Continuous-host/account/DNS/durable configuration, actual old deployment quarantine/compatibility, unfinished provider journeys and exact SQL/config/code/resume approval. Existing Vercel preview is not isolated; no production release. |

A zero scanner result does not revoke or remove the known historical test
passwords. Private credential/environment/provider-session files are intentionally
excluded from published artifacts. See [local verification](local-verification.md),
[public provider evidence](public-provider-evidence.md),
[backlog](backlog.md) and [release checklist](release-checklist.md).

Historical source `98db3b1` passes 1,251 normal tests/40 intentional skips (95 files with
passes/five all-skipped), lint 0 errors/25 warnings, types and webpack in a clean
Node24 copy with no private env. The 76 new cases are included in1,251. Exact-source Quality/Secret Scan/CodeQL pass; downloaded Quality logs verify
1,251/40 normal and 39/1 persisted PostgreSQL counts. Earlier reports remain
immutable. No latest-head HTTPS/browser or
production verification is inferred. [Native behavior and limits](native-runtime.md).

Historical native source `ab14628` passes 1,763 normal tests/40 skips, types and lint0/25.
Its 512 new cases are included: indexing35, configuration189, policy170,
actual HTTP20, actual release I/O48 and preparation50. A fresh configured locked
package matches 541 Git application blobs and verifies45,759 sealed files;
157 client files contain the public key/origin without supplied server secrets.
Reinspection passes, but its origin is synthetic/unrouted and it was never
started. Fixture-only successor `3cbb17c` has189 scoped passes and preserves the
same malformed-key test value without a scanner suppression. Native launcher,
runtime cache/restart, disabled daily runner and current-source HTTPS/customer
journeys were unverified at that checkpoint. The exact-e32 checks above supersede
those gaps; production activation remains separate. [Current package scope](native-runtime.md).


Latest57 all-five12-model strict-CA read-only fingerprints/global counts are
unchanged after closed apps/tunnel. Browser report12/9/3 remains separate; native
9bd two-lesson learning and earlier e32 public/PDF scopes are not relabeled.
Unknown historical and malformed provider amounts now stay unknown. Historical
display has33 targeted passes; provider accounting has260 including18 actual
PostgreSQL cases. Stored currency/tax/financial journal remain deferred. [Exact scopes](review-status.md#mobile-drawer-recovery-and-recorded-payment-amounts).

Latest source accounting and exact CI are in [provider amount availability](review-status.md#provider-amount-availability); hydrated editor and real language controls are in [the scoped UI checkpoint](review-status.md#scoped-notes-editor-and-language-controls).

Current a207 history source cases distinguish failed/malformed requests from
successful empty history and reject stale owner results/cookie mismatches.
Page19/19 and API frozen baseline/controls pass. Actual HTTPS31/31 successful
phases show80, unavailable,0 and restored80 in ES320/EN390/FR1440/PT320, controlled
500/real retry, and server409. Root SQL variants touch only one synthetic grant;
exact original row restored and all-five12-model hashes unchanged. Browser
account-switch/empty-account journeys and actual Dodo transactions are excluded.
One login/session/own-avatar,19 intercepted reconciliation intents, clean
process closure/session deletion/seals verified; earlier3/2/1 and no-traffic
CLI1/0/1 diagnostics retained. [Current scope](review-status.md#payment-history-recovery-and-account-isolation).

Operational fallback9cb is a separate standalone HTML/CSP/503 contract, with
138/138 actual loopback HTTP/browser checks and4/4 local-file checks. Initial
109/110 CSS-zoom failure is preserved; no production activation/provider journey.
Credential CSV/app.env0664→0600 and identical durable TEST-key retention are
actual local changes; six durable preview provider values match a207 inputs.
No key rotation, automatic loading or production configuration proof follows.
[Operational scope](review-status.md#local-credential-boundaries-and-static-rollback-fallback).

Latest published fallback/docs HEAD `8e68f68` has exact successful remote checks,
downloaded 1,995/47 normal and 46/1 persisted counts, two 559-file committed
exports with zero findings, and retained 48-file evidence outside `/tmp` with
matching hashes/owner-only modes. No separate intermediate `9cb3d3f` CI run or
production fallback activation is claimed.

**Private dashboard/admin/course/lesson ownership is repaired in source4f395e0.**
Frozen component/parent12 failures/five controls, separate admin/checkout cases,
original six-route24 failures/18 controls and seventh-route four failures/three
controls remain distinct. Final111 client cases/49 route regressions pass;
independent18-file review binds to committed blobs. Fresh root/CI2,130/47 normal,
46/1 PostgreSQL, types/build/lint0/23 and570-file secret scan0 pass. Actual native
cross-tab sign-out/sign-in, B empty payment history/current-owner controls and
stale-hint409 pass. A separate foreground4f observation confirms the paywall
physically intercepts B's logout; final414 repairs the stacking and passes24/24
actual owner/account/menu/modal checks with both normal logouts. The earlier
19/20 report and unclassified timeouts remain retained, and actual delayed-reply
privacy remains a separate unproved scope.
[Current scope](review-status.md#contained-paywall-and-complete-native-account-verification).

Registered account access is corrected in source: profile, settings and payment
history are available without a full-course purchase, while the authenticated
owner boundary and paid content rules remain. Exact-HEAD frozen six failures /
nine controls become 15 passes, plus seven notes/paywall controls. Genuine
unobstructed native free-account views and own identity are verified; profile/
preference edits and actual provider payments remain excluded.
[Scope](review-status.md#private-view-ownership-and-account-access-source-verification).


Current catalog/action source44ec58b has clean2,191/47 normal,46/1 persisted,
types/build/lint0/23 and exact remote Quality/Secret Scan/CodeQL success. The61
new cases cover paired prices, unknown free-grant rejection, voucher/course/open
lifetime, removed-frame cleanup and finite duplicate diagnostics. Fresh locked
artifact572/45,792/158, Unix19/HTTPS11 and577-file secret scan0 pass. Native
owner reports retain separate21/22 and20/21 helper timing diagnostics; an additional
B-only browser32/32 verifies24 catalog/dialog cases across four languages and
1440/390, real paid-class2 denial/details80 and normal sign-out. All-five/12-model
preservation, clean owned closure and sealed reinspection pass;15 total observed
owner/catalog password/session pairs remain explicit. Prior41424/24 stays separate;
actual player-modal reachability, artificial delayed replies and positive provider
price/metadata/tax/currency parity remain unresolved.
[Current source scope](review-status.md#catalog-prices-and-course-action-lifetime).


Current checkout publication/intent sourcecd20569a passes2,221 normal/51 opt-in
skips and50 real isolated PostgreSQL/one REST skip, types/configured webpack and
lint0/23. Publication9, server intent8 and client13 new normal cases retain frozen
before failures and meaningful controls. Four new actual PostgreSQL cases prove
before/after draft and wrong-cookie grant persistence. The older plain-URL fixture
failure is retained. Exact CI logs and581-file source scan agree; all15 independently
reviewed hashes match the final source. Fresh576/45,796/158 native artifact and
Unix19/HTTPS11 pass. Current native12 actual-response relay matrix passes on three reachable screens
and four languages at390; the whole run retains an unawaited logout assertion
interruption. A prior preflight has0 checkout. Both browser groups close, with
page errors/forbidden mutations0 and cumulative19 sign-in/session pairs. Final
separate sign-out-only checks later pass both actual global204 responses, with
six pairs in that window/21 cumulative; all-five/12-model preservation, owned
runtime/tunnel closure and seal inspection pass. Original partial is retained;
natural cookie lag and locked-player reachability are not established.

Offline93 public index definitions/18 closed checks expose the prepared name-only
guard's uniqueness limitation. Original SQL/inverse hashes remain unchanged; no
live SQL/drift/column/extension equivalence or atomic-preflight claim follows.
[Current checkout evidence and limits](review-status.md#checkout-publication-and-account-intent).


Latest published voucher sourcea16c1abc passes2,311/57 normal and56/1 real
PostgreSQL in seven suites, types/configured build/lint0/22. Two fresh
582/45,802/158 artifacts and Unix19/HTTPS11 pass. First browser attempt has zero
traffic and fails a proof-file mode guard. Second passes12 actual four-language
503/409 cases but fails admin mobile overflow: whole-run PARTIAL12/13. Eight
price transitions restore80, with publication/other public-table writes0.
All-five/12-model/global/business/learning/entitlement and complete raw course/
timestamps match after clean expiry closure and seal inspection. Three further
password/session pairs bring the cumulative count to24; normal logouts were
not reached. Separate admin before/after and quote-provenance/concurrent-intent
repairs remain work. [Exact scope](review-status.md#voucher-availability-and-redemption-intent).


Sourcea631e166 now passes2355/68 normal,67/1 real PostgreSQL in eight suites,
types/lint0/22, with meaningful quote/provenance and transactional course fixes.
The source-confirmed JPY/KWD conversion/precision issue remains High PAY-22.
Freshc1a has identical application code; its586/45,806/158 build/Unix19/HTTPS11
and native admin320/390/768/1024/1440 pass eight geometry observations, three
keyboard menus and six permitted44px links per width (light theme). Two separate
admin pairs bring cumulative count26, each with actual logout204. All-five/
12-model/course timestamps unchanged and owned closure/seal pass. Originala16
voucher12/13 andc1a2351/4/68 fixture diagnostic remain immutable. Actual Dodo,
OAuth/mail, stable hosting and approved production hardening remain essential
gaps. [Current source and bounds](review-status.md#quote-provenance-and-transactional-course-intent).

The next currency candidate fixes PAY-22 in source: nullable exact payment
currency/minor text, explicit ISO exponents, coherent snapshot extraction,
retry/replacement guards, honest history and separate admin currency totals.
Frozen backend52, admin13, student23 and DTO17 cases retain their exact-d05
failures and now pass. A separate intermediate snapshot-mixing eight cases
(six failures/two controls) also pass after correction. Local schema6 preserves
the old row/timestamps and includes five actual PostgreSQL representation
checks. Light amount contrast now uses the existing title-accent token; actual
post-class offline ratios pass both themes. Full clean-source QA/remote CI and
a fresh migrated native preview remain pending; prior c1a evidence is not
rebound to the candidate. [Currency scope and rollout](payment-currency.md).


Latest currency checkpoint: exact97e5e06 clean2533/80 normal, types/build and
lint0/22. Exact188 ten persisted suites80/1 (79 actual PostgreSQL cases plus one
client-metadata case) pass after file serialization; real within-test races stay
active. Fresh602/45,822/158 artifact, isolated nullable-column migration,
Unix19/HTTPS11 and native58 pass. Independent final12-model/18-protected-hash
comparison restores both pairsNULL and preserves raw timestamps/roles/policy/
indexes; all owned browser/app/tunnel resources close and seal inspection passes.
Native statistics are KWD7d/restored30d only;36 representative amount geometry/
contrast observations cover320/390/1440 in both themes. Later voucher/legacy
precision/unknown-zero follow-ups have55 targeted source/component checks,
not a new native execution. No Dodo transaction, production migration or paid
hosting change. Broader landing-page visual polish is the next UX pass.
[Exact scope](review-status.md#currency-facts-and-readable-amounts).


Public landing source5c improves the hero and repairs actual390 mobile-menu
clipping while preserving the different320 toggle position.154 assertions across
six viewport/theme cases and four locales, plus four existing E2E cases, pass.
Exact5c full2533/80/types/build/lint0/22 passes; f8 adds test coverage only. Before18/
after19 public PNGs and88 selected artifacts are retained privately; owned
browsers/local wrappers close. Promo video is an explicit local503 fixture, no
provider/account/mail/DB flow. Existing Secure OAuth hint writes are clarified
for static analysis;10 before/after controls pass. Exactf8 remote Quality/Secret
Scan/CodeQL checks pass; fresh head-ref alert query0, no dismissal.
[Exact landing evidence](review-status.md#landing-hero-and-usable-mobile-navigation).

Application1e381a3 separately repairs press hover/focus contrast and footer touch/
focus appearance. Actual isolated local production12-case matrix (ES320/390/1440
both themes plus EN/FR/PT390 both) passes with actual Inter/Playfair, no overflow,
broken loaded images, client errors, external reads or mutations. Painted press
ring contrast5.86/7.34 and solid2px footer outline7.26/8.59 pass; back-to-top is44px
tall and keyboard activation returns to top. Build/types/scoped lint pass. Root
preserves earlier fallback-font and focus-predicate diagnostics, and retains117
selected files/90 public crops outside/tmp. Browsers/server closed; no provider
or full accessibility-audit claim. [Scope](review-status.md#landing-press-and-footer-accessibility).

Whole-page follow-up: four ES renders at390/1440 in light/dark, with four original
full-page captures and four derived inspection crops, verify page composition
and readable default mobile course titles/biography. No further layout change
is justified. Source bytes match1e across302 runtime/public files; build producer
is91e plus two reviewed edits, so this remains a limited local visual proof.
Requests193 local/four promo503 fixtures/eight optional prefetch blocks, external/
mutating traffic and errors0; owned browser/server closure independently checked.
Low-resolution original photos remain a medium-priority asset limitation after
a bounded21-blob search and8 selected ES/EN lesson PDFs with0 embedded bitmaps.
Other languages/unrelated PDFs remain unopened. No generic clamp, all-language
or healthy Mux claim.

Historical migration source: exact237-byte March18 restoration changes the four
checksum cases from3PASS/1FAIL to4PASS; clean local sourceac62f4a normal suite
passes2,537/80. Two earlier offline attempts stop before any resolve; their
empty-log predicate and PID1 container-reaping diagnostics remain preserved.
An empty trace identifies the correct Prisma engine as the SIGTERM target;
Docker init prevents the demonstrated database recovery in a controlled run.

Completed actual run-a5ec90a2205e then verifies corrected restore, exactV4 at225,
literal currency SQL, strict227, initial status, exactly3 official Prisma5.17
resolves and final status. All7 literal SQL checksums match; all4 original full
ledger rows and microsecond-precision raw bytes are unchanged. Independent
archive/before/final comparisons preserve65 tables/2,239 original records/two
sequences, excluding only3 validated new ledger ID/name pairs (2,242 final
records). Strict227 and446 zero-row permission operations pass; no customer/
Auth/User/Purchase fixture is created or edited. Root rehashes286 captured files,
all5 backup inputs remain unchanged and the owned container is confirmed absent.
Independent acceptance checks59 targeted captures, incremental IDs/acknowledgements,
raw originals, data, sequences and permission outputs. The owner-only durable
352-file/4,023,885-byte selected checkpoint excludes customer COPY, raw ledger IDs,
credentials and enabled approvals. Offline history reconciliation is complete;
current production compatibility, unknown source extension privileges, general
schema drift and clean migration bootstrap remain unproved.
[Scope and retained diagnostics](payment-currency.md#historical-sql-source-and-bookkeeping).
