import { createPrivateKey } from 'node:crypto';
import { isAbsolute } from 'node:path';

export const PRODUCTION_PROJECT_REF = 'feavujcllgbzlvdvkkxx';
export const PREVIEW_PROJECT_REF = 'tvmhuacxctdgmejziaxg';
export const RECOVERY_PROJECT_REF = 'klaiiikojgdfclzhqfgt';
export const ISOLATED_PREVIEW_MAX_MS = 86_400_000;
export const RESTRICTED_PREVIEW_MAX_MS = 1_800_000;
const CANONICAL_ORIGIN = 'https://www.culturadeljazz.com';
const ALLOWED_ENV = new Set([
  'APP_URL', 'NEXT_PUBLIC_APP_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'DATABASE_URL',
  'SUPABASE_STORAGE_BUCKET', 'MUX_SIGNING_KEY_ID', 'MUX_SIGNING_PRIVATE_KEY',
  'CRON_SECRET', 'DODO_ENVIRONMENT', 'DODO_API_BASE_URL', 'DODO_PAYMENTS_API_KEY',
  'DODO_PAYMENTS_WEBHOOK_SECRET', 'DODO_BUSINESS_ID', 'DODO_PRODUCT_ID',
  'DODO_WEBHOOK_REPLAY_WINDOW_SECONDS', 'RESEND_API_KEY', 'RESEND_FROM_EMAIL',
  'PROFESSOR_EMAIL', 'ADMIN_OWNER_EMAIL', 'RESEND_WEBHOOK_SECRET',
  'MESSAGES_REPLY_TO_EMAIL', 'INBOUND_EMAIL_WEBHOOK_SECRET', 'NEXT_PUBLIC_SUPPORT_EMAIL',
  'SIGNED_URL_TTL_SECONDS', 'PDF_CACHE_VERSION',
]);
const DATABASE_PARAMETERS = new Set(['sslmode', 'sslaccept', 'sslcert', 'schema', 'connection_limit', 'pool_timeout', 'connect_timeout', 'statement_cache_size']);

export class NativeConfigurationError extends Error {
  constructor(code) { super(code); this.name = 'NativeConfigurationError'; }
}
function requireCondition(condition, code) { if (!condition) throw new NativeConfigurationError(code); }
function record(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }

/** Decode legacy key routing claims only; this does not verify a JWT signature
 * or establish ownership of an opaque modern key. Native provider proof is required.
 */
function keyMatchesProject(key, role, ref) {
  if (role === 'anon' && /^sb_publishable_[A-Za-z0-9_-]{16,}$/.test(key)) return true;
  if (role === 'service_role' && /^sb_secret_[A-Za-z0-9_-]{16,}$/.test(key)) return true;
  try {
    const pieces = key.split('.');
    if (pieces.length !== 3 || pieces.some(piece => !/^[A-Za-z0-9_-]+$/.test(piece))) return false;
    const payload = JSON.parse(Buffer.from(pieces[1], 'base64url').toString('utf8'));
    return payload.role === role && payload.ref === ref;
  } catch { return false; }
}

function checkDatabase(value, ref, caPath) {
  try {
    const url = new URL(value);
    const user = decodeURIComponent(url.username);
    const direct = url.hostname === `db.${ref}.supabase.co` && user === 'postgres';
    const pooler = /^aws-\d+-[a-z0-9-]+\.pooler\.supabase\.com$/.test(url.hostname) && user === `postgres.${ref}`;
    const keys = [...url.searchParams.keys()];
    return ['postgres:', 'postgresql:'].includes(url.protocol) && (direct || pooler) &&
      url.port === '5432' && url.pathname === '/postgres' && Boolean(url.password) && !url.hash &&
      new Set(keys).size === keys.length && keys.every(key => DATABASE_PARAMETERS.has(key)) &&
      url.searchParams.get('sslmode') === 'require' && url.searchParams.get('sslaccept') === 'strict' &&
      url.searchParams.get('sslcert') === caPath && (!url.searchParams.has('schema') || url.searchParams.get('schema') === 'public') &&
      ['pool_timeout', 'connect_timeout'].every(key => /^\d+$/.test(url.searchParams.get(key) ?? '') && Number(url.searchParams.get(key)) >= 1 && Number(url.searchParams.get(key)) <= 15) &&
      (!url.searchParams.has('connection_limit') || /^[1-9]\d?$/.test(url.searchParams.get('connection_limit'))) &&
      (!url.searchParams.has('statement_cache_size') || /^\d{1,5}$/.test(url.searchParams.get('statement_cache_size')));
  } catch { return false; }
}

/** Pure routing/environment validation, not account, CA file, code/build or
 * approval proof. The I/O entrypoint must check those before starting a process.
 * @param {unknown} value
 * @returns {{mode:'production'|'preview',sourceCommit:string,projectRef:string,origin:string,ca:{path:string,sha256:string},testPayments?:{provider:'dodo',scopeId:string,expiresAt:string},recoveryAccess?:{purpose:'restored-customer-access',scopeId:string,expiresAt:string},env:Record<string,string>}}
 */
export function validateNativeConfig(value) {
  requireCondition(record(value), 'NATIVE_CONFIG_SHAPE');
  requireCondition(value.version === 1 && ['production', 'preview'].includes(value.mode), 'NATIVE_CONFIG_MODE');
  requireCondition(typeof value.sourceCommit === 'string' && /^[a-f0-9]{40}$/.test(value.sourceCommit), 'NATIVE_CONFIG_SOURCE');
  const production = value.mode === 'production';
  let recoveryAccess;
  if (Object.hasOwn(value, 'recoveryAccess')) {
    const access = value.recoveryAccess;
    requireCondition(!production && !Object.hasOwn(value, 'testPayments') && record(access) &&
      Object.keys(access).length === 3 && ['purpose', 'scopeId', 'expiresAt'].every(name => Object.hasOwn(access, name)) &&
      access.purpose === 'restored-customer-access' && typeof access.scopeId === 'string' &&
      /^[a-z0-9][a-z0-9-]{2,79}$/.test(access.scopeId) && typeof access.expiresAt === 'string', 'NATIVE_CONFIG_RECOVERY_ACCESS');
    const deadline = Date.parse(access.expiresAt), now = Date.now();
    requireCondition(Number.isFinite(deadline) && new Date(deadline).toISOString() === access.expiresAt &&
      deadline > now && deadline <= now + RESTRICTED_PREVIEW_MAX_MS, 'NATIVE_CONFIG_RECOVERY_ACCESS');
    recoveryAccess = { purpose: 'restored-customer-access', scopeId: access.scopeId, expiresAt: access.expiresAt };
  }
  let testPayments;
  if (Object.hasOwn(value, 'testPayments')) {
    const optIn = value.testPayments;
    requireCondition(!production && record(optIn) && Object.keys(optIn).length === 3 &&
      ['provider', 'scopeId', 'expiresAt'].every(name => Object.hasOwn(optIn, name)) &&
      optIn.provider === 'dodo' && typeof optIn.scopeId === 'string' &&
      /^[a-z0-9][a-z0-9-]{2,79}$/.test(optIn.scopeId) && typeof optIn.expiresAt === 'string', 'NATIVE_CONFIG_TEST_PAYMENTS');
    const deadline = Date.parse(optIn.expiresAt), now = Date.now();
    requireCondition(Number.isFinite(deadline) && new Date(deadline).toISOString() === optIn.expiresAt &&
      deadline > now && deadline <= now + RESTRICTED_PREVIEW_MAX_MS, 'NATIVE_CONFIG_TEST_PAYMENTS');
    testPayments = { provider: 'dodo', scopeId: optIn.scopeId, expiresAt: optIn.expiresAt };
  }
  const ref = production ? PRODUCTION_PROJECT_REF : recoveryAccess ? RECOVERY_PROJECT_REF : PREVIEW_PROJECT_REF;
  requireCondition(value.projectRef === ref, 'NATIVE_CONFIG_PROJECT');
  requireCondition(record(value.ca) && typeof value.ca.path === 'string' && isAbsolute(value.ca.path) &&
    !/[\x00-\x1f\x7f]/.test(value.ca.path) && typeof value.ca.sha256 === 'string' && /^[a-f0-9]{64}$/.test(value.ca.sha256), 'NATIVE_CONFIG_CA');
  let origin;
  try {
    const url = new URL(value.origin);
    requireCondition(url.protocol === 'https:' && !url.port && !url.username && !url.password &&
      url.pathname === '/' && !url.search && !url.hash && url.origin === value.origin, 'NATIVE_CONFIG_ORIGIN');
    requireCondition(production ? url.origin === CANONICAL_ORIGIN :
      url.hostname.endsWith('.trycloudflare.com') && /^[a-z0-9]+(?:-[a-z0-9]+)*\.trycloudflare\.com$/.test(url.hostname), 'NATIVE_CONFIG_ORIGIN');
    origin = url.origin;
  } catch { throw new NativeConfigurationError('NATIVE_CONFIG_ORIGIN'); }
  requireCondition(record(value.env) && Object.entries(value.env).every(([name, text]) => ALLOWED_ENV.has(name) &&
    typeof text === 'string' && text.length <= 32 * 1024 && !text.includes('\0')), 'NATIVE_CONFIG_ENVIRONMENT');
  const env = { ...value.env };
  requireCondition(env.APP_URL === origin && env.NEXT_PUBLIC_APP_URL === origin, 'NATIVE_CONFIG_ORIGIN');
  const supabase = `https://${ref}.supabase.co`;
  requireCondition(env.NEXT_PUBLIC_SUPABASE_URL === supabase && (!env.SUPABASE_URL || env.SUPABASE_URL === supabase), 'NATIVE_CONFIG_PROJECT');
  requireCondition(keyMatchesProject(env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '', 'anon', ref) &&
    keyMatchesProject(env.SUPABASE_SERVICE_ROLE_KEY ?? '', 'service_role', ref), 'NATIVE_CONFIG_KEY_KIND');
  requireCondition(checkDatabase(env.DATABASE_URL, ref, value.ca.path), 'NATIVE_CONFIG_DATABASE');
  requireCondition(Boolean(env.SUPABASE_STORAGE_BUCKET?.trim()) && Boolean(env.MUX_SIGNING_KEY_ID?.trim()), 'NATIVE_CONFIG_MEDIA');
  try {
    const raw = env.MUX_SIGNING_PRIVATE_KEY?.trim() ?? '';
    const pem = raw.includes('BEGIN') ? raw : Buffer.from(raw, 'base64').toString('utf8');
    const key = createPrivateKey(pem);
    requireCondition(key.asymmetricKeyType === 'rsa' && (key.asymmetricKeyDetails?.modulusLength ?? 0) >= 2048, 'NATIVE_CONFIG_MEDIA');
  } catch { throw new NativeConfigurationError('NATIVE_CONFIG_MEDIA'); }
  if (production) {
    requireCondition(['CRON_SECRET', 'DODO_PAYMENTS_API_KEY', 'DODO_PAYMENTS_WEBHOOK_SECRET', 'DODO_BUSINESS_ID', 'DODO_PRODUCT_ID', 'PROFESSOR_EMAIL', 'ADMIN_OWNER_EMAIL'].every(name => Boolean(env[name]?.trim())), 'NATIVE_CONFIG_PRODUCTION');
    requireCondition(env.CRON_SECRET.length >= 32 && env.DODO_ENVIRONMENT === 'live_mode' &&
      (!env.DODO_API_BASE_URL || env.DODO_API_BASE_URL === 'https://live.dodopayments.com'), 'NATIVE_CONFIG_PRODUCTION');
    requireCondition(Boolean(env.RESEND_API_KEY) === Boolean(env.RESEND_FROM_EMAIL) &&
      Boolean(env.RESEND_WEBHOOK_SECRET) === Boolean(env.MESSAGES_REPLY_TO_EMAIL), 'NATIVE_CONFIG_MAIL');
  } else {
    requireCondition(['CRON_SECRET', 'RESEND_API_KEY', 'RESEND_FROM_EMAIL', 'RESEND_WEBHOOK_SECRET', 'MESSAGES_REPLY_TO_EMAIL', 'INBOUND_EMAIL_WEBHOOK_SECRET'].every(name => !env[name]), 'NATIVE_CONFIG_PREVIEW_SIDE_EFFECTS');
    const dodoFields = ['DODO_PAYMENTS_API_KEY', 'DODO_PAYMENTS_WEBHOOK_SECRET', 'DODO_BUSINESS_ID', 'DODO_PRODUCT_ID'];
    if (testPayments) {
      // An explicit leased TEST integration is server-only. Routing acceptance
      // does not authenticate its key, business, product or webhook signer.
      requireCondition(env.DODO_ENVIRONMENT === 'test_mode' && env.DODO_API_BASE_URL === 'https://test.dodopayments.com' &&
        dodoFields.every(name => Boolean(env[name]?.trim())), 'NATIVE_CONFIG_TEST_PAYMENTS');
    } else {
      requireCondition(dodoFields.every(name => !env[name]), 'NATIVE_CONFIG_PREVIEW_SIDE_EFFECTS');
      requireCondition(!env.DODO_ENVIRONMENT || env.DODO_ENVIRONMENT === 'test_mode', 'NATIVE_CONFIG_PREVIEW_SIDE_EFFECTS');
      requireCondition(!env.DODO_API_BASE_URL || env.DODO_API_BASE_URL === 'https://test.dodopayments.com', 'NATIVE_CONFIG_PREVIEW_SIDE_EFFECTS');
    }
  }
  // Deliberately construct a clean child environment. No ambient provider keys,
  // NODE_OPTIONS, home config, tracing, local mutators or platform flags survive.
  Object.assign(env, {
    NODE_ENV: 'production', APP_DEPLOYMENT_ENVIRONMENT: value.mode,
    NEXT_TELEMETRY_DISABLED: '1', NEXT_PUBLIC_OPENREPLAY_ENABLED: 'false',
    NEXT_PUBLIC_OPENREPLAY_PROJECT_KEY: '', NEXT_PUBLIC_GA_MEASUREMENT_ID: '',
    ENABLE_LOCAL_TEST_CHECKOUT: '0', ENABLE_LOCAL_TEST_RESETS: '0', ENABLE_LOCAL_LEGACY_MUTATIONS: '0',
    NATIVE_PREVIEW_PROFILE: production ? 'production' : recoveryAccess ? 'recovery-access' : testPayments ? 'test-payments' : 'isolated',
    NATIVE_TEST_PAYMENTS_EXPIRES_AT: testPayments?.expiresAt ?? '',
    NEXT_PUBLIC_RECOVERY_ACCESS: recoveryAccess ? 'true' : 'false',
    NATIVE_RECOVERY_ACCESS: recoveryAccess ? 'true' : 'false',
    NATIVE_RECOVERY_EXPIRES_AT: recoveryAccess?.expiresAt ?? '',
  });
  return { mode: value.mode, sourceCommit: value.sourceCommit, projectRef: ref, origin, ca: { path: value.ca.path, sha256: value.ca.sha256 },
    ...(testPayments ? { testPayments } : {}), ...(recoveryAccess ? { recoveryAccess } : {}), env };
}
