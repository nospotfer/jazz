# Zero-cost production hosting review

Prepared 2026-10-13. **Proposal only.** The owner selected zero new hosting spend.
The protected [native temporary HTTPS preview](preview.md#protected-native-preview-and-contrast)
now verifies exact application source `e32a370`, with fresh sealed build,
four-role/media/PDF/layout/contrast proof and retained initial observations.
Earlier source 27's 45-check report remains historical. Temporary app/tunnel and
private lifecycle probes closed cleanly. No stable hosting service, account,
DNS change or production release has been provisioned.

## Preferred conditional option

Run the reviewed Node 24 / Next production build on the existing Monster machine
behind a named Cloudflare Tunnel. Retain managed Supabase/Auth/Storage, Mux,
Dodo and Resend. This preserves the verified native runtime and avoids a
serverless adapter migration. Cloudflare offers a Free plan; published Tunnel
setup requires an account, a domain on Cloudflare and an internet-connected
server. [Free plan](https://www.cloudflare.com/plans/),
[named Tunnel availability](https://blog.cloudflare.com/tunnel-for-everyone/),
[setup prerequisites](https://developers.cloudflare.com/tunnel/get-started/).

This choice depends on continuous machine availability, legitimate account/DNS
control and an operational owner. None is inferred from the observed uptime.
Cloudflare and registrar sessions are not established here. The registrar is
Squarespace; authoritative nameservers remain Google Domains. Export the full
zone privately before preparing delegation, including mail/shared subdomains.
Free named custom-domain routing needs full DNS delegation; partial CNAME setup
is a Business/Enterprise feature. Registration need not transfer.
[Partial setup limits](https://developers.cloudflare.com/dns/zone-setups/partial-setup/).

Use dedicated Jazz services and private immutable releases/configuration; pin
Node 24 without changing the machine's shared default. Bind Next/proxy only to
owner-only Unix sockets and metrics to loopback; keep the future named-tunnel
token in a private file. The bounded daily runner is prepared with an execution-
disabled CLI; no timer is installed or enabled. Actual preview startup, cache,
restart, worker-exit cleanup and separate-UID denial pass. Production resource
limits, durable configuration, named-tunnel identity and recovery remain to
verify. No shared Docker/SSH/proxy changes are proposed.
[Native runtime and exact preview limits](native-runtime.md).

The trusted edge must replace caller-supplied forwarding headers with a validated
client IP; current rate limiting reads the first X-Forwarded-For entry. Preserve
webhook bytes, secure cookies and private PDF headers. Keep video directly on
Mux; avoid caching private/authenticated responses. Package a durable reviewed
Supabase CA path with strict Prisma URLs. Native engine chain/hostname checks
pass [nine isolated cases](local-verification.md#separate-native-prisma-tls-verification),
but the eventual production artifact/runtime remains unverified.

## Mandatory release and rollback boundaries

DNS changes do not retire old servers with immutable production credentials.
Prepare exact-project cron disable, paused active production and **All Deployments
Vercel Authentication**. Current policy permits that method/scope on all plans
without a paid add-on. Verify every generated/custom/historical URL and any
bypass/share/team access; the separate Gabriel-scoped history is unresolved.
Authentication does not revoke credentials or stop cron by itself. No quarantine
action has occurred. [Protection scope](https://vercel.com/docs/deployment-protection),
[pause scope](https://vercel.com/docs/rest-api/projects/pause-a-project).

Rebuild with canonical www origins, review exact Auth callbacks and durable TLS,
and obtain the production approval in the [release checklist](release-checklist.md)
before hardening, deployment or another customer-backend resume. Keep apex
provider webhooks routed directly; do not rely on POST redirects. The preferred
rollback is a previous reviewed secure release or a closed maintenance page;
the unsafe June deployment is not a repaired rollback.

Supabase Free can pause after low activity; changing frontend hosting does not
remove that limitation. No artificial keepalive or paid upgrade is proposed.
Verified local backups do not establish encrypted off-site retention. Existing
domain, power, media and transaction costs remain; no free-service SLA is claimed.
[Pause policy](https://supabase.com/docs/guides/platform/free-project-pausing).

If Monster cannot be operated continuously, Netlify's commercial-compatible
Free offer is a candidate fallback. It needs account access and an exact
Next/Prisma/CA preview; a hard usage quota can pause the site. No signup,
card/recharge or adapter migration has occurred.
[Free commercial use](https://www.netlify.com/blog/introducing-netlify-free-plan/).

## Private review package

Revision 2 is under `/tmp/jazz-maintenance/zero-cost-hosting-review/`: architecture
decision, cutover/quarantine/rollback runbook, safe summary and integrity manifest.
Original policy research is preserved separately; revised account/plan evidence
supersedes it. Access secrets, zone exports and customer data remain outside Git.
