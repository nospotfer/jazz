let paymentMethodModalPromise: Promise<typeof import('@/components/payment/payment-method-modal')> | null = null;

export function loadPaymentMethodModal() {
  if (!paymentMethodModalPromise) {
    paymentMethodModalPromise = import('@/components/payment/payment-method-modal');
  }

  return paymentMethodModalPromise;
}

export function warmPaymentMethodModal() {
  void loadPaymentMethodModal();
}