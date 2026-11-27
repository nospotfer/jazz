import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { randomBytes, randomUUID } from 'node:crypto';

// Opt-in only: never inherit a production application/database environment.
const configPath = process.env.MAINTENANCE_LOCAL_E2E_CONFIG;
const services = configPath ? Object.fromEntries(readFileSync(configPath, 'utf8')
  .split(/\r?\n/).filter(line => line.includes('='))
  .map(line => { const split = line.indexOf('='); return [line.slice(0, split), JSON.parse(line.slice(split + 1))]; })) : null;
const mailOrigin = 'http://127.0.0.1:56124';
test.use({ trace: 'off', screenshot: 'off', video: 'off' });

async function hydratedForm(page: Page) {
  await page.waitForFunction(() => [...document.querySelectorAll('form')].some(form =>
    Object.keys(form).some(key => key.startsWith('__reactProps$') &&
      typeof (form as unknown as Record<string, { onSubmit?: unknown }>)[key].onSubmit === 'function')), undefined, { timeout: 30_000 });
}

async function privateFill(page: Page, selector: string, value: string) {
  // Re-throw without Playwright's action log, which can echo a password/OTP.
  try { await page.locator(selector).fill(value); }
  catch { throw new Error(`Unable to fill private field ${selector}`); }
}

async function latestMail(email: string, after: number, excludeId?: string) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const response = await fetch(`${mailOrigin}/api/v1/messages`);
    const inbox = await response.json();
    const entry = inbox.messages?.find((item: { ID: string; To?: Array<{ Address: string }>; Created: string }) =>
      item.ID !== excludeId && item.To?.some(to => to.Address === email) && Date.parse(item.Created) >= after);
    if (entry) {
      const detail = await fetch(`${mailOrigin}/api/v1/message/${encodeURIComponent(entry.ID)}`);
      return detail.json();
    }
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  throw new Error('No isolated verification/recovery email arrived');
}

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/auth?tab=login', { waitUntil: 'domcontentloaded' });
  await hydratedForm(page);
  await privateFill(page, '#loginEmail', email);
  await privateFill(page, '#loginPassword', password);
  await page.locator('form button[type=submit]').click();
  await page.waitForURL(url => url.pathname.startsWith('/dashboard'), { timeout: 45_000, waitUntil: 'domcontentloaded' });
}

test.describe('isolated native registration, recovery and checkout', () => {
  test.skip(!services, 'Requires the explicit disposable local Supabase configuration');
  test.setTimeout(180_000);

  test('verifies emailed OTP, resets password and unlocks a synthetic course purchase', async ({ page, context, baseURL }) => {
    const auth = new URL(services!.API_URL);
    const database = new URL(services!.DB_URL);
    expect(auth.hostname).toBe('127.0.0.1');
    expect(auth.port).toBe('56121');
    expect(database.hostname).toBe('127.0.0.1');
    expect(database.port).toBe('56122');
    expect(new URL(baseURL!).origin).toBe('http://127.0.0.1:3010');

    const email = `maintenance-onboarding-${randomUUID()}@example.test`;
    const password = randomBytes(24).toString('base64url');
    const replacement = randomBytes(24).toString('base64url');
    await page.goto('/auth?tab=register', { waitUntil: 'domcontentloaded' });
    await hydratedForm(page);
    await page.locator('#fullName').fill('Isolated maintenance student');
    await privateFill(page, '#registerEmail', email);
    await privateFill(page, '#registerPassword', password);
    const registeredAt = Date.now() - 1000;
    const registration = page.waitForResponse(response => new URL(response.url()).pathname === '/api/auth/register');
    await page.locator('form button[type=submit]').click();
    expect((await registration).status()).toBe(200);
    await page.waitForURL(url => url.pathname === '/auth/verify', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await hydratedForm(page);
    const confirmation = await latestMail(email, registeredAt);
    const otp = String(confirmation.Text ?? '').match(/\b\d{6,10}\b/)?.[0];
    if (!otp) throw new Error('Isolated confirmation email did not include an OTP');
    await privateFill(page, '#verifyCode', otp);
    const verified = page.waitForResponse(response => new URL(response.url()).pathname === '/api/auth/verify-code');
    await page.locator('form button[type=submit]').click();
    expect((await verified).status()).toBe(200);
    await page.waitForURL(url => url.pathname === '/auth' && url.searchParams.has('just_registered'), { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await signIn(page, email, password);

    expect((await context.request.get('/api/lessons/maintenance-lesson-1/mux-playback')).status()).toBe(200);
    expect((await context.request.get('/api/lessons/maintenance-lesson-2/mux-playback')).status()).toBe(403);
    await context.clearCookies();
    await page.evaluate(() => localStorage.clear());
    await page.goto('/auth/forgot-password', { waitUntil: 'domcontentloaded' });
    await hydratedForm(page);
    await privateFill(page, 'input[type=email]', email);
    const recoveryAt = Date.now() - 1000;
    const recoveryRequest = page.waitForResponse(response => new URL(response.url()).pathname === '/auth/v1/recover');
    await page.locator('form button[type=submit]').click();
    expect((await recoveryRequest).status()).toBe(200);
    const recovery = await latestMail(email, recoveryAt, confirmation.ID);
    const recoveryLink = String(recovery.HTML ?? '').match(/href="([^"]+)"/)?.[1]?.replaceAll('&amp;', '&');
    if (!recoveryLink) throw new Error('Isolated recovery email did not include a link');
    const recoveryUrl = new URL(recoveryLink);
    if (recoveryUrl.origin !== auth.origin) throw new Error('Refusing a nonlocal recovery URL');
    // Avoid URL assertions/errors that could print recovery tokens.
    try { await page.goto(recoveryUrl.toString(), { waitUntil: 'domcontentloaded' }); }
    catch { throw new Error('Unable to follow the isolated recovery link'); }
    await page.waitForURL(url => url.pathname === '/auth/reset-password', { timeout: 45_000, waitUntil: 'domcontentloaded' });
    await hydratedForm(page);
    await expect(page.locator('#newPassword')).toBeEnabled({ timeout: 30_000 });
    await privateFill(page, '#newPassword', replacement);
    await privateFill(page, '#confirmPassword', replacement);
    const update = page.waitForResponse(response => new URL(response.url()).pathname === '/auth/v1/user' && response.request().method() === 'PUT');
    await page.locator('form button[type=submit]').click();
    expect((await update).status()).toBe(200);
    await context.clearCookies();
    await page.evaluate(() => localStorage.clear());
    await signIn(page, email, replacement);

    const checkout = await context.request.post('/api/checkout', {
      headers: { origin: baseURL! },
      data: { courseId: 'maintenance-course', source: 'dashboard', language: 'es' },
    });
    expect(checkout.status()).toBe(200);
    const result = await checkout.json();
    expect(new URL(result.url).origin).toBe(baseURL);
    expect(new URL(result.url).searchParams.get('test')).toBe('1');
    await page.goto(result.url, { waitUntil: 'domcontentloaded' });
    expect((await context.request.get('/api/lessons/maintenance-lesson-2/mux-playback')).status()).toBe(200);
    const repeat = await context.request.post('/api/checkout', {
      headers: { origin: baseURL! }, data: { courseId: 'maintenance-course' },
    });
    expect(repeat.status()).toBe(400);
  });
});
