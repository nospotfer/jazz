# Vercel account and deployment audit

Observed 2026-10-13 through authenticated REST GETs and public HTML requests.
No project settings, environments, aliases, deployments or plans were changed.
Raw responses and recovered credentials remain outside Git with private file
permissions. Published evidence contains identifiers and selected metadata only.

## Authoritative live target

| Item | Verified value |
| --- | --- |
| Team | Neurofactory, `neurofactorys-orgs-projects`, `team_u4fDHjN9J7mqJuDlulZmzrPc` |
| Authenticated access | OWNER; one confirmed OWNER member, no next member page or pending invites |
| Plan | Hobby, active; no observed soft block; actual consumption and recovery/MFA state unverified |
| Live project | `jazz-lms`, `prj_lEwrHldvtbnCByMPA9gvGzqVqpts` |
| Apex and www target | `dpl_6Xo6rUDVdh9jTWg4KoH1ok6iyU3D`; both project domains verified |
| Direct deployment | https://jazz-4k7e4unoj-neurofactorys-orgs-projects.vercel.app |
| Creation / readiness | 2026-06-11 05:21:22 / 05:23:39 UTC; READY, production, source `redeploy` |
| Reported source | `50c2f87fa0b4d458b90f88943720817bc690db58`, ref `jazz-lms-dev-vercel` |
| Runtime / linkage | Node 20.x; no project Git link or deployment gitSource; root/framework/build/install overrides unset |
| Function defaults | Fluid enabled; default region `iad1`; database region not inferred from this |
| Canonical redirect | Apex → https://www.culturadeljazz.com, HTTP 308 |

The authenticated alias and domain APIs agree on the exact deployment. Public
homepage/auth return 200 and their Next.js script-path fingerprints match that
direct deployment. These checks did not execute JavaScript or submit forms.
Reported Git metadata does not prove a clean checkout: this is a redeploy with
no linked repository. The old May GitHub Production record is not the current
custom-domain target. No rollback promotion has been tested.

An accessible second project, `jazz` (`prj_wi9BrscekrFBAwYYdW08QSZfEb8s`), uses
Node 24.x and has no custom domain, environment variables or Git link. Its
production target reports source `a2b03dd6`, not the maintenance revision.
Obsolescence is unproven; preserve it. GitHub PR previews under
`gabriels-projects-bd92791f/jazz` are a separate scope whose account configuration
has not been reconciled with this authenticated team.

## Configuration findings

| Area | Verified configuration | Required next action |
| --- | --- | --- |
| Supabase | Production, preview and development all reference `feavujcllgbzlvdvkkxx.supabase.co`; both this and the legacy local project have NXDOMAIN evidence. | Manager inventory, preservation/recovery and actual Auth/schema/storage/backup inspection before changing production. |
| Database connections | Production pooler uses `aws-1-eu-west-1` and direct host `db.feavujcllgbzlvdvkkxx.supabase.co`; preview/development direct configuration uses `aws-0-us-east-1` pooler for the same project. | Compare with the manager's actual region and supported connection strings; do not assume these historical strings establish the region or connectivity. |
| Dodo | Production and preview share live mode, API key, product, business and signing secret. Development selects test mode with that same live-only API key; test GETs return 401. | Separate test credentials and isolated preview dependencies; see [Dodo audit](dodo.md). |
| App origins | Production APP_URL and NEXT_PUBLIC_APP_URL use the apex; preview uses dev.culturadeljazz.com; development uses localhost. | Review canonical www origin, exact callbacks and a separate preview allowlist together. |
| Runtime | Live project and deployment use Node 20.x; reviewed source uses Node 24.x. | Verify Node 24 and build/root settings in the isolated target before proposing the production settings change. |
| Cron | `/api/cron/payments-sweep`, `15 3 * * *`, enabled; CRON_SECRET absent from project variables and the live deployment's environment names. | Prepare the bearer secret/configuration with the hardened code release. Do not invoke the live sweep during inspection. Execution/failure history is unverified. |
| Replay | NEXT_PUBLIC_OPENREPLAY_ENABLED is true in all three targets. | Current consent/private-route repairs are undeployed; inspect account retention/settings and review disabling replay at release. |
| Resend | Readable sending key matches the previously audited account; native receiving env names absent. | Existing receiving/webhook/MX activation gates still apply; see [Resend audit](resend.md). |

Documented environment GETs recovered 43 readable entries. Sensitive production/
preview service-role and private signer values were not returned as plaintext;
their protection was respected. A public `sb_publishable_` Supabase key is valid
key-format metadata, not evidence of successful service authentication. A legacy
development service-role key references the same project, but its claims alone
do not establish project health or authorization. No recovered secret is copied
into the repository, logs, screenshots or shell arguments.

## Account and release gates

Vercel's current [Hobby policy](https://vercel.com/docs/plans/hobby) limits that
plan to personal non-commercial use. Its
[commercial-use definition](https://vercel.com/docs/limits/fair-use-guidelines#commercial-usage)
includes advertising or processing product sales. The site's paid course and
active live Dodo product therefore require an owner decision about a suitable
plan/hosting arrangement. No upgrade, transfer or payment-method change was made.

Supabase manager authentication now works: the existing customer project is
INACTIVE, eu-west-1/PG17, with stored Google/SMTP configuration and specific Auth
redirect gaps. Review the [same-project recovery proposal](supabase.md), preserve
the customer project, and prepare a distinct preview with isolated Auth/database/
storage and Dodo test mode. Do not deploy a customer test into the live project's
current preview configuration. Verify the exact source, Node/build settings,
remote customer journeys, webhook handling and rollback compatibility. Production
configuration/deployment requires approval for the concrete operation. Remaining
usage/logs, billing/recovery/MFA, GitHub scope and prior deployment restorability
must stay explicit; one OWNER member does not prove a recovery path.

Primary API references: [alias](https://vercel.com/docs/rest-api/aliases/get-an-alias),
[project domain](https://vercel.com/docs/rest-api/projects/get-a-project-domain),
[deployment](https://vercel.com/docs/rest-api/deployments/get-a-deployment-by-id-or-url),
[team](https://vercel.com/docs/rest-api/teams/get-a-team) and
[members](https://vercel.com/docs/rest-api/teams/list-team-members).
Sanitized local evidence: `/tmp/jazz-maintenance/vercel-live-target-summary.json`
and `/tmp/jazz-maintenance/vercel-account-access-summary.json`.

## Concrete commercial-hosting decision

The owner has now set a **zero incremental hosting budget** and rejected a paid
upgrade for this low-revenue project. Do not upgrade, add a card/seat, enable
paid usage or repeat the same Pro approval request. The earlier cost research
below is retained as evidence, not the selected plan. The existing Hobby
commercial-use mismatch remains documented; low sales do not establish a
provider policy exception.

The free HTTPS preview uses a temporary Cloudflare Quick Tunnel to a separate
production-built synthetic frontend on the existing machine. This
needs no Cloudflare account or domain/DNS change and is documented for testing,
not production hosting. It has no SLA, changes URL after restart, supports
200 concurrent requests and does not support SSE. The completed 44-check HTTPS
run and independent preserved-data comparison are [recorded separately](preview.md#free-https-frontend-checkpoint).
Payment/mail/tracking remain disabled and access is protected;
no real-email PIN gate or unsigned webhook bypass is implied.
[Quick Tunnel documentation](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/).

An exact-commit HTTPS preview can satisfy the customer-journey review without
being a Vercel deployment. A stable zero-cost production hosting alternative
and any domain/runtime move still require a concrete compatibility/rollback
review and explicit production approval. No existing deployment is moved here.

For this exact Neurofactory team, current Pro pricing starts at **USD 20/month**:
the platform fee includes one deploying seat and USD 20 usage credit. The
observed sole Owner therefore gives a USD 20 base, plus actual usage and applicable
taxes. Both accessible projects share team billing; there is no per-project
USD 20 base. Extra members/add-ons remain outside this proposal.
[Pro platform fee](https://vercel.com/docs/plans/pro-plan#platform-fee).

This paid option was rejected by the owner. Its checkout, renewal, tax and
proration were not executed or verified. The selected free preview leaves the
existing live Hobby commercial-use issue for the stable hosting review. No plan,
card, project transfer, production deployment or spending setting was changed.

Current [Flat Rate CDN](https://vercel.com/docs/pricing/flat-rate-cdn) includes the
initial 1M-request/1TB tier in Pro; over-capacity traffic can increase the next
cycle's tier fee, and tiers do not automatically downgrade. Do not use cached
older allocations or promise a fixed USD 20 total. Subscription renewal,
cancellation/downgrade timing and generally non-refundable fees are covered by
[self-service terms](https://vercel.com/legal/terms).

[Spend Management](https://vercel.com/docs/spend-management) covers beyond-credit
metered usage, with reporting delay; it is not a total-invoice cap for seats,
add-ons or every integration. Automatic pausing can stop both live production
projects with HTTP 503 while previews/build usage may continue. Configuring that
shared outage behavior needs explicit approval; an alert-only proposal does not
set an automatic outage or a hard bill cap. Downgrade can require domain/store
transfers and member changes, so plan rollback also needs review.

The authenticated last-30-day CLI read with documented flags returns no JSON
and reports billing cost data unavailable for the range, potentially because
there is no active subscription/data yet. This is an inspection limit, not zero
usage or zero outstanding charges. The separate current-cycle read likewise
reports unavailable billing data/no active subscription and returns no JSON.
The private decision brief is
`/tmp/jazz-maintenance/vercel-hosting-decision.md`; actual checkout/invoices and
usage remain owner/provider verification gates.
