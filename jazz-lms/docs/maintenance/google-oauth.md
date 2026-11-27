# Google sign-in ownership and verification

Updated 2026-10-19. Actual first and returning Google login now pass on the
isolated preview. Final normal sign-out removes the session; settings and
services are restored/closed. Production configuration is unchanged and its
Supabase project was confirmed INACTIVE on Oct19.

## Ownership and current state

| Resource | Verified state |
| --- | --- |
| Legacy Google project | Its number matches the stored production OAuth client prefix. The controlled personal account authenticates successfully but its exact project read returns 403. A legacy account is recorded in the credential inventory; its ownership is not verified, and the owner reports its 2FA unavailable. |
| Replacement Google project | `culturadeljazz-auth-bf40f8`, display name Cultura del Jazz Auth. Oct16 exact project/IAM/billing reads confirm ACTIVE, the controlled personal account has Owner, billing disabled and no linked billing account. |
| Replacement app and Web client | Owner reports creating the app, retaining Testing, adding the controlled test account and saving the three identity scopes. Supplied client JSON validates the replacement project and one isolated callback. Console audience/scope settings beyond that report have not been independently inspected. |
| Isolated Supabase | `tvmhuacxctdgmejziaxg`, Jazz-LMS-Maintenance-Preview. Actual Oct19 OAuth passes on exact source `fc8d813`. After closure every Auth field matches the pre-window snapshot, with Google/signup disabled, nonce checking enabled and the staged client preserved. |
| Test identity | The precreated confirmed Auth user is reused for both Google logins; the application profile and Google identity are unique and stable, role USER, no purchases. Final sessions are zero. All five original synthetic accounts and every original row remain unchanged. |
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

## Oct19 actual first login, returning login and sign-out

A fresh locked build from exact `fc8d813` seals45,827 immutable files;147
inspected client assets contain no supplied server/Google/management secrets.
Unix19, HTTPS11 and seven no-follow authorize-start checks pass before owner
access. Google is enabled only in the protected, leased preview; signup stays
disabled and no custom SMTP/hooks/identity notifications are enabled.

The owner completes Google login in normal Chrome on Behemoth. Independent
backend reads verify reuse of the predeclared Auth ID, matching application ID,
verified email, one Google identity, one session and USER role with no purchases.
After normal sign-out and a second Google login, application ID/creation and
Google identity fingerprints remain identical and the session fingerprint is
new. Final normal sign-out leaves zero actor sessions.

Before/after comparisons preserve25 public tables/1,510 original rows and three
Auth tables, excluding only the exact declared test actor. The guardian restores
all Auth fields to the private pre-window snapshot. App/tunnel exit cleanly,
the run directory/processes are absent, the entire45,827-file seal passes again,
and Behemoth's access file is replaced with a closed notice.

The runtime receipt records zero warnings and **two error counters without a
retained cause**. Owner reports and backend invariants prove the listed auth
outcomes; no personal-browser console/network capture or error-free dashboard
claim follows. Automatic reconciliation with payment credentials intentionally
absent is a source-backed candidate: its missing-key500 is independently
reproduced and repaired in33dd19f to explicit503 with closed-network regressions.
That separate fix is not a retrospective attribution. Production customer
continuity and actual SMTP remain unverified.

## Starting a new isolated test window

The Oct16 and Oct19 origins, gates and access pages are closed. Do not reuse
their cookies, sessions or tunnel URLs. Behemoth's access page is a closed notice.
Time another human-login window to the owner's availability; the completed Oct19
login checks do not need repeating merely because a temporary preview closed.

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
source file with it, or copy the returned value to another client. Oct19 actual
Google-to-Supabase exchanges validate the supplied secret operationally; they do
not establish plaintext equality with the Management API representation.

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
excluded. That earlier local unencrypted package predates actual Google login
and secret exchange; it does not establish existing-customer continuity.

The later actual-login package is owner-only at:

```text
/home/gabriel/backups/culturadeljazz-maintenance/review-checkpoint-google-login-fc8d813-20261019
```

Its22 selected files/39,349 bytes are rehashed and exclude credentials, raw Auth
configuration, actor references, gate HTML/password and personal-browser state.
It retains first/returning login, sign-out, preservation, restoration, complete
seal and the two unclassified error counters. This remains local unencrypted
retention; production continuity, cloud mail and off-site recovery are separate.
