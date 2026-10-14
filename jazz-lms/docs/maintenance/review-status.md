# Maintenance review checkpoints

Updated 2026-10-14. Draft review: [PR #46](https://github.com/nospotfer/jazz/pull/46)
on `maintenance/initial-audit`. Source is unreleased and maintenance remains
incomplete. The separately approved production Supabase recovery/export/unsafe-state
rollback completed; production is paused again. A provider build success is not
proof of an isolated, working preview. Historical checkpoints below retain the
evidence available at their dates; the latest sections supersede old access gates.
Current application source: `a207f36`; see
[payment history recovery and account isolation](#payment-history-recovery-and-account-isolation).
Earlier accounting, editor, language, learning and media scopes retain their
separate source bindings below.

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

## Native ingress and release producer

Application/package source `ab146288efdb05cbfa3cc7454710966d3d08bccd` adds the
trusted ingress/configuration/immutable producer. Fixture-only successor
`3cbb17ce86adeb3ee974e4c3f911f7a2f0ccabfd` preserves a malformed test key's
value while satisfying the existing plain-text scanner; no suppression was added.
The initial stopped push and type/scan/quiz-fixture/esbuild sealing diagnostics
remain private rather than being counted as application/customer failures.

Clean local checks and downloaded exact-source Quality logs confirm **1,763
normal passes/40 skips**, **39 actual PostgreSQL passes/one REST-only skip**,
types/build and lint **0 errors/25 existing warnings**. The 512 new guard cases
are included. The stronger real package proof belongs specifically to source
`ab14628`: fresh npm ci/configured webpack, 541 archived Git blobs matched,
45,759 sealed files verified, 157 client files free of supplied server secrets,
cache write/reinspection pass and one esbuild link materialized. Its origin is
synthetic/unrouted and nothing was started. [Native behavior](native-runtime.md).

| Source3cbb remote check | Verified result |
| --- | --- |
| [Quality PR](https://github.com/nospotfer/jazz/actions/runs/38472541482) | Success; downloaded logs verify1,763/40 normal,39/1 persisted and lint0/25. Push38472537144 also passes. |
| [Secret Scan PR](https://github.com/nospotfer/jazz/actions/runs/38472541525) | Success; push38472536950 passes. |
| [CodeQL analyses](https://github.com/nospotfer/jazz/actions/runs/38472539108) and [aggregate](https://github.com/nospotfer/jazz/runs/115555242907) | Success. |

The existing protected Vercel build subsequently passes; its account/provider
isolation remains unreconciled regardless of build outcome.
No latest-head browser, credential, DNS/tunnel or production health claim follows.
Private launcher/runtime cache/restart, disabled runner and a fresh exact-source
protected HTTPS window remain outstanding. Goal is active and incomplete; budget
remains zero new paid services and production stays paused.

## Protected native preview and contrast

Application source **`e32a3707a7ff647ebc8528798dc81df9415fa983`** is published
on the maintenance branch. `0dfa999` added the bounded Unix preview launcher;
`2058ad1` added the authenticated Quick transport exception and disabled runner.
The latest three-line UI repair makes gold text readable on light surfaces while
preserving bright gold in the always-dark professor/footer panels and dark theme.
Actual computed ratios include light hero 5.33:1 and header hover 5.85:1.
All 48 checked contrast states and 12 public layouts pass.

Clean exact-source checks and downloaded Quality logs confirm **1,915 normal
passes/40 intentional skips** (105 files with passes/five all-skipped), **39
actual PostgreSQL passes/one REST-only skip**, types, webpack and lint **0 errors/
25 existing warnings**. The 152 new cases are included: launcher38, Unix ingress45,
Quick transport 20 and disabled runner 49. Earlier actual TCP20 remains part of the
previous 512; repeated runs are not additional distinct coverage.
Exact committed-source export covers 553 files with zero Gitleaks findings.

| Exact e32 source check | Verified result |
| --- | --- |
| [Quality PR](https://github.com/nospotfer/jazz/actions/runs/38483345959) | Success; downloaded ZIP verifies 1,915/40 normal and 39/1 persisted. Push38483338908 also succeeds. |
| [Secret Scan PR](https://github.com/nospotfer/jazz/actions/runs/38483345945) | Success; push38483338800 also succeeds. |
| [CodeQL](https://github.com/nospotfer/jazz/actions/runs/38483340092) and [aggregate](https://github.com/nospotfer/jazz/runs/115591157460) | Success. |
| Existing protected Vercel build | Success at 23:23:57 UTC; account/provider isolation remains unreconciled. No customer-journey or production claim. |

Downloaded Quality ZIP SHA256:
`69d0397afd156b2486ec6a19a3d4de714acc2b4c4d8955a883e4180c5d322e39`.
The separate fresh locked npm-ci/configured-webpack artifact matches **548
application Git blobs**, verifies **45,766 sealed files** and excludes supplied
server secrets from **157 client files**. Only `.next/cache` is writable.
The producer's prelaunch `started:false` receipt is preserved; actual startup has
its own receipt. **19 actual Unix runtime checks** and **11 external HTTPS
transport checks** pass through explicit Cloudflare Unix ingress. The preview's
leased Basic gate protects pages and assets. Managed robots rewriting and edge
consumption of the Cloudflare-specific cache header are recorded separately.

Browser evidence deliberately retains separate scopes:

| Report | Result and practical limit |
| --- | --- |
| Source2058 initial | 53/55; public immediate-state assertion and two buyer page errors retained. Earlier mobile sad-document captures remain failures. |
| Source2058 diagnostics | First 3/4; eventual-state guest 3/3; resized loaded PDF visibly renders. These do not rewrite the initial report. |
| Exact e32 primary | 96/98; selector ambiguity and one initially incomplete fresh mobile PDF response retained. Four native roles, Mux decoding, profile/medals, vector certificate and four-language PDF bytes pass. Zero page errors. |
| Exact e32 guest continuation | 2/2; stage-specific selectors each match once. No application cause established for the initial selector ambiguity. |
| Exact e32 PDF completion | 7/7; native viewer load100/success/one page and complete authenticated private document response. Completion alone is not visible-text proof. |
| Exact e32 full-frame visual continuation | 7/7; fresh viewport-before-navigation at 320/390 in both themes visibly shows synthetic title/disclaimer. Earlier cropped images omitted the top text; full-frame captures were manually inspected. |

There are exactly **11 native password logins/11 normal session syncs overall**,
six at e32 and five at source 2058. All learning/payment/mail/provider writes were
blocked; automatic reconciliation was intercepted before the app. The strict-CA
read-only AFTER comparison at **23:29:43 UTC** preserves full scoped learning
hashes, entitlements, fixture price 80 and zero financial/voucher/messaging rows.
All owned browsers closed and the purpose-created credential state was deleted.
The two source 2058 buyer exceptions remain **unclassified**; zero current errors
does not establish their cause or prove a repair.

The actual e32 app and tunnel closed cleanly at **23:35 UTC**, before expiry.
The same artifact subsequently passes home200 restart, unexpected owned-worker
exit/cleanup, separate UID65534 denial of both sockets and final complete
reinspection at **23:37:06 UTC**, without unlocking compiled files. Each owned
lifecycle probe also closed cleanly. Private evidence is under
`/tmp/jazz-maintenance/native-preview-contrast-verification/` and
`/tmp/jazz-maintenance/native-preview-contrast-browser-evidence/`.
Selected receipts, CI logs, artifact manifest and safe synthetic visuals have
hash-verified owner-only copies outside /tmp at
`/home/gabriel/backups/culturadeljazz-maintenance/2026-10-13-recovery-689f1b24/review-checkpoint-native-e32a370/`.
This is local preservation, not encrypted or off-site retention. A separate
selected-evidence scan flagged 752 filename/SHA256 manifest entries; every match
was parsed and checked against inspected file hashes. No other finding or scanner
suppression; the raw report is retained. This is separate from the zero-finding
committed-source scan.

The runner is prepared and disabled; no service/timer, account/DNS activation,
production resume/SQL/deploy, transaction/refund or mail occurred. Stable-host
control, durable CA/config, old Vercel quarantine, Google/SMTP and Dodo recipient/
signed-transaction verification remain open. The goal remains active and
incomplete under the zero-cost constraint. [Release gates](release-checklist.md).


## Native password navigation and fresh learning

Application source **`9bd09a65edc0c5c6d80a7f928fec85683e6ce8b0`** follows the
contrast checkpoint above. Commit `ce5577f` fixes password-login navigation:
SIGNED_IN and the initial session check previously redirected before the active
password handler finished cookie synchronization and profile setup. The handler
could then redirect again after unmount. Fourteen behavioral component cases
produce **10 failures/four passing controls on unchanged source**, then **14/14
passes after repair**. Duplicate submits and late post-unmount work are guarded;
ordinary existing-session/non-password events retain navigation.

Commit `9bd09a6` adds a usable link from the lesson notes drawer to its dedicated
saved-notes editor, with selected course/lesson, keyboard focus and a 44px minimum
target. ES/EN/FR/PT copy explains local drafts and account-saved notes. Previously
that editor existed without a reachable drawer link. Forty-nine existing
notes/privacy/access regressions and TypeScript pass; persistence and ownership
checks are unchanged.

Clean exact-source CI and downloaded Quality logs confirm **1,929 normal passes/
40 intentional skips** (106 files with passes/five all-skipped), **39 actual
PostgreSQL passes/one REST-only skip**, types/webpack and **lint 0 errors/25
existing warnings**. The fourteen new auth cases are included in this total.
Required pre-push checks were not bypassed. An exact committed **554-file export
has zero Gitleaks findings**.

| Exact 9bd source check | Verified result |
| --- | --- |
| [Quality PR](https://github.com/nospotfer/jazz/actions/runs/38490691109) | Success; downloaded logs verify 1,929/40 normal and 39/1 persisted. Push38490686737 also succeeds. |
| [Secret Scan PR](https://github.com/nospotfer/jazz/actions/runs/38490691135) | Success; push38490686851 succeeds. |
| [CodeQL](https://github.com/nospotfer/jazz/actions/runs/38490688049) and [aggregate](https://github.com/nospotfer/jazz/runs/115615082154) | Success. |
| Existing protected Vercel build | Success; account/provider isolation remains unreconciled. No customer-journey or production claim. |

Downloaded Quality ZIP SHA256:
`5f7533101b7c339e608acb37083993007f794c27a3460de1007f38750f7320aa`.
A separate fresh locked/configured native build matches **549 application Git
blobs**, verifies **45,768 sealed files** and **158 client files** with the
expected public key/origin and without supplied server secrets. Its prelaunch
receipt remains separate from actual readiness. **19 Unix runtime/11 HTTPS
transport checks pass** on this exact source; only `.next/cache` is writable.

The actual corrected native login deliberately holds its own normal Supabase
avatar update. Session synchronization returns200 while the page remains `/auth`
with submission disabled; the successful avatar update is followed by dashboard
navigation. The notes-editor link then navigates stably. This verifies the fixed
ordering against the actual deployed frontend, independently of component tests.

A fifth confirmed synthetic USER and one explicit fixture course entitlement
were created only in the separate Free preview. The original four actors and
customer archive remain separate. That grant is **not Dodo checkout evidence**.
Fresh learning starts with zero notes/progress/attempts/answers/summaries;
continuation records explicitly retain an earlier successfully saved note.
Native password/session requests are bounded to three for this learning window,
with one normal own-avatar update. Subsequent browser continuations reuse the
purpose-created private session without another login.

Browser scopes remain separate; continuations never rewrite interrupted reports:

| Learning report | Result and practical limit |
| --- | --- |
| Initial e3 |2/3; the note persisted, then Chromium CDP response-body lookup failed. Independent SQL confirms the save. One forbidden avatar intent was intercepted. |
| e3 race diagnostic |Preflight1/1 only, followed by abrupt private guard failure on the SDK's two inert null fields. This is not live navigation-race reproduction. Its browsers were subsequently closed. |
| Corrected 9bd auth/link |4/5; held profile/login and desktop editor navigation pass; private fetch helper called numeric Response.status as a function. Saved-state continuation2/3 retained the same helper failure; independent read diagnostic3/3 passes. |
| Notes/playback class1 |4/5; actual manual save, cache-cleared reload and normal playback to80% pass. Completion selector timed out because the button's accessible name differed from visible Concluir. |
| Completion/quiz class1 |Earlier read-only resume3/4 assumed a nonexistent progress field. Corrected resume6/7 verifies explicit completion, pending same-attempt resume and all12 answers; its final result-text selector matched twice. SQL independently confirms100% PLATINUM. |
| Mobile notes entry |2/3; timeout before class2 writes. Reachability remains pending, with no inferred application cause. |
| Class2/profile final |**9/9**; actual note/save/reload, normal52-second playback, explicit100% completion,12 UI answers→92% GOLD,15-slot profile with one PLATINUM/one GOLD/no SUPREME and certificate ineligible2/15. Class2 learning runs at320px. |

Strict-CA, read-only final verification at **00:51:39 UTC on October14** confirms
exactly **two notes, two completed progress rows, two completed attempts,24
answered answers and two summaries** for the fresh actor. Note content hashes
and styles match; each lesson has one attempt, scores100/92 and medalsPLATINUM/
GOLD. No other lesson learning row was added. A separate **00:51:24 UTC** snapshot
preserves original-four full User/learning/entitlement hashes, fixture price80
and zero financial/voucher/messaging rows. Global users/purchases are now5/2
because the fifth actor has its explicit synthetic fixture grant.

There are three native password logins/three normal session syncs in this learning
window, one actual own-avatar update, and no further auth during saved-state
continuations. These are separate from the earlier11 logins above. Two earlier
avatar intents were intercepted, not forwarded. Current runs have zero uncaught
page errors. Automatic reconciliation and all out-of-scope mutations stay
blocked. The existing earlier source2058 buyer exceptions remain unclassified.

All browser contexts closed, no owned Chromium process remains, and the
purpose-created600 session file was deleted with owner/mode verification. The
9bd runtime and its temporary tunnel closed cleanly around **00:52 UTC**, before
fixed expiry. Final complete **45,768-file sealed reinspection** passes without
unlocking compiled files. The original e3 runtime had separately closed before
the corrected source started. This is temporary free testing infrastructure;
no service/timer/stable hosting was activated.

An independent source review subsequently finds a separate late-SIGNED_IN gap:
after cookie-sync failure or successful handler completion, clearing the pending
flag allowed an event to navigate. Commit **`e342a89`** suppresses those events
once password login has started. Two new frozen cases fail against9bd (14 pass/
two fail); all **16/16** then pass. That later correction is **not** relabeled as
9bd browser execution. Mobile notes-entry and latest-source frontend recheck
remain explicit next actions. Production, mail, OAuth and Dodo transactions
remain separate gates; the goal is active and incomplete.


## Late auth events and localized completion labels

Application source **`cadeac79dd4dc2f230d3a91629d9ac1626a2f292`** contains the
late-event repair `e342a89` above and the completion label fix. The visible
completion action previously had a dynamic accessible name, becoming “Ir a
gamificacion” before completion. Its accessible name now uses the same localized
label as the button: ES Concluir, EN Complete, FR Valider, PT Concluir. Existing
seven behavioral tests now query by accessible role/name through all four
languages and ready/saving/completed states, preserving tooltip, confirmation,
PDF localization and the single playback request. **7/7** pass; all **16 auth
navigation cases** pass. These counts overlap the full suite below.

Exact-source Quality logs confirm **1,931 normal passes/40 intentional skips**,
106 files with passes/five all-skipped, **39 persisted passes/one REST-only skip**,
types/webpack and **lint 0 errors/25 existing warnings**. The exact554-file
committed Gitleaks export has zero findings. The first local push check lacked
the documented synthetic DATABASE_URL and retained its two fixture-import
failures; the retry supplies the closed-loopback fixture, passes required hooks
and pushes without bypass.

| Exact cade source check | Verified result |
| --- | --- |
| [Quality PR](https://github.com/nospotfer/jazz/actions/runs/38493001441) | Success; downloaded ZIP verifies1,931/40 normal and39/1 persisted. Push38492996035 succeeds. |
| [Secret Scan PR](https://github.com/nospotfer/jazz/actions/runs/38493001463) | Success; push38492996016 succeeds. |
| [CodeQL](https://github.com/nospotfer/jazz/actions/runs/38492997685) and [aggregate](https://github.com/nospotfer/jazz/runs/115622483870) | Success. |
| Existing protected Vercel build | Success; account/provider isolation remains unreconciled. No customer-journey or production claim. |

Downloaded Quality ZIP SHA256:
`e9e6a541e54ddb8a6b666ff2e8e8a3d4176baaf6fb93293534e067fcb4b594b9`.
A second exact-source fresh locked/configured build matches549 application Git
blobs,45,768 sealed files and158 inspected client files, with expected public
values and no supplied server secrets. **19 actual Unix/11 HTTPS checks pass**.
The configured CA and exact preview input now have verified owner-only copies
outside /tmp; this runtime uses the durable CA. Values are excluded from reports.
This establishes preview packaging, not reviewed production configuration or
encrypted/off-site backup.

The subsequent browser window allows only one ordinary native password/session
setup for the existing synthetic actor. All learning/payment/mail/provider
mutators otherwise remain blocked. A strict-CA read-only BEFORE snapshot at
**01:01:42 UTC on October14** binds full row hashes across12 models and exact
five-actor globals5 users/2 purchases/6 notes/20 progress/18 attempts/216 answers/
17 summaries, plus unchanged zero business rows. No new actor or fixture grant
is created. Latest-source mobile navigation, all-five preservation and closure
receipts follow below after verification.


The latest test guard intercepts one normal own-avatar update before Supabase;
actual metadata writes are zero. The preparation incorrectly assumed an existing
random avatar would avoid that PUT. Profile copy explicitly says random mode
changes on every sign-in; only fixed mode skips it. Native password/session200
and dashboard navigation pass with this intercepted optional update, so that
scope is an intentional write-blocked profile path. The earlier9bd held-avatar200
proof remains the separate nominal profile-write evidence. No further login is
added to compensate for the incorrect preparation assumption.


## Mobile drawer recovery and recorded payment amounts

Application source **`57f5de1c03a83bdd215edd19ded104494024ba66`** is published.
Commit `c64c0fa` removes the historical-payment fallback to current catalog price.
A NULL recorded amount previously became today's course price, so changing that
price changed the apparent past charge. The API now returns `amount: null`, and
payment history shows a localized unavailable message in ES/EN/FR/PT. Recorded
zero and positive amounts are preserved. Frozen route/page regressions reproduce
three failures/one passing control on unchanged source, including the page's
null.toFixed crash; all **33 targeted cases** then pass with identical hashes.
No schema, historical price, currency inference or provider change is involved.
The first exact-source CI retained one outdated numeric-only contract failure
(1,934 passes/one failure/40 skips). Commit `f5fc45e` explicitly covers recorded
and unknown amounts; passing results below do not overwrite that diagnostic.
Currency, tax and financial-journal limitations remain separate release gaps.

The nominal `cadeac7` browser diagnostic confirms a real drawer defect at both
320×740 and390×740: matching browser owner and opened notes panel,15 hydrated
class buttons, yet picker clientHeight0/scrollHeight956. Class1 has a56px rectangle
but zero effective visible height; its center hits the draft textarea. The44px
editor link lies beyond the card and its center hits the footer. Earlier two
write-blocked diagnostics captured an absent subtree; those observations remain
separate and are not relabeled as the clipping cause.

Commit `57f5de1` makes the panel use available flex space, allows its card to
scroll, reserves96px for the class picker and prevents title/footer shrinkage.
No owner, draft, route or persistence logic changes. Fresh production-built
browser measurements at **320 and390** confirm picker height96 and correct
class-button hit-testing. The editor link is **225×44**, fully in the viewport
after focus/scroll, passes center hit-testing and keyboard Tab, and Enter reaches
the corresponding dedicated editor route. Owned server note hashes/styles are
unchanged. The correction report remains **12 checks/9 passes/3 diagnostics**:
two early text assertions waited on a generic first textarea (the sidebar draft)
instead of scoped editor readiness; ES language selection also timed out. Exact
hydrated-editor text and four-language browser controls remain pending. Seven
localized completion-state component cases pass; those are a different scope.

The whole latest window uses **three native password/three normal session syncs**,
one actual strictly scoped own-avatar update and two earlier intercepted avatar
intents. Corrected-source state reuse adds **zero auth and zero mutators**;
no playback is needed. All browser contexts are closed, no owned Chromium
process remains, and the single purpose-created600 session file was deleted
with uid/regular-file/no-symlink/single-link/mode checks. The separate cleanup
receipt supersedes the summary's earlier retained-state flag.

A strict-CA read-only AFTER snapshot at **01:41:29 UTC on October14** matches
full row hashes across all12 bound app/content/learning/entitlement models and
global counts for all five synthetic actors. Price80 and zero financial/voucher/
messaging rows are unchanged. This comparison covers database rows; the one
normal synthetic Auth avatar update is separately recorded. The `cadeac7` app
closed cleanly by fixed expiry at01:29, the corrected app at01:37 and the tunnel
at01:38 (exit0). Complete sealed reinspections verify45,768/45,769 files for the
respective artifacts without unlocking compiled files.

Exact-source CI and downloaded logs confirm **1,935 normal passes/40 intentional
skips**,107 files with passes/five all-skipped, **39 actual PostgreSQL passes/one
REST-only skip**, types/webpack and **lint0 errors/25 existing warnings**. The four
new payment cases are included. Required push hooks pass without bypass.
An exact committed **555-file export has zero Gitleaks findings**.

| Exact57 source check | Verified result |
| --- | --- |
| [Quality PR](https://github.com/nospotfer/jazz/actions/runs/38495998186) | Success; downloaded ZIP verifies1,935/40 normal and39/1 persisted. Push38495993076 succeeds. |
| [Secret Scan PR](https://github.com/nospotfer/jazz/actions/runs/38495998182) | Success; push38495993046 succeeds. |
| [CodeQL](https://github.com/nospotfer/jazz/actions/runs/38495994946) and [aggregate](https://github.com/nospotfer/jazz/runs/115631915804) | Success. |
| Existing protected Vercel build | Success; account/provider isolation remains unreconciled. No Vercel journey or production claim. |

Downloaded Quality ZIP SHA256:
`fc7394a58ccfcd7613d4bec30e50f065266cddec05d2f18ef0125482e83c79fb`.
The fresh locked/configured native artifact matches **550 app Git blobs**,
**45,769 sealed files** and **158 inspected client files**, with expected public
values and no supplied server secrets. **19 Unix/11 HTTPS checks pass**. CA and
private preview input packaging outside/tmp is verified for the earliercade
configuration; it is not reviewed production configuration or encrypted/off-site
retention. All temporary preview processes are closed. No paid upgrade, service/
timer, production SQL/config/resume/deploy, transaction, refund or mail occurred.

Selected evidence is preserved locally under
`/home/gabriel/backups/culturadeljazz-maintenance/2026-10-13-recovery-689f1b24/review-checkpoint-native-learning-cadeac7/`;
final preservation/scan receipts accompany the checkpoint. Earlier reports remain
immutable. Next: scoped editor hydration and actual locale controls, then remaining
Dodo recipient/signed-transaction, OAuth/SMTP, stable-host/account/DNS, old Vercel
quarantine and production review gates. The goal remains active and incomplete.

## Scoped notes editor and language controls

The two remaining UI checks now have actual browser evidence. On source
`fb37f9e` (application code unchanged from `57f5de1`), the dedicated editor's
scoped **Mis notas** textbox becomes enabled after its owned GET returns 200.
At 320px for class 1 and 390px for class 2, displayed text hashes match the
saved notes, with 13px, normal weight and normal style. No note edits occur.

The same run reproduces the language-selector failure: four hydrated 44×44
buttons sit inside a flex item squeezed to 2px, with clientWidth 0 and hidden
overflow. The ES button has only 1px visible width; its center hits a neighboring
SVG. The frozen report remains **10 checks, 9 passes, 1 failure**. This confirms
the cause of the earlier timeout without changing historical reports.

Commit `bc178997195afa3b0f5bf5e9e1cdb7720f57a6c3` adds `shrink-0` to the shared
language-selector wrapper. A separate fresh, locked build matches 550 app Git
blobs, 45,769 sealed files and 158 inspected client files. Unix **19/19** and
HTTPS **11/11** checks pass, and supplied server secrets are absent from client
files. The existing seven language component tests pass. An exact committed
555-file Gitleaks export has zero findings.

The corrected browser report passes **35/35 checks**, including 12 real ES, EN,
FR and PT-BR clicks at 1440, 320 and 390px. The wrapper now has 176px client
width; each language control is an unobstructed 44×44 target. Selected states
and visible/accessibility labels update normally. Completion labels match
Concluir, Complete, Valider and Concluir and remain reachable after normal
toolbar scrolling; completion buttons are not pressed. A separate initial
correction preflight rejected a mismatched purpose label before browser traffic
(1 failed check); that diagnostic remains preserved.

The whole window uses one native password request, one normal session sync and
one strictly scoped normal synthetic avatar update. Corrected-source session
reuse adds zero authentication or profile writes. No learning, financial, mail
or playback mutation occurs. All browsers are closed and the purpose-created
0600 session file is deleted after owner/type/link/mode checks.

The strict-CA read-only AFTER snapshot at **02:42:36 UTC on October 14** matches
the 02:23 baseline's full row hashes across all 12 app/content/learning/entitlement
models, all five actors' global counts, course price 80 and zero business rows.
The Auth avatar update is separate from this application-row comparison. Both
source-bound apps and the temporary tunnel close cleanly before their deadlines;
both full sealed reinspections pass without unlocking compiled files. This closes
the scoped editor and language-control gaps. Dodo signed transactions and
notification recipients, Google/SMTP, continuous hosting/account/DNS, old Vercel
quarantine and production review remain open. No new spend or production change.

Selected UI evidence is preserved in 26 files under
`/home/gabriel/backups/culturadeljazz-maintenance/2026-10-13-recovery-689f1b24/review-checkpoint-editor-locale-bc17899/`.
All copies have matching hashes and owner-only permissions. The evidence scan's
1,508 matches are individually verified manifest path/SHA256 pairs from the two
fully inspected artifacts; there are zero other findings or scanner suppressions.
This is local retention, without encryption or off-site recovery.

## Provider amount availability

Application source **`133716b582ce729ed2b41a548b17204841ff795c`** is published
on the maintenance branch. Missing, NULL or malformed provider amounts previously
became a zero charge and a phantom full discount. A synthetic helper probe with
metadata originalPrice 29.99 and no total reproduced finalPrice 0 and discount
29.99. This establishes a source defect, not an observed customer incident.

The documented `total_amount` field is required integer minor units including
tax. It now takes precedence over legacy `amount`, including genuine zero.
Present malformed totals, negative facts and present invalid subtotal/metadata
prices stay NULL; missing derived discounts stay NULL. Valid legacy decimal
amount aliases retain their existing conversion. The exported general money
helper, currency assumptions and gross/subtotal/tax inference remain unchanged.
[Dodo payment contract](https://docs.dodopayments.com/api-reference/payments/get-payments-1).

Purchase sync now stores nullable facts. An incomplete retry for the same payment
keeps previously known amounts and fills only previously NULL fields; a complete
snapshot retains existing replacement behavior. A new payment reference cannot
inherit another payment's amounts. The nonnullable DiscountApplied row is never
created from unknown amounts: incomplete same-payment retries preserve its money
and update only an existing voucher link when needed; replacement payments clear
stale monetary rows. Actual coupon identity, usage counting, owner/status checks
and refund/dispute barriers keep their existing policy. Enrollment metrics count
only an explicitly recorded zero as a free voucher enrollment.

Frozen regression stages remain distinct: initial four-file baseline 30 failures/
47 passing controls, a nested malformed-total follow-up, eight negative/late-coupon
failures, and a present-malformed-metadata failure. No passing result overwrites
those reports. The final targeted suite passes **260/260** across 12 files,
including **18 actual PostgreSQL cases**, seven newly persisted regressions.
Independent source review passes; existing caller contract fixtures need no
adjustment. No schema, historical backfill or actual provider transaction occurs.

Root verification on matching committed source/test hashes passes **1,973 normal
tests/47 intentional skips** in 108 passed/five all-skipped files, **46 actual
PostgreSQL tests/one REST-only skip** across five suites, types and lint **0 errors/
25 existing warnings**. The normal skip count includes seven new guarded database
cases, which pass in the separate PostgreSQL run. A clean 556-file Git archive
without private env files passes fresh locked installation and webpack build;
the builder receives no server credentials. Its source Gitleaks scan has zero
findings. Required push hooks pass without bypass.

These are source/local-database checks. Actual editor and language browser proof
remains bound to FB/BC, fresh learning to 9bd and earlier Mux/PDF/contrast/runtime
proof to e32. No new-source Dodo delivery, customer transaction, production fix or
stable-host claim follows from these results. Financial journal/currency/tax,
notification recipients, Google/SMTP, continuous-host/account/DNS and old Vercel
quarantine remain release gates. The maintenance goal is active and incomplete.


| Exact133 source check | Verified result |
| --- | --- |
| [Quality PR](https://github.com/nospotfer/jazz/actions/runs/38503514876) | Success; downloaded ZIP confirms1,973/47 normal and46/1 persisted. Push38503510218 also succeeds. |
| [Secret Scan PR](https://github.com/nospotfer/jazz/actions/runs/38503514872) | Success; push38503510177 also succeeds. |
| [CodeQL](https://github.com/nospotfer/jazz/actions/runs/38503511409) and [aggregate](https://github.com/nospotfer/jazz/runs/115655785613) | Success on exact133 source. |
| Existing protected Vercel build | Combined status success. Account/provider isolation remains unreconciled; no Vercel journey or production release claim. |

Downloaded Quality ZIP SHA256:
`7ace5fd49962f62157b390fbd3314e0159578e10dc3157591e4024fe1178ba78`.

## Payment history recovery and account isolation

Source **`a207f36feb804486f7b3ba926bb44a2bacaa86a2`** fixes three confirmed
history defects. Failed requests previously displayed “no purchases”; failures
and malformed successful responses now show a generic localized error and a
44px Retry control. A successful empty array retains the empty state, including
corrected Portuguese wording. Loading exposes an accessible status.

A mounted account switch could retain the previous account's financial rows or
accept its late response. The page now waits for the initial Auth session,
clears/aborts on identity change, and rejects stale results with an owner epoch
even if cancellation is ignored. Same-owner token refresh preserves the loaded
history. Each GET supplies `expectedUserId`; the server verifies cookie-backed
identity before reading purchases and returns 409 on a mismatching or blank
hint, closing the cookie-update race. The hint grants no access. Unauthenticated
requests remain 401; callers without a hint retain their own-record response.
POST, accounting, currency, schema and historical data policy are unchanged.

Frozen page baselines retain seven failures/three controls and a later owner/
response-shape baseline of 15 failures/four controls. Final component cases pass
**19/19**. The GET regression baseline has three failures/33 controls; five added
cases cover mismatch/blank, matching-empty and unauthenticated hints. Existing
direct route fixtures now pass a Request required by Next's generated types,
without changing expected behavior. Independent source review passes. Root and
downloaded CI verify **1,995 normal passes/47 intentional skips**, 108 passed/
five all-skipped files, **46 PostgreSQL passes/one REST-only skip**, types/build
and lint **0 errors/25 existing warnings**. The clean 556-file committed export
has zero secret findings. Required hooks pass without bypass.

A fresh Node24.21.0 locked configured webpack build matches **551 application
Git blobs**, seals **45,770 files**, and checks **158 client files** for correct
public key/origin and absence of supplied server secrets. Actual Unix transport
passes **19/19** and protected temporary HTTPS passes **11/11**. This independent
window reuses the fifth synthetic USER and its existing root-created course
grant; no provider payment is implied.

Root bounded SQL changes only that grant's final/discount amounts from 80/0 to
NULL/NULL, then 0/80, then exactly back to the original row including updatedAt.
Actual owner-bound API/UI checks pass separately: recorded80 **10/10**, unknown
**7/7**, real-zero fixture **7/7**, restored80 **7/7**. These **31/31** successful
phase checks include ES320, EN390, FR1440 and PT320, 16 real locale clicks,
44px language controls and no horizontal overflow. One controlled intercepted
500 displays an error instead of empty history; a real Retry GET200 recovers.
An actual server owner-mismatch GET returns 409. The initial **3/2/1** report
retains a helper assertion before GET completion; a separate **1/0/1** optional-
label CLI diagnostic stopped before any browser traffic. Neither is erased or
counted as an application failure. Empty-account and mounted account-switch
behavior have source regressions, not an actual browser journey claim.

The whole window uses exactly one password login, one normal session sync and
one normal own-avatar update; saved-state continuations add none. Nineteen
automatic reconciliation intents are intercepted before the app. No browser
learning/financial/mail write, actual Dodo transaction or playback occurs.
Root strict-CA read-only snapshots at **03:38:15.510Z / 03:55:44.840Z** confirm
all five actors' **12 model hashes**, global counts, original four accounts,
learning/entitlements, price80 and zero business rows unchanged after restoration.
The restore guard observes explicit restoration without executing its fallback.
All browser contexts and Chromium processes close, the purpose session is deleted,
and owned app/tunnel shutdown and full sealed reinspection pass. Earlier learning,
editor, media/PDF and restart/UID proofs remain separate. No spend or production
change; provider notification/transaction, Google/mail, continuous-host/account/
DNS, old Vercel quarantine and production review gates remain open.

| Exact a207 source check | Verified result |
| --- | --- |
| [Quality PR](https://github.com/nospotfer/jazz/actions/runs/38507290995) | Success; downloaded logs confirm 1,995/47 normal and 46/1 persisted. Push38507286850 also succeeds. |
| [Secret Scan PR](https://github.com/nospotfer/jazz/actions/runs/38507291080) | Success; push38507286857 also succeeds. |
| [CodeQL](https://github.com/nospotfer/jazz/actions/runs/38507289757) and [aggregate](https://github.com/nospotfer/jazz/runs/115667755523) | Success on exact source. |
| Existing protected Vercel build | Actual combined Vercel status is success, “Deployment has completed.” Account/provider isolation remains unreconciled; no Vercel journey or production release claim. |

Downloaded Quality ZIP SHA256:
`90342e5a3dbdf2f31d0e3d0b4c170c275d94173f0b0df35d2e9a03d6dc6c4c51`.

An initial48 selected regression/native/browser/CI files are retained with
matching byte hashes, files600/directories700, under
`/home/gabriel/backups/culturadeljazz-maintenance/2026-10-13-recovery-689f1b24/review-checkpoint-payment-history-a207f36/`.
Credential, launch/config/env, actor and session inputs are excluded. All753
scanner matches are individually verified as exact path/SHA256 records in the
fully inspected seal manifest; zero other findings or new suppressions. The
Quality ZIP's26 expanded text entries separately scan with zero findings. This
is local retention, without encryption or off-site recovery.
