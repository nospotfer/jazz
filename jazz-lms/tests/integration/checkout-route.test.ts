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
  userFindUnique: vi.fn(),
  courseFindUnique: vi.fn(),
  purchaseFindUnique: vi.fn(),
  purchaseUpsert: vi.fn(),
  cookies: vi.fn(),
  normalizeLanguage: vi.fn(),
  getCourseTranslationBundle: vi.fn(),
  resolveCourseText: vi.fn(),
  upsertCoursePurchaseFromProvider: vi.fn(),
  getPaymentProvider: vi.fn(),
  isActivePaymentProviderConfigured: vi.fn(),
  createProviderCheckout: vi.fn(),
  getProviderVoucherReferencePrefix: vi.fn(),
  isDodoWebhookConfigured: vi.fn(),
  validateVoucherForCourse: vi.fn(),
  isLocalTestRequest: vi.fn(),
  voucherUpdate: vi.fn(),
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
    user: { findUnique: mocks.userFindUnique },
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
    voucherCode: {
      update: mocks.voucherUpdate,
    },
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

vi.mock("@/lib/payments/provider", () => ({
  getPaymentProvider: mocks.getPaymentProvider,
  isActivePaymentProviderConfigured: mocks.isActivePaymentProviderConfigured,
  createProviderCheckout: mocks.createProviderCheckout,
  getProviderVoucherReferencePrefix: mocks.getProviderVoucherReferencePrefix,
}));

vi.mock("@/lib/payments/providers/dodo", () => ({
  isDodoWebhookConfigured: mocks.isDodoWebhookConfigured,
}));

vi.mock("@/lib/vouchers", () => ({
  validateVoucherForCourse: mocks.validateVoucherForCourse,
}));

vi.mock("@/lib/test-mode", () => ({
  isLocalTestRequest: mocks.isLocalTestRequest,
}));

describe("POST /api/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.cookies.mockResolvedValue({ get: vi.fn(() => undefined) });
    mocks.userFindUnique.mockResolvedValue(null);
    mocks.normalizeLanguage.mockReturnValue("es");
    mocks.getCourseTranslationBundle.mockResolvedValue({ courses: new Map() });
    mocks.resolveCourseText.mockReturnValue({
      title: "Curso",
      description: "Desc",
    });
    mocks.upsertCoursePurchaseFromProvider.mockResolvedValue(undefined);
    mocks.getPaymentProvider.mockReturnValue("dodo");
    mocks.isActivePaymentProviderConfigured.mockReturnValue(false);
    mocks.createProviderCheckout.mockResolvedValue(
      "https://test.checkout.dodopayments.com/session/cks_123",
    );
    mocks.getProviderVoucherReferencePrefix.mockReturnValue("dodo-voucher");
    mocks.isDodoWebhookConfigured.mockReturnValue(true);
    mocks.validateVoucherForCourse.mockResolvedValue(null);
    mocks.isLocalTestRequest.mockReturnValue(false);
    mocks.voucherUpdate.mockResolvedValue(undefined);
  });

  test("returns 400 for missing courseId", async () => {
    const { POST } = await import("@/app/api/checkout/route");
    const req = createCheckoutRequest({});

    const res = await POST(req);
    expect(res.status).toBe(400);
  }, 15000);

  test("returns 400 for malformed json body", async () => {
    const { POST } = await import("@/app/api/checkout/route");
    const req = new Request(`${APP_URL}/api/checkout`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: APP_URL },
      body: "{invalid",
    });

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

  test("continues checkout flow when prisma user lookup fails", async () => {
    mocks.isActivePaymentProviderConfigured.mockReturnValue(false);
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "student@example.com" } },
    });
    mocks.userFindUnique.mockRejectedValue(new Error("relation User missing"));
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

  test("blocks admin checkout when already purchased (no bypass)", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "admin@example.com" } },
    });
    mocks.userFindUnique.mockResolvedValue({ role: "SUPER_ADMIN" });
    mocks.courseFindUnique.mockResolvedValue({
      id: "c1",
      title: "Curso",
      description: "",
      price: 29.99,
    });
    mocks.purchaseFindUnique.mockResolvedValue({ id: "p1" });
    mocks.isActivePaymentProviderConfigured.mockReturnValue(false);

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

  test("returns 503 when provider is not configured for paid course", async () => {
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

  test("creates checkout session for paid course when provider is configured", async () => {
    mocks.isActivePaymentProviderConfigured.mockReturnValue(true);
    mocks.isDodoWebhookConfigured.mockReturnValue(true);
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
    expect(body.url).toBe(
      "https://test.checkout.dodopayments.com/session/cks_123",
    );
    expect(mocks.createProviderCheckout).toHaveBeenCalledTimes(1);
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
    mocks.isLocalTestRequest.mockReturnValue(true);
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
  });

  test("returns 400 when voucher validation fails", async () => {
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
    mocks.validateVoucherForCourse.mockResolvedValue({
      valid: false,
      message: "Voucher inválido",
    });

    const { POST } = await import("@/app/api/checkout/route");
    const req = createCheckoutRequest({ courseId: "c1", voucherCode: "bad" });

    const res = await POST(req);
    const text = await res.text();

    expect(res.status).toBe(400);
    expect(text).toContain("Voucher inválido");
  });

  test("creates free checkout when voucher makes final price zero", async () => {
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
    mocks.validateVoucherForCourse.mockResolvedValue({
      valid: true,
      isFree: true,
      originalPrice: 29.99,
      discount: 29.99,
      finalPrice: 0,
      voucher: {
        code: "FREE100",
        providerDiscountCode: "FREE100_PROVIDER",
      },
    });

    const { POST } = await import("@/app/api/checkout/route");
    const req = createCheckoutRequest({
      courseId: "c1",
      source: "dashboard",
      voucherCode: "free100",
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.url).toContain("voucher=true&free=true");
    expect(mocks.upsertCoursePurchaseFromProvider).toHaveBeenCalledTimes(1);
  });

  test("falls back to checkout without voucher when provider rejects discount", async () => {
    mocks.isActivePaymentProviderConfigured.mockReturnValue(true);
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
    mocks.validateVoucherForCourse.mockResolvedValue({
      valid: true,
      isFree: false,
      originalPrice: 29.99,
      discount: 5,
      finalPrice: 24.99,
      voucher: {
        id: "v1",
        code: "JAZZ5",
        providerDiscountCode: "DODO5",
        maxUses: 100,
        currentUses: 10,
      },
    });

    mocks.createProviderCheckout
      .mockRejectedValueOnce(new Error("discount does not exist"))
      .mockResolvedValueOnce(
        "https://test.checkout.dodopayments.com/session/cks_full_price",
      );

    const { POST } = await import("@/app/api/checkout/route");
    const req = createCheckoutRequest({
      courseId: "c1",
      voucherCode: "JAZZ5",
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.url).toContain("cks_full_price");
    expect(mocks.createProviderCheckout).toHaveBeenCalledTimes(2);
  });

  test("returns 400 when voucher fallback checkout also fails", async () => {
    mocks.isActivePaymentProviderConfigured.mockReturnValue(true);
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
    mocks.validateVoucherForCourse.mockResolvedValue({
      valid: true,
      isFree: false,
      originalPrice: 29.99,
      discount: 5,
      finalPrice: 24.99,
      voucher: {
        id: "v1",
        code: "JAZZ5",
        providerDiscountCode: "DODO5",
        maxUses: 100,
        currentUses: 10,
      },
    });

    mocks.createProviderCheckout
      .mockRejectedValueOnce(new Error("discount does not exist"))
      .mockRejectedValueOnce(new Error("fallback failed"));

    const { POST } = await import("@/app/api/checkout/route");
    const req = createCheckoutRequest({
      courseId: "c1",
      voucherCode: "JAZZ5",
    });

    const res = await POST(req);
    const text = await res.text();

    expect(res.status).toBe(400);
    expect(text).toContain("voucher");
  });

  test("falls back without voucher context when provider rejects discount", async () => {
    mocks.isActivePaymentProviderConfigured.mockReturnValue(true);
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

    mocks.createProviderCheckout
      .mockRejectedValueOnce(new Error("discount not valid"))
      .mockResolvedValueOnce(
        "https://test.checkout.dodopayments.com/session/cks_no_voucher",
      );

    const { POST } = await import("@/app/api/checkout/route");
    const req = createCheckoutRequest({ courseId: "c1" });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.url).toContain("cks_no_voucher");
  });

  test("returns 400 and syncs voucher usage when provider reports max redemptions", async () => {
    mocks.isActivePaymentProviderConfigured.mockReturnValue(true);
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
    mocks.validateVoucherForCourse.mockResolvedValue({
      valid: true,
      isFree: false,
      originalPrice: 29.99,
      discount: 5,
      finalPrice: 24.99,
      voucher: {
        id: "v1",
        code: "JAZZ5",
        providerDiscountCode: "DODO5",
        maxUses: 12,
        currentUses: 11,
      },
    });

    mocks.createProviderCheckout.mockRejectedValueOnce(
      new Error("discount maximum redemptions reached"),
    );

    const { POST } = await import("@/app/api/checkout/route");
    const req = createCheckoutRequest({
      courseId: "c1",
      voucherCode: "JAZZ5",
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(mocks.voucherUpdate).toHaveBeenCalledTimes(1);
  });

  test("returns 400 and increments usage from currentUses when voucher has no maxUses", async () => {
    mocks.isActivePaymentProviderConfigured.mockReturnValue(true);
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
    mocks.validateVoucherForCourse.mockResolvedValue({
      valid: true,
      isFree: false,
      originalPrice: 29.99,
      discount: 5,
      finalPrice: 24.99,
      voucher: {
        id: "v2",
        code: "JAZZNOMAX",
        providerDiscountCode: "DODO-NOMAX",
        maxUses: null,
        currentUses: 3,
      },
    });

    mocks.createProviderCheckout.mockRejectedValueOnce(
      new Error("discount usage limit reached"),
    );

    const { POST } = await import("@/app/api/checkout/route");
    const req = createCheckoutRequest({
      courseId: "c1",
      voucherCode: "JAZZNOMAX",
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(mocks.voucherUpdate).toHaveBeenCalledWith({
      where: { id: "v2" },
      data: { currentUses: 4 },
    });
  });

  test("returns 400 on fallback failure even when voucher is not locally validated", async () => {
    mocks.isActivePaymentProviderConfigured.mockReturnValue(true);
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
    mocks.createProviderCheckout
      .mockRejectedValueOnce(new Error("discount invalid"))
      .mockRejectedValueOnce(new Error("fallback failed"));

    const { POST } = await import("@/app/api/checkout/route");
    const req = createCheckoutRequest({
      courseId: "c1",
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  test("returns 503 when provider checkout reports missing dodo configuration", async () => {
    mocks.isActivePaymentProviderConfigured.mockReturnValue(true);
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
    mocks.createProviderCheckout.mockRejectedValueOnce(
      new Error("missing dodo api key"),
    );

    const { POST } = await import("@/app/api/checkout/route");
    const req = createCheckoutRequest({ courseId: "c1" });

    const res = await POST(req);

    expect(res.status).toBe(503);
  });

  test("returns 503 when provider checkout fails with timeout", async () => {
    mocks.isActivePaymentProviderConfigured.mockReturnValue(true);
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
    mocks.createProviderCheckout.mockRejectedValueOnce(new Error("timeout"));

    const { POST } = await import("@/app/api/checkout/route");
    const req = createCheckoutRequest({ courseId: "c1" });

    const res = await POST(req);

    expect(res.status).toBe(503);
  });

  test("returns 500 when provider generic error occurs with validated voucher", async () => {
    mocks.isActivePaymentProviderConfigured.mockReturnValue(true);
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
    mocks.validateVoucherForCourse.mockResolvedValue({
      valid: true,
      isFree: false,
      originalPrice: 29.99,
      discount: 5,
      finalPrice: 24.99,
      voucher: {
        id: "v1",
        code: "JAZZ5",
        providerDiscountCode: "DODO5",
        maxUses: 100,
        currentUses: 10,
      },
    });
    mocks.createProviderCheckout.mockRejectedValueOnce(
      new Error("unexpected provider failure"),
    );

    const { POST } = await import("@/app/api/checkout/route");
    const req = createCheckoutRequest({ courseId: "c1", voucherCode: "JAZZ5" });

    const res = await POST(req);

    expect(res.status).toBe(500);
  });
});
