import { afterEach, describe, expect, test, vi } from "vitest";

function makeJwt(payload: Record<string, unknown>) {
  const header = Buffer.from(
    JSON.stringify({ alg: "none", typ: "JWT" }),
  ).toString("base64url");
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    "base64url",
  );
  return `${header}.${encodedPayload}.signature`;
}

describe("GET /api/mux/promo-playback route", () => {
  const originalEnv = {
    keyId: process.env.MUX_SIGNING_KEY_ID,
    privateKey: process.env.MUX_SIGNING_PRIVATE_KEY,
  };

  afterEach(() => {
    process.env.MUX_SIGNING_KEY_ID = originalEnv.keyId;
    process.env.MUX_SIGNING_PRIVATE_KEY = originalEnv.privateKey;
    vi.resetModules();
    vi.clearAllMocks();
    vi.unmock("@/lib/mux");
  });

  test("returns unsigned fallback payload when mux env is missing", async () => {
    process.env.MUX_SIGNING_KEY_ID = "";
    process.env.MUX_SIGNING_PRIVATE_KEY = "";

    const { GET } = await import("@/app/api/mux/promo-playback/route");
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.tokenMode).toBe("none");
    expect(data.playbackToken).toBe("");
  });

  test("returns tokens when mux config exists", async () => {
    process.env.MUX_SIGNING_KEY_ID = "key";
    process.env.MUX_SIGNING_PRIVATE_KEY = "private";

    const playbackId = "promo1234567890abcdef";
    const exp = Math.floor(Date.now() / 1000) + 300;

    vi.doMock("@/lib/mux", () => ({
      PROMO_MUX_PLAYBACK_ID: playbackId,
      hasMuxSigningConfig: vi.fn(() => true),
      createMuxPlaybackTokens: vi.fn(() => ({
        playbackToken: makeJwt({ aud: "v", sub: playbackId, exp }),
        thumbnailToken: makeJwt({ aud: "t", sub: playbackId, exp }),
        storyboardToken: makeJwt({ aud: "s", sub: playbackId, exp }),
      })),
    }));

    const { GET } = await import("@/app/api/mux/promo-playback/route");
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.playbackId).toBe(playbackId);
    expect(data.tokenMode).toBe("signed");
    expect(data.playbackToken).toContain(".");
    expect(response.headers.get("cache-control")).toContain("no-store");
  });

  test("returns unsigned fallback payload when token payload has no JWT segments", async () => {
    process.env.MUX_SIGNING_KEY_ID = "key";
    process.env.MUX_SIGNING_PRIVATE_KEY = "private";

    vi.doMock("@/lib/mux", () => ({
      PROMO_MUX_PLAYBACK_ID: "promo1234567890abcdef",
      hasMuxSigningConfig: vi.fn(() => true),
      createMuxPlaybackTokens: vi.fn(() => ({
        playbackToken: "invalid-token-without-segments",
        thumbnailToken: makeJwt({
          aud: "t",
          sub: "promo1234567890abcdef",
          exp: 123456,
        }),
        storyboardToken: makeJwt({
          aud: "s",
          sub: "promo1234567890abcdef",
          exp: 123456,
        }),
      })),
    }));

    const { GET } = await import("@/app/api/mux/promo-playback/route");
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.tokenMode).toBe("none");
    expect(data.playbackToken).toBe("");
  });

  test("returns unsigned fallback payload when token payload cannot be parsed as JSON", async () => {
    process.env.MUX_SIGNING_KEY_ID = "key";
    process.env.MUX_SIGNING_PRIVATE_KEY = "private";

    vi.doMock("@/lib/mux", () => ({
      PROMO_MUX_PLAYBACK_ID: "promo1234567890abcdef",
      hasMuxSigningConfig: vi.fn(() => true),
      createMuxPlaybackTokens: vi.fn(() => ({
        playbackToken: "YOUR_HEADER.YOUR_PAYLOAD.YOUR_SIGNATURE",
        thumbnailToken: makeJwt({
          aud: "t",
          sub: "promo1234567890abcdef",
          exp: 123456,
        }),
        storyboardToken: makeJwt({
          aud: "s",
          sub: "promo1234567890abcdef",
          exp: 123456,
        }),
      })),
    }));

    const { GET } = await import("@/app/api/mux/promo-playback/route");
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.tokenMode).toBe("none");
    expect(data.playbackToken).toBe("");
  });

  test("returns unsigned fallback payload when token generation throws", async () => {
    process.env.MUX_SIGNING_KEY_ID = "key";
    process.env.MUX_SIGNING_PRIVATE_KEY = "private";

    vi.doMock("@/lib/mux", () => ({
      PROMO_MUX_PLAYBACK_ID: "promo1234567890abcdef",
      hasMuxSigningConfig: vi.fn(() => true),
      createMuxPlaybackTokens: vi.fn(() => {
        throw new Error("boom");
      }),
    }));

    const { GET } = await import("@/app/api/mux/promo-playback/route");
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.tokenMode).toBe("none");
    expect(data.playbackToken).toBe("");
  });
});
