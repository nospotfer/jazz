type RateLimitOptions = {
  bucket: string;
  maxRequests: number;
  windowMs: number;
  identifier?: string;
};

type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
  remaining: number;
};

type BucketEntry = {
  count: number;
  resetAt: number;
};

const bucketStore = new Map<string, BucketEntry>();

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const realIp = request.headers.get('x-real-ip')?.trim();
  const cloudflareIp = request.headers.get('cf-connecting-ip')?.trim();
  const fastlyIp = request.headers.get('fastly-client-ip')?.trim();

  return forwardedFor || realIp || cloudflareIp || fastlyIp || 'unknown';
}

function getUserAgent(request: Request) {
  return request.headers.get('user-agent')?.trim() || 'unknown';
}

function resolveKey(request: Request, options: RateLimitOptions) {
  const ip = getClientIp(request);
  const identifier = options.identifier?.trim().toLowerCase() || 'anonymous';
  return `${options.bucket}:${ip}:${identifier}`;
}

export function checkRateLimit(request: Request, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const key = resolveKey(request, options);
  const existing = bucketStore.get(key);

  if (!existing || existing.resetAt <= now) {
    bucketStore.set(key, {
      count: 1,
      resetAt: now + options.windowMs,
    });

    return {
      allowed: true,
      retryAfterSeconds: 0,
      remaining: Math.max(options.maxRequests - 1, 0),
    };
  }

  existing.count += 1;
  bucketStore.set(key, existing);

  const allowed = existing.count <= options.maxRequests;
  const retryAfterSeconds = Math.max(Math.ceil((existing.resetAt - now) / 1000), 1);
  const remaining = Math.max(options.maxRequests - existing.count, 0);

  if (!allowed) {
    console.warn('[RATE_LIMIT_BLOCKED]', {
      bucket: options.bucket,
      ip: getClientIp(request),
      userAgent: getUserAgent(request),
      retryAfterSeconds,
    });
  }

  return {
    allowed,
    retryAfterSeconds,
    remaining,
  };
}

export function createRateLimitHeaders(result: RateLimitResult, windowMs: number) {
  return {
    'Retry-After': String(result.retryAfterSeconds),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Window': String(Math.ceil(windowMs / 1000)),
  };
}
