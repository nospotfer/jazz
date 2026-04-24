import { PrismaClient, VoucherType } from '@prisma/client';

const prisma = new PrismaClient();

const KEEP_CODES = ['ADMIN99TEST', 'LOU1000099'] as const;

async function main() {
  if (process.env.CONFIRM !== 'CLEAN-VOUCHERS') {
    console.error('Refusing to run. Set CONFIRM=CLEAN-VOUCHERS to proceed.');
    process.exitCode = 1;
    return;
  }

  console.log('Vouchers currently in DB:');
  const before = await prisma.voucherCode.findMany({
    select: { code: true, type: true, discountPercent: true, isActive: true },
    orderBy: { code: 'asc' },
  });
  console.table(before);

  await prisma.$transaction(async (tx) => {
    // Limpar redemptions/discounts de vouchers que serao apagados.
    const victims = await tx.voucherCode.findMany({
      where: { code: { notIn: [...KEEP_CODES] } },
      select: { id: true },
    });
    const victimIds = victims.map((v) => v.id);

    if (victimIds.length > 0) {
      const redemptions = await tx.voucherRedemption.deleteMany({
        where: { voucherId: { in: victimIds } },
      });
      const discounts = await tx.discountApplied.deleteMany({
        where: { voucherId: { in: victimIds } },
      });
      console.log(`  - deleted ${redemptions.count} redemptions`);
      console.log(`  - deleted ${discounts.count} discount applieds`);
    }

    const deleted = await tx.voucherCode.deleteMany({
      where: { code: { notIn: [...KEEP_CODES] } },
    });
    console.log(`  - deleted ${deleted.count} vouchers (all non-official)`);

    // Upsert ADMIN99TEST (99.98%, DISCOUNT_PERCENT)
    await tx.voucherCode.upsert({
      where: { code: 'ADMIN99TEST' },
      update: {
        type: VoucherType.DISCOUNT_PERCENT,
        discountPercent: 99.98,
        discountAmount: 0,
        maxUses: null,
        maxUsesPerUser: 10,
        isActive: true,
        currentUses: 0,
      },
      create: {
        code: 'ADMIN99TEST',
        type: VoucherType.DISCOUNT_PERCENT,
        discountPercent: 99.98,
        discountAmount: 0,
        maxUses: null,
        maxUsesPerUser: 10,
        isActive: true,
        currentUses: 0,
      },
    });
    console.log('  - upserted ADMIN99TEST (99.98%)');

    // Upsert LOU1000099 (100%, FREE_ACCESS)
    await tx.voucherCode.upsert({
      where: { code: 'LOU1000099' },
      update: {
        type: VoucherType.FREE_ACCESS,
        discountPercent: 100,
        discountAmount: 0,
        maxUses: null,
        maxUsesPerUser: 10,
        isActive: true,
        currentUses: 0,
      },
      create: {
        code: 'LOU1000099',
        type: VoucherType.FREE_ACCESS,
        discountPercent: 100,
        discountAmount: 0,
        maxUses: null,
        maxUsesPerUser: 10,
        isActive: true,
        currentUses: 0,
      },
    });
    console.log('  - upserted LOU1000099 (100%)');
  });

  console.log('\nVouchers after cleanup:');
  const after = await prisma.voucherCode.findMany({
    select: { code: true, type: true, discountPercent: true, isActive: true },
    orderBy: { code: 'asc' },
  });
  console.table(after);
}

main()
  .catch((error) => {
    console.error('Cleanup failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
