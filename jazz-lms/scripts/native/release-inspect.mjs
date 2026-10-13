import { constants, createReadStream } from 'node:fs';
import { open, lstat, realpath, readdir, readlink } from 'node:fs/promises';
import { createHash, X509Certificate } from 'node:crypto';
import { resolve, relative, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateNativeConfig, NativeConfigurationError } from './config-policy.mjs';

function requireCondition(condition, code) { if (!condition) throw new NativeConfigurationError(code); }
const trustedOwner = stat => stat.uid === process.geteuid() || stat.uid === 0;

/** Owner/root-controlled regular inputs; reject symlinks and writable peers. */
async function readControlledFile(path, { privateFile = false, maximum = 256 * 1024 } = {}) {
  requireCondition(typeof path === 'string' && isAbsolute(path) && resolve(path) === path &&
    !/[\x00-\x1f\x7f]/.test(path), 'NATIVE_INPUT_PATH');
  requireCondition(await realpath(path) === path, 'NATIVE_INPUT_SYMLINK');
  const file = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  try {
    const stat = await file.stat();
    requireCondition(stat.isFile() && stat.nlink === 1 && trustedOwner(stat) && !(stat.mode & 0o022) &&
      (!privateFile || !(stat.mode & 0o077)) && stat.size <= maximum, 'NATIVE_INPUT_PERMISSIONS');
    return await file.readFile();
  } finally { await file.close(); }
}

export async function digestFile(path) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}

/** Secrets stay in memory for the caller, never in this fingerprint/receipt. */
export function publicBuildFingerprint(env) {
  const fields = Object.entries(env).filter(([name]) => name.startsWith('NEXT_PUBLIC_') ||
    ['APP_URL', 'APP_DEPLOYMENT_ENVIRONMENT', 'NODE_ENV'].includes(name)).sort(([a], [b]) => a.localeCompare(b));
  return createHash('sha256').update(JSON.stringify(fields)).digest('hex');
}

async function inventory(root, directory = root, output = []) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name), local = relative(root, path);
    if (local === '.next/cache') continue;
    if (entry.isDirectory()) {
      const stat = await lstat(path);
      requireCondition(trustedOwner(stat) && !(stat.mode & 0o222), 'NATIVE_RELEASE_PERMISSIONS');
      await inventory(root, path, output);
    }
    else output.push(local);
  }
  return output;
}

async function inspectCache(directory, budget = { entries: 0 }) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    requireCondition(++budget.entries <= 100_000, 'NATIVE_RELEASE_CACHE');
    const path = join(directory, entry.name), stat = await lstat(path);
    requireCondition(trustedOwner(stat) && !(stat.mode & 0o022) && !stat.isSymbolicLink() &&
      (stat.isDirectory() || (stat.isFile() && stat.nlink === 1)), 'NATIVE_RELEASE_CACHE');
    if (stat.isDirectory()) await inspectCache(path, budget);
  }
}

/** Read explicit private configuration and bind its reviewed CA. No provider
 * calls or ambient environment loading. This is not credential ownership proof.
 */
export async function loadNativeConfiguration(configFile) {
  requireCondition(process.versions.node.split('.')[0] === '24', 'NATIVE_RUNTIME_VERSION');
  const rawConfig = await readControlledFile(configFile, { privateFile: true, maximum: 64 * 1024 });
  let parsed;
  try { parsed = JSON.parse(rawConfig.toString('utf8')); } catch { throw new NativeConfigurationError('NATIVE_CONFIG_SHAPE'); }
  const config = validateNativeConfig(parsed);
  const ca = await readControlledFile(config.ca.path);
  requireCondition(createHash('sha256').update(ca).digest('hex') === config.ca.sha256, 'NATIVE_CA_HASH');
  try {
    const certificate = new X509Certificate(ca);
    requireCondition(certificate.ca && Date.parse(certificate.validFrom) <= Date.now() &&
      Date.parse(certificate.validTo) > Date.now(), 'NATIVE_CA_CERTIFICATE');
  } catch { throw new NativeConfigurationError('NATIVE_CA_CERTIFICATE'); }
  return config;
}

/** Verify a complete producer receipt before any listener/child is started.
 * No provider calls, .env sourcing or service install occurs. A temporary cache
 * write probe is created exclusively and removed after validation.
 * @param {{configFile:string,appRoot:string,manifestFile:string}} input
 */
export async function inspectNativeRelease({ configFile, appRoot, manifestFile }) {
  const config = await loadNativeConfiguration(configFile);
  requireCondition(typeof appRoot === 'string' && isAbsolute(appRoot) && resolve(appRoot) === appRoot &&
    await realpath(appRoot) === appRoot, 'NATIVE_RELEASE_PATH');
  const rootStat = await lstat(appRoot);
  requireCondition(rootStat.isDirectory() && trustedOwner(rootStat) && !(rootStat.mode & 0o222), 'NATIVE_RELEASE_PERMISSIONS');
  let manifest;
  try { manifest = JSON.parse((await readControlledFile(manifestFile, { privateFile: true, maximum: 16 * 1024 * 1024 })).toString('utf8')); }
  catch (error) { if (error instanceof NativeConfigurationError) throw error; throw new NativeConfigurationError('NATIVE_MANIFEST_SHAPE'); }
  requireCondition(manifest?.version === 1 && manifest.sourceCommit === config.sourceCommit &&
    manifest.nodeVersion === process.version && manifest.nodeSha256 === await digestFile(process.execPath) &&
    manifest.publicBuildFingerprint === publicBuildFingerprint(config.env) && manifest.caSha256 === config.ca.sha256 &&
    manifest.files && typeof manifest.files === 'object' && !Array.isArray(manifest.files), 'NATIVE_MANIFEST_BINDING');
  const files = await inventory(appRoot);
  const fileNames = new Set(files);
  const expectedLinks = manifest.links ?? {};
  requireCondition(expectedLinks && typeof expectedLinks === 'object' && !Array.isArray(expectedLinks), 'NATIVE_RELEASE_SYMLINK');
  const actualLinks = [];
  requireCondition(files.length === Object.keys(manifest.files).length && files.every(path => Object.hasOwn(manifest.files, path)), 'NATIVE_RELEASE_INVENTORY');
  requireCondition(files.includes('.next/BUILD_ID') && files.includes('package-lock.json') &&
    files.includes('node_modules/next/dist/bin/next'), 'NATIVE_RELEASE_BUILD');
  for (const path of files) {
    requireCondition(!path.split('/').some(part => part === '.git' || part === '.vercel') &&
      !(path.split('/').at(-1).startsWith('.env') && path.split('/').at(-1) !== '.env.example'), 'NATIVE_RELEASE_AMBIENT_ENV');
    const expected = manifest.files[path];
    requireCondition(typeof expected === 'string' && /^[a-f0-9]{64}$/.test(expected), 'NATIVE_RELEASE_HASH');
    const fullPath = join(appRoot, path), stat = await lstat(fullPath);
    requireCondition(trustedOwner(stat) && (stat.isSymbolicLink() || !(stat.mode & 0o222)), 'NATIVE_RELEASE_PERMISSIONS');
    if (stat.isSymbolicLink()) {
      const destination = await realpath(fullPath);
      const destinationPath = relative(appRoot, destination);
      requireCondition(!destinationPath.startsWith('..') && isAbsolute(destination) &&
        fileNames.has(destinationPath) && Object.hasOwn(manifest.files, destinationPath) &&
        Object.hasOwn(expectedLinks, path) && expectedLinks[path] === await readlink(fullPath), 'NATIVE_RELEASE_SYMLINK');
      actualLinks.push(path);
    } else requireCondition(stat.isFile() && stat.nlink === 1, 'NATIVE_RELEASE_FILE');
    requireCondition(await digestFile(fullPath) === expected, 'NATIVE_RELEASE_HASH');
  }
  requireCondition(actualLinks.length === Object.keys(expectedLinks).length, 'NATIVE_RELEASE_SYMLINK');
  // Cache is deliberately omitted from immutable hashes but must be an actual
  // release-local directory, not a shortcut into shared source/another release.
  const cachePath = join(appRoot, '.next/cache'), cacheStat = await lstat(cachePath);
  requireCondition(cacheStat.isDirectory() && !cacheStat.isSymbolicLink() && trustedOwner(cacheStat) &&
    !(cacheStat.mode & 0o022), 'NATIVE_RELEASE_CACHE');
  await inspectCache(cachePath);
  const cache = await open(join(cachePath, '.native-write-probe'), constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL, 0o600);
  await cache.close();
  // Remove only this exclusively-created probe, leaving all existing cache data.
  const { unlink } = await import('node:fs/promises');
  await unlink(join(cachePath, '.native-write-probe'));
  return { config, summary: {
    sourceCommit: config.sourceCommit, mode: config.mode, immutableFiles: files.length,
    nodeVersion: process.version, publicBuildBound: true, caFileBound: true,
    cacheWritable: true, providerCredentialsVerified: false, productionApproved: false,
  } };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [configFile, appRoot, manifestFile] = process.argv.slice(2);
    const result = await inspectNativeRelease({ configFile, appRoot, manifestFile });
    console.log(JSON.stringify(result.summary));
  } catch (error) {
    console.error(error instanceof NativeConfigurationError ? error.message : 'NATIVE_RELEASE_INSPECTION_FAILED');
    process.exitCode = 1;
  }
}
