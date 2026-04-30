import { db } from '@/lib/db';
import { getVoucherProviderDiscountCode } from '@/lib/voucher-provider-sync';

export type VoucherTypeValue = 'FREE_ACCESS' | 'DISCOUNT_PERCENT' | 'DISCOUNT_FIXED';

export type VoucherValidationError =
  | 'Missing parameters'
  | 'Invalid code'
  | 'Expired'
  | 'Max uses reached'
  | 'Max uses per user reached'
  | 'Inactive'
  | 'Course not found'
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
      };
      type: VoucherTypeValue;
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

function toMoney(value: number): number {
  return Number(value.toFixed(2));
}

function formatBRL(value: number): string {
  return `R$ ${toMoney(value).toFixed(2)}`;
}

export async function validateVoucherForCourse({
  code,
  courseId,
  userId,
  requiredType,
}: ValidateVoucherInput): Promise<VoucherValidationResult> {
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
  const prisma = db;
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

  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { id: true, price: true },
  });

  if (!course) {
    return {
      valid: false,
      error: 'Course not found',
      message: 'Curso não encontrado.',
    };
  }

  const originalPrice = toMoney(Math.max(0, Number(course.price ?? 0)));
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
    },
    type: voucher.type,
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
