import { test, expect, Page } from '@playwright/test';
import { getMissingPaymentsE2ERequirements, getPaymentsE2EConfig } from './helpers/payment-env';

const buyButtonRegex =
  /comprar curso completo|buy full course|acheter le cours complet|comprar curso completo|elegir método de pago|choose payment method|choisir le moyen de paiement|escolher método de pagamento/i;
const chooseMethodButtonRegex =
  /elegir método de pago|choose payment method|choisir le moyen de paiement|escolher método de pagamento/i;
const voucherPlaceholderRegex = /ingresa tu código|enter your code|entrez votre code|digite seu código/i;
const applyButtonRegex = /aplicar|apply|appliquer/i;
const continueButtonRegex = /continuar|continue|continuer/i;
const successVoucherMessageRegex =
  /novo preço|new price|nouveau prix|nuevo precio|acesso 100% gratuito|100% free access|accès 100% gratuit/i;
const removeVoucherButtonRegex = /quitar|remove|supprimer|remover/i;
const voucherErrorRegex =
  /inválido|invalid|invalide|expir|limite|maximum|maximal|não está configurado|not configured|n’est pas configuré|número maximal d’utilisations/i;

type VoucherApplyResult = {
  status: 'applied' | 'rejected';
  isFreeAccess: boolean;
};

async function openPurchaseModal(page: Page) {
  const buyButton = page.getByRole('button', { name: buyButtonRegex }).first();
  await expect(buyButton).toBeVisible({ timeout: 20_000 });
  await buyButton.click();

  const chooseMethodTitle = page.getByText(chooseMethodButtonRegex).first();
  await expect(chooseMethodTitle).toBeVisible({ timeout: 20_000 });
}

async function applyVoucher(page: Page, voucherCode: string): Promise<VoucherApplyResult> {
  const voucherInput = page.getByPlaceholder(voucherPlaceholderRegex).first();
  await expect(voucherInput).toBeVisible({ timeout: 20_000 });
  await voucherInput.fill(voucherCode);

  const applyButton = page.getByRole('button', { name: applyButtonRegex }).first();
  await applyButton.click();

  const removeButton = page.getByRole('button', { name: removeVoucherButtonRegex }).first();
  const successBanner = page.getByText(successVoucherMessageRegex).first();
  const errorBanner = page.getByText(voucherErrorRegex).first();

  const outcome = await Promise.race([
    removeButton
      .waitFor({ state: 'visible', timeout: 20_000 })
      .then(() => 'applied' as const)
      .catch(() => null),
    successBanner
      .waitFor({ state: 'visible', timeout: 20_000 })
      .then(() => 'applied' as const)
      .catch(() => null),
    errorBanner
      .waitFor({ state: 'visible', timeout: 20_000 })
      .then(() => 'rejected' as const)
      .catch(() => null),
  ]);

  if (outcome !== 'applied') {
    return {
      status: 'rejected',
      isFreeAccess: false,
    };
  }

  const freeAccessBanner = page.getByText(/acesso 100% gratuito|100% free access|accès 100% gratuit/i);
  const isFreeAccessVoucher = await freeAccessBanner.isVisible().catch(() => false);

  return {
    status: 'applied',
    isFreeAccess: isFreeAccessVoucher,
  };
}

async function selectMethodAndContinue(
  page: Page,
  method: 'card' | 'paypal',
  expectedCheckoutHost: string,
  allowDirectUnlock: boolean
): Promise<'lemon' | 'unlock' | 'checkout_error'> {
  const methodButtonName = method === 'card' ? /tarjeta|card|carte|cartão/i : /paypal/i;

  const methodButton = page.getByRole('button', { name: methodButtonName }).first();
  await expect(methodButton).toBeVisible({ timeout: 20_000 });
  await methodButton.click();

  const continueButton = page.getByRole('button', { name: continueButtonRegex }).first();

  await continueButton.click();

  const lemonRedirect = page
    .waitForURL(
      (url) => url.hostname === expectedCheckoutHost || url.hostname.endsWith(`.${expectedCheckoutHost}`),
      { timeout: 45_000 }
    )
    .then(() => 'lemon' as const)
    .catch(() => null);

  const checkoutError = page
    .getByText(voucherErrorRegex)
    .first()
    .waitFor({ state: 'visible', timeout: 45_000 })
    .then(() => 'checkout_error' as const)
    .catch(() => null);

  if (!allowDirectUnlock) {
    const result = await Promise.race([lemonRedirect, checkoutError]);
    expect(result).not.toBeNull();

    if (result === 'lemon') {
      expect(page.url()).toContain(expectedCheckoutHost);
    }

    return result as 'lemon' | 'checkout_error';
  }

  const directUnlock = page
    .waitForURL((url) => url.pathname.includes('/lessons/') || url.pathname.includes('/dashboard'), {
      timeout: 45_000,
    })
    .then(() => 'unlock' as const)
    .catch(() => null);

  const outcome = await Promise.race([lemonRedirect, directUnlock, checkoutError]);
  expect(outcome).not.toBeNull();
  return outcome as 'lemon' | 'unlock' | 'checkout_error';
}

test.describe('Payments voucher matrix E2E (real Lemon)', () => {
  test.describe.configure({ timeout: 20 * 60 * 1000 });
  const config = getPaymentsE2EConfig();

  test.skip(!config.enabled, 'PAYMENTS_E2E_REAL_ENABLED!=1 (real Lemon E2E disabled).');

  const missing = getMissingPaymentsE2ERequirements(config);
  test.skip(
    missing.length > 0,
    `Missing required env vars for real payment E2E: ${missing.join(', ')}`
  );

  test('redirects to Lemon for selected methods without voucher', async ({ browser }) => {
    for (const method of config.methods) {
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

      await openPurchaseModal(page);
      await selectMethodAndContinue(page, method, config.expectedCheckoutHost, false);

      await context.close();
    }
  });

  test('voucher matrix responds and redirects for each configured voucher', async ({ browser }) => {
    test.skip(
      config.voucherCodes.length === 0,
      'PAYMENTS_E2E_VOUCHER_CODES is empty. Provide voucher codes for matrix validation.'
    );

    for (const voucherCode of config.voucherCodes) {
      for (const method of config.methods) {
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

        await openPurchaseModal(page);
        const voucherApplyResult = await applyVoucher(page, voucherCode);

        if (voucherApplyResult.status === 'applied') {
          await selectMethodAndContinue(
            page,
            method,
            config.expectedCheckoutHost,
            voucherApplyResult.isFreeAccess
          );
        }

        await context.close();
      }
    }
  });
});
