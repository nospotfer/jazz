import { afterAll, beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  resendSend: vi.fn(),
}));

vi.mock("resend", () => ({
  Resend: vi.fn(function () { return {
    emails: {
      send: mocks.resendSend,
    },
  }; }),
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
  test.each([null, [], { messageType: "question", message: 42, email: "student@example.com" },
    { messageType: "unknown", message: "Hello", email: "student@example.com" },
    { messageType: "question", message: "   ", email: "student@example.com" }])(
    "rejects invalid contact field types and unsupported message types", async (body) => {
      const { POST } = await import("@/app/api/contact/route");
      const response = await POST(new Request("http://localhost/api/contact", {
        method: "POST", body: JSON.stringify(body),
      }));
      expect(response.status).toBe(400);
      expect(mocks.resendSend).not.toHaveBeenCalled();
    },
  );

  test("rejects malformed JSON without reporting a server failure", async () => {
    const { POST } = await import("@/app/api/contact/route");
    expect((await POST(new Request("http://localhost/api/contact", {
      method: "POST", body: "{",
    }))).status).toBe(400);
  });

  test("bounds streamed input without a Content-Length header", async () => {
    const { POST } = await import("@/app/api/contact/route");
    const response = await POST(requestJson({
      messageType: "question", message: "Hello", email: `!@${"!.".repeat(5000)}`,
    }));
    expect(response.status).toBe(413);
    expect(mocks.resendSend).not.toHaveBeenCalled();
  });

  test.each([`!@${"!.".repeat(100)}`, "student@example..com", "student@example.com\r\nBcc: victim@example.com",
    "a@@example.com", "student@-example.com", `${"a".repeat(65)}@example.com`])(
    "rejects malformed or oversized email components", async (email) => {
      const { POST } = await import("@/app/api/contact/route");
      const response = await POST(requestJson({ messageType: "question", message: "Hello", email }));
      expect(response.status).toBe(400);
      expect(mocks.resendSend).not.toHaveBeenCalled();
    },
  );

  test("renders visitor text as text rather than email HTML", async () => {
    const { POST } = await import("@/app/api/contact/route");
    const response = await POST(requestJson({
      messageType: "question", email: "student@example.com",
      message: '<a href="https://attacker.example">Pay & unlock</a>',
    }));
    expect(response.status).toBe(200);
    const sent = mocks.resendSend.mock.calls[0][0];
    expect(sent.html).toContain('&lt;a href=&quot;https://attacker.example&quot;&gt;Pay &amp; unlock&lt;/a&gt;');
    expect(sent.html).not.toContain('<a href="https://attacker.example">');
  });

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
