import { afterAll, beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listUsers: vi.fn(),
  getUserById: vi.fn(),
  createUser: vi.fn(),
  updateUserById: vi.fn(),
  signInWithOtp: vi.fn(),
  verifyOtp: vi.fn(),
  userFindUnique: vi.fn(),
  userUpsert: vi.fn(),
  userUpdateMany: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: {
      admin: {
        listUsers: mocks.listUsers,
        getUserById: mocks.getUserById,
        createUser: mocks.createUser,
        updateUserById: mocks.updateUserById,
      },
      signInWithOtp: mocks.signInWithOtp,
      verifyOtp: mocks.verifyOtp,
    },
  }),
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
  vi.resetAllMocks();

  setValidSupabaseEnv();
  delete process.env.ADMIN_OWNER_EMAIL;

  mocks.listUsers.mockResolvedValue({ data: { users: [] } });
  mocks.getUserById.mockResolvedValue({ data: { user: null }, error: null });
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
  mocks.verifyOtp.mockResolvedValue({ data: { user: null }, error: null });
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
  test.each([
    { data: { user: null }, error: { message: "Lookup unavailable" } },
    { data: { user: { id: "uid-stale", email: "other@example.com" } }, error: null },
  ])("fails closed if exact auth lookup fails or has a stale email", async (lookup) => {
    mocks.userFindUnique.mockResolvedValue({ id: "uid-pending", emailVerified: false });
    mocks.getUserById.mockResolvedValue(lookup);
    const { POST } = await import("@/app/api/auth/send-code/route");

    expect((await POST(requestJson({ email: "student@example.com" }))).status).toBe(503);
    expect(mocks.signInWithOtp).not.toHaveBeenCalled();
    expect(mocks.listUsers).not.toHaveBeenCalled();
  });

  test("reports a disabled OTP configuration instead of claiming email was sent", async () => {
    mocks.signInWithOtp.mockResolvedValue({ error: { code: "otp_disabled", message: "OTP disabled" } });
    const { POST } = await import("@/app/api/auth/send-code/route");

    expect((await POST(requestJson({ email: "student@example.com" }))).status).toBe(400);
  });

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

  test("does not enumerate unknown accounts or create them during resend", async () => {
    mocks.signInWithOtp.mockResolvedValue({ error: { code: "user_not_found", message: "not found" } });
    const { POST } = await import("@/app/api/auth/send-code/route");
    const response = await POST(requestJson({ email: "student@example.com" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        success: true,
      }),
    );
    expect(mocks.listUsers).not.toHaveBeenCalled();
    expect(mocks.createUser).not.toHaveBeenCalled();
    expect(mocks.signInWithOtp).toHaveBeenCalledWith({
      email: "student@example.com", options: { shouldCreateUser: false },
    });
  });

  test("returns 409 when account is already verified", async () => {
    mocks.userFindUnique.mockResolvedValue({ id: "uid-existing", emailVerified: false });
    mocks.getUserById.mockResolvedValue({
      data: { user: { id: "uid-existing", email: "student@example.com", email_confirmed_at: "2026-01-01T00:00:00.000Z" } },
      error: null,
    });

    const { POST } = await import("@/app/api/auth/send-code/route");
    const response = await POST(requestJson({ email: "student@example.com" }));

    expect(response.status).toBe(409);
  });

  test("returns 429 on Supabase OTP rate limiting", async () => {
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
    mocks.userFindUnique.mockResolvedValue({ id: "uid-after-first-50", emailVerified: false });
    mocks.getUserById.mockResolvedValue({
      data: { user: { id: "uid-after-first-50", email: "student@example.com", email_confirmed_at: null } },
      error: null,
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
    expect(mocks.getUserById).toHaveBeenCalledWith("uid-after-first-50");
    expect(mocks.listUsers).not.toHaveBeenCalled();
  });
});

describe("POST /api/auth/register", () => {
  test.each(["email_exists", "user_already_exists"])("resumes an auth-only pending account after %s without replacing its credentials", async (code) => {
    mocks.createUser.mockResolvedValue({ data: { user: null }, error: { code, message: "Already exists" } });
    const { POST } = await import("@/app/api/auth/register/route");
    const response = await POST(requestJson({ email: "student@example.com", password: "newPassword123", fullName: "Replacement name" }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ pendingRegistration: true });
    expect(mocks.updateUserById).not.toHaveBeenCalled();
    expect(mocks.userUpsert).not.toHaveBeenCalled();
    expect(mocks.listUsers).not.toHaveBeenCalled();
    expect(mocks.signInWithOtp).toHaveBeenCalledWith({ email: "student@example.com", options: { shouldCreateUser: false } });
  });

  test.each([
    { data: { user: null }, error: { message: "Lookup unavailable" } },
    { data: { user: { id: "uid-stale", email: "other@example.com" } }, error: null },
  ])("rejects stale or unavailable pending identities before account changes", async (lookup) => {
    mocks.userFindUnique.mockResolvedValue({ id: "uid-after-first-50", emailVerified: false });
    mocks.getUserById.mockResolvedValue(lookup);
    const { POST } = await import("@/app/api/auth/register/route");

    expect((await POST(requestJson({ email: "student@example.com", password: "password123", fullName: "Student" }))).status).toBe(503);
    expect(mocks.getUserById).toHaveBeenCalledWith("uid-after-first-50");
    expect(mocks.listUsers).not.toHaveBeenCalled();
    expect(mocks.createUser).not.toHaveBeenCalled();
    expect(mocks.updateUserById).not.toHaveBeenCalled();
    expect(mocks.signInWithOtp).not.toHaveBeenCalled();
    expect(mocks.userUpsert).not.toHaveBeenCalled();
  });

  test("does not change an existing confirmed provider account even when local verification is stale", async () => {
    mocks.userFindUnique.mockResolvedValue({ id: "uid-confirmed", emailVerified: false });
    mocks.getUserById.mockResolvedValue({ data: { user: { id: "uid-confirmed", email: "student@example.com", email_confirmed_at: "2026-01-01" } }, error: null });
    const { POST } = await import("@/app/api/auth/register/route");

    expect((await POST(requestJson({ email: "student@example.com", password: "password123", fullName: "Student" }))).status).toBe(409);
    expect(mocks.createUser).not.toHaveBeenCalled();
    expect(mocks.updateUserById).not.toHaveBeenCalled();
    expect(mocks.userUpsert).not.toHaveBeenCalled();
    expect(mocks.signInWithOtp).not.toHaveBeenCalled();
  });

  test("saves the newly created pending identity even when initial OTP delivery fails", async () => {
    mocks.signInWithOtp.mockResolvedValue({ error: { message: "Email delivery failed" } });
    const { POST } = await import("@/app/api/auth/register/route");

    expect((await POST(requestJson({ email: "student@example.com", password: "password123", fullName: "Student" }))).status).toBe(400);
    expect(mocks.userUpsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({ id: "uid-new", email: "student@example.com", emailVerified: false }),
      update: {},
    }));
    expect(mocks.updateUserById).not.toHaveBeenCalled();
  });

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

  test("resumes pending registration without replacing its password or profile", async () => {
    mocks.userFindUnique.mockResolvedValue({ id: "uid-existing", emailVerified: false, name: "Original name" });
    mocks.getUserById.mockResolvedValue({
      data: { user: { id: "uid-existing", email: "student@example.com", email_confirmed_at: null } },
      error: null,
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
    expect(mocks.updateUserById).not.toHaveBeenCalled();
    expect(mocks.userUpsert).not.toHaveBeenCalled();
    expect(mocks.signInWithOtp).toHaveBeenCalledOnce();
    expect(mocks.listUsers).not.toHaveBeenCalled();
    expect(await response.json()).toMatchObject({ success: true, pendingRegistration: true });
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
      expect.objectContaining({ error: "No se pudo crear la cuenta. Inténtalo de nuevo más tarde." }),
    );
  });
});

describe("POST /api/auth/verify-code", () => {
  test.each(["12a3456", "12345678901", 123456])("rejects malformed codes without changing verification state: %s", async (code) => {
    const { POST } = await import("@/app/api/auth/verify-code/route");

    expect((await POST(requestJson({ email: "student@example.com", code }))).status).toBe(400);
    expect(mocks.verifyOtp).not.toHaveBeenCalled();
    expect(mocks.userUpsert).not.toHaveBeenCalled();
  });

  test("rejects a verified identity that does not match the requested email", async () => {
    mocks.verifyOtp.mockResolvedValue({ data: { user: { id: "other-id", email: "other@example.com" } }, error: null });
    const { POST } = await import("@/app/api/auth/verify-code/route");

    expect((await POST(requestJson({ email: "student@example.com", code: "123456" }))).status).toBe(401);
    expect(mocks.userUpsert).not.toHaveBeenCalled();
    expect(mocks.userUpdateMany).not.toHaveBeenCalled();
  });

  test("synchronizes the OTP-verified user even when it is not in the first directory page", async () => {
    mocks.listUsers.mockResolvedValue({ data: { users: [{ id: "unrelated-user", email: "other@example.com" }] } });
    mocks.verifyOtp.mockResolvedValue({ data: { user: { id: "uid-after-first-50", email: "student@example.com", user_metadata: { full_name: "Original name" } } }, error: null });
    const { POST } = await import("@/app/api/auth/verify-code/route");

    expect((await POST(requestJson({ email: "STUDENT@example.com", code: "123456" }))).status).toBe(200);
    expect(mocks.userUpsert).toHaveBeenCalledWith({
      where: { email: "student@example.com" },
      create: { id: "uid-after-first-50", email: "student@example.com", name: "Original name", emailVerified: true, role: "USER" },
      update: { name: "Original name", emailVerified: true },
    });
    expect(mocks.listUsers).not.toHaveBeenCalled();
    expect(mocks.updateUserById).not.toHaveBeenCalled();
  });

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
    mocks.verifyOtp.mockResolvedValue({
      data: { user: { id: "uid-owner", email: "admin@neurofactory.net", user_metadata: { full_name: "Owner" } } },
      error: null,
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

  test("rejects successful OTP responses that omit the verified identity", async () => {
    const { POST } = await import("@/app/api/auth/verify-code/route");
    const response = await POST(
      requestJson({ email: "student@example.com", code: "123456" }),
    );

    expect(response.status).toBe(401);
    expect(mocks.userUpdateMany).not.toHaveBeenCalled();
    expect(mocks.userUpsert).not.toHaveBeenCalled();
    expect(mocks.listUsers).not.toHaveBeenCalled();
  });
});
