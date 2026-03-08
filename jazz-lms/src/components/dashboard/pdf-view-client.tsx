'use client';

import { useEffect, useMemo, useState } from 'react';
import { FileText } from 'lucide-react';
import axios from 'axios';
import { useLanguage } from '@/components/providers/language-provider';

interface PdfItem {
  id: string;
  lessonId: string;
  title: string;
  classLabel: string;
  url: string;
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
    },
    en: {
      loadPdfError: 'Unable to load this PDF right now.',
      title: 'PDF View',
      subtitle: 'Quick access to lesson PDFs inside your dashboard',
      noPdfsTitle: 'No PDFs available yet',
      noPdfsDesc: 'Lesson PDFs will appear here when they are added.',
      loadingPdf: 'Loading PDF...',
      selectPdf: 'Select a PDF',
    },
    fr: {
      loadPdfError: 'Impossible de charger ce PDF pour le moment.',
      title: 'Vue PDF',
      subtitle: 'Accès rapide aux PDF des leçons dans votre tableau de bord',
      noPdfsTitle: 'Aucun PDF disponible pour le moment',
      noPdfsDesc: 'Les PDF des leçons apparaîtront ici lorsqu’ils seront ajoutés.',
      loadingPdf: 'Chargement du PDF...',
      selectPdf: 'Sélectionnez un PDF',
    },
    pt: {
      loadPdfError: 'Não foi possível carregar este PDF agora.',
      title: 'Visualização de PDFs',
      subtitle: 'Acesso rápido aos PDFs das aulas dentro do seu painel',
      noPdfsTitle: 'Ainda não há PDFs disponíveis',
      noPdfsDesc: 'Os PDFs das aulas aparecerão aqui quando forem adicionados.',
      loadingPdf: 'Carregando PDF...',
      selectPdf: 'Selecione um PDF',
    },
  }[language];

  const [selectedId, setSelectedId] = useState(items[0]?.id ?? null);
  const [signedUrl, setSignedUrl] = useState<string>(items[0]?.url ?? '');
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? items[0],
    [items, selectedId]
  );

  const loadSignedUrl = async (item: PdfItem) => {
    setIsLoading(true);
    setLoadError('');

    try {
      const response = await axios.get(
        `/api/lessons/${item.lessonId}/attachments/${item.id}`,
        { params: { download: 0 } }
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

  useEffect(() => {
    if (!selected) {
      setSignedUrl('');
      setLoadError('');
      return;
    }

    void loadSignedUrl(selected);
  }, [selected?.id]);

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
              {items.map((item) => {
                const active = selected?.id === item.id;
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
              isLoading ? (
                <div className="h-[calc(72dvh-58px)] flex items-center justify-center text-muted-foreground">
                  {copy.loadingPdf}
                </div>
              ) : loadError && !signedUrl ? (
                <div className="h-[calc(72dvh-58px)] flex items-center justify-center text-muted-foreground px-4 text-center">
                  {loadError}
                </div>
              ) : (
              <iframe
                src={signedUrl || selected.url}
                title={selected.title}
                className="w-full h-[calc(72dvh-58px)]"
              />
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
