import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page, baseURL }) => {
  // Public UI tests never contact live video, auth, analytics or email providers.
  const appOrigin = new URL(baseURL || "http://127.0.0.1:3000").origin;
  await page.route("**/*", async route => {
    const requestUrl = new URL(route.request().url());
    if (requestUrl.origin !== appOrigin) {
      await route.abort();
    } else {
      await route.continue();
    }
  });
  await page.route("**/api/mux/promo-playback*", route => route.fulfill({
    status: 503,
    contentType: "application/json",
    body: JSON.stringify({ error: "Preview unavailable" }),
  }));
  await page.addInitScript(() => {
    localStorage.setItem("theme", "dark");
    localStorage.setItem("jazz-language-v1", "es");
    // Privacy controls have their own regression suite; choose only necessary
    // functionality before exercising unrelated public dialogs and navigation.
    localStorage.setItem("jazz-analytics-consent-v1", JSON.stringify({ version: 1, analytics: false, replay: false, savedAt: Date.now() }));
  });
});

for (const width of [320, 390]) {
  test(`mobile ${width}px keeps header and lesson actions reachable`, async ({ page }) => {
    await page.setViewportSize({ width, height: 740 });
    await page.goto("/");
    const header = page.locator("header");
    await expect(header.getByRole("link", { name: "Regístrate", exact: true })).toBeInViewport();
    await expect(header.getByRole("link", { name: "Iniciar sesión", exact: true })).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);

    await header.locator("summary").click();
    await header.getByRole("link", { name: "Cursos", exact: true }).click();
    await expect(header.locator("details")).not.toHaveAttribute("open");
    const firstLesson = page.locator("#board-courses button").first();
    await firstLesson.click();
    const dialog = page.getByRole("dialog", { name: "Introducción a la cultura del jazz" });
    await expect(dialog).toBeVisible();
    expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    const signup = dialog.getByRole("link", { name: "Crear cuenta", exact: true });
    await signup.scrollIntoViewIfNeeded();
    await expect(signup).toBeInViewport();
    await expect(signup).toHaveAttribute("href", "/auth?tab=register");
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(firstLesson).toBeFocused();
  });

  test(`mobile ${width}px contact dialog scrolls and contains keyboard focus`, async ({ page }) => {
    await page.setViewportSize({ width, height: 740 });
    await page.goto("/");
    const trigger = page.getByRole("button", { name: "Contáctanos", exact: true });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Contáctanos", exact: true });
    await expect(dialog).toBeVisible();
    const cancel = dialog.getByRole("button", { name: "Cancelar", exact: true });
    await cancel.scrollIntoViewIfNeeded();
    await expect(cancel).toBeInViewport();
    // Trial click verifies that visible actions receive pointer events without submitting.
    await cancel.click({ trial: true });
    for (let i = 0; i < 10; i += 1) {
      await page.keyboard.press("Tab");
      expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true);
    }
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
  });
}

test("lesson and press dialogs restore focus after keyboard dismissal", async ({ page }) => {
  await page.goto("/");
  for (const section of ["board-courses", "board-press"]) {
    const trigger = page.locator(`#${section} button`).first();
    await trigger.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    for (let i = 0; i < 8; i += 1) {
      await page.keyboard.press("Tab");
      expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true);
    }
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
  }
});

test("password recovery text remains readable in light theme", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("theme", "light"));
  await page.goto("/auth/forgot-password");
  await expect(page.locator("html")).toHaveClass(/light/);
  const heading = page.getByRole("heading", { name: "Restablece tu contraseña" });
  await expect(heading).toBeVisible();
  const colors = await heading.evaluate(element => ({
    text: getComputedStyle(element).color,
    card: getComputedStyle(element.closest(".bg-card")!).backgroundColor,
  }));
  expect(colors.text).not.toBe(colors.card);
  await expect(page.getByRole("button", { name: "Cerrar", exact: true })).toBeVisible();
  await expect(page.getByLabel("Correo", { exact: true })).toBeVisible();
});

test("voucher page identifies missing course context in the selected language", async ({ page }) => {
  await page.goto("/redeem");
  await expect(page.getByRole("heading", { name: "Canjea tu acceso" })).toBeVisible();
  await expect(page.getByText("Abre el enlace de canje que recibiste con tu voucher para identificar el curso.")).toBeVisible();
  await page.getByLabel("Código del voucher", { exact: true }).fill("TEST-ONLY");
  await expect(page.getByRole("button", { name: "Canjear acceso", exact: true })).toBeDisabled();
  await page.goto("/");
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await page.goto("/redeem");
  await expect(page.getByRole("heading", { name: "Redeem your access" })).toBeVisible();
});

test("contact confirmation retains the recipient email with a mocked delivery", async ({ page }) => {
  await page.route("**/api/contact", route => route.fulfill({
    status: 200, contentType: "application/json", body: JSON.stringify({ success: true }),
  }));
  await page.goto("/");
  await page.getByRole("button", { name: "Contáctanos", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Contáctanos", exact: true });
  await dialog.getByLabel("Tipo de mensaje:", { exact: false }).selectOption("question");
  await dialog.getByLabel(/^Mensaje:/).fill("Isolated UI test; delivery is intercepted.");
  await dialog.getByLabel("Tu correo:", { exact: false }).fill("test@example.invalid");
  await dialog.getByRole("button", { name: "Enviar mensaje", exact: true }).click();
  await expect(dialog.getByRole("status")).toContainText("test@example.invalid");
});

test("all language controls remain usable on a narrow mobile screen", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/");
  for (const language of ["ES", "EN", "FR", "PT-BR"]) {
    const button = page.getByRole("button", { name: language, exact: true });
    const bounds = await button.boundingBox();
    expect(bounds?.width).toBeGreaterThanOrEqual(44);
    expect(bounds?.height).toBeGreaterThanOrEqual(44);
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  }
  await expect(page.getByTestId("home-promo-message")).toContainText("primeira aula grátis");
  await expect(page.getByRole("heading", { name: "O que você aprenderá" })).toHaveCount(1);
  await expect(page.locator("h1")).toHaveCount(1);
  const faq = page.getByRole("button", { name: "Quanto custa o curso?", exact: true });
  await expect(faq).toHaveAttribute("aria-expanded", "false");
  await faq.click();
  await expect(faq).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("region", { name: "Quanto custa o curso?", exact: true })).toContainText("primeira aula é grátis");
  await faq.click();
  await expect(faq).toHaveAttribute("aria-expanded", "false");
});
