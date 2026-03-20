type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  bucket: string;
  maxRequests: number;
  windowMs: number;
  identifier?: string;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
  resetAt: number;
};

const globalStore = globalThis as typeof globalThis & {
  __jazzRateLimitStore?: Map<string, RateLimitEntry>;
};

const store = globalStore.__jazzRateLimitStore ?? new Map<string, RateLimitEntry>();
if (!globalStore.__jazzRateLimitStore) {
  globalStore.__jazzRateLimitStore = store;
}

function getRequestIp(req: Request) {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown';
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  return 'unknown';
}

function buildKey(req: Request, options: RateLimitOptions) {
  const identifier = options.identifier?.trim() || getRequestIp(req);
  return `${options.bucket}:${identifier}`;
}

export function checkRateLimit(req: Request, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const key = buildKey(req, options);
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + options.windowMs;
    store.set(key, {
      count: 1,
      resetAt,
    });

    return {
      allowed: true,
      limit: options.maxRequests,
      remaining: Math.max(options.maxRequests - 1, 0),
      retryAfterSeconds: 0,
      resetAt,
    };
  }

  const nextCount = existing.count + 1;
  existing.count = nextCount;

  if (nextCount > options.maxRequests) {
    const retryAfterSeconds = Math.max(Math.ceil((existing.resetAt - now) / 1000), 1);

    return {
      allowed: false,
      limit: options.maxRequests,
      remaining: 0,
      retryAfterSeconds,
      resetAt: existing.resetAt,
    };
  }

  return {
    allowed: true,
    limit: options.maxRequests,
    remaining: Math.max(options.maxRequests - nextCount, 0),
    retryAfterSeconds: 0,
    resetAt: existing.resetAt,
  };
}

export function createRateLimitHeaders(result: RateLimitResult, windowMs: number) {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.floor(result.resetAt / 1000)),
    'Retry-After': String(result.allowed ? 0 : result.retryAfterSeconds),
    'Cache-Control': `private, max-age=${Math.max(Math.ceil(windowMs / 1000), 1)}`,
  };
}
