// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { DashboardPaywallWrapper } from '@/components/dashboard/dashboard-paywall-wrapper';

const navigation = vi.hoisted(() => ({ pathname: '/dashboard' }));
vi.mock('next/navigation', () => ({ usePathname: () => navigation.pathname }));
vi.mock('next/dynamic', () => ({ default: () => () => null }));
vi.mock('@/components/providers/language-provider', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/lib/payment-modal-loader', () => ({ loadPaymentMethodModal: vi.fn(), warmPaymentMethodModal: vi.fn() }));

beforeEach(() => vi.stubGlobal('fetch', vi.fn(() => { throw new Error('This component check must not use the network'); })));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

function view(pathname: string, paid = false) {
  navigation.pathname = pathname;
  render(<DashboardPaywallWrapper hasPaidCourse={paid} courseId="synthetic-course">
    <button type="button">Own account control</button>
  </DashboardPaywallWrapper>);
}

describe('registered users retain their own account pages without a course purchase', () => {
  test.each([
    '/dashboard/profile', '/dashboard/profile/',
    '/dashboard/payment', '/dashboard/payment/',
    '/dashboard/settings', '/dashboard/settings/',
  ])('%s exposes account controls without a purchase overlay', (pathname) => {
    view(pathname);
    expect(screen.queryByText('Locked area')).toBeNull();
    expect(screen.getByRole('button', { name: 'Own account control' }).closest('.pointer-events-none')).toBeNull();
  });

  test.each([
    '/dashboard/videos', '/dashboard/messages', '/dashboard/jazz-specialist',
    '/dashboard/payment/details', '/dashboard/profile/edit', '/dashboard/settings-extra',
  ])('%s retains the existing paid-area restriction', (pathname) => {
    view(pathname);
    expect(screen.getByText('Locked area')).toBeTruthy();
  });

  test.each(['/dashboard', '/dashboard/notes/synthetic-course/synthetic-free-lesson'])('%s preserves existing free entry', (pathname) => {
    view(pathname);
    expect(screen.queryByText('Locked area')).toBeNull();
  });

  test('a purchased course still unlocks paid areas', () => {
    view('/dashboard/videos', true);
    expect(screen.queryByText('Locked area')).toBeNull();
  });
});
