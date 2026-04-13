"use client";

import { useEffect, useState } from "react";
import { SaxLoadingOverlay } from "@/components/ui/sax-loading-overlay";

const ROUTE_LOADING_THRESHOLD_MS = 2000;

export function DelayedRouteLoading() {
  const [shouldShowOverlay, setShouldShowOverlay] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setShouldShowOverlay(true);
    }, ROUTE_LOADING_THRESHOLD_MS);

    return () => window.clearTimeout(timeoutId);
  }, []);

  if (isDismissed) {
    return <div className="min-h-[40vh]" />;
  }

  return (
    <>
      <div className="min-h-[40vh]" />
      {shouldShowOverlay ? (
        <SaxLoadingOverlay onClose={() => setIsDismissed(true)} />
      ) : null}
    </>
  );
}
