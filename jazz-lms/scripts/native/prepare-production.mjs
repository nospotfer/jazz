import { createHash } from 'node:crypto';
import { lstat, mkdir, open, realpath } from 'node:fs/promises';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NativeConfigurationError } from './config-policy.mjs';
import { inspectNativeRelease, loadNativeConfiguration, readControlledFile } from './release-inspect.mjs';
import {
  outsideProductionPath, ProductionPreparationError, renderProductionServiceAssets,
  requireProductionCondition as requireCondition, validateProductionServicePlan,
} from './production-service-plan.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const ownPath = fileURLToPath(import.meta.url);

/** Full local inspection only. Secrets are returned internally in memory, never
 * in the summary or generated units. No child, listener or provider is opened.
 * The shared release inspector makes/removes its exclusive cache write probe.
 */
export async function inspectProductionPreparation(planFile) {
  requireCondition(process.platform === 'linux', 'PRODUCTION_PLATFORM');
  let raw;
  try { raw = JSON.parse((await readControlledFile(planFile, { privateFile: true, maximum: 32 * 1024 })).toString('utf8')); }
  catch (error) { if (error instanceof NativeConfigurationError) throw error; throw new ProductionPreparationError('PRODUCTION_PLAN_SHAPE'); }
  const plan = validateProductionServicePlan(raw);
  requireCondition(outsideProductionPath(plan.appRoot, planFile), 'PRODUCTION_INPUT_IN_RELEASE');
  const initial = await loadNativeConfiguration(plan.configFile);
  requireCondition(initial.mode === 'production' && initial.productionTarget === 'restored-customer', 'PRODUCTION_UNSAFE_OR_PREVIEW_TARGET');
  const inspected = await inspectNativeRelease(plan);
  const { config } = inspected;
  requireCondition(config.mode === 'production' && config.productionTarget === 'restored-customer' &&
    config.sourceCommit === plan.sourceCommit && config.projectRef === plan.projectRef && config.origin === plan.origin,
  'PRODUCTION_RELEASE_BINDING');
  requireCondition(outsideProductionPath(plan.appRoot, config.ca.path) &&
    plan.nodeExecutable === await realpath(process.execPath), 'PRODUCTION_RUNTIME_BINDING');
  requireCondition(hash(await readControlledFile(join(plan.appRoot, 'scripts/native/prepare-production.mjs'))) ===
    hash(await readControlledFile(ownPath)), 'PRODUCTION_PREPARER_RELEASE_BINDING');
  const binary = await lstat(plan.cloudflaredExecutable);
  requireCondition(binary.isFile() && !binary.isSymbolicLink() && binary.nlink === 1 &&
    (binary.mode & 0o111) !== 0, 'PRODUCTION_TUNNEL_BINARY');
  requireCondition(hash(await readControlledFile(plan.cloudflaredExecutable, { maximum: 128 * 1024 * 1024 })) ===
    plan.cloudflaredSha256, 'PRODUCTION_TUNNEL_BINARY');
  let credentials;
  try { credentials = JSON.parse((await readControlledFile(plan.tunnel.credentialsFile, { privateFile: true, maximum: 16 * 1024 })).toString('utf8')); }
  catch (error) { if (error instanceof NativeConfigurationError) throw error; throw new ProductionPreparationError('PRODUCTION_TUNNEL_CREDENTIAL_SHAPE'); }
  requireCondition(credentials && typeof credentials === 'object' && !Array.isArray(credentials) &&
    Object.keys(credentials).length === 3 && credentials.TunnelID === plan.tunnel.id &&
    typeof credentials.AccountTag === 'string' && /^[a-f0-9]{32}$/.test(credentials.AccountTag) &&
    typeof credentials.TunnelSecret === 'string' && /^[A-Za-z0-9+/]+={0,2}$/.test(credentials.TunnelSecret) &&
    Buffer.from(credentials.TunnelSecret, 'base64').length === 32 &&
    Buffer.from(credentials.TunnelSecret, 'base64').toString('base64') === credentials.TunnelSecret,
  'PRODUCTION_TUNNEL_CREDENTIAL_SHAPE');
  return { plan, config, summary: {
    ...inspected.summary, status: 'PREPARATION_ONLY', productionTarget: 'restored-customer',
    namedTunnelConfigurationBound: true, tunnelAccountVerified: false,
    productionStartupImplemented: true, productionApproved: false,
    serviceInstallationPerformed: false, listenersStarted: 0, providerRequests: 0,
  } };
}

/** Write one new owner-only review directory. Never copies credentials/config,
 * installs units, changes pointers, runs a tunnel, or applies a rollback.
 */
export async function prepareProductionAssets({ planFile, outputDirectory }) {
  const inspected = await inspectProductionPreparation(planFile);
  requireCondition(typeof outputDirectory === 'string' && isAbsolute(outputDirectory) &&
    resolve(outputDirectory) === outputDirectory && !/[\x00-\x1f\x7f]/.test(outputDirectory) &&
    outsideProductionPath(inspected.plan.appRoot, outputDirectory), 'PRODUCTION_OUTPUT_PATH');
  const parent = dirname(outputDirectory), stat = await lstat(parent);
  requireCondition(await realpath(parent) === parent && stat.isDirectory() && stat.uid === process.geteuid() &&
    (stat.mode & 0o777) === 0o700, 'PRODUCTION_OUTPUT_PARENT');
  // Exclusive mkdir rejects existing directories, including systemd locations.
  await mkdir(outputDirectory, { mode: 0o700 });
  const assets = renderProductionServiceAssets(inspected.plan, planFile);
  for (const [name, content] of Object.entries({ ...assets, 'summary.json': `${JSON.stringify(inspected.summary, null, 2)}\n` })) {
    const file = await open(join(outputDirectory, name), 'wx', 0o600);
    try { await file.writeFile(content); await file.sync(); } finally { await file.close(); }
  }
  return inspected.summary;
}

export async function productionPreparationCli(args) {
  // Reject activation before reading any path or private configuration.
  const operation = args[0]?.startsWith('--') ? args[0] : '--inspect';
  const values = args[0]?.startsWith('--') ? args.slice(1) : args;
  requireCondition(['--inspect', '--prepare'].includes(operation), 'PRODUCTION_ACTIVATION_NOT_IMPLEMENTED');
  requireCondition(values.length === (operation === '--prepare' ? 2 : 1), 'PRODUCTION_USAGE');
  return operation === '--prepare'
    ? prepareProductionAssets({ planFile: values[0], outputDirectory: values[1] })
    : (await inspectProductionPreparation(values[0])).summary;
}

if (process.argv[1] && resolve(process.argv[1]) === ownPath) {
  try { console.log(JSON.stringify(await productionPreparationCli(process.argv.slice(2)))); }
  catch (error) {
    console.error(error instanceof NativeConfigurationError || error instanceof ProductionPreparationError
      ? error.message : 'PRODUCTION_PREPARATION_FAILED');
    process.exitCode = 1;
  }
}
