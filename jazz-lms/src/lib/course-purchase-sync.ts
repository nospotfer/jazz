import { db } from "@/lib/db";

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
  preserveExistingVoucher?: boolean;
};

type LooseObject = Record<string, unknown>;

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
  prisma: any,
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
  prisma: any,
  input: UpsertCoursePurchaseInput,
): Promise<string | null> {
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
        not: null,
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

async function incrementVoucherUsage(tx: any, voucherId: string) {
  await tx.voucherCode.update({
    where: { id: voucherId },
    data: {
      currentUses: {
        increment: 1,
      },
    },
  });
}

async function decrementVoucherUsage(tx: any, voucherId: string) {
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
  const prisma = db as any;
  const desiredVoucherId = await resolveVoucherByInput(prisma, input);
  const originalPrice = toMoney(input.originalPrice);
  const discountAmount = toMoney(input.discountAmount);
  const finalPrice = toMoney(input.finalPrice);
  const preserveExistingVoucher = input.preserveExistingVoucher !== false;

  await prisma.$transaction(async (tx: any) => {
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
        providerReferenceId: input.providerReferenceId,
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

        await incrementVoucherUsage(tx, effectiveVoucherId);
      } else if (existingRedemption.voucherId !== effectiveVoucherId) {
        await decrementVoucherUsage(tx, existingRedemption.voucherId);
        await incrementVoucherUsage(tx, effectiveVoucherId);

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
          providerReferenceId: input.providerReferenceId,
          message: toErrorMessage(error),
          code: toErrorCode(error),
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
  const prisma = db as any;

  await prisma.$transaction(async (tx: any) => {
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
