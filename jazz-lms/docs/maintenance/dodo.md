# Dodo product, webhook and sandbox audit

## Latest Oct21 22:03 UTC — Billing reaches unpaid payment; SDK denied

The subsequent bounded scope verifies six nonempty billing fields and one
Continue, then exact actual payment/document readback. One SDK initialization
is NO_GO after its wrapper GET is denied; card/refund0. Normal logout,
sessions/purchases0, prior-data preservation, endpoint404 and resource closure
pass with SSH255/stale-socket cleanup disclosed. Further financial scopes are
deferred while the retained denial is reviewed and usable preview/restoration
work takes priority. [Current complete result](production-readiness.md#coupon-billing--oct21-2203-utc).

## Oct21 actual coupon quote and checkout; payment still incomplete

Application4b320b1 verifies actual one-use 10% coupon identity/limits, native
Apply80/8/72, one native checkout POST200 and two exact provider checkout GETs200
with an existing eligible controlled USER. The browser's billing fixture is
empty: name/address remain blank after the sole Continue click, no billing
transport receipt or payment ID appears, and SDK/card/refund counts remain0.
No successful coupon payment, charged amount/currency or signed fulfillment is
claimed. The distinct six-field billing composer is locally verified but has
not been exercised against Dodo.

Public webhook transport is corrected with YAML Unix ingress. An empty-payment
policy returns503 to unsigned POST; this is reachability/denial proof, not a
signature test. The endpoint is briefly retargeted within the unchanged lease.
URL-only PATCH clears `filter_types`, including during restoration, so strict
normal cleanup stops. Separate exact-owned disable with explicit filters,
delete and GET404 proves closure. Keep the failed normal-cleanup receipt.

Final read-only data verification preserves29 original fingerprints/selected
core, sessions0 and purchases0; the new coupon/alias/unpaid checkout are retained,
with alias usage0. Actual merchant calls20=root19+app1; no production mutation.
[Full evidence, closure qualifications and next action](production-readiness.md#coupon-test--oct21-2125-utc).

## Oct21 checkout discount failure handling repaired locally

Customer checkout repair now rejects an existing discount carrying a conflicting
voucher or integration tag, even when its product restriction matches. Matching
managed discounts and the legacy untagged same-product repair remain supported.
This is a narrow ownership correction, not universal campaign ownership proof.

Provider checkout errors preserve only a finite customer/global/unknown usage
scope. Personal and ambiguous rejections leave global `currentUses` unchanged;
only classified global exhaustion with a configured local cap reconciles it.
An unlimited local voucher no longer invents a redemption from a rejection.
Initial checkout 5xx responses return503 without discount repair, a second
checkout or local usage mutation. The existing same-code repair retry and
no-full-price fallback remain. Personal/unknown guidance is localized in ES/EN/
FR/PT; adjacent Spanish/Portuguese copy is corrected.

Thirteen pre-fix failures are retained separately (11 initial, two503 cases).
The repaired source passes114 targeted tests across six files, types and scoped
lint with zero errors/warnings. Independent source review reports no material
finding. Source/test hashes match the reviewed patch after integration; these
are synthetic checks, not a new provider checkout or deployed coupon journey.

The14-file source/finite review packet is retained locally under
`review-checkpoint-checkout-discount-guards-20261021`, manifest
`fa1fcd8ab4b7836cbe9c81238a0d3c89bc9fe1f602c0e7d3d9708b7563f92cae`.
It excludes credentials, customer/provider bodies and active inputs; permissions
and copy hashes pass. Retention is unencrypted and off-site recovery is unknown.
The independent source receipt is
`f5bcdbfd5f70bc232e4bcca93a888c4d052ccdc5376cc08e29315b4bc05ea038`.

Legacy untagged ownership fallback, heuristic error classification, durable
checkout idempotency, snapshot-based global-counter updates, paid voucher-term
races and remote/local partial success remain explicit follow-ups. The current
native coupon test needs a fresh artifact and bindings for this code. The
retained succeeded TEST payment and both spent refund attempts are unchanged;
no new provider, SQL, customer, payment/refund or email action occurred here.

## Latest Oct20 checkpoint: captured sandbox wallet denial

The separate fixed18:32:19.896–19:02:19.896 UTC recovery runs on the unchanged
sealedba105 artifact and existing succeeded TEST payment. It creates no actor,
checkout or card attempt. Two canonical payment/line-item pairs pass at the
required spacing, with fresh actual native/endpoint/data proofs. Its sole
additional full-refund POST returns409 with a complete privately retained77-byte
error body: `INSUFFICIENT_WALLET_FUNDS`. There is no SDK or financial retry.
The [official error reference](https://docs.dodopayments.com/api-reference/error-codes)
defines this code as wallet balance below the requested debit. This diagnoses
the new request; the earlier409 body was discarded and its cause stays unknown.

Final exact payment/line-item GETs still show succeeded, no refunds and full
USD8997 refundable. The canonical purchase remains. Four fresh three-query
read-only stages preserve all29 original fingerprints/nine prior accounts/23
prior sessions and actor sessions0. All four actual service handles exit0,
owned groups/sockets are absent, exact endpoint deletion404 passes, and full
45,831-file hashing passes18:36:42 UTC. Formal closure passes before lease expiry;
refund/access reversal remains unverified. Actual usage is16 Dodo calls:
six payment GETs/one refund POST and endpoint five GETs/one POST/two PATCHes/one
DELETE. Runtime SQL is12 read-only queries; the separate pre-runtime check is3.
Original and new durable spent reservations remain unchanged and unreusable.

The public robots GET returns200 with managed robot-policy content and is
insufficient origin proof. A separately captured unsigned POST to the exact
webhook route returns401 without creating a journal event. One diagnostic
capture stem is rejected before network access; it is not an HTTP request.
These negative checks establish reachability/denial, not signed refund delivery.

A distinct one-GET, zero-write TEST scope reads the
[balance ledger](https://docs.dodopayments.com/api-reference/balance-ledger/list-ledger-entries),
filtered and verified against this exact payment/business/USD. Its two historical
entries record credit8997 from0 to8997 and fee535 from8997 to8462. This explains
the payment's net contribution; it does not establish today's whole-account
balance or a free funding remedy. The
[refund guide](https://docs.dodopayments.com/features/transactions/refunds)
confirms the same balance requirement in TEST and recommends additional test
payments as its self-service workaround. That is outside this closed recovery
scope. The unfinished coupon journey is a separate useful integration test that
can also contribute TEST merchant balance under a fresh bounded plan; it is not
a replay allowance from the closed refund scope. Registered-email support is an
optional fallback: request a free TEST-only Dodo credit/manual adjustment
sufficient for this original refund and any refund fee, or a documented
same-payment remedy. A private concrete draft is prepared and unsent; free credit
is not guaranteed. No merchant funding write is
found in the bounded official API-index/SDK review, and waiting for settlement
is not documented to reverse the payment fee. Customer-wallet credits
are a separate API and are not proven to fund merchant refunds. No real funding,
new checkout/card, provider support message or production operation occurs.

Root evidence is `dodo-refund-recovery-execution-20261020/root-independent-final-summary.json`
under the private maintenance temporary root. Credentials/raw captures/active
inputs and the separate owner-only recovery record are excluded from published
review evidence. The old phase's `preparationOnlyTool:true` summary field is a
static library label; actual live actions above are established by real captures
and independent closure, not by that label.

The selected source/finite closure evidence, empty-target preparation and14
public wallet-contract sources are retained in
`review-checkpoint-refund-wallet-denial-20261020` under the maintenance backup
root:52 files/436,194 bytes, exact copy hashes and private permissions verified.
Manifest SHA256 is `7a154ccab2aea7ecf9b5942d2eb165f708ea7ecef56711e407f16e80a0e2ad92`.
Raw provider/DB/Auth/browser bodies, credential files, actual enabled inputs,
spent financial reservations and the populated private support draft are
excluded. The TEST key is not loaded for retention scanning. This is local
unencrypted review custody, without off-site or activation authority.

### Coupon follow-up preparation

One actual read-only isolated database inventory at18:56 UTC verifies two
existing controlled USER candidates, both confirmed/app-verified with one
identity, zero sessions and zero purchases. The course remains published at80;
there are no local10% voucher mappings. This reads no password and creates no
actor/session/payment. Historical provider10% discount metadata is expired and
its15-character code exceeds the UI's12-character local-code limit; a short
local alias can retain a separate provider code.

Two current TEST-only GET200s at21:26:21 UTC verify exact product/business/backend
linkage and one-time EUR8000 tax-exclusive product configuration. The response
provides no explicit eligibility/archived flag; GET200 is not checkout proof,
and configured price is not a final charged currency/tax promise. The historical
10% discount matches this product/business, has zero uses and one global/per-user
use, but expired on October14. It is unusable despite being unused. The two reads
create no discount, checkout, card attempt or refund. Raw provider bodies stay
private and outside review custody.

One short-code replacement TEST discount request is prepared offline with five
closed controls and has not been sent. Activation still needs fresh controlled
actor/course/data/recipient/source/origin bindings, current expiry/collision
checks, parent/IPC startup and closure evidence. Runtime must deny hidden
discount writes and a second checkout; an invalid-code branch can otherwise
attempt writes. These two preflight GETs are separate from the inclusive37-call
runtime ceiling. No refund is included in that future coupon scope.

The separate source-only coupon plan and concrete outbound fetch guard/durable
journal pass61 closed tests and five syntax checks. They limit one checkout/card,
deny hidden discount writes/checkout retries, capture provider failures privately
and preserve spent reservations across restarts. The maximum inclusive REST
budget is37 with every allowed application read enabled, not24. Actual private
worker/Next integration, fresh source/origin/actor/provider/recipient/preservation
bindings and full runtime closure remain prerequisites. No coupon/checkout/card
is created by these preparations, and no refund is part of the coupon scope.

The concrete private worker binding subsequently passes26 closed controls,
including the installed compiled Next AppRoute fetch wrapper, real durable
reservation files, stale-evidence denial and original45,831-file artifact
rehash. The concrete copied browser/controller passes29 closed cases, including
Apply/80-8-72 quote/one4-field checkout intent and inherited SDK/card/logout
controls. Initial fixture failures remain retained. Independent controller review
reruns29 cases with network transports denied. These overlapping suites prove
preparation behavior; full parent/IPC startup, fresh provider bindings, actual
coupon/payment/fulfillment and runtime closure are still required.

## Earlier Oct20 checkpoint: payment verified; first refund409 unresolved

The sealedba105 TEST payment and signed native fulfillment now pass fresh
independent readback: canonical USD89.97/tax0, one exact purchase/processed event,
all29 original fingerprints/nine prior accounts/23 sessions preserved, actor
sessions0. Both closed scopes pass complete45,831-file artifact hashing.

A separate refund-only scope creates no actor/checkout/card. Its sole full-refund
POST returns409/no refund ID; subsequent GETs show zero refunds and USD8997 still
refundable. The error body was discarded by the helper, so the cause is unknown.
All four temporary services finish0, endpoint404/socket absence pass, and the
purchase remains. Refund/access reversal is unverified; spent local/global
reservations are preserved. No retry or production change occurs. Next: bounded
failure diagnostics/provider recovery, plus independent production-hardening,
hosting and release work. [Scope and limits](dodo.md#oct20-sdk-verified-scope-details).
Earlier unpaid-only/preparation-only checkpoint statements below are historical.

## Oct20 SDK-verified scope details

Original fixed14:50:20.703–15:20:20.703 UTC scope uses sealed applicationba105
and the existing controlled USER, one checkout/Continue/SDK reload/card submission.
Actual current-frame SDK initialization/session-token APIs return200, three
public assets match source hashes and the frame reports ready. Card transport200
precedes exact TEST payment succeeded readback. Product EUR8000 tax-exclusive
and actual charged USD8997/tax0 are distinct canonical facts. The signed listener
and native processed ledger match the exact success event/payload hash/HTTP200.

Two verification-helper defects initially block formal proof: Purchase storage
uses `dodo-pay:` instead of a raw payment ID, and PostgreSQL TIMESTAMP(3) values
without an offset parse two hours early on the Madrid Node host. Three storage
predicates are corrected; the query projects createdAt/processedAt and compares
ledger bounds explicitly in UTC. Original source/raw diagnostics/failed receipt
are retained. Eight focused storage/UTC groups pass, including separate real
UTC/Madrid Node processes; these are offline controls. Actual15:35:41.922 fresh
three read_only SELECT201s then pass all29 original fingerprints/nine prior
accounts/23 sessions, current10 accounts/1,517 public rows, exact canonical
purchase1/event1 and actor sessions0. The current snapshot timestamp remains
actual; a separate historical evidence cutoff grants no expired write authority.

The original scope's six actual services exit0, normal logout/profile removal and
endpoint40415:20:18.867/socket absence pass. Independent post-closure artifact
inspection hashes45,831 entries/611 source entries/46 explicit links, verifies
permissions/Node binary/manifest and excludes only mutable .next/cache. Eight
synthetic tamper controls pass. This artifact-only check grants no startup or
lease authority and does not replace live configuration validation.

## Oct20 refund-only continuation: sole POST409, no reversal proof

The separate fixed15:39:49.546–16:09:49.546 UTC scope reuses only the exact
succeeded payment/controlled USER and unchanged sealed artifact. Zero new
actor/checkout/card/Continue/bootstrap; at most one full refund and one dedicated
TEST endpoint. Actual provider product/checkout/payment readbacks pass. Fresh
three-SELECT proofs before refund and at15:44:30.962 retain all originals and
actor sessions0, exact purchase1/payment-success-event1. The full TEST profile
is validated before startup; actual private Unix runtime19 checks pass.

The corrected Cloudflare config routes to a dedicated Unix webhook socket.
The new endpoint is created disabled, then enabled with all six intended filters
and exact metadata/readback. Public GET on the actual webhook path returns403/
empty body; invalid signature returns401/36 bytes. Cloudflare's robots.txt returns
its own200, so that path is explicitly rejected as origin proof. Private runtime
robots checks remain separate. Signed refund delivery is not established by
these negative probes.

Fourteen offline financial-scope/handler/independent negative groups and seven
runtime groups pass before activation. The sole refund operation checks fresh
canonical purchase proof, current endpoint ownership/enabled/exact filters,
policy/signer/input hashes and live Unix identity, then rechecks proof/readiness
after awaited GETs. Both local and owner-only global intent records fsync file
and directory before POST. Canonical refund money conflicts reject; absent money
stays explicitly unknown. Same-endpoint cleanup supports bounded recovery;
financial attempts do not automatically repeat.

Actual full-refund POST at15:42:04.327 returns409/no refund ID. A root observation
retains this actual latest-HTTP-pointer readback before later cleanup overwrites
that pointer; it is not presented as a captured raw HTTP response. The helper
discarded the error body, so no specific balance/account/settlement cause is
established. Exact provider payment/line-item GET200s at15:43:09.848 report
succeeded, refunds0/refund_statusNULL and one USD8997 refundable item. One spent
local/global reservation remains, no native refund event/access reversal is
claimed, and the valid paid TEST purchase is retained. The [official SDK](https://github.com/dodopayments/dodopayments-typescript#retries)
retries409 by default; this general behavior does not establish this conflict's
cause or renew the closed scope's financial allowance. This helper uses direct
fetch and performs no such retry.

The same owned endpoint is disabled/deleted with independent404; all four actual
service handles finish0, process groups0 and listener socket absence pass. Complete
45,831-file artifact hashing passes15:45:45.111. The original lease is unchanged
and this scope closes early. A separate0600 recovery record and durable spent
reservation are documented in root AGENTS; they stay outside selected review
evidence and grant no autoload/role/session/activation/retry authority. No provider
key is rotated, funds added, real charge/refund, paid upgrade or production change
occurs. Next is bounded private failure capture and a concrete recovery plan for
this same409 attempt; continue independent production readiness work meanwhile.

Updated2026-10-20. Latest scope: **CLOSED_REFUND_HTTP_409_PAYMENT_REMAINS_SUCCEEDED**.
The earlier unpaid scopes below remain historical; their spent ledgers are preserved.
The owner has continuing authorization for fresh bounded isolated
work under the [root contract](../../../AGENTS.md); closed action budgets are
not renewed. Zero-cost hosting and unreleased production limits remain.

## Paid/refund-conflict evidence custody

Selected147 source/finite evidence files (860,547 bytes) are retained under the
maintenance backup root in
`review-checkpoint-dodo-paid-refund-conflict-ba105-20261020`, manifest
`b59e8d99b96e9ca8872fd24b110f166f4d0135e1cd84c3aa937f196c2e72cab9`.
Every source/copy rehash matches; exact scanning finds zero matches for15 actual-
used secret values and11 private URLs. Files0600/directories0700 are verified.
Historical frozen manifests remain historical; current helper changes and
original pre-fix sources have separate bytes/hashes. Raw provider/DB/mail/browser
state, enabled plans/configuration, credentials and recovery records are excluded.
This local unencrypted package grants no activation/financial authority and does
not establish off-site recovery. Separate private recovery/spent global intent
remain owner-only. No source/evidence cleanup deletes the valid paid TEST purchase.

## Oct20 settled document: UI card action spent, transport unverified

Run `jazz-dodo-settled-document-20261020` uses actualba105/45,831 under the fixed
12:24:22.078–12:54:22.078 UTC lease and closes early. Login, one new normal app
checkout, two manual billing-fill POST200s and one Continue POST200 use the same
browser/profile and one password-token attempt. One new TEST payment remains
`requires_payment_method`. Stable session-query revision1 is observed; the exact
root document GET passes12:27:42.318, then ADOPT binds it without navigation.
Three actual card fields in a provider iframe render and Pay is disabled before typing.
No document initialization/reload is used.

One UI card marker is `RESERVED` before typing12:27:55.275, then `UI_CLICKED`
12:28:10.275 after its15-second window. The exact GET is12.957 seconds old at
reservation. This action is spent and is not retried. `cardTransportReceipts: []`
means no guard-admitted write response was observed; it does **not** prove zero
actual requests or zero provider acceptance. The last exact provider GET after
all services close still reads `requires_payment_method` at12:30:47.215. No
positive signed journal/app purchase/refund is verified. Pre-card SDK bootstrap
POST denials may affect readiness, but the cause is unproven; the first16 global
denials cannot establish what happened during the card phase.

Browser92 blocks/93 console errors remain incompletely attributed, despite zero
command/observation failures. Normal UI logout/profile removal/browser terminal0
pass12:29:09.607. Independent three read-only SELECT201s pass12:30:07.133,
preserving25 public tables/29 original fingerprints/nine prior accounts/23
sessions/refresh tokens/ledger; current10 Auth+10app accounts/1,515 rows and
confirmedUSER/identity1/sessions0/purchases0. Preserve the raw helper label
`STRICT_NO_CARD`: it is misleading for this run. The root interpretation receipt
qualifies it as strict unchanged-data preservation with an unpaid provider
snapshot; it cannot establish absence of the spent UI card action. The three
data queries remain valid preservation evidence.

All five service sessions finish terminal0, socket absent/Cloudflare group0.
Exact endpoint GET404 passes12:31:10.343 and full45,831-file seal passes
12:31:15.403. Finite evidence is under
`/tmp/jazz-maintenance/dodo-settled-document-20261020`. Selected retention passes
64 files/412,746 bytes, exact source/copy rehash and zero actual-used secret/
private provider URL/query matches at
`/home/gabriel/backups/culturadeljazz-maintenance/review-checkpoint-dodo-settled-document-ba105-20261020`,
manifest `fd0c1aff61d0871010d8016c1f40f14aa6316734f5580ace807139da5213d337`.
Files0600/root0700; raw provider/DB/mail/browser state, enabled inputs,
credentials and private recovery excluded. Local/unencrypted, not off-site.

The selected package retains both the agent-original handoff helper and actual
corrected helper, the original frozen manifest and the root final review. The
agent manifest `6a142b30…` binds the old helper; the actual corrected helper is
`d4f8504b…`, explicitly recorded separately. Browser/document/sync hashes match
the reviewed code. The71 synthetic tests/five transfer checks/24 syntax checks/
16 barriers/two embedded-syntax checks are offline preparation evidence only.
Separate0600 `native-preview-configuration/dodo-unpaid-settled-document-20261020-private.json`
under the backup root preserves observation/provider receipts/three spent
markers and the first reserved snapshot, without API key/password or automatic
loading/activation/second-card authority. Older records remain preserved.

The financial-test loop is **stopped**. Next work is offline per-phase admission,
denial, failure and response counts plus SDK-readiness review. No new financial
scope is activated; payment acceptance, signed fulfillment, refund, production
release and the full maintenance goal remain incomplete.

## Offline browser transport diagnostics

The reusable [in-memory recorder](../../scripts/native/browser-transport-diagnostics.mjs)
addresses the global-sample exhaustion found above. It has separate `startup`,
`fill`, `continue`, `init`, `card` and `logout` buckets. Each has a bounded sample
list and counters that continue after that list fills. Bounded request tracking
also reports overflow and unmatched events rather than claiming complete
correlation. Snapshots retain owned enums, booleans, bounded elapsed timestamps
and HTTP status numbers; raw URLs, queries, bodies, credentials, card values,
provider prose and request handles are excluded. It reads no ambient inputs and
performs no I/O.

A future browser adapter must record an attempt before its guard, record a
denial only when that guard rejects it, and record admission immediately before
transport. Report transport failures after admission separately; a rejected
guard's browser abort must not become another transport failure. Use the opaque
in-memory handle for response, request-finished and request-failed events. A
response belongs to its original admission phase even after the UI moves on;
close each policy window explicitly so late events remain distinguishable.
Release completed/failed tracking entries and inspect overflow/unmatched counts
before interpreting an empty response list. The helper's inline example and
[regressions](../../tests/security/native-browser-transport-diagnostics.test.ts)
document this lifecycle.

This recorder does not change a request allowlist, arm a policy window, launch a
browser or authorize another checkout/card action. It is not yet wired into a
live test adapter and cannot reconstruct the missing historical card trace.
SDK readiness still needs provider-specific evidence from the same document and
browser: rendering fields or clicking Pay alone is insufficient. Preserve the
closed scope, first reservation, final marker and qualified closure receipt.
The financial-test loop remains stopped.

All 13 focused regressions pass after root review, along with strict checkJs/
TypeScript using the project's ESNext/bundler module mode, touched-file lint and
Node syntax checking. These are synthetic recorder checks, not a new browser or
provider journey. The Vite configuration-loader compatibility warning remains.

### Preparation-only controller adapter

The [adapter](../../scripts/native/browser-transport-adapter.mjs) connects browser
request objects to that recorder through a private WeakMap and an explicitly
injected elapsed clock. It preserves synchronous results, native Promise
identity and the original error while observing returned Promise rejections.
Admission remains an explicit call after policy checks. Deliberate guard aborts,
duplicate terminal callbacks, clock faults and lost correlations remain
separate finite counters; no request data or error prose enters the snapshot.

A new private copy of the actual closed controller now uses these hooks at its
route, native-forwarding, response, failure, finish and phase boundaries. The
native admission hook follows the existing socket/body guards. Its command line
is unconditionally preparation-only, including `--activate`; no browser or
service can be started through it. Original controller/common/core bytes and
spent ledgers are unchanged. The copy is under
`/tmp/jazz-maintenance/dodo-transport-diagnostics-preparation-20261020` and has
no private inputs or activation plan.

Fifteen adapter plus thirteen recorder regressions pass. A root review regression
first reproduces a missed late response for a read admitted after a policy-window
close and before logout; phase exit now records a final close. `closedAtMs` is
the latest close, while earlier samples retain the late flags observed at their
own timestamps. Ten separate fake-transport tests exercise the copied actual
handlers, unchanged guard/reservation order, internal native guards, asynchronous
rejection handling and blocked command-line activation. Strict types, touched-file
lint and syntax also pass. These tests establish instrumentation behavior only;
they do not recover the historical trace or prove SDK readiness, accepted payment,
signed fulfillment or public HTTPS. No live adapter window is activated and the
financial-test loop remains stopped.

### Deployed hosted SDK contract and scoped-secret repair

Ten anonymous public GETs on Oct20 follow the checkout layout's actual SDK URL
and its static dependencies, without cookies, account credentials, checkout
session URLs, redirects or script execution. The deployed TEST wrapper is
[SDK1.1.0](https://sdk-v2.custom.hs.dodopayments.com/1.1.0/sdk.js), SHA256
`38b7d0e8690a93298add587a351dfb5454ed939241fc4e33740bf534e74273f1`.
Its [normal child application](https://sdk-v2.custom.hs.dodopayments.com/1.1.0/assets/app-DZzLfsx-.js)
has SHA256 `2c8f36f941d00978b02add25ec4db6cd92108dcf393c4c431366b569ead71e09`.
These are current public source observations, not a reconstruction of the closed
checkout's requests or proof that its iframe used this exact version.

The wrapper checks message origin, iframe window, the
`__dodo_payments_msg__` marker, and string nonce/type. `READY` connects the bridge
and releases queued messages. Its15-second timeout discards an unconnected
queue without emitting a load error in that timer. `ELEMENT_READY` becomes the
element's public `ready` event; `ERROR` becomes `loaderror`. The child registers
its `INIT` handler before sending bridge `READY`, then initializes payment
methods. It catches some API failures, can fall back to a card choice and still
send `ELEMENT_READY`. No explicit `ERROR` sender is identified in that normal
child asset. Neither readiness nor absence of a load error establishes healthy
initialization, payment acceptance or signed fulfillment.

The deployed child constructs both `POST /payments/session_tokens` and
`POST /payments/{paymentId}/confirm` with `client_secret`. Its secret format is a
payment ID followed by `_secret_` and a nonempty alphanumeric suffix. A synthetic
regression against the actual closed guard reproduces a defect: scanning that
entire secret as a `pay_` identifier rejects the bound payment's own secret.
This affects a real request shape but does not establish the historical failure
cause.

A new code-only preparation copy under
`/tmp/jazz-maintenance/dodo-sdk-compatibility-preparation-20261020` repairs the
comparison. Only a complete `client_secret` field/query value can receive the
exact bound payment's suffix exception. Other IDs, foreign/malformed secrets,
decoded foreign IDs and bounded-input failures remain rejected. Independent
review finds and repairs a long-secret blind spot inherited from the old
124-character scan limit. Host, root-frame, document and armed-phase checks
remain in force. Closed/frozen sources and all spent ledgers are preserved;
the copied CLI remains unconditionally preparation-only.

The [passive init function](../../scripts/native/hosted-sdk-readiness.mjs) observes
only these three protocol signals from the exact TEST origin and a current
direct iframe window. It retains bounded counts/relative-time samples and drops
message payloads, nonce, URLs and error prose. It changes no SDK event, request,
storage or DOM. Counts describe document-wide history; they do not bind a later
current iframe. A future controller needs a pre-initialization baseline and
independent iframe/document continuity. Eighteen serialized-jsdom event checks
pass; combined with the recorder/adapter, 46 focused tests pass. Full types and
touched-file lint pass. These synthetic events are not an actual SDK journey.

The new private copy installs that observer before navigation and captures only
validated finite snapshots on status and before leaving the provider page.
Capture has a500ms deadline, rejects a document change while awaiting evaluation
and clears its current flag before navigation/closure while preserving history.
An independent review catches the initially stale post-logout flag; the actual
logout/close handlers and navigation race are covered by regressions. Twenty-three offline checks pass:
10 copied-handler, seven identifier-scope and six capture cases. Four of the
initial five scope tests fail against the unmodified guard, including the own
secret case. Independent read-only review covers the repaired scope; the
closed controller/frozen instrumentation copy remain unchanged.

The separate preparation plan grants no lease or action allowance. A future
scope must use one fresh checkout and the existing controlled USER, with a new
fixed source/origin/gate and ledger. Before reserving its single card action,
verify the actual current document/provider binding, source assets, both
readiness stages and separate successful initialization responses/transport
results. Stop on unresolved initialization failures. Never replay a closed
checkout or reset its spent action. Public source inspection and offline tests
do not satisfy these actual-runtime prerequisites.

## Oct20 SPA scope: transient observation does not establish a card journey

This earlier closed scope remains separate from the settled-document result above.

Run `jazz-dodo-fresh-spa-20261020` uses actualba105/45,831 under the fixed
11:59:34.199–12:29:34.199 UTC lease and closes early. The same existing USER/
browser profile makes one password-token attempt, one new normal app checkout
and one new unpaid TEST payment (`requires_payment_method`). The first dashboard
wait times out after identity verification; the retained browser subsequently
creates checkout12:01:42.138820. Two manual-fill POST200s and one Continue
POST200 response at12:02:49.944 are observed; payment creation is12:02:49.653517.
One checkout/Continue
reservation each is spent. No new actor, card attempt or refund occurs.

The observer retains the first actual SPA URL at12:02:50.630, containing only
the initial `from` query. A later URL change triggers `CURRENT_OBSERVATION_CHANGED`;
no later-current-URL receipt is captured. One root exact provider-document GET
passes12:03:07.266 and matches the original observed opaque path, checkout,
payment and API facts. This proves that document read, not a stable later browser
binding. One same-profile initialization at12:03:46.925 uses the first observed
URL verbatim; another SPA query change leads to `DODO_OPEN_OWN_PAYMENT_DOCUMENT`.
The first raw observation remains private and unchanged. No provider/application
defect or completed financial journey is established.

Browser diagnostics are106 blocked requests/107 console errors/three command
failures/one observation failure, with attribution incomplete. Normal logout,
profile deletion and browser terminal0 pass12:04:39.397. The initial negative
probe returns400 after omitting the required forwarding header; retain it
separately from the corrected actual401. Runtime19/private-SSH11/public DNS3/
TLS/absent-origin502 remain bounded setup checks, not positive signed delivery.

Independent closure PASS12:05:05.166 uses three read-only SELECT201s and
preserves25 public tables/29 original fingerprints, nine prior accounts/23
sessions/refresh tokens/ledger; current10 Auth+10app accounts/1,515 public rows
and confirmedUSER/identity1/sessions0/purchases0. All five service sessions
finish terminal0, socket absent/owned Cloudflare group0. Exact endpoint GET404
passes12:05:44.413 and full45,831-file seal passes12:05:49.555. Finite evidence
is under `/tmp/jazz-maintenance/dodo-fresh-spa-20261020`.

Selected retention passes59 files/389,335 bytes, exact source/copy rehash and
zero actual-used secret/private provider URL/query matches at
`/home/gabriel/backups/culturadeljazz-maintenance/review-checkpoint-dodo-fresh-spa-ba105-20261020`,
manifest `f1212ae03b2015a2be97a1984fb4b7e49ff3f91ee46d02f4b9b1564171fd450c`.
Files0600/root0700; raw provider/DB/mail data, browser state, enabled inputs,
credentials and recovery files excluded. Retention is local/unencrypted, not
off-site. Four finite source summaries are tightened to0600 before selection,
without byte changes. Separate0600
`native-preview-configuration/dodo-unpaid-fresh-spa-20261020-private.json` under
the backup root preserves captures/receipts/three spent markers without API key/
password or autoload/role/session/activation authority. Older unpaid records stay
preserved.

The then-prepared settled-document scope subsequently runs and closes above.
Its UI card action is spent; earlier closed ledgers and raw observations remain
preserved. No live financial success or authority to repeat that action follows.

## Oct20 fresh session: unpaid payment and SPA observation limit

This earlier closed scope remains separate from the subsequent SPA scope above.

Run `jazz-dodo-fresh-session-20261020` uses actualba105/45,831 under the fixed
11:42:53.694–12:12:53.694 UTC lease and closes early. It creates one new normal
application checkout and one new unpaid TEST payment, `requires_payment_method`,
canonical EUR9680 total minor units (€96.80), tax1680 (€16.80). One checkout and
one billing-Continue reservation are spent; two manual billing-fill POST200s
and one Continue POST200 are observed. No new actor, card attempt or refund
occurs; older unpaid records and spent ledgers are preserved.

The same browser profile covers checkout, billing and Continue. Its URL moves
within the same TEST origin to one opaque path with a session query through SPA
state, without an HTTP document navigation. No observed document raw receipt is
created. The document producer fails before its provider GET or attempt
reservation, so it makes zero GET attempts. This establishes a controller
observation failure; it does not establish an application/provider defect or a
completed payment. Browser diagnostics record158 blocked requests/162 console
errors/zero command failures, with attribution incomplete. Normal logout and
profile removal pass at11:51:57.832 UTC.

Independent closure PASS11:56:41.195 preserves25 public tables/29 original
fingerprints, nine prior accounts/23 sessions/refresh tokens/ledger; current10
Auth+10app accounts/1,515 public rows and confirmedUSER/identity1/sessions0/
purchases0. All five service sessions and the browser finish terminal0; profile/
socket are absent and owned Cloudflare group members0. Exact endpoint GET404
passes11:57:36.728 and the full45,831-file seal passes11:57:55.530. Evidence is
under `/tmp/jazz-maintenance/dodo-fresh-session-20261020`.

Selected retention passes56 files/376,422 bytes, exact source/copy rehash and
zero actual-used secret/private provider URL matches at
`/home/gabriel/backups/culturadeljazz-maintenance/review-checkpoint-dodo-fresh-session-ba105-20261020`,
manifest `57e3140682cdc0aca9d7e00009c6d30a4984e9574fa2f3fc3fc37964fff04c56`.
All retained files are0600 under0700; raw provider/DB/mail data, browser state,
enabled inputs, credentials and recovery files are excluded. Retention is local/
unencrypted, with no off-site claim. Two finite source-summary permission fixes
leave their bytes unchanged; the adjacent diagnostic is outside this package.
The separate0600 `native-preview-configuration/dodo-unpaid-fresh-session-20261020-private.json`
under the maintenance backup root preserves the plan/capture/receipt/two spent
ledgers and closure without API keys/passwords. It grants no automatic loading,
role, session or activation authority; older records and credentials remain separate.

The subsequent SPA controller's67 synthetic checks/22 syntax checks/16 barriers
remain preparation-only evidence; its later actual closed result is recorded
above. Closed ledgers stay spent; do not replay old checkout/payment links.

## Oct20 continuation: reused checkout links are rejected

This earlier closed continuation and its then-proposed next scope remain
historical; the completed fresh-session result is recorded above.

Run `jazz-dodo-baseline-continuation-20261020` uses actualba105/45,831 with the
fixed11:24:16.375–11:54:16.375 UTC lease and closes early around11:34. It creates
zero actors, checkouts or payments and submits no billing, card or refund action.
The original before-state and all six effect ledgers remain exact. The existing
payment still reads `requires_payment_method` at11:28:52.499, preserving its
original10:39:39.286317 creation time. Fresh runtime19/private-SSH11/negative401
and public DNS3/TLS/absent-origin502 are bounded setup checks only.

Both fresh browsers actually redirect to the same TEST origin's
`/status/[opaque]/link-expired` shape. Neither resumes an actually observed
redirect query, and no raw session query is reconstructed; the bare API link
is navigated without an observed session query. The first closes with normal
logout and profile deletion. The second's normal UI logout fails before any Auth POST;
its exact retained profile is used only for live Auth-user GET and one global
logout204, without password login. Independent sessions0 proof precedes matching
profile deletion. The cause beyond the observed provider rejection is unproven;
these are neither an uninterrupted payment journey nor a general provider-health
verdict.

This supersedes the earlier proposal to resume the old checkout/unpaid payment.
The current primary [checkout-session contract](https://docs.dodopayments.com/developer-resources/checkout-session)
and [integration guide](https://docs.dodopayments.com/developer-resources/integration-guide) specify
that `checkout_url` is single-use and each payment attempt needs a new checkout
session. They give no equivalent resume promise for bare `payment.payment_link`
or reconstructed opaque query values. An API record/link is not browser-resume
proof. Preserve the old receipts and their timestamps; do not replay either old
link as a new checkout attempt.

Independent closure passes11:32:28.530: three read-only checks preserve25 public
tables/29 original fingerprints, all nine prior accounts/23 sessions/refresh
tokens/ledger; current10 Auth+10app accounts/1,515 public rows and the same
confirmedUSER/identity1/sessions0/purchases0. Its receipt SHA256 is
`d1ab93a392ea628f478e7a5d8d64f265671e5b3ca165c9fbe7037255779ac6df`.
All five services finish terminal0, profile/socket are absent and owned
Cloudflare group members0. Independent exact endpoint GET404 passes11:34:19.664;
the full45,831-file source seal passes11:34:24.291. Finite evidence is under
`/tmp/jazz-maintenance/dodo-baseline-continuation-20261020`.

Selected retention passes51 files/249,223 bytes, exact rehash and zero
actual-used secret/private provider URL matches at
`/home/gabriel/backups/culturadeljazz-maintenance/review-checkpoint-dodo-continuation-ba105-20261020`,
manifest `4d3f3ce80e696aabdc2e134fadabe2dd6be48d2b2b915232a7ae7e38820aacf7`.
It excludes raw provider/DB/mail data, browser state, enabled inputs, credentials
and private recovery files. Retention is local/unencrypted, with no off-site claim.

The then-prepared `/tmp/jazz-maintenance/dodo-fresh-session-20261020` scope
subsequently runs and closes as recorded above. Its single-use, same-profile and
actual-observed-query constraints remain; no bare API-link replay is permitted.
Completed payment/refund, positive signed fulfillment and production release
remain open.

## Oct20 follow-up: existing checkout creates an unpaid TEST payment

This earlier closed checkpoint retains its evidence below; its proposed reuse
continuation is superseded by the single-use finding above.

Run `jazz-dodo-baseline-followup-20261020` uses actualba105/45,831 with the
fixed10:31:06.315–11:01:06.315 UTC lease and closes early around10:59. Three fresh
read-only SQL checks verify the existing confirmed USER; no actor is recreated.
The exact owned checkout GET preserves its original10:03:12.238626 UTC creation
time; no new checkout is made. Runtime19/private-SSH11/invalid-signature401 and
the dedicated public webhook host's three-resolver DNS/TLS/actual-path502 checks
pass. The58 synthetic SDK checks are preparation evidence only.

The asynchronous controller correction now allows five actual own-host POST200s:
two initial billing fills, two manual fills and Continue5. Four older spent
Continue reservations remain preserved; only the new Continue5 is reserved.
At10:39:39.286317 UTC this creates a TEST payment with status
`requires_payment_method`: canonical EUR9680 total minor units (€96.80), tax1680
(€16.80), base€80.00. Exact GET200 matches the original checkout, cart, controlled
actor, business/brand and the payment-link path observed in the provider document.
This is an unpaid record/quote, not a completed charge, revenue, settlement or
signed fulfillment. The card marker remains absent, refunds0 and app purchases0.
Legitimate payment-path support was needed in the private controller.

The flow is interrupted across five fresh browsers: manual UI inspection closes
normally; manual-fill/Continue5 reaches a newly denied payment path and closes;
a login-only attempt closes for source coordination; an SDK GET is denied and
normal UI logout fails; the fifth attempt's own-first-party top navigation is
blocked during SDK initialization, with cause unclassified. Do not label these
application/provider failures or an error-free/uninterrupted payment journey.
For the fourth attempt, the owned profile is preserved until cleanup-only live
Auth GET verifies the exact actor and one global logout204 succeeds, without a
password login. Independent SQL confirms sessions0 and all23 original session
rows unchanged before the matching profile is deleted. The fifth reports normal
logout within15 seconds and profile removal, without a card action.

Independent11:00:27.663 UTC closure passes three read-only SELECT201s: exact25
public tables/29 original fingerprints, all nine original accounts/23 sessions/
refresh tokens/ledger preserved; current10 Auth+10app accounts/1,515 public rows,
confirmedUSER/identity1/sessions0/purchases0, existing owner SUPER_ADMIN and the
verified read-only database role/transaction. Receipt SHA256:
`773ed0fa2bb3a1095f42e242623931358c2ed69b3a0a025b941281f4320f0442`.
Only durable fixture session metadata changes; actor credentials/ID are preserved.
All services are confirmed terminal0. Exact owned endpoint GET404 at11:00:29
independently follows accepted DELETE/disable. Final resource checks find zero
owned browser/cleanup processes, no profile or SSH socket, and confirm removal
of the identified socket. Card and Continue6 markers are absent. The complete
45,831-file post-closure source seal passes at11:02:03.581 UTC. The comprehensive
receipt retains status `CLOSED_INCOMPLETE_TEST_CONTROLLER_FAILURE`.

Selected retention passes exact rehash and an actual-used credential/private
checkout, payment and document URL scan with zero matches:51 files/387,062 bytes
at `/home/gabriel/backups/culturadeljazz-maintenance/review-checkpoint-dodo-followup-ba105-20261020-v2`,
manifest SHA256
`e2450f3d3b9302c33c407bd12e4717683b8223a0267477c1d3285869bbba0466`.
It includes the actual final closure checker, with no raw provider/DB/mail data,
browser state or enabled inputs. This local, unencrypted selection is not an
off-site backup. The separate0600
`native-preview-configuration/dodo-unpaid-test-checkout-20261020-private.json`
under the same backup root preserves the original checkout, unpaid payment/link
receipts and five spent UI markers. It contains no API key/password, is excluded
from review evidence and grants no automatic loading, role, session or activation
authority. The separate controlled-USER credential fixture remains preserved.

Finite working evidence is under
`/tmp/jazz-maintenance/dodo-baseline-followup-20261020`. The then-proposed reuse
of the already-existing unpaid payment/original checkout is historical and
superseded by the closed continuation above. Dashboard email hint remains unverified account
membership/settings, not an approval block. Completed card/payment, positive
signed fulfillment, return/reconciliation/refund and stable production hosting
remain open. The first baseline below remains a separate historical result.

## Oct20 actual TEST checkout and closed window

The actual artifact is source
`ba105bb7fddbfec1848d9ffadcd8e6b51f12bb9b`/45,831 sealed files. Fresh TEST
product GET200, dedicated-host DNS across system/1.1.1.1/8.8.8.8 and verified TLS,
native19/private-SSH11 and actual native invalid-signature401 pass. One owned
TEST endpoint is enabled for the bounded window; its DELETE/disable command is
accepted by the guardian at10:21:09 UTC. The window expires at10:22:08 UTC.
Endpoint enablement and negative401 do not establish valid signed delivery.

Exactly one actual application TEST checkout is opened and later reopened as
the same checkout. Four billing-Continue reservations are recorded. They are
controller reservations, not four completed billing submissions or payments;
the card-attempt marker is absent. No actual completed payment, refund, signed
fulfillment, return/reconciliation or coupon/reversal journey is verified.

The first browser's selector fails before checkout click, then normal204 logout
and profile removal pass. The second browser encounters readonly-email/manual-
address controller bugs and closes normally. The third browser denies a delayed
own-checkout-host billing POST after immediately revoking its one-shot arm. That
is a controller timing bug, not an established application/provider failure.
It closes under `LEASE_GUARD` with loggedOut=true and its profile gone. Owned
remote process count is zero and the identified transport socket is removed.
Native/SSH/listener/Cloudflare resources expire/close with terminal0; complete
45,831-file post-closure source inspection passes. Browser diagnostics remain
scoped controller evidence, not a general provider-health result.

Independent final row/session checks preserve29 original table fingerprints,
all nine original accounts/23 sessions/refresh tokens and the webhook ledger;
current totals are10 Auth/app accounts and1,515 public rows. The new controlled
actor is confirmed USER with one identity, zero sessions and zero purchases.
Independent closure passes at10:26:40.651 UTC. Preserve the initial helper FAIL:
it unnecessarily expected database role `postgres`. One additional read-only
classification SELECT confirms `supabase_read_only_user`, database `postgres`
and transaction_read_only=on. The three original read-only data SELECTs are not
repeated; all four responses are201, with zero app/database writes. The helper
assumption is not a provider/application failure. The final receipt SHA256 is
`bf5c6930a08791b38096c052682cd5e6de6abc4d4e9dee42de2968ac28e7ac45`.
Durable fixture closure metadata is updated; the same actor ID/password are
preserved for any separately bounded follow-up.

Finite evidence is under
`/tmp/jazz-maintenance/dodo-baseline-actual-20261020`, including
`independent-closure-readback-summary.json`,
`post-closure-full-source-seal-summary.json` and the scoped browser/endpoint
closure summaries. Private credentials, raw responses, checkout URLs and browser
state stay outside published evidence. The comprehensive `closed-test-summary.json`
retains the incomplete controller-failure status. Selected retention passes exact
rehash and actual-used credential/private-checkout-URL scans with zero matches:
29 files/192,091 bytes at
`/home/gabriel/backups/culturadeljazz-maintenance/review-checkpoint-dodo-baseline-ba105-20261020`,
manifest `cc1038f103d451e1f27cdfbd0d39f980f3ee03477ad13215ee1576699b7ddc59`.
It excludes raw provider/database/mail/browser data and enabled inputs; retention
is local/unencrypted, with no off-site claim. The then-proposed fresh window reused
the original controlled actor and same checkout; later evidence above supersedes
that checkout-resume proposal. The owner identified a likely
account email, but membership/login, dashboard notifications, ownership/MFA/KYC/
payout/currency/tax settings remain unverified; this is information needed for
account review, not another approval question.

Published documentation source
`81eef3fe5efe378b54646d8612533f0f2bac7d91` has five successful exact-head
workflow runs: Quality PR/push, Secret Scan PR/push and one dynamic CodeQL run;
[run IDs and events](review-status.md). Downloaded Quality logs verify
2,628 normal passes/80 intentional skips,80 persisted passes/
one skip, types/webpack/static31-of-31 and lint0errors/22warnings; actual PR-head
CodeQL alerts0, with both exact-commit analyses bound to `refs/pull/46/head`.
CI does not extend the actual artifact's payment result or the
separate sealed3e5 registration/recovery proofs. No production deployment,
charge/refund-health or complete-integration claim follows.

## Historical Oct13 audit and TEST resource preparation

Observed 2026-10-13 using credentials recovered from authorized Vercel environment
reads. The initial live audit made eight documented GETs only. A subsequently
supplied TEST key is verified; one dedicated product and two coupons were
created in TEST mode, with a test-only product price alignment. No live resource
was written and no checkout, payment, refund, customer, key, webhook,
communication-preference change or message was performed.
Credentials and raw responses remain private outside Git.

## New test-mode checkpoint

The TEST product list and existing brand GETs return 200 and bind the same
business as live mode. The initial product inventory was empty. One one-time
digital maintenance product was created at **EUR 2990, tax-inclusive false**,
with the existing brand, no license entitlement and metadata binding the
separate synthetic Supabase project. No shared brand/profile setting changed.
The subsequent TEST webhook inventory returns 200 with zero endpoints.

An exact read-only check found the existing synthetic course price is 80 in the
app's major-unit field. Its learning/purchase fixtures are preserved; only the
dedicated TEST product was aligned to EUR8000 before coupon/checkout proof.
The original EUR2990 creation receipt remains historical. A single price-only
TEST PATCH200 and exact GET200 now verify EUR8000, tax-inclusive false, with all
nonprice fields and application rows unchanged. This is fixture preparation,
not a change to the live product or customer course pricing.

In-memory inspection of the preserved production Course COPY shows one course
with stored price 29.99 and no NULL price. The schema field has no currency;
app source interprets it as EUR major units. Under that interpretation the
live Dodo EUR29.90 base differs by EUR0.09. Customer tax/FX/settlement remains
unverified and no production price correction is authorized.

The key is held in an owner-only private file outside Git. The isolated loopback
frontend remains payment/sending-disabled; neither live nor test checkout is
enabled there yet. Private execution preparation records exact target checks,
provider payloads, fixtures and stop conditions with all execution/mail approval
flags false. The customer recipient is approved and recorded privately; actual
merchant/webhook-alert recipients need review before transactions. Existing preview purchases/learning
evidence must be preserved; fresh payment-only synthetic actors are planned.

The official CLI v3.6.2 is privately installed and publisher-checksum verified;
only version/preparation checks ran. It uses a fixed global configuration,
does not itself enforce TEST mode before relay creation, forwards business-wide
events and reserializes JSON while retaining original signature headers. The
prepared isolated profile avoids inherited live credentials, but a listener
has not been launched or proven. Never disable raw-body signature validation
to make a relay test pass. [CLI documentation](https://docs.dodopayments.com/developer-resources/sdks/cli).

Customer Test Mode Emails and merchant/team notifications are separate. Turning
off test customer emails does not establish merchant or webhook-alert suppression.
No reviewed API parameter suppresses them per checkout/refund. Live/shared
communication settings remain unchanged. [Communication preferences](https://docs.dodopayments.com/features/communication-preferences).

Rechecked2026-10-15: the documented customer switch is dashboard-only and
customer-only; team email preferences are configured per recipient. The pinned
[official SDK](https://github.com/dodopayments/dodopayments-node/tree/f38a877c6a466038097446729cb51e5f16892d3f/src/resources)
checkout/payment/refund create schemas provide no all-mail suppression field,
and its public resource index provides no merchant recipient/preferences API.
Portal `send_email` only controls portal-link mail. These checks did not access
the account or change settings.

Primary webhook documentation conflicts: the
[current guide](https://docs.dodopayments.com/developer-resources/webhooks#email-alerts)
says failing-delivery email alerts are unavailable, while the
[August5 changelog](https://docs.dodopayments.com/changelog/v1.112.0#2-a-rebuilt-webhooks-experience)
describes configurable recipients. Neither proves this account's actual settings.
Recipient/settings evidence or provider clarification remains necessary before
transactions; do not infer that alerts are absent or silently suppress shared
business notifications. No test transaction or mail was sent during this review.

The current source helper has now created and independently retrieved two
bounded TEST-only coupons: percentage10% (1000 basis points) and fixedEUR5
using the documented currency_options/default EUR row. Seven actual requests
consisted of one pinned product GET, two code-collision404 checks, two creates
and two exact discount GETs. Product restriction, business, metadata, one-use
limits, zero use count, expiry and returned amounts/shapes match. No broad list,
PATCH/delete, local voucher, customer, checkout, payment, refund or webhook call.
This proves provider acceptance of helper-generated coupon resources, not tax,
settlement or local redemption accounting. Resources and receipts are preserved.

A separate private direct-webhook exception is prepared with **110 in-process
checks** (63 raw-body/signature/receipt/duplicate cases plus 47 existing Basic
gate cases). Root reran it against source27's native verifier after checking
frozen hashes. It authenticates original bytes before scope parsing and only
forwards recorded owned TEST payment/refund receipts; completed identical
duplicates are acknowledged without a second forward, while mismatched or
uncertain deliveries stay denied. This is preparation, not provider delivery.
No exception is integrated, endpoint created or signer activated. The planned
four checkout sessions/two successes/two refunds use one fresh controlled-email
actor and two additional native-generated coupons, maximum four provider coupons
including the two completed acceptance resources. Existing learning/purchases
stay preserved. Merchant/webhook-alert recipients remain the execution gap.

## Verified live configuration

| Area | Evidence |
| --- | --- |
| API access | Live product list/detail return 200; configured product and business IDs match returned records. |
| Product | La Cultura del Jazz, one-time digital product, EUR 2990 minor units (€29.90), tax_inclusive false. |
| Pricing options | No product discount, PPP or pay-what-you-want; zero localized-price rules. These are base-price facts, not an actual customer tax/settlement breakdown. |
| Entitlements | One attached license-key entitlement; no addon/file delivery. Intended customer use needs review before cleanup. |
| Brand | Enabled, unarchived, no hold reason, matching business/product; URL uses culturadeljazz.com; support_email absent. Verification fields do not prove legal ownership, KYC or payout status. |
| Live webhook | One enabled endpoint: https://culturadeljazz.com/api/webhooks/dodo-jazzlms. |
| Event filters | Payment success/failure/processing/cancellation, refund success/failure, dispute opened/lost/won, and subscription events. |
| Signing | Retrieved webhook signing key exactly matches configured DODO_PAYMENTS_WEBHOOK_SECRET and valid standard base64 material. This does not establish actual delivery success. |

DODO_WEBHOOK_PUBLIC_URL has the same host but a different path from the active
provider webhook. That variable is unused at runtime; the provider already
targets the implemented route. Do not change a working endpoint based only on
the stale informational value.

## Verified environment isolation failures

Production and preview both select live_mode and share the live API key,
product, business and signing secret. The preview can reach live payment
resources and is unsuitable for isolated checkout tests. Development selects
test_mode but shares the same live-only key; test product-list and configured
product GETs return 401. Development has different product/business references
whose test ownership/pricing remain unverified.

Dodo documents [separate live/test credentials and resources](https://docs.dodopayments.com/miscellaneous/test-mode-vs-live-mode).
Matching TEST credentials/business/product are now verified as described above;
the existing deployed development configuration remains unrepaired. Verify a
dedicated test webhook before constructing the isolated remote preview. Review
any changes to the production-attached Vercel project's configuration separately.
Synthetic loopback checkout proves application behavior only.

The native Dodo CLI also authenticates with an API key; it does not provide a
browser OAuth session that avoids obtaining the correct test key. The existing
live key cannot establish test access. Store a supplied test key privately on
the remote machine, not in chat, CLI arguments or Git.

Test-mode isolation has limits: business profile, account/bank information and
verification are shared with live mode, while keys, products, webhooks and
transactions are mode-specific. Test mode can send real emails. Before actual
sandbox transactions, use the privately approved controlled customer recipient
and finish merchant/webhook-alert recipient review; no test email was sent. Do not
alter shared business settings as routine sandbox setup. See the same
[mode documentation](https://docs.dodopayments.com/miscellaneous/test-mode-vs-live-mode)
and [CLI authentication](https://docs.dodopayments.com/developer-resources/sdks/cli).

## Remaining verification and decisions

- Authenticate the matching business dashboard to inspect owner/member roles,
  recovery/MFA, API key permissions, KYC/payout status and delivery/error history.
- Inspect the business Adaptive Currency setting and FX/fee treatment. Product
  pricing_mode null, PPP false and zero localized rules do not prove this
  dashboard setting disabled; see [Adaptive Currency](https://docs.dodopayments.com/features/adaptive-currency).
- Reconcile the verified live €29.90 tax-exclusive product with the archived
  database course price 29.99, advertised price and guarantee/terms. The source
  interprets that database value as EUR; the stored field has no currency. Local defaults use €29.99;
  do not run the broad legacy price fixer or silently change business pricing.
- Review the intended license entitlement and support contact before proposing
  provider product/brand changes.
- After isolation, exercise actual test-mode checkout/return, signed delivery,
  reconciliation, coupons, duplicate/out-of-order events and refund/dispute
  entitlement barriers. Live real charges/refunds require separate approval.
- Review currency, tax, refund and settlement persistence before proposing a
  financial-journal migration. Existing purchase Float records and the event
  ledger do not constitute a full accounting journal.

Primary API references: [product list](https://docs.dodopayments.com/api-reference/products/get-products),
[product detail](https://docs.dodopayments.com/api-reference/products/get-products-1),
[localized pricing](https://docs.dodopayments.com/api-reference/products/get-products-localized-prices),
[brand](https://docs.dodopayments.com/api-reference/brands/get-brand),
[webhooks](https://docs.dodopayments.com/api-reference/webhooks/list-webhooks) and
[signing key](https://docs.dodopayments.com/api-reference/webhooks/get-webhook-signing-key).
Sanitized local evidence: `/tmp/jazz-maintenance/dodo-provider-access-summary.json`.

The later a207 native history window verifies actual own-record GET/UI display
of80, NULL and0 and restoration, plus controlled load recovery and server owner-
mismatch409. Its31 successful phase checks use one root-created synthetic grant
with bounded reversible SQL amount changes; they make **no provider transaction,
refund, delivery, tax or currency claim**. The original row/timestamp and all-five
12-model fingerprints match afterward. Accounting source260 targeted checks
and actual Dodo notification/transaction gates remain distinct.
[Exact scope](review-status.md#payment-history-recovery-and-account-isolation).

## Local test credential retention

The owner-supplied TEST key now has an identical durable private copy at
`/home/gabriel/.config/culturadeljazz-maintenance/dodo-test-api-key`, directory0700/
file0600. The original `/tmp/jazz-maintenance/dodo-test-api-key` is preserved.
One bounded test-mode product GET confirms the same previously created synthetic
product/business and unchanged8000EUR minor-unit price. No transaction, refund,
webhook, mail, shared-business setting or live resource was changed. Neither file
is automatically loaded; account rotation remains the owner's decision and must
account for both copies. Key contents and digest are excluded from evidence.

This addresses local loss on/tmp cleanup, without encryption, off-site recovery
or proof of merchant notification recipients. Those transaction gates remain.
