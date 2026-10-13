# Native runtime safeguards

Source repairs and a release producer for a single Node 24 application process.
These are not a hosting activation, provider configuration change or production
verification. Application source `ab14628` passes 1,763 normal tests/40 intentional
skips, types, webpack and lint 0 errors/25 existing warnings in a credential-free
copy. The 512 new safeguard cases are included in that total.

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

The actual source `ab14628` producer passes a fresh locked configured webpack
build and inspection of 45,759 sealed files. All 541 archived application files
match committed Git blobs; 157 client files contain the configured public
key/origin and no supplied server secrets. One generated esbuild hardlink was
materialized. A separate reinspection also passes. The origin is deliberately
synthetic/unrouted, no listener was started, and provider ownership is unverified.
Private evidence is under
`/tmp/jazz-maintenance/native-release-package-verification/`; the first sealing
failure and earlier type/scan/quiz-fixture diagnostics remain preserved.

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

## Remaining package verification

The final launcher/private socket, runtime umask 077, cold start/restart, actual
Next cache behavior and a disabled bounded daily runner remain outstanding.
An eventual production package needs a durable reviewed CA/config path; temporary
preview paths are insufficient. Fresh protected HTTPS/customer-journey checks
must bind the resulting current-source runtime and window. Account/DNS/continuous
host control, old Vercel quarantine and production cutover approval remain
separate. Earlier source27 browser evidence is historical.
