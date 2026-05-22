'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { FileText, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useLanguage } from '@/components/providers/language-provider';
import { getCanonicalJazzClass, getLocalizedJazzClassLabel } from '@/lib/course-lessons';

const PdfWorkspaceViewer = dynamic(
  () => import('@/components/course/pdf-workspace-viewer').then((mod) => mod.PdfWorkspaceViewer),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

interface PdfItem {
  id: string;
  lessonId: string;
  title: string;
  classLabel: string;
  url: string;
  classNumber?: number;
  isAuxiliary?: boolean;
}

interface PdfViewClientProps {
  items: PdfItem[];
}

export function PdfViewClient({ items }: PdfViewClientProps) {
  const { language } = useLanguage();
  const copy = {
    es: {
      loadPdfError: 'No se puede cargar este PDF ahora mismo.',
      title: 'Vista de PDFs',
      subtitle: 'Acceso rápido a los PDFs de las clases dentro de tu panel',
      noPdfsTitle: 'Aún no hay PDFs disponibles',
      noPdfsDesc: 'Los PDFs aparecerán aquí cuando se agreguen.',
      loadingPdf: 'Cargando PDF...',
      selectPdf: 'Selecciona un PDF',
      downloadSelectedPdf: 'Descargar PDF seleccionado',
      auxiliaryLabel: 'Apuntes Auxiliares',
      auxiliaryTitle: 'Apunte auxiliar',
    },
    en: {
      loadPdfError: 'Unable to load this PDF right now.',
      title: 'PDF View',
      subtitle: 'Quick access to lesson PDFs inside your dashboard',
      noPdfsTitle: 'No PDFs available yet',
      noPdfsDesc: 'Lesson PDFs will appear here when they are added.',
      loadingPdf: 'Loading PDF...',
      selectPdf: 'Select a PDF',
      downloadSelectedPdf: 'Download selected PDF',
      auxiliaryLabel: 'Auxiliary Notes',
      auxiliaryTitle: 'Auxiliary note',
    },
    fr: {
      loadPdfError: 'Impossible de charger ce PDF pour le moment.',
      title: 'Vue PDF',
      subtitle: 'Accès rapide aux PDF des leçons dans votre tableau de bord',
      noPdfsTitle: 'Aucun PDF disponible pour le moment',
      noPdfsDesc: 'Les PDF des leçons apparaîtront ici lorsqu’ils seront ajoutés.',
      loadingPdf: 'Chargement du PDF...',
      selectPdf: 'Sélectionnez un PDF',
      downloadSelectedPdf: 'Télécharger le PDF sélectionné',
      auxiliaryLabel: 'Notes auxiliaires',
      auxiliaryTitle: 'Note auxiliaire',
    },
    pt: {
      loadPdfError: 'No fue posible cargar este PDF ahora.',
      title: 'Visualização de PDFs',
      subtitle: 'Acesso rápido aos PDFs das aulas dentro do seu painel',
      noPdfsTitle: 'Aún no hay PDF disponibles',
      noPdfsDesc: 'Os PDFs das aulas aparecerão aqui quando forem adicionados.',
      loadingPdf: 'Carregando PDF...',
      selectPdf: 'Selecione um PDF',
      downloadSelectedPdf: 'Baixar PDF selecionado',
      auxiliaryLabel: 'Notas auxiliares',
      auxiliaryTitle: 'Nota auxiliar',
    },
  }[language];

  const [selectedId, setSelectedId] = useState(items[0]?.id ?? null);
  const [signedUrl, setSignedUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const pdfRequestIdRef = useRef(0);

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? items[0],
    [items, selectedId]
  );

  const localizedItems = useMemo(() => {
    let auxiliaryIndex = 0;

    return items.map((item) => {
      const isAuxiliary = Boolean(item.isAuxiliary);
      const classNumber = item.classNumber ?? null;

      if (isAuxiliary) {
        auxiliaryIndex += 1;
        return {
          ...item,
          displayClassLabel: copy.auxiliaryLabel,
          displayTitle: `${copy.auxiliaryTitle} ${auxiliaryIndex}`,
        };
      }

      const canonicalClass = classNumber ? getCanonicalJazzClass(classNumber) : undefined;
      const displayClassLabel = classNumber
        ? getLocalizedJazzClassLabel(classNumber, language)
        : item.classLabel;
      const displayTitle = canonicalClass?.subtitles[language] || item.title;

      return {
        ...item,
        displayClassLabel,
        displayTitle,
      };
    });
  }, [items, language, copy.auxiliaryLabel, copy.auxiliaryTitle]);

  const selectedLocalized = useMemo(
    () => localizedItems.find((item) => item.id === selected?.id) ?? null,
    [localizedItems, selected?.id]
  );

  const buildInlineProxyUrl = useCallback((item: PdfItem) => {
    const params = new URLSearchParams({
      download: '0',
      language,
      proxy: '1',
    });

    return `/api/lessons/${item.lessonId}/attachments/${item.id}?${params.toString()}`;
  }, [language]);

  const getAttachmentSignedUrl = useCallback(async (item: PdfItem, download = false) => {
    const response = await axios.get(
      `/api/lessons/${item.lessonId}/attachments/${item.id}`,
      {
        params: {
          download: download ? 1 : 0,
          language,
        },
      }
    );

    return response.data as {
      signedUrl?: string;
    };
  }, [language]);

  const loadSignedUrl = useCallback(async (item: PdfItem) => {
    const requestId = ++pdfRequestIdRef.current;
    setIsLoading(true);
    setLoadError('');
    setSignedUrl('');

    try {
      await getAttachmentSignedUrl(item, false);
      if (requestId !== pdfRequestIdRef.current) {
        return;
      }
      setSignedUrl(buildInlineProxyUrl(item));
    } catch (error: unknown) {
      if (requestId !== pdfRequestIdRef.current) {
        return;
      }

      const message = axios.isAxiosError(error)
        ? (error.response?.data?.error as string | undefined) || copy.loadPdfError
        : copy.loadPdfError;
      setLoadError(message);
      setSignedUrl('');
    } finally {
      if (requestId === pdfRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [buildInlineProxyUrl, copy.loadPdfError, getAttachmentSignedUrl]);

  const handleSelect = (item: PdfItem) => {
    setSelectedId(item.id);
  };

  const downloadSelected = async () => {
    if (!selected) return;

    const fallbackDownloadUrl = `/api/lessons/${selected.lessonId}/attachments/${selected.id}?download=1&language=${encodeURIComponent(language)}`;

    try {
      const response = await getAttachmentSignedUrl(selected, true);

      const signed = response.signedUrl || fallbackDownloadUrl;
      window.open(signed, '_blank', 'noopener,noreferrer');
    } catch {
      window.open(fallbackDownloadUrl, '_blank', 'noopener,noreferrer');
    }
  };

  useEffect(() => {
    if (!selected) {
      setSignedUrl('');
      setLoadError('');
      setIsLoading(false);
      return;
    }

    void loadSignedUrl(selected);
  }, [loadSignedUrl, selected]);

  return (
    <div className="max-w-[1200px] mx-auto space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">{copy.title}</h1>
        <p className="text-muted-foreground mt-1">
          {copy.subtitle}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <FileText className="h-10 w-10 text-primary mx-auto mb-3" />
          <p className="text-foreground font-medium">{copy.noPdfsTitle}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {copy.noPdfsDesc}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-4">
          <aside className="rounded-xl border border-border bg-card p-3">
            <div className="space-y-2 max-h-[72dvh] overflow-y-auto pr-1">
              {localizedItems.map((item) => {
                const active = selectedLocalized?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className={`w-full text-left rounded-lg border px-3 py-2.5 transition-colors ${
                      active
                        ? 'border-primary/60 bg-primary/10'
                        : 'border-border hover:bg-accent/40'
                    }`}
                  >
                    <p className="text-xs font-semibold text-primary/90">{item.displayClassLabel}</p>
                    <p className="text-sm text-foreground leading-tight mt-0.5">{item.displayTitle}</p>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="rounded-xl border border-border bg-card overflow-hidden min-h-[72dvh] flex flex-col">
            <div className="px-4 py-3 border-b border-border bg-card/80 shrink-0">
              <p className="text-sm font-medium text-foreground">{selectedLocalized?.displayClassLabel}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{selectedLocalized?.displayTitle}</p>
              {selectedLocalized ? (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={downloadSelected}
                    className="rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-accent/50"
                  >
                    {copy.downloadSelectedPdf}
                  </button>
                </div>
              ) : null}
            </div>

            {selectedLocalized ? (
              isLoading ? (
                <div className="flex-1 min-h-0 flex items-center justify-center text-muted-foreground">
                  {copy.loadingPdf}
                </div>
              ) : loadError && !signedUrl ? (
                <div className="flex-1 min-h-0 flex items-center justify-center text-muted-foreground px-4 text-center">
                  {loadError}
                </div>
              ) : !signedUrl ? (
                <div className="flex-1 min-h-0 flex items-center justify-center text-muted-foreground">
                  {copy.loadingPdf}
                </div>
              ) : (
                <div className="flex-1 min-h-0">
                  <PdfWorkspaceViewer fileUrl={signedUrl} />
                </div>
              )
            ) : (
              <div className="flex-1 min-h-0 flex items-center justify-center text-muted-foreground">
                {copy.selectPdf}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
