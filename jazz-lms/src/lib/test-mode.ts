export function isLocalhostHost(host: string | null | undefined): boolean {
  if (!host) return false;
  const normalized = host.toLowerCase();
  return normalized.includes('localhost') || normalized.startsWith('127.0.0.1');
}

export function isLocalTestRequest(req: Request): boolean {
  if (process.env.NODE_ENV === 'production') return false;

  const hostHeader = req.headers.get('host') || req.headers.get('x-forwarded-host');
  const origin = req.headers.get('origin');

  if (isLocalhostHost(hostHeader)) return true;
  if (origin && origin.toLowerCase().includes('localhost')) return true;

  return false;
}
