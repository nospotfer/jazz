// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { LanguageProvider, useLanguage } from '@/components/providers/language-provider';
import { VoucherInput, type AppliedVoucher } from '@/components/vouchers/voucher-input';
import RedeemPage from '@/app/redeem/page';
import { LANGUAGE_COOKIE_KEY, LANGUAGE_STORAGE_KEY, type SupportedLanguage } from '@/lib/language';

const mocks = vi.hoisted(() => ({ post: vi.fn(), push: vi.fn(), toastError: vi.fn(), toastSuccess: vi.fn() }));
const redeemParams = new URLSearchParams('courseId=fixture-course');
vi.mock('axios', () => ({ default: { post: mocks.post, isAxiosError: (error: unknown) => Boolean(error && typeof error === 'object' && 'isAxiosError' in error) } }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }), useSearchParams: () => redeemParams }));
vi.mock('sonner', () => ({ toast: { error: mocks.toastError, success: mocks.toastSuccess } }));
vi.mock('@/utils/supabase/client', () => ({ createClient: () => ({ auth: {
  onAuthStateChange: (listener: (event: string, session: unknown) => void) => {
    listener('INITIAL_SESSION', { user: { id: 'synthetic-localization-owner' } });
    return { data: { subscription: { unsubscribe: vi.fn() } } };
  },
} }) }));

function LanguageControl() {
  const { language, setLanguage } = useLanguage();
  return <select aria-label="Fixture language" value={language} onChange={event => setLanguage(event.target.value as SupportedLanguage)}>
    {['es', 'en', 'fr', 'pt'].map(value => <option key={value}>{value}</option>)}
  </select>;
}

function renderEntry(entry: React.ReactNode, language: SupportedLanguage) {
  document.cookie = `${LANGUAGE_COOKIE_KEY}=${language}; path=/`;
  localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  return render(<LanguageProvider><LanguageControl />{entry}</LanguageProvider>);
}

beforeEach(() => { vi.resetAllMocks(); localStorage.clear(); });
afterEach(() => { cleanup(); document.cookie = `${LANGUAGE_COOKIE_KEY}=; max-age=0; path=/`; vi.restoreAllMocks(); });

async function submitCode(inputId: string) {
  const input = document.getElementById(inputId)!;
  fireEvent.change(input, { target: { value: 'jazzfree' } });
  if (inputId === 'redeem-voucher-code') fireEvent.submit(input.closest('form')!);
  else fireEvent.keyDown(input, { key: 'Enter' });
  await screen.findByRole('alert');
}

describe('voucher feedback uses the selected language and stable API values', () => {
  test.each([
    ['es', /ha caducado/i], ['en', /has expired/i], ['fr', /a expiré/i], ['pt', /expirou/i],
  ] as const)('redeem translates the same expired response in %s instead of showing backend prose', async (language, expected) => {
    const rawMessage = 'Este voucher expirou. RAW_BACKEND_SENTINEL';
    mocks.post.mockRejectedValue({ isAxiosError: true, response: { status: 400, data: { error: 'Expired', message: rawMessage } } });
    renderEntry(<RedeemPage />, language);
    await submitCode('redeem-voucher-code');
    expect(screen.getByRole('alert').textContent).toMatch(expected);
    expect(screen.getByRole('alert').textContent).not.toContain(rawMessage);
    expect(mocks.toastError).toHaveBeenCalledWith(screen.getByRole('alert').textContent);
    expect(mocks.post).toHaveBeenCalledWith('/api/vouchers/redeem?expectedUserId=synthetic-localization-owner', { courseId: 'fixture-course', voucherCode: 'JAZZFREE' });
    expect(mocks.push).not.toHaveBeenCalled();
  });

  test('atomic redemption reason takes precedence over its compatibility error and follows a language change', async () => {
    mocks.post.mockRejectedValue({ isAxiosError: true, response: { status: 409, data: {
      error: 'Redeem failed', reason: 'Max uses per user reached', message: 'Ya alcanzaste el límite de uso de este cupón.',
    } } });
    renderEntry(<RedeemPage />, 'en');
    await submitCode('redeem-voucher-code');
    expect(screen.getByRole('alert').textContent).toMatch(/your usage limit/i);
    fireEvent.change(screen.getByRole('combobox', { name: 'Fixture language' }), { target: { value: 'fr' } });
    await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/votre limite/i));
    expect(mocks.post).toHaveBeenCalledOnce();
  });

  test('checkout input handles a valid:false response using the same contract and clears applied state', async () => {
    const onApplied = vi.fn();
    mocks.post.mockResolvedValue({ status: 200, data: { valid: false, error: 'Expired', message: 'RAW_BACKEND_SENTINEL' } });
    renderEntry(<VoucherInput courseId="fixture-course" onApplied={onApplied} />, 'fr');
    await submitCode('voucher-code');
    expect(screen.getByRole('alert').textContent).toMatch(/a expiré/i);
    expect(screen.getByRole('alert').textContent).not.toContain('RAW_BACKEND_SENTINEL');
    expect(onApplied).toHaveBeenCalledWith(null);
    expect(mocks.post).toHaveBeenCalledWith('/api/vouchers/validate', { courseId: 'fixture-course', code: 'JAZZFREE' });
  });

  test.each([
    { status: 503, data: { error: 'Future error', message: 'database credentials RAW_BACKEND_SENTINEL' }, expected: /temporairement indisponibles/i },
    { status: 429, data: '<html>RAW_BACKEND_SENTINEL</html>', expected: /Trop de tentatives/i },
    { status: 400, data: { reason: 'constructor', error: '__proto__', message: 'RAW_BACKEND_SENTINEL' }, expected: /Veuillez réessayer/i },
  ])('unknown checkout failures remain friendly without reflecting raw responses ($status)', async ({ status, data, expected }) => {
    const onApplied = vi.fn();
    mocks.post.mockRejectedValue({ isAxiosError: true, response: { status, data } });
    renderEntry(<VoucherInput courseId="fixture-course" onApplied={onApplied} />, 'fr');
    await submitCode('voucher-code');
    expect(screen.getByRole('alert').textContent).toMatch(expected);
    expect(screen.getByRole('alert').textContent).not.toContain('RAW_BACKEND_SENTINEL');
    expect(onApplied).toHaveBeenCalledWith(null);
  });

  test('network failures on redeem use the selected language without changing access or navigation', async () => {
    mocks.post.mockRejectedValue(new Error('RAW_BACKEND_SENTINEL'));
    renderEntry(<RedeemPage />, 'pt');
    await submitCode('redeem-voucher-code');
    expect(screen.getByRole('alert').textContent).toMatch(/Tente novamente/i);
    expect(mocks.push).not.toHaveBeenCalled();
  });

  test('checkout success localizes display while preserving the complete applied voucher payload and price', async () => {
    const voucher: AppliedVoucher = {
      voucher: { id: 'fixture-voucher', code: 'JAZZFREE', type: 'DISCOUNT_FIXED' }, type: 'DISCOUNT_FIXED',
      originalPrice: 29.90, discount: 5, finalPrice: 24.90, discountPercent: 16.72, isFree: false,
      message: 'Voucher aplicado. RAW_BACKEND_SENTINEL', savings: 'Economize R$ 5.00',
    };
    const onApplied = vi.fn();
    mocks.post.mockResolvedValue({ status: 200, data: { ...voucher, valid: true } });
    renderEntry(<VoucherInput courseId="fixture-course" onApplied={onApplied} />, 'en');
    fireEvent.change(screen.getByLabelText('Discount code'), { target: { value: 'jazzfree' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    const result = await screen.findByRole('status');
    expect(result.textContent).toMatch(/Code applied successfully/);
    expect(result.textContent).toContain('€24.90');
    expect(result.textContent).not.toContain('RAW_BACKEND_SENTINEL');
    expect(onApplied).toHaveBeenCalledWith({ ...voucher, valid: true });
    fireEvent.change(screen.getByRole('combobox', { name: 'Fixture language' }), { target: { value: 'fr' } });
    await waitFor(() => expect(result.textContent).toMatch(/Nouveau prix/));
    expect(result.textContent).toContain('24,90');
    expect(onApplied).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));
    expect(onApplied).toHaveBeenLastCalledWith(null);
    expect(screen.queryByRole('status')).toBeNull();
  });
});
