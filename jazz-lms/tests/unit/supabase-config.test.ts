import { describe, expect, test } from 'vitest';
import {
  hasValidSupabasePublicConfig,
  hasValidSupabaseServerConfig,
  normalizeSupabaseUrl,
} from '@/lib/supabase-config';

describe('supabase-config', () => {
  test('accepts valid public config', () => {
    expect(
      hasValidSupabasePublicConfig('https://proj.supabase.co', 'anon_real_key')
    ).toBe(true);
  });

  test('rejects missing or placeholder public config', () => {
    expect(hasValidSupabasePublicConfig(undefined, 'anon')).toBe(false);
    expect(hasValidSupabasePublicConfig('', 'anon')).toBe(false);
    expect(hasValidSupabasePublicConfig('https://your-project.supabase.co', 'anon')).toBe(false);
    expect(hasValidSupabasePublicConfig('https://proj.supabase.co', 'your-anon-key')).toBe(false);
  });

  test('validates server config with service role', () => {
    expect(
      hasValidSupabaseServerConfig('https://proj.supabase.co', 'anon_real_key', 'service_real_key')
    ).toBe(true);
  });

  test('rejects server config if public config or service role is invalid', () => {
    expect(hasValidSupabaseServerConfig('https://proj.supabase.co', 'anon_real_key', undefined)).toBe(false);
    expect(
      hasValidSupabaseServerConfig('https://proj.supabase.co', 'anon_real_key', 'your_service_role_key')
    ).toBe(false);
    expect(
      hasValidSupabaseServerConfig('https://your-project.supabase.co', 'anon_real_key', 'service_real_key')
    ).toBe(false);
  });

  test('normalizes urls and trims trailing slashes', () => {
    expect(normalizeSupabaseUrl('https://proj.supabase.co///')).toBe('https://proj.supabase.co');
    expect(normalizeSupabaseUrl(' https://proj.supabase.co/ ')).toBe('https://proj.supabase.co');
  });

  test('returns null for empty or missing urls', () => {
    expect(normalizeSupabaseUrl(undefined)).toBeNull();
    expect(normalizeSupabaseUrl('')).toBeNull();
    expect(normalizeSupabaseUrl('   ')).toBeNull();
  });

  test('rejects placeholder-like service role variations', () => {
    expect(
      hasValidSupabaseServerConfig('https://proj.supabase.co', 'anon_real_key', 'MY_YOUR_SERVICE_ROLE_KEY_VALUE')
    ).toBe(false);
  });
});
