import { PrismaClient } from '@prisma/client';
import { assertLegacyLocalMutationAllowed } from './lib/legacy-local-guard';
import { parseResetUserVoucherArgs } from './lib/reset-user-voucher-args';

assertLegacyLocalMutationAllowed();
const prisma = new PrismaClient();

function uniqueValues(values: string[]) {
  return Array.from(new Set(values));
}

async function main() {
  const args = parseResetUserVoucherArgs(process.argv.slice(2));

  const purchases = await prisma.purchase.findMany({
    where: {
      userId: args.userId,
      courseId: args.courseId,
    },
    select: {
      id: true,
      courseId: true,
      createdAt: true,
      voucherId: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  const purchaseIds = purchases.map((purchase) => purchase.id);
  const courseIds = uniqueValues(purchases.map((purchase) => purchase.courseId));

  const lessons = courseIds.length
    ? await prisma.lesson.findMany({
        where: {
          chapter: {
            courseId: {
              in: courseIds,
            },
          },
        },
        select: {
          id: true,
        },
      })
    : [];

  const lessonIds = lessons.map((lesson) => lesson.id);

  const [
    discountRows,
    redemptionRows,
    lessonPurchaseRows,
    userProgressRows,
  ] = await prisma.$transaction([
    purchaseIds.length
      ? prisma.discountApplied.findMany({
          where: {
            purchaseId: {
              in: purchaseIds,
            },
          },
          select: {
            id: true,
            purchaseId: true,
            voucherId: true,
          },
        })
      : prisma.discountApplied.findMany({ where: { id: { in: [] } }, select: { id: true, purchaseId: true, voucherId: true } }),
    purchaseIds.length
      ? prisma.voucherRedemption.findMany({
          where: {
            purchaseId: {
              in: purchaseIds,
            },
          },
          select: {
            id: true,
            voucherId: true,
            userId: true,
            purchaseId: true,
          },
        })
      : prisma.voucherRedemption.findMany({ where: { id: { in: [] } }, select: { id: true, voucherId: true, userId: true, purchaseId: true } }),
    lessonIds.length
      ? prisma.lessonPurchase.findMany({
          where: {
            userId: args.userId,
            lessonId: {
              in: lessonIds,
            },
          },
          select: {
            id: true,
            lessonId: true,
          },
        })
      : prisma.lessonPurchase.findMany({ where: { id: { in: [] } }, select: { id: true, lessonId: true } }),
    lessonIds.length
      ? prisma.userProgress.findMany({
          where: {
            userId: args.userId,
            lessonId: {
              in: lessonIds,
            },
          },
          select: {
            id: true,
            lessonId: true,
          },
        })
      : prisma.userProgress.findMany({ where: { id: { in: [] } }, select: { id: true, lessonId: true } }),
  ]);

  const redemptionsByVoucher = new Map<string, number>();
  for (const row of redemptionRows) {
    redemptionsByVoucher.set(row.voucherId, (redemptionsByVoucher.get(row.voucherId) ?? 0) + 1);
  }

  const affectedVoucherIds = uniqueValues(redemptionRows.map((row) => row.voucherId));
  const affectedVouchers = affectedVoucherIds.length
    ? await prisma.voucherCode.findMany({
        where: {
          id: {
            in: affectedVoucherIds,
          },
        },
        select: {
          id: true,
          code: true,
          currentUses: true,
        },
      })
    : [];

  const voucherDecrementPlan = affectedVouchers
    .map((voucher) => {
      const decrementBy = redemptionsByVoucher.get(voucher.id) ?? 0;
      return {
        voucherId: voucher.id,
        code: voucher.code,
        currentUsesBefore: voucher.currentUses,
        decrementBy,
        currentUsesAfter: Math.max(0, voucher.currentUses - decrementBy),
      };
    })
    .sort((a, b) => a.code.localeCompare(b.code));

  const selectedCodeVouchers = args.codes.length
    ? await prisma.voucherCode.findMany({
        where: {
          id: { in: affectedVoucherIds },
          code: {
            in: args.codes,
          },
        },
        select: {
          id: true,
          code: true,
          currentUses: true,
        },
        orderBy: {
          code: 'asc',
        },
      })
    : [];

  const codeVoucherIds = selectedCodeVouchers.map((voucher) => voucher.id);

  const liveCodeCountsNow = codeVoucherIds.length
    ? await prisma.voucherRedemption.groupBy({
        by: ['voucherId'],
        where: {
          voucherId: {
            in: codeVoucherIds,
          },
        },
        _count: {
          _all: true,
        },
      })
    : [];

  const liveCodeCountByVoucherId = new Map(liveCodeCountsNow.map((row) => [row.voucherId, row._count._all]));

  const codeSyncPlan = selectedCodeVouchers.map((voucher) => {
    const nowCount = liveCodeCountByVoucherId.get(voucher.id) ?? 0;
    const removedByReset = redemptionsByVoucher.get(voucher.id) ?? 0;
    const targetCountAfterReset = Math.max(0, nowCount - removedByReset);

    return {
      voucherId: voucher.id,
      code: voucher.code,
      currentUsesBefore: voucher.currentUses,
      liveRedemptionsNow: nowCount,
      expectedLiveRedemptionsAfterReset: targetCountAfterReset,
    };
  });

  const missingCodes = args.codes.filter((code) => !selectedCodeVouchers.some((voucher) => voucher.code === code));

  let mutationSummary: {
    deleted: {
      purchases: number;
      discountApplied: number;
      voucherRedemptions: number;
      lessonPurchases: number;
      userProgress: number;
    };
    voucherDecrementsApplied: Array<{
      voucherId: string;
      code: string;
      currentUsesAfter: number;
    }>;
    codeSyncApplied: Array<{
      voucherId: string;
      code: string;
      currentUsesAfter: number;
    }>;
  } | null = null;

  if (!args.dryRun) {
    mutationSummary = await prisma.$transaction(async (tx) => {
      const deletedDiscount = purchaseIds.length
        ? await tx.discountApplied.deleteMany({
            where: {
              purchaseId: {
                in: purchaseIds,
              },
            },
          })
        : { count: 0 };

      const deletedRedemptions = purchaseIds.length
        ? await tx.voucherRedemption.deleteMany({
            where: {
              purchaseId: {
                in: purchaseIds,
              },
            },
          })
        : { count: 0 };

      const deletedLessonPurchases = lessonIds.length
        ? await tx.lessonPurchase.deleteMany({
            where: {
              userId: args.userId,
              lessonId: {
                in: lessonIds,
              },
            },
          })
        : { count: 0 };

      const deletedUserProgress = lessonIds.length
        ? await tx.userProgress.deleteMany({
            where: {
              userId: args.userId,
              lessonId: {
                in: lessonIds,
              },
            },
          })
        : { count: 0 };

      const deletedPurchases = purchaseIds.length
        ? await tx.purchase.deleteMany({
            where: {
              id: {
                in: purchaseIds,
              },
            },
          })
        : { count: 0 };

      const decremented: Array<{ voucherId: string; code: string; currentUsesAfter: number }> = [];
      for (const plan of voucherDecrementPlan) {
        await tx.voucherCode.update({
          where: {
            id: plan.voucherId,
          },
          data: {
            currentUses: plan.currentUsesAfter,
          },
        });
        decremented.push({
          voucherId: plan.voucherId,
          code: plan.code,
          currentUsesAfter: plan.currentUsesAfter,
        });
      }

      const syncApplied: Array<{ voucherId: string; code: string; currentUsesAfter: number }> = [];
      if (codeVoucherIds.length) {
        const liveCountsAfterReset = await tx.voucherRedemption.groupBy({
          by: ['voucherId'],
          where: {
            voucherId: {
              in: codeVoucherIds,
            },
          },
          _count: {
            _all: true,
          },
        });

        const liveAfterMap = new Map(liveCountsAfterReset.map((row) => [row.voucherId, row._count._all]));

        for (const voucher of selectedCodeVouchers) {
          const target = liveAfterMap.get(voucher.id) ?? 0;
          await tx.voucherCode.update({
            where: {
              id: voucher.id,
            },
            data: {
              currentUses: target,
            },
          });

          syncApplied.push({
            voucherId: voucher.id,
            code: voucher.code,
            currentUsesAfter: target,
          });
        }
      }

      return {
        deleted: {
          purchases: deletedPurchases.count,
          discountApplied: deletedDiscount.count,
          voucherRedemptions: deletedRedemptions.count,
          lessonPurchases: deletedLessonPurchases.count,
          userProgress: deletedUserProgress.count,
        },
        voucherDecrementsApplied: decremented,
        codeSyncApplied: syncApplied,
      };
    });
  }

  const summary = {
    dryRun: args.dryRun,
    filters: {
      userId: args.userId,
      courseId: args.courseId ?? null,
      codes: args.codes,
    },
    affectedPurchaseIds: purchaseIds,
    counts: {
      purchases: purchases.length,
      discountApplied: discountRows.length,
      voucherRedemptions: redemptionRows.length,
      lessonPurchases: lessonPurchaseRows.length,
      userProgress: userProgressRows.length,
    },
    voucherDecrementPlan,
    codeSyncPlan: {
      missingCodes,
      vouchers: codeSyncPlan,
    },
    mutationSummary,
  };

  console.log(JSON.stringify(summary, null, 2));
}

export const voucherReset = main()
  .catch(() => {
    console.error('Voucher reset failed; private provider details omitted. Check the explicit user/course arguments.');
    process.exitCode = 1;
  })
  .finally(async () => {
    try { await prisma.$disconnect(); }
    catch {
      console.error('Voucher reset cleanup failed; private provider details omitted.');
      process.exitCode = 1;
    }
  });
