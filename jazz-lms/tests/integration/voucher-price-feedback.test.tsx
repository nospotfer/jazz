// @vitest-environment jsdom
// Real VoucherInput inside the shared modal; Axios DTOs are closed fixtures,
// not evidence of actual server validation or entitlement creation.
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { PaymentMethodModal } from '@/components/payment/payment-method-modal';
import type { SupportedLanguage } from '@/lib/language';

const mocks = vi.hoisted(() => ({
  post: vi.fn(), applied: vi.fn(), confirm: vi.fn(), fetch: vi.fn(), language: 'en',
}));
vi.mock('axios', () => ({ default: {
  post: mocks.post, isAxiosError: (error: unknown) => Boolean((error as { isAxiosError?: boolean })?.isAxiosError),
} }));
vi.mock('@/components/providers/language-provider', () => ({
  useLanguage: () => ({ language: mocks.language }),
}));
const courseId = 'synthetic-price-feedback-course';
const guidance = {
  es: 'El precio del curso no está disponible temporalmente. Inténtalo más tarde.',
  en: 'The course price is temporarily unavailable. Please try again later.',
  fr: 'Le prix du cours est temporairement indisponible. Réessayez plus tard.',
  pt: 'O preço do curso está temporariamente indisponível. Tente novamente mais tarde.',
};
const inputCopy = {
  es: { label: 'Código de descuento', apply: 'Aplicar', base: 'Precio base', total: 'Total a pagar' },
  en: { label: 'Discount code', apply: 'Apply', base: 'Base price', total: 'Total to pay' },
  fr: { label: 'Code promo', apply: 'Appliquer', base: 'Prix de base', total: 'Total a payer' },
  pt: { label: 'Código de desconto', apply: 'Aplicar', base: 'Preco base', total: 'Total a pagar' },
};
function modal(language: SupportedLanguage = 'en', price = 80) {
  return <PaymentMethodModal isOpen language={language} courseId={courseId} basePrice={price}
    onClose={() => undefined} onVoucherApplied={mocks.applied} onConfirm={mocks.confirm} />;
}
function row(label: string) {
  return within(screen.getByTestId('payment-method-modal')).getByText(label).parentElement?.lastElementChild?.textContent;
}
async function apply(language: SupportedLanguage = 'en') {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(inputCopy[language].label), 'TESTSAVE');
  mocks.applied.mockClear();
  await user.click(screen.getByRole('button', { name: inputCopy[language].apply }));
  await waitFor(() => expect(mocks.post).toHaveBeenCalledOnce());
}
function failure(status: number, reason?: string) {
  return { isAxiosError: true, response: { status, data: reason
    ? { valid: false, error: reason, message: 'Synthetic server prose must not become customer copy' }
    : { message: 'Unclassified synthetic service failure' } } };
}
beforeEach(() => {
  vi.clearAllMocks(); mocks.language = 'en';
  mocks.fetch.mockImplementation(() => { throw new Error('External network prohibited'); });
  vi.stubGlobal('fetch', mocks.fetch);
});
afterEach(() => {
  cleanup();
  expect(mocks.fetch).not.toHaveBeenCalled();
  expect(mocks.post.mock.calls.every(([path]) => path === '/api/vouchers/validate')).toBe(true);
  expect(mocks.confirm).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
});

describe('course-price unavailable voucher guidance in the actual shared modal', () => {
  test.each(['es', 'en', 'fr', 'pt'] as const)('%s Price unavailable503 is not an invalid or free coupon', async (language) => {
    mocks.language = language; mocks.post.mockRejectedValue(failure(503, 'Price unavailable'));
    render(modal(language)); await apply(language);
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe(guidance[language]);
    expect(screen.queryByRole('status')).toBeNull();
    expect(mocks.applied).toHaveBeenCalledExactlyOnceWith(null);
    expect(row(inputCopy[language].base)).toBe('EUR 80.00');
    expect(row(inputCopy[language].total)).toBe('EUR 80.00');
    expect(screen.queryByText('Synthetic server prose must not become customer copy')).toBeNull();
    expect(mocks.post).toHaveBeenCalledExactlyOnceWith('/api/vouchers/validate', { code: 'TESTSAVE', courseId });
  });
  test('retained price failure follows the changed locale without another validation request', async () => {
    mocks.post.mockRejectedValue(failure(503, 'Price unavailable'));
    const view = render(modal()); await apply();
    expect((await screen.findByRole('alert')).textContent).toBe(guidance.en);
    mocks.language = 'fr'; view.rerender(modal('fr'));
    expect(screen.getByRole('alert').textContent).toBe(guidance.fr);
    expect(screen.queryByText(guidance.en)).toBeNull();
    expect(mocks.post).toHaveBeenCalledOnce();
    expect(mocks.applied.mock.calls.every(([voucher]) => voucher === null)).toBe(true);
    expect(row(inputCopy.fr.total)).toBe('EUR 80.00');
  });
});

test.each([
  { status: 503, reason: undefined, message: 'Voucher codes are temporarily unavailable. Please try again later.' },
  { status: 400, reason: 'Invalid code', message: 'This code is not valid for this course.' },
  { status: 400, reason: 'Course not found', message: 'The course for this code was not found.' },
])('existing $status/$reason error contract remains distinct', async ({ status, reason, message }) => {
  mocks.post.mockRejectedValue(failure(status, reason)); render(modal()); await apply();
  expect((await screen.findByRole('alert')).textContent).toBe(message);
  expect(mocks.applied).toHaveBeenCalledExactlyOnceWith(null);
  expect(screen.queryByRole('status')).toBeNull();
  expect(row('Total to pay')).toBe('EUR 80.00');
});

test.each([{ original: 80, discount: 8, total: 72 }, { original: 0, discount: 0, total: 0 }])(
  'control known catalog$original keeps successful mocked validation total$total', async ({ original, discount, total }) => {
    const voucher = { valid: true, voucher: { id: 'synthetic-feedback-voucher', code: 'TESTSAVE', type: 'DISCOUNT_PERCENT' },
      type: 'DISCOUNT_PERCENT', originalPrice: original, discount, finalPrice: total, discountPercent: 10,
      isFree: false, message: 'Synthetic validation', savings: 'Synthetic savings' };
    mocks.post.mockResolvedValue({ status: 200, data: voucher });
    render(modal('en', original)); await apply();
    expect((await screen.findByRole('status')).textContent).toContain('Code applied successfully.');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(mocks.applied).toHaveBeenCalledExactlyOnceWith(voucher);
    expect(row('Total to pay')).toBe(`EUR ${total.toFixed(2)}`);
  },
);
