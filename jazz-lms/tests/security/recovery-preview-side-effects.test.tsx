// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  router: { push: vi.fn(), replace: vi.fn(), refresh: vi.fn() },
  auth: { getSession: vi.fn(), getUser: vi.fn(), signInWithPassword: vi.fn(), updateUser: vi.fn(),
    signOut: vi.fn(), signInWithOAuth: vi.fn(), onAuthStateChange: vi.fn() },
  fetch: vi.fn(), capture: vi.fn(), isCurrent: vi.fn(),
}));
vi.mock('next/navigation', () => ({ useRouter: () => mocks.router }));
vi.mock('@/components/providers/language-provider', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/utils/supabase/client', () => ({ createClient: () => ({ auth: mocks.auth }) }));
vi.mock('@/hooks/use-auth-owner', () => ({ useAuthOwner: () => ({ ready: true, capture: mocks.capture, isCurrent: mocks.isCurrent }) }));

import AuthPage from '@/app/auth/page';
import { DashboardPurchaseAutoReconcile } from '@/components/dashboard/dashboard-purchase-auto-reconcile';

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('NEXT_PUBLIC_RECOVERY_ACCESS', 'true');
  vi.stubEnv('NEXT_PUBLIC_APP_URL', window.location.origin);
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://synthetic.supabase.co');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', `sb_publishable_${'s'.repeat(24)}`);
  vi.stubGlobal('fetch', mocks.fetch);
  window.localStorage.clear(); window.history.replaceState({}, '', '/auth');
  mocks.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
  mocks.auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
  mocks.auth.getUser.mockResolvedValue({ data: { user: { id: 'synthetic-recovered-owner', user_metadata: { avatar_mode: 'random' } } }, error: null });
  mocks.auth.signInWithPassword.mockResolvedValue({ error: null });
  mocks.auth.updateUser.mockResolvedValue({ error: null });
  mocks.fetch.mockImplementation(async (path: string) => {
    if (!['/api/auth/session', '/api/purchases/auto-reconcile'].includes(path)) throw new Error('Unexpected request in recovery fixture');
    return new Response('{}', { status: 200 });
  });
  mocks.capture.mockReturnValue({ ownerId: 'synthetic-recovered-owner', generation: 1 });
  mocks.isCurrent.mockReturnValue(true);
});
afterEach(() => { cleanup(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

test('recovery password login synchronizes its session and navigates without changing Auth metadata', async () => {
  render(<AuthPage />);
  await waitFor(() => expect(mocks.auth.getSession).toHaveBeenCalledOnce());
  mocks.auth.getSession.mockResolvedValue({ data: { session: { access_token: 'synthetic-access', refresh_token: 'synthetic-refresh' } }, error: null });
  fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'owner@example.test' } });
  fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'synthetic-password' } });
  fireEvent.submit(screen.getByLabelText(/^email$/i).closest('form')!);
  await waitFor(() => expect(mocks.router.replace).toHaveBeenCalledWith('/dashboard'));
  expect(mocks.auth.signInWithPassword).toHaveBeenCalledOnce();
  expect(mocks.fetch).toHaveBeenCalledExactlyOnceWith('/api/auth/session', expect.objectContaining({ method: 'POST' }));
  expect(mocks.auth.updateUser).not.toHaveBeenCalled();
});

test('recovery disables registration, OAuth and password recovery entry points even with register query parameters', async () => {
  window.history.replaceState({}, '', '/auth?tab=register&flow=register'); render(<AuthPage />);
  for (const name of [/^Register$/, /^Sign up$/, /Google/, /Forgot your password/]) {
    const button = screen.getByRole('button', { name });
    expect((button as HTMLButtonElement).disabled).toBe(true); fireEvent.click(button);
  }
  expect(screen.queryByLabelText(/full name/i)).toBeNull();
  expect(mocks.auth.signInWithOAuth).not.toHaveBeenCalled(); expect(mocks.fetch).not.toHaveBeenCalled();
  expect(mocks.router.push).not.toHaveBeenCalled();
});

test('recovery dashboard never starts automatic purchase reconciliation', () => {
  render(<DashboardPurchaseAutoReconcile />); expect(mocks.fetch).not.toHaveBeenCalled();
});

test('ordinary preview retains its existing automatic purchase reconciliation', async () => {
  vi.stubEnv('NEXT_PUBLIC_RECOVERY_ACCESS', 'false'); render(<DashboardPurchaseAutoReconcile />);
  await waitFor(() => expect(mocks.fetch).toHaveBeenCalledExactlyOnceWith('/api/purchases/auto-reconcile', expect.objectContaining({ method: 'POST' })));
});
