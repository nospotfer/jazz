import { upsertCoursePurchaseFromProvider } from "@/lib/course-purchase-sync";
import { db } from "@/lib/db";
import { listDodoPaymentsForCustomer } from "@/lib/payments/providers/dodo";
import {
  asObject,
  extractDodoPricing,
  normalizeDodoEventKind,
  readCustomString,
  resolveDodoEventType,
  resolveDodoMetadata,
  resolveDodoProviderReferenceId,
  type LooseObject,
} from "@/lib/payments/providers/dodo-events";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Cron de varredura de pagamentos: roda a cada 5 minutos via Vercel Cron.
 * Para cada usuário que tenha email registrado no banco, varre pagamentos
 * paid recentes na Dodo e cria Purchase rows que ainda não existirem.
 * Garante desbloqueio mesmo se o webhook nunca chegar e o usuário nunca
 * retornar ao dashboard.
 *
 * Autenticação: header `Authorization: Bearer ${CRON_SECRET}` ou execução
 * via Vercel Cron (que injeta o header `x-vercel-cron`).
 */
export async function GET(req: Request) {
  // Aceita Vercel Cron (header injetado) ou Bearer secret manual.
  const isVercelCron = req.headers.get("x-vercel-cron") !== null;
  const bearer = req.headers.get("authorization");
  const expected = process.env.CRON_SECRET?.trim();
  const hasValidBearer =
    Boolean(expected) && bearer === `Bearer ${expected}`;

  if (!isVercelCron && !hasValidBearer) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Janela: últimas 6 horas. Cron roda a cada 5min, então cobre todos os
  // pagamentos recentes mesmo se algumas execuções falharem.
  const sinceISO = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

  // Pega usuários que tiveram atividade recente (últimos 7 dias) ou que
  // ainda não compraram nada (potenciais conversões pendentes).
  const recentlyActiveCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const users = await db.user.findMany({
    where: {
      email: { not: "" },
      OR: [
        { updatedAt: { gte: recentlyActiveCutoff } },
        { createdAt: { gte: recentlyActiveCutoff } },
      ],
    },
    select: { id: true, email: true },
    take: 500,
  });

  let totalUnlocked = 0;
  let totalScanned = 0;
  const failures: Array<{ userId: string; reason: string }> = [];

  for (const user of users) {
    const email = user.email?.trim().toLowerCase();
    if (!email) continue;

    try {
      const payments = await listDodoPaymentsForCustomer({
        email,
        sinceISO,
        pageSize: 50,
      });
      totalScanned += payments.length;

      for (const payment of payments) {
        const paymentPayload = {
          type: `payment.${String(payment.status ?? "unknown").toLowerCase()}`,
          id: payment.id,
          data: {
            payment,
            customer: asObject(payment.customer),
            customer_email: payment.customer_email,
            amount: payment.amount,
            subtotal_amount: payment.subtotal_amount,
            total_amount: payment.total_amount,
            metadata: asObject(payment.metadata),
          },
          metadata: asObject(payment.metadata),
        } as LooseObject;

        if (
          normalizeDodoEventKind(resolveDodoEventType(paymentPayload)) !== "paid"
        ) {
          continue;
        }

        const metadata = resolveDodoMetadata(paymentPayload);
        const courseId = readCustomString(metadata, "courseId", "course_id");
        if (!courseId) continue;

        const metadataUserId = readCustomString(metadata, "userId", "user_id");
        if (metadataUserId && metadataUserId !== user.id) continue;

        const existing = await db.purchase.findUnique({
          where: { userId_courseId: { userId: user.id, courseId } },
          select: { id: true },
        });
        if (existing) continue;

        const providerReferenceId =
          resolveDodoProviderReferenceId(paymentPayload) ??
          (payment.id ? `dodo-pay:${payment.id}` : null);
        if (!providerReferenceId) continue;

        const { subtotalAmount, totalAmount, discountAmount } =
          extractDodoPricing(paymentPayload);

        await upsertCoursePurchaseFromProvider({
          userId: user.id,
          courseId,
          providerReferenceId,
          originalPrice: subtotalAmount,
          finalPrice: totalAmount,
          discountAmount,
          localVoucherCode: readCustomString(
            metadata,
            "voucherCode",
            "voucher_code",
          ),
          providerDiscountCode: readCustomString(
            metadata,
            "providerDiscountCode",
            "provider_discount_code",
            "discountCode",
            "discount_code",
          ),
        });
        totalUnlocked += 1;

        console.warn("[CRON_PAYMENTS_SWEEP_UNLOCKED]", {
          userId: user.id,
          email,
          courseId,
          providerReferenceId,
        });
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      failures.push({ userId: user.id, reason });
      console.error("[CRON_PAYMENTS_SWEEP_USER_ERROR]", {
        userId: user.id,
        email,
        error: reason,
      });
    }
  }

  return NextResponse.json({
    success: true,
    usersScanned: users.length,
    paymentsScanned: totalScanned,
    unlocked: totalUnlocked,
    failures: failures.length,
  });
}
