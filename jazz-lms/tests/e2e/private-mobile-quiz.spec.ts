import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const fixturePath = process.env.MAINTENANCE_FIXTURE_USERS_FILE;
const enabled = process.env.MAINTENANCE_CUSTOMER_JOURNEY_ENABLED === '1' && Boolean(fixturePath);
test.use({ trace: 'off', screenshot: 'off', video: 'off' });
test.skip(!enabled, 'Requires the disposable local customer fixtures.');

async function privateFill(page: Page, selector: string, value: string) {
  try { await page.locator(selector).fill(value); }
  catch { throw new Error(`Unable to fill private field ${selector}`); }
}

for (const width of [320, 390]) for (const theme of ['light', 'dark']) {
  test(`quiz answer and result controls remain reachable by scrolling at ${width}px in ${theme}`, async ({ page, context, baseURL }) => {
    test.setTimeout(120000);
    if (baseURL !== 'http://127.0.0.1:3010') throw new Error('Refusing mobile quiz tests outside the disposable localhost app.');
    const fixtures = JSON.parse(readFileSync(fixturePath!, 'utf8')) as { users: { buyer: { email: string; password: string } } };
    await page.setViewportSize({ width, height: 640 });
    await context.addCookies([{ name: 'jazz_lang', value: 'pt', url: baseURL }]);
    await context.route('https://open.spotify.com/**', (route) => route.abort());
    await context.addInitScript((selectedTheme) => {
      if (window === window.top) localStorage.setItem('theme', selectedTheme);
    }, theme);
    await page.goto('/auth?tab=login', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => Array.from(document.querySelectorAll('form')).some((form) =>
      Object.keys(form).some((key) => key.startsWith('__reactProps$') &&
        typeof (form as unknown as Record<string, { onSubmit?: unknown }>)[key].onSubmit === 'function')
    ), undefined, { timeout: 45000 });
    await privateFill(page, '#loginEmail', fixtures.users.buyer.email);
    await privateFill(page, '#loginPassword', fixtures.users.buyer.password);
    await page.locator('form button[type=submit]').click();
    await page.waitForURL((url) => url.pathname.startsWith('/dashboard'), { waitUntil: 'domcontentloaded' });

    const quizPath = '/api/courses/maintenance-course/lessons/maintenance-lesson-2/quiz';
    const launched = await context.request.post(quizPath, { data: { restart: true, language: 'pt' } });
    expect(launched.status()).toBe(200);
    const launch = await launched.json();
    // Pre-answer only disposable fixture questions to reach the last real UI
    // answer and the actual server-scored result without 12 repeated clicks.
    for (const question of launch.attempt.questions.slice(0, 11)) {
      if (!question.questionId.startsWith('maintenance-question-2-')) throw new Error('Refusing a nonfixture quiz question.');
      const option = question.options.find((choice: { label: string }) => choice.label === 'A');
      const answered = await context.request.post(`${quizPath}/${launch.attempt.attemptId}/answer`, {
        data: { questionId: question.questionId, optionId: option.optionId ?? option.id },
      });
      expect(answered.status()).toBe(200);
    }
    await page.goto('/courses/maintenance-course/lessons/maintenance-lesson-2', { waitUntil: 'domcontentloaded' });
    await page.locator('mux-player').waitFor({ state: 'attached', timeout: 45000 });
    await expect(page.getByRole('button', { name: /^gamificacao$/i })).toBeVisible({ timeout: 45000 });
    const openQuiz = page.getByRole('button', { name: /^gamificacion$|^gamification$|^gamificacao$/i });
    await expect(openQuiz).toBeEnabled({ timeout: 45000 });
    await openQuiz.click();
    const overlay = page.getByTestId('lesson-quiz-overlay');
    await expect(overlay).toBeVisible();
    const choice = overlay.getByRole('button', { name: /^A\s*It includes improvisation\./i });
    await choice.click();
    const confirm = overlay.getByRole('button', { name: /confirmar respuesta|confirm answer|confirmar resposta/i });
    await expect(confirm).toBeEnabled();
    await page.mouse.move(width / 2, 380);
    await page.mouse.wheel(0, 1600);
    await expect(confirm).toBeInViewport({ ratio: 1 });
    const lastAnswer = page.waitForResponse((response) => new URL(response.url()).pathname.endsWith('/answer'));
    await confirm.click();
    expect((await lastAnswer).status()).toBe(200);
    const result = page.getByTestId('lesson-quiz-result');
    await expect(result).toBeVisible({ timeout: 15000 });
    await page.mouse.move(width / 2, 380);
    await page.mouse.wheel(0, 1800);
    const close = result.getByRole('button', { name: /cerrar quiz|close quiz|fechar quiz/i });
    await expect(close).toBeInViewport({ ratio: 1 });
    await close.click();
    await expect(overlay).toHaveCount(0);
  });
}
