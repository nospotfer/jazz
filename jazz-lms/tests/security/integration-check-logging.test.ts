import { generateKeyPairSync } from "node:crypto";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  construct: vi.fn(), findMany: vi.fn(), disconnect: vi.fn(), signedUrl: vi.fn(),
}));
vi.mock("@prisma/client", () => ({ PrismaClient: class {
  constructor() { mocks.construct(); }
  lesson = { findMany: mocks.findMany };
  $disconnect = mocks.disconnect;
} }));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({
  storage: { from: () => ({ createSignedUrl: mocks.signedUrl }) },
}) }));

const privateKey = generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey
  .export({ format: "pem", type: "pkcs8" }).toString();
const privateMarker = "isolated-private-diagnostic-marker";
const signedUrl = `https://storage.example.invalid/private.pdf?token=${privateMarker}`;
const databaseUrl = `postgresql://fixture:${privateMarker}@db.example.invalid:5432/jazz`;
const lesson = {
  title: `Private lesson ${privateMarker}`, isPublished: true, videoUrl: "A".repeat(32),
  attachments: [{ url: `private-${privateMarker}.pdf` }],
};
const manifest = '#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=100000,RESOLUTION=1280x720,CODECS="avc1.42e01e"\nvideo.m3u8';
const initialExitCode = process.exitCode;
let stderr: ReturnType<typeof vi.spyOn>;
let stdout: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
  stderr = vi.spyOn(console, "error").mockImplementation(() => {});
  stdout = vi.spyOn(console, "log").mockImplementation(() => {});
  const config = {
    DATABASE_URL: databaseUrl,
    NEXT_PUBLIC_SUPABASE_URL: "https://storage.example.invalid",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: `anon-${privateMarker}`,
    SUPABASE_SERVICE_ROLE_KEY: `service-${privateMarker}`,
    SUPABASE_STORAGE_BUCKET: "isolated-bucket",
    DODO_PAYMENTS_API_KEY: `dodo-${privateMarker}`,
    DODO_PRODUCT_ID: "isolated-product", DODO_BUSINESS_ID: "isolated-business",
    MUX_SIGNING_KEY_ID: "isolated-key", MUX_SIGNING_PRIVATE_KEY: privateKey,
  };
  for (const [name, value] of Object.entries(config)) vi.stubEnv(name, value);
  mocks.findMany.mockResolvedValue([lesson]);
  mocks.disconnect.mockResolvedValue(undefined);
  mocks.signedUrl.mockResolvedValue({ data: { signedUrl }, error: null });
  vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (url.origin === "https://stream.mux.com") return new Response(manifest);
    if (url.origin === "https://storage.example.invalid" && init?.method === "HEAD") return new Response(null);
    throw new Error("Unexpected isolated check request");
  }));
});

afterEach(() => {
  process.exitCode = initialExitCode;
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

async function runCheck() {
  await (await import("../../scripts/check-integrations")).integrationCheck;
}

function expectPrivateDetailsOmitted() {
  const output = JSON.stringify([...stderr.mock.calls, ...stdout.mock.calls]);
  expect(output.includes(privateMarker)).toBe(false);
  expect(output.includes(databaseUrl)).toBe(false);
  expect(output.includes(signedUrl)).toBe(false);
  expect(output.includes(privateKey)).toBe(false);
}

describe("integration check diagnostic confidentiality", () => {
  test.each([
    new Error(`Provider failed: ${databaseUrl} ${signedUrl}`),
    { authorization: `Bearer ${privateMarker}`, privateKey },
  ])("omits database exception messages and arbitrary payloads", async failure => {
    mocks.findMany.mockRejectedValue(failure);
    await runCheck();
    expect(stderr).toHaveBeenCalledWith("CHECKUP_FAILED");
    expect(stderr).toHaveBeenCalledWith("Unexpected integration error; private provider details omitted.");
    expect(process.exitCode).toBe(1);
    expect(mocks.disconnect).toHaveBeenCalledOnce();
    expectPrivateDetailsOmitted();
  });

  test("catches constructor failures before any database query or credential output", async () => {
    mocks.construct.mockImplementation(() => { throw new Error(`Invalid datasource ${databaseUrl}`); });
    await runCheck();
    expect(process.exitCode).toBe(1);
    expect(mocks.findMany).not.toHaveBeenCalled();
    expect(mocks.disconnect).not.toHaveBeenCalled();
    expectPrivateDetailsOmitted();
  });

  test("omits a Mux fetch exception carrying its signed bearer URL", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error(`Fetch failed: https://stream.mux.com/video.m3u8?token=${privateMarker}`));
    await runCheck();
    expect(process.exitCode).toBe(1);
    expectPrivateDetailsOmitted();
  });

  test("omits provider storage errors and private object paths", async () => {
    mocks.signedUrl.mockResolvedValue({ data: null, error: { message: `Cannot sign ${signedUrl} ${databaseUrl}` } });
    await runCheck();
    expect(stderr).toHaveBeenCalledWith("Supabase signed URL could not be created");
    expectPrivateDetailsOmitted();
  });

  test("omits a file HEAD exception carrying a signed URL", async () => {
    vi.mocked(fetch).mockImplementation(async (_input, init) => {
      if (init?.method === "HEAD") throw new Error(`File unavailable at ${signedUrl}`);
      return new Response(manifest);
    });
    await runCheck();
    expect(process.exitCode).toBe(1);
    expectPrivateDetailsOmitted();
  });

  test("keeps controlled Mux HTTP status without lesson or URL details", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 403 }));
    await runCheck();
    expect(stderr).toHaveBeenCalledWith("Mux manifest request failed: HTTP 403");
    expectPrivateDetailsOmitted();
  });

  test("keeps controlled storage HTTP status without object or URL details", async () => {
    vi.mocked(fetch).mockImplementation(async (_input, init) => init?.method === "HEAD"
      ? new Response(null, { status: 404 }) : new Response(manifest));
    await runCheck();
    expect(stderr).toHaveBeenCalledWith("Supabase file HEAD request failed: HTTP 404");
    expectPrivateDetailsOmitted();
  });

  test("reports missing variable names without constructing clients or showing values", async () => {
    vi.stubEnv("DODO_PAYMENTS_API_KEY", undefined);
    await runCheck();
    expect(stderr).toHaveBeenCalledWith("Missing env vars: DODO_PAYMENTS_API_KEY");
    expect(mocks.construct).not.toHaveBeenCalled();
    expectPrivateDetailsOmitted();
  });

  test("cleanup failures cannot emit provider exceptions", async () => {
    mocks.disconnect.mockRejectedValue(new Error(`Cleanup failed: ${databaseUrl} ${privateKey}`));
    await runCheck();
    expect(stderr).toHaveBeenCalledWith("Database cleanup failed; private provider details omitted.");
    expect(process.exitCode).toBe(1);
    expectPrivateDetailsOmitted();
  });

  test("successful diagnostics report counts and distinguish Dodo environment presence from verification", async () => {
    await runCheck();
    expect(stderr).not.toHaveBeenCalled();
    expect(stdout).toHaveBeenCalledWith("CHECKUP_OK");
    expect(stdout).toHaveBeenCalledWith("Dodo checkout env vars: present (provider not verified)");
    expectPrivateDetailsOmitted();
  });
});
