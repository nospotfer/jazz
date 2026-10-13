# Prioritized maintenance backlog

Updated 2026-10-13. All source fixes are local on the maintenance branch;
**none has been deployed to production**. Evidence distinguishes mocked tests,
persisted local journeys and actual provider inspection.

## Confirmed defects addressed locally

| ID | Priority | Finding and resulting behavior | Evidence / remaining check |
| --- | --- | --- | --- |
| SEC-01 | High | Server identity trusted cookie session data; now validates `auth.getUser()` and fails closed. | Forged/unverified identity regressions; persisted customer-role negatives. |
| SEC-02 | High | Cron accepted spoofable Vercel header; now requires configured bearer `CRON_SECRET`. | Missing/wrong/spoof tests; production secret unverified. |
| SEC-03 | High | Pending registration password/profile overwritten before ownership proof. | Existing-identity/proof regressions and real emailed-OTP onboarding. |
| SEC-04 | High | Unhydrated credential forms sent passwords through GET; now explicit POST. | No-JavaScript browser regression with no password query. |
| SEC-05 | High | Empty owner/user email could authorize media; publication/access hierarchy inconsistent. | Role/owner/publication regressions and real free/buyer/legacy/admin matrix. |
| SEC-06 | High | Client quiz verdict/membership influenced awards; now locked server grading and immutable stored verdicts. | PostgreSQL concurrency/ownership/options tests; 15 actual buyer quiz completions. Historical forged awards require separate evidence. |
| SEC-07 | Critical, fresh schema | Browser roles exposed LMS tables after db push; legacy policies permit role/entitlement escalation. Scoped SQL removes browser grants and enables RLS. | Real roles and local REST deny all 25 tables; owner server CRUD preserved. Production exposure/functions/views remain unverified. [Database review](database.md). |
| SEC-08 | High | Optional replay attempted recording on auth without consent; now homepage-only, opt-in, privacy-signal aware and scrubbed. | 72 focused tests plus public consent/withdrawal browser checks; provider settings remain gates. |
| SEC-09 | Medium | Auth cookies omitted Secure in production; arbitrary provider errors could enter logs. | Nine actual SDK cookie tests and 11 controlled integration-diagnostic regressions. |
| SEC-10 | High | Destructive voucher test APIs were production-callable with broad/default-write scope; synthetic checkout could write to an ambient production DB in development. | Explicit separate opt-ins, strict loopback/disposable DB guard, production disabled, dry-run defaults and explicit course/user filters; 137 focused mocked tests. Separate CLI quarantine is OPS-02. |
| PAY-01 | High | Standard Webhooks decoding/signature normalization incompatible with Dodo. | Independent vectors and malformed/unicode/replay/configuration negatives; actual delivery unverified. |
| PAY-02 | High | Reconciliation could grant another customer's payment or restore refunded access. | Matching owner/course/detail ID, persistent reversal ledger and real PostgreSQL races/reversal tests. |
| PAY-03 | High | Failed/won refund/dispute events revoked access; actual payment_id ignored. | Provider-shaped lifecycle/ID regressions. Successful partial-refund revocation policy preserved. |
| PAY-04 | High | Free vouchers exceeded concurrent limits; coupon edits could affect unrelated provider discounts. | Atomic limits, persistent races, provider ownership/lifecycle regressions and real voucher browser journey. |
| PAY-05 | High | List summaries/stale metadata miscounted coupons, including tax-inclusive totals. | Full payment detail before grant; actual coupon identity and route/accounting regressions. |
| MSG-01 | High | Runtime DDL/table/BigInt defects broke messaging; inbound trust and deduplication incomplete. | Explicit schema, persisted API/signature regressions. Live receiving remains disabled. |
| MSG-02 | High scan finding | CodeQL flagged incomplete one-pass HTML tag removal. Replaced it with a bounded parser producing plain text, preserving safe inbox encoding and text-only notifications. | Malformed/entity/limit/native webhook and actual inbox regressions pass. Remote CodeQL passed and PR alerts 14/15 are fixed; no executable HTML sink was established. [Messaging](messaging.md). |
| DATA-01 | High | Notes used invalid tables/runtime DDL/missing Boolean fields. | Prisma persistence/actor guards, PostgreSQL tests and actual notes reload/staff review. |
| DATA-02 | High | One purchased lesson could qualify as entire-course completion. | Full 15-lesson denominator/entitlement; eligible buyer and legacy denial browser proof. |
| UX-01 | High | Public mobile signup/actions clipped; dialogs lacked keyboard/focus handling. | 320/390/1440 review; accessible dialogs and 15 public browser checks. |
| UX-02 | High | Certificate export failed on Tailwind oklch colors. | Direct vector exporter; real A4 PDF download and Unicode rendering checks. |
| UX-03 | High | Recovery redirected between localhost aliases and lost session cookies. | Bounded same-port loopback origin fix; actual recovery/new-password login passes. |
| UX-04 | High | Private mobile quiz submit/dashboard controls clipped. | Four actual quiz cases pass at 320/390 in both themes, including result/submit scrolling; four header/menu cases pass with no clipped controls. |
| UX-05 | Medium | Mixed labels, dark-only form text, zero-based class numbering and confusing sales hierarchy. | Four-language labels, theme tokens, 1–15 numbering, clearer first-free/full-course presentation; private medal contrast confirmed in both themes. |
| UX-06 | Medium | Course admin showed missing create/edit routes and inert delete button. Unsupported controls removed; valid course preview retained. | Route inventory and lint; authoring remains a separately scoped feature. Unused individual-lesson purchase component removed after no-consumer check. |
| UX-07 | High | Global CSP blocked native protected PDF iframe despite valid downloads. Attachment-only same-origin exception ported from unmerged June fix. | Actual Chrome renderer success and visible PDF content at 1440/390; page framing remains denied. |
| SEO-01 | Medium | Production robots/sitemap 404 and indexing boundaries unclear. | Production homepage metadata/discovery; private/preview noindex regressions and browser checks. |
| DEP-01 | Critical/high | Unsupported runtime and vulnerable/unused dependencies. | Node 24/Next 16.4 upgrades, unused viewers/workers/html2canvas removed. Five high dev lint-chain findings remain, with no upstream braces patch; production-only audit reports zero. |
| OPS-01 | Medium | CI absent, Dependabot directory wrong, guidance stale. | Build/lint/types/tests and real PostgreSQL workflow, redacted scanning, updated runbooks. Follow-up Quality, Secret Scan and CodeQL passed. [Checkpoints](review-status.md). |
| OPS-02 | High | Legacy mutators could change all prices/users/vouchers/media through ambient production configuration. All 15 inventoried entrypoints now require a separate default-off opt-in and known disposable loopback targets before client construction; production is always denied. | 110 mocked guard/entrypoint negatives, dry-run/scoped reset and signed-URL logging regressions. Legacy fixture semantics and production backup/restore/tooling remain separate work. [Inventory and exact quarantine](operational-scripts.md). |

## Open verification and release gates

| ID | Priority | Gate | Exact next action |
| --- | --- | --- | --- |
| LIVE-01 | Critical availability | Deployed Supabase host and older .env host both NXDOMAIN. | Obtain dashboard/project inventory, locate and preserve customer database before replacement/configuration changes. [Public evidence](public-provider-evidence.md). |
| LIVE-02 | High | Vercel team/project/env and isolated remote preview unavailable. | Project/team access or scoped token; verify separation/runtime/cron, deploy exact review commit. |
| LIVE-03 | High | Production DB roles/RLS/schema/functions/storage/restore unknown. | Read-only metadata/backup inspection; prepare reviewed baseline and scoped SQL. No production db push/legacy replay. |
| LIVE-04 | High | Actual Dodo pricing/currency/tax/refund/invoices/test checkout unknown. | Current test-mode account access; isolated checkout, real webhook/return/coupon/reversal evidence. No live charges. |
| LIVE-05 | High | Resend receiving/webhook disabled and MX absent. | Review DNS/receiving/signing/controlled-mail activation. [Runbook](resend.md). No unsolicited professor/student mail. |
| LIVE-06 | High | Purchase Float values lack full currency/tax/refund financial journal. | Compare authorized provider evidence with persistence before proposing reviewed schema/data migration; preserve event ledger and entitlements. |
| LIVE-07 | High | Google OAuth/Auth URLs/SMTP unknown. | Active Supabase/Google configuration read access, then isolated OAuth test. |
| OPS-03 | Medium | Registrar renewal/billing/recovery/shared ownership incomplete. | Account evidence and read-only renewal/billing review; preserve shared Stripe/Mux resources. |
| PRIV-01 | Medium | GA automatic measurement may bypass manual restrictions; OpenReplay account unknown. | Keep tracking disabled until provider settings verified; disable automatic history/forms/outbound/video/download capture before GA enablement. |
| BIZ-01 | Medium | Existing 30-day guarantee, live price/currency and legal copy need evidence. | Verify actual terms/product before changing promises; no invented social proof or discounts added. |
| HIST-01 | Medium | Removed tracked test-account credentials remain in history. | Owner rotates later as requested; no unattended history rewrite/rotation. |
| QUAL-01 | Medium | Draft PR #46 passes actual Quality, Secret Scan and CodeQL; both initial findings are fixed. Exact Vercel preview built but requires SSO. | Verify provider isolation/customer journeys on the actual remote preview. [Checkpoints](review-status.md). |

Existing lint warnings are documented, not hidden. Neither unavailable account
access nor an empty REST result proves an integration is correctly configured.

Lower-priority UX follow-ups: unify all voucher API error messages with the selected client language; localize sidebar menu accessibility labels; verify inherited certificate/guarantee wording against actual business terms. Voucher happy-path text and its valid-length example are corrected.
