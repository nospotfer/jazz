# Isolated cloud Auth email verification

Updated 2026-10-20 (Madrid; event times below are UTC). Status: **CLOSED; CONFIRMATION AND PASSWORD LOGIN PASS;
RECOVERY INCOMPLETE**. A separately approved evening reset email is delivered,
but its link is opened outside the controlled browser and the owner copies an
expired-link error address. The password remains unchanged. Both windows restore
all settings and close owned resources; no further email is authorized.
The first actual registration attempt exposed a
provider-method defect. On repaired source, the owner receives and verifies the
code, the original password reaches the dashboard, and normal logout clears all
actor sessions. Recovery email is accepted, but no recovery exchange or password
change is observed before expiry. All Auth settings are restored, all original
rows preserved, and owned application/browser/transport resources closed.
Production is unchanged and its Supabase project remains INACTIVE.

## Initial approved scope and exhausted budget

The owner explicitly approved at most three email-send actions to one controlled
Gmail alias: registration verification, one verification resend and one password
reset. The address, credentials, OTPs, reset links and browser state stay private.
Every attempt counts, including failures; the authoritative ledger is carried
between source builds and transport changes.

**All three actions are consumed:** registration fails before email dispatch,
the confirmation resend is received and verified, and password reset is accepted.
The provider subsequently reports exactly two emails sent in both daily and
monthly usage. No further send or retry is authorized by this window.
There is no approval for another registration, automatic retries, another
recipient, inbound messaging, payments, production changes, DNS, billing or paid
resources. SMTP expires at **12:04:37 UTC on Oct19**, followed by the
application/browser deadline at **12:04:57 UTC**. The window is now closed;
rebuilding did not extend it or reset the budget.

## Evidence and limits

| Check | Actual result at this checkpoint |
| --- | --- |
| Original baseline | Six existing accounts and 1,511 public rows across 25 public tables, plus three Auth tables. The controlled alias was absent; browser table grants were zero. |
| Exact original application | Clean locked source `910f216`; 45,828 immutable build files, 158 inspected client files, zero matches for supplied server credentials or the SMTP key. Native runtime checks: 19 pass. |
| Public preview transport | Three allocated Cloudflare Quick Tunnel hostnames returned NXDOMAIN. Checks included two public resolvers and tunnels running on Monster and Behemoth. A pinned edge connection had valid TLS but returned HTTP530/Cloudflare1016. Public DNS and working public HTTPS are **not proven**. |
| Private application transport | Eleven checks pass against the real native application through owner-only 0600 Unix sockets over the existing SSH connection with strict host-key checking. The gate, compiled assets, cache behavior, indexing denial and host checks are exercised. No public application TCP listener or fabricated application/provider responses are used. |
| Controlled browser | A dedicated Behemoth GUI Chrome profile is controlled through a debugging pipe. No debug TCP flag or inspection of personal profiles. Provider Auth HTTPS stays separate from the private SSH application transport. |
| Helper tests | 76 pure browser-policy/transport/resume assertions and 34 fake guardian checks. These validate boundaries and rollback behavior; they do not prove SMTP delivery. |
| Initial configuration activation | The first two guards detected the provider-computed `mailer_templates_custom_contents` boolean and restored the configuration. The exact computed readback was subsequently allowed without adding a PATCH field. |
| Original-source registration | Application HTTP400; a finite read-only provider log query confirms `/otp` HTTP422 with `signup_disabled`. One unconfirmed Auth account and one pending application USER were created. At that failed-attempt checkpoint Resend usage is zero; the later confirmation delivery is recorded separately below. |
| Preservation after the failed registration | Every original row across the 25 public and three Auth tables remains unchanged, including all six original accounts. Only the exact newly declared actor is excluded from comparison. No role, entitlement or purchase grant is inferred. |
| Closure of original-source runtime | All Auth settings restored, native process stopped cleanly and the complete 45,828-file seal passed again. The runtime receipt records zero warning counters and one error counter; it is not an error-free runtime claim. |
| Repaired runtime | Exact `30d848a` passes a clean locked build, 45,830-file seal, 158 client-file credential exclusions, native19 and private-SSH11. The full seal passes again after closure. |
| Actual confirmation and password | Confirmation resend200 and verification200; owner confirms inbox receipt. Auth and application verification become true, USER role remains unchanged and the initial password fingerprint is identical. Actual password token200, cookie sync200 and dashboard200 pass. |
| Initial normal logout | Provider204; all test-actor sessions, including the server-created verification session, become zero. Original25 public/three Auth projections and public table set remain unchanged. |
| Recovery request | Actual provider200 after normal logout, with PKCE retained in the same dedicated browser context. The owner is asked to paste the emailed link into that browser's private helper. No link/OTP is requested in chat. |
| Recovery limit | The owner reports a new-password form, but the controlled context still shows the link helper/forgot-password page. The guarded update returns `RESET_FORM_REQUIRED`; no provider verification, callback, reset form or password update is observed in that controlled context. The window expires before clarification. The password fingerprint remains unchanged. |
| Final preservation | At12:05:38UTC, all original six accounts and every original row across25 public/three Auth tables match. The public table set is unchanged. The new actor remains a verified USER with one email identity and zero sessions. |
| Final configuration | At12:06:57UTC, every original Auth field matches the pre-window snapshot: signup/Google/custom SMTP disabled, nonce checking enabled. Production remains INACTIVE; production writes0. |
| Final resources | Native runtime stops cleanly at expiry with warn0/error0. Browser broker/process/socket and private Chrome lock are absent; the remote tunnel exits0 and its exact owned Unix socket is removed. All three build seals pass after closure:45,828/45,828/45,830 files. |

The provider diagnostic requested finite event fields rather than raw log
messages. See the primary [Management API logs reference](https://supabase.com/docs/reference/api/v1-get-project-logs)
and [log-query guidance](https://supabase.com/docs/guides/observability/advanced-log-filtering).
Provider counters and logs support the stated event; absence of other matching
events alone would not establish absence of all errors or delivery.

## Evening one-reset window and delivery

At21:45UTC the owner explicitly approves exactly one additional reset email for
the same existing test USER, with a fresh protected window capped at25 minutes.
The prior three-action budget remains exhausted. The new lease is21:46:00 to
22:11:00UTC; closure happens early. Across both approvals, four send actions are
used and exactly three emails are sent. No further send/retry is authorized.

Fresh reads verify the same confirmed USER, initial password fingerprint and
zero sessions, every original public/Auth row and the25-table public set.
The existing exact30d848a artifact passes its complete45,830-file inspection;
new native19/private-SSH11 checks pass. The same browser profile is reused only
after its closed receipt, absent lock/socket and owner-only permissions are
verified. A new gate and fixed deadline replace expired access.

The guardian owns only eight SMTP/origin fields. Templates and computed metadata
are unchanged; signup/Google remain disabled and nonce checking enabled.
The executed controller has20 pure scope/clipboard assertions; the guardian
has11 fake scope checks. A parent reservation and one-time permit are consumed
before the actual `/recover` request, which returns200 at approximately21:49UTC.
The [Resend usage endpoint](https://www.resend.com/changelog/account-usage-api)
reports daily3/100 and monthly3/3000 after the earlier2/2. A bounded
[sent-email metadata query](https://resend.com/docs/api-reference/emails/list-emails)
matches exactly one new email to the controlled alias at21:49:18UTC, with
`last_event: delivered`. No other recipient data or email body is retained/read.

The owner accidentally opens the link in the usual browser and subsequently
copies a callback with `error_code=otp_expired`, without an authorization code.
Read-only finite Auth metadata shows a recovery/S256 code issued at21:49:31UTC,
an empty stored recovery token and zero actor sessions. The code value itself is
never read. This establishes issuance outside the private browser, not a
successful PKCE exchange or password change. The controlled browser records
only forgot-page/assets/reset-request responses; it never observes provider
verification, callback, user authentication or a password update. A callback/
controller-resume extension passes27 pure checks but is **not executed** once
the copied address is known to contain the expired-link error.

SMTP restoration completes at21:57:43UTC. At21:58:47UTC, independent reads prove
every original Auth field restored, the initial password unchanged, USER role,
zero sessions, every original row/account and public table set unchanged, and
production INACTIVE with zero writes. Browser/native/SSH processes close cleanly;
owned sockets/run directory and the private Chrome lock are absent. The full
45,830-file seal passes again at21:59:52UTC. The executed controller hash is
`313354e6cd7327a1942b3dbaf1054147ecc461ad56b139672fde6dcff4791d0e`.
Its console/page/warning/block/command-failure counts are all zero over this
narrow request-only scope; dashboard and successful recovery are not covered.

The next prepared test will retrieve only its newly approved controlled test
email through the provider's read-only API and pass the validated recovery link
privately to the same browser that requested it. It must record this different
input source honestly rather than claim a human Gmail link exchange. It remains
separate, unapproved and unexecuted; it cannot reuse either exhausted budget.

The23-file/37,470-byte evening checkpoint is retained/rehashed owner-only at
`/home/gabriel/backups/culturadeljazz-maintenance/review-checkpoint-reset-delivery-30d848a-20261019-evening/`.
Manifest SHA256:
`fda3caccdf6f27822036d938a7502ba202a3cf67c9f2638a3cb85f7c10cf43f1`.
Selected evidence contains no supplied credential, raw email body, link, token,
authorization code or personal-browser state. Local retention is unencrypted and
does not establish off-site recovery. Raw working inputs remain outside that
package under `/tmp/jazz-maintenance/cloud-auth-recovery-20261019-evening/`.

## Repair and user-facing implications

GoTrue's [OTP handler](https://raw.githubusercontent.com/supabase/auth/master/internal/api/otp.go)
delegates email requests to [MagicLink](https://raw.githubusercontent.com/supabase/auth/master/internal/api/magic_link.go).
For an existing unconfirmed user, that handler enters Signup even when the OTP
request used `shouldCreateUser: false`. [Signup](https://raw.githubusercontent.com/supabase/auth/master/internal/api/signup.go)
rejects disabled public signup. This source explanation matches the actual
provider `signup_disabled` event; enabling public signup is unnecessary.

Commit `30d848ae12de7476847b2f2d1e88ddad8def43ec` changes
[registration](../../src/app/api/auth/register/route.ts) and
[verification resend](../../src/app/api/auth/send-code/route.ts) to
`supabase.auth.resend({ type: "signup", email })`. The primary
[resend handler](https://raw.githubusercontent.com/supabase/auth/master/internal/api/resend.go)
sends confirmation for an existing unconfirmed account without entering public
signup or replacing its password. Unknown or already-confirmed addresses receive
a neutral response. Pending password, profile and role protections are preserved.
The existing `verifyOtp` email type accepts confirmation tokens and resolves
them to signup verification in the primary
[verification handler](https://raw.githubusercontent.com/supabase/auth/master/internal/api/verify.go).

The [installed-SDK contract tests](../../tests/integration/auth-signup-resend-contract.test.ts)
use synthetic intercepted transport, asserting POST `/auth/v1/resend`, signup
type, normalized email, no password in the resend body, and no `/otp` or public
`/signup` request. All four cases fail before repair; afterward 85 focused
route, confidentiality and SDK tests pass. Scoped lint has zero errors/warnings;
type checking passes. These are local contract results, not hosted email proof.

Commit `0de3c28` also repairs login email precedence after verification, adds
localized resend cooldown and overlap protection, and restores a visible
verification heading in light mode. Its 52 focused tests and type check pass.
Those improvements are separate from the original-source live observation.

The repaired bounded provider window uses a **confirmation** template containing
`{{ .Token }}`, rather than a magic-link template. Public signup remains
disabled, nonce checking enabled, autoconfirm false and the staged Google
provider disabled. No rate-limit, plan or billing change is required or approved.

## Quota and continuation

The preview retains two emails per hour and a 60-second SMTP frequency limit.
Primary [mail dispatch code](https://raw.githubusercontent.com/supabase/auth/master/internal/api/mail.go)
applies the email-send limiter before transport when autoconfirm is false;
custom SMTP does not bypass it. The SignupDisabled rejection occurs before that
dispatch path. Combined with the actual `/otp`422 event and zero Resend usage,
the two then-remaining planned sends fit the unchanged hourly allowance; both
subsequently receive200 and usage records exactly two dispatches. This is a
source-supported inference, not a readback of the hosted limiter's internal
counter; separate request/IP limits can still apply.

During the exact `30d848a` window, the browser controller is restarted once to
wait for React form handlers before
filling server-rendered inputs. It preserves the same profile, fixed deadline,
authoritative ledger and the two actions consumed at that point; password login then produces
the actual provider/session/dashboard results above. This is a controller
timing correction, not another application repair or email-budget reset.

The controlled browser records13 console errors,0 warnings,0 page errors,
12 deliberately blocked requests outside the auth-only policy, and one guarded
command failure (`RESET_FORM_REQUIRED`). No raw console contents are captured;
the13 errors cannot all be attributed to the12 blocks. This test does not certify
an error-free dashboard or general provider/media behavior. The separate final
native runtime receipt records warn0/error0.

Still required before the full hosted email journey can pass:

1. Resolve which browser/form the owner saw. A continuation needs a fresh bounded
   source/origin/gate/transport plan and current role/configuration checks. The
   retained dedicated profile preserves PKCE state, but neither token validity
   nor a successful exchange is assumed. Closed access must not be reused.
2. Complete recovery, prove the old password fails and the replacement succeeds,
   sign out, and repeat preservation/restoration/closure. No additional email
   send is authorized; any new send needs separately bounded scope.
3. Demonstrate a fresh complete registration on repaired source under a separate
   approved mail budget. The current actor was created by the failed
   original-source registration; successful confirmation resend does not prove
   that entire new-registration journey.

Confirmation, original-password login, normal logout and final closure are
already independently established and do not need repeating merely to fill the
recovery gap. Production template/callback/customer-continuity review remains
separate; no production configuration or release follows from this test.

## Publication and retention

Application source30d848a is pushed. Exact Quality PR/push, Secret Scan PR/push
and CodeQL pass. Actual Quality logs show2,576 normal passes/80 intentional
skips,80 persisted passes/one skip (79 SQL plus one generated-client metadata
case), types/webpack/static31-of-31 and lint0errors/22 existing warnings. Both
exact PR-ref CodeQL language analyses have0 results/errors; open PR-ref alerts0,
with five legacy main alerts still open. The local pre-push integration gate
separately passes745 cases/29 skips. Overlapping counts are not additive.

The selected32-file/93,263-byte package
`review-checkpoint-auth-mail-30d848a-20261019` is retained under
`/home/gabriel/backups/culturadeljazz-maintenance/`. Destination hashes/modes and
supplied-secret exclusions pass. Manifest SHA256:
`9a68e157649b29e2baa96290aa538156500b6c1641345fa620ad68e8a565e991`.
Directories are0700 and files0600; local retention is unencrypted and establishes
no off-site recovery. Credentials, raw Auth/provider/actor files, private gates,
OTP/reset links, browser profiles and PKCE state are excluded.

Finite working evidence is under
`/tmp/jazz-maintenance/cloud-auth-mail-runtime-20261019/`, including the
`source910-registration-defect-closed/` summaries. Auth snapshots, provider inputs, gates,
actor mappings, browser profiles and credentials must remain outside published
or retained review evidence. Follow [native runtime safeguards](native-runtime.md)
and the [Google ownership record](google-oauth.md) for their separate boundaries.
