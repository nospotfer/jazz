import http from 'node:http';
import { evaluateIngressRequest, stripHopHeaders, WEBHOOK_PATHS } from './ingress-policy.mjs';

/** @typedef {{upstreamPort:number,policy:import('./ingress-policy.mjs').IngressPolicy,requestBodyLimitBytes?:number,webhookBodyLimitBytes?:number,requestBodyTimeoutMs?:number,upstreamTimeoutMs?:number}} IngressOptions */

function bounded(value, fallback, maximum) {
  const selected = value ?? fallback;
  if (!Number.isSafeInteger(selected) || selected < 1 || selected > maximum) throw new Error('Invalid native ingress limit configuration');
  return selected;
}

function fail(res, status) {
  if (res.destroyed) return;
  if (res.headersSent) { res.destroy(); return; }
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', Connection: 'close' });
  res.end(status >= 500 ? 'Servicio temporalmente no disponible.' : 'Solicitud no disponible.');
}

/** Buffer only bounded request bytes, never parse/re-serialize signed bodies. */
function readBody(req, limit, timeoutMs) {
  return new Promise((resolve, reject) => {
    const declared = req.headers['content-length'];
    if (declared !== undefined && (!/^\d+$/.test(declared) || Number(declared) > limit)) {
      req.pause(); reject({ status: 413 }); return;
    }
    const chunks = [];
    let size = 0, finished = false;
    const cleanup = () => {
      clearTimeout(timer);
      req.off('data', onData); req.off('end', onEnd);
      req.off('aborted', onAbort); req.off('error', onError);
    };
    const stop = status => {
      if (finished) return;
      finished = true; cleanup(); req.pause(); reject({ status });
    };
    const onData = chunk => {
      size += chunk.length;
      if (size > limit) { stop(413); return; }
      chunks.push(chunk);
    };
    const onEnd = () => {
      if (finished) return;
      finished = true; cleanup(); resolve(Buffer.concat(chunks, size));
    };
    const onAbort = () => stop(400);
    const onError = () => stop(400);
    const timer = setTimeout(() => stop(408), timeoutMs);
    req.on('data', onData); req.once('end', onEnd);
    req.once('aborted', onAbort); req.once('error', onError);
  });
}

/** Returns an unbound server. The launcher must provide a reviewed private
 * socket/loopback boundary; headers alone do not authenticate a local process.
 * No ambient env, provider key, request log, DNS lookup or public listener.
 * @param {IngressOptions} options
 * @returns {import('node:http').Server}
 */
export function createIngressServer(options) {
  const port = bounded(options.upstreamPort, undefined, 65535);
  const bodyLimit = bounded(options.requestBodyLimitBytes, 8 * 1024 * 1024, 8 * 1024 * 1024);
  const webhookLimit = bounded(options.webhookBodyLimitBytes, 256 * 1024, 256 * 1024);
  const bodyTimeout = bounded(options.requestBodyTimeoutMs, 10_000, 10_000);
  const upstreamTimeout = bounded(options.upstreamTimeoutMs, 110_000, 110_000);
  // Check configuration before binding or accepting a request.
  evaluateIngressRequest({ method: 'GET', target: '/', headers: {} }, options.policy);
  const server = http.createServer({
    maxHeaderSize: 16 * 1024, joinDuplicateHeaders: true,
    headersTimeout: 5_000, requestTimeout: 10_000,
    keepAliveTimeout: 5_000, connectionsCheckingInterval: 1_000,
  }, (req, res) => {
    // IncomingMessage emits error after aborted; keep a listener through close.
    req.on('error', () => {});
    const handle = async () => {
      const target = req.url ?? '/';
      if (Buffer.byteLength(target) > 8192) { fail(res, 414); return; }
      const decision = evaluateIngressRequest({ method: req.method ?? '', target, headers: req.headers }, options.policy);
      if (decision.action === 'deny') { fail(res, decision.status); return; }
      if (decision.action === 'redirect') {
        res.writeHead(decision.status, { Location: decision.location, 'Cache-Control': 'no-store', Connection: 'close' });
        res.end(); return;
      }
      let body;
      try { body = await readBody(req, WEBHOOK_PATHS.has(target.split('?')[0]) ? webhookLimit : bodyLimit, bodyTimeout); }
      catch (error) { fail(res, error?.status === 413 ? 413 : error?.status === 408 ? 408 : 400); return; }
      if (req.aborted || res.destroyed) return;
      let upstreamResponse;
      let settled = false;
      const upstream = http.request({
        hostname: '127.0.0.1', port, path: target, method: req.method,
        headers: { ...decision.headers, 'content-length': String(body.length) },
        agent: false,
      });
      const cleanup = () => { settled = true; clearTimeout(timer); };
      const abort = status => {
        if (settled) return;
        cleanup(); upstream.destroy(); upstreamResponse?.destroy(); fail(res, status);
      };
      const timer = setTimeout(() => abort(504), upstreamTimeout);
      res.once('close', () => {
        if (!res.writableFinished) abort(502);
        else cleanup();
      });
      req.once('aborted', () => abort(502));
      upstream.once('error', () => abort(502));
      upstream.once('response', response => {
        upstreamResponse = response;
        if (settled || res.destroyed) { response.destroy(); return; }
        if (!response.statusCode || response.statusCode < 200 || response.statusCode > 599) { abort(502); return; }
        response.once('error', () => abort(502));
        response.once('aborted', () => abort(502));
        res.once('finish', cleanup);
        res.writeHead(response.statusCode, stripHopHeaders(response.headers));
        res.flushHeaders();
        response.pipe(res);
      });
      upstream.end(body);
    };
    // Errors remain finite and omit targets, credentials, body and exceptions.
    void handle().catch(() => fail(res, 502));
  });
  server.maxConnections = 64;
  server.maxHeadersCount = 128;
  server.on('clientError', (_error, socket) => {
    if (socket.writable) socket.end('HTTP/1.1 400 Bad Request\r\nConnection: close\r\nContent-Length: 0\r\n\r\n');
    else socket.destroy();
  });
  server.on('upgrade', (_req, socket) => socket.destroy());
  return server;
}
