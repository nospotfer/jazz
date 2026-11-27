import { afterEach, describe, expect, test, vi } from 'vitest';

async function getCsp() {
  const { default: config } = await import('../../next.config.mjs');
  const routes = await config.headers!();
  return routes[0].headers.find((header: { key: string }) => header.key === 'Content-Security-Policy')!.value;
}

describe('protected PDF embedding', () => {
  test('keeps pages unframeable and permits only same-origin attachment frames', async () => {
    const { default: config } = await import('../../next.config.mjs');
    const routes = await config.headers!();
    const policy = (rule: (typeof routes)[number]) => rule.headers.find(
      (header: { key: string }) => header.key === 'Content-Security-Policy',
    )!.value;
    expect(policy(routes[0])).toContain("frame-ancestors 'none'");
    const attachment = routes.find((rule: { source: string }) =>
      rule.source === '/api/lessons/:lessonId/attachments/:attachmentId');
    expect(attachment).toBeDefined();
    expect(policy(attachment!)).toContain("frame-ancestors 'self'");
    expect(policy(attachment!)).not.toContain("frame-ancestors 'none'");
    expect(attachment!.headers).toContainEqual({ key: 'X-Frame-Options', value: 'SAMEORIGIN' });
    expect(routes.filter((rule: (typeof routes)[number]) => policy(rule).includes("frame-ancestors 'self'")))
      .toHaveLength(1);
  });
});

describe('configured Supabase connect origins', () => {
  afterEach(() => vi.unstubAllEnvs());

  test('permits the isolated loopback auth service during development', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:56121');
    expect(await getCsp()).toContain('http://127.0.0.1:56121');
    expect(await getCsp()).toContain('ws://127.0.0.1:56121');
  });

  test('does not permit a configured HTTP auth service in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://auth.example.test');
    expect(await getCsp()).not.toContain('http://auth.example.test');
  });

  test('permits a custom HTTPS auth domain without exposing URL credentials', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://fixture:private-value@auth.example.test');
    const csp = await getCsp();
    expect(csp).toContain('https://auth.example.test');
    expect(csp).toContain('wss://auth.example.test');
    expect(csp).not.toContain('private-value');
  });
});

describe('configured OpenReplay connect origins', () => {
  afterEach(() => vi.unstubAllEnvs());

  test('emits an exact HTTPS origin once, discarding path and credentials', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_OPENREPLAY_ENABLED', 'true');
    vi.stubEnv('NEXT_PUBLIC_OPENREPLAY_INGEST_URL', 'https://fixture:private-value@api.openreplay.com/ingest');
    const connect = (await getCsp()).split('; ').find((directive: string) => directive.startsWith('connect-src'))!;
    expect(connect.split(' ').filter((entry: string) => entry === 'https://api.openreplay.com')).toHaveLength(1);
    expect(connect).not.toContain('private-value');
    expect(connect).not.toContain('/ingest');
  });

  test.each(['javascript:alert(1)', 'data:text/plain,example', 'file:///tmp/example', 'http://replay.example.test']) (
    'rejects unsafe production ingest protocols: %s', async (ingest) => {
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('NEXT_PUBLIC_OPENREPLAY_ENABLED', 'false');
      vi.stubEnv('NEXT_PUBLIC_OPENREPLAY_INGEST_URL', ingest);
      const csp = await getCsp();
      expect(csp).not.toContain('null');
      expect(csp).not.toContain('replay.example.test');
      expect(csp).not.toContain(ingest);
    },
  );
});
