const PLACEHOLDER_HINTS = ['your-project', 'your-anon-key', 'your_service_role_key'];

function isPlaceholder(value?: string) {
  if (!value) return true;
  const normalized = value.toLowerCase();
  return PLACEHOLDER_HINTS.some((hint) => normalized.includes(hint));
}

export function hasValidSupabasePublicConfig(url?: string, anonKey?: string) {
  return Boolean(url && anonKey && !isPlaceholder(url) && !isPlaceholder(anonKey));
}

export function hasValidSupabaseServerConfig(
  url?: string,
  anonKey?: string,
  serviceRoleKey?: string
) {
  if (!hasValidSupabasePublicConfig(url, anonKey)) return false;
  return Boolean(serviceRoleKey && !isPlaceholder(serviceRoleKey));
}
