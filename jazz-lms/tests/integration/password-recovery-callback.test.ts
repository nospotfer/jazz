import { beforeEach, describe, expect, test, vi } from 'vitest';
const exchange = vi.hoisted(() => vi.fn());
vi.mock('@/utils/supabase/server', () => ({ createClient: () => ({ auth: { exchangeCodeForSession: exchange } }) }));
vi.mock('@/lib/app-origin', () => ({ resolveServerAppOrigin: () => 'https://app.example.test' }));
import { GET } from '@/app/auth/reset-password/callback/route';

beforeEach(() => { vi.resetAllMocks(); });
describe('password recovery callback', () => {
  test('forwards legacy fragment-based links for browser verification without declaring an error', async () => {
    const response = await GET(new Request('https://app.example.test/auth/reset-password/callback'));
    expect(response.headers.get('location')).toBe('https://app.example.test/auth/reset-password');
    expect(exchange).not.toHaveBeenCalled();
  });
  test('exchanges a PKCE code once before rendering the reset page', async () => {
    exchange.mockResolvedValue({ data: { session: { user: { id: 'fixture' } } }, error: null });
    const response = await GET(new Request('https://app.example.test/auth/reset-password/callback?code=fixture-code'));
    expect(exchange).toHaveBeenCalledOnce();
    expect(exchange).toHaveBeenCalledWith('fixture-code');
    expect(response.headers.get('location')).toBe('https://app.example.test/auth/reset-password?recovery=1');
  });
  test.each([{ data: { session: null }, error: null }, { data: { session: null }, error: { code: 'bad_code' } }])(
    'does not mark recovery successful without a provider session', async (result) => {
      exchange.mockResolvedValue(result);
      const response = await GET(new Request('https://app.example.test/auth/reset-password/callback?code=fixture-code'));
      expect(response.headers.get('location')).toContain('reset_error=exchange_failed');
    },
  );
});
