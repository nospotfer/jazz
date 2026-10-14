# Separate Supabase preview

Created 2026-10-13 within the owner's authorized nonproduction scope. This is
not a customer-database clone or a production repair. Preview work changed no
production resource, plan, domain, key or payment configuration. The separately
approved customer recovery/rollback is documented in [Supabase](supabase.md).

Latest frontend: exact application source `57f5de1` freshly built/sealed with
Unix19/HTTPS11 checks. Its read-only drawer correction is verified and closed; retained diagnostics are in the
[current checkpoint](review-status.md#mobile-drawer-recovery-and-recorded-payment-amounts).
The separate9bd native browser scope actually saves two notes, watches two clips
and completes two quizzes24answers for one new synthetic actor; original-four
full rows remain unchanged. No customer-database clone or Dodo purchase is
inferred. Earlier e32 public/media/PDF/certificate scopes stay historical.

## Identity and capacity

| Item | Verified value |
| --- | --- |
| Project | Jazz-LMS-Maintenance-Preview, `tvmhuacxctdgmejziaxg` |
| Organization / plan | Neurofactory Org, `iotxifqyrryoidgagdxi`, Free |
| Region / health | eu-west-1, ACTIVE_HEALTHY |
| Capacity preflight | One accessible organization, one matching Owner, no other members; initial project list contains only the inactive customer project, with no next page |
| Reserved capacity | One active preview plus one slot for customer-project resume; no paid branch, add-on, upgrade or compute-size request |
| Customer project | `feavujcllgbzlvdvkkxx` is INACTIVE again after separately approved recovery/export/unsafe-state rollback; no customer archive is in this preview |

Free permits two active projects across the organizations where an account is
Owner/Admin; paused projects do not count. The complete observed membership and
project inventory, not just a single project's state, supported this creation.
See [billing scope](https://supabase.com/docs/guides/platform/billing-on-supabase)
and [quota rules](https://supabase.com/docs/guides/platform/billing-faq).

All private provisioning tools pin the new project ref, name and organization,
reject both customer and legacy refs, and validate the actual destination before
mutation. Credentials and generated passwords are stored outside Git, with
mode 600 files in a mode 700 directory. Do not copy them into repository env
files, commands, reports or shared previews.

## Schema, access and fixtures

The empty preview schema was verified before applying the current Prisma
datamodel, explicit messaging schema and scoped grant/RLS scripts in one guarded
transaction. Legacy migration history and seeds were not replayed. There are
23 LMS tables, two messaging tables and five enums. All 25 table owners are
postgres, RLS is enabled, FORCE RLS is off, browser/PUBLIC effective grants are
zero, and the trusted postgres connection retains CRUD on all 25 tables.
Auth/Storage metadata was unchanged by the application-schema transaction.

Actual project-bound Prisma CRUD/messaging round-trips succeeded and were rolled
back with zero probe rows remaining. Anonymous REST reads were denied with
HTTP 401 / SQL 42501. After fixture creation, authenticated ordinary-user REST
samples were denied with HTTP 403 / SQL 42501. Management SQL in read-only mode
uses supabase_read_only_user; this is not the application's runtime identity.

Synthetic fixtures contain four confirmed Auth/app users (free, full-course
buyer, administrator and historical lesson buyer), one course, 15 lessons,
60 generated PDFs across four languages, 180 questions and 900 options. The
buyer has one fixture course entitlement, the historical buyer one lesson-2
entitlement, and five progress rows were present at bootstrap. These are test entitlements,
not Dodo payments: the payment-event ledger is empty. No customer records or
real PDF content were copied. Existing reviewed Mux references/signing can be
used for controlled read-only playback; no Mux resources were created or changed.

Native confirmed-user password login succeeds. Signup is disabled; Google and
custom SMTP are off. Auth allows only six exact loopback callback/reset URLs
for port 3012. Account creation used the admin API with confirmation and no
invite, OTP or recovery mail. No customer or test-recipient email was sent.

## Application and browser evidence

The Git-visible application initially at source checkpoint `835d22c` was copied to a
private directory without any repository `.env`, CSV, Vercel link or browser
artifact. It runs on **127.0.0.1:3012**, using only this preview's Auth/database/
storage credentials. Its launcher rejects unexpected targets and environment
files. Analytics, replay, Resend, Dodo and synthetic checkout are disabled;
the existing disposable-loopback database guard was not bypassed for a remote
database. Logs remain private. The initial homepage returns HTTP 200.

Actual cloud-backend browser checks pass **29/29**, with zero uncaught client
errors and zero application 5xx responses. Four native password grants produce
real server-cookie sessions. Free paid-page/media/PDF denial and first-lesson
access pass; buyer full access, actual Mux decoding/time advancement, native
same-origin PDF viewing and all four language files pass. Historical lesson 2
works while lesson 3 is denied. Administrator page/API/private-PDF access works;
all ordinary roles are denied administration. Navigation/profile controls work
at 320/390 × 740 with no overflow/clipping and 44px touch targets.

Five dashboard auto-reconciliation POSTs were intentionally intercepted before
the app server. Payment reconciliation is excluded from this no-payment browser
run and remains unverified against Dodo. Optional Spotify/cast reads were also
excluded. No new accounts, payments, messages or provider changes were made by
the browser harness; no screenshots, traces, videos or saved sessions captured.

The initial diagnostic run had timing/frame/CDN allowlist mistakes in the private
harness and was interrupted; it was not a release verdict. The corrected final
run uses the strict-CA runtime, waits hydration/streamed redirects, allows owned
Mux read-only media and initializes language/theme only in the top frame. The
result above is the completed run, not a partial or mocked measurement. Later
notes/quiz repairs at source `85f4e12` were fully synchronized: all 235 runtime
source files independently match the reviewed checkout; environment isolation
and strict CA verification are unchanged.

A separate compatibility run with this project's existing publishable/secret
keys passes **20/20 overlapping checks**. All four fresh Auth identities match
their server-cookie sessions; 17 browser Auth API headers use only the
publishable key. Buyer, historical-buyer and administrator private PDFs return
valid bytes through the server SDK's secret key. Paid-content and administrator
denials remain enforced. No keys were created, rotated or revoked. These checks
overlap the 29-case run and are not an additional unique regression total;
unchanged playback and mobile layout were not rerun. Six automatic reconciliation
requests were intercepted, with no unexpected mutations, client errors or app
5xx responses. Development supplies no-store/must-revalidate PDF headers;
production cache headers remain unverified.

## Learning and note recovery follow-up

The separate actual cloud learning continuation passes **26/26** checks. The
buyer completed all 15 lessons and PLATINUM quizzes through normal application
requests; 16 completed attempts / 192 answers include a second class-2 GOLD
attempt (11/12, rounded 92%) while retaining the best PLATINUM summary. SUPREME,
15/15 profile completion, full-course eligibility and the actual A4 vector
certificate download pass. Pending-attempt resume, immutable answer replacement
409 and final-answer idempotency are verified. These overlap earlier evidence
and are not added to its counts. No progress/award was fabricated with direct SQL.

The initial diagnostic produced a real quiz-start P2028 connection-acquisition
timeout; three dependent harness checks also failed. Two bounded transaction
waits are fixed in source and real single-connection PostgreSQL regressions.
That interrupted diagnostic remains distinct from the completed continuation.

A native buyer→historical-user account switch reproduced an unowned local note
leak and normal autosave re-authoring before the fix. Owned draft namespaces,
initial-session gating, expected-actor API checks and canceled stale requests now
prevent importing that cache. The diagnostic synthetic note is preserved.
The first post-fix logic run recorded 11 checks but remained incomplete: the
dashboard purchase overlay blocked manual saving, and response-waiter cleanup
needed correction. Programmatic edits behind that overlay did not prove usability.

After the exact protected notes route exemption, final **19/19** pointer/privacy/
recovery checks pass with four fresh native sessions and no additional logout.
Free-first and historical purchased notes accept ordinary clicks/focus; free paid
notes still return API403 and a locked-page redirect. Stale expected-user GET/PUT
return 409 and cross-student reads return 403. One deliberately intercepted
same-origin PUT500 proves recovery logic only: its owned dirty draft survives
reload over an older actual server note with zero hydration PUTs. An ordinary
Save draft click then receives actual API200; clearing all four owned cache keys
and reloading proves server persistence. The buyer's prior note hash is unchanged.
No forced clicks, overlay removal, purchase changes, mail or provider transactions.

The independent final read-only snapshot confirms buyer2/free1/legacy1/admin0
note rows, the same 15 completed lessons / 16 attempts / 192 answers / 15 PLATINUM
summaries, exact original purchase fields and zero payment/voucher/discount/
messaging activity. The final browser run intercepted nine automatic payment
reconciliation POSTs, with no client errors or actual application 5xx. Original
29- and 20-check report hashes remain unchanged; preserve their distinct scopes.

These loopback reports do not establish HTTPS behavior. The separate completed
HTTPS checkpoint below verifies the production-built frontend and native secure
sessions. Google OAuth, SMTP delivery and real Dodo sandbox checkout/webhooks/
refunds remain unverified. The protected GitHub Vercel preview belongs to an
unreconciled account scope. The owner selected a zero-cost budget; the temporary
tunnel is not stable production hosting. [Hosting decision](vercel.md#concrete-commercial-hosting-decision).

Dodo test and live API resources/keys are separate, but business profile,
verification and bank settings are shared. Test mode can send real emails;
do not treat a test-mode label as approval to change shared settings or message
recipients. A private test key and one test product are now verified, while the
runtime remains payment-disabled and controlled notification/delivery review is
still needed. [Sandbox preparation](dodo.md#new-test-mode-checkpoint).
See [Dodo mode boundaries](https://docs.dodopayments.com/miscellaneous/test-mode-vs-live-mode).

## Free HTTPS frontend checkpoint

The owner chose zero new hosting spend. A free temporary Cloudflare Quick Tunnel
fronts a separate **production-built** app on loopback port 3014 through a private
Basic Auth gate on port 3015. The existing port 3012 frontend is not exposed or
restarted. Source `85f4e12` matches 255 application/schema/config hashes. The random
HTTPS origin was learned while the gate was closed, then compiled into a fresh
build; the earlier offline-placeholder build was not reused. Actual parent/child
runtime checks confirm modern synthetic keys, all three exact-project strict-CA
URLs, loopback-only bindings and no server credential bytes in browser artifacts.

The external gate starts closed, expires after two hours, strips Basic before
Next, restricts fixture operations and requires the exact host/origin. It blocks
payment/mail/registration/recovery/cron/dev mutations; webhook bypass remains
disabled. Its 59 in-process preparation checks (47 gate / 7 environment / 5 browser-credential
cases) are distinct from actual HTTPS customer tests. Basic browser credentials
are bound only to this origin, never global headers. Read-only existing Mux
signer/playback is reused; management keys stay empty.

Actual HTTPS browser verification passes **44/44 unique checks**, recorded
separately under `/tmp/jazz-maintenance/https-preview-evidence/`. Four native
actors cover free, full-course, historical-lesson and administrator access with
secure server-cookie sessions. Actual signed video decodes, advances and pauses;
native PDF viewing fits 320/390px viewports without overflow. A normal certificate
button click downloads the valid 862,196-byte A4 vector PDF; completed profile,
15 PLATINUM summaries and SUPREME eligibility agree with persisted learning.

Attempt accounting remains explicit: the initial run passed 39/41; the corrected
continuation passed 14/14, including nine overlapping checks. Thus 55 attempts /
53 passed attempts / two retained diagnostics yield 44 distinct verified checks.
The initial media allowlist missed one observed Mux chunk host; only that exact
host was added, and a fresh document proved playback. A React-internal hydration
probe timed out; the later native pointer download is the certificate evidence.
Neither diagnostic is erased or counted as a product defect.

All browsers closed before an independent strict-CA, read-only database check
at 16:27 UTC. It matches the previous final snapshot: buyer/free/historical/admin
notes are 2/1/1/0; buyer learning remains 15 completed lessons, 16 attempts,
192 answers and 15 PLATINUM summaries. Exact purchases and historical ownership
are unchanged; payment/voucher/discount/messaging records remain zero and the
fixture price remains 80. Five normal native session synchronizations were the
only app writes. Seventeen automatic reconciliation requests were intercepted
before the backend; no learning writes, client errors or app 5xx occurred.

This proves the guarded HTTPS frontend, not Vercel runtime, Dodo delivery,
registration/recovery, Google OAuth or SMTP. The two-hour gate/tunnel deadline
is **2026-10-13 17:59:42 UTC**; access details stay private. The preview is
temporary and requires a fresh reviewed build/origin if restarted.

No account signup, paid plan, domain/DNS or production change was made. Quick
Tunnels are temporary testing infrastructure; the hostname and process deadline
are not stable production hosting. Stable free hosting/account/domain control
and any production move remain a separate review.
[Platform limits](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/).

## Private evidence and operation

### Current diagnostics source HTTPS follow-up

Source `27d7b4c` adds the bounded diagnostic privacy repair after source85's
44-check report. Its new production-built frontend uses the same protected
origin/deadline, exact 523-file committed archive and 256 application/schema/
config hashes. The earlier app/build/proofs and all 75 original evidence files
are preserved. A first incomplete private copy omitted support scripts and
failed typecheck; the corrected full archive builds successfully. The gate
stayed closed until strict-CA/modern-key runtime, compiled-origin, loopback and
client-secret checks passed. This was preview preparation, not a source defect.

The separate source27 browser report passes **45/45 distinct HTTPS checks**:
four native role logins/session synchronizations, secure cookies and server
identity-bound reads, permission restrictions, real signed video, four-language
private PDFs/native viewer/mobile layouts, SUPREME profile and ordinary A4 vector
certificate download. All browsers close before the final independent snapshot.
Four normal native session synchronizations were allowed; 14 automatic payment
reconciliations were intercepted. No learning/forbidden writes, app 5xx,
uncaught client errors, key mismatches or external Basic credentials.

Do not add these 45 to the earlier 44/29/20/26/19 reports: their scopes overlap.
The current report is private under `https-preview-source27-evidence/`; the
original reports remain byte-for-byte unchanged. Payments/webhooks/mail/OAuth
remain disabled, and stable hosting/production reopening requires its separate
review. The independent strict-CA, repeatable-read, read-only comparison at
17:36 UTC matches both earlier final baselines: full learning timeline,
buyer/free/historical/admin notes 2/1/1/0, 15 completed lessons, 16 attempts,
192 answers, 15 PLATINUM summaries and exact purchases. All payment/voucher/
discount/messaging records remain zero; the fixture price remains 80.

A separate synthetic-only PDF diagnostic confirms actual page/text rendering
at desktop 1440px and mobile 320/390px. Enforced policy events identify two
Spotify frames and Mux's optional Google Cast sender script blocked in course
HTML by the restricted preview gate; there are no PDF-context violations.
Earlier substring-based labels incorrectly matched allowed `blob:`/inline
directives inside the quoted policy. Those diagnostic records are retained.
No CSP bypass/change was made; Spotify/Cast behavior remains outside this
restricted preview's verified scope. One additional normal buyer login/session
sync was allowed, with one automatic reconciliation intercepted and no learning,
payment, mail or provider-configuration writes. All 88 prior artifacts remain
byte-for-byte unchanged; do not add this diagnostic to the 45-check report.

The owned app/gate/tunnel process groups and loopback ports 3014/3015/3016 were
closed at **17:50 UTC**, before the two-hour deadline. Existing local frontends
3010/3012 and all fixture data were preserved. The private closure receipt is
`quick-tunnel-preparation/source27-preview-closure-private.json`. Restarting
requires a fresh reviewed origin/window/runtime proof; the old URL is closed.

Use `/tmp/jazz-maintenance/supabase-preview-creation-summary.json` and
`supabase-preview-database-summary.json` for sanitized provisioning checks.
Fixture summary is `supabase-preview-fixtures-summary.json`; final browser
summary/journeys/runtime-TLS proof are under `cloud-browser-evidence/`, mode 600.
The existing-key compatibility summary is under `cloud-modern-key-evidence/`;
the original 29-case report remains byte-for-byte unchanged.
Private `supabase-preview-services.env` and `supabase-preview-fixture-users.json`
contain credentials and must never be printed. The private launcher is
`launch-cloud-preview.py`; logs and PID files are in the same private directory.
This temporary fixture setup is not yet a committed general provisioning CLI.

Learning, pre-fix diagnostics, vector certificate and the stable 26/19-check
handoff are private under `cloud-learning-evidence/`. Independent final scope,
counts and purchase comparison are in `cloud-learning-postfix-final-summary.json`
and its private snapshot; no rows are deleted or reset to obtain these results.

The scoped [PDF audit](operational-scripts.md#scoped-read-only-pdf-audit) passes
against all 60 synthetic attachments: 200,304 accepted checked bytes, PDF headers
and 60 unique hashes, complete independent fixture-ID coverage across 15 lessons
and four languages. Actual read-only SQL and strict CA-bound Prisma TLS succeed.
This synthetic audit does not verify customer PDF mappings. A later archive-only
comparison independently verifies all 68 original attachment/object references,
hashes, sizes and PDF structures; all 60 class filename numbers/language labels
match. Fifteen lesson playback IDs and separate promo match the preserved Mux
inventory. That is snapshot structure/label consistency, not human semantic
review or a current production connection. Local text extraction separately
confirms the six auxiliary files without clear language filenames match their
declared EN2/FR2/PT2 languages across 15 pages; this is not translation-accuracy
proof. Original files and mapping hashes remain unchanged. The first audit attempt correctly stopped on a missing trusted CA;
verification was retained and the published CA was supplied explicitly.
The same auditor also passes with the existing opaque secret key: every
attachment fingerprint matches the legacy-key read. Opaque keys use `apikey`
only; legacy JWT keys also use Bearer authorization. This follows the
[current API-key contract](https://supabase.com/docs/guides/getting-started/api-keys)
and does not change production configuration or deactivate legacy keys.

The frontend launcher now also requires strict DB certificate verification with
that CA. Independent process-environment checks confirm all three database URL
variables target only the new project with these settings. Initial OpenSSL
system trust rejected the self-signed Supabase chain; the authoritative CA plus
hostname verification returns code 0. Preview SSL-enforcement metadata returns
`database: false`, applied successfully; this setting was not changed. Client
verification is distinct from provider rejection of all non-TLS connections.
The temporary CA file is a local runtime input. An HTTPS deployment must package
and trace a reviewed CA resource, then verify its runtime path and connection;
copying this machine's temporary file path into Vercel is not sufficient. The
actual pinned Prisma engine separately passes nine disposable TLS positive and
negative checks, including trusted-chain/wrong-hostname rejection; this does not
verify an eventual hosting artifact or production runtime. [Engine evidence](local-verification.md#separate-native-prisma-tls-verification).

Do not run legacy seeds, `db push`, broad media remapping, production migrations,
checkout simulations or local reset commands against this remote preview.
Future fixture writes must retain exact-project guards. Any fixture cleanup
must scope the recorded synthetic IDs/paths; project deletion is destructive
and requires review. Free inactivity pausing is possible; no artificial
keepalive or billing change was introduced.

## Protected native preview and contrast

Current application source `e32a3707a7ff647ebc8528798dc81df9415fa983` uses only
this independent synthetic backend, strict CA-bound database URLs and read-only
media signing. Mail, Dodo credentials, cron, tracking and legacy mutators are
disabled. A fresh locked install/configured webpack artifact matches all 548
application Git blobs and 45,766 sealed files. Both actual Next and ingress bind
owner-only Unix sockets, behind an expiring origin-bound Basic gate. The explicit
private Quick Worker exception does not change general production ingress.

Nineteen native runtime and 11 HTTPS transport checks pass. Cloudflare's specific
cache-control header is consumed at the edge; preserved CDN no-store and cache
status were checked, along with unauthorized access after an authorized asset.
Its managed robots response rewrites an origin401 to external200 retaining the
Basic challenge; authorized origin Disallow and page noindex remain verified.
No application TCP bridge, account, DNS record, service or timer was created.

Twelve public home/auth layouts at 1440/320/390 in both themes and 48 actual
computed contrast checks pass. The light-surface gold token is now #8a5b0a;
always-dark panels retain #d79b1a. Four fresh native roles verify free/buyer/
legacy/admin access; actual Mux video decoding, private four-language PDF bytes,
15/15 SUPREME profile and a valid vector A4 certificate are checked.

Reports remain distinct: primary **96/98**, guest selector diagnostic **2/2**,
native PDF completion **7/7**, full-frame visual continuation **7/7**. The initial
selector ambiguity and incomplete390-light document observation are preserved.
Completion/white pixels alone were not accepted as visible rendering. Fresh
320/390 viewport-before-navigation captures in both themes visibly show the
synthetic title/disclaimer; full-frame captures were manually inspected. Earlier
partial crops omitted that top text. Captured native document requests have no
Range or Origin; this does not characterize every possible later viewer request.

Earlier source 2058 initial **53/55**, diagnostic **3/4**, eventual guest **3/3**,
sad-document screenshots and two unclassified buyer exceptions remain immutable.
The resized loaded-desktop PDF diagnostic remains narrower than fresh-mobile
proof. Current e32 runs have zero page errors; the older exceptions remain
unclassified. Do not sum repeated or overlapping report counts.

Exactly eleven native password requests/normal session syncs occurred across the
two sources, six at e32 and five at 2058. All other mutations were blocked;
automatic reconciliation was intercepted before app dispatch. The independent
strict-CA read-only AFTER check at **23:29:43 UTC** preserves full scoped learning
row hashes, actor counts, original purchase/history, price 80 and zero ledger/
voucher/discount/thread/message rows. No learning, checkout, refund, mail or
provider configuration change occurred. Purpose-created browser credential state
was deleted and every owned browser closed.

App and temporary tunnel closed cleanly at **23:35 UTC**, before expiry. Subsequent
exact-e32 restart, forced owned-worker exit, separate-UID EACCES and final sealed
reinspection pass and close cleanly. Evidence remains private under
`/tmp/jazz-maintenance/native-preview-contrast-verification/` and
`/tmp/jazz-maintenance/native-preview-contrast-browser-evidence/`.
The old preview URL is closed; a fresh window needs new origin/expiry/runtime
verification. Google, registration/SMTP, Dodo signed transactions, stable hosting
and production runtime are still unverified. [Checkpoint](review-status.md#protected-native-preview-and-contrast).


## Fresh native learning and latest-source UI

See [exact sources, separate browser reports and independent persistence](review-status.md#native-password-navigation-and-fresh-learning).
The preview now has five synthetic accounts: the original four roles plus one
ordinary USER with an explicit fixture grant. Exact9bd normal UI persists two
notes, two completed lessons, two attempts/24answered answers and two summaries
100%PLATINUM/92%GOLD, with same-attempt resume and certificate ineligible2/15.
Original-four User/learning/entitlement hashes remain unchanged; business tables
stay empty. Browser contexts/state and both9bd temporary processes are closed.
The latercade read-only UI follow-up changes no fixture/learning/provider data;
its source16 auth/seven completion-label cases are included in1,931 normal passes.
Mobile notes entry and full new-window preservation/closure are tracked separately.


The57 correction verifies320/390 picker96px/editor225×44 hit-testing, keyboard
and route entry, with owned note hashes unchanged. Raw report12/9/3 remains
partial for scoped editor hydration and actual locale controls. All-five full
row hashes across12 models and zero business counts are unchanged. Browser
state and apps/tunnel are closed; only normal scoped synthetic avatar setup wrote
Auth metadata. No new fixture, learning, payment, mail or production write.
