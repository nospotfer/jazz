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
import { useLanguage } from '@/components/providers/language-provider';

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

function getAttachmentDisplayName(name: string, classNumber: number | null, noteLabel: string) {
  const withoutExtension = name.replace(/\.pdf$/i, '').trim();
  const simplified = withoutExtension
    .replace(/^apuntes?\s*(auxiliares?)?\s*\d*\s*[-–—:]\s*/i, '')
    .replace(/^apunte\s*(da|de)?\s*(aula|classe)?\s*\d*\s*[-–—:]\s*/i, '')
    .trim();

  if (!simplified) {
    return classNumber ? `${noteLabel} ${classNumber}` : noteLabel;
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
  const { language } = useLanguage();
  const copy = {
    es: {
      lessonFallback: 'Lección',
      classPrefix: 'Clase',
      saving: 'Guardando...',
      completedReset: 'Completada (clic para reiniciar)',
      markComplete: 'Marcar como completada',
      hideNotes: 'Ocultar apunte',
      showNotes: 'Mostrar apunte',
      openingCheckout: 'Abriendo pago...',
      unlockFullCourse: 'Desbloquear curso completo',
      classNote: 'Apunte de clase',
      preview: 'Vista previa',
      download: 'Descargar',
      selectPdf: 'Selecciona un PDF para previsualizarlo aquí.',
      loadingPlayer: 'Cargando reproductor de la lección...',
      unableSignedPlayback: 'No se pudo cargar el playback firmado de esta lección en este momento.',
      unableLoadPdf: 'No se pudo cargar este PDF en este momento.',
      loadedLegacyPdf: 'PDF cargado con la URL directa heredada.',
      loadedLegacyDownload: 'Descarga abierta usando URL directa heredada.',
      unableDownloadPdf: 'No se pudo descargar este PDF en este momento.',
      unableCheckout: 'No se pudo iniciar el pago en este momento.',
      lessonCompleted: '¡Lección completada!',
      somethingWrong: 'Algo salió mal',
      lessonReset: 'El progreso de la lección se reinició.',
      loadingSignedVideo: 'Cargando video firmado de la lección...',
      muxTokenError: 'Mux rechazó el token de reproducción. Verifica MUX_SIGNING_KEY_ID y MUX_SIGNING_PRIVATE_KEY.',
      lessonLockedTitle: 'Esta lección está bloqueada',
      lessonLockedDesc: 'Compra el curso completo para ver todas las clases con reproducción Mux en alta calidad.',
      pdfAfterPurchase: 'Los PDFs estarán disponibles después de comprar el curso completo.',
      noMainNotes: 'No se encontraron apuntes principales para esta lección.',
      loadingPdfPreview: 'Cargando vista previa del PDF...',
      premiumAccessRequired: 'Se requiere acceso premium',
      lessonAreaLockedDesc: 'Estás dentro del área de la lección, pero el video y los apuntes solo están disponibles para estudiantes con el curso completo.',
      whatYouUnlock: 'Qué desbloqueas:',
      unlockAllClasses: 'Acceso completo a las 15 clases',
      unlockMuxPlayback: 'Reproducción Mux HD segura',
      unlockNotes: 'Apuntes personales por lección',
      buyNowUnlock: 'Comprar ahora y desbloquear',
    },
    en: {
      lessonFallback: 'Lesson',
      classPrefix: 'Class',
      saving: 'Saving...',
      completedReset: 'Completed (Click to reset)',
      markComplete: 'Mark as Complete',
      hideNotes: 'Hide notes',
      showNotes: 'Show notes',
      openingCheckout: 'Opening checkout...',
      unlockFullCourse: 'Unlock full course',
      classNote: 'Class notes',
      preview: 'Preview',
      download: 'Download',
      selectPdf: 'Select a PDF to preview it here.',
      loadingPlayer: 'Loading lesson player...',
      unableSignedPlayback: 'Unable to load signed playback for this lesson right now.',
      unableLoadPdf: 'Unable to load this PDF right now.',
      loadedLegacyPdf: 'Loaded PDF using legacy direct URL fallback.',
      loadedLegacyDownload: 'Download opened using legacy direct URL fallback.',
      unableDownloadPdf: 'Unable to download this PDF right now.',
      unableCheckout: 'Unable to start checkout right now.',
      lessonCompleted: 'Lesson completed!',
      somethingWrong: 'Something went wrong',
      lessonReset: 'Lesson progress reset.',
      loadingSignedVideo: 'Loading signed lesson video...',
      muxTokenError: 'Mux rejected the playback token. Check MUX_SIGNING_KEY_ID and MUX_SIGNING_PRIVATE_KEY.',
      lessonLockedTitle: 'This lesson is locked',
      lessonLockedDesc: 'Purchase the full course to watch all classes with high-quality Mux playback.',
      pdfAfterPurchase: 'PDFs are available after purchasing the full course.',
      noMainNotes: 'No main notes were found for this lesson.',
      loadingPdfPreview: 'Loading PDF preview...',
      premiumAccessRequired: 'Premium access required',
      lessonAreaLockedDesc: 'You are inside the lesson area, but video and notes are available only for students who purchased the full course.',
      whatYouUnlock: 'What you unlock:',
      unlockAllClasses: 'Full access to all 15 classes',
      unlockMuxPlayback: 'Secure Mux HD playback',
      unlockNotes: 'Personal lesson notes',
      buyNowUnlock: 'Buy now and unlock',
    },
    fr: {
      lessonFallback: 'Leçon',
      classPrefix: 'Cours',
      saving: 'Enregistrement...',
      completedReset: 'Terminée (cliquez pour réinitialiser)',
      markComplete: 'Marquer comme terminée',
      hideNotes: 'Masquer les notes',
      showNotes: 'Afficher les notes',
      openingCheckout: 'Ouverture du paiement...',
      unlockFullCourse: 'Débloquer le cours complet',
      classNote: 'Notes du cours',
      preview: 'Aperçu',
      download: 'Télécharger',
      selectPdf: 'Sélectionnez un PDF pour l’aperçu ici.',
      loadingPlayer: 'Chargement du lecteur de leçon...',
      unableSignedPlayback: 'Impossible de charger la lecture sécurisée de cette leçon pour le moment.',
      unableLoadPdf: 'Impossible de charger ce PDF pour le moment.',
      loadedLegacyPdf: 'PDF chargé via URL directe héritée.',
      loadedLegacyDownload: 'Téléchargement ouvert via URL directe héritée.',
      unableDownloadPdf: 'Impossible de télécharger ce PDF pour le moment.',
      unableCheckout: 'Impossible de démarrer le paiement pour le moment.',
      lessonCompleted: 'Leçon terminée !',
      somethingWrong: 'Une erreur est survenue',
      lessonReset: 'Progression de la leçon réinitialisée.',
      loadingSignedVideo: 'Chargement de la vidéo sécurisée de la leçon...',
      muxTokenError: 'Mux a rejeté le token de lecture. Vérifiez MUX_SIGNING_KEY_ID et MUX_SIGNING_PRIVATE_KEY.',
      lessonLockedTitle: 'Cette leçon est verrouillée',
      lessonLockedDesc: 'Achetez le cours complet pour regarder toutes les leçons avec une lecture Mux HD.',
      pdfAfterPurchase: 'Les PDF sont disponibles après l’achat du cours complet.',
      noMainNotes: 'Aucune note principale trouvée pour cette leçon.',
      loadingPdfPreview: 'Chargement de l’aperçu PDF...',
      premiumAccessRequired: 'Accès premium requis',
      lessonAreaLockedDesc: 'Vous êtes dans la zone de leçon, mais la vidéo et les notes sont disponibles uniquement pour les étudiants ayant acheté le cours complet.',
      whatYouUnlock: 'Ce que vous débloquez :',
      unlockAllClasses: 'Accès complet aux 15 cours',
      unlockMuxPlayback: 'Lecture Mux HD sécurisée',
      unlockNotes: 'Notes de cours personnelles',
      buyNowUnlock: 'Acheter et débloquer',
    },
    pt: {
      lessonFallback: 'Aula',
      classPrefix: 'Aula',
      saving: 'Salvando...',
      completedReset: 'Concluída (clique para redefinir)',
      markComplete: 'Marcar como concluída',
      hideNotes: 'Ocultar anotações',
      showNotes: 'Mostrar anotações',
      openingCheckout: 'Abrindo checkout...',
      unlockFullCourse: 'Desbloquear curso completo',
      classNote: 'Anotações da aula',
      preview: 'Pré-visualizar',
      download: 'Baixar',
      selectPdf: 'Selecione um PDF para pré-visualizá-lo aqui.',
      loadingPlayer: 'Carregando player da aula...',
      unableSignedPlayback: 'Não foi possível carregar o playback assinado desta aula agora.',
      unableLoadPdf: 'Não foi possível carregar este PDF agora.',
      loadedLegacyPdf: 'PDF carregado usando URL direta legada.',
      loadedLegacyDownload: 'Download aberto usando URL direta legada.',
      unableDownloadPdf: 'Não foi possível baixar este PDF agora.',
      unableCheckout: 'Não foi possível iniciar o checkout agora.',
      lessonCompleted: 'Aula concluída!',
      somethingWrong: 'Algo deu errado',
      lessonReset: 'Progresso da aula redefinido.',
      loadingSignedVideo: 'Carregando vídeo assinado da aula...',
      muxTokenError: 'O Mux rejeitou o token de reprodução. Verifique MUX_SIGNING_KEY_ID e MUX_SIGNING_PRIVATE_KEY.',
      lessonLockedTitle: 'Esta aula está bloqueada',
      lessonLockedDesc: 'Compre o curso completo para assistir a todas as aulas com reprodução Mux em alta qualidade.',
      pdfAfterPurchase: 'Os PDFs ficam disponíveis após comprar o curso completo.',
      noMainNotes: 'Nenhuma anotação principal foi encontrada para esta aula.',
      loadingPdfPreview: 'Carregando prévia do PDF...',
      premiumAccessRequired: 'Acesso premium necessário',
      lessonAreaLockedDesc: 'Você está na área da aula, mas vídeo e anotações estão disponíveis apenas para alunos com o curso completo.',
      whatYouUnlock: 'O que você desbloqueia:',
      unlockAllClasses: 'Acesso completo às 15 aulas',
      unlockMuxPlayback: 'Reprodução Mux HD segura',
      unlockNotes: 'Anotações pessoais por aula',
      buyNowUnlock: 'Comprar e desbloquear',
    },
  }[language];

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
  const [muxRuntimeError, setMuxRuntimeError] = useState('');
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
  const lessonDisplayTitle = lesson.title || canonicalClass?.subtitle || copy.lessonFallback;
  const classLabel = classNumber ? `${copy.classPrefix} ${classNumber}: ${lessonDisplayTitle}` : lessonDisplayTitle;

  const visibleAttachments = useMemo(
    () => lesson.attachments.filter((attachment) => !isAuxiliaryAttachment(attachment.name)),
    [lesson.attachments]
  );

  const selectedAttachment = useMemo(
    () => visibleAttachments.find((attachment) => attachment.id === selectedAttachmentId) ?? null,
    [visibleAttachments, selectedAttachmentId]
  );
  const effectivePlaybackId = playbackId || extractMuxPlaybackId(lesson.videoUrl);
  const canRenderMuxPlayer = Boolean(canAccessLesson && effectivePlaybackId && playbackToken && !muxRuntimeError);
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
        setMuxRuntimeError('');
        return;
      }

      setPlaybackError('');
      setMuxRuntimeError('');

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
        setPlaybackError(copy.unableSignedPlayback);
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
      const message = error?.response?.data?.error || copy.unableLoadPdf;
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
        toast.info(copy.loadedLegacyPdf);
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
        toast.info(copy.loadedLegacyDownload);
        return;
      }

      const message = error?.response?.data?.error || copy.unableDownloadPdf;
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
      toast.error(copy.unableCheckout);
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
      toast.success(copy.lessonCompleted);
      router.refresh();
    } catch {
      toast.error(copy.somethingWrong);
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
      toast.success(copy.lessonReset);
      router.refresh();
    } catch {
      toast.error(copy.somethingWrong);
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
                          ? copy.saving
                          : isCompleted
                          ? copy.completedReset
                          : copy.markComplete}
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
                            {copy.hideNotes}
                          </>
                        ) : (
                          <>
                            <PanelRightOpen className="h-4 w-4 mr-2" />
                            {copy.showNotes}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="relative flex-1 min-h-[360px] bg-black border border-primary/50 dark:border-primary/70 rounded-b-xl overflow-hidden">
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
                      onError={() => {
                        setMuxRuntimeError(copy.muxTokenError);
                      }}
                      autoPlay
                      playsInline
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                      {canAccessLesson ? (
                        <p className="text-sm text-muted-foreground">
                          {playbackError || muxRuntimeError || copy.loadingSignedVideo}
                        </p>
                      ) : (
                        <div className="max-w-md space-y-3">
                          <div className="mx-auto w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center">
                            <Lock className="h-6 w-6 text-primary" />
                          </div>
                          <h3 className="text-lg font-semibold text-foreground">{copy.lessonLockedTitle}</h3>
                          <p className="text-sm text-muted-foreground">
                            {copy.lessonLockedDesc}
                          </p>
                          <Button onClick={handlePurchaseClick} disabled={isPurchasing} className="w-full sm:w-auto">
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            {isPurchasing ? copy.openingCheckout : copy.unlockFullCourse}
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
                    {copy.classNote}
                  </p>

                  {!canAccessAttachments ? (
                    <div className="flex-1 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                      {copy.pdfAfterPurchase}
                    </div>
                  ) : visibleAttachments.length === 0 ? (
                    <div className="flex-1 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                      {copy.noMainNotes}
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
                              {getAttachmentDisplayName(attachment.name, classNumber, copy.classNote)}
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
                                {copy.preview}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => downloadPdf(attachment.id)}
                              >
                                <Download className="h-4 w-4 mr-1.5" />
                                {copy.download}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 flex-1 min-h-[420px] rounded-lg border-2 border-primary/40 bg-background overflow-hidden">
                        {isLoadingPdf ? (
                          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                            {copy.loadingPdfPreview}
                          </div>
                        ) : pdfError ? (
                          <div className="h-full flex items-center justify-center px-4 text-center text-sm text-muted-foreground">
                            {pdfError}
                          </div>
                        ) : previewUrl ? (
                          <PdfWorkspaceViewer fileUrl={previewUrl} />
                        ) : (
                          <div className="h-full flex items-center justify-center px-4 text-center text-sm text-muted-foreground">
                            {copy.selectPdf}
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
                      {copy.premiumAccessRequired}
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {copy.lessonAreaLockedDesc}
                    </p>
                  </div>

                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                    <p className="text-sm font-medium text-foreground">{copy.whatYouUnlock}</p>
                    <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                      <li>• {copy.unlockAllClasses}</li>
                      <li>• {copy.unlockMuxPlayback}</li>
                      <li>• {copy.unlockNotes}</li>
                    </ul>
                    <Button onClick={handlePurchaseClick} disabled={isPurchasing} className="w-full mt-4">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {isPurchasing ? copy.openingCheckout : copy.buyNowUnlock}
                    </Button>
                  </div>
                </div>
              )}
            </aside>
            ) : null}
          </div>

          {!isReady && (
            <div className="sr-only" aria-live="polite">
              {copy.loadingPlayer}
            </div>
          )}
        </div>
      </div>
    </DashboardPreferencesProvider>
  );
};
