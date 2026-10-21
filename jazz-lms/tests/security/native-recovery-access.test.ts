import { fork, type ChildProcess } from 'node:child_process';
import { chmodSync, copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';
import { evaluateIngressRequest, isRecoveryRequestAllowed } from '../../scripts/native/ingress-policy.mjs';
import { createIngressServer } from '../../scripts/native/ingress-server.mjs';

const readPaths = ['/', '/auth', '/dashboard', '/admin', '/robots.txt', '/favicon.ico',
  '/api/dashboard/courses-progress', '/api/dashboard/pdf-count', '/api/dashboard/quiz-medals',
  '/api/dashboard/quiz-medals/profile', '/api/dashboard/course-completion-recognition',
  '/_next/static/chunks/app.js', '/_next/static/media/font.woff2', '/images/logo-mark.png',
  '/avatars/jazz-cat-1.svg', '/_next/image?url=%2Fimages%2Flogo-mark.png&w=96&q=100'];
const deniedPaths = ['/api/messages', '/api/messages/thread', '/api/messages/unread-count',
  '/auth/callback', '/auth/google/callback', '/api/auth/google/callback', '/auth/forgot-password',
  '/auth/reset-password', '/api/auth/register', '/api/auth/send-code', '/api/auth/verify-code',
  '/dashboard/profile', '/dashboard/payment', '/dashboard/notes/course/lesson', '/admin/users',
  '/api/admin/metrics/revalidate', '/api/purchases', '/api/purchases/auto-reconcile', '/api/checkout',
  '/api/vouchers/redeem', '/api/cron/payments-sweep', '/api/webhooks/dodo-jazzlms', '/api/webhooks/messages-email',
  '/api/courses/course/lessons/lesson/progress', '/api/courses/course/lessons/lesson/quiz',
  '/courses/course/lessons/lesson', '/api/lessons/lesson/attachments/file',
  '/_next/static/../api/checkout', '/_next/static/%2e%2e/api/checkout', '/_next/static/..%2fapi/checkout',
  '/_next/static/%252e%252e/api/checkout', '/_next/static//chunks/app.js', '/_next/static/chunks/./app.js',
  '/_next/static/chunks/../app.js', '/_next/static%2f../api/checkout', '/_next/static\\..\\api\\checkout',
  '/%61dmin', '/dashboard/', '//dashboard', '/api//auth/session',
  '/_next/image?url=https%3A%2F%2Fother.example.test%2Ffile.png&w=96&q=100',
  '/_next/image?url=%2Fimages%2F..%2Fapi%2Fcheckout&w=96&q=100',
  '/_next/image?url=%2Fimages%2Flogo-mark.png&w=96&q=100&url=%2Fapi%2Fcheckout'];

function allowed(target: string, method = 'GET', headers: Record<string, string> = {}) {
  return isRecoveryRequestAllowed({ target, method, headers });
}

describe('explicit recovery request surface', () => {
  test.each(readPaths)('permits the reviewed read path %s', target => {
    expect(allowed(target)).toBe(true); expect(allowed(target, 'HEAD')).toBe(true);
  });
  test.each(deniedPaths)('denies unreviewed or ambiguous path %s', target => {
    expect(allowed(target)).toBe(false);
  });
  test.each(['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'])('denies %s on allowed pages and assets', method => {
    for (const target of readPaths) expect(allowed(target, method)).toBe(false);
  });
  test('permits only the exact session synchronization POST', () => {
    expect(allowed('/api/auth/session', 'POST')).toBe(true);
    expect(allowed('/api/auth/session')).toBe(false);
    expect(allowed('/api/auth/session/', 'POST')).toBe(false);
  });
  test.each(['next-action', 'Next-Action', 'NEXT-ACTION', 'x-matched-path', 'x-now-route-matches',
    'x-invoke-path', 'x-middleware-rewrite', 'x-middleware-subrequest', 'x-nextjs-rewritten-path'])(
    'rejects action or internal routing header %s before application dispatch', header => {
    expect(allowed('/dashboard', 'GET', { [header]: 'synthetic-action' })).toBe(false);
    expect(allowed('/api/auth/session', 'POST', { [header]: 'synthetic-action' })).toBe(false);
  });
  test('applies the recovery allowlist at the edge while keeping ordinary preview routing unchanged', () => {
    const input = { method: 'GET', target: '/api/messages', headers: {
      host: 'synthetic-recovery.trycloudflare.com', 'x-forwarded-proto': 'https', 'cf-connecting-ip': '203.0.113.42',
    } };
    expect(evaluateIngressRequest(input, { canonicalHost: input.headers.host }).action).toBe('proxy');
    expect(evaluateIngressRequest(input, { canonicalHost: input.headers.host, recoveryAccess: true })).toMatchObject({ action: 'deny', status: 403 });
    expect(evaluateIngressRequest({ ...input, target: '/dashboard', headers: { ...input.headers, 'next-action': 'synthetic-action' } },
      { canonicalHost: input.headers.host, recoveryAccess: true }).action).toBe('deny');
  });
  test('cannot enable recovery ingress without the leased Basic gate', () => {
    expect(() => createIngressServer({ upstreamSocket: '/private/synthetic.sock',
      policy: { canonicalHost: 'synthetic-recovery.trycloudflare.com', recoveryAccess: true } })).toThrow('Invalid native recovery access configuration');
  });
});

const children: { process: ChildProcess; closed: Promise<unknown> }[] = [];
const directories: string[] = [];
afterEach(async () => {
  for (const child of children.splice(0)) {
    if (child.process.connected) child.process.send({ type: 'stop' }, () => {});
    const kill = setTimeout(() => child.process.kill('SIGKILL'), 3000);
    await child.closed; clearTimeout(kill);
  }
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

async function worker(options: { wrongLease?: boolean; wrongBrowserFlag?: boolean } = {}) {
  const directory = mkdtempSync(join(tmpdir(), 'jazz-recovery-worker-')); chmodSync(directory, 0o700); directories.push(directory);
  for (const file of ['next-worker.mjs', 'ingress-policy.mjs']) copyFileSync(resolve('scripts/native', file), join(directory, file));
  mkdirSync(join(directory, 'node_modules/next'), { recursive: true, mode: 0o700 });
  writeFileSync(join(directory, 'package.json'), '{"private":true}', { mode: 0o600 });
  writeFileSync(join(directory, 'node_modules/next/index.js'), `
let requests = 0;
module.exports = () => ({ prepare: async () => {}, close: async () => {},
  getRequestHandler: () => async (_req, res) => { res.end(JSON.stringify({ requests: ++requests })); }
});`, { mode: 0o600 });
  const socket = join(directory, 'app.sock'), expiresAt = Date.now() + 30_000;
  const child = fork(join(directory, 'next-worker.mjs'), [], { execArgv: [], cwd: directory,
    stdio: ['ignore', 'ignore', 'ignore', 'ipc'], env: { NODE_ENV: 'production', APP_DEPLOYMENT_ENVIRONMENT: 'preview',
      NATIVE_RECOVERY_ACCESS: 'true', NEXT_PUBLIC_RECOVERY_ACCESS: options.wrongBrowserFlag ? 'false' : 'true',
      NATIVE_RECOVERY_EXPIRES_AT: new Date(expiresAt + (options.wrongLease ? 1000 : 0)).toISOString() } });
  const closed = new Promise(resolveClosed => child.once('close', code => resolveClosed(code))); children.push({ process: child, closed });
  const ready = new Promise<string>((resolveReady, reject) => {
    const timer = setTimeout(() => reject(new Error('Recovery fixture worker readiness timeout')), 3000);
    child.on('message', message => {
      const type = (message as { type?: string }).type;
      if (type === 'ready' || type === 'failed') { clearTimeout(timer); resolveReady(type); }
    });
    child.once('error', () => { clearTimeout(timer); reject(new Error('Recovery fixture worker failed to start')); });
  });
  child.send({ type: 'start', socketPath: socket, hostname: 'synthetic-recovery.trycloudflare.com', nonce: 'a'.repeat(64), expiresAt });
  return { socket, ready: await ready };
}

function request(socketPath: string, path: string, method = 'GET', headers: Record<string, string> = {}) {
  return new Promise<{ status: number; body: string }>((resolveReply, reject) => {
    const client = http.request({ socketPath, path, method, headers, agent: false }, response => {
      let body = ''; response.on('data', chunk => { body += String(chunk); });
      response.once('end', () => resolveReply({ status: response.statusCode ?? 0, body }));
    });
    client.setTimeout(2000, () => client.destroy(new Error('Recovery fixture request timed out')));
    client.once('error', reject); client.end();
  });
}

test('the actual private worker rejects mutations and ambiguous paths before invoking its Next handler', async () => {
  const value = await worker(); expect(value.ready).toBe('ready');
  expect(JSON.parse((await request(value.socket, '/dashboard')).body).requests).toBe(1);
  for (const path of deniedPaths) expect((await request(value.socket, path)).status).toBe(403);
  expect((await request(value.socket, '/dashboard', 'POST')).status).toBe(403);
  expect((await request(value.socket, '/dashboard', 'GET', { 'Next-Action': 'synthetic-action' })).status).toBe(403);
  expect((await request(value.socket, '/dashboard', 'GET', { 'x-matched-path': '/api/messages' })).status).toBe(403);
  expect(JSON.parse((await request(value.socket, '/admin')).body).requests).toBe(2);
});

test.each([{ wrongLease: true }, { wrongBrowserFlag: true }])('the worker denies inconsistent recovery input %j before listening', async options => {
  expect((await worker(options)).ready).toBe('failed');
});
