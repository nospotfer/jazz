import { createHash } from "node:crypto";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  bucket: 'voucher-validate-ip' | 'voucher-validate-code' | 'webhook-email';
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

// These three application-owned buckets reserve independent capacity. A public
// voucher request cannot consume the authenticated email webhook's storage.
const BUCKET_NAMES = ['voucher-validate-ip', 'voucher-validate-code', 'webhook-email'] as const;
const MAX_IDENTIFIERS_PER_BUCKET = 4096;
const PRUNE_INTERVAL_MS = 30_000;
type BucketStore = {
  entries: Map<string, RateLimitEntry>;
  nextPruneAt: number;
  earliestResetAt: number;
};
const globalStore = globalThis as typeof globalThis & {
  __jazzRateLimitBucketsV2?: Map<RateLimitOptions['bucket'], BucketStore>;
};
const buckets = globalStore.__jazzRateLimitBucketsV2 ?? new Map(
  BUCKET_NAMES.map(name => [name, {
    entries: new Map<string, RateLimitEntry>(), nextPruneAt: 0, earliestResetAt: Infinity,
  }]),
);
globalStore.__jazzRateLimitBucketsV2 = buckets;

function prune(bucket: BucketStore, now: number) {
  let earliestResetAt = Infinity;
  for (const [key, entry] of bucket.entries) {
    if (entry.resetAt <= now) bucket.entries.delete(key);
    else earliestResetAt = Math.min(earliestResetAt, entry.resetAt);
  }
  bucket.earliestResetAt = earliestResetAt;
  bucket.nextPruneAt = now + PRUNE_INTERVAL_MS;
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
  // Retain a fixed-size key rather than arbitrary header/voucher strings.
  return createHash("sha256").update(identifier).digest("hex");
}

export function checkRateLimit(req: Request, options: RateLimitOptions): RateLimitResult {
  const bucket = buckets.get(options.bucket);
  if (!bucket || !Number.isSafeInteger(options.maxRequests) || options.maxRequests < 1 ||
      !Number.isSafeInteger(options.windowMs) || options.windowMs < 1) {
    throw new Error('Invalid rate limit configuration');
  }
  const now = Date.now();
  if (now >= bucket.nextPruneAt ||
      (bucket.entries.size >= MAX_IDENTIFIERS_PER_BUCKET && now >= bucket.earliestResetAt)) {
    prune(bucket, now);
  }
  const key = buildKey(req, options);
  const existing = bucket.entries.get(key);

  if (!existing || existing.resetAt <= now) {
    if (existing) bucket.entries.delete(key);
    if (bucket.entries.size >= MAX_IDENTIFIERS_PER_BUCKET) {
      // Never evict live counters: rotating identifiers would reset their quota.
      return {
        allowed: false, limit: options.maxRequests, remaining: 0,
        retryAfterSeconds: Math.max(Math.ceil((bucket.earliestResetAt - now) / 1000), 1),
        resetAt: bucket.earliestResetAt,
      };
    }
    const resetAt = now + options.windowMs;
    bucket.entries.set(key, { count: 1, resetAt });
    bucket.earliestResetAt = Math.min(bucket.earliestResetAt, resetAt);
    return {
      allowed: true, limit: options.maxRequests,
      remaining: options.maxRequests - 1, retryAfterSeconds: 0, resetAt,
    };
  }

  if (existing.count >= options.maxRequests) {
    return {
      allowed: false, limit: options.maxRequests, remaining: 0,
      retryAfterSeconds: Math.max(Math.ceil((existing.resetAt - now) / 1000), 1),
      resetAt: existing.resetAt,
    };
  }
  existing.count += 1;
  return {
    allowed: true, limit: options.maxRequests,
    remaining: options.maxRequests - existing.count,
    retryAfterSeconds: 0, resetAt: existing.resetAt,
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
