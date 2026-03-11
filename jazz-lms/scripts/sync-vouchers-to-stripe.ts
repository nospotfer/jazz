import { PrismaClient } from '@prisma/client';
import { mergeStripeVoucherMetadata, syncVoucherPromotionCode } from '../src/lib/stripe-voucher-sync';

const prisma = new PrismaClient();

type ScriptOptions = {
  dryRun: boolean;
  limit: number | null;
  codePrefix: string | null;
  deactivatePrefix: string | null;
  deactivateCodes: Set<string>;
};

function getArgValue(prefix: string) {
  const match = process.argv.find((item) => item.startsWith(`${prefix}=`));
  if (!match) {
    return null;
  }

  return match.slice(prefix.length + 1).trim();
}

function parseOptions(): ScriptOptions {
  const dryRun = process.argv.includes('--dry-run');
  const rawLimit = getArgValue('--limit');
  const parsedLimit = rawLimit ? Number(rawLimit) : null;
  const limit = parsedLimit && Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.floor(parsedLimit) : null;

  const codePrefixRaw = getArgValue('--code-prefix');
  const codePrefix = codePrefixRaw ? codePrefixRaw.trim().toUpperCase() : null;

  const deactivatePrefixRaw = getArgValue('--deactivate-prefix');
  const deactivatePrefix = deactivatePrefixRaw ? deactivatePrefixRaw.trim().toUpperCase() : null;

  const deactivateCodesRaw = getArgValue('--deactivate-codes');
  const deactivateCodes = new Set(
    (deactivateCodesRaw || '')
      .split(',')
      .map((value) => value.trim().toUpperCase())
      .filter((value) => value.length > 0)
  );

  return {
    dryRun,
    limit,
    codePrefix,
    deactivatePrefix,
    deactivateCodes,
  };
}

function shouldDeactivate(code: string, options: ScriptOptions) {
  const normalizedCode = code.trim().toUpperCase();

  if (options.deactivateCodes.has(normalizedCode)) {
    return true;
  }

  if (options.deactivatePrefix && normalizedCode.startsWith(options.deactivatePrefix)) {
    return true;
  }

  return false;
}

async function main() {
  const options = parseOptions();

  const where = options.codePrefix
    ? {
        code: {
          startsWith: options.codePrefix,
        },
      }
    : undefined;

  const vouchers = await prisma.voucherCode.findMany({
    where,
    orderBy: {
      createdAt: 'asc',
    },
    take: options.limit ?? undefined,
    select: {
      id: true,
      code: true,
      type: true,
      discountPercent: true,
      discountAmount: true,
      minOrderValue: true,
      maxUses: true,
      isActive: true,
      expiresAt: true,
      metadata: true,
    },
  });

  if (!vouchers.length) {
    console.log('No vouchers found for provided filters.');
    return;
  }

  let syncedCount = 0;
  let deactivatedCount = 0;
  const failedCodes: string[] = [];

  console.log(`Found ${vouchers.length} voucher(s). Dry run: ${options.dryRun ? 'yes' : 'no'}`);

  for (const voucher of vouchers) {
    const targetActive = shouldDeactivate(voucher.code, options) ? false : voucher.isActive;

    if (options.dryRun) {
      console.log(`[DRY-RUN] ${voucher.code} -> active=${targetActive}`);
      continue;
    }

    try {
      const stripeMetadata = await syncVoucherPromotionCode(
        {
          ...voucher,
          isActive: targetActive,
        },
        {
          desiredActive: targetActive,
          createIfMissing: true,
        }
      );

      if (!stripeMetadata) {
        throw new Error('Stripe sync returned empty metadata.');
      }

      await prisma.voucherCode.update({
        where: {
          id: voucher.id,
        },
        data: {
          isActive: targetActive,
          metadata: mergeStripeVoucherMetadata(voucher.metadata, stripeMetadata),
        },
      });

      syncedCount += 1;
      if (!targetActive) {
        deactivatedCount += 1;
      }
      console.log(`Synced ${voucher.code} (active=${targetActive})`);
    } catch (error) {
      failedCodes.push(voucher.code);
      console.error(`Failed ${voucher.code}:`, error instanceof Error ? error.message : error);
    }
  }

  if (options.dryRun) {
    console.log('Dry run completed.');
    return;
  }

  console.log(`Synced vouchers: ${syncedCount}`);
  console.log(`Deactivated vouchers: ${deactivatedCount}`);

  if (failedCodes.length > 0) {
    console.error(`Failed vouchers (${failedCodes.length}): ${failedCodes.join(', ')}`);
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error('VOUCHER_STRIPE_SYNC_FAILED');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
