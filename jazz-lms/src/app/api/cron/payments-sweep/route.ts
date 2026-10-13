import { retrieveDodoReconciliationSnapshot } from '@/lib/payments/dodo-reconciliation';
import { upsertCoursePurchaseFromProvider } from "@/lib/course-purchase-sync";
import { db } from "@/lib/db";
import { safeErrorDiagnostic, safeErrorReason } from "@/lib/error-diagnostics";
import { listDodoPaymentsForCustomer } from "@/lib/payments/providers/dodo";
import {
  asObject,
  extractDodoPricing,
  doesDodoPaymentBelongToUser,
  isDodoPaymentGrantable,
  readCustomString,
  resolveDodoMetadata,
  resolveDodoProviderReferenceId,
  resolveDodoVoucherAccounting,
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
 * Autenticação: header `Authorization: Bearer ${CRON_SECRET}`, enviado
 * automaticamente pelo Vercel Cron quando CRON_SECRET está configurado.
 */
export async function GET(req: Request) {
  // Headers como x-vercel-cron podem ser forjados por qualquer cliente.
  // Sem um segredo configurado, nenhuma execução deve ser autorizada.
  const bearer = req.headers.get("authorization");
  const expected = process.env.CRON_SECRET?.trim();
  const hasValidBearer =
    Boolean(expected) && bearer === `Bearer ${expected}`;

  if (!hasValidBearer) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Janela: últimas 48 horas. Cron roda diariamente; janela > 24h cobre
  // qualquer atraso ou execução perdida.
  const sinceISO = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

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

        if (!isDodoPaymentGrantable(asObject(payment))) {
          continue;
        }
        if (!doesDodoPaymentBelongToUser(paymentPayload, user.id, email)) {
          continue;
        }

        const metadata = resolveDodoMetadata(paymentPayload);
        const courseId = readCustomString(metadata, "courseId", "course_id");
        if (!courseId) continue;

        const existing = await db.purchase.findUnique({
          where: { userId_courseId: { userId: user.id, courseId } },
          select: { id: true },
        });
        if (existing) continue;

        const providerReferenceId =
          resolveDodoProviderReferenceId(paymentPayload) ??
          (payment.id ? `dodo-pay:${payment.id}` : null);
        if (!providerReferenceId) continue;

        const snapshot = await retrieveDodoReconciliationSnapshot(payment);
        if (!snapshot || !doesDodoPaymentBelongToUser(snapshot, user.id, email) ||
            readCustomString(resolveDodoMetadata(snapshot), "courseId", "course_id") !== courseId) continue;
        const { subtotalAmount, totalAmount, discountAmount } = extractDodoPricing(snapshot);

        try {
          await upsertCoursePurchaseFromProvider({
            userId: user.id,
            courseId,
            providerReferenceId,
            originalPrice: subtotalAmount,
            finalPrice: totalAmount,
            discountAmount,
            // Only actual provider discount snapshots can consume a voucher;
            // checkout metadata alone is not evidence of an applied discount.
            ...resolveDodoVoucherAccounting(snapshot),
          });
        } catch (error) {
          // The webhook ledger can know about a reversal before the provider's
          // list response catches up. Skip it and keep scanning other payments.
          if (error instanceof Error && error.name === "DodoPaymentRevokedError") {
            continue;
          }
          throw error;
        }
        totalUnlocked += 1;

        console.warn("[CRON_PAYMENTS_SWEEP_UNLOCKED]", {
          userId: user.id,
          courseId,
          providerReferenceId,
        });
      }
    } catch (error) {
      const reason = safeErrorReason(error);
      failures.push({ userId: user.id, reason });
      console.error("[CRON_PAYMENTS_SWEEP_USER_ERROR]", {
        userId: user.id,
        diagnostic: safeErrorDiagnostic(error),
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
