import {
  createDodoCheckout,
  getDodoConfig,
  isDodoConfigured,
} from "@/lib/payments/providers/dodo";

export type PaymentProvider = "dodo";

export type ProviderCheckoutInput = {
  email: string;
  successUrl: string;
  customData: Record<string, string>;
  providerDiscountCode?: string;
};

function normalizeProvider(): PaymentProvider {
  return "dodo";
}

export function getPaymentProvider(): PaymentProvider {
  return normalizeProvider();
}

export function isActivePaymentProviderConfigured(
  provider = getPaymentProvider(),
): boolean {
  void provider;
  return isDodoConfigured();
}

export function getProviderVoucherReferencePrefix(
  provider = getPaymentProvider(),
): string {
  void provider;
  return "dodo-voucher";
}

export function getProviderOrderReferencePrefix(
  provider = getPaymentProvider(),
): string {
  void provider;
  return "dodo-pay";
}

export async function createProviderCheckout(
  input: ProviderCheckoutInput,
  provider = getPaymentProvider(),
): Promise<string> {
  void provider;

  const dodoConfig = getDodoConfig();

  return createDodoCheckout({
    productId: dodoConfig.productId as string,
    email: input.email,
    returnUrl: input.successUrl,
    metadata: input.customData,
    discountCode: input.providerDiscountCode,
  });
}
