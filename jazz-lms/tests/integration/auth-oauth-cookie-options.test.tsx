// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ signInWithOAuth: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }) }));
vi.mock('@/components/providers/language-provider', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/utils/supabase/client', () => ({ createClient: () => ({ auth: {
  getSession: async () => ({ data: { session: null } }),
  signOut: async () => ({ error: null }),
  onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
  signInWithOAuth: mocks.signInWithOAuth,
} }) }));

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key-for-tests');
  window.history.replaceState({}, '', '/auth');
  mocks.signInWithOAuth.mockResolvedValue({ data: null, error: new Error('Provider unavailable in this test') });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllEnvs(); });

test('all manual OAuth context cookies are Secure, short-lived nonsensitive hints', async () => {
  const cookieSetter = vi.spyOn(document, 'cookie', 'set').mockImplementation(() => {});
  const AuthPage = (await import('@/app/auth/page')).default;
  render(<AuthPage />);
  fireEvent.click(screen.getByRole('button', { name: /sign in with google/i }));
  await waitFor(() => expect(mocks.signInWithOAuth).toHaveBeenCalledOnce());
  const cookies = cookieSetter.mock.calls.map(([value]) => value);
  expect(cookies).toHaveLength(3);
  expect(cookies.map((cookie) => cookie.split('=')[0])).toEqual(['oauth_flow', 'oauth_lang', 'oauth_next']);
  for (const cookie of cookies) {
    expect(cookie).toMatch(/; secure(?:;|$)/i);
    expect(cookie).toContain('max-age=600');
    expect(cookie).toContain('samesite=lax');
    expect(cookie).not.toMatch(/password|access_token|refresh_token|code_verifier/i);
  }
});
