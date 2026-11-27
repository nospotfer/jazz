import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { readControlledFile } from './release-inspect.mjs';
import { NativeConfigurationError } from './config-policy.mjs';

const requireCondition = value => {
  if (!value) throw new NativeConfigurationError('NATIVE_MAINTENANCE_CONTRACT');
};
const sha256 = value => createHash('sha256').update(value).digest();

/** Load the sealed, provider-independent fallback and bind its HTTP policy to
 * the actual embedded assets. No environment, credential or network access.
 */
export async function loadMaintenanceResponse(appRoot) {
  const html = await readControlledFile(join(appRoot, 'ops/maintenance/index.html'), { maximum: 512 * 1024 });
  let contract;
  try {
    contract = JSON.parse((await readControlledFile(join(appRoot, 'ops/maintenance/serving-contract.json'), { maximum: 16 * 1024 })).toString('utf8'));
  } catch { throw new NativeConfigurationError('NATIVE_MAINTENANCE_CONTRACT'); }
  requireCondition(contract.version === 1 && contract.document === 'index.html' && contract.status === 503 &&
    contract.documentSha256 === sha256(html).toString('hex') && contract.setCookie === false &&
    contract.headResponseBodyBytes === 0 && contract.automaticRefresh === false &&
    JSON.stringify(contract.documentMethods) === '["GET","HEAD"]');
  const text = html.toString('utf8');
  const styles = [...text.matchAll(/<style>([\s\S]*?)<\/style>/gi)];
  const scripts = [...text.matchAll(/<script>([\s\S]*?)<\/script>/gi)];
  requireCondition(styles.length === 1 && scripts.length === 1);
  const headers = {
    'content-type': 'text/html; charset=utf-8', 'retry-after': '300',
    'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow, noarchive',
    'referrer-policy': 'no-referrer', 'x-content-type-options': 'nosniff',
    'content-security-policy': "default-src 'none'; base-uri 'none'; form-action 'none'; connect-src 'none'; object-src 'none'; frame-src 'none'; font-src 'none'; img-src data:; " +
      `style-src 'sha256-${sha256(styles[0][1]).toString('base64')}'; ` +
      `script-src 'sha256-${sha256(scripts[0][1]).toString('base64')}'; frame-ancestors 'none'`,
  };
  requireCondition(contract.headers && typeof contract.headers === 'object' && !Array.isArray(contract.headers));
  const supplied = Object.fromEntries(Object.entries(contract.headers).map(([key, value]) => [key.toLowerCase(), value]));
  requireCondition(Object.keys(contract.headers).length === Object.keys(headers).length &&
    Object.entries(headers).every(([key, value]) => supplied[key] === value));
  return { html, headers };
}

export function sendMaintenanceResponse(req, res, fallback) {
  if (res.destroyed) return;
  if (res.headersSent) { res.destroy(); return; }
  const pathname = (req.url ?? '/').split('?')[0];
  const document = ['GET', 'HEAD'].includes(req.method) &&
    !/^\/(?:api|auth|checkout)(?:\/|$)/.test(pathname);
  const body = document ? fallback.html : Buffer.from('Servicio temporalmente no disponible.');
  res.writeHead(503, { ...fallback.headers,
    'content-type': document ? 'text/html; charset=utf-8' : 'text/plain; charset=utf-8',
    'content-length': String(body.length), connection: 'close' });
  res.end(req.method === 'HEAD' ? undefined : body);
}
