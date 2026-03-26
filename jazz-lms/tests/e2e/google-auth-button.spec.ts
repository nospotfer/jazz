import { test, expect } from "@playwright/test";

test("auth page renders Google login button", async ({ page }) => {
  await page.goto("/auth?tab=login");

  await expect(
    page.getByRole("button", { name: /Google|google|Entrar com Google|Iniciar sessão com Google|Sign in with Google/i }),
  ).toBeVisible();
});
