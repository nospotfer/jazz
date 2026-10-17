import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const fixtureFile = process.env.MAINTENANCE_FIXTURE_USERS_FILE;
const enabled = process.env.MAINTENANCE_CUSTOMER_JOURNEY_ENABLED === '1' && Boolean(fixtureFile);
type FixtureUsers = { users: Record<'buyer' | 'legacy', { email: string; password: string }> };

test.use({ trace: 'off', screenshot: 'off', video: 'off' });
test.skip(!enabled, 'Opt in with the private disposable fixture file and localhost app.');

async function privateFill(page: Page, selector: string, value: string) {
  try { await page.locator(selector).fill(value); }
  catch { throw new Error(`Unable to fill private field ${selector}`); }
}

async function login(page: Page, role: 'buyer' | 'legacy') {
  await page.goto('/auth');
  const origin = new URL(page.url());
  expect(origin.hostname).toBe('127.0.0.1');
  expect(origin.port).toBe('3010');
  const fixtures = JSON.parse(readFileSync(fixtureFile!, 'utf8')) as FixtureUsers;
  await page.waitForFunction(() => Array.from(document.querySelectorAll('form')).some((form) =>
    Object.keys(form).some((key) => key.startsWith('__reactProps$') &&
      typeof (form as unknown as Record<string, { onSubmit?: unknown }>)[key].onSubmit === 'function')
  ));
  await privateFill(page, 'input[type=email]', fixtures.users[role].email);
  await privateFill(page, 'input[name=password]', fixtures.users[role].password);
  await page.locator('button[type=submit]').click();
  await page.waitForURL((url) => url.pathname.startsWith('/dashboard'), { waitUntil: 'domcontentloaded' });
}

test('an eligible full-course learner downloads a real A4 certificate', async ({ page }) => {
  test.setTimeout(90000);
  await login(page, 'buyer');
  const recognition = await page.request.get('/api/dashboard/course-completion-recognition');
  expect(await recognition.json()).toMatchObject({ isEligible: true, completedLessons: 15, totalLessons: 15 });
  await page.goto('/dashboard/course-completion-recognition');
  const button = page.getByRole('button', { name: /descargar certificado|download pdf certificate|baixar certificado|t[eé]l[eé]charger le certificat/i });
  await expect(button).toBeVisible();
  await button.evaluate((node) => new Promise<void>((resolve) => {
    const check = () => {
      const ready = Object.keys(node).some((key) => key.startsWith('__reactProps$') &&
        typeof (node as unknown as Record<string, { onClick?: unknown }>)[key].onClick === 'function');
      if (ready) resolve(); else setTimeout(check, 50);
    };
    check();
  }));
  const downloadPromise = page.waitForEvent('download');
  await button.click();
  const download = await downloadPromise;
  expect(await download.failure()).toBeNull();
  const path = await download.path();
  const bytes = readFileSync(path!);
  expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
  const pdfText = bytes.toString('latin1');
  const mediaBox = pdfText.match(/\/MediaBox\s*\[0 0 ([\d.]+) ([\d.]+)\]/);
  expect(mediaBox?.length).toBe(3);
  expect(Number(mediaBox![1])).toBeCloseTo(595.28, 1);
  expect(Number(mediaBox![2])).toBeCloseTo(841.89, 1);
  await download.saveAs(test.info().outputPath('buyer-course-certificate.pdf'));
});

test('completing one historically purchased lesson cannot issue a whole-course certificate', async ({ page }) => {
  test.setTimeout(90000);
  await login(page, 'legacy');
  const recognition = await page.request.get('/api/dashboard/course-completion-recognition');
  expect(await recognition.json()).toMatchObject({ isEligible: false, completedLessons: 1, totalLessons: 15 });
  await page.goto('/dashboard/course-completion-recognition');
  await expect(page).toHaveURL(/\/dashboard\/profile$/);
});
