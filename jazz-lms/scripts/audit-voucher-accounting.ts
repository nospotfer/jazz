import { PrismaClient } from '@prisma/client';

type AuditArgs = {
  userId?: string;
  courseId?: string;
  codes: string[];
  json: boolean;
};

const prisma = new PrismaClient();

function parseArgs(argv: string[]): AuditArgs {
  const args: AuditArgs = {
    codes: [],
    json: false,
  };

  for (const rawArg of argv) {
    if (rawArg === '--json') {
      args.json = true;
      continue;
    }

    if (rawArg.startsWith('--user-id=')) {
      args.userId = rawArg.slice('--user-id='.length).trim();
      continue;
    }

    if (rawArg.startsWith('--course-id=')) {
      args.courseId = rawArg.slice('--course-id='.length).trim();
      continue;
    }

    if (rawArg.startsWith('--codes=')) {
      const value = rawArg.slice('--codes='.length).trim();
      args.codes = value
        .split(',')
        .map((code) => code.trim())
        .filter((code) => code.length > 0);
      continue;
    }

    throw new Error(`Unknown argument: ${rawArg}`);
  }

  return args;
}

function printOutput(payload: unknown, asJson: boolean) {
  if (asJson) {
    console.log(JSON.stringify(payload));
    return;
  }

  console.log(JSON.stringify(payload, null, 2));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const [users, purchases, voucherCodes, voucherRedemptions, discountApplied] = await prisma.$transaction([
    prisma.user.count(),
    prisma.purchase.count(),
    prisma.voucherCode.count(),
    prisma.voucherRedemption.count(),
    prisma.discountApplied.count(),
  ]);

  const allVouchers = await prisma.voucherCode.findMany({
    select: {
      id: true,
      code: true,
      currentUses: true,
      maxUses: true,
      isActive: true,
      courseId: true,
      updatedAt: true,
    },
    orderBy: {
      code: 'asc',
    },
  });

  const redemptionCounts = await prisma.voucherRedemption.groupBy({
    by: ['voucherId'],
    _count: {
      _all: true,
    },
  });

  const redemptionCountByVoucherId = new Map(redemptionCounts.map((row) => [row.voucherId, row._count._all]));

  const drift = allVouchers
    .map((voucher) => {
      const liveRedemptions = redemptionCountByVoucherId.get(voucher.id) ?? 0;
      return {
        id: voucher.id,
        code: voucher.code,
        currentUses: voucher.currentUses,
        redemptionCount: liveRedemptions,
        maxUses: voucher.maxUses,
        isActive: voucher.isActive,
        courseId: voucher.courseId,
        updatedAt: voucher.updatedAt,
      };
    })
    .filter((item) => item.currentUses !== item.redemptionCount);

  let perUserPurchaseSummary: unknown = null;
  if (args.userId) {
    const purchasesForUser = await prisma.purchase.findMany({
      where: {
        userId: args.userId,
        ...(args.courseId ? { courseId: args.courseId } : {}),
      },
      include: {
        voucher: {
          select: {
            id: true,
            code: true,
          },
        },
        discount: {
          include: {
            voucher: {
              select: {
                id: true,
                code: true,
              },
            },
          },
        },
        redemption: {
          include: {
            voucher: {
              select: {
                id: true,
                code: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    perUserPurchaseSummary = {
      userId: args.userId,
      courseId: args.courseId ?? null,
      purchaseCount: purchasesForUser.length,
      purchases: purchasesForUser.map((purchase) => ({
        purchase,
        discountApplied: purchase.discount,
        voucherRedemption: purchase.redemption,
        mappedVoucherCode:
          purchase.voucher?.code ??
          purchase.discount?.voucher?.code ??
          purchase.redemption?.voucher?.code ??
          null,
      })),
    };
  }

  let selectedCodeStatus: unknown = null;
  if (args.codes.length > 0) {
    const selectedVouchers = await prisma.voucherCode.findMany({
      where: {
        code: {
          in: args.codes,
        },
      },
      select: {
        id: true,
        code: true,
        currentUses: true,
        maxUses: true,
        isActive: true,
        courseId: true,
      },
      orderBy: {
        code: 'asc',
      },
    });

    const selectedVoucherIds = selectedVouchers.map((voucher) => voucher.id);

    const selectedCounts = selectedVoucherIds.length
      ? await prisma.voucherRedemption.groupBy({
          by: ['voucherId'],
          where: {
            voucherId: {
              in: selectedVoucherIds,
            },
          },
          _count: {
            _all: true,
          },
        })
      : [];

    const selectedByUser = selectedVoucherIds.length
      ? await prisma.voucherRedemption.groupBy({
          by: ['voucherId', 'userId'],
          where: {
            voucherId: {
              in: selectedVoucherIds,
            },
          },
          _count: {
            _all: true,
          },
        })
      : [];

    const selectedCountByVoucherId = new Map(selectedCounts.map((row) => [row.voucherId, row._count._all]));
    const selectedByVoucherUser = new Map<string, Array<{ userId: string; count: number }>>();

    for (const row of selectedByUser) {
      const current = selectedByVoucherUser.get(row.voucherId) ?? [];
      current.push({
        userId: row.userId,
        count: row._count._all,
      });
      selectedByVoucherUser.set(row.voucherId, current);
    }

    const foundCodes = new Set(selectedVouchers.map((voucher) => voucher.code));

    selectedCodeStatus = {
      requestedCodes: args.codes,
      missingCodes: args.codes.filter((code) => !foundCodes.has(code)),
      vouchers: selectedVouchers.map((voucher) => ({
        code: voucher.code,
        currentUses: voucher.currentUses,
        maxUses: voucher.maxUses,
        redemptionCount: selectedCountByVoucherId.get(voucher.id) ?? 0,
        isActive: voucher.isActive,
        courseId: voucher.courseId,
        redemptionsByUser: selectedByVoucherUser.get(voucher.id) ?? [],
      })),
    };
  }

  const result = {
    counts: {
      users,
      purchases,
      voucherCodes,
      voucherRedemptions,
      discountApplied,
    },
    voucherDrift: {
      count: drift.length,
      items: drift,
    },
    perUserPurchaseSummary,
    selectedCodeStatus,
  };

  printOutput(result, args.json);

  process.exit(drift.length > 0 ? 2 : 0);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
