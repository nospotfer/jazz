# Release review — October 22, 2026

This package presents the maintenance work for owner review. **Production remains
paused/503 and the repaired application is unreleased.** This document does not
declare the maintenance goal complete or authorize deployment. The original goal
requires a verified preview ready for production review; executing the production
cutover requires separate approval.

## Selected application and review access

| Item | Exact selection |
| --- | --- |
| Application commit | `476bc7a8c0a85cfa15ac0e9e75b6d4162a21ddf8` |
| Documentation baseline | `5545bb82f5c4cc59a5a211ca73c7957b8d6681e9`; nine maintenance Markdown changes after the selected application |
| Production artifact | Node 24.21.0; 45,858 sealed files; manifest `9d344bafdadae84e0f64ce371fd6c9b480a5c410aa032c9fd1e654e76368e814` |
| Isolated preview | https://gibson-flashing-trade-portraits.trycloudflare.com |
| Preview artifact manifest | `13819da3fe4b10e8e21e002efcbbe8512df00d6dace50c1338474c2a084a54b0` |
| Fixed preview expiry | **October 23, 09:38:45.485 UTC / 11:38 Madrid**; the temporary tunnel is not production hosting |
| Owner launcher on Behemoth | `/home/gabriel/.local/share/culturadeljazz-maintenance/review-476bc7a-20261022/open-preview.sh` |

The launcher handles the private preview gate; account login remains manual.
Installation did not open a browser or log in. It uses a dedicated profile and
refuses an already active review browser. Payment, application-mail and cron
inputs are absent from this isolated preview. Credentials are excluded from this
document and the review evidence.

The clean locked build, full artifact inspection, 158-file client secret scan and
all ten exact-source remote checks pass. An actual synthetic, network-none
container rehearsal verifies native Prisma/OpenSSL loading, localized checkout
and voucher503 responses, one worker-loss restart, shutdown and maintenance
fallback. It does not prove production credentials, boot recovery, persistent
cache or sustained load. [Current evidence](production-readiness.md#latest-certificate-release).

## What has been verified

These are source-bound results from isolated scopes, not a claim that every
journey was repeated on `476bc7a` or that production integrations are healthy.

| Customer experience | Evidence and qualification |
| --- | --- |
| Public landing and navigation | Desktop/mobile, both themes, contrast, keyboard/touch controls and whole-page review. Public fixes retain the jazz branding. Small original lesson photos remain soft; no sharper existing original was found. [Visual scope](review-status.md#landing-press-and-footer-accessibility). |
| Registration, email verification and reset | Uninterrupted isolated registration and password recovery pass on sealed `3e5b2c1`, including real controlled email, login/logout and independent preservation/settings restoration. Production SMTP/callback continuity is separate. [Auth mail](cloud-auth-mail.md). |
| Google login | First and returning login pass on isolated `fc8d813`, with stable identity and normal logout. Legacy project ownership and production client/customer continuity remain unverified. [Google](google-oauth.md). |
| Free, paid and historical access | Four-role preview checks verify free first lesson, full-course entitlement, historical purchased lesson and unauthorized denial. New individual lesson sales intentionally return HTTP 410. [Journey matrix](verification-matrix.md). |
| Video and PDFs | Isolated signed Mux playback, private PDF bytes and visible native PDF pages pass, including fresh mobile navigation. Recovered customer media remains a separate pending check. [Media evidence](verification-matrix.md). |
| Notes, progress, quizzes and medals | Actual cloud persistence and native UI learning on `9bd09a6` pass; ownership, grading, saved drafts and later mobile controls retain their separate regression/browser evidence. [Learning scope](preview.md#learning-and-note-recovery-follow-up). |
| Certificates | Current `476bc7a` preview passes 32 cases across four languages, 320/390/1024/1440 and both themes, with no privacy/download overlap. Ordinary A4 download, local logout and state preservation pass. Earlier `749c4e7` four-language PDFs remain separate. [Current result](production-readiness.md#latest-certificate-release). |
| Full-price payment | An actual TEST payment, signed fulfillment and canonical USD 89.97 purchase pass on `ba105`. This does not prove LIVE payment readiness, a completed coupon journey or refund. [Payment evidence](dodo.md#latest-oct20-checkpoint-captured-sandbox-wallet-denial). |
| Administration and account privacy | Isolated permission, responsive layout, recorded-money and account-switch checks pass at their sources. R14 on `4b320b1` verifies recovered admin login/dashboard/admin/logout. Course authoring is not implemented; unsupported controls were removed. [Matrix](verification-matrix.md). |

Significant auth, payment, webhook, access, privacy, ingress and operational-tool
defects have failing-before/passing-after regressions. Historical failures remain
recorded. Current passive diagnostics join network-error entries to their exact
requests; canceled-load causes and older aggregate errors remain qualified.
[Backlog](backlog.md), [checks](local-verification.md), [diagnostics](production-readiness.md#latest-certificate-release).

## Deferred and unverified work

| Area | Limit and proposed restriction |
| --- | --- |
| Recovered video/PDF | The prepared controlled-admin check needs its specific backend/Auth approval and fresh bindings. Accepted data/PDF recovery and R14 admin access must not be replayed. |
| Coupon and refund | Native coupon quote/checkout were observed, but paid coupon fulfillment is incomplete. TEST refund returned `INSUFFICIENT_WALLET_FUNDS`; no refund/access reversal is proven. Preserve spent actions and the paid purchase; no blind retry or funding. [Dodo](dodo.md). |
| Messaging | Source/database/signature checks pass; real delivery/reply do not. Receiving/webhook are disabled and receiving MX is absent. Sender authentication, routing and controlled mail need review. [Messaging](messaging.md), [activation proposal](resend.md#proposed-activation-sequence-requiring-approval). |
| Existing students and recovery point | No controlled real USER password is available; owner access is administrative. Do not request customers' passwords. October13 data/files are recovered; payment readbacks narrow the gap but do not prove current Auth/learning or historical transitions. [Recovery point](payment-recovery-point.md). |
| Production Auth and business facts | Exact callbacks, Google client, SMTP, price/tax authority, guarantee/license copy and support identity require decisions. Synthetic catalog price 80 is not a production price. [Open gates](backlog.md#open-verification-and-release-gates). |
| Operations and accounts | Registrar/DNS authority, continuous host operation, provider account recovery/billing and periodic backup/key custody remain qualified. Development lint-chain advisories and process-local runtime limits are documented. [Inventory](service-inventory.md), [backups](supabase.md). |

## Proposed staged zero-cost reopening

Use the existing Monster machine, Node 24 in the reviewed nonroot/read-only
container, private Unix sockets and a separate Cloudflare Free named tunnel.
Select recovered backend `klaiiikojgdfclzhqfgt` and canonical
`https://www.culturadeljazz.com`; keep the original unsafe backend paused.
Use the exact inspected release and explicit private runtime inputs, not a
preview configuration. Do not upgrade Vercel or spend money.

This route needs authenticated domain/Cloudflare access, full-zone/DNSSEC
preservation, acceptable PDF-delivery terms and an owner who accepts Monster's
power/internet/outage risk. None is inferred from the current Quick Tunnel.
The prepared container limits are 2 GiB, two CPUs and 256 tasks, with no published ports.
Boot/load and production outbound connectivity remain acceptance checks.
[Hosting proposal](hosting.md), [runtime and service selection](production-startup.md).

| Function | Proposed initial state |
| --- | --- |
| New purchases and grants | Explicit server-only `CHECKOUT_DISABLED=true`: paid/free/voucher checkout and direct redemption unavailable. Existing customer content is independent of a new purchase. |
| Existing payments | Completed-payment webhook/reconciliation code remains available; LIVE ownership/configuration and bounded acceptance must be reviewed. The checkout switch does not disable these paths. |
| Application mail | Sending credentials absent; no messaging/receiving activation. Production Auth mail settings are a separate reviewed decision. |
| Cron | No new native schedule. The native runner is preparation-only; disable the exact old Vercel cron before any replacement schedule. Paused Vercel still reports that cron configured enabled. |
| Analytics/replay | Disabled pending provider/privacy-settings review. |

Any backend/public-origin change requires the matching public-bound build and
full inspection. Preserve exact apex webhook POST handling, secure cookies,
private PDF caching/framing and raw signed bodies. Do not convert preview Worker
exceptions or TEST credentials into production permissions.

## Decisions for review, then activation

**Decisions presented for owner review:** decide whether deferred integrations remain
disabled for a staged reopening; accept or reject the documented recovery-point
and existing-student limits; select the zero-cost operating owner/host route;
and resolve the pending recovered-media acceptance requirement. Deferral records
a limitation, never a passing integration. This document does not assign goal status.

**Before activation:** approve the exact source/artifact/backend/configuration,
domain/zone changes, Auth callbacks and delivery settings, service/tunnel units,
bounded acceptance checks and rollback. Prepare fresh preservation and zone
snapshots, retire old trusted cron execution, and verify actual account/provider
prerequisites. Changing DNS, resuming the backend or starting real-input services
are production actions requiring that approval. Enabling purchases, mail or a
schedule later needs its own reviewed configuration change.
[Execution order](hosting.md#cutover-order-and-stop-conditions), [release gates](release-checklist.md).

## Rollback behavior

On a failed essential acceptance check, keep purchases disabled and switch the
same Jazz app service to the inspected static maintenance variant. Documents
return HTTP 503/no-store; API/auth/checkout/webhook requests return HTTP 503 without forwarding
or fake success. Worker failure restarts the service; host/tunnel loss may make
even that page unreachable. Returning DNS to paused Vercel is an outage response,
not a healthy application rollback.

Restore only configuration/DNS changed by the approved release. Never rewind
customer/payment/learning rows, remove additive columns, restore unsafe grants,
reimport the archive or reupload accepted PDFs. Backend re-pause must follow the
specific approved rollback. Preserve the previous artifact and evidence.
[Rollback details](production-startup.md#maintenance-and-rollback).
