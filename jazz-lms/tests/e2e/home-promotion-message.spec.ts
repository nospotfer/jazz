import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 1440, height: 900 } });

test("shows promotion message above hero phrase and keeps promo video aligned", async ({
  page,
}) => {
  await page.goto("/");

  const promotionMessage = page.getByTestId("home-promo-message");
  const pretitle = page.getByTestId("home-promo-pretitle");
  const videoFrame = page.getByTestId("home-promo-video-frame");
  const header = page.locator("header").first();

  await expect(promotionMessage).toBeVisible();
  await expect(pretitle).toBeVisible();
  await expect(videoFrame).toBeVisible();
  await expect(page.getByText(/Mux/i)).toHaveCount(0);

  await expect(promotionMessage).toContainText(
    /Register and receive the first course for free|Regístrate y recibe la primera clase gratis|Inscrivez-vous et recevez le premier cours gratuitement|Cadastre-se e receba a primeira aula gratuitamente/i,
  );

  const headerBox = await header.boundingBox();
  const promotionBox = await promotionMessage.boundingBox();
  const pretitleBox = await pretitle.boundingBox();
  const videoBox = await videoFrame.boundingBox();

  expect(headerBox).toBeTruthy();
  expect(promotionBox).toBeTruthy();
  expect(pretitleBox).toBeTruthy();
  expect(videoBox).toBeTruthy();

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

  // Promo video top border should not start above phrase line and should be visually aligned.
  expect((videoBox as NonNullable<typeof videoBox>).y).toBeGreaterThanOrEqual(
    (pretitleBox as NonNullable<typeof pretitleBox>).y - 2,
  );
  expect(
    Math.abs(
      (videoBox as NonNullable<typeof videoBox>).y -
        (pretitleBox as NonNullable<typeof pretitleBox>).y,
    ),
  ).toBeLessThanOrEqual(24);
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
