import { expect, test, type Page } from '@playwright/test';
import { createLocalVoucherFixture } from '../helpers/local-voucher-fixture';

const configPath = process.env.MAINTENANCE_LOCAL_E2E_CONFIG;
test.use({ trace: 'off', screenshot: 'off', video: 'off' });
test.skip(!configPath, 'Requires the explicit disposable local Supabase configuration.');

async function privateFill(page: Page, selector: string, value: string) {
  try { await page.locator(selector).fill(value); }
  catch { throw new Error(`Unable to fill private field ${selector}`); }
}

async function hydratedForm(page: Page) {
  await page.waitForFunction(() => Array.from(document.querySelectorAll('form')).some((form) =>
    Object.keys(form).some((key) => key.startsWith('__reactProps$') &&
      typeof (form as unknown as Record<string, { onSubmit?: unknown }>)[key].onSubmit === 'function')
  ), undefined, { timeout: 45000 });
}

test('a real voucher UI unlocks only a new local learner and consumes the voucher once', async ({ page, context, baseURL }) => {
  test.setTimeout(120000);
  if (baseURL !== 'http://127.0.0.1:3010') throw new Error('Refusing voucher UI tests outside the disposable localhost app.');
  const fixture = await createLocalVoucherFixture(configPath!);
  try {
    await page.goto('/auth?tab=login', { waitUntil: 'domcontentloaded' });
    await hydratedForm(page);
    await privateFill(page, '#loginEmail', fixture.email);
    await privateFill(page, '#loginPassword', fixture.password);
    await page.locator('form button[type=submit]').click();
    await page.waitForURL((url) => url.pathname.startsWith('/dashboard'), { waitUntil: 'domcontentloaded', timeout: 45000 });
    expect((await context.request.get('/api/lessons/maintenance-lesson-2/mux-playback')).status()).toBe(403);

    await page.goto(`/redeem?courseId=${fixture.courseId}`, { waitUntil: 'domcontentloaded' });
    await hydratedForm(page);
    await privateFill(page, '#redeem-voucher-code', 'MTINVALID');
    const invalid = page.waitForResponse((response) => new URL(response.url()).pathname === '/api/vouchers/redeem');
    await page.locator('form button[type=submit]').click();
    expect((await invalid).status()).toBe(400);
    await expect(page.locator('div[role=alert]').filter({ has: page.locator('p') })).toBeVisible();
    expect(await fixture.db.purchase.count({ where: { userId: fixture.userId } })).toBe(0);

    await privateFill(page, '#redeem-voucher-code', fixture.voucherCode);
    const redeemed = page.waitForResponse((response) => new URL(response.url()).pathname === '/api/vouchers/redeem');
    await page.locator('form button[type=submit]').click();
    const response = await redeemed;
    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, accessGranted: true });
    await expect(page.getByRole('status')).toBeVisible();
    await page.waitForURL((url) => url.pathname === '/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 });
    expect((await context.request.get('/api/lessons/maintenance-lesson-2/mux-playback')).status()).toBe(200);
    const purchase = await fixture.db.purchase.findUnique({ where: { userId_courseId: { userId: fixture.userId, courseId: fixture.courseId } } });
    expect(purchase?.finalPrice).toBe(0);
    expect(purchase?.voucherId === fixture.voucherId).toBe(true);
    expect(await fixture.db.voucherRedemption.count({ where: { userId: fixture.userId, voucherId: fixture.voucherId } })).toBe(1);

    const retry = await context.request.post('/api/vouchers/redeem', { data: { courseId: fixture.courseId, voucherCode: fixture.voucherCode } });
    expect(retry.status()).toBeGreaterThanOrEqual(400);
    expect(retry.status()).toBeLessThan(500);
    expect((await retry.json()).success).toBe(false);
    expect((await fixture.db.voucherCode.findUnique({ where: { id: fixture.voucherId } }))?.currentUses).toBe(1);
    expect(await fixture.db.purchase.count({ where: { userId: fixture.userId } })).toBe(1);
  } finally {
    await context.clearCookies();
    await fixture.cleanup();
  }
});
