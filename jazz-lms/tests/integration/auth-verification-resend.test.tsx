// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(), language: 'en',
  router: { push: vi.fn() },
}));
vi.mock('next/navigation', () => ({ useRouter: () => mocks.router }));
vi.mock('@/components/providers/language-provider', () => ({ useLanguage: () => ({ language: mocks.language }) }));

import VerifyPage from '@/app/auth/verify/page';

const email = 'student+jazz@example.com';
function response(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status });
}
function resendButton() {
  return screen.getByRole('button', { name: /^(resend code|sending\.\.\.)$/i }) as HTMLButtonElement;
}
function verifyButton() {
  return screen.getByRole('button', { name: /^(verify code|verifying\.\.\.)$/i }) as HTMLButtonElement;
}
function verifyForm() {
  return screen.getByLabelText(/^email$/i).closest('form')!;
}
async function advance(seconds: number) {
  await act(async () => { await vi.advanceTimersByTimeAsync(seconds * 1000); });
}
async function resend() {
  await act(async () => { fireEvent.click(resendButton()); });
}

describe('verification email resend controls', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-19T12:00:00.000Z'));
    mocks.language = 'en';
    mocks.fetch.mockImplementation(async () => response({ success: true }));
    vi.stubGlobal('fetch', mocks.fetch);
    window.history.replaceState({}, '', `/auth/verify?email=${encodeURIComponent(email)}`);
  });
  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  test('waits 65 seconds after a successful resend, then permits another action', async () => {
    render(<VerifyPage />);
    await resend();

    expect(mocks.fetch).toHaveBeenCalledOnce();
    expect(JSON.parse(mocks.fetch.mock.calls[0][1].body)).toEqual({ email });
    expect(resendButton().disabled).toBe(true);
    expect(screen.getByRole('timer').textContent).toBe('You can resend the code in 65 seconds.');
    expect(resendButton().getAttribute('aria-describedby')).toBe(screen.getByRole('timer').id);
    await advance(64);
    expect(resendButton().disabled).toBe(true);
    expect(screen.getByRole('timer').textContent).toBe('You can resend the code in 1 second.');
    await advance(1);
    expect(resendButton().disabled).toBe(false);
    expect(screen.queryByRole('timer')).toBeNull();
    await resend();
    expect(mocks.fetch).toHaveBeenCalledTimes(2);
  });

  test('honors the server 120-second 429 retry without issuing another request', async () => {
    mocks.fetch.mockResolvedValue(response({ error: 'Please wait before requesting another code.', retryAfterSeconds: 120 }, 429));
    render(<VerifyPage />);
    await resend();

    expect(screen.getByRole('alert').textContent).toBe('Please wait before requesting another code.');
    expect(screen.getByRole('timer').textContent).toBe('You can resend the code in 120 seconds.');
    await advance(65);
    expect(resendButton().disabled).toBe(true);
    await resend();
    expect(mocks.fetch).toHaveBeenCalledOnce();
    await advance(55);
    expect(resendButton().disabled).toBe(false);
  });

  test.each([undefined, null, 0, -1, 1.5, '120', Number.MAX_SAFE_INTEGER + 1])('uses a finite 65-second fallback for invalid 429 delay %s', async (retryAfterSeconds) => {
    mocks.fetch.mockResolvedValue(response({ error: 'Wait.', retryAfterSeconds }, 429));
    render(<VerifyPage />);
    await resend();
    expect(screen.getByRole('timer').textContent).toBe('You can resend the code in 65 seconds.');
    await advance(65);
    expect(resendButton().disabled).toBe(false);
  });

  test.each([3601, Number.MAX_SAFE_INTEGER])('clamps a valid large 429 delay %s to one hour', async (retryAfterSeconds) => {
    mocks.fetch.mockResolvedValue(response({ error: 'Wait.', retryAfterSeconds }, 429));
    render(<VerifyPage />);
    await resend();
    expect(screen.getByRole('timer').textContent).toBe('You can resend the code in 3600 seconds.');
    await advance(3599);
    expect(resendButton().disabled).toBe(true);
    await advance(1);
    expect(resendButton().disabled).toBe(false);
  });

  test('honors a short positive safe-integer 429 delay', async () => {
    mocks.fetch.mockResolvedValue(response({ error: 'Wait.', retryAfterSeconds: 1 }, 429));
    render(<VerifyPage />);
    await resend();
    expect(resendButton().disabled).toBe(true);
    await advance(1);
    expect(resendButton().disabled).toBe(false);
  });

  test('keeps the fallback cooldown when a 429 body cannot be decoded', async () => {
    mocks.fetch.mockResolvedValue(new Response('Synthetic unreadable response', { status: 429 }));
    render(<VerifyPage />);
    await resend();
    expect(screen.getByRole('alert').textContent).toBe('Unable to resend the code');
    expect(screen.getByRole('timer').textContent).toBe('You can resend the code in 65 seconds.');
    expect(resendButton().disabled).toBe(true);
  });

  test('releases both actions after a network failure without reporting a sent email', async () => {
    mocks.fetch.mockRejectedValueOnce(new Error('Synthetic network failure'));
    render(<VerifyPage />);
    await resend();
    expect(screen.getByRole('alert').textContent).toBe('Unable to resend the code');
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.queryByRole('timer')).toBeNull();
    expect(resendButton().disabled).toBe(false);
    expect(verifyButton().disabled).toBe(false);
  });

  test('blocks duplicate verification and resend while verification is pending', async () => {
    let finish!: (value: Response) => void;
    mocks.fetch.mockReturnValue(new Promise<Response>((resolve) => { finish = resolve; }));
    render(<VerifyPage />);
    fireEvent.change(screen.getByLabelText(/^verification code$/i), { target: { value: '12345678' } });
    await act(async () => {
      fireEvent.submit(verifyForm());
      fireEvent.submit(verifyForm());
      fireEvent.click(resendButton());
    });
    expect(mocks.fetch).toHaveBeenCalledOnce();
    expect(mocks.fetch.mock.calls[0][0]).toBe('/api/auth/verify-code');
    expect(resendButton().disabled).toBe(true);
    await act(async () => { finish(response({ error: 'Incorrect code.' }, 400)); });
    expect(resendButton().disabled).toBe(false);
  });

  test('blocks verification while resend is pending and permits it during the later cooldown', async () => {
    let finish!: (value: Response) => void;
    mocks.fetch.mockReturnValueOnce(new Promise<Response>((resolve) => { finish = resolve; }));
    render(<VerifyPage />);
    fireEvent.change(screen.getByLabelText(/^verification code$/i), { target: { value: '12345678' } });
    await act(async () => {
      fireEvent.click(resendButton());
      fireEvent.click(resendButton());
      fireEvent.submit(verifyForm());
    });
    expect(mocks.fetch).toHaveBeenCalledOnce();
    expect(verifyButton().disabled).toBe(true);
    await act(async () => { finish(response({ success: true })); });
    expect(resendButton().disabled).toBe(true);
    expect(verifyButton().disabled).toBe(false);
    await act(async () => { fireEvent.submit(verifyForm()); });
    expect(mocks.fetch).toHaveBeenCalledTimes(2);
    expect(mocks.fetch.mock.calls[1][0]).toBe('/api/auth/verify-code');
  });

  test('keeps both actions disabled after verification succeeds, then navigates once', async () => {
    render(<VerifyPage />);
    fireEvent.change(screen.getByLabelText(/^verification code$/i), { target: { value: '12345678' } });
    await act(async () => { fireEvent.submit(verifyForm()); });
    expect(resendButton().disabled).toBe(true);
    expect(verifyButton().disabled).toBe(true);
    await act(async () => { fireEvent.submit(verifyForm()); });
    expect(mocks.fetch).toHaveBeenCalledOnce();
    await advance(1.2);
    expect(mocks.router.push).toHaveBeenCalledExactlyOnceWith(`/auth?tab=login&email=${encodeURIComponent(email)}&just_registered=1`);
  });

  test('cleans up the countdown and redirect timers when leaving the form', async () => {
    const view = render(<VerifyPage />);
    await resend();
    fireEvent.change(screen.getByLabelText(/^verification code$/i), { target: { value: '12345678' } });
    await act(async () => { fireEvent.submit(verifyForm()); });
    expect(screen.getByRole('status').textContent).toBe('Email verified successfully! Redirecting to sign in...');
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
    await advance(66);
    expect(mocks.router.push).not.toHaveBeenCalled();
  });

  test('does not create a countdown after an in-flight resend resolves following unmount', async () => {
    let finish!: (value: Response) => void;
    mocks.fetch.mockReturnValueOnce(new Promise<Response>((resolve) => { finish = resolve; }));
    const view = render(<VerifyPage />);
    await resend();
    view.unmount();
    await act(async () => { finish(response({ success: true })); });
    expect(vi.getTimerCount()).toBe(0);
  });

  test('does not navigate after in-flight verification resolves following unmount', async () => {
    let finish!: (value: Response) => void;
    mocks.fetch.mockReturnValueOnce(new Promise<Response>((resolve) => { finish = resolve; }));
    const view = render(<VerifyPage />);
    fireEvent.change(screen.getByLabelText(/^verification code$/i), { target: { value: '12345678' } });
    await act(async () => { fireEvent.submit(verifyForm()); });
    view.unmount();
    await act(async () => { finish(response({ success: true })); });
    expect(vi.getTimerCount()).toBe(0);
    await advance(2);
    expect(mocks.router.push).not.toHaveBeenCalled();
  });

  test.each([
    ['es', 'Puedes reenviar el código en 65 segundos.'],
    ['en', 'You can resend the code in 65 seconds.'],
    ['fr', 'Vous pourrez renvoyer le code dans 65 secondes.'],
    ['pt', 'Você pode reenviar o código em 65 segundos.'],
  ])('localizes the quiet accessible countdown in %s', async (language, expected) => {
    mocks.language = language;
    render(<VerifyPage />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /^(reenviar código|resend code|renvoyer le code)$/i })); });
    const timer = screen.getByRole('timer');
    expect(timer.textContent).toBe(expected);
    expect(timer.getAttribute('aria-live')).toBe('off');
  });
});
