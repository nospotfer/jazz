// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { GoogleAnalyticsScript } from '@/components/third-parties/google-analytics-script';
import { saveAnalyticsConsent } from '@/lib/analytics/consent';
import { guardAnalyticsNavigation } from '@/lib/analytics/navigation';
import { PrivacyControls } from '@/components/analytics/privacy-controls';

const mocks = vi.hoisted(() => ({ pathname: '/', script: null as null | { src: string; onReady: () => void } }));
vi.mock('next/navigation', () => ({ usePathname: () => mocks.pathname }));
vi.mock('@/components/providers/language-provider', () => ({ useLanguage: () => ({ language: 'es' }) }));
vi.mock('next/script', () => ({ default: (props: { src: string; onReady: () => void }) => {
  mocks.script = props;
  return <span data-testid="ga-loader" data-src={props.src} />;
} }));

const target = window as unknown as Record<string, unknown>;
const commands = () => (target.dataLayer as Array<ArrayLike<unknown>> ?? []).map(entry => Array.from(entry));
const pageviews = () => commands().filter(entry => entry[0] === 'event');

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_GA_MEASUREMENT_ID', 'G-TEST123');
  localStorage.clear();
  mocks.pathname = '/';
  mocks.script = null;
  window.history.replaceState({}, '', '/');
  delete target.gtag;
  delete target.dataLayer;
  delete target['ga-disable-G-TEST123'];
  Object.defineProperty(navigator, 'doNotTrack', { configurable: true, value: undefined });
  Object.defineProperty(navigator, 'globalPrivacyControl', { configurable: true, value: false });
  Object.defineProperty(document, 'referrer', { configurable: true, value: '' });
});
afterEach(() => { cleanup(); vi.unstubAllEnvs(); });

describe('GA loader and route privacy', () => {
  test('never loads before consent, and replay-only permission is insufficient', () => {
    render(<GoogleAnalyticsScript />);
    expect(screen.queryByTestId('ga-loader')).toBeNull();
    expect(target.dataLayer).toBeUndefined();
    act(() => saveAnalyticsConsent({ analytics: false, replay: true }));
    expect(screen.queryByTestId('ga-loader')).toBeNull();
  });
  test('queues denied defaults before loader, keeps advertising denied and sanitizes page data', () => {
    Object.defineProperty(document, 'referrer', { configurable: true, value: 'https://example.com/account?token=secret#password' });
    document.title = 'Account for private@example.com';
    render(<GoogleAnalyticsScript />);
    act(() => saveAnalyticsConsent({ analytics: true, replay: false }));
    expect(screen.getByTestId('ga-loader').getAttribute('data-src')).toBe('https://www.googletagmanager.com/gtag/js?id=G-TEST123');
    expect(commands()[0]).toEqual(['consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' }]);
    expect(pageviews()).toHaveLength(0);
    act(() => mocks.script!.onReady());
    expect(pageviews()).toHaveLength(1);
    expect(pageviews()[0][2]).toEqual({ send_to: 'G-TEST123', page_location: `${window.location.origin}/`, page_title: 'La Cultura del Jazz', page_referrer: 'https://example.com/' });
    expect(commands().find(entry => entry[0] === 'config')?.[2]).toMatchObject({ send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false });
    expect(JSON.stringify(commands())).not.toMatch(/secret|password|private@example/);
    // Next's cached-script onReady callback must not double-count a page.
    act(() => mocks.script!.onReady());
    expect(pageviews()).toHaveLength(1);
  });
  test.each(['/auth', '/dashboard', '/admin', '/courses/id', '/redeem'])('opt-in still cannot load or measure %s', pathname => {
    saveAnalyticsConsent({ analytics: true, replay: true });
    mocks.pathname = pathname;
    window.history.replaceState({}, '', pathname);
    render(<GoogleAnalyticsScript />);
    expect(screen.queryByTestId('ga-loader')).toBeNull();
    expect(pageviews()).toHaveLength(0);
    expect(target['ga-disable-G-TEST123']).toBe(true);
  });
  test('late script load after private navigation cannot record the private page', () => {
    saveAnalyticsConsent({ analytics: true, replay: false });
    const view = render(<GoogleAnalyticsScript />);
    const delayed = mocks.script!.onReady;
    window.history.pushState({}, '', '/auth?code=secret');
    // Guard disables synchronously before React rerenders the new pathname.
    expect(target['ga-disable-G-TEST123']).toBe(true);
    mocks.pathname = '/auth';
    view.rerender(<GoogleAnalyticsScript />);
    act(delayed);
    expect(pageviews()).toHaveLength(0);
    expect(target['ga-disable-G-TEST123']).toBe(true);
  });
  test('withdrawal removes loader, denies collection and rejects a delayed onReady', () => {
    saveAnalyticsConsent({ analytics: true, replay: false });
    render(<GoogleAnalyticsScript />);
    const delayed = mocks.script!.onReady;
    act(() => saveAnalyticsConsent({ analytics: false, replay: false }));
    expect(screen.queryByTestId('ga-loader')).toBeNull();
    expect(target['ga-disable-G-TEST123']).toBe(true);
    act(delayed);
    expect(pageviews()).toHaveLength(0);
    expect(commands().at(-1)?.[2]).toMatchObject({ analytics_storage: 'denied' });
  });
  test.each(['1', 'GPC'])('browser privacy preference %s overrides stored opt-in', signal => {
    saveAnalyticsConsent({ analytics: true, replay: true });
    Object.defineProperty(navigator, signal === 'GPC' ? 'globalPrivacyControl' : 'doNotTrack', { configurable: true, value: signal === 'GPC' ? true : '1' });
    render(<GoogleAnalyticsScript />);
    expect(screen.queryByTestId('ga-loader')).toBeNull();
    expect(pageviews()).toHaveLength(0);
  });
  test('query-bearing homepage and hostile measurement ID fail closed', () => {
    saveAnalyticsConsent({ analytics: true, replay: true });
    window.history.replaceState({}, '', '/?code=secret');
    const view = render(<GoogleAnalyticsScript />);
    expect(screen.queryByTestId('ga-loader')).toBeNull();
    window.history.replaceState({}, '', '/');
    vi.stubEnv('NEXT_PUBLIC_GA_MEASUREMENT_ID', "G-TEST';alert(1)");
    view.rerender(<GoogleAnalyticsScript />);
    expect(screen.queryByTestId('ga-loader')).toBeNull();
    expect(pageviews()).toHaveLength(0);
  });
});

test('multiple navigation guards run before vendor history callbacks and clean up independently', () => {
  const original = window.history.pushState;
  const order: string[] = [];
  window.history.pushState = function(data, unused, url) {
    order.push('vendor');
    original.call(this, data, unused, url);
  };
  const removeFirst = guardAnalyticsNavigation(allowed => order.push(`first:${allowed}`));
  const removeSecond = guardAnalyticsNavigation(allowed => order.push(`second:${allowed}`));
  window.history.pushState({}, '', '/auth?code=secret');
  expect(order).toEqual(['first:false', 'second:false', 'vendor']);
  removeFirst();
  order.length = 0;
  window.history.pushState({}, '', '/#board-courses');
  expect(order).toEqual(['second:true', 'vendor']);
  removeSecond();
  window.history.pushState = original;
});

test('browser privacy signals hydrate without mismatching server markup', async () => {
  let browserSignal = false;
  Object.defineProperty(navigator, 'globalPrivacyControl', { configurable: true, get: () => browserSignal });
  const container = document.createElement('div');
  container.innerHTML = renderToString(<PrivacyControls />);
  document.body.append(container);
  browserSignal = true; // Server has no Navigator; the browser does.
  const recover = vi.fn();
  let root!: ReturnType<typeof hydrateRoot>;
  await act(async () => { root = hydrateRoot(container, <PrivacyControls />, { onRecoverableError: recover }); });
  expect(recover).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Permitir opcionales' })).toHaveProperty('disabled', true);
  expect(container.textContent).toContain('Tu navegador ha solicitado');
  act(() => root.unmount());
  container.remove();
});
