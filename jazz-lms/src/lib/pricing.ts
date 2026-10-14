export const DEFAULT_FULL_COURSE_PRICE_EUR = 29.99;

// A known zero is valid; absent or malformed catalog amounts stay unavailable.
export function getKnownCatalogPrice(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
}
export const DEFAULT_LESSON_DURATION_MINUTES = 20;
export const DEFAULT_COURSE_LESSON_COUNT = 15;
