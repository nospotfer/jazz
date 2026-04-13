"use client";

import axios from "axios";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { SaxLoadingOverlay } from "@/components/ui/sax-loading-overlay";

interface LoadingOperation {
  revealTimeoutId: number;
  forceStopTimeoutId: number;
  controller?: AbortController;
}

interface GlobalLoadingContextValue {
  trackPromise: <T>(
    factory: (signal?: AbortSignal) => Promise<T>,
    options?: { cancellable?: boolean },
  ) => Promise<T>;
  isVisible: boolean;
  dismiss: () => void;
}

const GlobalLoadingContext = createContext<GlobalLoadingContextValue | null>(
  null,
);

const OVERLAY_THRESHOLD_MS = 2000;
const OPERATION_MAX_MS = 30000;

export function GlobalLoadingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const opsRef = useRef<Map<string, LoadingOperation>>(new Map());
  const dismissedRef = useRef(false);

  const clearAllOperations = useCallback(() => {
    opsRef.current.forEach((operation) => {
      window.clearTimeout(operation.revealTimeoutId);
      window.clearTimeout(operation.forceStopTimeoutId);
    });
    opsRef.current.clear();
  }, []);

  const clearVisibility = useCallback(() => {
    if (opsRef.current.size === 0) {
      setIsVisible(false);
      dismissedRef.current = false;
    }
  }, []);

  const stopOperation = useCallback(
    (id: string) => {
      const op = opsRef.current.get(id);
      if (!op) {
        return;
      }

      window.clearTimeout(op.revealTimeoutId);
      window.clearTimeout(op.forceStopTimeoutId);
      opsRef.current.delete(id);
      clearVisibility();
    },
    [clearVisibility],
  );

  const startOperation = useCallback((controller?: AbortController) => {
    const id = crypto.randomUUID();
    const revealTimeoutId = window.setTimeout(() => {
      if (!opsRef.current.has(id) || dismissedRef.current) {
        return;
      }

      setIsVisible(true);
    }, OVERLAY_THRESHOLD_MS);

    const forceStopTimeoutId = window.setTimeout(() => {
      stopOperation(id);
    }, OPERATION_MAX_MS);

    opsRef.current.set(id, {
      revealTimeoutId,
      forceStopTimeoutId,
      controller,
    });

    return id;
  }, [stopOperation]);

  const dismiss = useCallback(() => {
    setIsVisible(false);
    dismissedRef.current = true;

    opsRef.current.forEach((operation) => {
      operation.controller?.abort();
    });

    clearAllOperations();
  }, [clearAllOperations]);

  useEffect(() => {
    clearAllOperations();
    dismissedRef.current = false;
    setIsVisible(false);
  }, [clearAllOperations, pathname]);

  useEffect(() => {
    const reqInterceptorId = axios.interceptors.request.use((config) => {
      const controller = new AbortController();
      const existingSignal = config.signal;

      if (existingSignal) {
        if (existingSignal.aborted) {
          controller.abort();
        } else if (typeof existingSignal.addEventListener === "function") {
          const abortListener = () => controller.abort();
          existingSignal.addEventListener("abort", abortListener, {
            once: true,
          });
        }
      }

      const operationId = startOperation(controller);
      const nextConfig = config;
      (nextConfig as { __globalLoadingId?: string }).__globalLoadingId =
        operationId;

      if (!nextConfig.signal) {
        nextConfig.signal = controller.signal;
      }

      return nextConfig;
    });

    const release = (config?: unknown) => {
      const globalLoadingId =
        (
          config as {
            __globalLoadingId?: string;
          }
        )?.__globalLoadingId ?? null;

      if (globalLoadingId) {
        stopOperation(globalLoadingId);
      }
    };

    const resInterceptorId = axios.interceptors.response.use(
      (response) => {
        release(response.config);
        return response;
      },
      (error) => {
        release(error?.config);
        return Promise.reject(error);
      },
    );

    return () => {
      axios.interceptors.request.eject(reqInterceptorId);
      axios.interceptors.response.eject(resInterceptorId);
    };
  }, [startOperation, stopOperation]);

  const trackPromise = useCallback(
    async <T,>(
      factory: (signal?: AbortSignal) => Promise<T>,
      options?: { cancellable?: boolean },
    ) => {
      const shouldCancel = options?.cancellable ?? true;
      const controller = shouldCancel ? new AbortController() : undefined;
      const operationId = startOperation(controller);

      try {
        return await factory(controller?.signal);
      } finally {
        stopOperation(operationId);
      }
    },
    [startOperation, stopOperation],
  );

  const value = useMemo<GlobalLoadingContextValue>(
    () => ({
      trackPromise,
      isVisible,
      dismiss,
    }),
    [dismiss, isVisible, trackPromise],
  );

  return (
    <GlobalLoadingContext.Provider value={value}>
      {children}
      {isVisible ? <SaxLoadingOverlay onClose={dismiss} /> : null}
    </GlobalLoadingContext.Provider>
  );
}

export function useGlobalLoading() {
  const context = useContext(GlobalLoadingContext);

  if (!context) {
    throw new Error("useGlobalLoading must be used within GlobalLoadingProvider");
  }

  return context;
}
