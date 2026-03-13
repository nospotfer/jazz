'use client';

import { useEffect, useState } from 'react';

import type { UserJazzMedalProgress } from '@/lib/lesson-quiz';

export function useUserJazzMedalProgress(initialProgress: UserJazzMedalProgress | null = null) {
  const [progress, setProgress] = useState<UserJazzMedalProgress | null>(initialProgress);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setProgress(initialProgress);
  }, [initialProgress]);

  useEffect(() => {
    let isMounted = true;
    let intervalId: number | null = null;

    const loadProgress = async () => {
      if (document.visibilityState === 'hidden') {
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch('/api/dashboard/quiz-medals', {
          cache: 'no-store',
        });
        const data = (await response.json()) as UserJazzMedalProgress;

        if (isMounted) {
          setProgress(data);
        }
      } catch {
        if (isMounted && initialProgress) {
          setProgress(initialProgress);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void loadProgress();
      }
    };

    void loadProgress();
    intervalId = window.setInterval(() => {
      void loadProgress();
    }, 60000);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
    };
  }, [initialProgress]);

  return {
    progress,
    isLoading,
    setProgress,
  };
}