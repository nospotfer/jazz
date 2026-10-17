# Google sign-in ownership and verification

Updated 2026-10-17. The replacement Google configuration is prepared, but an
actual Google login has not completed. Production configuration is unchanged;
its Supabase project was confirmed INACTIVE on Oct17.

## Ownership and current state

| Resource | Verified state |
| --- | --- |
| Legacy Google project | Its number matches the stored production OAuth client prefix. The controlled personal account authenticates successfully but its exact project read returns 403. A legacy account is recorded in the credential inventory; its ownership is not verified, and the owner reports its 2FA unavailable. |
| Replacement Google project | `culturadeljazz-auth-bf40f8`, display name Cultura del Jazz Auth. Oct16 exact project/IAM/billing reads confirm ACTIVE, the controlled personal account has Owner, billing disabled and no linked billing account. |
| Replacement app and Web client | Owner reports creating the app, retaining Testing, adding the controlled test account and saving the three identity scopes. Supplied client JSON validates the replacement project and one isolated callback. Console audience/scope settings beyond that report have not been independently inspected. |
| Isolated Supabase | `tvmhuacxctdgmejziaxg`, Jazz-LMS-Maintenance-Preview. New client credentials remain staged. Oct17 reads confirm Google and signup disabled, with the original site URL/redirect list restored. |
| Test identity | One confirmed Auth user was created without a password, invitation or content grant. Oct17 verification finds no Google identity, session, sign-in timestamp or application User row. Existing five synthetic accounts remain unchanged. |
| Production Supabase | `feavujcllgbzlvdvkkxx`. No replacement client, redirect, account, schema or deployment change has been made. Its previously approved resume/preservation/re-pause authorization is consumed. |

The confirmed legacy dependency is Sign in with Google through Supabase. This
replacement does not recover the old mailbox, transfer the legacy Cloud project
or establish ownership of DNS, analytics or other unknown assets.

## Credentials and machines

The validated client JSON has an owner-only copy on **both Monster and
Behemoth** at:

```text
/home/gabriel/.config/culturadeljazz-maintenance/google-oauth/preview-client.json
```

Files are 0600 and their dedicated directory is 0700. The owner's original
download remains protected in Behemoth's `.secrets` directory. Copies were
verified byte-identical; provider credentials are excluded from retained review
evidence. Do not print their contents or put them in Git, shell startup,
NEXT_PUBLIC variables, browser assets or screenshots.

Monster runs the isolated application. Behemoth provides the normal browser for
the owner's Google login; this setup does not establish a second application
checkout there. A Web OAuth client identifies the app and is not a personal
Google Cloud CLI login or general project-management credential. Preserve shared
CLI identities and unrelated services. Existing credentials must be read
explicitly for a bounded project operation; no automatic loading or key rotation
is authorized.

## Starting a new isolated test window

The Oct16 origin, gate and access page have expired. Do not reuse their approval,
cookies, sessions or tunnel URL. The current Behemoth access page is a closed
notice, not a working test link. Time a new window to the owner's availability.

1. Pin a clean committed source and a fresh private run directory. Prepare a new
   protected HTTPS origin, gate and fixed expiry using the existing
   [native release and ingress safeguards](native-runtime.md). Keep payment,
   mail, cron and tracking credentials disabled. Preserve shared machine ports
   and services; the application uses private Unix sockets.
2. Read the exact isolated project's current Auth settings and database roles.
   Check the existing test identity by its protected ID/email mapping. Reuse that
   identity after verification; do not create another account or send an invite.
   Its application role must be USER, with no administrative or purchased-content
   grant. If the previous identity/state differs, investigate before writing.
3. Capture counts and SHA256 projections for existing public base tables and
   relevant Auth users/identities/sessions. Define the exact new actor exclusion
   before a callback can create its application row. The Oct16 plan compared 25
   public tables and three Auth tables, preserving all original rows.
4. Verify current disabled signup, nonce checking, no custom mail/hook dispatch,
   disabled identity-link notifications and the exact staged preview client.
   Retain the original configuration privately for the bounded rollback.
5. Build and seal the exact source without server credentials in the builder.
   Start the leased native preview and wait for its actual readiness receipt.
   Verify the Basic gate, authenticated pages/assets, valid HTTPS, no shared
   caching and indexing denial before enabling Google. Initial Oct16 probes ran
   before readiness and failed; subsequent readiness-bound Unix19/HTTPS11 passed.

For this server redirect flow the Web client's only authorized callback is:

```text
https://tvmhuacxctdgmejziaxg.supabase.co/auth/v1/callback
```

JavaScript origins are empty; the app uses Supabase's OAuth redirect rather than
Google's browser JavaScript client. Google Data Access needs only `openid`,
`userinfo.email` and `userinfo.profile`. Keep the app in Testing during this
preview. A test-user list is not a substitute for the protected preview gate or
disabled public signup. See [Supabase's Google setup](https://supabase.com/docs/guides/auth/social-login/auth-google)
and [Google's consent configuration](https://developers.google.com/workspace/guides/configure-oauth-consent).

## Bounded provider settings and actual login

The Oct16 window changed only these three temporary Auth fields after the
protected runtime checks passed:

- `external_google_enabled`: true for the fixed test window.
- `site_url`: the new protected preview origin.
- `uri_allow_list`: that origin's exact `/auth/callback` URL.

Signup stayed disabled and nonce checking stayed enabled. Client credentials
were staged separately while Google remained disabled. A bounded guardian
restored the three prior values on stop/expiry. New runs need a fresh target,
source/origin/gate and rollback plan; old temporary scripts or files are not
continuing execution authority. Keep the provider window within the runtime
lease and restore it if the test stops early. Detect concurrent configuration
changes instead of overwriting somebody else's settings.

Management API success alone does not prove the applied state: the immediate
Oct16 GET was stale and the later readback showed the changes. The API returned
a populated secret representation different from the supplied secret and its
plain SHA256. Do not treat it as a verified plaintext readback, overwrite the
source file with it, or copy the returned value to another client. The actual
Google-to-Supabase exchange remains the test of the supplied secret.

Before the owner's login, a no-follow authorize request can verify the Google
HTTPS host, new client, exact isolated callback, basic identity scopes, code
flow and state without retaining the raw state/redirect URL. This passed seven
checks on Oct16; it did not authenticate a user or verify a secret exchange.

The owner completes Google authentication in the normal Behemoth browser. A
fresh owner-only local access page may copy the temporary gate password and
open the preview without putting that password in chat, command arguments or
URLs. Do not capture Google passwords, MFA codes or callback URLs. Stop at the
dashboard, then verify through the isolated backend:

- The Google identity belongs to the predeclared Auth user ID, and a new session
  and sign-in timestamp exist.
- The application row uses that same ID/email mapping and role USER; no
  administrative role or entitlement was added.
- Every original public/Auth row remains unchanged, excluding only the exact
  declared test actor. A dashboard report alone does not prove these invariants.

Normal sign-out, provider restoration and owned runtime/tunnel closure follow
the bounded plan. Confirm the applied restored settings and complete sealed
release inspection after shutdown. Replace the expired access page with a closed
notice; preserve the provider credential files for the next authorized test.

## Production remains a separate release operation

Preview credentials authorize only the preview callback. A production proposal
must prepare a separate Web client, the exact production Supabase callback,
publishing/branding requirements, existing identity and purchase continuity,
private configuration backup and a concrete provider/configuration rollback.
Preserve Auth/User IDs and purchases; replacing an OAuth client does not justify
recreating customers. A successful test on the new preview account would not
alone prove continuity for existing customers.

Coordinate that proposal with the prepared database hardening, canonical Auth
redirect/reset paths, old-deployment/cron quarantine, stable zero-cost hosting
and the release checklist. Another production resume, provider configuration
change or deployment still requires explicit owner approval. No paid Google,
Supabase custom-domain or Vercel upgrade is part of this preparation.

## Retained evidence

Owner-only local package:

```text
/home/gabriel/backups/culturadeljazz-maintenance/review-checkpoint-google-oauth-preparation-f1df347-20261017
```

Its 24 selected files/33,251 bytes retain source-bound build/seal, Unix19/HTTPS11,
seven authorize-start conditions, initial startup failures, restoration/closure
and original-row preservation. Post-expiry inspection verifies 45,826 immutable
files. Credential files, gate HTML/password and raw Auth configuration are
excluded. This is local unencrypted evidence, not off-site recovery. Actual
Google login, secret exchange and existing-customer continuity remain unverified.
