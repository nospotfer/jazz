import Stripe from 'stripe';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const API_VERSION = '2024-06-20';
const REQUIRED_ENV = [
  'STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_WEBHOOK_SECRET',
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

function parseEnvLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;

  const eqIndex = trimmed.indexOf('=');
  if (eqIndex <= 0) return null;

  const key = trimmed.slice(0, eqIndex).trim();
  let value = trimmed.slice(eqIndex + 1).trim();

  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) return null;

  const isQuoted =
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"));

  if (isQuoted) {
    value = value.slice(1, -1);
    value = value
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'");
  } else {
    const commentIndex = value.indexOf(' #');
    if (commentIndex >= 0) value = value.slice(0, commentIndex).trim();
  }

  return { key, value };
}

async function loadEnvFiles() {
  const envFiles = [resolve(projectRoot, '.env.local'), resolve(projectRoot, '.env')];

  for (const filePath of envFiles) {
    if (!existsSync(filePath)) continue;
    const content = await readFile(filePath, 'utf8');

    for (const rawLine of content.split(/\r?\n/)) {
      const parsed = parseEnvLine(rawLine);
      if (!parsed) continue;
      if (process.env[parsed.key] === undefined) {
        process.env[parsed.key] = parsed.value;
      }
    }
  }
}

function assertEnv() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }

  const secretKey = process.env.STRIPE_SECRET_KEY.trim();
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.trim();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET.trim();

  if (!secretKey.startsWith('sk_test_')) {
    if (secretKey.startsWith('sk_live_')) {
      throw new Error('Refusing to run with live Stripe secret key (sk_live_...). Use sandbox key sk_test_...');
    }
    throw new Error('Invalid STRIPE_SECRET_KEY format. Expected sk_test_...');
  }

  if (!publishableKey.startsWith('pk_test_')) {
    if (publishableKey.startsWith('pk_live_')) {
      throw new Error('Refusing to run with live publishable key (pk_live_...). Use pk_test_...');
    }
    throw new Error('Invalid NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY format. Expected pk_test_...');
  }

  if (!webhookSecret.startsWith('whsec_')) {
    throw new Error('Invalid STRIPE_WEBHOOK_SECRET format. Expected whsec_...');
  }

  return { secretKey, publishableKey, webhookSecret };
}

async function main() {
  await loadEnvFiles();
  const { secretKey, publishableKey, webhookSecret } = assertEnv();

  const stripe = new Stripe(secretKey, { apiVersion: API_VERSION });
  const account = await stripe.accounts.retrieve();

  if (!account?.id) {
    throw new Error('Stripe auth check failed: account id missing.');
  }

  if (account.livemode) {
    throw new Error(`Stripe key authenticated to LIVE mode account (${account.id}). Use test keys only.`);
  }

  console.log('STRIPE_SANDBOX_CHECK_OK');
  console.log(`Account ID: ${account.id}`);
  console.log(`Mode: ${account.livemode ? 'live' : 'test'}`);
  console.log(`API version: ${API_VERSION}`);
  console.log(`Publishable key prefix: ${publishableKey.slice(0, 8)}...`);
  console.log(`Webhook secret prefix: ${webhookSecret.slice(0, 7)}...`);
}

main().catch((error) => {
  console.error('STRIPE_SANDBOX_CHECK_FAILED');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
