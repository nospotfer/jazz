// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { PaymentMethodModal } from '@/components/payment/payment-method-modal';
import DashboardLayout from '@/app/dashboard/layout';

const mocks = vi.hoisted(() => ({
  courseFindFirst: vi.fn(), purchaseFindFirst: vi.fn(), post: vi.fn(), fetch: vi.fn(), refresh: vi.fn(),
  language: 'en',
}));
vi.mock('react', async (original) => ({ ...await original<typeof import('react')>(), cache: <T,>(callback: T) => callback }));
vi.mock('next/cache', () => ({ unstable_cache: <T,>(callback: T) => callback }));
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/videos', useRouter: () => ({ refresh: mocks.refresh }),
  redirect: () => { throw new Error('Unexpected redirect in closed fixture'); },
}));
vi.mock('next/dynamic', async () => {
  const { PaymentMethodModal: ActualModal } = await import('@/components/payment/payment-method-modal');
  return { default: () => ActualModal };
});
vi.mock('@/lib/db', () => ({ db: {
  course: { findFirst: mocks.courseFindFirst }, purchase: { findFirst: mocks.purchaseFindFirst },
} }));
vi.mock('@/lib/admin', () => ({ getCurrentUser: async () => ({ id: 'synthetic-owner', role: 'USER' }) }));
vi.mock('@/lib/server-user', () => ({ getServerUser: async () => ({
  id: 'synthetic-owner', email: 'synthetic-owner@example.test', user_metadata: {},
}) }));
vi.mock('@/utils/supabase/client', () => ({ createClient: () => ({ auth: {
  onAuthStateChange: (listener: (event: string, session: unknown) => void) => {
    listener('INITIAL_SESSION', { user: { id: 'synthetic-owner' } });
    return { data: { subscription: { unsubscribe: () => undefined } } };
  },
} }) }));
vi.mock('@/components/providers/language-provider', () => ({ useLanguage: () => ({ language: mocks.language, setLanguage: vi.fn() }) }));
vi.mock('@/components/layout/dashboard-header', () => ({ DashboardHeader: () => null }));
vi.mock('@/components/layout/sidebar', () => ({ Sidebar: () => null }));
vi.mock('@/components/dashboard/dashboard-local-test-reset', () => ({ DashboardLocalTestReset: () => null }));
vi.mock('@/components/dashboard/dashboard-purchase-auto-reconcile', () => ({ DashboardPurchaseAutoReconcile: () => null }));
vi.mock('@/components/dashboard/checkout-session-guard', () => ({ CheckoutSessionGuard: () => null }));
vi.mock('@/lib/payment-modal-loader', () => ({ warmPaymentMethodModal: vi.fn(), loadPaymentMethodModal: vi.fn() }));
vi.mock('axios', () => ({ default: { post: mocks.post, isAxiosError: () => false } }));

type CourseFixture = { id: string; price: number | null; isPublished: boolean; createdAt: number };
let courses: CourseFixture[];

function firstCourse(price: number | null, id = 'selected-first-course') {
  courses = [
    { id: 'unpublished-decoy', price: 999, isPublished: false, createdAt: 0 },
    { id: 'later-published-decoy', price: 250, isPublished: true, createdAt: 20 },
    { id, price, isPublished: true, createdAt: 10 },
  ];
}

async function openFromActualLayout() {
  render(await DashboardLayout({ children: <p>Own synthetic protected page</p> }));
  const trigger = await screen.findByRole('button', { name: 'Apply voucher and continue' });
  fireEvent.click(trigger);
  const modal = await screen.findByTestId('payment-method-modal');
  // Settle the component's ordinary opening reset before editing the voucher.
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 25)); });
  return modal;
}

function rowAmount(modal: HTMLElement, label: string) {
  return within(modal).getByText(label).parentElement?.lastElementChild?.textContent;
}
function renderDirect(price?: number) {
  return render(<PaymentMethodModal isOpen language="en" courseId="selected-first-course" basePrice={price}
    onClose={() => undefined} onVoucherApplied={() => undefined} onConfirm={() => { throw new Error('No checkout allowed'); }} />);
}

beforeEach(() => {
  vi.clearAllMocks(); localStorage.clear(); mocks.language = 'en'; firstCourse(80);
  mocks.purchaseFindFirst.mockResolvedValue(null);
  mocks.courseFindFirst.mockImplementation(async (query) => {
    const selected = courses.filter((course) => course.isPublished === query.where.isPublished)
      .sort((left, right) => left.createdAt - right.createdAt)[0];
    if (!selected) return null;
    return Object.fromEntries(Object.keys(query.select).filter((key) => query.select[key] === true)
      .map((key) => [key, selected[key as keyof CourseFixture]]));
  });
  mocks.post.mockImplementation(async (path: string) => {
    if (path !== '/api/vouchers/validate') throw new Error('Unexpected closed request; checkout/provider prohibited');
    return { status: 200, data: {
      valid: true, voucher: { id: 'synthetic-discount', code: 'TESTSAVE', type: 'DISCOUNT_PERCENT' },
      type: 'DISCOUNT_PERCENT', originalPrice: 80, discount: 8, finalPrice: 72, discountPercent: 10,
      isFree: false, message: 'Synthetic validated result', savings: 'Synthetic savings',
    } };
  });
  mocks.fetch.mockImplementation(() => { throw new Error('Unexpected fetch; network prohibited'); });
  vi.stubGlobal('fetch', mocks.fetch);
});
afterEach(() => {
  cleanup();
  expect(mocks.fetch).not.toHaveBeenCalled();
  expect(mocks.post.mock.calls.every(([path]) => path === '/api/vouchers/validate')).toBe(true);
  vi.unstubAllGlobals();
});

describe('actual first-course helper/layout/paywall/shared modal price flow', () => {
  test('selected published course80 advertises80 rather than unrelated global default', async () => {
    const modal = await openFromActualLayout();
    expect(rowAmount(modal, 'Base price')).toBe('EUR 80.00');
    expect(rowAmount(modal, 'Total to pay')).toBe('EUR 80.00');
  });

  test('a real selected zero price remains zero in the purchase summary', async () => {
    firstCourse(0);
    const modal = await openFromActualLayout();
    expect(rowAmount(modal, 'Base price')).toBe('EUR 0.00');
    expect(rowAmount(modal, 'Total to pay')).toBe('EUR 0.00');
  });

  test('selected NULL price does not invent29.99 or allow a quoted checkout', async () => {
    firstCourse(null);
    const modal = await openFromActualLayout();
    expect(within(modal).queryAllByText('EUR 29.99')).toHaveLength(0);
    expect(within(modal).getByTestId('payment-method-modal-continue').hasAttribute('disabled')).toBe(true);
  });

  test('course-based voucher result keeps the base/discount/final summary coherent', async () => {
    const modal = await openFromActualLayout();
    fireEvent.change(within(modal).getByLabelText('Discount code'), { target: { value: 'TESTSAVE' } });
    fireEvent.click(within(modal).getByRole('button', { name: 'Apply' }));
    await waitFor(() => expect(rowAmount(modal, 'Total to pay')).toBe('EUR 72.00'));
    expect(mocks.post).toHaveBeenCalledExactlyOnceWith('/api/vouchers/validate', { code: 'TESTSAVE', courseId: 'selected-first-course' });
    expect(rowAmount(modal, 'Discount')).toBe('-EUR 8.00');
    expect(rowAmount(modal, 'Base price')).toBe('EUR 80.00');
  });

  test('control legacy29.99 course uses oldest published selection and preserves its price', async () => {
    firstCourse(29.99);
    const modal = await openFromActualLayout();
    expect(rowAmount(modal, 'Base price')).toBe('EUR 29.99');
    expect(rowAmount(modal, 'Total to pay')).toBe('EUR 29.99');
    expect(mocks.courseFindFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { isPublished: true }, orderBy: { createdAt: 'asc' } }));
    expect(mocks.purchaseFindFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'synthetic-owner' } }));
  });

  test('control absent course keeps opening disabled and never supplies an invented course id', async () => {
    courses = [];
    render(await DashboardLayout({ children: <p>Own synthetic protected page</p> }));
    const trigger = await screen.findByRole('button', { name: 'Apply voucher and continue' });
    expect(trigger.hasAttribute('disabled')).toBe(true);
    expect(screen.queryByTestId('payment-method-modal')).toBeNull();
  });

  test('control paid owner still has no paid overlay or modal trigger', async () => {
    mocks.purchaseFindFirst.mockResolvedValue({ id: 'synthetic-own-purchase' });
    render(await DashboardLayout({ children: <p>Own synthetic protected page</p> }));
    expect(await screen.findByText('Own synthetic protected page')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Apply voucher and continue' })).toBeNull();
    expect(screen.queryByTestId('payment-method-modal')).toBeNull();
  });
});

describe('shared modal converter boundaries separated from parent propagation', () => {
  test('control explicit positive80 already displays80 when supplied directly', () => {
    renderDirect(80);
    const modal = screen.getByTestId('payment-method-modal');
    expect(rowAmount(modal, 'Base price')).toBe('EUR 80.00');
    expect(rowAmount(modal, 'Total to pay')).toBe('EUR 80.00');
  });

  test('explicit zero is a known zero rather than a missing price', () => {
    renderDirect(0);
    const modal = screen.getByTestId('payment-method-modal');
    expect(rowAmount(modal, 'Base price')).toBe('EUR 0.00');
    expect(rowAmount(modal, 'Total to pay')).toBe('EUR 0.00');
  });

  test('control omitted legacy modal price keeps the existing default contract', () => {
    renderDirect();
    const modal = screen.getByTestId('payment-method-modal');
    expect(rowAmount(modal, 'Base price')).toBe('EUR 29.99');
    expect(rowAmount(modal, 'Total to pay')).toBe('EUR 29.99');
  });
});
