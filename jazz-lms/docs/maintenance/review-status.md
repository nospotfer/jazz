# Maintenance review checkpoints

Updated 2026-10-15. Draft review: [PR #46](https://github.com/nospotfer/jazz/pull/46)
on `maintenance/initial-audit`. Source is unreleased and maintenance remains
incomplete. The separately approved production Supabase recovery/export/unsafe-state
rollback completed; production is paused again. A provider build success is not
proof of an isolated, working preview. Historical checkpoints below retain the
evidence available at their dates; the latest sections supersede old access gates.
Previously published application/test source: `a631e166`; runtime `c1a419c` has
identical application code (the later commit changes three fixtures only). See
[quote provenance and transactional course intent](#quote-provenance-and-transactional-course-intent).
Earlier accounting, editor, language, learning and media scopes retain their
separate source bindings below.


## Landing hero and usable mobile navigation

Application artifact `5c98715` now gives the first free-lesson offer a compact
callout, puts registration and a localized lesson-exploration link together,
fills the phone content width with both actions and centers the desktop hero
columns. Existing typography, imagery, four-language course copy, content and
pricing are preserved. These are incremental visual and usability improvements;
the rest of the landing page remains available for further review.

Actual97 before renders exposed an opened390px navigation panel atx330/right538,
expanding document width to538. At320 the toggle wraps to the left, so simply
flipping its popup alignment would introduce another clipped layout. The menu
now uses the positioned header as its boundary: actual390 bounds16–374 and320
bounds16–304, with all seven links wholly visible and at least44px tall.

Actual after verification passes154 assertions across six viewport/theme cases
(320/390/1440, light/dark) and four locale checks. Keyboard and pointer menu
navigation scroll to courses and close the panel; the new native exploration
link works. Primary actions are342px/272px wide on390/320 phones,60px tall, and
appear about42px/58px earlier than before. The secondary action also fits the
initial844px fold in those Spanish views. Desktop column center difference0.
These observations do not prove every translation fits every possible screen.

Four targeted existing Playwright cases pass: offer/hero geometry, unavailable
promo fallback and both mobile course/menu journeys. `f8d9254` strengthens the
opened-menu regression to check the panel, all links and document width after
opening, preventing Playwright auto-scrolling from hiding clipping. That later
commit changes one test file only; application files remain identical to5c.
Exact5c clean Node24 QA passes2533 normal tests/80 skips, types, webpack build and
lint0errors/22 existing warnings.

Before18/after19 public screenshots and88 selected artifacts plus manifest/
receipt are retained privately in `review-checkpoint-landing-5c98715`, with
verified bytes/hashes and0700/0600 modes. Initial timeout attempts remain separate
harness diagnostics; final drivers settle after DOMContentLoaded. Browser
requests stay on the loopback app, promo playback is a local503 fixture and
prefetched auth routes are blocked. No actual video/provider/account/form/DB
journey ran. First-visit privacy banners and clear views after the ordinary
necessary-only choice are retained separately; consent policy is unchanged.
All browsers and both finite local preview wrappers are closed.

The same source includes `b7f77ab`: the already-Secure OAuth hint cookie options
are written directly in each assignment to clarify static analysis. Existing
intercepted-write and real-SDK controls pass10/10 before and after, types pass
and the two scoped lint warnings are unchanged. This does not repair an actual
insecure cookie or prove OAuth works. Exactf8d9254
[Quality PR](https://github.com/nospotfer/jazz/actions/runs/38693579620),
[Quality push](https://github.com/nospotfer/jazz/actions/runs/38693574139),
[Secret Scan](https://github.com/nospotfer/jazz/actions/runs/38693579614) and
[CodeQL analyses](https://github.com/nospotfer/jazz/actions/runs/38693575709)
pass. Its fresh exact head-ref alert query returns0, removing those three
medium97 records from this PR scope without dismissal. This is static clarity,
not an insecure-cookie incident or actual OAuth integration verification.

Latest source is published for draft review; downloaded Quality evidence and
final documentation-head checks remain separately recorded. Production
is unchanged and the maintenance goal remains incomplete.

## Currency facts and readable amounts

Application source `97e5e06` carries PAY-22 through provider extraction, all paid
ingest paths, persistence, student history and admin reporting. It stores exact
nullable currency/minor-unit facts, uses explicit SIX exponents and prevents
partial retries or nested/outer objects from mixing units. Legacy floats retain
their independent provenance. Admin totals/averages/charts stay separate by
verified currency; unsafe numeric chart/comparison values remain unavailable.
See [payment currency, compatibility and rollback](payment-currency.md).

Exact prior-source failures are retained: backend52 (48fail/four controls),
admin13 (11fail/two controls), student23 (18fail/five controls), DTO17
(14fail/three auth controls). All pass after correction. A fresh private Node24
install precedes the full checks. Three obsolete whole-suite amount fixtures
were corrected in `862c614` without runtime changes. Shared-schema PostgreSQL
files ran in parallel and reproduced an actual40P01 fixture deadlock; `188f7b8`
serializes files while preserving real races inside tests. That exact source
passes80 checks in ten persisted suites (79 actual PostgreSQL cases and one
client-metadata case), with one REST-only skip. Initial failures stay separate.

A fresh sealed `188f7b8` artifact matches602 Git application files/45,822 sealed
files/158 inspected client assets. The isolated Free cloud preview received only
two nullable TEXT columns, with no defaults/backfill. Before/after migration
preserves old fields/raw timestamps, all12 model hashes and six additional
protected hashes; both new pairs initially remain NULL. Production received no
migration. Unix19 and actual protected HTTPS11 checks pass.

Native browser verification passes58: two actual logins, eight student histories,
eight admin overviews, two scheduled statistics variants,36 representative
geometry/amount-contrast observations and two actual normal global204 logouts.
EUR/JPY/KWD/IQD/MGA, real0, unknown currency and original legacy values display as
planned. KWD and restored records are checked at320/390/1440 in both themes;
statistics cover KWD7d and restored30d only, with unscheduled range prefetches
blocked. Minimum amount contrast is5.521light/7.663dark student,
5.864/7.336overview and7.557/12.167statistics. This is amount/KPI evidence,
not a whole-page accessibility certification or every chart/currency combination.

Seven scoped two-column variants and one restoration are acknowledged in an
18-entry verified hash-chain journal. Independent final read-only SQL confirms
all18 protected/12 model hashes, five roles, original raw course/purchases and
timestamps unchanged, with both pairs NULL again. Browser contexts/owned Chrome,
app/tunnel processes and sockets are gone; clean closure and complete sealed
reinspection pass. This window consumes two login/session pairs, bringing the
tracked cumulative windows to28. No Dodo transaction, mail or learning write ran.

Separate follow-ups `f5cc174` and `97e5e06` remove assumed EUR from voucher
redemption records, preserve unlabelled legacy precision and show canonical raw0
as0 even when currency is unknown. Frozen voucher18 (14fail/four controls),
precision16 (eight fail/eight controls) and unknown-zero8 (four fail/four controls)
now pass; combined55 controls pass. Initial nonbreaking-space fixture diagnostics
are retained. Final `97e5e06` clean-source checks pass2533 normal tests/80
intentional skips, types, lint0errors/22 existing warnings and webpack build.
These later display fixes have source/component evidence, not a new native run;
the completed native artifact remains bound to `188f7b8`.

Exact97e5e06 [Quality PR](https://github.com/nospotfer/jazz/actions/runs/38690838575),
[Quality push](https://github.com/nospotfer/jazz/actions/runs/38690833263),
[Secret Scan](https://github.com/nospotfer/jazz/actions/runs/38690838583) and
[CodeQL checks](https://github.com/nospotfer/jazz/actions/runs/38690835304) pass.
Downloaded26-file Quality logs agree with2533/80 normal and80/1 persisted checks.
The exact head-ref alert query nevertheless returns three medium cookie records
(5/6/12), while merge/branch filters return0; their investigation is separate from
successful check status. Actual source and existing intercepted-write tests show
Secure on all three OAuth hint cookies. The later direct-literal clarification
and successful fresh head-ref rescan are recorded in the landing checkpoint
above; no alert dismissal or exploit claim follows.

Selected214 review files plus manifest/receipt are retained under the private
`review-checkpoint-currency-97e5e06` recovery directory. Bytes/hashes and0700/0600
modes are verified; nonempty candidate scans exclude actual private inputs. Four
retained whole-test JSON reports redact only a generated synthetic webhook-key
label in title/fullName; original hashes and transformation are recorded, with
statuses/counts unchanged. The initial pattern gate stopped before copying that
label. Credentials, raw model snapshots, sessions and screenshots are excluded.
This is local unencrypted retention, not off-site recovery.

Actual provider transactions, OAuth/mail, continuous free hosting/DNS and approved
production hardening/recovery/release remain gates. No new spend,
production rollout or whole-goal completion follows. The next UX pass returns to
the public landing page for broader visual hierarchy, spacing and mobile polish.

## Voucher availability and redemption intent

Four source commits (`b2ca5c3`, `9e5524b`, `730a28b`, `a16c1abc`) require
published voucher courses with known numeric prices, verify captured redemption
account intent, localize unavailable-price recovery, retire stale page work,
and show recorded purchase amounts only with `analytics.read`. Known zero
stays zero; unknown amounts do not become free access or revenue. The active
`/redeem` caller was found in the App Router after an earlier components-only
search missed it. Signed-out users must sign in and reopen the voucher link;
`/auth` has no return-to contract.

Frozen regressions retain actual before failures: backend36 (30 mocks/six real
PostgreSQL), checkout seven, feedback ten, admin13 plus six permission cases on
the intermediate patch, and redemption client24 plus the existing11 localization
cases. Real NULL-price/draft/stale-account grants persisted before; after they
are denied without purchase/discount/redemption/use writes. Static checks and
voucher-limit races do not prove a concurrent course edit is protected.

A fresh private Node24 clone passes **2,311 normal tests/57 intentional skips**,
**56 real PostgreSQL tests/one REST-only skip** in seven guarded suites, types
and lint0errors/22 existing warnings. Exact-source
[Quality PR](https://github.com/nospotfer/jazz/actions/runs/38606950717),
[Quality push](https://github.com/nospotfer/jazz/actions/runs/38606941010),
[Secret Scan](https://github.com/nospotfer/jazz/actions/runs/38606950659) and
[CodeQL analyses](https://github.com/nospotfer/jazz/actions/runs/38606944470)
pass. Downloaded Quality logs agree;587 committed files/26 expanded logs scan0.
Classic Vercel success does not establish remote provider isolation.

Two fresh configured artifacts each match582 application Git files/45,802 sealed
files/158 inspected client assets and pass Unix19/HTTPS11. First native attempt
stops before sign-in/browser creation/SQL on an artifact-proof mode0664 guard;
original helper/report and expiry closure remain separate. Corrected writer uses
umask077 and a fresh origin/artifact/gate. Root's earlier private-input assertion
checked too few files; the correction is explicitly retained.

Second native window passes **12 actual cases**: both voucher forms show the real
price-unavailable503 in ES/EN/FR/PT; redemption shows the actual A-cookie409
relayed unchanged in all four languages. Original browser POST never continues.
Four NULL/80 pairs are acknowledged and restored; publication/other public-table
writes0. Admin records and known sum160 are checked before its390px geometry
assertion discovers horizontal overflow. Admin case does not pass; the whole
run stays **PARTIAL12/13** and the original report is preserved.

All browser contexts close. Three password/session pairs bring the cumulative
owner/catalog/checkout/voucher count to24; normal provider logouts were not
reached. One optional own-avatar intent is blocked; avatar writes0. App/tunnel
expire cleanly and their processes/sockets are absent. Strict-CA22:45:26 read-only
comparison confirms all-five/12-model/global/business/learning/entitlement hashes
and complete raw course row/timestamps unchanged. Complete seal inspection passes.

The following checkpoint verifies the separate mobile admin repair and closes
quote-versus-payment provenance (PAY-21) and course intent (SEC-22); it does not
relabel that original12/13 report. Currency precision (PAY-22) remains source work. Provider price/tax/currency authority, actual
Dodo tests/notification recipients, Google/mail, continuous free hosting/DNS and
exact production recovery/quarantine approval remain release gates. Zero new
spend, provider transactions/refunds, third-party mail or production change.

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

## Local credential boundaries and static rollback fallback

The previous goal turn made concrete source/browser/CI progress. This follow-up
finds ignored credential CSV and private app.env at0664. Owned regular/single-link
metadata is verified, both files become0600, and Git exclusions/contents remain
unchanged. This is a local permission correction, not evidence of an exposure
incident or production account-policy change. The durable private preview input
already holds the same six provider values as the verified a207 window; its old
source/origin cannot be reused as a fresh launch. No credential values/digests
are emitted. The TEST key is additionally retained in an owner-only durable
configuration path; one bounded test product GET verifies the existing target/
business/8000EUR price. No automatic loading, rotation, mail or transaction.
[Dodo credential retention](dodo.md#local-test-credential-retention).

Source **`9cb3d3f`** adds the actual closed maintenance fallback proposed by the
rollback plan: standalone original-logo/jazz-gold HTML plus exact503/header JSON
and [operator runbook](maintenance-fallback.md). No Next/backend/provider/analytics,
forms, external assets, cookies/storage or background requests are required.
Default Spanish remains readable without JS; actual native44px controls select
ES/EN/FR/PT and matching document language/title. Manual recheck strips query,
fragment/userinfo and makes a fresh same-origin rootGET, not a POST replay; file
review preserves its local path. The precise meta style/script hashes and
header-only frame-ancestors contract match the frozen artifact.

Initial **109/110** real browser checks preserve the320px200%CSS-zoom overflow,
source and screenshots. A wrapping/min-width correction then passes **138/138**
actual loopback HTTP/browser checks:320/390/1440 both color preferences,24 real
language clicks, keyboard/recheck/JS-disabled content, contrast minimum**5.72:1**,
no horizontal overflow including200%CSS zoom, actual503/RetryAfter300/no-store/
noindex/no-referrer/nosniff/CSP, HEAD503/body0 and unavailable nonGET/API/checkout/
webhook requests with no forwarding. Fourteen expected503 resource console
messages are separately classified; client/CSP errors and outside/storage/cookie/
fetch/XHR/beacon activity are zero. Separate **4/4** local-file checks verify
French and clean same-file recheck. Native-browser zoom/fullWCAG are not claimed.

HTML SHA256 **`9dd0b14b1e06cf0ff002197c028bf798abbcd860996ab61e5c56f6d423587830`**
matches actual receipts and the committed source; exact original logo bytes and
JSON/CSP digests are independently checked. Source review passes. All owned
browsers/server close, zero Chromium processes remain, and no shared runtime,
DNS/account/production change or spend occurs. This is a prepared asset with
local serving-contract evidence, not an activated host or a repaired production
backend. Native e32/9bd/FB/BC/a207 app scopes remain distinct. Provider/merchant
recipients/OAuth/mail/continuous-host/account/DNS/quarantine/production review
gates remain essential; the goal is active and incomplete.

## Fallback publication and private-view owner follow-up

Documentation HEAD `8e68f68d63eebca6da89a5c11203467cb16ec62c` includes the prepared
`9cb3d3f` fallback. Its exact [Quality PR run](https://github.com/nospotfer/jazz/actions/runs/38514816671)
and push run 38514810716 pass; downloaded logs confirm **1,995 normal passes /
47 skips**, **46 PostgreSQL passes / one REST skip**, build, types and lint
0 errors / 25 warnings. Secret Scan PR 38514816735 and push 38514810694 pass,
as do CodeQL run 38514813078 and aggregate 115691258799. The actual Vercel
combined status reports a completed deployment; provider isolation remains
unreconciled. There is no separate CI run for intermediate `9cb3d3f`.

Both exact committed exports contain 559 files and scan with zero findings;
expanded Quality logs also scan clean. The nine changed files between these
commits are instruction/maintenance documents. Forty-eight selected fallback,
publication and secret-free permission/credential-retention receipts are kept
outside `/tmp` at
`/home/gabriel/backups/culturadeljazz-maintenance/2026-10-13-recovery-689f1b24/review-checkpoint-maintenance-fallback-9cb3d3f/`.
Every copied byte hash and owner-only permission matches. All 34 scanner matches
are independently verified path/SHA256 entries in the committed-file manifests;
there are no other findings or new suppressions. Actual credentials, environments,
configuration, actors and sessions are excluded. This retention is local,
unencrypted and not off-site; the fallback remains inactive.

A new high confidentiality/correctness issue is **confirmed and being repaired**.
On `9cb3d3f`, a frozen closed-mock suite reproduces 12 failures with five passing
controls: dashboard account changes retain old identity, protected SSR children,
avatars or counters. Actual parent composition executes, with synthetic private
children; the course player has the same unguarded sidebar consumer. Notes have
their own existing owner guard and are not claimed to leak by this proof.

On exact `8e68f68`, six user-scoped routes additionally have 24 frozen failing
owner-consistency cases and 18 passing controls. A stale client identity hint
does not stop reads or a progress update for the different, verified cookie
owner. These are closed mocks with no provider/database calls, not a backend
authorization bypass: the server still selects the authenticated account.
Whole-view retirement, guarded late results and expected-user checks are in
progress. Real cross-tab transport, refreshed SSR ownership and the empty-account
native journey remain pending on a fresh exact-source preview.

The same private-view retirement is being applied to the admin layout; two
separate frozen actual-parent cases reproduce retained privileged children after
account change/sign-out. Two checkout components have a separate frozen baseline
of eight stale-response failures and two current-owner controls. These proofs
remain distinct from the original 17 component cases. Source review also finds
the active course-progress read: its separate exact-HEAD baseline has four
failures and three controls. All seven read/progress routes now pass 49 closed
owner-consistency regressions; full combined checks and native verification are
still pending.

## Account pages without a course purchase

A separate local UX correction permits registered users to open their own
`/dashboard/profile`, `/dashboard/payment` and `/dashboard/settings`, including
canonical trailing-slash variants. Requiring a full-course purchase to manage
an account or inspect its own receipts prevented useful account recovery and
made successful empty history inaccessible. The server dashboard authentication
and private owner boundary still apply; this changes the purchase overlay for
these three exact pages only. Lessons, videos, messaging and course recognition
retain their existing access rules. No API, entitlement, price or provider
configuration is changed by this policy correction.

On frozen exact `8e68f68`, the new component suite has **six failing account-page
cases and nine passing paid/free controls**. The unchanged 15 cases now pass,
alongside seven existing lesson-notes/paywall controls. A former locked-profile
control is deliberately replaced with a paid-video-route control, so both unpaid
restriction and paid access still have useful coverage. These are closed
component checks without network/provider/database calls. Actual unobstructed
free-account profile/settings/history and ownership verification were pending at
this source-preparation checkpoint; the fresh-source observations below supersede
that gap. Older A207 browser evidence is not relabeled.

## Private-view ownership and account access source verification

Source **`4f395e0569ab4037de7fe32a33a8e48cb8e4e35c`** retires the entire private
dashboard, administration, course and lesson frame when the SDK account changes
or signs out. Private children render only when the current SDK owner matches the
verified server owner. A synchronous generation invalidates previous-owner reads,
avatars, checkout replies, player progress/completion work and reconciliation
refreshes; account changes remount the private frame. Same-owner token refreshes
preserve it. A changed generation has one automatic refresh, followed by localized
manual recovery; unresolved initialization has a finite fallback. The SDK hint
does not grant roles or replace server authentication/entitlement checks. Already
delivered HTML, cached bytes and previously issued media tokens are not erased.

All seven affected read/progress routes verify the cookie identity first, then
reject mismatching, blank or duplicate optional `expectedUserId` hints with409
before database/access/mutation work. Missing hints remain compatible; unauthenticated
requests remain401. The earlier purchases hint contract remains separate.

Frozen before/after proofs remain distinct: dashboard/component17 cases had12
failures/five controls; admin parent two failures; two checkout components eight
failures/two controls; additional CourseView checkout four failures/one control.
The original six-route42-case baseline had24 failures/18 controls; the seventh
route separately had four failures/three controls. All49 route regressions now
pass; the original server package passes134 cases with its existing controls.
The final client package passes111 cases across seven suites, including27 parent/
owner-boundary cases. Independent review's18 frozen runtime-file hashes match
the committed blobs. Fixture/setup failures remain retained diagnostics.

The exact three account-route exemptions pass22 component checks, preserving
paid-content restrictions. Fresh Node24 clean-source verification passes **2,130
normal tests /47 skips**, **46 actual PostgreSQL tests /one REST skip**, types,
and lint **0 errors /23 warnings**. There are114 files with passing assertions and
five without executed cases; Vitest's nested suite count is not a file count.
The exact570-file committed export scans with zero findings/new suppressions.
Required commit/push hooks pass without bypass.

Actual [Quality PR](https://github.com/nospotfer/jazz/actions/runs/38522879886)
and push38522874985, Secret Scan PR38522879906/push38522874988, and
[CodeQL](https://github.com/nospotfer/jazz/actions/runs/38522876079)/aggregate115716562170
all pass. Downloaded Quality ZIP SHA256
`8867462c07803ae3c655b40bca69be0c6251cefeb74fbb47b2659a2a76b54425`
confirms those test/build/type/lint counts; its26 expanded text entries scan clean.
The actual Vercel combined status reports deployment completed; its provider
isolation remains unreconciled and no customer journey there is claimed.

Fresh private HTTPS artifacts match565 Git application blobs,45,785 sealed files
and158 inspected client files. Locked installation, configured webpack build,
public-origin/key binding, server-secret exclusion, strict published CA, actual
Unix19/19 and HTTPS11/11 checks pass. The latest normal-network native browser
run passes19 of20 checks: actual A sign-out removes private course controls;
real cross-tab B sign-in retires the generation and refreshes B's incomplete first
lesson; current B authenticated reads return200 and a stale A purchases hint409.
Free B sees its own empty history, identity, zero paid counters, unobstructed
read-only profile/settings, and the paid dashboard route remains gated.
Matching SSR identity is explicitly a source-derived equality inference,
corroborated by actual B-owned reads and incomplete-course UI, not serialized-byte
proof. No playback, learning, payment, mail or preference/profile edits occur.

This run stops at B's final normal menu click timeout; physical hit/stability and
trusted dispatch were not observed. It does not establish an application defect
or prove B sign-out. Earlier8/9 detector and two5/6 menu diagnostics remain
immutable and distinct. Actual artificial delayed-response privacy is unproved;
closed source regressions cover it separately. All browser contexts and owned
app/tunnel processes close; strict-CA all-five/12-model before/after hashes,
global counts, learning/entitlements and business rows remain unchanged, and
sealed reinspection passes. Six total password/session requests across those
closed windows are recorded rather than resetting a consumed budget. A fresh
bounded foreground/actionability observation is in preparation.

The source and account UX are unreleased. Dodo recipients/transactions/delivery,
Google/SMTP, continuous host/account/DNS, previous Vercel quarantine and production
hardening/release remain required gates. No new spend or production change.

## Contained paywall and complete native account verification

A further foreground observation on exact4f preserves the **19/20** failing
native baseline. The free account's sign-out button has a visible, focused,
font-ready222×40 rectangle, but its center hits a DIV outside the menu. An ordinary
Playwright trial confirms pointer interception, with no instability, detachment,
viewport or scheduled-navigation issue; no B logout request is made. Header and
later paywall both havez30, so the paywall escapes its content stacking context
and covers the header dropdown. Earlier menu timeouts remain unclassified raw
diagnostics; this new observation establishes the narrower actual defect.

Final source **`4145268936bfd7b386dd51fd9f794459f7daa41c`** contains the paywall
inside its own stacking context. Independent review catches and corrects the
inline fixedz90 payment dialog being trapped there: the unchanged dialog is a
sibling outside the isolated content/paywall. Only one application file differs
from4f. Intermediatea056 is pushed together with its final correction and has
no separate remote/native proof. All18 frozen ownership-review file hashes remain
unchanged; the additional paywall/modal change has independent source review.
The unchanged22 account/paywall component cases pass. Required hooks pass with
explicit synthetic DATABASE_URL/Node24; the initial push rejection for a missing
required synthetic URL is preserved, and hooks are not bypassed.

Exact [Quality PR](https://github.com/nospotfer/jazz/actions/runs/38569228404)
and push38569223223, Secret Scan PR38569228825/push38569223311,
[CodeQL](https://github.com/nospotfer/jazz/actions/runs/38569225324)/aggregate115869968073
and the actual Vercel completed status all pass. Downloaded Quality ZIP SHA256
`e0e74433ee4a925af288c78cf1659648b00d221854e9ef1cc2eb83fb6c35cf82`
confirms2,130 normal/47 skips,46 actual PostgreSQL/one REST skip, types/build and
lint0/23. The570-file exact committed export and26 expanded log entries scan0.
Vercel provider isolation and customer journeys there remain unverified.

A fresh414 locked-install/configured build again matches565 Git application
blobs/45,785 immutable files/158 client files, compiled origin/public key, strict
CA and server-secret exclusion; actual Unix19/19 and HTTPS11/11 pass. The
normal-network native browser now passes **24/24**: actual SDK cross-tab A
sign-out/B sign-in, private course retirement/refreshed B incomplete state,
owned empty receipts/header/counters/profile/settings, actual stale-hint409,
retained paid-course restriction, reachable purchase option, and dialog open/
cancel with full-viewport physical coverage of header/sidebar/menu. Both actual
sign-out buttons have unobstructed physical targets, pass ordinary trial clicks,
receive trusted pointer/mouse/click events and perform normal logout; B's final
sign-out removes the other tab's private frame. No forced clicks/fake SDK events.

This window uses two password requests/two normal session syncs/one normal own
avatar metadata PUT/two normal logouts. Ten password/session requests total
across all closed owner-test windows remain explicit. There are no checkout
continuations, voucher interactions, provider payments/mail, playback or learning
writes, profile-form or preference edits. Actual delayed-response privacy and
provider payment amounts are not proved by these geometry/ownership checks.
Strict-CA before13:07:24/after13:10:59 all-five/12-model/global/learning/business/
entitlement hashes remain unchanged. All contexts/Chromium/app/tunnel processes
close cleanly; final sealed inspection passes. Existing services are preserved.
The source remains unreleased, with zero new spend and all provider/production/
hosting gates retained; the maintenance goal remains active and incomplete.


## Catalog prices and course-action lifetime

Source **`44ec58bebffd9735f9af6b4f51b6f5b1eb86a4f6`** repairs a confirmed
catalog/UI family. Dashboard summaries and outlines fetch the price and ID from
the same oldest published course; changed cache keys avoid reusing the earlier
ID-only shape. The dashboard course widget, paywall, course details/enrolment and
lesson-player modal now receive that known catalog price. Real numeric zero stays
zero; missing, negative, nonfinite or nonnumeric values stay unavailable. The
shared dialog displays a coherent voucher original/discount/final snapshot;
unknown voucher amounts disable continuation and validation. Omitted legacy
callers retain the prior default, while explicit NULL has an unavailable label
and recovery hint. All current course callers provide an explicit price.

The backend previously coerced NULL and malformed amounts into its free-grant
branch. It now returns localized503 before voucher evaluation, purchase writes
or provider checkout for an unavailable catalog price; explicit numeric0 retains
the intended free path. Duplicate-purchase diagnostics now retain only the finite
`already_purchased` category, removing customer/course/purchase identifiers and
role. There is no claim of an actual provider incident or historic log scrubbing.

Course/open epochs reject voucher callbacks from removed courses, closed dialogs
and earlier openings, and reset displayed vouchers and parent checkout intent
together. Course-ID keys retire course-specific purchase state. A frozen actual
React commit-order test shows old course DOM removed while its action guard is
still valid during the replacement's layout phase; synchronous cleanup now retires
that guard and the player's mounted flag. Same-owner token refresh and immediate
SDK owner invalidation retain their existing behavior.

Frozen source baselines remain distinct: catalog10 has5 failures/5 controls;
modal lifetime8 has6 failures/2 controls; checkout availability13 has9 failures/4
controls; duplicate logging1 fails; customer caller20 has18 failures/2 controls;
commit-order lifetime3 has1 failure/2 controls. Six additional modal safeguards
pass. These61 new cases are included in the full suite. Initial harness diagnostics
are preserved separately and excluded from the application failure counts.
Independent review binds all22 source/test files to committed hashes. Twelve of
the previous18 ownership-review source files remain unchanged; the six changed
files have explicit current independent review.

Fresh clean Node24 verification passes **2,191 normal tests/47 skips**,
**46 actual PostgreSQL checks/one REST skip**, types and lint0 errors/23 existing
warnings. Exact [Quality PR38579918169](https://github.com/nospotfer/jazz/actions/runs/38579918169)
and push38579904074, Secret Scan PR38579918261/push38579904114,
[CodeQL38579909536](https://github.com/nospotfer/jazz/actions/runs/38579909536)/aggregate115907021445
and the actual Vercel completed status pass. Downloaded Quality ZIP SHA256
`4e9281fe1ad80dc599182024f4c245bb826115b379e0d7d2deaa91932596117d`
confirms those normal/persisted counts, types/build/lint;26 expanded entries scan0.
The exact577-file committed export scans0 without new suppressions. Vercel
provider isolation and journeys there remain unverified.

A fresh configured locked-install artifact matches572 Git application blobs,
45,792 sealed files and158 inspected client files. Public origin/key binding,
server-secret exclusion, strict published CA and actual Unix19/HTTPS11 checks
pass. A timestamp-shape rejection occurs before app/browser startup; canonical
normalization preserves the original expiry and credentials. The first native
run retains21/22 checks: current owner/account flows and class2 denial/details80
pass, then the new helper checks a dynamic language wrapper before waiting for
mount. The second retains20/21, stopping on an immediate redirect assertion.
Neither old report records enough timing detail to relabel its failure as a pass.
Both browser reports remain immutable; no application defect is established by
those assertions. Prior414 native24/24 also remains a distinct historical scope.

A separately scoped fresh B-only browser on the same verified source44 artifact,
active gate and **unchanged expiry** passes **32/32**. Its24 quote/dialog cases
cover dashboard CourseView, course details/enrolment and the dashboard paywall,
ES/EN/FR/PT at1440/390. Actual ordinary language clicks set matching cookie and
HTML language; the current trace observes the dynamic control count0 before the
wait and1 after it. Catalog80 appears in CourseView/details and dialog base/total,
with genuine zero discount; ordinary unobstructed open/cancel clicks pass. No
voucher entry/validation or checkout continuation occurs. Paid class2 returns
actual200 document responses for the requested lesson and redirected course
details, then a locked course-details URL/owned frame/quote80 with no player.
Normal B sign-out uses trusted clicks and an unobstructed target; zero uncaught
client errors, forbidden mutations or session artifacts remain. This addon does
not repeat or claim the earlier full cross-tab owner journey. The lesson-player
payment dialog remains natively unexecuted: existing server access checks prevent
B reaching its locked branch, while A already owns the course. Its caller/NULL/0
behavior is covered by the separate real-component regressions.

The originally launched helper SHA256
`a12b38b1ef927e09f468cb0cbcaaa0f1d045ddae098cdac7537340b956d580a7`
is retained separately. A later preparation-only revision is not the executed
input and cannot be counted as evidence. The addon uses one B password request,
one normal session sync, no avatar PUT and one normal logout. Together with the
preceding two-actor run this active preview uses three password/session pairs;
all closed owner/catalog windows total15, without resetting consumed budgets.
Strict-CA before14:37:48/after14:51:12 all-five/12-model/global/business/learning/
entitlement hashes remain unchanged. All browsers/Chromium/app/tunnel processes
close cleanly and sealed reinspection passes. The first21/22 window separately
preserves its own before14:25:45/after14:31:52 comparison and closure. Actual
artificial delayed replies, provider charges and the unreachable player dialog
are not proved by this catalog addon.

**Positive billing parity remains unresolved:** checkout metadata still uses the
existing29.99 default, while Dodo's cart charges its configured product price.
Catalog/UI alignment does not verify the provider's charge, tax or currency.
The dialog says the final amount is confirmed in checkout; this is not a
reconciliation or a substitute for provider verification. No catalog SQL, provider
price, schema, tax/currency policy, real transaction/refund or third-party mail
change is authorized or performed. Production remains unreleased; all broader
provider/hosting/hardening gates remain and the goal is incomplete.


## Checkout publication and account intent

Application source **`cd20569a4460374518bfd20c3a21a9957abac5c5`** contains
`3ce58a8` plus a lifecycle-test URL correction. Checkout now requires an explicitly
published course before free grants, voucher work or provider checkout, including
for admins. A verified cookie identity remains the sole purchase authority. An
optional `expectedUserId` consistency hint is checked immediately after server
`getUser`, before all database reads and financial work. Wrong, blank or duplicate
hints return409 `Session changed`; omitted legacy hints and unauthenticated401
retain their behavior. All four active clients send their captured owner ID and
show localized manual-refresh guidance for that precise JSON409. Ordinary voucher
conflicts and current-owner/frame/lesson guards remain intact; no retry is added.

Frozen source44 baselines are separate: publication9 has4 failures/5 controls;
server intent8 has4 failures/4 controls; client28 has8 failures/20 controls. A
real disposable PostgreSQL baseline4 actually persists a draft grant and a
wrong-cookie grant in its two failures, with two legitimate controls. The same
frozen server/PG bodies pass after the repair. Initial client selector diagnostics
are preserved; revised assertions target the actual modal. Thirty new normal
cases and four opt-in PostgreSQL cases are included in full verification. The
first full run has2,219 passes/two failures/51 skips: two older lifecycle afterEach
checks allowed only a plain checkout URL. Their exact captured-owner URL update
preserves the behavior assertions; the failed report remains retained.

Final clean private Node24 checks pass **2,221 normal tests/51 skips**, **50 actual
PostgreSQL tests/one REST skip** in six guarded suites, types and lint0 errors/23
existing warnings. Independent review binds15 relevant source/test/unchanged
safeguard hashes to the final commit; the sole author-manifest delta is a root
type-import alias correction. Mandatory hooks pass. Exact
[Quality PR38593319613](https://github.com/nospotfer/jazz/actions/runs/38593319613)
and push38593308747, Secret Scan PR38593319973/push38593308748,
[CodeQL38593310891](https://github.com/nospotfer/jazz/actions/runs/38593310891)/aggregate115953795818
and actual Vercel status pass. Quality ZIP SHA256
`c544613385e75f088092d20cd77e2031b0faa5e4a92575a684e56f2eeb0d78ea`
confirms these counts/types/build/lint;26 expanded entries scan0. The exact581-file
Git export scans0 without new suppressions. Vercel isolation remains unverified.

A new configured locked artifact matches576 Git application blobs/45,796 sealed
files/158 inspected client files, with public origin/key binding and no supplied
server secrets in client assets. Actual Unix19/HTTPS11 checks pass. Payments,
mail and cron credentials are absent. The actual native checkout matrix passes
**12/12**: dashboard CourseView, details/enrolment and the paywall ×ES/EN/FR/PT
at390. Real B actions produce unchanged B owner hints/body; A's independently
verified live API cookie jar gets actual409 JSON, relayed without body/status/
header rewriting. Original B POSTs are never continued. The actual modal shows
manual-refresh copy, without redirect or retry. No provider payment/mail occurs.
This controlled transport relay is not naturally occurring Chromium cookie lag.
The locked-player modal remains covered by actual components, not native claims.

The first browser stops before checkout on a wrong purchases409 JSON assumption;
that older route returns plaintext. Its two sign-in/session pairs remain consumed.
A distinct frozen correction on the same artifact/origin/gate and unchanged expiry
passes the12 matrix cases and both identity preflights, then stops on an immediate
logout-counter assertion without awaiting its response. Both raw reports and
executed helper hashes remain separate; no established application logout defect
or whole-run success is inferred. All their contexts/Chromium close; page errors
and forbidden mutations are0. Four total password/session pairs in this preview
bring cumulative owner/catalog/checkout windows to19. A separately bounded
sign-out-only browser uses two additional password/session pairs and no checkout.
Ordinary native clicks produce trusted pointer/mouse/click events, actual global
logout204 for both accounts and signed-out private boundaries before assertions.
This independent two-sign-out proof passes; neither earlier partial is relabeled.
Six pairs in this preview and21 cumulative remain explicit; three recognized
optional own-avatar PUTs are blocked, with0 metadata writes. Strict-CA before
15:54:34→after16:24:08 all-five/12-model/global/business/learning/entitlement hashes
remain unchanged. Every context/Chromium/app/tunnel closes, owned sockets are
removed and final sealed inspection passes. No matching provider checkout,
natural cookie-lag reproduction or native locked-player pass is claimed.

A separate private offline package fingerprints **93 public index definitions**,
including standalone uniqueness that the hardening revision2 table/name guard
does not prove. Its18 closed checks pass, including a same-name UNIQUE→nonunique
counterexample; no production drift is observed or SQL executed. Root verifies
all12 frozen artifact hashes and four protected original hashes. This is a
review-only preflight proposal: a future locked-transaction integration is needed
to remove the separate-capture race. Revision2 SQL/inverse remain unchanged;
column equivalence and the extension ACL recovery gap remain unproved.

The published-course check is a read snapshot, not a transactional publication
lock or a historical-entitlement revocation. Positive29.99 metadata and Dodo
product/catalog/tax/currency parity remain separate release gates. No provider
transaction/refund, third-party mail, pricing/config/schema or production change
occurred. Zero new spend; the goal remains active and incomplete.


## Quote provenance and transactional course intent

Commits `b91a7fb`, `e8b9fab`, `bd49f00`, `c1a419c` and fixture-only `a631e166`
repair mobile administration, transactional course intent and payment provenance.
Checkout labels catalog80/coupon72 as quote metadata rather than29.99 payment
facts. Provider cart/product configuration is unchanged. Extraction preserves
actual final amounts including0; merchant metadata and gross totals cannot
supply absent original/discount amounts. Legacy explicit provider subtotal can
produce a difference only with EUR/zero-tax evidence and subtotal>=total;
otherwise discount stays unknown. Applied coupon identity, entitlement/reversal
rules and known same-reference facts remain intact. No historical backfill.

The exacta16 pricing freeze has26 cases/21 failures/five controls; corrected26
pass. A separate intermediate ordering boundary has one failure/two controls,
then three passes. Author222 focused passes and independent13-file review cover
quotes, actual totals, coupon usage, partial/same-reference/replacement/refund
behavior and meaningful compatibility fixtures. These are closed mocks, not
provider transactions. Whole source initially fails four older expectations;
three fixture-only files correct guessed amount contracts and the missing mocked
lock read, retaining names/counts and original assertions. Original2351/4/68
report stays immutable; final fresh **2355/0/68**, types and lint0errors/22warnings
pass. Eight guarded PostgreSQL suites separately pass **67/one REST-only skip**.

Free-grant transactions retain a course `FOR NO KEY UPDATE` lock after the
existing voucher advisory lock, rechecking publication/exact server price and
revalidating the server voucher quote through the transaction client. Genuine
free grants and voucher limits remain. The lock blocks publication/price edits
while permitting ordinary FK KEY SHARE, avoiding the stronger lock's ordering
risk. No early VoucherCode row lock is introduced; concurrent administrative
voucher-term edits remain a separate gap. Paid historical fulfillment keeps its
existing policy. Direct redemption course conflicts return400/503/409; checkout
maps them to404/503/409. Quote409 does not use the session-conflict JSON shape.

Frozen real PostgreSQL evidence proves five new direct-redemption interleavings
and four checkout races: stale unpublish/NULL/known-price/zero-to-paid grants
really persist before and leave all grant/accounting/use counts0 after. A real
250ms lock timeout confirms the admin edit waits until the grant transaction
finishes, then proceeds. Root's six new checkout cases preserve two legitimate
0/full-voucher grants; together with four older owner/publication controls they
pass10/10. Exact UUID-only fixture cleanup preserves unrelated data.

Mobile admin now stacks the sidebar/content and exposes native expandable
navigation with keyboard support and44px targets. Email and purchase identities
wrap; recorded amounts/permission guards are unchanged. The broken creation
shortcut now links to the existing course list; course authoring is still absent.
Actuala16 baseline has390px viewport/683px document,288px sidebar/102px content;
1440 fits. Separate freshc1a preview passes eight geometry observations at
320/390/768/1024/1440 (including three open-menu states), three actual keyboard
menu cases and six permitted44px links at every width. This is light-theme
admin evidence; no new dark-theme visual claim. Actual normal global logout204
and zero page errors/forbidden mutations pass. One pair in each separate admin
window brings cumulative owner/catalog/checkout/voucher pairs to26. Original
voucher12/13 and zero-traffic preflight reports remain unchanged.

Fresh configuredc1a build matches586 Git application files/45,806 sealed files/
158 inspected client files and passes Unix19/HTTPS11. Root before23:08:44 to
after23:13:51 UTC strict-CA all-five/12-model/global/business/learning/entitlement
and complete raw course/timestamp comparisons match. Browser/app/tunnel close
cleanly, owned processes/sockets retire and seal reinspection passes. Both admin
windows have zero course/learning/public-table writes. Sourcea631 differs from
that runtime only in three test files; it is not a new native execution.

Exact-source [Quality PR](https://github.com/nospotfer/jazz/actions/runs/38652699048)
and [Quality push](https://github.com/nospotfer/jazz/actions/runs/38652694052)
pass; [Secret Scan](https://github.com/nospotfer/jazz/actions/runs/38652699044)
and [CodeQL analyses](https://github.com/nospotfer/jazz/actions/runs/38652694888)
pass, with no open branch CodeQL alerts at inspection. Classic Vercel status is success;
remote provider isolation remains unverified. Downloaded26-file Quality logs
confirm2355/68 and67/1, types/build/lint0/22 and all eight persisted suites.
591 committed files/26 expanded logs scan0. Selected102 evidence files plus
manifest/retention receipt are copied byte-for-byte to the private durable
`review-checkpoint-quote-admin-a631e166` directory under the existing
`2026-10-13-recovery-689f1b24` backup. The nonempty103-file candidate scan finds0;
credentials/raw course rows/session state/screenshots are excluded. All retained
directories/files are0700/0600. This local unencrypted copy does not establish
off-site recovery. Docs-head checks remain a separate finalization step.

**PAY-22 remains High source work:** current currency-independent /100 conversion
and two-decimal sync misread explicit JPY/KWD. These fixes establish bounded EUR
provenance, not currency-aware persistence/display. Dodo documents
[currency-specific smallest units](https://docs.dodopayments.com/api-reference/payments/get-payments-1).
Sourcecounterexamples: JPY2990 becomes29.9 instead of2990; KWD2990 becomes29.9
instead of2.990, and1.234 would round to1.23. No customer incident is claimed.
Next: implement currency/precision representation and meaningful persisted
regressions, preparing any schema change without production migration. Provider
price authority/actual test transactions/notification recipients, OAuth/mail,
continuous free hosting/DNS and exact production recovery/quarantine review remain
gates. Zero new spend, real charge/refund, third-party mail or production change.
