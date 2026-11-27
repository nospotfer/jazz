import http, { type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { Socket } from "node:net";
import { createHash, randomBytes } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, lstatSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { performance } from "node:perf_hooks";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";

import { PRODUCTION_PROJECT_REF } from "../../scripts/native/config-policy.mjs";
import { RECONCILIATION_LIMITS, runNativeReconciliation } from "../../scripts/native/reconcile-runner.mjs";

// Production routing metadata is synthetic. Only owned Unix fixture servers
// receive requests; no Next process, database, provider or scheduler is started.
const sourceCommit = "a".repeat(40);
const runnerPath = resolve("scripts/native/reconcile-runner.mjs");
const directories: string[] = [];
const servers: Server[] = [];
const sockets = new Set<Socket>();
const ownedSockets = new Set<string>();
let certificateDirectory: string;
let certificate: Buffer;
let privateKey: string;
let forbiddenConnections = 0;
const fetchMock = vi.fn(() => { throw new Error("No provider requests in runner fixtures"); });

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

function capped<T>(promise: Promise<T>, milliseconds = 2_000) {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Owned reconciliation fixture timed out")), milliseconds);
    promise.then((value) => { clearTimeout(timer); resolve(value); }, (error) => { clearTimeout(timer); reject(error); });
  });
}

function writeJson(path: string, value: unknown) {
  writeFileSync(path, JSON.stringify(value), { mode: 0o600 });
  chmodSync(path, 0o600);
}

function state(overrides: Record<string, unknown> = {}) {
  return {
    success: true, complete: true, passComplete: true, hasMore: false, reason: null,
    usersScanned: 1, paymentsScanned: 1, unlocked: 1, failures: 0, pendingUsers: 0,
    coverage: "recent_eligible_users", state: "process_local", ...overrides,
  };
}

function partial(overrides: Record<string, unknown> = {}) {
  return state({ success: false, complete: false, passComplete: false, hasMore: true,
    reason: "incomplete", unlocked: 0, ...overrides });
}

function reply(response: ServerResponse, status: number, body: unknown) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

async function fixture(handler: (request: IncomingMessage, response: ServerResponse, attempt: number) => void) {
  const directory = mkdtempSync(join(tmpdir(), "jazz-reconcile-fixture-"));
  chmodSync(directory, 0o700); directories.push(directory);
  const appSocket = join(directory, "app.sock");
  const configFile = join(directory, "config.json");
  const planFile = join(directory, "plan.json");
  const lockFile = join(directory, "runner.lock");
  const caPath = join(directory, "ca.crt");
  const randomValue = () => randomBytes(32).toString("base64url");
  const cron = randomValue();
  const observed = { calls: 0, times: [] as number[], correctRequests: true };
  const server = http.createServer((request, response) => {
    observed.calls += 1; observed.times.push(performance.now());
    observed.correctRequests &&= request.method === "GET" && request.url === "/api/cron/payments-sweep" &&
      request.headers.host === "www.culturadeljazz.com" && request.headers.authorization === `Bearer ${cron}`;
    handler(request, response, observed.calls);
  });
  servers.push(server); ownedSockets.add(appSocket);
  server.on("connection", (socket) => { sockets.add(socket); socket.once("close", () => sockets.delete(socket)); });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject); server.listen(appSocket, () => { server.off("error", reject); resolve(); });
  });
  chmodSync(appSocket, 0o600);
  writeFileSync(lockFile, "", { mode: 0o600 });
  writeFileSync(caPath, certificate, { mode: 0o644 });
  const database = new URL(`postgresql://postgres:${randomValue()}@db.${PRODUCTION_PROJECT_REF}.supabase.co:5432/postgres`);
  for (const [name, value] of Object.entries({ sslmode: "require", sslaccept: "strict", sslcert: caPath,
    pool_timeout: "10", connect_timeout: "10" })) database.searchParams.set(name, value);
  const config = {
    version: 1, mode: "production", sourceCommit, projectRef: PRODUCTION_PROJECT_REF,
    origin: "https://www.culturadeljazz.com",
    ca: { path: caPath, sha256: createHash("sha256").update(certificate).digest("hex") },
    env: {
      APP_URL: "https://www.culturadeljazz.com", NEXT_PUBLIC_APP_URL: "https://www.culturadeljazz.com",
      NEXT_PUBLIC_SUPABASE_URL: `https://${PRODUCTION_PROJECT_REF}.supabase.co`,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: `sb_publishable_${randomValue()}`,
      SUPABASE_SERVICE_ROLE_KEY: `sb_secret_${randomValue()}`, DATABASE_URL: database.toString(),
      SUPABASE_STORAGE_BUCKET: "owned-fixture-bucket", MUX_SIGNING_KEY_ID: "owned-fixture-signing",
      MUX_SIGNING_PRIVATE_KEY: privateKey, CRON_SECRET: cron,
      DODO_ENVIRONMENT: "live_mode", DODO_PAYMENTS_API_KEY: randomValue(),
      DODO_PAYMENTS_WEBHOOK_SECRET: randomValue(), DODO_BUSINESS_ID: "owned-fixture-business",
      DODO_PRODUCT_ID: "owned-fixture-product", PROFESSOR_EMAIL: "fixture-professor@example.invalid",
      ADMIN_OWNER_EMAIL: "fixture-owner@example.invalid",
    } as Record<string, string>,
  };
  const socketStat = lstatSync(appSocket), lockStat = lstatSync(lockFile);
  const plan = {
    version: 1, enabled: true, configFile, sourceCommit, appSocket,
    socketIdentity: { dev: socketStat.dev, ino: socketStat.ino }, lockFile,
    lockIdentity: { dev: lockStat.dev, ino: lockStat.ino },
  };
  writeJson(configFile, config); writeJson(planFile, plan);
  return { directory, planFile, configFile, lockFile, appSocket, server, config, plan, observed };
}

type Fixture = Awaited<ReturnType<typeof fixture>>;
function run(value: Fixture, bounds: Partial<Record<keyof typeof RECONCILIATION_LIMITS, number>> = {}) {
  return runNativeReconciliation({ planFile: value.planFile, execute: true, bounds });
}

function noSecrets(value: Fixture, result: unknown) {
  const text = JSON.stringify(result);
  expect([privateKey, ...Object.entries(value.config.env).filter(([name]) =>
    /SECRET|PRIVATE|API_KEY|DATABASE_URL/.test(name)).map(([, secret]) => secret)]
    .every((secret) => !text.includes(secret))).toBe(true);
  expect(text.includes("https://")).toBe(false);
  expect(text.includes("postgresql:")).toBe(false);
}

async function expectRejected(operation: Promise<unknown>) {
  const accepted = await operation.then(() => true, (error: unknown) => {
    expect(error instanceof Error && /^NATIVE_RECONCILIATION_[A-Z_]+$/.test(error.message)).toBe(true);
    return false;
  });
  expect(accepted).toBe(false);
}

beforeAll(() => {
  certificateDirectory = mkdtempSync(join(tmpdir(), "jazz-reconcile-ca-")); chmodSync(certificateDirectory, 0o700);
  try {
    execFileSync("openssl", ["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "1",
      "-subj", "/CN=Isolated Runner CA", "-addext", "basicConstraints=critical,CA:TRUE",
      "-keyout", join(certificateDirectory, "key.pem"), "-out", join(certificateDirectory, "ca.crt")],
    { stdio: ["ignore", "pipe", "pipe"], timeout: 15_000 });
  } catch { throw new Error("Synthetic runner certificate creation failed"); }
  chmodSync(join(certificateDirectory, "key.pem"), 0o600);
  certificate = readFileSync(join(certificateDirectory, "ca.crt"));
  privateKey = readFileSync(join(certificateDirectory, "key.pem"), "utf8");
}, 30_000);

beforeEach(() => {
  forbiddenConnections = 0; fetchMock.mockClear(); vi.stubGlobal("fetch", fetchMock);
  const connect = Socket.prototype.connect;
  vi.spyOn(Socket.prototype, "connect").mockImplementation(function (this: Socket, ...args: unknown[]) {
    const first: unknown = Array.isArray(args[0]) ? args[0][0] : args[0];
    const path = first && typeof first === "object" ? (first as { path?: unknown }).path : first;
    if (typeof path !== "string" || !ownedSockets.has(path)) {
      forbiddenConnections += 1; throw new Error("Only owned Unix app fixtures may receive requests");
    }
    return Reflect.apply(connect, this, args);
  });
});

afterEach(async () => {
  try {
    for (const directory of directories) chmodSync(directory, 0o700);
    for (const socket of sockets) socket.destroy();
    await Promise.all(servers.map((server) => new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(new Error("Owned runner fixture cleanup failed")) : resolve());
      server.closeAllConnections();
    })));
    expect(forbiddenConnections).toBe(0); expect(fetchMock).not.toHaveBeenCalled();
  } finally {
    servers.length = 0; sockets.clear(); ownedSockets.clear(); vi.restoreAllMocks(); vi.unstubAllGlobals();
    for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true });
  }
});
afterAll(() => { if (certificateDirectory) rmSync(certificateDirectory, { recursive: true, force: true }); });

describe("disabled native reconciliation preparation", () => {
  test("defaults to a redacted disabled receipt even when the private plan is enabled", async () => {
    const value = await fixture((_request, response) => reply(response, 200, state()));
    const receipt = await runNativeReconciliation({ planFile: value.planFile });
    expect(receipt).toMatchObject({ status: "disabled", calls: 0, complete: false, productionActivationApproved: false });
    expect(value.observed.calls).toBe(0); noSecrets(value, receipt);
  });
  test("execute:true cannot bypass a disabled private plan", async () => {
    const value = await fixture((_request, response) => reply(response, 200, state()));
    value.plan.enabled = false; writeJson(value.planFile, value.plan);
    expect((await run(value)).status).toBe("disabled"); expect(value.observed.calls).toBe(0);
  });
  test("CLI has no execution flag and prints only a disabled receipt", async () => {
    const value = await fixture((_request, response) => reply(response, 200, state()));
    const options = { env: { NODE_ENV: "test" as const, PATH: dirname(process.execPath) }, encoding: "utf8" as const, timeout: 3_000 };
    const inspected = spawnSync(process.execPath, [runnerPath, "--plan", value.planFile], options);
    expect(inspected.status).toBe(0); noSecrets(value, inspected.stdout + inspected.stderr);
    expect(JSON.parse(inspected.stdout).status).toBe("disabled");
    const denied = spawnSync(process.execPath, [runnerPath, "--plan", value.planFile, "--execute"], options);
    expect(denied.status).toBe(1); expect(denied.stderr.trim()).toBe("NATIVE_RECONCILIATION_USAGE");
    expect(value.observed.calls).toBe(0);
  });
  test.each(["source", "socket", "lock", "private mode", "symlink", "nonproduction",
    "socket400", "socket000", "parent500", "lock400"])("rejects invalid %s preflight without requests", async (kind) => {
    const value = await fixture((_request, response) => reply(response, 200, state()));
    if (kind === "source") value.plan.sourceCommit = "b".repeat(40);
    if (kind === "socket") value.plan.socketIdentity.ino += 1;
    if (kind === "lock") value.plan.lockIdentity.ino += 1;
    if (kind === "private mode") chmodSync(value.planFile, 0o640);
    if (kind === "socket400") chmodSync(value.appSocket, 0o400);
    if (kind === "socket000") chmodSync(value.appSocket, 0o000);
    if (kind === "parent500") chmodSync(value.directory, 0o500);
    if (kind === "lock400") chmodSync(value.lockFile, 0o400);
    if (kind === "symlink") { rmSync(value.lockFile); symlinkSync(value.configFile, value.lockFile); }
    if (kind === "nonproduction") { value.config.mode = "preview"; writeJson(value.configFile, value.config); }
    if (kind !== "private mode") writeJson(value.planFile, value.plan);
    await expectRejected(run(value)); expect(value.observed.calls).toBe(0);
  });
  test("does not allow callers to raise any operational bound", async () => {
    const value = await fixture((_request, response) => reply(response, 200, state()));
    for (const excessive of [{ maxCalls: 21 }, { maxRunMs: 900_001 },
      { requestTimeoutMs: 75_001 }, { responseLimitBytes: 65_537 }]) {
      await expectRejected(run(value, excessive));
    }
    expect(value.observed.calls).toBe(0);
  });
});

describe("native reconciliation bounded response continuation", () => {
  test("accepts one explicit complete pass over the exact owned app endpoint", async () => {
    const value = await fixture((_request, response) => reply(response, 200, state()));
    const receipt = await run(value);
    expect(receipt).toMatchObject({ status: "complete", reason: "complete", complete: true, calls: 1, unlocked: 1 });
    expect(value.observed.correctRequests).toBe(true); noSecrets(value, receipt);
  });
  test("uses the same trimmed bearer secret as the actual sweep authorization contract", async () => {
    const value = await fixture((_request, response) => reply(response, 200, state()));
    value.config.env.CRON_SECRET = `  ${value.config.env.CRON_SECRET}  `;
    writeJson(value.configFile, value.config);
    expect((await run(value)).status).toBe("complete");
    expect(value.observed.correctRequests).toBe(true);
  });
  test.each(["incomplete", "deadline"])("continues a settled503 %s with progress after a real one-second pause", async (reason) => {
    const value = await fixture((_request, response, attempt) => reply(response, attempt === 1 ? 503 : 200,
      attempt === 1 ? partial({ reason }) : state()));
    const receipt = await run(value);
    expect(receipt).toMatchObject({ status: "complete", calls: 2, usersScanned: 2, unlocked: 1 });
    expect(value.observed.times[1] - value.observed.times[0]).toBeGreaterThanOrEqual(1_000);
  });
  test.each([
    ["pending tail", 503, partial({ passComplete: true, hasMore: false, failures: 1, pendingUsers: 1 }), "incomplete"],
    ["capacity", 503, partial({ reason: "continuation_capacity", pendingUsers: 4096 }), "continuation_capacity"],
    ["zero progress", 503, partial({ usersScanned: 0, paymentsScanned: 0, failures: 1 }), "zero_progress"],
    ["busy", 409, { success: false, complete: false, reason: "busy" }, "busy"],
    ["aborted", 499, { success: false, complete: false, reason: "aborted" }, "aborted"],
    ["settled grant followed by abort", 499, partial({ reason: "aborted", unlocked: 1, pendingUsers: 1 }), "aborted"],
    ["unauthorized", 401, { ignoredPrivateProviderBody: true }, "unauthorized"],
  ] as const)("stops %s without treating pending work as resolved or retrying", async (_label, status, body, reason) => {
    const value = await fixture((_request, response) => reply(response, status, body));
    const receipt = await run(value);
    expect(receipt).toMatchObject({ complete: false, reason, calls: 1 });
    expect(value.observed.calls).toBe(1);
    if (reason === "incomplete") expect(receipt.pendingUsers).toBe(1);
    noSecrets(value, receipt);
  });
  test.each([
    [200, partial()], [503, state()], [200, state({ pendingUsers: 1 })],
    [200, state({ usersScanned: -1 })], [200, state({ usersScanned: 501 })],
    [200, state({ usersScanned: 0 })], [503, partial({ usersScanned: 0 })],
    [503, partial({ pendingUsers: 4097 })], [200, state({ paymentsScanned: Number.MAX_SAFE_INTEGER + 1 })],
    [200, state({ complete: "true" })], [503, partial({ hasMore: false })],
    [200, state({ state: "durable" })], [503, partial({ reason: "arbitrary-private-response" })],
  ])("rejects contradictory/nonfinite response shape%i without retries", async (status, body) => {
    const value = await fixture((_request, response) => reply(response, status, body));
    expect(await run(value)).toMatchObject({ status: "uncertain", reason: "invalid_response", calls: 1, complete: false });
    expect(value.observed.calls).toBe(1);
  });
  test("enforces the call cap without an extra request", async () => {
    const value = await fixture((_request, response) => reply(response, 503, partial()));
    const receipt = await run(value, { maxCalls: 2 });
    expect(receipt).toMatchObject({ status: "incomplete", reason: "call_limit", calls: 2 });
    expect(value.observed.calls).toBe(2);
  });
  test("the default runner stops at exactly20 calls without a21st request", async () => {
    const value = await fixture((_request, response) => reply(response, 503, partial()));
    const receipt = await run(value);
    expect(receipt).toMatchObject({ status: "incomplete", reason: "call_limit", calls: 20 });
    expect(value.observed.calls).toBe(20);
  }, 30_000);
  test("does not begin another request when the overall budget cannot contain its pause and timeout", async () => {
    const value = await fixture((_request, response) => reply(response, 503, partial()));
    const receipt = await run(value, { maxRunMs: 900, requestTimeoutMs: 100 });
    expect(receipt).toMatchObject({ status: "incomplete", reason: "run_limit", calls: 1 });
    expect(value.observed.calls).toBe(1);
  });
  test("a later complete body cannot erase an earlier failed attempt", async () => {
    const value = await fixture((_request, response, attempt) => reply(response, attempt === 1 ? 503 : 200,
      attempt === 1 ? partial({ failures: 1, pendingUsers: 1 }) : state()));
    expect(await run(value)).toMatchObject({ status: "incomplete", reason: "prior_failures", complete: false, failures: 1, calls: 2 });
  });
});

describe("native reconciliation real locking and uncertain I/O", () => {
  test("flock survives acquisition-child exit, denies overlap, then releases after settled work", async () => {
    const entered = deferred<void>();
    let waiting: ServerResponse | undefined;
    const value = await fixture((_request, response, attempt) => {
      if (attempt === 1) { waiting = response; entered.resolve(); }
      else reply(response, 200, state());
    });
    const first = run(value); await capped(entered.promise);
    const overlap = await run(value);
    expect(overlap).toMatchObject({ status: "busy", reason: "lock_busy", calls: 0 });
    expect(value.observed.calls).toBe(1);
    reply(waiting!, 200, state()); expect((await first).status).toBe("complete");
    expect((await run(value)).status).toBe("complete"); expect(value.observed.calls).toBe(2);
  });
  test("replacing the pinned lock inode stops continuation before another request", async () => {
    const value: Fixture = await fixture((_request, response) => {
      rmSync(value.lockFile); writeFileSync(value.lockFile, "", { mode: 0o600 });
      reply(response, 503, partial());
    });
    const receipt = await run(value);
    expect(receipt).toMatchObject({ status: "incomplete", reason: "target_changed", calls: 1 });
    expect(value.observed.calls).toBe(1);
    await expectRejected(run(value));
    expect(value.observed.calls).toBe(1);
  });
  test("timeouts close the uncertain local request without retry or restart", async () => {
    const closed = deferred<void>();
    const value = await fixture((request) => { request.socket.once("close", () => closed.resolve()); });
    const receipt = await run(value, { requestTimeoutMs: 100 });
    await capped(closed.promise);
    expect(receipt).toMatchObject({ status: "uncertain", reason: "request_timeout", calls: 1, complete: false });
    expect(value.observed.calls).toBe(1); noSecrets(value, receipt);
  });
  test("oversized responses close after the accepted-byte cap and expose no provider body", async () => {
    const value = await fixture((_request, response) => {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(Buffer.alloc(65_537, 65));
    });
    expect(await run(value)).toMatchObject({ status: "uncertain", reason: "response_limit", calls: 1 });
    expect(value.observed.calls).toBe(1);
  });
  test("malformed response containing private configuration cannot enter receipts", async () => {
    let serializedPrivate = "";
    const value = await fixture((_request, response) => {
      response.writeHead(503, { "Content-Type": "application/json" }); response.end(serializedPrivate);
    });
    serializedPrivate = JSON.stringify(value.config.env);
    const receipt = await run(value);
    expect(receipt).toMatchObject({ status: "uncertain", reason: "invalid_response", calls: 1 });
    noSecrets(value, receipt);
  });
  test("a truncated response is uncertain and cannot be retried as a successful continuation", async () => {
    const value = await fixture((_request, response) => {
      response.writeHead(503, { "Content-Type": "application/json" });
      response.write('{"success":false,'); setImmediate(() => response.destroy());
    });
    expect(await run(value)).toMatchObject({ status: "uncertain", reason: "transport", calls: 1 });
    expect(value.observed.calls).toBe(1);
  });
  test("never follows a redirect to a foreign provider or another target", async () => {
    const value = await fixture((_request, response) => {
      response.writeHead(302, { Location: "https://provider.example.invalid/foreign", "Content-Type": "application/json" });
      response.end(JSON.stringify(partial()));
    });
    const receipt = await run(value);
    expect(receipt).toMatchObject({ status: "uncertain", reason: "invalid_response", calls: 1 });
    expect(value.observed.calls).toBe(1); noSecrets(value, receipt);
  });
});
