# Maintenance review checkpoints

Updated 2026-10-13. Draft review: [PR #46](https://github.com/nospotfer/jazz/pull/46)
on `maintenance/initial-audit`. Production is unchanged and maintenance remains
incomplete. A provider build success is not proof of an isolated, working preview.

## First published checkpoint

Revision `8e67b0d3303fc9858ad41cb97400b0c1ae38408e`:

| Remote check | Observed result |
| --- | --- |
| [Quality PR run](https://github.com/nospotfer/jazz/actions/runs/38329849521) | Build, lint, types, 775 normal tests and 37 persisted PostgreSQL tests passed; intentional opt-in/REST skips remain. |
| [Secret Scan PR run](https://github.com/nospotfer/jazz/actions/runs/38329849560) | Gitleaks passed. This does not revoke known historical test passwords. |
| [CodeQL analysis](https://github.com/nospotfer/jazz/actions/runs/38329847791) | Both analysis jobs passed, but the aggregate [CodeQL check failed](https://github.com/nospotfer/jazz/runs/115077040192) on two new high findings, alerts 14/15, in regex-based email conversion. |
| [Vercel build](https://vercel.com/gabriels-projects-bd92791f/jazz/CtxSA8pWACv4ypYfr8efEPpdisyo) | Success; GitHub deployment 7027429907. Exact URL: https://jazz-39g0lz0kf-gabriels-projects-bd92791f.vercel.app. HEAD checks of /, /auth and /robots.txt redirect to Vercel SSO; protection was respected. Remote provider isolation and customer journeys are unverified. |

The public repository's default-branch dependency banner still reports its
existing alerts. Maintenance-branch audit results do not resolve deployed or
default-branch dependency findings until the reviewed changes are released.

## Follow-up source checkpoint

Revision `37df1a0089d64dfd5c11975caf0aedd7ffa5055e` includes:

- `0619b69`: bounded parser-based HTML-to-plain-text conversion and actual inbox
  encoding regressions. Plain text remains preferred; signatures, authenticated
  sender checks, deduplication and text-only notifications remain enforced.
  The sinks did not establish executable HTML; the CodeQL findings were not
  dismissed. Their follow-up remote rescan marks both fixed.
- `37df1a0`: all 15 inventoried legacy mutators reject ambient production and
  unexpected local targets before client construction. Voucher reset requires
  user/course scope and explicit application. Deployment wrappers require the
  exact reviewed commit and linked project/team and recheck after preflights.
  They do not grant production approval or prove remote configuration.

An isolated Git-visible source copy, without private environment files, passed
fresh Node 24/npm 11 `npm ci`, lint (0 errors/25 existing warnings), TypeScript,
webpack and Turbopack builds and **925 normal tests, 38 intentional skips** in 82 passed/5
skipped files. Five guarded PostgreSQL suites separately passed **37 tests,
one REST-only skip**. The source Gitleaks scan found zero leaks; production npm
audit found zero vulnerabilities. The five documented high development-only
lint-chain findings remain.

These checks require explicit synthetic DATABASE_URL configuration; an initial
empty-environment run correctly rejected imports/build collection that require
that setting. The reproducible sequence is in [local verification](local-verification.md).
No real mutator or deployment was invoked by the wrapper/CLI regressions.

## Follow-up published verification

Revision `c6a0556264f803aceb99311d8efc588f52ff2208` contains the reviewed source
above plus checkpoint documentation. Actual remote checks all passed:

| Remote check | Verified result |
| --- | --- |
| [Quality PR run](https://github.com/nospotfer/jazz/actions/runs/38332857386) | Lint 0 errors/25 warnings, TypeScript, webpack build, 925 normal tests/38 intentional skips and 37 persisted PostgreSQL tests/one REST skip. Push Quality run 38332853063 also passed. |
| [Secret Scan PR run](https://github.com/nospotfer/jazz/actions/runs/38332857318) | Success; push Secret Scan run 38332853065 also passed. Local redacted history scan covered 285 commits with zero findings. Known historical test passwords remain the owner's rotation task. |
| [CodeQL analysis](https://github.com/nospotfer/jazz/actions/runs/38332854151) and [aggregate check](https://github.com/nospotfer/jazz/runs/115086427261) | Success. PR-scoped alerts 14/15 have state fixed, and the open-alert query for PR #46 returns zero. This is branch evidence, not proof that production/default-branch issues are resolved. |
| [Vercel build](https://vercel.com/gabriels-projects-bd92791f/jazz/EiBBxrnsEzA4UP2NdFbWtgCwoLxD) | Success; GitHub Preview deployment 7027902333, exact source c6a0556, exact URL https://jazz-gaqqmqu84-gabriels-projects-bd92791f.vercel.app. All three HEAD checks (/ /auth /robots.txt) return 302 to Vercel SSO; no bypass or customer flow was attempted. |

Next: preserve the account/provider gaps in the
[verification matrix](verification-matrix.md) and [release gates](release-checklist.md).
Both known Supabase endpoints fail DNS; customer data preservation, current
Supabase manager/test-Dodo access, Google OAuth and approved email evidence remain
essential requirements. Do not merge or release this draft as proof of those
integrations. The newer authenticated provider checkpoint below supersedes the
earlier Vercel-access and live-target assumptions.

## Documentation HEAD verification

Revision `de5e634821cae5ffc21f56d1a1fdea3b92569d52` also passed actual
[Quality PR](https://github.com/nospotfer/jazz/actions/runs/38333404521),
[Secret Scan PR](https://github.com/nospotfer/jazz/actions/runs/38333404534),
[CodeQL](https://github.com/nospotfer/jazz/actions/runs/38333400204) and
[Vercel build](https://vercel.com/gabriels-projects-bd92791f/jazz/3eELf1x88UEgGdsGsiTf9CKCy2bo).
Preview deployment 7027980406 has exact URL
https://jazz-awf49dt6l-gabriels-projects-bd92791f.vercel.app; homepage/auth/robots
HEAD requests redirect to SSO. Isolation and customer journeys remain unverified.

## Authenticated provider checkpoint

Vercel CLI login on the remote machine now works. Neurofactory OWNER access
identifies the actual live custom-domain target as jazz-lms deployment
`dpl_6Xo6rUDVdh9jTWg4KoH1ok6iyU3D`, June 11 redeploy, reported source `50c2f87f`,
Node 20, no Git link. Both aliases and public script-path fingerprints agree.
This supersedes the historical May GitHub Production record as the live baseline.
One confirmed owner and active Hobby plan are verified; commercial hosting needs
an owner plan/hosting decision. [Vercel audit](vercel.md).

Readable configuration recovers valid Dodo live access. Eight GETs verify the
€29.90 EUR tax-exclusive product/business, enabled webhook and matching signing
key. Production and preview share live resources; development's live-only key
returns 401 in test mode. Separate test access and dashboard/delivery evidence
remain required. [Dodo audit](dodo.md).

At that checkpoint the manager CLI was unauthenticated. Native Supabase login
now works and the subsequent evidence below identifies the existing customer
project. Public DNS failure alone never established pause/deletion/data loss.

## Provider-evidence documentation verification

Revision `ad61d7c5de717e11a21cbdf1b505d857f8206bf0` passed
[Quality PR](https://github.com/nospotfer/jazz/actions/runs/38381709357),
[Secret Scan PR](https://github.com/nospotfer/jazz/actions/runs/38381709464),
[CodeQL](https://github.com/nospotfer/jazz/actions/runs/38381706185) and
[Vercel build](https://vercel.com/gabriels-projects-bd92791f/jazz/BWjWURduMqj2nkLdiU4C2auYYQEz).
Push Quality/Secret Scan also pass. Exact Preview deployment 7035778099:
https://jazz-q16rbw7pb-gabriels-projects-bd92791f.vercel.app. HEAD homepage/auth/
robots all redirect to SSO; no bypass, remote customer journey or isolation proof.

## Supabase manager and UX follow-up

Authenticated inventory/project GET finds feav Jazz-LMS-Project INACTIVE,
eu-west-1/PG17 in Free Neurofactory Org. Caller matches its sole Owner; member
MFA false. Matching restore engine/version is advertised; backup list empty,
PITR off, managed backup retention entitlement zero. This is not recovered-data
proof. Stored Google/SMTP configured, production PKCE reset callback missing,
global Vercel redirect allowance present. [Recovery proposal](supabase.md).
The bounded same-project resume/preservation/re-pause proposal awaits explicit
production approval; no production mutation or SQL has occurred.

Source `47c383d996c1346a39bf5e6dd07a460b18a04afb` localizes voucher success/error
feedback in both entry points, retains stable failure reasons through atomic
rechecks, and localizes sidebar accessibility labels. Fresh local suite:
**944 passed, 38 skipped**, 84 passed/5 skipped files; TypeScript and webpack
build pass, lint 0 errors/25 warnings. Updated affected source in the isolated
app passes native PDF desktop/mobile and actual voucher redemption/cleanup:
**3/3 browser cases**. Component tests use actual language providers with mocked
API responses; they do not prove Dodo. Fresh remote follow-up checks pending.
