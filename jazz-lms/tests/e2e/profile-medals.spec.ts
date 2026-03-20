import { test, expect } from '@playwright/test';

const loginEmail = process.env.E2E_LOGIN_EMAIL;
const loginPassword = process.env.E2E_LOGIN_PASSWORD;

test.describe('profile medal wall', () => {
  test.skip(!loginEmail || !loginPassword, 'Set E2E_LOGIN_EMAIL and E2E_LOGIN_PASSWORD to run authenticated medal tests.');

  test('shows a fixed 3x5 medal grid before the supreme medal unlocks', async ({ page }) => {
    await page.route('**/api/dashboard/quiz-medals', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          platinumMedalCount: 1,
          totalRequiredPlatinumMedals: 15,
          remainingPlatinumMedals: 14,
          hasSupremeMedal: false,
          activeProfileMedal: 'PLATINUM',
        }),
      });
    });

    await page.route('**/api/dashboard/quiz-medals/profile?language=*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          progress: {
            platinumMedalCount: 1,
            totalRequiredPlatinumMedals: 15,
            remainingPlatinumMedals: 14,
            hasSupremeMedal: false,
            activeProfileMedal: 'PLATINUM',
          },
          lessons: Array.from({ length: 15 }, (_, index) => ({
            lessonId: `lesson-${index + 1}`,
            classNumber: index + 1,
            title: `Aula ${index + 1}`,
            medal: index === 0 ? 'PLATINUM' : 'NONE',
            bestScorePercent: index === 0 ? 100 : null,
            bestCorrectCount: index === 0 ? 12 : null,
          })),
        }),
      });
    });

    await page.goto('/auth?tab=login');
    await page.locator('#loginEmail').fill(loginEmail!);
    await page.locator('#loginPassword').fill(loginPassword!);
    await page.locator('form').getByRole('button', { name: /entrar|sign in|iniciar sesión|se connecter/i }).click();
    await page.waitForURL('**/dashboard**', { timeout: 30000 });

    await page.goto('/dashboard/profile');

    const medalGrid = page.getByTestId('profile-medal-grid');
    await expect(medalGrid).toBeVisible();
    await expect(page.getByTestId('profile-supreme-only')).toHaveCount(0);
    await expect(page.locator('[data-testid^="profile-medal-slot-"]')).toHaveCount(15);

    const lessonMedal = page.getByTestId('profile-medal-slot-1');
    await expect(lessonMedal).toHaveAttribute('aria-label', /Aula 1/i);
  });

  test('replaces the 15-medal grid with only the supreme medal after full unlock', async ({ page }) => {
    await page.route('**/api/dashboard/quiz-medals', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          platinumMedalCount: 15,
          totalRequiredPlatinumMedals: 15,
          remainingPlatinumMedals: 0,
          hasSupremeMedal: true,
          activeProfileMedal: 'SUPREME',
        }),
      });
    });

    await page.route('**/api/dashboard/quiz-medals/profile?language=*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          progress: {
            platinumMedalCount: 15,
            totalRequiredPlatinumMedals: 15,
            remainingPlatinumMedals: 0,
            hasSupremeMedal: true,
            activeProfileMedal: 'SUPREME',
          },
          lessons: [
            {
              lessonId: 'lesson-1',
              classNumber: 1,
              title: 'A Essencia do Jazz',
              medal: 'PLATINUM',
              bestScorePercent: 100,
              bestCorrectCount: 12,
            },
            {
              lessonId: 'lesson-2',
              classNumber: 2,
              title: 'A Linguagem do Jazz: Heterogeneidade Sonora',
              medal: 'GOLD',
              bestScorePercent: 92,
              bestCorrectCount: 11,
            },
            {
              lessonId: 'lesson-3',
              classNumber: 3,
              title: 'Gospel e Blues: As Raizes Profundas',
              medal: 'SILVER',
              bestScorePercent: 75,
              bestCorrectCount: 9,
            },
          ],
        }),
      });
    });

    await page.goto('/auth?tab=login');
    await page.locator('#loginEmail').fill(loginEmail!);
    await page.locator('#loginPassword').fill(loginPassword!);
    await page.locator('form').getByRole('button', { name: /entrar|sign in|iniciar sesión|se connecter/i }).click();
    await page.waitForURL('**/dashboard**', { timeout: 30000 });

    await page.goto('/dashboard/profile');

    await expect(page.getByTestId('profile-medal-grid')).toHaveCount(0);
    await expect(page.getByTestId('profile-supreme-only')).toBeVisible();

    const supremeMedal = page.getByTestId('profile-supreme-medal');
    await expect(supremeMedal).toBeVisible();
    await expect(supremeMedal).toHaveAttribute('aria-label', /Especialista e[mn] jazz/i);
  });
});