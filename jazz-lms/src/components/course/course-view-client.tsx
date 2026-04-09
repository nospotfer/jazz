"use client";

import { useDashboardPreferences } from "@/components/providers/dashboard-preferences-provider";
import type { AppliedVoucher } from "@/components/vouchers/voucher-input";
import {
  getLocalizedJazzDescription,
  getLocalizedJazzSubtitle,
} from "@/lib/course-lessons";
import {
  loadPaymentMethodModal,
  warmPaymentMethodModal,
} from "@/lib/payment-modal-loader";
import { shouldResetCheckoutTransientState } from "@/lib/checkout-return";
import { DEFAULT_FULL_COURSE_PRICE_EUR } from "@/lib/pricing";
import axios from "axios";
import {
  Loader2,
  Lock,
  LockOpen,
  PlayCircle,
  ShoppingCart,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";

const UnlockAnimation = dynamic(
  () => import("./unlock-animation").then((mod) => mod.UnlockAnimation),
  { ssr: false },
);

const PurchaseSuccessModal = dynamic(
  () =>
    import("./purchase-success-modal").then((mod) => mod.PurchaseSuccessModal),
  { ssr: false },
);

const PaymentMethodModal = dynamic(
  () => loadPaymentMethodModal().then((mod) => mod.PaymentMethodModal),
  { ssr: false },
);

// ─── Lesson Data (same as landing page classes) ─────────────────────────────

interface LessonItem {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  isFree: boolean; // Controlled by backend; only first lesson is free
}

interface DashboardCourseProgressItem {
  id: string;
  title: string;
  videos: Array<{
    lessonId: string;
    title: string;
    progressPercent: number;
  }>;
}

const lessonsData: LessonItem[] = [
  {
    id: 1,
    title: "Clase 1",
    subtitle: "Introducción a la cultura del jazz",
    description:
      "Esta primera clase presenta una introducción general a la cultura del jazz, sus orígenes históricos y sociales, y los elementos que la distinguen de otras tradiciones musicales.",
    image: "/images/clase1.jpg",
    isFree: true,
  },
  {
    id: 2,
    title: "Clase 2",
    subtitle: "El lenguaje del jazz 1: heterogeneidad sonora",
    description:
      "Tras la introducción inicial, abordamos la heterogeneidad sonora y cómo la personalización del sonido rompe con la idea de pureza presente en otras músicas.",
    image: "/images/clase2.jpg",
    isFree: false,
  },
  {
    id: 3,
    title: "Clase 3",
    subtitle: "El lenguaje del jazz 2: antecedentes",
    description:
      "Revisamos los antecedentes afroamericanos surgidos tras la Guerra Civil y su influencia en el jazz a través del gospel y el blues.",
    image: "/images/clase3.jpg",
    isFree: false,
  },
  {
    id: 4,
    title: "Clase 4",
    subtitle: "El lenguaje del jazz 3: improvisación",
    description:
      "La improvisación se estudia como eje central del lenguaje del jazz, analizando formas y recursos como la paráfrasis, lo motívico y lo modal.",
    image: "/images/clase4.jpg",
    isFree: false,
  },
  {
    id: 5,
    title: "Clase 5",
    subtitle: "Un antecedente decisivo: ragtime",
    description:
      "Exploramos el ragtime, su desarrollo y su transición hacia el nacimiento del jazz de Nueva Orleans.",
    image: "/images/clase5.jpg",
    isFree: false,
  },
  {
    id: 6,
    title: "Clase 6",
    subtitle: "El lenguaje del jazz 4: ritmo",
    description:
      "Analizamos el ritmo en el jazz temprano y la evolución de la sección rítmica hasta el bop.",
    image: "/images/clase6.jpg",
    isFree: false,
  },
  {
    id: 7,
    title: "Clase 7",
    subtitle: "Jamming y blowing",
    description:
      "Estudiamos las jam sessions y su importancia para consolidar la cultura del jazz en ciudades clave como Kansas City y Nueva York.",
    image: "/images/clase7.jpg",
    isFree: false,
  },
  {
    id: 8,
    title: "Clase 8",
    subtitle: "Composición y arreglos en jazz",
    description:
      "Vemos cómo los grandes compositores de jazz escribían pensando en músicos concretos y en sus timbres personales.",
    image: "/images/clase8.jpg",
    isFree: false,
  },
  {
    id: 9,
    title: "Clase 9",
    subtitle: "De las marching bands a los primeros grupos de jazz",
    description:
      "Recorremos las primeras formaciones, desde Nueva Orleans hasta los grupos que definieron el primer sonido del jazz.",
    image: "/images/clase9.jpg",
    isFree: false,
  },
  {
    id: 10,
    title: "Clase 10",
    subtitle: "Swing y combos clásicos",
    description:
      "Nos enfocamos en las grandes orquestas de la era swing y en su papel para expandir el jazz internacionalmente.",
    image: "/images/clase10.jpg",
    isFree: false,
  },
  {
    id: 11,
    title: "Clase 11",
    subtitle: "Combos modernos e instrumentos de sección rítmica",
    description:
      "Abordamos la evolución hacia el bop, hard bop y jazz modal, junto con la función de cada instrumento rítmico.",
    image: "/images/clase11.jpg",
    isFree: false,
  },
  {
    id: 12,
    title: "Clase 12",
    subtitle: "Improvisación",
    description:
      "Profundizamos en los principales procedimientos improvisatorios y en su aplicación por grandes solistas.",
    image: "/images/clase12.jpg",
    isFree: false,
  },
  {
    id: 13,
    title: "Clase 13",
    subtitle: "Jazz y entretenimiento",
    description:
      "Analizamos cómo el jazz pasó de convivir con otros espectáculos populares a consolidarse como cultura musical independiente.",
    image: "/images/clase13.jpg",
    isFree: false,
  },
  {
    id: 14,
    title: "Clase 14",
    subtitle: "Canto jazz 1",
    description:
      "Estudiamos las raíces vocales del jazz y las figuras clave que marcaron su desarrollo en el período clásico.",
    image: "/images/clase14.jpg",
    isFree: false,
  },
  {
    id: 15,
    title: "Clase 15",
    subtitle: "Canto jazz 2",
    description:
      "Cerramos con las grandes voces del swing y su impacto en la evolución del canto jazzístico.",
    image: "/images/clase15.jpg",
    isFree: false,
  },
];



// ─── Float Popup Component ──────────────────────────────────────────────────

interface FloatPopupProps {
  lesson: LessonItem;
  onClose: () => void;
  isPinned: boolean;
  position: { x: number; y: number };
  hasPurchased: boolean;
  onPurchaseClick: () => void;
  copy: {
    close: string;
    backToDashboard: string;
    premiumContent: string;
    unlockLessonHint: string;
    buyFullCourse: string;
    classPreview: string;
    premiumClickHint: string;
  };
}

function FloatPopup({
  lesson,
  onClose,
  isPinned,
  position,
  hasPurchased,
  onPurchaseClick,
  copy,
}: FloatPopupProps) {
  if (isPinned) {
    // Full-screen modal mode (like landing page ExpandedCard)
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <div
          className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[85vh] overflow-hidden animate-fade-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-colors"
            aria-label={copy.close}
          >
            <X className="h-5 w-5" />
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
            {/* Left - Description */}
            <div className="p-8 lg:p-10 flex flex-col justify-center overflow-y-auto max-h-[85vh]">
              <div className="mb-4">
                <span className="text-yellow-600 text-sm font-bold uppercase tracking-widest">
                  {lesson.title}
                </span>
              </div>
              <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-6">
                {lesson.subtitle}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed mb-6">
                {lesson.description}
              </p>

              {/* Lock status */}
              {!lesson.isFree && !hasPurchased && (
                <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                  <Lock className="h-5 w-5 text-yellow-500 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                      {copy.premiumContent}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {copy.unlockLessonHint}
                    </p>
                  </div>
                </div>
              )}

              {!lesson.isFree && !hasPurchased && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                    }}
                    className="w-full border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-semibold py-3 px-4 rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    {copy.backToDashboard}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                      onPurchaseClick();
                    }}
                    className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-semibold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg shadow-yellow-500/25 hover:shadow-yellow-500/40 flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    {copy.buyFullCourse}
                  </button>
                </div>
              )}
            </div>

            {/* Right - Preview Visual (blurred for locked) */}
            <div className="relative bg-black min-h-[300px] lg:min-h-0">
              <Image
                src={lesson.image}
                alt={lesson.subtitle}
                fill
                className={`absolute inset-0 w-full h-full object-cover ${
                  !lesson.isFree && !hasPurchased ? "blur-md" : ""
                }`}
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

              {/* Lock overlay for premium content */}
              {!lesson.isFree && !hasPurchased && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="bg-black/50 backdrop-blur-sm rounded-full p-4">
                    <Lock className="h-8 w-8 text-yellow-400" />
                  </div>
                </div>
              )}

              <div className="absolute bottom-4 left-4 text-white">
                <p className="text-xs uppercase tracking-widest opacity-70">
                  {copy.classPreview}
                </p>
                <p className="text-sm font-semibold">{lesson.subtitle}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Floating popup mode (on hover)
  return (
    <div
      className="fixed z-[70] w-72 sm:w-80 pointer-events-none animate-float-popup-in"
      style={{
        left: `${position.x}px`,
        top: `${position.y - 12}px`,
        transform: "translate(-50%, -100%)",
      }}
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4">
          <span className="text-yellow-600 text-xs font-bold uppercase tracking-widest">
            {lesson.title}
          </span>
          <h4 className="text-sm font-bold text-gray-900 dark:text-white mt-1 leading-snug">
            {lesson.subtitle}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
            {lesson.description}
          </p>
          {!lesson.isFree && !hasPurchased && (
            <div className="flex items-center gap-2 mt-3 text-yellow-600 dark:text-yellow-400">
              <Lock className="h-3.5 w-3.5" />
              <span className="text-xs font-semibold">
                {copy.premiumClickHint}
              </span>
            </div>
          )}
        </div>
      </div>
      {/* Arrow */}
      <div className="flex justify-center">
        <div className="w-3 h-3 bg-white dark:bg-gray-900 border-b border-r border-gray-200 dark:border-gray-700 transform rotate-45 -mt-1.5" />
      </div>
    </div>
  );
}

// ─── Main Course View ───────────────────────────────────────────────────────

interface CourseViewProps {
  userName: string;
  hasPurchased: boolean;
  courseId: string | null;
  lessonRoutesByTitle: Record<string, string>;
  lessonRoutesInOrder: string[];
  lessonIdsInOrder: string[];
  lessonTitlesInOrder: string[];
}

export function CourseViewClient({
  userName,
  hasPurchased: initialHasPurchased,
  courseId,
  lessonRoutesByTitle,
  lessonRoutesInOrder,
  lessonIdsInOrder,
  lessonTitlesInOrder,
}: CourseViewProps) {
  const { language } = useDashboardPreferences();
  void userName;
  const copy = {
    es: {
      classPrefix: "Clase",
      processing: "Procesando...",
      buyFullCourse: "Comprar curso completo — €29.99",
      chooseMethod: "Aplicar voucher y continuar",
      watched: "visto",
      purchaseRequired: "Compra requerida",
      available: "Disponible",
      premium: "Premium",
      close: "Cerrar",
      backToDashboard: "Volver al dashboard",
      premiumContent: "Contenido premium",
      unlockLessonHint: "Compra el curso para desbloquear esta lección",
      classPreview: "Vista previa de clase",
      premiumClickHint: "Premium — Haz clic para saber más",
      academyTitle: "Academia Cultura del Jazz",
      purchaseVerifying: "Verificando tu pago y desbloqueo del curso...",
      purchasePending:
        "Pago recibido. La confirmación aún está pendiente, seguimos verificando automáticamente...",
    },
    en: {
      classPrefix: "Class",
      processing: "Processing...",
      buyFullCourse: "Buy full course — €29.99",
      chooseMethod: "Apply voucher and continue",
      watched: "watched",
      purchaseRequired: "Purchase required",
      available: "Available",
      premium: "Premium",
      close: "Close",
      backToDashboard: "Back to dashboard",
      premiumContent: "Premium content",
      unlockLessonHint: "Purchase the course to unlock this lesson",
      classPreview: "Class preview",
      premiumClickHint: "Premium — Click to learn more",
      academyTitle: "Jazz Culture Academy",
      purchaseVerifying: "Verifying your payment and course unlock...",
      purchasePending:
        "Payment received. Confirmation is still pending, we are still checking automatically...",
    },
    fr: {
      classPrefix: "Cours",
      processing: "Traitement...",
      buyFullCourse: "Acheter le cours complet — €29.99",
      chooseMethod: "Appliquer un code et continuer",
      watched: "vu",
      purchaseRequired: "Achat requis",
      available: "Disponible",
      premium: "Premium",
      close: "Fermer",
      backToDashboard: "Retour au tableau de bord",
      premiumContent: "Contenu premium",
      unlockLessonHint: "Achetez le cours pour débloquer cette leçon",
      classPreview: "Aperçu du cours",
      premiumClickHint: "Premium — Cliquez pour en savoir plus",
      academyTitle: "Académie Culture du Jazz",
      purchaseVerifying: "Vérification du paiement et du déblocage du cours...",
      purchasePending:
        "Paiement reçu. La confirmation est encore en attente, nous continuons la vérification automatiquement...",
    },
    pt: {
      classPrefix: "Aula",
      processing: "Processando...",
      buyFullCourse: "Comprar curso completo — €29.99",
      chooseMethod: "Aplicar voucher e continuar",
      watched: "assistido",
      purchaseRequired: "Compra necessária",
      available: "Disponível",
      premium: "Premium",
      close: "Fechar",
      backToDashboard: "Voltar ao dashboard",
      premiumContent: "Conteúdo premium",
      unlockLessonHint: "Compre o curso para desbloquear esta aula",
      classPreview: "Prévia da aula",
      premiumClickHint: "Premium — Clique para saber mais",
      academyTitle: "Academia Cultura do Jazz",
      purchaseVerifying: "Verificando seu pagamento e desbloqueio do curso...",
      purchasePending:
        "Pagamento recebido. A confirmação ainda está pendente, seguimos verificando automaticamente...",
    },
  }[language];
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hasPurchased, setHasPurchased] = useState(initialHasPurchased);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [pinnedIndex, setPinnedIndex] = useState<number | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isVerifyingPurchase, setIsVerifyingPurchase] = useState(false);
  const [showUnlockAnimation, setShowUnlockAnimation] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [progressByLessonId, setProgressByLessonId] = useState<
    Record<string, number>
  >({});
  const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<AppliedVoucher | null>(
    null,
  );
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const handledPurchaseParamsRef = useRef<string | null>(null);

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

  useEffect(() => {
    setHasPurchased(initialHasPurchased);
  }, [initialHasPurchased]);

  useEffect(() => {
    const handlePageShow = () => {
      if (shouldResetCheckoutTransientState(searchParams)) {
        setIsPurchasing(false);
        setIsVerifyingPurchase(false);
      }
    };

    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [searchParams]);

  useEffect(() => {
    if (!hasPurchased) {
      setProgressByLessonId({});
      return;
    }

    fetch("/api/dashboard/courses-progress")
      .then((response) => response.json())
      .then((data) => {
        const nextCourses: DashboardCourseProgressItem[] = data.courses ?? [];
        const nextProgress: Record<string, number> = {};

        for (const course of nextCourses) {
          for (const video of course.videos ?? []) {
            const key = video.lessonId;
            const current = nextProgress[key] ?? 0;
            nextProgress[key] = Math.max(current, video.progressPercent ?? 0);
          }
        }

        setProgressByLessonId(nextProgress);
      })
      .catch(() => {
        setProgressByLessonId({});
      });
  }, [hasPurchased]);

  useEffect(() => {
    const purchaseStatus = searchParams.get("purchase");
    const source = searchParams.get("source");

    if (purchaseStatus !== "success" || source !== "dashboard") {
      return;
    }

    const purchaseParamsKey = searchParams.toString();
    if (handledPurchaseParamsRef.current === purchaseParamsKey) {
      return;
    }

    handledPurchaseParamsRef.current = purchaseParamsKey;

    let cancelled = false;

    const finishAsPurchased = () => {
      if (cancelled) {
        return;
      }

      setHasPurchased(true);
      setIsVerifyingPurchase(false);
      setPaymentError("");
      setShowUnlockAnimation(true);
      router.refresh();
      router.replace("/dashboard");
    };

    const verifyPurchase = async () => {
      const isLocalTestSuccess = searchParams.get("test") === "1";
      const isFreeSuccess = searchParams.get("free") === "true";
      const isVoucherSuccess = searchParams.get("voucher") === "true";

      if (isLocalTestSuccess || isFreeSuccess || isVoucherSuccess) {
        finishAsPurchased();
        return;
      }

      if (hasPurchased) {
        finishAsPurchased();
        return;
      }

      setIsVerifyingPurchase(true);

      const orderId =
        searchParams.get("order_id") || searchParams.get("orderId");
      const checkoutAttemptId =
        searchParams.get("checkoutAttemptId") ||
        searchParams.get("checkout_attempt_id") ||
        searchParams.get("attemptId") ||
        searchParams.get("attempt_id");
      const successCourseId = searchParams.get("courseId") || courseId;

      if (!successCourseId) {
        setIsVerifyingPurchase(false);
        setPaymentError(copy.purchasePending);
        handledPurchaseParamsRef.current = null;
        return;
      }

      const runReconciliation = async () => {
        try {
          const reconciliationPayload: {
            action: "reconcile";
            courseId: string;
            orderId?: string;
            checkoutAttemptId?: string;
          } = {
            action: "reconcile",
            courseId: successCourseId,
          };

          if (orderId) {
            reconciliationPayload.orderId = orderId;
          }

          if (checkoutAttemptId) {
            reconciliationPayload.checkoutAttemptId = checkoutAttemptId;
          }

          const reconciliation = await axios.post(
            "/api/purchases",
            reconciliationPayload,
          );

          return Boolean(reconciliation.data?.purchased);
        } catch {
          return false;
        }
      };

      if (await runReconciliation()) {
        finishAsPurchased();
        return;
      }

      const maxAttempts = 120;
      const pollIntervalMs = 2000;

      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        if (cancelled) {
          return;
        }

        if (await runReconciliation()) {
          finishAsPurchased();
          return;
        }

        await new Promise((resolve) => {
          window.setTimeout(resolve, pollIntervalMs);
        });
      }

      if (!cancelled) {
        setIsVerifyingPurchase(false);
        setPaymentError(copy.purchasePending);
        handledPurchaseParamsRef.current = null;
      }
    };

    void verifyPurchase();

    return () => {
      cancelled = true;
    };
  }, [searchParams, hasPurchased, router, courseId, copy.purchasePending]);

  const handleMouseEnter = useCallback(
    (index: number, isLocked: boolean, e: React.MouseEvent) => {
      if (hasPurchased || !isLocked) return;
      if (pinnedIndex !== null) return;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setPopupPosition({ x: rect.left + rect.width / 2, y: rect.top });
      // Small delay to prevent flicker on fast mouse movement
      hoverTimerRef.current = setTimeout(() => {
        setHoveredIndex(index);
      }, 200);
    },
    [hasPurchased, pinnedIndex],
  );

  const handleMouseLeave = useCallback(() => {
    if (pinnedIndex !== null) return;
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }
    setHoveredIndex(null);
  }, [pinnedIndex]);

  const handlePurchaseClick = useCallback(async () => {
    if (!courseId) return;

    setIsPurchasing(true);
    setPaymentError("");
    try {
      const response = await axios.post("/api/checkout", {
        courseId,
        source: "dashboard",
        language,
        voucherCode: appliedVoucher?.voucher.code,
      });

      if (response.data?.url) {
        setIsMethodModalOpen(false);
        setIsPurchasing(false);
        window.location.assign(response.data.url);
        return;
      }
      setIsPurchasing(false);
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        typeof error.response?.data === "string"
      ) {
        setPaymentError(error.response.data);
      }
      setIsPurchasing(false);
    }
  }, [appliedVoucher, courseId, language]);

  const primePaymentModal = useCallback(() => {
    warmPaymentMethodModal();
  }, []);

  const openPaymentModal = useCallback(() => {
    warmPaymentMethodModal();
    setPaymentError("");
    setIsMethodModalOpen(true);
  }, []);

  const handleCardClick = useCallback(
    (index: number) => {
      const lesson = lessonsData[index];
      const lessonRoute =
        lessonRoutesInOrder[index] ||
        lessonRoutesByTitle[lesson.subtitle.toLowerCase().trim()];

      const isFreeLesson = lesson.isFree;

      if (hasPurchased || isFreeLesson) {
        if (lessonRoute) {
          router.push(lessonRoute);
          return;
        }

        if (courseId) {
          router.push(`/courses/${courseId}`);
        }
        return;
      }

      setPinnedIndex(index);
      setHoveredIndex(null);
    },
    [courseId, hasPurchased, lessonRoutesByTitle, lessonRoutesInOrder, router],
  );

  const handleClosePopup = useCallback(() => {
    setPinnedIndex(null);
    setHoveredIndex(null);
  }, []);

  const handleUnlockAnimationComplete = useCallback(() => {
    setShowUnlockAnimation(false);
    setShowSuccessModal(true);
  }, []);

  const handleSuccessModalClose = useCallback(() => {
    setShowSuccessModal(false);
  }, []);

  // Get current lessons with backend-controlled lock status
  const lessons = lessonsData.map((lesson, index) => ({
    ...lesson,
    title: `${copy.classPrefix} ${index + 1}`,
    subtitle:
      getLocalizedJazzSubtitle(index + 1, language) ||
      lessonTitlesInOrder[index] ||
      lesson.subtitle,
    description:
      getLocalizedJazzDescription(index + 1, language) || lesson.description,
    isFree: lesson.isFree || hasPurchased,
  }));

  return (
    <>
      <div className="space-y-3 sm:space-y-4">
        {/* Course title */}
        <div className="text-center space-y-2 px-1 sm:px-0">
          <p className="text-[11px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.28em] text-primary/80">
            {copy.academyTitle}
          </p>
          {!hasPurchased && (
            <div className="mx-auto w-full max-w-sm space-y-2">
              <button
                onClick={openPaymentModal}
                onMouseEnter={primePaymentModal}
                onFocus={primePaymentModal}
                onTouchStart={primePaymentModal}
                disabled={isPurchasing || isVerifyingPurchase}
                className="mx-auto bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold py-2 px-5 rounded-xl transition-all duration-300 shadow-lg shadow-yellow-500/25 hover:shadow-yellow-500/40 inline-flex items-center justify-center gap-2"
              >
                {isPurchasing || isVerifyingPurchase ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isVerifyingPurchase
                      ? copy.purchaseVerifying
                      : copy.processing}
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4" />
                    {copy.buyFullCourse}
                  </>
                )}
              </button>
              {isVerifyingPurchase ? (
                <p className="text-xs text-muted-foreground text-left">
                  {copy.purchaseVerifying}
                </p>
              ) : null}
              {paymentError ? (
                <p className="text-xs text-destructive text-left">
                  {paymentError}
                </p>
              ) : null}
            </div>
          )}
        </div>

        {/* Lessons Grid */}
        <div className="mt-[2.2dvh] sm:mt-[2.6dvh] rounded-2xl border border-primary/30 hover:border-primary/60 transition-colors bg-card/40 p-3.5 sm:p-4 min-h-[56dvh] lg:min-h-[60dvh]">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2 sm:gap-2.5">
            {lessons.map((lesson, index) => {
              const isLocked = !lesson.isFree && !hasPurchased;
              const mappedLessonId = lessonIdsInOrder[index];
              const progressPercent = mappedLessonId
                ? (progressByLessonId[mappedLessonId] ?? 0)
                : 0;

              return (
                <div
                  key={lesson.id}
                  className="relative"
                  onMouseEnter={(e) => handleMouseEnter(index, isLocked, e)}
                  onMouseLeave={handleMouseLeave}
                >
                  <button
                    className={`group relative w-full rounded-2xl overflow-hidden border text-left will-change-transform transition-[transform,box-shadow,border-color,filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      hoveredIndex === index
                        ? "shadow-2xl scale-[1.03] -translate-y-1 z-10"
                        : "hover:shadow-xl hover:scale-[1.01] hover:-translate-y-0.5"
                    } ${
                      hoveredIndex === index && !isLocked
                        ? "ring-2 ring-primary/70 border-primary/70"
                        : hoveredIndex === index && isLocked
                          ? "ring-2 ring-primary/40 border-primary/40"
                          : "border-primary/30 hover:border-primary/60"
                    }
                  }`}
                    onClick={() => handleCardClick(index)}
                  >
                    {/* Image thumbnail */}
                    <div className="relative h-[6.5rem] sm:h-[7.5rem] w-full overflow-hidden">
                      <Image
                        src={lesson.image}
                        alt={lesson.subtitle}
                        fill
                        priority={lesson.id === 8}
                        className={`object-cover transition-all duration-500 group-hover:scale-110 ${
                          isLocked ? "blur-[6px] brightness-50" : ""
                        }`}
                        sizes="(min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                      {/* Play icon for free/purchased lessons */}
                      {!isLocked && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="bg-yellow-500/90 rounded-full p-2">
                            <PlayCircle className="h-6 w-6 text-black" />
                          </div>
                        </div>
                      )}

                      {/* Padlock for locked lessons */}
                      {isLocked && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-black/40 backdrop-blur-sm rounded-full p-2.5">
                            <Lock className="h-5 w-5 text-yellow-400 drop-shadow-lg" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Card body */}
                    <div
                      className={`p-2.5 sm:p-3.5 ${isLocked ? "bg-gray-100 dark:bg-gray-800/80" : "bg-gradient-to-br from-primary/95 to-primary/75"}`}
                    >
                      <h3
                        className={`text-xs sm:text-sm font-bold leading-tight ${
                          isLocked
                            ? "text-gray-500 dark:text-gray-400"
                            : "text-primary-foreground"
                        }`}
                      >
                        {lesson.title}
                      </h3>
                      <p
                        className={`text-[10px] sm:text-xs mt-0.5 ${hoveredIndex === index ? "line-clamp-none" : "line-clamp-2"} leading-snug ${
                          isLocked
                            ? "text-gray-400 dark:text-gray-500"
                            : "text-primary-foreground/85"
                        }`}
                      >
                        {lesson.subtitle}
                      </p>

                      <div className="mt-2">
                        <div className="w-full bg-muted/70 rounded-full h-1.5">
                          <div
                            className="bg-primary h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[10px]">
                          <span
                            className={
                              isLocked
                                ? "text-gray-400 dark:text-gray-500"
                                : "text-primary-foreground/85"
                            }
                          >
                            {progressPercent}% {copy.watched}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 ${isLocked ? "text-gray-400 dark:text-gray-500" : "text-primary-foreground/85"}`}
                          >
                            {isLocked ? (
                              <Lock className="h-3.5 w-3.5" />
                            ) : (
                              <LockOpen className="h-3.5 w-3.5" />
                            )}
                            {isLocked ? copy.purchaseRequired : copy.available}
                          </span>
                        </div>
                      </div>

                      {/* Small padlock indicator */}
                      {isLocked && (
                        <div className="flex items-center gap-1 mt-1">
                          <Lock className="h-3 w-3 text-yellow-500" />
                          <span className="text-[10px] text-yellow-600 dark:text-yellow-400 font-semibold">
                            {copy.premium}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Float popup on hover */}
                  {!hasPurchased &&
                    isLocked &&
                    hoveredIndex === index &&
                    pinnedIndex === null && (
                      <FloatPopup
                        lesson={lesson}
                        onClose={handleClosePopup}
                        isPinned={false}
                        position={popupPosition}
                        hasPurchased={hasPurchased}
                        onPurchaseClick={openPaymentModal}
                        copy={copy}
                      />
                    )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pinned popup (full-screen modal) */}
      {!hasPurchased && pinnedIndex !== null && (
        <FloatPopup
          lesson={lessons[pinnedIndex]}
          onClose={handleClosePopup}
          isPinned={true}
          position={popupPosition}
          hasPurchased={hasPurchased}
          onPurchaseClick={openPaymentModal}
          copy={copy}
        />
      )}

      <UnlockAnimation
        isVisible={showUnlockAnimation}
        onComplete={handleUnlockAnimationComplete}
        language={language}
      />

      <PurchaseSuccessModal
        isVisible={showSuccessModal}
        onClose={handleSuccessModalClose}
        language={language}
      />

      <PaymentMethodModal
        isOpen={isMethodModalOpen}
        isLoading={isPurchasing}
        language={language}
        courseId={courseId ?? ""}
        basePrice={DEFAULT_FULL_COURSE_PRICE_EUR}
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
    </>
  );
}
