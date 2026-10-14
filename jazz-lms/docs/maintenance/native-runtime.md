# Native runtime safeguards

Source repairs and a release producer for a single Node 24 application process.
These are not a hosting activation, provider configuration change or production
verification. Current application source `57f5de1` passes 1,935 normal tests/40
intentional skips, 39 actual PostgreSQL tests/one REST-only skip, types, webpack
and lint 0 errors/25 existing warnings. Its fresh sealed artifact actually ran
through private Unix sockets and a protected temporary HTTPS tunnel. The earlier
e32 artifact separately passed restart, worker-exit cleanup and separate-UID
denial; those lifecycle checks are not relabeled as 9bd execution.
[Exact checkpoints and retained observations](review-status.md#native-password-navigation-and-fresh-learning).
The earlier 512 safeguard cases and newer 152 launcher/transport/runner cases
are included in the normal total.

## Trusted ingress

`scripts/native/ingress-policy.mjs` validates exact Host and HTTPS metadata,
canonicalizes a single Cloudflare client address and replaces caller forwarding
headers. Absolute/ambiguous paths, protected Connection nominations, pseudo-IP
headers and public cron requests are rejected. Apex GET/HEAD redirects preserve
the target/query; only the two exact POST webhook paths bypass that redirect.
Ordinary Worker requests are denied; those signed webhook endpoints accept Worker
transport metadata because a provider may itself use a Worker. The application
must still validate its signature/shared secret; an IP is not provider identity.

`ingress-server.mjs` returns an **unbound** HTTP server. It limits headers/body
size and duration, preserves raw signed bytes and streams private PDFs/HTML
without caching. Disconnects cancel the owned upstream. Before-header errors are
finite; after-header errors close the stream rather than append text to a PDF.
Twenty actual loopback HTTP cases and 170 policy cases pass. No Cloudflare account
profile or private socket boundary has been established by those tests. Only a
separately reviewed tunnel boundary may supply trusted edge headers.

## Explicit environment and release integrity

`config-policy.mjs` constructs a clean environment from owner-only JSON, with
exact production/preview backend and origin routing, distinct Supabase key kinds,
strict session/direct PostgreSQL TLS parameters and a valid RSA media signer.
Preview payment, cron and mail credentials are disabled. Tracking and legacy
mutators are disabled in both modes. An explicit
`APP_DEPLOYMENT_ENVIRONMENT` controls indexing ahead of legacy `VERCEL_ENV`;
native preview/unknown values fail closed. Pure validation proves routing and
key shape, not authentication of opaque keys, ownership or provider health.

`release-inspect.mjs` binds private configuration, a current CA certificate/hash,
the actual Node 24 executable and public build configuration to a complete file
manifest. It rejects environment shadows, peer-writable inputs, changed/missing
files, hardlinks and symlink escapes. npm links bind their exact `readlink` text
as well as content. Only `.next/cache` is mutable; its descendants must remain
owned regular files/directories without symlinks, hardlinks or peer writes.
A temporary exclusively created cache probe is removed without replacing an
existing file. These are local owner-controlled integrity checks, not signed
producer attestation or protection against the same trusted owner/root changing
files and receipts together. Forty-eight actual local I/O cases pass.

## Prepare a native artifact

Use the pinned Node 24 executable directly, a clean exact committed Git checkout
in an owned directory without peer writes, and a new output path under an owned
private directory outside every Git worktree. The source checkout's modes may
require a dedicated private clone; do not change shared workspace permissions.
Configuration and CA stay outside the exported application. Never source `.env`
or put keys on the command line.

```bash
/absolute/node24/bin/node scripts/native/prepare-release.mjs --inspect \
  /private/config.json /private/source-checkout /private/new-release
/absolute/node24/bin/node scripts/native/prepare-release.mjs --build \
  /private/config.json /private/source-checkout /private/new-release
/absolute/node24/bin/node scripts/native/release-inspect.mjs \
  /private/config.json /private/new-release/app /private/new-release/manifest.json
```

The preflight creates nothing. Build exports the exact Git application inventory,
performs fresh `npm ci --include=dev` and webpack compilation, and supplies only
public configuration plus a closed loopback fixture database to those children.
No service-role, media signing, payment or mail credentials reach installation or
static generation. Explicit new empty user/global npm config files prevent
ambient machine configuration; the tracked project `.npmrc` remains in effect.
After both install and build, application source must remain the same complete
set of regular single-linked files and hashes. Only `node_modules/**`, `.next/**`,
`next-env.d.ts` and `tsconfig.tsbuildinfo` are generated exemptions.

The producer materializes legitimate generated dependency hardlinks in separate
inodes before recording hashes and sealing. Original source must remain regular,
nonsymlink and single-linked before any dependency normalization. The first real
build exposed esbuild's two hardlinked executables; that failed package remains
private and the materialization repair has seven actual filesystem regressions.
The producer records dependency/build and source hashes, normalizes the private
cache, seals every other application file/directory, and invokes the inspector.
All child commands are awaited, have bounded output/deadlines and use an owned
process group for cancellation. Private failure logs/artifacts are retained;
an existing output is never overwritten or deleted. Fifty preparation
regressions pass, including actual disposable Git and source-injection checks.
The receipt never claims credential verification or production approval.

The historical source `ab14628` producer passes a fresh locked configured webpack
build and inspection of 45,759 sealed files. All 541 archived application files
match committed Git blobs; 157 client files contain the configured public
key/origin and no supplied server secrets. One generated esbuild hardlink was
materialized. A separate reinspection also passes. The origin is deliberately
synthetic/unrouted, no listener was started, and provider ownership is unverified.
Private evidence is under
`/tmp/jazz-maintenance/native-release-package-verification/`; the first sealing
failure and earlier type/scan/quiz-fixture diagnostics remain preserved.

## Bounded private preview startup

`launch-preview.mjs` inspects the complete release before creating a new run
directory. Its private JSON contains `version: 1`, absolute `configFile`,
`appRoot`, `manifestFile`, `runDirectory`, and `previewAccess` with a generated
username/password and a canonical ISO `expiresAt` no more than one hour ahead.
Keep the JSON owner-only, outside the release, and its existing run parent
owned with mode 700. Both socket paths must fit Linux's length limit. An existing
run path is rejected; it is never adopted or deleted as a stale directory.

```bash
/absolute/node24/bin/node scripts/native/launch-preview.mjs --inspect /private/launch.json
/absolute/node24/bin/node scripts/native/launch-preview.mjs --run-preview /private/launch.json
```

Only Linux/Node 24 **preview** configuration can start. Production configuration
is denied before a child or listener is created. The release-local worker uses
Next's custom-server API with the public hostname/logical port 443, then binds
only `app.sock`; the parent binds only `edge.sock`. Both sockets are mode 600
inside the new mode 700 directory; the worker runs with umask 077. No application
TCP port, tunnel, service or DNS record is created by the launcher.

An owned IPC nonce/PID and a bounded real `robots.txt` probe precede ingress
readiness. The Basic credential stays in the parent, never the worker's argv or
environment. Every ingress request requires it, including assets and redirects;
authorized responses override shared cache headers with private/no-store.
The fixed lease is checked again after request buffering and bounds forwarding.
Next raw output is discarded; only finite diagnostic counters reach receipts.

Signal, lease expiry and unexpected worker exit close the owned ingress/process
group. Cleanup waits for in-flight resource creation and preserves replacement
paths or unknown entries. It removes only recorded owned sockets/temp files and
the empty new run directory. Next closing alone is not process-group proof.
Same-owner/root access remains a trusted boundary, not hostile-user isolation.

## Temporary Cloudflare transport

The installed Cloudflare CLI's `--url unix:/...` is **not** a Unix ingress rule;
an actual request demonstrated HTTP hostname normalization and 502. Use an
explicit private YAML ingress rule instead:

```yaml
ingress:
  - service: unix:/private/new-run/edge.sock
```

Validate it with `cloudflared tunnel --config /private/tunnel.yaml ingress validate`.
Quick mode needs an explicit `--url` selector; with this installed version,
`--url http://127.0.0.1:1` selects Quick mode while the configured ingress supplies
the actual Unix origin. That closed-port selector is never an application TCP
bridge. [Cloudflare's versioned ingress implementation](https://github.com/cloudflare/cloudflared/blob/2026.7.3/ingress/ingress.go)
and [Unix rule documentation](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/local-management/configuration-file/)
support this ordering and service type; reverify after CLI changes.

Actual Quick traffic carries `cf-worker`. The launcher explicitly permits that
transport only behind its authenticated, leased operator preview. General
ingress continues to deny Worker browsing; pseudo-IP/v6, host and HTTPS checks
remain enforced. This exception is not a production tunnel policy. Accountless
Quick infrastructure also rewrote an unauthorized origin `robots.txt` 401 into
a managed 200 response retaining the Basic challenge. Record that provider
behavior separately; do not claim every external path preserves origin status.
Verify protected pages/assets through HTTPS and inspect the resulting preview's
indexing behavior. A temporary tunnel is testing infrastructure, not stable
hosting or an account/DNS approval.

## Request counters

The three known buckets each retain at most 4,096 SHA256 identifier keys.
Counters stop growing on denial; inactive entries are pruned lazily every
30 seconds of bucket use, or when their expiry permits new capacity. A full
live bucket denies new identifiers with the earliest expiry instead of evicting
existing counters. Voucher traffic cannot consume email webhook capacity.

Forwarding headers still require a trusted ingress. Native direct exposure must
not accept caller-controlled X-Forwarded-For. A restart resets counters; multiple
processes do not share them. No Redis or paid service was added.

## Payment sweep

The route validates the configured bearer before database/provider work, holds a
process-local single-flight lock and applies a cooperative 50-second deadline.
Dodo list/detail reads combine that signal with their existing 12-second timeout.
Body-read cancellation is an error; a full final tenth page is explicitly
incomplete rather than a complete payment history.

Users are ordered by ID with a keyset continuation and a 500-user run limit.
Payment/activity cutoffs stay fixed during a pass. The next pass overlaps the
previous pass's start by 48 hours/seven days respectively, covering a multi-day
scan. Failed/interrupted users retain their earliest cutoff and remain eligible
after ordinary activity expires. Their next attempt follows the normal cursor
wrap; one failed user does not reset the scan to its beginning.

A fresh provider list rotates after the previously attempted payment ID so a
repeated slow prefix cannot starve later payments. Every grant still requires
fresh detail, matching ownership/course and reversal/discount accounting checks.
Existing purchase/reference idempotency handles replayed work; no financial or
user activity record is used as a scheduler marker.

Successful complete passes return 200. Partial/deadline/capacity failures return
503, request cancellation 499 and overlaps 409. Results contain aggregate counts,
`passComplete`, `hasMore` and a finite reason. `hasMore` refers to the normal user
cursor tail; unresolved pending users can remain after that tail is exhausted.
A native runner must inspect the body and bound any continuation loop; no timer
has been installed or enabled.

Prisma 5 cannot cancel an in-flight database call. The route awaits settlement
and keeps its lock, counts a completed grant, then stops new work. Thus 50 seconds
is a cooperative work budget, not a hard process termination guarantee. Existing
connection/pool/transaction limits and native transport verification remain
release requirements.

Continuation is bounded to 4,096 pending users. Capacity exhaustion fails closed
without dropping earlier retries. A bounded recovery phase rotates through
pending users while preserving the normal cursor; freed capacity lets that tail
resume on a later run. Deleted users, persistent provider pagination
caps or unusable current emails can remain explicitly unresolved and need
reviewed recovery. A persistently unresolved saturated set prevents new users
from being attempted; do not clear it blindly or advertise complete coverage.

Cursor, retry cutoffs and payment rotation are lost on process restart or
redeployment. A fresh 48-hour initialization does not recover older unresolved
payments. Historical recovery after an outage requires a separately reviewed
scope. Independent instances do not share this lock; disable old cron before
activating one native runner. No distributed exactly-once or complete historical
coverage is claimed.

## Disabled reconciliation preparation

`reconcile-runner.mjs --plan /private/runner.json` only inspects and reports a
disabled plan. The CLI has no execution flag and installs/enables no timer.
The plan pins a production configuration/source revision and the dev/inode of
an existing private app socket and lock file. It cannot target public TCP/HTTP
or discover ambient credentials. Configuration/source and local inode checks
are not provider ownership, application-version or activation approval.

The exported execution path exists for owned fixtures/future reviewed startup;
both explicit execution and a private enabled plan are required. It acquires
the existing lock through root-controlled `/usr/bin/flock` on an inherited
descriptor, retains the lock until settlement and rechecks target identities
before every call. Limits are 20 calls, 15 minutes, 75 seconds per request and
64 KiB per response, with one second between settled continuations. It leaves
enough time for a complete request before starting another.

Only a valid settled 503 with explicit cursor continuation and user progress
permits another call. Busy, abort, capacity, zero progress, pending tail,
malformed/oversized response, authentication and unknown transport outcomes
stop the run. The receipt distinguishes complete/incomplete/uncertain; no raw
response or bearer is logged. It never restarts Next or retries an uncertain
write. Releasing the HTTP client does not prove an in-flight Prisma call stopped;
the app retains its own single-flight lock until settlement. Future scheduling,
old Vercel cron quarantine and manual historical recovery require separate
review before production activation.

## Verified preview and remaining production package

Source `e32a3707a7ff647ebc8528798dc81df9415fa983` passes fresh locked install,
configured webpack and inspection: 548 application Git blobs, 45,766 sealed
files and 157 client files with the expected public values and no supplied server
secrets. Only `.next/cache` is writable. The prelaunch producer receipt retains
`started: false`; separate readiness/runtime receipts establish actual startup.
Nineteen actual Unix runtime checks and 11 external HTTPS transport checks pass.
Cloudflare consumes its specific cache-control header; downstream CDN no-store,
cache status and an unauthorized request after an authorized asset remain checked.
Managed robots rewriting is recorded separately.

The same artifact passes actual home-200 restart, unexpected owned-worker exit,
cleanup, image-cache write and final complete reinspection. A network-isolated
UID 65534 process receives EACCES for both sockets. No compiled directory was
unlocked. The app and temporary tunnel closed cleanly at 23:35 UTC, before their
fixed deadlines; subsequent private lifecycle probes also closed cleanly.
Private evidence is under
`/tmp/jazz-maintenance/native-preview-contrast-verification/`.

Fresh exact-source browser reports remain separate: primary 96/98, guest selector
diagnostic 2/2, native-PDF completion 7/7, full-frame PDF visual continuation 7/7.
Twelve public layouts and 48 computed contrast checks pass; four native roles,
actual Mux playback, profile/certificate and fresh mobile PDF text are verified.
The initial two observations, earlier failed PDF captures and two unclassified
source 2058 buyer errors are preserved. Current runs have zero page errors;
that does not classify the earlier exceptions. No learning, payment, mail or
provider-configuration writes occurred. [Browser scope](preview.md#protected-native-preview-and-contrast).

The disabled reconciliation runner has 49 regressions and a preparation-only CLI;
no timer/service or production execution was enabled. A production package still
needs durable reviewed CA/config paths, named-tunnel/account/DNS/continuous-host
control, resource/recovery policy, old Vercel quarantine and explicit SQL/config/
deployment/resume approval. Temporary preview verification does not satisfy those
gates or prove Google, SMTP, Dodo transactions or production runtime health.


## Fresh learning and late-event source follow-up

Exact `cadeac7` is freshly built/sealed and passes Unix19/HTTPS11 using the
owner-only CA copy outside/tmp. Its artifact matches549 application Git blobs,
45,768 sealed files and158 client files without supplied server secrets. This
preview configuration remains separate from reviewed production configuration.
Exact9bd browser learning uses one new synthetic USER and explicit fixture grant;
two notes/two completed progress rows/two quizzes24answers and PLATINUM/GOLD are
independently verified read-only. All original-four scoped rows remain unchanged.
The9bd processes and browser state are closed; latestcade read-only mobile/auth/
accessibility and full five-account preservation are tracked separately.
[Exact source and run receipts](review-status.md#late-auth-events-and-localized-completion-labels).


Latest57 sealed550/45,769/158-file artifact passes Unix19/HTTPS11 and complete
post-closure reinspection. Both latest apps and tunnel closed by their fixed
leases; all-five12-model read-only preservation passes. The earlier e32 restart/
worker-exit/UID denial remain separate. [Current receipts](review-status.md#mobile-drawer-recovery-and-recorded-payment-amounts).


The later FB/BC builds each verify550 app blobs,45,769 sealed files and158 client
files, with Unix19/HTTPS11 and post-closure full seals. Actual scoped editor and
BC language controls pass; apps/tunnel/browser state are closed and all-five
12-model strict-CA preservation passes at02:42:36 UTC October14. These scopes do
not repeat or relabel the earlier e32 restart/worker/UID tests.
[Latest UI checkpoint](review-status.md#scoped-notes-editor-and-language-controls).
