import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { isIsolatedLocalTestRequest, isLocalTestRequest } from '@/lib/test-mode';

beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'test');
  vi.stubEnv('VERCEL_ENV', '');
  vi.stubEnv('ENABLE_LOCAL_TEST_CHECKOUT', '1');
  vi.stubEnv('ENABLE_LOCAL_TEST_RESETS', '1');
  vi.stubEnv('DATABASE_URL', 'postgresql://postgres@127.0.0.1:55432/jazz_maintenance');
});
afterEach(() => vi.unstubAllEnvs());

describe.each([
  ['synthetic checkout', isLocalTestRequest, 'ENABLE_LOCAL_TEST_CHECKOUT'],
  ['destructive fixture resets', isIsolatedLocalTestRequest, 'ENABLE_LOCAL_TEST_RESETS'],
] as const)('%s isolation', (_label, check, flagName) => {
  const request = (url = 'http://localhost:3000/api/test', headers?: Record<string, string>) =>
    new Request(url, { headers });

  test.each([
    'postgresql://postgres@127.0.0.1:55432/jazz_maintenance',
    'postgresql://postgres@localhost:56122/postgres?schema=public&connection_limit=1',
  ])('allows explicit opt-in for the known disposable database %s', databaseUrl => {
    vi.stubEnv('DATABASE_URL', databaseUrl);
    expect(check(request())).toBe(true);
    expect(check(request('http://localhost:3000/api/test', {
      host: 'localhost:3000', origin: 'http://localhost:3000',
    }))).toBe(true);
  });

  test('production rejects local URL, spoofed headers and an enabled flag', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(check(request('http://localhost:3000/api/test', {
      host: 'localhost:3000', 'x-forwarded-host': 'localhost:3000', origin: 'http://localhost:3000',
    }))).toBe(false);
  });

  test('accepts the same-port loopback browser alias used by Next development', () => {
    expect(check(request('http://localhost:3010/api/test', {
      host: '127.0.0.1:3010', 'x-forwarded-host': '127.0.0.1:3010', origin: 'http://127.0.0.1:3010',
    }))).toBe(true);
  });

  test('production Vercel environment cannot be overridden by development NODE_ENV', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('VERCEL_ENV', 'production');
    expect(check(request())).toBe(false);
  });

  test.each(['', '0', 'false', undefined])('requires its own explicit flag: %s', flag => {
    vi.stubEnv(flagName, flag);
    expect(check(request())).toBe(false);
  });

  test.each([
    'postgresql://postgres@project.supabase.co:5432/postgres',
    'postgresql://postgres@localhost.attacker.test:55432/jazz_maintenance',
    'postgresql://postgres@127.0.0.1:5432/jazz_maintenance',
    'postgresql://postgres@127.0.0.1:56122/customer_database',
    'postgresql://postgres@127.0.0.1:55432/jazz_maintenance?host=remote.example.test',
    'postgresql://postgres@127.0.0.1:56122/postgres?schema=auth',
    'https://127.0.0.1:56122/postgres',
    'malformed', '',
  ])('rejects external, wrong or overridable database target %s', databaseUrl => {
    vi.stubEnv('DATABASE_URL', databaseUrl);
    expect(check(request())).toBe(false);
  });

  test('remote request URL cannot be overridden by localhost headers or origin', () => {
    expect(check(request('https://remote.example.test/api/test', {
      host: 'localhost:3000', 'x-forwarded-host': 'localhost:3000', origin: 'http://localhost:3000',
    }))).toBe(false);
  });

  const transportHeaders: Array<Record<string, string>> = [
    { origin: 'https://attacker.example.test' },
    { origin: 'http://localhost:3000 invalid' },
    { origin: 'http://localhost:3000/path' },
    { origin: 'http://localhost:4000' },
    { origin: 'https://localhost:3000' },
    { host: '127.0.0.1:4000' },
    { host: 'attacker.example.test' },
    { host: 'localhost:3000 invalid' },
    { 'x-forwarded-host': 'attacker.example.test' },
  ];
  test.each(transportHeaders)('rejects malformed, mismatched or external transport headers %j', headers => {
    expect(check(request('http://localhost:3000/api/test', headers))).toBe(false);
  });
});

test('checkout opt-in never enables reset helpers', () => {
  vi.stubEnv('ENABLE_LOCAL_TEST_RESETS', '0');
  const request = new Request('http://localhost:3000/api/test');
  expect(isLocalTestRequest(request)).toBe(true);
  expect(isIsolatedLocalTestRequest(request)).toBe(false);
});
