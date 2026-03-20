'use client';

import { useEffect, useState } from 'react';

import type { CourseCompletionRecognitionSnapshot } from '@/lib/lesson-quiz';

const emptySnapshot: CourseCompletionRecognitionSnapshot = {
  isEligible: false,
  completedLessons: 0,
  totalLessons: 0,
  completionPercent: 0,
  quizzesWithMedalCount: 0,
  scorePercent: 0,
  medal: 'NONE',
};

export function useUserCourseCompletionRecognition(
  initialRecognition: CourseCompletionRecognitionSnapshot | null = null
) {
  const [recognition, setRecognition] = useState<CourseCompletionRecognitionSnapshot | null>(
    initialRecognition
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setRecognition(initialRecognition);
  }, [initialRecognition]);

  useEffect(() => {
    let isMounted = true;
    let intervalId: number | null = null;

    const loadRecognition = async () => {
      if (document.visibilityState === 'hidden') {
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch('/api/dashboard/course-completion-recognition', {
          cache: 'no-store',
        });
        const data = (await response.json()) as CourseCompletionRecognitionSnapshot;

        if (isMounted) {
          setRecognition(data);
        }
      } catch {
        if (isMounted) {
          setRecognition(initialRecognition ?? emptySnapshot);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void loadRecognition();
      }
    };

    if (!initialRecognition) {
      void loadRecognition();
    }

    intervalId = window.setInterval(() => {
      void loadRecognition();
    }, 300000);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
    };
  }, [initialRecognition]);

  return {
    recognition: recognition ?? emptySnapshot,
    isLoading,
    setRecognition,
  };
}
