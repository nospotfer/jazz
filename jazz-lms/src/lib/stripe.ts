import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const nodeEnv = process.env.NODE_ENV;
const vercelEnv = process.env.VERCEL_ENV;

if (!stripeSecretKey) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

const isTestKey = stripeSecretKey.startsWith('sk_test_');
const isLiveKey = stripeSecretKey.startsWith('sk_live_');

if (!isTestKey && !isLiveKey) {
  throw new Error('Invalid STRIPE_SECRET_KEY format. Expected sk_test_... or sk_live_...');
}

if (nodeEnv === 'development' && isLiveKey) {
  throw new Error('Unsafe Stripe configuration: local development must use a test key (sk_test_...).');
}

if (vercelEnv === 'production' && isTestKey) {
  console.warn(
    'Unsafe Stripe configuration: production deployment is using a test key (sk_test_...).'
  );
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-06-20',
  typescript: true,
});
