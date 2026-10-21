import { generateKeyPairSync } from "node:crypto";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  NativeConfigurationError,
  PREVIEW_PROJECT_REF,
  PRODUCTION_PROJECT_REF,
  RECOVERY_PROJECT_REF,
  validateNativeConfig,
} from "../../scripts/native/config-policy.mjs";
import { nativeBuildEnvironment } from "../../scripts/native/prepare-release.mjs";
import { publicBuildFingerprint } from "../../scripts/native/release-inspect.mjs";

// Generated only in this test process. No stored key, provider or CA-file input
// participates in these pure policy tests; accepted routing is not authentication.
const rsa = generateKeyPairSync("rsa", { modulusLength: 2048 });
const privatePem = rsa.privateKey.export({ format: "pem", type: "pkcs8" }).toString();
const publicPem = rsa.publicKey.export({ format: "pem", type: "spki" }).toString();
const ec = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const caPath = "/private/synthetic-supabase-ca.crt";
const sourceCommit = "a".repeat(40);
const canonicalOrigin = "https://www.culturadeljazz.com";
const previewOrigin = "https://synthetic-jazz-preview.trycloudflare.com";
const fetchMock = vi.fn(() => { throw new Error("Network is forbidden in config policy tests"); });

type Config = {
  version: number;
  mode: "production" | "preview";
  sourceCommit: string;
  projectRef: string;
  origin: string;
  ca: { path: string; sha256: string };
  testPayments?: { provider: "dodo"; scopeId: string; expiresAt: string };
  recoveryAccess?: { purpose: string; scopeId: string; expiresAt: string };
  env: Record<string, string>;
};

function databaseUrl(ref: string, kind: "direct" | "session" = "direct") {
  const host = kind === "direct" ? `db.${ref}.supabase.co` : "aws-0-eu-west-1.pooler.supabase.com";
  const user = kind === "direct" ? "postgres" : `postgres.${ref}`;
  const url = new URL(`postgresql://${user}:synthetic-password@${host}:5432/postgres`);
  url.searchParams.set("sslmode", "require");
  url.searchParams.set("sslaccept", "strict");
  url.searchParams.set("sslcert", caPath);
  url.searchParams.set("pool_timeout", "10");
  url.searchParams.set("connect_timeout", "10");
  return url.toString();
}

function config(mode: Config["mode"] = "preview"): Config {
  const production = mode === "production";
  const ref = production ? PRODUCTION_PROJECT_REF : PREVIEW_PROJECT_REF;
  const origin = production ? canonicalOrigin : previewOrigin;
  return {
    version: 1, mode, sourceCommit, projectRef: ref, origin,
    ca: { path: caPath, sha256: "b".repeat(64) },
    env: {
      APP_URL: origin,
      NEXT_PUBLIC_APP_URL: origin,
      NEXT_PUBLIC_SUPABASE_URL: `https://${ref}.supabase.co`,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_publishable_synthetic_preview_public_key",
      SUPABASE_SERVICE_ROLE_KEY: "sb_secret_synthetic_preview_private_key",
      DATABASE_URL: databaseUrl(ref),
      SUPABASE_STORAGE_BUCKET: "synthetic-private-pdfs",
      MUX_SIGNING_KEY_ID: "synthetic-signing-key",
      MUX_SIGNING_PRIVATE_KEY: privatePem,
      ...(production ? {
        CRON_SECRET: "synthetic".repeat(6),
        DODO_ENVIRONMENT: "live_mode",
        DODO_PAYMENTS_API_KEY: "synthetic-live-api-key",
        DODO_PAYMENTS_WEBHOOK_SECRET: "synthetic-webhook-secret",
        DODO_BUSINESS_ID: "synthetic-business",
        DODO_PRODUCT_ID: "synthetic-product",
        PROFESSOR_EMAIL: "professor@example.invalid",
        ADMIN_OWNER_EMAIL: "owner@example.invalid",
      } : {}),
    },
  };
}

function expectDenied(value: unknown, code: string) {
  try {
    validateNativeConfig(value);
    throw new Error("Unsafe native configuration was accepted");
  } catch (error) {
    expect(error).toBeInstanceOf(NativeConfigurationError);
    expect((error as Error).message).toBe(code);
  }
}

function mutateDatabase(mutate: (url: URL) => void, mode: Config["mode"] = "preview") {
  const value = config(mode);
  const url = new URL(value.env.DATABASE_URL);
  mutate(url);
  value.env.DATABASE_URL = url.toString();
  return value;
}

function legacyKey(role: string, ref: string, extra: Record<string, unknown> = {}) {
  return [
    Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url"),
    Buffer.from(JSON.stringify({ role, ref, ...extra })).toString("base64url"),
    "unverifiedSyntheticSignature",
  ].join(".");
}

beforeEach(() => {
  fetchMock.mockClear();
  vi.stubGlobal("fetch", fetchMock);
});

function withTestPayments(input = config()): Config {
  input.testPayments = { provider: "dodo", scopeId: "jazz-dodo-synthetic-baseline",
    expiresAt: new Date(Date.now() + 600_000).toISOString() };
  Object.assign(input.env, {
    DODO_ENVIRONMENT: "test_mode", DODO_API_BASE_URL: "https://test.dodopayments.com",
    DODO_PAYMENTS_API_KEY: "synthetic-test-api-key", DODO_PAYMENTS_WEBHOOK_SECRET: "synthetic-test-signing-secret",
    DODO_BUSINESS_ID: "bus_synthetic", DODO_PRODUCT_ID: "pdt_synthetic",
  });
  return input;
}

describe("native explicit Dodo TEST payments configuration", () => {
  test("retains the explicit opt-in and credentials only in the server environment, with unchanged public build binding", () => {
    const base = config();
    const disabled = validateNativeConfig(base);
    const input = withTestPayments(base);
    const result = validateNativeConfig(input);
    expect(result.testPayments).toEqual(input.testPayments);
    expect(result.testPayments).not.toBe(input.testPayments);
    expect(result.env).toMatchObject({ DODO_ENVIRONMENT: "test_mode", DODO_API_BASE_URL: "https://test.dodopayments.com",
      NATIVE_PREVIEW_PROFILE: "test-payments", NATIVE_TEST_PAYMENTS_EXPIRES_AT: input.testPayments!.expiresAt,
      DODO_PAYMENTS_API_KEY: "synthetic-test-api-key", DODO_PAYMENTS_WEBHOOK_SECRET: "synthetic-test-signing-secret",
      DODO_BUSINESS_ID: "bus_synthetic", DODO_PRODUCT_ID: "pdt_synthetic", ENABLE_LOCAL_TEST_CHECKOUT: "0",
      ENABLE_LOCAL_TEST_RESETS: "0", ENABLE_LOCAL_LEGACY_MUTATIONS: "0", NEXT_PUBLIC_OPENREPLAY_ENABLED: "false" });
    expect(publicBuildFingerprint(result.env)).toBe(publicBuildFingerprint(disabled.env));
    const build = nativeBuildEnvironment(result, "/synthetic/tmp", "/synthetic/cache");
    for (const name of Object.keys(input.env).filter(name => name.startsWith("DODO_"))) expect(build).not.toHaveProperty(name);
    expect(JSON.stringify(build)).not.toContain("synthetic-test-api-key");
    expect(JSON.stringify(build)).not.toContain("synthetic-test-signing-secret");
  });

  test("the same explicit TEST fields remain denied when the opt-in is missing", () => {
    const input = withTestPayments();
    delete input.testPayments;
    expectDenied(input, "NATIVE_CONFIG_PREVIEW_SIDE_EFFECTS");
  });

  test.each([null, undefined, [], false, {},
    { provider: "stripe", scopeId: "jazz-dodo-test", expiresAt: new Date(Date.now() + 60_000).toISOString() },
    { provider: "dodo", scopeId: "", expiresAt: new Date(Date.now() + 60_000).toISOString() },
    { provider: "dodo", scopeId: "jazz-dodo-test", expiresAt: new Date(Date.now() + 60_000).toISOString(), unreviewed: true },
  ])("rejects a missing, malformed or unknown TEST opt-in field", testPayments => {
    expectDenied({ ...withTestPayments(), testPayments }, "NATIVE_CONFIG_TEST_PAYMENTS");
  });

  test.each(["scope with whitespace", "scope/with/path", "a".repeat(81), "UPPERCASE", ""])("rejects unsafe run scope %j", scopeId => {
    const input = withTestPayments();
    input.testPayments!.scopeId = scopeId;
    expectDenied(input, "NATIVE_CONFIG_TEST_PAYMENTS");
  });

  test.each(["DODO_PAYMENTS_API_KEY", "DODO_PAYMENTS_WEBHOOK_SECRET", "DODO_BUSINESS_ID", "DODO_PRODUCT_ID"])(
    "requires explicit nonempty %s under TEST opt-in", name => {
      const input = withTestPayments();
      delete input.env[name];
      expectDenied(input, "NATIVE_CONFIG_TEST_PAYMENTS");
      input.env[name] = "   ";
      expectDenied(input, "NATIVE_CONFIG_TEST_PAYMENTS");
    });

  test.each([
    ["DODO_ENVIRONMENT", undefined], ["DODO_ENVIRONMENT", "live_mode"],
    ["DODO_API_BASE_URL", undefined], ["DODO_API_BASE_URL", "https://live.dodopayments.com"],
    ["DODO_API_BASE_URL", "https://test.dodopayments.com/"],
    ["DODO_API_BASE_URL", "https://test.dodopayments.com.evil.example.invalid"],
  ])("requires explicit TEST routing for %s", (name, value) => {
    const input = withTestPayments();
    if (value === undefined) delete input.env[name]; else input.env[name] = value;
    expectDenied(input, "NATIVE_CONFIG_TEST_PAYMENTS");
  });

  test.each(["expired", "over30minutes", "noncanonical", "invalid"])("rejects %s TEST lease", kind => {
    const input = withTestPayments();
    input.testPayments!.expiresAt = kind === "expired" ? new Date(Date.now() - 1).toISOString() :
      kind === "over30minutes" ? new Date(Date.now() + 1_900_000).toISOString() :
        kind === "noncanonical" ? new Date(Date.now() + 60_000).toUTCString() : "not-a-date";
    expectDenied(input, "NATIVE_CONFIG_TEST_PAYMENTS");
  });

  test("production rejects the TEST opt-in even with otherwise valid live settings", () => {
    const input = config("production");
    input.testPayments = withTestPayments().testPayments;
    expectDenied(input, "NATIVE_CONFIG_TEST_PAYMENTS");
  });

  test("the opt-in never permits another project", () => {
    const input = withTestPayments();
    input.projectRef = PRODUCTION_PROJECT_REF;
    expectDenied(input, "NATIVE_CONFIG_PROJECT");
  });

  test.each(["CRON_SECRET", "RESEND_API_KEY", "RESEND_FROM_EMAIL", "RESEND_WEBHOOK_SECRET",
    "MESSAGES_REPLY_TO_EMAIL", "INBOUND_EMAIL_WEBHOOK_SECRET"])("TEST payments leave %s disabled", name => {
    const input = withTestPayments();
    input.env[name] = "synthetic-unrelated-side-effect";
    expectDenied(input, "NATIVE_CONFIG_PREVIEW_SIDE_EFFECTS");
  });
});
afterEach(() => {
  expect(fetchMock).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("native restored customer recovery profile", () => {
  function recovery(): Config {
    const input = config();
    input.projectRef = RECOVERY_PROJECT_REF;
    input.env.NEXT_PUBLIC_SUPABASE_URL = `https://${RECOVERY_PROJECT_REF}.supabase.co`;
    input.env.DATABASE_URL = databaseUrl(RECOVERY_PROJECT_REF);
    input.recoveryAccess = { purpose: "restored-customer-access", scopeId: "jazz-recovery-source-control",
      expiresAt: new Date(Date.now() + 60_000).toISOString() };
    return input;
  }

  test("requires the explicit profile and preserves its fixed replacement routing", () => {
    const input = recovery();
    const output = validateNativeConfig(input);
    expect(output.recoveryAccess).toEqual(input.recoveryAccess);
    expect(output.projectRef).toBe(RECOVERY_PROJECT_REF);
    expect(output.env).toMatchObject({ NATIVE_PREVIEW_PROFILE: "recovery-access", NATIVE_TEST_PAYMENTS_EXPIRES_AT: "",
      NEXT_PUBLIC_RECOVERY_ACCESS: "true", NATIVE_RECOVERY_ACCESS: "true",
      NATIVE_RECOVERY_EXPIRES_AT: input.recoveryAccess!.expiresAt, APP_DEPLOYMENT_ENVIRONMENT: "preview" });
    delete input.recoveryAccess;
    expectDenied(input, "NATIVE_CONFIG_PROJECT");
  });

  test.each([null, {}, { purpose: "other" }, { purpose: "restored-customer-access", scopeId: "bad scope", expiresAt: "bad" }])(
    "rejects malformed profile %j", recoveryAccess => {
      expectDenied({ ...recovery(), recoveryAccess }, "NATIVE_CONFIG_RECOVERY_ACCESS");
    });
  test.each(["purpose", "scopeId", "expiresAt"])("rejects missing %s and unknown profile fields", field => {
    const input = recovery();
    const profile: Record<string, unknown> = { ...input.recoveryAccess };
    delete profile[field];
    expectDenied({ ...input, recoveryAccess: profile }, "NATIVE_CONFIG_RECOVERY_ACCESS");
    expectDenied({ ...input, recoveryAccess: { ...input.recoveryAccess, projectRef: RECOVERY_PROJECT_REF } }, "NATIVE_CONFIG_RECOVERY_ACCESS");
  });
  test.each(["expired", "over30minutes", "noncanonical"])("rejects %s profile deadline", kind => {
    const input = recovery();
    input.recoveryAccess!.expiresAt = kind === "noncanonical" ? new Date(Date.now() + 60_000).toUTCString() :
      new Date(Date.now() + (kind === "expired" ? -1 : 1_900_000)).toISOString();
    expectDenied(input, "NATIVE_CONFIG_RECOVERY_ACCESS");
  });
  test("rejects production and payment profiles", () => {
    expectDenied({ ...config("production"), recoveryAccess: recovery().recoveryAccess }, "NATIVE_CONFIG_RECOVERY_ACCESS");
    expectDenied({ ...recovery(), testPayments: withTestPayments().testPayments }, "NATIVE_CONFIG_RECOVERY_ACCESS");
  });
  test.each([PREVIEW_PROJECT_REF, PRODUCTION_PROJECT_REF, "unknown-target"])("rejects backend %s", projectRef => {
    expectDenied({ ...recovery(), projectRef }, "NATIVE_CONFIG_PROJECT");
  });
  test.each(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL", "DATABASE_URL"])("rejects mixed-target %s", name => {
    const input = recovery();
    input.env[name] = name === "DATABASE_URL" ? databaseUrl(PREVIEW_PROJECT_REF) : `https://${PREVIEW_PROJECT_REF}.supabase.co`;
    expectDenied(input, name === "DATABASE_URL" ? "NATIVE_CONFIG_DATABASE" : "NATIVE_CONFIG_PROJECT");
  });
  test.each(["CRON_SECRET", "RESEND_API_KEY", "RESEND_FROM_EMAIL", "RESEND_WEBHOOK_SECRET", "MESSAGES_REPLY_TO_EMAIL",
    "INBOUND_EMAIL_WEBHOOK_SECRET", "DODO_PAYMENTS_API_KEY", "DODO_PAYMENTS_WEBHOOK_SECRET", "DODO_BUSINESS_ID", "DODO_PRODUCT_ID"])(
    "rejects side-effect credential %s", name => {
      const input = recovery(); input.env[name] = "synthetic-disabled-credential";
      expectDenied(input, "NATIVE_CONFIG_PREVIEW_SIDE_EFFECTS");
    });
  test.each(["NATIVE_PREVIEW_PROFILE", "NATIVE_TEST_PAYMENTS_EXPIRES_AT", "NEXT_PUBLIC_RECOVERY_ACCESS", "NATIVE_RECOVERY_ACCESS", "NATIVE_RECOVERY_EXPIRES_AT", "NEXT_PUBLIC_GA_MEASUREMENT_ID",
    "NEXT_PUBLIC_OPENREPLAY_ENABLED", "ENABLE_LOCAL_TEST_CHECKOUT", "ENABLE_LOCAL_LEGACY_MUTATIONS"])(
    "rejects explicit flag override %s", name => {
      const input = recovery(); input.env[name] = "true";
      expectDenied(input, "NATIVE_CONFIG_ENVIRONMENT");
    });
  test("derives flags without inheriting ambient values and binds the browser build", () => {
    vi.stubEnv("NEXT_PUBLIC_RECOVERY_ACCESS", "true"); vi.stubEnv("NATIVE_RECOVERY_ACCESS", "true");
    vi.stubEnv("NATIVE_PREVIEW_PROFILE", "isolated"); vi.stubEnv("NATIVE_TEST_PAYMENTS_EXPIRES_AT", "untrusted");
    const normal = validateNativeConfig(config());
    const recovered = validateNativeConfig(recovery());
    expect(normal.env.NEXT_PUBLIC_RECOVERY_ACCESS).toBe("false");
    expect(normal.env.NATIVE_RECOVERY_ACCESS).toBe("false");
    expect(normal.env.NATIVE_PREVIEW_PROFILE).toBe("isolated");
    expect(normal.env.NATIVE_TEST_PAYMENTS_EXPIRES_AT).toBe("");
    expect(recovered.env.NATIVE_PREVIEW_PROFILE).toBe("recovery-access");
    const build = nativeBuildEnvironment(recovered, "/synthetic/tmp", "/synthetic/cache");
    expect(build).toHaveProperty('NEXT_PUBLIC_RECOVERY_ACCESS', 'true');
    expect(build).not.toHaveProperty("NATIVE_RECOVERY_ACCESS");
    expect(build).not.toHaveProperty("NATIVE_RECOVERY_EXPIRES_AT");
    expect(build).not.toHaveProperty("NATIVE_PREVIEW_PROFILE");
    expect(build).not.toHaveProperty("NATIVE_TEST_PAYMENTS_EXPIRES_AT");
    expect(publicBuildFingerprint({ ...recovered.env, NEXT_PUBLIC_RECOVERY_ACCESS: "false" })).not.toBe(publicBuildFingerprint(recovered.env));
  });
});

describe("native configuration mode, source and origin routing", () => {
  test.each(["production", "preview"] as const)("accepts only the pinned %s target and returns its clean routing", (mode) => {
    const input = config(mode);
    const result = validateNativeConfig(input);
    expect(result).toMatchObject({ mode, sourceCommit, projectRef: input.projectRef, origin: input.origin, ca: input.ca });
    expect(result.env.APP_URL).toBe(input.origin);
    expect(result.env.NEXT_PUBLIC_APP_URL).toBe(input.origin);
    expect(result.env.DATABASE_URL).toBe(input.env.DATABASE_URL);
    expect(result.env).not.toBe(input.env);
    expect(result.ca).not.toBe(input.ca);
    const withExtraCaMetadata = validateNativeConfig({ ...input, ca: {
      ...input.ca, unreviewedPrivateMetadata: "synthetic-private-note",
    } });
    expect(withExtraCaMetadata.ca).toEqual(input.ca);
  });

  test.each([null, undefined, "config", [], 1, true])("rejects non-record input %j", (input) => {
    expectDenied(input, "NATIVE_CONFIG_SHAPE");
  });

  test.each(["development", "Production", "", " preview ", undefined])("rejects an unknown mode %j", (mode) => {
    expectDenied({ ...config(), mode }, "NATIVE_CONFIG_MODE");
  });

  test.each([0, 2, "1", undefined])("requires the supported numeric version rather than %j", (version) => {
    expectDenied({ ...config(), version }, "NATIVE_CONFIG_MODE");
  });

  test.each(["", "HEAD", "a".repeat(39), "a".repeat(41), "A".repeat(40), "g".repeat(40), undefined])(
    "rejects a non-pinned source commit %j", (commit) => {
      expectDenied({ ...config(), sourceCommit: commit }, "NATIVE_CONFIG_SOURCE");
    },
  );

  test("rejects an array that would otherwise coerce to a commit-shaped string", () => {
    expectDenied({ ...config(), sourceCommit: [sourceCommit] }, "NATIVE_CONFIG_SOURCE");
  });

  test.each([
    ["production", PREVIEW_PROJECT_REF], ["preview", PRODUCTION_PROJECT_REF],
    ["preview", "wmujuzheurvrfyebobcj"], ["production", "unknown-project-ref"],
  ] as const)("rejects cross-project routing in %s mode", (mode, projectRef) => {
    expectDenied({ ...config(mode), projectRef }, "NATIVE_CONFIG_PROJECT");
  });

  test.each([
    "http://www.culturadeljazz.com", "https://culturadeljazz.com",
    previewOrigin, "https://www.culturadeljazz.com.evil.example.invalid",
    "https://www.culturadeljazz.com:8443", "https://www.culturadeljazz.com:443",
    "https://user:password@www.culturadeljazz.com", "https://www.culturadeljazz.com/",
    "https://www.culturadeljazz.com/path", "https://www.culturadeljazz.com?preview=1",
    "https://www.culturadeljazz.com#fragment", "https://WWW.CULTURADELJAZZ.COM", "not-an-origin",
  ])("production denies a noncanonical literal origin %s", (origin) => {
    const input = config("production");
    input.origin = input.env.APP_URL = input.env.NEXT_PUBLIC_APP_URL = origin;
    expectDenied(input, "NATIVE_CONFIG_ORIGIN");
  });

  test.each([
    canonicalOrigin, "http://synthetic-jazz-preview.trycloudflare.com", "https://trycloudflare.com",
    "https://synthetic-jazz-preview.trycloudflare.com.evil.example.invalid",
    "https://nested.synthetic-jazz-preview.trycloudflare.com", "https://bad_name.trycloudflare.com",
    "https://-bad.trycloudflare.com", "https://bad-.trycloudflare.com", "https://preview.vercel.app",
    "https://127.0.0.1:3012", `${previewOrigin}/`, `${previewOrigin}/dashboard`,
    `${previewOrigin}?code=synthetic`, `${previewOrigin}#fragment`,
    "https://user:password@synthetic-jazz-preview.trycloudflare.com", `${previewOrigin}:8443`,
  ])("preview denies origins outside the exact HTTPS Quick Tunnel host shape: %s", (origin) => {
    const input = config();
    input.origin = input.env.APP_URL = input.env.NEXT_PUBLIC_APP_URL = origin;
    expectDenied(input, "NATIVE_CONFIG_ORIGIN");
  });

  test.each(["APP_URL", "NEXT_PUBLIC_APP_URL"])("requires %s to equal the separately pinned origin", (name) => {
    for (const other of [canonicalOrigin, `${previewOrigin}/`, "", "https://other-preview.trycloudflare.com"]) {
      const input = config();
      input.env[name] = other;
      expectDenied(input, "NATIVE_CONFIG_ORIGIN");
    }
  });

  test.each(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL"])("rejects a cross-project or non-exact %s", (name) => {
    for (const value of [`https://${PRODUCTION_PROJECT_REF}.supabase.co`, `https://${PREVIEW_PROJECT_REF}.supabase.co/`,
      `http://${PREVIEW_PROJECT_REF}.supabase.co`, `https://${PREVIEW_PROJECT_REF}.supabase.co.evil.example.invalid`]) {
      const input = config();
      input.env[name] = value;
      expectDenied(input, "NATIVE_CONFIG_PROJECT");
    }
  });

  test("accepts the optional server Supabase URL only when it points to the exact configured target", () => {
    const input = config();
    input.env.SUPABASE_URL = input.env.NEXT_PUBLIC_SUPABASE_URL;
    expect(validateNativeConfig(input).env.SUPABASE_URL).toBe(input.env.SUPABASE_URL);
  });
});

describe("native configuration key kinds are routing checks, not credential authentication", () => {
  test.each(["NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"])("rejects the wrong modern key kind for %s", (name) => {
    const input = config();
    input.env[name] = name === "NEXT_PUBLIC_SUPABASE_ANON_KEY" ? input.env.SUPABASE_SERVICE_ROLE_KEY : input.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    expectDenied(input, "NATIVE_CONFIG_KEY_KIND");
  });

  test.each(["", "sb_publishable_short", "not-a-key", "header.invalid-json.signature", "a.b", "a.b.c.d"])(
    "rejects malformed public key routing metadata %j", (key) => {
      const input = config();
      input.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = key;
      expectDenied(input, "NATIVE_CONFIG_KEY_KIND");
    },
  );

  test("accepts correctly typed opaque modern keys without claiming their project ownership or validity", () => {
    expect(validateNativeConfig(config()).projectRef).toBe(PREVIEW_PROJECT_REF);
    expect(validateNativeConfig(config("production")).projectRef).toBe(PRODUCTION_PROJECT_REF);
  });

  test("matches both legacy role and ref claims while deliberately not verifying a signature or expiration", () => {
    const input = config();
    input.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = legacyKey("anon", PREVIEW_PROJECT_REF, { exp: 1 });
    input.env.SUPABASE_SERVICE_ROLE_KEY = legacyKey("service_role", PREVIEW_PROJECT_REF, { exp: 1 });
    expect(validateNativeConfig(input).projectRef).toBe(PREVIEW_PROJECT_REF);
  });

  test.each([
    ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "service_role", PREVIEW_PROJECT_REF],
    ["SUPABASE_SERVICE_ROLE_KEY", "anon", PREVIEW_PROJECT_REF],
    ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon", PRODUCTION_PROJECT_REF],
    ["SUPABASE_SERVICE_ROLE_KEY", "service_role", PRODUCTION_PROJECT_REF],
  ])("rejects mismatched legacy claims for %s", (name, role, ref) => {
    const input = config();
    input.env[name] = legacyKey(role, ref);
    expectDenied(input, "NATIVE_CONFIG_KEY_KIND");
  });
});

describe("native configuration direct and session database boundary", () => {
  test.each(["production", "preview"] as const)("accepts exact target %s direct and session pooler routes with strict CA parameters", (mode) => {
    const input = config(mode);
    for (const kind of ["direct", "session"] as const) {
      input.env.DATABASE_URL = databaseUrl(input.projectRef, kind);
      expect(validateNativeConfig(input).env.DATABASE_URL).toBe(input.env.DATABASE_URL);
    }
  });

  test("accepts postgres scheme, encoded password and finite documented pool options", () => {
    const input = mutateDatabase((url) => {
      url.protocol = "postgres:";
      url.password = "synthetic @:/?# password";
      url.searchParams.set("schema", "public");
      url.searchParams.set("connection_limit", "1");
      url.searchParams.set("statement_cache_size", "0");
      url.searchParams.set("pool_timeout", "1");
      url.searchParams.set("connect_timeout", "15");
    });
    expect(validateNativeConfig(input).env.DATABASE_URL).toBe(input.env.DATABASE_URL);
  });

  test.each([
    ["transaction pooler", (url: URL) => { url.port = "6543"; }],
    ["implicit port", (url: URL) => { url.port = ""; }],
    ["foreign direct project", (url: URL) => { url.hostname = `db.${PRODUCTION_PROJECT_REF}.supabase.co`; }],
    ["direct hostname suffix", (url: URL) => { url.hostname += ".evil.example.invalid"; }],
    ["external database", (url: URL) => { url.hostname = "db.example.invalid"; }],
    ["loopback database", (url: URL) => { url.hostname = "127.0.0.1"; }],
    ["wrong direct role", (url: URL) => { url.username = "admin"; }],
    ["session role on direct host", (url: URL) => { url.username = `postgres.${PREVIEW_PROJECT_REF}`; }],
    ["wrong database", (url: URL) => { url.pathname = "/jazz_maintenance"; }],
    ["empty password", (url: URL) => { url.password = ""; }],
    ["non-PostgreSQL protocol", (url: URL) => { url.protocol = "mysql:"; }],
    ["fragment", (url: URL) => { url.hash = "route"; }],
    ["other schema", (url: URL) => { url.searchParams.set("schema", "auth"); }],
    ["weak TLS mode", (url: URL) => { url.searchParams.set("sslmode", "prefer"); }],
    ["insecure acceptance", (url: URL) => { url.searchParams.set("sslaccept", "accept_invalid_certs"); }],
    ["different CA", (url: URL) => { url.searchParams.set("sslcert", "/private/other-ca.crt"); }],
    ["missing CA", (url: URL) => { url.searchParams.delete("sslcert"); }],
    ["missing TLS mode", (url: URL) => { url.searchParams.delete("sslmode"); }],
    ["missing strict acceptance", (url: URL) => { url.searchParams.delete("sslaccept"); }],
    ["duplicate strict parameter", (url: URL) => { url.searchParams.append("sslaccept", "accept_invalid_certs"); }],
    ["duplicate timeout", (url: URL) => { url.searchParams.append("connect_timeout", "10"); }],
    ["unknown option", (url: URL) => { url.searchParams.set("options", "-c role=postgres"); }],
    ["channel binding override", (url: URL) => { url.searchParams.set("channel_binding", "require"); }],
    ["transaction mode hint", (url: URL) => { url.searchParams.set("pgbouncer", "true"); }],
    ["URL database alias", (url: URL) => { url.searchParams.set("database", "postgres"); }],
  ] as const)("rejects %s instead of silently repairing database routing", (_label, mutate) => {
    expectDenied(mutateDatabase(mutate), "NATIVE_CONFIG_DATABASE");
  });

  test.each(["postgres", `postgres.${PRODUCTION_PROJECT_REF}`, `postgres.${PREVIEW_PROJECT_REF}.extra`])(
    "rejects a session pooler user not bound to the configured ref: %s", (user) => {
      const input = config();
      const url = new URL(databaseUrl(PREVIEW_PROJECT_REF, "session"));
      url.username = user;
      input.env.DATABASE_URL = url.toString();
      expectDenied(input, "NATIVE_CONFIG_DATABASE");
    },
  );

  test.each(["pool_timeout", "connect_timeout"])("requires bounded positive %s rather than an infinite or malformed wait", (name) => {
    for (const value of [undefined, "", "0", "-1", "16", "1.5", "NaN", "Infinity", " 1", "1e1"]) {
      expectDenied(mutateDatabase((url) => {
        if (value === undefined) url.searchParams.delete(name);
        else url.searchParams.set(name, value);
      }), "NATIVE_CONFIG_DATABASE");
    }
  });

  test.each(["0", "100", "-1", "01", "1.5", "Infinity", ""])("rejects an invalid connection limit %j", (limit) => {
    expectDenied(mutateDatabase((url) => { url.searchParams.set("connection_limit", limit); }), "NATIVE_CONFIG_DATABASE");
  });
});

describe("native configuration CA and Mux signer structural prerequisites", () => {
  test.each([
    null, { path: "relative-ca.crt", sha256: "b".repeat(64) },
    { path: "/private/ca\nfile", sha256: "b".repeat(64) },
    { path: caPath, sha256: "b".repeat(63) }, { path: caPath, sha256: "B".repeat(64) },
  ])("rejects malformed CA attestations without checking a real file", (ca) => {
    expectDenied({ ...config(), ca }, "NATIVE_CONFIG_CA");
  });

  test("rejects an array that would otherwise coerce to a SHA-256-shaped string", () => {
    expectDenied({ ...config(), ca: { path: caPath, sha256: ["b".repeat(64)] } }, "NATIVE_CONFIG_CA");
  });

  test("accepts generated RSA private PEM and its base64 representation", () => {
    const input = config();
    for (const value of [privatePem, Buffer.from(privatePem).toString("base64"),
      rsa.privateKey.export({ format: "pem", type: "pkcs1" }).toString()]) {
      input.env.MUX_SIGNING_PRIVATE_KEY = value;
      expect(validateNativeConfig(input).env.MUX_SIGNING_KEY_ID).toBe("synthetic-signing-key");
    }
  });

  test.each(["public", "EC private", "literal backslash newlines", "malformed", "empty"])(
    "rejects a %s signer without exposing key material", (kind) => {
      const input = config();
      const candidates: Record<string, string> = {
        public: publicPem,
        "EC private": ec.privateKey.export({ format: "pem", type: "pkcs8" }).toString(),
        "literal backslash newlines": privatePem.replace(/\n/g, "\\n"),
        malformed: "-----BEGIN " + "PRIVATE KEY-----\nsynthetic-invalid-key\n-----END PRIVATE KEY-----",
        empty: "",
      };
      input.env.MUX_SIGNING_PRIVATE_KEY = candidates[kind];
      expectDenied(input, "NATIVE_CONFIG_MEDIA");
    },
  );

  test.each(["SUPABASE_STORAGE_BUCKET", "MUX_SIGNING_KEY_ID"])("requires nonempty %s", (name) => {
    const input = config();
    input.env[name] = " \t ";
    expectDenied(input, "NATIVE_CONFIG_MEDIA");
  });
});

describe("native configuration constructs a clean server environment", () => {
  test.each([
    "NODE_OPTIONS", "NODE_ENV", "PATH", "HOME", "VERCEL_ENV", "APP_DEPLOYMENT_ENVIRONMENT",
    "DIRECT_URL", "SUPABASE_DB_URL", "GOOGLE_APPLICATION_CREDENTIALS", "OPENREPLAY_API_KEY",
    "NEXT_PUBLIC_OPENREPLAY_ENABLED", "NEXT_PUBLIC_GA_MEASUREMENT_ID", "ENABLE_LOCAL_TEST_CHECKOUT",
    "ENABLE_LOCAL_TEST_RESETS", "ENABLE_LOCAL_LEGACY_MUTATIONS", "UNREVIEWED_PROVIDER_TOKEN",
  ])("rejects unreviewed environment override %s", (name) => {
    const input = config();
    input.env[name] = "synthetic-injected-value";
    expectDenied(input, "NATIVE_CONFIG_ENVIRONMENT");
  });

  test.each([null, [], "environment", { APP_URL: 1 }, { APP_URL: undefined }, { APP_URL: "x\0y" },
    { APP_URL: "x".repeat(32 * 1024 + 1) }])("rejects malformed environment values", (env) => {
    expectDenied({ ...config(), env }, "NATIVE_CONFIG_ENVIRONMENT");
  });

  test.each(["preview", "production"] as const)("derives safe %s flags and does not inherit ambient process options", (mode) => {
    vi.stubEnv("NODE_OPTIONS", "--require /synthetic-untrusted-loader.cjs");
    vi.stubEnv("RESEND_API_KEY", "synthetic-ambient-mail-key");
    vi.stubEnv("ENABLE_LOCAL_LEGACY_MUTATIONS", "1");
    const input = config(mode);
    const before = { ...input.env };
    const result = validateNativeConfig(input);
    expect(result.env).toMatchObject({
      NODE_ENV: "production", APP_DEPLOYMENT_ENVIRONMENT: mode, NEXT_TELEMETRY_DISABLED: "1",
      NEXT_PUBLIC_OPENREPLAY_ENABLED: "false", NEXT_PUBLIC_OPENREPLAY_PROJECT_KEY: "",
      NEXT_PUBLIC_GA_MEASUREMENT_ID: "", ENABLE_LOCAL_TEST_CHECKOUT: "0",
      ENABLE_LOCAL_TEST_RESETS: "0", ENABLE_LOCAL_LEGACY_MUTATIONS: "0",
    });
    expect(result.env).not.toHaveProperty("NODE_OPTIONS");
    expect(result.env).not.toHaveProperty("RESEND_API_KEY");
    expect(result.env).not.toHaveProperty("HOME");
    expect(result.env).not.toHaveProperty("VERCEL_ENV");
    expect(input.env).toEqual(before);
  });
});

describe("native preview disables side effects and production requires explicit live configuration", () => {
  test.each([
    "CRON_SECRET", "DODO_PAYMENTS_API_KEY", "DODO_PAYMENTS_WEBHOOK_SECRET", "DODO_BUSINESS_ID",
    "DODO_PRODUCT_ID", "RESEND_API_KEY", "RESEND_FROM_EMAIL", "RESEND_WEBHOOK_SECRET",
    "MESSAGES_REPLY_TO_EMAIL", "INBOUND_EMAIL_WEBHOOK_SECRET",
  ])("denies configured preview side-effect field %s", (name) => {
    const input = config();
    input.env[name] = "synthetic-side-effect-config";
    expectDenied(input, "NATIVE_CONFIG_PREVIEW_SIDE_EFFECTS");
  });

  test("allows explicit empty side-effect values and TEST routing without enabling payments", () => {
    const input = config();
    Object.assign(input.env, { CRON_SECRET: "", RESEND_API_KEY: "", DODO_PAYMENTS_API_KEY: "",
      DODO_ENVIRONMENT: "test_mode", DODO_API_BASE_URL: "https://test.dodopayments.com" });
    const result = validateNativeConfig(input);
    expect(result.env.DODO_PAYMENTS_API_KEY).toBe("");
    expect(result.env.ENABLE_LOCAL_TEST_CHECKOUT).toBe("0");
  });

  test.each([
    ["DODO_ENVIRONMENT", "live_mode"], ["DODO_ENVIRONMENT", "unknown_mode"],
    ["DODO_API_BASE_URL", "https://live.dodopayments.com"],
    ["DODO_API_BASE_URL", "https://test.dodopayments.com.evil.example.invalid"],
  ])("denies side-effect routing mismatch %s=%s in preview", (name, value) => {
    const input = config();
    input.env[name] = value;
    expectDenied(input, "NATIVE_CONFIG_PREVIEW_SIDE_EFFECTS");
  });

  test.each([
    "CRON_SECRET", "DODO_PAYMENTS_API_KEY", "DODO_PAYMENTS_WEBHOOK_SECRET", "DODO_BUSINESS_ID",
    "DODO_PRODUCT_ID", "PROFESSOR_EMAIL", "ADMIN_OWNER_EMAIL",
  ])("requires an explicitly populated production field %s", (name) => {
    const input = config("production");
    delete input.env[name];
    expectDenied(input, "NATIVE_CONFIG_PRODUCTION");
    input.env[name] = "   ";
    expectDenied(input, "NATIVE_CONFIG_PRODUCTION");
  });

  test.each([
    ["CRON_SECRET", "x".repeat(31)], ["DODO_ENVIRONMENT", "test_mode"],
    ["DODO_API_BASE_URL", "https://test.dodopayments.com"],
    ["DODO_API_BASE_URL", "https://live.dodopayments.com.evil.example.invalid"],
  ])("rejects a weakened production setting %s", (name, value) => {
    const input = config("production");
    input.env[name] = value;
    expectDenied(input, "NATIVE_CONFIG_PRODUCTION");
  });

  test.each([
    "RESEND_API_KEY", "RESEND_FROM_EMAIL", "RESEND_WEBHOOK_SECRET", "MESSAGES_REPLY_TO_EMAIL",
  ])("rejects one-sided native mail configuration %s", (name) => {
    const input = config("production");
    input.env[name] = "synthetic-paired-mail-value";
    expectDenied(input, "NATIVE_CONFIG_MAIL");
  });

  test("permits intentionally disabled mail or paired native Resend sending and receiving", () => {
    const input = config("production");
    expect(validateNativeConfig(input).env).not.toHaveProperty("RESEND_API_KEY");
    Object.assign(input.env, { RESEND_API_KEY: "synthetic-resend-key", RESEND_FROM_EMAIL: "Jazz <jazz@example.invalid>",
      RESEND_WEBHOOK_SECRET: "whsec_synthetic-native-resend-secret", MESSAGES_REPLY_TO_EMAIL: "reply@example.invalid",
      DODO_API_BASE_URL: "https://live.dodopayments.com" });
    const result = validateNativeConfig(input);
    expect(result.env.RESEND_WEBHOOK_SECRET).toBe(input.env.RESEND_WEBHOOK_SECRET);
    expect(result.env.MESSAGES_REPLY_TO_EMAIL).toBe("reply@example.invalid");
  });

  test.each(["sending", "receiving"])("allows the independently paired native %s configuration", (operation) => {
    const input = config("production");
    Object.assign(input.env, operation === "sending" ? {
      RESEND_API_KEY: "synthetic-resend-key", RESEND_FROM_EMAIL: "jazz@example.invalid",
    } : {
      RESEND_WEBHOOK_SECRET: "whsec_synthetic-native-resend-secret", MESSAGES_REPLY_TO_EMAIL: "reply@example.invalid",
    });
    const result = validateNativeConfig(input);
    expect(Boolean(result.env.RESEND_API_KEY)).toBe(operation === "sending");
    expect(Boolean(result.env.RESEND_WEBHOOK_SECRET)).toBe(operation === "receiving");
  });
});
