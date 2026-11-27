import { db } from '@/lib/db';
import { getVoucherProviderDiscountCode } from '@/lib/voucher-provider-sync';
import { getKnownCatalogPrice } from '@/lib/pricing';
import type { Prisma } from '@prisma/client';

export type VoucherTypeValue = 'FREE_ACCESS' | 'DISCOUNT_PERCENT' | 'DISCOUNT_FIXED';

export type VoucherValidationError =
  | 'Missing parameters'
  | 'Invalid code'
  | 'Expired'
  | 'Max uses reached'
  | 'Max uses per user reached'
  | 'Inactive'
  | 'Course not found'
  | 'Price unavailable'
  | 'Below minimum order value'
  | 'Voucher type mismatch';

export type VoucherValidationResult =
  | {
      valid: false;
      error: VoucherValidationError;
      message: string;
    }
  | {
      valid: true;
      voucher: {
        id: string;
        code: string;
        providerDiscountCode: string;
        type: VoucherTypeValue;
        discountPercent: number;
        discountAmount: number;
        maxUses: number | null;
        currentUses: number;
        maxUsesPerUser: number;
        isActive: boolean;
        expiresAt: Date | null;
        minOrderValue: number | null;
        metadata: unknown;
      };
      type: VoucherTypeValue;
      /** Exact server-read catalog value; monetary display fields remain rounded. */
      catalogPrice: number;
      originalPrice: number;
      discount: number;
      finalPrice: number;
      discountPercent: number;
      isFree: boolean;
      message: string;
      savings: string;
    };

type ValidateVoucherInput = {
  code: string;
  courseId: string;
  userId?: string;
  requiredType?: VoucherTypeValue;
};

type ValidVoucherQuote = Extract<VoucherValidationResult, { valid: true }>;
type CourseGrantSnapshot = { id: string; price: number | null; isPublished: boolean };
type VoucherReader = Pick<Prisma.TransactionClient, 'course' | 'voucherCode' | 'voucherRedemption'>;

export class VoucherGrantError extends Error {
  readonly reason: VoucherValidationError | 'Quote changed';
  readonly status: number;

  constructor(reason: VoucherValidationError | 'Quote changed', message: string) {
    super(message);
    this.name = 'VoucherGrantError';
    this.reason = reason;
    this.status = reason === 'Price unavailable' ? 503 :
      ['Quote changed', 'Max uses reached', 'Max uses per user reached'].includes(reason) ? 409 : 400;
  }
}

/** Call after the voucher advisory lock when granting with a voucher. Keep this
 * lock until every entitlement/accounting write has committed or rolled back. */
export async function lockPublishedCourseForGrant(
  tx: Prisma.TransactionClient,
  courseId: string,
  expectedPrice: number,
): Promise<CourseGrantSnapshot> {
  const rows = await tx.$queryRaw<CourseGrantSnapshot[]>`
    SELECT id, price, "isPublished" FROM "Course" WHERE id = ${courseId} FOR NO KEY UPDATE
  `;
  const course = rows[0];
  if (!course || course.isPublished !== true) {
    throw new VoucherGrantError('Course not found', 'Curso no disponible.');
  }
  const price = getKnownCatalogPrice(course.price);
  if (price === null) {
    throw new VoucherGrantError('Price unavailable', 'Precio del curso temporalmente no disponible.');
  }
  if (getKnownCatalogPrice(expectedPrice) === null || price !== expectedPrice) {
    throw new VoucherGrantError('Quote changed', 'El curso cambió. Vuelve a validar el cupón.');
  }
  return course;
}

/** The expected quote must be this request's verified server validator result,
 * never a client quote. Recompute through the transaction client under the
 * retained course lock; preserve the caller's existing voucher lock ordering. */
export async function revalidateVoucherForGrant(
  tx: Prisma.TransactionClient,
  input: ValidateVoucherInput,
  expected: ValidVoucherQuote,
): Promise<ValidVoucherQuote> {
  const course = await lockPublishedCourseForGrant(tx, input.courseId, expected.catalogPrice);
  const current = await validateVoucherAgainstCourse(input, tx, course);
  if (!current.valid) throw new VoucherGrantError(current.error, current.message);
  if (!expected.isFree || !current.isFree ||
      current.voucher.id !== expected.voucher.id || current.voucher.code !== expected.voucher.code ||
      current.voucher.providerDiscountCode !== expected.voucher.providerDiscountCode ||
      current.voucher.type !== expected.voucher.type ||
      current.originalPrice !== expected.originalPrice || current.discount !== expected.discount ||
      current.finalPrice !== expected.finalPrice) {
    throw new VoucherGrantError('Quote changed', 'El curso o el cupón cambió. Vuelve a validar el cupón.');
  }
  return current;
}

function toMoney(value: number): number {
  return Number(value.toFixed(2));
}

function formatBRL(value: number): string {
  return `R$ ${toMoney(value).toFixed(2)}`;
}

export async function validateVoucherForCourse(input: ValidateVoucherInput): Promise<VoucherValidationResult> {
  return validateVoucherAgainstCourse(input, db);
}

async function validateVoucherAgainstCourse({
  code,
  courseId,
  userId,
  requiredType,
}: ValidateVoucherInput, prisma: VoucherReader, lockedCourse?: CourseGrantSnapshot): Promise<VoucherValidationResult> {
  if (!code || !courseId) {
    return {
      valid: false,
      error: 'Missing parameters',
      message: 'Parâmetros obrigatórios ausentes.',
    };
  }

  const normalizedCode = code.toUpperCase().trim();
  if (normalizedCode.length < 4 || normalizedCode.length > 12) {
    return {
      valid: false,
      error: 'Invalid code',
      message: 'O código de voucher é inválido.',
    };
  }
  const course = lockedCourse ?? await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, price: true, isPublished: true },
  });

  if (!course || course.isPublished !== true) {
    return {
      valid: false,
      error: 'Course not found',
      message: 'Curso não encontrado.',
    };
  }

  const knownPrice = getKnownCatalogPrice(course.price);
  if (knownPrice === null) {
    return {
      valid: false,
      error: 'Price unavailable',
      message: 'Preço do curso temporariamente indisponível.',
    };
  }
  const originalPrice = toMoney(knownPrice);

  const voucher = await prisma.voucherCode.findFirst({
    where: {
      code: normalizedCode,
      OR: [{ courseId }, { courseId: null }],
    },
    select: {
      id: true,
      code: true,
      type: true,
      discountPercent: true,
      discountAmount: true,
      minOrderValue: true,
      maxUses: true,
      currentUses: true,
      maxUsesPerUser: true,
      isActive: true,
      expiresAt: true,
      courseId: true,
      metadata: true,
    },
  });

  if (!voucher) {
    return {
      valid: false,
      error: 'Invalid code',
      message: 'O código de voucher é inválido.',
    };
  }

  if (!voucher.isActive) {
    return {
      valid: false,
      error: 'Inactive',
      message: 'Este voucher está inativo.',
    };
  }

  if (voucher.expiresAt && new Date() > voucher.expiresAt) {
    return {
      valid: false,
      error: 'Expired',
      message: 'Este voucher expirou.',
    };
  }

  if (voucher.maxUses !== null && voucher.currentUses >= voucher.maxUses) {
    return {
      valid: false,
      error: 'Max uses reached',
      message: 'Este voucher atingiu o limite total de usos.',
    };
  }

  if (requiredType && voucher.type !== requiredType) {
    return {
      valid: false,
      error: 'Voucher type mismatch',
      message: 'Tipo de voucher incompatível para esta operação.',
    };
  }

  if (userId) {
    const userRedemptionCount = await prisma.voucherRedemption.count({
      where: {
        voucherId: voucher.id,
        userId,
      },
    });

    if (userRedemptionCount >= voucher.maxUsesPerUser) {
      return {
        valid: false,
        error: 'Max uses per user reached',
        message: 'Você já atingiu o limite de uso deste voucher.',
      };
    }
  }

  if (voucher.minOrderValue !== null && originalPrice < voucher.minOrderValue) {
    return {
      valid: false,
      error: 'Below minimum order value',
      message: `Este voucher requer pedido mínimo de ${formatBRL(voucher.minOrderValue)}.`,
    };
  }

  let discount = 0;
  let discountPercent = 0;

  if (voucher.type === 'FREE_ACCESS') {
    discount = originalPrice;
    discountPercent = 100;
  } else if (voucher.type === 'DISCOUNT_PERCENT') {
    discountPercent = Math.max(0, Number(voucher.discountPercent ?? 0));
    discount = (originalPrice * discountPercent) / 100;
  } else if (voucher.type === 'DISCOUNT_FIXED') {
    discount = Math.max(0, Number(voucher.discountAmount ?? 0));
    discountPercent = originalPrice > 0 ? (discount / originalPrice) * 100 : 0;
  }

  discount = toMoney(Math.min(discount, originalPrice));
  const finalPrice = toMoney(Math.max(0, originalPrice - discount));
  const isFree = finalPrice <= 0;

  return {
    valid: true,
    voucher: {
      id: voucher.id,
      code: voucher.code,
      providerDiscountCode: getVoucherProviderDiscountCode(voucher.metadata, voucher.code),
      type: voucher.type,
      discountPercent: toMoney(Number(voucher.discountPercent ?? 0)),
      discountAmount: toMoney(Number(voucher.discountAmount ?? 0)),
      maxUses: voucher.maxUses,
      currentUses: voucher.currentUses,
      maxUsesPerUser: voucher.maxUsesPerUser,
      isActive: voucher.isActive,
      expiresAt: voucher.expiresAt,
      minOrderValue: voucher.minOrderValue,
      metadata: voucher.metadata,
    },
    type: voucher.type,
    catalogPrice: knownPrice,
    originalPrice,
    discount,
    finalPrice,
    discountPercent: toMoney(discountPercent),
    isFree,
    message: isFree
      ? 'Acesso gratuito aplicado!'
      : `Voucher aplicado. Você economiza ${formatBRL(discount)}.`,
    savings: `Economize ${formatBRL(discount)}`,
  };
}
