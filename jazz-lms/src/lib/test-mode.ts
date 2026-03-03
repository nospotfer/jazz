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

export function isLocalTestRequest(req: Request): boolean {
  if (process.env.NODE_ENV === 'production') return false;

  const hostHeader = req.headers.get('host') || req.headers.get('x-forwarded-host');
  const origin = req.headers.get('origin');

  if (isLocalhostHost(hostHeader)) return true;
  if (origin) {
    try {
      const originHost = new URL(origin).host;
      if (isLocalhostHost(originHost)) return true;
    } catch {
      if (isLocalhostHost(origin)) return true;
    }
  }

  return false;
}
