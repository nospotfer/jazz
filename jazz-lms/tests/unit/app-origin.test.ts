import { afterAll, describe, expect, test, vi } from "vitest";

const originalEnv = {
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  APP_URL: process.env.APP_URL,
};

describe("app-origin helpers", () => {
  test("normalizeBaseOrigin handles plain domain and malformed slashes", async () => {
    const { normalizeBaseOrigin } = await import("@/lib/app-origin");

    expect(normalizeBaseOrigin("culturadeljazz.com")).toBe(
      "https://culturadeljazz.com",
    );
    expect(normalizeBaseOrigin("https:\\\\culturadeljazz.com")).toBe(
      "https://culturadeljazz.com",
    );
    expect(normalizeBaseOrigin("http://localhost:3000/path?a=1")).toBe(
      "http://localhost:3000",
    );
    expect(normalizeBaseOrigin("   ")).toBeNull();
    expect(normalizeBaseOrigin(undefined)).toBeNull();
  });

  test("isLocalOrigin recognizes localhost origins", async () => {
    const { isLocalOrigin } = await import("@/lib/app-origin");

    expect(isLocalOrigin("http://localhost:3000")).toBe(true);
    expect(isLocalOrigin("http://127.0.0.1:3000")).toBe(true);
    expect(isLocalOrigin("https://culturadeljazz.com")).toBe(false);
    expect(isLocalOrigin("invalid")).toBe(false);
  });

  test("resolveClientAppOrigin prefers local runtime in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://culturadeljazz.com");

    const { resolveClientAppOrigin } = await import("@/lib/app-origin");

    expect(resolveClientAppOrigin("http://localhost:3000")).toBe(
      "http://localhost:3000",
    );
    expect(resolveClientAppOrigin("https://preview.vercel.app")).toBe(
      "http://localhost:3000",
    );

    vi.unstubAllEnvs();
  });

  test("resolveClientAppOrigin uses configured origin in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://culturadeljazz.com");

    const { resolveClientAppOrigin } = await import("@/lib/app-origin");

    expect(resolveClientAppOrigin("https://preview.vercel.app")).toBe(
      "https://culturadeljazz.com",
    );

    vi.unstubAllEnvs();
  });

  test("resolveServerAppOrigin follows APP_URL and dev fallback rules", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("APP_URL", "https://culturadeljazz.com");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");

    const { resolveServerAppOrigin } = await import("@/lib/app-origin");

    expect(resolveServerAppOrigin("http://localhost:3000")).toBe(
      "http://localhost:3000",
    );
    expect(resolveServerAppOrigin("https://preview.vercel.app")).toBe(
      "http://localhost:3000",
    );

    vi.stubEnv("NODE_ENV", "production");
    expect(resolveServerAppOrigin("https://preview.vercel.app")).toBe(
      "https://culturadeljazz.com",
    );

    vi.unstubAllEnvs();
  });
});

afterAll(() => {
  const mutableEnv = process.env as Record<string, string | undefined>;
  mutableEnv.NODE_ENV = originalEnv.NODE_ENV;
  mutableEnv.NEXT_PUBLIC_APP_URL = originalEnv.NEXT_PUBLIC_APP_URL;
  mutableEnv.APP_URL = originalEnv.APP_URL;
});
