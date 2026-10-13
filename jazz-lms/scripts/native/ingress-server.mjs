import http from 'node:http';
import { createHash, timingSafeEqual } from 'node:crypto';
import { isAbsolute, resolve } from 'node:path';
import { evaluateIngressRequest, stripHopHeaders, WEBHOOK_PATHS } from './ingress-policy.mjs';

/** @typedef {{upstreamPort?:number,upstreamSocket?:string,policy:import('./ingress-policy.mjs').IngressPolicy,previewAccess?:{username:string,password:string,expiresAt:string},allowPreviewWorkerTransport?:boolean,requestBodyLimitBytes?:number,webhookBodyLimitBytes?:number,requestBodyTimeoutMs?:number,upstreamTimeoutMs?:number}} IngressOptions */

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
  let transport;
  if (options.upstreamSocket !== undefined) {
    const path = options.upstreamSocket;
    if (options.upstreamPort !== undefined || typeof path !== 'string' || !isAbsolute(path) ||
      resolve(path) !== path || /[\x00-\x1f\x7f]/.test(path) || Buffer.byteLength(path) > 100) {
      throw new Error('Invalid native ingress socket configuration');
    }
    transport = { socketPath: path };
  } else transport = { hostname: '127.0.0.1', port: bounded(options.upstreamPort, undefined, 65535) };
  let previewHash, previewDeadline;
  if (options.previewAccess !== undefined) {
    if (!options.previewAccess || typeof options.previewAccess !== 'object' || Array.isArray(options.previewAccess)) {
      throw new Error('Invalid native preview access configuration');
    }
    const { username, password, expiresAt } = options.previewAccess;
    previewDeadline = Date.parse(expiresAt);
    if (typeof username !== 'string' || typeof password !== 'string' || typeof expiresAt !== 'string' ||
      !/^[A-Za-z0-9._-]{1,48}$/.test(username) || !/^[A-Za-z0-9_-]{32,128}$/.test(password) ||
      !Number.isFinite(previewDeadline) || previewDeadline <= Date.now() || previewDeadline > Date.now() + 3_600_000) {
      throw new Error('Invalid native preview access configuration');
    }
    previewHash = createHash('sha256').update(`${username}:${password}`).digest();
  }
  if ((options.allowPreviewWorkerTransport !== undefined && typeof options.allowPreviewWorkerTransport !== 'boolean') ||
    (options.allowPreviewWorkerTransport === true && !previewHash)) {
    throw new Error('Invalid native preview transport configuration');
  }
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
      if (previewHash) {
        if (Date.now() >= previewDeadline) { fail(res, 410); return; }
        const authorization = req.headers.authorization;
        const encoded = typeof authorization === 'string' && authorization.match(/^Basic ([A-Za-z0-9+/]+={0,2})$/)?.[1];
        const bytes = encoded ? Buffer.from(encoded, 'base64') : null;
        if (!bytes || bytes.toString('base64') !== encoded ||
          !timingSafeEqual(createHash('sha256').update(bytes).digest(), previewHash)) {
          res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="Jazz preview", charset="UTF-8"',
            'Cache-Control': 'no-store', Connection: 'close' });
          res.end(); return;
        }
        // This credential belongs to the preview gate, not Next/Supabase.
        delete req.headers.authorization;
      }
      const target = req.url ?? '/';
      if (Buffer.byteLength(target) > 8192) { fail(res, 414); return; }
      const policyHeaders = { ...req.headers };
      // Quick Tunnels themselves use Worker transport. Only an explicitly
      // enabled, authenticated and leased operator preview may admit it.
      // Production/general ingress keeps its Worker denial. Pseudo-IP/v6 and
      // host/scheme validation still run; the policy strips edge metadata.
      if (previewHash && options.allowPreviewWorkerTransport === true) delete policyHeaders['cf-worker'];
      const decision = evaluateIngressRequest({ method: req.method ?? '', target, headers: policyHeaders }, options.policy);
      if (decision.action === 'deny') { fail(res, decision.status); return; }
      if (decision.action === 'redirect') {
        res.writeHead(decision.status, { Location: decision.location, 'Cache-Control': 'no-store', Connection: 'close' });
        res.end(); return;
      }
      let body;
      try { body = await readBody(req, WEBHOOK_PATHS.has(target.split('?')[0]) ? webhookLimit : bodyLimit, bodyTimeout); }
      catch (error) { fail(res, error?.status === 413 ? 413 : error?.status === 408 ? 408 : 400); return; }
      if (req.aborted || res.destroyed) return;
      if (previewHash && Date.now() >= previewDeadline) { fail(res, 410); return; }
      let upstreamResponse;
      let settled = false;
      const upstream = http.request({
        ...transport, path: target, method: req.method,
        headers: { ...decision.headers, 'content-length': String(body.length) },
        agent: false,
      });
      const cleanup = () => { settled = true; clearTimeout(timer); };
      const abort = status => {
        if (settled) return;
        cleanup(); upstream.destroy(); upstreamResponse?.destroy(); fail(res, status);
      };
      const remainingLease = previewHash ? Math.max(1, previewDeadline - Date.now()) : upstreamTimeout;
      const timer = setTimeout(() => abort(previewHash && Date.now() >= previewDeadline ? 410 : 504),
        Math.min(upstreamTimeout, remainingLease));
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
        const responseHeaders = stripHopHeaders(response.headers);
        if (previewHash) {
          // Even public assets/redirects remain behind the leased Basic gate.
          // A cache must not reuse an authorized preview response without it.
          responseHeaders['cache-control'] = 'private, no-store, max-age=0';
          responseHeaders['cdn-cache-control'] = 'no-store';
          responseHeaders['cloudflare-cdn-cache-control'] = 'no-store';
          delete responseHeaders['surrogate-control'];
          delete responseHeaders['surrogate-key'];
        }
        res.writeHead(response.statusCode, responseHeaders);
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
