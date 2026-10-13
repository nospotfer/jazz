export function isLocalhostHost(host: string | null | undefined): boolean {
  if (!host) return false;
  const normalized = host.trim().toLowerCase();
  if (!normalized) return false;

  const withoutProtocol = normalized.replace(/^https?:\/\//, '');
  const withoutPath = withoutProtocol.split('/')[0];

  if (!withoutPath) return false;

  const isBracketedIpv6Loopback = withoutPath === '[::1]' || withoutPath.startsWith('[::1]:');
  if (isBracketedIpv6Loopback) return true;

  const hostname = withoutPath.split(':')[0];

  return hostname === 'localhost' || hostname === '127.0.0.1';
}

export function isLocalTestCheckoutEnabled(): boolean {
  if (process.env.NODE_ENV === 'production') return false;

  const localTestCheckoutFlag = process.env.ENABLE_LOCAL_TEST_CHECKOUT?.trim().toLowerCase();

  return localTestCheckoutFlag === '1'
    || localTestCheckoutFlag === 'true'
    || localTestCheckoutFlag === 'yes';
}

export function isLocalTestRequest(req: Request): boolean {
  return isIsolatedLocalRequest(req, 'ENABLE_LOCAL_TEST_CHECKOUT');
}

// Destructive fixture helpers have a separate opt-in and target guard. Do not
// reuse the checkout flag or trust request headers to establish isolation.
export function isIsolatedLocalTestRequest(req: Request): boolean {
  return isIsolatedLocalRequest(req, 'ENABLE_LOCAL_TEST_RESETS');
}

function isIsolatedLocalRequest(req: Request, flagName: string): boolean {
  if (!['development', 'test'].includes(process.env.NODE_ENV || '') ||
      process.env.VERCEL_ENV === 'production') return false;
  const flag = process.env[flagName]?.trim().toLowerCase();
  if (!['1', 'true', 'yes'].includes(flag || '')) return false;

  try {
    const database = new URL(process.env.DATABASE_URL || '');
    const localDatabase = ['localhost', '127.0.0.1'].includes(database.hostname);
    const isolatedTarget = (database.port === '55432' && database.pathname === '/jazz_maintenance') ||
      (database.port === '56122' && database.pathname === '/postgres');
    const allowedParameters = ['schema', 'connection_limit', 'pool_timeout', 'connect_timeout', 'statement_cache_size'];
    if (!['postgres:', 'postgresql:'].includes(database.protocol) || !localDatabase || !isolatedTarget ||
        [...database.searchParams.keys()].some(key => !allowedParameters.includes(key)) ||
        (database.searchParams.has('schema') && database.searchParams.get('schema') !== 'public')) return false;

    const requestUrl = new URL(req.url);
    const isLoopback = (url: URL) => ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) &&
      ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password;
    if (!isLoopback(requestUrl)) return false;

    for (const header of ['host', 'x-forwarded-host']) {
      const value = req.headers.get(header);
      if (!value) continue;
      const host = new URL(`http://${value}`);
      if (!isLoopback(host) || host.host !== requestUrl.host || host.pathname !== '/' || host.search || host.hash) return false;
    }
    const origin = req.headers.get('origin');
    if (origin) {
      const url = new URL(origin);
      if (!isLoopback(url) || url.origin !== requestUrl.origin || url.pathname !== '/' || url.search || url.hash) return false;
    }
    return true;
  } catch {
    return false;
  }
}
