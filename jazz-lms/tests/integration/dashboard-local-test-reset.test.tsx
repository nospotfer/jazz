// @vitest-environment jsdom
import React from 'react';
import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { DashboardLocalTestReset } from '@/components/dashboard/dashboard-local-test-reset';

const mocks = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn(), query: '' }));
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(mocks.query),
  useRouter: () => ({ replace: mocks.replace, refresh: mocks.refresh }),
}));

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('NODE_ENV', 'test');
  mocks.query = 'resetTestPurchases=1';
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ deletedPurchases: 1 }) }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

test('missing course clears the trigger and performs no reset request', async () => {
  render(<DashboardLocalTestReset />);
  await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/dashboard', { scroll: false }));
  expect(fetch).not.toHaveBeenCalled();
  expect(mocks.refresh).not.toHaveBeenCalled();
});

test('explicit course trigger sends scoped JSON and clears both test parameters', async () => {
  mocks.query = 'resetTestPurchases=1&resetTestCourseId=fixture-course&language=es';
  render(<DashboardLocalTestReset />);
  await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
  expect(vi.mocked(fetch).mock.calls[0][1]?.body).toBe(JSON.stringify({ courseId: 'fixture-course', dryRun: false }));
  await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/dashboard?language=es', { scroll: false }));
  expect(mocks.refresh).toHaveBeenCalledOnce();
});

test('disabled endpoint clears a scoped trigger without refreshing or retrying', async () => {
  mocks.query = 'resetTestPurchases=1&resetTestCourseId=fixture-course';
  vi.mocked(fetch).mockResolvedValue({ ok: false } as Response);
  render(<DashboardLocalTestReset />);
  await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/dashboard', { scroll: false }));
  expect(fetch).toHaveBeenCalledOnce();
  expect(mocks.refresh).not.toHaveBeenCalled();
});

test('production never invokes the reset trigger', () => {
  vi.stubEnv('NODE_ENV', 'production');
  mocks.query = 'resetTestPurchases=1&resetTestCourseId=fixture-course';
  render(<DashboardLocalTestReset />);
  expect(fetch).not.toHaveBeenCalled();
  expect(mocks.replace).not.toHaveBeenCalled();
});
