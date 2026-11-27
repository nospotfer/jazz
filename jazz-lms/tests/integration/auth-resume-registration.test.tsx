// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  routerPush: vi.fn(),
  getUser: vi.fn(),
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.routerPush, refresh: vi.fn(), replace: vi.fn() }),
}));
vi.mock('@/components/providers/language-provider', () => ({
  useLanguage: () => ({ language: 'en' }),
}));
vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({ auth: { getUser: mocks.getUser, getSession: mocks.getSession, onAuthStateChange: mocks.onAuthStateChange } }),
}));

describe('resuming a pending registration', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    window.history.replaceState({}, '', '/auth');
    window.localStorage.clear();
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    mocks.getSession.mockResolvedValue({ data: { session: null }, error: null });
    mocks.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  test('carries the pending-registration notice into the verification screen', async () => {
    window.history.replaceState({}, '', '/auth?tab=register');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, pendingRegistration: true }), { status: 200 })));
    const AuthPage = (await import('@/app/auth/page')).default;
    render(<AuthPage />);

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Student' } });
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'student@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'replacementPassword123' } });
    fireEvent.submit(screen.getByRole('button', { name: /create account/i }).closest('form')!);

    await waitFor(() => expect(mocks.routerPush).toHaveBeenCalledWith('/auth/verify?email=student%40example.com&pending=1'));
  });

  test('explains that the original password is preserved and offers the reset path', async () => {
    window.history.replaceState({}, '', '/auth/verify?email=student%40example.com&pending=1');
    const VerifyPage = (await import('@/app/auth/verify/page')).default;
    render(<VerifyPage />);

    expect(await screen.findByText(/sign in with your original password/i)).toBeTruthy();
    expect(screen.getByText(/reset it from the sign-in page/i)).toBeTruthy();
    expect(screen.getByDisplayValue('student@example.com')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /back to sign in/i }));
    expect(mocks.routerPush).toHaveBeenCalledWith('/auth?tab=login');
  });
});
