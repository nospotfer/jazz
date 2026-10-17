import { isIP } from 'node:net';

export const WEBHOOK_PATHS = new Set(['/api/webhooks/dodo-jazzlms', '/api/webhooks/messages-email']);
const METHODS = new Set(['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']);
const HOP_HEADERS = new Set(['connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailer', 'transfer-encoding', 'upgrade']);
const PROTECTED_HEADERS = new Set(['host', 'authorization', 'cookie', 'origin', 'content-type', 'content-length', 'content-encoding', 'forwarded', 'x-real-ip', 'x-inbox-secret']);

/** @typedef {{canonicalHost:string, apexHost?:string}} IngressPolicy */
/** @typedef {{action:'deny'|'redirect'|'proxy',status:number,location?:string,headers?:import('node:http').OutgoingHttpHeaders}} IngressDecision */

/** Canonical addresses keep equivalent IPv6 spellings in one limiter bucket.
 * An edge header is trusted only behind the separately reviewed private Tunnel.
 * @param {unknown} value
 * @returns {string|null}
 */
export function normalizeClientIp(value) {
  if (typeof value !== 'string' || value !== value.trim() || /[\[\]%,\s]/.test(value)) return null;
  const family = isIP(value);
  if (family === 4) return value;
  if (family !== 6) return null;
  const normalized = new URL(`http://[${value}]/`).hostname.slice(1, -1);
  const mapped = normalized.match(/^::ffff:([a-f0-9]{1,4}):([a-f0-9]{1,4})$/);
  if (!mapped) return normalized;
  const high = parseInt(mapped[1], 16), low = parseInt(mapped[2], 16);
  return `${high >>> 8}.${high & 255}.${low >>> 8}.${low & 255}`;
}

/** @param {unknown} value */
function normalizeHost(value) {
  if (typeof value !== 'string' || !/^[a-z0-9.-]+(?::443)?$/i.test(value)) return null;
  return value.toLowerCase().replace(/:443$/, '');
}

/** @param {string} name */
function isProtectedHeader(name) {
  return PROTECTED_HEADERS.has(name) || /^(?:x-forwarded-|cf-|webhook-|svix-)/.test(name);
}

/** @param {import('node:http').IncomingHttpHeaders} headers */
function connectionNames(headers) {
  const value = headers.connection;
  if (typeof value !== 'string') return [];
  return value.split(',').map(name => name.trim().toLowerCase()).filter(Boolean);
}

/** Used for both directions; Set-Cookie arrays and end-to-end values survive.
 * @param {import('node:http').IncomingHttpHeaders} headers
 * @returns {import('node:http').OutgoingHttpHeaders}
 */
export function stripHopHeaders(headers) {
  const blocked = new Set([...HOP_HEADERS, ...connectionNames(headers)]);
  return Object.fromEntries(Object.entries(headers).filter(([name, value]) => value !== undefined && !blocked.has(name.toLowerCase())));
}

/** Fail closed before URL normalization; preserve the exact upstream target.
 * @param {string} target
 * @returns {string|null} decoded path for access checks only
 */
function decodedSafePath(target) {
  if (!target.startsWith('/') || target.startsWith('//') || /[\\\x00-\x20\x7f#]/.test(target)) return null;
  const path = target.split('?')[0];
  if (/%(?:2f|5c|00|0a|0d)/i.test(path)) return null;
  try {
    const decoded = decodeURIComponent(path);
    if (/[\\\x00-\x1f\x7f]/.test(decoded) || decoded.split('/').some(part => part === '.' || part === '..')) return null;
    // Double-encoded structural escapes must not become a different route after
    // a second decoder. Unicode/ordinary escaped filenames remain supported.
    if (/%[a-f0-9]{2}/i.test(decoded)) return null;
    return decoded;
  } catch { return null; }
}

/** This policy is not proof of Cloudflare/account/private-socket control.
 * @param {{method:string,target:string,headers:import('node:http').IncomingHttpHeaders}} input
 * @param {IngressPolicy} policy
 * @returns {IngressDecision}
 */
export function evaluateIngressRequest({ method, target, headers }, policy) {
  const deny = (status = 400) => ({ action: 'deny', status });
  if (!/^[a-z0-9]+(?:[.-][a-z0-9]+)+$/.test(policy.canonicalHost) ||
      (policy.apexHost && !/^[a-z0-9]+(?:[.-][a-z0-9]+)+$/.test(policy.apexHost)) || policy.apexHost === policy.canonicalHost) {
    throw new Error('Invalid native ingress host configuration');
  }
  const host = normalizeHost(headers.host);
  if (host !== policy.canonicalHost && (!policy.apexHost || host !== policy.apexHost)) return deny(421);
  if (headers['x-forwarded-proto'] !== 'https') return deny();
  if (headers['x-forwarded-host'] !== undefined && normalizeHost(headers['x-forwarded-host']) !== host) return deny();
  const clientIp = normalizeClientIp(headers['cf-connecting-ip']);
  if (!clientIp) return deny();
  const path = decodedSafePath(target);
  if (!path) return deny();
  const rawPath = target.split('?')[0];
  const providerPost = method === 'POST' && WEBHOOK_PATHS.has(rawPath);
  // Browsing uses ordinary direct-edge traffic. A provider can itself run on a
  // Worker; exact webhook POSTs still rely on native signature/secret guards,
  // never this transport IP, for authorization. Pin Pseudo IPv4 off at release.
  if ((headers['cf-worker'] !== undefined && !providerPost) ||
      headers['cf-connecting-ipv6'] !== undefined || headers['cf-pseudo-ipv4'] !== undefined) return deny(403);
  if (connectionNames(headers).some(isProtectedHeader)) return deny();
  if (!METHODS.has(method)) return deny(405);
  if (path === '/api/cron' || path.startsWith('/api/cron/')) return deny(403);
  if (host === policy.apexHost) {
    if (method === 'GET' || method === 'HEAD') return {
      action: 'redirect', status: 308, location: `https://${policy.canonicalHost}${target}`,
    };
    if (!providerPost) return deny(405);
  }
  const forwarded = stripHopHeaders(headers);
  for (const name of Object.keys(forwarded)) {
    if (name === 'forwarded' || name === 'x-real-ip' || name.startsWith('x-forwarded-') || name.startsWith('cf-')) delete forwarded[name];
  }
  Object.assign(forwarded, {
    host, 'x-forwarded-host': host, 'x-forwarded-proto': 'https',
    'x-forwarded-for': clientIp, 'x-real-ip': clientIp,
  });
  return { action: 'proxy', status: 200, headers: forwarded };
}
