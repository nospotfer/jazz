import type { CookieOptions } from "@supabase/ssr";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const state = vi.hoisted(() => ({
  jar: new Map<string, string>(),
  writes: [] as Array<{ name: string; value: string } & CookieOptions>,
}));
vi.mock("next/headers", () => ({ cookies: async () => ({
  getAll: () => [...state.jar].map(([name, value]) => ({ name, value })),
  set: (cookie: { name: string; value: string } & CookieOptions) => {
    state.writes.push(cookie);
    if (cookie.maxAge === 0) state.jar.delete(cookie.name);
    else state.jar.set(cookie.name, cookie.value);
  },
}) }));
vi.mock("@supabase/ssr", async importOriginal => {
  const actual = await importOriginal<typeof import("@supabase/ssr")>();
  return {
    ...actual,
    // Each browser case represents a fresh page/runtime. Avoid the SDK's
    // module-level singleton retaining another case's cookie configuration;
    // authentication, chunking and document.cookie serialization stay real.
    createBrowserClient: (...args: Parameters<typeof actual.createBrowserClient>) =>
      actual.createBrowserClient(args[0], args[1], { ...args[2], isSingleton: false }),
  };
});

const userId = "1fc08401-ef64-47af-9518-77baf7186eca";
const accessToken = `${Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")}.${
  Buffer.from(JSON.stringify({ sub: userId, role: "authenticated", exp: 4_102_444_800 })).toString("base64url")
}.isolated-signature`;
const refreshToken = "isolated-refresh-token";
const user = (padding = 12_000) => ({
  id: userId, aud: "authenticated", role: "authenticated", email: "cookie-fixture@example.invalid",
  app_metadata: { provider: "email", providers: ["email"] }, user_metadata: { padding: "x".repeat(padding) },
  created_at: "2026-01-01T00:00:00Z",
});
const session = (expired = false, padding = 12_000) => ({
  access_token: accessToken, refresh_token: refreshToken, token_type: "bearer",
  expires_in: expired ? -60 : 3600,
  expires_at: Math.floor(Date.now() / 1000) + (expired ? -60 : 3600), user: user(padding),
});
const clients: Array<{ auth: { stopAutoRefresh: () => Promise<void> } }> = [];
let expiredLogin = false;
let refreshCalls = 0;
let fixtureRun = 0;
let fixtureOrigin: string;

beforeEach(() => {
  vi.resetModules();
  state.jar.clear();
  state.writes.length = 0;
  expiredLogin = false;
  refreshCalls = 0;
  fixtureOrigin = `https://cookie-fixture-${++fixtureRun}.supabase.co`;
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", fixtureOrigin);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "isolated-cookie-fixture-anon-key");
  vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (url.origin !== fixtureOrigin) throw new Error("Unexpected isolated SDK origin");
    if (url.pathname === "/auth/v1/logout") return new Response(null, { status: 204 });
    if (url.pathname === "/auth/v1/user") return Response.json(user());
    if (url.pathname === "/auth/v1/token") {
      if (url.searchParams.get("grant_type") === "refresh_token") {
        refreshCalls += 1;
        return Response.json(session(false, 100));
      }
      return Response.json(session(expiredLogin));
    }
    throw new Error("Unexpected isolated SDK operation");
  }));
});

afterEach(async () => {
  for (const client of clients.splice(0)) await client.auth.stopAutoRefresh();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Supabase auth cookie transport through the real SDK", () => {
  test.each(["production", "development"])("server session chunks and logout preserve policy in %s", async environment => {
    vi.stubEnv("NODE_ENV", environment);
    const client = (await import("@/utils/supabase/server")).createClient();
    clients.push(client);
    expect((await client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })).error).toBeNull();
    expect(state.writes.filter(cookie => cookie.value).length).toBeGreaterThan(1);
    expect(state.writes.every(cookie => cookie.secure === (environment === "production") &&
      cookie.httpOnly === false && cookie.sameSite === "lax" && cookie.path === "/")).toBe(true);
    const names = [...state.jar.keys()];
    state.writes.length = 0;
    expect((await client.auth.signOut({ scope: "local" })).error).toBeNull();
    expect(state.writes.some(cookie => names.includes(cookie.name) && cookie.maxAge === 0)).toBe(true);
    expect(state.writes.every(cookie => cookie.secure === (environment === "production"))).toBe(true);
    expect((await client.auth.getSession()).data.session).toBeNull();
  });

  test("session synchronization route uses secure SDK cookie writes in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_URL", "https://app.example.invalid");
    const { POST } = await import("@/app/api/auth/session/route");
    const response = await POST(new Request("https://app.example.invalid/api/auth/session", {
      method: "POST", headers: { "Content-Type": "application/json", Origin: "https://app.example.invalid" },
      body: JSON.stringify({ accessToken, refreshToken }),
    }));
    expect(response.status).toBe(200);
    expect(state.writes.filter(cookie => cookie.value).length).toBeGreaterThan(1);
    expect(state.writes.every(cookie => cookie.secure === true && cookie.httpOnly === false)).toBe(true);
  });

  test("foreign text/plain session form cannot reach the SDK or write cookies", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_URL", "https://app.example.invalid");
    const { POST } = await import("@/app/api/auth/session/route");
    // A browser form's name=value encoding can still be valid JSON. No victim
    // session is needed to inject an attacker-owned session into an empty jar.
    const name = `{"accessToken":"${accessToken}","refreshToken":"${refreshToken}","padding":"`;
    const body = `${name}="}\r\n`;
    expect(JSON.parse(body).accessToken).toBe(accessToken);
    const request = new Request("https://app.example.invalid/api/auth/session", {
      method: "POST", headers: { Origin: "https://attacker.example.invalid", "Content-Type": "text/plain" }, body,
    });
    vi.spyOn(request, "json");
    expect((await POST(request)).status).toBe(403);
    expect(request.json).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
    expect(state.jar.size).toBe(0);
    expect(state.writes).toEqual([]);
  });

  test.each([
    ["production", "http://localhost:3000", true],
    ["development", "https://app.example.invalid", true],
    ["development", "http://localhost:3000", false],
  ] as const)("middleware refresh writes/deletes chunks for %s at %s", async (environment, origin, secure) => {
    vi.stubEnv("NODE_ENV", environment);
    expiredLogin = true;
    const client = (await import("@/utils/supabase/server")).createClient();
    clients.push(client);
    expect((await client.auth.signInWithPassword({ email: "cookie-fixture@example.invalid", password: "isolated-password" })).error).toBeNull();
    const request = new NextRequest(`${origin}/dashboard`, {
      headers: { cookie: [...state.jar].map(([name, value]) => `${name}=${value}`).join("; ") },
    });
    const result = await (await import("@/utils/supabase/middleware")).updateSession(request);
    expect(result.user?.id).toBe(userId);
    expect(refreshCalls).toBeGreaterThan(0);
    const written = result.response.cookies.getAll();
    expect(written.length).toBeGreaterThan(1);
    expect(written.some(cookie => cookie.maxAge === 0)).toBe(true);
    expect(written.every(cookie => cookie.secure === secure && cookie.httpOnly === false && cookie.sameSite === "lax")).toBe(true);
  });

  test.each([
    ["production", "http://localhost:3000", true],
    ["development", "https://app.example.invalid", true],
    ["development", "http://localhost:3000", false],
  ] as const)("browser SDK serializes protected session and logout cookies for %s at %s", async (environment, origin, secure) => {
    vi.stubEnv("NODE_ENV", environment);
    const serialized: string[] = [];
    const browserJar = new Map<string, string>();
    const browserDocument = {
      visibilityState: "hidden", addEventListener() {}, removeEventListener() {},
      get cookie() { return [...browserJar].map(([name, value]) => `${name}=${value}`).join("; "); },
      set cookie(value: string) {
        serialized.push(value);
        const pair = value.split(";")[0];
        const position = pair.indexOf("=");
        const name = pair.slice(0, position);
        if (/;\s*Max-Age=0(?:;|$)/i.test(value)) browserJar.delete(name);
        else browserJar.set(name, pair.slice(position + 1));
      },
    };
    vi.stubGlobal("document", browserDocument);
    vi.stubGlobal("window", {
      document: browserDocument, location: new URL(`${origin}/auth`), addEventListener() {}, removeEventListener() {},
    });
    // Prevent cross-test process channels; no real browser/provider is involved.
    vi.stubGlobal("BroadcastChannel", class { postMessage() {} close() {} addEventListener() {} });
    const client = (await import("@/utils/supabase/client")).createClient();
    clients.push(client);
    expect((await client.auth.signInWithPassword({ email: "cookie-fixture@example.invalid", password: "isolated-password" })).error).toBeNull();
    expect(browserJar.size).toBeGreaterThan(1);
    expect(serialized.every(cookie => /;\s*Secure(?:;|$)/i.test(cookie) === secure &&
      !/;\s*HttpOnly(?:;|$)/i.test(cookie) && /;\s*SameSite=Lax(?:;|$)/i.test(cookie))).toBe(true);
    serialized.length = 0;
    expect((await client.auth.signOut({ scope: "local" })).error).toBeNull();
    expect(serialized.some(cookie => /;\s*Max-Age=0(?:;|$)/i.test(cookie))).toBe(true);
    expect(serialized.every(cookie => /;\s*Secure(?:;|$)/i.test(cookie) === secure)).toBe(true);
    expect(browserJar.size).toBe(0);
    expect((await client.auth.getSession()).data.session).toBeNull();
  });
});
