import { execFileSync, spawnSync } from "node:child_process";
import { createHash, generateKeyPairSync } from "node:crypto";
import {
  chmodSync, existsSync, linkSync, lstatSync, mkdirSync, mkdtempSync, readFileSync,
  readdirSync, readlinkSync, rmSync, symlinkSync, writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from "vitest";

import {
  PREVIEW_PROJECT_REF, PRODUCTION_PROJECT_REF, validateNativeConfig,
} from "../../scripts/native/config-policy.mjs";
import {
  inspectNativePreparation, materializeNativeDependencies, nativeBuildEnvironment,
  pruneNativeDependencies, verifyNativeSourceInventory,
} from "../../scripts/native/prepare-release.mjs";

const producerPath = resolve("scripts/native/prepare-release.mjs");
const fixtureDirectories: string[] = [];
const secretMarker = "synthetic-native-preparation-private-marker";
const fetchMock = vi.fn(() => { throw new Error("Network is forbidden in preparation tests"); });
let certificatesDirectory: string;
let certificate: Buffer;
let privateKey: string;

function sha256(value: string | Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

function makeDirectory(parent: string, name: string) {
  const directory = join(parent, name);
  mkdirSync(directory, { mode: 0o700 });
  chmodSync(directory, 0o700);
  return directory;
}

function privateJson(path: string, value: unknown) {
  writeFileSync(path, JSON.stringify(value), { mode: 0o600 });
  chmodSync(path, 0o600);
}

function git(repository: string, args: string[]) {
  try {
    return execFileSync("git", ["-C", repository, ...args], {
      encoding: "utf8", timeout: 10_000, stdio: ["ignore", "pipe", "pipe"],
      env: { NODE_ENV: "test", PATH: "/usr/bin:/bin", HOME: repository, LANG: "C", GIT_CONFIG_NOSYSTEM: "1" },
    }).trim();
  } catch {
    throw new Error("Disposable Git fixture operation failed");
  }
}

function initializeRepository(repository: string, template: string) {
  git(repository, ["init", "--quiet", `--template=${template}`]);
}

function rawConfiguration(mode: "preview" | "production", caPath: string, sourceCommit: string) {
  const production = mode === "production";
  const ref = production ? PRODUCTION_PROJECT_REF : PREVIEW_PROJECT_REF;
  const origin = production ? "https://www.culturadeljazz.com" : "https://synthetic-native-preparation.trycloudflare.com";
  const url = new URL(`postgresql://postgres:${secretMarker}@db.${ref}.supabase.co:5432/postgres`);
  for (const [name, value] of Object.entries({ sslmode: "require", sslaccept: "strict", sslcert: caPath,
    pool_timeout: "10", connect_timeout: "10" })) url.searchParams.set(name, value);
  return {
    version: 1, mode, sourceCommit, projectRef: ref, origin,
    ca: { path: caPath, sha256: sha256(certificate) },
    env: {
      APP_URL: origin, NEXT_PUBLIC_APP_URL: origin,
      NEXT_PUBLIC_SUPABASE_URL: `https://${ref}.supabase.co`, SUPABASE_URL: `https://${ref}.supabase.co`,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_publishable_synthetic_native_public_key",
      NEXT_PUBLIC_SUPPORT_EMAIL: "support@example.invalid",
      SUPABASE_SERVICE_ROLE_KEY: `sb_secret_${secretMarker.replaceAll("-", "_")}`,
      DATABASE_URL: url.toString(), SUPABASE_STORAGE_BUCKET: "synthetic-private-pdfs",
      MUX_SIGNING_KEY_ID: "synthetic-native-mux-signing-id", MUX_SIGNING_PRIVATE_KEY: privateKey,
      ...(production ? {
        CRON_SECRET: `${secretMarker}-cron`, DODO_PAYMENTS_API_KEY: `${secretMarker}-dodo-api`,
        DODO_PAYMENTS_WEBHOOK_SECRET: `${secretMarker}-dodo-webhook`, DODO_BUSINESS_ID: "synthetic-business",
        DODO_PRODUCT_ID: "synthetic-product", DODO_ENVIRONMENT: "live_mode",
        DODO_API_BASE_URL: "https://live.dodopayments.com", DODO_WEBHOOK_REPLAY_WINDOW_SECONDS: "300",
        RESEND_API_KEY: `${secretMarker}-resend-api`, RESEND_FROM_EMAIL: "Jazz <sender@example.invalid>",
        PROFESSOR_EMAIL: "professor@example.invalid", ADMIN_OWNER_EMAIL: "owner@example.invalid",
        RESEND_WEBHOOK_SECRET: `${secretMarker}-native-resend`, MESSAGES_REPLY_TO_EMAIL: "reply@example.invalid",
        INBOUND_EMAIL_WEBHOOK_SECRET: `${secretMarker}-legacy-inbound`, SIGNED_URL_TTL_SECONDS: "300",
        PDF_CACHE_VERSION: "synthetic-private-cache-version",
      } : {}),
    } as Record<string, string>,
  };
}

function buildEnvironment(config: ReturnType<typeof validateNativeConfig>, temporary: string, cache: string): Record<string, string> {
  return nativeBuildEnvironment(config, temporary, cache);
}

function sourceInventoryFixture() {
  const directory = mkdtempSync(join(tmpdir(), "jazz-native-source-inventory-"));
  chmodSync(directory, 0o700);
  fixtureDirectories.push(directory);
  const appRoot = makeDirectory(directory, "app");
  const original: Record<string, string> = {
    "package.json": '{"name":"synthetic-source-only","private":true}',
    "src/app/page.tsx": "export default function Page() { return 'synthetic'; }\n",
    "src/lib/authority.ts": "export const authorizationRequired = true;\n",
    "public/logo.svg": '<svg xmlns="http://www.w3.org/2000/svg"/>\n',
    "next-env.d.ts": "// initial synthetic generated type reference\n",
    "tsconfig.tsbuildinfo": "initial synthetic incremental metadata\n",
  };
  function write(path: string, content: string) {
    const target = join(appRoot, path);
    mkdirSync(dirname(target), { recursive: true, mode: 0o700 });
    writeFileSync(target, content, { mode: 0o600 });
  }
  for (const [path, content] of Object.entries(original)) write(path, content);
  const hashes = Object.fromEntries(Object.entries(original).map(([path, content]) => [path, sha256(content)]));
  return { appRoot, original, hashes, write };
}

function fixture() {
  const directory = mkdtempSync(join(tmpdir(), "jazz-native-preparation-"));
  chmodSync(directory, 0o700);
  fixtureDirectories.push(directory);
  const repository = makeDirectory(directory, "source-repository");
  const outputParent = makeDirectory(directory, "private-releases");
  const emptyTemplate = makeDirectory(directory, "empty-git-template");
  initializeRepository(repository, emptyTemplate);
  writeFileSync(join(repository, "README.md"), "Disposable synthetic preflight fixture.\n", { mode: 0o600 });
  mkdirSync(join(repository, "jazz-lms"), { mode: 0o700 });
  writeFileSync(join(repository, "jazz-lms/package.json"), JSON.stringify({
    name: "synthetic-never-built-fixture", private: true,
    scripts: { "build:webpack": "exit 64", preinstall: "exit 64" },
  }), { mode: 0o600 });
  git(repository, ["add", "--", "README.md", "jazz-lms/package.json"]);
  git(repository, ["-c", "user.name=Synthetic Preflight", "-c", "user.email=fixture@example.invalid",
    "-c", "commit.gpgSign=false", "commit", "--quiet", "--no-verify", "-m", "Synthetic preflight fixture"]);
  const sourceCommit = git(repository, ["rev-parse", "HEAD^{commit}"]);
  const caPath = join(directory, "synthetic-ca.crt");
  writeFileSync(caPath, certificate, { mode: 0o600 });
  const configFile = join(directory, "synthetic-private-config.json");
  const config = rawConfiguration("preview", caPath, sourceCommit);
  privateJson(configFile, config);
  return { directory, repository, outputParent, emptyTemplate, configFile, config,
    outputDirectory: join(outputParent, "new-release") };
}

type Fixture = ReturnType<typeof fixture>;

function inspect(value: Fixture) {
  return inspectNativePreparation({
    configFile: value.configFile, repository: value.repository, outputDirectory: value.outputDirectory,
  });
}

async function expectDenied(operation: Promise<unknown>, code: string) {
  // Do not let a failing assertion print the returned private config/PEM.
  const outcome = await operation.then(
    () => ({ accepted: true, error: null }),
    (error: unknown) => ({ accepted: false, error }),
  );
  expect(outcome.accepted).toBe(false);
  expect(outcome.error instanceof Error).toBe(true);
  expect((outcome.error as Error).message).toBe(code);
}

beforeAll(() => {
  certificatesDirectory = mkdtempSync(join(tmpdir(), "jazz-native-preparation-ca-"));
  chmodSync(certificatesDirectory, 0o700);
  const rsa = generateKeyPairSync("rsa", { modulusLength: 2048 });
  privateKey = rsa.privateKey.export({ format: "pem", type: "pkcs8" }).toString();
  const keyPath = join(certificatesDirectory, "synthetic-private-key.pem");
  writeFileSync(keyPath, privateKey, { mode: 0o600 });
  const certificatePath = join(certificatesDirectory, "synthetic-ca.crt");
  try {
    execFileSync("openssl", ["req", "-x509", "-key", keyPath, "-days", "1",
      "-subj", "/CN=Synthetic Native Preparation Test CA", "-addext", "basicConstraints=critical,CA:TRUE",
      "-addext", "keyUsage=critical,keyCertSign,cRLSign", "-out", certificatePath], {
      stdio: ["ignore", "pipe", "pipe"], timeout: 15_000,
    });
  } catch { throw new Error("Synthetic preparation CA generation failed"); }
  chmodSync(certificatePath, 0o600);
  certificate = readFileSync(certificatePath);
  vi.stubGlobal("fetch", fetchMock);
}, 20_000);

afterEach(() => {
  expect(fetchMock).not.toHaveBeenCalled();
  vi.unstubAllEnvs();
  for (const directory of fixtureDirectories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

afterAll(() => {
  vi.unstubAllGlobals();
  if (certificatesDirectory) rmSync(certificatesDirectory, { recursive: true, force: true });
});

describe("sealed runtime dependency pruning", () => {
  function dependenciesFixture() {
    const directory = mkdtempSync(join(tmpdir(), "jazz-native-prune-"));
    chmodSync(directory, 0o700);
    fixtureDirectories.push(directory);
    const appRoot = makeDirectory(directory, "app");
    const temporary = makeDirectory(directory, "tmp");
    const cache = makeDirectory(directory, "cache");
    for (const name of ["empty-user.npmrc", "empty-global.npmrc"]) {
      writeFileSync(join(cache, name), "", { mode: 0o600 });
    }
    const lifecycle = "node -e \"require('node:fs').writeFileSync('lifecycle-ran', 'unexpected')\"";
    const rootPackage = {
      name: "synthetic-native-runtime", version: "1.0.0", private: true,
      dependencies: { "runtime-fixture": "1.0.0" },
      devDependencies: { "development-fixture": "1.0.0", "shared-fixture": "1.0.0" },
      scripts: { prepare: lifecycle, postinstall: lifecycle },
    };
    privateJson(join(appRoot, "package.json"), rootPackage);
    privateJson(join(appRoot, "package-lock.json"), {
      name: rootPackage.name, version: "1.0.0", lockfileVersion: 3, requires: true,
      packages: {
        "": { name: rootPackage.name, version: "1.0.0", hasInstallScript: true,
          dependencies: rootPackage.dependencies, devDependencies: rootPackage.devDependencies },
        "node_modules/runtime-fixture": { version: "1.0.0", dependencies: { "shared-fixture": "1.0.0" } },
        "node_modules/shared-fixture": { version: "1.0.0" },
        "node_modules/development-fixture": { version: "1.0.0", dev: true },
      },
    });
    // npm's stable lockfile serialization, as used by the actual committed lock.
    const lockfile = join(appRoot, "package-lock.json");
    writeFileSync(lockfile, `${JSON.stringify(JSON.parse(readFileSync(lockfile, "utf8")), null, 2)}\n`);
    const modules = makeDirectory(appRoot, "node_modules");
    for (const name of ["runtime-fixture", "shared-fixture", "development-fixture"]) {
      const dependency = makeDirectory(modules, name);
      privateJson(join(dependency, "package.json"), { name, version: "1.0.0",
        ...(name === "runtime-fixture" ? { dependencies: { "shared-fixture": "1.0.0" } } : {}) });
      writeFileSync(join(dependency, "index.js"), name === "runtime-fixture"
        ? "module.exports = require('shared-fixture');\n" : "module.exports = 'runtime-retained';\n", { mode: 0o600 });
    }
    const lock = spawnSync(join(dirname(process.execPath), "npm"), [
      "install", "--package-lock-only", "--ignore-scripts", "--offline", "--no-audit", "--no-fund",
    ], {
      cwd: appRoot, encoding: "utf8", timeout: 10_000,
      env: { PATH: `${dirname(process.execPath)}:/usr/bin:/bin`, npm_config_cache: cache,
        npm_config_userconfig: join(cache, "empty-user.npmrc"),
        npm_config_globalconfig: join(cache, "empty-global.npmrc") },
    });
    if (lock.status !== 0) throw new Error("Disposable offline dependency fixture failed");
    return { directory, appRoot, temporary, cache, logFile: join(directory, "prune-private.log") };
  }

  test("removes development-only packages while preserving locked runtime peers and skipping lifecycle hooks", async () => {
    const value = dependenciesFixture();
    const source = Object.fromEntries(["package.json", "package-lock.json"].map(name =>
      [name, sha256(readFileSync(join(value.appRoot, name)))]));
    vi.stubEnv("NODE_OPTIONS", "--require=/synthetic/ambient-loader-must-not-run.cjs");
    vi.stubEnv("npm_config_userconfig", "/synthetic/ambient-private-user.npmrc");
    vi.stubEnv("NPM_TOKEN", secretMarker);
    await pruneNativeDependencies(value.appRoot, value.temporary, value.cache, value.logFile);
    expect(existsSync(join(value.appRoot, "node_modules/development-fixture"))).toBe(false);
    expect(existsSync(join(value.appRoot, "node_modules/runtime-fixture/index.js"))).toBe(true);
    expect(existsSync(join(value.appRoot, "node_modules/shared-fixture/index.js"))).toBe(true);
    expect(existsSync(join(value.appRoot, "lifecycle-ran"))).toBe(false);
    for (const [name, digest] of Object.entries(source)) {
      expect(sha256(readFileSync(join(value.appRoot, name)))).toBe(digest);
    }
    const result = spawnSync(process.execPath, ["-e", "process.stdout.write(require('runtime-fixture'))"], {
      cwd: value.appRoot, encoding: "utf8", timeout: 5_000,
      env: { PATH: `${dirname(process.execPath)}:/usr/bin:/bin` },
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toBe("runtime-retained");
    expect(readFileSync(value.logFile, "utf8").includes(secretMarker)).toBe(false);
  }, 15_000);

  test("fails closed instead of fetching an unavailable locked runtime package", async () => {
    const value = dependenciesFixture();
    rmSync(join(value.appRoot, "node_modules/runtime-fixture"), { recursive: true });
    await expectDenied(pruneNativeDependencies(
      value.appRoot, value.temporary, value.cache, value.logFile,
    ), "NATIVE_BUILD_CHILD");
    expect(existsSync(join(value.appRoot, "lifecycle-ran"))).toBe(false);
    expect(existsSync(join(value.appRoot, "node_modules/runtime-fixture"))).toBe(false);
    expect(readFileSync(value.logFile, "utf8").includes("ENOTCACHED")).toBe(true);
  }, 15_000);
});

describe("native build public configuration and credential boundary", () => {
  test.each(["production", "preview"] as const)("binds every browser field for %s while omitting every server configuration field", (mode) => {
    const config = validateNativeConfig(rawConfiguration(mode, "/private/synthetic-ca.crt", "a".repeat(40)));
    const build = buildEnvironment(config, "/synthetic/build-tmp", "/synthetic/npm-cache");
    for (const name of ["APP_URL", "NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPPORT_EMAIL", "NODE_ENV", "APP_DEPLOYMENT_ENVIRONMENT",
      "NEXT_PUBLIC_OPENREPLAY_ENABLED", "NEXT_PUBLIC_OPENREPLAY_PROJECT_KEY", "NEXT_PUBLIC_GA_MEASUREMENT_ID"]) {
      expect(build[name] === config.env[name]).toBe(true);
    }
    for (const name of Object.keys(config.env).filter(name => !name.startsWith("NEXT_PUBLIC_") &&
      !["APP_URL", "APP_DEPLOYMENT_ENVIRONMENT", "NODE_ENV", "DATABASE_URL", "NEXT_TELEMETRY_DISABLED"].includes(name))) {
      expect(Object.hasOwn(build, name)).toBe(false);
    }
    expect(JSON.stringify(build).includes(secretMarker)).toBe(false);
    expect(JSON.stringify(build).includes("BEGIN PRIVATE KEY")).toBe(false);
    expect(build.DATABASE_URL === config.env.DATABASE_URL).toBe(false);
    expect(build.TMPDIR).toBe("/synthetic/build-tmp");
    expect(build.npm_config_cache).toBe("/synthetic/npm-cache");
    expect(build.npm_config_userconfig).toBe("/synthetic/npm-cache/empty-user.npmrc");
    expect(build.npm_config_globalconfig).toBe("/synthetic/npm-cache/empty-global.npmrc");
  });

  test("uses a bounded closed-loopback fixture DB without connecting or copying native TLS/provider targets", () => {
    const config = validateNativeConfig(rawConfiguration("production", "/private/synthetic-ca.crt", "a".repeat(40)));
    const build = buildEnvironment(config, "/synthetic/tmp", "/synthetic/cache");
    const database = new URL(build.DATABASE_URL);
    expect(database.protocol).toBe("postgresql:");
    expect(database.hostname).toBe("127.0.0.1");
    expect(database.port).toBe("1");
    expect(database.pathname).toBe("/native_build");
    expect(database.searchParams.get("pool_timeout")).toBe("1");
    expect(database.searchParams.get("connect_timeout")).toBe("1");
    expect(database.searchParams.has("sslcert")).toBe(false);
    expect(database.hostname.includes("supabase")).toBe(false);
  });

  test("does not inherit ambient loaders, credentials, home directories, tracing or local mutation flags", () => {
    const ambient = ["NODE_OPTIONS", "HOME", "DODO_PAYMENTS_API_KEY", "RESEND_API_KEY", "SUPABASE_SERVICE_ROLE_KEY",
      "GOOGLE_APPLICATION_CREDENTIALS", "OPENREPLAY_API_KEY", "OTEL_EXPORTER_OTLP_HEADERS", "ENABLE_LOCAL_LEGACY_MUTATIONS"];
    for (const name of ambient) vi.stubEnv(name, `${secretMarker}-${name}`);
    vi.stubEnv("npm_config_userconfig", "/synthetic/ambient-private-user.npmrc");
    vi.stubEnv("npm_config_globalconfig", "/synthetic/ambient-private-global.npmrc");
    vi.stubEnv("NPM_TOKEN", `${secretMarker}-npm-token`);
    vi.stubEnv("npm_config_registry", "https://synthetic-ambient-registry.example.invalid");
    vi.stubEnv("PATH", "/synthetic/untrusted-runtime");
    const config = validateNativeConfig(rawConfiguration("preview", "/private/synthetic-ca.crt", "a".repeat(40)));
    const build = buildEnvironment(config, "/synthetic/tmp", "/synthetic/cache");
    for (const name of ambient) expect(Object.hasOwn(build, name)).toBe(false);
    expect(build.PATH).toBe(`${dirname(process.execPath)}:/usr/bin:/bin`);
    expect(build.LANG).toBe("C.UTF-8");
    expect(build.NEXT_TELEMETRY_DISABLED).toBe("1");
    expect(build.NODE_ENV).toBe("production");
    expect(build.APP_DEPLOYMENT_ENVIRONMENT).toBe("preview");
    expect(build.npm_config_userconfig).toBe("/synthetic/cache/empty-user.npmrc");
    expect(build.npm_config_globalconfig).toBe("/synthetic/cache/empty-global.npmrc");
    expect(Object.hasOwn(build, "NPM_TOKEN")).toBe(false);
    expect(Object.hasOwn(build, "npm_config_registry")).toBe(false);
  });

  test("changing the validated public support address changes the build environment without altering the private config", () => {
    const raw = rawConfiguration("preview", "/private/synthetic-ca.crt", "a".repeat(40));
    const first = validateNativeConfig(raw);
    raw.env.NEXT_PUBLIC_SUPPORT_EMAIL = "another-support@example.invalid";
    const second = validateNativeConfig(raw);
    const before = JSON.stringify(second);
    expect(buildEnvironment(first, "/synthetic/tmp", "/synthetic/cache").NEXT_PUBLIC_SUPPORT_EMAIL)
      .toBe("support@example.invalid");
    expect(buildEnvironment(second, "/synthetic/tmp", "/synthetic/cache").NEXT_PUBLIC_SUPPORT_EMAIL)
      .toBe("another-support@example.invalid");
    expect(JSON.stringify(second) === before).toBe(true);
  });
});

describe("native release preparation read-only preflight with actual disposable Git", () => {
  test("accepts exact clean committed source and an unused private output, creating no release or build files", async () => {
    const value = fixture();
    const beforeDirectory = readdirSync(value.directory).sort();
    const beforeConfigHash = sha256(readFileSync(value.configFile));
    const result = await inspect(value);
    expect(result.summary).toEqual({ sourceCommit: value.config.sourceCommit, mode: "preview",
      cleanSource: true, outputExists: false, providerCredentialsVerified: false, productionApproved: false });
    expect(existsSync(value.outputDirectory)).toBe(false);
    expect(readdirSync(value.outputParent)).toEqual([]);
    expect(readdirSync(value.directory).sort()).toEqual(beforeDirectory);
    expect(sha256(readFileSync(value.configFile)) === beforeConfigHash).toBe(true);
    expect(git(value.repository, ["status", "--porcelain=v1", "--untracked-files=all"])).toBe("");
  });

  test.each(["tracked modification", "staged modification", "untracked file"])("rejects %s instead of building dirty source", async (kind) => {
    const value = fixture();
    if (kind === "untracked file") writeFileSync(join(value.repository, "untracked-private-file"), "synthetic-untracked", { mode: 0o600 });
    else {
      writeFileSync(join(value.repository, "README.md"), "synthetic-modified", { mode: 0o600 });
      if (kind === "staged modification") git(value.repository, ["add", "--", "README.md"]);
    }
    await expectDenied(inspect(value), "NATIVE_BUILD_DIRTY");
    expect(existsSync(value.outputDirectory)).toBe(false);
  });

  test("rejects the wrong source commit even when the actual repository is clean", async () => {
    const value = fixture();
    value.config.sourceCommit = "b".repeat(40);
    privateJson(value.configFile, value.config);
    await expectDenied(inspect(value), "NATIVE_BUILD_SOURCE");
    expect(existsSync(value.outputDirectory)).toBe(false);
  });

  test.each(["directory", "regular file", "symlink"])("rejects an existing %s output without overwriting its target", async (kind) => {
    const value = fixture();
    let sentinel: string;
    if (kind === "directory") {
      mkdirSync(value.outputDirectory, { mode: 0o700 });
      sentinel = join(value.outputDirectory, "preserve-me");
    } else if (kind === "symlink") {
      const target = makeDirectory(value.directory, "symlink-target");
      sentinel = join(target, "preserve-me");
      symlinkSync(target, value.outputDirectory);
    } else sentinel = value.outputDirectory;
    writeFileSync(sentinel, "synthetic-preserved-existing-output", { mode: 0o600 });
    await expectDenied(inspect(value), "NATIVE_BUILD_EXISTS");
    expect(readFileSync(sentinel, "utf8") === "synthetic-preserved-existing-output").toBe(true);
  });

  test.each([0o750, 0o755, 0o730, 0o777])("rejects output parent permission mode %i when peers can read or write it", async (mode) => {
    const value = fixture();
    chmodSync(value.outputParent, mode);
    await expectDenied(inspect(value), "NATIVE_BUILD_DIRECTORY");
    expect(existsSync(value.outputDirectory)).toBe(false);
  });

  test("rejects output inside the source worktree", async () => {
    const value = fixture();
    value.outputDirectory = join(value.repository, "new-release");
    await expectDenied(inspect(value), "NATIVE_BUILD_PATH");
    expect(existsSync(value.outputDirectory)).toBe(false);
  });

  test("rejects output in a separate Git worktree rather than relying only on source-path inequality", async () => {
    const value = fixture();
    const otherRepository = makeDirectory(value.directory, "other-repository");
    initializeRepository(otherRepository, value.emptyTemplate);
    value.outputDirectory = join(otherRepository, "new-release");
    await expectDenied(inspect(value), "NATIVE_BUILD_PARENT_REPOSITORY");
    expect(existsSync(value.outputDirectory)).toBe(false);
  });

  test.each(["repository", "output parent"])("rejects a symlink alias for the %s", async (kind) => {
    const value = fixture();
    const alias = join(value.directory, "symlink-alias");
    symlinkSync(kind === "repository" ? value.repository : value.outputParent, alias);
    if (kind === "repository") value.repository = alias;
    else value.outputDirectory = join(alias, "new-release");
    await expectDenied(inspect(value), "NATIVE_BUILD_PATH");
    expect(existsSync(value.outputDirectory)).toBe(false);
  });

  test("requires the repository root rather than accepting a clean nested source directory", async () => {
    const value = fixture();
    value.repository = join(value.repository, "jazz-lms");
    await expectDenied(inspect(value), "NATIVE_BUILD_REPOSITORY");
    expect(existsSync(value.outputDirectory)).toBe(false);
  });

  test("CLI inspect exposes only finite safe summary metadata and never the private environment", () => {
    const value = fixture();
    const result = spawnSync(process.execPath, [producerPath, "--inspect", value.configFile, value.repository, value.outputDirectory], {
      cwd: value.directory, encoding: "utf8", timeout: 15_000,
      env: { NODE_ENV: "test", PATH: `${dirname(process.execPath)}:/usr/bin:/bin`, LANG: "C" },
    });
    expect(result.status).toBe(0);
    const output = `${result.stdout}${result.stderr}`;
    expect([secretMarker, privateKey, value.config.env.DATABASE_URL, value.config.env.SUPABASE_SERVICE_ROLE_KEY]
      .every(secret => !output.includes(secret))).toBe(true);
    expect(output.includes("BEGIN PRIVATE KEY")).toBe(false);
    const summary = JSON.parse(result.stdout);
    expect(summary).not.toHaveProperty("env");
    expect(summary).not.toHaveProperty("config");
    expect(summary).toMatchObject({ cleanSource: true, outputExists: false, providerCredentialsVerified: false, productionApproved: false });
    expect(existsSync(value.outputDirectory)).toBe(false);
  });
});

describe("native release source provenance checks with actual isolated files", () => {
  test("accepts unchanged original source without altering any original file", async () => {
    const value = sourceInventoryFixture();
    await verifyNativeSourceInventory(value.appRoot, value.hashes);
    for (const [path, hash] of Object.entries(value.hashes)) {
      expect(sha256(readFileSync(join(value.appRoot, path))) === hash).toBe(true);
    }
  });

  test.each(["src/app/api/injected/route.ts", "public/injected-asset.js"])(
    "rejects an added application or public file %s even when every original hash still matches", async (path) => {
      const value = sourceInventoryFixture();
      value.write(path, "export const unexpectedSource = true;\n");
      await expectDenied(verifyNativeSourceInventory(value.appRoot, value.hashes), "NATIVE_BUILD_SOURCE_CHANGED");
    },
  );

  test.each(["src/lib/authority.ts", "public/logo.svg"])("rejects removal of original nongenerated source %s", async (path) => {
    const value = sourceInventoryFixture();
    rmSync(join(value.appRoot, path));
    await expectDenied(verifyNativeSourceInventory(value.appRoot, value.hashes), "NATIVE_BUILD_SOURCE_CHANGED");
  });

  test.each(["src/lib/authority.ts", "public/logo.svg"])("rejects modified original nongenerated source %s", async (path) => {
    const value = sourceInventoryFixture();
    value.write(path, "synthetic-replaced-source\n");
    await expectDenied(verifyNativeSourceInventory(value.appRoot, value.hashes), "NATIVE_BUILD_SOURCE_CHANGED");
  });

  test("rejects replacing one original path with an unexpected path even when source counts remain identical", async () => {
    const value = sourceInventoryFixture();
    rmSync(join(value.appRoot, "src/lib/authority.ts"));
    value.write("src/lib/alternate-authority.ts", value.original["src/lib/authority.ts"]);
    await expectDenied(verifyNativeSourceInventory(value.appRoot, value.hashes), "NATIVE_BUILD_SOURCE_CHANGED");
  });

  test("permits dependency and build outputs plus the two exact root generated files", async () => {
    const value = sourceInventoryFixture();
    await verifyNativeSourceInventory(value.appRoot, value.hashes);
    value.write("node_modules/synthetic-package/index.js", "synthetic installed dependency\n");
    value.write(".next/server/app/page.js", "synthetic generated build output\n");
    value.write(".next/cache/synthetic-cache", "synthetic transient cache\n");
    value.write("next-env.d.ts", "// synthetic rewritten Next reference\n");
    value.write("tsconfig.tsbuildinfo", "synthetic rewritten compiler metadata\n");
    await verifyNativeSourceInventory(value.appRoot, value.hashes);
    expect(sha256(readFileSync(join(value.appRoot, "src/lib/authority.ts"))) === value.hashes["src/lib/authority.ts"]).toBe(true);
  });

  test.each(["next-env.d.ts", "tsconfig.tsbuildinfo"])("permits regeneration to remove the exempt root file %s", async (path) => {
    const value = sourceInventoryFixture();
    rmSync(join(value.appRoot, path));
    await verifyNativeSourceInventory(value.appRoot, value.hashes);
    expect(existsSync(join(value.appRoot, path))).toBe(false);
  });

  test.each(["src/next-env.d.ts", "src/tsconfig.tsbuildinfo", "src/node_modules/injected.js",
    "node_modules-extra/injected.js", ".next-extra/injected.js", "public/.next/injected.js"])(
    "does not exempt a generated-looking path outside the exact allowed roots: %s", async (path) => {
      const value = sourceInventoryFixture();
      value.write(path, "synthetic unexpected source\n");
      await expectDenied(verifyNativeSourceInventory(value.appRoot, value.hashes), "NATIVE_BUILD_SOURCE_CHANGED");
    },
  );

  test("a successful earlier checkpoint does not authorize a later source modification", async () => {
    const value = sourceInventoryFixture();
    value.write("node_modules/synthetic-package/index.js", "synthetic dependency\n");
    await verifyNativeSourceInventory(value.appRoot, value.hashes);
    value.write(".next/server/app/page.js", "synthetic build output\n");
    value.write("src/lib/authority.ts", "export const authorizationRequired = false;\n");
    await expectDenied(verifyNativeSourceInventory(value.appRoot, value.hashes), "NATIVE_BUILD_SOURCE_CHANGED");
  });

  test.each(["symlink", "hardlink"])("rejects replacing original source with a %s even when generated target bytes match exactly", async (kind) => {
    const value = sourceInventoryFixture();
    const originalPath = join(value.appRoot, "src/lib/authority.ts");
    const targetPath = join(value.appRoot, ".next/server/identical-generated-authority.ts");
    value.write(".next/server/identical-generated-authority.ts", value.original["src/lib/authority.ts"]);
    rmSync(originalPath);
    if (kind === "symlink") symlinkSync(targetPath, originalPath);
    else linkSync(targetPath, originalPath);
    expect(sha256(readFileSync(originalPath)) === value.hashes["src/lib/authority.ts"]).toBe(true);
    await expectDenied(verifyNativeSourceInventory(value.appRoot, value.hashes), "NATIVE_BUILD_SOURCE_CHANGED");
  });
});

describe("native generated dependency hardlink materialization", () => {
  test("materializes an esbuild-like executable pair into independent inodes with identical bytes and executable bits", async () => {
    const value = sourceInventoryFixture();
    const first = join(value.appRoot, "node_modules/@esbuild/linux-x64/bin/esbuild");
    const second = join(value.appRoot, "node_modules/esbuild/bin/esbuild");
    value.write("node_modules/@esbuild/linux-x64/bin/esbuild", "synthetic executable bytes; never executed\n");
    mkdirSync(dirname(second), { recursive: true, mode: 0o700 });
    chmodSync(first, 0o755);
    linkSync(first, second);
    expect(lstatSync(first).nlink).toBe(2);
    expect(lstatSync(first).ino === lstatSync(second).ino).toBe(true);
    const digest = sha256(readFileSync(first));
    expect(await materializeNativeDependencies(value.appRoot)).toBe(1);
    expect(lstatSync(first).nlink).toBe(1);
    expect(lstatSync(second).nlink).toBe(1);
    expect(lstatSync(first).ino === lstatSync(second).ino).toBe(false);
    for (const path of [first, second]) {
      expect(sha256(readFileSync(path)) === digest).toBe(true);
      expect(Boolean(lstatSync(path).mode & 0o111)).toBe(true);
      expect(readdirSync(dirname(path)).some(name => name.startsWith(".native-materialize-"))).toBe(false);
    }
    // A second pass has nothing left to disconnect.
    expect(await materializeNativeDependencies(value.appRoot)).toBe(0);
  });

  test.each([0o640, 0o755])("disconnects a generated hardlink from a separate owned fixture, preserving its outside bytes and mode %i", async (mode) => {
    const value = sourceInventoryFixture();
    const outsideDirectory = mkdtempSync(join(tmpdir(), "jazz-native-outside-hardlink-"));
    chmodSync(outsideDirectory, 0o700);
    fixtureDirectories.push(outsideDirectory);
    const outside = join(outsideDirectory, "preserved-outside-file");
    writeFileSync(outside, "synthetic outside dependency bytes\n", { mode });
    chmodSync(outside, mode);
    const generated = join(value.appRoot, "node_modules/synthetic-package/native-binary");
    mkdirSync(dirname(generated), { recursive: true, mode: 0o700 });
    linkSync(outside, generated);
    const originalStat = lstatSync(outside);
    const digest = sha256(readFileSync(outside));
    expect(await materializeNativeDependencies(value.appRoot)).toBe(1);
    expect(sha256(readFileSync(outside)) === digest).toBe(true);
    expect(lstatSync(outside).ino).toBe(originalStat.ino);
    expect(lstatSync(outside).mode & 0o777).toBe(mode);
    expect(lstatSync(outside).nlink).toBe(1);
    expect(lstatSync(generated).ino === originalStat.ino).toBe(false);
    expect(lstatSync(generated).nlink).toBe(1);
    expect(sha256(readFileSync(generated)) === digest).toBe(true);
    expect(Boolean(lstatSync(generated).mode & 0o111)).toBe(Boolean(mode & 0o111));
    expect(readdirSync(dirname(generated)).some(name => name.startsWith(".native-materialize-"))).toBe(false);
  });

  test("leaves regular files and a generated symlink unchanged", async () => {
    const value = sourceInventoryFixture();
    value.write("node_modules/synthetic-package/index.js", "synthetic regular dependency\n");
    const regular = join(value.appRoot, "node_modules/synthetic-package/index.js");
    chmodSync(regular, 0o640);
    const symlink = join(value.appRoot, "node_modules/synthetic-package/alias.js");
    symlinkSync("index.js", symlink);
    const before = lstatSync(regular);
    const digest = sha256(readFileSync(regular));
    const symlinkBefore = lstatSync(symlink);
    const sourceBefore = lstatSync(join(value.appRoot, "src/lib/authority.ts"));
    expect(await materializeNativeDependencies(value.appRoot)).toBe(0);
    expect(lstatSync(regular).ino).toBe(before.ino);
    expect(lstatSync(regular).mode & 0o777).toBe(0o640);
    expect(sha256(readFileSync(regular)) === digest).toBe(true);
    expect(readlinkSync(symlink)).toBe("index.js");
    expect(lstatSync(symlink).ino).toBe(symlinkBefore.ino);
    expect(lstatSync(symlink).isSymbolicLink()).toBe(true);
    expect(lstatSync(join(value.appRoot, "src/lib/authority.ts")).ino).toBe(sourceBefore.ino);
  });

  test.each(["outside fixture", "generated sibling"])("denies original source hardlinked to %s rather than materializing it", async (kind) => {
    const value = sourceInventoryFixture();
    const original = join(value.appRoot, "src/lib/authority.ts");
    let linked: string;
    if (kind === "outside fixture") {
      const outside = mkdtempSync(join(tmpdir(), "jazz-native-source-hardlink-"));
      chmodSync(outside, 0o700);
      fixtureDirectories.push(outside);
      linked = join(outside, "source-hardlink");
    } else {
      linked = join(value.appRoot, ".next/server/hardlinked-source.ts");
      mkdirSync(dirname(linked), { recursive: true, mode: 0o700 });
    }
    linkSync(original, linked);
    expect(lstatSync(original).nlink).toBe(2);
    await expectDenied(materializeNativeDependencies(value.appRoot), "NATIVE_BUILD_SOURCE_CHANGED");
    expect(lstatSync(original).nlink).toBe(2);
    expect(lstatSync(linked).nlink).toBe(2);
    expect(sha256(readFileSync(original)) === value.hashes["src/lib/authority.ts"]).toBe(true);
  });

  test("does not traverse or materialize the separately guarded .next/cache tree", async () => {
    const value = sourceInventoryFixture();
    const outsideDirectory = mkdtempSync(join(tmpdir(), "jazz-native-cache-outside-"));
    chmodSync(outsideDirectory, 0o700);
    fixtureDirectories.push(outsideDirectory);
    const outside = join(outsideDirectory, "cache-source");
    writeFileSync(outside, "synthetic excluded cache bytes\n", { mode: 0o640 });
    chmodSync(outside, 0o640);
    const cacheFile = join(value.appRoot, ".next/cache/synthetic-cache");
    mkdirSync(dirname(cacheFile), { recursive: true, mode: 0o700 });
    linkSync(outside, cacheFile);
    const before = lstatSync(outside);
    const digest = sha256(readFileSync(outside));
    expect(await materializeNativeDependencies(value.appRoot)).toBe(0);
    expect(lstatSync(cacheFile).ino).toBe(before.ino);
    expect(lstatSync(cacheFile).nlink).toBe(2);
    expect(lstatSync(outside).mode & 0o777).toBe(0o640);
    expect(sha256(readFileSync(cacheFile)) === digest).toBe(true);
    expect(sha256(readFileSync(outside)) === digest).toBe(true);
  });
});
