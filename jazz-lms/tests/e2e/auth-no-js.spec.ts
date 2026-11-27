import { expect, test } from '@playwright/test';

test.use({ javaScriptEnabled: false });

test('sign-in cannot send credentials before client hydration', async ({ page }) => {
  const submissions: string[] = [];
  await page.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() === 'POST' || !['127.0.0.1', 'localhost'].includes(url.hostname)) {
      submissions.push(request.method());
      await route.abort();
      return;
    }
    await route.continue();
  });
  await page.goto('/auth');
  await expect(page.locator('button[type=submit]')).toBeDisabled();
  await expect(page.locator('noscript')).toContainText(/JavaScript/);
  await expect(page.locator('input[type=email]')).toBeDisabled();
  await expect(page.locator('input[name=password]')).toBeDisabled();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/auth$/);
  await expect(page.locator('input[name=password]')).toHaveValue('');
  await expect(page.locator('button[type=submit]')).toBeDisabled();
  expect(submissions).toEqual([]);
});
