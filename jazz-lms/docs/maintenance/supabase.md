# Supabase manager audit, recovery and rollback

## Latest Oct21 closure — 05:58:38 UTC

Exact replacement/production INACTIVE, synthetic preview ACTIVE_HEALTHY and old
observed settings equal are independently verified with seven GETs. The new
transport scope passes its first18-query READ ONLY check and ROLLBACK; after the
schema PATCH, second BEGIN and cleanup ROLLBACK have no successful receipt.
Frontend closure is confirmed. One guarded desired-setting rollback/pause passes;
publicGET0/newDDL/COMMIT/import0. Do not claim a confirmed second SQL rollback or
full API matrix. A verified diagnostic subtype gap is being repaired; original
runtime cause remains unknown. [Evidence and next scope](production-readiness.md#oct21-second-transaction-stops-independent-closure-verified).

Latest Oct 21 checkpoint at 05:30:48 confirms replacement/production INACTIVE, preview
healthy and old settings unchanged. Locked empty API schema COMMIT 28 SQL followed
by 18 READ ONLY passes; later 18 + 18 READ ONLY also passes with no new DDL/COMMIT. First
24 GETs stop on root 401 expectation; R3 corrects that observation but actual third
GET then reaches 5 s deadline/no HTTP/body. Both rollback/pause/independent closures
pass; no full current matrix, customer import, serving or production repair.
Actual local 1,621-row recovery/14,270-cell readback/rollback and 68PDF source
integrity/privacy now pass within explicit limits.
[Evidence and recovery gaps](production-readiness.md#oct21-native-customer-recovery-and-file-source-checks).

Current Oct21 replacement checkpoint: actual R8 empty-schema225→227 preparation
commits after strict schema/effective-rights/managed-preservation checks; its
client/child close and the project is paused. Independent03:31:59 readback
confirms original production INACTIVE, preview ACTIVE_HEALTHY and original
settings unchanged. Fresh18Python/8Node read-only verification now passes
persisted227/effective rights/empty guards/original managed baseline; both clients
rollback/close and parent/child0. Final04:08:57 pause and independent04:09:08
closure preserve old states/settings. Selected4relations/26constraints/25source
indexes/one enum match; four nonunique platform indexes are reviewed unchanged.
Offline account/model continuity passes within documented limits. No customer
import/cutover/serving occurs; mapped restore and actual Auth/Storage remain next.
[Full evidence and retained source packets](production-readiness.md#oct21-persisted-schema-and-managed-catalog-verified).

Observed 2026-10-13 after native CLI login on the remote machine. The owner
explicitly approved same-project resume, immediate private DB/Storage backup and
bounded re-pause rollback. Both operations have been executed once: production
reached ACTIVE_HEALTHY, exports succeeded, and unsafe recovered permissions
required re-pause. Its current state is **INACTIVE after the approved rollback**.
No production schema/grant/configuration repair, code release, key rotation,
plan change, real payment/refund or customer message was performed. The separate
Free synthetic preview remains independent; see [preview isolation](preview.md).
Credentials, customer archives and raw responses remain private outside Git.

The owner-controlled Google replacement passes actual first/returning isolated
login and final sign-out on Oct19; exact identities/USER role and all original
rows are preserved. Every preview Auth field is restored and app/tunnel closed.
Production remains INACTIVE and its Auth configuration unchanged. Two runtime
error counters remain unclassified; actual production-customer continuity and
cloud SMTP remain separate. See the [Google sign-in runbook](google-oauth.md).

## Approved recovery outcome

- Resume POST returned 200; exact project/org/region remained unchanged,
  platform 17.6.1.063 and actual PostgreSQL 17.6. API DNS recovered.
- The existing production credential works through a separately reviewed,
  documented session-pooler port 5432 connection. Actual libpq certificate and
  hostname verification succeeded against the published CA, with read-only SQL.
  The original transaction-mode 6543 packet was preserved and never used for dump.
- Full custom database archive, password-free role definitions, schema/TOC,
  metadata and integrity manifests were exported. Separate Storage preservation
  copied **68 objects / 6,423,774 bytes in one private bucket**; initial/final
  inventories match. No upload/delete/signing request was used.
- Read-only catalog inspection confirms browser grants on all 26 public tables.
  PaymentWebhookEvent, message and messagethread have RLS disabled. The payment
  ledger grants anonymous SELECT/INSERT/UPDATE/DELETE; an anonymous zero-row
  HEAD returns 200. Authenticated users can update User.role through the existing
  self-update policy without a role restriction. No exploit write was attempted.
- The approved same-project re-pause POST returned 200; subsequent manager GET
  confirms INACTIVE. No unsafe grants were restored or customer records changed
  by the maintenance operation. [Security findings](database.md).
- All 79 copied backup artifacts are independently hash-verified in an
  owner-only directory outside temporary storage:
  `/home/gabriel/backups/culturadeljazz-maintenance/2026-10-13-recovery-689f1b24`.
  Raw API-key responses and credential packets are excluded. The original local
  preservation is unchanged; an encrypted second-host copy is verified below.

The initial manager evidence below is retained as historical preflight. It no
longer means that production SQL/data preservation has never been attempted.
Offline archived-data restore is now verified with the limits below. An exact
reviewed hardening/release package remains separate from that recovery proof.
Production stays paused while it is prepared; the earlier approval did not
authorize hardening SQL or another resume.

## Offline archived-data recovery verification

A new network-disabled, unpublished, resource-bounded PostgreSQL 17 verifier
restored the archive with exit-on-error and a single transaction. It matched
all **65 archive COPY table counts / 2,239 records**, both sequence states,
table owners/RLS/kinds, role flags and 67 role/settings/membership statements.
The earlier metadata comparison matches public/LMS table, column, schema, type
and default ACL SQL. Six LMS user-reference
aggregates and completed-owned quiz-summary references contain no missing links.
All **68 Storage object IDs and file hashes / 6,423,774 bytes** match the archive;
no public bucket or Vault secret rows were present. Customer records were not
exposed through an app, Auth service, Storage API or published port.

This verifies exported archive data, not a live-source count comparison or
historical completeness. The retained extension ACL comparison belongs to attempt
`e7d45224`, separately from the later successful data restore `1f1df47a`, which
has no retained final schema dump. It contains 51 source-only revocations: 49
functions and two pg_stat_statements views, all from postgres. These are not
column ACL differences. Corresponding dump headers positively show all 51 member
owners changing from postgres to supabase_admin. Successful execution of the
source revocations does not establish matching effective permissions.

A new offline comparator preserves clause multiplicity and member-owner metadata;
all 16 closed tests pass. A separate synthetic PostgreSQL 17.11 reproduction
confirms that an owner can revoke its ordinary EXECUTE while retaining grant
options, consistent with [PostgreSQL's privilege rules](https://www.postgresql.org/docs/17/ddl-priv.html),
and that the same successful REVOKE under another member owner can
leave different ordinary permissions. Its two databases used a fresh container
with no network, published ports, host inputs or real archive; cleanup is verified.
The sampled function has no non-NULL initial ACL, so this does not test populated
pg_init_privs or reproduce the source PostgreSQL 17.6 platform. Source extension
owners and initial privileges remain uncaptured. Exact source extension privilege
equivalence remains unverified. The corrected restore below supersedes the earlier
member-owner mismatch without filling those missing source facts.

### Corrected member ownership and combined hardening

A new actual network-none PostgreSQL17.11 restore precreates pgcrypto1.3,
uuid-ossp1.1 and pg_stat_statements1.11 as postgres. Only inside the disposable
container, postgres temporarily receives SUPERUSER for that prerequisite; its
original flags are immediately restored. Archive accounting is explicit: four
preprovided entries and853 restored entries, with no ignored ACL clauses. The
same archive supplies the postgres database identity/owner; runtime database
settings are deliberately omitted. All51 member owners,557 serialized ACL
statements,67 role/settings/membership statements,65 exact table row-multiset
hashes/2,239 records and two sequences match. Original inputs remain unchanged.

A fresh combined verifier then performs revision4 apply, explicit manual inverse
and reapply on that corrected restore. The225-column/93-index locked guards pass;
all65 table COPY hashes/counts and both sequence states match at all four stages.
Each application passes422 zero-row permission operations. Inverse returns all557
ACL statements/member owners and public permissions to baseline; reapply reproduces
the first hardened state. All67 role statements and nonpublic extension metadata,
including same-run initial/effective privileges, remain unchanged. Cleanup removes
the owned container and tmpfs. Neither run connects to production or a provider.

This reproduces the archive's unsafe grants before the isolated hardening test.
The chosen local extension owner is not proof of source extension ownership, and
matching serialized revocations does not prove source effective denial: the actual
target postgres role retains ordinary and grant-option rights on those49 functions
and two views. Source pg_init_privs,17.6 platform behavior and complete hosted
recovery remain unverified. Revision4 binds the225-column archive. A later actual
isolated restore verifies unchanged revision4 → literal additive currency SQL →
distinct read-only revision5 postcheck at227 columns. Both new fields start NULL;
all65 original-column projections/2,239 records/two sequences remain unchanged.
Wrong ordering, partial-column collision, transaction fault, replay, old225
inverse and explicit new-column ACL drift fail closed. Each hardened227 check
passes446 actual zero-row operations. A separately approved offline manual227
inverse/reapply retains one owned synthetic payment row and canonical facts;
full-row CAS cleanup restores the original data. Independent comparison of the
existing inverse export matches557 ACL statements/member-owner metadata. All
five preserved input hashes and container cleanup pass. These checks preserve
the earlier source/platform limitations and authorize no production operation.
Normal code rollback retains columns/facts/safe permissions; `_prisma_migrations`
history reconciliation remains separate. See [migration order](payment-currency.md#verified-recovery-and-migration-order).

The owner-only local checkpoint is
`/home/gabriel/backups/culturadeljazz-maintenance/review-checkpoint-recovery-v4-20261015`:
89 selected source/SQL/test/normalized-evidence files,2,624,272 bytes, independently
rehashed with0600 files/0700 directories. It excludes archive/COPY bytes, whole
schema/role exports, credentials and enabled execution approvals. Its manifest
retains exact source bindings; this is local unencrypted review evidence, not an
off-site backup or a self-contained production recovery package.

Frozen revision4 candidate SHA256:
`8cfc5faddf45826b65593c51abc2aa75e79c7c785d64fd4661cdec0fd869436c`;
manual inverse:
`f5abfffc07a7d8f10af853a29a3c7d36a6a4a0ae9003e294afb0ee35cd34682d`.
Both live under the checkpoint's `v4/source/`; never use their isolated operator
attestations as target identity or production approval.

One existing NOT VALID realtime CHECK flag is preserved,
and its partitioned-parent predicate was not independently evaluated. Runtime
configuration, OAuth/SMTP/signing/encryption keys, Storage history and an atomic
DB/Storage snapshot were not reproduced. A narrowly documented initdb bootstrap
pre-satisfied one role CREATE while retaining original ALTER/GRANT semantics.

All five original temporary verifier containers are removed; existing local and cloud
fixture databases are untouched. Five private verification reports and their
integrity manifest were hash-copied into the durable local backup's
offline-verification directory. These historical restore reports do not establish
off-site custody or complete platform recovery.

## Encrypted second-host preservation — Oct20

The original production preservation now has an encrypted copy on both Monster
and Behemoth, outside `/tmp`. The scope is exactly the original79 artifacts plus
their original local manifest: **80 files / 7,757,784 plaintext bytes**. Later
review packages, preview credentials and personal keyrings are excluded. This
is a copy of the Oct13 preservation, not a fresh production snapshot.

Both machines hold the same7,827,280-byte `preservation.gpg` at:

`/home/gabriel/backups/culturadeljazz-maintenance/encrypted-preservation/20261020-production-archive-v1/`

Its SHA256 is
`c53f73927f96d0ab6f18d86338623a8c89627e14123240fe1a7860b0980993e9`.
The original manifest SHA256 remains
`a03bfb14997f9b98e4cce7369c34e66f08214b4eb20dad4714ea814fd1f51dac`.
Actual execution freshly hashes each source before, during and after streaming
tar directly into AES256 GnuPG encryption; it creates no plaintext tar archive.
All original source signatures, bytes and hashes remain unchanged. Only encrypted
bytes travel over the already verified strict-known-host SSH connection.

On Behemoth, actual decryption verifies all80 unique regular members and every
file hash, then drains the stream and requires GnuPG exit0 and complete integrity
success. Nothing is extracted to disk. A separate second run succeeds from the
five durable receiver files: `reverify.py`, `remote_worker.py`,
`verification-spec-private.json`, `verification-receipt.json` and `RECOVERY.md`.
The receiver can repeat verification without Monster, provider access or email:

```bash
/usr/bin/python3 /home/gabriel/backups/culturadeljazz-maintenance/encrypted-preservation/20261020-production-archive-v1/reverify.py
```

The dedicated RSA3072 recipient private key remains **only on Behemoth** under
`/home/gabriel/.config/culturadeljazz-maintenance/backup-key-20261020/gpg`.
Its fingerprint is `530B89495C232FA7A7363D4FA6553387439E169C`. Monster receives
only the public certificate, under the separate `backup-pub-20261020/gpg` home.
No private-key export or personal-keyring access occurs. Actual source/archive/
receiver metadata/key files are0600 under0700 private boundaries, and both
isolated GnuPG agents are confirmed closed after verification.

**Custody limits:** the Behemoth private key is online and has no passphrase.
Independent offline key escrow and physical off-site separation are unverified;
losing that key loses decryption of both encrypted copies. Preserve the key and
ciphertext together when planning recovery. This closes the second-host copy
gap, not off-site, periodic retention, atomic DB/Storage, platform/configuration
or complete account recovery. Original manifest flags remain historical and
are not rewritten. Actual extraction/restoration needs a separate private target
and the reviewed database recovery procedure; this copy authorizes no production
resume, SQL/configuration change or deployment.

Preparation passed13 source-bound real synthetic GPG/tar checks, including wrong
source hashes, symlinks, duplicate members, damaged ciphertext with a matching
transfer digest and owned cleanup. Actual production-archive encryption and
durable receiver verification are separate successful evidence. Private operator
code and finite receipts originate at
`/tmp/jazz-maintenance/encrypted-second-host-preservation-20261020/`; the durable
copy and receiver verifier above do not depend on that temporary directory.
Twelve selected operator-code/finite-proof files,55,571 bytes, are separately
rehashed and retained at
`/home/gabriel/backups/culturadeljazz-maintenance/review-checkpoint-encrypted-preservation-20261020/`,
manifest SHA256
`b4a99ce9a7d1ed3341027fa8fc67740335defba775c258a17cd45bb183574982`.
That selected package excludes ciphertext, keys, member specifications,
credentials and customer rows. Independent read-only source/receipt and document
reviews find no material issue.

## Verified project and account

| Item | Evidence |
| --- | --- |
| Customer project | Jazz-LMS-Project, `feavujcllgbzlvdvkkxx`; initial CLI inventory returned exactly this one project, before preview creation |
| Organization | Neurofactory Org, `iotxifqyrryoidgagdxi`, Free plan, one Owner member; profile GET confirms the authenticated caller matches that Owner |
| Status / creation | Initially INACTIVE; briefly restored, then INACTIVE after approved unsafe-state rollback; created 2026-02-17 13:01:22 UTC |
| Database | eu-west-1; PostgreSQL 17, platform version 17.6.1.063, ga channel |
| Database host | db.feavujcllgbzlvdvkkxx.supabase.co; matches Vercel production configuration |
| Restore-version GET | 200; available supabase-postgres-17.6.1.063, ga, engine 17 |
| Backup-list GET | 200; empty backups array and physical timestamps object, WAL-G true, PITR false |
| Backup entitlements | Scheduled backup, restore-to-new-project and backup-retention entitlements disabled; retention value zero |
| Account controls | Sole Owner member reports mfa_enabled false; organization-enforced MFA entitlement disabled; credential recovery unverified |
| Legacy project | wmujuzheurvrfyebobcj absent from this account's inventory; existence/other-account ownership unknown |

The initial inventory confirmed the deployed project existed and was inactive.
It did not prove when/why it stopped or customer-data completeness. The
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
| Storage | Config GET 200; file limit 50MiB. Approved export later verifies one private bucket and all 68 current objects. | Current-byte preservation is verified; full service settings/version history and actual client-policy behavior remain separate. |
| DB network | Stored restrictions applied but allow all IPv4/IPv6. | These rules cover DB/pooler, not Auth/Storage/Data API; application-level access and RLS still require inspection. |
| Unavailable settings | PostgREST config GET 404; SSL enforcement metadata GET 500. | Neither error establishes disabled Data API or absent TLS enforcement. |

Supabase [redirect guidance](https://supabase.com/docs/guides/auth/redirect-urls)
recommends exact production paths and scoped preview patterns. The maintained
source uses `/auth/reset-password/callback` for PKCE; stored apex rules do not
cover it. This is a configuration prerequisite for releasing that source, not
proof of a tested live recovery failure. Provider changes are still unapplied.

## Concrete production resume proposal — approved and executed

The owner approved this bounded mutation and its backup/re-pause scope:

```text
POST https://api.supabase.com/v1/projects/feavujcllgbzlvdvkkxx/restore
No request body; authorization loaded from the existing private CLI session.
```

This is the documented same-project restore action, not restoration of an older
selected database backup, a replacement project, a migration or a plan upgrade.
It restarted the production backend referenced by the existing live site.
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

The stored production OTP length is eight digits. The maintained source accepts
six to ten digits, so the configured length fits its validation. This does not
prove actual production OTP delivery or redemption while the backend is inactive.

Private preservation tooling is now prepared at
`/tmp/jazz-maintenance/production-preservation-preflight.md`; 20 offline/mocked
approval/identity/transport/argument/Storage-consistency checks pass. The false
approval template rejects execution before credentials, network or subprocess.
The initial false template remains preserved; a separate actual-approval
manifest authorized the successful exports described above. Two staging-limit
regressions bring the private tooling checks to 22. A failed offline schema
extraction required an explicit pg_restore output target; the corrected fresh
export completed, and the earlier incomplete run remains separately marked.
Phase flags record actual covered scope and do not each require a new question.

The inactive pooler-config GET initially returned an empty list. After recovery,
fresh metadata binds the exact project to its eu-west-1 pooler and advertises
transaction mode. A new explicit session-5432 candidate follows the official
connection-mode contract; actual password/TLS/read-only export then succeeded.
No silent change to the original transaction packet was made. Full logical DB
and separate current Storage exports exist, with explicit extension, Vault/key,
version/config and off-site preservation limits. No customer clone was loaded
into the preview or existing local journey databases.
