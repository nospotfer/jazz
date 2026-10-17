import { safeErrorDiagnostic } from '@/lib/error-diagnostics';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/lib/db';
import { isIsolatedLocalTestRequest } from '@/lib/test-mode';

export async function POST(req: Request) {
  try {
    if (!isIsolatedLocalTestRequest(req)) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const courseId = typeof body?.courseId === 'string' ? body.courseId.trim() : '';
    if (!courseId) return new NextResponse('Explicit course required', { status: 400 });
    if (body.userId !== undefined && body.userId !== user.id) {
      return new NextResponse('Unauthorized target user', { status: 403 });
    }
    const dryRun = body.dryRun !== false;
    const purchaseScope = { userId: user.id, courseId };
    const lessonScope = { userId: user.id, lesson: { chapter: { courseId } } };

    if (dryRun) {
      const [purchases, progress, lessonPurchases, redemptions, discounts] = await Promise.all([
        db.purchase.count({ where: purchaseScope }),
        db.userProgress.count({ where: lessonScope }),
        db.lessonPurchase.count({ where: lessonScope }),
        db.voucherRedemption.count({ where: { userId: user.id, purchase: { courseId } } }),
        db.discountApplied.count({ where: { purchase: purchaseScope } }),
      ]);
      return NextResponse.json({
        ok: true, dryRun: true, scope: purchaseScope,
        counts: { purchases, progress, lessonPurchases, redemptions, discounts },
      });
    }

    const summary = await db.$transaction(async (tx) => {
      const redemptions = await tx.voucherRedemption.findMany({
        where: {
          userId: user.id,
          purchase: { courseId },
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
            courseId,
          },
        },
      });

      const deletedRedemptions = await tx.voucherRedemption.deleteMany({
        where: {
          userId: user.id,
          purchase: { courseId },
        },
      });

      const deletedPurchases = await tx.purchase.deleteMany({
        where: purchaseScope,
      });

      const deletedProgress = await tx.userProgress.deleteMany({
        where: lessonScope,
      });

      const deletedLessonPurchases = await tx.lessonPurchase.deleteMany({
        where: lessonScope,
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
      dryRun: false,
      scope: purchaseScope,
      ...summary,
    });
  } catch (error) {
    console.error('[DEV_RESET_TEST_PURCHASES_ERROR]', safeErrorDiagnostic(error));
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
