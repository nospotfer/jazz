import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { DodoApiPaymentRecord } from '@/lib/payments/providers/dodo';

const mocks = vi.hoisted(() => ({
  users: vi.fn(), existing: vi.fn(), list: vi.fn(), retrieve: vi.fn(), grant: vi.fn(), network: vi.fn(),
}));

vi.mock('@/lib/db', () => ({ db: {
  user: { findMany: mocks.users }, purchase: { findUnique: mocks.existing },
} }));
vi.mock('@/lib/course-purchase-sync', () => ({ upsertCoursePurchaseFromProvider: mocks.grant }));
vi.mock('@/lib/payments/providers/dodo', async importOriginal => ({
  ...await importOriginal<typeof import('@/lib/payments/providers/dodo')>(),
  listDodoPaymentsForCustomer: mocks.list, retrieveDodoPayment: mocks.retrieve,
}));

type SweepState = {
  running: boolean;
  lastAttemptedUserId: string | null;
  lastCapacityRetryUserId: string | null;
  passStartedAt: number;
  passSince: number;
  passEligibilityCutoff: number;
  passComplete: boolean;
  pendingSinceByUser: Map<string, number>;
  lastPaymentAttemptByUser: Map<string, string>;
};
type User = { id: string; email: string };
const processState = globalThis as typeof globalThis & { __jazzPaymentSweepStateV1?: SweepState };
const NOW = Date.UTC(2026, 9, 1, 3, 15);
const PAYMENT_WINDOW = 48 * 60 * 60 * 1000;
const ACTIVITY_WINDOW = 7 * 24 * 60 * 60 * 1000;
const SECRET = 'synthetic-continuation-only';
const records = new Map<string, DodoApiPaymentRecord>();
let GET: (request: Request) => Promise<Response>;

function user(id: string): User { return { id, email: `${id}@example.test` }; }
function request(signal?: AbortSignal, authorization = `Bearer ${SECRET}`) {
  return new Request('http://127.0.0.1/api/cron/payments-sweep', {
    headers: { authorization }, signal,
  });
}
function state(): SweepState {
  expect(processState.__jazzPaymentSweepStateV1).toBeDefined();
  return processState.__jazzPaymentSweepStateV1!;
}
function seedState(extra: Partial<SweepState> = {}): SweepState {
  const value: SweepState = {
    running: false, lastAttemptedUserId: null, lastCapacityRetryUserId: null, passStartedAt: NOW,
    passSince: NOW - PAYMENT_WINDOW, passEligibilityCutoff: NOW - ACTIVITY_WINDOW,
    passComplete: false, pendingSinceByUser: new Map(), lastPaymentAttemptByUser: new Map(),
    ...extra,
  };
  processState.__jazzPaymentSweepStateV1 = value;
  return value;
}
function payment(owner: User, id: string, extra: Partial<DodoApiPaymentRecord> = {}) {
  const value: DodoApiPaymentRecord = {
    id, payment_id: id, status: 'succeeded', subtotal_amount: 3000, total_amount: 3200,
    customer: { customer_id: `customer-${owner.id}`, email: owner.email },
    metadata: { userId: owner.id, courseId: `course-${id}`, originalPrice: '30' },
    ...extra,
  };
  records.set(id, value);
  return value;
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}
async function flush() { for (let i = 0; i < 12; i += 1) await Promise.resolve(); }
function fullPendingQueue() {
  return new Map(Array.from({ length: 4096 }, (_, i) => [
    `pending-${String(i).padStart(4, '0')}`, NOW - PAYMENT_WINDOW - i,
  ] as const));
}
function selectMatchingUsers(candidates: User[]) {
  return async (query: { where: { id?: { in?: string[]; gt?: string } }; take: number }) => {
    const allowed = query.where.id?.in ? new Set(query.where.id.in) : null;
    const after = query.where.id?.gt;
    return candidates.filter(candidate => (!allowed || allowed.has(candidate.id)) && (!after || candidate.id > after))
      .sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0).slice(0, query.take);
  };
}

beforeEach(async () => {
  vi.resetAllMocks();
  vi.resetModules();
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  vi.stubEnv('CRON_SECRET', SECRET);
  vi.stubEnv('DODO_PAYMENTS_API_KEY', 'synthetic-network-disabled');
  vi.stubEnv('DODO_ENVIRONMENT', 'test_mode');
  vi.stubEnv('DODO_API_BASE_URL', 'https://test.dodopayments.com');
  mocks.network.mockRejectedValue(new Error('External network disabled for mocked sweep tests'));
  vi.stubGlobal('fetch', mocks.network);
  delete processState.__jazzPaymentSweepStateV1;
  records.clear();
  mocks.users.mockResolvedValue([]);
  mocks.existing.mockResolvedValue(null);
  mocks.list.mockResolvedValue([]);
  mocks.retrieve.mockImplementation(async (id: string) => records.get(id) ?? null);
  mocks.grant.mockResolvedValue(undefined);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  GET = (await import('@/app/api/cron/payments-sweep/route')).GET;
});

afterEach(() => {
  // Check only a count, so an accidental request cannot print its arguments.
  expect(mocks.network.mock.calls.length).toBe(0);
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete processState.__jazzPaymentSweepStateV1;
});

describe('native payment sweep continuation', () => {
  test('rejects unauthorized callers before creating continuation state or querying data', async () => {
    expect((await GET(request(undefined, 'Bearer wrong'))).status).toBe(401);
    expect(processState.__jazzPaymentSweepStateV1).toBeUndefined();
    expect(mocks.users).not.toHaveBeenCalled();
    expect(mocks.list).not.toHaveBeenCalled();
    expect(mocks.grant).not.toHaveBeenCalled();
  });

  test('rejects an already aborted request without database or provider work', async () => {
    const controller = new AbortController(); controller.abort();
    const response = await GET(request(controller.signal));
    expect(response.status).toBe(499);
    expect(await response.json()).toMatchObject({ success: false, complete: false, reason: 'aborted' });
    expect(mocks.users).not.toHaveBeenCalled();
    expect(mocks.list).not.toHaveBeenCalled();
  });

  test('reports a completely scanned eligible pass with explicit process-local coverage', async () => {
    mocks.users.mockResolvedValue([user('a'), user('b')]);
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true, complete: true, passComplete: true, hasMore: false, reason: null,
      usersScanned: 2, paymentsScanned: 0, unlocked: 0, failures: 0, pendingUsers: 0,
      coverage: 'recent_eligible_users', state: 'process_local',
    });
    expect(mocks.users).toHaveBeenCalledWith(expect.objectContaining({ orderBy: { id: 'asc' }, take: 501 }));
    expect(state().lastAttemptedUserId).toBe('b');
    expect(state().running).toBe(false);
  });

  test('denies overlap while the first database operation is still unsettled', async () => {
    const database = deferred<User[]>(); mocks.users.mockReturnValue(database.promise);
    const first = GET(request()); await flush();
    const second = await GET(request());
    expect(second.status).toBe(409);
    expect(await second.json()).toEqual({ success: false, complete: false, reason: 'busy' });
    expect(mocks.users).toHaveBeenCalledTimes(1);
    expect(state().running).toBe(true);
    database.resolve([]);
    expect((await first).status).toBe(200);
    expect(state().running).toBe(false);
  });

  test('retains the lock through an aborted uncancellable database read and does not advance an unstarted user', async () => {
    const database = deferred<User[]>(); mocks.users.mockReturnValue(database.promise);
    const controller = new AbortController(); const first = GET(request(controller.signal));
    await flush(); controller.abort(); await flush();
    expect(state().running).toBe(true);
    expect((await GET(request())).status).toBe(409);
    database.resolve([user('a')]);
    expect((await first).status).toBe(499);
    expect(state().lastAttemptedUserId).toBeNull();
    expect(state().pendingSinceByUser.size).toBe(0);
    expect(mocks.list).not.toHaveBeenCalled();
    expect(state().running).toBe(false);
  });

  test('aborts the provider signal at 50 seconds but keeps single-flight until its awaited promise settles', async () => {
    const provider = deferred<DodoApiPaymentRecord[]>();
    mocks.users.mockResolvedValue([user('a')]); mocks.list.mockReturnValue(provider.promise);
    const first = GET(request()); await flush();
    const signal = mocks.list.mock.calls[0][0].signal as AbortSignal;
    expect(signal.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(50_000);
    expect(signal.aborted).toBe(true);
    expect(state().running).toBe(true);
    expect((await GET(request())).status).toBe(409);
    provider.resolve([]);
    const response = await first;
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ complete: false, reason: 'deadline', usersScanned: 1, pendingUsers: 1 });
    expect(state().lastAttemptedUserId).toBe('a');
    expect(state().pendingSinceByUser.get('a')).toBe(NOW - PAYMENT_WINDOW);
    expect(mocks.retrieve).not.toHaveBeenCalled();
    expect(mocks.grant).not.toHaveBeenCalled();
    expect(state().running).toBe(false);
  });

  test('moves past an interrupted first customer and retries it only after the normal cursor wraps', async () => {
    const a = user('a'), b = user('b'), c = user('c');
    const controller = new AbortController();
    mocks.users.mockResolvedValueOnce([a, b, c]).mockResolvedValueOnce([b, c]).mockResolvedValueOnce([a]);
    mocks.list.mockImplementationOnce(async () => { controller.abort(); return []; });
    expect((await GET(request(controller.signal))).status).toBe(499);
    expect(state().lastAttemptedUserId).toBe('a');
    const originalCutoff = state().pendingSinceByUser.get('a');
    const second = await GET(request());
    expect(second.status).toBe(503);
    expect(await second.json()).toMatchObject({ passComplete: true, hasMore: false, pendingUsers: 1, reason: 'incomplete' });
    expect(mocks.users.mock.calls[1][0].where.id).toEqual({ gt: 'a' });
    expect(mocks.list.mock.calls.slice(1).map(call => call[0].email)).toEqual([b.email, c.email]);
    const third = await GET(request());
    expect(third.status).toBe(200);
    expect(mocks.users.mock.calls[2][0].where.id).toBeUndefined();
    expect(mocks.list.mock.calls[3][0]).toMatchObject({ email: a.email, sinceISO: new Date(originalCutoff!).toISOString() });
    expect(state().pendingSinceByUser.size).toBe(0);
  });

  test('a deleted cursor row does not prevent the stable id keyset from reaching later customers', async () => {
    seedState({ lastAttemptedUserId: 'b' }); mocks.users.mockResolvedValue([user('c')]);
    expect((await GET(request())).status).toBe(200);
    expect(mocks.users).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: { gt: 'b' } }), orderBy: { id: 'asc' }, take: 501,
    }));
    expect(mocks.users.mock.calls[0][0].cursor).toBeUndefined();
    expect(mocks.list.mock.calls[0][0].email).toBe(user('c').email);
  });

  test('overlaps the previous pass start after a multi-day pass instead of dropping early-user payments', async () => {
    seedState({ passComplete: true, lastAttemptedUserId: 'z' });
    vi.setSystemTime(NOW + 3 * 24 * 60 * 60 * 1000);
    mocks.users.mockResolvedValue([user('a')]);
    expect((await GET(request())).status).toBe(200);
    expect(mocks.list.mock.calls[0][0].sinceISO).toBe(new Date(NOW - PAYMENT_WINDOW).toISOString());
    expect(mocks.users.mock.calls[0][0].where.OR).toEqual([
      { updatedAt: { gte: new Date(NOW - ACTIVITY_WINDOW) } },
      { createdAt: { gte: new Date(NOW - ACTIVITY_WINDOW) } },
    ]);
    expect(state().passStartedAt).toBe(NOW + 3 * 24 * 60 * 60 * 1000);
  });

  test('keeps pending users eligible after inactivity and uses their earlier individual cutoff', async () => {
    const earlier = NOW - 10 * 24 * 60 * 60 * 1000;
    seedState({ passComplete: true, lastAttemptedUserId: 'z', pendingSinceByUser: new Map([['a', earlier]]) });
    vi.setSystemTime(NOW + 12 * 24 * 60 * 60 * 1000);
    mocks.users.mockResolvedValue([user('a')]);
    expect((await GET(request())).status).toBe(200);
    expect(mocks.users.mock.calls[0][0].where.OR).toContainEqual({ id: { in: ['a'] } });
    expect(mocks.list.mock.calls[0][0].sinceISO).toBe(new Date(earlier).toISOString());
    expect(state().pendingSinceByUser.has('a')).toBe(false);
  });

  test('continues later payments after one detail failure and passes cancellation through the real snapshot helper', async () => {
    const a = user('a'), first = payment(a, 'first'), later = payment(a, 'later');
    mocks.users.mockResolvedValue([a]); mocks.list.mockResolvedValue([first, later]);
    mocks.retrieve.mockRejectedValueOnce(new Error('Controlled detail outage')).mockResolvedValueOnce(later);
    const response = await GET(request());
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ reason: 'incomplete', unlocked: 1, failures: 1, pendingUsers: 1 });
    expect(mocks.retrieve.mock.calls.map(call => call[0])).toEqual(['first', 'later']);
    for (const call of mocks.retrieve.mock.calls) expect(call[1].signal).toBe(mocks.list.mock.calls[0][0].signal);
    expect(mocks.grant).toHaveBeenCalledOnce();
    expect(mocks.grant).toHaveBeenCalledWith(expect.objectContaining({ userId: a.id, providerReferenceId: 'dodo-pay:later' }));
    expect(state().lastPaymentAttemptByUser.get(a.id)).toBe('later');
  });

  test('fresh deferred detail with a reversal cannot be granted after a retry', async () => {
    const a = user('a'), summary = payment(a, 'deferred');
    const controller = new AbortController();
    mocks.users.mockResolvedValueOnce([a]).mockResolvedValueOnce([]).mockResolvedValueOnce([a]);
    mocks.list.mockResolvedValue([summary]);
    mocks.retrieve.mockImplementationOnce(async () => { controller.abort(); return summary; });
    expect((await GET(request(controller.signal))).status).toBe(499);
    expect(mocks.grant).not.toHaveBeenCalled();
    expect((await GET(request())).status).toBe(503); // Finish the interrupted normal pass first.
    mocks.retrieve.mockResolvedValue({ ...summary, refund_status: 'full' });
    expect((await GET(request())).status).toBe(200);
    expect(mocks.retrieve).toHaveBeenCalledTimes(2);
    expect(mocks.grant).not.toHaveBeenCalled();
    expect(state().pendingSinceByUser.size).toBe(0);
  });

  test('a 501-user query is a partial batch and the next call starts after the 500th attempt', async () => {
    const users = Array.from({ length: 501 }, (_, i) => user(`u${String(i).padStart(4, '0')}`));
    mocks.users.mockResolvedValueOnce(users).mockResolvedValueOnce([users[500]]);
    const first = await GET(request());
    expect(first.status).toBe(503);
    expect(await first.json()).toMatchObject({ complete: false, passComplete: false, hasMore: true, usersScanned: 500, pendingUsers: 0 });
    expect(mocks.list).toHaveBeenCalledTimes(500);
    expect(state().lastAttemptedUserId).toBe(users[499].id);
    const second = await GET(request());
    expect(second.status).toBe(200);
    expect(mocks.users.mock.calls[1][0].where.id).toEqual({ gt: users[499].id });
    expect(mocks.list.mock.calls[500][0].email).toBe(users[500].email);
  });

  test('rotates past repeatedly slow payment attempts so a later payment receives fresh verification', async () => {
    const a = user('a'), p1 = payment(a, 'slow1'), p2 = payment(a, 'slow2'), later = payment(a, 'later');
    mocks.users.mockResolvedValueOnce([a]).mockResolvedValueOnce([]).mockResolvedValueOnce([a]);
    mocks.list.mockResolvedValue([p1, p2, later]);
    mocks.retrieve.mockImplementation(async (id: string) => {
      if (id.startsWith('slow')) {
        vi.setSystemTime(Date.now() + 30_000);
        throw new Error('Controlled slow detail failure');
      }
      return records.get(id) ?? null;
    });
    const first = await GET(request());
    expect(first.status).toBe(503);
    expect(await first.json()).toMatchObject({ reason: 'deadline', unlocked: 0 });
    expect(state().lastPaymentAttemptByUser.get(a.id)).toBe('slow2');
    expect(mocks.retrieve.mock.calls.map(call => call[0])).toEqual(['slow1', 'slow2']);
    expect((await GET(request())).status).toBe(503); // Empty keyset tail completes, without wrapping in this call.
    const beforeRetry = mocks.retrieve.mock.calls.length;
    const retry = await GET(request());
    expect(retry.status).toBe(503);
    expect(await retry.json()).toMatchObject({ reason: 'deadline', unlocked: 1 });
    expect(mocks.retrieve.mock.calls[beforeRetry][0]).toBe('later');
    expect(mocks.grant).toHaveBeenCalledWith(expect.objectContaining({ providerReferenceId: 'dodo-pay:later', userId: a.id }));
    expect(mocks.list.mock.calls[1][0].sinceISO).toBe(new Date(NOW - PAYMENT_WINDOW).toISOString());
  });

  test('counts an already initiated grant after it settles on cancellation and starts no later work', async () => {
    const a = user('a'), first = payment(a, 'first'), later = payment(a, 'later');
    const transaction = deferred<void>(); const controller = new AbortController();
    mocks.users.mockResolvedValue([a]); mocks.list.mockResolvedValue([first, later]); mocks.grant.mockReturnValue(transaction.promise);
    const pending = GET(request(controller.signal)); await flush();
    expect(mocks.grant).toHaveBeenCalledOnce();
    controller.abort(); await flush();
    expect(state().running).toBe(true);
    expect((await GET(request())).status).toBe(409);
    transaction.resolve(undefined);
    const response = await pending;
    expect(response.status).toBe(499);
    expect(await response.json()).toMatchObject({ reason: 'aborted', unlocked: 1, pendingUsers: 1 });
    expect(mocks.retrieve.mock.calls.map(call => call[0])).toEqual(['first']);
    expect(mocks.grant).toHaveBeenCalledOnce();
    expect(state().running).toBe(false);
    expect(state().lastPaymentAttemptByUser.get(a.id)).toBe('first');
  });

  test('saturated recovery reaches the failed prefix while preserving normal cursor, cutoffs and payment markers', async () => {
    const pending = fullPendingQueue();
    const markers = new Map([['pending-0000', 'last-payment']]);
    seedState({ lastAttemptedUserId: 'z0000', pendingSinceByUser: pending, lastPaymentAttemptByUser: markers });
    const originalSince = state().passSince, originalEligibility = state().passEligibilityCutoff;
    const originalPending = new Map(pending), originalMarkers = new Map(markers);
    mocks.users.mockImplementation(selectMatchingUsers([...pending.keys()].map(user)));
    mocks.list.mockRejectedValue(new Error('Controlled retry outage'));
    const response = await GET(request());
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ reason: 'continuation_capacity', complete: false, hasMore: true, usersScanned: 500, pendingUsers: 4096 });
    expect(mocks.users.mock.calls[0][0].where.id.in).toEqual([...originalPending.keys()]);
    expect(mocks.users.mock.calls[0][0].where.id.gt).toBeUndefined();
    expect(mocks.users.mock.calls[0][0].where.OR).toBeUndefined();
    expect(state().lastAttemptedUserId).toBe('z0000');
    expect(state().lastCapacityRetryUserId).toBe('pending-0499');
    expect(state().passSince).toBe(originalSince);
    expect(state().passEligibilityCutoff).toBe(originalEligibility);
    expect(state().pendingSinceByUser).toEqual(originalPending);
    expect(state().lastPaymentAttemptByUser).toEqual(originalMarkers);
    expect(mocks.list).toHaveBeenCalledTimes(500);
    expect(mocks.grant).not.toHaveBeenCalled();
  });

  test('capacity recovery in a new pass advances its epoch conservatively without losing pending history', async () => {
    const pending = fullPendingQueue();
    const markers = new Map([['pending-0000', 'last-payment']]);
    const originalPending = new Map(pending), originalMarkers = new Map(markers);
    seedState({ passComplete: true, lastAttemptedUserId: 'previous', pendingSinceByUser: pending, lastPaymentAttemptByUser: markers });
    vi.setSystemTime(NOW + 3 * 24 * 60 * 60 * 1000);
    mocks.users.mockImplementation(selectMatchingUsers([...pending.keys()].map(user)));
    mocks.list.mockRejectedValue(new Error('Controlled retry outage'));
    const response = await GET(request());
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ reason: 'continuation_capacity', complete: false, passComplete: false, hasMore: true, usersScanned: 500 });
    expect(state().lastAttemptedUserId).toBeNull();
    expect(state().passStartedAt).toBe(Date.now());
    expect(state().passSince).toBe(NOW - PAYMENT_WINDOW);
    expect(state().passEligibilityCutoff).toBe(NOW - ACTIVITY_WINDOW);
    expect(state().pendingSinceByUser).toEqual(originalPending);
    expect(state().lastPaymentAttemptByUser).toEqual(originalMarkers);
    expect(mocks.grant).not.toHaveBeenCalled();
  });

  test('freeing a saturated retry slot resumes the preserved normal tail on the next invocation', async () => {
    const pending = fullPendingQueue(), normalTail = user('z0001');
    seedState({ lastAttemptedUserId: 'z0000', pendingSinceByUser: pending });
    mocks.users.mockImplementation(selectMatchingUsers([...pending.keys()].map(user).concat(normalTail)));
    mocks.list.mockImplementation(async ({ email }: { email: string }) => {
      if (email === user('pending-0000').email || email === normalTail.email) return [];
      throw new Error('Controlled retry outage');
    });
    const recovery = await GET(request());
    expect(recovery.status).toBe(503);
    expect(await recovery.json()).toMatchObject({ reason: 'incomplete', hasMore: true, passComplete: false, pendingUsers: 4095 });
    expect(state().lastAttemptedUserId).toBe('z0000');
    expect(state().pendingSinceByUser.has('pending-0000')).toBe(false);
    const normal = await GET(request());
    expect(normal.status).toBe(503); // Remaining retries are not misreported as complete.
    expect(mocks.users.mock.calls[1][0].where.id).toEqual({ gt: 'z0000' });
    expect(mocks.list.mock.calls.at(-1)?.[0].email).toBe(normalTail.email);
    expect(state().lastAttemptedUserId).toBe(normalTail.id);
    expect(state().lastCapacityRetryUserId).toBeNull();
    expect(state().pendingSinceByUser.size).toBe(4095);
    expect(mocks.grant).not.toHaveBeenCalled();
  });

  test('successive failed saturated batches advance their own cursor and wrap once after an empty tail', async () => {
    const pending = fullPendingQueue();
    seedState({ lastAttemptedUserId: 'z0000', pendingSinceByUser: pending });
    const originalPending = new Map(pending);
    mocks.users.mockImplementation(selectMatchingUsers([...pending.keys()].map(user)));
    mocks.list.mockRejectedValue(new Error('Controlled retry outage'));
    expect((await GET(request())).status).toBe(503);
    expect(state().lastCapacityRetryUserId).toBe('pending-0499');
    expect((await GET(request())).status).toBe(503);
    expect(mocks.users.mock.calls[1][0].where.id.gt).toBe('pending-0499');
    expect(mocks.list.mock.calls[500][0].email).toBe(user('pending-0500').email);
    expect(state().lastCapacityRetryUserId).toBe('pending-0999');
    state().lastCapacityRetryUserId = 'pending-9999'; // The retry cursor can outlive its row.
    const wrapped = await GET(request());
    expect(wrapped.status).toBe(503);
    expect(await wrapped.json()).toMatchObject({ reason: 'continuation_capacity', hasMore: true, usersScanned: 500 });
    expect(mocks.users).toHaveBeenCalledTimes(4);
    expect(mocks.users.mock.calls[2][0].where.id.gt).toBe('pending-9999');
    expect(mocks.users.mock.calls[3][0].where.id.gt).toBeUndefined();
    expect(state().lastCapacityRetryUserId).toBe('pending-0499');
    expect(state().lastAttemptedUserId).toBe('z0000');
    expect(state().pendingSinceByUser).toEqual(originalPending);
    expect(mocks.grant).not.toHaveBeenCalled();
  });

  test('an unusable saturated queue remains explicitly incomplete without evicting its retry history', async () => {
    const pending = fullPendingQueue(), originalPending = new Map(pending);
    seedState({
      lastAttemptedUserId: 'z0000', lastCapacityRetryUserId: 'pending-9999',
      pendingSinceByUser: pending,
    });
    // No matching usable rows: do not fabricate recovery by dropping their windows.
    mocks.users.mockImplementation(selectMatchingUsers([]));
    const response = await GET(request());
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      complete: false, passComplete: false, hasMore: true,
      reason: 'continuation_capacity', usersScanned: 0, pendingUsers: 4096,
    });
    expect(mocks.users).toHaveBeenCalledTimes(2); // One bounded empty-tail wrap.
    expect(state().lastAttemptedUserId).toBe('z0000');
    expect(state().pendingSinceByUser).toEqual(originalPending);
    expect(mocks.list).not.toHaveBeenCalled();
    expect(mocks.grant).not.toHaveBeenCalled();
  });
});
