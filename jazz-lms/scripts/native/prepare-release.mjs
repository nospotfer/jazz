import { constants, createWriteStream } from 'node:fs';
import { mkdir, lstat, realpath, readdir, chmod, open, readlink, copyFile, rename, unlink } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NativeConfigurationError } from './config-policy.mjs';
import { digestFile, inspectNativeRelease, loadNativeConfiguration, publicBuildFingerprint } from './release-inspect.mjs';

const requireCondition = (condition, code) => { if (!condition) throw new NativeConfigurationError(code); };
const within = (root, path) => { const local = relative(root, path); return local === '' || (!local.startsWith('..') && !isAbsolute(local)); };
const runtimePath = `${dirname(process.execPath)}:/usr/bin:/bin`;
const baseEnvironment = { PATH: runtimePath, LANG: 'C.UTF-8', NEXT_TELEMETRY_DISABLED: '1' };
const fixtureDatabase = 'postgresql://fixture:fixture@127.0.0.1:1/native_build?connect_timeout=1&pool_timeout=1';
const npmConfiguration = cacheDirectory => ({
  npm_config_userconfig: join(cacheDirectory, 'empty-user.npmrc'),
  npm_config_globalconfig: join(cacheDirectory, 'empty-global.npmrc'),
});

/** Only browser-visible configuration reaches installation/static generation.
 * A closed loopback fixture URL satisfies Prisma imports without giving the
 * builder live database, signing, payment, mail or service-role credentials.
 */
export function nativeBuildEnvironment(config, temporaryDirectory, cacheDirectory) {
  const publicEnvironment = Object.fromEntries(Object.entries(config.env).filter(([name]) =>
    name.startsWith('NEXT_PUBLIC_') || ['APP_URL', 'APP_DEPLOYMENT_ENVIRONMENT', 'NODE_ENV'].includes(name)));
  return { ...baseEnvironment, ...publicEnvironment, DATABASE_URL: fixtureDatabase,
    TMPDIR: temporaryDirectory, npm_config_cache: cacheDirectory, ...npmConfiguration(cacheDirectory) };
}

/** No shell, finite errors, private output. Every child is awaited/reaped. */
function run(command, args, { cwd, env = baseEnvironment, logFile, timeout = 30_000, allowFailure = false } = {}) {
  return new Promise((resolveResult, reject) => {
    const output = [];
    let length = 0, timer, killTimer, timedOut = false, logFailed = false, settled = false;
    const log = logFile ? createWriteStream(logFile, { flags: 'wx', mode: 0o600 }) : null;
    const child = spawn(command, args, { cwd, env, detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
    // A fresh child-owned POSIX group keeps timeout/signal cleanup scoped to
    // this invocation, including npm's Next/Prisma descendants.
    const stopGroup = signal => {
      if (!child.pid) return;
      try { process.kill(-child.pid, signal); } catch (error) { if (error.code !== 'ESRCH') throw error; }
    };
    const terminate = () => {
      if (timedOut || settled) return;
      timedOut = true; stopGroup('SIGTERM');
      killTimer = setTimeout(() => stopGroup('SIGKILL'), 5_000);
    };
    process.once('SIGTERM', terminate); process.once('SIGINT', terminate);
    const done = (error, result) => {
      if (settled) return;
      settled = true; clearTimeout(timer); clearTimeout(killTimer);
      process.off('SIGTERM', terminate); process.off('SIGINT', terminate);
      if (log) log.end();
      if (error) reject(error); else resolveResult(result);
    };
    const collect = chunk => {
      length += chunk.length;
      if (length > (log ? 16 * 1024 * 1024 : 1024 * 1024)) { terminate(); return; }
      if (log) log.write(chunk);
      else output.push(chunk);
    };
    log?.on('error', () => { logFailed = true; terminate(); });
    child.stdout.on('data', collect); child.stderr.on('data', collect);
    child.once('error', () => done(new NativeConfigurationError('NATIVE_BUILD_CHILD')));
    child.once('close', code => {
      if (timedOut || logFailed || (!allowFailure && code !== 0)) {
        done(new NativeConfigurationError(timedOut ? 'NATIVE_BUILD_TIMEOUT' : 'NATIVE_BUILD_CHILD'));
      } else done(null, { code, output: Buffer.concat(output).toString('utf8').trim() });
    });
    timer = setTimeout(terminate, timeout);
  });
}

async function checkDirectory(path, { privateDirectory = false } = {}) {
  requireCondition(typeof path === 'string' && isAbsolute(path) && resolve(path) === path &&
    !/[\x00-\x1f\x7f]/.test(path) && await realpath(path) === path, 'NATIVE_BUILD_PATH');
  const stat = await lstat(path);
  requireCondition(stat.isDirectory() && stat.uid === process.geteuid() &&
    !(stat.mode & (privateDirectory ? 0o077 : 0o022)), 'NATIVE_BUILD_DIRECTORY');
}

/** Read-only preflight. Output must be a new sibling under an owned private
 * directory outside any Git worktree. Existing artifacts are never overwritten.
 */
export async function inspectNativePreparation({ configFile, repository, outputDirectory }) {
  const config = await loadNativeConfiguration(configFile);
  await checkDirectory(repository);
  requireCondition(typeof outputDirectory === 'string' && isAbsolute(outputDirectory) && resolve(outputDirectory) === outputDirectory &&
    !/[\x00-\x1f\x7f]/.test(outputDirectory) && !within(repository, outputDirectory), 'NATIVE_BUILD_PATH');
  const parent = dirname(outputDirectory);
  await checkDirectory(parent, { privateDirectory: true });
  try { await lstat(outputDirectory); throw new NativeConfigurationError('NATIVE_BUILD_EXISTS'); }
  catch (error) { if (error?.code !== 'ENOENT') throw error; }
  const top = await run('git', ['-C', repository, 'rev-parse', '--show-toplevel']);
  requireCondition(top.output === repository, 'NATIVE_BUILD_REPOSITORY');
  const commit = await run('git', ['-C', repository, 'rev-parse', 'HEAD^{commit}']);
  requireCondition(commit.output === config.sourceCommit, 'NATIVE_BUILD_SOURCE');
  const status = await run('git', ['-C', repository, 'status', '--porcelain=v1', '--untracked-files=all']);
  requireCondition(status.output === '', 'NATIVE_BUILD_DIRTY');
  const parentRepository = await run('git', ['-C', parent, 'rev-parse', '--is-inside-work-tree'], { allowFailure: true });
  requireCondition(parentRepository.code !== 0, 'NATIVE_BUILD_PARENT_REPOSITORY');
  return { config, summary: { sourceCommit: config.sourceCommit, mode: config.mode,
    cleanSource: true, outputExists: false, providerCredentialsVerified: false, productionApproved: false } };
}

async function inventory(root, directory = root, output = []) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name), local = relative(root, path);
    if (local === '.next/cache') continue;
    requireCondition(entry.name !== '.git' && entry.name !== '.vercel' &&
      !(entry.name.startsWith('.env') && entry.name !== '.env.example'), 'NATIVE_BUILD_AMBIENT_ENV');
    if (entry.isDirectory()) await inventory(root, path, output);
    else output.push(local);
  }
  return output;
}

const generated = path => path.startsWith('node_modules/') || path.startsWith('.next/') ||
  ['next-env.d.ts', 'tsconfig.tsbuildinfo'].includes(path);

export async function verifyNativeSourceInventory(appRoot, hashes) {
  const actual = (await inventory(appRoot)).filter(path => !generated(path));
  const expected = Object.keys(hashes).filter(path => !generated(path));
  requireCondition(actual.length === expected.length && actual.every(path => Object.hasOwn(hashes, path)), 'NATIVE_BUILD_SOURCE_CHANGED');
  for (const path of actual) {
    const fullPath = join(appRoot, path), stat = await lstat(fullPath);
    requireCondition(stat.isFile() && !stat.isSymbolicLink() && stat.nlink === 1 &&
      await digestFile(fullPath) === hashes[path], 'NATIVE_BUILD_SOURCE_CHANGED');
  }
}

async function seal(directory, root = directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (relative(root, path) === '.next/cache') continue;
    if (entry.isDirectory()) await seal(path, root);
    else if (!entry.isSymbolicLink()) {
      const stat = await lstat(path);
      requireCondition(stat.isFile() && stat.nlink === 1, 'NATIVE_BUILD_FILE');
      await chmod(path, stat.mode & 0o111 ? 0o500 : 0o400);
    }
  }
  await chmod(directory, 0o500);
}

/** esbuild's lifecycle legitimately hardlinks generated executables. Materialize
 * those bytes in a new inode before sealing so permissions/content cannot affect
 * another dependency/cache copy. Original source must never acquire hardlinks.
 */
export async function materializeNativeDependencies(root, directory = root) {
  if (directory === root) {
    // Validate the entire source invariant before splitting any generated link:
    // traversal order must not hide a source link by first reducing its nlink.
    for (const local of await inventory(root)) {
      if (generated(local)) continue;
      const stat = await lstat(join(root, local));
      requireCondition(stat.isFile() && !stat.isSymbolicLink() && stat.nlink === 1, 'NATIVE_BUILD_SOURCE_CHANGED');
    }
  }
  let copied = 0;
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name), local = relative(root, path);
    if (local === '.next/cache') continue;
    const stat = await lstat(path);
    if (stat.isDirectory()) copied += await materializeNativeDependencies(root, path);
    else if (!stat.isSymbolicLink()) {
      requireCondition(stat.isFile(), 'NATIVE_BUILD_FILE');
      if (stat.nlink === 1) continue;
      requireCondition(generated(local), 'NATIVE_BUILD_SOURCE_CHANGED');
      const temporary = join(directory, `.native-materialize-${randomUUID()}`);
      let created = false;
      try {
        await copyFile(path, temporary, constants.COPYFILE_EXCL);
        created = true;
        await chmod(temporary, stat.mode & 0o111 ? 0o700 : 0o600);
        await rename(temporary, path);
        created = false;
        copied += 1;
      } finally {
        // Only the owned random temporary name is eligible for cleanup.
        if (created) {
          try { await unlink(temporary); } catch (error) { if (error.code !== 'ENOENT') throw error; }
        }
      }
    }
  }
  return copied;
}

async function protectCache(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name), stat = await lstat(path);
    requireCondition(!stat.isSymbolicLink() && (stat.isDirectory() || (stat.isFile() && stat.nlink === 1)), 'NATIVE_BUILD_CACHE');
    if (stat.isDirectory()) await protectCache(path);
    else await chmod(path, 0o600);
  }
  await chmod(directory, 0o700);
}

async function writePrivateJson(path, value) {
  const file = await open(path, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL, 0o600);
  try { await file.writeFile(`${JSON.stringify(value, null, 2)}\n`); } finally { await file.close(); }
}

/** Fresh locked install and webpack build from an exact clean committed source.
 * Creates only the explicitly new output directory; no provider mutation,
 * listener, service, DNS, migration or production activation is performed.
 * A failure is retained privately for diagnosis and never auto-deleted.
 */
export async function prepareNativeRelease(input) {
  const { config } = await inspectNativePreparation(input);
  const output = input.outputDirectory;
  await mkdir(output, { mode: 0o700 });
  const appRoot = join(output, 'app'), logs = join(output, 'logs');
  const temporary = join(output, 'tmp'), cache = join(output, 'npm-cache');
  for (const path of [appRoot, logs, temporary, cache]) await mkdir(path, { mode: 0o700 });
  for (const path of Object.values(npmConfiguration(cache))) {
    const file = await open(path, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL, 0o600);
    await file.close();
  }
  const sourceTar = join(output, 'source.tar');
  await run('git', ['-C', input.repository, 'archive', '--format=tar', `--output=${sourceTar}`, config.sourceCommit, 'jazz-lms']);
  await chmod(sourceTar, 0o600);
  await run('tar', ['-xf', sourceTar, '--strip-components=1', '-C', appRoot]);
  const sourceFiles = await inventory(appRoot);
  const tracked = await run('git', ['-C', input.repository, 'ls-tree', '-rz', '--name-only', config.sourceCommit, 'jazz-lms']);
  const expectedSource = tracked.output.split('\0').filter(Boolean).map(path => path.slice('jazz-lms/'.length));
  requireCondition(sourceFiles.length === expectedSource.length && expectedSource.every(path => sourceFiles.includes(path)), 'NATIVE_BUILD_SOURCE_INVENTORY');
  const sourceHashes = {};
  for (const path of sourceFiles) {
    const stat = await lstat(join(appRoot, path));
    requireCondition(stat.isFile() && !stat.isSymbolicLink() && stat.nlink === 1, 'NATIVE_BUILD_SOURCE_FILE');
    sourceHashes[path] = await digestFile(join(appRoot, path));
  }
  const npm = join(dirname(process.execPath), 'npm');
  const installEnvironment = { ...baseEnvironment, DATABASE_URL: fixtureDatabase,
    TMPDIR: temporary, npm_config_cache: cache, ...npmConfiguration(cache) };
  await run(npm, ['ci', '--include=dev', '--no-audit', '--no-fund'], {
    cwd: appRoot, env: installEnvironment, logFile: join(logs, 'install-private.log'), timeout: 600_000,
  });
  await verifyNativeSourceInventory(appRoot, sourceHashes);
  await run(npm, ['run', 'build:webpack'], {
    cwd: appRoot, env: nativeBuildEnvironment(config, temporary, cache),
    logFile: join(logs, 'webpack-private.log'), timeout: 600_000,
  });
  // Lifecycle/build code may not add, remove or rewrite application source.
  // Only dependency/build roots and the two declared generated files are exempt.
  await verifyNativeSourceInventory(appRoot, sourceHashes);
  await mkdir(join(appRoot, '.next/cache'), { mode: 0o700, recursive: true });
  await protectCache(join(appRoot, '.next/cache'));
  const materializedDependencyFiles = await materializeNativeDependencies(appRoot);
  const files = {}, links = {}, paths = await inventory(appRoot), names = new Set(paths);
  for (const path of paths) {
    const absolute = join(appRoot, path);
    if ((await lstat(absolute)).isSymbolicLink()) {
      const destination = await realpath(absolute);
      requireCondition(within(appRoot, destination) && names.has(relative(appRoot, destination)), 'NATIVE_BUILD_SYMLINK');
      links[path] = await readlink(absolute);
    }
    files[path] = await digestFile(absolute);
  }
  const manifestFile = join(output, 'manifest.json');
  await writePrivateJson(manifestFile, {
    version: 1, sourceCommit: config.sourceCommit, nodeVersion: process.version,
    nodeSha256: await digestFile(process.execPath), publicBuildFingerprint: publicBuildFingerprint(config.env),
    caSha256: config.ca.sha256, sourceFiles: sourceHashes, files, links,
  });
  await seal(appRoot);
  const inspected = await inspectNativeRelease({ configFile: input.configFile, appRoot, manifestFile });
  const summary = { ...inspected.summary, freshLockedInstall: true, webpackBuild: true,
    serverCredentialsProvidedToBuild: false, materializedDependencyFiles, started: false };
  await writePrivateJson(join(output, 'summary.json'), summary);
  return { appRoot, manifestFile, summary };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [operation, configFile, repository, outputDirectory, ...extra] = process.argv.slice(2);
    requireCondition(['--inspect', '--build'].includes(operation) && extra.length === 0, 'NATIVE_BUILD_ARGUMENTS');
    const input = { configFile, repository, outputDirectory };
    const result = operation === '--build' ? await prepareNativeRelease(input) : await inspectNativePreparation(input);
    console.log(JSON.stringify(result.summary));
  } catch (error) {
    console.error(error instanceof NativeConfigurationError ? error.message : 'NATIVE_BUILD_FAILED');
    process.exitCode = 1;
  }
}
