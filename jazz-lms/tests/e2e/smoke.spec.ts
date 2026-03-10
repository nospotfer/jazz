import { test, expect } from '@playwright/test';

test('landing and auth pages respond', async ({ request }) => {
  const landing = await request.get('/');
  const auth = await request.get('/auth');

  expect(landing.status()).toBeLessThan(400);
  expect(auth.status()).toBeLessThan(400);
});

test('protected routes redirect when user is not authenticated', async ({ request }) => {
  const dashboard = await request.get('/dashboard', { maxRedirects: 0 });
  const admin = await request.get('/admin', { maxRedirects: 0 });

  expect([301, 302, 307, 308]).toContain(dashboard.status());
  expect(dashboard.headers()['location']).toContain('/auth');

  expect([301, 302, 307, 308]).toContain(admin.status());
  expect(admin.headers()['location']).toContain('/dashboard');
});
