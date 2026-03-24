import { ensureAdminApiPermission } from "@/lib/admin-api";
import { db } from "@/lib/db";
import {
  ensureVoucherDiscountSynced,
  removeVoucherDiscountSync,
} from "@/lib/voucher-lemon-sync";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ voucherId: string }> },
) {
  try {
    const { voucherId } = await params;
    const auth = await ensureAdminApiPermission("vouchers.update");
    if (!auth.ok) {
      return auth.response;
    }

    const { isActive } = await req.json();
    if (typeof isActive !== "boolean") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid payload",
          message: "isActive deve ser booleano.",
        },
        { status: 400 },
      );
    }

    const prisma = db as any;
    const currentVoucher = await prisma.voucherCode.findUnique({
      where: { id: voucherId },
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

    if (!currentVoucher) {
      return NextResponse.json(
        {
          success: false,
          error: "Not found",
          message: "Voucher no encontrado.",
        },
        { status: 404 },
      );
    }

    const syncResult = isActive
      ? await ensureVoucherDiscountSynced({
          id: currentVoucher.id,
          code: currentVoucher.code,
          type: currentVoucher.type,
          discountPercent: currentVoucher.discountPercent,
          discountAmount: currentVoucher.discountAmount,
          maxUses: currentVoucher.maxUses,
          expiresAt: currentVoucher.expiresAt,
          metadata: currentVoucher.metadata,
        })
      : await removeVoucherDiscountSync({
          id: currentVoucher.id,
          code: currentVoucher.code,
          type: currentVoucher.type,
          discountPercent: currentVoucher.discountPercent,
          discountAmount: currentVoucher.discountAmount,
          maxUses: currentVoucher.maxUses,
          expiresAt: currentVoucher.expiresAt,
          metadata: currentVoucher.metadata,
        });

    const voucher = await prisma.voucherCode.update({
      where: { id: voucherId },
      data: {
        isActive,
        metadata: syncResult.metadata,
      },
      select: {
        id: true,
        code: true,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      voucher,
      lemonSync: {
        ok: syncResult.ok,
        reason: syncResult.reason || null,
      },
    });
  } catch (error) {
    console.error("[ADMIN_VOUCHER_TOGGLE_ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Server error",
        message: "Erro ao atualizar voucher.",
      },
      { status: 500 },
    );
  }
}
