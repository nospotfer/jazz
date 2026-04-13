"use client";

import { X } from "lucide-react";
import Image from "next/image";

interface SaxLoadingOverlayProps {
  onClose?: () => void;
  message?: string;
}

const DEFAULT_MESSAGE = "Aguarde un momento mientras cargamos su informacion";

export function SaxLoadingOverlay({
  onClose,
  message = DEFAULT_MESSAGE,
}: SaxLoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-[120] bg-background/80 backdrop-blur-sm">
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar indicador de carga"
        className="absolute left-3 top-3 h-7 w-7 rounded-full border border-border bg-card/90 text-foreground/80 hover:bg-card"
      >
        <X className="mx-auto h-3.5 w-3.5" />
      </button>

      <div className="flex h-full w-full items-center justify-center p-6">
        <div className="flex max-w-md flex-col items-center gap-4 rounded-xl border border-border bg-card/95 px-6 py-7 text-center shadow-2xl">
          <Image
            src="/avatars/jazz-saxophone.svg"
            alt="Saxophone loading"
            width={64}
            height={64}
            className="h-16 w-16 animate-[spin_1.8s_linear_infinite]"
          />
          <p className="text-sm font-medium text-foreground">{message}</p>
        </div>
      </div>
    </div>
  );
}
