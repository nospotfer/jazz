'use client';

import { useEffect, useMemo, useState } from 'react';
import { Viewer, Worker, type RenderPageProps, SpecialZoomLevel } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import {
  highlightPlugin,
  Trigger,
  type HighlightArea,
  type RenderHighlightTargetProps,
  type RenderHighlightsProps,
} from '@react-pdf-viewer/highlight';
import { zoomPlugin } from '@react-pdf-viewer/zoom';

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
  const [highlights, setHighlights] = useState<SavedHighlight[]>([]);

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

  return (
    <div className="h-full w-full overflow-y-auto overflow-x-hidden">
      <Worker workerUrl="/pdf.worker.min.js">
        <Viewer
          fileUrl={fileUrl}
          defaultScale={SpecialZoomLevel.PageFit}
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
