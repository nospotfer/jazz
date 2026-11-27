import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

class DeploymentTargetError extends Error {}

/**
 * Scope validation is not production approval or proof of provider isolation.
 * @param {{mode: string, branch: string, head: string, dirty: boolean, env: Record<string, string | undefined>, link: {projectId?: string, orgId?: string}}} input
 */
export function validateDeploymentTarget({ mode, branch, head, dirty, env, link }) {
  if (!['preview', 'production'].includes(mode)) throw new DeploymentTargetError('Expected preview or production deployment target.');
  if (dirty) throw new DeploymentTargetError('Commit all tracked and untracked source changes before deployment.');
  if (!/^[a-f0-9]{40}$/.test(env.VERCEL_DEPLOY_COMMIT || '') || env.VERCEL_DEPLOY_COMMIT !== head) {
    throw new DeploymentTargetError('VERCEL_DEPLOY_COMMIT must match the exact reviewed HEAD revision.');
  }
  for (const key of ['VERCEL_PROJECT_ID', 'VERCEL_ORG_ID', 'VERCEL_TOKEN']) {
    if (!env[key]?.trim()) throw new DeploymentTargetError(`Missing deployment configuration: ${key}.`);
  }
  if (link.projectId !== env.VERCEL_PROJECT_ID || link.orgId !== env.VERCEL_ORG_ID) {
    throw new DeploymentTargetError('The linked Vercel project/team does not match the explicit deployment target.');
  }
  if (mode !== 'production') return;
  if (branch !== 'main') throw new DeploymentTargetError('Production deployment requires the reviewed main branch.');
  const required = ['APP_URL', 'NEXT_PUBLIC_APP_URL', 'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'DATABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_STORAGE_BUCKET', 'CRON_SECRET', 'DODO_PAYMENTS_API_KEY',
    'DODO_PAYMENTS_WEBHOOK_SECRET', 'DODO_BUSINESS_ID', 'DODO_PRODUCT_ID',
    'MUX_SIGNING_KEY_ID', 'MUX_SIGNING_PRIVATE_KEY', 'PROFESSOR_EMAIL',
    'RESEND_API_KEY', 'RESEND_FROM_EMAIL', 'ADMIN_OWNER_EMAIL'];
  const missing = required.filter(key => !env[key]?.trim());
  if (missing.length) throw new DeploymentTargetError(`Missing production configuration: ${missing.join(', ')}.`);
  if ([env.APP_URL, env.NEXT_PUBLIC_APP_URL].some(value => value !== 'https://www.culturadeljazz.com')) {
    throw new DeploymentTargetError('Production app origins must match the canonical Cultura del Jazz website.');
  }
  if (env.DODO_ENVIRONMENT !== 'live_mode' || (env.DODO_API_BASE_URL && env.DODO_API_BASE_URL !== 'https://live.dodopayments.com')) {
    throw new DeploymentTargetError('Production requires the reviewed live Dodo environment and API origin.');
  }
  if (env.ENABLE_LOCAL_TEST_CHECKOUT && env.ENABLE_LOCAL_TEST_CHECKOUT !== '0') {
    throw new DeploymentTargetError('Local synthetic checkout must be disabled in production configuration.');
  }
  if (Boolean(env.RESEND_WEBHOOK_SECRET?.trim()) !== Boolean(env.MESSAGES_REPLY_TO_EMAIL?.trim())) {
    throw new DeploymentTargetError('Native receiving needs both RESEND_WEBHOOK_SECRET and MESSAGES_REPLY_TO_EMAIL; otherwise leave both unset.');
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const git = (...args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    let link;
    try { link = JSON.parse(readFileSync('.vercel/project.json', 'utf8')); }
    catch { throw new DeploymentTargetError('Link the intended Vercel project locally before running the deployment script.'); }
    if (!link || typeof link !== 'object' || Array.isArray(link)) throw new DeploymentTargetError('Invalid local Vercel project link.');
    validateDeploymentTarget({
      mode: process.argv[2] || '', branch: git('rev-parse', '--abbrev-ref', 'HEAD'),
      head: git('rev-parse', 'HEAD'), dirty: Boolean(git('status', '--porcelain', '--untracked-files=all')),
      env: process.env, link,
    });
    console.info('Explicit deployment target, project/team and reviewed commit match.');
  } catch (error) {
    // Only our controlled validation errors are printable; never emit file data,
    // child-process output, provider credentials or a raw command failure.
    const message = error instanceof DeploymentTargetError
      ? error.message : 'Unable to verify the deployment target.';
    console.error(message);
    process.exitCode = 1;
  }
}
