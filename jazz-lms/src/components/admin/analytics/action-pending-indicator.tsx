'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

type ActionPendingIndicatorProps = {
  busy: boolean;
  label: string;
  delayMs?: number;
};

export function ActionPendingIndicator({
  busy,
  label,
  delayMs = 500,
}: ActionPendingIndicatorProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!busy) {
      setVisible(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setVisible(true);
    }, delayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [busy, delayMs]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="mt-1.5 inline-flex items-center gap-1.5 text-[12px] text-muted-foreground"
    >
      <Image
        src="/avatars/jazz-saxophone.svg"
        alt=""
        aria-hidden="true"
        width={14}
        height={14}
        className="h-3.5 w-3.5 animate-[spin_1.6s_linear_infinite]"
      />
      <span>{label}</span>
    </div>
  );
}