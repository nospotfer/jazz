import { afterAll, beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  resendSend: vi.fn(),
}));

vi.mock("resend", () => ({
  Resend: vi.fn(() => ({
    emails: {
      send: mocks.resendSend,
    },
  })),
}));

const originalEnv = {
  resendApiKey: process.env.RESEND_API_KEY,
  resendFromEmail: process.env.RESEND_FROM_EMAIL,
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL,
};

function requestJson(body: Record<string, unknown>) {
  return new Request("http://localhost:3000/api/contact", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();

  process.env.RESEND_API_KEY = "re_test_key";
  process.env.RESEND_FROM_EMAIL = "Jazz <no-reply@culturadeljazz.com>";
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL = "admin@neurofactory.net";

  mocks.resendSend.mockResolvedValue({
    data: { id: "email-id-1" },
    error: null,
  });
});

afterAll(() => {
  process.env.RESEND_API_KEY = originalEnv.resendApiKey;
  process.env.RESEND_FROM_EMAIL = originalEnv.resendFromEmail;
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL = originalEnv.supportEmail;
});

describe("POST /api/contact", () => {
  test("returns 400 when required fields are missing", async () => {
    const { POST } = await import("@/app/api/contact/route");
    const response = await POST(
      requestJson({ messageType: "question", email: "student@example.com" }),
    );

    expect(response.status).toBe(400);
    expect(mocks.resendSend).not.toHaveBeenCalled();
  });

  test("returns 400 for invalid sender email", async () => {
    const { POST } = await import("@/app/api/contact/route");
    const response = await POST(
      requestJson({
        messageType: "question",
        message: "Hello",
        email: "invalid-email",
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.resendSend).not.toHaveBeenCalled();
  });

  test("returns 400 when message exceeds max length", async () => {
    const { POST } = await import("@/app/api/contact/route");
    const response = await POST(
      requestJson({
        messageType: "doubt",
        message: "x".repeat(1001),
        email: "student@example.com",
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.resendSend).not.toHaveBeenCalled();
  });

  test("returns 500 when RESEND_API_KEY is missing", async () => {
    process.env.RESEND_API_KEY = "";

    const { POST } = await import("@/app/api/contact/route");
    const response = await POST(
      requestJson({
        messageType: "inquiry",
        message: "Need help with lessons",
        email: "student@example.com",
      }),
    );

    expect(response.status).toBe(500);
  });

  test("returns 500 when Resend returns provider error", async () => {
    mocks.resendSend.mockResolvedValue({
      data: null,
      error: { message: "provider failure" },
    });

    const { POST } = await import("@/app/api/contact/route");
    const response = await POST(
      requestJson({
        messageType: "help-request",
        message: "Cannot access my dashboard",
        email: "student@example.com",
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({ error: "Failed to send email" }),
    );
  });

  test("sends contact email successfully", async () => {
    const { POST } = await import("@/app/api/contact/route");
    const response = await POST(
      requestJson({
        messageType: "question",
        message: "I need support with payment.",
        email: "student@example.com",
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.resendSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "admin@neurofactory.net",
        replyTo: "student@example.com",
      }),
    );
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        success: true,
        messageId: "email-id-1",
      }),
    );
  });
});
