import http, { type IncomingHttpHeaders, type OutgoingHttpHeaders, type Server } from "node:http";
import { Socket } from "node:net";
import { randomBytes } from "node:crypto";
import { chmodSync, lstatSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createIngressServer } from "../../scripts/native/ingress-server.mjs";
import { evaluateIngressRequest } from "../../scripts/native/ingress-policy.mjs";

// A Worker header alone is never authority. These owned Unix tests prove only
// the leased preview exception; actual Quick Tunnel evidence belongs elsewhere.
const policy = { canonicalHost: "isolated-jazz-preview.trycloudflare.com" };
const directories: string[] = [];
const servers: Server[] = [];
const sockets = new Set<Socket>();
const ownedPaths = new Set<string>();
let forbiddenConnections = 0;

function directory() {
  const path = mkdtempSync(join(tmpdir(), "jazz-quick-worker-"));
  chmodSync(path, 0o700); directories.push(path);
  return path;
}
function previewAccess() {
  return { username: ["fixture", "viewer"].join("-"), password: randomBytes(24).toString("base64url"),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() };
}
function basic(access: ReturnType<typeof previewAccess>) {
  return `Basic ${Buffer.from(`${access.username}:${access.password}`).toString("base64")}`;
}
async function listen(server: Server, path: string) {
  servers.push(server); ownedPaths.add(path);
  server.on("connection", (socket) => { sockets.add(socket); socket.once("close", () => sockets.delete(socket)); });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject); server.listen(path, () => { server.off("error", reject); resolve(); });
  });
  chmodSync(path, 0o600);
  expect(server.address()).toBe(path);
  expect((lstatSync(path).mode & 0o777) === 0o600).toBe(true);
}
async function fixture(flag?: boolean, leased = true) {
  const root = directory();
  const upstreamPath = join(root, "app.sock"), ingressPath = join(root, "ingress.sock");
  const observed = { requests: 0, connections: 0, headers: {} as IncomingHttpHeaders, body: Buffer.alloc(0) };
  const upstream = http.createServer((request, response) => {
    observed.requests += 1; observed.headers = request.headers;
    const chunks: Buffer[] = [];
    request.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    request.once("end", () => { observed.body = Buffer.concat(chunks); response.end("isolated-worker-response"); });
  });
  upstream.on("connection", () => { observed.connections += 1; });
  await listen(upstream, upstreamPath);
  const access = previewAccess();
  const ingress = createIngressServer({ upstreamSocket: upstreamPath, policy,
    ...(leased ? { previewAccess: access } : {}), allowPreviewWorkerTransport: flag });
  await listen(ingress, ingressPath);
  return { root, access, ingressPath, observed };
}
type Fixture = Awaited<ReturnType<typeof fixture>>;

function request(value: Fixture, headers: OutgoingHttpHeaders = {}, body?: Buffer) {
  return new Promise<{ status: number; headers: IncomingHttpHeaders; body: Buffer }>((resolve, reject) => {
    const client = http.request({ socketPath: value.ingressPath, agent: false,
      path: "/dashboard", method: body ? "POST" : "GET",
      headers: Object.fromEntries(Object.entries({
        host: policy.canonicalHost, "x-forwarded-proto": "https", "cf-connecting-ip": "::ffff:203.0.113.9",
        "cf-worker": "isolated-worker.example.invalid", authorization: basic(value.access), ...headers,
      }).filter(([, value]) => value !== undefined)),
    }, (response) => {
      const chunks: Buffer[] = [];
      response.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      response.once("error", () => { clearTimeout(timer); reject(new Error("Owned Quick fixture response failed")); });
      response.once("end", () => {
        clearTimeout(timer); resolve({ status: response.statusCode ?? 0, headers: response.headers, body: Buffer.concat(chunks) });
      });
    });
    const timer = setTimeout(() => { client.destroy(); reject(new Error("Owned Quick fixture timed out")); }, 2_000);
    client.on("error", () => { clearTimeout(timer); reject(new Error("Owned Quick fixture request failed")); });
    client.end(body);
  });
}

beforeEach(() => {
  forbiddenConnections = 0;
  const connect = Socket.prototype.connect;
  vi.spyOn(Socket.prototype, "connect").mockImplementation(function (this: Socket, ...args: unknown[]) {
    const first: unknown = Array.isArray(args[0]) ? args[0][0] : args[0];
    const path = typeof first === "string" ? first : first && typeof first === "object" ? (first as { path?: unknown }).path : undefined;
    if (typeof path !== "string" || !ownedPaths.has(path)) {
      forbiddenConnections += 1; throw new Error("Only owned Unix Quick fixtures are allowed");
    }
    return Reflect.apply(connect, this, args);
  });
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("No providers in Quick fixtures"); }));
});
afterEach(async () => {
  try {
    for (const socket of sockets) socket.destroy();
    await Promise.all(servers.map((server) => new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(new Error("Owned Quick fixture cleanup failed")) : resolve());
      server.closeAllConnections();
    })));
    expect(forbiddenConnections).toBe(0); expect(fetch).not.toHaveBeenCalled();
  } finally {
    servers.length = 0; sockets.clear(); ownedPaths.clear(); vi.restoreAllMocks(); vi.unstubAllGlobals();
    for (const path of directories.splice(0)) rmSync(path, { recursive: true, force: true });
  }
});

describe("explicit leased Quick Worker transport", () => {
  test.each([null, "true", 1, [], {}])("rejects a nonboolean flag %j before binding", (flag) => {
    const options = { upstreamSocket: join(directory(), "app.sock"), policy,
      previewAccess: previewAccess(), allowPreviewWorkerTransport: flag };
    expect(() => createIngressServer(options as Parameters<typeof createIngressServer>[0])).toThrow(/configuration/);
    expect(servers).toHaveLength(0);
  });
  test("true cannot be enabled without a valid leased Basic gate", () => {
    expect(() => createIngressServer({ upstreamSocket: join(directory(), "app.sock"), policy,
      allowPreviewWorkerTransport: true })).toThrow(/configuration/);
    expect(servers).toHaveLength(0);
  });
  test.each([undefined, false])("the default/false flag still denies Worker browsing despite valid Basic: %j", async (flag) => {
    const value = await fixture(flag);
    expect((await request(value)).status).toBe(403);
    expect(value.observed.requests).toBe(0); expect(value.observed.connections).toBe(0);
  });
  test("enabled valid Basic consumes transport auth and forwards canonical identity without Worker metadata", async () => {
    const value = await fixture(true);
    const cookie = "owned_fixture=isolated; locale=fr";
    const signature = randomBytes(24).toString("base64url");
    const body = Buffer.from('{\r\n"fixture":"jazz á 🎷", "spacing":"  "\r\n}\r\n');
    const reply = await request(value, {
      cookie, origin: `https://${policy.canonicalHost}`, "content-type": "application/json",
      "webhook-signature": signature, forwarded: "for=198.51.100.4;proto=http",
      "x-forwarded-for": "198.51.100.5", "x-real-ip": "198.51.100.6",
    }, body);
    expect(reply.status).toBe(200);
    expect(value.observed.requests).toBe(1); expect(value.observed.connections).toBe(1);
    const headers = value.observed.headers;
    for (const name of ["cf-worker", "cf-connecting-ip", "forwarded", "authorization"]) expect(headers[name]).toBeUndefined();
    expect(headers["x-forwarded-for"]).toBe("203.0.113.9");
    expect(headers["x-real-ip"]).toBe("203.0.113.9");
    expect(headers["x-forwarded-proto"]).toBe("https");
    expect(headers.host).toBe(policy.canonicalHost); expect(headers["x-forwarded-host"]).toBe(policy.canonicalHost);
    expect(headers.cookie === cookie).toBe(true); expect(headers["webhook-signature"] === signature).toBe(true);
    expect(headers.origin).toBe(`https://${policy.canonicalHost}`);
    expect(value.observed.body.equals(body)).toBe(true);
    expect(reply.headers["cache-control"]).toBe("private, no-store, max-age=0");
  });
  test.each(["missing", "wrong"])("the Worker exception never bypasses %s Basic authentication", async (kind) => {
    const value = await fixture(true);
    const authorization = kind === "missing" ? undefined : basic({ ...value.access, password: randomBytes(24).toString("base64url") });
    expect((await request(value, { authorization })).status).toBe(401);
    expect(value.observed.requests).toBe(0); expect(value.observed.connections).toBe(0);
  });
  test("enabled Worker transport remains bounded by the fixed lease expiry", async () => {
    const value = await fixture(true);
    vi.spyOn(Date, "now").mockReturnValue(Date.parse(value.access.expiresAt));
    expect((await request(value)).status).toBe(410);
    expect(value.observed.requests).toBe(0); expect(value.observed.connections).toBe(0);
  });
  test.each(["cf-pseudo-ipv4", "cf-connecting-ipv6"])("enabling Worker transport does not enable unsupported %s", async (name) => {
    const value = await fixture(true);
    expect((await request(value, { [name]: "2001:db8::1" })).status).toBe(403);
    expect(value.observed.requests).toBe(0); expect(value.observed.connections).toBe(0);
  });
  test.each([
    { "cf-connecting-ip": undefined }, { "cf-connecting-ip": "invalid" },
    { "x-forwarded-proto": "http" }, { "x-forwarded-host": "foreign.example.invalid" },
  ])("the authenticated exception retains normal host/protocol/IP checks: %j", async (headers) => {
    const value = await fixture(true);
    expect((await request(value, headers)).status).toBeGreaterThanOrEqual(400);
    expect(value.observed.requests).toBe(0); expect(value.observed.connections).toBe(0);
  });
  test("the unleased factory still rejects ordinary Worker traffic", async () => {
    const value = await fixture(undefined, false);
    expect((await request(value, { authorization: undefined })).status).toBe(403);
    expect(value.observed.requests).toBe(0); expect(value.observed.connections).toBe(0);
  });
  test("ordinary TCP factory and shared production policy do not acquire the preview exception", () => {
    const productionPolicy = { canonicalHost: "www.culturadeljazz.com", apexHost: "culturadeljazz.com" };
    const server = createIngressServer({ upstreamPort: 12345, policy: productionPolicy });
    expect(server.listening).toBe(false);
    expect(evaluateIngressRequest({ method: "GET", target: "/dashboard", headers: {
      host: productionPolicy.canonicalHost, "x-forwarded-proto": "https", "cf-connecting-ip": "203.0.113.9",
      "cf-worker": "isolated-worker.example.invalid",
    } }, productionPolicy)).toMatchObject({ action: "deny", status: 403 });
    expect(servers).toHaveLength(0);
  });
});
