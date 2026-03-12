'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Viewer, Worker, type RenderPageProps } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import {
  highlightPlugin,
  Trigger,
  type HighlightArea,
  type RenderHighlightTargetProps,
  type RenderHighlightsProps,
} from '@react-pdf-viewer/highlight';
import { zoomPlugin } from '@react-pdf-viewer/zoom';
import enUS from '@react-pdf-viewer/locales/lib/en_US.json';
import esES from '@react-pdf-viewer/locales/lib/es_ES.json';
import frFR from '@react-pdf-viewer/locales/lib/fr_FR.json';
import ptPT from '@react-pdf-viewer/locales/lib/pt_PT.json';
import { useLanguage } from '@/components/providers/language-provider';

interface PdfWorkspaceViewerProps {
  fileUrl: string;
}

interface SavedHighlight {
  id: string;
  color: string;
  quote: string;
  highlightAreas: HighlightArea[];
}

const HIGHLIGHT_COLORS = ['#fde047', '#f97316', '#22c55e', '#38bdf8', '#a78bfa', '#f43f5e', '#14b8a6'];

export function PdfWorkspaceViewer({ fileUrl }: PdfWorkspaceViewerProps) {
  const { language } = useLanguage();
  const [highlights, setHighlights] = useState<SavedHighlight[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const storageKey = useMemo(
    () => `pdf-highlights:${encodeURIComponent(fileUrl)}`,
    [fileUrl]
  );

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (!saved) {
        setHighlights([]);
        return;
      }

      const parsed = JSON.parse(saved) as SavedHighlight[];
      setHighlights(parsed);
    } catch {
      setHighlights([]);
    }
  }, [storageKey]);

  const persistHighlights = (next: SavedHighlight[]) => {
    setHighlights(next);
    window.localStorage.setItem(storageKey, JSON.stringify(next));
  };

  const zoomPluginInstance = zoomPlugin();

  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  const addHighlight = (props: RenderHighlightTargetProps, color: string) => {
    const newHighlight: SavedHighlight = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      color,
      quote: props.selectedText,
      highlightAreas: props.highlightAreas,
    };

    persistHighlights([...highlights, newHighlight]);
    props.cancel();
  };

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

  const localization = useMemo(() => {
    if (language === 'es') return esES;
    if (language === 'fr') return frFR;
    if (language === 'pt') return ptPT;
    return enUS;
  }, [language]);

  const tooltipMap = useMemo(() => {
    if (language === 'pt') {
      return {
        Attachment: 'Anexos',
        Thumbnails: 'Miniaturas',
        Bookmark: 'Favoritos',
        'Open file': 'Abrir arquivo',
        Print: 'Imprimir',
        Download: 'Baixar',
        'Enter full screen': 'Tela cheia',
        'Exit full screen': 'Sair da tela cheia',
        'Go to first page': 'Primeira página',
        'Go to previous page': 'Página anterior',
        'Go to next page': 'Próxima página',
        'Go to last page': 'Última página',
        'Previous page': 'Página anterior',
        'Next page': 'Próxima página',
        'Zoom in': 'Aproximar',
        'Zoom out': 'Afastar',
        Search: 'Buscar',
      } as Record<string, string>;
    }

    if (language === 'es') {
      return {
        Attachment: 'Adjuntos',
        Thumbnails: 'Miniaturas',
        Bookmark: 'Marcadores',
        'Open file': 'Abrir archivo',
        Print: 'Imprimir',
        Download: 'Descargar',
        'Enter full screen': 'Pantalla completa',
        'Exit full screen': 'Salir de pantalla completa',
        'Go to first page': 'Primera página',
        'Go to previous page': 'Página anterior',
        'Go to next page': 'Página siguiente',
        'Go to last page': 'Última página',
        'Previous page': 'Página anterior',
        'Next page': 'Página siguiente',
        'Zoom in': 'Acercar',
        'Zoom out': 'Alejar',
        Search: 'Buscar',
      } as Record<string, string>;
    }

    if (language === 'fr') {
      return {
        Attachment: 'Pièces jointes',
        Thumbnails: 'Miniatures',
        Bookmark: 'Signets',
        'Open file': 'Ouvrir le fichier',
        Print: 'Imprimer',
        Download: 'Télécharger',
        'Enter full screen': 'Plein écran',
        'Exit full screen': 'Quitter le plein écran',
        'Go to first page': 'Première page',
        'Go to previous page': 'Page précédente',
        'Go to next page': 'Page suivante',
        'Go to last page': 'Dernière page',
        'Previous page': 'Page précédente',
        'Next page': 'Page suivante',
        'Zoom in': 'Agrandir',
        'Zoom out': 'Réduire',
        Search: 'Rechercher',
      } as Record<string, string>;
    }

    return {} as Record<string, string>;
  }, [language]);

  const downloadLabels = useMemo(
    () => ['Download', 'Descargar', 'Télécharger', 'Baixar'],
    []
  );

  useEffect(() => {
    if (language === 'en') {
      return;
    }

    const root = containerRef.current;
    if (!root) {
      return;
    }

    const translateAttrs = () => {
      const elements = root.querySelectorAll<HTMLElement>('[title], [aria-label]');
      elements.forEach((el) => {
        const title = el.getAttribute('title');
        if (title && tooltipMap[title]) {
          el.setAttribute('title', tooltipMap[title]);
        }

        const ariaLabel = el.getAttribute('aria-label');
        if (ariaLabel && tooltipMap[ariaLabel]) {
          el.setAttribute('aria-label', tooltipMap[ariaLabel]);
        }

        const resolvedTitle = el.getAttribute('title') || '';
        const resolvedAria = el.getAttribute('aria-label') || '';
        const isDownload = downloadLabels.includes(resolvedTitle) || downloadLabels.includes(resolvedAria);
        if (isDownload) {
          el.classList.add('pdf-download-emphasis');
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
      attributeFilter: ['title', 'aria-label'],
    });

    return () => observer.disconnect();
  }, [language, tooltipMap, fileUrl]);

  return (
    <div ref={containerRef} className="pdf-workspace-viewer h-full w-full overflow-y-auto overflow-x-hidden">
      <Worker workerUrl="/pdf.worker.min.js">
        <Viewer
          key={`${language}:${fileUrl}`}
          fileUrl={fileUrl}
          defaultScale={1.3}
          localization={localization}
          plugins={[defaultLayoutPluginInstance, zoomPluginInstance, highlightPluginInstance]}
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
