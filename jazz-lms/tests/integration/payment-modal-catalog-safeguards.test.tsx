// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { PaymentMethodModal } from '@/components/payment/payment-method-modal';

const mocks = vi.hoisted(() => ({ post: vi.fn(), confirm: vi.fn(), close: vi.fn(), fetch: vi.fn(), language: 'en' }));
vi.mock('@/components/providers/language-provider', () => ({ useLanguage: () => ({ language: mocks.language }) }));
vi.mock('axios', () => ({ default: { post: mocks.post, isAxiosError: () => false } }));

type Language = 'es' | 'en' | 'fr' | 'pt';
function Modal({ price, language = 'en' }: { price: number | null; language?: Language }) {
  const [open, setOpen] = useState(true);
  return <PaymentMethodModal isOpen={open} language={language} courseId="synthetic-course" basePrice={price}
    onClose={() => { mocks.close(); setOpen(false); }} onVoucherApplied={() => undefined} onConfirm={mocks.confirm} />;
}
function rowAmount(label: string) {
  return within(screen.getByTestId('payment-method-modal')).getByText(label).parentElement?.lastElementChild?.textContent;
}

beforeEach(() => {
  vi.resetAllMocks(); mocks.language = 'en';
  mocks.post.mockImplementation(() => { throw new Error('Unexpected closed validation request'); });
  mocks.fetch.mockImplementation(() => { throw new Error('Network is prohibited'); });
  vi.stubGlobal('fetch', mocks.fetch);
});
afterEach(() => {
  cleanup();
  expect(mocks.fetch).not.toHaveBeenCalled();
  expect(mocks.post.mock.calls.every(([path]) => path === '/api/vouchers/validate')).toBe(true);
  vi.unstubAllGlobals();
});

describe('explicit unavailable catalog prices cannot become a checkout quote', () => {
  test.each([null, Number.NaN, Number.POSITIVE_INFINITY, -1])('price %j blocks confirmation but keeps cancel usable', (price) => {
    render(<Modal price={price} />);
    const modal = screen.getByTestId('payment-method-modal');
    expect(within(modal).queryByText(/EUR \d/)).toBeNull();
    expect(rowAmount('Base price')).toBe('Price unavailable');
    expect(rowAmount('Total to pay')).toBe('Price unavailable');
    expect(screen.getByRole('status').textContent).toContain('Refresh');
    const confirm = screen.getByTestId('payment-method-modal-continue');
    expect(confirm.hasAttribute('disabled')).toBe(true);
    fireEvent.click(confirm);
    expect(mocks.confirm).not.toHaveBeenCalled();
    expect(within(modal).getByRole('button', { name: 'Apply' }).hasAttribute('disabled')).toBe(true);
    const cancel = screen.getByTestId('payment-method-modal-cancel');
    expect(cancel.hasAttribute('disabled')).toBe(false);
    fireEvent.click(cancel);
    expect(mocks.close).toHaveBeenCalledOnce();
    expect(screen.queryByTestId('payment-method-modal')).toBeNull();
  });

  test('unavailable recovery copy follows four-language changes without validation or enabling checkout', () => {
    const view = render(<Modal price={null} language="es" />);
    const messages = new Set<string>();
    for (const language of ['es', 'en', 'fr', 'pt'] as const) {
      mocks.language = language;
      view.rerender(<Modal price={null} language={language} />);
      const text = screen.getByRole('status').textContent ?? '';
      expect(text.length).toBeGreaterThan(0); messages.add(text);
      expect(screen.getByTestId('payment-method-modal-continue').hasAttribute('disabled')).toBe(true);
      expect(within(screen.getByTestId('payment-method-modal')).queryByText(/EUR \d/)).toBeNull();
    }
    expect(messages.size).toBe(4);
    expect(mocks.post).not.toHaveBeenCalled();
    expect(mocks.confirm).not.toHaveBeenCalled();
  });
});

test('a validated voucher snapshot supersedes cached catalog amounts without mixing monetary snapshots', async () => {
  mocks.post.mockResolvedValue({ status: 200, data: {
    valid: true, voucher: { id: 'synthetic-voucher', code: 'TESTSAVE', type: 'DISCOUNT_PERCENT' },
    type: 'DISCOUNT_PERCENT', originalPrice: 90, discount: 9, finalPrice: 81, discountPercent: 10,
    isFree: false, message: 'Synthetic validation', savings: 'Synthetic savings',
  } });
  render(<Modal price={80} />);
  expect(rowAmount('Base price')).toBe('EUR 80.00');
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 25)); });
  fireEvent.change(screen.getByLabelText('Discount code'), { target: { value: 'TESTSAVE' } });
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  await waitFor(() => expect(rowAmount('Total to pay')).toBe('EUR 81.00'));
  expect(rowAmount('Base price')).toBe('EUR 90.00');
  expect(rowAmount('Discount')).toBe('-EUR 9.00');
  expect(mocks.post).toHaveBeenCalledExactlyOnceWith('/api/vouchers/validate', { code: 'TESTSAVE', courseId: 'synthetic-course' });
  expect(mocks.confirm).not.toHaveBeenCalled();
});
