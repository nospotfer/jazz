// @vitest-environment jsdom

import { act, cleanup, render, screen } from '@testing-library/react';
import { useEffect, useLayoutEffect } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { PrivateOwnerBoundary } from '@/components/auth/private-owner-boundary';
import { useOwnerAction } from '@/hooks/use-owner-action';
import type { AuthOwnerToken } from '@/hooks/use-auth-owner';

const mocks = vi.hoisted(() => ({ listeners: new Set<(event: string, session: unknown) => void>(), refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock('@/components/providers/dashboard-preferences-provider', () => ({ useDashboardPreferences: () => ({ language: 'en' }) }));
vi.mock('@/utils/supabase/client', () => ({ createClient: () => ({ auth: {
  onAuthStateChange: (listener: (event: string, session: unknown) => void) => {
    mocks.listeners.add(listener); listener('INITIAL_SESSION', { user: { id: 'synthetic-owner' } });
    return { data: { subscription: { unsubscribe: () => mocks.listeners.delete(listener) } } };
  },
} }) }));

let captured: { token: AuthOwnerToken; isCurrent: (token: AuthOwnerToken) => boolean } | null;
let commitObservations: Array<{ oldFramePresent: boolean; oldWorkAllowed: boolean }>;
function OriginalCourseFrame() {
  const { capture, isCurrent } = useOwnerAction();
  useEffect(() => {
    const token = capture();
    if (token) captured = { token, isCurrent };
  }, [capture, isCurrent]);
  return <p data-testid="original-course-frame">Original synthetic course</p>;
}
function ReplacementCourseFrame() {
  useLayoutEffect(() => {
    if (!captured) throw new Error('Original owned work was not captured');
    commitObservations.push({
      oldFramePresent: Boolean(document.querySelector('[data-testid="original-course-frame"]')),
      oldWorkAllowed: captured.isCurrent(captured.token),
    });
  }, []);
  return <p>Replacement synthetic course</p>;
}
const frame = (replacement = false) => <PrivateOwnerBoundary expectedUserId="synthetic-owner">
  {replacement ? <ReplacementCourseFrame key="course-b" /> : <OriginalCourseFrame key="course-a" />}
</PrivateOwnerBoundary>;

beforeEach(() => { vi.clearAllMocks(); mocks.listeners.clear(); captured = null; commitObservations = []; });
afterEach(() => { cleanup(); mocks.listeners.clear(); });

describe('owner action lifetime follows the actual private frame commit', () => {
  test('replacing a course under the same owner retires old work before the replacement layout phase', async () => {
    const view = render(frame());
    expect(screen.getByTestId('original-course-frame')).toBeTruthy();
    expect(captured).not.toBeNull();
    view.rerender(frame(true));
    expect(screen.getByText('Replacement synthetic course')).toBeTruthy();
    expect(commitObservations).toEqual([{ oldFramePresent: false, oldWorkAllowed: false }]);
  });

  test('control current work stays valid through a same-owner token refresh', async () => {
    render(frame());
    expect(captured!.isCurrent(captured!.token)).toBe(true);
    await act(async () => { for (const listener of [...mocks.listeners]) listener('TOKEN_REFRESHED', { user: { id: 'synthetic-owner' } }); });
    expect(captured!.isCurrent(captured!.token)).toBe(true);
    expect(screen.getByTestId('original-course-frame')).toBeTruthy();
  });

  test('control owner changes already reject work synchronously before React cleanup', async () => {
    render(frame());
    let allowed = true;
    await act(async () => {
      for (const listener of [...mocks.listeners]) listener('SIGNED_IN', { user: { id: 'synthetic-other-owner' } });
      allowed = captured!.isCurrent(captured!.token);
    });
    expect(allowed).toBe(false);
    expect(screen.queryByTestId('original-course-frame')).toBeNull();
  });
});
