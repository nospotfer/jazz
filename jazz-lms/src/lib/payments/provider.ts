import {
  createLemonCheckout,
  getLemonConfig,
  isLemonConfigured,
  type LemonCheckoutInput,
} from "@/lib/lemon-squeezy";
import {
  createDodoCheckout,
  getDodoConfig,
  isDodoConfigured,
} from "@/lib/payments/providers/dodo";

export type PaymentProvider = "dodo" | "lemon";

export type ProviderCheckoutInput = {
  email: string;
  successUrl: string;
  customData: Record<string, string>;
  providerDiscountCode?: string;
};

function normalizeProvider(value: string | null | undefined): PaymentProvider {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "lemon") {
    return "lemon";
  }

  return "dodo";
}

export function getPaymentProvider(): PaymentProvider {
  return normalizeProvider(process.env.PAYMENT_PROVIDER);
}

export function isActivePaymentProviderConfigured(
  provider = getPaymentProvider(),
): boolean {
  if (provider === "lemon") {
    return isLemonConfigured();
  }

  return isDodoConfigured();
}

export function getProviderVoucherReferencePrefix(
  provider = getPaymentProvider(),
): string {
  return provider === "lemon" ? "ls-voucher" : "dodo-voucher";
}

export function getProviderOrderReferencePrefix(
  provider = getPaymentProvider(),
): string {
  return provider === "lemon" ? "ls-order" : "dodo-pay";
}

export async function createProviderCheckout(
  input: ProviderCheckoutInput,
  provider = getPaymentProvider(),
): Promise<string> {
  if (provider === "lemon") {
    const lemonConfig = getLemonConfig();
    const lemonCheckoutInput: LemonCheckoutInput = {
      storeId: lemonConfig.storeId as string,
      variantId: lemonConfig.variantId as string,
      email: input.email,
      successUrl: input.successUrl,
      customData: input.customData,
      discountCode: input.providerDiscountCode,
    };

    return createLemonCheckout(lemonCheckoutInput);
  }

  const dodoConfig = getDodoConfig();

  return createDodoCheckout({
    productId: dodoConfig.productId as string,
    email: input.email,
    returnUrl: input.successUrl,
    metadata: input.customData,
    discountCode: input.providerDiscountCode,
  });
}
