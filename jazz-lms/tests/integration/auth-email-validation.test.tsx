// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  language: 'en', fetch: vi.fn(), resetPasswordForEmail: vi.fn(),
  getUser: vi.fn(), getSession: vi.fn(), onAuthStateChange: vi.fn(),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }) }));
vi.mock('@/components/providers/language-provider', () => ({ useLanguage: () => ({ language: mocks.language }) }));
vi.mock('@/utils/supabase/client', () => ({ createClient: () => ({ auth: {
  getUser: mocks.getUser, getSession: mocks.getSession, onAuthStateChange: mocks.onAuthStateChange,
  resetPasswordForEmail: mocks.resetPasswordForEmail,
} }) }));

describe('auth forms share the server email policy', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.language = 'en';
    window.localStorage.clear();
    window.history.replaceState({}, '', '/auth');
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    mocks.getSession.mockResolvedValue({ data: { session: null }, error: null });
    mocks.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
    vi.stubGlobal('fetch', mocks.fetch);
  });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  test('registration blocks an email the backend rejects before account or OTP work', async () => {
    window.history.replaceState({}, '', '/auth?tab=register');
    const AuthPage = (await import('@/app/auth/page')).default;
    render(<AuthPage />);
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Student' } });
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'student..name@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'synthetic-test-password' } });
    fireEvent.submit(screen.getByRole('button', { name: /create account/i }).closest('form')!);
    expect(await screen.findByText('Please enter a valid email')).toBeTruthy();
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  test('password recovery blocks malformed domain labels before sending email', async () => {
    const ForgotPage = (await import('@/app/auth/forgot-password/page')).default;
    render(<ForgotPage />);
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'student@example..com' } });
    fireEvent.submit(screen.getByRole('button', { name: /send reset link/i }).closest('form')!);
    expect(await screen.findByText('Enter a valid email')).toBeTruthy();
    expect(mocks.resetPasswordForEmail).not.toHaveBeenCalled();
  });

  test('verification and resend reject malformed addresses before any OTP request', async () => {
    const VerifyPage = (await import('@/app/auth/verify/page')).default;
    render(<VerifyPage />);
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'student..name@example.com' } });
    fireEvent.change(screen.getByLabelText(/^verification code$/i), { target: { value: '123456' } });
    fireEvent.submit(screen.getByRole('button', { name: /^verify code$/i }).closest('form')!);
    expect(await screen.findByText('Enter a valid email and verification code')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /resend code/i }));
    expect(await screen.findByText('Enter a valid email to resend the code')).toBeTruthy();
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  test('a legitimate plus address is normalized before OTP resend', async () => {
    mocks.fetch.mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }));
    const VerifyPage = (await import('@/app/auth/verify/page')).default;
    render(<VerifyPage />);
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'Student+Jazz@Example.COM' } });
    fireEvent.click(screen.getByRole('button', { name: /resend code/i }));
    await waitFor(() => expect(mocks.fetch).toHaveBeenCalledOnce());
    expect(JSON.parse(mocks.fetch.mock.calls[0][1].body)).toEqual({ email: 'student+jazz@example.com' });
    expect(await screen.findByText('A new verification code was sent to your email.')).toBeTruthy();
  });

  test.each(['verify', 'resend'])('Portuguese %s failures use Portuguese guidance', async (action) => {
    mocks.language = 'pt';
    mocks.fetch.mockRejectedValue(new Error('Synthetic local network failure'));
    const VerifyPage = (await import('@/app/auth/verify/page')).default;
    render(<VerifyPage />);
    fireEvent.change(screen.getByLabelText(/^e-mail$/i), { target: { value: 'student@example.com' } });
    if (action === 'verify') {
      fireEvent.change(screen.getByLabelText(/^código de verificação$/i), { target: { value: '123456' } });
      fireEvent.submit(screen.getByRole('button', { name: /^verificar código$/i }).closest('form')!);
    } else {
      fireEvent.click(screen.getByRole('button', { name: /^reenviar código$/i }));
    }
    expect(await screen.findByText(action === 'verify' ? 'Não foi possível verificar o código' : 'Não foi possível reenviar o código')).toBeTruthy();
  });
});
