import { test, expect, type Page } from '@playwright/test';
import { getMissingPaymentsE2ERequirements, getPaymentsE2EConfig } from './helpers/payment-env';

const checkoutEntryButtonRegex =
  /comprar curso completo|buy full course|acheter le cours complet|elegir método de pago|choose payment method|choisir le moyen de paiement|escolher método de pagamento|escolha o método de pagamento/i;

async function collectVisibleButtonLabels(page: Page): Promise<string[]> {
  const buttons = page.getByRole('button');
  const count = await buttons.count();
  const labels: string[] = [];

  for (let index = 0; index < Math.min(count, 12); index += 1) {
    const text = (await buttons.nth(index).innerText().catch(() => '')).trim();
    if (!text) {
      continue;
    }

    labels.push(text.replace(/\s+/g, ' '));
  }

  return labels;
}

async function resolveCheckoutEntryButton(page: Page) {
  const checkoutButton = page.getByRole('button', { name: checkoutEntryButtonRegex }).first();
  const isVisible = await checkoutButton.isVisible().catch(() => false);

  if (isVisible) {
    return checkoutButton;
  }

  const visibleButtons = await collectVisibleButtonLabels(page);
  const pageTitle = await page.title().catch(() => '');
  const bodyText =
    (await page
      .locator('body')
      .innerText()
      .then((text) => text.replace(/\s+/g, ' ').trim().slice(0, 260))
      .catch(() => '')) || '(empty body)';
  const loginPromptVisible = await page
    .getByText(/iniciar sesión|sign in|se connecter|entrar|login/i)
    .first()
    .isVisible()
    .catch(() => false);
  const noAccessPromptVisible = await page
    .getByText(/compra requerida|purchase required|achat requis|compra necessária/i)
    .first()
    .isVisible()
    .catch(() => false);

  throw new Error(
    [
      'Real payment E2E precondition failed: checkout CTA is not visible for this user/course state.',
      `Current URL: ${page.url()}`,
      `Page title: ${pageTitle || '(empty title)'}`,
      `Body excerpt: ${bodyText}`,
      `Login prompt visible: ${loginPromptVisible}`,
      `Purchase-required prompt visible: ${noAccessPromptVisible}`,
      `Visible buttons sample: ${visibleButtons.length > 0 ? visibleButtons.join(' | ') : '(none)'}`,
      'Provide a PAYMENTS_E2E_STORAGE_STATE for an authenticated user without this course purchase and a PAYMENTS_E2E_COURSE_ID that shows the buy/choose-payment CTA.',
    ].join('\n')
  );
}

test.describe('Payments E2E (real Lemon)', () => {
  test('redirects authenticated user to Lemon checkout', async ({ browser }) => {
    const config = getPaymentsE2EConfig();

    test.skip(!config.enabled, 'PAYMENTS_E2E_REAL_ENABLED!=1 (real Lemon E2E disabled).');

    const missing = getMissingPaymentsE2ERequirements(config);
    test.skip(
      missing.length > 0,
      `Missing required env vars for real payment E2E: ${missing.join(', ')}`
    );

    const context = await browser.newContext({
      storageState: config.storageStatePath,
    });

    const page = await context.newPage();
    await page.goto(`/courses/${config.courseId}`);
    await page.waitForLoadState('domcontentloaded');

    test.skip(
      page.url().includes('/lessons/'),
      'Authenticated user already owns this course. Use a test user without purchase to validate checkout redirect.'
    );

    try {
      const openCheckoutButton = await resolveCheckoutEntryButton(page);
      await openCheckoutButton.click();

      const chooseMethodTitle = page.getByRole('heading', {
        name: /elige método de pago|choose payment method|choisissez le moyen de paiement|escolha o método de pagamento/i,
      });
      await expect(chooseMethodTitle).toBeVisible({ timeout: 20_000 });

      const cardMethodButton = page.getByRole('button', {
        name: /tarjeta|card|carte|cartão/i,
      });
      await expect(cardMethodButton).toBeVisible({ timeout: 20_000 });
      await cardMethodButton.click();

      const continueButton = page.getByRole('button', {
        name: /continuar|continue|continuer/i,
      });
      await expect(continueButton).toBeEnabled({ timeout: 20_000 });

      await Promise.all([
        page.waitForURL(
          (url) =>
            url.hostname === config.expectedCheckoutHost ||
            url.hostname.endsWith(`.${config.expectedCheckoutHost}`),
          { timeout: 45_000 }
        ),
        continueButton.click(),
      ]);

      expect(page.url()).toContain(config.expectedCheckoutHost);
    } finally {
      await context.close();
    }
  });
});
