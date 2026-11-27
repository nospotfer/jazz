import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ findUnique: vi.fn(), upsert: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: { user: { findUnique: mocks.findUnique, upsert: mocks.upsert } } }));

const providerOrigin = 'https://signup-contract.example.invalid';
const email = 'student+jazz@example.com';
const actor = { id: '00000000-0000-4000-8000-000000000041', email, email_confirmed_at: null, user_metadata: { full_name: 'Original name' } };
type ProviderRequest = { method: string; path: string; body: Record<string, unknown> | null };
let requests: ProviderRequest[];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}
function post(body: unknown) {
  return new Request('https://app.example.invalid/api/auth/fixture', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
}
function expectConfirmationRequest() {
  const confirmation = requests.filter(request => request.path === '/auth/v1/resend');
  expect(confirmation).toHaveLength(1);
  expect(confirmation[0]).toEqual({ method: 'POST', path: '/auth/v1/resend', body: {
    type: 'signup', email, gotrue_meta_security: {},
  } });
  expect(confirmation[0].body).not.toHaveProperty('password');
  expect(requests.some(request => ['/auth/v1/otp', '/auth/v1/signup'].includes(request.path))).toBe(false);
}

beforeEach(() => {
  vi.resetModules(); vi.resetAllMocks();
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', providerOrigin);
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'synthetic-public-key');
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'synthetic-service-key');
  vi.stubEnv('ADMIN_OWNER_EMAIL', 'owner@example.invalid');
  mocks.findUnique.mockResolvedValue({ id: actor.id, email, emailVerified: false });
  mocks.upsert.mockResolvedValue(actor);
  requests = [];
  // Real installed Supabase SDK; every transport is intercepted. The fixture
  // rejects the old OTP path for an unconfirmed user with public signup off.
  vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(typeof input === 'string' || input instanceof URL ? input.toString() : input.url);
    if (url.origin !== providerOrigin) throw new Error('Unexpected provider origin in closed contract test');
    const method = init?.method || 'GET';
    const body = init?.body ? JSON.parse(String(init.body)) : null;
    requests.push({ method, path: url.pathname, body });
    if (method === 'GET' && url.pathname === `/auth/v1/admin/users/${actor.id}`) return json({ user: actor });
    if (method === 'POST' && url.pathname === '/auth/v1/admin/users') return json({ user: actor });
    if (method === 'POST' && url.pathname === '/auth/v1/resend') return json({});
    if (method === 'POST' && ['/auth/v1/signup', '/auth/v1/otp'].includes(url.pathname)) {
      return json({ code: 'signup_disabled', msg: 'Signups not allowed for this instance' }, 422);
    }
    throw new Error('Unexpected provider route in closed contract test');
  }));
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('pending signup confirmation uses the real SDK resend contract', () => {
  test.each(['register', 'send-code'])('%s confirms an existing pending account without signup or credential mutation', async route => {
    const { POST } = route === 'register'
      ? await import('@/app/api/auth/register/route')
      : await import('@/app/api/auth/send-code/route');
    const response = await POST(post({ email: ' Student+Jazz@Example.COM ', password: 'synthetic-new-password', fullName: 'Replacement name' }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true });
    expectConfirmationRequest();
    expect(requests).toHaveLength(2);
    expect(requests[0]).toMatchObject({ method: 'GET', path: `/auth/v1/admin/users/${actor.id}` });
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  test('new registration creates one unconfirmed USER and sends its signup confirmation', async () => {
    mocks.findUnique.mockResolvedValue(null);
    const { POST } = await import('@/app/api/auth/register/route');
    const response = await POST(post({ email, password: 'synthetic-initial-password', fullName: 'Student' }));
    expect(response.status).toBe(200);
    expectConfirmationRequest();
    expect(requests).toHaveLength(2);
    expect(requests[0]).toMatchObject({ method: 'POST', path: '/auth/v1/admin/users', body: {
      email, password: 'synthetic-initial-password', email_confirm: false,
    } });
    expect(mocks.upsert).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      create: expect.objectContaining({ id: actor.id, email, emailVerified: false, role: 'USER' }), update: {},
    }));
  });

  test('unknown resend remains neutral and cannot create an Auth or application account', async () => {
    mocks.findUnique.mockResolvedValue(null);
    const { POST } = await import('@/app/api/auth/send-code/route');
    const response = await POST(post({ email }));
    expect(response.status).toBe(200);
    expectConfirmationRequest();
    expect(requests).toHaveLength(1);
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
});
