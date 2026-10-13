# Maintenance review checkpoints

Updated 2026-10-13. Draft review: [PR #46](https://github.com/nospotfer/jazz/pull/46)
on `maintenance/initial-audit`. Source is unreleased and maintenance remains
incomplete. The separately approved production Supabase recovery/export/unsafe-state
rollback completed; production is paused again. A provider build success is not
proof of an isolated, working preview. Historical checkpoints below retain the
evidence available at their dates; the latest sections supersede old access gates.

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
API responses; they do not prove Dodo.

Published revision `d02b1b13cb9dbb3b1e46a024a75f6b18103096e0` includes that
source and manager/recovery documentation. Actual remote checks all pass:

| Remote check | Verified result |
| --- | --- |
| [Quality PR](https://github.com/nospotfer/jazz/actions/runs/38387928895) | 944 normal tests/38 skips, 37 persisted PostgreSQL tests/one REST skip, lint 0 errors/25 warnings, TypeScript and webpack build pass. Push run 38387923077 also passes. |
| [Secret Scan PR](https://github.com/nospotfer/jazz/actions/runs/38387929034) | Success; push run 38387923038 also passes. |
| [CodeQL](https://github.com/nospotfer/jazz/actions/runs/38387923923) and [aggregate](https://github.com/nospotfer/jazz/runs/115264435276) | Success. |
| [Vercel build](https://vercel.com/gabriels-projects-bd92791f/jazz/FkFBKD4tyyEMxVJCPwC4i3LQMES3) | Success; exact Preview deployment 7036803945, https://jazz-2skowqoe3-gabriels-projects-bd92791f.vercel.app. Its account/configuration remains unreconciled with authenticated Neurofactory access. No SSO bypass or remote customer journey. |

Source `835d22c` subsequently retains the deployed June PDF cache default and
optional `.docx.pdf` filename normalization. Scoped lint and 83 relevant tests
pass. No PDF mutator or provider write was executed by that change.

An independent Free cloud Supabase preview is now healthy, with hardened tables
and synthetic accounts/course/private PDFs. Its local frontend runs on loopback
3012 with sending/payments/tracking disabled. [Preview identity and evidence](preview.md).
This does not establish customer-project recovery or a verified HTTPS Vercel
preview. Production remains untouched, and resume approval is still pending.

## Scoped PDF audit and reproducible runner

Source `3dc76f3eb69fb5f6dedbe35c95f33c83e1f8e61c` adds the explicit-project/course,
read-only, bounded PDF audit and 45 focused regressions. A newly copied Git-visible
application without private env files passes Node24/npm11 `npm ci`, **989 normal
tests/38 intentional skips** in 85 passed/5 skipped files, TypeScript, webpack
build and lint 0 errors/25 existing warnings. Production dependency audit remains
zero; full audit remains the same five high development lint-chain findings.

The pinned tsx 4.23.15 runner uses its supported locked esbuild 0.28.2 dependency;
the stale global 0.25 override was removed. The new installed CLI, not an on-demand
runner, independently succeeds against all 60 synthetic cloud attachments with
strict CA-bound TLS and read-only metadata. Accepted checked bytes 200,304, unique
hashes 60 and complete independent fixture-ID coverage. [Audit boundaries](operational-scripts.md#scoped-read-only-pdf-audit).
No production query, signed URL creation or attachment write. The later
published source checkpoint below includes this audit and its compatibility fix.

Follow-up source `d46b21430e2d5f6425eb80717aa25c7d1251745a` fixes opaque secret-key
headers according to the current Supabase contract. The focused suite now passes
46 cases, and the fresh full suite passes **990 normal tests/38 intentional skips**
in the same 85 passed/5 skipped files; types/scoped lint pass. Actual cached
opaque-key authentication reads all 60 synthetic PDFs/200,304 accepted bytes,
with every fingerprint identical to the prior legacy-key read. No key creation,
rotation or production request. These overlapping reads are not extra coverage
counts. The frontend's separate 29-case cloud proof, 20 overlapping modern-key
compatibility checks and HTTPS/Dodo limits remain
in [preview evidence](preview.md).

## Published PDF-audit source verification

Exact revision `d46b21430e2d5f6425eb80717aa25c7d1251745a` is pushed. Actual
remote checks all pass:

| Remote check | Verified result |
| --- | --- |
| [Quality PR](https://github.com/nospotfer/jazz/actions/runs/38400304553) | Downloaded job logs confirm 990 normal tests/38 intentional skips, 37 persisted PostgreSQL tests/one REST skip, lint 0 errors/25 warnings, TypeScript and webpack build. Push run 38400298133 also passes. |
| [Secret Scan PR](https://github.com/nospotfer/jazz/actions/runs/38400304478) | Gitleaks success; push run 38400298011 also passes. |
| [CodeQL analysis](https://github.com/nospotfer/jazz/actions/runs/38400297891) and [aggregate](https://github.com/nospotfer/jazz/runs/115306092279) | Success. |
| [Vercel build](https://vercel.com/gabriels-projects-bd92791f/jazz/DMwcH6ZDDEzT4kCB4xm4SWKM25QM) | Success; exact Preview deployment 7038968173, https://jazz-5k246l58y-gabriels-projects-bd92791f.vercel.app. HEAD /, /auth and /robots.txt return 302 to Vercel SSO. Account/configuration remain unreconciled; no protection bypass or remote customer journey. |

The separate synthetic cloud backend works through its loopback frontend;
that evidence does not verify this protected HTTPS deployment or customer-data
recovery. At that checkpoint production had not yet been resumed. Later documentation-only commits do not
alter the immutable source/check checkpoint above.

## Approved preservation and source follow-up

The owner approved exactly the existing production Supabase resume, immediate
private preservation and bounded same-project re-pause rollback. The project
became healthy; full DB and 68 private Storage objects were exported, catalog
inspection confirmed critical unsafe browser permissions, and the approved
rollback returned it to INACTIVE. No production SQL/configuration/code repair
or another resume is authorized. Offline restore matches 65 archive COPY table
counts / 2,239 records, two sequences and every Storage object/hash, with explicit
extension ACL/platform/atomic-snapshot/off-site limits. A durable private local
copy and verification reports exist. [Recovery outcome](supabase.md).

The supplied Dodo TEST key works for the matching business. One dedicated
product was created at EUR29.90, then a verified price-only test-resource change
aligned it to the unchanged synthetic course price, EUR80. Two provider coupons
(10% and EUR5) were created and retrieved through seven bounded requests.
Transactions/listener/mail remain disabled. Controlled customer email is recorded
privately; merchant and webhook-alert recipients remain pending. [Sandbox preparation](dodo.md).

Source `8716dd3` fixes the actually reproduced cross-account note cache/autosave
leak, binds writes to expected verified identity, preserves owned dirty drafts
and adds explicit save recovery. It also removes the dashboard overlay only for
the exact lesson-authorized notes page. Source `85f4e12e5b5c8ae8cf1059b70d15bf0ada2b41ac`
adds bounded quiz transaction acquisition waits after real cloud P2028 and local
single-connection reproduction. Both are pushed; neither is deployed to production.

A Git-visible source copy with no private env files passes **1,039 normal tests /
40 intentional skips**, 88 passed / five all-skipped files, TypeScript, webpack
build and lint **0 errors / 25 existing warnings**. Five actual guarded PostgreSQL
suites pass **39 tests / one REST-only skip**. An extraneous private debug .cjs
helper initially caused an ESLint configuration failure in the copy; preserving
it outside the source tree restored the actual clean-source lint pass. No source
rule was suppressed to hide that preparation mistake.

Actual remote source checks pass:

| Remote check | Verified result |
| --- | --- |
| [Quality PR](https://github.com/nospotfer/jazz/actions/runs/38420660371) | Downloaded logs confirm 1,039 normal tests/40 skips, 39 persisted tests/one REST skip, lint 0 errors/25 warnings, types and webpack build. Push run 38420650782 also passes. |
| [Secret Scan PR](https://github.com/nospotfer/jazz/actions/runs/38420660437) | Gitleaks success; push run 38420650864 also passes. |
| [CodeQL analysis](https://github.com/nospotfer/jazz/actions/runs/38420651969) and [aggregate](https://github.com/nospotfer/jazz/runs/115377041415) | Both analysis jobs and aggregate pass. |
| [Existing GitHub Vercel build](https://vercel.com/gabriels-projects-bd92791f/jazz/G1Fm9sp8iR9yhJW5BoakYCG1QABK) | Success; Preview7042420678, https://jazz-bzv4fjqr7-gabriels-projects-bd92791f.vercel.app. Account/provider isolation remains unreconciled; no customer journey or paid hosting decision inferred. |

The exact 235-file source copy on the separate cloud backend passes the distinct
26-check learning continuation and 19-check actual-pointer notes/privacy/recovery
run. Existing 29-case and overlapping 20-case reports remain immutable. The
intercepted PUT500 is explicitly mocked; the subsequent manual PUT200 and server
reload are actual app persistence. Final independent counts and exact purchase
fields are unchanged. [Detailed boundaries](preview.md#learning-and-note-recovery-follow-up).

The owner has set a zero-cost hosting budget. A separate production-built
frontend now passes **44/44 unique HTTPS checks** through a protected free
temporary tunnel: native secure sessions, role/access denials, actual video,
native mobile PDFs, profile and vector certificate download. Independent
post-browser read-only verification confirms unchanged learning, notes, exact
purchases and zero payment/voucher/discount/messaging activity. Two earlier
harness diagnostics and overlapping continuation attempts remain explicit.
[HTTPS evidence and deadline](preview.md#free-https-frontend-checkpoint).

No paid upgrade, production release or domain move occurred. Stable free hosting,
old credential-bearing deployment quarantine, production hardening/configuration,
signed Dodo delivery/transactions, Google/SMTP/receiving, account recovery and
release/rollback gates remain open.

## Diagnostics confidentiality source follow-up

Source `27d7b4c07fb8b440be979909b5b140bb4dc50c48` is pushed. A bounded closed-mock
review reproduced raw payment-provider/error/email/voucher-code diagnostic
exposure. The repair emits only finite categories, known database codes and
validated numeric HTTP statuses; provider bodies/arbitrary exceptions cannot
enter new voucher or webhook failure diagnostics. Auth callbacks/session and
reconciliation logs use the same contract. Existing discount backfill, retry,
usage-limit decisions and localized customer responses remain unchanged.

Clean no-env verification passes **1,077 normal tests / 40 intentional skips**
(90 files with passes / five all-skipped), **39 real PostgreSQL tests / one
REST-only skip**, TypeScript, webpack build and lint **0 errors / 25 warnings**.
The 38 new confidentiality regressions are included in the normal total.

| Remote check | Verified result |
| --- | --- |
| [Quality PR](https://github.com/nospotfer/jazz/actions/runs/38437695616) | Downloaded logs independently confirm 1,077/40 normal, 39/1 persisted, lint0/25, types and webpack build. Push38437687326 passes. |
| [Secret Scan PR](https://github.com/nospotfer/jazz/actions/runs/38437695531) | Success; push38437687360 passes. |
| [CodeQL](https://github.com/nospotfer/jazz/actions/runs/38437691191) and [aggregate](https://github.com/nospotfer/jazz/runs/115436162401) | Success. |
| [Existing GitHub Vercel build](https://vercel.com/gabriels-projects-bd92791f/jazz/co1MCaNGi1e24f87uTbr6526Xs9k) | Success in the same unreconciled protected scope; no isolated-journey/production claim. |

The free frontend is freshly rebuilt at the same HTTPS origin with all 523
committed files, including 256 application/schema/config hashes, modern keys and
strict TLS. Source85's app/build/evidence are preserved. A first incomplete
private copy omitted support scripts and failed typecheck; the corrected full
archive configured build passes. The gate stayed closed until actual runtime
and client-secret checks passed. Source27 browser follow-up is separate from
the immutable 44-check source85 report. It passes45/45 distinct checks with four
fresh native role sessions, identity/permission/media/native-PDF/mobile/profile/
certificate proof and no learning/payment/mail writes. All75 earlier evidence
files remain unchanged. The final independent strict-CA read-only snapshot at
17:36 UTC matches both prior baselines, including learning timeline, notes,
exact purchases and zero payment/voucher/discount/messaging records.

A separate PDF diagnostic verifies visible synthetic page/text at 1440/320/390.
Enforced policy events identify excluded Spotify frames and optional Google Cast
in course HTML, with no PDF rendering failure or policy change. One additional
native buyer session only; all 88 prior artifacts unchanged. The three owned
temporary process groups were closed at 17:50 UTC, retaining local3010/3012 and
fixture data. [Exact scope](preview.md#current-diagnostics-source-https-follow-up).
No production release, payment, mail or DNS change occurred.

## Application diagnostics and exact-project analytics

Source `491a02cb984b5b8e9364afa824e8aca2a51c0298` extends the finite diagnostic
contract to application-owned Auth/voucher/media/messaging/dashboard/admin logs
and client error boundaries. Registration/resend responses omit provider prose;
customer Auth/video failures omit server setup instructions. All53 new closed-
mock disclosure regressions reproduce before the repair and pass after it.
Successful operations and existing failure/rate-limit statuses are preserved.

Latest source `530e9bb50f0eae6dea9679f23a15f0045a4a80e1` prevents OpenReplay from
falling back to another project in the same organization. IDs must be valid,
inventory/key must exactly match, and main/daily failures are unavailable data,
not healthy zero activity.45 new closed-fetch ownership/request/failure/healthy-
data cases pass. This is source proof, not actual account access/cross-tenant
exposure. The admin page retains its `analytics.read` permission guard.

Clean verification and downloaded exact-source Quality logs confirm **1,175
normal passes/40 skips**,92 files with passes/five all-skipped, **39 actual
PostgreSQL passes/one REST-only skip**, TypeScript, webpack and lint0errors/
25existingwarnings. Exported531 committed files pass redacted Gitleaks with
zero findings; no private env copied. Source491's first pre-push lacked the
documented synthetic DATABASE_URL; the explicit loopback retry passed, with
the failed environment diagnostic preserved.

| Remote check | Verified result |
| --- | --- |
| [Quality PR](https://github.com/nospotfer/jazz/actions/runs/38454048826) | Downloaded counts1,175/40 and 39/1, lint0/25, types/build pass. Push38454039034 passes. |
| [Secret Scan PR](https://github.com/nospotfer/jazz/actions/runs/38454048944) | Success; push38454039024 passes. |
| [CodeQL analyses](https://github.com/nospotfer/jazz/actions/runs/38454041280) and [aggregate](https://github.com/nospotfer/jazz/runs/115492310165) | Success. |
| [Existing protected Vercel build](https://vercel.com/gabriels-projects-bd92791f/jazz/EX22ccMmPSikyguSmNpKEgRzgrtS) | Success; account/provider isolation remains unreconciled. |

Earlier source27's 45 HTTPS checks and visual PDF/unchanged-data comparison
remain immutable; they are not current-head browser proof. Native isolated
review confirms forwarded-IP assumptions, expired limiter retention, continuing
work after client abort and a writable-cache requirement. Limiter/sweep/ingress/
cache repairs and a final package verification remain outstanding. All owned
native/account browsers/processes closed; no production/provider configuration,
mail, transaction, DNS or paid-plan change. The goal is active and incomplete.

## Native storage and sweep source checkpoint

Source `98db3b1` includes limiter `822e6cd` and the cooperative sweep/read/continuation
repair. A clean 535-file copy passes 1,251/40 normal, types, webpack and
lint 0 errors/25 warnings. The 76 new regressions comprise 26 storage, 30 Dodo read and 20
sweep cases. Independent mocks also verify 500 queued retries free capacity and
normal cursor work resumes; they are not added to the normal suite total.

Previous Dodo source passes 5/fails 25 in the new 30-case suite; original capacity
retention/raw-key/denied-growth defects were independently reproduced. The
first-draft live-queue deadlock was repaired before the final tests.
[Operational behavior](native-runtime.md) states uncancellable Prisma, process
restart/distributed limits, unavailable-user saturation and historical recovery
gaps. No ledger migration, provider/DB request or production write occurred.

Exact-source Quality, Secret Scan and CodeQL pass. Downloaded
[Quality logs](https://github.com/nospotfer/jazz/actions/runs/38461175029) verify
1,251/40 normal and 39/1 persisted PostgreSQL counts, types/build and lint 0/25.
The first count parser omitted ANSI controls; the corrected parser verifies both
counts while retaining that diagnostic. Source27's 45 HTTPS checks remain
separate historical evidence. The
final native ingress/cache/start/runner package and latest-source frontend proof
are still outstanding. Goal remains active and incomplete.
