import { ensureAdminApiPermission } from "@/lib/admin-api";
import { db } from "@/lib/db";
import { removeVoucherDiscountSync } from "@/lib/voucher-provider-sync";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ voucherId: string }> },
) {
  try {
    const { voucherId } = await params;
    const auth = await ensureAdminApiPermission("vouchers.read");
    if (!auth.ok) {
      return auth.response;
    }

    const prisma = db as any;
    const voucher = await prisma.voucherCode.findUnique({
      where: { id: voucherId },
      include: {
        course: {
          select: { id: true, title: true },
        },
        batch: {
          select: { id: true, name: true, codePrefix: true },
        },
        redemptions: {
          orderBy: { redeemedAt: "desc" },
          include: {
            purchase: {
              select: {
                id: true,
                originalPrice: true,
                finalPrice: true,
                discountAmount: true,
                createdAt: true,
              },
            },
          },
          take: 200,
        },
      },
    });

    if (!voucher) {
      return NextResponse.json(
        {
          success: false,
          error: "Not found",
          message: "Voucher não encontrado.",
        },
        { status: 404 },
      );
    }

    const userIds: string[] = Array.from(
      new Set(voucher.redemptions.map((item: any) => String(item.userId))),
    );
    const users = userIds.length
      ? await db.user.findMany({
          where: {
            id: { in: userIds },
          },
          select: {
            id: true,
            email: true,
            name: true,
          },
        })
      : [];

    const usersMap = new Map(users.map((user) => [user.id, user]));
    const redemptions = voucher.redemptions.map((redemption: any) => ({
      ...redemption,
      user: usersMap.get(redemption.userId) || null,
    }));

    return NextResponse.json({
      success: true,
      voucher: {
        ...voucher,
        redemptions,
      },
    });
  } catch (error) {
    console.error("[ADMIN_VOUCHER_DETAIL_ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Server error",
        message: "Erro ao carregar voucher.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ voucherId: string }> },
) {
  try {
    const { voucherId } = await params;
    const auth = await ensureAdminApiPermission("vouchers.update");
    if (!auth.ok) {
      return auth.response;
    }

    const url = new URL(req.url);
    const force = url.searchParams.get("force") === "true";

    const prisma = db as any;
    const voucher = await prisma.voucherCode.findUnique({
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
        batchId: true,
        currentUses: true,
        _count: {
          select: {
            redemptions: true,
          },
        },
      },
    });

    if (!voucher) {
      return NextResponse.json(
        {
          success: false,
          error: "Not found",
          message: "Voucher no encontrado.",
        },
        { status: 404 },
      );
    }

    if (!force && (voucher.currentUses > 0 || voucher._count.redemptions > 0)) {
      return NextResponse.json(
        {
          success: false,
          error: "Conflict",
          message: `No se puede eliminar ${voucher.code} porque ya fue usado.`,
        },
        { status: 409 },
      );
    }

    const providerSync = await removeVoucherDiscountSync({
      id: voucher.id,
      code: voucher.code,
      type: voucher.type,
      discountPercent: voucher.discountPercent,
      discountAmount: voucher.discountAmount,
      maxUses: voucher.maxUses,
      expiresAt: voucher.expiresAt,
      metadata: voucher.metadata,
    });

    const result = await prisma.$transaction(async (tx: any) => {
      await tx.voucherCode.delete({
        where: { id: voucher.id },
      });

      if (voucher.batchId) {
        const batchCount = await tx.voucherCode.count({
          where: {
            batchId: voucher.batchId,
          },
        });

        await tx.voucherBatch.update({
          where: {
            id: voucher.batchId,
          },
          data: {
            quantity: batchCount,
          },
        });
      }

      return {
        status: "deleted" as const,
        code: voucher.code,
      };
    });

    return NextResponse.json({
      success: true,
      deletedCount: 1,
      providerSync: {
        ok: providerSync.ok,
        reason: providerSync.reason || null,
      },
      message: force
        ? `Voucher ${result.code} eliminado en modo forzado.`
        : `Voucher ${result.code} eliminado.`,
    });
  } catch (error) {
    console.error("[ADMIN_VOUCHER_DELETE_ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Server error",
        message: "Error al eliminar voucher.",
      },
      { status: 500 },
    );
  }
}
