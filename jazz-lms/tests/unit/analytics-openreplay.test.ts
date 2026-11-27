// @vitest-environment jsdom
// @vitest-environment-options {"url":"https://www.culturadeljazz.com/"}
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { saveAnalyticsConsent } from '@/lib/analytics/consent';

const sdk = vi.hoisted(() => ({ constructor: vi.fn(), start: vi.fn(), stop: vi.fn() }));
vi.mock('@openreplay/tracker', () => ({ default: class {
  constructor(options: unknown) { sdk.constructor(options); }
  start = sdk.start;
  stop = sdk.stop;
} }));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  sdk.start.mockResolvedValue({ success: true });
  vi.stubEnv('NEXT_PUBLIC_OPENREPLAY_ENABLED', 'true');
  vi.stubEnv('NEXT_PUBLIC_OPENREPLAY_PROJECT_KEY', 'isolated-test-project');
  window.history.replaceState({}, '', '/');
  localStorage.clear();
  Object.defineProperty(navigator, 'doNotTrack', { configurable: true, value: undefined });
  Object.defineProperty(navigator, 'globalPrivacyControl', { configurable: true, value: false });
  Object.defineProperty(document, 'referrer', { configurable: true, value: '' });
});

describe('public replay collection boundaries', () => {
  test('does not load or start without consent, and stop does not initialize SDK', async () => {
    const { startTracker, stopTracker } = await import('@/lib/analytics/openreplay');
    await startTracker();
    await stopTracker();
    expect(sdk.constructor).not.toHaveBeenCalled();
    expect(sdk.start).not.toHaveBeenCalled();
  });
  test.each(['/auth?tab=register', '/dashboard', '/courses/id', '/?code=sensitive', '/#access_token=sensitive'])('does not initialize on %s after replay opt-in', async path => {
    saveAnalyticsConsent({ analytics: true, replay: true });
    window.history.replaceState({}, '', path);
    const { startTracker } = await import('@/lib/analytics/openreplay');
    await startTracker();
    expect(sdk.constructor).not.toHaveBeenCalled();
  });
  test('masks entire forms/media and disables network, headers, console and identities', async () => {
    saveAnalyticsConsent({ analytics: false, replay: true });
    const trackerModule = await import('@/lib/analytics/openreplay');
    await trackerModule.startTracker();
    const options = sdk.constructor.mock.calls[0][0] as {
      domSanitizer: (node: Element) => number;
      urls: { urlSanitizer: (url: string) => string; titleSanitizer: () => string };
    };
    expect(options).toMatchObject({
      defaultInputMode: 2, captureIFrames: false, consoleMethods: null,
      captureExceptions: false, captureResourceTimings: false,
      network: { disabled: true, capturePayload: false, ignoreHeaders: true, sessionTokenHeader: false },
    });
    document.body.innerHTML = '<p id="public">Jazz</p><form><label id="label">Account email</label><input value="secret" /></form><mux-player><div id="media"></div></mux-player>';
    expect(options.domSanitizer(document.querySelector('#public')!)).toBe(0);
    for (const selector of ['form', 'input', '#label', 'mux-player', '#media']) {
      expect(options.domSanitizer(document.querySelector(selector)!)).toBe(2);
    }
    expect(options.urls.urlSanitizer('https://example.com/auth?code=secret')).toBe('https://example.com/');
    expect('identifyUser' in trackerModule).toBe(false);
    expect('setTrackerMetadata' in trackerModule).toBe(false);
    window.history.replaceState({}, '', '/auth');
    expect(options.domSanitizer(document.querySelector('#public')!)).toBe(2);
  });
  test('a private incoming referrer prevents the SDK from leaking its unfiltered referrer field', async () => {
    saveAnalyticsConsent({ analytics: false, replay: true });
    Object.defineProperty(document, 'referrer', { configurable: true, value: 'https://www.culturadeljazz.com/auth?token=secret' });
    const { startTracker } = await import('@/lib/analytics/openreplay');
    await startTracker();
    expect(sdk.constructor).not.toHaveBeenCalled();
  });
  test('cancellation before a lazy start cannot resume collection', async () => {
    saveAnalyticsConsent({ analytics: false, replay: true });
    const { startTracker, stopTracker } = await import('@/lib/analytics/openreplay');
    const pending = startTracker();
    await stopTracker();
    window.history.replaceState({}, '', '/auth');
    await pending;
    expect(sdk.start).not.toHaveBeenCalled();
  });
  test('stops immediately while start handshake is pending, then safely restarts on remount', async () => {
    saveAnalyticsConsent({ analytics: false, replay: true });
    let resolveStart!: (value: { success: boolean }) => void;
    sdk.start.mockImplementationOnce(() => new Promise(resolve => { resolveStart = resolve; }));
    const { startTracker, stopTracker } = await import('@/lib/analytics/openreplay');
    const first = startTracker();
    await vi.waitFor(() => expect(sdk.start).toHaveBeenCalledOnce());
    await stopTracker();
    expect(sdk.stop).toHaveBeenCalledOnce();
    const remount = startTracker();
    resolveStart({ success: true });
    await Promise.all([first, remount]);
    expect(sdk.stop).toHaveBeenCalledTimes(2);
    expect(sdk.start).toHaveBeenCalledTimes(2);
  });
  test('failed SDK start is retryable and does not mark replay active', async () => {
    saveAnalyticsConsent({ analytics: false, replay: true });
    sdk.start.mockResolvedValueOnce({ success: false });
    const { startTracker } = await import('@/lib/analytics/openreplay');
    await startTracker();
    await startTracker();
    expect(sdk.start).toHaveBeenCalledTimes(2);
  });
});
