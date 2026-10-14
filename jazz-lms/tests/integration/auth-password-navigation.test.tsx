// @vitest-environment jsdom

import type { AuthChangeEvent } from '@supabase/supabase-js';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  router: { push: vi.fn(), replace: vi.fn(), refresh: vi.fn() },
  auth: {
    getSession: vi.fn(), getUser: vi.fn(), signInWithPassword: vi.fn(),
    updateUser: vi.fn(), signOut: vi.fn(), onAuthStateChange: vi.fn(),
  },
  fetch: vi.fn(),
  listeners: new Set<(event: AuthChangeEvent, session: unknown) => void>(),
  unsubscribe: vi.fn(),
}));

vi.mock('next/navigation', () => ({ useRouter: () => mocks.router }));
vi.mock('@/components/providers/language-provider', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/utils/supabase/client', () => ({ createClient: () => ({ auth: mocks.auth }) }));

const syntheticUser = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'navigation-fixture@example.test',
  user_metadata: { avatar_mode: 'random' },
};
const syntheticSession = {
  access_token: 'synthetic-access',
  refresh_token: 'synthetic-refresh',
  user: syntheticUser,
};
const signedIn = { data: { user: syntheticUser, session: syntheticSession }, error: null };
const sessionResult = { data: { session: syntheticSession }, error: null };
type SessionResult = { data: { session: typeof syntheticSession | null }; error: null };

let finishPending: Array<() => void>;

function deferred<T>(fallback: T) {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  finishPending.push(() => resolve(fallback));
  return { promise, resolve, reject };
}

function emit(event: AuthChangeEvent = 'SIGNED_IN') {
  for (const listener of mocks.listeners) listener(event, syntheticSession);
}

async function flush() {
  await act(async () => { await Promise.resolve(); });
}

async function renderAuth() {
  const AuthPage = (await import('@/app/auth/page')).default;
  const view = render(<AuthPage />);
  await flush();
  return view;
}

function submitPassword() {
  const email = screen.getByLabelText(/^email$/i);
  fireEvent.change(email, { target: { value: syntheticUser.email } });
  fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'synthetic-pass' } });
  const form = email.closest('form');
  expect(form).not.toBeNull();
  fireEvent.submit(form!);
}

function noPasswordEvent() {
  mocks.auth.signInWithPassword.mockResolvedValue(signedIn);
}

function expectNoNavigation() {
  expect(mocks.router.replace).not.toHaveBeenCalled();
  expect(mocks.router.refresh).not.toHaveBeenCalled();
  expect(mocks.router.push).not.toHaveBeenCalled();
}

async function expectOnePasswordNavigation() {
  await waitFor(() => expect(mocks.router.replace).toHaveBeenCalledOnce());
  expect(mocks.router.replace).toHaveBeenCalledWith('/dashboard');
  expect(mocks.router.refresh).toHaveBeenCalledOnce();
  expect(mocks.router.push).not.toHaveBeenCalled();
}

beforeEach(() => {
  vi.resetAllMocks();
  finishPending = [];
  mocks.listeners.clear();
  window.localStorage.clear();
  window.history.replaceState({}, '', '/auth');
  vi.stubEnv('NEXT_PUBLIC_APP_URL', window.location.origin);
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://synthetic.supabase.co');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'sb_publishable_' + 's'.repeat(24));
  mocks.auth.getSession.mockResolvedValue(sessionResult)
    .mockResolvedValueOnce({ data: { session: null }, error: null });
  mocks.auth.getUser.mockResolvedValue({ data: { user: syntheticUser }, error: null });
  mocks.auth.updateUser.mockResolvedValue({ data: { user: syntheticUser }, error: null });
  mocks.auth.signOut.mockResolvedValue({ error: null });
  mocks.auth.signInWithPassword.mockImplementation(async () => {
    // Supabase emits this before signInWithPassword resolves to its caller.
    emit();
    return signedIn;
  });
  mocks.auth.onAuthStateChange.mockImplementation((listener: (event: AuthChangeEvent, session: unknown) => void) => {
    mocks.listeners.add(listener);
    return { data: { subscription: { unsubscribe: () => {
      mocks.unsubscribe();
      mocks.listeners.delete(listener);
    } } } };
  });
  mocks.fetch.mockImplementation(async (input: unknown) => {
    if (input !== '/api/auth/session') throw new Error('Unexpected request in closed auth test');
    return new Response('{}', { status: 200 });
  });
  vi.stubGlobal('fetch', mocks.fetch);
});

afterEach(async () => {
  cleanup();
  // Complete owned promises after unmount so a failed assertion cannot leak
  // unfinished password work into the next case.
  await act(async () => { for (const finish of finishPending) finish(); });
  await flush();
  mocks.listeners.clear();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('password login owns navigation until server cookies and profile work finish', () => {
  test('SIGNED_IN cannot redirect while server-cookie synchronization is pending', async () => {
    const sync = deferred(new Response('{}', { status: 200 }));
    mocks.fetch.mockReturnValue(sync.promise);
    await renderAuth();
    submitPassword();
    await waitFor(() => expect(mocks.fetch).toHaveBeenCalledOnce());

    expect(mocks.fetch).toHaveBeenCalledWith('/api/auth/session', expect.objectContaining({
      method: 'POST', body: JSON.stringify({ accessToken: 'synthetic-access', refreshToken: 'synthetic-refresh' }),
    }));
    expectNoNavigation();
    expect(mocks.auth.getUser).not.toHaveBeenCalled();
    expect(mocks.auth.updateUser).not.toHaveBeenCalled();

    await act(async () => { sync.resolve(new Response('{}', { status: 200 })); });
    await expectOnePasswordNavigation();
  });

  test('SIGNED_IN cannot redirect while the awaited avatar update is pending', async () => {
    const profile = deferred({ data: { user: syntheticUser }, error: null });
    mocks.auth.updateUser.mockReturnValue(profile.promise);
    await renderAuth();
    submitPassword();
    await waitFor(() => expect(mocks.auth.updateUser).toHaveBeenCalledOnce());
    await act(async () => { emit(); });
    expectNoNavigation();

    await act(async () => { profile.resolve({ data: { user: syntheticUser }, error: null }); });
    await expectOnePasswordNavigation();
  });

  test('successful password authentication and its SIGNED_IN event navigate exactly once', async () => {
    await renderAuth();
    submitPassword();
    await waitFor(() => expect(mocks.auth.updateUser).toHaveBeenCalledOnce());
    await flush();
    await expectOnePasswordNavigation();
    expect(mocks.auth.signInWithPassword).toHaveBeenCalledOnce();
    expect(mocks.fetch).toHaveBeenCalledOnce();
  });

  test('a delayed initial getSession cannot bypass a pending password cookie sync', async () => {
    const initial = deferred<SessionResult>(sessionResult);
    const sync = deferred(new Response('{}', { status: 200 }));
    mocks.auth.getSession.mockReset().mockReturnValueOnce(initial.promise).mockResolvedValue(sessionResult);
    mocks.fetch.mockReturnValue(sync.promise);
    noPasswordEvent();
    await renderAuth();
    submitPassword();
    await waitFor(() => expect(mocks.fetch).toHaveBeenCalledOnce());

    await act(async () => { initial.resolve(sessionResult); });
    expectNoNavigation();
    await act(async () => { sync.resolve(new Response('{}', { status: 200 })); });
    await expectOnePasswordNavigation();
  });

  test('a delayed initial getSession cannot navigate again after password login completed', async () => {
    const initial = deferred<SessionResult>(sessionResult);
    mocks.auth.getSession.mockReset().mockReturnValueOnce(initial.promise).mockResolvedValue(sessionResult);
    noPasswordEvent();
    await renderAuth();
    submitPassword();
    await expectOnePasswordNavigation();

    await act(async () => { initial.resolve(sessionResult); });
    expect(mocks.router.replace).toHaveBeenCalledOnce();
    expect(mocks.router.refresh).toHaveBeenCalledOnce();
  });

  test.each(['http failure', 'network failure'])('failed server-session sync (%s) cannot navigate despite SIGNED_IN', async (failure) => {
    if (failure === 'http failure') mocks.fetch.mockResolvedValue(new Response('{}', { status: 500 }));
    else mocks.fetch.mockRejectedValue(new Error('Synthetic cookie synchronization failure'));
    await renderAuth();
    submitPassword();

    expect(await screen.findByText('Unable to sign in. Please try again.')).toBeTruthy();
    expectNoNavigation();
    expect(mocks.auth.getUser).not.toHaveBeenCalled();
    expect(mocks.auth.updateUser).not.toHaveBeenCalled();
  });

  test('late initial session resolution cannot undo a failed password synchronization', async () => {
    const initial = deferred<SessionResult>(sessionResult);
    mocks.auth.getSession.mockReset().mockReturnValueOnce(initial.promise).mockResolvedValue(sessionResult);
    mocks.fetch.mockResolvedValue(new Response('{}', { status: 500 }));
    noPasswordEvent();
    await renderAuth();
    submitPassword();
    expect(await screen.findByText('Unable to sign in. Please try again.')).toBeTruthy();

    await act(async () => { initial.resolve(sessionResult); });
    expectNoNavigation();
  });

  test.each(['cookie sync', 'profile update'])('unmount during pending %s prevents a later redirect', async (phase) => {
    const sync = deferred(new Response('{}', { status: 200 }));
    const profile = deferred({ data: { user: syntheticUser }, error: null });
    noPasswordEvent();
    if (phase === 'cookie sync') mocks.fetch.mockReturnValue(sync.promise);
    else mocks.auth.updateUser.mockReturnValue(profile.promise);
    const view = await renderAuth();
    submitPassword();
    await waitFor(() => expect(phase === 'cookie sync' ? mocks.fetch : mocks.auth.updateUser).toHaveBeenCalledOnce());
    expectNoNavigation();

    view.unmount();
    expect(mocks.unsubscribe).toHaveBeenCalledOnce();
    await act(async () => {
      sync.resolve(new Response('{}', { status: 200 }));
      profile.resolve({ data: { user: syntheticUser }, error: null });
    });
    await flush();
    expectNoNavigation();
  });

  test.each([
    ['/auth', '/dashboard'],
    ['/auth?just_registered=1', '/dashboard?welcome=registration-free-first-class'],
  ])('an ordinary existing session on %s retains its dashboard destination', async (path, target) => {
    window.history.replaceState({}, '', path);
    mocks.auth.getSession.mockReset().mockResolvedValue(sessionResult);
    await renderAuth();
    await waitFor(() => expect(mocks.router.replace).toHaveBeenCalledWith(target));
    expect(mocks.router.replace).toHaveBeenCalledOnce();
    expect(mocks.auth.signInWithPassword).not.toHaveBeenCalled();
    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(mocks.auth.updateUser).not.toHaveBeenCalled();
  });

  test('a SIGNED_IN event outside password login retains normal navigation', async () => {
    await renderAuth();
    expectNoNavigation();
    await act(async () => { emit(); });
    expect(mocks.router.replace).toHaveBeenCalledOnce();
    expect(mocks.router.replace).toHaveBeenCalledWith('/dashboard');
    expect(mocks.router.refresh).toHaveBeenCalledOnce();
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  test('non-sign-in auth events do not navigate an idle login page', async () => {
    await renderAuth();
    await act(async () => { emit('TOKEN_REFRESHED'); emit('USER_UPDATED'); emit('SIGNED_OUT'); });
    expectNoNavigation();
  });
});
