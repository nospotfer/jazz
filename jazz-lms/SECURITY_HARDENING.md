# Security operations

This document describes controls and their limits. A source fix is not a
production fix until an approved deployment is verified.

## Repository checks

`npm ci` installs the Git hooks under `.githooks/`. The local staged/tracked-file
scanner detects common credential patterns and emits locations without secret
values. It is a useful guard, not exhaustive protection; ordinary passwords and
unrecognized provider credentials may evade patterns.

```bash
npm run security:staged
npm run security:secrets
```

The repository's `secret-scan.yml` workflow runs Gitleaks with redacted SARIF and
uploads the report even when findings fail the job. Documentation and example
environments are scanned; only specific placeholders/public test vectors are
excluded. Keep ignored credentials out of artifacts and screenshots as well as
Git. If reviewing Git history, keep reports private and redacted.

GitHub default CodeQL setup is enabled. There is **no** checked-in CodeQL workflow
or query configuration file. At the maintenance inspection, GitHub native secret
scanning was disabled, rulesets were empty, and `main` was unprotected. Therefore
CI checks do not currently enforce merge policy. Enabling protection/scanning is
a repository configuration change for owner review; do not claim it is active.

`quality.yml` runs supported Node installation, lint, types, tests and production
build. Its separate disposable PostgreSQL job exercises payment reversals,
concurrent quizzes, notes and messaging instead of silently skipping those tests.
Check the actual CI run on the review commit before release.

## Application controls

Server identity uses Supabase `auth.getUser()`; cookie-backed session data alone
cannot authorize access. Privileged actions and API routes check permissions
independently of their page layout. Media, documents, progress, quizzes and notes
check publication hierarchy and course/historical-lesson entitlement. Verify
Supabase browser-role RLS and storage policies separately: server checks do not
protect tables exposed directly through PostgREST.

Payment callbacks verify Standard Webhooks signatures and timestamps. Grants and
reversals serialize by payment reference and consult the persisted event ledger.
Refunded/disputed payments cannot be restored by a successful-payment listing;
full payment detail is fetched before consuming applied coupons. Free voucher
limits are enforced atomically. Actual provider configuration remains a separate
release gate.

`CRON_SECRET` is required for the scheduled payment sweep. A client-supplied
`x-vercel-cron` header is not authentication. Native Resend inbound signatures
use their own `RESEND_WEBHOOK_SECRET`; professor sender authentication is also
required. Legacy relays need a separate secret and trusted sender validation.

Credential forms use POST even before hydration. Public contact requests are
bounded, typed and escaped in generated email. Optional analytics must require
an explicit homepage preference and exclude account/student/admin/payment
routes; avoid recording inputs, request bodies or URL parameters.

## Headers and browser roles

`next.config.mjs` defines CSP, HSTS, referrer/content-type/frame/permissions and
cross-origin policies. HTTPS custom provider origins are parsed as exact origins;
HTTP auth/ingest endpoints are permitted only in development. Existing CSP still
allows inline styles/scripts and eval for compatibility; a future nonce-based
policy needs its own browser validation, not a blanket tightening.

Review the committed schema scripts against the active database role before
production use. Messaging schema setup and its RLS hardening are separate SQL
operations; the application does not create tables during requests. Production
migrations need schema evidence, a restorable backup and explicit approval.

## Triage and release

Record reproduced security findings and evidence in the
[maintenance backlog](docs/maintenance/backlog.md). Prioritize exposed
critical/high issues. For a false positive, retain the exact code/configuration
reason and a relevant regression; do not silently dismiss alerts.

Dependency upgrades must preserve working behavior. On 2026-10-13, `npm audit`
reports five high findings through Next's development ESLint → fast-glob →
micromatch → braces chain; `npm audit --omit=dev` reports zero findings.
[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
affects braces through 3.0.3 and lists no patched version; the registry's latest
is also 3.0.3. It requires a deeply nested attacker-controlled brace pattern.
The inspected Next lint utility receives repository root-directory settings;
this project does not configure custom root globs or expose that utility in an
HTTP handler. This narrows current reachability, not the package advisory itself.
Keep lint configuration trusted and CI jobs bounded, monitor the upstream fix,
and review an update when available. npm's suggested framework downgrade to
14.2.35 is not a justified repair of this Node 24/Next 16 application.

Credentials previously committed remain exposed in history after removal from
the current tree. The owner has deferred rotation; record affected credentials
privately and coordinate rotation/provider environment updates with them.
Deleting source files does not revoke a key. Do not rewrite shared history,
rotate account secrets or change production settings during unattended work.
