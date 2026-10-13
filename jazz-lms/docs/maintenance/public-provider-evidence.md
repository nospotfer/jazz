# Public provider configuration evidence

Observed 2026-10-13, using read-only public requests.

The deployed public frontend embeds Supabase host
`feavujcllgbzlvdvkkxx.supabase.co`. Its public anon-role key was extracted and
used only in process memory; it was never printed or saved. This host differs
from the local `.env` host, `wmujuzheurvrfyebobcj.supabase.co`. Neither value
establishes which database currently holds the customer data or what the
production server environment contains.

The public homepage and `/auth` returned HTTP 200. Twenty same-origin Next.js
script chunks were fetched without executing JavaScript, starting analytics,
logging in, or submitting forms. No service-role JWT was detected in those
chunks; this bounded check does not establish that every deployed asset is safe.

Both Supabase hostnames currently fail DNS resolution from this machine with
`ENOTFOUND`. Independent Cloudflare and Google DNS-over-HTTPS A queries returned
DNS status 3 (NXDOMAIN), with no answers, for both hosts. The public website
hostname resolved and continued to return 200. This confirms unavailable public
DNS endpoints, rather than establishing whether the provider projects are
paused, deleted, renamed or recoverable.

`GET /auth/v1/health` with the deployed public anon headers could not reach the
service. `HEAD /rest/v1/<table>?select=id&limit=0` probes for the 23 Prisma LMS
tables and two lowercase messaging tables also failed before HTTP. No customer
rows or counts were requested, and no schema or RLS conclusion can be drawn.
Even a successful zero-row response would not establish row-level protection:
[Supabase distinguishes object grants from row policies](https://supabase.com/docs/guides/api/securing-your-api).

Before a production release, obtain authorized Supabase dashboard/project
inventory access, locate and preserve the actual customer database, and reconcile
the deployed public configuration with the server database/Auth configuration.
Verify schema, RLS, storage and Auth settings through authorized administrative
read access and isolated fixtures. Do not create or point production at an empty
replacement project based only on these public observations.

Sanitized probe evidence is saved locally at
`/tmp/jazz-maintenance/public-provider-evidence.json`. It contains hostnames and
status summaries only, with no key, bundle body, JWT payload or customer data.

## Newer GitHub preview deployments

GitHub's latest `Production` deployment record is `4786399978`, created
2026-05-22 at 17:26:19 UTC, for commit `c897f36da5a677097a91c6f509cc4a804a328051`
(source committed at 17:24:38 UTC). Three newer successful `Preview` records
were inspected:

| Deployment | Source commit/date (UTC) | Public environment URL | Current public access |
| --- | --- | --- | --- |
| `5146787983` | `d6911963` · 2026-06-22 05:34:41 | [June 22 preview](https://jazz-l5u16uf4s-gabriels-projects-bd92791f.vercel.app/) | Homepage and auth redirect to Vercel SSO, HTTP 302 |
| `5015217474` | `db0af6a9` · 2026-06-11 05:18:22 | [June 11 preview](https://jazz-kmn9ktphp-gabriels-projects-bd92791f.vercel.app/) | Homepage and auth redirect to Vercel SSO, HTTP 302 |
| `4933420159` | `50c2f87f` · 2026-06-04 13:02:58 | [June 4 preview](https://jazz-auu611vrd-gabriels-projects-bd92791f.vercel.app/) | Homepage and auth redirect to Vercel SSO, HTTP 302 |

Deployment protection was respected: no SSO redirects were followed, no bypass
was attempted, and no application chunks could be fetched. These newer source
dates do not establish their deployed Supabase configuration or locate a
resolving project. A `Preview` label also does not establish isolation of Auth,
customer data, payments or media. GitHub deployment metadata alone does not
establish the production alias's current target after any manual rollback.

Sanitized status/access evidence is at
`/tmp/jazz-maintenance/preview-deployment-evidence.json`. Authorized Vercel account
access remains necessary to inspect those environments and reconcile their
configuration with the public production frontend.
