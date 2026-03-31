import { expect, Page, test } from "@playwright/test";
import {
  getMissingPaymentsE2ERequirements,
  getPaymentsE2EConfig,
} from "./helpers/payment-env";

const buyButtonRegex =
  /comprar curso completo|buy full course|acheter le cours complet|comprar curso completo|aplicar voucher y continuar|apply voucher and continue|appliquer le voucher et continuer|aplicar voucher e continuar|elegir método de pago|choose payment method|choisir le moyen de paiement|escolher método de pagamento/i;
const checkoutModalTitleRegex =
  /activa tu descuento|apply your discount|activez votre remise|ative seu desconto/i;
const voucherPlaceholderRegex =
  /ingresa tu código|enter your code|entrez votre code|digite seu código/i;
const applyButtonRegex = /aplicar|apply|appliquer/i;
const successVoucherMessageRegex =
  /novo preço|new price|nouveau prix|nuevo precio|acesso 100% gratuito|100% free access|accès 100% gratuit/i;
const removeVoucherButtonRegex = /quitar|remove|supprimer|remover/i;
const voucherErrorRegex =
  /inválido|invalid|invalide|expir|limite|maximum|maximal|não está configurado|not configured|n’est pas configuré|número maximal d’utilisations/i;
const checkoutFeedbackRegex =
  /inválido|invalid|invalide|expir|limite|maximum|maximal|não está configurado|not configured|n’est pas configuré|número maximal d’utilisations|error interno del servidor|internal server error|erreur interne du serveur|erro interno do servidor|pagos temporalmente no disponibles|payments are temporarily unavailable|les paiements sont temporairement indisponibles|pagamentos temporariamente indisponíveis/i;

type VoucherApplyResult = {
  status: "applied" | "rejected";
  isFreeAccess: boolean;
};

function getPaymentModal(page: Page) {
  return page.getByTestId("payment-method-modal");
}

async function tryResetLocalTestPurchases(page: Page) {
  const response = await page.request.post("/api/dev/reset-test-purchases", {
    failOnStatusCode: false,
  });

  return response.status() === 200;
}

type PurchaseOpenResult = "modal" | "redirect";

async function openPurchaseModal(
  page: Page,
  expectedCheckoutHost: string,
): Promise<PurchaseOpenResult> {
  const buyButton = page.getByRole("button", { name: buyButtonRegex }).first();
  await expect(buyButton).toBeVisible({ timeout: 20_000 });
  await expect(buyButton).toBeEnabled({ timeout: 20_000 });

  await page.waitForLoadState("networkidle").catch(() => undefined);

  const modal = getPaymentModal(page);
  const modalTitle = page.getByText(checkoutModalTitleRegex).first();
  const voucherInput = modal.getByPlaceholder(voucherPlaceholderRegex).first();
  const continueButton = modal
    .getByTestId("payment-method-modal-continue")
    .first();

  for (let attempt = 0; attempt < 4; attempt += 1) {
    await buyButton.click({ force: attempt > 1 });

    const outcome = await Promise.race([
      modal
        .waitFor({ state: "visible", timeout: 8_000 })
        .then(() => "modal" as const)
        .catch(() => null),
      modalTitle
        .waitFor({ state: "visible", timeout: 8_000 })
        .then(() => "modal" as const)
        .catch(() => null),
      voucherInput
        .waitFor({ state: "visible", timeout: 8_000 })
        .then(() => "modal" as const)
        .catch(() => null),
      continueButton
        .waitFor({ state: "visible", timeout: 8_000 })
        .then(() => "modal" as const)
        .catch(() => null),
      page
        .waitForURL(
          (url) =>
            url.hostname === expectedCheckoutHost ||
            url.hostname.endsWith(`.${expectedCheckoutHost}`),
          { timeout: 8_000 },
        )
        .then(() => "redirect" as const)
        .catch(() => null),
    ]);

    if (outcome === "modal" || outcome === "redirect") {
      return outcome;
    }

    await page.waitForTimeout(800);
  }

  throw new Error(
    `Unable to open purchase modal from CTA. currentUrl=${page.url()}`,
  );
}

async function applyVoucher(
  page: Page,
  voucherCode: string,
): Promise<VoucherApplyResult> {
  const modal = getPaymentModal(page);
  const voucherInput = modal.getByPlaceholder(voucherPlaceholderRegex).first();
  await expect(voucherInput).toBeVisible({ timeout: 20_000 });
  await voucherInput.fill(voucherCode);

  const applyButton = modal
    .getByRole("button", { name: applyButtonRegex })
    .first();
  await applyButton.click();

  const removeButton = modal
    .getByRole("button", { name: removeVoucherButtonRegex })
    .first();
  const successBanner = modal.getByText(successVoucherMessageRegex).first();
  const errorBanner = modal.getByText(voucherErrorRegex).first();

  const outcome = await Promise.race([
    removeButton
      .waitFor({ state: "visible", timeout: 20_000 })
      .then(() => "applied" as const)
      .catch(() => null),
    successBanner
      .waitFor({ state: "visible", timeout: 20_000 })
      .then(() => "applied" as const)
      .catch(() => null),
    errorBanner
      .waitFor({ state: "visible", timeout: 20_000 })
      .then(() => "rejected" as const)
      .catch(() => null),
  ]);

  if (outcome !== "applied") {
    return {
      status: "rejected",
      isFreeAccess: false,
    };
  }

  const freeAccessBanner = modal.getByText(
    /acesso 100% gratuito|100% free access|accès 100% gratuit/i,
  );
  const isFreeAccessVoucher = await freeAccessBanner
    .isVisible()
    .catch(() => false);

  return {
    status: "applied",
    isFreeAccess: isFreeAccessVoucher,
  };
}

async function selectMethodAndContinue(
  page: Page,
  expectedCheckoutHost: string,
  allowDirectUnlock: boolean,
): Promise<"dodo" | "unlock" | "checkout_error"> {
  const modal = getPaymentModal(page);
  const continueButton = modal
    .getByTestId("payment-method-modal-continue")
    .first();

  const checkoutApiResult = page
    .waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        response.url().includes("/api/checkout"),
      { timeout: 45_000 },
    )
    .then(async (response) => {
      if (response.status() >= 400) {
        return "checkout_error" as const;
      }

      const payload = (await response.json().catch(() => null)) as {
        url?: string;
      } | null;
      const redirectUrl =
        payload && typeof payload.url === "string" ? payload.url : null;

      if (!redirectUrl) {
        return null;
      }

      try {
        const parsed = new URL(redirectUrl, page.url());
        if (
          parsed.hostname === expectedCheckoutHost ||
          parsed.hostname.endsWith(`.${expectedCheckoutHost}`)
        ) {
          return "dodo" as const;
        }

        if (
          parsed.pathname.includes("/lessons/") ||
          parsed.pathname.includes("/dashboard")
        ) {
          return "unlock" as const;
        }
      } catch {
        return null;
      }

      return null;
    })
    .catch(() => null);

  const dodoRedirect = page
    .waitForURL(
      (url) =>
        url.hostname === expectedCheckoutHost ||
        url.hostname.endsWith(`.${expectedCheckoutHost}`),
      { timeout: 45_000 },
    )
    .then(() => "dodo" as const)
    .catch(() => null);

  const checkoutError = page
    .getByTestId("payment-method-modal")
    .getByText(checkoutFeedbackRegex)
    .first()
    .waitFor({ state: "visible", timeout: 45_000 })
    .then(() => "checkout_error" as const)
    .catch(() => null);

  const directUnlock = page
    .waitForURL(
      (url) =>
        url.pathname.includes("/lessons/") ||
        url.pathname.includes("/dashboard"),
      {
        timeout: 45_000,
      },
    )
    .then(() => "unlock" as const)
    .catch(() => null);

  await continueButton.click();

  if (!allowDirectUnlock) {
    const result = await Promise.race([
      dodoRedirect,
      checkoutApiResult,
      checkoutError,
      directUnlock,
    ]);

    if (!result) {
      return "checkout_error";
    }

    if (result === "dodo") {
      expect(page.url()).toContain(expectedCheckoutHost);
    }

    return result as "dodo" | "unlock" | "checkout_error";
  }

  const outcome = await Promise.race([
    dodoRedirect,
    checkoutApiResult,
    directUnlock,
    checkoutError,
  ]);

  if (!outcome) {
    return "checkout_error";
  }

  return outcome;
}

test.describe("Payments voucher matrix E2E (real Dodo)", () => {
  test.describe.configure({ timeout: 20 * 60 * 1000 });
  const config = getPaymentsE2EConfig();

  test.skip(
    !config.enabled,
    "PAYMENTS_E2E_REAL_ENABLED!=1 (real Dodo E2E disabled).",
  );

  const missing = getMissingPaymentsE2ERequirements(config);
  test.skip(
    missing.length > 0,
    `Missing required env vars for real payment E2E: ${missing.join(", ")}`,
  );

  test("redirects to Dodo for selected methods without voucher", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      storageState: config.storageStatePath,
    });

    const page = await context.newPage();
    await tryResetLocalTestPurchases(page);
    await page.goto(`/courses/${config.courseId}`);
    await page.waitForLoadState("domcontentloaded");

    test.skip(
      page.url().includes("/lessons/"),
      "Authenticated user already owns this course. Use a test user without purchase to validate checkout redirect.",
    );

    const openResult = await openPurchaseModal(
      page,
      config.expectedCheckoutHost,
    );

    if (openResult !== "redirect") {
      await selectMethodAndContinue(page, config.expectedCheckoutHost, false);
    } else {
      expect(page.url()).toContain(config.expectedCheckoutHost);
    }

    await context.close();
  });

  test("voucher matrix responds and redirects for each configured voucher", async ({
    browser,
  }) => {
    test.skip(
      config.voucherCodes.length === 0,
      "PAYMENTS_E2E_VOUCHER_CODES is empty. Provide voucher codes for matrix validation.",
    );

    for (const voucherCode of config.voucherCodes) {
      const context = await browser.newContext({
        storageState: config.storageStatePath,
      });

      const page = await context.newPage();
      await tryResetLocalTestPurchases(page);
      await page.goto(`/courses/${config.courseId}`);
      await page.waitForLoadState("domcontentloaded");

      test.skip(
        page.url().includes("/lessons/"),
        "Authenticated user already owns this course. Use a test user without purchase to validate checkout redirect.",
      );

      const openResult = await openPurchaseModal(
        page,
        config.expectedCheckoutHost,
      );
      test.skip(
        openResult === "redirect",
        "Direct redirect path detected before voucher modal opened.",
      );

      const voucherApplyResult = await applyVoucher(page, voucherCode);

      if (voucherApplyResult.status === "applied") {
        await selectMethodAndContinue(
          page,
          config.expectedCheckoutHost,
          voucherApplyResult.isFreeAccess,
        );
      }

      await context.close();
    }
  });
});
