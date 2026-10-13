import { db } from "@/lib/db";
import { safeErrorDiagnostic } from "@/lib/error-diagnostics";
import { Prisma } from "@prisma/client";
import {
  asObject,
  asString,
  DODO_ENTITLEMENT_EVENTS,
  normalizeDodoEventKind,
  resolveDodoProviderReferenceId,
} from "@/lib/payments/providers/dodo-events";

type UpsertCoursePurchaseInput = {
  userId: string;
  courseId: string;
  providerReferenceId: string;
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
  voucherCode?: string | null;
  localVoucherCode?: string | null;
  providerDiscountCode?: string | null;
  providerDiscountId?: string | null;
  preserveExistingVoucher?: boolean;
};

type LooseObject = Record<string, unknown>;

export class DodoPaymentRevokedError extends Error {
  constructor() {
    super("This payment was refunded or disputed and cannot grant access");
    this.name = "DodoPaymentRevokedError";
  }
}

export class VoucherRedemptionRejectedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VoucherRedemptionRejectedError";
  }
}

async function lockPaymentReference(tx: Prisma.TransactionClient, reference: string) {
  // Serialize grants and reversals for one payment, including concurrent webhook
  // and dashboard reconciliation requests. This lock lasts for the transaction.
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${reference}, 0))`;
}

async function isDodoPaymentRevoked(tx: Prisma.TransactionClient, reference: string) {
  const paymentId = reference.slice("dodo-pay:".length);
  const events = await tx.paymentWebhookEvent.findMany({
    where: {
      provider: "dodo",
      eventType: { in: DODO_ENTITLEMENT_EVENTS },
      // Include validated events still processing/failed: the financial fact
      // remains relevant when a prior local reversal failed or is in progress.
      OR: [
        { payload: { path: ["data", "payment_id"], equals: paymentId } },
        { payload: { path: ["data", "payment", "payment_id"], equals: paymentId } },
        { payload: { path: ["data", "payment", "id"], equals: paymentId } },
        { payload: { path: ["data", "id"], equals: paymentId } },
        { payload: { path: ["id"], equals: paymentId } },
      ],
    },
    select: { eventType: true, payload: true, createdAt: true },
  });
  const matching = events.filter((event) =>
    resolveDodoProviderReferenceId(asObject(event.payload)) === reference
  );
  if (matching.some((event) => normalizeDodoEventKind(event.eventType) === "refunded")) return true;

  // Provider timestamps, not arrival order, distinguish a resolved dispute
  // from an older opened/lost event delivered late.
  const disputes = matching.filter((event) => event.eventType.startsWith("dispute."));
  const time = (event: typeof disputes[number]) => {
    const timestamp = asString(asObject(event.payload).timestamp);
    const parsed = timestamp ? Date.parse(timestamp) : NaN;
    return Number.isFinite(parsed) ? parsed : null;
  };
  if (disputes.some((event) => time(event) === null &&
      normalizeDodoEventKind(event.eventType) === "disputed")) return true;
  const ordered = disputes.filter((event) => time(event) !== null);
  ordered.sort((a, b) => time(b)! - time(a)!);
  if (!ordered.length) return false;
  const latest = ordered.filter((event) => time(event) === time(ordered[0]));
  // Ties are ambiguous; a revoking state wins until a later resolution arrives.
  return latest.some((event) => normalizeDodoEventKind(event.eventType) === "disputed");
}

function toErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object") {
    return null;
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : null;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "";
}

function isMissingRelationOrColumnError(error: unknown): boolean {
  const code = toErrorCode(error);
  if (code === "P2021" || code === "P2022") {
    return true;
  }

  const message = toErrorMessage(error).toLowerCase();
  return (
    message.includes("does not exist") ||
    message.includes("unknown column") ||
    message.includes("invalid column")
  );
}

function toMoney(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Number(value.toFixed(2));
}

function normalizeCode(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toUpperCase();
  return normalized.length > 0 ? normalized : null;
}

function getMetadataProviderDiscountCode(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const providerDiscountCode = (metadata as LooseObject).providerDiscountCode;
  if (typeof providerDiscountCode === "string") {
    return normalizeCode(providerDiscountCode);
  }

  const dodoDiscountCode = (metadata as LooseObject).dodoDiscountCode;
  if (typeof dodoDiscountCode === "string") {
    return normalizeCode(dodoDiscountCode);
  }

  return null;
}

async function findVoucherByCode(
  prisma: typeof db,
  code: string,
): Promise<{ id: string } | null> {
  const directMatch = await prisma.voucherCode.findUnique({
    where: {
      code,
    },
    select: {
      id: true,
    },
  });

  if (directMatch) {
    return directMatch;
  }

  return prisma.voucherCode.findFirst({
    where: {
      code: {
        equals: code,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
    },
  });
}

async function resolveVoucherByInput(
  prisma: typeof db,
  input: UpsertCoursePurchaseInput,
): Promise<string | null> {
  if (input.providerDiscountId) {
    const mapped = await prisma.voucherCode.findFirst({
      where: {
        OR: [{ courseId: input.courseId }, { courseId: null }],
        metadata: { path: ["providerDiscountId"], equals: input.providerDiscountId },
      },
      select: { id: true },
    });
    if (mapped) return mapped.id;
  }
  const localCode = normalizeCode(input.localVoucherCode ?? input.voucherCode);
  if (localCode) {
    const localVoucher = await findVoucherByCode(prisma, localCode);
    if (localVoucher) {
      return localVoucher.id;
    }
  }

  const providerCode = normalizeCode(input.providerDiscountCode);
  if (!providerCode) {
    return null;
  }

  const directProviderVoucher = await findVoucherByCode(prisma, providerCode);
  if (directProviderVoucher) {
    return directProviderVoucher.id;
  }

  const voucherCandidates = await prisma.voucherCode.findMany({
    where: {
      OR: [
        {
          courseId: input.courseId,
        },
        {
          courseId: null,
        },
      ],
      metadata: {
        not: Prisma.JsonNull,
      },
    },
    select: {
      id: true,
      metadata: true,
    },
  });

  const metadataMappedVoucher = voucherCandidates.find(
    (candidate: { metadata: unknown }) => {
      return (
        getMetadataProviderDiscountCode(candidate.metadata) === providerCode
      );
    },
  );

  return metadataMappedVoucher?.id ?? null;
}

async function incrementVoucherUsage(tx: Prisma.TransactionClient, voucherId: string, maximum?: number | null) {
  if (maximum != null) {
    const updated = await tx.voucherCode.updateMany({
      where: { id: voucherId, currentUses: { lt: maximum } },
      data: { currentUses: { increment: 1 } },
    });
    if (updated.count === 0) throw new VoucherRedemptionRejectedError("Este voucher atingiu o limite total de usos");
    return;
  }
  await tx.voucherCode.update({
    where: { id: voucherId },
    data: {
      currentUses: {
        increment: 1,
      },
    },
  });
}

async function decrementVoucherUsage(tx: Prisma.TransactionClient, voucherId: string) {
  await tx.voucherCode.updateMany({
    where: {
      id: voucherId,
      currentUses: {
        gt: 0,
      },
    },
    data: {
      currentUses: {
        decrement: 1,
      },
    },
  });
}

export async function upsertCoursePurchaseFromProvider(
  input: UpsertCoursePurchaseInput,
) {
  const prisma = db;
  const originalPrice = toMoney(input.originalPrice);
  const discountAmount = toMoney(input.discountAmount);
  const finalPrice = toMoney(input.finalPrice);
  // Provider discount identity is authoritative even if a gross/tax-inclusive
  // total exceeds the metadata base price. Metadata alone cannot prove a paid
  // discount. Application-owned free redemptions continue to record vouchers.
  const hasProviderDiscount = Boolean(input.providerDiscountId || input.providerDiscountCode);
  const canResolveVoucher = hasProviderDiscount ||
    (!input.providerReferenceId.startsWith("dodo-pay:") && (discountAmount > 0 || finalPrice === 0));
  const desiredVoucherId = canResolveVoucher
    ? await resolveVoucherByInput(prisma, input)
    : null;
  const preserveExistingVoucher = input.preserveExistingVoucher !== false;

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const isFreeVoucher = input.providerReferenceId.startsWith("dodo-voucher:");
    if (isFreeVoucher) {
      if (!desiredVoucherId) throw new VoucherRedemptionRejectedError("Código de voucher inválido");
      await lockPaymentReference(tx, `voucher:${desiredVoucherId}`);
    }
    if (input.providerReferenceId.startsWith("dodo-pay:")) {
      await lockPaymentReference(tx, input.providerReferenceId);
      if (await isDodoPaymentRevoked(tx, input.providerReferenceId)) {
        throw new DodoPaymentRevokedError();
      }
    }
    const existingPurchase = await tx.purchase.findUnique({
      where: {
        userId_courseId: {
          userId: input.userId,
          courseId: input.courseId,
        },
      },
      select: {
        id: true,
        voucherId: true,
      },
    });

    const existingRedemption = existingPurchase
      ? await tx.voucherRedemption.findFirst({
          where: {
            purchaseId: existingPurchase.id,
          },
          select: {
            id: true,
            voucherId: true,
          },
        })
      : null;

    const existingVoucherId =
      existingRedemption?.voucherId ?? existingPurchase?.voucherId ?? null;
    let maximumFreeVoucherUses: number | null | undefined;
    if (isFreeVoucher && desiredVoucherId && existingRedemption?.voucherId !== desiredVoucherId) {
      const voucher = await tx.voucherCode.findUnique({
        where: { id: desiredVoucherId },
        select: { isActive: true, expiresAt: true, maxUses: true, currentUses: true, maxUsesPerUser: true, courseId: true },
      });
      if (!voucher?.isActive || (voucher.courseId && voucher.courseId !== input.courseId) ||
          (voucher.expiresAt && voucher.expiresAt < new Date())) {
        throw new VoucherRedemptionRejectedError("Voucher inválido, inativo ou expirado");
      }
      if (voucher.maxUses !== null && voucher.currentUses >= voucher.maxUses) {
        throw new VoucherRedemptionRejectedError("Este voucher atingiu o limite total de usos");
      }
      const uses = await tx.voucherRedemption.count({ where: { voucherId: desiredVoucherId, userId: input.userId } });
      if (uses >= voucher.maxUsesPerUser) {
        throw new VoucherRedemptionRejectedError("Ya alcanzaste el límite de uso de este cupón");
      }
      maximumFreeVoucherUses = voucher.maxUses;
    }
    const hasVoucherConflict =
      Boolean(existingVoucherId) &&
      (desiredVoucherId === null || desiredVoucherId !== existingVoucherId);

    const effectiveVoucherId =
      preserveExistingVoucher && existingVoucherId && hasVoucherConflict
        ? existingVoucherId
        : desiredVoucherId;

    if (preserveExistingVoucher && hasVoucherConflict) {
      console.info("[COURSE_PURCHASE_SYNC_VOUCHER_CONFLICT_PRESERVED]", {
        userId: input.userId,
        courseId: input.courseId,
        purchaseId: existingPurchase?.id ?? null,
        existingVoucherId,
        incomingVoucherId: desiredVoucherId,
      });
    }

    const purchase = await tx.purchase.upsert({
      where: {
        userId_courseId: {
          userId: input.userId,
          courseId: input.courseId,
        },
      },
      update: {
        providerReferenceId: input.providerReferenceId,
        voucherId: effectiveVoucherId,
        originalPrice,
        finalPrice,
        discountAmount,
      },
      create: {
        courseId: input.courseId,
        userId: input.userId,
        providerReferenceId: input.providerReferenceId,
        voucherId: effectiveVoucherId,
        originalPrice,
        finalPrice,
        discountAmount,
      },
    });

    if (effectiveVoucherId) {
      if (!existingRedemption) {
        await tx.voucherRedemption.create({
          data: {
            voucherId: effectiveVoucherId,
            userId: input.userId,
            purchaseId: purchase.id,
          },
        });

        await incrementVoucherUsage(tx, effectiveVoucherId, maximumFreeVoucherUses);
      } else if (existingRedemption.voucherId !== effectiveVoucherId) {
        await decrementVoucherUsage(tx, existingRedemption.voucherId);
        await incrementVoucherUsage(tx, effectiveVoucherId, maximumFreeVoucherUses);

        await tx.voucherRedemption.update({
          where: {
            id: existingRedemption.id,
          },
          data: {
            voucherId: effectiveVoucherId,
          },
        });
      }
    } else if (existingRedemption) {
      await decrementVoucherUsage(tx, existingRedemption.voucherId);

      await tx.voucherRedemption.delete({
        where: {
          id: existingRedemption.id,
        },
      });
    }

    const runDiscountSyncStep = async (
      operation: string,
      callback: () => Promise<void>,
    ) => {
      try {
        await callback();
      } catch (error) {
        if (!isMissingRelationOrColumnError(error)) {
          throw error;
        }

        console.warn("[COURSE_PURCHASE_SYNC_DISCOUNT_SCHEMA_MISMATCH]", {
          operation,
          userId: input.userId,
          courseId: input.courseId,
          diagnostic: safeErrorDiagnostic(error),
        });
      }
    };

    if (discountAmount > 0 || existingPurchase || effectiveVoucherId) {
      await runDiscountSyncStep("upsert", async () => {
        await tx.discountApplied.upsert({
          where: {
            purchaseId: purchase.id,
          },
          update: {
            voucherId: effectiveVoucherId,
            originalPrice,
            discountAmount,
            finalPrice,
          },
          create: {
            purchaseId: purchase.id,
            voucherId: effectiveVoucherId,
            originalPrice,
            discountAmount,
            finalPrice,
          },
        });
      });
    }

    if (discountAmount <= 0 && !effectiveVoucherId) {
      await runDiscountSyncStep("deleteMany", async () => {
        await tx.discountApplied.deleteMany({
          where: {
            purchaseId: purchase.id,
          },
        });
      });
    }
  });
}

export async function revertCoursePurchaseByProviderReferenceId(
  providerReferenceId: string,
) {
  const prisma = db;

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    if (providerReferenceId.startsWith("dodo-pay:")) {
      await lockPaymentReference(tx, providerReferenceId);
      if (!(await isDodoPaymentRevoked(tx, providerReferenceId))) return;
    }
    const purchase = await tx.purchase.findFirst({
      where: {
        providerReferenceId,
      },
      include: {
        redemption: {
          select: {
            id: true,
            voucherId: true,
          },
        },
      },
    });

    if (!purchase) {
      return;
    }

    if (purchase.redemption?.voucherId) {
      await decrementVoucherUsage(tx, purchase.redemption.voucherId);
    }

    await tx.discountApplied.deleteMany({
      where: {
        purchaseId: purchase.id,
      },
    });

    await tx.voucherRedemption.deleteMany({
      where: {
        purchaseId: purchase.id,
      },
    });

    await tx.purchase.delete({
      where: {
        id: purchase.id,
      },
    });
  });
}
