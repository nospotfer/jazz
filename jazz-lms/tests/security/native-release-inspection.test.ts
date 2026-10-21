import { execFileSync, spawnSync } from "node:child_process";
import { createHash, X509Certificate } from "node:crypto";
import {
  chmodSync, copyFileSync, existsSync, linkSync, lstatSync, mkdirSync,
  mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from "vitest";

import {
  PREVIEW_PROJECT_REF, validateNativeConfig,
} from "../../scripts/native/config-policy.mjs";
import {
  inspectNativeRelease, publicBuildFingerprint,
} from "../../scripts/native/release-inspect.mjs";

const sourceCommit = "a".repeat(40);
const secretMarker = "isolated-native-private-value-marker";
const origin = "https://synthetic-native-release.trycloudflare.com";
const inspectorPath = resolve("scripts/native/release-inspect.mjs");
const fetchMock = vi.fn(() => { throw new Error("No network in release inspection tests"); });
const cases: string[] = [];
let certificateDirectory: string;
let certificate: Buffer;
let nonCaCertificate: Buffer;
let privateKey: string;
let nodeSha256: string;

function sha256(content: string | Buffer) {
  return createHash("sha256").update(content).digest("hex");
}

function openssl(args: string[]) {
  try {
    execFileSync("openssl", args, {
      cwd: certificateDirectory,
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 15_000,
    });
  } catch {
    throw new Error("Isolated synthetic certificate generation failed");
  }
}

function restoreOwnedPermissions(path: string) {
  const stat = lstatSync(path);
  if (stat.isSymbolicLink()) return;
  if (stat.isDirectory()) {
    chmodSync(path, 0o700);
    for (const entry of readdirSync(path)) restoreOwnedPermissions(join(path, entry));
  } else chmodSync(path, 0o600);
}

function sealApp(appRoot: string, path = appRoot) {
  if (relative(appRoot, path) === ".next/cache") return;
  const stat = lstatSync(path);
  if (stat.isSymbolicLink()) return;
  if (stat.isDirectory()) {
    for (const entry of readdirSync(path)) sealApp(appRoot, join(path, entry));
    chmodSync(path, 0o555);
  } else chmodSync(path, 0o444);
}

function inventoryHashes(appRoot: string, path = appRoot, files: Record<string, string> = {}) {
  if (relative(appRoot, path) === ".next/cache") return files;
  if (lstatSync(path).isDirectory()) {
    for (const entry of readdirSync(path)) inventoryHashes(appRoot, join(path, entry), files);
  } else files[relative(appRoot, path)] = sha256(readFileSync(path));
  return files;
}

function writePrivateJson(path: string, value: unknown) {
  writeFileSync(path, JSON.stringify(value), { mode: 0o600 });
  chmodSync(path, 0o600);
}

function fixture() {
  const directory = mkdtempSync(join(tmpdir(), "jazz-native-release-inspection-"));
  chmodSync(directory, 0o700);
  cases.push(directory);
  const appRoot = join(directory, "app");
  const caPath = join(directory, "public-synthetic-ca.crt");
  const configFile = join(directory, "private-config.json");
  const manifestFile = join(directory, "private-manifest.json");
  const cachePath = join(appRoot, ".next/cache");
  const contents: Record<string, string> = {
    ".next/BUILD_ID": "isolated-build-id",
    ".next/server/app.js": "export const build = 'isolated-synthetic-build';",
    "package-lock.json": '{"name":"isolated-fixture","lockfileVersion":3}',
    "node_modules/next/dist/bin/next": "// Synthetic CLI fixture; never executed.\n",
    "src/sealed-source.ts": "export const isolatedSource = true;\n",
  };
  for (const [path, body] of Object.entries(contents)) {
    mkdirSync(dirname(join(appRoot, path)), { recursive: true, mode: 0o700 });
    writeFileSync(join(appRoot, path), body, { mode: 0o600 });
  }
  mkdirSync(cachePath, { mode: 0o700 });
  writeFileSync(join(cachePath, "existing-cache-data"), "isolated-existing-cache", { mode: 0o600 });
  writeFileSync(caPath, certificate, { mode: 0o644 });
  const databaseUrl = new URL(`postgresql://postgres:${secretMarker}@db.${PREVIEW_PROJECT_REF}.supabase.co:5432/postgres`);
  for (const [name, value] of Object.entries({
    sslmode: "require", sslaccept: "strict", sslcert: caPath, pool_timeout: "10", connect_timeout: "10",
  })) databaseUrl.searchParams.set(name, value);
  const config = {
    version: 1, mode: "preview", sourceCommit, projectRef: PREVIEW_PROJECT_REF, origin,
    ca: { path: caPath, sha256: sha256(certificate) },
    env: {
      APP_URL: origin,
      NEXT_PUBLIC_APP_URL: origin,
      NEXT_PUBLIC_SUPABASE_URL: `https://${PREVIEW_PROJECT_REF}.supabase.co`,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_publishable_isolated_synthetic_preview_key",
      SUPABASE_SERVICE_ROLE_KEY: `sb_secret_${secretMarker.replaceAll("-", "_")}`,
      DATABASE_URL: databaseUrl.toString(),
      SUPABASE_STORAGE_BUCKET: "isolated-synthetic-private-pdfs",
      MUX_SIGNING_KEY_ID: "isolated-synthetic-signing-key",
      MUX_SIGNING_PRIVATE_KEY: privateKey,
    } as Record<string, string>,
  };
  const manifest = {
    version: 1, sourceCommit, nodeVersion: process.version, nodeSha256,
    publicBuildFingerprint: publicBuildFingerprint(validateNativeConfig(config).env),
    caSha256: config.ca.sha256, files: inventoryHashes(appRoot), links: {} as Record<string, string>,
  };
  writePrivateJson(configFile, config);
  writePrivateJson(manifestFile, manifest);
  sealApp(appRoot);
  return { directory, appRoot, caPath, cachePath, configFile, manifestFile, config, manifest };
}

type Fixture = ReturnType<typeof fixture>;

function inspect(value: Fixture) {
  return inspectNativeRelease({
    configFile: value.configFile, appRoot: value.appRoot, manifestFile: value.manifestFile,
  });
}

async function expectFailure(operation: Promise<unknown>, expectedCode?: string) {
  // Discard successful private results before asserting: a regression must not
  // let Vitest format the returned environment/PEM as a rejected-promise diff.
  const outcome = await operation.then(
    () => ({ accepted: true, error: null }),
    (error: unknown) => ({ accepted: false, error }),
  );
  expect(outcome.accepted).toBe(false);
  expect(outcome.error instanceof Error).toBe(true);
  if (expectedCode) expect((outcome.error as Error).message.includes(expectedCode)).toBe(true);
}

function addAppFile(value: Fixture, path: string, contents: string, declared = false) {
  restoreOwnedPermissions(value.appRoot);
  const target = join(value.appRoot, path);
  mkdirSync(dirname(target), { recursive: true, mode: 0o700 });
  writeFileSync(target, contents, { mode: 0o600 });
  if (declared) {
    value.manifest.files[path] = sha256(contents);
    writePrivateJson(value.manifestFile, value.manifest);
  }
  sealApp(value.appRoot);
}

function runCli(value: Fixture, timeout = 15_000) {
  return spawnSync(process.execPath, [inspectorPath, value.configFile, value.appRoot, value.manifestFile], {
    cwd: value.directory,
    env: { PATH: dirname(process.execPath), LANG: "C", NODE_ENV: "test" },
    encoding: "utf8", timeout,
  });
}

function expectNoPrivateOutput(output: string, value: Fixture) {
  // Boolean assertions avoid printing keys or the full environment on failure.
  expect([secretMarker, privateKey, value.config.env.DATABASE_URL,
    value.config.env.SUPABASE_SERVICE_ROLE_KEY].every((secret) => !output.includes(secret))).toBe(true);
  expect(output.includes("BEGIN PRIVATE KEY")).toBe(false);
}

beforeAll(() => {
  certificateDirectory = mkdtempSync(join(tmpdir(), "jazz-native-synthetic-ca-"));
  chmodSync(certificateDirectory, 0o700);
  openssl([
    "req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "1",
    "-subj", "/CN=Isolated Native Release Test CA",
    "-addext", "basicConstraints=critical,CA:TRUE",
    "-addext", "keyUsage=critical,keyCertSign,cRLSign",
    "-keyout", "private-key.pem", "-out", "public-ca.crt",
  ]);
  chmodSync(join(certificateDirectory, "private-key.pem"), 0o600);
  openssl([
    "req", "-x509", "-key", "private-key.pem", "-days", "1",
    "-subj", "/CN=Isolated Non CA Certificate",
    "-addext", "basicConstraints=critical,CA:FALSE", "-out", "public-non-ca.crt",
  ]);
  certificate = readFileSync(join(certificateDirectory, "public-ca.crt"));
  nonCaCertificate = readFileSync(join(certificateDirectory, "public-non-ca.crt"));
  privateKey = readFileSync(join(certificateDirectory, "private-key.pem"), "utf8");
  nodeSha256 = sha256(readFileSync(process.execPath));
  vi.stubGlobal("fetch", fetchMock);
}, 30_000);

afterEach(() => {
  vi.restoreAllMocks();
  expect(fetchMock).not.toHaveBeenCalled();
  for (const directory of cases.splice(0)) {
    restoreOwnedPermissions(directory);
    rmSync(directory, { recursive: true, force: true });
  }
});

afterAll(() => {
  vi.unstubAllGlobals();
  if (certificateDirectory) {
    restoreOwnedPermissions(certificateDirectory);
    rmSync(certificateDirectory, { recursive: true, force: true });
  }
});

describe("native release inspection actual local I/O", () => {
  test("accepts a complete sealed fixture, internally returns private env and preserves existing cache data", async () => {
    const value = fixture();
    const result = await inspect(value);
    expect(result.summary).toMatchObject({
      sourceCommit, mode: "preview", immutableFiles: 5, nodeVersion: process.version,
      publicBuildBound: true, caFileBound: true, cacheWritable: true,
      providerCredentialsVerified: false, productionApproved: false,
    });
    expect(result.config.env.DATABASE_URL === value.config.env.DATABASE_URL).toBe(true);
    expect(result.config.env.MUX_SIGNING_PRIVATE_KEY === privateKey).toBe(true);
    expect(existsSync(join(value.cachePath, ".native-write-probe"))).toBe(false);
    expect(readFileSync(join(value.cachePath, "existing-cache-data"), "utf8") === "isolated-existing-cache").toBe(true);
    expect((lstatSync(value.appRoot).mode & 0o222) === 0).toBe(true);
  });

  test("CLI prints only its safe summary rather than the internal private config", () => {
    const value = fixture();
    const result = runCli(value);
    expect(result.status).toBe(0);
    expectNoPrivateOutput(`${result.stdout}${result.stderr}`, value);
    const output = JSON.parse(result.stdout);
    expect(Object.hasOwn(output, "config")).toBe(false);
    expect(Object.hasOwn(output, "env")).toBe(false);
    expect(output).toMatchObject({ immutableFiles: 5, providerCredentialsVerified: false, productionApproved: false });
  });

  test.each([".next/server/app.js", "src/sealed-source.ts"])("rejects changed sealed content in %s", async (path) => {
    const value = fixture();
    const destination = join(value.appRoot, path);
    chmodSync(destination, 0o600);
    copyFileSync(join(value.appRoot, "package-lock.json"), destination);
    chmodSync(destination, 0o444);
    await expectFailure(inspect(value), "NATIVE_RELEASE_HASH");
  });

  test("rejects an unexpected undeclared file", async () => {
    const value = fixture();
    addAppFile(value, "undeclared-extra.js", "isolated-extra");
    await expectFailure(inspect(value), "NATIVE_RELEASE_INVENTORY");
  });

  test("rejects a missing file even when the remaining entries still hash correctly", async () => {
    const value = fixture();
    restoreOwnedPermissions(value.appRoot);
    rmSync(join(value.appRoot, "src/sealed-source.ts"));
    sealApp(value.appRoot);
    await expectFailure(inspect(value), "NATIVE_RELEASE_INVENTORY");
  });

  test("requires minimum build artifacts even if a deficient manifest matches its inventory", async () => {
    const value = fixture();
    restoreOwnedPermissions(value.appRoot);
    rmSync(join(value.appRoot, ".next/BUILD_ID"));
    delete value.manifest.files[".next/BUILD_ID"];
    writePrivateJson(value.manifestFile, value.manifest);
    sealApp(value.appRoot);
    await expectFailure(inspect(value), "NATIVE_RELEASE_BUILD");
  });

  test.each([".env", "src/.env.local"])("rejects ambient env shadow %s even if declared and sealed", async (path) => {
    const value = fixture();
    addAppFile(value, path, `SYNTHETIC_PRIVATE_MARKER=${secretMarker}`, true);
    await expectFailure(inspect(value), "NATIVE_RELEASE_AMBIENT_ENV");
  });

  test.each(["file", "directory"])("rejects group-writable app %s", async (kind) => {
    const value = fixture();
    chmodSync(join(value.appRoot, kind === "file" ? "package-lock.json" : "src"), kind === "file" ? 0o464 : 0o575);
    await expectFailure(inspect(value), "NATIVE_RELEASE_PERMISSIONS");
  });

  test.each([0o644, 0o640])("rejects private configuration with peer-readable mode %i", async (mode) => {
    const value = fixture();
    chmodSync(value.configFile, mode);
    await expectFailure(inspect(value), "NATIVE_INPUT_PERMISSIONS");
  });

  test("rejects symlinked private configuration", async () => {
    const value = fixture();
    const alias = join(value.directory, "private-config-alias.json");
    symlinkSync(value.configFile, alias);
    await expectFailure(inspectNativeRelease({ configFile: alias, appRoot: value.appRoot, manifestFile: value.manifestFile }), "NATIVE_INPUT_SYMLINK");
  });

  test("rejects hardlinked private configuration", async () => {
    const value = fixture();
    linkSync(value.configFile, join(value.directory, "private-config-hardlink.json"));
    await expectFailure(inspect(value), "NATIVE_INPUT_PERMISSIONS");
  });

  test.skipIf(process.platform === "win32")("rejects a private-config FIFO without blocking for a writer", () => {
    const value = fixture();
    rmSync(value.configFile);
    execFileSync("mkfifo", [value.configFile], { stdio: "ignore", timeout: 5_000 });
    chmodSync(value.configFile, 0o600);
    const result = runCli(value, 2_000);
    expect(Boolean(result.error)).toBe(false);
    expect(result.status).toBe(1);
    expect(result.stderr.trim()).toBe("NATIVE_INPUT_PERMISSIONS");
    expectNoPrivateOutput(`${result.stdout}${result.stderr}`, value);
  });

  test("rejects a symlinked app root", async () => {
    const value = fixture();
    const alias = join(value.directory, "app-alias");
    symlinkSync(value.appRoot, alias);
    await expectFailure(inspectNativeRelease({ configFile: value.configFile, appRoot: alias, manifestFile: value.manifestFile }), "NATIVE_RELEASE_PATH");
  });

  test("rejects hardlinked app content even when both hashes are declared", async () => {
    const value = fixture();
    restoreOwnedPermissions(value.appRoot);
    linkSync(join(value.appRoot, "package-lock.json"), join(value.appRoot, "duplicate-lock.json"));
    value.manifest.files = inventoryHashes(value.appRoot);
    writePrivateJson(value.manifestFile, value.manifest);
    sealApp(value.appRoot);
    await expectFailure(inspect(value), "NATIVE_RELEASE_FILE");
  });

  test("allows a normal npm .bin symlink to declared matching immutable content", async () => {
    const value = fixture();
    restoreOwnedPermissions(value.appRoot);
    mkdirSync(join(value.appRoot, "node_modules/.bin"), { mode: 0o700 });
    symlinkSync("../next/dist/bin/next", join(value.appRoot, "node_modules/.bin/next"));
    value.manifest.files = inventoryHashes(value.appRoot);
    value.manifest.links["node_modules/.bin/next"] = "../next/dist/bin/next";
    writePrivateJson(value.manifestFile, value.manifest);
    sealApp(value.appRoot);
    expect((await inspect(value)).summary.immutableFiles).toBe(6);
  });

  test("rejects an npm .bin symlink outside the release even when its current content hash matches", async () => {
    const value = fixture();
    const outside = join(value.directory, "outside-cli.js");
    writeFileSync(outside, "isolated-outside-cli", { mode: 0o444 });
    restoreOwnedPermissions(value.appRoot);
    mkdirSync(join(value.appRoot, "node_modules/.bin"), { mode: 0o700 });
    symlinkSync(outside, join(value.appRoot, "node_modules/.bin/next"));
    value.manifest.files = inventoryHashes(value.appRoot);
    value.manifest.links["node_modules/.bin/next"] = outside;
    writePrivateJson(value.manifestFile, value.manifest);
    sealApp(value.appRoot);
    await expectFailure(inspect(value), "NATIVE_RELEASE_SYMLINK");
  });

  test("rejects an internal .bin symlink into excluded writable cache", async () => {
    const value = fixture();
    const target = join(value.cachePath, "mutable-cli.js");
    writeFileSync(target, "isolated-mutable-cli", { mode: 0o600 });
    restoreOwnedPermissions(value.appRoot);
    mkdirSync(join(value.appRoot, "node_modules/.bin"), { mode: 0o700 });
    symlinkSync("../../.next/cache/mutable-cli.js", join(value.appRoot, "node_modules/.bin/next"));
    value.manifest.files = inventoryHashes(value.appRoot);
    value.manifest.links["node_modules/.bin/next"] = "../../.next/cache/mutable-cli.js";
    writePrivateJson(value.manifestFile, value.manifest);
    sealApp(value.appRoot);
    await expectFailure(inspect(value), "NATIVE_RELEASE_SYMLINK");
  });

  test("rejects retargeting a declared .bin link to a different declared file with identical bytes", async () => {
    const value = fixture();
    restoreOwnedPermissions(value.appRoot);
    const original = join(value.appRoot, "node_modules/next/dist/bin/next");
    const alternate = join(value.appRoot, "node_modules/next/dist/bin/next-copy");
    copyFileSync(original, alternate);
    const binDirectory = join(value.appRoot, "node_modules/.bin");
    const link = join(binDirectory, "next");
    mkdirSync(binDirectory, { mode: 0o700 });
    symlinkSync("../next/dist/bin/next", link);
    value.manifest.files = inventoryHashes(value.appRoot);
    value.manifest.links["node_modules/.bin/next"] = "../next/dist/bin/next";
    writePrivateJson(value.manifestFile, value.manifest);
    sealApp(value.appRoot);
    expect((await inspect(value)).summary.immutableFiles).toBe(7);

    chmodSync(binDirectory, 0o700);
    rmSync(link);
    symlinkSync("../next/dist/bin/next-copy", link);
    chmodSync(binDirectory, 0o555);
    expect(sha256(readFileSync(original)) === sha256(readFileSync(alternate))).toBe(true);
    expect(inventoryHashes(value.appRoot)["node_modules/.bin/next"] ===
      value.manifest.files["node_modules/.bin/next"]).toBe(true);
    await expectFailure(inspect(value), "NATIVE_RELEASE_SYMLINK");
  });

  test("rejects an actual symlink whose bytes are declared but whose target binding is missing", async () => {
    const value = fixture();
    restoreOwnedPermissions(value.appRoot);
    mkdirSync(join(value.appRoot, "node_modules/.bin"), { mode: 0o700 });
    symlinkSync("../next/dist/bin/next", join(value.appRoot, "node_modules/.bin/next"));
    value.manifest.files = inventoryHashes(value.appRoot);
    writePrivateJson(value.manifestFile, value.manifest);
    sealApp(value.appRoot);
    await expectFailure(inspect(value), "NATIVE_RELEASE_SYMLINK");
  });

  test("rejects an extra manifest link declaration when the inventoried entry is a regular file", async () => {
    const value = fixture();
    value.manifest.links["package-lock.json"] = "node_modules/next/dist/bin/next";
    writePrivateJson(value.manifestFile, value.manifest);
    await expectFailure(inspect(value), "NATIVE_RELEASE_SYMLINK");
  });

  test("preserves compatibility with an omitted links field when no symlinks exist", async () => {
    const value = fixture();
    const manifestWithoutLinks = { ...value.manifest } as Partial<typeof value.manifest>;
    delete manifestWithoutLinks.links;
    writePrivateJson(value.manifestFile, manifestWithoutLinks);
    expect((await inspect(value)).summary.immutableFiles).toBe(5);
  });

  test("rejects a CA whose bytes do not match the private configuration hash", async () => {
    const value = fixture();
    value.config.ca.sha256 = "b".repeat(64);
    writePrivateJson(value.configFile, value.config);
    await expectFailure(inspect(value), "NATIVE_CA_HASH");
  });

  test("rejects a matching-hash certificate that is not a CA", async () => {
    const value = fixture();
    writeFileSync(value.caPath, nonCaCertificate);
    value.config.ca.sha256 = sha256(nonCaCertificate);
    value.manifest.caSha256 = value.config.ca.sha256;
    writePrivateJson(value.configFile, value.config);
    writePrivateJson(value.manifestFile, value.manifest);
    await expectFailure(inspect(value), "NATIVE_CA_CERTIFICATE");
  });

  test("rejects the real fixture CA after its validity expires", async () => {
    const value = fixture();
    vi.spyOn(Date, "now").mockReturnValue(Date.parse(new X509Certificate(certificate).validTo) + 1);
    await expectFailure(inspect(value), "NATIVE_CA_CERTIFICATE");
  });

  test.each([
    ["version", 2], ["sourceCommit", "b".repeat(40)], ["nodeVersion", "v22.0.0"],
    ["nodeSha256", "b".repeat(64)], ["publicBuildFingerprint", "c".repeat(64)],
    ["caSha256", "d".repeat(64)],
  ])("rejects manifest %s binding mismatch", async (field, replacement) => {
    const value = fixture();
    writePrivateJson(value.manifestFile, { ...value.manifest, [field]: replacement });
    await expectFailure(inspect(value), "NATIVE_MANIFEST_BINDING");
  });

  test("rejects a public environment change after the producer manifest was sealed", async () => {
    const value = fixture();
    value.config.env.NEXT_PUBLIC_SUPPORT_EMAIL = "isolated-support@example.invalid";
    writePrivateJson(value.configFile, value.config);
    await expectFailure(inspect(value), "NATIVE_MANIFEST_BINDING");
  });

  test("allows writable cache content without placing it in immutable inventory", async () => {
    const value = fixture();
    writeFileSync(join(value.cachePath, "new-runtime-cache-entry"), "isolated-new-cache", { mode: 0o600 });
    expect((await inspect(value)).summary.immutableFiles).toBe(5);
    expect(Object.keys(value.manifest.files).some((path) => path.startsWith(".next/cache/"))).toBe(false);
  });

  test("preserves owner-controlled nested image cache entries", async () => {
    const value = fixture();
    const imageDirectory = join(value.cachePath, "images/isolated-image-key");
    mkdirSync(imageDirectory, { recursive: true, mode: 0o700 });
    const imagePath = join(imageDirectory, "isolated-image.bin");
    writeFileSync(imagePath, "isolated-cache-bytes", { mode: 0o600 });
    expect((await inspect(value)).summary.immutableFiles).toBe(5);
    expect(readFileSync(imagePath, "utf8") === "isolated-cache-bytes").toBe(true);
    expect(existsSync(join(value.cachePath, ".native-write-probe"))).toBe(false);
  });

  test.each(["directory", "file"])("rejects a nested image-cache %s symlink without touching its external target", async (kind) => {
    const value = fixture();
    const external = join(value.directory, "external-image-cache");
    mkdirSync(external, { mode: 0o700 });
    const externalFile = join(external, "existing-image.bin");
    writeFileSync(externalFile, "isolated-external-image-preserve", { mode: 0o600 });
    const before = sha256(readFileSync(externalFile));
    const imageDirectory = join(value.cachePath, "images");
    mkdirSync(imageDirectory, { mode: 0o700 });
    if (kind === "directory") symlinkSync(external, join(imageDirectory, "isolated-image-key"));
    else {
      const nested = join(imageDirectory, "isolated-image-key");
      mkdirSync(nested, { mode: 0o700 });
      symlinkSync(externalFile, join(nested, "isolated-image.bin"));
    }

    await expectFailure(inspect(value), "NATIVE_RELEASE_CACHE");
    expect(sha256(readFileSync(externalFile))).toBe(before);
    expect(readdirSync(external)).toEqual(["existing-image.bin"]);
    expect(existsSync(join(value.cachePath, ".native-write-probe"))).toBe(false);
  });

  test("rejects a nested cache hardlink to an outside file even with owner-only permissions", async () => {
    const value = fixture();
    const externalFile = join(value.directory, "external-image.bin");
    writeFileSync(externalFile, "isolated-external-hardlink-preserve", { mode: 0o600 });
    const imageDirectory = join(value.cachePath, "images/isolated-image-key");
    mkdirSync(imageDirectory, { recursive: true, mode: 0o700 });
    linkSync(externalFile, join(imageDirectory, "isolated-image.bin"));
    await expectFailure(inspect(value), "NATIVE_RELEASE_CACHE");
    expect(readFileSync(externalFile, "utf8") === "isolated-external-hardlink-preserve").toBe(true);
  });

  test.each(["directory", "file"])("rejects a peer-writable nested image-cache %s", async (kind) => {
    const value = fixture();
    const imageDirectory = join(value.cachePath, "images/isolated-image-key");
    mkdirSync(imageDirectory, { recursive: true, mode: 0o700 });
    const imagePath = join(imageDirectory, "isolated-image.bin");
    writeFileSync(imagePath, "isolated-cache-bytes", { mode: 0o600 });
    chmodSync(kind === "directory" ? imageDirectory : imagePath, kind === "directory" ? 0o770 : 0o660);
    await expectFailure(inspect(value), "NATIVE_RELEASE_CACHE");
    expect(existsSync(join(value.cachePath, ".native-write-probe"))).toBe(false);
  });

  test.skipIf(process.platform === "win32")("rejects a nonregular nested image-cache FIFO", async () => {
    const value = fixture();
    const imageDirectory = join(value.cachePath, "images/isolated-image-key");
    mkdirSync(imageDirectory, { recursive: true, mode: 0o700 });
    const fifo = join(imageDirectory, "isolated-image.fifo");
    execFileSync("mkfifo", [fifo], { stdio: "ignore", timeout: 5_000 });
    chmodSync(fifo, 0o600);
    await expectFailure(inspect(value), "NATIVE_RELEASE_CACHE");
    expect(existsSync(join(value.cachePath, ".native-write-probe"))).toBe(false);
  });

  test.skipIf(process.geteuid?.() === 0)("rejects a cache that the actual runtime owner cannot write", async () => {
    const value = fixture();
    chmodSync(value.cachePath, 0o500);
    await expectFailure(inspect(value));
    expect(existsSync(join(value.cachePath, ".native-write-probe"))).toBe(false);
  });

  test("does not overwrite or remove a preexisting write-probe file", async () => {
    const value = fixture();
    const probe = join(value.cachePath, ".native-write-probe");
    const contents = "isolated-preexisting-probe-preserve";
    writeFileSync(probe, contents, { mode: 0o600 });
    await expect(inspect(value)).resolves.toHaveProperty("summary.publicBuildBound", true);
    expect(readFileSync(probe, "utf8") === contents).toBe(true);
  });

  test("rejects a cache symlink before any write to its destination", async () => {
    const value = fixture();
    const outside = join(value.directory, "outside-cache");
    mkdirSync(outside, { mode: 0o700 });
    restoreOwnedPermissions(value.appRoot);
    rmSync(value.cachePath, { recursive: true });
    symlinkSync(outside, value.cachePath);
    sealApp(value.appRoot);
    await expectFailure(inspect(value), "NATIVE_RELEASE_CACHE");
    expect(readdirSync(outside)).toEqual([]);
  });

  test("malicious private config cannot echo secrets through finite CLI error output", () => {
    const value = fixture();
    value.config.env.UNREVIEWED_SECRET_ENV = secretMarker;
    writePrivateJson(value.configFile, value.config);
    const result = runCli(value);
    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr.trim()).toBe("NATIVE_CONFIG_ENVIRONMENT");
    expectNoPrivateOutput(`${result.stdout}${result.stderr}`, value);
  });
});

describe("native public-build fingerprint confidentiality", () => {
  test("binds normalized public values and ignores private changes independent of input order", () => {
    const value = fixture();
    const env = validateNativeConfig(value.config).env;
    const baseline = publicBuildFingerprint(env);
    expect(publicBuildFingerprint(Object.fromEntries(Object.entries(env).reverse()))).toBe(baseline);
    expect(publicBuildFingerprint({ ...env, DATABASE_URL: "isolated-changed-private-value",
      MUX_SIGNING_PRIVATE_KEY: "isolated-changed-private-key" })).toBe(baseline);
    expect(publicBuildFingerprint({ ...env, NEXT_PUBLIC_SUPPORT_EMAIL: "changed@example.invalid" }) === baseline).toBe(false);
    expect(/^[a-f0-9]{64}$/.test(baseline)).toBe(true);
  });
});
