import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/lib/db';
import { validateVoucherForCourse } from '@/lib/vouchers';

export const runtime = 'nodejs';

class VoucherRedeemError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', message: 'Não autorizado.' },
        { status: 401 }
      );
    }

    const { voucherCode, courseId } = await req.json();

    const result = await validateVoucherForCourse({
      code: voucherCode,
      courseId,
      userId: user.id,
      requiredType: 'FREE_ACCESS',
    });

    if (!result.valid) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          message: result.message,
        },
        { status: 400 }
      );
    }

    const existingPurchase = await db.purchase.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId,
        },
      },
    });

    if (existingPurchase) {
      return NextResponse.json(
        {
          success: false,
          error: 'Already purchased',
          message: 'Você já tem acesso a este curso.',
        },
        { status: 409 }
      );
    }

    await db.$transaction(async (tx: any) => {
      const latestVoucher = await tx.voucherCode.findUnique({
        where: { id: result.voucher.id },
        select: {
          id: true,
          maxUses: true,
          currentUses: true,
          maxUsesPerUser: true,
          isActive: true,
          expiresAt: true,
        },
      });

      if (!latestVoucher || !latestVoucher.isActive) {
        throw new VoucherRedeemError('Voucher inválido ou inativo.', 400);
      }

      if (latestVoucher.expiresAt && new Date() > latestVoucher.expiresAt) {
        throw new VoucherRedeemError('Este voucher expirou.', 400);
      }

      if (
        latestVoucher.maxUses !== null &&
        latestVoucher.currentUses >= latestVoucher.maxUses
      ) {
        throw new VoucherRedeemError('Este voucher atingiu o limite total de usos.', 409);
      }

      const userRedemptions = await tx.voucherRedemption.count({
        where: {
          voucherId: latestVoucher.id,
          userId: user.id,
        },
      });

      if (userRedemptions >= latestVoucher.maxUsesPerUser) {
        throw new VoucherRedeemError('Você já atingiu o limite de uso deste voucher.', 409);
      }

      const purchase = await tx.purchase.create({
        data: {
          userId: user.id,
          courseId,
          voucherId: latestVoucher.id,
          originalPrice: result.originalPrice,
          finalPrice: result.finalPrice,
          discountAmount: result.discount,
        },
      });

      await tx.discountApplied.create({
        data: {
          purchaseId: purchase.id,
          voucherId: latestVoucher.id,
          originalPrice: result.originalPrice,
          discountAmount: result.discount,
          finalPrice: result.finalPrice,
        },
      });

      await tx.voucherRedemption.create({
        data: {
          voucherId: latestVoucher.id,
          userId: user.id,
          purchaseId: purchase.id,
        },
      });

      if (latestVoucher.maxUses !== null) {
        const updated = await tx.voucherCode.updateMany({
          where: {
            id: latestVoucher.id,
            currentUses: {
              lt: latestVoucher.maxUses,
            },
          },
          data: {
            currentUses: { increment: 1 },
          },
        });

        if (updated.count === 0) {
          throw new VoucherRedeemError('Este voucher atingiu o limite total de usos.', 409);
        }
      } else {
        await tx.voucherCode.update({
          where: { id: latestVoucher.id },
          data: {
            currentUses: { increment: 1 },
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Voucher resgatado com sucesso!',
      accessGranted: true,
      redirectUrl: '/dashboard',
    });
  } catch (error) {
    if (error instanceof VoucherRedeemError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Redeem failed',
          message: error.message,
        },
        { status: error.status }
      );
    }

    console.error('[VOUCHER_REDEEM_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Server error', message: 'Erro ao resgatar voucher.' },
      { status: 500 }
    );
  }
}
