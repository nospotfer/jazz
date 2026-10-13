# Production review and rollback checklist

Updated 2026-10-13. Preparation only: **no production release is authorized**.
Local repairs have not changed the website, accounts, DNS or live database.

## Recorded production baseline

- GitHub production deployment **4786399978**, successful 2026-05-22 17:26 UTC,
  source **c897f36da5a677097a91c6f509cc4a804a328051**.
- Recorded deployment: `https://jazz-f6fczhw27-gabriels-projects-bd92791f.vercel.app`.
- Public alias: `https://www.culturadeljazz.com`; apex redirects there.
- This is the latest successful production record inspected in GitHub, not proof
  of current Vercel alias assignment or rollback usability. Confirm in Vercel.
  Its public Auth hostname currently fails DNS; code rollback cannot repair that.

## Review gates

- [x] Document and repair substantial auth/payment/media/quiz/notes/privacy/UX defects.
- [x] Node 24, clean lockfile installation and Prisma generation succeed.
- [x] Local webpack production build and clean Turbopack build succeed.
- [x] Actual isolated OTP/recovery, free/buyer/legacy media, notes, quiz/medals,
  certificate and voucher journeys have evidence.
- [x] Public responsive/privacy/SEO browser checks and real guarded PostgreSQL
  accounting/security checks pass.
- [x] Finish private mobile quiz/header review and prove native PDF rendering; final source review complete.
- [ ] Final committed revision passes lint/types/tests/build/secret scan and actual
  GitHub Quality, CodeQL and secret-scan checks.
- [ ] Verify Vercel team/project, alias/env/runtime/build/cron/logs/rollback.
- [ ] Locate and preserve customer Supabase database; reconcile public/server
  settings. Both known project DNS endpoints fail. [Evidence](public-provider-evidence.md).
- [ ] Confirm remote preview uses isolated data/providers, deploy exact review
  commit and repeat relevant customer journeys. Local copied preview is not Vercel proof.
- [ ] Inspect production schema/roles/table/function/view grants/storage/migration
  state and a tested backup/restore path.
- [ ] Verify Dodo test account/products/currency/tax and actual checkout, signed
  webhook, reconciliation, coupon and reversal flows.
- [ ] Verify current Google OAuth/SMTP configuration and isolated login.
- [ ] Prepare exact production configuration/SQL diff and approved sequence.
- [x] Draft PR #46 and [review checkpoints](review-status.md) record exact source,
  protected preview, initial CI/CodeQL findings and remaining gaps. Refresh with
  the follow-up's actual remote checks before review progresses.

## Configuration review package

Values remain in provider stores. Publish names, targets and status only.

| Configuration | Review before release |
| --- | --- |
| DB/Supabase URL, anon/service keys and storage bucket | Same preserved project; server role retains CRUD after hardening. Public key must not be a service-role key. |
| APP_URL/NEXT_PUBLIC_APP_URL and Auth allowlist | Exact canonical origin plus /auth/callback, /auth/reset-password/callback and /auth/reset-password; separate preview project, no production wildcard preview allowlist. |
| Runtime/root/build | Node 24.x, root jazz-lms, npm ci, npm run build:webpack; verify provider overrides. |
| CRON_SECRET | Nonempty random per-environment server secret; 03:15 UTC bearer sweep; missing/wrong credentials denied. |
| Dodo keys/product/environment | Test mode staging; live mode only in approved production. Verify actual signing/account product; local synthetic checkout disabled outside loopback preview. |
| Mux signer | Match registered key/signed assets; trim CSV trailing comma. Never apply stale mapping script to live lessons. |
| Resend/from/professor/reply/signing | Verified sending identity; inbound needs approved receiving DNS and enabled signed webhook. Native RESEND_WEBHOOK_SECRET differs from optional relay secret. [Runbook](resend.md). |
| GA/OpenReplay | Initially disabled. Review provider settings, then prove choice/withdrawal/private exclusions. Disable GA automatic history/forms/outbound/video/download capture. |
| Owner/admin identity | Validated Auth identity and intended role; no invented Auth ID via legacy admin:create. |

## Database change package

No blanket migration replay is proposed. A complete initial PostgreSQL migration
is unverified; db push was used only on disposable local databases.

1. Inspect sanitized ownership/grant/RLS/function/view/migration metadata,
   runtime-role capability, backups and restore evidence.
2. Compare actual schema with Prisma and messaging definitions. If absent,
   prepare only reviewed setup-messaging.sql and required missing columns.
3. Review harden-lms-rls.sql and harden-messaging-rls.sql separately. Confirm
   owner/BYPASSRLS and trusted CRUD, shared dependencies and function/view grants.
4. Get explicit approval for exact SQL and sequence. No production seed, db push,
   reset, wipe, full legacy-policy replay or financial schema migration.
5. Verify browser denial/server continuity with approved synthetic identities;
   retain pre-change metadata for reviewed forward repair.

## Release after explicit approval

1. Confirm approved commit, deployment target, exact configuration/SQL changes,
   prerequisites and verified previous deployment/rollback target.
2. Apply only approved prerequisites through the verified project's supported
   path; deploy the approved code revision.
3. Verify public discovery/noindex, identity/recovery/OAuth, video/private PDFs,
   free/paid negatives, quiz/notes/certificate/admin and cron access. Provider
   tests and any third-party messages need the explicit approved scope.
4. Inspect sanitized deployment/webhook/media/accounting failures. No unapproved
   real charge, refund or customer email.
5. Record actual deployment ID/commit and each check before reporting success.

## Rollback / forward repair

- Promote the verified previous Vercel deployment only after checking current
  environment/runtime/provider compatibility. Code rollback does not restore
  failed Supabase DNS, lost data or disabled inbound email.
- Restore reviewed previous config from provider stores, never reports. Changed
  public build-time values require a rebuild.
- Handle SQL separately: application rollback does not reverse grants/schema.
  Proposed hardening preserves data and is atomic; repair a proven server-role
  dependency before considering restoration of unsafe browser grants. Broader
  restoration requires its own approval and backup evidence.
- Preserve IDs, purchases, reversal ledger, voucher accounting, progress,
  attempts, notes and messages. Never use seed/wipe/reset as recovery or delete
  reversal events to force reconciliation.
- If core checks fail, retain failed revision/sanitized evidence, stop further
  production mutation, and use only approved rollback/forward repair.
