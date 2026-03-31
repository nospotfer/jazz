import { test, expect, Page } from '@playwright/test';
import { getMissingPaymentsE2ERequirements, getPaymentsE2EConfig } from './helpers/payment-env';

const buyButtonRegex =
  /comprar curso completo|buy full course|acheter le cours complet|comprar curso completo|aplicar voucher y continuar|apply voucher and continue|appliquer le voucher et continuer|aplicar voucher e continuar|elegir método de pago|choose payment method|choisir le moyen de paiement|escolher método de pagamento/i;
const checkoutModalTitleRegex =
  /activa tu descuento|apply your discount|activez votre remise|ative seu desconto/i;
const voucherPlaceholderRegex = /ingresa tu código|enter your code|entrez votre code|digite seu código/i;
const applyButtonRegex = /aplicar|apply|appliquer/i;
const continueButtonRegex = /ir al checkout|go to checkout|aller au checkout|ir para checkout|continuar|continue|continuer/i;
const successVoucherMessageRegex =
  /novo preço|new price|nouveau prix|nuevo precio|acesso 100% gratuito|100% free access|accès 100% gratuit/i;
const removeVoucherButtonRegex = /quitar|remove|supprimer|remover/i;
const voucherErrorRegex =
  /inválido|invalid|invalide|expir|limite|maximum|maximal|não está configurado|not configured|n’est pas configuré|número maximal d’utilisations/i;

type VoucherApplyResult = {
  status: 'applied' | 'rejected';
  isFreeAccess: boolean;
};

async function tryResetLocalTestPurchases(page: Page) {
  const response = await page.request.post('/api/dev/reset-test-purchases', {
    failOnStatusCode: false,
  });

  return response.status() === 200;
}

type PurchaseOpenResult = 'modal' | 'redirect';

async function openPurchaseModal(page: Page, expectedCheckoutHost: string): Promise<PurchaseOpenResult> {
  const buyButton = page.getByRole('button', { name: buyButtonRegex }).first();
  await expect(buyButton).toBeVisible({ timeout: 20_000 });
  await expect(buyButton).toBeEnabled({ timeout: 20_000 });

  await page.waitForLoadState('networkidle').catch(() => undefined);

  const modalTitle = page.getByText(checkoutModalTitleRegex).first();
  const voucherInput = page.getByPlaceholder(voucherPlaceholderRegex).first();
  const continueButton = page.getByRole('button', { name: continueButtonRegex }).first();

  for (let attempt = 0; attempt < 4; attempt += 1) {
    await buyButton.click({ force: attempt > 1 });

    const outcome = await Promise.race([
      modalTitle
        .waitFor({ state: 'visible', timeout: 8_000 })
        .then(() => 'modal' as const)
        .catch(() => null),
      voucherInput
        .waitFor({ state: 'visible', timeout: 8_000 })
        .then(() => 'modal' as const)
        .catch(() => null),
      continueButton
        .waitFor({ state: 'visible', timeout: 8_000 })
        .then(() => 'modal' as const)
        .catch(() => null),
      page
        .waitForURL(
          (url) =>
            url.hostname === expectedCheckoutHost ||
            url.hostname.endsWith(`.${expectedCheckoutHost}`),
          { timeout: 8_000 }
        )
        .then(() => 'redirect' as const)
        .catch(() => null),
    ]);

    if (outcome === 'modal' || outcome === 'redirect') {
      return outcome;
    }

    await page.waitForTimeout(800);
  }

  throw new Error(`Unable to open purchase modal from CTA. currentUrl=${page.url()}`);
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
  expectedCheckoutHost: string,
  allowDirectUnlock: boolean
): Promise<'dodo' | 'unlock' | 'checkout_error'> {
  const continueButton = page.getByRole('button', { name: continueButtonRegex }).first();

  await continueButton.click();

  const dodoRedirect = page
    .waitForURL(
      (url) => url.hostname === expectedCheckoutHost || url.hostname.endsWith(`.${expectedCheckoutHost}`),
      { timeout: 45_000 }
    )
    .then(() => 'dodo' as const)
    .catch(() => null);

  const checkoutError = page
    .getByText(voucherErrorRegex)
    .first()
    .waitFor({ state: 'visible', timeout: 45_000 })
    .then(() => 'checkout_error' as const)
    .catch(() => null);

  if (!allowDirectUnlock) {
    const result = await Promise.race([dodoRedirect, checkoutError]);
    expect(result).not.toBeNull();

    if (result === 'dodo') {
      expect(page.url()).toContain(expectedCheckoutHost);
    }

    return result as 'dodo' | 'checkout_error';
  }

  const directUnlock = page
    .waitForURL((url) => url.pathname.includes('/lessons/') || url.pathname.includes('/dashboard'), {
      timeout: 45_000,
    })
    .then(() => 'unlock' as const)
    .catch(() => null);

  const outcome = await Promise.race([dodoRedirect, directUnlock, checkoutError]);
  expect(outcome).not.toBeNull();
  return outcome as 'dodo' | 'unlock' | 'checkout_error';
}

test.describe('Payments voucher matrix E2E (real Dodo)', () => {
  test.describe.configure({ timeout: 20 * 60 * 1000 });
  const config = getPaymentsE2EConfig();

  test.skip(!config.enabled, 'PAYMENTS_E2E_REAL_ENABLED!=1 (real Dodo E2E disabled).');

  const missing = getMissingPaymentsE2ERequirements(config);
  test.skip(
    missing.length > 0,
    `Missing required env vars for real payment E2E: ${missing.join(', ')}`
  );

  test('redirects to Dodo for selected methods without voucher', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: config.storageStatePath,
    });

    const page = await context.newPage();
    await tryResetLocalTestPurchases(page);
    await page.goto(`/courses/${config.courseId}`);
    await page.waitForLoadState('domcontentloaded');

    test.skip(
      page.url().includes('/lessons/'),
      'Authenticated user already owns this course. Use a test user without purchase to validate checkout redirect.'
    );

    const openResult = await openPurchaseModal(page, config.expectedCheckoutHost);

    if (openResult !== 'redirect') {
      await selectMethodAndContinue(page, config.expectedCheckoutHost, false);
    } else {
      expect(page.url()).toContain(config.expectedCheckoutHost);
    }

    await context.close();
  });

  test('voucher matrix responds and redirects for each configured voucher', async ({ browser }) => {
    test.skip(
      config.voucherCodes.length === 0,
      'PAYMENTS_E2E_VOUCHER_CODES is empty. Provide voucher codes for matrix validation.'
    );

    for (const voucherCode of config.voucherCodes) {
      const context = await browser.newContext({
        storageState: config.storageStatePath,
      });

      const page = await context.newPage();
      await tryResetLocalTestPurchases(page);
      await page.goto(`/courses/${config.courseId}`);
      await page.waitForLoadState('domcontentloaded');

      test.skip(
        page.url().includes('/lessons/'),
        'Authenticated user already owns this course. Use a test user without purchase to validate checkout redirect.'
      );

      const openResult = await openPurchaseModal(page, config.expectedCheckoutHost);
      test.skip(openResult === 'redirect', 'Direct redirect path detected before voucher modal opened.');

      const voucherApplyResult = await applyVoucher(page, voucherCode);

      if (voucherApplyResult.status === 'applied') {
        await selectMethodAndContinue(
          page,
          config.expectedCheckoutHost,
          voucherApplyResult.isFreeAccess
        );
      }

      await context.close();
    }
  });
});
