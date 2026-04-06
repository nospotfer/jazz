type SearchParamsLike = {
  get(key: string): string | null;
};

export function hasSuccessfulDashboardCheckoutReturn(
  searchParams: SearchParamsLike,
): boolean {
  const purchaseStatus = searchParams.get('purchase');
  const source = searchParams.get('source');

  return purchaseStatus === 'success' && source === 'dashboard';
}

export function shouldResetCheckoutTransientState(
  searchParams: SearchParamsLike,
): boolean {
  return !hasSuccessfulDashboardCheckoutReturn(searchParams);
}
