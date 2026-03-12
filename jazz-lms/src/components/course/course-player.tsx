'use client';
import MuxPlayer from '@mux/mux-player-react';
import { Button } from '../ui/button';
import { CheckCircle, Lock, ShoppingCart, FileText, PanelRightClose, PanelRightOpen, Loader2 } from 'lucide-react';
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
import { LANGUAGE_LABELS, type SupportedLanguage, languageToHtmlLang } from '@/lib/language';
import type MuxPlayerElement from '@mux/mux-player';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSelector } from '@/components/language-selector';
import { PaymentMethodModal, type PaymentMethod } from '@/components/payment/payment-method-modal';

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

function SpotifyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="currentColor">
      <path d="M12 1.5a10.5 10.5 0 1 0 10.5 10.5A10.51 10.51 0 0 0 12 1.5Zm4.82 15.16a.78.78 0 0 1-1.08.26 9.63 9.63 0 0 0-9.72-.54.78.78 0 1 1-.66-1.41 11.2 11.2 0 0 1 11.3.63.78.78 0 0 1 .16 1.06Zm1.54-2.42a.97.97 0 0 1-1.34.32 11.8 11.8 0 0 0-11.93-.67.97.97 0 1 1-.83-1.75 13.75 13.75 0 0 1 13.9.79.97.97 0 0 1 .2 1.31Zm.13-2.61A14.1 14.1 0 0 0 4.1 10.8a1.16 1.16 0 1 1-.98-2.11 16.42 16.42 0 0 1 16.76 1.02 1.16 1.16 0 0 1-1.39 1.92Z" />
    </svg>
  );
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
      chooseMethod: 'Elegir método de pago',
      classNote: 'Apunte de clase',
      download: 'Descargar',
      downloadLanguage: 'Idioma de descarga',
      downloadSelectedPdf: 'Descargar PDF seleccionado',
      selectPdf: 'Selecciona un PDF para previsualizarlo aquí.',
      toggleNotesTooltip: 'Mostrar u ocultar apuntes',
      completeTooltip: 'Marcar como completada',
      hidePdfAction: 'Ocultar PDF',
      showPdfAction: 'Mostrar PDF',
      completeAction: 'Concluir',
      musicSpotify: 'Abrir en Spotify',
      musicApple: 'Abrir en Apple Music',
      musicAmazon: 'Abrir en Amazon Music',
      musicYouTube: 'Abrir en YouTube',
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
      chooseMethod: 'Choose payment method',
      classNote: 'Class notes',
      download: 'Download',
      downloadLanguage: 'Download language',
      downloadSelectedPdf: 'Download selected PDF',
      selectPdf: 'Select a PDF to preview it here.',
      toggleNotesTooltip: 'Show or hide notes panel',
      completeTooltip: 'Mark lesson as complete',
      hidePdfAction: 'Hide PDF',
      showPdfAction: 'Show PDF',
      completeAction: 'Complete',
      musicSpotify: 'Open in Spotify',
      musicApple: 'Open in Apple Music',
      musicAmazon: 'Open in Amazon Music',
      musicYouTube: 'Open in YouTube',
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
      chooseMethod: 'Choisir le moyen de paiement',
      classNote: 'Notes du cours',
      download: 'Télécharger',
      downloadLanguage: 'Langue du téléchargement',
      downloadSelectedPdf: 'Télécharger le PDF sélectionné',
      selectPdf: 'Sélectionnez un PDF pour l’aperçu ici.',
      toggleNotesTooltip: 'Afficher ou masquer les notes',
      completeTooltip: 'Marquer la leçon comme terminée',
      hidePdfAction: 'Masquer PDF',
      showPdfAction: 'Afficher PDF',
      completeAction: 'Valider',
      musicSpotify: 'Ouvrir dans Spotify',
      musicApple: 'Ouvrir dans Apple Music',
      musicAmazon: 'Ouvrir dans Amazon Music',
      musicYouTube: 'Ouvrir dans YouTube',
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
      chooseMethod: 'Escolher método de pagamento',
      classNote: 'Anotações da aula',
      download: 'Baixar',
      downloadLanguage: 'Idioma do download',
      downloadSelectedPdf: 'Baixar PDF selecionado',
      selectPdf: 'Selecione um PDF para pré-visualizá-lo aqui.',
      toggleNotesTooltip: 'Mostrar ou ocultar anotações',
      completeTooltip: 'Marcar aula como concluída',
      hidePdfAction: 'Ocultar PDF',
      showPdfAction: 'Mostrar PDF',
      completeAction: 'Concluir',
      musicSpotify: 'Abrir no Spotify',
      musicApple: 'Abrir no Apple Music',
      musicAmazon: 'Abrir no Amazon Music',
      musicYouTube: 'Abrir no YouTube',
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
  const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [playbackId, setPlaybackId] = useState('');
  const [playbackToken, setPlaybackToken] = useState('');
  const [thumbnailToken, setThumbnailToken] = useState('');
  const [storyboardToken, setStoryboardToken] = useState('');
  const [playbackError, setPlaybackError] = useState('');
  const [muxRuntimeError, setMuxRuntimeError] = useState('');
  const [selectedAttachmentId, setSelectedAttachmentId] = useState<string | null>(
    lesson.attachments[0]?.id ?? null
  );
  const [downloadLanguage, setDownloadLanguage] = useState<SupportedLanguage>(language);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const [isNotesPanelOpen, setIsNotesPanelOpen] = useState(true);
  const previewUrlRef = useRef('');
  const muxContainerRef = useRef<HTMLDivElement | null>(null);
  const muxPlayerRef = useRef<MuxPlayerElement | null>(null);
  const router = useRouter();
  const confetti = useConfettiStore();

  const orderedLessons = useMemo(
    () => course.chapters.flatMap((chapter) => chapter.lessons),
    [course.chapters]
  );

  const classIndex = orderedLessons.findIndex((item) => item.id === lessonId);
  const classNumber = classIndex >= 0 ? classIndex + 1 : null;
  const canonicalClass = classNumber ? getCanonicalJazzClass(classNumber) : undefined;
  const canonicalSubtitle = canonicalClass?.subtitles[language];
  const lessonDisplayTitle = canonicalSubtitle || lesson.title || canonicalClass?.subtitle || copy.lessonFallback;
  const classLabel = classNumber ? `${copy.classPrefix} ${classNumber}: ${lessonDisplayTitle}` : lessonDisplayTitle;

  const visibleAttachments = useMemo(
    () =>
      lesson.attachments.filter(
        (attachment) =>
          attachment.language === language &&
          attachment.kind === 'CLASS' &&
          !isAuxiliaryAttachment(attachment.name)
      ),
    [lesson.attachments, language]
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

  const muxTooltipMap = useMemo(() => {
    if (language === 'pt') {
      return {
        Play: 'Reproduzir',
        Pause: 'Pausar',
        Mute: 'Silenciar',
        Unmute: 'Ativar som',
        Volume: 'Volume',
        Settings: 'Configurações',
        Captions: 'Legendas',
        'Enter Fullscreen': 'Tela cheia',
        'Exit Fullscreen': 'Sair da tela cheia',
        'Seek Backward': 'Voltar',
        'Seek Forward': 'Avançar',
      } as Record<string, string>;
    }

    if (language === 'es') {
      return {
        Play: 'Reproducir',
        Pause: 'Pausar',
        Mute: 'Silenciar',
        Unmute: 'Activar sonido',
        Volume: 'Volumen',
        Settings: 'Configuración',
        Captions: 'Subtítulos',
        'Enter Fullscreen': 'Pantalla completa',
        'Exit Fullscreen': 'Salir de pantalla completa',
        'Seek Backward': 'Retroceder',
        'Seek Forward': 'Avanzar',
      } as Record<string, string>;
    }

    if (language === 'fr') {
      return {
        Play: 'Lire',
        Pause: 'Pause',
        Mute: 'Couper le son',
        Unmute: 'Activer le son',
        Volume: 'Volume',
        Settings: 'Paramètres',
        Captions: 'Sous-titres',
        'Enter Fullscreen': 'Plein écran',
        'Exit Fullscreen': 'Quitter le plein écran',
        'Seek Backward': 'Reculer',
        'Seek Forward': 'Avancer',
      } as Record<string, string>;
    }

    return {} as Record<string, string>;
  }, [language]);

  useEffect(() => {
    previewUrlRef.current = previewUrl;
  }, [previewUrl]);

  useEffect(() => {
    setDownloadLanguage(language);
  }, [language]);

  useEffect(() => {
    if (!muxPlayerRef.current) {
      return;
    }

    muxPlayerRef.current.setAttribute('lang', languageToHtmlLang(language));
  }, [language]);

  useEffect(() => {
    if (language === 'en') {
      return;
    }

    const root = muxContainerRef.current;
    if (!root) {
      return;
    }

    const localizeMuxAttrs = () => {
      const elements = root.querySelectorAll<HTMLElement>('[title], [aria-label]');
      elements.forEach((element) => {
        const title = element.getAttribute('title');
        if (title && muxTooltipMap[title]) {
          element.setAttribute('title', muxTooltipMap[title]);
        }

        const ariaLabel = element.getAttribute('aria-label');
        if (ariaLabel && muxTooltipMap[ariaLabel]) {
          element.setAttribute('aria-label', muxTooltipMap[ariaLabel]);
        }
      });
    };

    localizeMuxAttrs();
    const observer = new MutationObserver(() => {
      localizeMuxAttrs();
    });

    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['title', 'aria-label'],
    });

    return () => observer.disconnect();
  }, [language, muxTooltipMap]);

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

  const getAttachmentSignedUrl = async (
    attachmentId: string,
    options?: { download?: boolean; language?: SupportedLanguage }
  ) => {
    const download = options?.download ?? false;

    const response = await axios.get(
      `/api/lessons/${lesson.id}/attachments/${attachmentId}`,
      {
        params: {
          download: download ? 1 : 0,
          language: options?.language,
        },
      }
    );

    return response.data as {
      signedUrl: string;
      name: string;
      storagePath: string;
      language: SupportedLanguage;
      availableLanguages: SupportedLanguage[];
    };
  };

  const openPdfPreview = async (attachmentId: string) => {
    if (!canAccessAttachments) return;

    setIsLoadingPdf(true);
    setPdfError('');

    try {
      const data = await getAttachmentSignedUrl(attachmentId, {
        download: false,
        language,
      });

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

  const downloadPdf = async (attachmentId: string, targetLanguage: SupportedLanguage) => {
    if (!canAccessAttachments) return;

    try {
      const data = await getAttachmentSignedUrl(attachmentId, {
        download: true,
        language: targetLanguage,
      });
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

  const handlePurchaseClick = async (paymentMethod: PaymentMethod) => {
    if (isPurchasing) return;

    setIsPurchasing(true);
    setPaymentError('');
    try {
      const response = await axios.post('/api/checkout', {
        courseId: course.id,
        source: 'dashboard',
        language,
        paymentMethod,
      });

      if (response.data?.url) {
        window.location.assign(response.data.url);
        return;
      }
    } catch (error) {
      if (axios.isAxiosError(error) && typeof error.response?.data === 'string') {
        setPaymentError(error.response.data);
        toast.error(error.response.data);
      } else {
        toast.error(copy.unableCheckout);
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const spotifyPlaylistUrl =
    'https://open.spotify.com/playlist/2SL42Fq3AgVvnJb7RixOvp?si=b703a7e95ab74f13&pt=be2730b0d1779073b15efc4628184b44';
  const spotifyEmbedUrl =
    'https://open.spotify.com/embed/playlist/2SL42Fq3AgVvnJb7RixOvp?utm_source=generator&theme=0';

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

        <div className="lg:pl-56 h-full overflow-hidden p-2 sm:p-3 lg:p-4 lg:pb-[196px]">
          <div className={`mx-auto h-full grid grid-cols-1 gap-3 lg:gap-4 min-h-0 ${isNotesPanelOpen ? 'xl:grid-cols-2' : 'xl:grid-cols-1'}`}>
            <div className="min-w-0 min-h-0 h-full flex flex-col gap-4">
              <div className="bg-card border-2 border-primary/50 rounded-xl overflow-hidden shadow-[0_0_0_1px_rgba(212,175,55,0.18)] flex flex-col h-full min-h-0">
                <div className="p-3 sm:p-4 border-b-2 border-primary/45 bg-gradient-to-r from-primary/10 to-transparent">
                  <div className="flex flex-col gap-2">
                    <h2 className="text-2xl sm:text-3xl font-bold font-serif text-primary break-words leading-tight">
                      {classLabel}
                    </h2>
                    <div className="flex items-center gap-2 flex-nowrap overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                        <ThemeToggle />
                        <LanguageSelector />
                        <a
                          href={spotifyPlaylistUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={copy.musicSpotify}
                          aria-label={copy.musicSpotify}
                          className="relative group inline-flex shrink-0 items-center justify-center h-8 w-8 rounded-md border border-primary/40 bg-background/95 hover:bg-accent text-sm transition-colors"
                        >
                          <span className="text-emerald-500">
                            <SpotifyIcon />
                          </span>
                          <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gradient-to-r from-emerald-500 to-emerald-400 px-2 py-1 text-[10px] font-semibold text-white opacity-0 shadow-md transition-all duration-100 group-hover:opacity-100 group-hover:-translate-y-0.5">
                            {copy.musicSpotify}
                          </span>
                        </a>

                        <button
                          type="button"
                          onClick={() => setIsNotesPanelOpen((current) => !current)}
                          title={copy.toggleNotesTooltip}
                          aria-label={copy.toggleNotesTooltip}
                          className="relative group inline-flex shrink-0 items-center gap-1.5 h-8 rounded-md border border-primary/40 bg-background/95 px-2.5 text-[11px] font-semibold text-foreground transition-colors hover:bg-accent"
                        >
                          {isNotesPanelOpen ? (
                            <PanelRightClose className="h-4 w-4" />
                          ) : (
                            <PanelRightOpen className="h-4 w-4" />
                          )}
                          <span>{isNotesPanelOpen ? copy.hidePdfAction : copy.showPdfAction}</span>
                          <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gradient-to-r from-amber-500 to-yellow-400 px-2 py-1 text-[10px] font-semibold text-black opacity-0 shadow-md transition-all duration-100 group-hover:opacity-100 group-hover:-translate-y-0.5">
                            {copy.toggleNotesTooltip}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={onMarkAsComplete}
                          disabled={isCompleting || !canAccessLesson}
                          title={copy.completeTooltip}
                          aria-label={copy.completeTooltip}
                          className="relative group inline-flex shrink-0 items-center gap-1.5 h-8 rounded-md border border-primary/40 bg-background/95 px-2.5 text-[11px] font-semibold text-foreground transition-colors hover:bg-accent disabled:opacity-60"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span>{copy.completeAction}</span>
                          <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gradient-to-r from-amber-500 to-yellow-400 px-2 py-1 text-[10px] font-semibold text-black opacity-0 shadow-md transition-all duration-100 group-hover:opacity-100 group-hover:-translate-y-0.5">
                            {isCompleting
                              ? copy.saving
                              : isCompleted
                              ? copy.completedReset
                              : copy.completeTooltip}
                          </span>
                        </button>
                    </div>
                  </div>
                </div>
                <div
                  ref={muxContainerRef}
                  className="relative w-full flex-1 min-h-[260px] sm:min-h-[320px] lg:min-h-[420px] bg-black border border-primary/50 dark:border-primary/70 overflow-hidden"
                >
                  {canRenderMuxPlayer ? (
                    <MuxPlayer
                      ref={muxPlayerRef}
                      className={`absolute inset-0 h-full w-full lesson-mux-player ${
                        !isNotesPanelOpen ? 'lesson-mux-player--fit-contain' : ''
                      }`}
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
                          <Button
                            onClick={() => {
                              setPaymentError('');
                              setIsMethodModalOpen(true);
                            }}
                            disabled={isPurchasing}
                            className="w-full sm:w-auto"
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            {isPurchasing ? copy.openingCheckout : copy.chooseMethod}
                          </Button>
                          {paymentError ? (
                            <p className="text-xs text-destructive">{paymentError}</p>
                          ) : null}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {isNotesPanelOpen ? (
            <aside className="bg-card border-2 border-primary/55 rounded-xl p-3 sm:p-4 flex flex-col min-h-0 h-full overflow-hidden shadow-[0_0_0_1px_rgba(212,175,55,0.18)]">
              {canAccessLesson ? (
                <>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-base sm:text-lg font-semibold text-primary flex items-center gap-2.5 truncate">
                      <FileText className="h-5 w-5 text-primary" />
                      {copy.classNote}
                    </p>
                  </div>

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
                      <div className="space-y-2 max-h-40 overflow-auto pr-1">
                        {visibleAttachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            onClick={() => openPdfPreview(attachment.id)}
                            className={`rounded-lg border p-2.5 ${
                              selectedAttachmentId === attachment.id
                                ? 'border-primary/50 bg-primary/5'
                                : 'border-border bg-background hover:bg-accent/40 cursor-pointer'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p
                                className="text-sm font-medium text-foreground truncate"
                                title={getAttachmentDisplayName(attachment.name, classNumber, copy.classNote)}
                              >
                                {getAttachmentDisplayName(attachment.name, classNumber, copy.classNote)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {selectedAttachment ? (
                        <div className="mt-1 rounded-lg border border-border p-2.5 bg-background/80">
                          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-end">
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

                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => downloadPdf(selectedAttachment.id, downloadLanguage)}
                              className="w-full sm:w-auto"
                            >
                              {copy.downloadSelectedPdf}
                            </Button>
                          </div>
                        </div>
                      ) : null}

                      <div className="mt-2 flex-1 min-h-0 rounded-lg border-2 border-primary/40 bg-background overflow-hidden">
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
                    <Button
                      onClick={() => {
                        setPaymentError('');
                        setIsMethodModalOpen(true);
                      }}
                      disabled={isPurchasing}
                      className="w-full mt-4"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {isPurchasing ? copy.openingCheckout : copy.chooseMethod}
                    </Button>
                    {paymentError ? (
                      <p className="mt-2 text-xs text-destructive">{paymentError}</p>
                    ) : null}
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

        <div className="fixed bottom-0 left-0 right-0 lg:left-56 z-30 border-t border-primary/35 bg-black">
          <div className="px-2 sm:px-3 lg:px-4 py-1.5">
            <div className="rounded-[12px] border border-primary/40 bg-black overflow-hidden">
              <iframe
                title="Spotify playlist"
                src={spotifyEmbedUrl}
                width="100%"
                height="152"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                allowFullScreen
                className="block w-full bg-black"
              />
            </div>
          </div>
        </div>
      </div>

      <PaymentMethodModal
        isOpen={isMethodModalOpen}
        isLoading={isPurchasing}
        language={language}
        errorMessage={paymentError}
        onClose={() => {
          if (!isPurchasing) {
            setIsMethodModalOpen(false);
          }
        }}
        onConfirm={(method) => {
          void handlePurchaseClick(method);
        }}
      />
    </DashboardPreferencesProvider>
  );
};
