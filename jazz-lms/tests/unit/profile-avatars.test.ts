import { describe, expect, test } from 'vitest';
import {
  PROFILE_AVATAR_OPTIONS,
  getRandomProfileAvatar,
  isKnownProfileAvatar,
  getDeterministicProfileAvatar,
  resolveProfileAvatar,
} from '@/lib/profile-avatars';

describe('PROFILE_AVATAR_OPTIONS', () => {
  test('has 8 avatar options', () => {
    expect(PROFILE_AVATAR_OPTIONS).toHaveLength(8);
  });

  test('all paths start with /avatars/ and end with .svg', () => {
    for (const path of PROFILE_AVATAR_OPTIONS) {
      expect(path).toMatch(/^\/avatars\/jazz-.+\.svg$/);
    }
  });
});

describe('getRandomProfileAvatar', () => {
  test('returns a known avatar path', () => {
    const avatar = getRandomProfileAvatar();
    expect(PROFILE_AVATAR_OPTIONS).toContain(avatar);
  });
});

describe('isKnownProfileAvatar', () => {
  test('returns true for known avatars', () => {
    expect(isKnownProfileAvatar('/avatars/jazz-cat-1.svg')).toBe(true);
    expect(isKnownProfileAvatar('/avatars/jazz-trumpet.svg')).toBe(true);
  });

  test('returns false for null/undefined/empty', () => {
    expect(isKnownProfileAvatar(null)).toBe(false);
    expect(isKnownProfileAvatar(undefined)).toBe(false);
    expect(isKnownProfileAvatar('')).toBe(false);
  });

  test('returns false for unknown paths', () => {
    expect(isKnownProfileAvatar('/avatars/jazz-unknown.svg')).toBe(false);
    expect(isKnownProfileAvatar('random-string')).toBe(false);
  });
});

describe('getDeterministicProfileAvatar', () => {
  test('returns consistent avatar for same seed', () => {
    const a = getDeterministicProfileAvatar('user-123');
    const b = getDeterministicProfileAvatar('user-123');
    expect(a).toBe(b);
  });

  test('returns a valid avatar path', () => {
    const avatar = getDeterministicProfileAvatar('some-seed');
    expect(PROFILE_AVATAR_OPTIONS).toContain(avatar);
  });

  test('different seeds can produce different avatars', () => {
    const results = new Set<string>();
    for (let i = 0; i < 100; i++) {
      results.add(getDeterministicProfileAvatar(`seed-${i}`));
    }
    expect(results.size).toBeGreaterThan(1);
  });
});

describe('resolveProfileAvatar', () => {
  test('returns known avatar when provided', () => {
    const result = resolveProfileAvatar('user-1', '/avatars/jazz-cat-1.svg');
    expect(result).toBe('/avatars/jazz-cat-1.svg');
  });

  test('falls back to deterministic avatar when provided avatar is unknown', () => {
    const result = resolveProfileAvatar('user-1', 'https://example.com/photo.jpg');
    expect(PROFILE_AVATAR_OPTIONS).toContain(result);
  });

  test('falls back to deterministic avatar when avatar is null', () => {
    const result = resolveProfileAvatar('user-1', null);
    expect(PROFILE_AVATAR_OPTIONS).toContain(result);
  });

  test('falls back to deterministic avatar when avatar is undefined', () => {
    const result = resolveProfileAvatar('user-1');
    expect(PROFILE_AVATAR_OPTIONS).toContain(result);
  });
});
