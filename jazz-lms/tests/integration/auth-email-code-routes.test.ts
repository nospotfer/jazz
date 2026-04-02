import { afterAll, beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listUsers: vi.fn(),
  createUser: vi.fn(),
  updateUserById: vi.fn(),
  signInWithOtp: vi.fn(),
  verifyOtp: vi.fn(),
  userFindUnique: vi.fn(),
  userUpsert: vi.fn(),
  userUpdateMany: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: {
      admin: {
        listUsers: mocks.listUsers,
        createUser: mocks.createUser,
        updateUserById: mocks.updateUserById,
      },
      signInWithOtp: mocks.signInWithOtp,
      verifyOtp: mocks.verifyOtp,
    },
  })),
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: mocks.userFindUnique,
      upsert: mocks.userUpsert,
      updateMany: mocks.userUpdateMany,
    },
  },
}));

const originalEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseServiceRole: process.env.SUPABASE_SERVICE_ROLE_KEY,
  adminOwnerEmail: process.env.ADMIN_OWNER_EMAIL,
};

function setValidSupabaseEnv() {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key-for-tests";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-for-tests";
}

function requestJson(body: Record<string, unknown>) {
  return new Request("http://localhost:3000", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
    },
  });
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();

  setValidSupabaseEnv();
  delete process.env.ADMIN_OWNER_EMAIL;

  mocks.listUsers.mockResolvedValue({ data: { users: [] } });
  mocks.createUser.mockResolvedValue({
    data: {
      user: {
        id: "uid-new",
      },
    },
    error: null,
  });
  mocks.updateUserById.mockResolvedValue({ error: null });
  mocks.signInWithOtp.mockResolvedValue({ error: null });
  mocks.verifyOtp.mockResolvedValue({ error: null });
  mocks.userFindUnique.mockResolvedValue(null);
  mocks.userUpsert.mockResolvedValue({ id: "uid-upsert" });
  mocks.userUpdateMany.mockResolvedValue({ count: 1 });
});

afterAll(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = originalEnv.supabaseUrl;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalEnv.supabaseAnonKey;
  process.env.SUPABASE_SERVICE_ROLE_KEY = originalEnv.supabaseServiceRole;
  process.env.ADMIN_OWNER_EMAIL = originalEnv.adminOwnerEmail;
});

describe("POST /api/auth/send-code", () => {
  test("returns 400 for invalid email format", async () => {
    const { POST } = await import("@/app/api/auth/send-code/route");
    const response = await POST(requestJson({ email: "invalid" }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        error: expect.stringMatching(/inválido/i),
      }),
    );
    expect(mocks.listUsers).not.toHaveBeenCalled();
  });

  test("returns 404 when account does not exist in Supabase auth", async () => {
    const { POST } = await import("@/app/api/auth/send-code/route");
    const response = await POST(requestJson({ email: "student@example.com" }));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        error: expect.stringMatching(/no se encontró la cuenta/i),
      }),
    );
  });

  test("returns 409 when account is already verified", async () => {
    mocks.listUsers.mockResolvedValue({
      data: {
        users: [
          {
            email: "student@example.com",
            email_confirmed_at: "2026-01-01T00:00:00.000Z",
          },
        ],
      },
    });

    const { POST } = await import("@/app/api/auth/send-code/route");
    const response = await POST(requestJson({ email: "student@example.com" }));

    expect(response.status).toBe(409);
  });

  test("returns 429 on Supabase OTP rate limiting", async () => {
    mocks.listUsers.mockResolvedValue({
      data: {
        users: [
          {
            email: "student@example.com",
            email_confirmed_at: null,
          },
        ],
      },
    });
    mocks.signInWithOtp.mockResolvedValue({
      error: { message: "rate limit exceeded" },
    });

    const { POST } = await import("@/app/api/auth/send-code/route");
    const response = await POST(requestJson({ email: "student@example.com" }));

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({ retryAfterSeconds: 120 }),
    );
  });

  test("returns success for unverified existing account", async () => {
    mocks.listUsers.mockResolvedValue({
      data: {
        users: [
          {
            email: "student@example.com",
            email_confirmed_at: null,
          },
        ],
      },
    });

    const { POST } = await import("@/app/api/auth/send-code/route");
    const response = await POST(requestJson({ email: "student@example.com" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({ success: true }),
    );
    expect(mocks.signInWithOtp).toHaveBeenCalledWith({
      email: "student@example.com",
      options: {
        shouldCreateUser: false,
      },
    });
  });
});

describe("POST /api/auth/register", () => {
  test("returns 400 when required fields are missing", async () => {
    const { POST } = await import("@/app/api/auth/register/route");
    const response = await POST(
      requestJson({ email: "", password: "", fullName: "" }),
    );

    expect(response.status).toBe(400);
    expect(mocks.userFindUnique).not.toHaveBeenCalled();
  });

  test("returns 409 when user is already verified in database", async () => {
    mocks.userFindUnique.mockResolvedValue({
      id: "u-verified",
      email: "verified@example.com",
      emailVerified: true,
    });

    const { POST } = await import("@/app/api/auth/register/route");
    const response = await POST(
      requestJson({
        email: "verified@example.com",
        password: "password123",
        fullName: "Verified User",
      }),
    );

    expect(response.status).toBe(409);
    expect(mocks.createUser).not.toHaveBeenCalled();
  });

  test("creates owner account as SUPER_ADMIN and sends verification code", async () => {
    const { POST } = await import("@/app/api/auth/register/route");
    const response = await POST(
      requestJson({
        email: "admin@neurofactory.net",
        password: "password123",
        fullName: "Admin User",
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.createUser).toHaveBeenCalledTimes(1);
    expect(mocks.userUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          email: "admin@neurofactory.net",
          role: "SUPER_ADMIN",
          emailVerified: false,
        }),
      }),
    );
    expect(mocks.signInWithOtp).toHaveBeenCalledTimes(1);
  });

  test("updates existing unverified Supabase account password", async () => {
    mocks.listUsers.mockResolvedValue({
      data: {
        users: [
          {
            id: "uid-existing",
            email: "student@example.com",
            email_confirmed_at: null,
          },
        ],
      },
    });

    const { POST } = await import("@/app/api/auth/register/route");
    const response = await POST(
      requestJson({
        email: "student@example.com",
        password: "password123",
        fullName: "Student",
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.createUser).not.toHaveBeenCalled();
    expect(mocks.updateUserById).toHaveBeenCalledWith("uid-existing", {
      password: "password123",
      user_metadata: { full_name: "Student" },
    });
  });

  test("returns 400 when Supabase account creation fails", async () => {
    mocks.createUser.mockResolvedValue({
      data: { user: null },
      error: { message: "create failed" },
    });

    const { POST } = await import("@/app/api/auth/register/route");
    const response = await POST(
      requestJson({
        email: "newuser@example.com",
        password: "password123",
        fullName: "New User",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({ error: "create failed" }),
    );
  });
});

describe("POST /api/auth/verify-code", () => {
  test("returns 400 for invalid code format", async () => {
    const { POST } = await import("@/app/api/auth/verify-code/route");
    const response = await POST(
      requestJson({ email: "student@example.com", code: "12A" }),
    );

    expect(response.status).toBe(400);
    expect(mocks.verifyOtp).not.toHaveBeenCalled();
  });

  test("returns expired-code message when OTP has expired", async () => {
    mocks.verifyOtp.mockResolvedValue({
      error: { message: "token expired" },
    });

    const { POST } = await import("@/app/api/auth/verify-code/route");
    const response = await POST(
      requestJson({ email: "student@example.com", code: "123456" }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        error: expect.stringMatching(/expirado/i),
      }),
    );
  });

  test("upserts owner as SUPER_ADMIN when verification succeeds", async () => {
    mocks.listUsers.mockResolvedValue({
      data: {
        users: [
          {
            id: "uid-owner",
            email: "admin@neurofactory.net",
            user_metadata: {
              full_name: "Owner",
            },
          },
        ],
      },
    });

    const { POST } = await import("@/app/api/auth/verify-code/route");
    const response = await POST(
      requestJson({ email: "admin@neurofactory.net", code: "123456" }),
    );

    expect(response.status).toBe(200);
    expect(mocks.userUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          email: "admin@neurofactory.net",
          role: "SUPER_ADMIN",
          emailVerified: true,
        }),
      }),
    );
  });

  test("falls back to updateMany when Supabase user lookup does not return a record", async () => {
    const { POST } = await import("@/app/api/auth/verify-code/route");
    const response = await POST(
      requestJson({ email: "student@example.com", code: "123456" }),
    );

    expect(response.status).toBe(200);
    expect(mocks.userUpdateMany).toHaveBeenCalledWith({
      where: {
        email: "student@example.com",
      },
      data: {
        emailVerified: true,
      },
    });
  });
});
