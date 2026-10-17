"use client";

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export type AuthOwnerToken = { ownerId: string; generation: number };
type OwnerSnapshot = {
  ownerId: string | null;
  generation: number;
  revision: number;
  resolved: boolean;
  unavailable: boolean;
};
const initialSnapshot: OwnerSnapshot = {
  ownerId: null, generation: 0, revision: 0, resolved: false, unavailable: false,
};

type OwnerStore = OwnerSnapshot & {
  capture: () => AuthOwnerToken | null;
  isCurrent: (token: AuthOwnerToken) => boolean;
  retry: () => void;
};
export type AuthOwner = OwnerStore & { ready: boolean; expectedUserId?: string };
export const AuthOwnerContext = createContext<AuthOwner | null>(null);

/** SDK identity is only a consistency hint; verified server props authorize the frame. */
export function useAuthOwnerStore(enabled = true): OwnerStore {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const current = useRef(initialSnapshot);
  const [subscriptionAttempt, setSubscriptionAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    let settled = false;
    let unsubscribe: (() => void) | undefined;
    const unavailable = () => {
      if (!active || settled) return;
      current.current = { ...current.current, unavailable: true };
      setSnapshot(current.current);
    };
    const timer = window.setTimeout(unavailable, 15000);
    try {
      const { data: { subscription } } = createClient().auth.onAuthStateChange((event, session) => {
        if (!active || (event === "INITIAL_SESSION" && settled)) return;
        settled = true;
        window.clearTimeout(timer);
        const ownerId = event === "SIGNED_OUT" ? null : session?.user.id ?? null;
        const previous = current.current;
        // Update before scheduling React: in-flight work must fail even before unmount.
        current.current = {
          ownerId,
          generation: previous.generation + (previous.ownerId !== ownerId ? 1 : 0),
          revision: previous.revision + 1,
          resolved: true,
          unavailable: false,
        };
        setSnapshot(current.current);
      });
      unsubscribe = () => subscription.unsubscribe();
    } catch {
      unavailable();
    }
    return () => {
      active = false;
      current.current = { ...current.current, resolved: false };
      window.clearTimeout(timer);
      unsubscribe?.();
    };
  }, [enabled, subscriptionAttempt]);

  const capture = useCallback(() => {
    const value = current.current;
    return value.resolved && !value.unavailable && value.ownerId
      ? { ownerId: value.ownerId, generation: value.generation } : null;
  }, []);
  const isCurrent = useCallback((token: AuthOwnerToken) => {
    const value = current.current;
    return value.resolved && !value.unavailable && value.ownerId === token.ownerId && value.generation === token.generation;
  }, []);
  const retry = useCallback(() => {
    current.current = { ...initialSnapshot, generation: current.current.generation + 1, revision: current.current.revision + 1 };
    setSnapshot(current.current);
    setSubscriptionAttempt((value) => value + 1);
  }, []);
  return useMemo(() => ({ ...snapshot, capture, isCurrent, retry }), [snapshot, capture, isCurrent, retry]);
}

/** Context shares one listener; standalone consumers retain the same fail-closed policy. */
export function useAuthOwner(expectedUserId?: string): AuthOwner {
  const parent = useContext(AuthOwnerContext);
  const fallback = useAuthOwnerStore(!parent);
  const store = parent ?? fallback;
  const expected = expectedUserId ?? parent?.expectedUserId;
  const expectedRef = useRef(expected);
  useLayoutEffect(() => { expectedRef.current = expected; }, [expected]);
  const { capture: captureOwner, isCurrent: isOwnerCurrent } = store;
  const capture = useCallback(() => {
    const token = captureOwner();
    return token && (!expectedRef.current || token.ownerId === expectedRef.current) ? token : null;
  }, [captureOwner]);
  const isCurrent = useCallback((token: AuthOwnerToken) => (
    (!expectedRef.current || token.ownerId === expectedRef.current) && isOwnerCurrent(token)
  ), [isOwnerCurrent]);
  return { ...store, expectedUserId: expected, ready: Boolean(store.resolved && !store.unavailable && store.ownerId && (!expected || store.ownerId === expected)), capture, isCurrent };
}

export function withExpectedUserId(path: string, ownerId: string): string {
  const [pathname, query = ""] = path.split("?");
  const params = new URLSearchParams(query);
  params.set("expectedUserId", ownerId);
  return `${pathname}?${params.toString()}`;
}
