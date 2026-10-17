import { fork } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import http from 'node:http';
import { mkdir, lstat, realpath, rmdir, rm, readdir, readFile, unlink, chmod } from 'node:fs/promises';
import { dirname, isAbsolute, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NativeConfigurationError } from './config-policy.mjs';
import { inspectNativeRelease, readControlledFile } from './release-inspect.mjs';
import { createIngressServer } from './ingress-server.mjs';

const requireCondition = (condition, code) => { if (!condition) throw new NativeConfigurationError(code); };
const sleep = milliseconds => new Promise(resolveSleep => setTimeout(resolveSleep, milliseconds));

async function privateParent(path) {
  requireCondition(typeof path === 'string' && isAbsolute(path) && resolve(path) === path &&
    !/[\x00-\x1f\x7f]/.test(path) && await realpath(path) === path, 'NATIVE_RUN_PATH');
  const stat = await lstat(path);
  requireCondition(stat.isDirectory() && stat.uid === process.geteuid() && (stat.mode & 0o700) === 0o700 &&
    !(stat.mode & 0o077), 'NATIVE_RUN_PARENT');
}

/** Private config is returned only in memory. Inspection neither binds nor
 * spawns; the release inspector makes its exclusive temporary cache probe.
 */
export async function inspectNativePreview(launchFile) {
  requireCondition(process.platform === 'linux', 'NATIVE_LAUNCH_PLATFORM');
  let plan;
  try { plan = JSON.parse((await readControlledFile(launchFile, { privateFile: true, maximum: 32 * 1024 })).toString('utf8')); }
  catch (error) { if (error instanceof NativeConfigurationError) throw error; throw new NativeConfigurationError('NATIVE_LAUNCH_SHAPE'); }
  requireCondition(plan?.version === 1 && plan && typeof plan === 'object' && !Array.isArray(plan), 'NATIVE_LAUNCH_SHAPE');
  const access = plan.previewAccess;
  requireCondition(access && typeof access === 'object' && typeof access.username === 'string' &&
    /^[A-Za-z0-9._-]{1,48}$/.test(access.username) && typeof access.password === 'string' &&
    /^[A-Za-z0-9_-]{32,128}$/.test(access.password) && typeof access.expiresAt === 'string', 'NATIVE_LAUNCH_ACCESS');
  const expiresAt = Date.parse(access.expiresAt);
  requireCondition(Number.isFinite(expiresAt) && new Date(expiresAt).toISOString() === access.expiresAt &&
    expiresAt > Date.now() && expiresAt <= Date.now() + 3_600_000, 'NATIVE_LAUNCH_EXPIRY');
  requireCondition(typeof plan.runDirectory === 'string' && isAbsolute(plan.runDirectory) &&
    resolve(plan.runDirectory) === plan.runDirectory && !/[\x00-\x1f\x7f]/.test(plan.runDirectory) &&
    Buffer.byteLength(join(plan.runDirectory, 'edge.sock')) <= 100, 'NATIVE_RUN_PATH');
  await privateParent(dirname(plan.runDirectory));
  try { await lstat(plan.runDirectory); throw new NativeConfigurationError('NATIVE_RUN_EXISTS'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const inspected = await inspectNativeRelease({ configFile: plan.configFile, appRoot: plan.appRoot, manifestFile: plan.manifestFile });
  requireCondition(inspected.config.mode === 'preview', 'NATIVE_PRODUCTION_START_DENIED');
  const outside = path => {
    const local = relative(plan.appRoot, path);
    return local === '..' || local.startsWith('../') || isAbsolute(local);
  };
  requireCondition(outside(plan.runDirectory), 'NATIVE_RUN_IN_RELEASE');
  requireCondition([launchFile, plan.configFile, plan.manifestFile, inspected.config.ca.path].every(outside), 'NATIVE_LAUNCH_INPUT_IN_RELEASE');
  const workerPath = join(plan.appRoot, 'scripts/native/next-worker.mjs');
  const worker = await lstat(workerPath);
  requireCondition(worker.isFile() && !worker.isSymbolicLink() && worker.nlink === 1 && !(worker.mode & 0o222), 'NATIVE_WORKER_RELEASE');
  requireCondition(Date.now() < expiresAt, 'NATIVE_LAUNCH_EXPIRY');
  return { plan, config: inspected.config, expiresAt, workerPath,
    summary: { ...inspected.summary, privateUnixTransport: true, previewGateRequired: true,
      previewWorkerTransportAllowed: true, expiresAt: access.expiresAt, inspectedOnly: true } };
}

/** Linux process-group observation uses only UID/group/session/state metadata.
 * A dead leader is not proof that its npm/worker descendants stopped; zombies
 * are already stopped and can await the system reaper. No cmdline/env is read.
 */
async function livingGroupMembers(group) {
  try { process.kill(-group, 0); } catch (error) { if (error.code === 'ESRCH') return []; throw error; }
  const members = [];
  for (const name of await readdir('/proc')) {
    if (!/^\d+$/.test(name)) continue;
    try {
      const path = join('/proc', name), stat = await lstat(path);
      const text = await readFile(join(path, 'stat'), 'utf8'), fields = text.slice(text.lastIndexOf(')') + 2).split(' ');
      if (Number(fields[2]) !== group || Number(fields[3]) !== group || fields[0] === 'Z') continue;
      requireCondition(stat.uid === process.geteuid(), 'NATIVE_CHILD_GROUP_OWNER');
      members.push(Number(name));
    } catch (error) { if (!['ENOENT', 'ESRCH', 'EACCES'].includes(error.code)) throw error; }
  }
  return members;
}

async function stopOwnedChild(child, closed) {
  if (!child?.pid) return;
  if (child.connected) { try { child.send({ type: 'stop' }, () => {}); } catch { /* Already closing. */ } }
  const signal = async value => {
    if ((await livingGroupMembers(child.pid)).length) {
      try { process.kill(-child.pid, value); } catch (error) { if (error.code !== 'ESRCH') throw error; }
    }
  };
  await signal('SIGTERM');
  const deadline = Date.now() + 10_000;
  while ((await livingGroupMembers(child.pid)).length && Date.now() < deadline) await sleep(50);
  await signal('SIGKILL');
  await closed;
  const finalDeadline = Date.now() + 2_000;
  while ((await livingGroupMembers(child.pid)).length && Date.now() < finalDeadline) await sleep(50);
  requireCondition((await livingGroupMembers(child.pid)).length === 0, 'NATIVE_CHILD_NOT_STOPPED');
}

async function closeIngress(server) {
  if (!server?.listening) return;
  const force = setTimeout(() => server.closeAllConnections(), 5_000);
  await new Promise(resolveClose => server.close(() => resolveClose()));
  clearTimeout(force);
}

function robotsProbe(socketPath, hostname) {
  return new Promise((resolveProbe, reject) => {
    let bytes = 0, body = '';
    const request = http.request({ socketPath, path: '/robots.txt', method: 'GET', agent: false,
      headers: { host: hostname, 'x-forwarded-host': hostname, 'x-forwarded-proto': 'https' } }, response => {
      response.on('data', chunk => {
        bytes += chunk.length;
        if (bytes > 4096) request.destroy(new Error('NATIVE_READY_BODY'));
        else body += chunk.toString('utf8');
      });
      response.once('error', () => reject(new NativeConfigurationError('NATIVE_READY_PROBE')));
      response.once('aborted', () => reject(new NativeConfigurationError('NATIVE_READY_PROBE')));
      response.once('end', () => {
        if (response.complete && response.statusCode === 200 && /(?:^|\n)Disallow: \/(?:\r?\n|$)/.test(body)) resolveProbe();
        else reject(new NativeConfigurationError('NATIVE_READY_PROBE'));
      });
    });
    const timeout = setTimeout(() => request.destroy(new Error('NATIVE_READY_TIMEOUT')), 5_000);
    request.once('close', () => clearTimeout(timeout));
    request.once('error', () => reject(new NativeConfigurationError('NATIVE_READY_PROBE')));
    request.end();
  });
}

/** Starts a bounded PREVIEW only. No public TCP listener/tunnel/service/DNS or
 * provider action is performed. Production inspection is never startup approval.
 */
export async function startNativePreview(launchFile) {
  const inspected = await inspectNativePreview(launchFile);
  const { plan, config, expiresAt, workerPath } = inspected;
  const previousUmask = process.umask(0o077);
  let child, childClosed, ingress, expiryTimer, readinessTimer, cleanupPromise, runIdentity, temporaryIdentity;
  let startupReject, closing = false, readyAccepted = false;
  let resourceCreation = Promise.resolve();
  const socketIdentities = {}, diagnostics = { warn: 0, error: 0 };
  const requireRunning = () => requireCondition(!closing && Date.now() < expiresAt, 'NATIVE_START_STOPPED');
  const recordResource = operation => {
    requireRunning();
    const pending = operation();
    resourceCreation = pending.catch(() => {});
    return pending;
  };
  let resolveClosed;
  const closed = new Promise(resolveFinished => { resolveClosed = resolveFinished; });
  const socketPaths = { app: join(plan.runDirectory, 'app.sock'), edge: join(plan.runDirectory, 'edge.sock') };
  const temporary = join(plan.runDirectory, 'tmp');
  const close = reason => {
    if (cleanupPromise) return cleanupPromise;
    closing = true; clearTimeout(expiryTimer); clearTimeout(readinessTimer);
    startupReject?.(new NativeConfigurationError('NATIVE_START_STOPPED'));
    cleanupPromise = (async () => {
      // mkdir/listen can complete after a signal. Wait until their identity is
      // recorded; startup checks cancellation before starting another operation.
      await resourceCreation;
      const stopped = await Promise.allSettled([closeIngress(ingress), stopOwnedChild(child, childClosed)]);
      let clean = stopped.every(result => result.status === 'fulfilled');
      const childStopped = stopped[1].status === 'fulfilled';
      process.off('SIGTERM', onSignal); process.off('SIGINT', onSignal);
      // Preserve unexpected replacement/extra entries. Remove only the new
      // owned temp tree and then the empty recorded run directory.
      if (runIdentity && childStopped) {
        try {
          const current = await lstat(plan.runDirectory);
          if (current.dev === runIdentity.dev && current.ino === runIdentity.ino && current.uid === process.geteuid() && current.isDirectory()) {
            for (const [name, identity] of Object.entries(socketIdentities)) {
              if (name === 'edge' && stopped[0].status !== 'fulfilled') continue;
              try {
                const socket = await lstat(socketPaths[name]);
                if (socket.isSocket() && socket.uid === process.geteuid() && socket.dev === identity.dev && socket.ino === identity.ino) await unlink(socketPaths[name]);
                else clean = false;
              } catch (error) { if (error.code !== 'ENOENT') clean = false; }
            }
            if (temporaryIdentity) {
              try {
                const temp = await lstat(temporary);
                if (temp.dev === temporaryIdentity.dev && temp.ino === temporaryIdentity.ino && temp.isDirectory()) await rm(temporary, { recursive: true });
                else clean = false;
              } catch (error) { if (error.code !== 'ENOENT') clean = false; }
            }
            await rmdir(plan.runDirectory);
          } else clean = false;
        } catch (error) { if (error.code !== 'ENOENT') clean = false; }
      }
      process.umask(previousUmask);
      const receipt = { stopped: stopped.every(result => result.status === 'fulfilled'), clean,
        reason: ['signal', 'expiry', 'child_exit', 'startup_failure', 'requested'].includes(reason) ? reason : 'requested',
        diagnostics: { ...diagnostics } };
      resolveClosed(receipt);
      return receipt;
    })();
    return cleanupPromise;
  };
  const onSignal = () => { void close('signal'); };
  process.once('SIGTERM', onSignal); process.once('SIGINT', onSignal);
  try {
    await recordResource(async () => {
      await mkdir(plan.runDirectory, { mode: 0o700 }); runIdentity = await lstat(plan.runDirectory);
    });
    await recordResource(async () => {
      await mkdir(temporary, { mode: 0o700 }); temporaryIdentity = await lstat(temporary);
    });
    requireRunning();
    expiryTimer = setTimeout(() => { void close('expiry'); }, expiresAt - Date.now());
    const nonce = randomBytes(32).toString('hex'), hostname = new URL(config.origin).hostname;
    const readiness = new Promise((resolveReady, reject) => {
      startupReject = reject;
      readinessTimer = setTimeout(() => reject(new NativeConfigurationError('NATIVE_START_TIMEOUT')), 60_000);
      child = fork(workerPath, [], { execPath: process.execPath, execArgv: [], cwd: plan.appRoot,
        env: { ...config.env, PATH: `${dirname(process.execPath)}:/usr/bin:/bin`, TMPDIR: temporary },
        detached: true, serialization: 'json', stdio: ['ignore', 'ignore', 'ignore', 'ipc'] });
      childClosed = new Promise(resolveChild => child.once('close', () => resolveChild()));
      child.once('error', () => reject(new NativeConfigurationError('NATIVE_CHILD_START')));
      child.once('exit', () => { reject(new NativeConfigurationError('NATIVE_CHILD_EXIT')); if (readyAccepted) void close('child_exit'); });
      child.on('message', message => {
        if (message?.type === 'ready') {
          if (readyAccepted || closing || message.role !== 'next' || message.nonce !== nonce || message.pid !== child.pid || child.exitCode !== null || child.signalCode !== null) {
            reject(new NativeConfigurationError('NATIVE_CHILD_READINESS')); void close('startup_failure'); return;
          }
          readyAccepted = true; resolveReady();
        } else if (message?.type === 'failed') {
          reject(new NativeConfigurationError('NATIVE_CHILD_START')); void close('startup_failure');
        }
        else if (message?.type === 'diagnostic' && ['warn', 'error'].includes(message.level) &&
          ['NATIVE_APP_DIAGNOSTIC', 'P2002', 'P2003', 'P2024', 'P2025', 'EACCES', 'EROFS', 'ABORT_ERR'].includes(message.code)) {
          diagnostics[message.level] = Math.min(diagnostics[message.level] + 1, 1_000_000);
        }
        // Only finite classifications become counters; raw IPC is never logged.
      });
      child.send({ type: 'start', socketPath: socketPaths.app, hostname, nonce, expiresAt }, error => {
        if (error) reject(new NativeConfigurationError('NATIVE_CHILD_START'));
      });
    });
    await readiness;
    clearTimeout(readinessTimer);
    await recordResource(async () => {
      const stat = await lstat(socketPaths.app);
      requireCondition(stat.isSocket() && stat.uid === process.geteuid() && !(stat.mode & 0o077), 'NATIVE_READY_SOCKET');
      socketIdentities.app = stat;
    });
    await robotsProbe(socketPaths.app, hostname);
    requireCondition(!closing && child.exitCode === null && child.signalCode === null && Date.now() < expiresAt, 'NATIVE_START_STOPPED');
    ingress = createIngressServer({ upstreamSocket: socketPaths.app,
      policy: { canonicalHost: hostname }, previewAccess: plan.previewAccess, allowPreviewWorkerTransport: true });
    await recordResource(async () => {
      await new Promise((resolveListen, reject) => {
        ingress.once('error', reject); ingress.listen(socketPaths.edge, () => { ingress.off('error', reject); resolveListen(); });
      });
      await chmod(socketPaths.edge, 0o600);
      const edge = await lstat(socketPaths.edge);
      requireCondition(edge.isSocket() && edge.uid === process.geteuid() && !(edge.mode & 0o077), 'NATIVE_READY_SOCKET');
      socketIdentities.edge = edge;
    });
    requireRunning();
    ingress.on('error', () => { void close('startup_failure'); });
    return { socketPaths, closed, close: () => close('requested'), summary: {
      ...inspected.summary, inspectedOnly: false, started: true, childReady: true, socketsPrivate: true,
    } };
  } catch (error) {
    await close('startup_failure');
    throw error instanceof NativeConfigurationError ? error : new NativeConfigurationError('NATIVE_PREVIEW_START_FAILED');
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [operation, launchFile, ...extra] = process.argv.slice(2);
    requireCondition(['--inspect', '--run-preview'].includes(operation) && extra.length === 0, 'NATIVE_LAUNCH_ARGUMENTS');
    if (operation === '--inspect') console.log(JSON.stringify((await inspectNativePreview(launchFile)).summary));
    else {
      const controller = await startNativePreview(launchFile);
      console.log(JSON.stringify(controller.summary));
      const receipt = await controller.closed; console.log(JSON.stringify(receipt));
      if (!receipt.clean) process.exitCode = 1;
    }
  } catch (error) {
    console.error(error instanceof NativeConfigurationError ? error.message : 'NATIVE_PREVIEW_FAILED');
    process.exitCode = 1;
  }
}
