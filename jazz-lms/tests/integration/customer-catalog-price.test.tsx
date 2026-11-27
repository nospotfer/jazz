// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import DashboardPage from '@/app/dashboard/page';
import CourseDetailPage from '@/app/courses/[courseId]/page';
import { CoursePlayer } from '@/components/course/course-player';
import { DashboardPreferencesProvider } from '@/components/providers/dashboard-preferences-provider';
import { CourseEnrollButton } from '@/components/course/course-enroll-button';

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(), findUnique: vi.fn(), post: vi.fn(), get: vi.fn(), fetch: vi.fn(),
  language: 'en',
  router: { push: vi.fn(), refresh: vi.fn(), replace: vi.fn() },
}));
vi.mock('react', async (original) => ({ ...await original<typeof import('react')>(), cache: <T,>(callback: T) => callback }));
vi.mock('next/cache', () => ({ unstable_cache: <T,>(callback: T) => callback }));
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard', useRouter: () => mocks.router, useSearchParams: () => new URLSearchParams(),
  redirect: () => { throw new Error('Unexpected redirect in closed catalog fixture'); },
}));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => ({ value: mocks.language }) }) }));
vi.mock('next/dynamic', async () => {
  const { PaymentMethodModal } = await import('@/components/payment/payment-method-modal');
  return { default: (loader: () => Promise<unknown>) => String(loader).includes("loadPaymentMethodModal") ? PaymentMethodModal : () => null };
});
vi.mock('@/lib/db', () => ({ db: {
  course: { findFirst: mocks.findFirst, findUnique: mocks.findUnique },
  purchase: { findFirst: async () => null },
  user: { findUnique: async () => ({ role: 'USER' }) },
} }));
vi.mock('@/lib/admin', () => ({ getCurrentUser: async () => ({ role: 'USER' }) }));
vi.mock('@/lib/server-user', () => ({ getServerUser: async () => ({
  id: 'synthetic-catalog-owner', email: 'catalog-owner@example.test', user_metadata: {},
}) }));
vi.mock('@/lib/course-translations', () => ({
  getCourseTranslationBundle: async () => ({ courses: new Map(), chapters: new Map(), lessons: new Map() }),
  resolveCourseText: (_map: unknown, _id: string, title: string, description: string | null) => ({ title, description }),
  resolveLessonTitle: (_map: unknown, _id: string, title: string) => title,
}));
vi.mock('@/utils/supabase/client', () => ({ createClient: () => ({ auth: {
  onAuthStateChange: (listener: (event: string, session: unknown) => void) => {
    listener('INITIAL_SESSION', { user: { id: 'synthetic-catalog-owner' } });
    return { data: { subscription: { unsubscribe: () => undefined } } };
  },
} }) }));
vi.mock('@/components/providers/language-provider', () => ({ useLanguage: () => ({ language: mocks.language, setLanguage: vi.fn() }) }));
vi.mock('@/components/layout/sidebar', () => ({ Sidebar: () => null }));
vi.mock('@/components/music/spotify-playlist-footer', () => ({ SpotifyPlaylistFooter: () => null }));
vi.mock('@/lib/payment-modal-loader', () => ({ warmPaymentMethodModal: vi.fn(), loadPaymentMethodModal: vi.fn() }));
vi.mock('axios', () => ({ default: { post: mocks.post, get: mocks.get, put: vi.fn(), isAxiosError: () => false } }));

type CatalogCourse = { id: string; price: number | null; isPublished: boolean; createdAt: number; chapters: Array<{ id: string; lessons: typeof lesson[] }> };
const lesson = { id: 'synthetic-lesson', title: 'Synthetic lesson', videoUrl: '', attachments: [] };
let courses: CatalogCourse[];
let selected: CatalogCourse;
function catalog(price: number | null) {
  selected = { id: 'selected-catalog-course', price, isPublished: true, createdAt: 10, chapters: [{ id: 'synthetic-chapter', lessons: [lesson] }] };
  courses = [
    { ...selected, id: 'unpublished-decoy', price: 999, isPublished: false, createdAt: 0 },
    { ...selected, id: 'later-published-decoy', price: 250, createdAt: 20 }, selected,
  ];
}
const copies = {
  en: { buy: /^Buy full course/, base: 'Base price', total: 'Total to pay', unavailable: 'Price unavailable' },
  es: { buy: /^Comprar curso completo/, base: 'Precio base', total: 'Total a pagar', unavailable: 'Precio no disponible' },
  fr: { buy: /^Acheter le cours complet/, base: 'Prix de base', total: 'Total a payer', unavailable: 'Prix indisponible' },
  pt: { buy: /^Comprar curso completo/, base: 'Preco base', total: 'Total a pagar', unavailable: 'Preço indisponível' },
};
function amount(modal: HTMLElement, label: string) { return within(modal).getByText(label).parentElement?.lastElementChild?.textContent; }
async function settleOpen() {
  const modal = await screen.findByTestId('payment-method-modal');
  await act(async () => { await new Promise((yes) => setTimeout(yes, 25)); });
  return modal;
}
async function dashboard() { return render(<DashboardPreferencesProvider>{await DashboardPage()}</DashboardPreferencesProvider>); }
async function details() { return render(await CourseDetailPage({ params: Promise.resolve({ courseId: selected.id }) })); }
function player() {
  const course = { ...selected, title: 'Synthetic catalog course', description: 'Synthetic content', chapters: selected.chapters } as unknown as ComponentProps<typeof CoursePlayer>['course'];
  return render(<CoursePlayer course={course} lesson={lesson as unknown as ComponentProps<typeof CoursePlayer>['lesson']} lessonId={lesson.id}
    currentUserId="synthetic-catalog-owner" initialIsCompleted={false} initialProgressPercent={0} initialQuizSummary={null}
    hasQuizAvailable={false} canUseGamification={false} canAccessLesson={false} canAccessAttachments={false} />);
}
beforeEach(() => {
  vi.clearAllMocks(); localStorage.clear(); mocks.language = 'en'; catalog(80);
  mocks.findFirst.mockImplementation(async (query) => {
    const course = courses.filter((item) => item.isPublished === query.where.isPublished).sort((a, b) => a.createdAt - b.createdAt)[0];
    return course ? Object.fromEntries(Object.keys(query.select).filter((key) => query.select[key]).map((key) => [key, course[key as keyof CatalogCourse]])) : null;
  });
  mocks.findUnique.mockImplementation(async (query) => query.where.id === selected.id && query.where.isPublished === true
    ? { ...selected, title: 'Synthetic catalog course', description: 'Synthetic content', purchases: [] } : null);
  mocks.post.mockImplementation(async (path: string) => {
    if (path !== '/api/vouchers/validate') throw new Error('Checkout/provider requests prohibited');
    return { status: 200, data: { valid: true, voucher: { id: 'synthetic-voucher', code: 'TESTSAVE', type: 'DISCOUNT_PERCENT' },
      type: 'DISCOUNT_PERCENT', originalPrice: 80, discount: 8, finalPrice: 72, discountPercent: 10, isFree: false,
      message: 'Synthetic validation', savings: 'Synthetic savings' } };
  });
  mocks.get.mockImplementation(() => { throw new Error('Media/provider requests prohibited'); });
  mocks.fetch.mockImplementation(() => { throw new Error('Unexpected request in closed catalog fixture'); });
  vi.stubGlobal('fetch', mocks.fetch);
});
afterEach(() => {
  cleanup();
  expect(mocks.fetch).not.toHaveBeenCalled();
  expect(mocks.get).not.toHaveBeenCalled();
  expect(mocks.post.mock.calls.every(([path]) => path === '/api/vouchers/validate')).toBe(true);
  vi.unstubAllGlobals();
});

describe('actual dashboard page, selected outline and CourseView purchase display', () => {
  test.each(['en', 'es', 'fr', 'pt'] as const)('%s CTA and modal use selected catalog80 instead of a hardcoded amount', async (language) => {
    mocks.language = language; await dashboard();
    const trigger = screen.getByRole('button', { name: copies[language].buy });
    expect(trigger.textContent).toContain('80.00');
    expect(trigger.textContent).not.toContain('29.99');
    fireEvent.click(trigger); const modal = await settleOpen();
    expect(amount(modal, copies[language].base)).toBe('EUR 80.00');
    expect(amount(modal, copies[language].total)).toBe('EUR 80.00');
    expect(mocks.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { isPublished: true }, orderBy: { createdAt: 'asc' } }));
  });
  test('selected zero remains a zero quote rather than the paid default', async () => {
    catalog(0); await dashboard();
    const trigger = screen.getByRole('button', { name: copies.en.buy });
    expect(trigger.textContent).toContain('0.00');
    fireEvent.click(trigger); const modal = await settleOpen();
    expect(amount(modal, copies.en.total)).toBe('EUR 0.00');
  });
  test.each([null, -1, Number.NaN, Number.POSITIVE_INFINITY])('unavailable catalog %s never advertises a paid or free quote', async (price) => {
    catalog(price); await dashboard();
    const unavailable = screen.getByText('Price unavailable');
    expect(unavailable.closest('button')?.hasAttribute('disabled')).toBe(true);
    expect(screen.queryByText(/29\.99/)).toBeNull();
    expect(screen.queryByTestId('payment-method-modal')).toBeNull();
  });
  test('control catalog29.99 stays29.99 and voucher request uses that same selected course ID', async () => {
    catalog(29.99); await dashboard();
    const trigger = screen.getByRole('button', { name: copies.en.buy });
    expect(trigger.textContent).toContain('29.99');
    fireEvent.click(trigger); const modal = await settleOpen();
    expect(amount(modal, copies.en.total)).toBe('EUR 29.99');
    fireEvent.change(within(modal).getByLabelText('Discount code'), { target: { value: 'TESTSAVE' } });
    fireEvent.click(within(modal).getByRole('button', { name: 'Apply' }));
    await screen.findByText('Code applied successfully.');
    expect(mocks.post).toHaveBeenCalledExactlyOnceWith('/api/vouchers/validate', { code: 'TESTSAVE', courseId: selected.id });
  });
});

describe('actual course details and nullable enrollment caller', () => {
  test('positive catalog80 is shown on the detail page and its real shared modal', async () => {
    await details(); expect(screen.getByText('€80.00')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Apply voucher and continue' }));
    const modal = await settleOpen(); expect(amount(modal, copies.en.total)).toBe('EUR 80.00');
  });
  test.each([null, -1, Number.NaN, Number.POSITIVE_INFINITY])('detail catalog %s is unavailable rather than zero/free', async (price) => {
    catalog(price); await details();
    expect(screen.queryByText('€0.00')).toBeNull();
    const unavailable = screen.getByRole('button', { name: 'Price unavailable' });
    expect(unavailable.hasAttribute('disabled')).toBe(true);
    expect(screen.queryByRole('button', { name: 'Enroll for free' })).toBeNull();
  });
  test('control a genuine zero detail price still offers explicit free enrollment without creating a checkout', async () => {
    catalog(0); await details();
    expect(screen.getByText('€0.00')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Enroll for free' }).hasAttribute('disabled')).toBe(false);
    expect(mocks.post).not.toHaveBeenCalled();
  });
  test('nullable enrollment input is disabled without silently becoming a free action', () => {
    render(<CourseEnrollButton courseId="selected-catalog-course" price={null as unknown as number} />);
    const trigger = screen.getByRole('button', { name: 'Price unavailable' });
    expect(trigger.hasAttribute('disabled')).toBe(true);
    fireEvent.click(trigger);
    expect(mocks.post).not.toHaveBeenCalled();
    expect(screen.queryByTestId('payment-method-modal')).toBeNull();
  });
});

describe('real CoursePlayer purchase-modal caller', () => {
  test.each([80, 0])('actual course catalog%s is forwarded to the shared modal', async (price) => {
    catalog(price); player();
    fireEvent.click(screen.getAllByRole('button', { name: 'Choose payment method' })[0]);
    const modal = await settleOpen(); expect(amount(modal, copies.en.total)).toBe(`EUR ${price.toFixed(2)}`);
  });
  test('missing course price opens unavailable information and disables continue', async () => {
    catalog(null); player();
    fireEvent.click(screen.getAllByRole('button', { name: 'Choose payment method' })[0]);
    const modal = await settleOpen();
    expect(amount(modal, copies.en.total)).toBe('Price unavailable');
    expect(within(modal).getByTestId('payment-method-modal-continue').hasAttribute('disabled')).toBe(true);
    expect(within(modal).queryByText('EUR 29.99')).toBeNull();
  });
});
