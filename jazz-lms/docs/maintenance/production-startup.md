# Native production runtime

The production application, ingress, maintenance fallback and named-tunnel
launchers are implemented. They are **not deployed**. Inspection and proposal
creation are safe local preparation; explicit runtime commands with real inputs
require the owner's approval of the concrete production release. No service
installation, backend resume, provider configuration or DNS change has occurred.
See [hosting](hosting.md) for account/domain and cutover prerequisites.

## Current reviewed artifact — Oct22

Selected candidate `749c4e7` contains the certificate fixes and seals 45,858 files;
previous509fa06 remains preserved. Actual synthetic container startup, native
loading, one worker-loss restart, shutdown and maintenance fallback pass. The
real-input proposal is separately retained under
`/home/gabriel/.config/culturadeljazz-maintenance/production-candidate-749c4e7/`.
It is not active and does not establish current provider health. Do not reuse
older source/path bindings for this candidate. Concrete production tunnel/domain/
Auth/backend/startup changes still require their final reviewed release scope.
[Build, hosted certificate, preservation and limits](production-readiness.md#latest-certificate-release).

## Configuration and release

Use Node24 and an explicit owner-only production JSON configuration. Select
`productionTarget: "restored-customer"`, `mode: "production"`, canonical
`https://www.culturadeljazz.com` and recovered backend `klaiiikojgdfclzhqfgt`.
The original backend remains inspection-compatible but is denied by this
production launcher. Preview selectors, test payments and recovery leases cannot
become production startup inputs.

For the proposed staged reopening, set server-only `CHECKOUT_DISABLED: "true"`
in the explicit configuration. It blocks new paid/free/voucher checkout grants
and direct voucher redemption without disabling existing-customer content,
authentication, completed-payment webhooks or reconciliation. Customers receive
the existing localized temporarily-unavailable message. The native config accepts
only exact `"true"`/`"false"`; omission preserves legacy enabled behavior and
does not inherit a shell setting. This flag is evaluated at runtime and never
becomes a public build variable. Re-enabling initiation is a separately reviewed
production configuration change after LIVE product/price/webhook acceptance.

The plan contains exactly `version`, `sourceCommit`, `projectRef`, `origin`,
`configFile`, `appRoot`, `manifestFile`, `runDirectory`, `nodeExecutable`,
`cloudflaredExecutable`, `cloudflaredSha256` and `tunnel` (exactly `id` and
`credentialsFile`). Paths must be absolute, canonical and free of shell/systemd
expansion or control characters. The application/run sockets must fit100bytes.
The run parent must already be owned0700 and the new run directory absent.
The proposed production path is
`/run/user/1000/culturadeljazz-production-state/current`;
isolated local tests use their own private runtime parent.

Config, plan, CA, manifest and named-tunnel credentials stay outside the sealed
application. Inputs must be controlled regular files; private inputs are0600.
No environment file is sourced, key printed, or credential copied into the
review bundle. Full release inspection verifies Node, CA, public build settings,
complete immutable inventory/hashes/links and the private writable cache.
Application and tunnel inspections use separate exclusive cache probes, preserving
existing files. Current launcher/preparer bytes are bound to the release copies.

## Inspection and proposal commands

These commands perform no provider calls, child startup, service install or
listener bind. The release inspector creates/removes its own cache-write probe.

```bash
/absolute/node24 scripts/native/prepare-production.mjs --inspect /private/plan.json
/absolute/node24 scripts/native/prepare-production.mjs --prepare /private/plan.json /private/new-proposal
/absolute/node24 scripts/native/launch-production.mjs --inspect /private/plan.json
/absolute/node24 scripts/native/launch-production-tunnel.mjs --inspect /private/plan.json
```

Proposal creation requires a new output directory under an owned0700 parent.
It writes0600 proposed app, maintenance and tunnel units, two-host tunnel JSON,
a data-preserving rollback note and summary. Container app/maintenance alternatives
are included. Preparation validates the dedicated runtime parent and creates or
checks an empty owner0700 `docker-cli` beside the plan. Inspection never creates
that directory. Existing proposal outputs are never replaced.
The preparation CLI still rejects install/start/activate operations. Proposed
units now contain **working runtime commands**; copying/installing them is a
production action, not another harmless preparation step.

Named-tunnel JSON has exactly www and apex hostnames to the private edge Unix
socket, plus a404 catchall. Its UUID and credential shape must match the plan,
and the cloudflared executable is hash-pinned. This does not prove account,
credential validity, DNS control or Cloudflare settings.

## Explicit runtime and shutdown

After the release is approved, use the entrypoints inside that inspected release:

```bash
/absolute/node24 /private/release/app/scripts/native/launch-production.mjs --run-production /private/plan.json
/absolute/node24 /private/release/app/scripts/native/launch-production-tunnel.mjs --run-tunnel /private/plan.json
```

The app launcher uses only validated configuration for the worker, an owned IPC
nonce, private0600 app/edge sockets, finite readiness and process-group cleanup.
The worker independently checks production/canonical/recovered routing, database
TLS/target metadata, LIVE-mode payment routing, disabled local mutators and absence
of preview leases. Production robots readiness performs no provider/database
probe. It reuses the exact host/HTTPS/client-IP policy without Basic or Quick
Tunnel exceptions. Unexpected worker exit closes the ingress and returns failure
so systemd can restart. Signal shutdown stops owned descendants and removes only
recorded paths; replacements or unknown entries are retained as cleanup failures.

The named-tunnel launcher waits for the private edge, creates a separate new0700
`<runDirectory>-tunnel`, writes its own0600 config, and runs only the pinned UUID
with clean environment and discarded raw child output. Updates and management
diagnostics are disabled. Metrics bind only127.0.0.1 on an ephemeral port, never
an all-interface origin. The exact child PID file indicates first connection;
it does not establish public domain or application health. Unexpected child loss
fails the unit. Cleanup preserves unrelated or mismatched files.

### Monster container service selection

Select `jazz-production-container.service.proposed` as the canonical
`jazz-production.service`. The maintenance-container variant is an alternative
under that same canonical name. The host tunnel unit/dependency graph stays
separate. The direct host alternatives remain available for local diagnostics;
**Monster's user-systemd namespace directives are ineffective**. Actual probes
retain host network/mount namespaces and allow an owned home canary write.
Earlier restart/stop proofs do not establish filesystem/network isolation.

Container commands use the explicit local Docker socket and empty project-only
CLI configuration, the pinned official Node image
`node@sha256:7b559cf7f77d837192392499a850abb1a3d1f49fbc2bd0692d54b212c9e38f6d`,
and the separately inspected host Node executable mounted read-only. They run
nonroot, read-only root, no capabilities, no new privileges and no published
ports. Only the dedicated `culturadeljazz-production-state` parent and Next cache
are writable host mounts; inputs/app/CA/binaries are read-only. The Docker socket
and home directory are never mounted into the application container.

The selected full Bookworm image contains OpenSSL3 libraries. The earlier slim
image is rejected: it serves robots/static files but lacks libssl3/libcrypto3;
importing the database client asynchronously fails Prisma native initialization
and stops the worker before any query. Therefore a robots-only readiness result
is insufficient release evidence. Verify actual API/module loading plus continued
worker liveness in the selected image, in addition to full release inspection.
Do not suppress fatal handlers or treat a fallback503 as the application result.
The finite engine diagnostic uses a pinned Prisma internal promise only for the
local investigation; it is not a production API or database-health check.

Each systemd invocation names its own container using `${INVOCATION_ID}` and
stops only that name. Resource limits are2GiB/twoCPUs/256tasks; tmpfs is256MiB.
The fixed `culturadeljazz-production` network must be separately inspected and
prepared in the approved release; these helpers do not create it. Production
outbound connectivity/provider health remain untested. The host tunnel process
still runs as the host user; it does not gain container isolation from directives.

Restart-on-failure and explicit Docker stop supervise normal lifecycle. Docker
daemon failure may leave an orphan; manually verify that exact invocation's
container and edge state before recovery. Long-running load/host-outage/boot
recovery remain open. No unit is installed/enabled by preparation. Inspection
counts do not measure future runtime provider activity.

## Maintenance and rollback

To serve only the approved static fallback, replace the app unit with the proposed
maintenance variant under the **same** `jazz-production.service` name, then reload
and restart the approved Jazz units. Its explicit entrypoint is:

```bash
/absolute/node24 /private/release/app/scripts/native/launch-production.mjs --run-maintenance /private/plan.json
```

This fully inspects the plan/release but starts no Next worker or provider client.
GET/HEAD documents return the exact sealed HTML with503, no-store and its bound
CSP/security headers. Auth/API/checkout/webhook/mutations remain unavailable503
without forwarding. Existing host/Worker/cron restrictions and apex redirect
still apply. Normal upstream transport failure also serves this fallback; an
unexpected worker loss still fails/restarts the unit rather than leaving an
apparently healthy dead service. Host/tunnel loss can make the local page
unreachable. DNS fallback to paused Vercel is an outage response, not a healthy
second application.

Never rewind customer/payment/learning rows, remove additive columns, or restore
unsafe grants. This launcher does not run migrations or reconciliation. Review
recovery-point currency, recovered student access, backend activation, callbacks,
SMTP, LIVE payment/webhook settings and domain/account control in the
[release checklist](release-checklist.md) before any production cutover.

## Actual verification and limits

The full normal suite passes 2,976 cases with 80 skipped
cases; 742 focused native cases and the final seven tunnel cases pass. Types and
scoped lint pass. Focused tests use sealed synthetic releases, fake Next and a pinned local fake
tunnel. They exercise real child processes, private sockets, HTTP behavior,
forged inputs/readiness, unexpected exit, cleanup and the exact maintenance
artifact. They contact no provider and prove no production credential health.

A separate actual Monster user-systemd rehearsal passes with synthetic inputs:
app startup, worker-loss restart with new supervisor/worker, signal cleanup,
maintenance503 with exact HTML, HEAD without body and webhook503, then closure
of both transient test units and removal of the owned run directory. It uses the
proposed sandbox/resource settings (RestartSec1 for the short rehearsal rather
than the proposed5). No production unit or actual tunnel is started. Exact
source-bound outcomes are recorded in the maintenance checkpoint.

The separate two-unit rehearsal also passes the exact rendered dependency graph:
worker exit restarts the app supervisor/worker and tunnel supervisor/fake child;
app stop stops the dependent tunnel and removes both owned run directories.
Both transient units are collected/inactive. The first app was created before
explicitly starting its tunnel, since transient dependencies cannot refer to an
uncreated transient unit. This verifies subsequent automatic restart/stop, not
an installed boot-time enable/start sequence. It uses RestartSec1 and discarded
output; the proposed units retain5s/journal. A fake PID proves local lifecycle,
not actual Cloudflare connectivity. [Retained checkpoint](production-readiness.md#day-preview--oct21-2230-utc).

### Oct22 actual build and container follow-up

Published `0d45a33` passes all 10 remote checks plus Vercel status and a clean
45,856-file locked production build. Actual built Next starts in a nonroot,
read-only, network-none Docker container, serves canonical robots metadata and
an exact sealed JavaScript asset, then stops/removes its owned resources.
Server inputs are synthetic; no real provider health or deployment is proven.
The old smoke receipt's optional cookie field used a case-sensitive lookup and
is not accepted as cookie evidence.

The subsequent container-unit source passes39 focused cases/types/scoped lint.
An actual generated-unit rehearsal with synthetic Next also passes startup,
worker-loss restart into a new invocation/container, old-container removal,
normal stop, exact maintenance503/HEAD/webhook behavior, container removal and
owned runtime cleanup. Headers are normalized in this check. Deliberate test
overrides are network=none, RestartSec1 and omitted absent production-tunnel
dependency; the earlier separate paired host rehearsal covers its graph.
No production network, installed/enabled unit, provider call or actual tunnel
is created. Source pins are recorded in `/tmp/jazz-cunit-20261022/result.json`.
The0d45 build predates the renderer change; a selected release must be rebuilt
and inspected from its final approved source.

### Accepted candidate — Oct22 02:05 Madrid

Select source `509fa069dec1365d915838d5d98e30cc9c473b3a`, with a fresh45,857-file
locked build, all 10 remote checks and Vercel status passing. The exact rendered
container unit runs the actual built Next app using synthetic inputs/network-none:
four-language checkout 503, voucher JSON503, delayed native-import liveness,
real worker termination followed by a new systemd invocation/container, normal
stop/removal and maintenance503/HEAD/webhook behavior all pass. Final source pins,
inactive test units and removed runtime are independently verified. Overrides
are network-none, RestartSec1 and omitted absent production-tunnel dependency.
No production service/network/account/backend/tunnel/DNS activation occurs.
The code selected for this artifact stays509fa06 even if later documentation-only
checkpoints advance the maintenance branch; code changes need a new build.
[Retained evidence and current release gates](production-readiness.md#day-preview--oct21-2230-utc).
