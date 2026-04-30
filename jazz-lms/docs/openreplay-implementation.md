# OpenReplay Implementation

## Why Clarity Mirror Was Removed

The previous `/admin/heatmap` mirrored Microsoft Clarity Data Export API data
using `CLARITY_DATA_EXPORT_TOKEN`. That integration depended on:

- A short data window (3 days max per call).
- Aggressive daily quota (10 calls/day).
- An external server-issued JWT that had to be rotated.

So it was not a sustainable long-term heatmap/session replay solution. Clarity
was removed completely (script tag, Data Export API client, env vars and docs).

## What OpenReplay Handles

- Session replay.
- UX friction analysis.
- Frontend debugging.
- Heatmap-like behavior insights.

## What OpenReplay Does NOT Handle

- Revenue KPIs (`/admin/stats`, business DB).
- Course progress metrics (`/admin/stats`, business DB).
- Student counts (`/admin/stats`, business DB).
- Aggregate traffic (still served by GA4 via `metrics-ga.ts`).

## Environment Variables

All four are `NEXT_PUBLIC_*` because OpenReplay runs in the browser.

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_OPENREPLAY_ENABLED` | yes | `true` to load the tracker; anything else disables it. |
| `NEXT_PUBLIC_OPENREPLAY_PROJECT_KEY` | yes | Project key issued by OpenReplay (e.g. `aUW0mM7uSurSFlu9yfIp`). |
| `NEXT_PUBLIC_OPENREPLAY_INGEST_URL` | optional | Custom ingest endpoint (self-hosted). Empty for OpenReplay Cloud default. |
| `NEXT_PUBLIC_OPENREPLAY_DASHBOARD_URL` | optional | Used by `/admin/heatmap` to show a deep link to the dashboard. |

The CSP in `next.config.mjs` automatically allows the origin parsed from
`NEXT_PUBLIC_OPENREPLAY_INGEST_URL` (no wildcards). When that env is unset, no
extra origin is added to the policy.

## Tracked Routes

OpenReplay only loads in the public/student journey:

- `/` (landing).
- `/auth/*` (sensitive inputs masked).
- `/courses`, `/courses/[id]`.
- `/dashboard`, `/dashboard/courses/[id]`.
- `/dashboard/pdf-view`, `/dashboard/notes`, quiz pages.

## Excluded Routes

The provider explicitly skips:

- `/admin/*` — operator/admin activity is never recorded.
- `/api/*` — server endpoints.
- Password fields (`<input type="password">` are masked by the tracker).
- Payment fields (we use redirected hosted checkouts; payment data never
  enters our DOM).

## Failure Mode

Tracker initialization is wrapped in `try/catch` and uses dynamic import. If
the tracker module fails to load or `start()` throws, the app continues
working normally — no error bubbles to React.

## Source Files

- `src/lib/analytics/openreplay.ts` — lazy singleton with start/stop/identify
  helpers.
- `src/components/analytics/openreplay-provider.tsx` — client provider that
  listens to `usePathname()` and starts/stops the tracker per route.
- `src/app/admin/heatmap/page.tsx` — admin status page (no Clarity API calls).
- `next.config.mjs` — CSP entries for OpenReplay origin (only when configured).
