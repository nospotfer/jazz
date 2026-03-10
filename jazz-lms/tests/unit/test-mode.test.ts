import { afterEach, describe, expect, test } from 'vitest';
import { isLocalhostHost, isLocalTestRequest } from '@/lib/test-mode';

const setNodeEnv = (value: string | undefined) => {
  (process.env as Record<string, string | undefined>).NODE_ENV = value;
};

describe('test-mode host detection', () => {
  test('recognizes loopback hosts and rejects external hosts', () => {
    expect(isLocalhostHost('localhost')).toBe(true);
    expect(isLocalhostHost('localhost:3000')).toBe(true);
    expect(isLocalhostHost('127.0.0.1')).toBe(true);
    expect(isLocalhostHost('127.0.0.1:8080')).toBe(true);
    expect(isLocalhostHost('[::1]')).toBe(true);
    expect(isLocalhostHost('[::1]:3000')).toBe(true);

    expect(isLocalhostHost('localhost.attacker.com')).toBe(false);
    expect(isLocalhostHost('evil-localhost.com')).toBe(false);
    expect(isLocalhostHost('example.com')).toBe(false);
    expect(isLocalhostHost('   ')).toBe(false);
    expect(isLocalhostHost('http://localhost/path')).toBe(true);
    expect(isLocalhostHost('http:///')).toBe(false);
    expect(isLocalhostHost(null)).toBe(false);
  });
});

describe('test-mode request detection', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    setNodeEnv(originalNodeEnv);
  });

  test('returns false in production', () => {
    setNodeEnv('production');
    const req = new Request('http://example.com', {
      headers: { host: 'localhost:3000' },
    });
    expect(isLocalTestRequest(req)).toBe(false);
  });

  test('accepts localhost host header in non-production', () => {
    setNodeEnv('test');
    const req = new Request('http://example.com', {
      headers: { host: 'localhost:3000' },
    });
    expect(isLocalTestRequest(req)).toBe(true);
  });

  test('accepts localhost origin in non-production', () => {
    setNodeEnv('test');
    const req = new Request('http://example.com', {
      headers: { origin: 'http://127.0.0.1:3000' },
    });
    expect(isLocalTestRequest(req)).toBe(true);
  });

  test('rejects malformed and non-local origin/host', () => {
    setNodeEnv('test');
    const req = new Request('http://example.com', {
      headers: {
        host: 'api.example.com',
        origin: 'http://localhost.attacker.com',
      },
    });
    expect(isLocalTestRequest(req)).toBe(false);

    const malformedOriginReq = new Request('http://example.com', {
      headers: {
        host: 'api.example.com',
        origin: 'localhost.attacker.com',
      },
    });
    expect(isLocalTestRequest(malformedOriginReq)).toBe(false);

    const fallbackLocalOriginReq = new Request('http://example.com', {
      headers: {
        host: 'api.example.com',
        origin: 'http://localhost:3000 invalid',
      },
    });
    expect(isLocalTestRequest(fallbackLocalOriginReq)).toBe(true);
  });
});
