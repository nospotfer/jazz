'use client';
import MuxPlayer from '@mux/mux-player-react';
import { Button } from '../ui/button';
import { CheckCircle, Download, Music2, Youtube, NotebookPen, Lock, ShoppingCart, FileText, Eye, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';
import { Chapter, Course, Lesson, Attachment } from '@prisma/client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useConfettiStore } from '@/hooks/use-confetti-store';
import { toast } from 'sonner';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { DEFAULT_LESSON_DURATION_MINUTES } from '@/lib/pricing';
import { DashboardPreferencesProvider } from '@/components/providers/dashboard-preferences-provider';
import { getCanonicalJazzClass } from '@/lib/course-lessons';
import { extractMuxPlaybackId } from '@/lib/mux-playback';

const PdfWorkspaceViewer = dynamic(
  () => import('@/components/course/pdf-workspace-viewer').then((mod) => mod.PdfWorkspaceViewer),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
        Loading PDF preview...
      </div>
    ),
  }
);

interface CoursePlayerProps {
  course: Course & {
    chapters: (Chapter & {
      lessons: (Lesson & {
        attachments: Attachment[];
      })[];
    })[];
  };
  lesson: Lesson & {
    attachments: Attachment[];
  };
  lessonId: string;
  initialIsCompleted: boolean;
  initialProgressPercent: number;
  canAccessLesson: boolean;
  canAccessAttachments: boolean;
}

function isAuxiliaryAttachment(name: string) {
  return /auxiliar|auxiliares|auxiliary|support/i.test(name);
}

function getAttachmentDisplayName(name: string, classNumber: number | null) {
  const withoutExtension = name.replace(/\.pdf$/i, '').trim();
  const simplified = withoutExtension
    .replace(/^apuntes?\s*(auxiliares?)?\s*\d*\s*[-–—:]\s*/i, '')
    .replace(/^apunte\s*(da|de)?\s*(aula|classe)?\s*\d*\s*[-–—:]\s*/i, '')
    .trim();

  if (!simplified) {
    return classNumber ? `Apunte da Classe ${classNumber}` : 'Apunte da Classe';
  }

  return simplified;
}

export const CoursePlayer = ({
  course,
  lesson,
  lessonId,
  initialIsCompleted,
  initialProgressPercent,
  canAccessLesson,
  canAccessAttachments,
}: CoursePlayerProps) => {
  const [isReady, setIsReady] = useState(false);
  const [lastSavedPercent, setLastSavedPercent] = useState(initialProgressPercent);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(initialIsCompleted);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [playbackId, setPlaybackId] = useState('');
  const [playbackToken, setPlaybackToken] = useState('');
  const [thumbnailToken, setThumbnailToken] = useState('');
  const [storyboardToken, setStoryboardToken] = useState('');
  const [playbackError, setPlaybackError] = useState('');
  const [selectedAttachmentId, setSelectedAttachmentId] = useState<string | null>(
    lesson.attachments[0]?.id ?? null
  );
  const [previewUrl, setPreviewUrl] = useState('');
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const [isNotesPanelOpen, setIsNotesPanelOpen] = useState(true);
  const previewUrlRef = useRef('');
  const router = useRouter();
  const confetti = useConfettiStore();

  const orderedLessons = useMemo(
    () => course.chapters.flatMap((chapter) => chapter.lessons),
    [course.chapters]
  );

  const classIndex = orderedLessons.findIndex((item) => item.id === lessonId);
  const classNumber = classIndex >= 0 ? classIndex + 1 : null;
  const canonicalClass = classNumber ? getCanonicalJazzClass(classNumber) : undefined;
  const lessonDisplayTitle = lesson.title || canonicalClass?.subtitle || 'Lesson';
  const classLabel = classNumber ? `Class ${classNumber}: ${lessonDisplayTitle}` : lessonDisplayTitle;

  const visibleAttachments = useMemo(
    () => lesson.attachments.filter((attachment) => !isAuxiliaryAttachment(attachment.name)),
    [lesson.attachments]
  );

  const selectedAttachment = useMemo(
    () => visibleAttachments.find((attachment) => attachment.id === selectedAttachmentId) ?? null,
    [visibleAttachments, selectedAttachmentId]
  );
  const effectivePlaybackId = playbackId || extractMuxPlaybackId(lesson.videoUrl);
  const canRenderMuxPlayer = Boolean(canAccessLesson && effectivePlaybackId && playbackToken);
  const muxTokens = useMemo(() => {
    const hasAnyToken = Boolean(playbackToken || thumbnailToken || storyboardToken);
    if (!hasAnyToken) {
      return undefined;
    }

    return {
      playback: playbackToken || undefined,
      thumbnail: thumbnailToken || undefined,
      storyboard: storyboardToken || undefined,
    };
  }, [playbackToken, thumbnailToken, storyboardToken]);
  const playbackPosterUrl = useMemo(() => {
    if (!effectivePlaybackId) {
      return '';
    }

    const baseUrl = `https://image.mux.com/${effectivePlaybackId}/thumbnail.webp?time=1`;
    if (!thumbnailToken) {
      return baseUrl;
    }

    return `${baseUrl}&token=${encodeURIComponent(thumbnailToken)}`;
  }, [effectivePlaybackId, thumbnailToken]);

  useEffect(() => {
    previewUrlRef.current = previewUrl;
  }, [previewUrl]);

  useEffect(() => {
    setSelectedAttachmentId(visibleAttachments[0]?.id ?? null);
    setPreviewUrl((currentUrl) => {
      if (currentUrl.startsWith('blob:')) {
        URL.revokeObjectURL(currentUrl);
      }
      return '';
    });
    setPdfError('');
  }, [lesson.id, visibleAttachments]);

  useEffect(() => {
    return () => {
      const currentUrl = previewUrlRef.current;
      if (currentUrl.startsWith('blob:')) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadPlayback = async () => {
      if (!canAccessLesson) {
        setPlaybackId('');
        setPlaybackToken('');
        setThumbnailToken('');
        setStoryboardToken('');
        setPlaybackError('');
        return;
      }

      setPlaybackError('');

      try {
        const response = await axios.get(`/api/lessons/${lesson.id}/mux-playback`);
        if (cancelled) return;

        setPlaybackId(response.data.playbackId || '');
        setPlaybackToken(response.data.playbackToken || '');
        setThumbnailToken(response.data.thumbnailToken || '');
        setStoryboardToken(response.data.storyboardToken || '');
      } catch (error: any) {
        if (cancelled) return;

        const responseError = error?.response?.data?.error;

        if (responseError) {
          setPlaybackId('');
          setPlaybackToken('');
          setThumbnailToken('');
          setStoryboardToken('');
          setPlaybackError(responseError);
          return;
        }

        setPlaybackId('');
        setPlaybackToken('');
        setThumbnailToken('');
        setStoryboardToken('');
        setPlaybackError('Unable to load signed playback for this lesson right now.');
      }
    };

    loadPlayback();

    return () => {
      cancelled = true;
    };
  }, [canAccessLesson, lesson.id]);

  const getAttachmentSignedUrl = async (attachmentId: string, download = false) => {
    const response = await axios.get(
      `/api/lessons/${lesson.id}/attachments/${attachmentId}`,
      {
        params: {
          download: download ? 1 : 0,
        },
      }
    );

    return response.data as { signedUrl: string; name: string; storagePath: string };
  };

  const openPdfPreview = async (attachmentId: string) => {
    if (!canAccessAttachments) return;

    setIsLoadingPdf(true);
    setPdfError('');

    try {
      const data = await getAttachmentSignedUrl(attachmentId, false);

      setSelectedAttachmentId(attachmentId);
      setPreviewUrl((currentUrl) => {
        if (currentUrl.startsWith('blob:')) {
          URL.revokeObjectURL(currentUrl);
        }
        return data.signedUrl;
      });
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Unable to load this PDF right now.';
      const fallbackAttachment = lesson.attachments.find((item) => item.id === attachmentId);
      if (fallbackAttachment?.url) {
        setSelectedAttachmentId(attachmentId);
        setPreviewUrl((currentUrl) => {
          if (currentUrl.startsWith('blob:')) {
            URL.revokeObjectURL(currentUrl);
          }
          return fallbackAttachment.url;
        });
        setPdfError('');
        toast.info('Loaded PDF using legacy direct URL fallback.');
      } else {
        setPdfError(message);
        toast.error(message);
      }
    } finally {
      setIsLoadingPdf(false);
    }
  };

  const downloadPdf = async (attachmentId: string) => {
    if (!canAccessAttachments) return;

    try {
      const data = await getAttachmentSignedUrl(attachmentId, true);
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (error: any) {
      const fallbackAttachment = lesson.attachments.find((item) => item.id === attachmentId);
      if (fallbackAttachment?.url) {
        window.open(fallbackAttachment.url, '_blank', 'noopener,noreferrer');
        toast.info('Download opened using legacy direct URL fallback.');
        return;
      }

      const message = error?.response?.data?.error || 'Unable to download this PDF right now.';
      toast.error(message);
    }
  };

  const handlePurchaseClick = async () => {
    if (isPurchasing) return;

    setIsPurchasing(true);
    try {
      const response = await axios.post('/api/checkout', {
        courseId: course.id,
        source: 'dashboard',
      });

      if (response.data?.url) {
        window.location.assign(response.data.url);
        return;
      }
    } catch {
      toast.error('Unable to start checkout right now.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const musicSearch = encodeURIComponent(`${lesson.title} ${course.title}`);
  const musicLinks = [
    {
      label: 'Spotify',
      href: `https://open.spotify.com/search/${musicSearch}`,
    },
    {
      label: 'Apple Music',
      href: `https://music.apple.com/search?term=${musicSearch}`,
    },
    {
      label: 'Amazon Music',
      href: `https://music.amazon.com/search/${musicSearch}`,
    },
    {
      label: 'YouTube',
      href: `https://www.youtube.com/results?search_query=${musicSearch}`,
    },
  ];

  const onTimeUpdate = async (event: Event) => {
    if (isCompleted || !canAccessLesson) return;

    const target = event.target as HTMLVideoElement | null;

    if (!target) return;

    const duration = Number.isFinite(target.duration) && target.duration > 0
      ? target.duration
      : DEFAULT_LESSON_DURATION_MINUTES * 60;

    const current = Number.isFinite(target.currentTime) ? target.currentTime : 0;
    const percent = Math.max(0, Math.min(100, Math.round((current / duration) * 100)));

    if (percent < 1 || percent >= 100 || percent - lastSavedPercent < 10) {
      return;
    }

    setLastSavedPercent(percent);

    try {
      const minutesRemaining = Math.max(0, Math.ceil((duration - current) / 60));

      await axios.put(`/api/courses/${course.id}/lessons/${lesson.id}/progress`, {
        isCompleted: false,
        progressPercent: percent,
        minutesRemaining,
      });
    } catch {
      // Silent fail for background progress sync
    }
  };

  const completeLesson = async () => {
    if (isCompleting || isCompleted || !canAccessLesson) return;

    setIsCompleting(true);
    try {
      await axios.put(
        `/api/courses/${course.id}/lessons/${lesson.id}/progress`,
        {
          isCompleted: true,
          progressPercent: 100,
          minutesRemaining: 0,
        }
      );

      setIsCompleted(true);
      confetti.onOpen();
      toast.success('Lesson completed!');
      router.refresh();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsCompleting(false);
    }
  };

  const resetLessonCompletion = async () => {
    if (isCompleting || !canAccessLesson) return;

    setIsCompleting(true);
    try {
      await axios.put(
        `/api/courses/${course.id}/lessons/${lesson.id}/progress`,
        {
          isCompleted: false,
          progressPercent: 0,
          minutesRemaining: DEFAULT_LESSON_DURATION_MINUTES,
        }
      );

      setIsCompleted(false);
      setLastSavedPercent(0);
      toast.success('Lesson progress reset.');
      router.refresh();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsCompleting(false);
    }
  };

  const onEnded = async (event: Event) => {
    if (isCompleted || !canAccessLesson) return;

    const target = event.target as HTMLVideoElement | null;
    if (!target) return;

    const duration = Number.isFinite(target.duration) ? target.duration : NaN;
    const current = Number.isFinite(target.currentTime) ? target.currentTime : 0;
    const watchedPercent = Number.isFinite(duration) && duration > 0
      ? (current / duration) * 100
      : 0;

    const shouldCompleteByPlayback = watchedPercent >= 95 || lastSavedPercent >= 90;
    if (!shouldCompleteByPlayback) return;

    await completeLesson();
  };

  const onMarkAsComplete = async () => {
    if (!canAccessLesson) return;

    if (isCompleted) {
      await resetLessonCompletion();
      return;
    }

    await completeLesson();
  };

  const firstAttachmentId = visibleAttachments[0]?.id;

  useEffect(() => {
    if (!canAccessAttachments || !firstAttachmentId) {
      return;
    }

    void openPdfPreview(firstAttachmentId);
  }, [lesson.id, canAccessAttachments, firstAttachmentId]);

  return (
    <DashboardPreferencesProvider>
      <div className="h-[100dvh] overflow-hidden bg-background">
        <Sidebar />

        <div className="lg:pl-56 h-full overflow-hidden p-3 sm:p-4 lg:p-6">
          <div className={`mx-auto h-full grid grid-cols-1 gap-4 lg:gap-5 min-h-0 ${isNotesPanelOpen ? 'xl:grid-cols-2' : 'xl:grid-cols-1'}`}>
            <div className="min-w-0 min-h-0 flex flex-col gap-4">
              <div className="bg-card border-2 border-primary/50 rounded-xl overflow-hidden shadow-[0_0_0_1px_rgba(212,175,55,0.18)] h-full flex flex-col">
                <div className="p-4 sm:p-5 border-b-2 border-primary/45 bg-gradient-to-r from-primary/10 to-transparent">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <h2 className="text-2xl sm:text-3xl font-bold font-serif text-primary break-words leading-tight lg:flex-1 lg:pr-4">
                      {classLabel}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 lg:justify-end lg:max-w-[62%]">
                      {musicLinks.map((platform) => (
                        <a
                          key={platform.label}
                          href={platform.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex shrink-0 items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-primary/40 bg-background/90 hover:bg-accent text-sm text-foreground transition-colors"
                        >
                          {platform.label === 'YouTube' ? (
                            <Youtube className="h-4 w-4 text-primary" />
                          ) : (
                            <Music2 className="h-4 w-4 text-primary" />
                          )}
                          <span>{platform.label}</span>
                        </a>
                      ))}
                      <Button
                        type="button"
                        onClick={onMarkAsComplete}
                        disabled={isCompleting || !canAccessLesson}
                        className="shrink-0"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {isCompleting
                          ? 'Saving...'
                          : isCompleted
                          ? 'Completed (Click to reset)'
                          : 'Mark as Complete'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsNotesPanelOpen((current) => !current)}
                        className="shrink-0"
                      >
                        {isNotesPanelOpen ? (
                          <>
                            <PanelRightClose className="h-4 w-4 mr-2" />
                            Hide Apunte
                          </>
                        ) : (
                          <>
                            <PanelRightOpen className="h-4 w-4 mr-2" />
                            Show Apunte
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="relative flex-1 min-h-[360px] bg-black">
                  {canRenderMuxPlayer ? (
                    <MuxPlayer
                      className="absolute inset-0 h-full w-full"
                      playbackId={effectivePlaybackId}
                      tokens={muxTokens}
                      poster={playbackPosterUrl || undefined}
                      accentColor="#d4af37"
                      onCanPlay={() => setIsReady(true)}
                      onEnded={(event) => onEnded(event as unknown as Event)}
                      onTimeUpdate={onTimeUpdate}
                      autoPlay
                      playsInline
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                      {canAccessLesson ? (
                        <p className="text-sm text-muted-foreground">
                          {playbackError || 'Loading signed lesson video...'}
                        </p>
                      ) : (
                        <div className="max-w-md space-y-3">
                          <div className="mx-auto w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center">
                            <Lock className="h-6 w-6 text-primary" />
                          </div>
                          <h3 className="text-lg font-semibold text-foreground">This lesson is locked</h3>
                          <p className="text-sm text-muted-foreground">
                            Purchase the full course to watch all classes with high-quality Mux playback.
                          </p>
                          <Button onClick={handlePurchaseClick} disabled={isPurchasing} className="w-full sm:w-auto">
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            {isPurchasing ? 'Opening checkout...' : 'Unlock full course'}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {isNotesPanelOpen ? (
            <aside className="bg-card border-2 border-primary/55 rounded-xl p-4 sm:p-5 flex flex-col min-h-0 h-full overflow-hidden shadow-[0_0_0_1px_rgba(212,175,55,0.18)]">
              {canAccessLesson ? (
                <>
                  <p className="text-base sm:text-lg font-semibold text-primary mb-3 flex items-center gap-2.5">
                    <FileText className="h-5 w-5 text-primary" />
                    Apunte da Classe
                  </p>

                  {!canAccessAttachments ? (
                    <div className="flex-1 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                      PDFs are available after purchasing the full course.
                    </div>
                  ) : visibleAttachments.length === 0 ? (
                    <div className="flex-1 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                      Nenhum apunte principal foi encontrado para esta aula.
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2 max-h-44 overflow-auto pr-1">
                        {visibleAttachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className={`rounded-lg border p-2.5 ${
                              selectedAttachmentId === attachment.id
                                ? 'border-primary/50 bg-primary/5'
                                : 'border-border bg-background'
                            }`}
                          >
                            <p
                              className="text-sm font-medium text-foreground truncate"
                              title={getAttachmentDisplayName(attachment.name, classNumber)}
                            >
                              {getAttachmentDisplayName(attachment.name, classNumber)}
                            </p>
                            <div className="mt-2 flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => openPdfPreview(attachment.id)}
                                disabled={isLoadingPdf}
                              >
                                <Eye className="h-4 w-4 mr-1.5" />
                                Preview
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => downloadPdf(attachment.id)}
                              >
                                <Download className="h-4 w-4 mr-1.5" />
                                Download
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 flex-1 min-h-[420px] rounded-lg border-2 border-primary/40 bg-background overflow-hidden">
                        {isLoadingPdf ? (
                          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                            Loading PDF preview...
                          </div>
                        ) : pdfError ? (
                          <div className="h-full flex items-center justify-center px-4 text-center text-sm text-muted-foreground">
                            {pdfError}
                          </div>
                        ) : previewUrl ? (
                          <PdfWorkspaceViewer fileUrl={previewUrl} />
                        ) : (
                          <div className="h-full flex items-center justify-center px-4 text-center text-sm text-muted-foreground">
                            Select a PDF to preview it here.
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="h-full flex flex-col justify-between gap-5">
                  <div>
                    <p className="text-base sm:text-lg font-semibold text-foreground mb-2 flex items-center gap-2.5">
                      <Lock className="h-5 w-5 text-primary" />
                      Premium access required
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      You are inside the lesson area, but video and notes are available only for students who purchased the full course.
                    </p>
                  </div>

                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                    <p className="text-sm font-medium text-foreground">What you unlock:</p>
                    <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                      <li>• Full access to all 15 classes</li>
                      <li>• Secure Mux HD playback</li>
                      <li>• Personal lesson notes</li>
                    </ul>
                    <Button onClick={handlePurchaseClick} disabled={isPurchasing} className="w-full mt-4">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {isPurchasing ? 'Opening checkout...' : 'Buy now and unlock'}
                    </Button>
                  </div>
                </div>
              )}
            </aside>
            ) : null}
          </div>

          {!isReady && (
            <div className="sr-only" aria-live="polite">
              Loading lesson player...
            </div>
          )}
        </div>
      </div>
    </DashboardPreferencesProvider>
  );
};
