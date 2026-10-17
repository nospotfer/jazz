"use client";

import type { CourseCompletionRecognitionSnapshot } from "@/lib/lesson-quiz";
import { useOwnerScopedResource } from "@/hooks/use-owner-scoped-resource";

const emptySnapshot: CourseCompletionRecognitionSnapshot = {
  isEligible: false,
  completedLessons: 0,
  totalLessons: 0,
  completionPercent: 0,
  quizzesWithMedalCount: 0,
  scorePercent: 0,
  medal: "NONE",
};

export function useUserCourseCompletionRecognition(initialRecognition: CourseCompletionRecognitionSnapshot | null = null) {
  const { value: recognition, isLoading, setValue: setRecognition } = useOwnerScopedResource<CourseCompletionRecognitionSnapshot | null>({
    path: "/api/dashboard/course-completion-recognition", initialValue: initialRecognition, emptyValue: null,
    intervalMs: 300000, initialDelayMs: initialRecognition ? 300000 : 0,
  });
  return { recognition: recognition ?? emptySnapshot, isLoading, setRecognition };
}
