'use client';

import axios from 'axios';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bold, Italic, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/providers/language-provider';
import { PdfWorkspaceViewer } from '@/components/course/pdf-workspace-viewer';

interface StudentNote {
  userId: string;
  userEmail: string;
  userName: string | null;
  content: string;
  isBold: boolean;
  isItalic: boolean;
  fontSize: number;
  updatedAt: string;
}

interface LessonNotesEditorProps {
  courseId: string;
  lessonId: string;
  classLabel: string;
  lessonTitle: string;
  pdfAttachments?: {
    id: string;
    lessonId: string;
    name: string;
    url: string;
  }[];
  isPrivilegedViewer?: boolean;
  studentNotes?: StudentNote[];
}

interface NotesStyleState {
  isBold: boolean;
  isItalic: boolean;
  fontSize: number;
}

const MIN_FONT_SIZE = 11;
const MAX_FONT_SIZE = 14;

export function LessonNotesEditor({
  courseId,
  lessonId,
  classLabel,
  lessonTitle,
  pdfAttachments = [],
  isPrivilegedViewer = false,
  studentNotes = [],
}: LessonNotesEditorProps) {
  const { language } = useLanguage();
  const copy = {
    es: {
      pdfTitle: 'PDF de la clase',
      loadPdfError: 'No se puede cargar este PDF ahora mismo.',
      loadingPdf: 'Cargando PDF...',
      noPdf: 'No hay PDFs disponibles para esta clase.',
      downloadPdf: 'Descargar PDF seleccionado',
    },
    en: {
      pdfTitle: 'Class PDF',
      loadPdfError: 'Unable to load this PDF right now.',
      loadingPdf: 'Loading PDF...',
      noPdf: 'No PDFs are available for this lesson.',
      downloadPdf: 'Download selected PDF',
    },
    fr: {
      pdfTitle: 'PDF du cours',
      loadPdfError: 'Impossible de charger ce PDF pour le moment.',
      loadingPdf: 'Chargement du PDF...',
      noPdf: 'Aucun PDF disponible pour cette leçon.',
      downloadPdf: 'Télécharger le PDF sélectionné',
    },
    pt: {
      pdfTitle: 'PDF da aula',
      loadPdfError: 'No fue posible cargar este PDF ahora.',
      loadingPdf: 'Carregando PDF...',
      noPdf: 'No hay PDF disponibles para esta lección.',
      downloadPdf: 'Baixar PDF selecionado',
    },
  }[language === 'pt' ? 'es' : language];

  const notesStorageKey = useMemo(
    () => `lesson-notes:${courseId}:${lessonId}`,
    [courseId, lessonId]
  );

  const styleStorageKey = useMemo(
    () => `lesson-notes-style:${courseId}:${lessonId}`,
    [courseId, lessonId]
  );

  const [content, setContent] = useState('');
  const [styleState, setStyleState] = useState<NotesStyleState>({
    isBold: false,
    isItalic: false,
    fontSize: 13,
  });
  const [isHydrated, setIsHydrated] = useState(false);
  const [selectedPdfId, setSelectedPdfId] = useState<string | null>(
    pdfAttachments[0]?.id ?? null,
  );
  const [pdfSignedUrl, setPdfSignedUrl] = useState('');
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [pdfLoadError, setPdfLoadError] = useState('');

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pdfRequestIdRef = useRef(0);

  const selectedPdf = useMemo(
    () => pdfAttachments.find((attachment) => attachment.id === selectedPdfId) ?? pdfAttachments[0] ?? null,
    [pdfAttachments, selectedPdfId],
  );

  const buildInlineProxyUrl = useCallback((attachment: {
    lessonId: string;
    id: string;
  }) => {
    const params = new URLSearchParams({
      download: '0',
      language,
      proxy: '1',
    });

    return `/api/lessons/${attachment.lessonId}/attachments/${attachment.id}?${params.toString()}`;
  }, [language]);

  const getAttachmentSignedUrl = useCallback(
    async (attachment: { lessonId: string; id: string }, download = false) => {
      const response = await axios.get(
        `/api/lessons/${attachment.lessonId}/attachments/${attachment.id}`,
        {
          params: {
            download: download ? 1 : 0,
            language,
          },
        },
      );

      return response.data as {
        signedUrl?: string;
      };
    },
    [language],
  );

  const loadSignedPdfUrl = useCallback(async (attachment: {
    lessonId: string;
    id: string;
    url: string;
  }) => {
    const requestId = ++pdfRequestIdRef.current;
    setIsLoadingPdf(true);
    setPdfLoadError('');

    try {
      const response = await getAttachmentSignedUrl(attachment, false);
      if (requestId !== pdfRequestIdRef.current) return;

      if (response.signedUrl) {
        setPdfSignedUrl(response.signedUrl);
        return;
      }

      setPdfSignedUrl(buildInlineProxyUrl(attachment));
    } catch (error: unknown) {
      if (requestId !== pdfRequestIdRef.current) return;

      if (attachment.url) {
        setPdfSignedUrl(attachment.url);
        setPdfLoadError('');
        return;
      }

      const message = axios.isAxiosError(error)
        ? (error.response?.data?.error as string | undefined) || copy.loadPdfError
        : copy.loadPdfError;
      setPdfLoadError(message);
      setPdfSignedUrl('');
    } finally {
      if (requestId === pdfRequestIdRef.current) {
        setIsLoadingPdf(false);
      }
    }
  }, [buildInlineProxyUrl, copy.loadPdfError, getAttachmentSignedUrl]);

  const downloadSelectedPdf = async () => {
    if (!selectedPdf) return;

    try {
      const response = await getAttachmentSignedUrl(selectedPdf, true);
      const signedUrl = response.signedUrl || selectedPdf.url;
      window.open(signedUrl, '_blank', 'noopener,noreferrer');
    } catch {
      window.open(selectedPdf.url, '_blank', 'noopener,noreferrer');
    }
  };

  useEffect(() => {
    setSelectedPdfId((current) => {
      if (!pdfAttachments.length) return null;
      if (current && pdfAttachments.some((attachment) => attachment.id === current)) {
        return current;
      }
      return pdfAttachments[0].id;
    });
  }, [lessonId, pdfAttachments]);

  useEffect(() => {
    if (!selectedPdf) {
      setPdfSignedUrl('');
      setPdfLoadError('');
      return;
    }

    void loadSignedPdfUrl(selectedPdf);
  }, [loadSignedPdfUrl, selectedPdf]);

  useEffect(() => {
    let cancelled = false;

    const hydrateNotes = async () => {
      const savedNotes = window.localStorage.getItem(notesStorageKey) || '';
      const rawStyle = window.localStorage.getItem(styleStorageKey);

      let fallbackStyle: NotesStyleState = {
        isBold: false,
        isItalic: false,
        fontSize: 13,
      };

      if (rawStyle) {
        try {
          const parsed = JSON.parse(rawStyle) as Partial<NotesStyleState>;
          fallbackStyle = {
            isBold: Boolean(parsed.isBold),
            isItalic: Boolean(parsed.isItalic),
            fontSize:
              typeof parsed.fontSize === 'number'
                ? Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, parsed.fontSize))
                : 13,
          };
        } catch {
          fallbackStyle = {
            isBold: false,
            isItalic: false,
            fontSize: 13,
          };
        }
      }

      try {
        const response = await fetch(
          `/api/dashboard/notes?courseId=${encodeURIComponent(courseId)}&lessonId=${encodeURIComponent(lessonId)}`
        );
        const data = await response.json();

        if (cancelled) return;

        if (response.ok && data.note) {
          setContent(String(data.note.content || ''));
          setStyleState({
            isBold: Boolean(data.note.isBold),
            isItalic: Boolean(data.note.isItalic),
            fontSize:
              typeof data.note.fontSize === 'number'
                ? Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, data.note.fontSize))
                : 13,
          });
          setIsHydrated(true);
          return;
        }
      } catch {
      }

      if (!cancelled) {
        setContent(savedNotes);
        setStyleState(fallbackStyle);
        setIsHydrated(true);
      }
    };

    void hydrateNotes();

    return () => {
      cancelled = true;
    };
  }, [courseId, lessonId, notesStorageKey, styleStorageKey]);

  const persistStyle = (next: NotesStyleState) => {
    setStyleState(next);
    window.localStorage.setItem(styleStorageKey, JSON.stringify(next));
  };

  const handleFontChange = (delta: number) => {
    const nextSize = Math.max(
      MIN_FONT_SIZE,
      Math.min(MAX_FONT_SIZE, styleState.fontSize + delta)
    );
    persistStyle({ ...styleState, fontSize: nextSize });
  };

  useEffect(() => {
    if (!isHydrated) return;

    window.localStorage.setItem(notesStorageKey, content);
    window.localStorage.setItem(styleStorageKey, JSON.stringify(styleState));

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      void fetch('/api/dashboard/notes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId,
          lessonId,
          content,
          isBold: styleState.isBold,
          isItalic: styleState.isItalic,
          fontSize: styleState.fontSize,
        }),
      });
    }, 450);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [content, courseId, isHydrated, lessonId, notesStorageKey, styleState, styleStorageKey]);

  return (
    <div className="max-w-[1200px] mx-auto space-y-4 sm:space-y-5">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">Mis notas</h1>
        <p className="text-muted-foreground mt-1">
          {classLabel}: {lessonTitle}
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-2 border border-border rounded-lg p-2 bg-background">
          <Button
            type="button"
            variant={styleState.isBold ? 'default' : 'outline'}
            onClick={() => persistStyle({ ...styleState, isBold: !styleState.isBold })}
            className="h-9 px-3"
            title="Bold"
            aria-label="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant={styleState.isItalic ? 'default' : 'outline'}
            onClick={() => persistStyle({ ...styleState, isItalic: !styleState.isItalic })}
            className="h-9 px-3"
            title="Italic"
            aria-label="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => handleFontChange(-1)}
            disabled={styleState.fontSize <= MIN_FONT_SIZE}
            className="h-9 px-3"
            title="Decrease font"
            aria-label="Decrease font"
          >
            <Minus className="h-4 w-4" />
          </Button>

          <span className="text-sm text-muted-foreground min-w-14 text-center">
            {styleState.fontSize}px
          </span>

          <Button
            type="button"
            variant="outline"
            onClick={() => handleFontChange(1)}
            disabled={styleState.fontSize >= MAX_FONT_SIZE}
            className="h-9 px-3"
            title="Increase font"
            aria-label="Increase font"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <textarea
          value={content}
          onChange={(event) => {
            setContent(event.target.value);
          }}
          placeholder="DIGITE AQUI"
          className="w-full min-h-[420px] resize-y rounded-lg border-2 border-border bg-background p-4 sm:p-5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50"
          style={{
            fontWeight: styleState.isBold ? 700 : 400,
            fontStyle: styleState.isItalic ? 'italic' : 'normal',
            fontSize: `${styleState.fontSize}px`,
            lineHeight: 1.6,
          }}
        />
      </div>

      <div className="bg-card border border-border rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-foreground">{copy.pdfTitle}</h2>
          {selectedPdf ? (
            <Button
              type="button"
              variant="outline"
              onClick={downloadSelectedPdf}
            >
              {copy.downloadPdf}
            </Button>
          ) : null}
        </div>

        {pdfAttachments.length === 0 ? (
          <p className="text-sm text-muted-foreground">{copy.noPdf}</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {pdfAttachments.map((attachment) => {
                const isActive = selectedPdf?.id === attachment.id;
                return (
                  <Button
                    key={attachment.id}
                    type="button"
                    variant={isActive ? 'default' : 'outline'}
                    className="max-w-full"
                    onClick={() => setSelectedPdfId(attachment.id)}
                  >
                    <span className="truncate max-w-[240px]">{attachment.name}</span>
                  </Button>
                );
              })}
            </div>

            <div className="h-[72dvh] rounded-lg border border-border overflow-hidden bg-background">
              {isLoadingPdf ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  {copy.loadingPdf}
                </div>
              ) : pdfLoadError && !pdfSignedUrl ? (
                <div className="h-full flex items-center justify-center text-muted-foreground px-4 text-center">
                  {pdfLoadError}
                </div>
              ) : selectedPdf ? (
                <PdfWorkspaceViewer fileUrl={pdfSignedUrl || selectedPdf.url} compact />
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground px-4 text-center">
                  {copy.noPdf}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {isPrivilegedViewer && (
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Notas de estudiantes</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Notas guardadas por estudiantes para esta clase.
            </p>
          </div>

          {studentNotes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay notas de estudiantes guardadas.</p>
          ) : (
            <div className="space-y-3">
              {studentNotes.map((note) => (
                <article
                  key={`${note.userId}-${note.updatedAt}`}
                  className="rounded-lg border border-border bg-background p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {note.userName?.trim() || note.userEmail || note.userId}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(note.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{note.userEmail}</p>
                  <div
                    className="mt-2 whitespace-pre-wrap break-words text-foreground"
                    style={{
                      fontWeight: note.isBold ? 700 : 400,
                      fontStyle: note.isItalic ? 'italic' : 'normal',
                      fontSize: `${Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, note.fontSize))}px`,
                      lineHeight: 1.6,
                    }}
                  >
                    {note.content || '—'}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
