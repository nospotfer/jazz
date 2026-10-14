// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { PaymentMethodModal } from '@/components/payment/payment-method-modal';
import DashboardLayout from '@/app/dashboard/layout';

const mocks = vi.hoisted(() => ({ post: vi.fn(), confirm: vi.fn(), assign: vi.fn(), course: vi.fn(), purchase: vi.fn(), fetch: vi.fn() }));
vi.mock('react', async (original) => ({ ...await original<typeof import('react')>(), cache: <T,>(callback: T) => callback }));
vi.mock('next/cache', () => ({ unstable_cache: <T,>(callback: T) => callback }));
vi.mock('next/navigation', () => ({ usePathname: () => '/dashboard/videos', useRouter: () => ({ refresh: vi.fn() }), redirect: () => { throw new Error('Unexpected redirect'); } }));
vi.mock('next/dynamic', async () => {
  const { PaymentMethodModal: ActualModal } = await import('@/components/payment/payment-method-modal');
  return { default: () => ActualModal };
});
vi.mock('@/lib/db', () => ({ db: { course: { findFirst: mocks.course }, purchase: { findFirst: mocks.purchase } } }));
vi.mock('@/lib/admin', () => ({ getCurrentUser: async () => ({ id: 'synthetic-owner', role: 'USER' }) }));
vi.mock('@/lib/server-user', () => ({ getServerUser: async () => ({ id: 'synthetic-owner', email: 'synthetic@example.test', user_metadata: {} }) }));
vi.mock('@/utils/supabase/client', () => ({ createClient: () => ({ auth: { onAuthStateChange: (listener: (event: string, session: unknown) => void) => {
  listener('INITIAL_SESSION', { user: { id: 'synthetic-owner' } });
  return { data: { subscription: { unsubscribe: () => undefined } } };
} } }) }));
vi.mock('@/components/providers/language-provider', () => ({ useLanguage: () => ({ language: 'en', setLanguage: vi.fn() }) }));
vi.mock('@/components/layout/dashboard-header', () => ({ DashboardHeader: () => null }));
vi.mock('@/components/layout/sidebar', () => ({ Sidebar: () => null }));
vi.mock('@/components/dashboard/dashboard-local-test-reset', () => ({ DashboardLocalTestReset: () => null }));
vi.mock('@/components/dashboard/dashboard-purchase-auto-reconcile', () => ({ DashboardPurchaseAutoReconcile: () => null }));
vi.mock('@/components/dashboard/checkout-session-guard', () => ({ CheckoutSessionGuard: () => null }));
vi.mock('@/lib/payment-modal-loader', () => ({ warmPaymentMethodModal: vi.fn(), loadPaymentMethodModal: vi.fn() }));
vi.mock('axios', () => ({ default: { post: mocks.post, isAxiosError: () => false } }));

let selected: { id: string; price: number };
let finishes: Array<() => void>;
const validated = (originalPrice = 80, discount: number | null = 8) => ({ status: 200, data: {
  valid: true, voucher: { id: 'synthetic-voucher', code: 'TESTSAVE', type: 'DISCOUNT_PERCENT' },
  type: 'DISCOUNT_PERCENT', originalPrice, discount, finalPrice: originalPrice * 0.9, discountPercent: 10,
  isFree: false, message: 'Synthetic validation', savings: 'Synthetic savings',
} });
function deferred<T>(fallback: T) {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((accept) => { resolve = accept; });
  finishes.push(() => resolve(fallback));
  return { promise, resolve };
}
function Harness({ courseId = 'course-a', price = 80, open = true }: { courseId?: string; price?: number; open?: boolean }) {
  const [voucher, setVoucher] = useState<{ voucher: { code: string } } | null>(null);
  return <><output data-testid="parent-intent">{voucher?.voucher.code ?? 'none'}</output>
    <PaymentMethodModal isOpen={open} language="en" courseId={courseId} basePrice={price}
      onClose={() => undefined} onVoucherApplied={setVoucher}
      onConfirm={() => mocks.confirm({ courseId, voucherCode: voucher?.voucher.code })} />
  </>;
}
function amount(label: string) { return within(screen.getByTestId('payment-method-modal')).getByText(label).parentElement?.lastElementChild?.textContent; }
async function openingSettled() { await act(async () => { await new Promise((resolve) => setTimeout(resolve, 25)); }); }
async function apply() {
  await openingSettled();
  fireEvent.change(screen.getByLabelText('Discount code'), { target: { value: 'TESTSAVE' } });
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  await waitFor(() => expect(mocks.post).toHaveBeenCalled());
}
async function openLayout() {
  const tree = await DashboardLayout({ children: <p>Owned fixture</p> });
  const view = render(tree);
  fireEvent.click(await screen.findByRole('button', { name: 'Apply voucher and continue' }));
  await screen.findByTestId('payment-method-modal'); await openingSettled();
  return view;
}
beforeEach(() => {
  vi.resetAllMocks(); localStorage.clear(); finishes = []; selected = { id: 'course-a', price: 80 };
  mocks.course.mockImplementation(async ({ select }) => Object.fromEntries(Object.keys(select).map((key) => [key, selected[key as keyof typeof selected]])));
  mocks.purchase.mockResolvedValue(null); mocks.post.mockResolvedValue(validated());
  mocks.fetch.mockImplementation(() => { throw new Error('Network prohibited'); }); vi.stubGlobal('fetch', mocks.fetch);
  const actualWindow = window;
  const location = new Proxy({}, { get: (_target, property) => property === 'assign' ? mocks.assign : Reflect.get(actualWindow.location, property, actualWindow.location) });
  vi.stubGlobal('window', new Proxy(actualWindow, { get: (target, property) => property === 'location' ? location : Reflect.get(target, property, target) }));
});
afterEach(async () => {
  cleanup(); await act(async () => { for (const finish of finishes) finish(); });
  expect(mocks.fetch).not.toHaveBeenCalled();
  expect(mocks.post.mock.calls.every(([path]) => ['/api/vouchers/validate', '/api/checkout'].includes(path))).toBe(true);
  vi.unstubAllGlobals();
});

test('switching open course clears both the displayed voucher and parent checkout intent', async () => {
  const view = render(<Harness />); await apply(); await waitFor(() => expect(amount('Total to pay')).toBe('EUR 72.00'));
  view.rerender(<Harness courseId="course-b" price={200} />);
  expect({ base: amount('Base price'), total: amount('Total to pay'), input: (screen.getByLabelText('Discount code') as HTMLInputElement).value,
    intent: screen.getByTestId('parent-intent').textContent }).toEqual({ base: 'EUR 200.00', total: 'EUR 200.00', input: '', intent: 'none' });
  fireEvent.click(screen.getByTestId('payment-method-modal-continue'));
  expect(mocks.confirm).toHaveBeenCalledExactlyOnceWith({ courseId: 'course-b', voucherCode: undefined });
});
test('close and reopen cannot retain a hidden coupon behind a full-price summary', async () => {
  const view = render(<Harness />); await apply(); await waitFor(() => expect(screen.getByTestId('parent-intent').textContent).toBe('TESTSAVE'));
  view.rerender(<Harness open={false} />); view.rerender(<Harness />); await openingSettled();
  expect(amount('Total to pay')).toBe('EUR 80.00');
  fireEvent.click(screen.getByTestId('payment-method-modal-continue'));
  expect(mocks.confirm).toHaveBeenCalledExactlyOnceWith({ courseId: 'course-a', voucherCode: undefined });
});
test.each(['reopen', 'course-change'])('late real validation after %s cannot restore prior snapshot or intent', async (kind) => {
  const old = deferred(validated()); mocks.post.mockReturnValueOnce(old.promise);
  const view = render(<Harness />); await apply();
  if (kind === 'reopen') { view.rerender(<Harness open={false} />); view.rerender(<Harness />); }
  else view.rerender(<Harness courseId="course-b" price={200} />);
  await openingSettled(); await act(async () => old.resolve(validated()));
  const expected = kind === 'reopen' ? 'EUR 80.00' : 'EUR 200.00';
  expect({ base: amount('Base price'), total: amount('Total to pay'), intent: screen.getByTestId('parent-intent').textContent })
    .toEqual({ base: expected, total: expected, intent: 'none' });
});
test('control same-course fresh server snapshot can supersede a cached catalog price', async () => {
  mocks.post.mockResolvedValue(validated(90, 9)); render(<Harness />); await apply();
  await waitFor(() => expect(amount('Total to pay')).toBe('EUR 81.00'));
  expect(amount('Base price')).toBe('EUR 90.00'); expect(amount('Discount')).toBe('-EUR 9.00');
  expect(screen.getByTestId('parent-intent').textContent).toBe('TESTSAVE');
});
test('malformed validated discount remains unavailable instead of inventing zero', async () => {
  mocks.post.mockResolvedValue(validated(80, null)); render(<Harness />); await apply();
  await waitFor(() => expect(screen.getByTestId('parent-intent').textContent).toBe('TESTSAVE'));
  expect(amount('Discount')).toBe('Price unavailable');
  expect(screen.getByTestId('payment-method-modal-continue').hasAttribute('disabled')).toBe(true);
});
test('pending actual dashboard checkout for courseA cannot navigate after same-owner selectionB', async () => {
  const pending = deferred({ data: { url: 'https://checkout.synthetic.example/course-a' } }); mocks.post.mockReturnValueOnce(pending.promise);
  const view = await openLayout(); fireEvent.click(screen.getByTestId('payment-method-modal-continue'));
  await waitFor(() => expect(mocks.post).toHaveBeenCalled()); expect(mocks.post.mock.calls[0][1].courseId).toBe('course-a');
  selected = { id: 'course-b', price: 200 };
  view.rerender(await DashboardLayout({ children: <p>Owned fixtureB</p> }));
  await act(async () => pending.resolve({ data: { url: 'https://checkout.synthetic.example/course-a' } }));
  expect(mocks.assign).not.toHaveBeenCalled();
});
test('control matching current dashboard checkout may navigate exactly once', async () => {
  const pending = deferred({ data: { url: 'https://checkout.synthetic.example/course-a' } }); mocks.post.mockReturnValueOnce(pending.promise);
  await openLayout(); fireEvent.click(screen.getByTestId('payment-method-modal-continue'));
  await waitFor(() => expect(mocks.post).toHaveBeenCalled()); await act(async () => pending.resolve({ data: { url: 'https://checkout.synthetic.example/course-a' } }));
  expect(mocks.assign).toHaveBeenCalledExactlyOnceWith('https://checkout.synthetic.example/course-a');
});
