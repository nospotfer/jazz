export const PROFILE_AVATAR_OPTIONS = [
  '/avatars/jazz-cat-1.svg',
  '/avatars/jazz-cat-2.svg',
  '/avatars/jazz-saxophone.svg',
  '/avatars/jazz-trumpet.svg',
  '/avatars/jazz-piano.svg',
  '/avatars/jazz-drummer.svg',
  '/avatars/jazz-guitar.svg',
  '/avatars/jazz-vocal.svg',
] as const;

export type ProfileAvatar = (typeof PROFILE_AVATAR_OPTIONS)[number];

export function getRandomProfileAvatar(): ProfileAvatar {
  const randomIndex = Math.floor(Math.random() * PROFILE_AVATAR_OPTIONS.length);
  return PROFILE_AVATAR_OPTIONS[randomIndex];
}

export function isKnownProfileAvatar(value: string | null | undefined): value is ProfileAvatar {
  if (!value) return false;
  return PROFILE_AVATAR_OPTIONS.includes(value as ProfileAvatar);
}

export function getDeterministicProfileAvatar(seed: string): ProfileAvatar {
  const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return PROFILE_AVATAR_OPTIONS[hash % PROFILE_AVATAR_OPTIONS.length];
}

export function resolveProfileAvatar(userId: string, avatarUrl?: string | null): ProfileAvatar {
  if (isKnownProfileAvatar(avatarUrl)) {
    return avatarUrl;
  }

  return getDeterministicProfileAvatar(userId);
}
