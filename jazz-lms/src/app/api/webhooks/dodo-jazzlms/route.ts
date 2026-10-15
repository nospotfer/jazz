import {
  revertCoursePurchaseByProviderReferenceId,
  upsertCoursePurchaseFromProvider,
} from "@/lib/course-purchase-sync";
import { db } from "@/lib/db";
import { safeErrorDiagnostic, safeErrorReason } from "@/lib/error-diagnostics";
import {
  isDodoWebhookTimestampFresh,
  verifyDodoWebhookSignature,
} from "@/lib/payments/providers/dodo";
import {
  asObject,
  asString,
  extractDodoPricing,
  isDodoPaymentGrantable,
  normalizeDodoEventKind,
  readCustomString,
  resolveDodoEventId,
  resolveDodoEventType,
  resolveDodoMetadata,
  resolveDodoProviderReferenceId,
  resolveDodoVoucherAccounting,
  type LooseObject,
} from "@/lib/payments/providers/dodo-events";
import { Prisma } from "@prisma/client";
import crypto from "crypto";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function resolveHeadersForAudit(
  headersList: Headers,
): Record<string, string | null> {
  return {
    "webhook-id": headersList.get("webhook-id"),
    "webhook-signature": headersList.get("webhook-signature"),
    "webhook-timestamp": headersList.get("webhook-timestamp"),
    "user-agent": headersList.get("user-agent"),
    "content-type": headersList.get("content-type"),
  };
}

async function upsertWebhookEvent(input: {
  eventKey: string;
  eventId: string;
  eventType: string;
  accountId: string | null;
  payload: LooseObject;
  payloadHash: string;
  signature: string | null;
  headersForAudit: Record<string, string | null>;
}) {
  const prisma = db;
  const payloadJson = input.payload as Prisma.InputJsonValue;
  const headersJson = input.headersForAudit as Prisma.InputJsonValue;
  const existing = await prisma.paymentWebhookEvent.findUnique({
    where: { eventKey: input.eventKey },
    select: { id: true, status: true, attemptCount: true },
  });

  if (existing?.status === "PROCESSED") {
    return { duplicateProcessed: true } as const;
  }

  if (existing) {
    await prisma.paymentWebhookEvent.update({
      where: { id: existing.id },
      data: {
        status: "PROCESSING",
        payload: payloadJson,
        headers: headersJson,
        signature: input.signature,
        payloadHash: input.payloadHash,
        attemptCount: existing.attemptCount + 1,
        lastError: null,
      },
    });

    return { duplicateProcessed: false } as const;
  }

  await prisma.paymentWebhookEvent.create({
    data: {
      provider: "dodo",
      accountId: input.accountId,
      eventId: input.eventId,
      eventType: input.eventType,
      eventKey: input.eventKey,
      status: "PROCESSING",
      payload: payloadJson,
      headers: headersJson,
      signature: input.signature,
      payloadHash: input.payloadHash,
      attemptCount: 1,
    },
  });

  return { duplicateProcessed: false } as const;
}

async function markWebhookEventStatus(
  eventKey: string,
  status: "PROCESSED" | "FAILED" | "IGNORED",
  error?: string,
) {
  const prisma = db;
  await prisma.paymentWebhookEvent.update({
    where: { eventKey },
    data: {
      status,
      processedAt:
        status === "PROCESSED" || status === "IGNORED" ? new Date() : null,
      lastError: error ?? null,
    },
  });
}

export async function POST(req: Request) {
  const headersList = await headers();
  const webhookId = headersList.get("webhook-id");
  const webhookSignature = headersList.get("webhook-signature");
  const webhookTimestamp = headersList.get("webhook-timestamp");
  const rawBody = await req.text();

  if (!isDodoWebhookTimestampFresh(webhookTimestamp)) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "stale_timestamp",
          message: "Webhook timestamp is stale or invalid",
        },
      },
      { status: 401 },
    );
  }

  const signatureValid = verifyDodoWebhookSignature({
    payload: rawBody,
    signature: webhookSignature,
    webhookId,
    webhookTimestamp,
  });

  if (!signatureValid) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "invalid_signature",
          message: "Invalid Dodo webhook signature",
        },
      },
      { status: 401 },
    );
  }

  let payload: LooseObject;
  try {
    payload = JSON.parse(rawBody) as LooseObject;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "invalid_json",
          message: "Invalid JSON payload",
        },
      },
      { status: 400 },
    );
  }

  const eventType = resolveDodoEventType(payload);
  const eventId = resolveDodoEventId(payload, webhookId);
  const accountId =
    asString(payload.business_id) ??
    asString(asObject(payload.data).business_id) ??
    process.env.DODO_BUSINESS_ID?.trim() ??
    null;
  const eventKey = `dodo:${accountId ?? "default"}:${eventId}`;
  const payloadHash = crypto.createHash("sha256").update(rawBody).digest("hex");

  try {
    const eventUpsert = await upsertWebhookEvent({
      eventKey,
      eventId,
      eventType,
      accountId,
      payload,
      payloadHash,
      signature: webhookSignature,
      headersForAudit: resolveHeadersForAudit(headersList),
    });

    if (eventUpsert.duplicateProcessed) {
      return new NextResponse(null, { status: 200 });
    }

    const providerReferenceId = resolveDodoProviderReferenceId(payload);
    const eventKind = normalizeDodoEventKind(eventType);

    if (!providerReferenceId) {
      await markWebhookEventStatus(eventKey, "IGNORED");
      return new NextResponse(null, { status: 200 });
    }

    if (eventKind === "refunded" || eventKind === "disputed") {
      await revertCoursePurchaseByProviderReferenceId(providerReferenceId);
      await markWebhookEventStatus(eventKey, "PROCESSED");
      return new NextResponse(null, { status: 200 });
    }

    if (eventKind === "ignored") {
      await markWebhookEventStatus(eventKey, "IGNORED");
      return new NextResponse(null, { status: 200 });
    }

    const data = asObject(payload.data);
    const payment = Object.keys(asObject(data.payment)).length ? asObject(data.payment) : data;
    if (!isDodoPaymentGrantable({ ...payment, status: payment.status ?? "succeeded" })) {
      await markWebhookEventStatus(eventKey, "IGNORED");
      return new NextResponse(null, { status: 200 });
    }

    const metadata = resolveDodoMetadata(payload);
    const userId = readCustomString(metadata, "userId", "user_id");
    const courseId = readCustomString(metadata, "courseId", "course_id");

    if (!userId || !courseId) {
      await markWebhookEventStatus(
        eventKey,
        "FAILED",
        "Missing user/course metadata",
      );
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "invalid_metadata",
            message: "Missing course metadata for purchase sync",
          },
        },
        { status: 400 },
      );
    }

    const { subtotalAmount, totalAmount, discountAmount, paymentCurrency, paymentAmountMinor } =
      extractDodoPricing(payload);

    await upsertCoursePurchaseFromProvider({
      userId,
      courseId,
      providerReferenceId,
      originalPrice: subtotalAmount,
      finalPrice: totalAmount,
      discountAmount,
      paymentCurrency,
      paymentAmountMinor,
      ...resolveDodoVoucherAccounting(payload),
    });

    await markWebhookEventStatus(eventKey, "PROCESSED");
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.name === "DodoPaymentRevokedError") {
      await markWebhookEventStatus(eventKey, "IGNORED");
      return new NextResponse(null, { status: 200 });
    }
    console.error("[DODO_WEBHOOK_PROCESSING_ERROR]", {
      eventType,
      eventId,
      diagnostic: safeErrorDiagnostic(error),
    });

    try {
      await markWebhookEventStatus(
        eventKey,
        "FAILED",
        safeErrorReason(error),
      );
    } catch {
      // noop: keep original error handling response
    }

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "processing_failed",
          message: "Webhook processing failed",
        },
      },
      { status: 500 },
    );
  }
}
