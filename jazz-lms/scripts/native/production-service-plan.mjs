import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { RECOVERY_PROJECT_REF } from './config-policy.mjs';

export const PRODUCTION_ORIGIN = 'https://www.culturadeljazz.com';
const HOSTS = ['www.culturadeljazz.com', 'culturadeljazz.com'];
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;

export class ProductionPreparationError extends Error {
  constructor(code) { super(code); this.name = 'ProductionPreparationError'; }
}
export function requireProductionCondition(condition, code) {
  if (!condition) throw new ProductionPreparationError(code);
}
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const exact = (value, names) => record(value) && Object.keys(value).length === names.length && names.every(name => Object.hasOwn(value, name));
// Reject systemd expansion, quoting and control characters instead of trying to
// quote arbitrary command strings. No shell, credential value or URL is a path.
const safePath = path => typeof path === 'string' && /^\/[A-Za-z0-9_./-]+$/.test(path) &&
  isAbsolute(path) && resolve(path) === path;
export const outsideProductionPath = (root, path) => {
  const local = relative(root, path);
  return local === '..' || local.startsWith('../') || isAbsolute(local);
};

/** Pure preparation policy. This neither authenticates a provider nor approves
 * activation, and intentionally admits only the recovered candidate target.
 */
export function validateProductionServicePlan(value) {
  const fields = ['version', 'sourceCommit', 'projectRef', 'origin', 'configFile', 'appRoot',
    'manifestFile', 'runDirectory', 'nodeExecutable', 'cloudflaredExecutable', 'cloudflaredSha256', 'tunnel'];
  requireProductionCondition(exact(value, fields) && value.version === 1, 'PRODUCTION_PLAN_SHAPE');
  requireProductionCondition(typeof value.sourceCommit === 'string' && /^[a-f0-9]{40}$/.test(value.sourceCommit), 'PRODUCTION_PLAN_SOURCE');
  requireProductionCondition(value.projectRef === RECOVERY_PROJECT_REF && value.origin === PRODUCTION_ORIGIN, 'PRODUCTION_PLAN_TARGET');
  for (const key of ['configFile', 'appRoot', 'manifestFile', 'runDirectory', 'nodeExecutable', 'cloudflaredExecutable']) {
    requireProductionCondition(safePath(value[key]), 'PRODUCTION_PLAN_PATH');
  }
  requireProductionCondition(typeof value.cloudflaredSha256 === 'string' && /^[a-f0-9]{64}$/.test(value.cloudflaredSha256), 'PRODUCTION_TUNNEL_BINARY');
  requireProductionCondition(Buffer.byteLength(join(value.runDirectory, 'edge.sock')) <= 100 &&
    Buffer.byteLength(join(`${value.runDirectory}-tunnel`, 'config.json')) <= 240, 'PRODUCTION_RUN_PATH');
  requireProductionCondition(exact(value.tunnel, ['id', 'credentialsFile']) && UUID.test(value.tunnel.id) &&
    safePath(value.tunnel.credentialsFile), 'PRODUCTION_TUNNEL_SHAPE');
  const privatePaths = [value.configFile, value.manifestFile, value.runDirectory, value.tunnel.credentialsFile];
  requireProductionCondition(privatePaths.every(path => outsideProductionPath(value.appRoot, path)) &&
    new Set([value.configFile, value.manifestFile, value.tunnel.credentialsFile]).size === 3, 'PRODUCTION_INPUT_IN_RELEASE');
  return { ...value, tunnel: { ...value.tunnel } };
}

/** The named-tunnel config has exactly two public hostnames and a catchall deny.
 * This is configuration validation, not Cloudflare account/DNS or terms proof.
 */
export function validateProductionTunnel(value, input) {
  const plan = validateProductionServicePlan(input);
  requireProductionCondition(exact(value, ['tunnel', 'credentials-file', 'ingress']) &&
    value.tunnel === plan.tunnel.id && value['credentials-file'] === plan.tunnel.credentialsFile &&
    Array.isArray(value.ingress) && value.ingress.length === 3, 'PRODUCTION_TUNNEL_ROUTES');
  for (const [index, host] of HOSTS.entries()) {
    const rule = value.ingress[index];
    requireProductionCondition(exact(rule, ['hostname', 'service']) && rule.hostname === host &&
      rule.service === `unix:${join(plan.runDirectory, 'edge.sock')}`, 'PRODUCTION_TUNNEL_ROUTES');
  }
  requireProductionCondition(exact(value.ingress[2], ['service']) && value.ingress[2].service === 'http_status:404', 'PRODUCTION_TUNNEL_ROUTES');
  return value;
}

/** Render review assets only. These contain real explicit runtime commands;
 * installation/startup requires the separately approved production release.
 */
export function renderProductionServiceAssets(input, planFile) {
  const plan = validateProductionServicePlan(input);
  requireProductionCondition(safePath(planFile) && outsideProductionPath(plan.appRoot, planFile), 'PRODUCTION_PLAN_PATH');
  const tunnel = validateProductionTunnel({
    tunnel: plan.tunnel.id, 'credentials-file': plan.tunnel.credentialsFile,
    ingress: [...HOSTS.map(hostname => ({ hostname, service: `unix:${join(plan.runDirectory, 'edge.sock')}` })), { service: 'http_status:404' }],
  }, plan);
  const appEntry = join(plan.appRoot, 'scripts/native/launch-production.mjs');
  const tunnelEntry = join(plan.appRoot, 'scripts/native/launch-production-tunnel.mjs');
  const unit = (description, entry, operation, dependency = '') => `# PROPOSED: install/start only after the owner approves this exact release.\n[Unit]\nDescription=${description}\nStartLimitIntervalSec=60\nStartLimitBurst=3\n${dependency}\n[Service]\nType=simple\nUMask=0077\nWorkingDirectory=${plan.appRoot}\nExecStart=/usr/bin/env -i PATH=/usr/bin:/bin LANG=C ${plan.nodeExecutable} ${entry} ${operation} ${planFile}\nRestart=on-failure\nRestartSec=5\nTimeoutStopSec=15\nKillMode=control-group\nNoNewPrivileges=true\nPrivateTmp=true\nProtectSystem=strict\nProtectHome=read-only\nReadWritePaths=${dirname(plan.runDirectory)} ${join(plan.appRoot, '.next/cache')}\nStandardOutput=journal\nStandardError=journal\nMemoryMax=2G\nCPUQuota=200%\nTasksMax=256\n\n[Install]\nWantedBy=default.target\n`;
  const appDependency = 'Wants=jazz-production-tunnel.service\nBefore=jazz-production-tunnel.service\n';
  return {
    'jazz-production.service.proposed': unit('Cultura del Jazz application and ingress', appEntry, '--run-production', appDependency),
    'jazz-production-maintenance.service.proposed': unit('Cultura del Jazz maintenance 503', appEntry, '--run-maintenance', appDependency),
    'jazz-production-tunnel.service.proposed': unit('Cultura del Jazz named tunnel', tunnelEntry, '--run-tunnel',
      'After=jazz-production.service\nRequires=jazz-production.service\nPartOf=jazz-production.service\n'),
    'cloudflared.json.proposed': `${JSON.stringify(tunnel, null, 2)}\n`,
    'rollback.json': `${JSON.stringify({ version: 1, status: 'PREPARATION_ONLY', sourceCommit: plan.sourceCommit,
      projectRef: plan.projectRef, origin: plan.origin, automaticActivation: false, databaseRollback: false,
      appFailure: 'Select an independently inspected secure compatible release or serve the standalone maintenance 503.',
      hostFailure: 'Restore reviewed web DNS records to the still-protected paused Vercel destination; this is a 503 outage, not a healthy application.',
      preserve: 'Keep customer rows, sessions, canonical payment facts and webhook ledgers. Never run an unsafe grant inverse or rewind the database.',
    }, null, 2)}\n`,
  };
}
