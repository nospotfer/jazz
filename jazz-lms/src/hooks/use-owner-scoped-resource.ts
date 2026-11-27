"use client";

import { useCallback, useEffect, useState, type SetStateAction } from "react";
import { useAuthOwner, withExpectedUserId } from "@/hooks/use-auth-owner";

/** Every await checks both request identity and the synchronously updated auth generation. */
export function useOwnerScopedResource<T>({ path, initialValue, emptyValue, intervalMs, initialDelayMs = 0, expectedUserId, enabled = true }: {
  path: string; initialValue: T; emptyValue: T; intervalMs: number | null; initialDelayMs?: number; expectedUserId?: string; enabled?: boolean;
}) {
  const owner = useAuthOwner(expectedUserId);
  const { capture, isCurrent, revision } = owner;
  const ownerKey = owner.ready ? `${owner.ownerId}:${owner.generation}` : null;
  const [snapshot, setSnapshot] = useState<{ key: string | null; value: T }>({ key: null, value: emptyValue });
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  useEffect(() => {
    const token = capture();
    if (!enabled || !token || !ownerKey) return;
    let active = true;
    let controller: AbortController | undefined;
    let requestNumber = 0;
    const key = ownerKey;
    const load = async () => {
      if (document.visibilityState === "hidden" || !isCurrent(token)) return;
      const number = ++requestNumber;
      controller?.abort();
      controller = new AbortController();
      const signal = controller.signal;
      const current = () => active && !signal.aborted && requestNumber === number && isCurrent(token);
      setLoadingKey(key);
      try {
        const response = await fetch(withExpectedUserId(path, token.ownerId), { cache: "no-store", signal });
        if (!current()) return;
        if (!response.ok) throw new Error("Private resource unavailable");
        const value = await response.json() as T;
        if (current()) setSnapshot({ key, value });
      } catch {
        if (current()) setSnapshot({ key, value: emptyValue });
      } finally {
        if (current()) setLoadingKey(null);
      }
    };
    const timeout = window.setTimeout(() => void load(), initialDelayMs);
    const interval = intervalMs === null ? null : window.setInterval(() => void load(), intervalMs);
    const visibility = () => { if (document.visibilityState === "visible") void load(); };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      active = false;
      ++requestNumber;
      controller?.abort();
      window.clearTimeout(timeout);
      if (interval !== null) window.clearInterval(interval);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [path, emptyValue, intervalMs, initialDelayMs, ownerKey, revision, capture, isCurrent, enabled]);

  const setValue = useCallback((value: SetStateAction<T>) => {
    const token = capture();
    if (!token) return;
    const key = `${token.ownerId}:${token.generation}`;
    setSnapshot((previous) => {
      if (!isCurrent(token)) return previous;
      const current = previous.key === key ? previous.value : initialValue;
      return { key, value: typeof value === "function" ? (value as (previous: T) => T)(current) : value };
    });
  }, [capture, isCurrent, initialValue]);

  return {
    value: enabled && owner.ready ? snapshot.key === ownerKey ? snapshot.value : initialValue : emptyValue,
    isLoading: enabled && owner.ready && loadingKey === ownerKey,
    setValue,
  };
}
