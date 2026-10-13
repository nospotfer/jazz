import http, {
  type ClientRequest,
  type IncomingHttpHeaders,
  type IncomingMessage,
  type OutgoingHttpHeaders,
  type Server,
  type ServerResponse,
} from 'node:http';
import { createHmac } from 'node:crypto';
import { Socket } from 'node:net';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createIngressServer } from '../../scripts/native/ingress-server.mjs';

// These fixtures exercise native HTTP transport only. They never start Next,
// use provider credentials, or contact anything beyond their own loopback ports.
const policy = { canonicalHost: 'www.culturadeljazz.com', apexHost: 'culturadeljazz.com' };
const edgeHeaders = {
  Host: policy.canonicalHost,
  'X-Forwarded-Proto': 'https',
  'CF-Connecting-IP': '203.0.113.5',
};
type Limits = {
  requestBodyLimitBytes?: number;
  webhookBodyLimitBytes?: number;
  requestBodyTimeoutMs?: number;
  upstreamTimeoutMs?: number;
};
type Reply = { status: number; headers: IncomingHttpHeaders; rawHeaders: string[]; body: Buffer };
type UpstreamHandler = (request: IncomingMessage, response: ServerResponse) => void;

const servers: Server[] = [];
const sockets = new Set<Socket>();
const clients = new Set<ClientRequest>();
const ownedPorts = new Set<number>();
let unexpectedConnections = 0;

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}

function deadline<T>(promise: Promise<T>, milliseconds = 2_000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Owned loopback fixture timed out')), milliseconds);
    promise.then(value => { clearTimeout(timer); resolve(value); }, error => { clearTimeout(timer); reject(error); });
  });
}

async function listen(server: Server): Promise<number> {
  servers.push(server);
  server.on('connection', socket => {
    sockets.add(socket);
    socket.once('close', () => sockets.delete(socket));
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => { server.off('error', reject); resolve(); });
  });
  const address = server.address();
  if (!address || typeof address === 'string' || address.address !== '127.0.0.1') {
    throw new Error('Fixture must bind an owned loopback port');
  }
  ownedPorts.add(address.port);
  return address.port;
}

async function fixture(handler: UpstreamHandler, limits: Limits = {}) {
  const upstream = http.createServer(handler);
  const upstreamPort = await listen(upstream);
  const ingress = createIngressServer({ upstreamPort, policy, ...limits });
  expect(ingress.listening).toBe(false);
  const ingressPort = await listen(ingress);
  return { upstream, upstreamPort, ingress, ingressPort };
}

function begin(port: number, options: {
  method?: string;
  path?: string;
  headers?: OutgoingHttpHeaders;
}, listener: (response: IncomingMessage) => void): ClientRequest {
  if (!ownedPorts.has(port)) throw new Error('Unowned loopback request blocked');
  const request = http.request({
    hostname: '127.0.0.1', port, agent: false,
    method: options.method ?? 'GET', path: options.path ?? '/',
    headers: { ...edgeHeaders, ...options.headers },
  }, listener);
  clients.add(request);
  request.once('close', () => clients.delete(request));
  // Keep an error listener during teardown, even after a response resolved.
  request.on('error', () => {});
  return request;
}

function request(port: number, options: {
  method?: string;
  path?: string;
  headers?: OutgoingHttpHeaders;
  body?: Buffer;
  send?: (request: ClientRequest) => void;
} = {}): Promise<Reply> {
  return deadline(new Promise((resolve, reject) => {
    const client = begin(port, options, response => {
      const chunks: Buffer[] = [];
      response.on('data', chunk => chunks.push(Buffer.from(chunk)));
      response.once('error', () => reject(new Error('Owned loopback response failed')));
      response.once('end', () => resolve({
        status: response.statusCode ?? 0, headers: response.headers,
        rawHeaders: response.rawHeaders, body: Buffer.concat(chunks),
      }));
    });
    client.once('error', () => reject(new Error('Owned loopback request failed')));
    if (options.send) options.send(client);
    else client.end(options.body);
  }));
}

async function bodyOf(request: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

beforeEach(() => {
  unexpectedConnections = 0;
  const connect = Socket.prototype.connect;
  vi.spyOn(Socket.prototype, 'connect').mockImplementation(function (this: Socket, ...arguments_: any[]) {
    // Node normalizes some socket.connect calls to one array of arguments.
    const first = Array.isArray(arguments_[0]) ? arguments_[0][0] : arguments_[0];
    const options = first && typeof first === 'object' ? first : { port: first, host: arguments_[1] };
    if (options.host !== '127.0.0.1' || !ownedPorts.has(Number(options.port))) {
      unexpectedConnections += 1;
      throw new Error('Network outside owned loopback fixtures blocked');
    }
    return Reflect.apply(connect, this, arguments_);
  });
});

afterEach(async () => {
  try {
    for (const client of clients) client.destroy();
    for (const socket of sockets) socket.destroy();
    await Promise.all(servers.map(server => new Promise<void>((resolve, reject) => {
      if (!server.listening) { resolve(); return; }
      server.close(error => error ? reject(new Error('Owned server cleanup failed')) : resolve());
      server.closeAllConnections();
    })));
    expect(servers.every(server => !server.listening)).toBe(true);
    expect(unexpectedConnections).toBe(0);
  } finally {
    servers.length = 0;
    sockets.clear();
    clients.clear();
    ownedPorts.clear();
    vi.restoreAllMocks();
  }
});

describe('owned native ingress HTTP transport', () => {
  it('creates a non-listening server with bounded native parser and connection settings', async () => {
    const { ingress } = await fixture((_request, response) => response.end());
    expect(ingress.headersTimeout).toBe(5_000);
    expect(ingress.requestTimeout).toBe(10_000);
    expect(ingress.keepAliveTimeout).toBe(5_000);
    expect(ingress.maxHeadersCount).toBe(128);
    expect(ingress.maxConnections).toBe(64);
    expect(Reflect.get(ingress, 'maxHeaderSize')).toBe(16 * 1024);
  });

  it.each([
    ['/api/webhooks/dodo-jazzlms', 'webhook-id', 'webhook-timestamp', 'webhook-signature'],
    ['/api/webhooks/messages-email', 'svix-id', 'svix-timestamp', 'svix-signature'],
  ])('forwards exact signed raw bytes on the apex without redirect: %s', async (path, idHeader, timeHeader, signatureHeader) => {
    const body = Buffer.from('{\r\n  "fixture": "jazz á 🎷", "spacing": "  "\r\n}\r\n', 'utf8');
    const id = 'synthetic-event';
    const timestamp = '1800000000';
    const sign = (bytes: Buffer) => createHmac('sha256', 'synthetic-test-key')
      .update(`${id}.${timestamp}.`).update(bytes).digest('base64');
    const signature = `v1,${sign(body)}`;
    const captured = deferred<{ body: Buffer; headers: IncomingHttpHeaders; target: string }>();
    const { ingressPort } = await fixture((incoming, response) => {
      void bodyOf(incoming).then(bytes => {
        captured.resolve({ body: bytes, headers: incoming.headers, target: incoming.url ?? '' });
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end('{"accepted":true}');
      });
    });
    const reply = await request(ingressPort, {
      method: 'POST', path,
      headers: {
        Host: policy.apexHost, 'Content-Type': 'application/json',
        Authorization: 'Bearer synthetic-authorizer', Cookie: 'fixture=synthetic-cookie',
        [idHeader]: id, [timeHeader]: timestamp, [signatureHeader]: signature,
      }, body,
    });
    const observed = await deadline(captured.promise);
    expect(reply.status).toBe(200);
    expect(reply.headers.location).toBeUndefined();
    expect(observed.target).toBe(path);
    expect(observed.body.equals(body)).toBe(true);
    expect(observed.headers[signatureHeader] === `v1,${sign(observed.body)}`).toBe(true);
    expect(observed.headers[idHeader] === id).toBe(true);
    expect(observed.headers[timeHeader] === timestamp).toBe(true);
    expect(observed.headers.authorization === 'Bearer synthetic-authorizer').toBe(true);
    expect(observed.headers.cookie === 'fixture=synthetic-cookie').toBe(true);
    expect(observed.headers['content-length']).toBe(String(body.length));
    expect(observed.headers.host).toBe(policy.apexHost);
  });

  it('preserves private PDF bytes, disposition, CSP, and separate Secure session cookies', async () => {
    const pdf = Buffer.from('%PDF-1.7\nsynthetic transport fixture\n%%EOF\n');
    const cookies = [
      'fixture-access=synthetic-a; Path=/; HttpOnly; Secure; SameSite=Lax',
      'fixture-refresh=synthetic-b; Path=/; HttpOnly; Secure; SameSite=Lax',
    ];
    const csp = "default-src 'none'; frame-ancestors 'self'; sandbox";
    const { ingressPort } = await fixture((_incoming, response) => {
      response.writeHead(200, {
        'Content-Type': 'application/pdf', 'Content-Length': String(pdf.length),
        'Content-Disposition': 'inline; filename="synthetic.pdf"',
        'Cache-Control': 'private, no-store, max-age=0', 'Content-Security-Policy': csp,
        'Set-Cookie': cookies, Vary: 'Cookie, Authorization',
      });
      response.end(pdf);
    });
    const reply = await request(ingressPort, { path: '/api/attachments/synthetic' });
    expect(reply.body.equals(pdf)).toBe(true);
    expect(reply.headers['content-type']).toBe('application/pdf');
    expect(reply.headers['content-disposition']).toBe('inline; filename="synthetic.pdf"');
    expect(reply.headers['cache-control']).toBe('private, no-store, max-age=0');
    expect(reply.headers['content-security-policy']).toBe(csp);
    expect(reply.headers.vary).toBe('Cookie, Authorization');
    expect(reply.headers['set-cookie']).toEqual(cookies);
    expect(reply.rawHeaders.filter((_, index) => index % 2 === 0 && reply.rawHeaders[index].toLowerCase() === 'set-cookie')).toHaveLength(2);
  });

  it.each(['text/html; charset=utf-8', 'text/x-component'])('streams %s before upstream completion and preserves router headers', async contentType => {
    const release = deferred<void>();
    const first = deferred<IncomingHttpHeaders>();
    let upstreamFinished = false;
    const { ingressPort } = await fixture((_incoming, response) => {
      response.writeHead(200, {
        'Content-Type': contentType,
        Vary: 'RSC, Next-Router-State-Tree, Next-Router-Prefetch, Accept-Encoding',
        'X-Nextjs-Stale-Time': '300', 'Cache-Control': 'private, no-store',
      });
      response.write('synthetic-first\n');
      void release.promise.then(() => { upstreamFinished = true; response.end('synthetic-last\n'); });
    });
    const completed = deadline(new Promise<Buffer>((resolve, reject) => {
      const client = begin(ingressPort, {
        path: '/dashboard/profile?_rsc=synthetic',
        headers: { RSC: '1', 'Next-Router-State-Tree': 'synthetic-tree', 'Next-Router-Prefetch': '1' },
      }, response => {
        const chunks: Buffer[] = [];
        response.on('data', chunk => { chunks.push(Buffer.from(chunk)); first.resolve(response.headers); });
        response.once('end', () => resolve(Buffer.concat(chunks)));
        response.once('error', () => reject(new Error('Owned streaming response failed')));
      });
      client.once('error', () => reject(new Error('Owned streaming request failed')));
      client.end();
    }));
    const headers = await deadline(first.promise);
    expect(upstreamFinished).toBe(false);
    expect(headers['content-type']).toBe(contentType);
    expect(headers.vary).toBe('RSC, Next-Router-State-Tree, Next-Router-Prefetch, Accept-Encoding');
    expect(headers['x-nextjs-stale-time']).toBe('300');
    release.resolve();
    expect((await completed).toString()).toBe('synthetic-first\nsynthetic-last\n');
  });

  it('strips request and response hop headers while preserving credentials and router metadata', async () => {
    const captured = deferred<IncomingHttpHeaders>();
    const { ingressPort } = await fixture((incoming, response) => {
      captured.resolve(incoming.headers);
      response.writeHead(200, {
        Connection: 'x-internal-hop', 'X-Internal-Hop': 'do-not-forward',
        'Proxy-Authenticate': 'synthetic', 'X-End-To-End': 'preserved',
      });
      response.end('ok');
    });
    const reply = await request(ingressPort, {
      headers: {
        Connection: 'x-client-hop', 'X-Client-Hop': 'do-not-forward',
        'Keep-Alive': 'timeout=999', TE: 'trailers',
        Authorization: 'Bearer synthetic', Cookie: 'fixture=synthetic',
        RSC: '1', 'Next-Router-State-Tree': 'synthetic-tree',
        'X-Forwarded-For': '198.51.100.4, 198.51.100.5', 'X-Real-IP': '198.51.100.6',
      },
    });
    const headers = await deadline(captured.promise);
    expect(headers['x-client-hop']).toBeUndefined();
    expect(headers['keep-alive']).toBeUndefined();
    expect(headers.te).toBeUndefined();
    expect(headers.authorization === 'Bearer synthetic').toBe(true);
    expect(headers.cookie === 'fixture=synthetic').toBe(true);
    expect(headers.rsc).toBe('1');
    expect(headers['next-router-state-tree']).toBe('synthetic-tree');
    expect(headers['x-forwarded-for']).toBe('203.0.113.5');
    expect(headers['x-real-ip']).toBe('203.0.113.5');
    expect(headers['cf-connecting-ip']).toBeUndefined();
    expect(reply.headers['x-internal-hop']).toBeUndefined();
    expect(reply.headers['proxy-authenticate']).toBeUndefined();
    expect(reply.headers['x-end-to-end']).toBe('preserved');
  });

  it('rejects protected Connection nominations before any upstream request', async () => {
    let forwarded = 0;
    const { ingressPort } = await fixture((_incoming, response) => { forwarded += 1; response.end(); });
    const reply = await request(ingressPort, {
      method: 'POST', path: '/api/auth/session',
      headers: { Connection: 'authorization', Authorization: 'Bearer synthetic' },
      body: Buffer.from('{"fixture":true}'),
    });
    expect(reply.status).toBe(400);
    expect(forwarded).toBe(0);
  });

  it.each(['GET', 'HEAD'])('denies public cron %s without contacting the backend', async method => {
    let forwarded = 0;
    const { ingressPort } = await fixture((_incoming, response) => { forwarded += 1; response.end(); });
    const reply = await request(ingressPort, { method, path: '/api/cron/sync-payments?fixture=synthetic' });
    expect(reply.status).toBe(403);
    expect(forwarded).toBe(0);
    if (method === 'HEAD') expect(reply.body.length).toBe(0);
  });

  it.each([
    ['/api/dashboard/notes', 9],
    ['/api/webhooks/dodo-jazzlms', 5],
  ])('rejects declared oversize bodies on %s before forwarding', async (path, length) => {
    let forwarded = 0;
    const { ingressPort } = await fixture((_incoming, response) => { forwarded += 1; response.end(); }, {
      requestBodyLimitBytes: 8, webhookBodyLimitBytes: 4,
    });
    const reply = await request(ingressPort, { method: 'POST', path, body: Buffer.alloc(length), headers: { 'Content-Length': length } });
    expect(reply.status).toBe(413);
    expect(forwarded).toBe(0);
    expect(reply.headers['cache-control']).toBe('no-store');
  });

  it('rejects chunked overflow without forwarding the earlier valid prefix', async () => {
    let forwarded = 0;
    const { ingressPort } = await fixture((_incoming, response) => { forwarded += 1; response.end(); }, { requestBodyLimitBytes: 8 });
    const reply = await request(ingressPort, {
      method: 'PUT', path: '/api/dashboard/notes',
      send: client => { client.write(Buffer.alloc(4)); client.write(Buffer.alloc(5)); client.end(); },
    });
    expect(reply.status).toBe(413);
    expect(forwarded).toBe(0);
  });

  it('times out an unfinished body before making any upstream connection', async () => {
    let forwarded = 0;
    let connected = 0;
    const { upstream, ingressPort } = await fixture((_incoming, response) => { forwarded += 1; response.end(); }, { requestBodyTimeoutMs: 40 });
    upstream.on('connection', () => { connected += 1; });
    const reply = await request(ingressPort, {
      method: 'POST', path: '/api/auth/session',
      send: client => { client.flushHeaders(); client.write('unfinished'); },
    });
    expect(reply.status).toBe(408);
    expect(forwarded).toBe(0);
    expect(connected).toBe(0);
  });

  it.each(['timeout', 'transport-error'])('returns a finite private %s response without leaking request diagnostics', async failure => {
    const logs: unknown[][] = [];
    for (const method of ['log', 'warn', 'error'] as const) vi.spyOn(console, method).mockImplementation((...values) => { logs.push(values); });
    const { ingressPort } = await fixture(incoming => {
      if (failure === 'transport-error') incoming.socket.destroy();
    }, { upstreamTimeoutMs: 40 });
    const markers = ['synthetic-query-private', 'synthetic-cookie-private', 'synthetic-signature-private'];
    const reply = await request(ingressPort, {
      path: `/api/attachments/synthetic?opaque=${markers[0]}`,
      headers: { Cookie: `fixture=${markers[1]}`, 'Webhook-Signature': markers[2] },
    });
    expect(reply.status).toBe(failure === 'timeout' ? 504 : 502);
    expect(reply.body.length).toBeGreaterThan(0);
    expect(reply.body.length).toBeLessThan(128);
    expect(reply.body.toString()).toBe('Servicio temporalmente no disponible.');
    expect(reply.headers['cache-control']).toBe('no-store');
    const output = JSON.stringify(logs);
    expect(markers.some(marker => output.includes(marker) || reply.body.includes(marker))).toBe(false);
  });

  it.each(['timeout', 'transport-error'])('destroys a partially streamed PDF after %s without appending an error body', async failure => {
    const prefix = Buffer.from('%PDF-1.7\nsynthetic partial stream\n');
    const first = deferred<void>();
    let upstreamResponse: ServerResponse | undefined;
    const { ingressPort } = await fixture((_incoming, response) => {
      upstreamResponse = response;
      response.writeHead(200, { 'Content-Type': 'application/pdf', 'Cache-Control': 'private, no-store' });
      response.write(prefix);
    }, { upstreamTimeoutMs: 60 });
    const completed = deadline(new Promise<{ status: number; body: Buffer; aborted: boolean }>((resolve, reject) => {
      const client = begin(ingressPort, { path: '/api/attachments/synthetic' }, response => {
        const chunks: Buffer[] = [];
        let aborted = false;
        response.on('data', chunk => { chunks.push(Buffer.from(chunk)); first.resolve(); });
        response.once('aborted', () => { aborted = true; });
        response.on('error', () => {});
        response.once('close', () => resolve({ status: response.statusCode ?? 0, body: Buffer.concat(chunks), aborted }));
      });
      client.once('error', () => reject(new Error('Owned partial request failed')));
      client.end();
    }));
    await deadline(first.promise);
    if (failure === 'transport-error') upstreamResponse?.destroy();
    const reply = await completed;
    expect(reply.status).toBe(200);
    expect(reply.aborted).toBe(true);
    expect(reply.body.equals(prefix)).toBe(true);
    expect(reply.body.includes('Servicio')).toBe(false);
  });

  it('closes the upstream stream after the client disconnects from a completed GET request', async () => {
    const upstreamClosed = deferred<void>();
    const first = deferred<IncomingMessage>();
    const { ingressPort } = await fixture((incoming, response) => {
      incoming.socket.once('close', () => upstreamClosed.resolve());
      response.writeHead(200, { 'Content-Type': 'text/html' });
      response.write('synthetic open stream');
    });
    const client = begin(ingressPort, { path: '/dashboard/profile' }, response => {
      response.on('error', () => {});
      response.once('data', () => first.resolve(response));
    });
    client.end();
    const response = await deadline(first.promise);
    expect(client.writableFinished).toBe(true);
    response.destroy();
    client.destroy();
    await deadline(upstreamClosed.promise);
  });

  it('rejects headers exceeding the parser limit before any backend request', async () => {
    let forwarded = 0;
    const { ingressPort } = await fixture((_incoming, response) => { forwarded += 1; response.end(); });
    const reply = await request(ingressPort, { headers: { 'X-Synthetic-Large': 'a'.repeat(17 * 1024) } });
    expect(reply.status).toBe(400);
    expect(forwarded).toBe(0);
  });
});
