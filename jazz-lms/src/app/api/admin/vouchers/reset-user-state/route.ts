import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureAdminApiPermission } from '@/lib/admin-api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ResetPayload = {
  userId?: string;
  courseId?: string;
  dryRun?: boolean;
};

export async function POST(req: Request) {
  try {
    const auth = await ensureAdminApiPermission('vouchers.update');
    if (!auth.ok) {
      return auth.response;
    }

    const body = (await req.json().catch(() => ({}))) as ResetPayload;
    const targetUserId = typeof body.userId === 'string' && body.userId.trim().length > 0
      ? body.userId.trim()
      : auth.userId;
    const courseId = typeof body.courseId === 'string' && body.courseId.trim().length > 0
      ? body.courseId.trim()
      : null;
    const dryRun = body.dryRun === true;

    if (!targetUserId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bad request',
          message: 'Usuário inválido para reset.',
        },
        { status: 400 }
      );
    }

    const prisma = db as any;
    const purchases = await prisma.purchase.findMany({
      where: {
        userId: targetUserId,
        ...(courseId ? { courseId } : {}),
      },
      select: {
        id: true,
      },
    });

    const purchaseIds = purchases.map((purchase: { id: string }) => purchase.id);

    if (!purchaseIds.length) {
      return NextResponse.json({
        success: true,
        dryRun,
        scope: {
          userId: targetUserId,
          courseId,
        },
        affectedPurchaseIds: [],
        voucherAdjustments: [],
        counts: {
          purchases: 0,
          voucherRedemptions: 0,
          discountsApplied: 0,
          userProgress: 0,
          lessonPurchases: 0,
        },
      });
    }

    const redemptions = await prisma.voucherRedemption.findMany({
      where: {
        purchaseId: {
          in: purchaseIds,
        },
      },
      select: {
        voucherId: true,
      },
    });

    const voucherUsageById = new Map<string, number>();
    for (const redemption of redemptions) {
      if (!redemption.voucherId) {
        continue;
      }

      voucherUsageById.set(redemption.voucherId, (voucherUsageById.get(redemption.voucherId) || 0) + 1);
    }

    const voucherAdjustments = await Promise.all(
      Array.from(voucherUsageById.entries()).map(async ([voucherId, redemptionCount]) => {
        const voucher = await prisma.voucherCode.findUnique({
          where: { id: voucherId },
          select: {
            currentUses: true,
          },
        });

        const currentUses = voucher?.currentUses ?? 0;
        const nextUses = Math.max(0, currentUses - redemptionCount);

        return {
          voucherId,
          redemptionCount,
          currentUses,
          nextUses,
        };
      })
    );

    const [discountsAppliedCount, redemptionsCount, userProgressCount, lessonPurchasesCount] = await Promise.all([
      prisma.discountApplied.count({
        where: {
          purchaseId: {
            in: purchaseIds,
          },
        },
      }),
      prisma.voucherRedemption.count({
        where: {
          purchaseId: {
            in: purchaseIds,
          },
        },
      }),
      prisma.userProgress.count({
        where: {
          userId: targetUserId,
          ...(courseId
            ? {
                lesson: {
                  chapter: {
                    courseId,
                  },
                },
              }
            : {}),
        },
      }),
      prisma.lessonPurchase.count({
        where: {
          userId: targetUserId,
          ...(courseId
            ? {
                lesson: {
                  chapter: {
                    courseId,
                  },
                },
              }
            : {}),
        },
      }),
    ]);

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        scope: {
          userId: targetUserId,
          courseId,
        },
        affectedPurchaseIds: purchaseIds,
        voucherAdjustments,
        counts: {
          purchases: purchaseIds.length,
          voucherRedemptions: redemptionsCount,
          discountsApplied: discountsAppliedCount,
          userProgress: userProgressCount,
          lessonPurchases: lessonPurchasesCount,
        },
      });
    }

    const mutationSummary = await prisma.$transaction(async (tx: any) => {
      for (const adjustment of voucherAdjustments) {
        await tx.voucherCode.update({
          where: {
            id: adjustment.voucherId,
          },
          data: {
            currentUses: adjustment.nextUses,
          },
        });
      }

      const deletedDiscounts = await tx.discountApplied.deleteMany({
        where: {
          purchaseId: {
            in: purchaseIds,
          },
        },
      });

      const deletedRedemptions = await tx.voucherRedemption.deleteMany({
        where: {
          purchaseId: {
            in: purchaseIds,
          },
        },
      });

      const deletedPurchases = await tx.purchase.deleteMany({
        where: {
          id: {
            in: purchaseIds,
          },
        },
      });

      const deletedProgress = await tx.userProgress.deleteMany({
        where: {
          userId: targetUserId,
          ...(courseId
            ? {
                lesson: {
                  chapter: {
                    courseId,
                  },
                },
              }
            : {}),
        },
      });

      const deletedLessonPurchases = await tx.lessonPurchase.deleteMany({
        where: {
          userId: targetUserId,
          ...(courseId
            ? {
                lesson: {
                  chapter: {
                    courseId,
                  },
                },
              }
            : {}),
        },
      });

      return {
        purchases: deletedPurchases.count,
        voucherRedemptions: deletedRedemptions.count,
        discountsApplied: deletedDiscounts.count,
        userProgress: deletedProgress.count,
        lessonPurchases: deletedLessonPurchases.count,
      };
    });

    return NextResponse.json({
      success: true,
      dryRun: false,
      scope: {
        userId: targetUserId,
        courseId,
      },
      affectedPurchaseIds: purchaseIds,
      voucherAdjustments,
      counts: mutationSummary,
    });
  } catch (error) {
    console.error('[ADMIN_VOUCHERS_RESET_USER_STATE_ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Server error',
        message: 'Erro ao resetar estado de compras e vouchers.',
      },
      { status: 500 }
    );
  }
}
