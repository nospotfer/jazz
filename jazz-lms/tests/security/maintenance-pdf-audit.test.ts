import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { chmodSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { readPrivatePdfAuditConfig, readScopedPdfInventory, runPdfAudit, validatePdfAuditConfig, type PdfAuditConfig, type PdfAuditInventory } from '../../scripts/maintenance/lib/pdf-audit';
import { runPdfAuditCli } from '../../scripts/maintenance/audit-pdf-attachments';

const mocks = vi.hoisted(() => ({ construct: vi.fn(), query: vi.fn(), execute: vi.fn(), disconnect: vi.fn() }));
vi.mock('@prisma/client', () => ({
  Prisma: { TransactionIsolationLevel: { RepeatableRead: 'RepeatableRead' } },
  PrismaClient: class {
    constructor(options: unknown) { mocks.construct(options); }
    $transaction = async (callback: (tx: { $executeRaw: typeof mocks.execute; $queryRaw: typeof mocks.query }) => Promise<unknown>) => callback({ $executeRaw: mocks.execute, $queryRaw: mocks.query });
    $disconnect = mocks.disconnect;
  },
}));

const ref = 'abcdefghijklmnopqrst';
const target = { projectRef: ref, courseId: 'fixture-course' };
const privateMarker = 'private-diagnostic-fixture';
const key = ['eyJhbGciOiJIUzI1NiJ9', Buffer.from(JSON.stringify({ role: 'service_role', ref })).toString('base64url'), 'synthetic-signature'].join('.');
const rawConfig = { ...target, bucket: 'fixture-bucket', supabaseUrl: `https://${ref}.supabase.co`, serviceRoleKey: key,
  databaseUrl: `postgresql://postgres.${ref}:${privateMarker}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true`,
};
const config = (limits: Partial<PdfAuditConfig['limits']> = {}): PdfAuditConfig => validatePdfAuditConfig({ ...rawConfig, limits }, target);
const row = (id = 'fixture-attachment', reference = 'folder/fixture.pdf') => ({ id, reference, courseId: target.courseId });
const inventory = (rows = [row()]): PdfAuditInventory => ({ courseFound: true, attachments: rows });
const pdfBytes = Buffer.from(`%PDF-1.7\n${privateMarker}\n%%EOF\n`);

function response(url: string, body: BodyInit | ReadableStream<Uint8Array> | null = pdfBytes, options: ResponseInit = {}): Response {
  const result = new Response(body, { status: 200, headers: { 'content-type': 'application/pdf' }, ...options });
  Object.defineProperty(result, 'url', { value: url });
  return result;
}
const fetchPdf = vi.fn<typeof fetch>(async input => response(String(input)));
const readInventory = vi.fn(async () => inventory());
let dir: string;
const originalExitCode = process.exitCode;

beforeEach(() => {
  vi.resetAllMocks();
  fetchPdf.mockImplementation(async input => response(String(input)));
  readInventory.mockResolvedValue(inventory());
  mocks.query.mockImplementation(async (strings: TemplateStringsArray) => {
    const sql = strings.join('?');
    if (sql.includes('transaction_read_only')) return [{ readonly: 'on' }];
    if (sql.includes('FROM public."Course"')) return [{ id: target.courseId }];
    if (sql.includes('FROM public."Attachment"')) return inventory().attachments;
    return [];
  });
  dir = mkdtempSync(join(tmpdir(), 'jazz-pdf-audit-fixture-'));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
  process.exitCode = originalExitCode;
  vi.useRealTimers(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks();
});

describe('explicit private audit target preflight', () => {
  test.each([
    { ...rawConfig, projectRef: 'zyxwvutsrqponmlkjihg' },
    { ...rawConfig, courseId: 'other-course' },
    { ...rawConfig, supabaseUrl: 'https://foreign.example.test' },
    { ...rawConfig, databaseUrl: `postgresql://postgres.${ref}:${privateMarker}@db.foreign.example.test:5432/postgres` },
    { ...rawConfig, databaseUrl: `postgresql://postgres.zyxwvutsrqponmlkjihg:${privateMarker}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres` },
    { ...rawConfig, databaseUrl: rawConfig.databaseUrl + '&sslaccept=accept_invalid_certs' },
    { ...rawConfig, serviceRoleKey: ['eyJhbGciOiJIUzI1NiJ9', Buffer.from(JSON.stringify({ role: 'anon', ref })).toString('base64url'), 'signature'].join('.') },
    { ...rawConfig, limits: { maxFiles: 0 } },
    { ...rawConfig, limits: { concurrency: 100 } },
  ])('denies wrong identity/options before creating clients or making any requests', async input => {
    const path = join(dir, 'private.json'); writeFileSync(path, JSON.stringify(input), { mode: 0o600 });
    vi.stubGlobal('fetch', fetchPdf);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const output = vi.spyOn(console, 'error').mockImplementation(() => {});
    await runPdfAuditCli(['--config', path, '--project-ref', ref, '--course-id', target.courseId]);
    expect(process.exitCode).toBe(1);
    expect(mocks.construct).not.toHaveBeenCalled(); expect(fetchPdf).not.toHaveBeenCalled();
    expect(JSON.stringify(output.mock.calls)).not.toContain(privateMarker);
    expect(JSON.stringify(output.mock.calls)).not.toContain(key);
  });

  test('requires a private regular file and refuses symlinks or ambient configuration', async () => {
    const path = join(dir, 'config.json'); writeFileSync(path, JSON.stringify(rawConfig), { mode: 0o600 });
    expect(readPrivatePdfAuditConfig(path, target).courseId).toBe(target.courseId);
    chmodSync(path, 0o644);
    expect(() => readPrivatePdfAuditConfig(path, target)).toThrow('CONFIG_NOT_PRIVATE');
    chmodSync(path, 0o600); symlinkSync(path, join(dir, 'symlink.json'));
    expect(() => readPrivatePdfAuditConfig(join(dir, 'symlink.json'), target)).toThrow('CONFIG_READ_FAILED');
    vi.stubEnv('DATABASE_URL', rawConfig.databaseUrl); vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', key);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await runPdfAuditCli([]);
    expect(mocks.construct).not.toHaveBeenCalled();
  });

  test('the supplied pooler target remains explicit and hardened for its exact project', () => {
    const url = new URL(config().databaseUrl);
    expect(url.username).toBe(`postgres.${ref}`); expect(url.port).toBe('6543');
    expect(url.searchParams.get('pgbouncer')).toBe('true');
    expect(url.searchParams.get('sslaccept')).toBe('strict');
    expect(url.searchParams.get('connection_limit')).toBe('1');
  });

  test.skipIf(process.platform === 'win32')('a private FIFO is rejected promptly rather than blocking before the regular-file check', () => {
    const path = join(dir, 'fifo.json');
    execFileSync('mkfifo', ['-m', '600', path]);
    expect(() => readPrivatePdfAuditConfig(path, target)).toThrow('CONFIG_NOT_PRIVATE');
    expect(mocks.construct).not.toHaveBeenCalled();
  });

  test('an explicitly supplied authoritative CA path is preserved while certificate validation stays strict', () => {
    const url = new URL(rawConfig.databaseUrl);
    url.searchParams.set('sslcert', '/tmp/fixture-authoritative-ca.crt');
    const cfg = validatePdfAuditConfig({ ...rawConfig, databaseUrl: url.href }, target);
    const normalized = new URL(cfg.databaseUrl);
    expect(normalized.searchParams.get('sslcert')).toBe('/tmp/fixture-authoritative-ca.crt');
    expect(normalized.searchParams.get('sslaccept')).toBe('strict');
    expect(normalized.searchParams.get('sslmode')).toBe('require');
  });
});

describe('scoped metadata and object reference identity', () => {
  test('Prisma uses explicit datasource, verified read-only transaction and only scoped content metadata SELECTs', async () => {
    const result = await readScopedPdfInventory(config());
    expect(result).toEqual(inventory());
    expect(mocks.construct).toHaveBeenCalledWith({ datasources: { db: { url: config().databaseUrl } }, log: [] });
    expect(mocks.execute).toHaveBeenCalledOnce();
    expect(mocks.execute.mock.calls[0][0].join('')).toBe('SET TRANSACTION READ ONLY');
    const queries = mocks.query.mock.calls.map(call => call[0].join('?'));
    expect(queries.join('\n')).not.toMatch(/User|Purchase|auth\.|storage\./);
    expect(queries.every(query => query.trim().startsWith('SELECT'))).toBe(true);
    const attachmentQuery = mocks.query.mock.calls.find(call => call[0].join('').includes('FROM public."Attachment"'))!;
    expect(attachmentQuery.slice(1)).toEqual([target.courseId, config().limits.maxFiles + 1]);
    expect(mocks.disconnect).toHaveBeenCalledOnce();
  });

  test('failure to establish read-only mode stops before metadata query or storage request', async () => {
    mocks.query.mockResolvedValue([{ readonly: 'off' }]);
    const report = await runPdfAudit(config(), { readInventory: readScopedPdfInventory, fetch: fetchPdf });
    expect(report.status).toBe('DATABASE_NOT_READ_ONLY');
    expect(mocks.query).toHaveBeenCalledTimes(2); expect(fetchPdf).not.toHaveBeenCalled();
  });

  test.each([
    `https://foreign.supabase.co/storage/v1/object/sign/fixture-bucket/file.pdf?token=${privateMarker}`,
    `https://${ref}.supabase.co/storage/v1/object/sign/foreign-bucket/file.pdf?token=${privateMarker}`,
    `https://${ref}.supabase.co/storage/v1/object/sign/fixture-bucket/a/../file.pdf?token=${privateMarker}`,
    `https://${ref}.supabase.co/storage/v1/object/sign/fixture-bucket/%252e%252e/file.pdf?token=${privateMarker}`,
    `https://${ref}.supabase.co/storage/v1/object/sign/fixture-bucket/%ZZ.pdf?token=${privateMarker}`,
    '../file.pdf', '/file.pdf', 'folder\\file.pdf', '//foreign.example.test/file.pdf', 'file.html',
  ])('rejects foreign/traversal/malformed reference without any provider request', async reference => {
    readInventory.mockResolvedValue(inventory([row('fixture-attachment', reference)]));
    const report = await runPdfAudit(config(), { readInventory, fetch: fetchPdf });
    expect(report.outcome).toBe('incomplete'); expect(fetchPdf).not.toHaveBeenCalled();
    expect(JSON.stringify(report)).not.toContain(reference); expect(JSON.stringify(report)).not.toContain(privateMarker);
  });

  test('signed URL credentials are discarded; only the authenticated native endpoint is fetched and hashes are reported', async () => {
    const reference = `https://${ref}.supabase.co/storage/v1/object/sign/fixture-bucket/folder/Private%20notes.pdf?token=${privateMarker}`;
    readInventory.mockResolvedValue(inventory([row('fixture-attachment', reference)]));
    const report = await runPdfAudit(config(), { readInventory, fetch: fetchPdf });
    expect(report.outcome).toBe('complete');
    expect(fetchPdf.mock.calls[0][0]).toBe(`https://${ref}.supabase.co/storage/v1/object/fixture-bucket/folder/Private%20notes.pdf`);
    expect(fetchPdf.mock.calls[0][1]).toMatchObject({ method: 'GET', redirect: 'error', headers: { Authorization: `Bearer ${key}` } });
    expect(report.records[0].sha256).toBe(createHash('sha256').update(pdfBytes).digest('hex'));
    expect(JSON.stringify(report)).not.toContain('Private'); expect(JSON.stringify(report)).not.toContain(privateMarker);
    expect(JSON.stringify(report)).not.toContain('https://'); expect(JSON.stringify(report)).not.toContain(key);
  });

  test('a foreign course row or duplicate attachment identity aborts the entire inventory before downloads', async () => {
    for (const rows of [[{ ...row(), courseId: 'other-course' }], [row(), row()]]) {
      readInventory.mockResolvedValue(inventory(rows));
      expect((await runPdfAudit(config(), { readInventory, fetch: fetchPdf })).status).toBe('INVENTORY_IDENTITY_FAILURE');
    }
    expect(fetchPdf).not.toHaveBeenCalled();
  });

  test.each(['public/fixture-bucket', 'authenticated/fixture-bucket', 'fixture-bucket'])('supports a same-project %s reference without changing the authenticated download contract', async prefix => {
    readInventory.mockResolvedValue(inventory([row('fixture-attachment', `${rawConfig.supabaseUrl}/storage/v1/object/${prefix}/folder/fixture.pdf`)]));
    const report = await runPdfAudit(config(), { readInventory, fetch: fetchPdf });
    expect(report.outcome).toBe('complete');
    expect(fetchPdf.mock.calls[0][0]).toBe(`${rawConfig.supabaseUrl}/storage/v1/object/fixture-bucket/folder/fixture.pdf`);
  });
});

describe('bounded PDF downloads and honest incomplete reports', () => {
  test.each([
    { status: 404, type: 'application/pdf', body: pdfBytes, result: 'HTTP_FAILURE' },
    { status: 200, type: 'text/html', body: pdfBytes, result: 'CONTENT_TYPE_FAILURE' },
    { status: 200, type: 'application/pdf', body: Buffer.from('<html>PRIVATE</html>'), result: 'PDF_HEADER_FAILURE' },
    { status: 200, type: 'application/pdf', body: Buffer.from('%PDF-'), result: 'PDF_HEADER_FAILURE' },
    { status: 200, type: 'application/pdf', body: Buffer.from([...Buffer.from('%PDF-1.7')].map(byte => byte | 0x80)), result: 'PDF_HEADER_FAILURE' },
  ])('checks HTTP/PDF header contract without including content ($result)', async ({ status, type, body, result }) => {
    fetchPdf.mockImplementation(async url => response(String(url), body, { status, headers: { 'content-type': type } }));
    const report = await runPdfAudit(config(), { readInventory, fetch: fetchPdf });
    expect(report.records[0].status).toBe(result); expect(report.outcome).toBe('incomplete');
    expect(report.records[0]).not.toHaveProperty('sha256'); expect(JSON.stringify(report)).not.toContain('PRIVATE');
  });

  test('does not follow redirects or accept a response associated with another object', async () => {
    fetchPdf.mockImplementation(async () => response('https://foreign.example.test/file.pdf'));
    const report = await runPdfAudit(config(), { readInventory, fetch: fetchPdf });
    expect(report.records[0].status).toBe('RESPONSE_IDENTITY_FAILURE');
    expect(fetchPdf).toHaveBeenCalledOnce();
  });

  test('a known independent checksum can identify the wrong PDF content', async () => {
    const cfg = validatePdfAuditConfig({ ...rawConfig, expectedSha256: { 'fixture-attachment': '0'.repeat(64) } }, target);
    const report = await runPdfAudit(cfg, { readInventory, fetch: fetchPdf });
    expect(report.records[0].status).toBe('HASH_MISMATCH'); expect(report.outcome).toBe('incomplete');
  });

  test('file count exhaustion stops before downloading a partial inventory', async () => {
    readInventory.mockResolvedValue(inventory([row('a'), row('b')]));
    const report = await runPdfAudit(config({ maxFiles: 1 }), { readInventory, fetch: fetchPdf });
    expect(report.status).toBe('FILE_COUNT_LIMIT'); expect(report.outcome).toBe('incomplete');
    expect(report.checkedFiles).toBe(0); expect(fetchPdf).not.toHaveBeenCalled();
  });

  test('declared oversized objects stop before reading their body', async () => {
    fetchPdf.mockImplementation(async url => response(String(url), pdfBytes, { headers: { 'content-type': 'application/pdf', 'content-length': '999' } }));
    const report = await runPdfAudit(config({ maxBytesPerFile: 64 }), { readInventory, fetch: fetchPdf });
    expect(report.status).toBe('PER_FILE_BYTE_LIMIT'); expect(report.bytesChecked).toBe(0);
  });

  test('streaming per-file byte limit cancels the reader and stops subsequent files without buffering all content', async () => {
    const cancel = vi.fn();
    readInventory.mockResolvedValue(inventory([row('a'), row('b')]));
    fetchPdf.mockImplementation(async url => {
      let pull = 0;
      return response(String(url), new ReadableStream({ pull(controller) { controller.enqueue(pull++ ? new Uint8Array(1000) : Buffer.from('%PDF-1.7')); }, cancel }));
    });
    const report = await runPdfAudit(config({ maxBytesPerFile: 16, concurrency: 1 }), { readInventory, fetch: fetchPdf });
    expect(report.status).toBe('PER_FILE_BYTE_LIMIT'); expect(report.outcome).toBe('incomplete');
    expect(report.bytesChecked).toBe(8); expect(fetchPdf).toHaveBeenCalledOnce(); expect(cancel).toHaveBeenCalled();
  });

  test('the shared total byte limit remains bounded across concurrent files', async () => {
    readInventory.mockResolvedValue(inventory([row('a'), row('b'), row('c')]));
    fetchPdf.mockImplementation(async url => response(String(url), Buffer.from('%PDF-1.7')));
    const report = await runPdfAudit(config({ maxTotalBytes: 8, concurrency: 2 }), { readInventory, fetch: fetchPdf });
    expect(report.status).toBe('TOTAL_BYTE_LIMIT'); expect(report.bytesChecked).toBe(8);
    expect(report.outcome).toBe('incomplete'); expect(fetchPdf.mock.calls.length).toBeLessThanOrEqual(2);
  });

  test('request timeout aborts even when a transport promise never resolves', async () => {
    vi.useFakeTimers(); fetchPdf.mockImplementation(() => new Promise(() => {}));
    const pending = runPdfAudit(config({ timeoutMs: 5 }), { readInventory, fetch: fetchPdf });
    await vi.advanceTimersByTimeAsync(6);
    const report = await pending;
    expect(report.status).toBe('TIMEOUT'); expect(report.outcome).toBe('incomplete');
    expect(fetchPdf.mock.calls[0][1]?.signal?.aborted).toBe(true);
  });

  test('overall deadline aborts a stalled inventory without making provider requests', async () => {
    vi.useFakeTimers(); readInventory.mockImplementation(() => new Promise(() => {}));
    const pending = runPdfAudit(config({ maxDurationMs: 5 }), { readInventory, fetch: fetchPdf });
    await vi.advanceTimersByTimeAsync(6);
    expect((await pending).status).toBe('DURATION_LIMIT'); expect(fetchPdf).not.toHaveBeenCalled();
  });

  test('the per-file timeout also bounds a body that stalls after sending its PDF header', async () => {
    vi.useFakeTimers();
    const cancel = vi.fn();
    fetchPdf.mockImplementation(async url => response(String(url), new ReadableStream({
      start(controller) { controller.enqueue(Buffer.from('%PDF-1.7')); }, cancel,
    })));
    const pending = runPdfAudit(config({ timeoutMs: 5 }), { readInventory, fetch: fetchPdf });
    await vi.advanceTimersByTimeAsync(6);
    const report = await pending;
    expect(report.status).toBe('TIMEOUT'); expect(report.bytesChecked).toBe(8);
    expect(cancel).toHaveBeenCalled();
  });

  test('provider/database exceptions containing credentials are replaced with controlled statuses', async () => {
    readInventory.mockRejectedValue(new Error(`${rawConfig.databaseUrl} ${key}`));
    let report = await runPdfAudit(config(), { readInventory, fetch: fetchPdf });
    expect(report.status).toBe('INVENTORY_FAILURE');
    readInventory.mockResolvedValue(inventory()); fetchPdf.mockRejectedValue(new Error(`https://foreign.example.test?token=${privateMarker}`));
    report = await runPdfAudit(config(), { readInventory, fetch: fetchPdf });
    expect(report.records[0].status).toBe('NETWORK_FAILURE');
    expect(JSON.stringify(report)).not.toContain(privateMarker); expect(JSON.stringify(report)).not.toContain(key);
  });
});
