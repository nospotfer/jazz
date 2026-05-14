"use client";
import { LessonQuizMedalBadge } from "@/components/course/lesson-quiz-medal";
import { Sidebar } from "@/components/layout/sidebar";
import { SpotifyPlaylistFooter } from "@/components/music/spotify-playlist-footer";
import { DashboardPreferencesProvider } from "@/components/providers/dashboard-preferences-provider";
import { useLanguage } from "@/components/providers/language-provider";
import type { AppliedVoucher } from "@/components/vouchers/voucher-input";
import { useConfettiStore } from "@/hooks/use-confetti-store";
import { getCanonicalJazzClass } from "@/lib/course-lessons";
import { languageToHtmlLang } from "@/lib/language";
import {
    calculateLessonMinutesRemaining,
    calculateLessonProgressPercent,
    shouldPersistLessonProgress,
} from "@/lib/lesson-progress";
import type { LessonQuizSummarySnapshot } from "@/lib/lesson-quiz";
import { extractMuxPlaybackId } from "@/lib/mux-playback";
import {
    loadPaymentMethodModal,
    warmPaymentMethodModal,
} from "@/lib/payment-modal-loader";
import { DEFAULT_LESSON_DURATION_MINUTES } from "@/lib/pricing";
import type MuxPlayerElement from "@mux/mux-player";
import { Attachment, Chapter, Course, Lesson } from "@prisma/client";
import axios from "axios";
import {
  CheckCircle,
    FileText,
    Loader2,
    Lock,
    PanelRightClose,
    PanelRightOpen,
    Play,
    ShoppingCart,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";

const ThemeToggle = dynamic(
  () => import("@/components/theme-toggle").then((mod) => mod.ThemeToggle),
  {
    ssr: false,
  },
);

const LanguageSelector = dynamic(
  () =>
    import("@/components/language-selector").then(
      (mod) => mod.LanguageSelector,
    ),
  {
    ssr: false,
  },
);

const MuxPlayer = dynamic(() => import("@mux/mux-player-react"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  ),
});

const PdfWorkspaceViewer = dynamic(
  () =>
    import("@/components/course/pdf-workspace-viewer").then(
      (mod) => mod.PdfWorkspaceViewer,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    ),
  },
);

const LessonQuizOverlay = dynamic(
  () =>
    import("@/components/course/lesson-quiz-overlay").then(
      (mod) => mod.LessonQuizOverlay,
    ),
  {
    ssr: false,
  },
);

const PaymentMethodModal = dynamic(
  () => loadPaymentMethodModal().then((mod) => mod.PaymentMethodModal),
  {
    ssr: false,
  },
);

const SPOTIFY_WEB_PLAYER_URL =
  "https://open.spotify.com/playlist/2SL42Fq3AgVvnJb7RixOvp";
const PLAYBACK_ERROR_FALLBACK = "__mux_playback_unavailable__";
const COMPLETE_BUTTON_UNLOCK_PERCENT = 80;
const DASHBOARD_VIDEO_COVER_IMAGE = "/icon.jpg";

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
  initialQuizSummary: LessonQuizSummarySnapshot | null;
  hasQuizAvailable: boolean;
  canUseGamification: boolean;
  canAccessLesson: boolean;
  canAccessAttachments: boolean;
}

function isAuxiliaryAttachment(name: string) {
  return /auxiliar|auxiliares|auxiliary|support/i.test(name);
}

function isPdfAttachment(attachment: Attachment) {
  const name = (attachment.name || "").toLowerCase();
  const url = (attachment.url || "").toLowerCase();
  return name.endsWith(".pdf") || url.includes(".pdf");
}

export const CoursePlayer = ({
  course,
  lesson,
  lessonId,
  initialIsCompleted,
  initialProgressPercent,
  initialQuizSummary,
  hasQuizAvailable,
  canUseGamification,
  canAccessLesson,
  canAccessAttachments,
}: CoursePlayerProps) => {
  const { language } = useLanguage();
  const copy = {
    es: {
      lessonFallback: "Lección",
      classPrefix: "Clase",
      saving: "Guardando...",
      completedReset: "Completada (clic para reiniciar)",
      markComplete: "Marcar como completada",
      hideNotes: "Ocultar apunte",
      showNotes: "Mostrar apunte",
      openingCheckout: "Abriendo pago...",
      unlockFullCourse: "Desbloquear curso completo",
      chooseMethod: "Elegir método de pago",
      classNote: "Apunte de clase",
      download: "Descargar",
      downloadSelectedPdf: "Descargar PDF seleccionado",
      selectPdf: "Selecciona un PDF para previsualizarlo aquí.",
      toggleNotesTooltip: "Mostrar u ocultar apuntes",
      completeTooltip: "Marcar como completada",
      completeLockedTooltip:
        "Mira al menos el 80% de la clase para habilitar Concluir",
      hidePdfAction: "Ocultar PDF",
      showPdfAction: "Mostrar PDF",
      completeAction: "Concluir",
      completedLabel: "Concluida",
      gamificationAction: "Gamificacion",
      gamificationReadyTooltip: "Ir a gamificacion",
      gamificationLockedTooltip:
        "Completa la clase para desbloquear la gamificacion",
      confirmCompleteTitle: "Confirmar finalizacion de la clase",
      confirmCompleteMessage:
        "Quieres marcar esta clase como completada e ir al quiz ahora?",
      confirmCompleteConfirm: "Si, completar e ir al quiz",
      confirmCompleteCancel: "Cancelar",
      musicSpotify: "Abrir en Spotify",
      loadingPlayer: "Cargando reproductor de la lección...",
      unableSignedPlayback:
        "No se pudo cargar el playback firmado de esta lección en este momento.",
      unableLoadPdf: "No se pudo cargar este PDF en este momento.",
      loadedLegacyPdf: "PDF cargado con la URL directa heredada.",
      loadedLegacyDownload: "Descarga abierta usando URL directa heredada.",
      unableDownloadPdf: "No se pudo descargar este PDF en este momento.",
      unableCheckout: "No se pudo iniciar el pago en este momento.",
      lessonCompleted: "¡Lección completada!",
      somethingWrong: "Algo salió mal",
      lessonReset: "El progreso de la lección se reinició.",
      loadingSignedVideo: "Cargando video firmado de la lección...",
      muxTokenError:
        "No pudimos reproducir este video ahora. Inténtalo de nuevo.",
      muxRetrying: "Reintentando reproducción...",
      muxRetryExhausted:
        "No pudimos reproducir el video tras varios intentos. Recarga manualmente o vuelve más tarde.",
      muxReloadButton: "Recargar video",
      lessonLockedTitle: "Esta lección está bloqueada",
      lessonLockedDesc:
        "Compra el curso completo para ver todas las clases con reproducción Mux en alta calidad.",
      pdfAfterPurchase:
        "Los PDFs estarán disponibles después de comprar el curso completo.",
      noMainNotes: "No se encontraron apuntes principales para esta lección.",
      loadingPdfPreview: "Cargando vista previa del PDF...",
      premiumAccessRequired: "Se requiere acceso premium",
      lessonAreaLockedDesc:
        "Estás dentro del área de la lección, pero el video y los apuntes solo están disponibles para estudiantes con el curso completo.",
      whatYouUnlock: "Qué desbloqueas:",
      unlockAllClasses: "Acceso completo a las 15 clases",
      unlockMuxPlayback: "Reproducción Mux HD segura",
      unlockNotes: "Apuntes personales por lección",
      buyNowUnlock: "Comprar ahora y desbloquear",
    },
    en: {
      lessonFallback: "Lesson",
      classPrefix: "Class",
      saving: "Saving...",
      completedReset: "Completed (Click to reset)",
      markComplete: "Mark as Complete",
      hideNotes: "Hide notes",
      showNotes: "Show notes",
      openingCheckout: "Opening checkout...",
      unlockFullCourse: "Unlock full course",
      chooseMethod: "Choose payment method",
      classNote: "Class notes",
      download: "Download",
      downloadSelectedPdf: "Download selected PDF",
      selectPdf: "Select a PDF to preview it here.",
      toggleNotesTooltip: "Show or hide notes panel",
      completeTooltip: "Mark lesson as complete",
      completeLockedTooltip:
        "Watch at least 80% of the lesson to enable Complete",
      hidePdfAction: "Hide PDF",
      showPdfAction: "Show PDF",
      completeAction: "Complete",
      completedLabel: "Completed",
      gamificationAction: "Gamification",
      gamificationReadyTooltip: "Go to gamification",
      gamificationLockedTooltip:
        "Complete this class to unlock gamification",
      confirmCompleteTitle: "Confirm class completion",
      confirmCompleteMessage:
        "Do you want to mark this class as completed and go to the quiz now?",
      confirmCompleteConfirm: "Yes, complete and go to quiz",
      confirmCompleteCancel: "Cancel",
      musicSpotify: "Open in Spotify",
      loadingPlayer: "Loading lesson player...",
      unableSignedPlayback:
        "Unable to load signed playback for this lesson right now.",
      unableLoadPdf: "Unable to load this PDF right now.",
      loadedLegacyPdf: "Loaded PDF using legacy direct URL fallback.",
      loadedLegacyDownload: "Download opened using legacy direct URL fallback.",
      unableDownloadPdf: "Unable to download this PDF right now.",
      unableCheckout: "Unable to start checkout right now.",
      lessonCompleted: "Lesson completed!",
      somethingWrong: "Something went wrong",
      lessonReset: "Lesson progress reset.",
      loadingSignedVideo: "Loading signed lesson video...",
      muxTokenError:
        "We couldn’t play this video right now. Please try again.",
      muxRetrying: "Retrying playback...",
      muxRetryExhausted:
        "We couldn’t play the video after several attempts. Reload manually or try again later.",
      muxReloadButton: "Reload video",
      lessonLockedTitle: "This lesson is locked",
      lessonLockedDesc:
        "Purchase the full course to watch all classes with high-quality Mux playback.",
      pdfAfterPurchase: "PDFs are available after purchasing the full course.",
      noMainNotes: "No main notes were found for this lesson.",
      loadingPdfPreview: "Loading PDF preview...",
      premiumAccessRequired: "Premium access required",
      lessonAreaLockedDesc:
        "You are inside the lesson area, but video and notes are available only for students who purchased the full course.",
      whatYouUnlock: "What you unlock:",
      unlockAllClasses: "Full access to all 15 classes",
      unlockMuxPlayback: "Secure Mux HD playback",
      unlockNotes: "Personal lesson notes",
      buyNowUnlock: "Buy now and unlock",
    },
    fr: {
      lessonFallback: "Leçon",
      classPrefix: "Cours",
      saving: "Enregistrement...",
      completedReset: "Terminée (cliquez pour réinitialiser)",
      markComplete: "Marquer comme terminée",
      hideNotes: "Masquer les notes",
      showNotes: "Afficher les notes",
      openingCheckout: "Ouverture du paiement...",
      unlockFullCourse: "Débloquer le cours complet",
      chooseMethod: "Choisir le moyen de paiement",
      classNote: "Notes du cours",
      download: "Télécharger",
      downloadSelectedPdf: "Télécharger le PDF sélectionné",
      selectPdf: "Sélectionnez un PDF pour l’aperçu ici.",
      toggleNotesTooltip: "Afficher ou masquer les notes",
      completeTooltip: "Marquer la leçon comme terminée",
      completeLockedTooltip:
        "Regardez au moins 80% de la leçon pour activer Valider",
      hidePdfAction: "Masquer PDF",
      showPdfAction: "Afficher PDF",
      completeAction: "Valider",
      completedLabel: "Terminee",
      gamificationAction: "Gamification",
      gamificationReadyTooltip: "Aller a la gamification",
      gamificationLockedTooltip:
        "Terminez ce cours pour debloquer la gamification",
      confirmCompleteTitle: "Confirmer la fin du cours",
      confirmCompleteMessage:
        "Voulez-vous marquer ce cours comme termine et aller au quiz maintenant ?",
      confirmCompleteConfirm: "Oui, terminer et aller au quiz",
      confirmCompleteCancel: "Annuler",
      musicSpotify: "Ouvrir dans Spotify",
      loadingPlayer: "Chargement du lecteur de leçon...",
      unableSignedPlayback:
        "Impossible de charger la lecture sécurisée de cette leçon pour le moment.",
      unableLoadPdf: "Impossible de charger ce PDF pour le moment.",
      loadedLegacyPdf: "PDF chargé via URL directe héritée.",
      loadedLegacyDownload: "Téléchargement ouvert via URL directe héritée.",
      unableDownloadPdf: "Impossible de télécharger ce PDF pour le moment.",
      unableCheckout: "Impossible de démarrer le paiement pour le moment.",
      lessonCompleted: "Leçon terminée !",
      somethingWrong: "Une erreur est survenue",
      lessonReset: "Progression de la leçon réinitialisée.",
      loadingSignedVideo: "Chargement de la vidéo sécurisée de la leçon...",
      muxTokenError:
        "Impossible de lire cette vidéo pour le moment. Veuillez réessayer.",
      muxRetrying: "Nouvelle tentative de lecture...",
      muxRetryExhausted:
        "Impossible de lire la vidéo après plusieurs tentatives. Rechargez manuellement ou réessayez plus tard.",
      muxReloadButton: "Recharger la vidéo",
      lessonLockedTitle: "Cette leçon est verrouillée",
      lessonLockedDesc:
        "Achetez le cours complet pour regarder toutes les leçons avec une lecture Mux HD.",
      pdfAfterPurchase:
        "Les PDF sont disponibles après l’achat du cours complet.",
      noMainNotes: "Aucune note principale trouvée pour cette leçon.",
      loadingPdfPreview: "Chargement de l’aperçu PDF...",
      premiumAccessRequired: "Accès premium requis",
      lessonAreaLockedDesc:
        "Vous êtes dans la zone de leçon, mais la vidéo et les notes sont disponibles uniquement pour les étudiants ayant acheté le cours complet.",
      whatYouUnlock: "Ce que vous débloquez :",
      unlockAllClasses: "Accès complet aux 15 cours",
      unlockMuxPlayback: "Lecture Mux HD sécurisée",
      unlockNotes: "Notes de cours personnelles",
      buyNowUnlock: "Acheter et débloquer",
    },
    pt: {
      lessonFallback: "Aula",
      classPrefix: "Aula",
      saving: "Salvando...",
      completedReset: "Concluída (clique para redefinir)",
      markComplete: "Marcar como concluída",
      hideNotes: "Ocultar anotações",
      showNotes: "Mostrar anotações",
      openingCheckout: "Abrindo checkout...",
      unlockFullCourse: "Desbloquear curso completo",
      chooseMethod: "Escolher método de pagamento",
      classNote: "Anotações da aula",
      download: "Baixar",
      downloadSelectedPdf: "Baixar PDF selecionado",
      selectPdf: "Selecione um PDF para pré-visualizá-lo aqui.",
      toggleNotesTooltip: "Mostrar ou ocultar anotações",
      completeTooltip: "Marcar aula como concluída",
      completeLockedTooltip:
        "Assista pelo menos 80% da aula para habilitar Concluir",
      hidePdfAction: "Ocultar PDF",
      showPdfAction: "Mostrar PDF",
      completeAction: "Concluir",
      completedLabel: "Concluida",
      gamificationAction: "Gamificacao",
      gamificationReadyTooltip: "Ir para gamificacao",
      gamificationLockedTooltip:
        "Conclua a aula para desbloquear a gamificacao",
      confirmCompleteTitle: "Confirmar conclusao da aula",
      confirmCompleteMessage:
        "Voce deseja marcar esta aula como concluida e ir para o quiz agora?",
      confirmCompleteConfirm: "Sim, concluir e ir ao quiz",
      confirmCompleteCancel: "Cancelar",
      musicSpotify: "Abrir no Spotify",
      loadingPlayer: "Carregando player da aula...",
      unableSignedPlayback:
        "No fue posible cargar el playback firmado de esta lección ahora.",
      unableLoadPdf: "No fue posible cargar este PDF ahora.",
      loadedLegacyPdf: "PDF carregado usando URL direta legada.",
      loadedLegacyDownload: "Download aberto usando URL direta legada.",
      unableDownloadPdf: "No fue posible descargar este PDF ahora.",
      unableCheckout: "No fue posible iniciar el checkout ahora.",
      lessonCompleted: "Aula concluída!",
      somethingWrong: "Algo deu errado",
      lessonReset: "Progresso da aula redefinido.",
      loadingSignedVideo: "Carregando vídeo assinado da aula...",
      muxTokenError:
        "Não foi possível reproduzir este vídeo agora. Tente novamente.",
      muxRetrying: "Tentando novamente...",
      muxRetryExhausted:
        "Não conseguimos reproduzir o vídeo após várias tentativas. Recarregue manualmente ou tente mais tarde.",
      muxReloadButton: "Recarregar vídeo",
      lessonLockedTitle: "Esta aula está bloqueada",
      lessonLockedDesc:
        "Compre o curso completo para assistir a todas as aulas com reprodução Mux em alta qualidade.",
      pdfAfterPurchase:
        "Os PDFs ficam disponíveis após comprar o curso completo.",
      noMainNotes: "Nenhuma anotação principal foi encontrada para esta aula.",
      loadingPdfPreview: "Carregando prévia do PDF...",
      premiumAccessRequired: "Acesso premium necessário",
      lessonAreaLockedDesc:
        "Estás en el área de la lección, pero video y notas solo están disponibles para alumnos con el curso completo.",
      whatYouUnlock: "Qué desbloqueas:",
      unlockAllClasses: "Acesso completo às 15 aulas",
      unlockMuxPlayback: "Reprodução Mux HD segura",
      unlockNotes: "Anotações pessoais por aula",
      buyNowUnlock: "Comprar e desbloquear",
    },
  }[language];

  const [isReady, setIsReady] = useState(false);
  const [lastSavedPercent, setLastSavedPercent] = useState(
    initialProgressPercent,
  );
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(initialIsCompleted);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<AppliedVoucher | null>(
    null,
  );
  const [shouldLoadPlayback, setShouldLoadPlayback] = useState(false);
  const [shouldLoadPdfPreview, setShouldLoadPdfPreview] = useState(false);
  const [playbackId, setPlaybackId] = useState("");
  const [playbackToken, setPlaybackToken] = useState("");
  const [thumbnailToken, setThumbnailToken] = useState("");
  const [storyboardToken, setStoryboardToken] = useState("");
  const [playbackError, setPlaybackError] = useState("");
  const [muxRuntimeError, setMuxRuntimeError] = useState("");
  const [isPlayerPaused, setIsPlayerPaused] = useState(true);

  useEffect(() => {
    const idleCallback = window.requestIdleCallback?.(() => {
      warmPaymentMethodModal();
    });

    if (idleCallback !== undefined) {
      return () => {
        window.cancelIdleCallback?.(idleCallback);
      };
    }

    const timeoutId = window.setTimeout(() => {
      warmPaymentMethodModal();
    }, 800);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);
  const [selectedAttachmentId, setSelectedAttachmentId] = useState<
    string | null
  >(lesson.attachments[0]?.id ?? null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const [isNotesPanelOpen, setIsNotesPanelOpen] = useState(true);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isConfirmCompleteOpen, setIsConfirmCompleteOpen] = useState(false);
  const [quizSummary, setQuizSummary] =
    useState<LessonQuizSummarySnapshot | null>(initialQuizSummary);
  const [shouldRefreshAfterQuizClose, setShouldRefreshAfterQuizClose] =
    useState(false);
  const previewUrlRef = useRef("");
  const muxContainerRef = useRef<HTMLDivElement | null>(null);
  const muxPlayerRef = useRef<MuxPlayerElement | null>(null);
  const hasAppliedMuxDefaultSubtitleRef = useRef(false);
  const muxRetryCountRef = useRef(0);
  const muxRetryInFlightRef = useRef(false);
  const muxLastPositionRef = useRef(0);
  const [muxRetryState, setMuxRetryState] = useState<
    "idle" | "retrying" | "exhausted"
  >("idle");
  const router = useRouter();
  const confetti = useConfettiStore();

  const enforceNoRemotePlayback = useCallback(() => {
    const playerElement = muxPlayerRef.current as
      | (MuxPlayerElement & {
          media?: HTMLMediaElement | null;
          disableRemotePlayback?: boolean;
        })
      | null;

    if (!playerElement) {
      return;
    }

    try {
      playerElement.setAttribute("disableremoteplayback", "");
      playerElement.removeAttribute("cast-receiver");
      playerElement.disableRemotePlayback = true;

      const mediaElement = playerElement.media;
      if (mediaElement) {
        mediaElement.setAttribute("disableremoteplayback", "");
        mediaElement.removeAttribute("cast-receiver");
        mediaElement.disableRemotePlayback = true;
      }
    } catch {
      // Keep playback resilient even if browser APIs differ.
    }
  }, []);

  const applyPreferredSubtitleTrack = useCallback(() => {
    if (hasAppliedMuxDefaultSubtitleRef.current) {
      return;
    }

    const playerElement = muxPlayerRef.current as
      | (MuxPlayerElement & {
          textTracks?: TextTrackList | null;
        })
      | null;

    const textTracks = playerElement?.textTracks;
    if (!textTracks || textTracks.length === 0) {
      return;
    }

    let hasSubtitleTrack = false;

    for (let index = 0; index < textTracks.length; index += 1) {
      const track = textTracks[index];
      if (!track) {
        continue;
      }

      const isSubtitleTrack =
        track.kind === "subtitles" || track.kind === "captions";
      if (!isSubtitleTrack) {
        continue;
      }

      hasSubtitleTrack = true;
      track.mode = "disabled";
    }

    if (!hasSubtitleTrack) {
      return;
    }

    hasAppliedMuxDefaultSubtitleRef.current = true;
  }, []);

  const orderedLessons = useMemo(
    () => course.chapters.flatMap((chapter) => chapter.lessons),
    [course.chapters],
  );

  const classIndex = orderedLessons.findIndex((item) => item.id === lessonId);
  const classNumber = classIndex >= 0 ? classIndex + 1 : null;
  const canonicalClass = classNumber
    ? getCanonicalJazzClass(classNumber)
    : undefined;
  const canonicalSubtitle = canonicalClass?.subtitles[language];
  const lessonDisplayTitle =
    canonicalSubtitle ||
    lesson.title ||
    canonicalClass?.subtitle ||
    copy.lessonFallback;
  const classLabel = classNumber
    ? `${copy.classPrefix} ${classNumber}: ${lessonDisplayTitle}`
    : lessonDisplayTitle;

  const visibleAttachments = useMemo(
    () =>
      lesson.attachments.filter(
        (attachment) =>
          isPdfAttachment(attachment) &&
          !isAuxiliaryAttachment(attachment.name),
      ),
    [lesson.attachments],
  );

  const selectedAttachment = useMemo(
    () =>
      visibleAttachments.find(
        (attachment) => attachment.id === selectedAttachmentId,
      ) ?? null,
    [visibleAttachments, selectedAttachmentId],
  );
  const effectivePlaybackId =
    playbackId || extractMuxPlaybackId(lesson.videoUrl);
  const canRenderMuxPlayer = Boolean(
    canAccessLesson && effectivePlaybackId && playbackToken && !muxRuntimeError,
  );
  const playbackErrorMessage =
    playbackError === PLAYBACK_ERROR_FALLBACK
      ? copy.unableSignedPlayback
      : playbackError;
  const muxTokens = useMemo(() => {
    const hasAnyToken = Boolean(
      playbackToken || thumbnailToken || storyboardToken,
    );
    if (!hasAnyToken) {
      return undefined;
    }

    return {
      playback: playbackToken || undefined,
      thumbnail: thumbnailToken || undefined,
      storyboard: storyboardToken || undefined,
    };
  }, [playbackToken, thumbnailToken, storyboardToken]);

  const muxTooltipMap = useMemo(() => {
    if (language === "pt") {
      return {
        Play: "Reproduzir",
        Pause: "Pausar",
        Mute: "Silenciar",
        Unmute: "Ativar som",
        Volume: "Volume",
        Settings: "Configurações",
        Captions: "Legendas",
        "Enter Fullscreen": "Tela cheia",
        "Exit Fullscreen": "Sair da tela cheia",
        "Seek Backward": "Voltar",
        "Seek Forward": "Avançar",
      } as Record<string, string>;
    }

    if (language === "es") {
      return {
        Play: "Reproducir",
        Pause: "Pausar",
        Mute: "Silenciar",
        Unmute: "Activar sonido",
        Volume: "Volumen",
        Settings: "Configuración",
        Captions: "Subtítulos",
        "Enter Fullscreen": "Pantalla completa",
        "Exit Fullscreen": "Salir de pantalla completa",
        "Seek Backward": "Retroceder",
        "Seek Forward": "Avanzar",
      } as Record<string, string>;
    }

    if (language === "fr") {
      return {
        Play: "Lire",
        Pause: "Pause",
        Mute: "Couper le son",
        Unmute: "Activer le son",
        Volume: "Volume",
        Settings: "Paramètres",
        Captions: "Sous-titres",
        "Enter Fullscreen": "Plein écran",
        "Exit Fullscreen": "Quitter le plein écran",
        "Seek Backward": "Reculer",
        "Seek Forward": "Avancer",
      } as Record<string, string>;
    }

    return {} as Record<string, string>;
  }, [language]);

  useEffect(() => {
    const idleCallback = window.requestIdleCallback?.(
      () => {
        setShouldLoadPlayback(true);
      },
      { timeout: 1200 },
    );

    if (idleCallback !== undefined) {
      return () => window.cancelIdleCallback?.(idleCallback);
    }

    const timeoutId = window.setTimeout(() => {
      setShouldLoadPlayback(true);
    }, 800);

    return () => window.clearTimeout(timeoutId);
  }, [lesson.id]);

  useEffect(() => {
    previewUrlRef.current = previewUrl;
  }, [previewUrl]);

  useEffect(() => {
    hasAppliedMuxDefaultSubtitleRef.current = false;
  }, [effectivePlaybackId]);

  useEffect(() => {
    setQuizSummary(initialQuizSummary);
  }, [initialQuizSummary]);

  useEffect(() => {
    if (!muxPlayerRef.current) {
      return;
    }

    muxPlayerRef.current.setAttribute("lang", languageToHtmlLang(language));
    enforceNoRemotePlayback();
    applyPreferredSubtitleTrack();
  }, [applyPreferredSubtitleTrack, enforceNoRemotePlayback, language]);

  useEffect(() => {
    const playerElement = muxPlayerRef.current as
      | (MuxPlayerElement & {
          textTracks?: TextTrackList | null;
        })
      | null;

    if (!playerElement) {
      return;
    }

    const handleLoadedMetadata = () => {
      enforceNoRemotePlayback();
      applyPreferredSubtitleTrack();
    };

    const textTracks = playerElement.textTracks;
    const handleTrackListChange = () => {
      applyPreferredSubtitleTrack();
    };

    playerElement.addEventListener("loadedmetadata", handleLoadedMetadata);
    textTracks?.addEventListener("addtrack", handleTrackListChange);
    textTracks?.addEventListener("change", handleTrackListChange);

    return () => {
      playerElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
      textTracks?.removeEventListener("addtrack", handleTrackListChange);
      textTracks?.removeEventListener("change", handleTrackListChange);
    };
  }, [applyPreferredSubtitleTrack, enforceNoRemotePlayback, effectivePlaybackId]);

  useEffect(() => {
    if (language === "en") {
      return;
    }

    const root = muxContainerRef.current;
    if (!root) {
      return;
    }

    const localizeMuxAttrs = () => {
      const elements = root.querySelectorAll<HTMLElement>(
        "[title], [aria-label]",
      );
      elements.forEach((element) => {
        const title = element.getAttribute("title");
        if (title && muxTooltipMap[title]) {
          element.setAttribute("title", muxTooltipMap[title]);
        }

        const ariaLabel = element.getAttribute("aria-label");
        if (ariaLabel && muxTooltipMap[ariaLabel]) {
          element.setAttribute("aria-label", muxTooltipMap[ariaLabel]);
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
      attributeFilter: ["title", "aria-label"],
    });

    return () => observer.disconnect();
  }, [language, muxTooltipMap]);

  useEffect(() => {
    setSelectedAttachmentId(visibleAttachments[0]?.id ?? null);
    setPreviewUrl((currentUrl) => {
      if (currentUrl.startsWith("blob:")) {
        URL.revokeObjectURL(currentUrl);
      }
      return "";
    });
    setPdfError("");
  }, [lesson.id, visibleAttachments]);

  useEffect(() => {
    return () => {
      const currentUrl = previewUrlRef.current;
      if (currentUrl.startsWith("blob:")) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadPlayback = async () => {
      if (!canAccessLesson || !shouldLoadPlayback) {
        setPlaybackId("");
        setPlaybackToken("");
        setThumbnailToken("");
        setStoryboardToken("");
        setPlaybackError("");
        setMuxRuntimeError("");
        return;
      }

      setPlaybackError("");
      setMuxRuntimeError("");

      try {
        const response = await axios.get(
          `/api/lessons/${lesson.id}/mux-playback`,
        );
        if (cancelled) return;

        setPlaybackId(response.data.playbackId || "");
        setPlaybackToken(response.data.playbackToken || "");
        setThumbnailToken(response.data.thumbnailToken || "");
        setStoryboardToken(response.data.storyboardToken || "");
      } catch (error: unknown) {
        if (cancelled) return;

        const isAxiosErrorFn =
          typeof axios.isAxiosError === "function" ? axios.isAxiosError : null;

        const responseError = isAxiosErrorFn?.(error)
          ? error.response?.data?.error
          : null;

        if (responseError) {
          setPlaybackId("");
          setPlaybackToken("");
          setThumbnailToken("");
          setStoryboardToken("");
          setPlaybackError(responseError);
          return;
        }

        setPlaybackId("");
        setPlaybackToken("");
        setThumbnailToken("");
        setStoryboardToken("");
        setPlaybackError(PLAYBACK_ERROR_FALLBACK);
      }
    };

    loadPlayback();

    return () => {
      cancelled = true;
    };
  }, [canAccessLesson, lesson.id, shouldLoadPlayback]);

  // Reset retry state whenever the active lesson changes.
  useEffect(() => {
    muxRetryCountRef.current = 0;
    muxRetryInFlightRef.current = false;
    muxLastPositionRef.current = 0;
    setMuxRetryState("idle");
    // Clear stale playback tokens immediately when lesson changes so the
    // player never renders the previous lesson's video while the new
    // playback id/token are being fetched. Prevents Class N showing
    // the video of Class N-1 during navigation.
    setPlaybackId("");
    setPlaybackToken("");
    setThumbnailToken("");
    setStoryboardToken("");
    setPlaybackError("");
    setMuxRuntimeError("");
    setIsPlayerPaused(true);
    hasAppliedMuxDefaultSubtitleRef.current = false;
  }, [lesson.id]);

  const MAX_MUX_RETRIES = 3;
  const RETRY_BASE_DELAY_MS = 250;

  const retryPlayback = useCallback(async () => {
    if (muxRetryInFlightRef.current) return;
    muxRetryInFlightRef.current = true;

    try {
      const player = muxPlayerRef.current;
      const lastPos = Math.max(0, Number(player?.currentTime ?? 0));
      muxLastPositionRef.current = lastPos;

      setMuxRetryState("retrying");
      setMuxRuntimeError("");

      const retryDelayMs = RETRY_BASE_DELAY_MS * Math.max(1, muxRetryCountRef.current);
      await new Promise<void>((resolve) => {
        window.setTimeout(() => resolve(), retryDelayMs);
      });

      const response = await axios.get(
        `/api/lessons/${lesson.id}/mux-playback`,
        { params: { _retry: Date.now() } },
      );
      setPlaybackId(response.data.playbackId || "");
      setPlaybackToken(response.data.playbackToken || "");
      setThumbnailToken(response.data.thumbnailToken || "");
      setStoryboardToken(response.data.storyboardToken || "");

      // Defer reload to next tick so Mux player picks up new tokens.
      window.setTimeout(() => {
        const current = muxPlayerRef.current;
        if (!current) return;
        try {
          if (lastPos > 0) {
            current.currentTime = lastPos;
          }
          const maybeMedia = (
            current as MuxPlayerElement & {
              media?: { load?: () => void } | null;
            }
          ).media;
          maybeMedia?.load?.();
        } catch {
          // Best-effort; if reload fails we'll surface error on next onError.
        }
      }, 50);
    } catch {
      setMuxRetryState("exhausted");
      setMuxRuntimeError(copy.muxRetryExhausted);
    } finally {
      muxRetryInFlightRef.current = false;
    }
  }, [
    copy.muxRetryExhausted,
    lesson.id,
    RETRY_BASE_DELAY_MS,
    setPlaybackId,
    setPlaybackToken,
    setThumbnailToken,
    setStoryboardToken,
  ]);

  const handleMuxError = useCallback(() => {
    setIsPlayerPaused(true);
    if (muxRetryInFlightRef.current) return;
    if (muxRetryCountRef.current >= MAX_MUX_RETRIES) {
      setMuxRetryState("exhausted");
      setMuxRuntimeError(copy.muxRetryExhausted);
      return;
    }
    muxRetryCountRef.current += 1;
    void retryPlayback();
  }, [copy.muxRetryExhausted, retryPlayback]);

  const handleManualReload = useCallback(() => {
    muxRetryCountRef.current = 0;
    setMuxRetryState("idle");
    setMuxRuntimeError("");
    setIsPlayerPaused(true);
    void retryPlayback();
  }, [retryPlayback]);

  const getAttachmentSignedUrl = useCallback(
    async (attachmentId: string, download = false) => {
      const response = await axios.get(
        `/api/lessons/${lesson.id}/attachments/${attachmentId}`,
        {
          params: {
            download: download ? 1 : 0,
            language,
          },
        },
      );

      return response.data as {
        signedUrl: string;
        name: string;
        storagePath: string;
      };
    },
    [language, lesson.id],
  );

  const openPdfPreview = useCallback(
    async (attachmentId: string) => {
      if (!canAccessAttachments) return;

      setIsLoadingPdf(true);
      setPdfError("");

      try {
        const data = await getAttachmentSignedUrl(attachmentId, false);

        setSelectedAttachmentId(attachmentId);
        setPreviewUrl((currentUrl) => {
          if (currentUrl.startsWith("blob:")) {
            URL.revokeObjectURL(currentUrl);
          }
          return data.signedUrl;
        });
      } catch (error: unknown) {
        const message = axios.isAxiosError(error)
          ? error.response?.data?.error || copy.unableLoadPdf
          : copy.unableLoadPdf;
        const fallbackAttachment = visibleAttachments.find(
          (item) => item.id === attachmentId,
        );
        if (fallbackAttachment?.url) {
          setSelectedAttachmentId(attachmentId);
          setPreviewUrl((currentUrl) => {
            if (currentUrl.startsWith("blob:")) {
              URL.revokeObjectURL(currentUrl);
            }
            return fallbackAttachment.url;
          });
          setPdfError("");
          toast.info(copy.loadedLegacyPdf);
        } else {
          setPdfError(message);
          toast.error(message);
        }
      } finally {
        setIsLoadingPdf(false);
      }
    },
    [
      canAccessAttachments,
      copy.loadedLegacyPdf,
      copy.unableLoadPdf,
      getAttachmentSignedUrl,
      visibleAttachments,
    ],
  );

  const downloadPdf = async (attachmentId: string) => {
    if (!canAccessAttachments) return;

    try {
      const data = await getAttachmentSignedUrl(attachmentId, true);
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (error: unknown) {
      const fallbackAttachment = visibleAttachments.find(
        (item) => item.id === attachmentId,
      );
      if (fallbackAttachment?.url) {
        window.open(fallbackAttachment.url, "_blank", "noopener,noreferrer");
        toast.info(copy.loadedLegacyDownload);
        return;
      }

      const message = axios.isAxiosError(error)
        ? error.response?.data?.error || copy.unableDownloadPdf
        : copy.unableDownloadPdf;
      toast.error(message);
    }
  };

  const handlePurchaseClick = async () => {
    if (isPurchasing) return;

    setIsPurchasing(true);
    setPaymentError("");
    try {
      const response = await axios.post("/api/checkout", {
        courseId: course.id,
        source: "dashboard",
        language,
        voucherCode: appliedVoucher?.voucher.code,
      });

      if (response.data?.url) {
        window.location.assign(response.data.url);
        return;
      }
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        typeof error.response?.data === "string"
      ) {
        setPaymentError(error.response.data);
        toast.error(error.response.data);
      } else {
        toast.error(copy.unableCheckout);
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const primePaymentModal = useCallback(() => {
    warmPaymentMethodModal();
  }, []);

  const openPaymentModal = useCallback(() => {
    warmPaymentMethodModal();
    setPaymentError("");
    setIsMethodModalOpen(true);
  }, []);

  const getPlaybackMetrics = useCallback((event?: Event) => {
    const eventTarget = event?.target as {
      duration?: number;
      currentTime?: number;
    } | null;
    const eventCurrentTarget = event?.currentTarget as {
      duration?: number;
      currentTime?: number;
    } | null;
    const muxPlayer = muxPlayerRef.current as {
      duration?: number;
      currentTime?: number;
    } | null;
    const durationCandidates = [
      eventTarget?.duration,
      eventCurrentTarget?.duration,
      muxPlayer?.duration,
    ];
    const currentCandidates = [
      eventTarget?.currentTime,
      eventCurrentTarget?.currentTime,
      muxPlayer?.currentTime,
    ];

    const duration =
      durationCandidates.find(
        (value) => Number.isFinite(value) && (value ?? 0) > 0,
      ) ?? DEFAULT_LESSON_DURATION_MINUTES * 60;
    const current =
      currentCandidates.find(
        (value) => Number.isFinite(value) && (value ?? 0) >= 0,
      ) ?? 0;

    return {
      duration: Number(duration),
      current: Number(current),
      percent: calculateLessonProgressPercent(
        Number(current),
        Number(duration),
      ),
    };
  }, []);

  const onTimeUpdate = async (event: Event) => {
    if (isCompleted || !canAccessLesson) return;

    const { duration, current, percent } = getPlaybackMetrics(event);
    if (!shouldPersistLessonProgress(percent, lastSavedPercent)) {
      return;
    }

    setLastSavedPercent(percent);

    try {
      const minutesRemaining = calculateLessonMinutesRemaining(
        current,
        duration,
      );

      await axios.put(
        `/api/courses/${course.id}/lessons/${lesson.id}/progress`,
        {
          isCompleted: false,
          progressPercent: percent,
          minutesRemaining,
        },
      );
    } catch {
      // Silent fail for background progress sync
    }
  };

  const hasReachedCompletionThreshold =
    lastSavedPercent >= COMPLETE_BUTTON_UNLOCK_PERCENT;

  const completeLesson = async () => {
    if (isCompleting || !canAccessLesson) return false;

    setIsCompleting(true);
    try {
      await axios.put(
        `/api/courses/${course.id}/lessons/${lesson.id}/progress`,
        {
          isCompleted: true,
          progressPercent: 100,
          minutesRemaining: 0,
        },
      );

      setIsCompleted(true);
      confetti.onOpen();
      toast.success(copy.lessonCompleted);
      router.refresh();
      return true;
    } catch {
      toast.error(copy.somethingWrong);
      return false;
    } finally {
      setIsCompleting(false);
    }
  };

  const onMarkAsComplete = () => {
    if (!canAccessLesson || isCompleting || !hasReachedCompletionThreshold) {
      return;
    }

    setIsConfirmCompleteOpen(true);
  };

  const onConfirmCompleteLesson = async () => {
    setIsConfirmCompleteOpen(false);

    const didCompleteLesson = await completeLesson();
    if (!didCompleteLesson) {
      return;
    }

    setShouldRefreshAfterQuizClose(true);
    setIsQuizOpen(true);
  };

  const handleQuizClose = () => {
    setIsQuizOpen(false);

    if (shouldRefreshAfterQuizClose) {
      setShouldRefreshAfterQuizClose(false);
      router.refresh();
    }
  };

  const hasCompletedQuiz = (quizSummary?.totalAttempts ?? 0) > 0;
  const isLessonAndQuizCompleted =
    isCompleted || (hasReachedCompletionThreshold && hasCompletedQuiz);
  const canLaunchGamification = isCompleted && hasQuizAvailable;
  const isCompleteButtonDisabled =
    isCompleting ||
    !canAccessLesson ||
    !hasReachedCompletionThreshold;
  const completeButtonTooltip = isCompleting
    ? copy.saving
    : !hasReachedCompletionThreshold
      ? copy.completeLockedTooltip
      : isLessonAndQuizCompleted
        ? copy.completedLabel
        : copy.gamificationReadyTooltip;

  const firstAttachmentId = visibleAttachments[0]?.id;

  useEffect(() => {
    if (!isNotesPanelOpen || !canAccessAttachments || !firstAttachmentId) {
      return;
    }

    const idleCallback = window.requestIdleCallback?.(
      () => {
        setShouldLoadPdfPreview(true);
      },
      { timeout: 1500 },
    );

    if (idleCallback !== undefined) {
      return () => window.cancelIdleCallback?.(idleCallback);
    }

    const timeoutId = window.setTimeout(() => {
      setShouldLoadPdfPreview(true);
    }, 1200);

    return () => window.clearTimeout(timeoutId);
  }, [canAccessAttachments, firstAttachmentId, isNotesPanelOpen, lesson.id]);

  useEffect(() => {
    if (!canAccessAttachments || !firstAttachmentId || !shouldLoadPdfPreview) {
      return;
    }

    void openPdfPreview(firstAttachmentId);
  }, [
    canAccessAttachments,
    firstAttachmentId,
    shouldLoadPdfPreview,
    openPdfPreview,
  ]);

  return (
    <DashboardPreferencesProvider>
      <div className="h-[100dvh] overflow-hidden bg-background">
        <Sidebar />

        <div className="lg:pl-56 h-full overflow-hidden p-2 pb-[168px] sm:p-3 sm:pb-[168px] lg:p-4 lg:pb-[168px]">
          <div
            className={`mx-auto h-full grid grid-cols-1 gap-3 lg:gap-4 min-h-0 ${isNotesPanelOpen ? "xl:grid-cols-2 xl:grid-rows-[1fr]" : "xl:grid-cols-1"}`}
          >
            <div className="min-w-0 min-h-0 flex flex-col gap-4">
              <div className="bg-card border-2 border-primary/50 rounded-xl overflow-hidden shadow-[0_0_0_1px_rgba(212,175,55,0.18)] h-full flex flex-col">
                <div className="p-3 sm:p-4 border-b-2 border-primary/45 bg-gradient-to-r from-primary/10 to-transparent">
                  <div className="flex flex-col gap-2">
                    <h2 className="text-2xl sm:text-3xl font-bold font-serif text-primary break-words leading-tight">
                      {classLabel}
                    </h2>
                    <div className="flex items-center gap-2 flex-nowrap overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                      <ThemeToggle />
                      <LanguageSelector />
                      <a
                        href={SPOTIFY_WEB_PLAYER_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={copy.musicSpotify}
                        aria-label={copy.musicSpotify}
                        className="relative group inline-flex shrink-0 items-center gap-1.5 h-8 rounded-md border border-primary/40 bg-background/95 px-2.5 text-[11px] font-semibold text-foreground transition-colors hover:bg-accent"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-4 w-4 text-emerald-500"
                          aria-hidden="true"
                          fill="currentColor"
                        >
                          <path d="M12 1.5a10.5 10.5 0 1 0 10.5 10.5A10.51 10.51 0 0 0 12 1.5Zm4.82 15.16a.78.78 0 0 1-1.08.26 9.63 9.63 0 0 0-9.72-.54.78.78 0 1 1-.66-1.41 11.2 11.2 0 0 1 11.3.63.78.78 0 0 1 .16 1.06Zm1.54-2.42a.97.97 0 0 1-1.34.32 11.8 11.8 0 0 0-11.93-.67.97.97 0 1 1-.83-1.75 13.75 13.75 0 0 1 13.9.79.97.97 0 0 1 .2 1.31Zm.13-2.61A14.1 14.1 0 0 0 4.1 10.8a1.16 1.16 0 1 1-.98-2.11 16.42 16.42 0 0 1 16.76 1.02 1.16 1.16 0 0 1-1.39 1.92Z" />
                        </svg>
                        <span>Spotify</span>
                      </a>

                      <button
                        type="button"
                        onClick={() =>
                          setIsNotesPanelOpen((current) => !current)
                        }
                        title={copy.toggleNotesTooltip}
                        aria-label={copy.toggleNotesTooltip}
                        className="relative group inline-flex shrink-0 items-center gap-1.5 h-8 rounded-md border border-primary/40 bg-background/95 px-2.5 text-[11px] font-semibold text-foreground transition-colors hover:bg-accent"
                      >
                        {isNotesPanelOpen ? (
                          <PanelRightClose className="h-4 w-4" />
                        ) : (
                          <PanelRightOpen className="h-4 w-4" />
                        )}
                        <span>
                          {isNotesPanelOpen
                            ? copy.hidePdfAction
                            : copy.showPdfAction}
                        </span>
                        <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gradient-to-r from-amber-500 to-yellow-400 px-2 py-1 text-[10px] font-semibold text-black opacity-0 shadow-md transition-all duration-100 group-hover:opacity-100 group-hover:-translate-y-0.5">
                          {copy.toggleNotesTooltip}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={onMarkAsComplete}
                        disabled={isCompleteButtonDisabled}
                        title={completeButtonTooltip}
                        aria-label={completeButtonTooltip}
                        className={`relative group inline-flex shrink-0 items-center gap-1.5 h-8 rounded-md border px-2.5 text-[11px] font-semibold transition-colors disabled:opacity-60 ${
                          isLessonAndQuizCompleted
                            ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/20"
                            : hasReachedCompletionThreshold
                              ? "border-primary/40 bg-background/95 text-foreground hover:bg-accent"
                              : "border-slate-500/35 bg-slate-500/10 text-slate-400 cursor-not-allowed"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="h-4 w-4 text-emerald-400" />
                        ) : null}
                        <span>
                          {copy.completeAction}
                        </span>
                        <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gradient-to-r from-amber-500 to-yellow-400 px-2 py-1 text-[10px] font-semibold text-black opacity-0 shadow-md transition-all duration-100 group-hover:opacity-100 group-hover:-translate-y-0.5">
                          {completeButtonTooltip}
                        </span>
                      </button>

                      {canUseGamification ? (
                        <button
                          type="button"
                          onClick={() => setIsQuizOpen(true)}
                          disabled={!canLaunchGamification}
                          title={
                            canLaunchGamification
                              ? copy.gamificationReadyTooltip
                              : copy.gamificationLockedTooltip
                          }
                          aria-label={copy.gamificationAction}
                          className={`relative group inline-flex shrink-0 items-center gap-1.5 h-8 rounded-md border px-2.5 text-[11px] font-semibold transition-colors disabled:opacity-60 ${
                            canLaunchGamification
                              ? "border-yellow-400/60 bg-gradient-to-r from-yellow-400 to-amber-500 text-black hover:brightness-105"
                              : "border-slate-500/35 bg-slate-500/10 text-slate-400 cursor-not-allowed"
                          }`}
                        >
                        <span>{copy.gamificationAction}</span> 
                        </button>
                      ) : null}

                      {quizSummary && quizSummary.totalAttempts > 0 ? (
                        <LessonQuizMedalBadge
                          medal={quizSummary.bestMedal}
                          language={language}
                          scorePercent={quizSummary.bestScorePercent}
                          compact
                          className="shrink-0"
                        />
                      ) : null}
                    </div>
                  </div>
                </div>
                <div
                  ref={muxContainerRef}
                  data-mux-retry-state={muxRetryState}
                  className="relative flex-1 min-h-0 bg-black border border-primary/50 dark:border-primary/70 rounded-b-xl overflow-hidden"
                >
                  {canRenderMuxPlayer ? (
                    <MuxPlayer
                      ref={muxPlayerRef}
                      className="lesson-mux-player lesson-mux-player--fit-contain absolute inset-0 h-full w-full"
                      playbackId={effectivePlaybackId}
                      tokens={muxTokens}
                      poster={DASHBOARD_VIDEO_COVER_IMAGE}
                      defaultHiddenCaptions
                      accentColor="#d4af37"
                      onCanPlay={() => {
                        enforceNoRemotePlayback();
                        setIsReady(true);
                        muxRetryCountRef.current = 0;
                        if (muxRetryState !== "idle") {
                          setMuxRetryState("idle");
                        }
                        setMuxRuntimeError("");
                      }}
                      onPlay={() => {
                        setIsPlayerPaused(false);
                      }}
                      onPause={() => {
                        setIsPlayerPaused(true);
                      }}
                      onEnded={() => {
                        setIsPlayerPaused(true);
                      }}
                      onTimeUpdate={onTimeUpdate}
                      onLoadStart={enforceNoRemotePlayback}
                      onError={handleMuxError}
                      playsInline
                      castReceiver=""
                      disableTracking
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                      {canAccessLesson ? (
                        <p className="text-sm text-muted-foreground">
                          {playbackErrorMessage ||
                            muxRuntimeError ||
                            copy.loadingSignedVideo}
                        </p>
                      ) : (
                        <div className="max-w-md space-y-3">
                          <div className="mx-auto w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center">
                            <Lock className="h-6 w-6 text-primary" />
                          </div>
                          <h3 className="text-lg font-semibold text-foreground">
                            {copy.lessonLockedTitle}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {copy.lessonLockedDesc}
                          </p>
                          <Button
                            type="button"
                            onClick={openPaymentModal}
                            onMouseEnter={primePaymentModal}
                            onFocus={primePaymentModal}
                            onTouchStart={primePaymentModal}
                            disabled={isPurchasing}
                            className="w-full sm:w-auto"
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            {isPurchasing
                              ? copy.openingCheckout
                              : copy.chooseMethod}
                          </Button>
                          {paymentError ? (
                            <p className="text-xs text-destructive">
                              {paymentError}
                            </p>
                          ) : null}
                        </div>
                      )}
                    </div>
                  )}
                  {canRenderMuxPlayer && isPlayerPaused && muxRetryState === "idle" ? (
                    <button
                      type="button"
                      onClick={() => {
                        const current = muxPlayerRef.current as
                          | (MuxPlayerElement & {
                              play?: () => Promise<void>;
                            })
                          | null;
                        if (!current) {
                          return;
                        }
                        void current.play?.().catch(() => {
                          // Browser playback policies can still block manual attempts.
                        });
                      }}
                      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-black/80"
                      aria-label="Play video"
                    >
                      <img
                        src={DASHBOARD_VIDEO_COVER_IMAGE}
                        alt="Cultura del Jazz"
                        className="h-24 w-24 rounded-xl border border-primary/60 bg-black/20 object-cover shadow-lg sm:h-28 sm:w-28"
                      />
                      <span className="inline-flex items-center gap-2 rounded-full border border-primary/60 bg-black/60 px-4 py-2 text-sm font-semibold text-white">
                        <Play className="h-4 w-4 fill-current" />
                        Play video
                      </span>
                    </button>
                  ) : null}
                  {canRenderMuxPlayer && muxRetryState !== "idle" ? (
                    <div
                      data-testid="mux-retry-overlay"
                      className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/70 p-6 text-center"
                    >
                      <div className="pointer-events-auto max-w-md space-y-3">
                        {muxRetryState === "retrying" ? (
                          <>
                            <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                            <p className="text-sm text-white">
                              {copy.muxRetrying}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm text-white">
                              {muxRuntimeError || copy.muxRetryExhausted}
                            </p>
                            <Button
                              type="button"
                              onClick={handleManualReload}
                              variant="secondary"
                            >
                              {copy.muxReloadButton}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ) : null}
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
                        {selectedAttachment ? (
                          <div className="shrink-0 rounded-lg border border-border p-2.5 bg-background/80">
                            <div className="flex justify-end">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                  downloadPdf(selectedAttachment.id)
                                }
                                className="w-full sm:w-auto"
                              >
                                {copy.downloadSelectedPdf}
                              </Button>
                            </div>
                          </div>
                        ) : null}

                        <div className="mt-2 flex-1 min-h-[200px] rounded-lg border-2 border-primary/40 bg-background overflow-hidden">
                          {isLoadingPdf ? (
                            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                              {copy.loadingPdfPreview}
                            </div>
                          ) : pdfError ? (
                            <div className="h-full flex items-center justify-center px-4 text-center text-sm text-muted-foreground">
                              {pdfError}
                            </div>
                          ) : previewUrl ? (
                            <PdfWorkspaceViewer fileUrl={previewUrl} compact />
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
                      <p className="text-sm font-medium text-foreground">
                        {copy.whatYouUnlock}
                      </p>
                      <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                        <li>• {copy.unlockAllClasses}</li>
                        <li>• {copy.unlockMuxPlayback}</li>
                        <li>• {copy.unlockNotes}</li>
                      </ul>
                      <Button
                        type="button"
                        onClick={openPaymentModal}
                        onMouseEnter={primePaymentModal}
                        onFocus={primePaymentModal}
                        onTouchStart={primePaymentModal}
                        disabled={isPurchasing}
                        className="w-full mt-4"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        {isPurchasing
                          ? copy.openingCheckout
                          : copy.chooseMethod}
                      </Button>
                      {paymentError ? (
                        <p className="mt-2 text-xs text-destructive">
                          {paymentError}
                        </p>
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

        <SpotifyPlaylistFooter className="fixed bottom-0 left-0 right-0 z-30 lg:left-56" />
      </div>

      {isConfirmCompleteOpen ? (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-primary/35 bg-card p-5 shadow-2xl">
            <h3 className="text-lg font-semibold text-foreground">
              {copy.confirmCompleteTitle}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {copy.confirmCompleteMessage}
            </p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsConfirmCompleteOpen(false)}
                disabled={isCompleting}
              >
                {copy.confirmCompleteCancel}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  void onConfirmCompleteLesson();
                }}
                disabled={isCompleting}
                className="bg-primary text-primary-foreground"
              >
                {isCompleting ? copy.saving : copy.confirmCompleteConfirm}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <LessonQuizOverlay
        courseId={course.id}
        lessonId={lesson.id}
        isOpen={isQuizOpen}
        initialSummary={quizSummary}
        onClose={handleQuizClose}
        onSummaryChange={setQuizSummary}
      />

      <PaymentMethodModal
        isOpen={isMethodModalOpen}
        isLoading={isPurchasing}
        language={language}
        courseId={course.id}
        errorMessage={paymentError}
        onClose={() => {
          if (!isPurchasing) {
            setIsMethodModalOpen(false);
          }
        }}
        onVoucherApplied={(voucher) => {
          setAppliedVoucher(voucher);
          setPaymentError("");
        }}
        onConfirm={() => {
          void handlePurchaseClick();
        }}
      />
    </DashboardPreferencesProvider>
  );
};
