import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/lib/db';
import { isLocalTestRequest } from '@/lib/test-mode';

export async function POST(req: Request) {
  try {
    if (!isLocalTestRequest(req)) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const summary = await db.$transaction(async (tx) => {
      const redemptions = await tx.voucherRedemption.findMany({
        where: {
          userId: user.id,
        },
        select: {
          voucherId: true,
        },
      });

      const usagesByVoucher = new Map<string, number>();
      for (const redemption of redemptions) {
        if (!redemption.voucherId) {
          continue;
        }

        usagesByVoucher.set(
          redemption.voucherId,
          (usagesByVoucher.get(redemption.voucherId) || 0) + 1
        );
      }

      for (const [voucherId, usageCount] of usagesByVoucher.entries()) {
        const voucher = await tx.voucherCode.findUnique({
          where: { id: voucherId },
          select: { currentUses: true },
        });

        if (!voucher) {
          continue;
        }

        await tx.voucherCode.update({
          where: { id: voucherId },
          data: {
            currentUses: Math.max(0, voucher.currentUses - usageCount),
          },
        });
      }

      const deletedDiscounts = await tx.discountApplied.deleteMany({
        where: {
          purchase: {
            userId: user.id,
          },
        },
      });

      const deletedRedemptions = await tx.voucherRedemption.deleteMany({
        where: {
          userId: user.id,
        },
      });

      const deletedPurchases = await tx.purchase.deleteMany({
        where: { userId: user.id },
      });

      const deletedProgress = await tx.userProgress.deleteMany({
        where: { userId: user.id },
      });

      const deletedLessonPurchases = await tx.lessonPurchase.deleteMany({
        where: { userId: user.id },
      });

      return {
        deletedPurchases: deletedPurchases.count,
        deletedProgress: deletedProgress.count,
        deletedLessonPurchases: deletedLessonPurchases.count,
        deletedRedemptions: deletedRedemptions.count,
        deletedDiscounts: deletedDiscounts.count,
      };
    });

    return NextResponse.json({
      ok: true,
      ...summary,
    });
  } catch (error) {
    console.error('[DEV_RESET_TEST_PURCHASES_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
