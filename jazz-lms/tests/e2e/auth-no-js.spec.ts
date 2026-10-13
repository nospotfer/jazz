import { expect, test } from '@playwright/test';

test.use({ javaScriptEnabled: false });

test('sign-in never puts credentials in the URL before client hydration', async ({ page }) => {
  await page.goto('/auth');
  let captured: { method: string; queryKeys: string[]; passwordInBody: boolean } | undefined;
  await page.route('**/auth**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    captured = {
      method: request.method(), queryKeys: [...url.searchParams.keys()],
      passwordInBody: new URLSearchParams(request.postData() ?? '').get('password') === 'synthetic-no-js-password',
    };
    await route.fulfill({ status: 200, contentType: 'text/plain', body: 'No-JavaScript form captured safely' });
  });
  await page.locator('input[type=email]').fill('no-js@example.test');
  await page.locator('input[name=password]').fill('synthetic-no-js-password');
  await Promise.all([
    page.waitForURL('**/auth'),
    page.locator('button[type=submit]').click(),
  ]);
  await expect(page.getByText('No-JavaScript form captured safely')).toBeVisible();
  expect(captured).toEqual({ method: 'POST', queryKeys: [], passwordInBody: true });
});
