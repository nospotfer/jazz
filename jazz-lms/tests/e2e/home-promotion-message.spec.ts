import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 1440, height: 900 } });

test.beforeEach(async ({ page, baseURL }) => {
  const origin = new URL(baseURL || "http://127.0.0.1:3000").origin;
  await page.route("**/*", route => {
    if (new URL(route.request().url()).origin !== origin) return route.abort();
    if (new URL(route.request().url()).pathname === "/api/mux/promo-playback") {
      return route.fulfill({ status: 503, contentType: "application/json", body: "{}" });
    }
    return route.continue();
  });
});

test("keeps the free-lesson offer above the heading and centers the hero columns", async ({
  page,
}) => {
  await page.goto("/");

  const promotionMessage = page.getByTestId("home-promo-message");
  const pretitle = page.getByTestId("home-promo-pretitle");
  const videoFrame = page.getByTestId("home-promo-video-frame");
  const heroCopy = page.getByTestId("home-promo-copy");
  const header = page.locator("header").first();

  await expect(promotionMessage).toBeVisible();
  await expect(pretitle).toBeVisible();
  await expect(videoFrame).toBeVisible();
  await expect(page.getByText(/Mux/i)).toHaveCount(0);

  await expect(promotionMessage).toContainText(
    /Register and receive the first lesson for free|Regístrate y recibe la primera clase gratis|Inscrivez-vous et recevez la première leçon gratuitement|Cadastre-se e receba a primeira aula grátis/i,
  );

  const headerBox = await header.boundingBox();
  const promotionBox = await promotionMessage.boundingBox();
  const pretitleBox = await pretitle.boundingBox();
  const videoBox = await videoFrame.boundingBox();
  const copyBox = await heroCopy.boundingBox();

  expect(headerBox).toBeTruthy();
  expect(promotionBox).toBeTruthy();
  expect(pretitleBox).toBeTruthy();
  expect(videoBox).toBeTruthy();
  expect(copyBox).toBeTruthy();

  // Promotion block should sit right below header and above pretitle.
  expect((promotionBox as NonNullable<typeof promotionBox>).y).toBeGreaterThanOrEqual(
    (headerBox as NonNullable<typeof headerBox>).y +
      (headerBox as NonNullable<typeof headerBox>).height -
      1,
  );
  expect((pretitleBox as NonNullable<typeof pretitleBox>).y).toBeGreaterThan(
    (promotionBox as NonNullable<typeof promotionBox>).y +
      (promotionBox as NonNullable<typeof promotionBox>).height -
      1,
  );

  // Both columns share a vertical center despite their different content heights.
  expect(
    Math.abs(
      (videoBox as NonNullable<typeof videoBox>).y + (videoBox as NonNullable<typeof videoBox>).height / 2 -
        (copyBox as NonNullable<typeof copyBox>).y - (copyBox as NonNullable<typeof copyBox>).height / 2,
    ),
  ).toBeLessThanOrEqual(2);
  await expect(page.locator("#board-hero").getByRole("link", { name: /Ver las clases|Explore the lessons|Découvrir les leçons|Ver as aulas/ })).toHaveAttribute("href", "#board-courses");
});

test("falls back to a stable promo preview when playback API fails", async ({
  page,
}) => {
  await page.route("**/api/mux/promo-playback", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "mux unavailable" }),
    });
  });

  await page.goto("/");

  const fallbackMedia = page.getByTestId("home-promo-video-fallback");

  await expect(fallbackMedia).toBeVisible();
  await expect(page.getByText(/Mux/i)).toHaveCount(0);
});
