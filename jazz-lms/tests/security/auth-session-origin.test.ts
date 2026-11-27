import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { POST } from '@/app/api/auth/session/route';
import { evaluateIngressRequest } from '../../scripts/native/ingress-policy.mjs';

const state = vi.hoisted(() => ({
  writes: [] as string[],
  setSession: vi.fn(),
  createClient: vi.fn(),
}));
vi.mock('@/utils/supabase/server', () => ({ createClient: state.createClient }));

const hosted = 'https://app.example.invalid';
const tokens = { accessToken: 'synthetic-attacker-access-token', refreshToken: 'synthetic-attacker-refresh-token' };
function request(origin: string | undefined = hosted, contentType: string | undefined = 'application/json',
  body = JSON.stringify(tokens), url = `${hosted}/api/auth/session`, extra: Record<string, string> = {}) {
  const headers = new Headers(extra);
  if (origin !== undefined) headers.set('origin', origin);
  if (contentType !== undefined) headers.set('content-type', contentType);
  const req = new Request(url, { method: 'POST', headers, body });
  vi.spyOn(req, 'json');
  return req;
}
function untouched(req: Request) {
  expect(req.json).not.toHaveBeenCalled();
  expect(state.createClient).not.toHaveBeenCalled();
  expect(state.setSession).not.toHaveBeenCalled();
  expect(state.writes).toEqual([]);
}
beforeEach(() => {
  state.writes.length = 0;
  state.createClient.mockReset().mockReturnValue({ auth: { setSession: state.setSession } });
  state.setSession.mockReset().mockImplementation(async () => {
    state.writes.push('synthetic-session-cookie');
    return { error: null };
  });
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('APP_URL', hosted);
  vi.stubEnv('NEXT_PUBLIC_APP_URL', hosted);
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Network denied in closed regression'); }));
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe('session synchronization browser boundary', () => {
  test.each(['application/json', 'application/json; charset=utf-8', 'Application/JSON; Charset=UTF-8'])(
    'accepts same-origin hosted JSON %s and synchronizes exact tokens', async mediaType => {
      const req = request(hosted, mediaType);
      expect((await POST(req)).status).toBe(200);
      expect(state.setSession).toHaveBeenCalledExactlyOnceWith({ access_token: tokens.accessToken, refresh_token: tokens.refreshToken });
      expect(state.writes).toEqual(['synthetic-session-cookie']);
    });

  test('accepts configured native HTTPS preview behind its private HTTP adapter', async () => {
    const origin = 'https://synthetic-jazz.trycloudflare.com';
    vi.stubEnv('APP_URL', origin); vi.stubEnv('NEXT_PUBLIC_APP_URL', origin);
    const req = request(origin, 'application/json', JSON.stringify(tokens), 'http://synthetic-jazz.trycloudflare.com:443/api/auth/session',
      { host: 'synthetic-jazz.trycloudflare.com', 'x-forwarded-host': 'synthetic-jazz.trycloudflare.com', 'x-forwarded-proto': 'https' });
    expect((await POST(req)).status).toBe(200);
    expect(state.setSession).toHaveBeenCalledOnce();
  });

  test.each(['localhost', '127.0.0.1'])('accepts development loopback %s with the existing helper', async host => {
    vi.stubEnv('NODE_ENV', 'development');
    const origin = `http://${host}:3010`;
    const req = request(origin, 'application/json', JSON.stringify(tokens), 'http://localhost:3010/api/auth/session', { host: `${host}:3010` });
    expect((await POST(req)).status).toBe(200);
    expect(state.setSession).toHaveBeenCalledOnce();
  });

  test.each([
    undefined, 'null', 'https://foreign.example.invalid', 'not-an-origin',
    `${hosted}/`, `${hosted}/path`, `${hosted}?q=x`, `${hosted}#fragment`,
    'http://app.example.invalid', 'https://app.example.invalid:444',
    'https://app.example.invalid@foreign.example.invalid',
    `${hosted} https://foreign.example.invalid`,
  ])('rejects missing/null/foreign/malformed Origin %s before parsing or SDK access', async origin => {
    const req = request();
    if (origin === undefined) req.headers.delete('origin'); else req.headers.set('origin', origin);
    expect((await POST(req)).status).toBe(403);
    untouched(req);
  });

  test.each([undefined, 'text/plain', 'application/x-www-form-urlencoded', 'multipart/form-data; boundary=synthetic', 'application/jsonp'])(
    'rejects non-JSON content type %s before parsing or SDK access', async mediaType => {
      const req = request();
      if (mediaType === undefined) req.headers.delete('content-type'); else req.headers.set('content-type', mediaType);
      expect((await POST(req)).status).toBe(415);
      untouched(req);
    });

  test('rejects a browser text/plain form encoding that remains valid JSON', async () => {
    // HTML form text/plain emits name=value followed by CRLF. The '=' can be
    // absorbed in an extra JSON string; no custom headers or preflight needed.
    const name = `{"accessToken":"${tokens.accessToken}","refreshToken":"${tokens.refreshToken}","padding":"`;
    const body = `${name}="}\r\n`;
    expect(JSON.parse(body).accessToken).toBe(tokens.accessToken);
    const req = request('https://attacker.example.invalid', 'text/plain', body);
    expect((await POST(req)).status).toBe(403);
    untouched(req);
  });

  test('does not trust forwarded Origin authority or production Host hints', async () => {
    const attacker = 'https://attacker.example.invalid';
    const req = request(attacker, 'application/json', JSON.stringify(tokens), `${hosted}/api/auth/session`, {
      host: 'attacker.example.invalid', 'x-forwarded-host': 'attacker.example.invalid', 'x-forwarded-proto': 'https',
      forwarded: 'host=attacker.example.invalid;proto=https',
    });
    expect((await POST(req)).status).toBe(403);
    untouched(req);
  });

  test('does not let development foreign Host hints replace the loopback authority', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const req = request('https://attacker.example.invalid', 'application/json', JSON.stringify(tokens), 'http://localhost:3010/api/auth/session', { host: 'attacker.example.invalid' });
    expect((await POST(req)).status).toBe(403); untouched(req);
  });

  test('requires same scheme and development loopback port', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const req = request('http://127.0.0.1:9000', 'application/json', JSON.stringify(tokens), 'http://localhost:3010/api/auth/session', { host: '127.0.0.1:9000' });
    expect((await POST(req)).status).toBe(403); untouched(req);
  });

  test('native recovery ingress forwards foreign Origin and text/plain, so the route must reject it', async () => {
    const host = 'synthetic-jazz.trycloudflare.com';
    const attacker = 'https://attacker.example.invalid';
    const decision = evaluateIngressRequest({ method: 'POST', target: '/api/auth/session', headers: {
      host, 'x-forwarded-proto': 'https', 'cf-connecting-ip': '203.0.113.5', origin: attacker, 'content-type': 'text/plain',
    } }, { canonicalHost: host, recoveryAccess: true });
    expect(decision.action).toBe('proxy');
    expect(decision.headers?.origin).toBe(attacker);
    expect(decision.headers?.['content-type']).toBe('text/plain');
    vi.stubEnv('APP_URL', `https://${host}`);
    const req = request(attacker, 'text/plain', JSON.stringify(tokens), `https://${host}/api/auth/session`);
    expect((await POST(req)).status).toBe(403); untouched(req);
  });

  test('retains malformed-body 400 after successful boundary checks', async () => {
    const req = request(hosted, 'application/json', '{');
    expect((await POST(req)).status).toBe(400);
    expect(req.json).toHaveBeenCalledOnce();
    expect(state.createClient).not.toHaveBeenCalled();
  });

  test('retains missing-token 400 and provider rejection 401', async () => {
    expect((await POST(request(hosted, 'application/json', '{}'))).status).toBe(400);
    expect(state.createClient).not.toHaveBeenCalled();
    state.setSession.mockResolvedValueOnce({ error: { message: 'Synthetic provider denial' } });
    expect((await POST(request())).status).toBe(401);
  });
});
