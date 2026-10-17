import http from 'node:http';
import { createRequire } from 'node:module';
import { lstat, chmod } from 'node:fs/promises';
import { isAbsolute, join, resolve } from 'node:path';

// This worker is launched through an owned IPC channel, never a public port or
// secret-bearing command line. Next must resolve from the inspected release.
let app, server, closing = false, started = false, deadlineTimer;
let diagnosticWindow = 0, diagnosticCount = 0;
const ERROR_CODES = new Set(['P2002', 'P2003', 'P2024', 'P2025', 'EACCES', 'EROFS', 'ABORT_ERR']);

function send(message) {
  if (!process.connected) return;
  try { process.send(message, () => {}); } catch { /* Parent may have closed IPC. */ }
}

function diagnostic(level, argumentsList = []) {
  const now = Date.now();
  if (now - diagnosticWindow >= 60_000) { diagnosticWindow = now; diagnosticCount = 0; }
  if (++diagnosticCount > 20) return;
  let code = 'NATIVE_APP_DIAGNOSTIC';
  for (const value of argumentsList) {
    try { if (value && typeof value === 'object' && ERROR_CODES.has(value.code)) { code = value.code; break; } }
    catch { /* Never format an unknown exception/property. */ }
  }
  send({ type: 'diagnostic', level, code });
}

// quiet:true does not cover every framework logger. Keep raw stdout/stderr
// discarded by the parent and emit only these finite diagnostic classifications.
console.log = console.info = console.debug = () => {};
console.warn = (...values) => diagnostic('warn', values);
console.error = (...values) => diagnostic('error', values);
console.trace = () => diagnostic('error');

async function stop(exitCode = 0) {
  if (closing) return;
  closing = true; clearTimeout(deadlineTimer);
  const force = setTimeout(() => process.exit(exitCode || 1), 8_000);
  try {
    if (server?.listening) {
      const drain = setTimeout(() => server.closeAllConnections(), 5_000);
      await new Promise(resolveClose => server.close(() => resolveClose()));
      clearTimeout(drain);
    }
    await app?.close();
  } catch { diagnostic('error'); }
  clearTimeout(force);
  send({ type: 'closed' });
  process.exit(exitCode);
}

process.once('disconnect', () => { void stop(); });
process.once('SIGTERM', () => { void stop(); });
process.once('SIGINT', () => { void stop(); });
process.on('uncaughtException', () => { diagnostic('error'); void stop(1); });
process.on('unhandledRejection', () => { diagnostic('error'); void stop(1); });

process.on('message', async message => {
  if (message?.type === 'stop') { void stop(); return; }
  if (started || message?.type !== 'start') { diagnostic('error'); void stop(1); return; }
  started = true;
  try {
    const { socketPath, hostname, nonce, expiresAt } = message;
    if (process.versions.node.split('.')[0] !== '24' || process.env.NODE_ENV !== 'production' ||
      process.env.APP_DEPLOYMENT_ENVIRONMENT !== 'preview' || !process.connected ||
      typeof socketPath !== 'string' || !isAbsolute(socketPath) || resolve(socketPath) !== socketPath ||
      /[\x00-\x1f\x7f]/.test(socketPath) || Buffer.byteLength(socketPath) > 100 ||
      typeof hostname !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*\.trycloudflare\.com$/.test(hostname) ||
      typeof nonce !== 'string' || !/^[a-f0-9]{64}$/.test(nonce) ||
      !Number.isFinite(expiresAt) || expiresAt <= Date.now() || expiresAt > Date.now() + 3_600_000) {
      throw new Error('NATIVE_WORKER_INPUT');
    }
    process.umask(0o077);
    deadlineTimer = setTimeout(() => { void stop(); }, expiresAt - Date.now());
    const require = createRequire(join(process.cwd(), 'package.json'));
    const next = require('next');
    let handle;
    server = http.createServer({ maxHeaderSize: 16 * 1024, headersTimeout: 5_000,
      requestTimeout: 120_000, keepAliveTimeout: 5_000 }, (req, res) => {
      req.on('error', () => {});
      if (closing || !handle) {
        res.writeHead(503, { 'Cache-Control': 'no-store', Connection: 'close' }); res.end(); return;
      }
      // Do not parse/re-serialize req.url or signed request bodies.
      void handle(req, res).catch(() => {
        diagnostic('error');
        if (res.headersSent) res.destroy();
        else { res.writeHead(500, { 'Cache-Control': 'no-store' }); res.end('Servicio temporalmente no disponible.'); }
      });
    });
    server.maxConnections = 64;
    server.maxHeadersCount = 128;
    server.on('upgrade', (_request, socket) => socket.destroy());
    server.on('clientError', (_error, socket) => socket.destroy());
    server.on('error', () => { diagnostic('error'); void stop(1); });
    app = next({ dev: false, dir: process.cwd(), quiet: true, httpServer: server,
      hostname, port: 443, webpack: true });
    await app.prepare();
    if (closing) return;
    handle = app.getRequestHandler();
    // New private run directory; an existing path is a startup failure, never
    // a stale socket that this worker may unlink/adopt.
    try { await lstat(socketPath); throw new Error('NATIVE_WORKER_SOCKET_EXISTS'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    await new Promise((resolveListen, reject) => {
      server.once('error', reject);
      server.listen(socketPath, () => { server.off('error', reject); resolveListen(); });
    });
    await chmod(socketPath, 0o600);
    const stat = await lstat(socketPath);
    if (!stat.isSocket() || stat.uid !== process.geteuid() || stat.mode & 0o077 || closing) throw new Error('NATIVE_WORKER_SOCKET');
    send({ type: 'ready', role: 'next', nonce, pid: process.pid });
  } catch {
    send({ type: 'failed', code: 'NATIVE_WORKER_START_FAILED' });
    void stop(1);
  }
});

if (!process.send || !process.connected) process.exit(1);
