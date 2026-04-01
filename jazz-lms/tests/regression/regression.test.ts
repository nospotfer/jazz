import { describe, expect, test } from 'vitest';
import { isLocalhostHost } from '@/lib/test-mode';
import { isValidMuxPlaybackId, extractMuxPlaybackId } from '@/lib/mux-playback';
import { hasValidSupabasePublicConfig, hasValidSupabaseServerConfig } from '@/lib/supabase-config';
import { isAdminRole, hasPermission } from '@/lib/admin/permissions';

/**
 * Regression tests guard against previously-observed edge cases
 * and ensure fixed behaviors do not regress.
 */

describe('Regression: localhost host detection does not match attacker domains', () => {
  test('rejects hostnames that contain localhost as substring', () => {
    expect(isLocalhostHost('localhost.attacker.com')).toBe(false);
    expect(isLocalhostHost('evil-localhost.com')).toBe(false);
    expect(isLocalhostHost('my-localhost:3000')).toBe(false);
  });

  test('rejects IP-like strings that are not actual loopback', () => {
    expect(isLocalhostHost('127.0.0.2:3000')).toBe(false);
    expect(isLocalhostHost('0.0.0.0')).toBe(false);
  });
});

describe('Regression: Mux playback extraction handles edge cases', () => {
  test('does not extract from Mux URL with short invalid ID', () => {
    const result = extractMuxPlaybackId('https://stream.mux.com/short');
    expect(result).toBe('');
  });

  test('handles Mux URL with .m3u8 extension', () => {
    const validId = 'TSZoZs4qPde01uwmlonYHcd6rMdpxQLZ3z1UQt7Mmaxg';
    const result = extractMuxPlaybackId(`https://stream.mux.com/${validId}.m3u8`);
    expect(result).toBe(validId);
  });

  test('returns empty for completely empty input', () => {
    expect(extractMuxPlaybackId('')).toBe('');
    expect(extractMuxPlaybackId(null)).toBe('');
    expect(extractMuxPlaybackId(undefined)).toBe('');
  });

  test('validates valid playback ID format', () => {
    expect(isValidMuxPlaybackId('TSZoZs4qPde01uwmlonYHcd6rMdpxQLZ3z1UQt7Mmaxg')).toBe(true);
    expect(isValidMuxPlaybackId('abc')).toBe(false);
    expect(isValidMuxPlaybackId('')).toBe(false);
  });
});

describe('Regression: Supabase config placeholder detection', () => {
  test('rejects placeholder URLs that look valid but contain marker strings', () => {
    expect(hasValidSupabasePublicConfig('https://your-project.supabase.co', 'real_anon_key')).toBe(false);
    expect(hasValidSupabasePublicConfig('https://real.supabase.co', 'your-anon-key')).toBe(false);
  });

  test('rejects service role placeholder', () => {
    expect(hasValidSupabaseServerConfig('https://real.supabase.co', 'anon', 'your_service_role_key')).toBe(false);
  });
});

describe('Regression: Permission type guard handles all falsy inputs', () => {
  test('isAdminRole rejects all falsy values', () => {
    expect(isAdminRole(null)).toBe(false);
    expect(isAdminRole(undefined)).toBe(false);
    expect(isAdminRole('')).toBe(false);
  });

  test('hasPermission handles null/undefined role gracefully', () => {
    expect(hasPermission(null, 'admin.access')).toBe(false);
    expect(hasPermission(undefined, 'admin.access')).toBe(false);
    expect(hasPermission('', 'admin.access')).toBe(false);
  });
});

describe('Regression: Pricing constants have valid ranges', () => {
  test('price must be positive number', async () => {
    const { DEFAULT_FULL_COURSE_PRICE_EUR } = await import('@/lib/pricing');
    expect(DEFAULT_FULL_COURSE_PRICE_EUR).toBeGreaterThan(0);
    expect(Number.isFinite(DEFAULT_FULL_COURSE_PRICE_EUR)).toBe(true);
  });

  test('lesson count and duration must be positive integers', async () => {
    const { DEFAULT_LESSON_DURATION_MINUTES, DEFAULT_COURSE_LESSON_COUNT } = await import('@/lib/pricing');
    expect(Number.isInteger(DEFAULT_LESSON_DURATION_MINUTES)).toBe(true);
    expect(Number.isInteger(DEFAULT_COURSE_LESSON_COUNT)).toBe(true);
    expect(DEFAULT_LESSON_DURATION_MINUTES).toBeGreaterThan(0);
    expect(DEFAULT_COURSE_LESSON_COUNT).toBeGreaterThan(0);
  });
});

describe('Regression: Language normalization edge cases', () => {
  test('handles case variations consistently', async () => {
    const { normalizeLanguage } = await import('@/lib/language');
    expect(normalizeLanguage('PT-BR')).toBe('pt');
    expect(normalizeLanguage('Pt-Br')).toBe('pt');
    expect(normalizeLanguage('pt_BR')).toBe('pt');
    expect(normalizeLanguage('PT_br')).toBe('pt');
  });
});
