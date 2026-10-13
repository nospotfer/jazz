import { createHash } from 'node:crypto';
import { constants, closeSync, fstatSync, openSync, readFileSync } from 'node:fs';

export type PdfAuditTarget = { projectRef: string; courseId: string };
export type PdfAuditLimits = {
  maxFiles: number; maxBytesPerFile: number; maxTotalBytes: number;
  timeoutMs: number; maxDurationMs: number; concurrency: number;
};
export type PdfAuditConfig = PdfAuditTarget & {
  supabaseUrl: string; serviceRoleKey: string; databaseUrl: string; bucket: string;
  limits: PdfAuditLimits; expectedSha256?: Record<string, string>;
};
export type PdfAuditInventory = {
  courseFound: boolean;
  attachments: { id: string; courseId: string; reference: string | null }[];
};
export type PdfAuditRecord = {
  attachmentId: string; status: string; bytesChecked: number; httpStatus?: number; sha256?: string;
};
export type PdfAuditReport = PdfAuditTarget & {
  outcome: 'complete' | 'incomplete'; status: string; inventoryRowsSeen: number;
  checkedFiles: number; successfulFiles: number; bytesChecked: number;
  limits: PdfAuditLimits; records: PdfAuditRecord[];
};
export type PdfAuditDependencies = {
  readInventory: (config: PdfAuditConfig) => Promise<PdfAuditInventory>;
  fetch: typeof fetch;
};

const safeId = /^[a-zA-Z0-9_-]{1,128}$/;
const projectRef = /^[a-z]{20}$/;
const defaults: PdfAuditLimits = {
  maxFiles: 256, maxBytesPerFile: 16 * 1024 * 1024, maxTotalBytes: 128 * 1024 * 1024,
  timeoutMs: 10_000, maxDurationMs: 90_000, concurrency: 2,
};
const maximums: PdfAuditLimits = {
  maxFiles: 1_000, maxBytesPerFile: 64 * 1024 * 1024, maxTotalBytes: 1024 * 1024 * 1024,
  timeoutMs: 60_000, maxDurationMs: 600_000, concurrency: 4,
};

export class PdfAuditPreflightError extends Error {
  constructor(public readonly code: string) { super(code); this.name = 'PdfAuditPreflightError'; }
}
function deny(code: string): never { throw new PdfAuditPreflightError(code); }
function requiredString(value: unknown): string {
  if (typeof value !== 'string' || !value || value !== value.trim()) deny('INVALID_CONFIG');
  return value;
}

export function validatePdfAuditConfig(input: unknown, expected: PdfAuditTarget): PdfAuditConfig {
  if (!projectRef.test(expected.projectRef) || !safeId.test(expected.courseId)) deny('INVALID_TARGET');
  if (!input || typeof input !== 'object' || Array.isArray(input)) deny('INVALID_CONFIG');
  const raw = input as Record<string, unknown>;
  if (raw.projectRef !== expected.projectRef || raw.courseId !== expected.courseId) deny('TARGET_MISMATCH');
  const origin = `https://${expected.projectRef}.supabase.co`;
  const suppliedUrl = requiredString(raw.supabaseUrl);
  if (suppliedUrl !== origin && suppliedUrl !== origin + '/') deny('PROJECT_URL_MISMATCH');
  const bucket = requiredString(raw.bucket);
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(bucket)) deny('INVALID_BUCKET');
  const serviceRoleKey = requiredString(raw.serviceRoleKey);
  if (serviceRoleKey.length > 8_192 || /\s/.test(serviceRoleKey)) deny('INVALID_SERVICE_KEY');
  if (!serviceRoleKey.startsWith('sb_secret_')) {
    try {
      const parts = serviceRoleKey.split('.');
      if (parts.length !== 3) deny('INVALID_SERVICE_KEY');
      const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
      // An unverified claim is only a preflight rejection hint. The verified
      // project endpoint must still authenticate the supplied key on every GET.
      if (claims.role !== 'service_role' || claims.ref !== expected.projectRef) deny('SERVICE_KEY_TARGET_MISMATCH');
    } catch { deny('SERVICE_KEY_TARGET_MISMATCH'); }
  } else if (!/^sb_secret_[a-zA-Z0-9_-]{16,}$/.test(serviceRoleKey)) deny('INVALID_SERVICE_KEY');

  let db: URL;
  try { db = new URL(requiredString(raw.databaseUrl)); } catch { deny('INVALID_DATABASE_TARGET'); }
  const username = decodeURIComponent(db.username);
  const direct = db.hostname === `db.${expected.projectRef}.supabase.co`
    && /^[a-zA-Z0-9_-]+$/.test(username);
  const pooler = /^aws-[0-9]+-[a-z0-9-]+\.pooler\.supabase\.com$/.test(db.hostname)
    && username.endsWith(`.${expected.projectRef}`)
    && /^[a-zA-Z0-9_-]+\.[a-z]{20}$/.test(username);
  if (!['postgresql:', 'postgres:'].includes(db.protocol) || (!direct && !pooler)
    || !['5432', '6543'].includes(db.port || '5432') || db.pathname !== '/postgres'
    || !db.password || db.hash) deny('DATABASE_TARGET_MISMATCH');
  const allowedParams = new Set(['sslmode', 'sslaccept', 'sslcert', 'schema', 'pgbouncer', 'connection_limit', 'connect_timeout', 'socket_timeout', 'pool_timeout']);
  if ([...db.searchParams.keys()].some(key => !allowedParams.has(key))
    || (db.searchParams.has('schema') && db.searchParams.get('schema') !== 'public')
    || (db.searchParams.has('sslaccept') && db.searchParams.get('sslaccept') !== 'strict')) deny('INVALID_DATABASE_OPTIONS');
  db.searchParams.set('sslmode', 'require');
  db.searchParams.set('sslaccept', 'strict');
  db.searchParams.set('connection_limit', '1');
  db.searchParams.set('connect_timeout', '10');
  db.searchParams.set('socket_timeout', '15');
  db.searchParams.set('pool_timeout', '10');
  if (db.port === '6543') db.searchParams.set('pgbouncer', 'true');

  const limits = { ...defaults };
  if (raw.limits !== undefined && (!raw.limits || typeof raw.limits !== 'object' || Array.isArray(raw.limits))) deny('INVALID_LIMITS');
  for (const [key, value] of Object.entries(raw.limits ?? {})) {
    if (!Object.hasOwn(defaults, key) || typeof value !== 'number' || !Number.isSafeInteger(value)
      || value < 1 || value > maximums[key as keyof PdfAuditLimits]) deny('INVALID_LIMITS');
    limits[key as keyof PdfAuditLimits] = value;
  }
  let expectedSha256: Record<string, string> | undefined;
  if (raw.expectedSha256 !== undefined) {
    if (!raw.expectedSha256 || typeof raw.expectedSha256 !== 'object' || Array.isArray(raw.expectedSha256)) deny('INVALID_HASH_MANIFEST');
    expectedSha256 = Object.create(null) as Record<string, string>;
    for (const [id, hash] of Object.entries(raw.expectedSha256)) {
      if (!safeId.test(id) || typeof hash !== 'string' || !/^[a-f0-9]{64}$/.test(hash)) deny('INVALID_HASH_MANIFEST');
      expectedSha256[id] = hash;
    }
  }
  return { ...expected, supabaseUrl: origin, bucket, serviceRoleKey, databaseUrl: db.href, limits, expectedSha256 };
}

export function readPrivatePdfAuditConfig(path: string, target: PdfAuditTarget): PdfAuditConfig {
  let fd: number | undefined;
  try {
    fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
    const stat = fstatSync(fd);
    if (!stat.isFile() || (stat.mode & 0o077) !== 0 || stat.size > 32_768
      || (process.getuid && stat.uid !== process.getuid())) deny('CONFIG_NOT_PRIVATE');
    return validatePdfAuditConfig(JSON.parse(readFileSync(fd, 'utf8')), target);
  } catch (error) {
    if (error instanceof PdfAuditPreflightError) throw error;
    return deny('CONFIG_READ_FAILED');
  } finally { if (fd !== undefined) closeSync(fd); }
}

function validateObjectPath(path: string): string {
  if (!path || path.length > 2_048 || /[\\%?#\u0000-\u001f\u007f]/.test(path)) deny('INVALID_REFERENCE');
  const segments = path.split('/');
  if (segments.some(segment => !segment || segment === '.' || segment === '..')) deny('INVALID_REFERENCE');
  if (!segments.at(-1)!.toLowerCase().endsWith('.pdf')) deny('INVALID_REFERENCE');
  return segments.map(encodeURIComponent).join('/');
}

export function pdfAuditDownloadUrl(reference: string | null, config: PdfAuditConfig): string {
  if (typeof reference !== 'string' || reference !== reference.trim()) deny('INVALID_REFERENCE');
  let objectPath = reference;
  if (/^[a-z][a-z0-9+.-]*:/i.test(reference)) {
    let url: URL;
    try { url = new URL(reference); } catch { deny('INVALID_REFERENCE'); }
    if (url.origin !== config.supabaseUrl || url.username || url.password || url.hash) deny('FOREIGN_REFERENCE');
    const rawPath = reference.match(/^https:\/\/[^/?#]+(\/[^?#]*)/i)?.[1];
    if (!rawPath || rawPath !== url.pathname) deny('INVALID_REFERENCE'); // Reject URL dot-segment normalization.
    const prefix = `/storage/v1/object/`;
    if (!rawPath.startsWith(prefix)) deny('INVALID_REFERENCE');
    const parts = rawPath.slice(prefix.length).split('/');
    const access = parts.shift();
    const markedAccess = ['sign', 'public', 'authenticated'].includes(access ?? '');
    if (!markedAccess && access !== config.bucket) deny('FOREIGN_BUCKET');
    let decoded: string[];
    try { decoded = parts.map(decodeURIComponent); } catch { deny('INVALID_REFERENCE'); }
    if (markedAccess && decoded.shift() !== config.bucket) deny('FOREIGN_BUCKET');
    if ([...url.searchParams.keys()].some(key => !['token', 'v', 'download'].includes(key))
      || (access === 'sign' && !url.searchParams.get('token'))) deny('INVALID_REFERENCE');
    objectPath = decoded.join('/');
  }
  return `${config.supabaseUrl}/storage/v1/object/${encodeURIComponent(config.bucket)}/${validateObjectPath(objectPath)}`;
}

export async function readScopedPdfInventory(config: PdfAuditConfig): Promise<PdfAuditInventory> {
  config = validatePdfAuditConfig(config, { projectRef: config.projectRef, courseId: config.courseId });
  const { PrismaClient, Prisma } = await import('@prisma/client');
  const prisma = new PrismaClient({ datasources: { db: { url: config.databaseUrl } }, log: [] });
  try {
    return await prisma.$transaction(async tx => {
      await tx.$executeRaw`SET TRANSACTION READ ONLY`;
      await tx.$queryRaw`SELECT set_config('statement_timeout', '10000', true)`;
      const mode = await tx.$queryRaw<{ readonly: string }[]>`SELECT current_setting('transaction_read_only') AS readonly`;
      if (mode[0]?.readonly !== 'on') deny('DATABASE_NOT_READ_ONLY');
      const course = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM public."Course" WHERE id = ${config.courseId} LIMIT 1`;
      const attachments = await tx.$queryRaw<PdfAuditInventory['attachments']>`
        SELECT a.id, c."courseId" AS "courseId",
          CASE WHEN octet_length(a.url) <= 8192 THEN a.url ELSE NULL END AS reference
        FROM public."Attachment" a
        JOIN public."Lesson" l ON l.id = a."lessonId"
        JOIN public."Chapter" c ON c.id = l."chapterId"
        WHERE c."courseId" = ${config.courseId}
        ORDER BY a.id LIMIT ${config.limits.maxFiles + 1}`;
      return { courseFound: course.length === 1, attachments };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, maxWait: 10_000, timeout: 15_000 });
  } finally { await prisma.$disconnect(); }
}

function abortable<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const aborted = () => reject(new PdfAuditPreflightError('ABORTED'));
    if (signal.aborted) aborted();
    else signal.addEventListener('abort', aborted, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', aborted));
  });
}

export async function runPdfAudit(config: PdfAuditConfig, dependencies: PdfAuditDependencies): Promise<PdfAuditReport> {
  // Validate again before dependency construction/query/fetch, even when called
  // directly by an importer rather than through the private-file CLI.
  config = validatePdfAuditConfig(config, { projectRef: config.projectRef, courseId: config.courseId });
  const report: PdfAuditReport = {
    projectRef: config.projectRef, courseId: config.courseId, outcome: 'incomplete', status: 'INVENTORY_FAILURE',
    inventoryRowsSeen: 0, checkedFiles: 0, successfulFiles: 0, bytesChecked: 0, limits: config.limits, records: [],
  };
  const overall = new AbortController();
  let stopReason = '';
  const stop = (reason: string) => { if (!stopReason) stopReason = reason; overall.abort(); };
  const overallTimer = setTimeout(() => stop('DURATION_LIMIT'), config.limits.maxDurationMs);
  try {
    let inventory: PdfAuditInventory;
    try { inventory = await abortable(dependencies.readInventory(config), overall.signal); }
    catch (error) {
      report.status = stopReason || (error instanceof PdfAuditPreflightError ? error.code : 'INVENTORY_FAILURE');
      return report;
    }
    report.inventoryRowsSeen = inventory.attachments.length;
    if (!inventory.courseFound) { report.status = 'COURSE_NOT_FOUND'; return report; }
    if (!inventory.attachments.length) { report.status = 'NO_ATTACHMENTS'; return report; }
    if (inventory.attachments.length > config.limits.maxFiles) { report.status = 'FILE_COUNT_LIMIT'; return report; }
    const ids = new Set<string>();
    let urls: string[];
    try {
      urls = inventory.attachments.map(row => {
        if (!safeId.test(row.id) || row.courseId !== config.courseId || ids.has(row.id)) deny('INVENTORY_IDENTITY_FAILURE');
        ids.add(row.id);
        return pdfAuditDownloadUrl(row.reference, config);
      });
      if (config.expectedSha256 && Object.keys(config.expectedSha256).some(id => !ids.has(id))) deny('HASH_MANIFEST_SCOPE_MISMATCH');
    } catch (error) {
      report.status = error instanceof PdfAuditPreflightError ? error.code : 'INVALID_REFERENCE';
      return report;
    }
    let index = 0;
    async function inspect(position: number): Promise<PdfAuditRecord> {
      const row = inventory.attachments[position];
      const record: PdfAuditRecord = { attachmentId: row.id, status: 'NETWORK_FAILURE', bytesChecked: 0 };
      const file = new AbortController();
      const signal = AbortSignal.any([file.signal, overall.signal]);
      let timedOut = false;
      const timer = setTimeout(() => { timedOut = true; file.abort(); stop('TIMEOUT'); }, config.limits.timeoutMs);
      let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
      try {
        const response = await abortable(dependencies.fetch(urls[position], {
          method: 'GET', redirect: 'error', signal, cache: 'no-store',
          headers: { Authorization: `Bearer ${config.serviceRoleKey}`, apikey: config.serviceRoleKey, 'Accept-Encoding': 'identity' },
        }), signal);
        record.httpStatus = response.status;
        if (response.url !== urls[position] || response.redirected) { record.status = 'RESPONSE_IDENTITY_FAILURE'; return record; }
        if (response.status !== 200) { record.status = 'HTTP_FAILURE'; return record; }
        if ((response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase() !== 'application/pdf') {
          record.status = 'CONTENT_TYPE_FAILURE'; return record;
        }
        const declaredLength = response.headers.get('content-length');
        if (declaredLength !== null && (!/^\d+$/.test(declaredLength) || !Number.isSafeInteger(Number(declaredLength)))) {
          record.status = 'INVALID_LENGTH'; return record;
        }
        if (declaredLength !== null && Number(declaredLength) > config.limits.maxBytesPerFile) {
          record.status = 'PER_FILE_BYTE_LIMIT'; stop(record.status); return record;
        }
        if (declaredLength !== null && Number(declaredLength) > config.limits.maxTotalBytes - report.bytesChecked) {
          record.status = 'TOTAL_BYTE_LIMIT'; stop(record.status); return record;
        }
        if (!response.body) { record.status = 'EMPTY_FILE'; return record; }
        reader = response.body.getReader();
        const hash = createHash('sha256');
        let header = Buffer.alloc(0);
        while (true) {
          const { value, done } = await abortable(reader.read(), signal);
          if (done) break;
          // Cap bytes accepted for checking/hashing. Fetch may have received
          // this one transport chunk already; abort rather than buffer/read on.
          if (value.byteLength > config.limits.maxBytesPerFile - record.bytesChecked) {
            record.status = 'PER_FILE_BYTE_LIMIT'; stop(record.status); return record;
          }
          if (value.byteLength > config.limits.maxTotalBytes - report.bytesChecked) {
            record.status = 'TOTAL_BYTE_LIMIT'; stop(record.status); return record;
          }
          record.bytesChecked += value.byteLength; report.bytesChecked += value.byteLength;
          hash.update(value);
          if (header.length < 8) header = Buffer.concat([header, value.subarray(0, 8 - header.length)]);
          if (header.length === 8 && !/^%PDF-(?:1\.[0-9]|2\.0)$/.test(header.toString('latin1'))) {
            record.status = 'PDF_HEADER_FAILURE'; return record;
          }
        }
        if (header.length < 8) { record.status = 'PDF_HEADER_FAILURE'; return record; }
        if (declaredLength !== null && Number(declaredLength) !== record.bytesChecked) { record.status = 'LENGTH_MISMATCH'; return record; }
        record.sha256 = hash.digest('hex');
        record.status = config.expectedSha256?.[row.id] && config.expectedSha256[row.id] !== record.sha256
          ? 'HASH_MISMATCH' : 'PDF_HEADER_OK';
        return record;
      } catch {
        record.status = timedOut ? 'TIMEOUT' : stopReason || 'NETWORK_FAILURE';
        return record;
      } finally {
        clearTimeout(timer);
        file.abort();
        if (reader) void reader.cancel().catch(() => {});
      }
    }
    await Promise.all(Array.from({ length: Math.min(config.limits.concurrency, urls.length) }, async () => {
      while (!overall.signal.aborted && index < urls.length) {
        const position = index++;
        report.records.push(await inspect(position));
      }
    }));
    report.records.sort((a, b) => a.attachmentId.localeCompare(b.attachmentId));
    report.checkedFiles = report.records.length;
    report.successfulFiles = report.records.filter(record => record.status === 'PDF_HEADER_OK').length;
    report.status = stopReason || (report.successfulFiles === urls.length ? 'PDF_HEADERS_VERIFIED' : 'FILE_FAILURES');
    if (report.status === 'PDF_HEADERS_VERIFIED') report.outcome = 'complete';
    return report;
  } finally { clearTimeout(overallTimer); }
}
