# Messaging and professor email replies

Messaging requests now validate the existing PostgreSQL schema without running
DDL. Application authentication happens before readiness checks. Legacy unquoted
identifiers remain lowercase; explicit quoted SQL aliases preserve the camelCase
JSON fields used by the UI. PostgreSQL `COUNT` values become JSON numbers.

## Native Resend contract

Subscribe the receiving webhook to `email.received` at
`/api/webhooks/messages-email`. Set `RESEND_WEBHOOK_SECRET` to that webhook's
signing secret. Native delivery requires `svix-id`, `svix-timestamp` and
`svix-signature`; the Resend SDK verifies the exact raw body. Signature failure,
partial headers and expired timestamps cannot fall back to relay authentication.
See [Resend signature verification](https://resend.com/docs/webhooks/verify-webhooks-requests).

Native events contain metadata. After successful verification, the route calls
`resend.emails.receiving.get(email_id, { html_format: "cid" })` with
`RESEND_API_KEY` to retrieve text or an HTML-only text fallback. It does not fetch
embedded resources or render email HTML. See
[Resend receiving content](https://resend.com/docs/dashboard/receiving/get-email-content).

### HTML-only reply conversion

Nonempty plain text takes precedence. HTML-only replies use the server-only
`html-to-text` parser with explicit selectors: scripts, styles, document metadata,
hidden elements and embedded content are skipped; anchor destinations and image
URLs are not added to the message. Conversion decodes character entities and
preserves useful paragraph and line breaks without fetching resources. The
library documents its [conversion options, selectors and limits](https://github.com/html-to-text/node-html-to-text/tree/master/packages/html-to-text).

HTML input and resulting message text are capped at 100,000 characters. Conversion
also bounds traversal depth to 256 and children per node to 20,000. Exceeding
these bounds returns HTTP 413 before storage or notification, rather than
silently saving a truncated reply. The signed webhook request retains its
separate existing 100,000-character limit. Unused HTML does not affect a valid
plain-text reply.

The result is plain text, not HTML suitable for interpolation. Decoded text may
contain literal `<script>` or `<img>` strings; React text children in the inbox
and notification panel encode these for display, and outgoing notifications use
Resend's `text` field. Any future HTML sink requires its own reviewed encoding
or sanitization. CodeQL alerts 14 and 15 identified incomplete one-pass
script/style removal in the old regex converter. The replacement removes that
source pattern; current text sinks did not establish an exploitable browser XSS
path. Regression tests exercise malformed tags, entities, conversion limits,
HTML-only webhook deliveries and the actual inbox's text rendering. The remote
CodeQL rerun remains the verification of those alerts.

Both signed metadata and the retrieved message must identify `PROFESSOR_EMAIL`.
The retrieved provider-computed `authentication.dkim` and `authentication.dmarc`
must each equal `pass`. Arbitrary email `Authentication-Results` headers are not
trusted. Missing or failing sender authentication creates no message. The API
reference documents these authentication fields; the installed SDK's TypeScript
interface currently omits them, so the route reads the returned JSON field
explicitly. Live availability remains a release verification gate. See
[the receiving response contract](https://resend.com/docs/api-reference/emails/retrieve-received-email).

The subject or text must retain `[Thread:<UUID>]` or a supported `Thread ID`
marker from the professor notification. Native replies use a deterministic
`Message.id` from the receiving `email_id`. The insert and thread timestamp update
share a transaction; retries cannot insert or notify twice for that receiving
email. Notification delivery still follows storage, so a process failure after
commit can omit the notification; the reply remains in the student's inbox.

Set `MESSAGES_REPLY_TO_EMAIL` to the verified Resend receiving address for
professor-bound notifications. It must be a project-owned receiving inbox with
the required DNS/routing. Student responses continue through the authenticated
application inbox; this webhook accepts professor replies only.

## Legacy trusted relay

The flattened relay body (`from`/`sender`, `subject`, and
`text`/`body`/`strippedText`) remains available only when
`INBOUND_EMAIL_WEBHOOK_SECRET` is explicitly configured and `x-inbox-secret`
matches. The relay must authenticate the original professor itself. Possession
of that secret is a privileged trusted integration; it is not a native Resend
signing secret. A request with any Svix signature header always uses the native
branch, regardless of a supplied relay secret. Native retry deduplication does
not apply to the legacy flattened format, which has no stable receiving ID.

## Explicit schema preparation

`prisma/setup-messaging.sql` creates missing lowercase tables, unread columns and
indexes idempotently without renaming or dropping existing data. It is separate
from runtime requests and from Prisma's current model schema. Missing tables,
columns or permissions return HTTP 503 with a generic unavailable message.

`prisma/harden-messaging-rls.sql` is a separate approval gate: it enables RLS and
revokes direct browser-role table privileges where those roles exist. Confirm
the Prisma connection role owns the tables or has `BYPASSRLS`, or prepare an
appropriate server-only policy first. Review existing grants and policies before
applying. Do not run either script against production without user approval.

For the disposable local test database only, apply the setup SQL explicitly, then:

```bash
MESSAGING_TEST_DATABASE_URL='postgresql://postgres@127.0.0.1:55432/jazz_maintenance' npm run test -- tests/integration/messages-postgres.test.ts
```

The suite checks that exact local host, port and database before writing uniquely
scoped fixtures. It never inherits the application's `DATABASE_URL`, sends actual
emails or calls a real receiving API.

## Release verification

- Confirm the live lowercase schema, unread columns, grants and RLS with read-only inspection.
- Review and approve any required setup/RLS SQL before production application.
- Confirm receiving address ownership, DNS and native webhook subscription.
- Configure `RESEND_WEBHOOK_SECRET`, API access and professor notification Reply-To in an isolated preview.
- Use approved provider test mail to verify the receiving API returns computed DKIM/DMARC fields.
- Verify duplicate deliveries produce one inbox reply and one notification.
- Keep the legacy relay disabled unless its ownership and sender authentication are verified.

Mocks and local PostgreSQL prove the application contract and storage behavior;
they do not prove live Resend routing, sender authentication or mail delivery.
