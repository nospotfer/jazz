'use client';

import { useMemo, useState } from 'react';
import { FileText } from 'lucide-react';

interface PdfItem {
  id: string;
  title: string;
  classLabel: string;
  url: string;
}

interface PdfViewClientProps {
  items: PdfItem[];
}

export function PdfViewClient({ items }: PdfViewClientProps) {
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? null);

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? items[0],
    [items, selectedId]
  );

  return (
    <div className="max-w-[1200px] mx-auto space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">PDF View</h1>
        <p className="text-muted-foreground mt-1">
          Easy access to lesson PDFs inside your dashboard
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <FileText className="h-10 w-10 text-primary mx-auto mb-3" />
          <p className="text-foreground font-medium">No PDFs available yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Lesson PDFs will appear here when they are added.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-4">
          <aside className="rounded-xl border border-border bg-card p-3">
            <div className="space-y-2 max-h-[72dvh] overflow-y-auto pr-1">
              {items.map((item) => {
                const active = selected?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={`w-full text-left rounded-lg border px-3 py-2.5 transition-colors ${
                      active
                        ? 'border-primary/60 bg-primary/10'
                        : 'border-border hover:bg-accent/40'
                    }`}
                  >
                    <p className="text-xs font-semibold text-primary/90">{item.classLabel}</p>
                    <p className="text-sm text-foreground leading-tight mt-0.5">{item.title}</p>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="rounded-xl border border-border bg-card overflow-hidden min-h-[72dvh]">
            <div className="px-4 py-3 border-b border-border bg-card/80">
              <p className="text-sm font-medium text-foreground">{selected?.classLabel}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{selected?.title}</p>
            </div>

            {selected ? (
              <iframe
                src={selected.url}
                title={selected.title}
                className="w-full h-[calc(72dvh-58px)]"
              />
            ) : (
              <div className="h-[calc(72dvh-58px)] flex items-center justify-center text-muted-foreground">
                Select a PDF
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
