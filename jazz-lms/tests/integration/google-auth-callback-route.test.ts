import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
  getUser: vi.fn(),
  updateUser: vi.fn(),
  syncUserWithDatabase: vi.fn(),
}));

vi.mock("@/utils/supabase/server", () => ({
  createClient: () => ({
    auth: {
      exchangeCodeForSession: mocks.exchangeCodeForSession,
      getUser: mocks.getUser,
      updateUser: mocks.updateUser,
    },
  }),
}));

vi.mock("@/lib/sync-user", () => ({
  syncUserWithDatabase: mocks.syncUserWithDatabase,
}));

describe("GET /auth/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.exchangeCodeForSession.mockResolvedValue({ error: null });
    mocks.getUser.mockResolvedValue({
      data: {
        user: {
          id: "u1",
          user_metadata: {},
        },
      },
      error: null,
    });
    mocks.updateUser.mockResolvedValue({ error: null });
    mocks.syncUserWithDatabase.mockResolvedValue(undefined);
  });

  test("redirects back to auth with oauth_error when code is missing", async () => {
    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(
      new Request("http://localhost:3000/auth/callback?flow=login&lang=pt"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain(
      "/auth?flow=login&lang=pt&oauth_error=",
    );
  });

  test("uses oauth cookies as fallback when callback query is missing", async () => {
    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(
      new Request("http://localhost:3000/auth/callback", {
        headers: {
          cookie: "oauth_flow=register; oauth_lang=fr",
        },
      }),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain(
      "/auth?flow=register&lang=fr&oauth_error=",
    );
  });

  test("redirects back to auth when exchangeCodeForSession fails", async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({
      error: new Error("exchange failed"),
    });

    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(
      new Request(
        "http://localhost:3000/auth/callback?code=abc123&flow=register&lang=en",
      ),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain(
      "/auth?flow=register&lang=en&oauth_error=",
    );
  });

  test("redirects to next path and syncs user on success", async () => {
    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(
      new Request(
        "http://localhost:3000/auth/callback?code=abc123&lang=es&next=/dashboard/courses",
      ),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/dashboard/courses",
    );
    expect(mocks.exchangeCodeForSession).toHaveBeenCalledWith("abc123");
    expect(mocks.syncUserWithDatabase).toHaveBeenCalledTimes(1);
  });

  test("uses oauth_next cookie when next query is absent", async () => {
    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(
      new Request("http://localhost:3000/auth/callback?code=abc123", {
        headers: {
          cookie: "oauth_lang=pt; oauth_next=%2Fdashboard%2Fcourses",
        },
      }),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/dashboard/courses",
    );
  });
});

describe("GET /api/auth/google/callback", () => {
  test("re-exports auth callback behavior", async () => {
    const { GET } = await import("@/app/api/auth/google/callback/route");
    const response = await GET(
      new Request("http://localhost:3000/api/auth/google/callback?lang=pt"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain(
      "/auth?flow=login&lang=pt&oauth_error=",
    );
  });
});
