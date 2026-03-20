type PaymentsE2EConfig = {
  enabled: boolean;
  storageStatePath: string;
  courseId: string;
  expectedCheckoutHost: string;
  voucherCodes: string[];
  methods: Array<'card' | 'paypal'>;
};

function parseCsv(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function parseMethods(value: string | undefined): Array<'card' | 'paypal'> {
  const normalized = parseCsv(value)
    .map((method) => method.toLowerCase())
    .filter((method): method is 'card' | 'paypal' => method === 'card' || method === 'paypal');

  if (normalized.length === 0) {
    return ['card', 'paypal'];
  }

  return Array.from(new Set(normalized));
}

export function getPaymentsE2EConfig(): PaymentsE2EConfig {
  return {
    enabled: process.env.PAYMENTS_E2E_REAL_ENABLED === '1',
    storageStatePath: process.env.PAYMENTS_E2E_STORAGE_STATE || '',
    courseId: process.env.PAYMENTS_E2E_COURSE_ID || '',
    expectedCheckoutHost: process.env.PAYMENTS_E2E_EXPECT_HOST || 'lemonsqueezy.com',
    voucherCodes: parseCsv(process.env.PAYMENTS_E2E_VOUCHER_CODES).map((code) => code.toUpperCase()),
    methods: parseMethods(process.env.PAYMENTS_E2E_METHODS),
  };
}

export function getMissingPaymentsE2ERequirements(config: PaymentsE2EConfig): string[] {
  const missing: string[] = [];

  if (!config.storageStatePath) {
    missing.push('PAYMENTS_E2E_STORAGE_STATE');
  }

  if (!config.courseId) {
    missing.push('PAYMENTS_E2E_COURSE_ID');
  }

  return missing;
}
