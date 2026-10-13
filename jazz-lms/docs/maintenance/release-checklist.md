# Production review and rollback checklist

Updated 2026-10-13. Preparation only: **no production release is authorized**.
Local repairs have not changed the website, accounts, DNS or live database.

## Recorded production baseline

- Authenticated Vercel alias/domain APIs identify Neurofactory's **jazz-lms**,
  project **prj_lEwrHldvtbnCByMPA9gvGzqVqpts**, team
  **team_u4fDHjN9J7mqJuDlulZmzrPc**, exact live deployment
  **dpl_6Xo6rUDVdh9jTWg4KoH1ok6iyU3D**.
- Deployment: https://jazz-4k7e4unoj-neurofactorys-orgs-projects.vercel.app,
  created **2026-06-11 05:21:22 UTC**, READY **05:23:39 UTC**, Node **20.x**,
  source **redeploy**; reported source **50c2f87fa0b4d458b90f88943720817bc690db58**.
- Both custom domains point to that deployment; apex redirects to www. Public
  homepage/auth script-path fingerprints match its direct URL. No Git project
  link/gitSource exists, so the source SHA is metadata rather than clean-checkout proof.
- GitHub Production record **4786399978** for **c897f36** on May 22 belongs to
  the earlier Gabriel deployment history; it is not the current live alias.
- Exact live target is verified; prior deployment compatibility and rollback
  usability remain untested. Supabase public DNS is unavailable; code rollback
  cannot repair that. [Vercel audit](vercel.md).

## Review gates

- [x] Document and repair substantial auth/payment/media/quiz/notes/privacy/UX defects.
- [x] Node 24, clean lockfile installation and Prisma generation succeed.
- [x] Local webpack production build and clean Turbopack build succeed.
- [x] Actual isolated OTP/recovery, free/buyer/legacy media, notes, quiz/medals,
  certificate and voucher journeys have evidence.
- [x] Public responsive/privacy/SEO browser checks and real guarded PostgreSQL
  accounting/security checks pass.
- [x] Finish private mobile quiz/header review and prove native PDF rendering; final source review complete.
- [x] Reviewed code checkpoint c6a0556 passes lint/types/tests/build/secret scan
  and actual GitHub Quality, CodeQL and secret-scan checks. Later source changes
  must pass fresh checks; subsequent documentation records this exact evidence.
- [x] Verify live Vercel team/project, aliases, environment scope, Node 20 runtime,
  daily cron and missing CRON_SECRET; read-only owner/member/plan evidence.
- [ ] Verify isolated target build settings, usage/logs and previous deployment
  compatibility/rollback; prepare owner decision for commercial site on Hobby.
- [x] Locate deployed Supabase project through manager inventory; feav exists,
  INACTIVE, eu-west-1/PG17, matching production server reference.
- [ ] Approve bounded same-project resume and verify actual customer data,
  separate Storage preservation and a usable backup/restore. [Proposal](supabase.md).
- [ ] Confirm remote preview uses isolated data/providers, deploy exact review
  commit and repeat relevant customer journeys. Local copied preview is not Vercel proof.
- [ ] Inspect production schema/roles/table/function/view grants/storage/migration
  state and a tested backup/restore path.
- [x] Verify live Dodo product/business, €29.90 EUR tax-exclusive base price,
  active webhook route/filters and exact signing-secret match through GETs.
- [ ] Obtain matching Dodo test credentials; verify dashboard/account/currency/tax
  decisions and actual isolated checkout, delivery, reconciliation/coupon/reversal.
- [x] Read stored Google/SMTP/Auth/storage/network settings; missing production
  PKCE reset callback and global preview Auth allowances documented.
- [ ] Review exact production Auth redirect changes and Google console settings;
  verify actual isolated OAuth/SMTP/recovery after service restoration.
- [ ] Prepare exact production configuration/SQL diff and approved sequence.
- [x] Draft PR #46 and [review checkpoints](review-status.md) record exact source,
  protected preview, actual follow-up CI/CodeQL success and remaining gaps.

## Configuration review package

Values remain in provider stores. Publish names, targets and status only.

| Configuration | Review before release |
| --- | --- |
| DB/Supabase URL, anon/service keys and storage bucket | Current three targets share feavujcllgbzlvdvkkxx. Preserve customer project and reconcile EU/US connection strings; separate preview. Verify trusted CRUD and public key scope. |
| APP_URL/NEXT_PUBLIC_APP_URL and Auth allowlist | Current stored apex Auth lacks /auth/reset-password/callback and allows global *.vercel.app. Prepare canonical www with exact callback/reset paths; separate preview Auth, remove broad production preview/local allowances in reviewed release. |
| Runtime/root/build | Live Node 20.x with root/framework/build overrides unset; prepare Node 24.x and source-root/build settings for the exact deployment method. Verify isolated build before production change. |
| CRON_SECRET | Currently absent in live project/deployment env names; prepare nonempty random per-environment secret with hardened release. 03:15 UTC bearer sweep; missing/wrong denied. |
| Dodo keys/product/environment | Preview currently shares live mode/resources; development test mode key returns 401. Supply separate verified test credentials/product/webhook in staging; preserve approved live resources. Synthetic checkout stays loopback-only. |
| Mux signer | Match registered key/signed assets; trim CSV trailing comma. Never apply stale mapping script to live lessons. |
| Resend/from/professor/reply/signing | Verified sending identity; inbound needs approved receiving DNS and enabled signed webhook. Native RESEND_WEBHOOK_SECRET differs from optional relay secret. [Runbook](resend.md). |
| GA/OpenReplay | Replay enabled across current targets; prepare initial disabled configuration. Review retention/provider settings and prove choice/withdrawal/private exclusions before enablement. Disable GA automatic history/forms/outbound/video/download capture. |
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
