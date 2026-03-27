"use client";

import { createClient } from "@/utils/supabase/client";
import type { AuthChangeEvent } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import type { CourseCompletionRecognitionSnapshot } from "@/lib/lesson-quiz";

const emptySnapshot: CourseCompletionRecognitionSnapshot = {
  isEligible: false,
  completedLessons: 0,
  totalLessons: 0,
  completionPercent: 0,
  quizzesWithMedalCount: 0,
  scorePercent: 0,
  medal: "NONE",
};

export function useUserCourseCompletionRecognition(
  initialRecognition: CourseCompletionRecognitionSnapshot | null = null,
) {
  const [recognition, setRecognition] =
    useState<CourseCompletionRecognitionSnapshot | null>(initialRecognition);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setRecognition(initialRecognition);
  }, [initialRecognition]);

  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;
    let intervalId: number | null = null;
    let requestController: AbortController | null = null;

    const stopPolling = () => {
      if (intervalId !== null) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
    };

    const hasSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return Boolean(session);
    };

    const loadRecognition = async () => {
      if (document.visibilityState === "hidden") {
        return;
      }

      if (!(await hasSession())) {
        stopPolling();
        if (isMounted) {
          setIsLoading(false);
          setRecognition(initialRecognition ?? emptySnapshot);
        }
        return;
      }

      setIsLoading(true);

      requestController?.abort();
      requestController = new AbortController();

      try {
        const response = await fetch(
          "/api/dashboard/course-completion-recognition",
          {
            cache: "no-store",
            signal: requestController.signal,
          },
        );

        if (response.status === 401) {
          if (isMounted) {
            setRecognition(initialRecognition ?? emptySnapshot);
          }
          stopPolling();
          return;
        }

        const data =
          (await response.json()) as CourseCompletionRecognitionSnapshot;

        if (isMounted) {
          setRecognition(data);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
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
      if (document.visibilityState === "visible") {
        void loadRecognition();
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent) => {
      if (!isMounted) return;

      if (event === "SIGNED_OUT") {
        requestController?.abort();
        stopPolling();
        setRecognition(initialRecognition ?? emptySnapshot);
        setIsLoading(false);
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        void loadRecognition();
        if (intervalId === null) {
          intervalId = window.setInterval(() => {
            void loadRecognition();
          }, 300000);
        }
      }
    });

    if (!initialRecognition) {
      void loadRecognition();
    }

    intervalId = window.setInterval(() => {
      void loadRecognition();
    }, 300000);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      requestController?.abort();

      stopPolling();
    };
  }, [initialRecognition]);

  return {
    recognition: recognition ?? emptySnapshot,
    isLoading,
    setRecognition,
  };
}
