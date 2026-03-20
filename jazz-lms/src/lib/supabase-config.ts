const PLACEHOLDER_HINTS = ['your-project', 'your-anon-key', 'your_service_role_key'];

function isPlaceholder(value?: string) {
  if (!value) return true;
  const normalized = value.toLowerCase();
  return PLACEHOLDER_HINTS.some((hint) => normalized.includes(hint));
}

export function normalizeSupabaseUrl(url?: string) {
  if (!url) {
    return null;
  }

  const trimmed = url.trim();

  if (!trimmed) {
    return null;
  }

  return trimmed.replace(/\/+$/, '');
}

export function hasValidSupabasePublicConfig(url?: string, anonKey?: string) {
  if (isPlaceholder(url) || isPlaceholder(anonKey)) {
    return false;
  }

  return Boolean(url && anonKey);
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
