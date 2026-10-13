# Native runtime safeguards

Source repairs for a single Node 24 application process. These are not a hosting
activation, provider configuration change or production verification.

## Request counters

The three known buckets each retain at most 4,096 SHA256 identifier keys.
Counters stop growing on denial; inactive entries are pruned lazily every
30 seconds of bucket use, or when their expiry permits new capacity. A full
live bucket denies new identifiers with the earliest expiry instead of evicting
existing counters. Voucher traffic cannot consume email webhook capacity.

Forwarding headers still require a trusted ingress. Native direct exposure must
not accept caller-controlled X-Forwarded-For. A restart resets counters; multiple
processes do not share them. No Redis or paid service was added.

## Payment sweep

The route validates the configured bearer before database/provider work, holds a
process-local single-flight lock and applies a cooperative 50-second deadline.
Dodo list/detail reads combine that signal with their existing 12-second timeout.
Body-read cancellation is an error; a full final tenth page is explicitly
incomplete rather than a complete payment history.

Users are ordered by ID with a keyset continuation and a 500-user run limit.
Payment/activity cutoffs stay fixed during a pass. The next pass overlaps the
previous pass's start by 48 hours/seven days respectively, covering a multi-day
scan. Failed/interrupted users retain their earliest cutoff and remain eligible
after ordinary activity expires. Their next attempt follows the normal cursor
wrap; one failed user does not reset the scan to its beginning.

A fresh provider list rotates after the previously attempted payment ID so a
repeated slow prefix cannot starve later payments. Every grant still requires
fresh detail, matching ownership/course and reversal/discount accounting checks.
Existing purchase/reference idempotency handles replayed work; no financial or
user activity record is used as a scheduler marker.

Successful complete passes return 200. Partial/deadline/capacity failures return
503, request cancellation 499 and overlaps 409. Results contain aggregate counts,
`passComplete`, `hasMore` and a finite reason. `hasMore` refers to the normal user
cursor tail; unresolved pending users can remain after that tail is exhausted.
A native runner must inspect the body and bound any continuation loop; no timer
has been installed or enabled.

Prisma 5 cannot cancel an in-flight database call. The route awaits settlement
and keeps its lock, counts a completed grant, then stops new work. Thus 50 seconds
is a cooperative work budget, not a hard process termination guarantee. Existing
connection/pool/transaction limits and native transport verification remain
release requirements.

Continuation is bounded to 4,096 pending users. Capacity exhaustion fails closed
without dropping earlier retries. A bounded recovery phase rotates through
pending users while preserving the normal cursor; freed capacity lets that tail
resume on a later run. Deleted users, persistent provider pagination
caps or unusable current emails can remain explicitly unresolved and need
reviewed recovery. A persistently unresolved saturated set prevents new users
from being attempted; do not clear it blindly or advertise complete coverage.

Cursor, retry cutoffs and payment rotation are lost on process restart or
redeployment. A fresh 48-hour initialization does not recover older unresolved
payments. Historical recovery after an outage requires a separately reviewed
scope. Independent instances do not share this lock; disable old cron before
activating one native runner. No distributed exactly-once or complete historical
coverage is claimed.

## Remaining package verification

Exact trusted ingress/Host/HTTPS/IP normalization, raw webhook transport,
immutable release/configuration, a designated writable Next cache, durable CA
packaging, cold start/restart and a disabled daily runner still require the final
native package and isolated transport proof. Account/DNS/continuous-host control
and production cutover approval remain separate from these source safeguards.
