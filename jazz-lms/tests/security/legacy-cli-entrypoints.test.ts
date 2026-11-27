import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  construct: vi.fn(), provider: vi.fn(), disconnect: vi.fn(), transaction: vi.fn(),
  purchaseFindMany: vi.fn(), purchaseDelete: vi.fn(), lessonFindMany: vi.fn(), lessonFindUnique: vi.fn(), lessonUpdate: vi.fn(),
  attachmentFindMany: vi.fn(), attachmentUpdate: vi.fn(), discountFindMany: vi.fn(), discountDelete: vi.fn(),
  redemptionFindMany: vi.fn(), redemptionGroupBy: vi.fn(), redemptionDelete: vi.fn(),
  lessonPurchaseFindMany: vi.fn(), lessonPurchaseDelete: vi.fn(), progressFindMany: vi.fn(), progressDelete: vi.fn(),
  voucherFindMany: vi.fn(), voucherUpdate: vi.fn(), storageList: vi.fn(),
}));
vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    constructor(...args: unknown[]) { mocks.construct(...args); }
    purchase = { findMany: mocks.purchaseFindMany, deleteMany: mocks.purchaseDelete };
    lesson = { findMany: mocks.lessonFindMany, findUnique: mocks.lessonFindUnique, update: mocks.lessonUpdate };
    attachment = { findMany: mocks.attachmentFindMany, update: mocks.attachmentUpdate };
    discountApplied = { findMany: mocks.discountFindMany, deleteMany: mocks.discountDelete };
    voucherRedemption = { findMany: mocks.redemptionFindMany, groupBy: mocks.redemptionGroupBy, deleteMany: mocks.redemptionDelete };
    lessonPurchase = { findMany: mocks.lessonPurchaseFindMany, deleteMany: mocks.lessonPurchaseDelete };
    userProgress = { findMany: mocks.progressFindMany, deleteMany: mocks.progressDelete };
    voucherCode = { findMany: mocks.voucherFindMany, update: mocks.voucherUpdate };
    $transaction = mocks.transaction;
    $disconnect = mocks.disconnect;
  },
  VoucherType: { DISCOUNT_PERCENT: 'DISCOUNT_PERCENT', FREE_ACCESS: 'FREE_ACCESS' },
}));
vi.mock('@supabase/supabase-js', () => ({ createClient: (...args: unknown[]) => {
  mocks.provider(...args);
  return { storage: { from: () => ({ list: mocks.storageList }) } };
} }));

const entrypoints = [
  ['scripts/create-admin.ts', () => import('../../scripts/create-admin')],
  ['scripts/seed-admin-test-voucher.ts', () => import('../../scripts/seed-admin-test-voucher')],
  ['scripts/seed-cleanup-vouchers.ts', () => import('../../scripts/seed-cleanup-vouchers')],
  ['scripts/wipe-user-activity.ts', () => import('../../scripts/wipe-user-activity')],
  ['scripts/wipe-auth-users.ts', () => import('../../scripts/wipe-auth-users')],
  ['scripts/reset-user-voucher-state.ts', () => import('../../scripts/reset-user-voucher-state')],
  ['scripts/fix-course-price.ts', () => import('../../scripts/fix-course-price')],
  ['scripts/apply-mux-playback-ids.ts', () => import('../../scripts/apply-mux-playback-ids')],
  ['scripts/update-mux-playback-ids.ts', () => import('../../scripts/update-mux-playback-ids')],
  ['scripts/remap-attachments-to-bucket.ts', () => import('../../scripts/remap-attachments-to-bucket')],
  ['scripts/sync-supabase-pdf-attachments.ts', () => import('../../scripts/sync-supabase-pdf-attachments')],
  ['scripts/sync-jazz-lesson-metadata.ts', () => import('../../scripts/sync-jazz-lesson-metadata')],
  ['scripts/import-lesson-quiz-bank.ts', () => import('../../scripts/import-lesson-quiz-bank')],
  ['prisma/seed.ts', () => import('../../prisma/seed')],
  ['prisma/seed-sample.ts', () => import('../../prisma/seed-sample')],
] as const;
const providerEntrypoints = entrypoints.filter(([path]) => ['scripts/wipe-auth-users.ts', 'scripts/remap-attachments-to-bucket.ts', 'scripts/sync-supabase-pdf-attachments.ts'].includes(path));
const exitCode = process.exitCode;
const originalArgv = process.argv;
let logs: ReturnType<typeof vi.spyOn>;
let errors: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
  vi.stubEnv('NODE_ENV', 'test');
  vi.stubEnv('VERCEL_ENV', '');
  vi.stubEnv('ENABLE_LOCAL_LEGACY_MUTATIONS', '1');
  vi.stubEnv('DATABASE_URL', 'postgresql://postgres@127.0.0.1:55432/jazz_maintenance');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:56121');
  vi.stubEnv('SUPABASE_URL', '');
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'synthetic-local-service-key');
  vi.stubEnv('SUPABASE_STORAGE_BUCKET', 'synthetic-local-bucket');
  process.argv = ['node', 'isolated-test'];
  logs = vi.spyOn(console, 'log').mockImplementation(() => {});
  errors = vi.spyOn(console, 'error').mockImplementation(() => {});
  mocks.disconnect.mockResolvedValue(undefined);
});
afterEach(() => {
  process.exitCode = exitCode;
  process.argv = originalArgv;
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe.each([
  ['default-off', () => vi.stubEnv('ENABLE_LOCAL_LEGACY_MUTATIONS', undefined)],
  ['ambient production datasource', () => vi.stubEnv('DATABASE_URL', 'postgresql://fixture:private-marker@project.supabase.co:5432/postgres')],
  ['production runtime', () => vi.stubEnv('NODE_ENV', 'production')],
] as const)('all inventoried legacy entrypoints reject %s', (_label, setup) => {
  test.each(entrypoints)('%s stops before any database/provider client is constructed', async (_entrypoint, load) => {
    setup();
    await expect(load()).rejects.toThrow(/Legacy mutation blocked/);
    expect(mocks.construct).not.toHaveBeenCalled();
    expect(mocks.provider).not.toHaveBeenCalled();
    expect(mocks.purchaseFindMany).not.toHaveBeenCalled();
    expect(mocks.storageList).not.toHaveBeenCalled();
  });
});

test.each(providerEntrypoints)('%s rejects remote Auth/storage even with an allowed local DB', async (_entrypoint, load) => {
  vi.stubEnv('SUPABASE_URL', 'https://private-marker.supabase.co');
  await expect(load()).rejects.toThrow(/invalid supabase/);
  expect(mocks.construct).not.toHaveBeenCalled();
  expect(mocks.provider).not.toHaveBeenCalled();
});

function mockResetReads() {
  mocks.purchaseFindMany.mockResolvedValue([{ id: 'purchase-scoped', courseId: 'course-scoped', voucherId: 'voucher-scoped' }]);
  mocks.lessonFindMany.mockResolvedValue([{ id: 'lesson-scoped' }]);
  mocks.discountFindMany.mockResolvedValue([{ id: 'discount-scoped', purchaseId: 'purchase-scoped', voucherId: 'voucher-scoped' }]);
  mocks.redemptionFindMany.mockResolvedValue([{ id: 'redemption-scoped', voucherId: 'voucher-scoped', userId: 'user-scoped', purchaseId: 'purchase-scoped' }]);
  mocks.lessonPurchaseFindMany.mockResolvedValue([{ id: 'lesson-purchase-scoped', lessonId: 'lesson-scoped' }]);
  mocks.progressFindMany.mockResolvedValue([{ id: 'progress-scoped', lessonId: 'lesson-scoped' }]);
  mocks.voucherFindMany.mockResolvedValue([{ id: 'voucher-scoped', code: 'SCOPED', currentUses: 1 }]);
  mocks.redemptionGroupBy.mockResolvedValue([{ voucherId: 'voucher-scoped', _count: { _all: 1 } }]);
  mocks.transaction.mockImplementation((input: unknown) => {
    if (!Array.isArray(input)) throw new Error('The default plan attempted a mutation transaction.');
    return Promise.all(input);
  });
}

test('default reset plans existing rows without deleting or updating, and bounds --codes to the scoped purchase vouchers', async () => {
  process.argv = ['node', 'script', '--user-id=user-scoped', '--course-id=course-scoped', '--codes=SCOPED,OTHER'];
  mockResetReads();
  await (await import('../../scripts/reset-user-voucher-state')).voucherReset;
  expect(mocks.purchaseFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'user-scoped', courseId: 'course-scoped' } }));
  expect(mocks.voucherFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: { in: ['voucher-scoped'] }, code: { in: ['SCOPED', 'OTHER'] } } }));
  for (const action of [mocks.purchaseDelete, mocks.discountDelete, mocks.redemptionDelete, mocks.lessonPurchaseDelete, mocks.progressDelete, mocks.voucherUpdate]) expect(action).not.toHaveBeenCalled();
  expect(logs).toHaveBeenCalledWith(expect.stringContaining('"dryRun": true'));
  expect(mocks.disconnect).toHaveBeenCalledOnce();
});

test('reset refuses missing course scope before querying rows', async () => {
  process.argv = ['node', 'script', '--user-id=user-scoped', '--apply'];
  await (await import('../../scripts/reset-user-voucher-state')).voucherReset;
  expect(mocks.purchaseFindMany).not.toHaveBeenCalled();
  expect(mocks.transaction).not.toHaveBeenCalled();
  expect(process.exitCode).toBe(1);
});

test('explicit --apply deletes only the mocked user/course rows and decrements their voucher', async () => {
  process.argv = ['node', 'script', '--user-id=user-scoped', '--course-id=course-scoped', '--apply'];
  mockResetReads();
  for (const action of [mocks.purchaseDelete, mocks.discountDelete, mocks.redemptionDelete, mocks.lessonPurchaseDelete, mocks.progressDelete]) action.mockResolvedValue({ count: 1 });
  mocks.voucherUpdate.mockResolvedValue({});
  mocks.transaction.mockImplementation((input: unknown) => {
    if (Array.isArray(input)) return Promise.all(input);
    if (typeof input !== 'function') throw new Error('Invalid isolated transaction.');
    return input({
      discountApplied: { deleteMany: mocks.discountDelete },
      voucherRedemption: { deleteMany: mocks.redemptionDelete },
      lessonPurchase: { deleteMany: mocks.lessonPurchaseDelete },
      userProgress: { deleteMany: mocks.progressDelete },
      purchase: { deleteMany: mocks.purchaseDelete },
      voucherCode: { update: mocks.voucherUpdate },
    });
  });
  await (await import('../../scripts/reset-user-voucher-state')).voucherReset;
  expect(mocks.purchaseDelete).toHaveBeenCalledExactlyOnceWith({ where: { id: { in: ['purchase-scoped'] } } });
  expect(mocks.lessonPurchaseDelete).toHaveBeenCalledExactlyOnceWith({ where: { userId: 'user-scoped', lessonId: { in: ['lesson-scoped'] } } });
  expect(mocks.progressDelete).toHaveBeenCalledExactlyOnceWith({ where: { userId: 'user-scoped', lessonId: { in: ['lesson-scoped'] } } });
  expect(mocks.voucherUpdate).toHaveBeenCalledExactlyOnceWith({ where: { id: 'voucher-scoped' }, data: { currentUses: 0 } });
  expect(logs).toHaveBeenCalledWith(expect.stringContaining('"dryRun": false'));
});

test('attachment remap dry-run logs identifiers/counts without signed URLs or private filenames', async () => {
  mocks.storageList.mockResolvedValue({ data: [{ name: 'Clase 1 synthetic.pdf' }, { name: 'private-marker.pdf' }], error: null });
  mocks.attachmentFindMany.mockResolvedValue([
    { id: 'attachment-scoped', name: 'Clase 1 private-marker', language: 'es', kind: 'CLASS', documentKey: 'class-1', url: 'https://storage.invalid/file.pdf?token=private-marker' },
    { id: 'attachment-unmatched', name: 'private-marker', language: 'es', kind: 'CLASS', documentKey: '', url: 'https://storage.invalid/file.pdf?token=private-marker' },
  ]);
  await (await import('../../scripts/remap-attachments-to-bucket')).attachmentRemap;
  expect(mocks.attachmentUpdate).not.toHaveBeenCalled();
  const output = JSON.stringify([...logs.mock.calls, ...errors.mock.calls]);
  expect(output).toContain('attachment-scoped');
  expect(output).toContain('attachment-unmatched');
  expect(output).not.toContain('private-marker');
  expect(output).not.toContain('https://');
});

test('an ambient URL loaded during Prisma construction cannot retarget the attachment provider', async () => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', undefined);
  vi.stubEnv('SUPABASE_URL', 'http://127.0.0.1:56121');
  mocks.construct.mockImplementation(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://project.supabase.co');
    vi.stubEnv('DATABASE_URL', 'postgresql://fixture:private-marker@project.supabase.co:5432/postgres');
  });
  mocks.storageList.mockResolvedValue({ data: [], error: null });
  mocks.attachmentFindMany.mockResolvedValue([]);
  await (await import('../../scripts/remap-attachments-to-bucket')).attachmentRemap;
  expect(mocks.construct).toHaveBeenCalledExactlyOnceWith({ datasources: { db: { url: 'postgresql://postgres@127.0.0.1:55432/jazz_maintenance' } } });
  expect(mocks.provider).toHaveBeenCalledExactlyOnceWith('http://127.0.0.1:56121', 'synthetic-local-service-key');
});

test('Mux mapping updates only mocked rows and never logs the old signed video URL', async () => {
  mocks.lessonFindUnique.mockImplementation(async ({ where }: { where: { id: string } }) => ({
    id: where.id, title: 'Esencia Gospel Ritmo Jamming Colaborativa Instrumentos Pequenos Bessie Smith Ella Fitzgerald',
    videoUrl: 'https://stream.mux.com/private.m3u8?token=private-marker',
  }));
  mocks.lessonUpdate.mockResolvedValue({});
  await (await import('../../scripts/update-mux-playback-ids')).muxPlaybackUpdate;
  expect(mocks.lessonUpdate).toHaveBeenCalledTimes(9);
  const output = JSON.stringify([...logs.mock.calls, ...errors.mock.calls]);
  expect(output).toContain('lessonId=');
  expect(output).not.toContain('private-marker');
  expect(output).not.toContain('https://');
});

test.each(['remap', 'mux'] as const)('%s omits provider exceptions carrying signed URLs', async script => {
  const failure = new Error('https://storage.invalid/file.pdf?token=private-marker');
  if (script === 'remap') {
    mocks.storageList.mockRejectedValue(failure);
    await (await import('../../scripts/remap-attachments-to-bucket')).attachmentRemap;
  } else {
    mocks.lessonFindUnique.mockRejectedValue(failure);
    await (await import('../../scripts/update-mux-playback-ids')).muxPlaybackUpdate;
  }
  expect(process.exitCode).toBe(1);
  expect(JSON.stringify([...logs.mock.calls, ...errors.mock.calls])).not.toContain('private-marker');
  expect(mocks.disconnect).toHaveBeenCalledOnce();
});

test.each(['remap', 'mux'] as const)('%s omits cleanup exceptions carrying signed URLs', async script => {
  mocks.disconnect.mockRejectedValue(new Error('https://storage.invalid/file.pdf?token=private-marker'));
  if (script === 'remap') {
    mocks.storageList.mockResolvedValue({ data: [], error: null });
    mocks.attachmentFindMany.mockResolvedValue([]);
    await (await import('../../scripts/remap-attachments-to-bucket')).attachmentRemap;
  } else {
    mocks.lessonFindUnique.mockResolvedValue(null);
    await (await import('../../scripts/update-mux-playback-ids')).muxPlaybackUpdate;
  }
  expect(process.exitCode).toBe(1);
  expect(JSON.stringify([...logs.mock.calls, ...errors.mock.calls])).not.toContain('private-marker');
});
