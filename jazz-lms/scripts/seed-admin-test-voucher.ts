/**
 * Seeds (or updates) the internal admin test voucher:
 *   - code:              ADMIN99TEST (11 chars, satisfies 10-12 range)
 *   - type:              DISCOUNT_PERCENT
 *   - discountPercent:   99.98  (forces total near-zero for smoke-testing checkout)
 *   - maxUses:           null (unlimited)
 *   - maxUsesPerUser:    1
 *   - isActive:          true
 *   - expiresAt:         null (never expires)
 *
 * Safe to run multiple times — upserts by unique `code`.
 *
 * Usage:
 *   npx tsx scripts/seed-admin-test-voucher.ts
 */
import { PrismaClient } from '@prisma/client';

const INTERNAL_TEST_CODE = 'ADMIN99TEST';
const INTERNAL_TEST_DISCOUNT_PERCENT = 99.98;

const prisma = new PrismaClient();

async function main() {
  console.log(`Seeding internal admin test voucher: ${INTERNAL_TEST_CODE}`);

  const voucher = await prisma.voucherCode.upsert({
    where: { code: INTERNAL_TEST_CODE },
    create: {
      code: INTERNAL_TEST_CODE,
      type: 'DISCOUNT_PERCENT',
      discountPercent: INTERNAL_TEST_DISCOUNT_PERCENT,
      maxUses: null,
      maxUsesPerUser: 1,
      isActive: true,
      expiresAt: null,
      metadata: {
        internal: true,
        purpose: 'admin_smoke_test',
        voucherCodeFormat: 'INTERNAL_ADMIN_TEST',
      },
    },
    update: {
      type: 'DISCOUNT_PERCENT',
      discountPercent: INTERNAL_TEST_DISCOUNT_PERCENT,
      maxUses: null,
      maxUsesPerUser: 1,
      isActive: true,
      expiresAt: null,
      metadata: {
        internal: true,
        purpose: 'admin_smoke_test',
        voucherCodeFormat: 'INTERNAL_ADMIN_TEST',
      },
    },
  });

  console.log('Voucher ready:', {
    id: voucher.id,
    code: voucher.code,
    discountPercent: voucher.discountPercent,
    isActive: voucher.isActive,
  });
}

main()
  .catch((error) => {
    console.error('Failed to seed admin test voucher:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
