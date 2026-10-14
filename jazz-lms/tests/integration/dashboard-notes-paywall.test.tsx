// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { DashboardPaywallWrapper } from '@/components/dashboard/dashboard-paywall-wrapper';

const route = vi.hoisted(() => ({ pathname: '/dashboard' }));
vi.mock('next/navigation', () => ({ usePathname: () => route.pathname }));
vi.mock('next/dynamic', () => ({ default: () => () => null }));
vi.mock('@/components/providers/language-provider', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/lib/payment-modal-loader', () => ({ loadPaymentMethodModal: vi.fn(), warmPaymentMethodModal: vi.fn() }));

afterEach(cleanup);

function renderNotes(pathname: string, hasPaidCourse = false) {
  route.pathname = pathname;
  const save = vi.fn();
  render(
    <DashboardPaywallWrapper hasPaidCourse={hasPaidCourse} courseId="course">
      <button onClick={save}>Save draft</button>
    </DashboardPaywallWrapper>,
  );
  return { save, button: screen.getByRole('button', { name: 'Save draft' }) };
}

describe('dashboard notes retain lesson-level access', () => {
  test.each(['free-first-lesson', 'historical-purchased-lesson'])('notes for %s are usable without a full-course purchase', (lesson) => {
    const { save, button } = renderNotes(`/dashboard/notes/course/${lesson}`);
    expect(screen.queryByText('Locked area')).toBeNull();
    expect(button.closest('.pointer-events-none')).toBeNull();
    fireEvent.click(button);
    expect(save).toHaveBeenCalledOnce();
  });

  test.each(['/dashboard/videos', '/dashboard/messages', '/dashboard/notes-other/course/lesson', '/dashboard/notes/course/lesson/extra'])('the notes exemption does not unlock %s', (pathname) => {
    const { button } = renderNotes(pathname);
    expect(screen.getByText('Locked area')).toBeTruthy();
    expect(button.closest('.pointer-events-none')).not.toBeNull();
  });

  test('a full-course buyer can still use another dashboard route', () => {
    const { save, button } = renderNotes('/dashboard/videos', true);
    expect(screen.queryByText('Locked area')).toBeNull();
    fireEvent.click(button);
    expect(save).toHaveBeenCalledOnce();
  });
});
