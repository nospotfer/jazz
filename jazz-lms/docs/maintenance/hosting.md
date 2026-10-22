# Zero-cost production hosting proposal

Updated 2026-10-22. **Prepared proposal; no hosting or domain cutover has occurred.**
Use a dedicated Node 24 service on Monster behind a named Cloudflare Tunnel if
the account, DNS and file-delivery conditions below can be met without payment.
This reuses the native Next runtime instead of first changing deployment
adapters. Netlify Free is the alternative if continuous operation of Monster is
unacceptable or the Cloudflare conditions cannot be met.

The owner's continuing maintenance authorization covers the previously reviewed
bounded operations. This new production host/domain move still requires review
of the concrete configuration, acceptance evidence and rollback before execution.
No paid Vercel upgrade, card/recharge, credential rotation or unrelated
Neurofactory service change is proposed. A protected Quick Tunnel is review
infrastructure; extending a preview lease does not make it production hosting.

## Facts that determine the choice

The [current recovery checkpoint](production-readiness.md) records restored
customer tables and all 68 private PDFs in the paused replacement backend, plus
the successful R14 recovered-admin login/admin/logout journey. Customer/student
media continuity and recovery-point currency remain release prerequisites. The
accepted table import, PDF uploads and Auth compatibility corrections must not
be repeated to prepare hosting. Original production remains paused with unsafe
browser permissions; the synthetic preview is not a production target.

The Oct22 read-only host check found Monster has 16 logical CPUs, 62.7 GiB RAM,
about 1,170 GiB free on the workspace filesystem and 43.3 days of uptime. Systemd
255 is present and the current user's linger setting is enabled. No TCP 80/443
listener was found. However, the system manager reports `starting` and the user
manager `degraded`; their causes and Jazz boot recovery were not inspected. These
are capacity observations, not proof of continuous availability, spare capacity
under load or unattended recovery. Do not repair shared services as part of this
proposal.

Public DNS still resolves the apex to `76.76.21.21`, `www` to
`cname.vercel-dns.com`, and authoritative nameservers to the four
`ns-cloud-d*.googledomains.com` servers. The [service inventory](service-inventory.md)
identifies Squarespace as registrar. No usable registrar/DNS, Cloudflare or
Netlify account control is established in the retained inventory. DNS answers
do not prove account ownership. A bounded Oct22 follow-up inspected provider
labels from the owner-only CSV and the selected local gcloud project's metadata,
without emitting credentials or attempting a login. Neither established domain
authority; the selected project was not linked to Jazz by the inspected metadata.
No unrelated projects were enumerated. A full zone export and DNSSEC state check
are still required.

The owner now identifies `gabriel.barra@gmail.com` as the likely domain/DNS
account. That account is not recorded in the inspected Monster or Behemoth
gcloud metadata. This does not disprove ownership; actual registrar/zone access
remains unestablished. No token, project switch or domain configuration change
follows from the email alone.

Start with Squarespace using the owner-indicated Google account. Its official
migration guide directs Google Domains owners to Squarespace and Continue with
Google using the original account. Its nameserver guide explicitly lists
`.googledomains.com` among normal Squarespace defaults. Therefore the public NS
answers do **not** establish a separately managed Cloud DNS project or a need
for another gcloud login. Whether this exact domain uses defaults/custom DNS
still requires its authenticated settings. A read-only login/domain-listing
check is requested; no nameserver/DNS change is authorized by that check.
[Migration/login guidance](https://support.squarespace.com/hc/en-us/articles/17131164996365-About-the-Google-Domains-migration-to-Squarespace),
[nameserver guidance](https://support.squarespace.com/hc/en-us/articles/4404183898125-Review-change-or-reset-your-domain-s-nameservers).

Only if authenticated settings identify a separate Cloud DNS project should a
project-scoped `gcloud dns managed-zones list` be used, with exact
`dnsName=culturadeljazz.com.` filtering and minimal private metadata. Readable
zone data is not write/registrar authority. No such API probe is inferred from
nameservers alone. Full zone preservation and DNSSEC review remain required.
[Scoped read command](https://docs.cloud.google.com/sdk/gcloud/reference/dns/managed-zones/list).

| Option | Concrete fit | Remaining condition and cost boundary |
| --- | --- | --- |
| Monster + Cloudflare Free named Tunnel | Native Node/Next/Prisma/RSA runtime; no inbound port forwarding or serverless adapter required | Existing-machine power, internet and operator; Cloudflare account and domain control; full DNS delegation; acceptable PDF delivery terms. No production service or named tunnel is provisioned. |
| Netlify Free | Managed Next hosting with an OpenNext adapter; external authoritative DNS can remain | Account control and an exact application preview. Current allowance is 300 monthly credits, shared across the team; exhaustion pauses its projects and Free cannot buy add-on credits. No account, deployment or adapter proof exists. |
| Current Vercel Hobby | Existing protected, paused outage destination | Commercial Hobby mismatch remains. No low-revenue exemption or paid upgrade is assumed; the unsafe June deployment is not a repaired rollback. |

Cloudflare's documented setup requires an account, a domain on Cloudflare and an
internet-connected server; restricted networks need outbound port 7844.
[Setup prerequisites](https://developers.cloudflare.com/tunnel/get-started/),
[Free plan](https://www.cloudflare.com/plans/free/).
Free does not support the partial CNAME setup that keeps another authoritative
DNS provider. The proposed free route therefore requires full zone delegation,
without transferring the domain registration.
[Partial setup availability](https://developers.cloudflare.com/dns/zone-setups/partial-setup/).

Keep video directly on Mux. Cloudflare's public-hostname Tunnel documentation
also restricts video and other large-file delivery under its service-specific
terms. Confirm that this application's private PDF proxy and expected traffic
are acceptable before selecting this route; do not infer an exemption from the
current archive's small total size or promise unlimited file bandwidth. If it
requires a paid service, reject this option under the zero-cost budget.
[Tunnel file-delivery restrictions](https://developers.cloudflare.com/cloudflare-one/faq/cloudflare-tunnels-faq/#large-file-and-streaming-traffic-through-tunnel).

Netlify explicitly describes Free as allowing commercial projects without a
credit card; its old announcement's quotas are superseded by current pricing.
Actual account onboarding has not been tested. Keep Jazz out of a shared
Neurofactory quota unless that impact is reviewed; do not enable recharge or
upgrade when the allowance is exhausted.
[Commercial/no-card statement](https://www.netlify.com/blog/introducing-netlify-free-plan/),
[current pricing](https://www.netlify.com/pricing/),
[shared credits and pausing](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/billing-faq-for-credit-based-plans/).

## Proposed Monster service, with explicit implementation gaps

Retain managed Supabase Auth/DB/Storage, Mux, Dodo and Resend. Prefer the already
recovered replacement as the candidate customer backend, subject to the recovery
and continuity decision above. Do not silently point production at the isolated
synthetic project or resume the original unsafe backend. Record one approved
backend, recovery point, source commit and public origin in the release plan.

The preview launcher remains preview-only. A separate
[production runtime](production-startup.md) now selects the literal recovered
backend, runs the worker/ingress or maintenance mode, and supervises a pinned
named tunnel without preview exceptions. Local synthetic process/HTTP and
Monster user-systemd tests verify startup, worker-loss restart, shutdown and
maintenance503. These do not establish real credentials, domain control,
customer continuity or production health. A clean actual0d45a33 production build and isolated actual Next startup now pass.
The later container-unit renderer needs its own final-source artifact binding;
account/backend prerequisites and concrete release approval remain required.
The longer payment-disabled preview remains isolated testing.

Use these proposed dedicated paths and unit names; none is created by this plan:

| Item | Proposed location or contract |
| --- | --- |
| Immutable release and pointer | `/home/gabriel/.local/share/culturadeljazz-production/releases/<commit>/app` and sibling `current`; inspect hashes before each start |
| Private configuration | `/home/gabriel/.config/culturadeljazz-production/`, parent 0700, config/CA/tunnel credential files 0600; explicit inputs, no ambient `.env` |
| Application and ingress sockets | `/run/user/1000/culturadeljazz-production-state/current/{app.sock,edge.sock}`, run directory 0700, sockets 0600, umask 077 |
| User services | `jazz-production.service` for the owned app/ingress process group and `jazz-production-tunnel.service` for the named tunnel; restart limits, finite logs and owned cleanup |
| Reconciliation | A separate `jazz-payments-sweep.service`/timer at 03:15 UTC, only after the runner's production execution path and old-cron retirement are reviewed |

Select the proposed container application/maintenance units on Monster: actual
user-systemd namespace probes show its host isolation directives are ineffective.
The app container has restricted mounts/no published ports; the named-tunnel
launcher remains a separate host-user process. See the
[container selection and actual lifecycle proof](production-startup.md#monster-container-service-selection).
Pin Node 24 and the reviewed cloudflared binary per service. Leave the shared
Node default, Docker services, SSH, firewall and reverse proxies unchanged.
Propose initial app limits of 2 GiB memory, two CPUs and 256 tasks, then accept or
adjust them from an isolated soak before production. Verify only the new units'
autostart/restart and absence of public app ports; existing uptime and linger do
not establish those properties. A named tunnel can route both hostnames to the
private ingress socket, with an unmatched-host 404.
[Tunnel configuration](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/local-management/configuration-file/).

Preserve the existing ingress's validated client-IP/forwarding-header
normalization, exact host/HTTPS checks, raw signed webhook body, secure cookies
and private `no-store` PDF responses with the reviewed framing exception. The
temporary Quick Tunnel Worker exception must stay preview-only. Keep Mux media
off the application proxy and package the durable published CA with strict
Prisma URL/hostname checks. Existing isolated engine TLS tests establish engine
behavior; they do not establish future production credentials or service health.

The app/ingress supervisor must offer the reviewed standalone
[maintenance fallback](maintenance-fallback.md) on GET/HEAD when the worker is
unavailable. API/webhook POSTs must fail with 503 without fake success or a new
queue. Host or tunnel loss still makes that local fallback unreachable; a safe
DNS rollback below is an outage response, not a second healthy application.

## Cutover order and stop conditions

This is the execution order for the later reviewed release, not an activation
command list. Local preparation can proceed now. Production configuration,
backend activation, DNS delegation and deployment require approval of their
exact package before the first such change; step 6 is the final web-cutover
decision, not permission to perform earlier production changes unreviewed.

1. **Choose the backend and operational owner.** Resolve recovery-point currency
   and a bounded recovered-student/media continuity check without repeating
   import or uploads. Record whether the service can be kept powered and online,
   who responds to outages, and the accepted zero-cost interruption risk. Prepare
   a fresh private backup and configuration/zone rollback bundle; existing local
   retention does not establish encrypted off-site recovery.
2. **Implement and rehearse the dedicated production path locally.** Review the
   target pin, clean environment, supervisor, Unix permissions, failure fallback,
   logs, resource limits and restart behavior using isolated data. Never learn
   this by starting an unreviewed launcher against customer data. Produce a clean
   exact-source release with canonical `https://www.culturadeljazz.com` origins,
   the selected backend's public configuration and server credentials supplied
   only at runtime. A backend change requires a fresh public-bound build.
3. **Prepare domain control without moving web traffic yet.** Obtain legitimate
   registrar/DNS and Cloudflare access, export every record privately, and compare
   mail, TXT, CAA and unrelated subdomains. Review DNSSEC before changing
   nameservers. Replicate the zone on Free and initially retain the old Vercel web
   records; delegate only after review. Wait for the zone, certificates and
   authoritative answers to settle before changing the web destinations. Leave
   unrelated records unchanged and DNS-only where appropriate.
   [Full-zone/DNSSEC procedure](https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/).
4. **Prepare exact public identity and integrations.** Review Supabase Site URL
   and `/auth/callback` plus `/auth/reset-password/callback` and its allowed reset
   destination. A replacement-project switch also needs the exact Google OAuth
   provider callback and verified SMTP configuration. Old project cookies do not
   become sessions on the replacement: expect normal customer sign-in, never
   fabricate sessions. Verify LIVE product/key/webhook ownership separately;
   never promote the TEST key or infer LIVE readiness from a TEST purchase. The
   production implementation now supports server-only CHECKOUT_DISABLED=true
   to keep new checkout/voucher grants disabled until that review is complete; existing paid customer access must not depend
   on accepting a new payment.
5. **Retire old trusted execution.** Preserve and reverify Vercel's already
   applied All Deployments Authentication and paused active production. Disable
   the exact project's old cron before enabling a replacement schedule. Check
   generated/custom/historical URLs and bypass/team/share access. Gabriel-scoped
   history remains unreconciled; changing DNS neither revokes its credentials nor
   proves isolation. No automatic deletion, credential rotation or paid plan is
   part of this plan.
   [All Deployments protection](https://vercel.com/docs/deployment-protection).
6. **Review the complete release, then approve this specific cutover.** Bind the
   exact source/artifact, backend, account/zone, new units, rollback bundle and
   bounded acceptance actions in the [release checklist](release-checklist.md).
   Continuing authorization for earlier maintenance is not evidence that this
   newly proposed host/DNS move has already been reviewed. Missing access is
   requested only after these concrete prerequisites are ready.
7. **Switch the two web routes, then verify.** Point apex and `www` to the owned
   named tunnel's `<UUID>.cfargotunnel.com` target. Keep canonical GET navigation
   on `www`, but route the exact supported apex webhook POST paths directly
   instead of redirecting them. Verify HTTPS/certificate, host/IP normalization,
   cookies/callbacks, authorization, native PDF, real Mux playback, SEO and the
   failure fallback from outside the host. On a failed essential check, execute
   the bounded rollback; do not keep accepting purchases during diagnosis.
   [Named-tunnel DNS target](https://developers.cloudflare.com/cloudflare-one/faq/cloudflare-tunnels-faq/#what-records-are-created-for-routing-to-a-named-tunnels-hostname).
8. **Enable only the reviewed local schedule and operations.** The source cron
   is 03:15 UTC daily; the current native runner CLI is preparation-only, so no
   executable timer is ready yet. Keep one executor, singleflight/deadline bounds
   and finite logs; verify an approved first run before unattended activation.
   Check alerts, backups and Jazz-only service recovery without restarting other
   workloads. No synthetic traffic is scheduled to prevent backend pausing.

## Rollback with customer data preserved

| Failure point | Bounded response |
| --- | --- |
| Before web DNS cutover | Stop only the new Jazz units/tunnel and reverse only their reviewed configuration changes. Keep the existing Vercel protected 503 destination. |
| New app fails while Monster is available | Stop purchase initiation and the new timer; select a previously reviewed secure, schema-compatible release or serve the standalone maintenance 503. Preserve webhook ledger, new sessions, purchases and learning data; no database rewind or unsafe permission inverse. |
| Monster, connectivity or named tunnel fails | Restore the recorded apex A and `www` CNAME, after rechecking the Vercel destination remains protected/paused. This restores a safe 503, not the repaired application. A healthy independent fallback host has not been provisioned. |
| Zone/DNSSEC mistake | Use the private record/NS/DS rollback bundle and registrar procedure. Prefer a web-record rollback within a verified zone over simultaneous DNS delegation changes; propagation and cached answers prevent an instant-recovery promise. |
| Integration failure | Keep affected writes disabled and webhook failures retryable; never acknowledge an unprocessed event. Restore only reviewed settings. Do not replay checkout/refund actions or discard newer customer/provider facts. |

The old June Vercel deployment is not a secure release rollback. Do not unpause
it just to obtain a green page. Keep the existing maintenance fallback's
no-credentials/no-backend serving contract and finite evidence.

## Alternative if Monster cannot be operated continuously

Netlify's current Next integration uses an OpenNext adapter, so native-preview
proof does not establish Netlify compatibility. Before selecting it, build the
exact Next 16/Node 24/Prisma 5.17 source on Free and verify native-engine/CA
packaging, RSA/Mux signing, streaming private PDFs, cookie-backed authorization,
cache isolation and raw webhook bodies. Test both apex/webhook behavior and the
scheduled reconciliation replacement; do not assume Netlify's automatic
canonical redirects preserve signed POSTs.
[Next integration](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/),
[Node 24 support](https://www.netlify.com/changelog/2026-07-07-nodejs-24-default-new-sites/).

External DNS can remain: use the actual selected site's Netlify CNAME and the
documented apex record shown for that site. This avoids the Cloudflare full-zone
delegation but still requires domain control, an account and reviewed cutover.
The same customer-backend, callback, quarantine and data-preserving rollback
requirements apply. Do not deploy into an unrelated shared team or promise
continuous service when its Free credit pool is exhausted.
[External DNS procedure](https://docs.netlify.com/manage/domains/configure-domains/configure-external-dns/).

## Unavoidable owner input and sustainable operation

The remaining owner input is specific: establish or delegate control of the
domain's registrar/DNS and a selected free hosting account only if the scoped
existing-access checks cannot establish it; accept full DNS delegation if
Cloudflare is selected; choose the production backend/recovery point and the
person responsible for machine availability and outage response; then review the
completed host/cutover package. Existing credential files need not be resent.
Account MFA or domain recovery must be completed by the owner if existing
authorized sessions cannot provide that access. No account is created here.

Neither frontend option prevents Supabase Free low-activity pausing after a
seven-day period. Maintain an honest owner resume/recovery procedure and backups;
do not create artificial keepalive traffic or a paid upgrade. Existing domain,
power, media and transaction costs remain. No always-on guarantee, recovery SLA
or off-site backup is established by this proposal.
[Current Free pause policy](https://supabase.com/docs/guides/platform/free-project-pausing).

This proposal supersedes the operational recommendation in the historical private
`/tmp/jazz-maintenance/zero-cost-hosting-review/` revision 2. That packet and its
original policy observations remain unchanged. Current recovery, payment and
source outcomes stay in their own dated evidence; none is extended into a new
production claim by this document.
