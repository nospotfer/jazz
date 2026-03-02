import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const API_VERSION = '2024-06-20';
const DEFAULT_WEBHOOK_URL = 'http://localhost:3001/api/webhooks/stripe';
const REQUIRED_ENV = ['DATABASE_URL', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'];

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

function parseArgs(argv) {
  const options = {
    webhookUrl: DEFAULT_WEBHOOK_URL,
    cleanup: false,
  };

  for (const arg of argv) {
    if (arg === '--cleanup') {
      options.cleanup = true;
      continue;
    }

    if (arg.startsWith('--webhook-url=')) {
      options.webhookUrl = arg.slice('--webhook-url='.length).trim();
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      console.log('Usage: node scripts/stripe-sandbox-webhook.mjs [options]');
      console.log('');
      console.log('Options:');
      console.log(`  --webhook-url=<url>   Webhook endpoint (default: ${DEFAULT_WEBHOOK_URL})`);
      console.log('  --cleanup             Delete tested purchase after verification');
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

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

  if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
    throw new Error('This script requires STRIPE_SECRET_KEY in test mode (sk_test_...)');
  }
}

async function main() {
  const { webhookUrl, cleanup } = parseArgs(process.argv.slice(2));
  await loadEnvFiles();
  assertEnv();

  const prisma = new PrismaClient();

  try {
    const course =
      (await prisma.course.findFirst({ where: { isPublished: true } })) ||
      (await prisma.course.findFirst());

    if (!course) {
      throw new Error('No course found in database. Create/seed a course first.');
    }

    const user = await prisma.user.findFirst();
    if (!user) {
      throw new Error('No user found in database. Create/register a user first.');
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: API_VERSION,
    });

    const event = {
      id: `evt_test_${Date.now()}`,
      object: 'event',
      api_version: API_VERSION,
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: `cs_test_${Date.now()}`,
          object: 'checkout.session',
          metadata: {
            purchaseType: 'course',
            userId: user.id,
            courseId: course.id,
          },
        },
      },
      livemode: false,
      pending_webhooks: 1,
      request: { id: null, idempotency_key: null },
      type: 'checkout.session.completed',
    };

    const payload = JSON.stringify(event);
    const sig = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: process.env.STRIPE_WEBHOOK_SECRET,
    });

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': sig,
      },
      body: payload,
    });

    const text = await res.text();

    const purchase = await prisma.purchase.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: course.id,
        },
      },
    });

    if (cleanup && purchase) {
      await prisma.purchase.delete({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId: course.id,
          },
        },
      });
    }

    const result = {
      webhookUrl,
      status: res.status,
      response: text || null,
      userId: user.id,
      courseId: course.id,
      purchaseCreated: Boolean(purchase),
      purchaseId: purchase?.id || null,
      cleanedUp: cleanup && Boolean(purchase),
    };

    console.log(JSON.stringify(result, null, 2));

    if (!res.ok) {
      throw new Error(`Webhook request failed with status ${res.status}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('STRIPE_SANDBOX_WEBHOOK_FAILED');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
