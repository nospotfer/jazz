# Optional analytics and OpenReplay

The browser starts optional measurement only after an explicit choice in the
privacy controls. Statistics/video quality and session replay have separate
checkboxes, initially off. “Solo necesarias” is as accessible as accepting
optional measurement. The visitor can reopen “Privacidad” to change the choice.
The versioned preference is stored locally for at most 180 days; blocked storage
keeps the choice only in that page. Do Not Track and Global Privacy Control
override an affirmative preference.
Declining a category clears its known, JavaScript-accessible browser identifiers
without changing language or authentication storage. The app also clears legacy
optional identifiers for visitors with no affirmative choice.

## Eligible content

Only the public homepage `/` is eligible. Known homepage section anchors are
allowed, but their values are removed from recorded URLs. A query-bearing or
unknown-anchor homepage URL is excluded as well, including OAuth callbacks.
Replay also skips visits with an incoming private-path or query-bearing referrer:
the installed SDK does not apply its URL sanitizer to that field.
All auth, account, student, course, notes, quizzes, PDF, message, payment, redeem,
admin and API routes are excluded, even after opt-in. Private lesson players
always have Mux Data tracking and its cookies disabled.

OpenReplay hides entire forms, all inputs, media/iframes and explicitly private
DOM elements. It also obscures incidental email/number text. Network capture,
headers, request/response payloads, console capture, exception capture and
resource timings are disabled. No user ID or metadata identification helper is
exposed. URL sanitization retains only the public origin and `/`; the title is
fixed to the site brand. Navigation guards stop measurement before application
history updates, and cancellation checks prevent a late SDK start from resuming
on a private page.

These are technical collection limits, not a claim that replays are anonymous.
Provider retention, processing location, historic data, account access and any
legal/privacy notice still require owner review. Existing provider data is not
deleted by changing a browser preference.

## Configuration and release gates

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_OPENREPLAY_ENABLED` | Exactly `true` permits loading after replay opt-in. Otherwise disabled. |
| `NEXT_PUBLIC_OPENREPLAY_PROJECT_KEY` | Browser project key; never a server API credential. |
| `NEXT_PUBLIC_OPENREPLAY_INGEST_URL` | Optional HTTPS ingest endpoint; empty uses OpenReplay Cloud. |
| `NEXT_PUBLIC_OPENREPLAY_DASHBOARD_URL` | Link shown to an authorized admin. |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Optional GA4 ID, strictly `G-` plus uppercase letters/numbers. |
| `OPENREPLAY_API_KEY`, `OPENREPLAY_PROJECT_ID`, `OPENREPLAY_API_URL` | Server-only admin API configuration. |

GA4 loads only after statistics opt-in, queues denied defaults before loading,
keeps advertising storage/signals denied, and sends a manual homepage pageview
with a sanitized URL, title and referrer. `send_page_view: false` disables the
configuration pageview. **Before enabling GA4, disable Enhanced Measurement's
automatic history pageviews, form interactions, outbound clicks, downloads and
video events in the provider account.** Those provider features could otherwise
collect private paths or form/link metadata independently of manual events.
Leave the measurement ID unset until verified in an isolated preview.

Configured SDK origins must also be allowed by the CSP. Permission in the CSP
does not start collection; visitor consent and route checks still apply. Check
the deployed headers and network behavior with providers mocked before enabling
either integration. No maintenance change authorizes a production provider
configuration write or historic-data deletion.

## Admin reports and failure behavior

`/admin/heatmap` shows OpenReplay API activity over seven days, rather than a
complete visitor count. New recordings include only consenting homepage
visitors; historical provider data may include previously recorded private
routes. Revenue, student counts and course progress come from the business DB,
not replay. GA4 aggregate traffic is also consent-limited.

The tracker is imported lazily and failures stay out of the public UI. Admin
reports distinguish unconfigured and failed provider requests. The client never
loads the replay SDK just to stop an unconfigured/unconsented tracker.
HTTP local previews leave replay disabled because the SDK requires HTTPS;
SDK regression tests use an HTTPS browser origin and a mocked provider.

## Sources and implementation

- [Google consent mode](https://developers.google.com/tag-platform/security/guides/consent)
- [GA4 pageviews and automatic history events](https://developers.google.com/analytics/devguides/collection/ga4/views)
- [OpenReplay constructor options](https://docs.openreplay.com/en/sdk/constructor/)
- [OpenReplay network capture](https://docs.openreplay.com/en/sdk/network-options/)
- [Mux Player tracking and cookie controls](https://www.mux.com/docs/guides/player-api-reference)
- `src/lib/analytics/consent.ts` and `navigation.ts`: preference, privacy signals, URL eligibility, navigation guard.
- `src/components/analytics/privacy-controls.tsx`: localized public controls and accessible settings dialog.
- `src/lib/analytics/openreplay.ts` and its provider: lazy, masked, cancel-safe public replay.
- `src/lib/analytics/google-analytics.ts` and its loader: sanitized optional public pageviews.
- `src/components/landing/promo-video.tsx`: public Mux Data and cookie consent.
- `src/app/admin/heatmap/page.tsx`: authorized, consent-limited reports.
