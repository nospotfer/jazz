// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  language: 'en',
  router: { push: vi.fn(), replace: vi.fn(), refresh: vi.fn() },
  auth: { getSession: vi.fn(), onAuthStateChange: vi.fn(), signInWithPassword: vi.fn(), signOut: vi.fn() },
}));
vi.mock('next/navigation', () => ({ useRouter: () => mocks.router }));
vi.mock('@/components/providers/language-provider', () => ({ useLanguage: () => ({ language: mocks.language }) }));
vi.mock('@/utils/supabase/client', () => ({ createClient: () => ({ auth: mocks.auth }) }));

let hydrated: Root | undefined;
beforeEach(() => {
  vi.resetAllMocks();
  mocks.language = 'en';
  window.localStorage.clear();
  window.history.replaceState({}, '', '/auth');
  mocks.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
  mocks.auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
  mocks.auth.signInWithPassword.mockResolvedValue({ data: null, error: { message: 'Synthetic login rejection' } });
  mocks.auth.signOut.mockResolvedValue({ error: null });
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('No external requests in hydration test'); }));
});
afterEach(async () => {
  if (hydrated) await act(async () => { hydrated!.unmount(); });
  hydrated = undefined;
  cleanup();
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

test('server submit is disabled until hydration attaches the password handler', async () => {
  const AuthPage = (await import('@/app/auth/page')).default;
  const container = document.createElement('div');
  container.innerHTML = renderToString(<AuthPage />);
  document.body.append(container);
  const button = container.querySelector<HTMLButtonElement>('button[type=submit]')!;
  const email = container.querySelector<HTMLInputElement>('input[name=email]')!;
  const password = container.querySelector<HTMLInputElement>('input[name=password]')!;
  expect(button.disabled).toBe(true);
  expect(email.disabled).toBe(true);
  expect(password.disabled).toBe(true);
  expect(button.closest('form')!.method).toBe('post');
  expect(container.querySelector('input[name=email]')!.getAttribute('autocomplete')).toBe('email');
  expect(container.querySelector('input[name=password]')!.getAttribute('autocomplete')).toBe('current-password');
  expect(mocks.auth.signInWithPassword).not.toHaveBeenCalled();

  await act(async () => { hydrated = hydrateRoot(container, <AuthPage />); });
  await waitFor(() => expect(button.disabled).toBe(false));
  expect(email.disabled).toBe(false);
  expect(password.disabled).toBe(false);
  fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'hydration@example.test' } });
  fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'synthetic-hydration-password' } });
  fireEvent.submit(button.closest('form')!);
  await waitFor(() => expect(mocks.auth.signInWithPassword).toHaveBeenCalledOnce());
  expect(mocks.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'hydration@example.test', password: 'synthetic-hydration-password' });
  expect(await screen.findByText('Synthetic login rejection')).toBeTruthy();
});

test('hydrated registration retains its submit handler and autocomplete', async () => {
  const AuthPage = (await import('@/app/auth/page')).default;
  render(<AuthPage />);
  fireEvent.click(screen.getByRole('button', { name: /^register$/i }));
  const button = screen.getByRole('button', { name: /create account/i }) as HTMLButtonElement;
  expect(button.disabled).toBe(false);
  expect((screen.getByLabelText(/full name/i) as HTMLInputElement).disabled).toBe(false);
  expect((screen.getByLabelText(/^email$/i) as HTMLInputElement).disabled).toBe(false);
  expect((screen.getByLabelText(/^password$/i) as HTMLInputElement).disabled).toBe(false);
  expect(button.closest('form')!.method).toBe('post');
  expect(screen.getByLabelText(/^password$/i).getAttribute('autocomplete')).toBe('new-password');
  fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Synthetic Student' } });
  fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'invalid..email@example.test' } });
  fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'synthetic-hydration-password' } });
  fireEvent.submit(button.closest('form')!);
  expect(await screen.findByText('Please enter a valid email')).toBeTruthy();
  expect(fetch).not.toHaveBeenCalled();
});

test.each([
  ['es', 'Activa JavaScript para iniciar sesión o crear una cuenta.'],
  ['en', 'Enable JavaScript to sign in or create an account.'],
  ['fr', 'Activez JavaScript pour vous connecter ou créer un compte.'],
  ['pt', 'Ative o JavaScript para entrar ou criar uma conta.'],
])('server render explains the JavaScript requirement in %s', async (language, message) => {
  mocks.language = language;
  const AuthPage = (await import('@/app/auth/page')).default;
  const container = document.createElement('div');
  container.innerHTML = renderToString(<AuthPage />);
  expect(container.querySelector('noscript')!.textContent).toContain(message);
  expect(container.querySelector<HTMLButtonElement>('button[type=submit]')!.disabled).toBe(true);
});
