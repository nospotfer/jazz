import { execFileSync } from "node:child_process";
import { createHash, generateKeyPairSync } from "node:crypto";
import { chmodSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from "vitest";
import { PREVIEW_PROJECT_REF, PRODUCTION_PROJECT_REF, RECOVERY_PROJECT_REF, validateNativeConfig } from "../../scripts/native/config-policy.mjs";
import { publicBuildFingerprint } from "../../scripts/native/release-inspect.mjs";
import { inspectProductionPreparation, prepareProductionAssets, productionPreparationCli } from "../../scripts/native/prepare-production.mjs";
import { PRODUCTION_CONTAINER_IMAGE, renderProductionContainerAssets, renderProductionServiceAssets, validateProductionServicePlan, validateProductionTunnel } from "../../scripts/native/production-service-plan.mjs";

const source = "a".repeat(40);
const origin = "https://www.culturadeljazz.com";
const marker = "synthetic-private-production-fixture";
const folders: string[] = [];
const privateKey = generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey.export({ format: "pem", type: "pkcs8" }).toString();
const hash = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
let certificate: Buffer;
let nodeHash: string;

function directory(parent: string, name: string) {
  const path = join(parent, name); mkdirSync(path, { recursive: true, mode: 0o700 }); chmodSync(path, 0o700); return path;
}
function json(path: string, value: unknown) { writeFileSync(path, JSON.stringify(value), { mode: 0o600 }); chmodSync(path, 0o600); }
function configuration(ref = RECOVERY_PROJECT_REF, caPath = "/private/synthetic-ca.crt") {
  const url = new URL(`postgresql://postgres:${marker}@db.${ref}.supabase.co:5432/postgres`);
  for (const [key, value] of Object.entries({ sslmode: "require", sslaccept: "strict", sslcert: caPath, pool_timeout: "10", connect_timeout: "10" })) url.searchParams.set(key, value);
  return { version: 1, mode: "production", productionTarget: "restored-customer", sourceCommit: source, projectRef: ref, origin,
    ca: { path: caPath, sha256: "b".repeat(64) }, env: {
      APP_URL: origin, NEXT_PUBLIC_APP_URL: origin, NEXT_PUBLIC_SUPABASE_URL: `https://${ref}.supabase.co`,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_publishable_synthetic_public_key_123", SUPABASE_SERVICE_ROLE_KEY: "sb_secret_synthetic_private_key_123",
      DATABASE_URL: url.toString(), SUPABASE_STORAGE_BUCKET: "synthetic-pdfs", MUX_SIGNING_KEY_ID: "synthetic-id", MUX_SIGNING_PRIVATE_KEY: privateKey,
      CRON_SECRET: "synthetic".repeat(6), DODO_ENVIRONMENT: "live_mode", DODO_API_BASE_URL: "https://live.dodopayments.com",
      DODO_PAYMENTS_API_KEY: marker, DODO_PAYMENTS_WEBHOOK_SECRET: marker, DODO_BUSINESS_ID: "synthetic-business", DODO_PRODUCT_ID: "synthetic-product",
      PROFESSOR_EMAIL: "professor@example.invalid", ADMIN_OWNER_EMAIL: "owner@example.invalid",
    } as Record<string, string> };
}
function plan() {
  return { version: 1, sourceCommit: source, projectRef: RECOVERY_PROJECT_REF, origin,
    configFile: "/private/config.json", appRoot: "/private/release/app", manifestFile: "/private/manifest.json",
    runDirectory: `/run/user/${process.geteuid!()}/culturadeljazz-production-state/current`, nodeExecutable: process.execPath,
    cloudflaredExecutable: "/private/cloudflared", cloudflaredSha256: "c".repeat(64),
    tunnel: { id: "12345678-1234-4123-8123-123456789abc", credentialsFile: "/private/tunnel.json" } };
}
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "jazz-production-prepare-")); chmodSync(root, 0o700); folders.push(root);
  const app = directory(root, "app"), ca = join(root, "ca.crt"); writeFileSync(ca, certificate, { mode: 0o600 });
  const config = configuration(RECOVERY_PROJECT_REF, ca); config.ca.sha256 = hash(certificate);
  const input = { ...plan(), configFile: join(root, "config.json"), appRoot: app, manifestFile: join(root, "manifest.json"),
    runDirectory: join(directory(root, "culturadeljazz-production-state"), "current"),
    cloudflaredExecutable: join(root, "cloudflared"), tunnel: { ...plan().tunnel, credentialsFile: join(root, "tunnel.json") } };
  const binary = "synthetic executable bytes - never executed"; writeFileSync(input.cloudflaredExecutable, binary, { mode: 0o500 }); input.cloudflaredSha256 = hash(binary);
  json(input.configFile, config);
  json(input.tunnel.credentialsFile, { TunnelID: input.tunnel.id, AccountTag: "a".repeat(32), TunnelSecret: Buffer.alloc(32, 7).toString("base64") });
  const contents: Record<string, string | Buffer> = {
    ".next/BUILD_ID": "synthetic-build", "package-lock.json": "{}", "node_modules/next/dist/bin/next": "synthetic-next",
    "scripts/native/prepare-production.mjs": readFileSync(resolve("scripts/native/prepare-production.mjs")),
  };
  for (const [name, value] of Object.entries(contents)) { directory(app, dirname(name)); writeFileSync(join(app, name), value, { mode: 0o400 }); }
  directory(app, ".next/cache");
  const seal = (path: string) => { for (const name of readdirSync(path)) { const child = join(path, name); if (lstatSync(child).isDirectory() && child !== join(app, ".next/cache")) seal(child); } chmodSync(path, 0o500); };
  seal(app);
  json(input.manifestFile, { version: 1, sourceCommit: source, nodeVersion: process.version, nodeSha256: nodeHash,
    caSha256: config.ca.sha256, publicBuildFingerprint: publicBuildFingerprint(validateNativeConfig(config).env),
    files: Object.fromEntries(Object.entries(contents).map(([name, value]) => [name, hash(value)])), links: {} });
  const planFile = join(root, "plan.json"); json(planFile, input);
  return { root, app, input, config, planFile };
}
beforeAll(() => {
  const root = mkdtempSync(join(tmpdir(), "jazz-production-ca-")); chmodSync(root, 0o700); folders.push(root);
  execFileSync("openssl", ["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-keyout", join(root, "key.pem"), "-out", join(root, "ca.crt"), "-days", "2", "-subj", "/CN=Synthetic Production Test CA", "-addext", "basicConstraints=critical,CA:TRUE"], { timeout: 10_000, stdio: "ignore", env: { NODE_ENV: "test", PATH: "/usr/bin:/bin" } });
  certificate = readFileSync(join(root, "ca.crt")); nodeHash = hash(readFileSync(process.execPath));
});
afterEach(() => vi.unstubAllGlobals());
afterAll(() => {
  const writable = (path: string) => { if (!lstatSync(path).isDirectory()) return; chmodSync(path, 0o700); for (const name of readdirSync(path)) writable(join(path, name)); };
  for (const path of folders) { writable(path); rmSync(path, { recursive: true, force: true }); }
});

describe("explicit restored production configuration", () => {
  test("accepts only the selected recovered routing and keeps the selector server-side", () => {
    const result = validateNativeConfig(configuration());
    expect(result.projectRef).toBe(RECOVERY_PROJECT_REF); expect(result.productionTarget).toBe("restored-customer");
    expect(result.env.APP_DEPLOYMENT_ENVIRONMENT).toBe("production"); expect(result.env).not.toHaveProperty("productionTarget");
    expect(result.env.ENABLE_LOCAL_LEGACY_MUTATIONS).toBe("0");
  });
  test("preserves original-target inspection without making it a planner target", () => {
    const value: Record<string, unknown> = configuration(PRODUCTION_PROJECT_REF); delete value.productionTarget;
    expect(validateNativeConfig(value).projectRef).toBe(PRODUCTION_PROJECT_REF);
    expect(() => validateProductionServicePlan({ ...plan(), projectRef: PRODUCTION_PROJECT_REF })).toThrow("PRODUCTION_PLAN_TARGET");
  });
  test.each([undefined, null, "original", "arbitrary", ""])("rejects an explicit unsupported selector %s", productionTarget => {
    expect(() => validateNativeConfig({ ...configuration(), productionTarget })).toThrow("NATIVE_CONFIG_PRODUCTION_TARGET");
  });
  test("rejects the selector in ordinary preview and keeps ordinary preview compatible", () => {
    const value: Record<string, unknown> = { ...configuration(PREVIEW_PROJECT_REF), mode: "preview" };
    expect(() => validateNativeConfig(value)).toThrow("NATIVE_CONFIG_PRODUCTION_TARGET");
    delete value.productionTarget;
    const env = { ...configuration(PREVIEW_PROJECT_REF).env };
    for (const key of ["CRON_SECRET", "DODO_ENVIRONMENT", "DODO_API_BASE_URL", "DODO_PAYMENTS_API_KEY", "DODO_PAYMENTS_WEBHOOK_SECRET", "DODO_BUSINESS_ID", "DODO_PRODUCT_ID"]) delete env[key];
    const previewOrigin = "https://synthetic-production-control.trycloudflare.com";
    Object.assign(env, { APP_URL: previewOrigin, NEXT_PUBLIC_APP_URL: previewOrigin });
    Object.assign(value, { origin: previewOrigin, env });
    expect(validateNativeConfig(value).mode).toBe("preview");
  });
  test.each([PRODUCTION_PROJECT_REF, PREVIEW_PROJECT_REF])("rejects wrong selected key or DB routing %s", ref => {
    const value = configuration(); value.env.DATABASE_URL = configuration(ref).env.DATABASE_URL;
    expect(() => validateNativeConfig(value)).toThrow("NATIVE_CONFIG_DATABASE");
    const key = ["synthetic", Buffer.from(JSON.stringify({ role: "anon", ref })).toString("base64url"), "synthetic"].join(".");
    value.env.DATABASE_URL = configuration().env.DATABASE_URL; value.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = key;
    expect(() => validateNativeConfig(value)).toThrow("NATIVE_CONFIG_KEY_KIND");
  });
  test("rejects noncanonical origins on the selected production target", () => {
    expect(() => validateNativeConfig({ ...configuration(), origin: "https://culturadeljazz.com" })).toThrow("NATIVE_CONFIG_ORIGIN");
  });
});

describe("production service and named-tunnel review assets", () => {
  test("renders both exact hosts, private Unix transport and no secret or activation claim", () => {
    const input = validateProductionServicePlan(plan()); const assets = renderProductionServiceAssets(input, "/private/plan.json");
    const tunnel = JSON.parse(assets["cloudflared.json.proposed"]);
    expect(tunnel.ingress.map((v: { hostname?: string }) => v.hostname)).toEqual(["www.culturadeljazz.com", "culturadeljazz.com", undefined]);
    expect(tunnel.ingress[0].service).toBe(`unix:${input.runDirectory}/edge.sock`);
    expect(tunnel.ingress[2].service).toBe("http_status:404");
    expect(assets["jazz-production.service.proposed"]).toContain("/usr/bin/env -i");
    expect(assets["jazz-production.service.proposed"]).toContain("KillMode=control-group");
    expect(assets["jazz-production-tunnel.service.proposed"]).toContain("Requires=jazz-production.service");
    expect(Object.values(assets).join("\n")).not.toContain(marker);
    expect(JSON.parse(assets["rollback.json"]).databaseRollback).toBe(false);
  });
  test.each(["/private/with space", "/private/%h", "/private/$USER", "/private/a\nnew", "/private/../else"])("rejects unit command expansion path %s", nodeExecutable => {
    expect(() => validateProductionServicePlan({ ...plan(), nodeExecutable })).toThrow("PRODUCTION_PLAN_PATH");
  });
  test.each(["wrong-host", "public-upstream", "catchall", "extra-route", "extra-setting"])("rejects tunnel route drift %s", kind => {
    const input = validateProductionServicePlan(plan()); const tunnel = JSON.parse(renderProductionServiceAssets(input, "/private/plan.json")["cloudflared.json.proposed"]);
    if (kind === "wrong-host") tunnel.ingress[0].hostname = "other.example.invalid";
    if (kind === "public-upstream") tunnel.ingress[0].service = "http://0.0.0.0:3000";
    if (kind === "catchall") tunnel.ingress[2].service = "http_status:200";
    if (kind === "extra-route") tunnel.ingress.push({ service: "http_status:404" });
    if (kind === "extra-setting") tunnel.token = marker;
    expect(() => validateProductionTunnel(tunnel, input)).toThrow("PRODUCTION_TUNNEL_ROUTES");
  });
  test("rejects private configuration inside the application release", () => {
    expect(() => validateProductionServicePlan({ ...plan(), configFile: "/private/release/app/config.json" })).toThrow("PRODUCTION_INPUT_IN_RELEASE");
  });
});

describe("fixed production container units", () => {
  test("binds only reviewed inputs, cache and dedicated state with invocation-scoped cleanup", () => {
    const input = plan(), ca = "/private/ca.crt";
    const assets = renderProductionContainerAssets(input, "/private/plan.json", ca);
    const text = assets["jazz-production-container.service.proposed"];
    const argv = text.split("\n").find(line => line.startsWith("ExecStart="))!.slice(10).split(" ");
    for (const flag of ["--host=unix:///var/run/docker.sock", "--config=/private/docker-cli", "--rm", "--pull=never", "--init", "--read-only", "--cap-drop=ALL", "--security-opt=no-new-privileges", `--user=${process.geteuid!()}:${process.getegid!()}`, "--memory=2g", "--cpus=2", "--pids-limit=256", "--stop-timeout=15", "--network=culturadeljazz-production", "--name=culturadeljazz-${INVOCATION_ID}", PRODUCTION_CONTAINER_IMAGE]) expect(argv).toContain(flag);
    const mounts = argv.filter(arg => arg.startsWith("--mount="));
    const readonly = [input.appRoot, "/private/plan.json", input.configFile, input.manifestFile, input.nodeExecutable, ca, input.cloudflaredExecutable, input.tunnel.credentialsFile];
    expect(mounts.filter(arg => arg.endsWith(",readonly"))).toEqual(readonly.map(path => `--mount=type=bind,src=${path},dst=${path},readonly`));
    expect(mounts.filter(arg => !arg.endsWith(",readonly"))).toEqual([`--mount=type=bind,src=${input.appRoot}/.next/cache,dst=${input.appRoot}/.next/cache`, `--mount=type=bind,src=${dirname(input.runDirectory)},dst=${dirname(input.runDirectory)}`]);
    expect(mounts.some(arg => arg.includes("docker.sock"))).toBe(false);
    expect(argv.some(arg => /^--(?:publish|privileged|pid=host|network=host)/.test(arg))).toBe(false);
    expect(text).toContain("ExecStop=-/usr/bin/docker --host=unix:///var/run/docker.sock --config=/private/docker-cli stop --time=15 culturadeljazz-${INVOCATION_ID}");
    expect(text).toContain("Wants=jazz-production-tunnel.service\nBefore=jazz-production-tunnel.service");
    expect(assets["jazz-production-maintenance-container.service.proposed"]).toContain("--run-maintenance /private/plan.json");
  });
  test.each(["/run/user/1000/current", "/private/culturadeljazz-production-state/other"])("rejects an overbroad or wrong state path %s", runDirectory => {
    expect(() => renderProductionContainerAssets({ ...plan(), runDirectory }, "/private/plan.json", "/private/ca.crt")).toThrow("PRODUCTION_CONTAINER_RUNTIME_SCOPE");
  });
  test("rejects any read-only input inside the writable state parent", () => {
    const input = plan(), parent = dirname(input.runDirectory);
    const changes = [ { appRoot: `${parent}/release` }, { configFile: `${parent}/config.json` }, { manifestFile: `${parent}/manifest.json` }, { nodeExecutable: `${parent}/node` }, { cloudflaredExecutable: `${parent}/cloudflared` }, { tunnel: { ...input.tunnel, credentialsFile: `${parent}/tunnel.json` } } ];
    for (const change of changes) expect(() => renderProductionContainerAssets({ ...input, ...change }, "/private/plan.json", "/private/ca.crt")).toThrow("PRODUCTION_CONTAINER_INPUT");
    expect(() => renderProductionContainerAssets(input, `${parent}/plan.json`, "/private/ca.crt")).toThrow("PRODUCTION_CONTAINER_INPUT");
    expect(() => renderProductionContainerAssets(input, "/private/plan.json", `${parent}/ca.crt`)).toThrow("PRODUCTION_CONTAINER_INPUT");
  });
  test("rejects root ownership and arbitrary image/network plan extensions", () => {
    const uid = vi.spyOn(process, "geteuid").mockReturnValue(0);
    try { expect(() => renderProductionContainerAssets(plan(), "/private/plan.json", "/private/ca.crt")).toThrow("PRODUCTION_CONTAINER_OWNER"); } finally { uid.mockRestore(); }
    expect(() => renderProductionContainerAssets({ ...plan(), image: "arbitrary", network: "host" }, "/private/plan.json", "/private/ca.crt")).toThrow("PRODUCTION_PLAN_SHAPE");
  });
});

describe("actual filesystem preparation without service or provider work", () => {
  test("fully inspects the selected sealed fixture and writes only a new private proposal bundle", async () => {
    vi.stubGlobal("fetch", () => { throw new Error("Network forbidden"); });
    const f = fixture(); const inspected = await inspectProductionPreparation(f.planFile);
    expect(inspected.summary).toMatchObject({ status: "PREPARATION_ONLY", publicBuildBound: true, caFileBound: true,
      productionStartupImplemented: true, productionApproved: false, listenersStarted: 0, providerRequests: 0 });
    const out = join(f.root, "proposal"); await prepareProductionAssets({ planFile: f.planFile, outputDirectory: out });
    expect(lstatSync(out).mode & 0o777).toBe(0o700);
    for (const name of readdirSync(out)) { expect(lstatSync(join(out, name)).mode & 0o777).toBe(0o600); expect(readFileSync(join(out, name), "utf8")).not.toContain(marker); }
    expect(existsSync(join(out, "jazz-production-container.service.proposed"))).toBe(true);
    expect(existsSync(join(out, "jazz-production-maintenance-container.service.proposed"))).toBe(true);
    expect(lstatSync(join(f.root, "docker-cli")).mode & 0o777).toBe(0o700); expect(readdirSync(join(f.root, "docker-cli"))).toEqual([]);
    expect(existsSync(join(f.app, ".next/cache/.native-write-probe"))).toBe(false);
    expect(existsSync(f.input.runDirectory)).toBe(false);
  });
  test("release drift fails the full inspector before any output", async () => {
    const f = fixture(); chmodSync(join(f.app, ".next/BUILD_ID"), 0o600); writeFileSync(join(f.app, ".next/BUILD_ID"), "changed"); chmodSync(join(f.app, ".next/BUILD_ID"), 0o400);
    const out = join(f.root, "proposal"); await expect(prepareProductionAssets({ planFile: f.planFile, outputDirectory: out })).rejects.toThrow("NATIVE_RELEASE_HASH"); expect(existsSync(out)).toBe(false);
  });
  test("an existing output remains unchanged", async () => {
    const f = fixture(); const out = directory(f.root, "existing"); writeFileSync(join(out, "keep"), "owned-control");
    await expect(prepareProductionAssets({ planFile: f.planFile, outputDirectory: out })).rejects.toThrow();
    expect(readFileSync(join(out, "keep"), "utf8")).toBe("owned-control"); expect(readdirSync(out)).toEqual(["keep"]);
  });
  test("a peer-readable output parent is rejected", async () => {
    const f = fixture(); const parent = directory(f.root, "peer"); chmodSync(parent, 0o755);
    await expect(prepareProductionAssets({ planFile: f.planFile, outputDirectory: join(parent, "proposal") })).rejects.toThrow("PRODUCTION_OUTPUT_PARENT");
  });
  test("mismatching tunnel credentials are rejected without printing their contents", async () => {
    const f = fixture(); json(f.input.tunnel.credentialsFile, { TunnelID: "other", AccountTag: "a".repeat(32), TunnelSecret: Buffer.alloc(32, 7).toString("base64") });
    await expect(inspectProductionPreparation(f.planFile)).rejects.toThrow("PRODUCTION_TUNNEL_CREDENTIAL_SHAPE");
  });
  test("nonempty Docker auth/context configuration is preserved and rejected", async () => {
    const f = fixture(), docker = directory(f.root, "docker-cli"); writeFileSync(join(docker, "config.json"), "synthetic existing context");
    const out = join(f.root, "proposal"); await expect(prepareProductionAssets({ planFile: f.planFile, outputDirectory: out })).rejects.toThrow("PRODUCTION_DOCKER_CONFIG_NOT_EMPTY");
    expect(readFileSync(join(docker, "config.json"), "utf8")).toBe("synthetic existing context"); expect(existsSync(out)).toBe(false);
  });
  test("peer-readable runtime parent is rejected before preparing Docker configuration", async () => {
    const f = fixture(); chmodSync(dirname(f.input.runDirectory), 0o755);
    await expect(prepareProductionAssets({ planFile: f.planFile, outputDirectory: join(f.root, "proposal") })).rejects.toThrow("PRODUCTION_CONTAINER_DIRECTORY");
    expect(existsSync(join(f.root, "docker-cli"))).toBe(false);
  });
  test.each(["--activate", "--activate-tunnel", "--start", "--install"])("CLI denies %s before reading private inputs", async operation => {
    await expect(productionPreparationCli([operation, "/nonexistent/must-not-read.json"])).rejects.toThrow("PRODUCTION_ACTIVATION_NOT_IMPLEMENTED");
  });
});
