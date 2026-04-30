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
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Best-effort auto-reconcile: varre pagamentos paid recentes do email do usuário
 * autenticado e cria Purchase rows que ainda não existirem.
 * Pensado para rodar em background quando o usuário entra no dashboard,
 * cobrindo o caso em que webhook falhou e a URL de retorno foi perdida.
 */
export async function POST() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const email = user.email.trim().toLowerCase();

    const sinceISO = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const payments = await listDodoPaymentsForCustomer({
      email,
      sinceISO,
      pageSize: 100,
    });

    if (payments.length === 0) {
      return NextResponse.json({ unlocked: 0, scanned: 0 });
    }

    let unlocked = 0;
    const unlockedCourseIds: string[] = [];

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

      if (normalizeDodoEventKind(resolveDodoEventType(paymentPayload)) !== "paid") {
        continue;
      }

      const metadata = resolveDodoMetadata(paymentPayload);
      const courseId = readCustomString(metadata, "courseId", "course_id");
      if (!courseId) {
        continue;
      }

      const metadataUserId = readCustomString(metadata, "userId", "user_id");
      if (metadataUserId && metadataUserId !== user.id) {
        continue;
      }

      const existing = await db.purchase.findUnique({
        where: { userId_courseId: { userId: user.id, courseId } },
        select: { id: true },
      });
      if (existing) {
        continue;
      }

      const providerReferenceId =
        resolveDodoProviderReferenceId(paymentPayload) ??
        (payment.id ? `dodo-pay:${payment.id}` : null);
      if (!providerReferenceId) {
        continue;
      }

      const { subtotalAmount, totalAmount, discountAmount } = extractDodoPricing(paymentPayload);

      try {
        await upsertCoursePurchaseFromProvider({
          userId: user.id,
          courseId,
          providerReferenceId,
          originalPrice: subtotalAmount,
          finalPrice: totalAmount,
          discountAmount,
          localVoucherCode: readCustomString(metadata, "voucherCode", "voucher_code"),
          providerDiscountCode: readCustomString(
            metadata,
            "providerDiscountCode",
            "provider_discount_code",
            "discountCode",
            "discount_code",
          ),
        });
        unlocked += 1;
        unlockedCourseIds.push(courseId);
      } catch (error) {
        console.error("[AUTO_RECONCILE_UPSERT_FAILED]", {
          userId: user.id,
          courseId,
          providerReferenceId,
          error,
        });
      }
    }

    return NextResponse.json({
      unlocked,
      scanned: payments.length,
      unlockedCourseIds,
    });
  } catch (error) {
    console.error("[AUTO_RECONCILE_ERROR]", error);
    return new NextResponse("Error interno", { status: 500 });
  }
}
