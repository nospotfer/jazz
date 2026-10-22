import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import http from 'node:http';
import { lstat, mkdir, open, realpath, rmdir, unlink } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NativeConfigurationError } from './config-policy.mjs';
import { inspectProductionPreparation } from './prepare-production.mjs';
import { readControlledFile } from './release-inspect.mjs';
import { renderProductionServiceAssets } from './production-service-plan.mjs';
import { privateParent, stopOwnedChild } from './launch-preview.mjs';

const requireCondition = (value, code) => {
  if (!value) throw new NativeConfigurationError(code);
};
const sleep = ms => new Promise(done => setTimeout(done, ms));
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const ownPath = fileURLToPath(import.meta.url);

export async function inspectNativeProductionTunnel(planFile) {
  const inspected = await inspectProductionPreparation(planFile);
  requireCondition(digest(await readControlledFile(join(inspected.plan.appRoot, 'scripts/native/launch-production-tunnel.mjs'))) ===
    digest(await readControlledFile(ownPath)), 'PRODUCTION_TUNNEL_LAUNCHER_BINDING');
  const runDirectory = `${inspected.plan.runDirectory}-tunnel`;
  await privateParent(dirname(runDirectory));
  try { await lstat(runDirectory); throw new NativeConfigurationError('PRODUCTION_TUNNEL_RUN_EXISTS'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  return { ...inspected, runDirectory, summary: { ...inspected.summary, inspectedOnly: true, tunnelStarted: false } };
}

async function edgeReady(plan) {
  await privateParent(plan.runDirectory);
  const socket = join(plan.runDirectory, 'edge.sock'), stat = await lstat(socket);
  requireCondition(stat.isSocket() && stat.uid === process.geteuid() && !(stat.mode & 0o077) &&
    await realpath(socket) === socket, 'PRODUCTION_TUNNEL_EDGE');
  await new Promise((done, reject) => {
    const req = http.request({ socketPath: socket, path: '/robots.txt', method: 'GET', agent: false,
      headers: { host: 'www.culturadeljazz.com', 'x-forwarded-proto': 'https', 'cf-connecting-ip': '127.0.0.1' } }, res => {
      let length = 0;
      res.on('data', data => { length += data.length; if (length > 512 * 1024) req.destroy(); });
      res.once('error', reject);
      res.once('aborted', reject);
      res.once('end', () => res.complete && [200, 503].includes(res.statusCode) ? done() : reject(new Error('edge')));
    });
    req.setTimeout(2_000, () => req.destroy());
    req.once('error', reject); req.end();
  });
}

/** Explicit production execution. This never creates a tunnel/account/DNS
 * record: it runs only the already-created, inspected named tunnel. Calling it
 * with real production inputs requires the owner's concrete release approval.
 */
export async function startNativeProductionTunnel(planFile) {
  const { plan, runDirectory, summary } = await inspectNativeProductionTunnel(planFile);
  const configPath = join(runDirectory, 'config.json'), pidPath = join(runDirectory, 'connected.pid');
  const oldUmask = process.umask(0o077);
  let runIdentity, child, childClosed, pending = Promise.resolve(), closing = false, ready = false, cleanup;
  const identities = new Map();
  let resolveClosed;
  const closed = new Promise(done => { resolveClosed = done; });
  const requireRunning = () => requireCondition(!closing, 'PRODUCTION_TUNNEL_STOPPED');
  const createResource = operation => {
    requireRunning(); const result = operation(); pending = result.catch(() => {}); return result;
  };
  const onSignal = () => { void close('signal'); };
  const close = reason => {
    if (cleanup) return cleanup;
    closing = true;
    cleanup = (async () => {
      await pending;
      let clean = true;
      try { await stopOwnedChild(child, childClosed); } catch { clean = false; }
      process.off('SIGTERM', onSignal); process.off('SIGINT', onSignal);
      if (runIdentity && clean) {
        try {
          const current = await lstat(runDirectory);
          requireCondition(current.dev === runIdentity.dev && current.ino === runIdentity.ino &&
            current.uid === process.geteuid() && current.isDirectory(), 'PRODUCTION_TUNNEL_RUN_CHANGED');
          // A pidfile can arrive during shutdown. Adopt only this exact child's
          // finite PID in our exclusively-created directory, never stale files.
          if (child?.pid && !identities.has(pidPath)) {
            try {
              const bytes = await readControlledFile(pidPath, { privateFile: true, maximum: 32 });
              if (bytes.toString().trim() === String(child.pid)) identities.set(pidPath, await lstat(pidPath));
            } catch { /* A missing or unexpected file is preserved below. */ }
          }
          for (const [path, identity] of identities) {
            try {
              const stat = await lstat(path);
              requireCondition(stat.isFile() && stat.uid === process.geteuid() && stat.dev === identity.dev &&
                stat.ino === identity.ino && stat.nlink === 1, 'PRODUCTION_TUNNEL_FILE_CHANGED');
              await unlink(path);
            } catch (error) { if (error.code !== 'ENOENT') clean = false; }
          }
          await rmdir(runDirectory);
        } catch { clean = false; }
      }
      process.umask(oldUmask);
      const receipt = { stopped: !child || child.exitCode !== null || child.signalCode !== null,
        clean, reason, failed: !['requested', 'signal'].includes(reason) };
      resolveClosed(receipt); return receipt;
    })();
    return cleanup;
  };
  process.once('SIGTERM', onSignal); process.once('SIGINT', onSignal);
  try {
    // systemd orders services, but Type=simple does not imply app readiness.
    const edgeDeadline = Date.now() + 60_000;
    while (true) {
      requireRunning();
      try { await edgeReady(plan); break; }
      catch { requireCondition(Date.now() < edgeDeadline, 'PRODUCTION_TUNNEL_EDGE_TIMEOUT'); await sleep(100); }
    }
    await createResource(async () => { await mkdir(runDirectory, { mode: 0o700 }); runIdentity = await lstat(runDirectory); });
    await createResource(async () => {
      const file = await open(configPath, 'wx', 0o600);
      try {
        await file.writeFile(renderProductionServiceAssets(plan, planFile)['cloudflared.json.proposed']);
        await file.sync(); identities.set(configPath, await file.stat());
      } finally { await file.close(); }
    });
    requireRunning();
    // The metrics listener is explicitly loopback-only; no public TCP origin.
    // Management diagnostics and raw child output are disabled. No shell,
    // token argument, inherited HOME/config or update process is admitted.
    child = spawn(plan.cloudflaredExecutable, ['tunnel', '--no-autoupdate', '--config', configPath,
      '--metrics', '127.0.0.1:0', '--management-diagnostics=false', '--loglevel', 'error',
      '--grace-period', '5s', '--pidfile', pidPath, 'run', plan.tunnel.id],
    { cwd: runDirectory, env: { PATH: '/usr/bin:/bin', LANG: 'C', TMPDIR: runDirectory },
      detached: true, stdio: 'ignore' });
    let childError = false;
    child.once('error', () => { childError = true; });
    childClosed = new Promise(done => child.once('close', done));
    child.once('exit', () => { if (ready) void close('child_exit'); });
    const deadline = Date.now() + 60_000;
    while (true) {
      requireRunning();
      requireCondition(!childError && child.pid && child.exitCode === null && child.signalCode === null, 'PRODUCTION_TUNNEL_EXIT');
      try {
        const bytes = await readControlledFile(pidPath, { privateFile: true, maximum: 32 });
        requireCondition(bytes.toString().trim() === String(child.pid), 'PRODUCTION_TUNNEL_PID');
        identities.set(pidPath, await lstat(pidPath)); break;
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
        requireCondition(Date.now() < deadline, 'PRODUCTION_TUNNEL_READY_TIMEOUT'); await sleep(100);
      }
    }
    requireRunning();
    requireCondition(!childError && child.exitCode === null && child.signalCode === null, 'PRODUCTION_TUNNEL_EXIT');
    ready = true;
    return { closed, close: () => close('requested'), summary: { ...summary, inspectedOnly: false,
      tunnelStarted: true, firstConnectionPidObserved: true, publicHealthVerified: false,
      inspectionProviderRequests: 0, providerRequests: null, listenersStarted: null } };
  } catch (error) {
    await close('startup_failure');
    throw error instanceof NativeConfigurationError ? error : new NativeConfigurationError('PRODUCTION_TUNNEL_START_FAILED');
  }
}

if (process.argv[1] && resolve(process.argv[1]) === ownPath) {
  try {
    const args = process.argv.slice(2), operation = args[0]?.startsWith('--') ? args.shift() : '--inspect';
    requireCondition(['--inspect', '--run-tunnel'].includes(operation) && args.length === 1, 'PRODUCTION_TUNNEL_ARGUMENTS');
    if (operation === '--inspect') console.log(JSON.stringify((await inspectNativeProductionTunnel(args[0])).summary));
    else {
      const runtime = await startNativeProductionTunnel(args[0]); console.log(JSON.stringify(runtime.summary));
      const receipt = await runtime.closed; console.log(JSON.stringify(receipt));
      if (receipt.failed || !receipt.clean) process.exitCode = 1;
    }
  } catch (error) {
    console.error(error instanceof NativeConfigurationError ? error.message : 'PRODUCTION_TUNNEL_FAILED'); process.exitCode = 1;
  }
}
