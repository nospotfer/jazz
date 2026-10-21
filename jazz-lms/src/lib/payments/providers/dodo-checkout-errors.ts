type DodoDiscountLimitScope = "customer" | "global" | "unknown";

export function classifyDodoDiscountLimit(message: string): DodoDiscountLimitScope | null {
  const normalized = message.toLowerCase().replace(/[_-]+/g, " ");
  const limit = normalized.includes("discount") && (
    normalized.includes("maximum redemptions") || normalized.includes("max redemptions") ||
    normalized.includes("reached its maximum") || normalized.includes("maximum uses") ||
    normalized.includes("max uses") || normalized.includes("usage limit") ||
    (normalized.includes("redemption") && (normalized.includes("limit") || normalized.includes("reached")))
  );
  if (!limit) return null;
  if (/\b(?:per |for (?:this |the )?)(?:customer|user|account)\b|\b(?:customer|user|account) (?:usage|redemption) limit\b/.test(normalized)) {
    return "customer";
  }
  // Other customer/account-qualified prose cannot establish global exhaustion.
  if (/\b(?:customer|user|account)\b/.test(normalized)) return "unknown";
  if (/\b(?:global|total|overall) (?:usage|redemption|limit)\b/.test(normalized) ||
      /\b(?:maximum|max) (?:redemptions|uses)\b/.test(normalized)) return "global";
  return "unknown";
}

/** Provider bodies stay private; only a finite scope survives safe errors.
 * Plain Errors retain conservative classification for older callers.
 */
export function getDodoDiscountLimitScope(error: unknown): DodoDiscountLimitScope | null {
  if (!(error instanceof Error)) return null;
  const failure = error as Error & { status?: unknown; discountLimitScope?: unknown };
  if (typeof failure.status === "number" && (failure.status < 400 || failure.status >= 500)) return null;
  const scope = failure.discountLimitScope;
  if (scope === "customer" || scope === "global" || scope === "unknown") return scope;
  return classifyDodoDiscountLimit(error.message);
}
