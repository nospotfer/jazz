import { createHash, generateKeyPairSync } from "node:crypto";
import { execFileSync } from "node:child_process";
import { chmodSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import http, { type Server } from "node:http";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from "vitest";
import { RECOVERY_PROJECT_REF, validateNativeConfig } from "../../scripts/native/config-policy.mjs";
import { publicBuildFingerprint } from "../../scripts/native/release-inspect.mjs";
import { inspectProductionPreparation } from "../../scripts/native/prepare-production.mjs";
import { inspectNativeProductionTunnel, startNativeProductionTunnel } from "../../scripts/native/launch-production-tunnel.mjs";

const hash = (value: Buffer | string) => createHash("sha256").update(value).digest("hex");
const roots: string[] = [], servers: Server[] = [];
const controllers: Awaited<ReturnType<typeof startNativeProductionTunnel>>[] = [];
let caBytes: Buffer, nodeHash: string;
const signingKey = generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey.export({ format: "pem", type: "pkcs8" }).toString();

function directory(path: string) { mkdirSync(path, { recursive: true, mode: 0o700 }); chmodSync(path, 0o700); return path; }
function json(path: string, value: unknown) { writeFileSync(path, JSON.stringify(value), { mode: 0o600 }); }
function fixture(behavior = "ready") {
  const root = mkdtempSync(join(tmpdir(), "jz-prod-tunnel-")); chmodSync(root, 0o700); roots.push(root);
  const app = directory(join(root, "app")), ca = join(root, "ca.crt"); writeFileSync(ca, caBytes, { mode: 0o600 });
  const ref = RECOVERY_PROJECT_REF, origin = "https://www.culturadeljazz.com", source = "a".repeat(40);
  const url = new URL(`postgresql://postgres:synthetic-password@db.${ref}.supabase.co:5432/postgres`);
  for (const [key, value] of Object.entries({ sslmode: "require", sslaccept: "strict", sslcert: ca, pool_timeout: "10", connect_timeout: "10" })) url.searchParams.set(key, value);
  const config = { version: 1, mode: "production", productionTarget: "restored-customer", sourceCommit: source, projectRef: ref, origin,
    ca: { path: ca, sha256: hash(caBytes) }, env: {
      APP_URL: origin, NEXT_PUBLIC_APP_URL: origin, NEXT_PUBLIC_SUPABASE_URL: `https://${ref}.supabase.co`,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_publishable_synthetic_public_key_123", SUPABASE_SERVICE_ROLE_KEY: "sb_secret_synthetic_private_key_123",
      DATABASE_URL: url.toString(), SUPABASE_STORAGE_BUCKET: "synthetic-pdfs", MUX_SIGNING_KEY_ID: "synthetic-id", MUX_SIGNING_PRIVATE_KEY: signingKey,
      CRON_SECRET: "synthetic".repeat(6), DODO_ENVIRONMENT: "live_mode", DODO_API_BASE_URL: "https://live.dodopayments.com",
      DODO_PAYMENTS_API_KEY: "synthetic", DODO_PAYMENTS_WEBHOOK_SECRET: "synthetic", DODO_BUSINESS_ID: "synthetic", DODO_PRODUCT_ID: "synthetic",
      PROFESSOR_EMAIL: "professor@example.invalid", ADMIN_OWNER_EMAIL: "owner@example.invalid",
    } };
  const observations = join(root, "observations.json");
  // A pinned fake executable records only local argv/env names, then supplies
  // cloudflared's documented first-connection pidfile. It opens no network.
  const binary = `#!${process.execPath}\nconst fs=require('node:fs');\n` +
    `fs.writeFileSync(${JSON.stringify(observations)},JSON.stringify({args:process.argv.slice(2),envNames:Object.keys(process.env)}),{mode:384});\n` +
    (behavior === "exit" ? "process.exit(7);\n" :
      `fs.writeFileSync(process.argv[process.argv.indexOf('--pidfile')+1],String(process.pid${behavior === "wrong-pid" ? "+1" : ""}),{mode:384});\nsetInterval(()=>{},1000);\n`);
  const plan = { version: 1, sourceCommit: source, projectRef: ref, origin, configFile: join(root, "config.json"),
    appRoot: app, manifestFile: join(root, "manifest.json"), runDirectory: join(root, "run"), nodeExecutable: process.execPath,
    cloudflaredExecutable: join(root, "cloudflared"), cloudflaredSha256: hash(binary),
    tunnel: { id: "12345678-1234-4123-8123-123456789abc", credentialsFile: join(root, "tunnel.json") } };
  writeFileSync(plan.cloudflaredExecutable, binary, { mode: 0o500 });
  json(plan.configFile, config); json(plan.tunnel.credentialsFile, { TunnelID: plan.tunnel.id, AccountTag: "a".repeat(32), TunnelSecret: Buffer.alloc(32, 5).toString("base64") });
  const contents: Record<string, Buffer | string> = { ".next/BUILD_ID": "synthetic-build", "package-lock.json": "{}", "node_modules/next/dist/bin/next": "synthetic-next" };
  for (const name of readdirSync(resolve("scripts/native"))) if (name.endsWith(".mjs")) contents[`scripts/native/${name}`] = readFileSync(resolve("scripts/native", name));
  for (const name of ["index.html", "serving-contract.json"]) contents[`ops/maintenance/${name}`] = readFileSync(resolve("ops/maintenance", name));
  for (const [name, bytes] of Object.entries(contents)) { directory(dirname(join(app, name))); writeFileSync(join(app, name), bytes, { mode: 0o400 }); }
  directory(join(app, ".next/cache"));
  const seal = (path: string) => { for (const name of readdirSync(path)) { const child = join(path, name); if (lstatSync(child).isDirectory() && child !== join(app, ".next/cache")) seal(child); } chmodSync(path, 0o500); }; seal(app);
  json(plan.manifestFile, { version: 1, sourceCommit: source, nodeVersion: process.version, nodeSha256: nodeHash,
    caSha256: config.ca.sha256, publicBuildFingerprint: publicBuildFingerprint(validateNativeConfig(config).env),
    files: Object.fromEntries(Object.entries(contents).map(([name, bytes]) => [name, hash(bytes)])), links: {} });
  const planFile = join(root, "plan.json"); json(planFile, plan); return { root, plan, planFile, observations };
}
async function edge(f: ReturnType<typeof fixture>) {
  directory(f.plan.runDirectory);
  const server = http.createServer((req, res) => {
    expect(req.url).toBe("/robots.txt"); expect(req.headers.host).toBe("www.culturadeljazz.com");
    expect(req.headers["x-forwarded-proto"]).toBe("https");
    res.end("User-agent: *\nAllow: /\n");
  }); servers.push(server);
  const path = join(f.plan.runDirectory, "edge.sock");
  await new Promise<void>(done => server.listen(path, done)); chmodSync(path, 0o600);
}
beforeAll(() => {
  const root = mkdtempSync(join(tmpdir(), "jz-tunnel-ca-")); chmodSync(root, 0o700); roots.push(root);
  execFileSync("openssl", ["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-keyout", join(root, "key.pem"), "-out", join(root, "ca.crt"), "-days", "2", "-subj", "/CN=Synthetic Tunnel Test CA", "-addext", "basicConstraints=critical,CA:TRUE"], { timeout: 10_000, stdio: "ignore", env: { NODE_ENV: "test", PATH: "/usr/bin:/bin" } });
  caBytes = readFileSync(join(root, "ca.crt")); nodeHash = hash(readFileSync(process.execPath));
});
afterEach(async () => {
  for (const controller of controllers.splice(0)) await controller.close();
  for (const server of servers.splice(0)) { server.closeAllConnections(); await new Promise<void>(done => server.close(() => done())); }
  vi.unstubAllEnvs();
});
afterAll(() => {
  const writable = (path: string) => { if (!lstatSync(path).isDirectory()) return; chmodSync(path, 0o700); for (const name of readdirSync(path)) writable(join(path, name)); };
  for (const root of roots) { writable(root); rmSync(root, { recursive: true, force: true }); }
});

describe("production named-tunnel lifecycle with a pinned local fake", () => {
  test("inspection never spawns, binds or creates runtime paths", async () => {
    const f = fixture(); const result = await inspectNativeProductionTunnel(f.planFile);
    expect(result.summary).toMatchObject({ inspectedOnly: true, tunnelStarted: false, providerRequests: 0 });
    expect(existsSync(f.observations)).toBe(false); expect(existsSync(result.runDirectory)).toBe(false);
  });
  test("independent app/tunnel release inspections may run concurrently", async () => {
    const f = fixture(); const results = await Promise.all(Array.from({ length: 4 }, () => inspectProductionPreparation(f.planFile)));
    expect(results.every(value => value.summary.publicBuildBound)).toBe(true);
    expect(readdirSync(join(f.plan.appRoot, ".next/cache"))).toEqual([]);
  });
  test("runs only the pinned named tunnel with clean env and cleans its own resources", async () => {
    const f = fixture(); await edge(f); vi.stubEnv("TUNNEL_TOKEN", "ambient-must-not-inherit");
    const runtime = await startNativeProductionTunnel(f.planFile); controllers.push(runtime);
    expect(runtime.summary).toMatchObject({ tunnelStarted: true, firstConnectionPidObserved: true, publicHealthVerified: false });
    const observed = JSON.parse(readFileSync(f.observations, "utf8"));
    expect(observed.envNames.sort()).toEqual(["LANG", "PATH", "TMPDIR"]);
    expect(observed.args).toContain("127.0.0.1:0"); expect(observed.args).toContain("--management-diagnostics=false");
    expect(observed.args.at(-1)).toBe(f.plan.tunnel.id); expect(observed.args).not.toContain("--token");
    const tunnelDir = `${f.plan.runDirectory}-tunnel`;
    expect(lstatSync(tunnelDir).mode & 0o777).toBe(0o700);
    expect(lstatSync(join(tunnelDir, "config.json")).mode & 0o777).toBe(0o600);
    const config = JSON.parse(readFileSync(join(tunnelDir, "config.json"), "utf8"));
    expect(config.ingress).toHaveLength(3); expect(config.ingress[0].service).toBe(`unix:${f.plan.runDirectory}/edge.sock`);
    expect(await runtime.close()).toMatchObject({ stopped: true, clean: true, failed: false });
    expect(existsSync(tunnelDir)).toBe(false); expect(existsSync(join(f.plan.runDirectory, "edge.sock"))).toBe(true);
  });
  test("unexpected child loss yields failure and owned cleanup", async () => {
    const f = fixture(); await edge(f); const runtime = await startNativeProductionTunnel(f.planFile); controllers.push(runtime);
    const pid = Number(readFileSync(join(`${f.plan.runDirectory}-tunnel`, "connected.pid"), "utf8"));
    process.kill(pid, "SIGKILL");
    expect(await runtime.closed).toMatchObject({ clean: true, failed: true, reason: "child_exit" });
    expect(existsSync(`${f.plan.runDirectory}-tunnel`)).toBe(false);
  });
  test("startup failure stops the owned child and removes only its files", async () => {
    const f = fixture("exit"); await edge(f);
    await expect(startNativeProductionTunnel(f.planFile)).rejects.toThrow("PRODUCTION_TUNNEL_EXIT");
    expect(existsSync(`${f.plan.runDirectory}-tunnel`)).toBe(false);
  });
  test("an unexpected pidfile is rejected and retained rather than erased", async () => {
    const f = fixture("wrong-pid"); await edge(f);
    await expect(startNativeProductionTunnel(f.planFile)).rejects.toThrow("PRODUCTION_TUNNEL_PID");
    expect(existsSync(join(`${f.plan.runDirectory}-tunnel`, "connected.pid"))).toBe(true);
  });
  test("existing tunnel resources are never adopted or overwritten", async () => {
    const f = fixture(); const path = directory(`${f.plan.runDirectory}-tunnel`); writeFileSync(join(path, "keep"), "owned-before-test");
    await expect(startNativeProductionTunnel(f.planFile)).rejects.toThrow("PRODUCTION_TUNNEL_RUN_EXISTS");
    expect(readFileSync(join(path, "keep"), "utf8")).toBe("owned-before-test"); expect(existsSync(f.observations)).toBe(false);
  });
});
