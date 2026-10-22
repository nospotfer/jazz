import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

type Limiter = typeof import("@/lib/rate-limit");
type Options = Parameters<Limiter["checkRateLimit"]>[1];
type Bucket = Options["bucket"];
type Entry = { count: number; resetAt: number };
type Storage = Map<Bucket, {
  entries: Map<string, Entry>; nextPruneAt: number; earliestResetAt: number;
}>;

const globalStore = globalThis as typeof globalThis & { __jazzRateLimitBucketsV2?: Storage };
const BUCKETS: Bucket[] = ["voucher-validate-ip", "voucher-validate-code", "webhook-email"];
const CAPACITY = 4096;
const NOW = 1700000000123;
const request = new Request("https://app.example.invalid/api/local-test", {
  headers: { "x-forwarded-for": "192.0.2.10, 192.0.2.11" },
});

beforeEach(() => {
  vi.resetModules();
  delete globalStore.__jazzRateLimitBucketsV2;
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
});

afterEach(() => {
  delete globalStore.__jazzRateLimitBucketsV2;
  vi.useRealTimers();
});

async function limiter() {
  return import("@/lib/rate-limit");
}

function entries(bucket: Bucket = BUCKETS[0]) {
  const store = globalStore.__jazzRateLimitBucketsV2;
  expect(store).toBeInstanceOf(Map);
  const found = store?.get(bucket);
  expect(found).toBeDefined();
  return found!.entries;
}

function call(api: Limiter, identifier: string, options: Partial<Options> = {}) {
  return api.checkRateLimit(request, {
    bucket: BUCKETS[0], identifier, maxRequests: 2, windowMs: 60000, ...options,
  });
}

function fill(api: Limiter, bucket: Bucket, count = CAPACITY, options: Partial<Options> = {}) {
  for (let i = 0; i < count; i++) {
    expect(call(api, `${bucket}-fixture-${i}`, { bucket, ...options }).allowed).toBe(true);
  }
}

describe("bounded fixed-size rate-limit storage", () => {
  test("reserves only the three known buckets and stores SHA256 identifiers", async () => {
    const api = await limiter();
    expect([...globalStore.__jazzRateLimitBucketsV2!.keys()].sort()).toEqual([...BUCKETS].sort());
    call(api, "abc");
    // Published SHA256 test vector verifies the storage format independently.
    expect([...entries().keys()]).toEqual(["ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"]);
    for (const bucket of BUCKETS.slice(1)) expect(entries(bucket).size).toBe(0);
  });

  test("large identifiers sharing a long prefix remain distinct without retaining raw text", async () => {
    const api = await limiter();
    const prefix = "synthetic-private-identifier-🎵".repeat(12000);
    const first = `${prefix}-one`;
    const second = `${prefix}-two`;
    expect(call(api, first, { maxRequests: 1 }).allowed).toBe(true);
    expect(call(api, second, { maxRequests: 1 }).allowed).toBe(true);
    expect(call(api, first, { maxRequests: 1 }).allowed).toBe(false);
    expect(call(api, second, { maxRequests: 1 }).allowed).toBe(false);
    expect(entries().size).toBe(2);
    for (const key of entries().keys()) expect(key).toMatch(/^[a-f0-9]{64}$/);
    const retained = JSON.stringify([...entries()]);
    expect(retained).not.toContain("synthetic-private-identifier");
    expect(retained).not.toContain(first);
    expect(retained).not.toContain(second);
    expect(retained.length).toBeLessThan(400);
  });

  test("trimming retains one counter rather than creating whitespace aliases", async () => {
    const api = await limiter();
    expect(call(api, "  fixture-user  ", { maxRequests: 1 }).allowed).toBe(true);
    expect(call(api, "fixture-user", { maxRequests: 1 }).allowed).toBe(false);
    expect(entries().size).toBe(1);
  });

  test("denied repetitions saturate the count and do not extend the window", async () => {
    const api = await limiter();
    const initial = call(api, "fixture-user", { maxRequests: 1 });
    expect(initial.allowed).toBe(true);
    for (let i = 0; i < 2000; i++) {
      expect(call(api, "fixture-user", { maxRequests: 1 })).toMatchObject({
        allowed: false, remaining: 0, resetAt: initial.resetAt,
      });
    }
    expect([...entries().values()]).toEqual([{ count: 1, resetAt: initial.resetAt }]);
  });

  test("full live capacity rejects rotating identifiers and retains existing counters", async () => {
    const api = await limiter();
    const protectedInitial = call(api, "protected-fixture", { maxRequests: 1, windowMs: 120000 });
    fill(api, BUCKETS[0], CAPACITY - 1, { maxRequests: 1, windowMs: 120000 });
    const before = [...entries()].map(([key, entry]) => [key, { ...entry }]);
    for (let i = 0; i < 20; i++) {
      expect(call(api, `new-rotating-fixture-${i}`, { maxRequests: 5, windowMs: 600000 })).toMatchObject({
        allowed: false, limit: 5, remaining: 0,
        retryAfterSeconds: 120, resetAt: NOW + 120000,
      });
    }
    expect(entries().size).toBe(CAPACITY);
    expect([...entries()]).toEqual(before);
    expect(call(api, "protected-fixture", { maxRequests: 1, windowMs: 120000 })).toMatchObject({
      allowed: false, resetAt: protectedInitial.resetAt,
    });
  });

  test("a full bucket still permits an existing counter's remaining quota", async () => {
    const api = await limiter();
    call(api, "protected-fixture", { maxRequests: 2 });
    fill(api, BUCKETS[0], CAPACITY - 1);
    expect(call(api, "new-fixture").allowed).toBe(false);
    expect(call(api, "protected-fixture", { maxRequests: 2 })).toMatchObject({ allowed: true, remaining: 0 });
    expect(call(api, "protected-fixture", { maxRequests: 2 }).allowed).toBe(false);
    expect(entries().size).toBe(CAPACITY);
  });

  test("each bucket keeps independent capacity and counters", async () => {
    const api = await limiter();
    for (const bucket of BUCKETS) {
      fill(api, bucket, CAPACITY, { maxRequests: 1 });
      expect(call(api, "capacity-overflow-fixture", { bucket, maxRequests: 1 }).allowed).toBe(false);
      expect(entries(bucket).size).toBe(CAPACITY);
    }
    expect(globalStore.__jazzRateLimitBucketsV2!.size).toBe(3);
    expect(BUCKETS.reduce((sum, bucket) => sum + entries(bucket).size, 0)).toBe(3 * CAPACITY);
  });

  test("one full voucher bucket cannot consume empty webhook or code capacity", async () => {
    const api = await limiter();
    fill(api, "voucher-validate-ip");
    expect(call(api, "new-fixture").allowed).toBe(false);
    for (const bucket of ["voucher-validate-code", "webhook-email"] as const) {
      expect(call(api, "same-fixture", { bucket, maxRequests: 1 }).allowed).toBe(true);
      expect(call(api, "same-fixture", { bucket, maxRequests: 1 }).allowed).toBe(false);
      expect(entries(bucket).size).toBe(1);
    }
  });
});

describe("expiry reclamation and retry semantics", () => {
  test("quota expires exactly at the reset boundary, without extending it on denial", async () => {
    const api = await limiter();
    const initial = call(api, "boundary-fixture", { maxRequests: 1, windowMs: 1501 });
    vi.setSystemTime(NOW + 1500);
    expect(call(api, "boundary-fixture", { maxRequests: 1, windowMs: 1501 })).toMatchObject({
      allowed: false, retryAfterSeconds: 1, resetAt: initial.resetAt,
    });
    vi.setSystemTime(NOW + 1501);
    expect(call(api, "boundary-fixture", { maxRequests: 1, windowMs: 1501 })).toMatchObject({
      allowed: true, remaining: 0, retryAfterSeconds: 0, resetAt: NOW + 3002,
    });
    expect(entries().size).toBe(1);
    expect([...entries().values()][0].count).toBe(1);
  });

  test("lazy sweep reclaims unrelated expired entries at 30 seconds and retains live ones", async () => {
    const api = await limiter();
    call(api, "expired-a", { windowMs: 1000 });
    call(api, "expired-b", { windowMs: 1000 });
    vi.setSystemTime(NOW + 1001);
    const live = call(api, "live-fixture", { maxRequests: 1 });
    expect(entries().size).toBe(3);
    vi.setSystemTime(NOW + 29999);
    call(api, "second-live-fixture");
    expect(entries().size).toBe(4);
    vi.setSystemTime(NOW + 30000);
    call(api, "sweep-trigger-fixture");
    expect(entries().size).toBe(3);
    expect([...entries().values()].every(entry => entry.resetAt > Date.now())).toBe(true);
    expect(call(api, "live-fixture", { maxRequests: 1 })).toMatchObject({ allowed: false, resetAt: live.resetAt });
  });

  test("capacity denial advertises the earliest expiry and immediately reclaims it before a scheduled sweep", async () => {
    const api = await limiter();
    const protectedInitial = call(api, "protected-fixture", { maxRequests: 1, windowMs: 60000 });
    call(api, "earliest-fixture", { windowMs: 1501 });
    fill(api, BUCKETS[0], CAPACITY - 2);
    vi.setSystemTime(NOW + 500);
    const denied = call(api, "new-fixture", { maxRequests: 5, windowMs: 600000 });
    expect(denied).toMatchObject({ allowed: false, retryAfterSeconds: 2, resetAt: NOW + 1501 });
    expect(api.createRateLimitHeaders(denied, 600000)["Retry-After"]).toBe("2");
    vi.setSystemTime(NOW + 1500);
    expect(call(api, "new-fixture")).toMatchObject({ allowed: false, retryAfterSeconds: 1 });
    vi.setSystemTime(NOW + 1501);
    expect(call(api, "new-fixture")).toMatchObject({ allowed: true, remaining: 1, resetAt: NOW + 61501 });
    expect(entries().size).toBe(CAPACITY);
    expect([...entries().values()].every(entry => entry.resetAt > Date.now())).toBe(true);
    expect(call(api, "protected-fixture", { maxRequests: 1 })).toMatchObject({ allowed: false, resetAt: protectedInitial.resetAt });
  });

  test("allowed and denied headers preserve the public limit/reset/retry contract", async () => {
    const api = await limiter();
    const allowed = call(api, "header-fixture", { maxRequests: 2, windowMs: 1501 });
    expect(api.createRateLimitHeaders(allowed, 1501)).toEqual({
      "X-RateLimit-Limit": "2", "X-RateLimit-Remaining": "1",
      "X-RateLimit-Reset": String(Math.floor((NOW + 1501) / 1000)),
      "Retry-After": "0", "Cache-Control": "private, max-age=2",
    });
    expect(call(api, "header-fixture", { maxRequests: 2, windowMs: 1501 }).allowed).toBe(true);
    const denied = call(api, "header-fixture", { maxRequests: 2, windowMs: 1501 });
    expect(api.createRateLimitHeaders(denied, 1501)).toMatchObject({
      "X-RateLimit-Limit": "2", "X-RateLimit-Remaining": "0", "Retry-After": "2",
      "X-RateLimit-Reset": String(Math.floor(allowed.resetAt / 1000)),
    });
    expect(api.createRateLimitHeaders(call(api, "small-window-fixture", { windowMs: 1 }), 1)["Cache-Control"]).toBe("private, max-age=1");
  });
});

describe("invalid configuration cannot allocate counters or buckets", () => {
  const invalidNumbers = [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1];
  for (const field of ["maxRequests", "windowMs"] as const) {
    test.each(invalidNumbers)(`rejects invalid ${field} %s without allocating entries`, async value => {
      const api = await limiter();
      expect(() => call(api, "invalid-fixture", { [field]: value })).toThrow(Error);
      expect(BUCKETS.every(bucket => entries(bucket).size === 0)).toBe(true);
      expect(globalStore.__jazzRateLimitBucketsV2!.size).toBe(3);
    });
  }

  test("unknown attacker-controlled bucket cannot create a fourth bucket", async () => {
    const api = await limiter();
    const options = { bucket: "unknown-fixture-bucket", identifier: "fixture", maxRequests: 1, windowMs: 1000 } as unknown as Options;
    expect(() => api.checkRateLimit(request, options)).toThrow(Error);
    expect([...globalStore.__jazzRateLimitBucketsV2!.keys()].sort()).toEqual([...BUCKETS].sort());
    expect(BUCKETS.every(bucket => entries(bucket).size === 0)).toBe(true);
  });

  test("a positive safe maximum request count is accepted without numeric overflow", async () => {
    const api = await limiter();
    expect(call(api, "safe-maximum-fixture", { maxRequests: Number.MAX_SAFE_INTEGER })).toMatchObject({
      allowed: true, limit: Number.MAX_SAFE_INTEGER, remaining: Number.MAX_SAFE_INTEGER - 1,
    });
  });
});
