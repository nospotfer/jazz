import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { Permission } from '@/lib/admin/permissions';

// The preceding implementation captures this setting when its modules load.
vi.hoisted(() => { vi.stubEnv('ADMIN_OWNER_EMAIL', 'owner@example.test'); });

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  findUser: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  upsertUser: vi.fn(),
  deleteUser: vi.fn(),
  fetch: vi.fn(),
}));

vi.mock('react', () => ({ cache: <T>(callback: T) => callback }));
vi.mock('@/utils/supabase/server', () => ({
  createClient: () => ({ auth: { getUser: mocks.getUser } }),
}));
vi.mock('@/lib/db', () => ({ db: { user: {
  findUnique: mocks.findUser,
  create: mocks.createUser,
  update: mocks.updateUser,
  upsert: mocks.upsertUser,
  delete: mocks.deleteUser,
} } }));
vi.mock('next/navigation', () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); } }));

import { can, getCurrentUser, isAdmin, requireAdmin, requirePermission } from '@/lib/admin';
import { ensureAdminApiPermission } from '@/lib/admin-api';

const actor = { id: 'verified-admin-actor', email: 'owner@example.test' };
const storedUser = { ...actor, role: 'SUPER_ADMIN' };

function identity(user: unknown = actor, error: unknown = null) {
  mocks.getUser.mockResolvedValue({ data: { user }, error });
}

async function assertPermission(helper: 'page' | 'api', allowed: boolean, permission: Permission = 'admin.access', status = 403) {
  if (helper === 'page') {
    expect(await can(permission)).toBe(allowed);
  } else {
    const result = await ensureAdminApiPermission(permission);
    expect(result.ok).toBe(allowed);
    if (!result.ok) expect(result.response.status).toBe(status);
    expect(result.userId).toBe(status === 401 ? null : actor.id);
  }
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('ADMIN_OWNER_EMAIL', actor.email);
  vi.stubGlobal('fetch', mocks.fetch);
  mocks.fetch.mockImplementation(() => { throw new Error('External requests are disabled in this test'); });
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  identity();
  mocks.findUser.mockResolvedValue(storedUser);
  mocks.createUser.mockResolvedValue(storedUser);
  mocks.updateUser.mockResolvedValue(storedUser);
});

afterEach(() => {
  expect(mocks.createUser).not.toHaveBeenCalled();
  expect(mocks.updateUser).not.toHaveBeenCalled();
  expect(mocks.upsertUser).not.toHaveBeenCalled();
  expect(mocks.deleteUser).not.toHaveBeenCalled();
  expect(mocks.fetch).not.toHaveBeenCalled();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe.each(['page', 'api'] as const)('%s authorization', (helper) => {
  test.each([
    ['no identity', null],
    ['missing email', { id: actor.id }],
    ['empty email', { ...actor, email: '' }],
    ['missing ID', { email: actor.email }],
    ['empty ID', { ...actor, id: '' }],
  ])('denies %s before database lookup', async (_name, user) => {
    identity(user);
    await assertPermission(helper, false, 'admin.access', 401);
    expect(mocks.findUser).not.toHaveBeenCalled();
  });

  test('denies an Auth error even when user data is also returned', async () => {
    identity(actor, new Error('Identity could not be verified'));
    await assertPermission(helper, false, 'admin.access', 401);
    expect(mocks.findUser).not.toHaveBeenCalled();
  });

  test('denies an Auth service failure before database lookup', async () => {
    mocks.getUser.mockRejectedValue(new Error('Auth service unavailable'));
    await assertPermission(helper, false, 'admin.access', 401);
    expect(mocks.findUser).not.toHaveBeenCalled();
  });

  test('denies the owner when the database is unavailable', async () => {
    mocks.findUser.mockRejectedValue(new Error('Database unavailable'));
    await assertPermission(helper, false);
    await assertPermission(helper, false, 'analytics.read');
  });

  test('does not provision a missing owner during permission lookup', async () => {
    mocks.findUser.mockResolvedValue(null);
    await assertPermission(helper, false);
  });

  test('does not promote an existing owner USER', async () => {
    mocks.findUser.mockResolvedValue({ ...storedUser, role: 'USER' });
    await assertPermission(helper, false);
    await assertPermission(helper, false, 'analytics.read');
  });

  test('denies a stale privileged row with the same email and a different Auth ID', async () => {
    mocks.findUser.mockResolvedValue({ ...storedUser, id: 'previous-auth-identity' });
    await assertPermission(helper, false);
  });

  test('denies a privileged row with the same Auth ID and a different email', async () => {
    mocks.findUser.mockResolvedValue({ ...storedUser, email: 'previous-owner@example.test' });
    await assertPermission(helper, false);
  });

  test('permits matching identity with email case differences', async () => {
    mocks.findUser.mockResolvedValue({ ...storedUser, email: actor.email.toUpperCase() });
    await assertPermission(helper, true);
  });

  test('does not elevate an ordinary USER', async () => {
    const ordinary = { ...actor, email: 'student@example.test' };
    identity(ordinary);
    mocks.findUser.mockResolvedValue({ ...ordinary, role: 'USER' });
    await assertPermission(helper, false);
  });

  test('denies an unrecognized stored role', async () => {
    mocks.findUser.mockResolvedValue({ ...storedUser, role: 'ADMIN' });
    await assertPermission(helper, false);
  });

  const permissions: Permission[] = ['admin.access', 'analytics.read', 'courses.create', 'users.read', 'vouchers.update', 'settings.update'];
  test.each([
    ['SUPER_ADMIN', [true, true, true, true, true, true]],
    ['COURSE_ADMIN', [true, true, true, false, true, false]],
    ['CONTENT_CREATOR', [true, false, true, false, false, false]],
    ['MODERATOR', [true, false, false, true, false, false]],
  ] as const)('preserves the recorded %s permissions', async (role, expected) => {
    mocks.findUser.mockResolvedValue({ ...storedUser, role });
    for (let index = 0; index < permissions.length; index += 1) {
      await assertPermission(helper, expected[index], permissions[index]);
    }
  });
});

describe('page authorization consumers', () => {
  test('returns the stored USER without owner promotion', async () => {
    const user = { ...storedUser, role: 'USER' };
    mocks.findUser.mockResolvedValue(user);
    expect(await getCurrentUser()).toEqual(user);
    expect(await isAdmin()).toBe(false);
  });

  test('returns no current application user after a failed role lookup', async () => {
    mocks.findUser.mockRejectedValue(new Error('Database unavailable'));
    expect(await getCurrentUser()).toBeNull();
    expect(await isAdmin()).toBe(false);
  });

  test('denies privileged page guards before their protected work can continue', async () => {
    mocks.findUser.mockRejectedValue(new Error('Database unavailable'));
    await expect(requireAdmin()).rejects.toThrow('redirect:/dashboard');
    await expect(requirePermission('analytics.read')).rejects.toThrow('redirect:/dashboard');
  });
});
