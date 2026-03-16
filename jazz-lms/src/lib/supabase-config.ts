const PLACEHOLDER_HINTS = ['your-project', 'your-anon-key', 'your_service_role_key'];

function isPlaceholder(value?: string) {
  if (!value) return true;
  const normalized = value.toLowerCase();
  return PLACEHOLDER_HINTS.some((hint) => normalized.includes(hint));
}

export function hasValidSupabasePublicConfig(url?: string, anonKey?: string) {
  if (isPlaceholder(url) || isPlaceholder(anonKey)) {
    return false;
  }

  return Boolean(url && anonKey);
}

export function normalizeSupabaseUrl(url?: string) {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return null;
  }
}

export function hasValidSupabaseServerConfig(
  url?: string,
  anonKey?: string,
  serviceRoleKey?: string
) {
  if (!hasValidSupabasePublicConfig(url, anonKey)) return false;
  if (isPlaceholder(serviceRoleKey)) {
    return false;
  }

  return Boolean(serviceRoleKey);
}
