import http from 'node:http';
import { constants } from 'node:fs';
import { open, lstat, realpath } from 'node:fs/promises';
import { dirname, isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import { loadNativeConfiguration } from './release-inspect.mjs';

export const RECONCILIATION_LIMITS = Object.freeze({
  maxCalls: 20, maxRunMs: 900_000, requestTimeoutMs: 75_000, responseLimitBytes: 65_536,
});
const FLOCK = '/usr/bin/flock';
const PAUSE_MS = 1_000;
const SWEEP_PATH = '/api/cron/payments-sweep';
class RunnerError extends Error { constructor(code) { super(code); this.name = 'NativeReconciliationError'; } }
function requireCondition(condition, code) { if (!condition) throw new RunnerError(code); }
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const owned = stat => stat.uid === process.geteuid();
const identity = (stat, expected) => stat.dev === expected.dev && stat.ino === expected.ino;
const validIdentity = value => record(value) && Object.keys(value).length === 2 &&
  ['dev', 'ino'].every(name => Number.isSafeInteger(value[name]) && value[name] > 0);

async function privatePath(path) {
  requireCondition(typeof path === 'string' && isAbsolute(path) && resolve(path) === path &&
    !/[\x00-\x1f\x7f]/.test(path), 'NATIVE_RECONCILIATION_PATH');
  const parent = dirname(path);
  requireCondition(await realpath(parent) === parent, 'NATIVE_RECONCILIATION_PATH');
  const stat = await lstat(parent);
  requireCondition(stat.isDirectory() && owned(stat) && (stat.mode & 0o777) === 0o700, 'NATIVE_RECONCILIATION_OWNER');
}

async function privateFile(path, expected) {
  await privatePath(path);
  requireCondition(await realpath(path) === path, 'NATIVE_RECONCILIATION_SYMLINK');
  const handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  try {
    const stat = await handle.stat();
    requireCondition(stat.isFile() && stat.nlink === 1 && owned(stat) && !(stat.mode & 0o077) &&
      (!expected || ((stat.mode & 0o777) === 0o600 && identity(stat, expected))), 'NATIVE_RECONCILIATION_OWNER');
    return { handle, stat };
  } catch (error) { await handle.close(); throw error; }
}

async function socketIdentity(path, expected) {
  await privatePath(path);
  requireCondition(Buffer.byteLength(path) <= 100 && await realpath(path) === path, 'NATIVE_RECONCILIATION_SOCKET');
  const stat = await lstat(path);
  requireCondition(stat.isSocket() && owned(stat) && (stat.mode & 0o777) === 0o600 && identity(stat, expected), 'NATIVE_RECONCILIATION_SOCKET');
}

/** Private inputs and local inode bindings only; never discovers ambient keys.
 * Returns internal configuration for the runner, not a public receipt.
 */
export async function inspectReconciliationPlan(planFile) {
  try {
    const input = await privateFile(planFile);
    let plan;
    try {
      requireCondition(input.stat.size <= 65_536, 'NATIVE_RECONCILIATION_PLAN');
      plan = JSON.parse((await input.handle.readFile()).toString('utf8'));
    } finally { await input.handle.close(); }
    const names = ['version', 'enabled', 'configFile', 'sourceCommit', 'appSocket', 'socketIdentity', 'lockFile', 'lockIdentity'];
    requireCondition(record(plan) && Object.keys(plan).length === names.length && names.every(name => Object.hasOwn(plan, name)) &&
      plan.version === 1 && typeof plan.enabled === 'boolean' && validIdentity(plan.socketIdentity) && validIdentity(plan.lockIdentity),
    'NATIVE_RECONCILIATION_PLAN');
    const secretFile = await privateFile(plan.configFile);
    await secretFile.handle.close();
    const config = await loadNativeConfiguration(plan.configFile);
    requireCondition(config.mode === 'production', 'NATIVE_RECONCILIATION_PRODUCTION_ONLY');
    requireCondition(plan.sourceCommit === config.sourceCommit, 'NATIVE_RECONCILIATION_SOURCE');
    await socketIdentity(plan.appSocket, plan.socketIdentity);
    const lock = await privateFile(plan.lockFile, plan.lockIdentity);
    await lock.handle.close();
    return { plan, config };
  } catch (error) {
    if (error instanceof RunnerError) throw error;
    throw new RunnerError('NATIVE_RECONCILIATION_PREFLIGHT');
  }
}

/** Linux flock FD mode operates on the inherited open-file description. The
 * parent descriptor retains the lock after the short acquisition child exits.
 * No shell, secrets in argv, pathname reopen or stale-PID lease is involved.
 */
async function acquireLock(plan) {
  const executable = await lstat(FLOCK);
  requireCondition(await realpath(FLOCK) === FLOCK && executable.isFile() && executable.uid === 0 &&
    !(executable.mode & 0o022) && (executable.mode & 0o111), 'NATIVE_RECONCILIATION_LOCK_TOOL');
  const handle = await open(plan.lockFile, constants.O_RDWR | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  try {
    const stat = await handle.stat();
    requireCondition(stat.isFile() && stat.nlink === 1 && owned(stat) && (stat.mode & 0o777) === 0o600 && identity(stat, plan.lockIdentity),
      'NATIVE_RECONCILIATION_OWNER');
    const code = await new Promise((resolveExit) => {
      const child = spawn(FLOCK, ['--nonblock', '--conflict-exit-code', '73', '3'], {
        stdio: ['ignore', 'ignore', 'ignore', handle.fd], env: { NODE_ENV: 'production' },
      });
      let failed = false;
      child.on('error', () => { failed = true; });
      const timer = setTimeout(() => { failed = true; child.kill('SIGKILL'); }, 2_000);
      child.once('close', (status) => { clearTimeout(timer); resolveExit(failed ? -1 : status); });
    });
    if (code === 73) { await handle.close(); return null; }
    requireCondition(code === 0, 'NATIVE_RECONCILIATION_LOCK_TOOL');
    return handle;
  } catch (error) { await handle.close(); throw error; }
}

function limits(input = {}) {
  requireCondition(record(input) && Object.keys(input).every(name => Object.hasOwn(RECONCILIATION_LIMITS, name)),
    'NATIVE_RECONCILIATION_LIMITS');
  const selected = { ...RECONCILIATION_LIMITS, ...input };
  requireCondition(Object.entries(selected).every(([name, value]) => Number.isSafeInteger(value) && value > 0 &&
    value <= RECONCILIATION_LIMITS[name]), 'NATIVE_RECONCILIATION_LIMITS');
  return selected;
}

function requestPage(plan, config, bound) {
  return new Promise((resolvePage) => {
    let finished = false, response, result;
    const finish = value => {
      if (finished) return;
      finished = true; clearTimeout(timer); result = value;
      if (value.kind !== 'response') { response?.destroy(); request.destroy(); }
      else resolvePage(value);
    };
    const request = http.request({
      socketPath: plan.appSocket, path: SWEEP_PATH, method: 'GET', agent: false, maxHeaderSize: 16_384,
      headers: { Host: 'www.culturadeljazz.com', Accept: 'application/json', Connection: 'close',
        Authorization: `Bearer ${config.env.CRON_SECRET.trim()}` },
    });
    const timer = setTimeout(() => finish({ kind: 'uncertain', reason: 'request_timeout' }), bound.requestTimeoutMs);
    request.on('error', () => finish({ kind: 'uncertain', reason: 'transport' }));
    request.once('close', () => { if (finished && result?.kind !== 'response') resolvePage(result); });
    request.once('response', incoming => {
      response = incoming;
      const chunks = [];
      let bytes = 0;
      incoming.on('data', chunk => {
        bytes += chunk.length;
        if (bytes > bound.responseLimitBytes) { finish({ kind: 'uncertain', reason: 'response_limit' }); return; }
        chunks.push(chunk);
      });
      incoming.once('aborted', () => finish({ kind: 'uncertain', reason: 'transport' }));
      incoming.once('error', () => finish({ kind: 'uncertain', reason: 'transport' }));
      incoming.once('end', () => finish({ kind: 'response', status: incoming.statusCode,
        contentType: incoming.headers['content-type'], body: Buffer.concat(chunks) }));
    });
    request.end();
  });
}

function validateResponse(reply) {
  if (reply.status === 401) return { stop: 'unauthorized' };
  if (![200, 503, 409, 499].includes(reply.status) || typeof reply.contentType !== 'string' ||
    !/^application\/json(?:\s*;|$)/i.test(reply.contentType)) return { invalid: true };
  let body;
  try { body = JSON.parse(reply.body.toString('utf8')); } catch { return { invalid: true }; }
  if (!record(body)) return { invalid: true };
  if (reply.status === 409 || (reply.status === 499 && !Object.hasOwn(body, 'hasMore'))) {
    const reason = reply.status === 409 ? 'busy' : 'aborted';
    return body.success === false && body.complete === false && body.reason === reason ? { stop: reason } : { invalid: true };
  }
  if (!['success', 'complete', 'passComplete', 'hasMore'].every(name => typeof body[name] === 'boolean') ||
      !['usersScanned', 'paymentsScanned', 'unlocked', 'failures', 'pendingUsers'].every(name =>
        Number.isSafeInteger(body[name]) && body[name] >= 0) || body.usersScanned > 500 || body.pendingUsers > 4096 ||
      (body.usersScanned === 0 && (body.paymentsScanned > 0 || body.unlocked > 0)) ||
      body.unlocked > body.paymentsScanned || body.failures > body.usersScanned + 1 ||
      body.coverage !== 'recent_eligible_users' || body.state !== 'process_local' ||
      body.success !== body.complete || body.hasMore === body.passComplete) return { invalid: true };
  if (reply.status === 200) {
    if (!body.complete || !body.passComplete || body.hasMore || body.reason !== null || body.pendingUsers || body.failures) return { invalid: true };
  } else if (body.complete || !['deadline', 'incomplete', 'continuation_capacity', 'aborted'].includes(body.reason) ||
      (reply.status === 499) !== (body.reason === 'aborted')) return { invalid: true };
  return { body };
}

/** Disabled by default. execute:true additionally requires the private enabled
 * production plan; it is reserved for isolated fixtures/future reviewed use.
 * Lower-only bounds permit bounded fixture verification, never raised limits.
 */
export async function runNativeReconciliation({ planFile, execute = false, bounds = {} }) {
  requireCondition(typeof execute === 'boolean', 'NATIVE_RECONCILIATION_EXECUTION');
  const bound = limits(bounds);
  const { plan, config } = await inspectReconciliationPlan(planFile);
  const receipt = { version: 1, tool: 'disabled_native_reconciliation_runner', sourceCommit: plan.sourceCommit,
    status: 'disabled', reason: 'disabled', calls: 0, usersScanned: 0, paymentsScanned: 0, unlocked: 0, failures: 0,
    pendingUsers: 0, complete: false, coverage: 'recent_eligible_users', continuation: 'process_local',
    productionActivationApproved: false };
  if (!execute || !plan.enabled) return receipt;
  const start = performance.now();
  let lock;
  try { lock = await acquireLock(plan); }
  catch { return { ...receipt, status: 'rejected', reason: 'lock_unavailable' }; }
  if (!lock) return { ...receipt, status: 'busy', reason: 'lock_busy' };
  try {
    receipt.status = 'incomplete';
    for (let index = 0; index < bound.maxCalls; index += 1) {
      if (performance.now() - start + bound.requestTimeoutMs > bound.maxRunMs) { receipt.reason = 'run_limit'; break; }
      await socketIdentity(plan.appSocket, plan.socketIdentity);
      const currentLock = await privateFile(plan.lockFile, plan.lockIdentity);
      await currentLock.handle.close();
      receipt.calls += 1;
      let reply;
      try { reply = await requestPage(plan, config, bound); }
      catch { receipt.status = 'uncertain'; receipt.reason = 'transport'; break; }
      if (reply.kind !== 'response') { receipt.status = 'uncertain'; receipt.reason = reply.reason; break; }
      const decision = validateResponse(reply);
      if (decision.invalid) { receipt.status = 'uncertain'; receipt.reason = 'invalid_response'; break; }
      if (decision.stop) { receipt.reason = decision.stop; break; }
      const body = decision.body;
      for (const name of ['usersScanned', 'paymentsScanned', 'unlocked', 'failures']) {
        if (!Number.isSafeInteger(receipt[name] + body[name])) { receipt.status = 'uncertain'; receipt.reason = 'invalid_response'; return receipt; }
        receipt[name] += body[name];
      }
      receipt.pendingUsers = body.pendingUsers;
      if (body.complete) {
        receipt.complete = receipt.failures === 0;
        receipt.status = receipt.complete ? 'complete' : 'incomplete';
        receipt.reason = receipt.complete ? 'complete' : 'prior_failures';
        break;
      }
      receipt.reason = body.reason;
      if (!body.hasMore || body.reason === 'aborted' || body.reason === 'continuation_capacity') break;
      if (!body.usersScanned) { receipt.reason = 'zero_progress'; break; }
      if (index + 1 === bound.maxCalls) { receipt.reason = 'call_limit'; break; }
      if (performance.now() - start + PAUSE_MS + bound.requestTimeoutMs > bound.maxRunMs) { receipt.reason = 'run_limit'; break; }
      await new Promise(done => setTimeout(done, PAUSE_MS));
    }
    return receipt;
  } catch {
    receipt.status = 'incomplete'; receipt.reason = 'target_changed'; return receipt;
  } finally { await lock.close(); }
}

// Preparation-only CLI: there is deliberately no execution/activation flag.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    requireCondition(args.length === 2 && args[0] === '--plan', 'NATIVE_RECONCILIATION_USAGE');
    console.log(JSON.stringify(await runNativeReconciliation({ planFile: args[1] })));
  } catch (error) {
    console.error(error instanceof RunnerError ? error.message : 'NATIVE_RECONCILIATION_FAILED');
    process.exitCode = 1;
  }
}
