// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  ANALYTICS_CONSENT_KEY, getAnalyticsPreferenceSnapshot, hasPrivacySignal,
  isAnalyticsUrlAllowed, isReplayReferrerAllowed, isValidGaMeasurementId, parseAnalyticsPreference,
  readAnalyticsConsent, sanitizeAnalyticsUrl, saveAnalyticsConsent, subscribeAnalyticsConsent,
} from '@/lib/analytics/consent';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  for (const name of ['_ga', '_ga_TEST123', 'muxData', 'jazz_lang']) document.cookie = `${name}=; Path=/; Max-Age=0`;
  Object.defineProperty(navigator, 'doNotTrack', { configurable: true, value: undefined });
  Object.defineProperty(navigator, 'globalPrivacyControl', { configurable: true, value: false });
});
afterEach(() => vi.restoreAllMocks());

describe('optional measurement preferences', () => {
  test('no stored preference denies both categories', () => {
    expect(readAnalyticsConsent()).toEqual({ analytics: false, replay: false, hasChoice: false, blockedByPrivacySignal: false });
  });
  test('independent preferences persist, and removal revokes a previous choice', () => {
    saveAnalyticsConsent({ analytics: true, replay: false });
    expect(readAnalyticsConsent()).toMatchObject({ analytics: true, replay: false, hasChoice: true });
    localStorage.removeItem(ANALYTICS_CONSENT_KEY);
    expect(readAnalyticsConsent()).toMatchObject({ analytics: false, replay: false, hasChoice: false });
  });
  test.each([
    'broken', '{}', 'null',
    JSON.stringify({ version: 0, analytics: true, replay: true, savedAt: 1000 }),
    JSON.stringify({ version: 1, analytics: 'true', replay: true, savedAt: 1000 }),
    JSON.stringify({ version: 1, analytics: true, replay: 1, savedAt: 1000 }),
    JSON.stringify({ version: 1, analytics: true, replay: true, savedAt: 1001 }),
    JSON.stringify({ version: 1, analytics: true, replay: true, savedAt: null }),
  ])('invalid/future preference fails closed: %s', raw => {
    expect(parseAnalyticsPreference(raw, 1000)).toBeNull();
  });
  test('expired choices are not silently renewed', () => {
    const raw = JSON.stringify({ version: 1, analytics: true, replay: true, savedAt: 1000 });
    expect(parseAnalyticsPreference(raw, 1000 + 181 * 24 * 60 * 60 * 1000)).toBeNull();
  });
  test('withdrawal removes optional identifiers but preserves necessary language/auth state', () => {
    for (const name of ['_ga', '_ga_TEST123', 'muxData', 'jazz_lang']) document.cookie = `${name}=fixture; Path=/`;
    localStorage.setItem('__openreplay_uuid', 'synthetic-viewer');
    sessionStorage.setItem('__openreplay_token', 'synthetic-session');
    localStorage.setItem('auth-session-fixture', 'preserve');
    saveAnalyticsConsent({ analytics: false, replay: false });
    expect(document.cookie).not.toMatch(/_ga|muxData/);
    expect(document.cookie).toContain('jazz_lang=fixture');
    expect(localStorage.getItem('__openreplay_uuid')).toBeNull();
    expect(sessionStorage.getItem('__openreplay_token')).toBeNull();
    expect(localStorage.getItem('auth-session-fixture')).toBe('preserve');
  });
  test('replay withdrawal does not erase analytics cookies while analytics remains allowed', () => {
    document.cookie = 'muxData=fixture; Path=/';
    localStorage.setItem('__openreplay_uuid', 'synthetic-viewer');
    saveAnalyticsConsent({ analytics: true, replay: false });
    expect(document.cookie).toContain('muxData=fixture');
    expect(localStorage.getItem('__openreplay_uuid')).toBeNull();
  });
  test.each(['1', 'yes'])('Do Not Track %s overrides an opt-in', value => {
    saveAnalyticsConsent({ analytics: true, replay: true });
    Object.defineProperty(navigator, 'doNotTrack', { configurable: true, value });
    expect(hasPrivacySignal()).toBe(true);
    expect(readAnalyticsConsent()).toMatchObject({ analytics: false, replay: false, hasChoice: true, blockedByPrivacySignal: true });
  });
  test('Global Privacy Control overrides both categories', () => {
    saveAnalyticsConsent({ analytics: true, replay: true });
    Object.defineProperty(navigator, 'globalPrivacyControl', { configurable: true, value: true });
    expect(readAnalyticsConsent()).toMatchObject({ analytics: false, replay: false, blockedByPrivacySignal: true });
  });
  test('blocked storage supports only the current page choice; cross-tab removal revokes it', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    saveAnalyticsConsent({ analytics: false, replay: true });
    expect(readAnalyticsConsent()).toMatchObject({ analytics: false, replay: true });
    const listener = vi.fn();
    const unsubscribe = subscribeAnalyticsConsent(listener);
    window.dispatchEvent(new StorageEvent('storage', { key: ANALYTICS_CONSENT_KEY, newValue: null }));
    expect(listener).toHaveBeenCalledOnce();
    expect(getAnalyticsPreferenceSnapshot()).toBeNull();
    unsubscribe();
  });
});

describe('public URL boundaries', () => {
  test.each(['/', '/#board-courses', '/#board-faq'])('known homepage URL %s is eligible', path => {
    expect(isAnalyticsUrlAllowed(`https://www.culturadeljazz.com${path}`)).toBe(true);
  });
  test.each(['/auth', '/dashboard', '/courses/id', '/admin', '/redeem', '/?code=secret', '/?utm_source=link', '/#access_token=secret'])('private or unknown URL %s is excluded', path => {
    expect(isAnalyticsUrlAllowed(`https://www.culturadeljazz.com${path}`)).toBe(false);
    expect(sanitizeAnalyticsUrl(`https://www.culturadeljazz.com${path}`)).toBe('https://www.culturadeljazz.com/');
  });
  test('invalid URLs cannot be recorded', () => {
    expect(isAnalyticsUrlAllowed('invalid')).toBe(false);
    expect(sanitizeAnalyticsUrl('invalid')).toBe('');
  });
  test('replay rejects unsanitized incoming account/query referrers, but permits direct/origin-only visits', () => {
    expect(isReplayReferrerAllowed('')).toBe(true);
    expect(isReplayReferrerAllowed('https://search.example/')).toBe(true);
    expect(isReplayReferrerAllowed('https://www.culturadeljazz.com/auth?code=secret')).toBe(false);
    expect(isReplayReferrerAllowed('https://external.example/account')).toBe(false);
  });
  test.each(['', 'G-abc', "G-ABC';alert(1)", undefined, 'UA-123'])('invalid measurement ID %s is rejected', id => {
    expect(isValidGaMeasurementId(id)).toBe(false);
  });
});
