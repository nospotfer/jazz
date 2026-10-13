# Supabase manager audit and recovery proposal

Observed 2026-10-13 after native CLI login on the remote machine. All provider
requests so far are GETs. No project resume, SQL, customer-row query, migration,
configuration change, key rotation, mail or plan change was performed. Credentials
and raw provider responses remain private outside Git.

## Verified project and account

| Item | Evidence |
| --- | --- |
| Accessible project | Jazz-LMS-Project, `feavujcllgbzlvdvkkxx`; exactly one project returned by CLI inventory |
| Organization | Neurofactory Org, `iotxifqyrryoidgagdxi`, Free plan, one Owner member; profile GET confirms the authenticated caller matches that Owner |
| Status / creation | INACTIVE; created 2026-02-17 13:01:22 UTC |
| Database | eu-west-1; PostgreSQL 17, platform version 17.6.1.063, ga channel |
| Database host | db.feavujcllgbzlvdvkkxx.supabase.co; matches Vercel production configuration |
| Restore-version GET | 200; available supabase-postgres-17.6.1.063, ga, engine 17 |
| Backup-list GET | 200; empty backups array and physical timestamps object, WAL-G true, PITR false |
| Backup entitlements | Scheduled backup, restore-to-new-project and backup-retention entitlements disabled; retention value zero |
| Account controls | Sole Owner member reports mfa_enabled false; organization-enforced MFA entitlement disabled; credential recovery unverified |
| Legacy project | wmujuzheurvrfyebobcj absent from this account's inventory; existence/other-account ownership unknown |

This confirms the deployed project exists and is inactive. It does not prove
when/why it stopped, customer-data completeness, or successful recovery. The
project API does not report paused_at. The restore-version list is engine
metadata, not a verified snapshot. Empty managed-backup results do not establish
that a pause snapshot is absent or that data has been lost.

Current [Project Pausing documentation](https://supabase.com/docs/guides/platform/free-project-pausing)
describes a one-year in-place restore window and retention of previous data and
configuration. This supersedes the historical 90-day guidance. Our observed
project was created less than a year ago, but project-specific eligibility and
actual restoration still require verification. The Free plan can pause again
after low activity; no artificial keepalive or upgrade was introduced.

## Stored integration configuration

| Area | Verified metadata | Limit / release work |
| --- | --- | --- |
| Auth | Signup/email enabled, confirmation required, anonymous users off; rotation and password reauthentication on; site_url uses HTTPS apex. | Effective service behavior remains untested while inactive. |
| Google | Enabled; client ID/secret present; nonce checks retained. | Google console ownership/callback validity and actual isolated OAuth unverified. |
| SMTP | smtp.resend.com:587; user/password/sender fields present. | Sending identity/deliverability untested; no email sent. |
| Redirects | Production /auth/callback and /auth/reset-password present; global *.vercel.app callbacks and local-development wildcards present. | Required /auth/reset-password/callback missing on production host; current www production paths absent. Replace broad production allowances in the reviewed release configuration; preview uses separate Auth. |
| Auth limits | Password minimum 6; OTP length 8 and expiry 3600s; configured email rate 30. CAPTCHA and breached-password checks disabled. | Product/security policy review; these flags alone do not prove abuse or justify unattended provider changes. |
| Storage | Config GET 200; file limit 50MiB and feature flags readable. | Buckets, object preservation, permissions and RLS unknown. |
| DB network | Stored restrictions applied but allow all IPv4/IPv6. | These rules cover DB/pooler, not Auth/Storage/Data API; application-level access and RLS still require inspection. |
| Unavailable settings | PostgREST config GET 404; SSL enforcement metadata GET 500. | Neither error establishes disabled Data API or absent TLS enforcement. |

Supabase [redirect guidance](https://supabase.com/docs/guides/auth/redirect-urls)
recommends exact production paths and scoped preview patterns. The maintained
source uses `/auth/reset-password/callback` for PKCE; stored apex rules do not
cover it. This is a configuration prerequisite for releasing that source, not
proof of a tested live recovery failure. Provider changes are still unapplied.

## Concrete production resume proposal — awaiting approval

The bounded proposed mutation is:

```text
POST https://api.supabase.com/v1/projects/feavujcllgbzlvdvkkxx/restore
No request body; authorization loaded from the existing private CLI session.
```

This is the documented same-project restore action, not restoration of an older
selected database backup, a replacement project, a migration or a plan upgrade.
It would restart the production backend referenced by the existing live site.
Existing app code, stored permissions and scheduled/integration work may become
active again; those have not yet been audited against the actual database. The
maintenance fixes in PR #46 would remain undeployed. Supabase may apply a minor
platform/PostgreSQL update during resume; no major-version upgrade is requested.
Record the returned version rather than assuming it stays identical. No
data-preservation guarantee is inferred from a 200 response.

1. Recheck the exact project/org/region/status, restore versions and backup
   metadata. Proceed only for this existing INACTIVE project and matching
   PostgreSQL 17 version; stop on an unexpected target, plan or eligibility error.
2. With explicit owner approval, issue the single POST above. Capture only safe
   status metadata; retain raw responses privately. Do not retry a mutation
   blindly after timeout; inspect status first.
3. Observe status/health with bounded read-only polling. Recheck DNS and Auth
   health without login/signup forms, checkout, cron or mail. An API acceptance
   is not a successful recovery; verify services before reporting success.
4. As soon as reachable, take a private logical database export and separate
   Storage preservation inventory/export through supported read paths. Keep
   backups outside Git with restrictive permissions; record hashes/sizes and
   restore verification, never customer contents or credentials. Managed DB
   backups alone do not contain the actual stored object bytes.
5. Inspect schema/migration histories, ownership/RLS/grants/functions/views,
   server-role capabilities, storage policies and scheduled jobs read-only.
   Verify course/media/product mapping without publishing customer records.
6. Test backup recovery in a separate local environment with outbound services
   disabled. Retain customer IDs/entitlements/progress/messages; do not load a
   production-data clone into the customer-journey preview.

**Bounded operational rollback, if included in the approval:** re-pause only this
same Free project through
`POST /v1/projects/feavujcllgbzlvdvkkxx/pause` if recovery exposes a material
unsafe state or fails verification and the provider permits pausing. This
restores backend unavailability, not a historical data snapshot. Never delete
the project, replace data, restore an older backup or undo grants automatically.
For ambiguous/failed restore states, stop, preserve evidence and report before
further mutation; cancellation/version changes require separate review.

Approval for this resume and emergency re-pause does not approve code deployment,
Auth settings changes, hardening SQL, billing upgrades, real payments/refunds,
customer messages or changes to shared services. Those need concrete separate
release review. The approval requirement comes from the owner's goal and the
repository's [operating contract](../../../AGENTS.md).

## If same-project recovery is unavailable

Preserve the source project. Where Supabase offers download links, recover both
the database archive and Storage files before any deletion; examine the archive
in an isolated recovery environment first. Current docs distinguish downloadable
logical backups from physical/PITR backups, so missing downloads require a
project-specific recovery decision rather than an empty replacement.
Paid managed cloning is unavailable under the observed entitlements and may
restart restored database jobs; no paid clone or plan change is proposed here.
Keep existing webhooks, Vault/encryption dependencies and Auth/provider settings
explicit in any future reviewed recovery/import package.

References: [project GET](https://supabase.com/docs/reference/api/v1-get-project),
[backup GET](https://supabase.com/docs/reference/api/v1-list-all-backups),
[restore versions](https://supabase.com/docs/reference/api/v1-list-available-restore-versions),
[restore POST](https://supabase.com/docs/reference/api/v1-restore-a-project),
[extended pause recovery](https://supabase.com/docs/guides/troubleshooting/restore-project-after-90-days-pause),
[backup-format limits](https://supabase.com/docs/guides/platform/migrating-within-supabase/dashboard-restore).
Sanitized local evidence: `/tmp/jazz-maintenance/supabase-manager-access-summary.json`,
`supabase-project-recovery-summary.json`, `supabase-org-restore-summary.json` and
`supabase-auth-config-summary.json` in the same private directory.
