import { afterEach, describe, expect, test } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateDeploymentTarget } from '../../scripts/check-deploy-target.mjs';

const head = 'a'.repeat(40);
const link = { projectId: 'prj_fixture', orgId: 'team_fixture' };
const base = () => ({ mode: 'preview', branch: 'maintenance/initial-audit', head, dirty: false, link,
  env: { VERCEL_DEPLOY_COMMIT: head, VERCEL_PROJECT_ID: link.projectId,
    VERCEL_ORG_ID: link.orgId, VERCEL_TOKEN: 'synthetic-private-marker' } as Record<string, string | undefined> });
const production = () => {
  const input = { ...base(), mode: 'production', branch: 'main' };
  for (const name of ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'DATABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_STORAGE_BUCKET', 'CRON_SECRET', 'DODO_PAYMENTS_API_KEY',
    'DODO_PAYMENTS_WEBHOOK_SECRET', 'DODO_BUSINESS_ID', 'DODO_PRODUCT_ID', 'MUX_SIGNING_KEY_ID',
    'MUX_SIGNING_PRIVATE_KEY', 'PROFESSOR_EMAIL', 'RESEND_API_KEY', 'RESEND_FROM_EMAIL', 'ADMIN_OWNER_EMAIL']) {
    input.env[name] = 'synthetic-configured-value';
  }
  Object.assign(input.env, { APP_URL: 'https://www.culturadeljazz.com',
    NEXT_PUBLIC_APP_URL: 'https://www.culturadeljazz.com', DODO_ENVIRONMENT: 'live_mode' });
  return input;
};

describe('explicit Vercel deployment scope', () => {
  test('allows the reviewed maintenance preview without an obsolete branch or alias', () => {
    expect(() => validateDeploymentTarget(base())).not.toThrow();
  });
  test('allows reviewed production without requiring the optional legacy relay', () => {
    expect(() => validateDeploymentTarget(production())).not.toThrow();
  });
  test.each(['VERCEL_TOKEN', 'VERCEL_PROJECT_ID', 'VERCEL_ORG_ID'])('requires explicit %s', name => {
    const input = base(); delete input.env[name];
    expect(() => validateDeploymentTarget(input)).toThrow(name);
  });
  test.each([{ projectId: 'prj_other', orgId: link.orgId }, { projectId: link.projectId, orgId: 'team_other' }])
  ('rejects a linked project or team different from the intended target', otherLink => {
    expect(() => validateDeploymentTarget({ ...base(), link: otherLink })).toThrow('does not match');
  });
  test('rejects dirty source and an unexpected commit before deployment', () => {
    expect(() => validateDeploymentTarget({ ...base(), dirty: true })).toThrow('tracked and untracked');
    const input = base(); input.env.VERCEL_DEPLOY_COMMIT = 'b'.repeat(40);
    expect(() => validateDeploymentTarget(input)).toThrow('HEAD revision');
  });
  test('rejects production from a preview branch', () => {
    expect(() => validateDeploymentTarget({ ...production(), branch: 'maintenance/initial-audit' })).toThrow('main branch');
  });
  test('requires the actual cron and both canonical origins in production', () => {
    const input = production(); delete input.env.CRON_SECRET;
    expect(() => validateDeploymentTarget(input)).toThrow('CRON_SECRET');
    input.env.CRON_SECRET = 'synthetic-value'; input.env.APP_URL = 'http://localhost:3000';
    expect(() => validateDeploymentTarget(input)).toThrow('canonical');
  });
  test.each([{ DODO_ENVIRONMENT: 'test_mode' }, { DODO_API_BASE_URL: 'https://test.dodopayments.com' },
    { ENABLE_LOCAL_TEST_CHECKOUT: '1' }])('rejects test payment settings in production: %j', changes => {
    const input = production(); Object.assign(input.env, changes);
    expect(() => validateDeploymentTarget(input)).toThrow(/Dodo|synthetic/);
  });
  test('requires native receiving settings together, while allowing deliberately disabled receiving', () => {
    const input = production(); input.env.RESEND_WEBHOOK_SECRET = 'synthetic-signing-value';
    expect(() => validateDeploymentTarget(input)).toThrow('both');
    input.env.MESSAGES_REPLY_TO_EMAIL = 'receiving@example.invalid';
    expect(() => validateDeploymentTarget(input)).not.toThrow();
  });
});

const directories: string[] = [];
afterEach(() => { for (const path of directories.splice(0)) rmSync(path, { recursive: true, force: true }); });

function wrapperFixture(mode: 'preview' | 'production') {
  const directory = mkdtempSync(join(tmpdir(), 'jazz-deployment-check-')); directories.push(directory);
  const repo = join(directory, 'repo'); const app = join(repo, 'jazz-lms'); const bin = join(directory, 'bin');
  mkdirSync(join(app, 'scripts'), { recursive: true }); mkdirSync(bin);
  const wrapper = mode === 'production' ? 'deploy-production.sh' : 'deploy-preview.sh';
  for (const file of [wrapper, 'check-deploy-target.mjs']) copyFileSync(`scripts/${file}`, join(app, 'scripts', file));
  writeFileSync(join(app, '.gitignore'), '.vercel/\n');
  const git = (...args: string[]) => execFileSync('git', args, { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  git('init', '--initial-branch=main'); git('add', '.');
  git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false',
    '-c', 'core.hooksPath=/dev/null', 'commit', '-m', 'fixture source');
  mkdirSync(join(app, '.vercel')); writeFileSync(join(app, '.vercel/project.json'), JSON.stringify(link));
  const marker = join(directory, 'vercel-arguments');
  writeFileSync(join(bin, 'vercel'), `#!/bin/sh\nprintf '%s\\n' "$*" > '${marker}'\n`, { mode: 0o700 });
  writeFileSync(join(bin, 'npm'), '#!/bin/sh\nexit 0\n', { mode: 0o700 });
  const input = mode === 'production' ? production() : base();
  input.env.VERCEL_DEPLOY_COMMIT = git('rev-parse', 'HEAD');
  return { app, bin, directory, marker, wrapper, env: { ...process.env, ...input.env, PATH: `${bin}:${process.env.PATH}` } };
}

describe('deployment wrappers with mocked npm/Vercel executables', () => {
  test.each(['preview', 'production'] as const)('%s stops on untracked source before any Vercel call', mode => {
    const fixture = wrapperFixture(mode);
    writeFileSync(join(fixture.app, 'unreviewed-source.ts'), 'export const unreviewed = true;');
    const result = spawnSync('bash', [`scripts/${fixture.wrapper}`], { cwd: fixture.app, env: fixture.env, encoding: 'utf8' });
    expect(result.status).toBe(1); expect(existsSync(fixture.marker)).toBe(false);
    expect(result.stderr).not.toContain('synthetic-private-marker');
  });
  test.each(['preview', 'production'] as const)('%s calls only its intended mocked deployment mode', mode => {
    const fixture = wrapperFixture(mode);
    const result = spawnSync('bash', [`scripts/${fixture.wrapper}`], { cwd: fixture.app, env: fixture.env, encoding: 'utf8' });
    expect(result.status).toBe(0);
    expect(readFileSync(fixture.marker, 'utf8').trim()).toBe(mode === 'production' ? '--prod --yes --non-interactive' : '--yes --non-interactive');
  });
  test('rejects source generated during preflight before upload', () => {
    const fixture = wrapperFixture('preview');
    writeFileSync(join(fixture.bin, 'npm'), `#!/bin/sh\nprintf 'new source' > '${join(fixture.app, 'generated-source.ts')}'\n`, { mode: 0o700 });
    const result = spawnSync('bash', [`scripts/${fixture.wrapper}`], { cwd: fixture.app, env: fixture.env, encoding: 'utf8' });
    expect(result.status).toBe(1); expect(existsSync(fixture.marker)).toBe(false);
  });
});
