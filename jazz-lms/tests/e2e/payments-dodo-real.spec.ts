import { expect, test, type Page } from "@playwright/test";
import {
  getMissingPaymentsE2ERequirements,
  getPaymentsE2EConfig,
} from "./helpers/payment-env";

const checkoutEntryButtonRegex =
  /comprar curso completo|buy full course|acheter le cours complet|elegir método de pago|choose payment method|choisir le moyen de paiement|escolher método de pagamento|escolha o método de pagamento|aplicar voucher y continuar|apply voucher and continue|appliquer un coupon et continuer|aplicar voucher e continuar/i;

function getPaymentModal(page: Page) {
  return page.getByTestId("payment-method-modal");
}

async function waitForCheckoutResolution(
  page: Page,
  expectedCheckoutHost: string,
): Promise<
  "redirect" | "response_redirect" | "provider_error" | "app_redirect"
> {
  const redirectResult = page
    .waitForURL(
      (url) =>
        url.hostname === expectedCheckoutHost ||
        url.hostname.endsWith(`.${expectedCheckoutHost}`),
      { timeout: 45_000 },
    )
    .then(() => "redirect" as const)
    .catch(() => null);

  const checkoutApiResult = page
    .waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        response.url().includes("/api/checkout"),
      { timeout: 45_000 },
    )
    .then(async (response) => {
      if (response.status() >= 400) {
        return "provider_error" as const;
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
          return "response_redirect" as const;
        }

        if (
          parsed.pathname.includes("/lessons/") ||
          parsed.pathname.includes("/dashboard")
        ) {
          return "app_redirect" as const;
        }
      } catch {
        return null;
      }

      return null;
    })
    .catch(() => null);

  const appRedirectResult = page
    .waitForURL(
      (url) =>
        url.pathname.includes("/lessons/") ||
        url.pathname.includes("/dashboard"),
      { timeout: 45_000 },
    )
    .then(() => "app_redirect" as const)
    .catch(() => null);

  const outcome = await Promise.race([
    redirectResult,
    checkoutApiResult,
    appRedirectResult,
  ]);

  if (!outcome) {
    const currentPath = new URL(page.url()).pathname;
    if (
      currentPath.includes("/lessons/") ||
      currentPath.includes("/dashboard")
    ) {
      return "app_redirect";
    }

    throw new Error(
      "Checkout did not redirect and /api/checkout produced no usable response within timeout.",
    );
  }

  return outcome;
}

async function collectVisibleButtonLabels(page: Page): Promise<string[]> {
  const buttons = page.getByRole("button");
  const count = await buttons.count();
  const labels: string[] = [];

  for (let index = 0; index < Math.min(count, 12); index += 1) {
    const text = (
      await buttons
        .nth(index)
        .innerText()
        .catch(() => "")
    ).trim();
    if (!text) {
      continue;
    }

    labels.push(text.replace(/\s+/g, " "));
  }

  return labels;
}

async function resolveCheckoutEntryButton(page: Page) {
  const checkoutButton = page
    .getByRole("button", { name: checkoutEntryButtonRegex })
    .first();
  const isVisible = await checkoutButton.isVisible().catch(() => false);

  if (isVisible) {
    return checkoutButton;
  }

  const visibleButtons = await collectVisibleButtonLabels(page);
  const pageTitle = await page.title().catch(() => "");
  const bodyText =
    (await page
      .locator("body")
      .innerText()
      .then((text) => text.replace(/\s+/g, " ").trim().slice(0, 260))
      .catch(() => "")) || "(empty body)";
  const loginPromptVisible = await page
    .getByText(/iniciar sesión|sign in|se connecter|entrar|login/i)
    .first()
    .isVisible()
    .catch(() => false);
  const noAccessPromptVisible = await page
    .getByText(
      /compra requerida|purchase required|achat requis|compra necessária/i,
    )
    .first()
    .isVisible()
    .catch(() => false);

  throw new Error(
    [
      "Real payment E2E precondition failed: checkout CTA is not visible for this user/course state.",
      `Current URL: ${page.url()}`,
      `Page title: ${pageTitle || "(empty title)"}`,
      `Body excerpt: ${bodyText}`,
      `Login prompt visible: ${loginPromptVisible}`,
      `Purchase-required prompt visible: ${noAccessPromptVisible}`,
      `Visible buttons sample: ${visibleButtons.length > 0 ? visibleButtons.join(" | ") : "(none)"}`,
      "Provide a PAYMENTS_E2E_STORAGE_STATE for an authenticated user without this course purchase and a PAYMENTS_E2E_COURSE_ID that shows the buy/choose-payment CTA.",
    ].join("\n"),
  );
}

test.describe("Payments E2E (real Dodo)", () => {
  test.describe.configure({ timeout: 2 * 60 * 1000 });

  test("redirects authenticated user to Dodo checkout", async ({ browser }) => {
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

    const context = await browser.newContext({
      storageState: config.storageStatePath,
    });

    const page = await context.newPage();
    await page.goto(`/courses/${config.courseId}`);
    await page.waitForLoadState("domcontentloaded");

    test.skip(
      page.url().includes("/lessons/"),
      "Authenticated user already owns this course. Use a test user without purchase to validate checkout redirect.",
    );

    try {
      const openCheckoutButton = await resolveCheckoutEntryButton(page);
      await openCheckoutButton.click();

      let checkoutRequestSeen = false;
      const onRequest = (request: { method(): string; url(): string }) => {
        if (
          request.method() === "POST" &&
          request.url().includes("/api/checkout")
        ) {
          checkoutRequestSeen = true;
        }
      };
      page.on("request", onRequest);

      const modal = getPaymentModal(page);
      const modalContinueButton = modal
        .getByTestId("payment-method-modal-continue")
        .first();
      const hasTestIdContinue = await modalContinueButton
        .isVisible()
        .catch(() => false);

      const voucherContinueButton = page
        .getByRole("button", {
          name: /ir al checkout|go to checkout|aller au checkout|ir para checkout/i,
        })
        .first();
      const hasVoucherFlow = await voucherContinueButton
        .isVisible()
        .catch(() => false);

      let continueButton = hasTestIdContinue
        ? modalContinueButton
        : voucherContinueButton;

      if (!hasTestIdContinue && !hasVoucherFlow) {
        const chooseMethodTitle = page.getByRole("heading", {
          name: /elige método de pago|choose payment method|choisissez le moyen de paiement|escolha o método de pagamento/i,
        });
        await expect(chooseMethodTitle).toBeVisible({ timeout: 20_000 });

        const cardMethodButton = page.getByRole("button", {
          name: /tarjeta|card|carte|cartão/i,
        });
        await expect(cardMethodButton).toBeVisible({ timeout: 20_000 });
        await cardMethodButton.click();

        continueButton = page.getByRole("button", {
          name: /continuar|continue|continuer/i,
        });
      }

      await expect(continueButton).toBeEnabled({ timeout: 20_000 });

      const checkoutResolution = waitForCheckoutResolution(
        page,
        config.expectedCheckoutHost,
      );
      await continueButton.click();
      let checkoutOutcome:
        | "redirect"
        | "response_redirect"
        | "provider_error"
        | "app_redirect";

      try {
        checkoutOutcome = await checkoutResolution;
      } catch (resolutionError) {
        const modal = getPaymentModal(page);
        const modalVisible = await modal.isVisible().catch(() => false);
        const continueStillVisible = await continueButton
          .isVisible()
          .catch(() => false);
        const continueEnabled = await continueButton
          .isEnabled()
          .catch(() => false);
        const modalErrors = await modal
          .locator("p.text-destructive")
          .allInnerTexts()
          .catch(() => []);

        throw new Error(
          [
            resolutionError instanceof Error
              ? resolutionError.message
              : "Unknown checkout resolution error.",
            `Current URL: ${page.url()}`,
            `Checkout request seen: ${checkoutRequestSeen}`,
            `Modal visible: ${modalVisible}`,
            `Continue visible: ${continueStillVisible}`,
            `Continue enabled: ${continueEnabled}`,
            `Modal errors: ${modalErrors.join(" | ") || "(none)"}`,
          ].join("\n"),
        );
      } finally {
        page.off("request", onRequest);
      }

      if (checkoutOutcome === "provider_error") {
        throw new Error(
          "Checkout provider returned non-success status. Verify DODO live API key, business ID, and product ID.",
        );
      }

      if (checkoutOutcome === "redirect") {
        expect(page.url()).toContain(config.expectedCheckoutHost);
      }
    } finally {
      await context.close().catch(() => undefined);
    }
  });
});
