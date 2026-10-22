import { execFileSync, fork, spawn, type ChildProcess } from "node:child_process";
import { createHash, generateKeyPairSync } from "node:crypto";
import { chmodSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import http from "node:http";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { once } from "node:events";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { RECOVERY_PROJECT_REF, validateNativeConfig } from "../../scripts/native/config-policy.mjs";
import { publicBuildFingerprint } from "../../scripts/native/release-inspect.mjs";
import { inspectNativeProduction, startNativeMaintenance, startNativeProduction } from "../../scripts/native/launch-production.mjs";

const source = "b".repeat(40), origin = "https://www.culturadeljazz.com";
const marker = "synthetic-private-production-worker-marker";
const privateKey = generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey.export({ format: "pem", type: "pkcs8" }).toString();
const digest = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
const directories: string[] = [], children: ChildProcess[] = [];
const controllers: Array<Awaited<ReturnType<typeof startNativeProduction>>> = [];
let certificate: Buffer, nodeHash: string;
const codeFiles = ["next-worker.mjs", "config-policy.mjs", "ingress-policy.mjs", "prepare-production.mjs", "launch-production.mjs"];

function json(path: string, value: unknown) { writeFileSync(path, JSON.stringify(value), { mode: 0o600 }); chmodSync(path, 0o600); }
function dir(parent: string, name: string) { const path = join(parent, name); mkdirSync(path, { recursive: true, mode: 0o700 }); chmodSync(path, 0o700); return path; }
function fakeNext(behavior: string) {
  return `const fs=require('node:fs');const cp=require('node:child_process');
module.exports=options=>{
 fs.writeFileSync(process.env.TMPDIR+'/next-loaded','loaded');
 const descendant=${JSON.stringify(behavior)}==='grandchild'?cp.spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore'}):null;
 return {prepare:async()=>{
  if(${JSON.stringify(behavior)}==='forged')process.send({type:'ready',role:'next',pid:process.pid,nonce:'0'.repeat(64)});
  if(${JSON.stringify(behavior)}==='failure')throw Error('synthetic only');
  if(${JSON.stringify(behavior)}==='raw-output'){process.stdout.write(${JSON.stringify(marker)});process.stderr.write(${JSON.stringify(marker)});console.error(${JSON.stringify(marker)});}
 },getRequestHandler:()=>async(req,res)=>{
  if(req.url==='/robots.txt'){res.end(${JSON.stringify(behavior === "bad-robots" ? "User-Agent: *\nDisallow: /\n" : "User-Agent: *\nAllow: /\nDisallow: /api\nSitemap: https://www.culturadeljazz.com/sitemap.xml\n")});return;}
  if(req.url==='/fixture-exit'){res.end('exit');setTimeout(()=>process.exit(0),10);return;}
  if(req.url==='/fixture-disconnect'){res.end('disconnect');setTimeout(()=>process.disconnect(),10);return;}
  if(req.url==='/metadata'){res.setHeader('content-type','application/json');res.end(JSON.stringify({profile:process.env.NATIVE_PREVIEW_PROFILE,deployment:process.env.APP_DEPLOYMENT_ENVIRONMENT,ambient:!!process.env.SYNTHETIC_AMBIENT_SECRET,nodeOptions:!!process.env.NODE_OPTIONS,argv:process.argv.length,descendant:descendant?.pid??null,forwarded:req.headers['x-forwarded-for'],hasAuthorization:!!req.headers.authorization}));return;}
  let body='';for await(const chunk of req)body+=chunk;res.end(body||'synthetic response');
 },close:async()=>{}};
};`;
}
function fixture(behavior = "normal") {
  const root = mkdtempSync(join(tmpdir(), "jazz-production-launch-")); chmodSync(root, 0o700); directories.push(root);
  const appRoot = dir(root, "app"), ca = join(root, "ca.crt"); writeFileSync(ca, certificate, { mode: 0o600 });
  const database = new URL(`postgresql://postgres:${marker}@db.${RECOVERY_PROJECT_REF}.supabase.co:5432/postgres`);
  for (const [name, value] of Object.entries({ sslmode: "require", sslaccept: "strict", sslcert: ca, pool_timeout: "10", connect_timeout: "10" })) database.searchParams.set(name, value);
  const config = { version: 1, mode: "production", productionTarget: "restored-customer", sourceCommit: source, projectRef: RECOVERY_PROJECT_REF, origin,
    ca: { path: ca, sha256: digest(certificate) }, env: {
      APP_URL: origin, NEXT_PUBLIC_APP_URL: origin, NEXT_PUBLIC_SUPABASE_URL: `https://${RECOVERY_PROJECT_REF}.supabase.co`,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_publishable_synthetic_public_key_123", SUPABASE_SERVICE_ROLE_KEY: "sb_secret_synthetic_private_key_123",
      DATABASE_URL: database.toString(), SUPABASE_STORAGE_BUCKET: "synthetic-pdfs", MUX_SIGNING_KEY_ID: "synthetic-id", MUX_SIGNING_PRIVATE_KEY: privateKey,
      CRON_SECRET: "synthetic".repeat(6), DODO_ENVIRONMENT: "live_mode", DODO_API_BASE_URL: "https://live.dodopayments.com",
      DODO_PAYMENTS_API_KEY: marker, DODO_PAYMENTS_WEBHOOK_SECRET: marker, DODO_BUSINESS_ID: "synthetic-business", DODO_PRODUCT_ID: "synthetic-product",
      PROFESSOR_EMAIL: "professor@example.invalid", ADMIN_OWNER_EMAIL: "owner@example.invalid",
    } };
  const contents: Record<string, Buffer | string> = { "package.json": '{"name":"synthetic-production-fixture","private":true}', "package-lock.json": "{}",
    ".next/BUILD_ID": "synthetic-only", "node_modules/next/dist/bin/next": "// never executed", "node_modules/next/package.json": '{"main":"index.cjs"}',
    "node_modules/next/index.cjs": fakeNext(behavior),
    "ops/maintenance/index.html": readFileSync(resolve("ops/maintenance/index.html")),
    "ops/maintenance/serving-contract.json": readFileSync(resolve("ops/maintenance/serving-contract.json")),
  };
  for (const name of codeFiles) contents[`scripts/native/${name}`] = readFileSync(resolve("scripts/native", name));
  for (const [name, value] of Object.entries(contents)) { dir(appRoot, dirname(name)); writeFileSync(join(appRoot, name), value, { mode: 0o400 }); }
  dir(appRoot, ".next/cache");
  const seal = (path: string) => { if (path === join(appRoot, ".next/cache")) return; for (const name of readdirSync(path)) { const child = join(path, name); if (lstatSync(child).isDirectory()) seal(child); } chmodSync(path, 0o500); }; seal(appRoot);
  const configFile = join(root, "config.json"), manifestFile = join(root, "manifest.json"); json(configFile, config);
  json(manifestFile, { version: 1, sourceCommit: source, nodeVersion: process.version, nodeSha256: nodeHash, caSha256: config.ca.sha256,
    publicBuildFingerprint: publicBuildFingerprint(validateNativeConfig(config).env), files: Object.fromEntries(Object.entries(contents).map(([name, value]) => [name, digest(value)])), links: {} });
  const binary = join(root, "cloudflared"); writeFileSync(binary, "synthetic binary never executed", { mode: 0o500 });
  const tunnelFile = join(root, "tunnel.json"), tunnelId = "12345678-1234-4123-8123-123456789abc";
  json(tunnelFile, { TunnelID: tunnelId, AccountTag: "a".repeat(32), TunnelSecret: Buffer.alloc(32, 7).toString("base64") });
  const plan = { version: 1, sourceCommit: source, projectRef: RECOVERY_PROJECT_REF, origin, configFile, manifestFile, appRoot,
    runDirectory: join(dir(root, "runs"), "current"), nodeExecutable: process.execPath, cloudflaredExecutable: binary,
    cloudflaredSha256: digest(readFileSync(binary)), tunnel: { id: tunnelId, credentialsFile: tunnelFile } };
  const planFile = join(root, "plan.json"); json(planFile, plan); return { root, planFile, plan, config };
}
function request(socketPath: string, path = "/", method = "GET", extra: Record<string, string> = {}, body = "") {
  return new Promise<{ status: number; body: string; headers: http.IncomingHttpHeaders }>((resolveResponse, reject) => {
    const req = http.request({ socketPath, path, method, agent: false, headers: { host: "www.culturadeljazz.com", "x-forwarded-proto": "https", "cf-connecting-ip": "192.0.2.12", ...extra } }, res => {
      let value = "";res.on("data", chunk => { value += chunk.toString(); if (value.length > 524288) req.destroy(new Error("Synthetic response limit")); });
      res.on("end", () => resolveResponse({ status: res.statusCode!, body: value, headers: res.headers }));
    });req.setTimeout(5000, () => req.destroy(new Error("Synthetic request timeout")));req.on("error", reject);req.end(body);
  });
}
async function start(f: ReturnType<typeof fixture>, maintenance = false) { const c = await (maintenance ? startNativeMaintenance(f.planFile) : startNativeProduction(f.planFile)); controllers.push(c); return c; }
async function bounded<T>(promise: Promise<T>, ms = 15_000) { let timer: ReturnType<typeof setTimeout>; try { return await Promise.race([promise, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("Synthetic test timeout")), ms); })]); } finally { clearTimeout(timer!); } }
function running(pid: number) { try { const text = readFileSync(`/proc/${pid}/stat`, "utf8"); return text.slice(text.lastIndexOf(")") + 2).split(" ")[0] !== "Z"; } catch { return false; } }
beforeAll(() => {
  const path = mkdtempSync(join(tmpdir(), "jazz-production-launch-ca-")); chmodSync(path, 0o700); directories.push(path);
  execFileSync("openssl", ["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-keyout", join(path, "key"), "-out", join(path, "ca"), "-days", "2", "-subj", "/CN=Synthetic Production Launcher CA", "-addext", "basicConstraints=critical,CA:TRUE"], { timeout: 10_000, stdio: "ignore", env: { NODE_ENV: "test", PATH: "/usr/bin:/bin" } });
  certificate = readFileSync(join(path, "ca")); nodeHash = digest(readFileSync(process.execPath));
});
afterAll(async () => {
  for (const c of controllers) await c.close();
  for (const child of children) if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
  const writable = (path: string) => { if (lstatSync(path).isSymbolicLink() || !lstatSync(path).isDirectory()) return; chmodSync(path, 0o700); for (const name of readdirSync(path)) writable(join(path, name)); };
  for (const path of directories) { writable(path); rmSync(path, { recursive: true, force: true }); }
});

describe("real production launcher with sealed fake Next", () => {
  test("inspects without starting, then exposes only private sockets and clean canonical production", async () => {
    const f = fixture(); await inspectNativeProduction(f.planFile); expect(existsSync(f.plan.runDirectory)).toBe(false);
    const prior = process.env.SYNTHETIC_AMBIENT_SECRET; process.env.SYNTHETIC_AMBIENT_SECRET = marker;
    let c: Awaited<ReturnType<typeof startNativeProduction>>;
    try { c = await start(f); } finally { if (prior === undefined) delete process.env.SYNTHETIC_AMBIENT_SECRET; else process.env.SYNTHETIC_AMBIENT_SECRET = prior; }
    expect(c.summary).toMatchObject({ started: true, childReady: true, previewGateRequired: false, productionApproved: false });
    expect(lstatSync(f.plan.runDirectory).mode & 0o777).toBe(0o700);
    for (const path of Object.values(c.socketPaths)) expect(lstatSync(path).mode & 0o777).toBe(0o600);
    const metadata = JSON.parse((await request(c.socketPaths.edge, "/metadata", "GET", { "x-forwarded-for": "198.51.100.99" })).body);
    expect(metadata).toMatchObject({ profile: "production", deployment: "production", ambient: false, nodeOptions: false, argv: 2, forwarded: "192.0.2.12", hasAuthorization: false });
    const payload = "{\"synthetic\":\"exact bytes\"}\n";
    expect((await request(c.socketPaths.edge, "/api/webhooks/dodo-jazzlms", "POST", { "content-type": "application/json" }, payload)).body).toBe(payload);
    expect((await request(c.socketPaths.edge, "/", "GET", { "cf-worker": "untrusted.example" })).status).toBe(403);
    expect((await request(c.socketPaths.edge, "/", "GET", { host: "other.example.invalid" })).status).toBe(421);
    expect((await request(c.socketPaths.edge, "/", "GET", { host: "culturadeljazz.com" })).status).toBe(308);
    expect(await c.close()).toMatchObject({ clean: true, stopped: true, failed: false }); expect(existsSync(f.plan.runDirectory)).toBe(false);
    expect(await c.close()).toEqual(await c.closed);
  });
  test("maintenance rollback starts no Next worker and serves contract503 with no API forwarding", async () => {
    const f = fixture(); const c = await start(f, true);
    expect(existsSync(c.socketPaths.app)).toBe(false); expect(existsSync(join(f.plan.runDirectory, "tmp"))).toBe(false);
    const page = await request(c.socketPaths.edge); expect(page.status).toBe(503); expect(page.body.toLowerCase().startsWith("<!doctype html>")).toBe(true);
    expect(page.headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    const head = await request(c.socketPaths.edge, "/", "HEAD"); expect(head.status).toBe(503); expect(head.body).toBe("");
    const api = await request(c.socketPaths.edge, "/api/auth/session", "POST", { "content-type": "application/json" }, "{}"); expect(api.status).toBe(503); expect(api.body.toLowerCase().includes("<!doctype")).toBe(false);
    expect(await c.close()).toMatchObject({ clean: true, failed: false });
  });
  test.each(["forged", "failure", "bad-robots"])("rejects %s without leaving owned runtime resources", async behavior => {
    const f = fixture(behavior); await expect(startNativeProduction(f.planFile)).rejects.toThrow(); expect(existsSync(f.plan.runDirectory)).toBe(false);
  });
  test.each(["/fixture-exit", "/fixture-disconnect"])("worker loss at %s closes ingress and marks failure", async path => {
    const f = fixture(); const c = await start(f); await request(c.socketPaths.edge, path);
    expect(await bounded(c.closed)).toMatchObject({ clean: true, failed: true, reason: "child_exit" }); expect(existsSync(f.plan.runDirectory)).toBe(false);
  });
  test("preserves a preexisting run directory", async () => {
    const f = fixture(); mkdirSync(f.plan.runDirectory, { mode: 0o700 }); writeFileSync(join(f.plan.runDirectory, "keep"), "synthetic unrelated marker");
    await expect(startNativeProduction(f.planFile)).rejects.toThrow("NATIVE_RUN_EXISTS"); expect(readFileSync(join(f.plan.runDirectory, "keep"), "utf8")).toBe("synthetic unrelated marker");
  });
  test("rejects a fully inventoried release whose launcher differs from the current caller", async () => {
    const f = fixture(), path = join(f.plan.appRoot, "scripts/native/launch-production.mjs");
    chmodSync(path, 0o600); writeFileSync(path, `${readFileSync(path, "utf8")}\n// synthetic drift\n`); chmodSync(path, 0o400);
    const manifest = JSON.parse(readFileSync(f.plan.manifestFile, "utf8")); manifest.files["scripts/native/launch-production.mjs"] = digest(readFileSync(path)); json(f.plan.manifestFile, manifest);
    await expect(startNativeProduction(f.planFile)).rejects.toThrow("NATIVE_PRODUCTION_LAUNCHER_BINDING"); expect(existsSync(f.plan.runDirectory)).toBe(false);
  });
  test("rejects a peer-readable runtime parent before bind", async () => {
    const f = fixture(); chmodSync(dirname(f.plan.runDirectory), 0o755); await expect(startNativeProduction(f.planFile)).rejects.toThrow("NATIVE_RUN_PARENT"); expect(existsSync(f.plan.runDirectory)).toBe(false);
  });
  test("preserves unexpected entries on cleanup and reports failure", async () => {
    const f = fixture(); const c = await start(f); writeFileSync(join(f.plan.runDirectory, "keep"), "synthetic unrelated marker");
    expect(await c.close()).toMatchObject({ clean: false, failed: true }); expect(readFileSync(join(f.plan.runDirectory, "keep"), "utf8")).toBe("synthetic unrelated marker");
  });
  test("dedicated CLI SIGTERM kills the owned worker group, closes sockets and emits no raw output", async () => {
    const f = fixture("grandchild"); const child = spawn(process.execPath, [resolve("scripts/native/launch-production.mjs"), "--run-production", f.planFile], { env: { NODE_ENV: "test", PATH: "/usr/bin:/bin" }, stdio: ["ignore", "pipe", "pipe"] }); children.push(child);
    let output = "", errors = ""; child.stdout!.on("data", chunk => { output += chunk.toString(); }); child.stderr!.on("data", chunk => { errors += chunk.toString(); });
    await bounded(new Promise<void>((resolveReady, reject) => { child.once("exit", () => reject(new Error("Synthetic CLI exited before ready"))); const onData = () => { if (output.includes('"started":true')) { child.stdout!.off("data", onData); resolveReady(); } }; child.stdout!.on("data", onData); }));
    const metadata = JSON.parse((await request(join(f.plan.runDirectory, "edge.sock"), "/metadata")).body); const exit = once(child, "close"); child.kill("SIGTERM");
    expect((await bounded(exit))[0]).toBe(0); expect(output + errors).not.toContain(marker); expect(output).toContain('"reason":"signal"'); expect(running(metadata.descendant)).toBe(false); expect(existsSync(f.plan.runDirectory)).toBe(false);
  });
  test("raw worker stdout/stderr and diagnostics become only finite counters", async () => {
    const f = fixture("raw-output"); const c = await start(f); const receipt = await c.close(); expect(receipt.diagnostics.error).toBe(1); expect(JSON.stringify({ summary: c.summary, receipt })).not.toContain(marker);
  });
});

describe("production worker rejects forged environment or IPC before importing Next", () => {
  test.each(["preview-profile", "wrong-target", "wrong-database", "wrong-host", "test-api", "recovery", "expiry", "test-deadline"])("rejects %s", async kind => {
    const f = fixture(); const temporary = dir(f.root, "worker-temp"); const env: NodeJS.ProcessEnv = { ...validateNativeConfig(f.config).env, NODE_ENV: "production", PATH: "/usr/bin:/bin", TMPDIR: temporary };
    const message: Record<string, unknown> = { type: "start", socketPath: join(temporary, "app.sock"), hostname: "www.culturadeljazz.com", nonce: "a".repeat(64) };
    if (kind === "preview-profile") env.NATIVE_PREVIEW_PROFILE = "isolated";
    if (kind === "wrong-target") env.NEXT_PUBLIC_SUPABASE_URL = "https://feavujcllgbzlvdvkkxx.supabase.co";
    if (kind === "wrong-database") env.DATABASE_URL = env.DATABASE_URL!.replace(`db.${RECOVERY_PROJECT_REF}.supabase.co`, "db.feavujcllgbzlvdvkkxx.supabase.co");
    if (kind === "wrong-host") message.hostname = "synthetic.trycloudflare.com";
    if (kind === "test-api") env.DODO_API_BASE_URL = "https://test.dodopayments.com";
    if (kind === "recovery") env.NATIVE_RECOVERY_ACCESS = "true";
    if (kind === "expiry") message.expiresAt = Date.now() + 60_000;
    if (kind === "test-deadline") env.NATIVE_TEST_PAYMENTS_EXPIRES_AT = new Date(Date.now() + 60_000).toISOString();
    const child = fork(join(f.plan.appRoot, "scripts/native/next-worker.mjs"), [], { execPath: process.execPath, execArgv: [], cwd: f.plan.appRoot, env, stdio: ["ignore", "ignore", "ignore", "ipc"] }); children.push(child);
    const events: unknown[] = []; child.on("message", m => events.push(m)); const exit = once(child, "close"); child.send(message);
    expect((await bounded(exit))[0]).toBe(1); expect(events.some(v => (v as { type: string }).type === "failed")).toBe(true); expect(existsSync(join(temporary, "next-loaded"))).toBe(false); expect(existsSync(join(temporary, "app.sock"))).toBe(false);
  });
});
