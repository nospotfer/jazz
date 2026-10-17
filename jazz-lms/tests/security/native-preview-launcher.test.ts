import { spawn, execFileSync, type ChildProcess } from "node:child_process";
import { createHash, generateKeyPairSync } from "node:crypto";
import {
  chmodSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync,
  readdirSync, rmSync, symlinkSync, writeFileSync,
} from "node:fs";
import http from "node:http";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from "vitest";

import { PREVIEW_PROJECT_REF, PRODUCTION_PROJECT_REF, validateNativeConfig } from "../../scripts/native/config-policy.mjs";
import { publicBuildFingerprint } from "../../scripts/native/release-inspect.mjs";
import { inspectNativePreview, startNativePreview } from "../../scripts/native/launch-preview.mjs";

const launcherPath = resolve("scripts/native/launch-preview.mjs");
const previewUsername = "synthetic-viewer";
const previewPassword = "synthetic_preview_access_".repeat(3);
const diagnosticMarker = "synthetic_raw_child_diagnostic_".repeat(2);
const runtimeMarker = "synthetic_runtime_".repeat(3);
const origin = "https://synthetic-native-launcher.trycloudflare.com";
const hostname = new URL(origin).hostname;
const fixtures: Fixture[] = [];
const controllers: Awaited<ReturnType<typeof startNativePreview>>[] = [];
const cliChildren: ChildProcess[] = [];
const cliExitPromises = new Map<ChildProcess, Promise<{ code: number | null; signal: NodeJS.Signals | null }>>();
const fetchMock = vi.fn(() => { throw new Error("Provider network is forbidden in launcher tests"); });
let certificateDirectory: string;
let certificate: Buffer;
let privateKey: string;
let nodeDigest: string;

type Fixture = {
  directory: string; appRoot: string; recordPath: string; cache: string;
  configFile: string; manifestFile: string; launchFile: string;
  plan: {
    version: number; configFile: string; appRoot: string; manifestFile: string; runDirectory: string;
    previewAccess: { username: string; password: string; expiresAt: string };
  };
};

function ownUid() {
  if (typeof process.geteuid !== "function") throw new Error("Unix launcher fixtures require UID support");
  return process.geteuid();
}

function latch() {
  let release!: () => void;
  const promise = new Promise<void>(resolveLatch => { release = resolveLatch; });
  return { promise, release };
}

let creationGate: { path: string; entered: ReturnType<typeof latch>; released: ReturnType<typeof latch> } | null = null;

// Hold only the explicitly selected owned run-directory creation. All other
// filesystem calls, child processes and Unix sockets remain actual local I/O.
vi.mock("node:fs/promises", async importOriginal => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  return { ...actual, mkdir: async (...args: unknown[]) => {
    const gate = creationGate;
    if (gate && args[0] === gate.path) { gate.entered.release(); await gate.released.promise; }
    return Reflect.apply(actual.mkdir, actual, args);
  } };
});

function digest(value: string | Buffer) { return createHash("sha256").update(value).digest("hex"); }
const pause = (milliseconds: number) => new Promise(resolvePause => setTimeout(resolvePause, milliseconds));

function privateJson(path: string, value: unknown) {
  writeFileSync(path, JSON.stringify(value), { mode: 0o600 });
  chmodSync(path, 0o600);
}

// This inspected release-local fake worker performs no Next/provider operation.
// Its only mutable outputs are synthetic PID metadata and its new run sockets.
function fakeWorker(behavior: string, recordPath: string) {
  return `
import http from 'node:http';
import { spawn } from 'node:child_process';
import { chmod, readFile, writeFile } from 'node:fs/promises';
const behavior = ${JSON.stringify(behavior)};
const recordPath = ${JSON.stringify(recordPath)};
const previewPassword = ${JSON.stringify(previewPassword)};
const previewUsername = ${JSON.stringify(previewUsername)};
const marker = ${JSON.stringify(diagnosticMarker)};
let server, message, stopping = false, ordinaryRequests = 0, grandchild;
async function metadata(pid) {
  const text = await readFile('/proc/' + pid + '/stat', 'utf8');
  const fields = text.slice(text.lastIndexOf(')') + 2).split(' ');
  return { pid, startTime: fields[19], group: Number(fields[2]), session: Number(fields[3]) };
}
async function record() {
  await writeFile(recordPath, JSON.stringify({ worker: await metadata(process.pid),
    grandchild: grandchild ? await metadata(grandchild.pid) : null }), { mode: 0o600 });
}
async function stop() {
  if (stopping) return;
  stopping = true;
  if (server?.listening) {
    server.closeAllConnections();
    await new Promise(resolveClose => server.close(resolveClose));
  }
  process.exit(0);
}
function sendReady(overrides = {}) {
  process.send?.({ type: 'ready', role: 'next', nonce: message.nonce, pid: process.pid, ...overrides });
}
process.on('SIGTERM', () => { void stop(); });
process.on('SIGINT', () => { void stop(); });
process.on('disconnect', () => { void stop(); });
process.on('message', async incoming => {
  if (incoming.type === 'stop') { void stop(); return; }
  message = incoming;
  process.umask(0o077);
  await record();
  if (behavior === 'silent') return;
  if (behavior === 'failed') {
    process.send?.({ type: 'failed', message: marker, secret: previewPassword }); return;
  }
  if (behavior === 'exit') { process.exit(7); }
  if (behavior === 'premature') { sendReady(); return; }
  if (behavior === 'grandchild') {
    grandchild = spawn(process.execPath, ['-e', "process.on('SIGTERM',()=>{});setInterval(()=>{},1000)"],
      { stdio: 'ignore', detached: false, env: { NODE_ENV: 'test' } });
    await record();
  }
  server = http.createServer((req, res) => {
    if (req.url === '/robots.txt') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(behavior === 'bad-robots' ? 'User-agent: *\\nAllow: /\\n' : 'User-agent: *\\nDisallow: /\\n'); return;
    }
    if (req.url === '/exit') {
      res.end('synthetic exit');
      setTimeout(() => { server.close(() => process.exit(0)); }, 30); return;
    }
    if (req.url === '/failed') {
      res.end('synthetic failed');
      setTimeout(() => process.send?.({ type: 'failed', message: marker }), 30); return;
    }
    if (req.url === '/duplicate-ready') {
      res.end('synthetic duplicate'); setTimeout(() => sendReady(), 30); return;
    }
    ordinaryRequests++;
    const values = Object.values(process.env);
    res.writeHead(200, { 'Content-Type': 'application/json', 'Set-Cookie': 'synthetic=session; Secure; SameSite=Lax' });
    res.end(JSON.stringify({ ordinaryRequests, authorizationPresent: req.headers.authorization !== undefined,
      basicInEnv: values.some(value => value.includes(previewPassword) || value === previewUsername),
      basicInArgv: process.argv.some(value => value.includes(previewPassword) || value === previewUsername),
      ambientInEnv: process.env.NODE_OPTIONS !== undefined || process.env.OPENREPLAY_API_KEY !== undefined,
      mode: process.env.APP_DEPLOYMENT_ENVIRONMENT, nodeEnv: process.env.NODE_ENV,
      forwardedFor: req.headers['x-forwarded-for'], host: req.headers.host,
      umask: process.umask(), grandchildPid: grandchild?.pid ?? null }));
  });
  await new Promise(resolveListen => server.listen(message.socketPath, resolveListen));
  await chmod(message.socketPath, behavior === 'wide-socket' ? 0o660 : 0o600);
  if (behavior === 'wrong-nonce') sendReady({ nonce: 'wrong-synthetic-nonce' });
  else if (behavior === 'missing-nonce') sendReady({ nonce: undefined });
  else if (behavior === 'wrong-role') sendReady({ role: 'unrelated' });
  else if (behavior === 'wrong-pid') sendReady({ pid: process.pid + 1 });
  else sendReady();
  console.log(marker, previewPassword);
  console.error(marker, previewPassword);
  process.send?.({ type: 'diagnostic', raw: marker, secret: previewPassword });
  process.send?.({ type: 'diagnostic', level: 'error', code: 'P2024', arbitrarySecret: marker });
});
`;
}

function restorePermissions(path: string) {
  const stat = lstatSync(path);
  if (stat.isSymbolicLink()) return;
  if (stat.isDirectory()) {
    chmodSync(path, 0o700);
    for (const name of readdirSync(path)) restorePermissions(join(path, name));
  } else if (stat.isFile()) chmodSync(path, 0o600);
}

function fixture(behavior = "normal", lifetimeMs = 20_000, mode: "preview" | "production" = "preview"): Fixture {
  const directory = mkdtempSync(join(tmpdir(), "jazz-native-launch-"));
  chmodSync(directory, 0o700);
  const appRoot = join(directory, "app");
  const recordPath = join(directory, "synthetic-worker-metadata.json");
  const caPath = join(directory, "synthetic-ca.crt");
  writeFileSync(caPath, certificate, { mode: 0o600 });
  const ref = mode === "preview" ? PREVIEW_PROJECT_REF : PRODUCTION_PROJECT_REF;
  const publicOrigin = mode === "preview" ? origin : "https://www.culturadeljazz.com";
  const database = new URL(`postgresql://postgres:${runtimeMarker}@db.${ref}.supabase.co:5432/postgres`);
  for (const [name, value] of Object.entries({ sslmode: "require", sslaccept: "strict", sslcert: caPath,
    pool_timeout: "10", connect_timeout: "10" })) database.searchParams.set(name, value);
  const config = {
    version: 1, mode, sourceCommit: "a".repeat(40), projectRef: ref, origin: publicOrigin,
    ca: { path: caPath, sha256: digest(certificate) },
    env: {
      APP_URL: publicOrigin, NEXT_PUBLIC_APP_URL: publicOrigin, NEXT_PUBLIC_SUPABASE_URL: `https://${ref}.supabase.co`,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: `sb_publishable_${"synthetic_launcher_".repeat(2)}`,
      SUPABASE_SERVICE_ROLE_KEY: `sb_secret_${"synthetic_launcher_".repeat(2)}`,
      DATABASE_URL: database.toString(), SUPABASE_STORAGE_BUCKET: "synthetic-private-pdfs",
      MUX_SIGNING_KEY_ID: "synthetic-launcher-signing-id", MUX_SIGNING_PRIVATE_KEY: privateKey,
      ...(mode === "production" ? {
        CRON_SECRET: "synthetic".repeat(6), DODO_ENVIRONMENT: "live_mode", DODO_PAYMENTS_API_KEY: runtimeMarker,
        DODO_PAYMENTS_WEBHOOK_SECRET: runtimeMarker, DODO_BUSINESS_ID: "synthetic-business", DODO_PRODUCT_ID: "synthetic-product",
        PROFESSOR_EMAIL: "professor@example.invalid", ADMIN_OWNER_EMAIL: "owner@example.invalid",
      } : {}),
    },
  };
  const contents: Record<string, string> = {
    "package.json": '{"name":"synthetic-native-launcher","private":true}',
    "package-lock.json": '{"name":"synthetic-native-launcher","lockfileVersion":3}',
    ".next/BUILD_ID": "synthetic-build-never-run",
    "node_modules/next/dist/bin/next": "// Synthetic CLI placeholder; never run.\n",
    "scripts/native/next-worker.mjs": fakeWorker(behavior, recordPath),
  };
  const files: Record<string, string> = {};
  for (const [path, body] of Object.entries(contents)) {
    mkdirSync(dirname(join(appRoot, path)), { recursive: true, mode: 0o700 });
    writeFileSync(join(appRoot, path), body, { mode: 0o400 });
    files[path] = digest(body);
  }
  const cache = join(appRoot, ".next/cache");
  mkdirSync(cache, { mode: 0o700 });
  writeFileSync(join(cache, "preserved-synthetic-cache"), "synthetic-existing-cache", { mode: 0o600 });
  function seal(path: string) {
    if (path === cache) return;
    if (lstatSync(path).isDirectory()) {
      for (const name of readdirSync(path)) seal(join(path, name));
      chmodSync(path, 0o500);
    }
  }
  seal(appRoot);
  const configFile = join(directory, "private-config.json");
  const manifestFile = join(directory, "private-manifest.json");
  privateJson(configFile, config);
  privateJson(manifestFile, {
    version: 1, sourceCommit: config.sourceCommit, nodeVersion: process.version, nodeSha256: nodeDigest,
    caSha256: config.ca.sha256, publicBuildFingerprint: publicBuildFingerprint(validateNativeConfig(config).env), files,
  });
  const parent = join(directory, "runs");
  mkdirSync(parent, { mode: 0o700 });
  const launchFile = join(directory, "private-launch.json");
  const plan = { version: 1, configFile, appRoot, manifestFile, runDirectory: join(parent, "current"),
    previewAccess: { username: previewUsername, password: previewPassword, expiresAt: new Date(Date.now() + lifetimeMs).toISOString() } };
  privateJson(launchFile, plan);
  const value = { directory, appRoot, recordPath, cache, configFile, manifestFile, launchFile, plan };
  fixtures.push(value);
  return value;
}

async function start(value: Fixture) {
  const controller = await startNativePreview(value.launchFile);
  controllers.push(controller);
  return controller;
}

async function expectDenied(operation: Promise<unknown>, code: string) {
  const outcome = await operation.then(() => ({ accepted: true, error: null }), (error: unknown) => ({ accepted: false, error }));
  expect(outcome.accepted).toBe(false);
  expect(outcome.error instanceof Error).toBe(true);
  expect((outcome.error as Error).message).toBe(code);
}

function request(socketPath: string, path = "/fixture", authorization: string | string[] | null = basic(), method = "GET") {
  return new Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string }>((resolveResponse, reject) => {
    const headers: http.OutgoingHttpHeaders | string[] = Array.isArray(authorization) ? [
      "Host", hostname, "X-Forwarded-Proto", "https", "CF-Connecting-IP", "203.0.113.42",
      "X-Forwarded-For", "198.51.100.99", ...authorization.flatMap(value => ["Authorization", value]),
    ] : {
      host: hostname, "x-forwarded-proto": "https", "cf-connecting-ip": "203.0.113.42",
      "x-forwarded-for": "198.51.100.99", ...(authorization === null ? {} : { authorization }),
    };
    const req = http.request({ socketPath, path, method, agent: false, headers }, res => {
      let body = "";
      res.on("data", chunk => { body += chunk.toString("utf8"); if (body.length > 8192) req.destroy(new Error("Synthetic response exceeded test bound")); });
      res.once("error", () => reject(new Error("Synthetic Unix response failed")));
      res.once("end", () => resolveResponse({ status: res.statusCode ?? 0, headers: res.headers, body }));
    });
    req.setTimeout(3000, () => req.destroy(new Error("Synthetic Unix request timed out")));
    req.once("error", () => reject(new Error("Synthetic Unix request failed")));
    req.end();
  });
}

function basic() { return `Basic ${Buffer.from(`${previewUsername}:${previewPassword}`).toString("base64")}`; }

function ownProcessState(pid: number) {
  try {
    const text = readFileSync(`/proc/${pid}/stat`, "utf8");
    const fields = text.slice(text.lastIndexOf(")") + 2).split(" ");
    return { state: fields[0], group: Number(fields[2]), session: Number(fields[3]), startTime: fields[19],
      uid: lstatSync(`/proc/${pid}`).uid };
  } catch { return null; }
}

function expectRecordedProcessesStopped(value: Fixture) {
  expect(existsSync(value.recordPath)).toBe(true);
  const record = JSON.parse(readFileSync(value.recordPath, "utf8"));
  for (const entry of [record.worker, record.grandchild]) {
    if (!entry) continue;
    const current = ownProcessState(entry.pid);
    expect(current === null || current.startTime !== entry.startTime || current.state === "Z").toBe(true);
  }
}

function terminateRecordedFixture(value: Fixture) {
  if (!existsSync(value.recordPath)) return;
  const record = JSON.parse(readFileSync(value.recordPath, "utf8"));
  for (const entry of [record.worker, record.grandchild]) {
    if (!entry) continue;
    const current = ownProcessState(entry.pid);
    if (current && current.state !== "Z" && current.uid === ownUid() && current.startTime === entry.startTime &&
      current.group === record.worker.pid && current.session === record.worker.pid) {
      try { process.kill(-record.worker.pid, "SIGKILL"); } catch { /* Already stopped. */ }
    }
  }
}

function runCli(value: Fixture) {
  const child = spawn(process.execPath, [launcherPath, "--run-preview", value.launchFile], {
    cwd: value.directory, detached: true, stdio: ["ignore", "pipe", "pipe"],
    env: { NODE_ENV: "test", PATH: `${dirname(process.execPath)}:/usr/bin:/bin`, LANG: "C" },
  });
  cliChildren.push(child);
  let output = "", received = 0;
  const collect = (chunk: Buffer) => {
    received += chunk.length;
    if (received <= 64 * 1024) output += chunk.toString("utf8");
    else child.kill("SIGTERM");
  };
  child.stdout!.on("data", collect); child.stderr!.on("data", collect);
  const exited = new Promise<{ code: number | null; signal: NodeJS.Signals | null }>(resolveExit => {
    child.once("close", (code, signal) => resolveExit({ code, signal }));
  });
  cliExitPromises.set(child, exited);
  async function ready() {
    const deadline = Date.now() + 8000;
    while (Date.now() < deadline && child.exitCode === null && child.signalCode === null) {
      for (const line of output.split("\n")) {
        try { if (JSON.parse(line)?.started === true) return; } catch { /* Wait for a complete finite receipt. */ }
      }
      await pause(20);
    }
    throw new Error("Owned synthetic CLI did not become ready");
  }
  return { child, exited, ready, output: () => output };
}

beforeAll(() => {
  certificateDirectory = mkdtempSync(join(tmpdir(), "jazz-native-launch-ca-"));
  chmodSync(certificateDirectory, 0o700);
  privateKey = generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey.export({ format: "pem", type: "pkcs8" }).toString();
  const keyPath = join(certificateDirectory, "private-key.pem");
  const caPath = join(certificateDirectory, "synthetic-ca.crt");
  writeFileSync(keyPath, privateKey, { mode: 0o600 });
  try {
    execFileSync("openssl", ["req", "-x509", "-key", keyPath, "-days", "1", "-subj", "/CN=Synthetic Native Launcher CA",
      "-addext", "basicConstraints=critical,CA:TRUE", "-addext", "keyUsage=critical,keyCertSign,cRLSign", "-out", caPath],
    { timeout: 15_000, stdio: ["ignore", "pipe", "pipe"] });
  } catch { throw new Error("Synthetic launcher CA generation failed"); }
  chmodSync(caPath, 0o600);
  certificate = readFileSync(caPath);
  nodeDigest = digest(readFileSync(process.execPath));
  vi.stubGlobal("fetch", fetchMock);
}, 20_000);

afterEach(async () => {
  creationGate?.released.release(); creationGate = null;
  for (const controller of controllers.splice(0)) await controller.close();
  for (const child of cliChildren.splice(0)) {
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGTERM");
    await Promise.race([cliExitPromises.get(child), pause(3000)]);
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
    await Promise.race([cliExitPromises.get(child), pause(1000)]);
    cliExitPromises.delete(child);
  }
  for (const value of fixtures) terminateRecordedFixture(value);
  await pause(50);
  for (const value of fixtures.splice(0)) {
    restorePermissions(value.directory);
    rmSync(value.directory, { recursive: true, force: true });
  }
  expect(fetchMock).not.toHaveBeenCalled();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
}, 20_000);

afterAll(() => {
  vi.unstubAllGlobals();
  if (certificateDirectory) rmSync(certificateDirectory, { recursive: true, force: true });
});

describe("native launcher inspected preview boundary", () => {
  test("inspection checks an immutable synthetic artifact without starting its worker or creating a run", async () => {
    const value = fixture();
    const result = await inspectNativePreview(value.launchFile);
    expect(result.summary).toMatchObject({ inspectedOnly: true, privateUnixTransport: true,
      previewGateRequired: true, providerCredentialsVerified: false, productionApproved: false });
    expect(existsSync(value.recordPath)).toBe(false);
    expect(existsSync(value.plan.runDirectory)).toBe(false);
  });

  test("production remains denied before any worker spawn or socket bind", async () => {
    const value = fixture("normal", 20_000, "production");
    await expectDenied(startNativePreview(value.launchFile), "NATIVE_PRODUCTION_START_DENIED");
    expect(existsSync(value.recordPath)).toBe(false);
    expect(existsSync(value.plan.runDirectory)).toBe(false);
  });

  test.each(["directory", "file", "symlink"])("preserves a pre-existing %s run target and refuses reuse", async (kind) => {
    const value = fixture();
    let sentinel = value.plan.runDirectory;
    if (kind === "directory") {
      mkdirSync(value.plan.runDirectory, { mode: 0o700 }); sentinel = join(value.plan.runDirectory, "preserve-me");
    } else if (kind === "symlink") {
      const target = join(value.directory, "existing-target");
      mkdirSync(target, { mode: 0o700 }); symlinkSync(target, value.plan.runDirectory); sentinel = join(target, "preserve-me");
    }
    writeFileSync(sentinel, "synthetic preserved target", { mode: 0o600 });
    await expectDenied(startNativePreview(value.launchFile), "NATIVE_RUN_EXISTS");
    expect(readFileSync(sentinel, "utf8") === "synthetic preserved target").toBe(true);
    expect(existsSync(value.recordPath)).toBe(false);
  });

  test.each([0o500, 0o750, 0o755, 0o777])("rejects an unusable or peer-accessible run parent mode %i", async (mode) => {
    const value = fixture(); chmodSync(dirname(value.plan.runDirectory), mode);
    await expectDenied(inspectNativePreview(value.launchFile), "NATIVE_RUN_PARENT");
    expect(existsSync(value.recordPath)).toBe(false);
  });

  test("rejects a symlink alias for the run parent", async () => {
    const value = fixture();
    const alias = join(value.directory, "run-alias"); symlinkSync(dirname(value.plan.runDirectory), alias);
    value.plan.runDirectory = join(alias, "new-run"); privateJson(value.launchFile, value.plan);
    await expectDenied(inspectNativePreview(value.launchFile), "NATIVE_RUN_PATH");
  });

  test.each(["past", "over-one-hour", "invalid", "noncanonical"])("rejects %s expiry before starting a worker", async (kind) => {
    const value = fixture();
    value.plan.previewAccess.expiresAt = kind === "past" ? new Date(Date.now() - 1000).toISOString() :
      kind === "over-one-hour" ? new Date(Date.now() + 3_700_000).toISOString() :
        kind === "noncanonical" ? new Date(Date.now() + 20_000).toUTCString() : "not-a-date";
    privateJson(value.launchFile, value.plan);
    await expectDenied(inspectNativePreview(value.launchFile), "NATIVE_LAUNCH_EXPIRY");
    expect(existsSync(value.recordPath)).toBe(false);
  });

  test("refuses run state inside the inspected immutable release cache", async () => {
    const value = fixture();
    value.plan.runDirectory = join(value.cache, "new-run"); privateJson(value.launchFile, value.plan);
    await expectDenied(inspectNativePreview(value.launchFile), "NATIVE_RUN_IN_RELEASE");
  });
});

describe("native preview private Unix transport and Basic gate", () => {
  test("binds owner-only sockets and keeps Basic credentials out of child argv/env and forwarded requests", async () => {
    const value = fixture();
    vi.stubEnv("OPENREPLAY_API_KEY", "synthetic-ambient-key");
    vi.stubEnv("NODE_OPTIONS", "--require /synthetic/untrusted-loader.cjs");
    const controller = await start(value);
    expect(lstatSync(value.plan.runDirectory).mode & 0o777).toBe(0o700);
    for (const path of Object.values(controller.socketPaths)) {
      expect(lstatSync(path).isSocket()).toBe(true);
      expect(lstatSync(path).uid).toBe(ownUid());
      expect(lstatSync(path).mode & 0o777).toBe(0o600);
    }
    const response = await request(controller.socketPaths.edge);
    expect(response.status).toBe(200);
    expect(JSON.parse(response.body)).toMatchObject({ authorizationPresent: false, basicInEnv: false,
      basicInArgv: false, ambientInEnv: false, mode: "preview", nodeEnv: "production",
      host: hostname, forwardedFor: "203.0.113.42", umask: 0o077 });
    expect(response.headers["set-cookie"]).toEqual(["synthetic=session; Secure; SameSite=Lax"]);
  });

  test("rejects absent, wrong, malformed and duplicate Basic credentials on all route types before upstream work", async () => {
    const value = fixture(); const controller = await start(value);
    const first = await request(controller.socketPaths.edge);
    expect(JSON.parse(first.body).ordinaryRequests).toBe(1);
    const invalid: (string | string[] | null)[] = [null, "Bearer synthetic-token", "Basic invalid-base64!",
      `Basic ${Buffer.from("wrong:synthetic-password").toString("base64")}`, [basic(), basic()]];
    for (const [index, authorization] of invalid.entries()) {
      const response = await request(controller.socketPaths.edge,
        ["/", "/api/auth/session", "/_next/static/synthetic.js", "/attachment", "/robots.txt"][index], authorization,
        index === 1 ? "POST" : "GET");
      expect(response.status).toBe(401);
      expect(response.headers["cache-control"]).toBe("no-store");
      expect(response.headers["www-authenticate"]).toContain('Basic realm="Jazz preview"');
      expect(response.headers["set-cookie"]).toBeUndefined();
    }
    const final = await request(controller.socketPaths.edge);
    expect(JSON.parse(final.body).ordinaryRequests).toBe(2);
  });

  test("a valid preview credential does not bypass public cron denial", async () => {
    const value = fixture(); const controller = await start(value);
    expect((await request(controller.socketPaths.edge, "/api/cron/payments-sweep")).status).toBe(403);
  });

  test("close is idempotent, removes only owned run state and permits a fresh restart at the same path", async () => {
    const value = fixture(); const previousUmask = process.umask();
    const first = await start(value);
    const [receipt, repeated] = await Promise.all([first.close(), first.close()]);
    expect(receipt).toMatchObject({ clean: true, stopped: true, reason: "requested" });
    expect(repeated).toEqual(receipt);
    expect(existsSync(value.plan.runDirectory)).toBe(false);
    expectRecordedProcessesStopped(value);
    expect(process.umask()).toBe(previousUmask);
    expect(readFileSync(join(value.cache, "preserved-synthetic-cache"), "utf8")).toBe("synthetic-existing-cache");
    expect(existsSync(value.configFile)).toBe(true);
    value.plan.previewAccess.expiresAt = new Date(Date.now() + 20_000).toISOString(); privateJson(value.launchFile, value.plan);
    const second = await start(value);
    await first.close();
    expect((await request(second.socketPaths.edge)).status).toBe(200);
    expect((await second.close()).clean).toBe(true);
  });

  test("unexpected extra run files are preserved and reported as an unclean stop", async () => {
    const value = fixture(); const controller = await start(value);
    const unexpected = join(value.plan.runDirectory, "preserve-unexpected-entry");
    writeFileSync(unexpected, "synthetic unexpected run entry", { mode: 0o600 });
    const receipt = await controller.close();
    expect(receipt.stopped).toBe(true); expect(receipt.clean).toBe(false);
    expect(readFileSync(unexpected, "utf8")).toBe("synthetic unexpected run entry");
    expect(existsSync(controller.socketPaths.app)).toBe(false);
    expect(existsSync(controller.socketPaths.edge)).toBe(false);
  });

  test("fixed expiry stops both private sockets and the owned worker", async () => {
    const value = fixture("normal", 1800); const controller = await start(value);
    const receipt = await controller.closed;
    expect(receipt).toMatchObject({ stopped: true, clean: true, reason: "expiry" });
    expect(existsSync(value.plan.runDirectory)).toBe(false);
    const record = JSON.parse(readFileSync(value.recordPath, "utf8"));
    expect(ownProcessState(record.worker.pid)?.state ?? "Z").toBe("Z");
  }, 8000);
});

describe("native launcher owned child IPC and readiness failures", () => {
  test.each(["wrong-nonce", "missing-nonce", "wrong-role", "wrong-pid"])("rejects %s readiness and cleans owned startup state", async (behavior) => {
    const value = fixture(behavior);
    await expectDenied(startNativePreview(value.launchFile), "NATIVE_CHILD_READINESS");
    expect(existsSync(value.plan.runDirectory)).toBe(false);
    expectRecordedProcessesStopped(value);
  });

  test.each([
    ["premature", "NATIVE_PREVIEW_START_FAILED"], ["wide-socket", "NATIVE_READY_SOCKET"],
    ["failed", "NATIVE_CHILD_START"], ["exit", "NATIVE_CHILD_EXIT"], ["bad-robots", "NATIVE_READY_PROBE"],
  ])("rejects %s startup rather than reporting a healthy private runtime", async (behavior, code) => {
    const value = fixture(behavior);
    await expectDenied(startNativePreview(value.launchFile), code);
    expect(existsSync(value.plan.runDirectory)).toBe(false);
    expectRecordedProcessesStopped(value);
  });

  test("missing readiness cannot keep a worker alive beyond the preview deadline", async () => {
    const value = fixture("silent", 1400);
    await expectDenied(startNativePreview(value.launchFile), "NATIVE_START_STOPPED");
    expect(existsSync(value.plan.runDirectory)).toBe(false);
    expectRecordedProcessesStopped(value);
  }, 8000);

  test("duplicate readiness after startup closes the owned runtime", async () => {
    const value = fixture(); const controller = await start(value);
    await request(controller.socketPaths.edge, "/duplicate-ready");
    expect(await controller.closed).toMatchObject({ stopped: true, clean: true, reason: "startup_failure" });
    expectRecordedProcessesStopped(value);
  });

  test("explicit worker failure after readiness closes the runtime", async () => {
    const value = fixture(); const controller = await start(value);
    await request(controller.socketPaths.edge, "/failed");
    const result = await Promise.race([controller.closed, pause(1000).then(() => null)]);
    expect(result !== null).toBe(true);
    expect(result).toMatchObject({ stopped: true, reason: "startup_failure" });
    expectRecordedProcessesStopped(value);
  });

  test("a dead worker leader does not leave its live grandchild behind", async () => {
    const value = fixture("grandchild", 30_000); const controller = await start(value);
    const before = JSON.parse((await request(controller.socketPaths.edge)).body);
    expect(Number.isSafeInteger(before.grandchildPid)).toBe(true);
    expect(ownProcessState(before.grandchildPid)?.state === "Z").toBe(false);
    await request(controller.socketPaths.edge, "/exit");
    expect(await controller.closed).toMatchObject({ stopped: true, clean: true, reason: "child_exit" });
    expect(ownProcessState(before.grandchildPid)?.state ?? "Z").toBe("Z");
    expect(existsSync(value.plan.runDirectory)).toBe(false);
    expectRecordedProcessesStopped(value);
  }, 20_000);
});

describe("native launcher owned CLI signals and finite output", () => {
  test.each(["SIGTERM", "SIGINT"] as const)("handles %s only on its owned CLI and never prints child stdout/IPC credentials", async (signal) => {
    const value = fixture(); const cli = runCli(value);
    await cli.ready();
    expect((await request(join(value.plan.runDirectory, "edge.sock"))).status).toBe(200);
    cli.child.kill(signal);
    const exit = await cli.exited;
    expect(exit.code).toBe(0);
    const output = cli.output();
    expect([previewPassword, diagnosticMarker, runtimeMarker, privateKey].every(secret => !output.includes(secret))).toBe(true);
    expect(output.includes("BEGIN PRIVATE KEY")).toBe(false);
    const lines = output.trim().split("\n").map(line => JSON.parse(line));
    expect(lines.length).toBe(2);
    expect(lines[0]).toMatchObject({ started: true, socketsPrivate: true, productionApproved: false });
    expect(lines[1]).toMatchObject({ stopped: true, clean: true, reason: "signal", diagnostics: { error: 1, warn: 0 } });
    expect(existsSync(value.plan.runDirectory)).toBe(false);
    expectRecordedProcessesStopped(value);
  }, 12_000);
});

describe("native launcher cancellation waits for owned resource creation", () => {
  test("a stop during held run mkdir cleans its late-created directory without spawning a worker", async () => {
    const value = fixture();
    const beforeSignals = process.listeners("SIGTERM");
    const gate = { path: value.plan.runDirectory, entered: latch(), released: latch() };
    creationGate = gate;
    const startup = start(value);
    const denied = expectDenied(startup, "NATIVE_START_STOPPED");
    try {
      await gate.entered.promise;
      const added = process.listeners("SIGTERM").filter(listener => !beforeSignals.includes(listener));
      expect(added.length).toBe(1);
      added[0]("SIGTERM"); // Invoke only the launcher's own callback, never signal Vitest.
      expect(existsSync(value.plan.runDirectory)).toBe(false);
      gate.released.release();
      await denied;
      expect(existsSync(value.plan.runDirectory)).toBe(false);
      expect(existsSync(value.recordPath)).toBe(false);
      expect(existsSync(value.configFile)).toBe(true);
    } finally {
      gate.released.release(); creationGate = null;
      await startup.catch(() => {});
    }
  }, 10_000);

  test("a stop during held edge listen waits for the new socket identity and removes only its owned run", async () => {
    const value = fixture();
    const beforeSignals = process.listeners("SIGTERM");
    const entered = latch(), released = latch();
    const expectedSocket = join(value.plan.runDirectory, "edge.sock");
    const originalListen = http.Server.prototype.listen;
    let held = false;
    vi.spyOn(http.Server.prototype, "listen").mockImplementation(function (this: http.Server, ...args: unknown[]) {
      if (args[0] === expectedSocket && !held) {
        held = true; entered.release();
        void released.promise.then(() => {
          try { Reflect.apply(originalListen, this, args); }
          catch { this.emit("error", new Error("Synthetic held socket listen failed")); }
        });
        return this;
      }
      return Reflect.apply(originalListen, this, args);
    });
    const startup = start(value);
    const denied = expectDenied(startup, "NATIVE_START_STOPPED");
    try {
      await entered.promise;
      const added = process.listeners("SIGTERM").filter(listener => !beforeSignals.includes(listener));
      expect(added.length).toBe(1);
      added[0]("SIGTERM");
      expect(existsSync(expectedSocket)).toBe(false);
      released.release(); await denied;
      expect(existsSync(value.plan.runDirectory)).toBe(false);
      expect(readFileSync(join(value.cache, "preserved-synthetic-cache"), "utf8")).toBe("synthetic-existing-cache");
    } finally {
      released.release(); await startup.catch(() => {});
    }
  }, 12_000);
});
