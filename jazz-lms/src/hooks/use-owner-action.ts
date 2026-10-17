"use client";

import { useCallback, useLayoutEffect, useRef } from "react";
import { useAuthOwner, type AuthOwnerToken } from "@/hooks/use-auth-owner";

/** Captured work may only affect the still-mounted frame of its original owner. */
export function useOwnerAction() {
  const { capture: captureOwner, isCurrent: isOwnerCurrent, ready } = useAuthOwner();
  const mounted = useRef(false);
  useLayoutEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  const capture = useCallback(() => mounted.current ? captureOwner() : null, [captureOwner]);
  const isCurrent = useCallback((token: AuthOwnerToken) => mounted.current && isOwnerCurrent(token), [isOwnerCurrent]);
  return { capture, isCurrent, ready };
}
