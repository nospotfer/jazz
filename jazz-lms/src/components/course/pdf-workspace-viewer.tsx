"use client";

import { useMemo } from "react";

interface PdfWorkspaceViewerProps {
  fileUrl: string;
  compact?: boolean;
}

export function PdfWorkspaceViewer({
  fileUrl,
  compact = false,
}: PdfWorkspaceViewerProps) {
  const containerClasses = useMemo(
    () =>
      `pdf-workspace-viewer h-full w-full ${
        compact ? "overflow-auto" : "overflow-y-auto overflow-x-hidden"
      }`,
    [compact],
  );

  return (
    <div className={containerClasses}>
      <iframe
        src={fileUrl}
        title="PDF preview"
        className="h-full w-full border-0"
        loading="lazy"
      />
    </div>
  );
}
