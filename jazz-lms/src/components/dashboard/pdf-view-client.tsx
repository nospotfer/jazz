'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { FileText, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useLanguage } from '@/components/providers/language-provider';
import { LANGUAGE_LABELS, type SupportedLanguage } from '@/lib/language';
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
  language: SupportedLanguage;
  documentKey: string;
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
      downloadLanguage: 'Idioma de descarga',
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
      downloadLanguage: 'Download language',
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
      downloadLanguage: 'Langue du téléchargement',
      downloadSelectedPdf: 'Télécharger le PDF sélectionné',
      auxiliaryLabel: 'Notes auxiliaires',
      auxiliaryTitle: 'Note auxiliaire',
    },
    pt: {
      loadPdfError: 'Não foi possível carregar este PDF agora.',
      title: 'Visualização de PDFs',
      subtitle: 'Acesso rápido aos PDFs das aulas dentro do seu painel',
      noPdfsTitle: 'Ainda não há PDFs disponíveis',
      noPdfsDesc: 'Os PDFs das aulas aparecerão aqui quando forem adicionados.',
      loadingPdf: 'Carregando PDF...',
      selectPdf: 'Selecione um PDF',
      downloadLanguage: 'Idioma do download',
      downloadSelectedPdf: 'Baixar PDF selecionado',
      auxiliaryLabel: 'Notas auxiliares',
      auxiliaryTitle: 'Nota auxiliar',
    },
  }[language];

  const [selectedId, setSelectedId] = useState(items[0]?.id ?? null);
  const [downloadLanguage, setDownloadLanguage] = useState<SupportedLanguage>(language);
  const [signedUrl, setSignedUrl] = useState<string>(items[0]?.url ?? '');
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

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

  const loadSignedUrl = async (item: PdfItem, targetLanguage: SupportedLanguage) => {
    setIsLoading(true);
    setLoadError('');

    try {
      const response = await axios.get(
        `/api/lessons/${item.lessonId}/attachments/${item.id}`,
        { params: { download: 0, language: targetLanguage } }
      );

      setSignedUrl(response.data?.signedUrl || item.url);
    } catch (error: any) {
      const message = error?.response?.data?.error || copy.loadPdfError;
      setLoadError(message);
      setSignedUrl(item.url);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (item: PdfItem) => {
    setSelectedId(item.id);
  };

  const downloadSelected = async () => {
    if (!selected) return;

    try {
      const response = await axios.get(
        `/api/lessons/${selected.lessonId}/attachments/${selected.id}`,
        {
          params: {
            download: 1,
            language: downloadLanguage,
          },
        }
      );

      const signed = response.data?.signedUrl || selected.url;
      window.open(signed, '_blank', 'noopener,noreferrer');
    } catch {
      window.open(selected.url, '_blank', 'noopener,noreferrer');
    }
  };

  useEffect(() => {
    setDownloadLanguage(language);
  }, [language]);

  useEffect(() => {
    if (!selected) {
      setSignedUrl('');
      setLoadError('');
      return;
    }

    void loadSignedUrl(selected, language);
  }, [selected?.id, language]);

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

          <div className="rounded-xl border border-border bg-card overflow-hidden min-h-[72dvh]">
            <div className="px-4 py-3 border-b border-border bg-card/80">
              <p className="text-sm font-medium text-foreground">{selectedLocalized?.displayClassLabel}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{selectedLocalized?.displayTitle}</p>
              {selectedLocalized ? (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-end">
                  <label className="text-xs text-muted-foreground space-y-1">
                    <span className="block">{copy.downloadLanguage}</span>
                    <select
                      value={downloadLanguage}
                      onChange={(event) => setDownloadLanguage(event.target.value as SupportedLanguage)}
                      className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
                    >
                      {Object.entries(LANGUAGE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
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
                <div className="h-[calc(72dvh-58px)] flex items-center justify-center text-muted-foreground">
                  {copy.loadingPdf}
                </div>
              ) : loadError && !signedUrl ? (
                <div className="h-[calc(72dvh-58px)] flex items-center justify-center text-muted-foreground px-4 text-center">
                  {loadError}
                </div>
              ) : (
                <div className="h-[calc(72dvh-58px)]">
                  <PdfWorkspaceViewer fileUrl={signedUrl || selectedLocalized.url} />
                </div>
              )
            ) : (
              <div className="h-[calc(72dvh-58px)] flex items-center justify-center text-muted-foreground">
                {copy.selectPdf}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
