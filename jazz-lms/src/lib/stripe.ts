import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();
const nodeEnv = process.env.NODE_ENV;
const vercelEnv = process.env.VERCEL_ENV;

const isTestKey = Boolean(stripeSecretKey?.startsWith('sk_test_'));
const isLiveKey = Boolean(stripeSecretKey?.startsWith('sk_live_'));
const hasValidStripeKey = Boolean(stripeSecretKey) && (isTestKey || isLiveKey);

if (!hasValidStripeKey) {
  console.warn('[stripe] Stripe disabled: missing or invalid STRIPE_SECRET_KEY. Payment routes will return unavailable.');
}

if (nodeEnv === 'development' && isLiveKey) {
  console.warn('[stripe] Development is using a live Stripe key. Consider switching to sk_test_ for local sandbox tests.');
}

if (vercelEnv === 'production' && isTestKey) {
  console.warn('[stripe] Production is using a test Stripe key. Live payments are disabled until sk_live_ is configured.');
}

export const stripe = hasValidStripeKey
  ? new Stripe(stripeSecretKey as string, {
      apiVersion: '2024-06-20',
      typescript: true,
    })
  : null;
