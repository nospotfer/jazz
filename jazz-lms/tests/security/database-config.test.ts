import { afterEach, describe, expect, test, vi } from 'vitest';

describe('database configuration errors', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  test('rejects a wrong protocol without exposing the connection credentials', async () => {
    const invalidUrl = 'mysql://example_user:private_fixture_value@database.example.test/app';
    vi.stubEnv('DATABASE_URL', invalidUrl);
    vi.resetModules();

    let message = '';
    try {
      await import('@/lib/db');
    } catch (error) {
      message = (error as Error).message;
    }

    expect(message).toContain('Invalid DATABASE_URL protocol');
    expect(message).not.toContain(invalidUrl);
    expect(message).not.toContain('private_fixture_value');
    expect(message).not.toContain('example_user');
  });
});
