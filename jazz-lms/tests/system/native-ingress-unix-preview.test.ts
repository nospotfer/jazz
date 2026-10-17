import http, {
  type ClientRequest, type IncomingHttpHeaders, type IncomingMessage,
  type OutgoingHttpHeaders, type Server, type ServerResponse,
} from "node:http";
import { createHmac, randomBytes } from "node:crypto";
import { chmodSync, lstatSync, mkdtempSync, rmSync } from "node:fs";
import { Socket } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { createIngressServer } from "../../scripts/native/ingress-server.mjs";

// Actual HTTP over private, owned Unix sockets only. No Next process, tunnel,
// provider, TCP listener or credential/environment file participates.
const policy = { canonicalHost: "www.culturadeljazz.com", apexHost: "culturadeljazz.com" };
const edgeHeaders = {
  host: policy.canonicalHost,
  "x-forwarded-proto": "https",
  "cf-connecting-ip": "203.0.113.9",
};
type PreviewAccess = { username: string; password: string; expiresAt: string };
type Limits = {
  requestBodyLimitBytes?: number;
  webhookBodyLimitBytes?: number;
  requestBodyTimeoutMs?: number;
  upstreamTimeoutMs?: number;
};
type Reply = { status: number; headers: IncomingHttpHeaders; body: Buffer };
type UpstreamHandler = (request: IncomingMessage, response: ServerResponse) => void;
type ClientOptions = {
  method?: string; path?: string; headers?: OutgoingHttpHeaders;
  body?: Buffer; send?: (request: ClientRequest) => void;
};

const directories: string[] = [];
const servers: Server[] = [];
const ownedPaths = new Set<string>();
const sockets = new Set<Socket>();
const clients = new Set<ClientRequest>();
const connections: string[] = [];
let unexpectedConnections = 0;

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

function deadline<T>(promise: Promise<T>, milliseconds = 2_000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Owned Unix fixture timed out")), milliseconds);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (error) => { clearTimeout(timer); reject(error); },
    );
  });
}

function ownedDirectory() {
  const directory = mkdtempSync(join(tmpdir(), "jazz-unix-preview-"));
  chmodSync(directory, 0o700);
  directories.push(directory);
  return directory;
}

function access(): PreviewAccess {
  return {
    username: ["fixture", "viewer"].join("-"),
    password: randomBytes(24).toString("base64url"),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  };
}

function basic(value: PreviewAccess) {
  return `Basic ${Buffer.from(`${value.username}:${value.password}`).toString("base64")}`;
}

function expectPrivatePreviewCache(headers: IncomingHttpHeaders) {
  expect(headers["cache-control"]).toBe("private, no-store, max-age=0");
  expect(headers["cdn-cache-control"]).toBe("no-store");
  expect(headers["cloudflare-cdn-cache-control"]).toBe("no-store");
  expect(headers["surrogate-control"]).toBeUndefined();
  expect(headers["surrogate-key"]).toBeUndefined();
}

async function listen(server: Server, path: string) {
  ownedPaths.add(path);
  servers.push(server);
  server.on("connection", (socket) => {
    sockets.add(socket);
    socket.once("close", () => sockets.delete(socket));
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(path, () => { server.off("error", reject); resolve(); });
  });
  chmodSync(path, 0o600);
  expect(server.address()).toBe(path);
  expect(lstatSync(path).isSocket()).toBe(true);
  expect((lstatSync(path).mode & 0o077) === 0).toBe(true);
}

async function fixture(handler: UpstreamHandler, limits: Limits = {}, missingUpstream = false) {
  const directory = ownedDirectory();
  const upstreamPath = join(directory, "upstream.sock");
  const ingressPath = join(directory, "ingress.sock");
  const counts = { requests: 0, connections: 0 };
  const upstream = http.createServer((request, response) => {
    counts.requests += 1;
    handler(request, response);
  });
  if (missingUpstream) ownedPaths.add(upstreamPath);
  else {
    upstream.on("connection", () => { counts.connections += 1; });
    await listen(upstream, upstreamPath);
  }
  const previewAccess = access();
  const ingress = createIngressServer({ upstreamSocket: upstreamPath, policy, previewAccess, ...limits });
  expect(ingress.listening).toBe(false);
  await listen(ingress, ingressPath);
  return { directory, upstreamPath, ingressPath, ingress, upstream, previewAccess, counts };
}

type Fixture = Awaited<ReturnType<typeof fixture>>;

function begin(value: Fixture, options: ClientOptions, listener: (response: IncomingMessage) => void) {
  if (!ownedPaths.has(value.ingressPath)) throw new Error("Unowned Unix request blocked");
  const headers = Object.fromEntries(Object.entries({
    ...edgeHeaders, authorization: basic(value.previewAccess), ...options.headers,
  }).filter(([, header]) => header !== undefined));
  const client = http.request({
    socketPath: value.ingressPath, agent: false,
    method: options.method ?? "GET", path: options.path ?? "/dashboard",
    headers,
  }, listener);
  clients.add(client);
  client.once("close", () => clients.delete(client));
  client.on("error", () => {});
  return client;
}

function request(value: Fixture, options: ClientOptions = {}): Promise<Reply> {
  return deadline(new Promise((resolve, reject) => {
    const client = begin(value, options, (response) => {
      const chunks: Buffer[] = [];
      response.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      response.once("error", () => reject(new Error("Owned Unix response failed")));
      response.once("end", () => resolve({
        status: response.statusCode ?? 0, headers: response.headers, body: Buffer.concat(chunks),
      }));
    });
    client.once("error", () => reject(new Error("Owned Unix request failed")));
    if (options.send) options.send(client);
    else client.end(options.body);
  }));
}

async function bodyOf(request: IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

beforeEach(() => {
  expect(process.versions.node.split(".")[0]).toBe("24");
  unexpectedConnections = 0;
  const connect = Socket.prototype.connect;
  vi.spyOn(Socket.prototype, "connect").mockImplementation(function (this: Socket, ...args: unknown[]) {
    const first: unknown = Array.isArray(args[0]) ? args[0][0] : args[0];
    const path = typeof first === "string" ? first :
      first && typeof first === "object" ? (first as { path?: unknown }).path : undefined;
    if (typeof path !== "string" || !ownedPaths.has(path)) {
      unexpectedConnections += 1;
      throw new Error("Connections outside owned Unix fixtures are forbidden");
    }
    connections.push(path);
    return Reflect.apply(connect, this, args);
  });
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("Provider requests are forbidden"); }));
});

afterEach(async () => {
  try {
    for (const client of clients) client.destroy();
    for (const socket of sockets) socket.destroy();
    await Promise.all(servers.map((server) => new Promise<void>((resolve, reject) => {
      if (!server.listening) { resolve(); return; }
      server.close((error) => error ? reject(new Error("Owned Unix cleanup failed")) : resolve());
      server.closeAllConnections();
    })));
    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(servers.every((server) => !server.listening)).toBe(true);
    expect(unexpectedConnections).toBe(0);
    expect(fetch).not.toHaveBeenCalled();
  } finally {
    servers.length = 0;
    sockets.clear();
    clients.clear();
    ownedPaths.clear();
    connections.length = 0;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true });
  }
});

describe("native ingress Unix transport selection", () => {
  test.each([
    ["missing transport", () => ({})],
    ["ambiguous port and socket", (path: string) => ({ upstreamSocket: path, upstreamPort: 12345 })],
    ["relative socket", () => ({ upstreamSocket: "relative.sock" })],
    ["empty socket", () => ({ upstreamSocket: "" })],
    ["nonnormalized socket", (path: string) => ({ upstreamSocket: `${path}/../other.sock` })],
    ["control-bearing socket", (path: string) => ({ upstreamSocket: `${path}\n` })],
    ["oversized socket", (path: string) => ({ upstreamSocket: `${path}${"a".repeat(101)}` })],
  ] as const)("rejects %s without connecting or starting a listener", (_label, options) => {
    const path = join(ownedDirectory(), "upstream.sock");
    expect(() => createIngressServer({ policy, ...options(path) })).toThrow(/configuration/);
    expect(connections).toHaveLength(0);
    expect(servers).toHaveLength(0);
  });

  test("an unavailable configured Unix backend returns502 without any TCP fallback", async () => {
    const value = await fixture((_incoming, response) => response.end(), {}, true);
    const reply = await request(value);
    expect(reply.status).toBe(502);
    expect(reply.body.toString()).toBe("Servicio temporalmente no disponible.");
    expect(connections).toEqual([value.ingressPath, value.upstreamPath]);
    expect(value.counts).toEqual({ requests: 0, connections: 0 });
    expect(reply.body.includes(basic(value.previewAccess))).toBe(false);
  });
});

describe("native preview authentication before routing and body work", () => {
  test.each([
    ["GET", "/", policy.apexHost],
    ["HEAD", "/_next/static/fixture.js", policy.canonicalHost],
    ["POST", "/api/webhooks/dodo-jazzlms", policy.apexHost],
    ["PUT", "/api/dashboard/notes", policy.canonicalHost],
    ["PATCH", "/api/admin/fixture", policy.canonicalHost],
    ["DELETE", "/api/purchases", policy.apexHost],
    ["OPTIONS", "/api/auth/session", policy.canonicalHost],
    ["TRACE", "/dashboard", policy.canonicalHost],
    ["GET", "/api/cron/payments-sweep", policy.canonicalHost],
  ])("requires Basic before route decisions on %s %s", async (method, path, host) => {
    const value = await fixture((_incoming, response) => response.end("must not forward"));
    const reply = await request(value, { method, path, headers: { host, authorization: undefined } });
    expect(reply.status).toBe(401);
    expect(reply.headers["www-authenticate"]).toMatch(/^Basic /);
    expect(reply.headers.location).toBeUndefined();
    expect(reply.headers["cache-control"]).toBe("no-store");
    expect(value.counts).toEqual({ requests: 0, connections: 0 });
    expect(connections).toEqual([value.ingressPath]);
  });

  test("denies unauthenticated unfinished oversized uploads before reading or waiting for the body", async () => {
    const value = await fixture((_incoming, response) => response.end(), {
      requestBodyLimitBytes: 8, requestBodyTimeoutMs: 40,
    });
    const reply = await request(value, {
      method: "POST", path: "/api/auth/session",
      headers: { authorization: undefined, "content-length": "1000000000" },
      send: (client) => { client.flushHeaders(); },
    });
    expect(reply.status).toBe(401);
    expect(value.counts).toEqual({ requests: 0, connections: 0 });
  });

  test.each([
    ["wrong user", (value: PreviewAccess) => basic({ ...value, username: "other-viewer" })],
    ["wrong password", (value: PreviewAccess) => basic({ ...value, password: randomBytes(24).toString("base64url") })],
    ["wrong scheme", () => `Bearer ${randomBytes(24).toString("base64url")}`],
    ["invalid base64", () => "Basic !!!"],
    ["missing padding", (value: PreviewAccess) => basic(value).replace(/=+$/, "")],
    ["extra padding", (value: PreviewAccess) => `${basic(value)}=`],
    ["multiple values", (value: PreviewAccess) => `${basic(value)}, ${basic(value)}`],
    ["duplicate field", (value: PreviewAccess) => [basic(value), basic(value)]],
  ] as const)("rejects %s authentication without any upstream connection", async (_label, authorization) => {
    const value = await fixture((_incoming, response) => response.end());
    const reply = await request(value, {
      method: "POST", path: "/api/webhooks/messages-email",
      // HTTP permits emitting repeated fields; Node's named Authorization
      // declaration is narrower than this deliberate malformed-wire fixture.
      headers: Object.fromEntries([["authorization", authorization(value.previewAccess)]]),
      body: Buffer.from("isolated-unforwarded-body"),
    });
    expect(reply.status).toBe(401);
    expect(value.counts).toEqual({ requests: 0, connections: 0 });
    expect(connections).toEqual([value.ingressPath]);
  });

  test("permits an authenticated apex redirect to the fixed canonical URL without upstream I/O", async () => {
    const value = await fixture((_incoming, response) => response.end());
    const target = "/dashboard?lang=fr&course=fixture";
    const reply = await request(value, { path: target, headers: { host: policy.apexHost } });
    expect(reply.status).toBe(308);
    expect(reply.headers.location).toBe(`https://${policy.canonicalHost}${target}`);
    expect(value.counts).toEqual({ requests: 0, connections: 0 });
  });

  test("expires the preview with410 even when previously valid credentials are presented", async () => {
    const value = await fixture((_incoming, response) => response.end("isolated-success"));
    expect((await request(value)).status).toBe(200);
    vi.spyOn(Date, "now").mockReturnValue(Date.parse(value.previewAccess.expiresAt));
    const reply = await request(value);
    expect(reply.status).toBe(410);
    expect(reply.headers["www-authenticate"]).toBeUndefined();
    expect(reply.headers["cache-control"]).toBe("no-store");
    expect(value.counts.requests).toBe(1);
    expect(value.counts.connections).toBe(1);
  });

  test("an authenticated upload crossing the fixed lease deadline returns410 without opening the backend", async () => {
    const value = await fixture((_incoming, response) => response.end());
    const expiry = Date.parse(value.previewAccess.expiresAt);
    const clock = vi.spyOn(Date, "now").mockReturnValue(expiry - 150);
    const readingBody = deferred<void>();
    value.ingress.once("request", () => readingBody.resolve());
    const body = Buffer.from("isolated-delayed-upload");
    let client!: ClientRequest;
    const completed = request(value, {
      method: "POST", path: "/api/dashboard/notes", headers: { "content-length": String(body.length) },
      send: (request) => {
        client = request;
        request.flushHeaders();
        request.write(body.subarray(0, 3));
      },
    });
    await deadline(readingBody.promise);
    clock.mockReturnValue(expiry);
    client.end(body.subarray(3));
    const reply = await completed;
    expect(reply.status).toBe(410);
    expect(value.counts).toEqual({ requests: 0, connections: 0 });
    expect(connections).toEqual([value.ingressPath]);
  });
});

describe("native preview authenticated Unix forwarding", () => {
  test.each([
    [policy.canonicalHost, "/api/webhooks/dodo-jazzlms", "webhook"],
    [policy.apexHost, "/api/webhooks/dodo-jazzlms", "webhook"],
    [policy.canonicalHost, "/api/webhooks/messages-email", "svix"],
    [policy.apexHost, "/api/webhooks/messages-email", "svix"],
  ])("consumes gate Basic while preserving signed raw bytes and app headers on %s%s", async (host, path, prefix) => {
    const signingKey = randomBytes(32);
    const body = Buffer.from('{\r\n  "fixture": "jazz á 🎷", "spacing": "  "\r\n}\r\n', "utf8");
    const id = ["isolated", "event"].join("-");
    const timestamp = String(Math.floor(Date.now() / 1000));
    const sign = (bytes: Buffer) => createHmac("sha256", signingKey)
      .update(`${id}.${timestamp}.`).update(bytes).digest("base64");
    const signature = `v1,${sign(body)}`;
    const cookie = "owned_fixture=isolated; locale=fr";
    const inboxValue = randomBytes(24).toString("base64url");
    const captured = deferred<{ body: Buffer; headers: IncomingHttpHeaders; target: string }>();
    const value = await fixture((incoming, response) => {
      void bodyOf(incoming).then((bytes) => {
        captured.resolve({ body: bytes, headers: incoming.headers, target: incoming.url ?? "" });
        response.writeHead(200, { "Content-Type": "application/json" });
        response.end('{"accepted":true}');
      }).catch(() => response.destroy());
    });
    const reply = await request(value, {
      method: "POST", path, body,
      headers: {
        host, origin: `https://${policy.canonicalHost}`, cookie,
        "content-type": "application/json; charset=utf-8", "x-inbox-secret": inboxValue,
        [`${prefix}-id`]: id, [`${prefix}-timestamp`]: timestamp, [`${prefix}-signature`]: signature,
      },
    });
    const observed = await deadline(captured.promise);
    expect(reply.status).toBe(200);
    expectPrivatePreviewCache(reply.headers);
    expect(observed.target).toBe(path);
    expect(observed.headers.authorization).toBeUndefined();
    expect(observed.body.equals(body)).toBe(true);
    expect(observed.headers.cookie === cookie).toBe(true);
    expect(observed.headers.origin).toBe(`https://${policy.canonicalHost}`);
    expect(observed.headers["content-type"]).toBe("application/json; charset=utf-8");
    expect(observed.headers["content-length"]).toBe(String(body.length));
    expect(observed.headers["x-inbox-secret"] === inboxValue).toBe(true);
    expect(observed.headers[`${prefix}-id`] === id).toBe(true);
    expect(observed.headers[`${prefix}-timestamp`] === timestamp).toBe(true);
    expect(observed.headers[`${prefix}-signature`] === `v1,${sign(observed.body)}`).toBe(true);
    expect(connections).toEqual([value.ingressPath, value.upstreamPath]);
  });

  test.each(["text/x-component", "application/pdf"])("streams private %s before Unix upstream completion", async (contentType) => {
    const prefix = Buffer.from(contentType === "application/pdf" ? "%PDF-1.7\nisolated-first\n" : "isolated-first\n");
    const suffix = Buffer.from("isolated-last\n");
    const release = deferred<void>();
    const first = deferred<IncomingHttpHeaders>();
    let upstreamFinished = false;
    const cookies = [
      "owned-access=isolated; Path=/; HttpOnly; Secure; SameSite=Lax",
      "owned-refresh=isolated; Path=/; HttpOnly; Secure; SameSite=Lax",
    ];
    const value = await fixture((_incoming, response) => {
      response.writeHead(200, {
        "Content-Type": contentType, "Cache-Control": "private, no-store",
        Vary: "Cookie, RSC, Next-Router-State-Tree", "Set-Cookie": cookies,
        "Content-Security-Policy": "default-src 'none'; frame-ancestors 'self'; sandbox",
      });
      response.write(prefix);
      void release.promise.then(() => { upstreamFinished = true; response.end(suffix); });
    });
    const completed = deadline(new Promise<Buffer>((resolve, reject) => {
      const client = begin(value, { path: "/api/attachments/isolated" }, (response) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk) => { chunks.push(Buffer.from(chunk)); first.resolve(response.headers); });
        response.once("end", () => resolve(Buffer.concat(chunks)));
        response.once("error", () => reject(new Error("Owned Unix stream failed")));
      });
      client.once("error", () => reject(new Error("Owned Unix stream request failed")));
      client.end();
    }));
    const headers = await deadline(first.promise);
    expect(upstreamFinished).toBe(false);
    expectPrivatePreviewCache(headers);
    expect(headers["content-type"]).toBe(contentType);
    expect(headers["set-cookie"]).toEqual(cookies);
    expect(headers.vary).toBe("Cookie, RSC, Next-Router-State-Tree");
    expect(headers["content-security-policy"]).toBe("default-src 'none'; frame-ancestors 'self'; sandbox");
    release.resolve();
    expect((await completed).equals(Buffer.concat([prefix, suffix]))).toBe(true);
  });

  test.each([200, 302, 304])("overrides shared-cache asset/redirect/conditional directives on upstream status%i without exposing an unauthenticated response", async (status) => {
    const target = "/_next/static/chunks/owned-cache-fixture.js";
    const location = "/dashboard/profile?lang=fr";
    const csp = "default-src 'self'; frame-ancestors 'self'";
    const cookies = [
      "owned-access=isolated; Path=/; HttpOnly; Secure; SameSite=Lax",
      "owned-refresh=isolated; Path=/; HttpOnly; Secure; SameSite=Lax",
    ];
    const conditional = '"owned-cache-fixture-etag"';
    const captured = deferred<IncomingHttpHeaders>();
    const value = await fixture((incoming, response) => {
      captured.resolve(incoming.headers);
      response.writeHead(status, {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "public, max-age=31536000, immutable",
        "CDN-Cache-Control": "public, max-age=86400",
        "Cloudflare-CDN-Cache-Control": "public, max-age=86400",
        "Surrogate-Control": "max-age=86400, stale-while-revalidate=600",
        "Surrogate-Key": "owned-shared-asset-group",
        "Content-Security-Policy": csp,
        "Set-Cookie": cookies,
        Vary: "Cookie, RSC, Next-Router-State-Tree",
        ETag: conditional,
        ...(status === 302 ? { Location: location } : {}),
      });
      response.end(status === 304 ? undefined : "isolated-public-asset-bytes");
    });

    const unauthenticated = await request(value, {
      path: target, headers: { authorization: undefined, "if-none-match": conditional },
    });
    expect(unauthenticated.status).toBe(401);
    expect(value.counts).toEqual({ requests: 0, connections: 0 });
    expect(unauthenticated.headers.location).toBeUndefined();
    expect(unauthenticated.headers["cache-control"]).toBe("no-store");

    const reply = await request(value, { path: target, headers: { "if-none-match": conditional } });
    expect(reply.status).toBe(status);
    expectPrivatePreviewCache(reply.headers);
    expect(reply.headers["content-type"]).toBe("application/javascript; charset=utf-8");
    expect(reply.headers["content-security-policy"]).toBe(csp);
    expect(reply.headers["set-cookie"]).toEqual(cookies);
    expect(reply.headers.vary).toBe("Cookie, RSC, Next-Router-State-Tree");
    expect(reply.headers.etag).toBe(conditional);
    expect(reply.headers.location).toBe(status === 302 ? location : undefined);
    expect(reply.body.toString()).toBe(status === 304 ? "" : "isolated-public-asset-bytes");
    expect((await deadline(captured.promise))["if-none-match"]).toBe(conditional);

    const unauthenticatedAgain = await request(value, { path: target, headers: { authorization: undefined } });
    expect(unauthenticatedAgain.status).toBe(401);
    expect(value.counts).toEqual({ requests: 1, connections: 1 });
  });
});

describe("native preview Unix disconnect cleanup", () => {
  test("the fixed preview lease closes an admitted backend before headers with410", async () => {
    const admitted = deferred<void>();
    const upstreamClosed = deferred<void>();
    const value = await fixture((incoming) => {
      incoming.socket.once("close", () => upstreamClosed.resolve());
      admitted.resolve();
    });
    const expiry = Date.parse(value.previewAccess.expiresAt);
    const clock = vi.spyOn(Date, "now").mockReturnValue(expiry - 150);
    const completed = request(value);
    await deadline(admitted.promise);
    clock.mockReturnValue(expiry);
    const reply = await completed;
    await deadline(upstreamClosed.promise);
    expect(reply.status).toBe(410);
    expect(reply.headers["cache-control"]).toBe("no-store");
    expect(value.counts.requests).toBe(1);
    expect(value.counts.connections).toBe(1);
  });

  test("the fixed preview lease aborts an admitted private stream without appending error bytes", async () => {
    const prefix = Buffer.from("%PDF-1.7\nisolated-lease-stream\n");
    const first = deferred<void>();
    const upstreamClosed = deferred<void>();
    const value = await fixture((incoming, response) => {
      incoming.socket.once("close", () => upstreamClosed.resolve());
      response.writeHead(200, { "Content-Type": "application/pdf", "Cache-Control": "private, no-store" });
      response.write(prefix);
    });
    const expiry = Date.parse(value.previewAccess.expiresAt);
    const clock = vi.spyOn(Date, "now").mockReturnValue(expiry - 150);
    const completed = deadline(new Promise<{ status: number; body: Buffer; aborted: boolean }>((resolve, reject) => {
      const client = begin(value, {}, (response) => {
        const chunks: Buffer[] = [];
        let aborted = false;
        response.on("data", (chunk) => { chunks.push(Buffer.from(chunk)); first.resolve(); });
        response.once("aborted", () => { aborted = true; });
        response.on("error", () => {});
        response.once("close", () => resolve({ status: response.statusCode ?? 0, body: Buffer.concat(chunks), aborted }));
      });
      client.once("error", () => reject(new Error("Owned lease-limited Unix stream failed")));
      client.end();
    }));
    await deadline(first.promise);
    clock.mockReturnValue(expiry);
    const reply = await completed;
    await deadline(upstreamClosed.promise);
    expect(reply.status).toBe(200);
    expect(reply.aborted).toBe(true);
    expect(reply.body.equals(prefix)).toBe(true);
    expect(reply.body.includes("Solicitud")).toBe(false);
    expect(reply.body.includes("Servicio")).toBe(false);
    expect(value.counts.requests).toBe(1);
  });

  test("client disconnect during upload starts no upstream connection", async () => {
    const value = await fixture((_incoming, response) => response.end());
    const accepted = deferred<Socket>();
    const closed = deferred<void>();
    value.ingress.once("connection", (socket) => { socket.once("close", () => closed.resolve()); accepted.resolve(socket); });
    const client = begin(value, {
      method: "POST", path: "/api/dashboard/notes", headers: { "content-length": "100" },
    }, (response) => { response.on("error", () => {}); response.resume(); });
    client.flushHeaders();
    client.write("isolated-incomplete");
    await deadline(accepted.promise);
    client.destroy();
    await deadline(closed.promise);
    expect(value.counts).toEqual({ requests: 0, connections: 0 });
    expect(connections).toEqual([value.ingressPath]);
  });

  test("client disconnect after streamed response closes the Unix upstream", async () => {
    const upstreamClosed = deferred<void>();
    const first = deferred<IncomingMessage>();
    const value = await fixture((incoming, response) => {
      incoming.socket.once("close", () => upstreamClosed.resolve());
      response.writeHead(200, { "Content-Type": "text/x-component" });
      response.write("isolated-open-stream");
    });
    const client = begin(value, {}, (response) => {
      response.on("error", () => {});
      response.once("data", () => first.resolve(response));
    });
    client.end();
    const response = await deadline(first.promise);
    expect(client.writableFinished).toBe(true);
    response.destroy();
    client.destroy();
    await deadline(upstreamClosed.promise);
    expect(value.counts.requests).toBe(1);
    expect(value.counts.connections).toBe(1);
  });

  test.each(["disconnect", "timeout"])("returns a finite %s failure and closes its Unix backend", async (failure) => {
    const upstreamClosed = deferred<void>();
    const value = await fixture((incoming) => {
      incoming.socket.once("close", () => upstreamClosed.resolve());
      if (failure === "disconnect") incoming.socket.destroy();
    }, { upstreamTimeoutMs: 60 });
    const reply = await request(value, {
      headers: { cookie: "owned_private=isolated", "webhook-signature": randomBytes(24).toString("base64url") },
    });
    await deadline(upstreamClosed.promise);
    expect(reply.status).toBe(failure === "disconnect" ? 502 : 504);
    expect(reply.body.toString()).toBe("Servicio temporalmente no disponible.");
    expect(reply.headers["cache-control"]).toBe("no-store");
    expect(reply.body.includes(value.previewAccess.password)).toBe(false);
    expect(reply.body.includes("owned_private")).toBe(false);
    expect(value.counts.requests).toBe(1);
  });

  test("upstream disconnect after a partial PDF aborts downstream without appending an error body", async () => {
    const prefix = Buffer.from("%PDF-1.7\nisolated-partial-stream\n");
    const first = deferred<void>();
    const upstreamClosed = deferred<void>();
    let upstreamResponse: ServerResponse | undefined;
    const value = await fixture((incoming, response) => {
      incoming.socket.once("close", () => upstreamClosed.resolve());
      upstreamResponse = response;
      response.writeHead(200, { "Content-Type": "application/pdf" });
      response.write(prefix);
    });
    const completed = deadline(new Promise<{ status: number; body: Buffer; aborted: boolean }>((resolve, reject) => {
      const client = begin(value, {}, (response) => {
        const chunks: Buffer[] = [];
        let aborted = false;
        response.on("data", (chunk) => { chunks.push(Buffer.from(chunk)); first.resolve(); });
        response.once("aborted", () => { aborted = true; });
        response.on("error", () => {});
        response.once("close", () => resolve({ status: response.statusCode ?? 0, body: Buffer.concat(chunks), aborted }));
      });
      client.once("error", () => reject(new Error("Owned partial Unix request failed")));
      client.end();
    }));
    await deadline(first.promise);
    upstreamResponse?.destroy();
    const reply = await completed;
    await deadline(upstreamClosed.promise);
    expect(reply.status).toBe(200);
    expect(reply.aborted).toBe(true);
    expect(reply.body.equals(prefix)).toBe(true);
    expect(reply.body.includes("Servicio")).toBe(false);
  });
});
