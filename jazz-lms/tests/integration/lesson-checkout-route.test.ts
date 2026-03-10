import { describe, expect, test } from 'vitest';

describe('POST /api/lesson-checkout (deprecated)', () => {
  test('returns 410 Gone', async () => {
    const { POST } = await import('@/app/api/lesson-checkout/route');
    const response = await POST();
    const text = await response.text();

    expect(response.status).toBe(410);
    expect(text).toContain('no está disponible');
  });
});
