function sanitizeOriginLikeValue(value: string): string {
  const slashNormalized = value.trim().replace(/\\+/g, '/');
  return slashNormalized.replace(/^(https?):\/(?!\/)/i, '$1://');
}

export function normalizeBaseOrigin(value?: string | null): string | null {
  if (!value) return null;

  const sanitized = sanitizeOriginLikeValue(value);

  if (!sanitized) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(sanitized)
    ? sanitized
    : `https://${sanitized}`;

  try {
    const url = new URL(withProtocol);
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
}

export function isLocalOrigin(origin?: string | null): boolean {
  if (!origin) return false;

  try {
    const { hostname } = new URL(origin);
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

export function resolveClientAppOrigin(currentOrigin: string): string {
  const configuredOrigin = normalizeBaseOrigin(process.env.NEXT_PUBLIC_APP_URL);
  const isDevelopment = process.env.NODE_ENV !== 'production';

  if (isDevelopment) {
    if (isLocalOrigin(currentOrigin)) {
      return currentOrigin;
    }

    if (configuredOrigin && isLocalOrigin(configuredOrigin)) {
      return configuredOrigin;
    }

    return 'http://localhost:3000';
  }

  return configuredOrigin || currentOrigin;
}

export function resolveServerAppOrigin(requestOrigin: string): string {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const configuredOrigin = normalizeBaseOrigin(
    process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL
  );

  if (isDevelopment) {
    if (isLocalOrigin(requestOrigin)) {
      return requestOrigin;
    }

    if (configuredOrigin && isLocalOrigin(configuredOrigin)) {
      return configuredOrigin;
    }

    return 'http://localhost:3000';
  }

  return configuredOrigin || requestOrigin;
}
