import { beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getUser: vi.fn(),
}));

vi.mock('react', () => ({ cache: <T>(fn: T) => fn }));
vi.mock('@/utils/supabase/server', () => ({
  createClient: () => ({
    auth: { getSession: mocks.getSession, getUser: mocks.getUser },
  }),
}));

import { getServerUser } from '@/lib/server-user';

describe('server user authentication', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Request cookies are client-controlled, including the stored user object.
    mocks.getSession.mockResolvedValue({
      data: { session: { user: { id: 'forged-admin' } } },
      error: null,
    });
  });

  test('uses the verified user instead of a user stored in cookies', async () => {
    const verifiedUser = { id: 'verified-student', email: 'student@example.test' };
    mocks.getUser.mockResolvedValue({ data: { user: verifiedUser }, error: null });

    expect(await getServerUser()).toBe(verifiedUser);
    expect(mocks.getUser).toHaveBeenCalledOnce();
    expect(mocks.getSession).not.toHaveBeenCalled();
  });

  test('rejects a forged cookie user when the auth server finds no valid user', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });

    expect(await getServerUser()).toBeNull();
    expect(mocks.getSession).not.toHaveBeenCalled();
  });

  test('fails closed when validation returns an error even with user data', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'unverified-user' } },
      error: new Error('Token validation failed'),
    });

    expect(await getServerUser()).toBeNull();
  });

  test('fails closed when the auth service throws', async () => {
    mocks.getUser.mockRejectedValue(new Error('Auth service unavailable'));

    expect(await getServerUser()).toBeNull();
  });
});
