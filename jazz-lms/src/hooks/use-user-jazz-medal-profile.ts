'use client';

import { useEffect, useState } from 'react';

import type { UserJazzMedalProfileSnapshot } from '@/lib/lesson-quiz';
import type { SupportedLanguage } from '@/lib/language';

export function useUserJazzMedalProfile(language: SupportedLanguage) {
  const [profile, setProfile] = useState<UserJazzMedalProfileSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let intervalId: number | null = null;

    const loadProfile = async () => {
      if (document.visibilityState === 'hidden') {
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch(`/api/dashboard/quiz-medals/profile?language=${language}`, {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('Unable to load medal profile');
        }

        const data = (await response.json()) as UserJazzMedalProfileSnapshot;

        if (isMounted) {
          setProfile(data);
        }
      } catch {
        if (isMounted) {
          setProfile(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void loadProfile();
      }
    };

    void loadProfile();
    intervalId = window.setInterval(() => {
      void loadProfile();
    }, 60000);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
    };
  }, [language]);

  return {
    profile,
    isLoading,
  };
}