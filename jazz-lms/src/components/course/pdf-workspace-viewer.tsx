"use client";

import { useLanguage } from "@/components/providers/language-provider";
import {
  SpecialZoomLevel,
  Viewer,
  Worker,
  type RenderPageProps,
} from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import {
  highlightPlugin,
  Trigger,
  type HighlightArea,
  type RenderHighlightsProps,
  type RenderHighlightTargetProps,
} from "@react-pdf-viewer/highlight";
import { zoomPlugin } from "@react-pdf-viewer/zoom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface PdfWorkspaceViewerProps {
  fileUrl: string;
  compact?: boolean;
}

interface SavedHighlight {
  id: string;
  color: string;
  quote: string;
  highlightAreas: HighlightArea[];
}

const HIGHLIGHT_COLORS = [
  "#fde047",
  "#f97316",
  "#22c55e",
  "#38bdf8",
  "#a78bfa",
  "#f43f5e",
  "#14b8a6",
];

const PDF_WORKER_URL = "/pdf.worker.min.js";

export function PdfWorkspaceViewer({
  fileUrl,
  compact = false,
}: PdfWorkspaceViewerProps) {
  const { language } = useLanguage();
  const [highlights, setHighlights] = useState<SavedHighlight[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const highlightCounterRef = useRef(0);

  const storageKey = useMemo(
    () => `pdf-highlights:${encodeURIComponent(fileUrl)}`,
    [fileUrl],
  );

  useEffect(() => {
    const deferSetHighlights = (next: SavedHighlight[]) => {
      const frame = window.requestAnimationFrame(() => {
        setHighlights(next);
      });
      return () => window.cancelAnimationFrame(frame);
    };

    try {
      const saved = window.localStorage.getItem(storageKey);
      if (!saved) {
        return deferSetHighlights([]);
      }

      const parsed = JSON.parse(saved) as SavedHighlight[];
      return deferSetHighlights(parsed);
    } catch {
      return deferSetHighlights([]);
    }
  }, [storageKey]);

  const persistHighlights = useCallback(
    (next: SavedHighlight[]) => {
      setHighlights(next);
      window.localStorage.setItem(storageKey, JSON.stringify(next));
    },
    [storageKey],
  );

  const zoomPluginInstance = zoomPlugin();

  const defaultLayoutPluginInstance = useMemo(
    () =>
      defaultLayoutPlugin({
        sidebarTabs: (tabs) => (compact ? [] : tabs),
      }),
    [compact],
  );

  const addHighlight = useCallback(
    (props: RenderHighlightTargetProps, color: string) => {
      highlightCounterRef.current += 1;
      const newHighlight: SavedHighlight = {
        id: `highlight-${highlightCounterRef.current}`,
        color,
        quote: props.selectedText,
        highlightAreas: props.highlightAreas,
      };

      persistHighlights([...highlights, newHighlight]);
      props.cancel();
    },
    [highlights, persistHighlights],
  );

  const renderHighlightTarget = (props: RenderHighlightTargetProps) => (
    <div
      style={{
        left: `${props.selectionRegion.left}%`,
        top: `${props.selectionRegion.top + props.selectionRegion.height}%`,
      }}
      className="absolute z-20 mt-1 rounded-md border border-primary/40 bg-background/95 p-1.5 shadow-lg"
      data-testid="highlight-target"
    >
      <div className="flex items-center gap-1">
        {HIGHLIGHT_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={`Highlight ${color}`}
            className="h-4 w-4 rounded-full border border-black/25"
            style={{ backgroundColor: color }}
            onClick={() => addHighlight(props, color)}
          />
        ))}
      </div>
    </div>
  );

  const renderHighlights = (props: RenderHighlightsProps) => (
    <>
      {highlights.map((highlight) => (
        <div key={highlight.id}>
          {highlight.highlightAreas
            .filter((area) => area.pageIndex === props.pageIndex)
            .map((area, index) => (
              <div
                key={`${highlight.id}-${index}`}
                style={{
                  ...props.getCssProperties(area, props.rotation),
                  background: highlight.color,
                  opacity: 0.35,
                }}
              />
            ))}
        </div>
      ))}
    </>
  );

  const highlightPluginInstance = highlightPlugin({
    trigger: Trigger.TextSelection,
    renderHighlightTarget,
    renderHighlights,
  });

  const tooltipMap = useMemo(() => {
    if (language === "pt") {
      return {
        Attachment: "Anexos",
        Thumbnails: "Miniaturas",
        Bookmark: "Favoritos",
        "Open file": "Abrir arquivo",
        Print: "Imprimir",
        Download: "Baixar",
        "Enter full screen": "Tela cheia",
        "Exit full screen": "Sair da tela cheia",
        "Go to first page": "Primeira página",
        "Go to previous page": "Página anterior",
        "Go to next page": "Próxima página",
        "Go to last page": "Última página",
        "Previous page": "Página anterior",
        "Next page": "Próxima página",
        "Zoom in": "Aproximar",
        "Zoom out": "Afastar",
        Search: "Buscar",
      } as Record<string, string>;
    }

    if (language === "es") {
      return {
        Attachment: "Adjuntos",
        Thumbnails: "Miniaturas",
        Bookmark: "Marcadores",
        "Open file": "Abrir archivo",
        Print: "Imprimir",
        Download: "Descargar",
        "Enter full screen": "Pantalla completa",
        "Exit full screen": "Salir de pantalla completa",
        "Go to first page": "Primera página",
        "Go to previous page": "Página anterior",
        "Go to next page": "Página siguiente",
        "Go to last page": "Última página",
        "Previous page": "Página anterior",
        "Next page": "Página siguiente",
        "Zoom in": "Acercar",
        "Zoom out": "Alejar",
        Search: "Buscar",
      } as Record<string, string>;
    }

    if (language === "fr") {
      return {
        Attachment: "Pièces jointes",
        Thumbnails: "Miniatures",
        Bookmark: "Signets",
        "Open file": "Ouvrir le fichier",
        Print: "Imprimer",
        Download: "Télécharger",
        "Enter full screen": "Plein écran",
        "Exit full screen": "Quitter le plein écran",
        "Go to first page": "Première page",
        "Go to previous page": "Page précédente",
        "Go to next page": "Page suivante",
        "Go to last page": "Dernière page",
        "Previous page": "Page précédente",
        "Next page": "Page suivante",
        "Zoom in": "Agrandir",
        "Zoom out": "Réduire",
        Search: "Rechercher",
      } as Record<string, string>;
    }

    return {} as Record<string, string>;
  }, [language]);

  const downloadLabels = useMemo(
    () => ["Download", "Descargar", "Télécharger", "Baixar"],
    [],
  );

  useEffect(() => {
    if (language === "en") {
      return;
    }

    const root = containerRef.current;
    if (!root) {
      return;
    }

    const translateAttrs = () => {
      const elements = root.querySelectorAll<HTMLElement>(
        "[title], [aria-label]",
      );
      elements.forEach((el) => {
        const title = el.getAttribute("title");
        if (title && tooltipMap[title]) {
          el.setAttribute("title", tooltipMap[title]);
        }

        const ariaLabel = el.getAttribute("aria-label");
        if (ariaLabel && tooltipMap[ariaLabel]) {
          el.setAttribute("aria-label", tooltipMap[ariaLabel]);
        }

        const resolvedTitle = el.getAttribute("title") || "";
        const resolvedAria = el.getAttribute("aria-label") || "";
        const isDownload =
          downloadLabels.includes(resolvedTitle) ||
          downloadLabels.includes(resolvedAria);
        if (isDownload) {
          el.classList.add("pdf-download-emphasis");
        }
      });
    };

    translateAttrs();
    const observer = new MutationObserver(() => {
      translateAttrs();
    });

    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["title", "aria-label"],
    });

    return () => observer.disconnect();
  }, [language, tooltipMap, fileUrl, downloadLabels]);

  const viewerScale = compact ? SpecialZoomLevel.PageFit : 1.3;

  return (
    <div
      ref={containerRef}
      className={`pdf-workspace-viewer h-full w-full ${compact ? "overflow-auto" : "overflow-y-auto overflow-x-hidden"}`}
    >
      <Worker workerUrl={PDF_WORKER_URL}>
        <Viewer
          key={`${language}:${fileUrl}`}
          fileUrl={fileUrl}
          defaultScale={viewerScale}
          plugins={[
            defaultLayoutPluginInstance,
            zoomPluginInstance,
            highlightPluginInstance,
          ]}
          renderPage={(props: RenderPageProps) => (
            <>
              {props.canvasLayer.children}
              {props.textLayer.children}
              {props.annotationLayer.children}
            </>
          )}
        />
      </Worker>
    </div>
  );
}
