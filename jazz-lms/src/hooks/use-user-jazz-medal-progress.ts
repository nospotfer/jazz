"use client";

import { createClient } from "@/utils/supabase/client";
import type { AuthChangeEvent } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import type { UserJazzMedalProgress } from "@/lib/lesson-quiz";

export function useUserJazzMedalProgress(
  initialProgress: UserJazzMedalProgress | null = null,
) {
  const [progress, setProgress] = useState<UserJazzMedalProgress | null>(
    initialProgress,
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setProgress(initialProgress);
  }, [initialProgress]);

  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;
    let intervalId: number | null = null;
    let timeoutId: number | null = null;
    let idleCallbackId: number | null = null;
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

    const loadProgress = async () => {
      if (document.visibilityState === "hidden") {
        return;
      }

      if (!(await hasSession())) {
        stopPolling();
        if (isMounted) {
          setIsLoading(false);
          setProgress(initialProgress);
        }
        return;
      }

      setIsLoading(true);

      requestController?.abort();
      requestController = new AbortController();

      try {
        const response = await fetch("/api/dashboard/quiz-medals", {
          cache: "no-store",
          signal: requestController.signal,
        });

        if (response.status === 401) {
          if (isMounted) {
            setProgress(initialProgress);
          }
          stopPolling();
          return;
        }

        const data = (await response.json()) as UserJazzMedalProgress;

        if (isMounted) {
          setProgress(data);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
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
      if (document.visibilityState === "visible") {
        void loadProgress();
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent) => {
      if (!isMounted) return;

      if (event === "SIGNED_OUT") {
        requestController?.abort();
        stopPolling();
        setProgress(initialProgress);
        setIsLoading(false);
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        void loadProgress();
        if (intervalId === null) {
          intervalId = window.setInterval(() => {
            void loadProgress();
          }, 300000);
        }
      }
    });

    if (!initialProgress) {
      if (typeof window.requestIdleCallback === "function") {
        idleCallbackId = window.requestIdleCallback(
          () => {
            void loadProgress();
          },
          { timeout: 1800 },
        );
      } else {
        timeoutId = window.setTimeout(() => {
          void loadProgress();
        }, 900);
      }
    }

    intervalId = window.setInterval(() => {
      void loadProgress();
    }, 300000);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      requestController?.abort();

      if (
        idleCallbackId !== null &&
        typeof window.cancelIdleCallback === "function"
      ) {
        window.cancelIdleCallback(idleCallbackId);
      }

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      stopPolling();
    };
  }, [initialProgress]);

  return {
    progress,
    isLoading,
    setProgress,
  };
}
