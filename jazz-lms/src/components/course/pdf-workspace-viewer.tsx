"use client";

import { useLanguage } from "@/components/providers/language-provider";
import { useMemo, useState } from "react";

interface PdfWorkspaceViewerProps {
  fileUrl: string;
  compact?: boolean;
}

const IFRAME_SANDBOX = "allow-same-origin allow-scripts allow-downloads allow-forms allow-modals";

const OPEN_LABEL: Record<string, string> = {
  es: "Abrir en una nueva pestaña",
  en: "Open in a new tab",
  fr: "Ouvrir dans un nouvel onglet",
  pt: "Abrir em nova aba",
};

const LOAD_ERROR_LABEL: Record<string, string> = {
  es: "No pudimos mostrar este PDF embebido. Ábrelo en una nueva pestaña.",
  en: "We could not render this PDF inline. Open it in a new tab.",
  fr: "Impossible d'afficher ce PDF intégré. Ouvrez-le dans un nouvel onglet.",
  pt: "Nao foi possivel exibir este PDF incorporado. Abra em uma nova aba.",
};

const LOADING_LABEL: Record<string, string> = {
  es: "Cargando PDF...",
  en: "Loading PDF...",
  fr: "Chargement du PDF...",
  pt: "Carregando PDF...",
};

export function PdfWorkspaceViewer({
  fileUrl,
  compact = false,
}: PdfWorkspaceViewerProps) {
  const { language } = useLanguage();
  const [loadedUrl, setLoadedUrl] = useState("");
  const [failedUrl, setFailedUrl] = useState("");

  const safeUrl = useMemo(() => {
    if (!fileUrl || typeof fileUrl !== "string") return "";
    return fileUrl.trim();
  }, [fileUrl]);

  if (!safeUrl) {
    return (
      <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground px-4 text-center">
        {LOAD_ERROR_LABEL[language] ?? LOAD_ERROR_LABEL.es}
      </div>
    );
  }

  const isLoading = loadedUrl !== safeUrl && failedUrl !== safeUrl;
  const hasError = failedUrl === safeUrl;

  return (
    <div
      className={`relative h-full w-full ${compact ? "overflow-hidden" : "overflow-auto"}`}
      data-testid="pdf-workspace-viewer"
    >
      {isLoading && !hasError ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/85 text-sm text-muted-foreground">
          {LOADING_LABEL[language] ?? LOADING_LABEL.es}
        </div>
      ) : null}

      {!hasError ? (
        <iframe
          key={safeUrl}
          src={safeUrl}
          title="PDF Viewer"
          className="h-full w-full border-0"
          loading="lazy"
          sandbox={IFRAME_SANDBOX}
          onLoad={() => {
            setLoadedUrl(safeUrl);
            setFailedUrl("");
          }}
          onError={() => {
            setFailedUrl(safeUrl);
          }}
        />
      ) : null}

      {hasError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background px-4 text-center">
          <p className="text-sm text-muted-foreground">
            {LOAD_ERROR_LABEL[language] ?? LOAD_ERROR_LABEL.es}
          </p>
          <a
            href={safeUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            {OPEN_LABEL[language] ?? OPEN_LABEL.es}
          </a>
        </div>
      ) : null}
    </div>
  );
}
