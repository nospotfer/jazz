# Resend account and receiving audit

Read-only account inspection completed at 2026-10-12 23:20 UTC. Only documented
GET endpoints and public DNS were queried. No messages were sent, webhook events
replayed, credentials rotated, or provider/DNS settings changed. The private
sanitized evidence is `/tmp/jazz-maintenance/resend-audit-summary.json`; it contains
no API keys, signing secrets, message bodies or recipient addresses.

## Confirmed account state

| Area | Evidence | Consequence |
| --- | --- | --- |
| Domain | One domain: `culturadeljazz.com`, verified, `eu-west-1`; sending enabled, receiving disabled. | Outbound domain verification exists; incoming custom-domain routing is disabled. |
| Sending DNS | Verified DKIM TXT at `resend._domainkey`, SPF TXT and feedback MX at `send`. | The `send` MX is outbound feedback routing; it does not receive mail for the apex domain. |
| Receiving DNS | Public apex MX lookup returned `ENODATA`; no receiving MX appeared in the domain API response. | No observed apex mail route to Resend. |
| Webhook | One disabled webhook at `https://culturadeljazz.com/api/webhooks/messages-email`, created 2026-03-26; subscribes to 11 event types, including `email.received`. | Professor reply ingestion is not active. The handler ignores the other subscribed event types. |
| Webhook history | Event list empty, `has_more=false`. | No native delivery/retry history available to validate. |
| Signing configuration | Webhook detail GET succeeds and provides signing-secret material; its value was not printed or retained. | The existing secret can be configured privately after approval; rotation is not needed merely to inspect it. |
| Received mail | Receiving list empty, `has_more=false`. | No actual receiving payload is available to verify sender authentication or message content handling. |
| Usage | Daily 0/100 and monthly 0/3,000 emails, both sent=0 and received=0; domains 1/3; API rate limit 10 requests/1,000 ms. | The observed usage windows have no mail traffic. These quotas do not establish the billing plan or amount due. |
| API access | Domains, webhooks, event history, usage, receiving list and API-key metadata GETs all returned 200; one API-key metadata entry exists. | Supplied API access works. Dashboard ownership, team membership, recovery methods, invoice access and production environment values remain unverified. |

These are account observations, rather than conclusions drawn from mock tests.
The APIs used are documented in [domain retrieval](https://resend.com/docs/api-reference/domains/get-domain),
[webhook retrieval](https://resend.com/docs/api-reference/webhooks/get-webhook),
[webhook events](https://resend.com/docs/api-reference/webhooks/list-events),
[received-mail listing](https://resend.com/docs/api-reference/emails/list-received-emails)
and [usage retrieval](https://resend.com/docs/api-reference/usage/retrieve-usage).

## Native authentication contract and remaining gate

The receiving API documents top-level `authentication`, with `spf`, `dkim` and
`dmarc` results computed by the receiving server. It does not require trusting
sender-supplied `Authentication-Results` headers. Results may be `pass`, `fail`,
`gray`, `processing_failed` or `unknown`; older messages can have `null`.
Documented DKIM `gray` includes unsigned or differently signed domains; DMARC
`gray` includes a domain using `p=none`. See
[the receiving response contract](https://resend.com/docs/api-reference/emails/retrieve-received-email).

The current handler at `src/app/api/webhooks/messages-email/route.ts` verifies
the raw-body signature, retrieves that message through the authenticated API,
matches the configured professor sender, and requires both DKIM and DMARC
`pass`. The installed SDK omits `authentication` from its response type but
passes the JSON through at runtime; the explicit field read matches the
documented contract. Application behavior is described in [messaging.md](messaging.md).

Public DNS shows `p=none` for both the project domain and Gmail. Consequently a
legitimate Gmail professor reply may produce DMARC `gray` and be ignored; this
is an inference from DNS and the provider definition, not a captured mail
result. Keep the handler's current requirement. Before considering `gray`,
obtain an isolated received payload and provider evidence proving trusted
DKIM/From alignment; a bare signature result or arbitrary email header is
insufficient. No live fixture was available in this account.

## Proposed activation sequence requiring approval

1. Confirm the project owner and the intended professor sending identity. Decide
   whether replies must retain the current Gmail identity. If it cannot satisfy
   the current authentication policy, a controlled professor mailbox on a
   project-owned sending subdomain is an alternative: verify aligned DKIM/SPF,
   then validate DMARC before adopting an enforcement policy. Do not change
   the project's root DMARC policy as a shortcut or claim ownership of Gmail's
   policy. Any identity or authentication-policy change needs explicit review.
2. Agree on a receiving address. A dedicated subdomain such as
   `inbound.culturadeljazz.com` and an address such as `replies@` separates this
   integration from future root-domain mail. Verify DNS ownership and any
   existing mail routing before approving domain creation or receiving enablement.
3. After that approval, enable receiving for the agreed domain and copy the
   exact provider-generated MX record, name and priority into DNS. Retrieve and
   verify the resulting record; do not guess a regional SMTP host or replace
   the current outbound `send` MX. Resend recommends a receiving subdomain when
   another mail service is in use. See
   [custom receiving domains](https://resend.com/docs/dashboard/receiving/custom-domains).
4. Configure an isolated preview with `RESEND_API_KEY`, its own receiving
   webhook's `RESEND_WEBHOOK_SECRET`, the agreed `PROFESSOR_EMAIL`, and
   `MESSAGES_REPLY_TO_EMAIL` pointing to that verified receiving address. The
   code already sets Reply-To for professor-bound notifications. Keep the
   legacy relay secret unset unless a separately reviewed trusted relay is used.
5. Prepare a webhook subscribed only to `email.received` for the intended
   endpoint. Match its secret to that endpoint's environment privately; native
   verification needs the exact raw body and Svix headers. Review production
   environment changes, the webhook enablement and the deployment together.
   See [receiving webhook setup](https://resend.com/docs/dashboard/receiving/create-receiving-webhook)
   and [signature verification](https://resend.com/docs/webhooks/verify-webhooks-requests).
6. With explicit permission for controlled test mail, verify a real reply from
   the approved sender to the isolated receiving address. Retain only sanitized
   authentication/field-presence evidence; do not publish mail bodies, headers,
   signed download URLs or credentials. Confirm DKIM/DMARC `pass`, thread marker
   preservation, one stored reply after duplicate delivery, and notification
   behavior. Exercise missing/gray/failed authentication and invalid signatures
   with local fixtures, where they must create no message. Do not email the
   professor or students as part of unattended verification.
7. Review the evidence and approve production activation. Keep the existing
   production webhook disabled until its environment, routing, sender policy
   and schema readiness are verified. For rollback, disable that webhook and
   restore only the DNS/environment records changed by this release; preserve
   existing mail data and account credentials.

The receiving/webhook gap is confirmed. Sender-policy compatibility, end-to-end
mail delivery, dashboard ownership and billing remain verification gaps. No
application authentication policy was changed during this audit.
