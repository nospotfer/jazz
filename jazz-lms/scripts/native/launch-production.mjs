import { fork } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import http from 'node:http';
import { chmod, lstat, mkdir, rm, rmdir, unlink } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NativeConfigurationError } from './config-policy.mjs';
import { inspectProductionPreparation } from './prepare-production.mjs';
import { readControlledFile } from './release-inspect.mjs';
import { privateParent, closeIngress, stopOwnedChild } from './launch-preview.mjs';
import { createIngressServer } from './ingress-server.mjs';
import { loadMaintenanceResponse } from './maintenance-response.mjs';

const requireCondition = (condition, code) => { if (!condition) throw new NativeConfigurationError(code); };
const ownPath = fileURLToPath(import.meta.url);
const digest = bytes => createHash('sha256').update(bytes).digest('hex');

export async function inspectNativeProduction(planFile) {
  const inspected = await inspectProductionPreparation(planFile);
  const { plan, config } = inspected;
  requireCondition(digest(await readControlledFile(join(plan.appRoot, 'scripts/native/launch-production.mjs'))) ===
    digest(await readControlledFile(ownPath)), 'NATIVE_PRODUCTION_LAUNCHER_BINDING');
  requireCondition(config.mode === 'production' && config.productionTarget === 'restored-customer' &&
    config.projectRef === 'klaiiikojgdfclzhqfgt' && config.origin === 'https://www.culturadeljazz.com' &&
    !config.testPayments && !config.recoveryAccess, 'NATIVE_PRODUCTION_TARGET');
  await privateParent(dirname(plan.runDirectory));
  try { await lstat(plan.runDirectory); throw new NativeConfigurationError('NATIVE_RUN_EXISTS'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const workerPath = join(plan.appRoot, 'scripts/native/next-worker.mjs');
  const worker = await lstat(workerPath);
  requireCondition(worker.isFile() && !worker.isSymbolicLink() && worker.nlink === 1 && !(worker.mode & 0o222), 'NATIVE_WORKER_RELEASE');
  const maintenanceFallback = await loadMaintenanceResponse(plan.appRoot);
  return { ...inspected, workerPath, maintenanceFallback, summary: { ...inspected.summary,
    privateUnixTransport: true, previewGateRequired: false, inspectedOnly: true,
    productionStartupImplemented: true, productionApproved: false } };
}

function productionRobotsProbe(socketPath) {
  return new Promise((resolveProbe, reject) => {
    let body = '', size = 0;
    const request = http.request({ socketPath, path: '/robots.txt', method: 'GET', agent: false,
      headers: { host: 'www.culturadeljazz.com', 'x-forwarded-host': 'www.culturadeljazz.com', 'x-forwarded-proto': 'https' } }, response => {
      response.on('data', chunk => {
        size += chunk.length;
        if (size > 4096) request.destroy(new Error('NATIVE_READY_BODY'));
        else body += chunk.toString('utf8');
      });
      response.once('error', () => reject(new NativeConfigurationError('NATIVE_READY_PROBE')));
      response.once('aborted', () => reject(new NativeConfigurationError('NATIVE_READY_PROBE')));
      response.once('end', () => {
        if (response.complete && response.statusCode === 200 && /(?:^|\n)Allow: \/(?:\r?\n|$)/.test(body) &&
          !/(?:^|\n)Disallow: \/(?:\r?\n|$)/.test(body) &&
          /(?:^|\n)Sitemap: https:\/\/www\.culturadeljazz\.com\/sitemap\.xml(?:\r?\n|$)/.test(body)) resolveProbe();
        else reject(new NativeConfigurationError('NATIVE_READY_PROBE'));
      });
    });
    const timer = setTimeout(() => request.destroy(new Error('NATIVE_READY_TIMEOUT')), 5_000);
    request.once('close', () => clearTimeout(timer));
    request.once('error', () => reject(new NativeConfigurationError('NATIVE_READY_PROBE')));
    request.end();
  });
}

async function startProduction(planFile, maintenanceOnly) {
  const inspected = await inspectNativeProduction(planFile);
  const { plan, config, workerPath, maintenanceFallback } = inspected;
  const previousUmask = process.umask(0o077);
  let child, childClosed, ingress, readinessTimer, startupReject, cleanupPromise, runIdentity, temporaryIdentity;
  let closing = false, readyAccepted = false;
  let resourceCreation = Promise.resolve();
  const diagnostics = { warn: 0, error: 0 }, identities = {};
  const socketPaths = { app: join(plan.runDirectory, 'app.sock'), edge: join(plan.runDirectory, 'edge.sock') };
  const temporary = join(plan.runDirectory, 'tmp');
  const requireRunning = () => requireCondition(!closing, 'NATIVE_START_STOPPED');
  const recordResource = operation => {
    requireRunning(); const pending = operation(); resourceCreation = pending.catch(() => {}); return pending;
  };
  let resolveClosed;
  const closed = new Promise(resolveReceipt => { resolveClosed = resolveReceipt; });
  const close = reason => {
    if (cleanupPromise) return cleanupPromise;
    closing = true; clearTimeout(readinessTimer);
    startupReject?.(new NativeConfigurationError('NATIVE_START_STOPPED'));
    cleanupPromise = (async () => {
      await resourceCreation;
      const results = await Promise.allSettled([closeIngress(ingress), stopOwnedChild(child, childClosed)]);
      let clean = results.every(result => result.status === 'fulfilled');
      process.off('SIGTERM', onSignal); process.off('SIGINT', onSignal);
      if (runIdentity && results[1].status === 'fulfilled') {
        try {
          const current = await lstat(plan.runDirectory);
          if (current.dev === runIdentity.dev && current.ino === runIdentity.ino && current.uid === process.geteuid() && current.isDirectory()) {
            for (const [name, identity] of Object.entries(identities)) {
              if (name === 'edge' && results[0].status !== 'fulfilled') continue;
              try {
                const socket = await lstat(socketPaths[name]);
                if (socket.isSocket() && socket.uid === process.geteuid() && socket.dev === identity.dev && socket.ino === identity.ino) await unlink(socketPaths[name]);
                else clean = false;
              } catch (error) { if (error.code !== 'ENOENT') clean = false; }
            }
            if (temporaryIdentity) {
              try {
                const stat = await lstat(temporary);
                if (stat.dev === temporaryIdentity.dev && stat.ino === temporaryIdentity.ino && stat.isDirectory()) await rm(temporary, { recursive: true });
                else clean = false;
              } catch (error) { if (error.code !== 'ENOENT') clean = false; }
            }
            await rmdir(plan.runDirectory);
          } else clean = false;
        } catch (error) { if (error.code !== 'ENOENT') clean = false; }
      }
      process.umask(previousUmask);
      const stopped = results.every(result => result.status === 'fulfilled');
      const receipt = { stopped, clean, failed: !stopped || !clean || !['requested', 'signal'].includes(reason),
        reason: ['requested', 'signal', 'child_exit', 'startup_failure'].includes(reason) ? reason : 'startup_failure',
        diagnostics: { ...diagnostics } };
      resolveClosed(receipt); return receipt;
    })();
    return cleanupPromise;
  };
  const onSignal = () => { void close('signal'); };
  process.once('SIGTERM', onSignal); process.once('SIGINT', onSignal);
  try {
    await recordResource(async () => { await mkdir(plan.runDirectory, { mode: 0o700 }); runIdentity = await lstat(plan.runDirectory); });
    if (!maintenanceOnly) {
      await recordResource(async () => { await mkdir(temporary, { mode: 0o700 }); temporaryIdentity = await lstat(temporary); });
      requireRunning();
      const nonce = randomBytes(32).toString('hex');
      await new Promise((resolveReady, reject) => {
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
          } else if (message?.type === 'diagnostic' && ['warn', 'error'].includes(message.level) &&
            ['NATIVE_APP_DIAGNOSTIC', 'P2002', 'P2003', 'P2024', 'P2025', 'EACCES', 'EROFS', 'ABORT_ERR'].includes(message.code)) {
            diagnostics[message.level] = Math.min(diagnostics[message.level] + 1, 1_000_000);
          }
        });
        child.send({ type: 'start', socketPath: socketPaths.app, hostname: 'www.culturadeljazz.com', nonce }, error => {
          if (error) reject(new NativeConfigurationError('NATIVE_CHILD_START'));
        });
      });
      clearTimeout(readinessTimer);
      await recordResource(async () => {
        const stat = await lstat(socketPaths.app);
        requireCondition(stat.isSocket() && stat.uid === process.geteuid() && !(stat.mode & 0o077), 'NATIVE_READY_SOCKET'); identities.app = stat;
      });
      await productionRobotsProbe(socketPaths.app);
      requireCondition(!closing && child.exitCode === null && child.signalCode === null, 'NATIVE_START_STOPPED');
    }
    requireRunning();
    ingress = createIngressServer({ upstreamSocket: socketPaths.app,
      policy: { canonicalHost: 'www.culturadeljazz.com', apexHost: 'culturadeljazz.com' },
      maintenanceFallback, maintenanceOnly });
    await recordResource(async () => {
      await new Promise((resolveListen, reject) => {
        ingress.once('error', reject); ingress.listen(socketPaths.edge, () => { ingress.off('error', reject); resolveListen(); });
      });
      await chmod(socketPaths.edge, 0o600);
      const edge = await lstat(socketPaths.edge);
      requireCondition(edge.isSocket() && edge.uid === process.geteuid() && !(edge.mode & 0o077), 'NATIVE_READY_SOCKET'); identities.edge = edge;
    });
    requireRunning();
    ingress.on('error', () => { void close('startup_failure'); });
    return { socketPaths, closed, close: () => close('requested'), summary: { ...inspected.summary,
      inspectedOnly: false, status: maintenanceOnly ? 'MAINTENANCE_STARTED' : 'PRODUCTION_STARTED',
      started: true, childReady: !maintenanceOnly, maintenanceOnly, socketsPrivate: true,
      listenersStarted: maintenanceOnly ? 1 : 2, inspectionProviderRequests: 0, providerRequests: null } };
  } catch (error) {
    await close('startup_failure');
    throw error instanceof NativeConfigurationError ? error : new NativeConfigurationError('NATIVE_PRODUCTION_START_FAILED');
  }
}

export const startNativeProduction = planFile => startProduction(planFile, false);
export const startNativeMaintenance = planFile => startProduction(planFile, true);

if (process.argv[1] && resolve(process.argv[1]) === ownPath) {
  try {
    const args = process.argv.slice(2), operation = args[0]?.startsWith('--') ? args.shift() : '--inspect';
    requireCondition(['--inspect', '--run-production', '--run-maintenance'].includes(operation) && args.length === 1, 'NATIVE_PRODUCTION_ARGUMENTS');
    if (operation === '--inspect') console.log(JSON.stringify((await inspectNativeProduction(args[0])).summary));
    else {
      const controller = await (operation === '--run-maintenance' ? startNativeMaintenance : startNativeProduction)(args[0]);
      console.log(JSON.stringify(controller.summary));
      const receipt = await controller.closed; console.log(JSON.stringify(receipt));
      if (receipt.failed) process.exitCode = 1;
    }
  } catch (error) {
    console.error(error instanceof NativeConfigurationError ? error.message : 'NATIVE_PRODUCTION_FAILED'); process.exitCode = 1;
  }
}
