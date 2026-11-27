# Static maintenance fallback

Prepared for review only. Activating it on a production domain requires the
owner's explicit approval. It completes the concrete fallback option in the
[release and rollback plan](release-checklist.md); it does not restore accounts,
payments, course access, customer data or provider connectivity.

## Artifact and customer behavior

The standalone [HTML artifact](../../ops/maintenance/index.html) preserves the
La Cultura del Jazz name, original logo bytes and jazz-gold styling. It explains
that course access and purchases are temporarily unavailable, without promising
a return time or data safety. Spanish is the default; accessible language controls
offer English, French and Portuguese. It uses local system fonts and embedded
styles/script/logo, so it does not depend on Next, a database, provider credentials,
external assets or analytics. Spanish remains readable with JavaScript disabled.

The page does not read/write cookies or storage, start requests in the background,
collect forms, link to sign-in/checkout/email, or contact providers. A manual
recheck makes a fresh same-origin root GET and removes query/hash/userinfo; local
file review keeps its file pathname. It never retries a prior POST. This is a
separate operational asset, not an additional customer route in the Next app.

## Serving contract

The HTML file alone cannot set response status or most security headers. The
reviewed host/edge configuration must meet this contract before activation. The
[serving contract JSON](../../ops/maintenance/serving-contract.json) records the
exact artifact digest/status/header values for review; hosting configuration must
apply them. HTTP503 represents temporary unavailability, with an optional retry
delay. [HTTP semantics, RFC9110](https://www.rfc-editor.org/rfc/rfc9110.html#name-503-service-unavailable).

| Response | Required behavior |
| --- | --- |
| Document GET | HTTP503 with the exact UTF-8 HTML artifact. |
| Document HEAD | HTTP503 with the same headers and no body. |
| Auth/API/checkout/webhook and other mutating requests | Remain unavailable with a non-success503. Do not forward them to the paused/unsafe application or treat them as successful deliveries. |
| Retry-After | 300 seconds; a recheck interval, not a restoration ETA. No automatic browser reload. |
| Cache-Control | `no-store`. Do not cache authenticated responses or cookies from the old app. |
| Content-Type | `text/html; charset=utf-8` for the document. |
| Indexing | `X-Robots-Tag: noindex, nofollow`; the HTML also declares noindex. |
| Referrer/type | `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`. |
| Content-Security-Policy | Deny default/connect/form/object/base access; allow only the exact embedded style/script hashes and data-image logo. Set `frame-ancestors 'none'` in the HTTP header. |

The embedded meta CSP is defense in depth; it cannot enforce `frame-ancestors`
and is not proof of an actual host's HTTP header. Extract the exact style/script
hashes from the artifact's policy when preparing the host configuration. Any
change to style/script bytes requires updated hashes and a new browser check.
Keep customer/provider request bodies and credentials out of logs.

## Activation and recovery review

1. Review the exact artifact hash, host/account, domain paths, status/header
   behavior and operator before making a production change. No new paid plan is
   required or authorized by this artifact.
2. Apply the separately approved old-deployment/cron quarantine. A maintenance
   page or DNS move alone cannot retire immutable production credentials or stop
   old cron jobs. Preserve shared Neurofactory services.
3. Route the approved domain to the fallback and verify desktop/mobile, language,
   keyboard, JavaScript-disabled rendering and HTTP503/headers at that actual
   boundary. Local verification cannot prove DNS/account/edge configuration.
4. Leave customer Supabase paused until the exact hardening, secure application,
   configuration and new resume sequence are approved. Never seed/reset the
   customer project as recovery.
5. Return service only through a reviewed secure release and verified health/user
   journeys. Check interrupted webhook/payment reconciliation against the event
   ledger and provider evidence; do not invent success or replay unscoped events.

The unsafe June deployment remains excluded as a repaired rollback. The native
application's earlier transport/restart/UID proofs retain their own source scope;
this standalone page adds no service/timer/tunnel or production execution.

## Verification scope

The isolated review uses an owned ephemeral loopback HTTP503 helper and a real
browser. It checks responsive layout, both color preferences, locale/keyboard
behavior, contrast, 200%CSS zoom, JavaScript-disabled content, status/headers and absence of
provider/background traffic. Exact results and retained failures are recorded in
the [review checkpoints](review-status.md). No production endpoint or provider
journey is verified by that local helper.

Final actual HTTP/browser checks pass138/138 at320/390/1440 in both color
preferences, with24 real language switches, 44px controls and minimum measured
text contrast5.72:1. Separate local-file checks pass4/4, including French and
sanitized manual recheck. The initial109/110 report/source/screenshots preserve
the actual320px 200%CSS-zoom overflow; wrapping/min-width repair closes it.
This is CSS zoom/reflow evidence, not a native-browser zoom or full WCAG claim.
Fourteen expectedHTTP503 resource console messages are classified separately;
client/CSP errors and external/storage/cookie/fetch/XHR/beacon activity are zero.
All owned browsers/server close; no activation or production/provider change.

The138 HTTP/browser checks are bound to HTML SHA256
`9dd0b14b1e06cf0ff002197c028bf798abbcd860996ab61e5c56f6d423587830`.
The JSON's exact policy hashes match its embedded style/script bytes. Independent
source review passes. Preview app and earlier provider/learning proofs retain
their separate source and authorization scopes.
