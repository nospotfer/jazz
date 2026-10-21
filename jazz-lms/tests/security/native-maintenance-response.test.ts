import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import http, { type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { loadMaintenanceResponse } from "../../scripts/native/maintenance-response.mjs";
import { createIngressServer } from "../../scripts/native/ingress-server.mjs";

const servers: Server[] = [], directories: string[] = [];
let appRoot: string;
const policy = { canonicalHost: "www.culturadeljazz.com", apexHost: "culturadeljazz.com" };
async function listen(server: Server) {
  servers.push(server); await new Promise<void>(done => server.listen(0, "127.0.0.1", done));
  return (server.address() as AddressInfo).port;
}
function request(port: number, method: string, path: string, headers = {}) {
  return new Promise<{ status: number; headers: http.IncomingHttpHeaders; body: Buffer }>((done, reject) => {
    const req = http.request({ hostname: "127.0.0.1", port, method, path, agent: false, headers: {
      host: policy.canonicalHost, "x-forwarded-proto": "https", "cf-connecting-ip": "203.0.113.42", ...headers,
    } }, res => {
      const chunks: Buffer[] = []; res.on("data", data => chunks.push(data)); res.once("error", reject);
      res.once("end", () => done({ status: res.statusCode!, headers: res.headers, body: Buffer.concat(chunks) }));
    }); req.once("error", reject); req.end(method === "POST" ? "synthetic-body" : undefined);
  });
}
beforeEach(() => {
  appRoot = mkdtempSync(join(tmpdir(), "jz-maintenance-sealed-")); directories.push(appRoot);
  const directory = join(appRoot, "ops/maintenance"); mkdirSync(directory, { recursive: true, mode: 0o700 });
  for (const name of ["index.html", "serving-contract.json"]) {
    writeFileSync(join(directory, name), readFileSync(resolve("ops/maintenance", name)), { mode: 0o400 });
  }
});
afterEach(async () => {
  for (const server of servers.splice(0)) { server.closeAllConnections(); await new Promise<void>(done => server.close(() => done())); }
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe("production static maintenance response", () => {
  test("binds the actual reviewed HTML and its embedded CSP hashes", async () => {
    const result = await loadMaintenanceResponse(appRoot);
    expect(result.html.equals(readFileSync(resolve("ops/maintenance/index.html")))).toBe(true);
    expect(result.headers["content-security-policy"]).toContain("connect-src 'none'");
    expect(result.headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  });
  test.each(["document", "policy"])("rejects changed %s bytes before serving", async kind => {
    const root = mkdtempSync(join(tmpdir(), "jz-maintenance-response-")); directories.push(root);
    const dir = join(root, "ops/maintenance"); mkdirSync(dir, { recursive: true, mode: 0o700 });
    const html = readFileSync(resolve("ops/maintenance/index.html"));
    const contract = JSON.parse(readFileSync(resolve("ops/maintenance/serving-contract.json"), "utf8"));
    if (kind === "policy") contract.headers["Content-Security-Policy"] = "default-src *";
    writeFileSync(join(dir, "index.html"), kind === "document" ? Buffer.concat([html, Buffer.from("changed")]) : html, { mode: 0o600 });
    writeFileSync(join(dir, "serving-contract.json"), JSON.stringify(contract), { mode: 0o600 });
    await expect(loadMaintenanceResponse(root)).rejects.toThrow("NATIVE_MAINTENANCE_CONTRACT");
  });
  test("maintenance-only GET/HEAD use the exact document and never contact upstream", async () => {
    let calls = 0; const upstreamPort = await listen(http.createServer((_req, res) => { calls++; res.end("unexpected"); }));
    const fallback = await loadMaintenanceResponse(appRoot);
    const port = await listen(createIngressServer({ upstreamPort, policy, maintenanceOnly: true, maintenanceFallback: fallback }));
    const get = await request(port, "GET", "/"); expect(get.status).toBe(503); expect(get.body.equals(fallback.html)).toBe(true);
    expect(get.headers["cache-control"]).toBe("no-store"); expect(get.headers["retry-after"]).toBe("300");
    expect(get.headers["set-cookie"]).toBeUndefined();
    const head = await request(port, "HEAD", "/courses/course");
    expect(head.status).toBe(503); expect(head.body.length).toBe(0); expect(head.headers["content-length"]).toBe(String(fallback.html.length));
    expect(calls).toBe(0);
  });
  test("maintenance API/auth/checkout and webhook requests fail without upstream delivery", async () => {
    let calls = 0; const upstreamPort = await listen(http.createServer((_req, res) => { calls++; res.end("unexpected"); }));
    const port = await listen(createIngressServer({ upstreamPort, policy, maintenanceOnly: true, maintenanceFallback: await loadMaintenanceResponse(appRoot) }));
    for (const [method, path] of [["GET", "/auth"], ["GET", "/api/purchases"], ["GET", "/checkout"], ["POST", "/api/webhooks/dodo-jazzlms"], ["POST", "/courses/course"]]) {
      const response = await request(port, method, path); expect(response.status).toBe(503);
      expect(response.headers["content-type"]).toBe("text/plain; charset=utf-8"); expect(response.headers["set-cookie"]).toBeUndefined();
    }
    expect(calls).toBe(0);
  });
  test("upstream transport failure gets an honest503 while ordinary responses survive", async () => {
    const upstreamPort = await listen(http.createServer((req, res) => {
      if (req.url === "/healthy") { res.end("healthy-fixture"); return; } req.socket.destroy();
    }));
    const fallback = await loadMaintenanceResponse(appRoot);
    const port = await listen(createIngressServer({ upstreamPort, policy, maintenanceFallback: fallback }));
    const healthy = await request(port, "GET", "/healthy"); expect(healthy.status).toBe(200); expect(healthy.body.toString()).toBe("healthy-fixture");
    const failed = await request(port, "GET", "/"); expect(failed.status).toBe(503); expect(failed.body.equals(fallback.html)).toBe(true);
    expect((await request(port, "POST", "/api/webhooks/dodo-jazzlms")).status).toBe(503);
  });
  test("maintenance mode preserves host, Worker, cron denial and canonical redirects", async () => {
    const port = await listen(createIngressServer({ upstreamSocket: "/private/nonexistent.sock", policy, maintenanceOnly: true,
      maintenanceFallback: await loadMaintenanceResponse(appRoot) }));
    expect((await request(port, "GET", "/", { host: "other.example.invalid" })).status).toBe(421);
    expect((await request(port, "GET", "/", { "cf-worker": "worker.example.invalid" })).status).toBe(403);
    expect((await request(port, "GET", "/api/cron/payments-sweep")).status).toBe(403);
    const apex = await request(port, "GET", "/", { host: policy.apexHost });
    expect(apex.status).toBe(308); expect(apex.headers.location).toBe("https://www.culturadeljazz.com/");
  });
  test("preview cannot enable the production fallback", async () => {
    const fallback = await loadMaintenanceResponse(appRoot);
    expect(() => createIngressServer({ upstreamSocket: "/private/app.sock", policy, maintenanceOnly: true })).toThrow();
    expect(() => createIngressServer({ upstreamSocket: "/private/app.sock", policy, maintenanceFallback: fallback,
      previewAccess: { username: "fixture", password: "p".repeat(32), expiresAt: new Date(Date.now() + 60_000).toISOString() } })).toThrow();
  });
});
