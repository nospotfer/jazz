import 'server-only';

/** Missing/empty legacy configuration keeps checkout enabled. A configured
 * value must be exactly "false" to enable it; typos must not reopen purchases.
 */
export function isCheckoutDisabled(): boolean {
  const value = process.env.CHECKOUT_DISABLED;
  return value !== undefined && value !== '' && value !== 'false';
}
