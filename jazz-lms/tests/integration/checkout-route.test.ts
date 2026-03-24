import { beforeEach, describe, expect, test, vi } from "vitest";

const APP_URL = "https://app.example.com";

function createCheckoutRequest(body: Record<string, unknown>) {
  return new Request(`${APP_URL}/api/checkout`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: APP_URL },
    body: JSON.stringify(body),
  });
}

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  courseFindUnique: vi.fn(),
  purchaseFindUnique: vi.fn(),
  purchaseUpsert: vi.fn(),
  cookies: vi.fn(),
  normalizeLanguage: vi.fn(),
  getCourseTranslationBundle: vi.fn(),
  resolveCourseText: vi.fn(),
  upsertCoursePurchaseFromProvider: vi.fn(),
  isLemonConfigured: vi.fn(),
  isLemonWebhookConfigured: vi.fn(),
  getLemonConfig: vi.fn(),
  createLemonCheckout: vi.fn(),
}));

vi.mock("@/utils/supabase/server", () => ({
  createClient: () => ({
    auth: {
      getUser: mocks.getUser,
    },
  }),
}));

vi.mock("@/lib/db", () => ({
  db: {
    course: { findUnique: mocks.courseFindUnique },
    purchase: {
      findUnique: mocks.purchaseFindUnique,
      upsert: mocks.purchaseUpsert,
    },
    $transaction: async (callback: (tx: any) => Promise<any>) =>
      callback({
        purchase: {
          upsert: mocks.purchaseUpsert,
        },
      }),
  },
}));

vi.mock("next/headers", () => ({
  cookies: mocks.cookies,
}));

vi.mock("@/lib/language", () => ({
  normalizeLanguage: mocks.normalizeLanguage,
}));

vi.mock("@/lib/course-translations", () => ({
  getCourseTranslationBundle: mocks.getCourseTranslationBundle,
  resolveCourseText: mocks.resolveCourseText,
}));

vi.mock("@/lib/course-purchase-sync", () => ({
  upsertCoursePurchaseFromProvider: mocks.upsertCoursePurchaseFromProvider,
}));

vi.mock("@/lib/lemon-squeezy", () => ({
  isLemonConfigured: mocks.isLemonConfigured,
  isLemonWebhookConfigured: mocks.isLemonWebhookConfigured,
  getLemonConfig: mocks.getLemonConfig,
  createLemonCheckout: mocks.createLemonCheckout,
}));

describe("POST /api/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.cookies.mockResolvedValue({ get: vi.fn(() => undefined) });
    mocks.normalizeLanguage.mockReturnValue("es");
    mocks.getCourseTranslationBundle.mockResolvedValue({ courses: new Map() });
    mocks.resolveCourseText.mockReturnValue({
      title: "Curso",
      description: "Desc",
    });
    mocks.upsertCoursePurchaseFromProvider.mockResolvedValue(undefined);
    mocks.isLemonConfigured.mockReturnValue(false);
    mocks.isLemonWebhookConfigured.mockReturnValue(false);
    mocks.getLemonConfig.mockReturnValue({
      storeId: "store-1",
      variantId: "variant-1",
      webhookSecret: "whsec_1",
    });
    mocks.createLemonCheckout.mockResolvedValue(
      "https://lemon.test/checkout/session",
    );
  });

  test("returns 400 for missing courseId", async () => {
    const { POST } = await import("@/app/api/checkout/route");
    const req = createCheckoutRequest({});

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  test("returns 400 for unsupported payment method", async () => {
    const { POST } = await import("@/app/api/checkout/route");
    const req = createCheckoutRequest({ courseId: "c1", paymentMethod: "pix" });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  test("returns 401 when user is not authenticated", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const { POST } = await import("@/app/api/checkout/route");
    const req = createCheckoutRequest({ courseId: "c1" });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  test("returns 404 when course does not exist", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "student@example.com" } },
    });
    mocks.courseFindUnique.mockResolvedValue(null);

    const { POST } = await import("@/app/api/checkout/route");
    const req = createCheckoutRequest({ courseId: "c1" });

    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  test("returns 400 when already purchased", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "student@example.com" } },
    });
    mocks.courseFindUnique.mockResolvedValue({
      id: "c1",
      title: "Curso",
      description: "",
      price: 10,
    });
    mocks.purchaseFindUnique.mockResolvedValue({ id: "p1" });

    const { POST } = await import("@/app/api/checkout/route");
    const req = createCheckoutRequest({ courseId: "c1" });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  test("creates purchase immediately for free courses", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "student@example.com" } },
    });
    mocks.courseFindUnique.mockResolvedValue({
      id: "c1",
      title: "Curso",
      description: "",
      price: 0,
    });
    mocks.purchaseFindUnique.mockResolvedValue(null);
    mocks.purchaseUpsert.mockResolvedValue({ id: "p1" });

    const { POST } = await import("@/app/api/checkout/route");
    const req = createCheckoutRequest({ courseId: "c1", source: "dashboard" });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.url).toContain("/dashboard?purchase=success");
    expect(mocks.purchaseUpsert).toHaveBeenCalledTimes(1);
  });

  test("returns 503 when Lemon is not configured for paid course", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "student@example.com" } },
    });
    mocks.courseFindUnique.mockResolvedValue({
      id: "c1",
      title: "Jazz",
      description: "Desc",
      price: 29.99,
    });
    mocks.purchaseFindUnique.mockResolvedValue(null);

    const { POST } = await import("@/app/api/checkout/route");
    const req = createCheckoutRequest({ courseId: "c1" });

    const res = await POST(req);
    expect(res.status).toBe(503);
  });

  test("creates Lemon checkout session for paid course when configured", async () => {
    mocks.isLemonConfigured.mockReturnValue(true);
    mocks.isLemonWebhookConfigured.mockReturnValue(true);
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "student@example.com" } },
    });
    mocks.courseFindUnique.mockResolvedValue({
      id: "c1",
      title: "Jazz",
      description: "Desc",
      price: 29.99,
    });
    mocks.purchaseFindUnique.mockResolvedValue(null);

    const { POST } = await import("@/app/api/checkout/route");
    const req = createCheckoutRequest({ courseId: "c1", source: "dashboard" });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.url).toBe("https://lemon.test/checkout/session");
    expect(mocks.createLemonCheckout).toHaveBeenCalledTimes(1);
  });

  test("returns 400 when user has no email", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "u1", email: null } },
    });

    const { POST } = await import("@/app/api/checkout/route");
    const req = createCheckoutRequest({ courseId: "c1" });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  test("free course from course source redirects to course page", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "student@example.com" } },
    });
    mocks.courseFindUnique.mockResolvedValue({
      id: "c1",
      title: "Curso",
      description: "",
      price: 0,
    });
    mocks.purchaseFindUnique.mockResolvedValue(null);
    mocks.purchaseUpsert.mockResolvedValue({ id: "p1" });

    const { POST } = await import("@/app/api/checkout/route");
    const req = createCheckoutRequest({ courseId: "c1", source: "course" });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.url).toContain("/courses/c1?success=true");
  });

  test("ignores untrusted origin header when building success url", async () => {
    const previousAppUrl = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = APP_URL;

    try {
      mocks.getUser.mockResolvedValue({
        data: { user: { id: "u1", email: "student@example.com" } },
      });
      mocks.courseFindUnique.mockResolvedValue({
        id: "c1",
        title: "Curso",
        description: "",
        price: 0,
      });
      mocks.purchaseFindUnique.mockResolvedValue(null);
      mocks.purchaseUpsert.mockResolvedValue({ id: "p1" });

      const { POST } = await import("@/app/api/checkout/route");
      const req = new Request(`${APP_URL}/api/checkout`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://evil.example",
        },
        body: JSON.stringify({ courseId: "c1", source: "dashboard" }),
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.url).toContain(`${APP_URL}/dashboard?purchase=success`);
      expect(body.url).not.toContain("evil.example");
    } finally {
      if (previousAppUrl === undefined) {
        delete process.env.NEXT_PUBLIC_APP_URL;
      } else {
        process.env.NEXT_PUBLIC_APP_URL = previousAppUrl;
      }
    }
  });

  test("returns 500 on unexpected error", async () => {
    mocks.getUser.mockRejectedValue(new Error("unexpected"));

    const { POST } = await import("@/app/api/checkout/route");
    const req = createCheckoutRequest({ courseId: "c1" });

    const res = await POST(req);
    expect(res.status).toBe(500);
  });

  test("creates a local test checkout on localhost requests", async () => {
    process.env.ENABLE_LOCAL_TEST_CHECKOUT = "1";
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "student@example.com" } },
    });
    mocks.courseFindUnique.mockResolvedValue({
      id: "c1",
      title: "Jazz",
      description: "Desc",
      price: 29.99,
    });
    mocks.purchaseFindUnique.mockResolvedValue(null);

    const { POST } = await import("@/app/api/checkout/route");
    const req = new Request("http://localhost:3000/api/checkout", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
      },
      body: JSON.stringify({ courseId: "c1", source: "dashboard" }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.url).toContain(
      "/dashboard?purchase=success&source=dashboard&test=1",
    );
    expect(mocks.upsertCoursePurchaseFromProvider).toHaveBeenCalledTimes(1);
    delete process.env.ENABLE_LOCAL_TEST_CHECKOUT;
  });
});
