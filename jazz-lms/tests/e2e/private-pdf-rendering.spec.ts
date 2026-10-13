import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const fixturePath = process.env.MAINTENANCE_FIXTURE_USERS_FILE;
const enabled = process.env.MAINTENANCE_CUSTOMER_JOURNEY_ENABLED === '1' && Boolean(fixturePath);
test.use({ trace: 'off', screenshot: 'off', video: 'off' });
test.skip(!enabled, 'Requires the disposable local customer fixtures and native Chrome PDF viewer.');

async function privateFill(page: Page, selector: string, value: string) {
  try { await page.locator(selector).fill(value); }
  catch { throw new Error(`Unable to fill private field ${selector}`); }
}

for (const width of [1440, 390]) {
  test(`the protected PDF renders inside its lesson iframe at ${width}px`, async ({ page, context, baseURL }) => {
    test.setTimeout(90000);
    if (baseURL !== 'http://127.0.0.1:3010') throw new Error('Refusing PDF rendering tests outside the disposable localhost app.');
    const fixtures = JSON.parse(readFileSync(fixturePath!, 'utf8')) as {
      courseId: string;
      users: { buyer: { email: string; password: string } };
    };
    if (fixtures.courseId !== 'maintenance-course') throw new Error('Refusing nonfixture course data.');
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1100 });
    await context.addCookies([{ name: 'jazz_lang', value: 'es', url: baseURL }]);
    await context.route('https://open.spotify.com/**', (route) => route.abort());
    await page.goto('/auth?tab=login', { waitUntil: 'domcontentloaded' });
    if (new URL(page.url()).origin !== baseURL) throw new Error('Refusing private fixture login outside localhost.');
    await page.waitForFunction(() => Array.from(document.querySelectorAll('form')).some((form) =>
      Object.keys(form).some((key) => key.startsWith('__reactProps$') &&
        typeof (form as unknown as Record<string, { onSubmit?: unknown }>)[key].onSubmit === 'function')
    ), undefined, { timeout: 45000 });
    await privateFill(page, '#loginEmail', fixtures.users.buyer.email);
    await privateFill(page, '#loginPassword', fixtures.users.buyer.password);
    await page.locator('form button[type=submit]').click();
    await page.waitForURL((url) => url.pathname.startsWith('/dashboard'), { waitUntil: 'domcontentloaded' });

    // Capture the PDF navigation itself, rather than the earlier JSON request
    // which creates a signed download URL for the same attachment.
    const pdfResponse = page.waitForResponse((response) => {
      const url = new URL(response.url());
      return url.origin === baseURL &&
        /^\/api\/lessons\/maintenance-lesson-2\/attachments\//.test(url.pathname) &&
        url.searchParams.get('proxy') === '1';
    });
    await page.goto('/courses/maintenance-course/lessons/maintenance-lesson-2', { waitUntil: 'domcontentloaded' });
    const workspace = page.getByTestId('pdf-workspace-viewer');
    await expect(workspace).toBeVisible({ timeout: 45000 });
    await workspace.scrollIntoViewIfNeeded();
    const response = await pdfResponse;
    expect(response.status()).toBe(200);
    const headers = response.headers();
    expect(headers['content-type']).toMatch(/^application\/pdf/);
    expect(headers['content-disposition']).toBe('inline');
    // Next's development server replaces Cache-Control with its own stricter
    // no-store value; both it and the route's production policy forbid reuse.
    expect(headers['cache-control']).toMatch(/no-store/);
    expect(headers['content-security-policy']).toMatch(/(?:^|;)\s*frame-ancestors 'self'(?:;|$)/);
    expect(headers['content-security-policy']).not.toContain("frame-ancestors 'none'");
    expect(headers['x-frame-options']).toBe('SAMEORIGIN');
    await expect(workspace.getByText(/Cargando PDF|Loading PDF|Chargement du PDF|Carregando PDF/)).toHaveCount(0);

    // A PDF response and an iframe load event can both succeed while Chrome
    // blocks its renderer. Require the native viewer's actual successful load
    // and a visible PDF plugin, not merely document bytes or an iframe node.
    await expect.poll(() => page.frames().some((frame) => frame.url().startsWith('chrome-extension://'))).toBe(true);
    const nativeViewer = page.frames().find((frame) => frame.url().startsWith('chrome-extension://'))!;
    await nativeViewer.waitForFunction(() => {
      const viewer = document.querySelector('pdf-viewer') as HTMLElement & { loadState_?: string } | null;
      return viewer?.loadState_ === 'success';
    }, undefined, { timeout: 30000 });
    await expect(nativeViewer.locator('pdf-viewer')).toBeVisible();
    await expect.poll(() => page.frames().some((frame) => frame.parentFrame() === nativeViewer)).toBe(true);
    const pluginFrame = page.frames().find((frame) => frame.parentFrame() === nativeViewer)!;
    await expect(pluginFrame.locator('embed')).toBeVisible();
    await expect(workspace.locator('iframe[title="PDF Viewer"]')).toBeInViewport({ ratio: 1 });

    if (width === 390) {
      const title = page.locator('h2').first();
      const menu = page.getByRole('button', { name: 'Abrir menú', exact: true });
      await expect(menu).toBeVisible();
      const menuBox = await menu.boundingBox();
      const titleTextLeft = await title.evaluate((element) => {
        const range = document.createRange();
        range.selectNodeContents(element);
        return range.getClientRects()[0]?.left ?? 0;
      });
      expect(titleTextLeft).toBeGreaterThanOrEqual(menuBox!.x + menuBox!.width + 5);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    }
  });
}
