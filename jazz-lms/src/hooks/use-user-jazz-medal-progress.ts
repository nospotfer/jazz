"use client";

import type { UserJazzMedalProgress } from "@/lib/lesson-quiz";
import { useOwnerScopedResource } from "@/hooks/use-owner-scoped-resource";

export function useUserJazzMedalProgress(initialProgress: UserJazzMedalProgress | null = null) {
  const { value: progress, isLoading, setValue: setProgress } = useOwnerScopedResource<UserJazzMedalProgress | null>({
    path: "/api/dashboard/quiz-medals", initialValue: initialProgress, emptyValue: null,
    intervalMs: 300000, initialDelayMs: initialProgress ? 300000 : 900,
  });
  return { progress, isLoading, setProgress };
}
