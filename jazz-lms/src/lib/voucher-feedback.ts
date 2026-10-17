import type { SupportedLanguage } from '@/lib/language';
import type { VoucherValidationError } from '@/lib/vouchers';

export type VoucherFailureReason = VoucherValidationError
  | 'Price unavailable'
  | 'Already purchased'
  | 'Unauthorized'
  | 'Too many attempts'
  | 'Service unavailable'
  | 'Failed';

const failureCopy: Record<SupportedLanguage, Record<VoucherFailureReason, string>> = {
  es: {
    'Missing parameters': 'Introduce un código y selecciona el curso.',
    'Invalid code': 'El código no es válido para este curso.',
    Expired: 'Este código ha caducado.',
    'Max uses reached': 'Este código ha alcanzado su límite de usos.',
    'Max uses per user reached': 'Ya has alcanzado tu límite de uso de este código.',
    Inactive: 'Este código ya no está activo.',
    'Course not found': 'No se encontró el curso para este código.',
    'Price unavailable': 'El precio del curso no está disponible temporalmente. Inténtalo más tarde.',
    'Below minimum order value': 'El precio del curso no alcanza el importe mínimo de este código.',
    'Voucher type mismatch': 'Este código de descuento debe aplicarse al comprar el curso.',
    'Already purchased': 'Ya tienes acceso a este curso.',
    Unauthorized: 'Inicia sesión para canjear este código.',
    'Too many attempts': 'Demasiados intentos. Espera un momento y vuelve a intentarlo.',
    'Service unavailable': 'Los códigos no están disponibles temporalmente. Inténtalo más tarde.',
    Failed: 'No se pudo procesar este código. Vuelve a intentarlo.',
  },
  en: {
    'Missing parameters': 'Enter a code and select the course.',
    'Invalid code': 'This code is not valid for this course.',
    Expired: 'This code has expired.',
    'Max uses reached': 'This code has reached its usage limit.',
    'Max uses per user reached': 'You have already reached your usage limit for this code.',
    Inactive: 'This code is no longer active.',
    'Course not found': 'The course for this code was not found.',
    'Price unavailable': 'The course price is temporarily unavailable. Please try again later.',
    'Below minimum order value': 'The course price is below this code’s minimum amount.',
    'Voucher type mismatch': 'Apply this discount code when purchasing the course.',
    'Already purchased': 'You already have access to this course.',
    Unauthorized: 'Sign in to redeem this code.',
    'Too many attempts': 'Too many attempts. Please wait a moment and try again.',
    'Service unavailable': 'Voucher codes are temporarily unavailable. Please try again later.',
    Failed: 'We could not process this code. Please try again.',
  },
  fr: {
    'Missing parameters': 'Saisissez un code et sélectionnez le cours.',
    'Invalid code': 'Ce code n’est pas valable pour ce cours.',
    Expired: 'Ce code a expiré.',
    'Max uses reached': 'Ce code a atteint sa limite d’utilisation.',
    'Max uses per user reached': 'Vous avez déjà atteint votre limite d’utilisation de ce code.',
    Inactive: 'Ce code n’est plus actif.',
    'Course not found': 'Le cours associé à ce code est introuvable.',
    'Price unavailable': 'Le prix du cours est temporairement indisponible. Réessayez plus tard.',
    'Below minimum order value': 'Le prix du cours est inférieur au montant minimum de ce code.',
    'Voucher type mismatch': 'Appliquez ce code promo lors de l’achat du cours.',
    'Already purchased': 'Vous avez déjà accès à ce cours.',
    Unauthorized: 'Connectez-vous pour utiliser ce code.',
    'Too many attempts': 'Trop de tentatives. Patientez un moment, puis réessayez.',
    'Service unavailable': 'Les codes sont temporairement indisponibles. Réessayez plus tard.',
    Failed: 'Impossible de traiter ce code. Veuillez réessayer.',
  },
  pt: {
    'Missing parameters': 'Digite um código e selecione o curso.',
    'Invalid code': 'Este código não é válido para este curso.',
    Expired: 'Este código expirou.',
    'Max uses reached': 'Este código atingiu o limite de usos.',
    'Max uses per user reached': 'Você já atingiu seu limite de uso deste código.',
    Inactive: 'Este código não está mais ativo.',
    'Course not found': 'O curso deste código não foi encontrado.',
    'Price unavailable': 'O preço do curso está temporariamente indisponível. Tente novamente mais tarde.',
    'Below minimum order value': 'O preço do curso está abaixo do valor mínimo deste código.',
    'Voucher type mismatch': 'Aplique este código de desconto ao comprar o curso.',
    'Already purchased': 'Você já tem acesso a este curso.',
    Unauthorized: 'Entre na sua conta para resgatar este código.',
    'Too many attempts': 'Muitas tentativas. Aguarde um momento e tente novamente.',
    'Service unavailable': 'Os códigos estão temporariamente indisponíveis. Tente mais tarde.',
    Failed: 'Não foi possível processar este código. Tente novamente.',
  },
};

export function getVoucherFailureReason(payload: unknown, httpStatus?: number): VoucherFailureReason {
  // The server's reason/error values are the contract. Its localized prose and
  // arbitrary provider/transport responses must never become customer copy.
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const { reason, error } = payload as { reason?: unknown; error?: unknown };
    for (const value of [reason, error]) {
      if (typeof value === 'string' && Object.hasOwn(failureCopy.en, value)) {
        return value as VoucherFailureReason;
      }
    }
  }
  if (httpStatus === 401) return 'Unauthorized';
  if (httpStatus === 429) return 'Too many attempts';
  if (httpStatus && httpStatus >= 500) return 'Service unavailable';
  return 'Failed';
}

export function getVoucherFailureMessage(reason: VoucherFailureReason, language: SupportedLanguage): string {
  return failureCopy[language][reason];
}
