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
    let timeoutId: number | null = null;
    let idleCallbackId: number | null = null;

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

    if (!initialProgress) {
      if (typeof window.requestIdleCallback === 'function') {
        idleCallbackId = window.requestIdleCallback(() => {
          void loadProgress();
        }, { timeout: 1800 });
      } else {
        timeoutId = window.setTimeout(() => {
          void loadProgress();
        }, 900);
      }
    }

    intervalId = window.setInterval(() => {
      void loadProgress();
    }, 300000);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      if (idleCallbackId !== null && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleCallbackId);
      }

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

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