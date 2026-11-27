import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page, baseURL }) => {
  const origin = new URL(baseURL || 'http://127.0.0.1:3000').origin;
  await page.route('**/*', async route => {
    if (new URL(route.request().url()).origin !== origin) return route.abort();
    return route.continue();
  });
  await page.route('**/api/mux/promo-playback*', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"Preview unavailable"}' }));
  await page.addInitScript(() => {
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('jazz-language-v1', 'es');
  });
});

for (const width of [320, 390]) {
  test(`privacy choices remain accessible at ${width}px without an opt-in default`, async ({ page }) => {
    await page.setViewportSize({ width, height: 740 });
    await page.goto('/');
    const banner = page.getByRole('region', { name: 'Opciones de privacidad' });
    await expect(banner).toBeVisible();
    for (const name of ['Solo necesarias', 'Permitir opcionales', 'Personalizar']) {
      await expect(banner.getByRole('button', { name, exact: true })).toBeInViewport();
      await banner.getByRole('button', { name, exact: true }).click({ trial: true });
    }
    expect(await page.evaluate(() => localStorage.getItem('jazz-analytics-consent-v1'))).toBeNull();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await banner.getByRole('button', { name: 'Personalizar', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Opciones de privacidad' });
    await expect(dialog).toBeVisible();
    for (const checkbox of await dialog.getByRole('checkbox').all()) await expect(checkbox).not.toBeChecked();
    for (let i = 0; i < 8; i += 1) {
      await page.keyboard.press('Tab');
      expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(banner.getByRole('button', { name: 'Personalizar', exact: true })).toBeFocused();
    await banner.getByRole('button', { name: 'Solo necesarias', exact: true }).click();
    await expect(banner).not.toBeVisible();
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('jazz-analytics-consent-v1')!));
    expect(stored).toMatchObject({ version: 1, analytics: false, replay: false });
  });
}

test('independent choices persist and can be withdrawn without a reload', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Personalizar', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Opciones de privacidad' });
  await dialog.getByRole('checkbox', { name: /Grabaciones de navegación/ }).check();
  await dialog.getByRole('button', { name: 'Guardar elección' }).click();
  await expect(dialog).not.toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('jazz-analytics-consent-v1')!))).toMatchObject({ analytics: false, replay: true });
  await page.reload();
  await expect(page.getByRole('region', { name: 'Opciones de privacidad' })).not.toBeVisible();
  await page.getByRole('button', { name: 'Privacidad', exact: true }).click();
  await expect(dialog.getByRole('checkbox', { name: /Grabaciones de navegación/ })).toBeChecked();
  await expect(dialog.getByRole('checkbox', { name: /Estadísticas y calidad/ })).not.toBeChecked();
  await dialog.getByRole('button', { name: 'Solo necesarias' }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('jazz-analytics-consent-v1')!))).toMatchObject({ analytics: false, replay: false });
});

test('Global Privacy Control overrides a previous opt-in in the UI', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'globalPrivacyControl', { configurable: true, value: true });
    localStorage.setItem('jazz-analytics-consent-v1', JSON.stringify({ version: 1, analytics: true, replay: true, savedAt: Date.now() }));
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Privacidad', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Opciones de privacidad' });
  await expect(dialog.getByRole('status')).toHaveText(/Tu navegador ha solicitado/);
  for (const checkbox of await dialog.getByRole('checkbox').all()) {
    await expect(checkbox).toBeDisabled();
    await expect(checkbox).not.toBeChecked();
  }
  await dialog.getByRole('button', { name: 'Solo necesarias' }).click();
});

test('private pages expose settings without soliciting tracking or submitting account forms', async ({ page }) => {
  await page.goto('/auth?tab=register');
  await expect(page.getByRole('region', { name: 'Opciones de privacidad' })).not.toBeVisible();
  await page.getByRole('button', { name: 'Privacidad', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Opciones de privacidad' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('checkbox').first()).not.toBeChecked();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
});

test('local SEO publishes canonical share metadata and disallows indexing', async ({ page, request }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('La Cultura del Jazz');
  // Next normalizes the canonical homepage by removing its trailing slash.
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /^https:\/\/www\.culturadeljazz\.com\/?$/);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://www.culturadeljazz.com/images/Logo.jpeg');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await page.goto('/auth');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toMatch(/Disallow: \/\s/);
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).not.toContain('<loc>');
});
