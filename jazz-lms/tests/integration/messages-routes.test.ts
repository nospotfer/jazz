import { afterAll, beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  ensureTables: vi.fn(),
  getUser: vi.fn(),
  queryRawUnsafe: vi.fn(),
  executeRawUnsafe: vi.fn(),
  randomUUID: vi.fn(),
  resendSend: vi.fn(),
}));

vi.mock("@/lib/messages-db", () => ({
  ensureMessagingTables: mocks.ensureTables,
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
    $queryRawUnsafe: mocks.queryRawUnsafe,
    $executeRawUnsafe: mocks.executeRawUnsafe,
  },
}));

vi.mock("crypto", async (importOriginal) => {
  const actual = await importOriginal<typeof import("crypto")>();
  return {
    ...actual,
    randomUUID: mocks.randomUUID,
  };
});

vi.mock("resend", () => ({
  Resend: vi.fn(() => ({
    emails: {
      send: mocks.resendSend,
    },
  })),
}));

const originalEnv = {
  professorEmail: process.env.PROFESSOR_EMAIL,
  resendApiKey: process.env.RESEND_API_KEY,
  resendFromEmail: process.env.RESEND_FROM_EMAIL,
};

function jsonRequest(url: string, body: Record<string, unknown>) {
  return new Request(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function threadContext(threadId: string) {
  return {
    params: Promise.resolve({ threadId }),
  };
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();

  process.env.PROFESSOR_EMAIL = "culturadeljazz@gmail.com";
  process.env.RESEND_API_KEY = "re_test_key";
  process.env.RESEND_FROM_EMAIL = "Jazz <no-reply@culturadeljazz.com>";

  mocks.ensureTables.mockResolvedValue(undefined);
  mocks.getUser.mockResolvedValue({
    data: {
      user: {
        id: "u1",
        email: "student@example.com",
        user_metadata: { full_name: "Student" },
      },
    },
  });
  mocks.queryRawUnsafe.mockResolvedValue([]);
  mocks.executeRawUnsafe.mockResolvedValue(undefined);
  mocks.randomUUID
    .mockReturnValueOnce("message-1")
    .mockReturnValueOnce("thread-1")
    .mockReturnValue("uuid-fallback");
  mocks.resendSend.mockResolvedValue({ data: { id: "mail-1" }, error: null });
});

afterAll(() => {
  process.env.PROFESSOR_EMAIL = originalEnv.professorEmail;
  process.env.RESEND_API_KEY = originalEnv.resendApiKey;
  process.env.RESEND_FROM_EMAIL = originalEnv.resendFromEmail;
});

describe("/api/messages", () => {
  test("GET returns 401 when unauthenticated", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const { GET } = await import("@/app/api/messages/route");
    const response = await GET();

    expect(response.status).toBe(401);
  });

  test("GET returns threads for professor", async () => {
    mocks.getUser.mockResolvedValue({
      data: {
        user: {
          id: "prof-1",
          email: "culturadeljazz@gmail.com",
          user_metadata: { full_name: "Professor" },
        },
      },
    });
    mocks.queryRawUnsafe.mockResolvedValue([
      {
        id: "thread-1",
        studentId: "u1",
        studentEmail: "student@example.com",
        studentName: "Student",
        subject: "Need help",
      },
    ]);

    const { GET } = await import("@/app/api/messages/route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.isProfessor).toBe(true);
    expect(body.threads).toHaveLength(1);
  });

  test("POST returns 403 when professor tries creating student thread", async () => {
    mocks.getUser.mockResolvedValue({
      data: {
        user: {
          id: "prof-1",
          email: "culturadeljazz@gmail.com",
          user_metadata: { full_name: "Professor" },
        },
      },
    });

    const { POST } = await import("@/app/api/messages/route");
    const response = await POST(
      jsonRequest("http://localhost:3000/api/messages", {
        subject: "Question",
        message: "Can you help me?",
      }),
    );

    expect(response.status).toBe(403);
  });

  test("POST creates a new thread and inserts first message", async () => {
    mocks.queryRawUnsafe.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    const { POST } = await import("@/app/api/messages/route");
    const response = await POST(
      jsonRequest("http://localhost:3000/api/messages", {
        subject: "Need payment support",
        message: "I need help with my checkout.",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("thread-1");
    expect(body.createdNewThread).toBe(true);

    const sqlCalls = mocks.executeRawUnsafe.mock.calls.map((call) =>
      String(call[0]),
    );
    expect(
      sqlCalls.some((sql) => sql.includes("INSERT INTO MessageThread")),
    ).toBe(true);
    expect(sqlCalls.some((sql) => sql.includes("INSERT INTO Message ("))).toBe(
      true,
    );
  });
});

describe("/api/messages/[threadId]", () => {
  test("GET returns 403 when student does not own thread", async () => {
    mocks.queryRawUnsafe.mockResolvedValueOnce([
      {
        id: "thread-1",
        studentId: "other-user",
        studentEmail: "other@example.com",
        subject: "Other thread",
      },
    ]);

    const { GET } = await import("@/app/api/messages/[threadId]/route");
    const response = await GET(
      new Request("http://localhost:3000/api/messages/thread-1"),
      threadContext("thread-1"),
    );

    expect(response.status).toBe(403);
  });

  test("GET returns thread and marks unread as read for owner", async () => {
    mocks.queryRawUnsafe
      .mockResolvedValueOnce([
        {
          id: "thread-1",
          studentId: "u1",
          studentEmail: "student@example.com",
          subject: "Need help",
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "message-1",
          threadId: "thread-1",
          senderId: "u1",
          senderEmail: "student@example.com",
          senderName: "Student",
          senderRole: "student",
          body: "Hello",
          createdAt: new Date().toISOString(),
        },
      ]);

    const { GET } = await import("@/app/api/messages/[threadId]/route");
    const response = await GET(
      new Request("http://localhost:3000/api/messages/thread-1"),
      threadContext("thread-1"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.thread.id).toBe("thread-1");
    expect(body.messages).toHaveLength(1);

    const sqlCalls = mocks.executeRawUnsafe.mock.calls.map((call) =>
      String(call[0]),
    );
    expect(sqlCalls.some((sql) => sql.includes("unreadByStudent = 0"))).toBe(
      true,
    );
  });

  test("POST skips duplicate message sent too soon", async () => {
    const now = new Date().toISOString();

    mocks.queryRawUnsafe
      .mockResolvedValueOnce([
        {
          id: "thread-1",
          studentId: "u1",
          studentEmail: "student@example.com",
          subject: "Need help",
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "last-1",
          senderId: "u1",
          body: "Same body",
          createdAt: now,
        },
      ]);

    const { POST } = await import("@/app/api/messages/[threadId]/route");
    const response = await POST(
      jsonRequest("http://localhost:3000/api/messages/thread-1", {
        message: "Same body",
      }),
      threadContext("thread-1"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.duplicateSkipped).toBe(true);

    const sqlCalls = mocks.executeRawUnsafe.mock.calls.map((call) =>
      String(call[0]),
    );
    expect(sqlCalls.some((sql) => sql.includes("INSERT INTO Message ("))).toBe(
      false,
    );
  });
});
