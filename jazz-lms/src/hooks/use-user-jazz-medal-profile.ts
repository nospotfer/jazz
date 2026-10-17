"use client";

import type { UserJazzMedalProfileSnapshot } from "@/lib/lesson-quiz";
import type { SupportedLanguage } from "@/lib/language";
import { useOwnerScopedResource } from "@/hooks/use-owner-scoped-resource";

export function useUserJazzMedalProfile(language: SupportedLanguage) {
  const { value: profile, isLoading } = useOwnerScopedResource<UserJazzMedalProfileSnapshot | null>({
    path: `/api/dashboard/quiz-medals/profile?language=${language}`, initialValue: null, emptyValue: null,
    intervalMs: 60000,
  });
  return { profile, isLoading };
}
