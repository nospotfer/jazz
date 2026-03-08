'use client';

import Image from 'next/image';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Lock, X, PlayCircle, Loader2, ShoppingCart } from 'lucide-react';
import { UnlockAnimation } from './unlock-animation';
import { PurchaseSuccessModal } from './purchase-success-modal';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDashboardPreferences } from '@/components/providers/dashboard-preferences-provider';
import { getLocalizedJazzDescription, getLocalizedJazzSubtitle } from '@/lib/course-lessons';

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
    title: 'Clase 1',
    subtitle: 'Introducción a la cultura del jazz',
    description:
      'Esta primera clase presenta una introducción general a la cultura del jazz, sus orígenes históricos y sociales, y los elementos que la distinguen de otras tradiciones musicales.',
    image: '/images/clase1.jpg',
    isFree: true,
  },
  {
    id: 2,
    title: 'Clase 2',
    subtitle: 'El lenguaje del jazz 1: heterogeneidad sonora',
    description:
      'Tras la introducción inicial, abordamos la heterogeneidad sonora y cómo la personalización del sonido rompe con la idea de pureza presente en otras músicas.',
    image: '/images/clase2.jpg',
    isFree: false,
  },
  {
    id: 3,
    title: 'Clase 3',
    subtitle: 'El lenguaje del jazz 2: antecedentes',
    description:
      'Revisamos los antecedentes afroamericanos surgidos tras la Guerra Civil y su influencia en el jazz a través del gospel y el blues.',
    image: '/images/clase3.jpg',
    isFree: false,
  },
  {
    id: 4,
    title: 'Clase 4',
    subtitle: 'El lenguaje del jazz 3: improvisación',
    description:
      'La improvisación se estudia como eje central del lenguaje del jazz, analizando formas y recursos como la paráfrasis, lo motívico y lo modal.',
    image: '/images/clase4.jpg',
    isFree: false,
  },
  {
    id: 5,
    title: 'Clase 5',
    subtitle: 'Un antecedente decisivo: ragtime',
    description:
      'Exploramos el ragtime, su desarrollo y su transición hacia el nacimiento del jazz de Nueva Orleans.',
    image: '/images/clase5.jpg',
    isFree: false,
  },
  {
    id: 6,
    title: 'Clase 6',
    subtitle: 'El lenguaje del jazz 4: ritmo',
    description:
      'Analizamos el ritmo en el jazz temprano y la evolución de la sección rítmica hasta el bop.',
    image: '/images/clase6.jpg',
    isFree: false,
  },
  {
    id: 7,
    title: 'Clase 7',
    subtitle: 'Jamming y blowing',
    description:
      'Estudiamos las jam sessions y su importancia para consolidar la cultura del jazz en ciudades clave como Kansas City y Nueva York.',
    image: '/images/clase7.jpg',
    isFree: false,
  },
  {
    id: 8,
    title: 'Clase 8',
    subtitle: 'Composición y arreglos en jazz',
    description:
      'Vemos cómo los grandes compositores de jazz escribían pensando en músicos concretos y en sus timbres personales.',
    image: '/images/clase8.jpg',
    isFree: false,
  },
  {
    id: 9,
    title: 'Clase 9',
    subtitle: 'De las marching bands a los primeros grupos de jazz',
    description:
      'Recorremos las primeras formaciones, desde Nueva Orleans hasta los grupos que definieron el primer sonido del jazz.',
    image: '/images/clase9.jpg',
    isFree: false,
  },
  {
    id: 10,
    title: 'Clase 10',
    subtitle: 'Swing y combos clásicos',
    description:
      'Nos enfocamos en las grandes orquestas de la era swing y en su papel para expandir el jazz internacionalmente.',
    image: '/images/clase10.jpg',
    isFree: false,
  },
  {
    id: 11,
    title: 'Clase 11',
    subtitle: 'Combos modernos e instrumentos de sección rítmica',
    description:
      'Abordamos la evolución hacia el bop, hard bop y jazz modal, junto con la función de cada instrumento rítmico.',
    image: '/images/clase11.jpg',
    isFree: false,
  },
  {
    id: 12,
    title: 'Clase 12',
    subtitle: 'Improvisación',
    description:
      'Profundizamos en los principales procedimientos improvisatorios y en su aplicación por grandes solistas.',
    image: '/images/clase12.jpg',
    isFree: false,
  },
  {
    id: 13,
    title: 'Clase 13',
    subtitle: 'Jazz y entretenimiento',
    description:
      'Analizamos cómo el jazz pasó de convivir con otros espectáculos populares a consolidarse como cultura musical independiente.',
    image: '/images/clase13.jpg',
    isFree: false,
  },
  {
    id: 14,
    title: 'Clase 14',
    subtitle: 'Canto jazz 1',
    description:
      'Estudiamos las raíces vocales del jazz y las figuras clave que marcaron su desarrollo en el período clásico.',
    image: '/images/clase14.jpg',
    isFree: false,
  },
  {
    id: 15,
    title: 'Clase 15',
    subtitle: 'Canto jazz 2',
    description:
      'Cerramos con las grandes voces del swing y su impacto en la evolución del canto jazzístico.',
    image: '/images/clase15.jpg',
    isFree: false,
  },
];

const LESSON_SUBTITLES: Record<'es' | 'en' | 'fr' | 'pt', string[]> = {
  es: [
    'Introducción a la cultura del jazz',
    'El lenguaje del jazz 1: heterogeneidad sonora',
    'El lenguaje del jazz 2: antecedentes',
    'El lenguaje del jazz 3: improvisación',
    'Un antecedente decisivo: ragtime',
    'El lenguaje del jazz 4: ritmo',
    'Jamming y blowing',
    'Composición y arreglos en jazz',
    'De las marching bands a los primeros grupos de jazz',
    'Swing y combos clásicos',
    'Combos modernos e instrumentos de sección rítmica',
    'Improvisación',
    'Jazz y entretenimiento',
    'Canto jazz 1',
    'Canto jazz 2',
  ],
  en: [
    'Introduction to jazz culture',
    'The language of jazz 1: sonic heterogeneity',
    'The language of jazz 2: roots',
    'The language of jazz 3: improvisation',
    'A decisive precursor: ragtime',
    'The language of jazz 4: rhythm',
    'Jamming and blowing',
    'Composition and arrangements in jazz',
    'From marching bands to early jazz groups',
    'Swing and classic combos',
    'Modern combos and rhythm-section instruments',
    'Improvisation',
    'Jazz and entertainment',
    'Jazz singing 1',
    'Jazz singing 2',
  ],
  fr: [
    'Introduction à la culture du jazz',
    'Le langage du jazz 1 : hétérogénéité sonore',
    'Le langage du jazz 2 : antécédents',
    'Le langage du jazz 3 : improvisation',
    'Un antécédent décisif : le ragtime',
    'Le langage du jazz 4 : rythme',
    'Jamming et blowing',
    'Composition et arrangements en jazz',
    'Des marching bands aux premiers groupes de jazz',
    'Swing et combos classiques',
    'Combos modernes et instruments de section rythmique',
    'Improvisation',
    'Jazz et divertissement',
    'Chant jazz 1',
    'Chant jazz 2',
  ],
  pt: [
    'Introdução à cultura do jazz',
    'A linguagem do jazz 1: heterogeneidade sonora',
    'A linguagem do jazz 2: antecedentes',
    'A linguagem do jazz 3: improvisação',
    'Um antecedente decisivo: ragtime',
    'A linguagem do jazz 4: ritmo',
    'Jamming e blowing',
    'Composição e arranjos no jazz',
    'Das marching bands aos primeiros grupos de jazz',
    'Swing e combos clássicos',
    'Combos modernos e instrumentos da seção rítmica',
    'Improvisação',
    'Jazz e entretenimento',
    'Canto jazz 1',
    'Canto jazz 2',
  ],
};

const LESSON_DESCRIPTIONS: Record<'es' | 'en' | 'fr' | 'pt', string[]> = {
  es: [
    'Introducción general a la cultura del jazz, su origen histórico y sus bases estéticas.',
    'La heterogeneidad sonora y la personalización del sonido como rasgo esencial del jazz.',
    'Antecedentes afroamericanos: gospel y blues como raíces fundamentales del lenguaje jazzístico.',
    'La improvisación y sus formas principales dentro del repertorio del jazz.',
    'Ragtime como antecedente clave y su relación con el surgimiento del jazz temprano.',
    'Evolución del ritmo y de la sección rítmica desde el jazz temprano hasta el bop.',
    'La cultura de las jam sessions y su impacto en la consolidación del jazz moderno.',
    'Composición y arreglos pensados para timbres y personalidades musicales concretas.',
    'De las marching bands a las primeras formaciones que definieron el sonido del jazz.',
    'El swing y los combos clásicos en la expansión internacional del género.',
    'Combos modernos y nuevas funciones instrumentales en el hard bop y el jazz modal.',
    'Procedimientos improvisatorios: paráfrasis, fórmula, motivo, modalidad y libertad.',
    'Relación entre jazz y entretenimiento en su proceso de consolidación cultural.',
    'El canto jazzístico en su primera etapa y sus principales referentes históricos.',
    'Grandes voces del swing y su influencia en la evolución de la voz como instrumento.',
  ],
  en: [
    'A broad introduction to jazz culture, its historical roots, and core aesthetic principles.',
    'How sonic diversity and personal tone shape the identity of jazz language.',
    'African American roots: gospel and blues as key foundations of jazz expression.',
    'Improvisation as a central pillar of jazz, including its main approaches and forms.',
    'Ragtime as a key precursor and its link to the rise of early jazz.',
    'The evolution of rhythm and the rhythm section from early jazz to bebop.',
    'Jam-session culture and its role in consolidating modern jazz practice.',
    'Composition and arranging focused on specific timbres and performer identities.',
    'From marching bands to the first ensembles that defined the early jazz sound.',
    'Swing and classic combos in the international expansion of the genre.',
    'Modern combos and new instrumental roles in hard bop and modal jazz.',
    'Improvisational tools: paraphrase, patterns, motifs, modality, and freedom.',
    'Jazz and entertainment in the genre’s broader cultural consolidation.',
    'Early stages of jazz singing and its leading historical references.',
    'Major swing voices and their impact on the voice as an instrument.',
  ],
  fr: [
    'Introduction générale à la culture du jazz, à ses origines historiques et à ses bases esthétiques.',
    'L’hétérogénéité sonore et la personnalisation du son comme marque essentielle du jazz.',
    'Racines afro-américaines : gospel et blues comme fondements du langage jazzistique.',
    'L’improvisation comme axe central du jazz et ses formes principales.',
    'Le ragtime comme antécédent clé et son lien avec la naissance du jazz ancien.',
    'Évolution du rythme et de la section rythmique du jazz ancien au bebop.',
    'La culture des jam sessions et son impact sur le jazz moderne.',
    'Composition et arrangements pensés pour des timbres et personnalités musicales précises.',
    'Des marching bands aux premières formations qui ont défini le son du jazz.',
    'Le swing et les combos classiques dans l’expansion internationale du genre.',
    'Combos modernes et nouveaux rôles instrumentaux dans le hard bop et le jazz modal.',
    'Procédés d’improvisation : paraphrase, formules, motifs, modalité et liberté.',
    'Le lien entre jazz et divertissement dans sa consolidation culturelle.',
    'Le chant jazz à ses débuts et ses principales figures historiques.',
    'Grandes voix du swing et influence sur l’évolution de la voix comme instrument.',
  ],
  pt: [
    'Introdução geral à cultura do jazz, às suas origens históricas e bases estéticas.',
    'A heterogeneidade sonora e a personalização do timbre como marca essencial do jazz.',
    'Raízes afro-americanas: gospel e blues como fundamentos da linguagem jazzística.',
    'A improvisação como eixo central do jazz e suas principais formas.',
    'O ragtime como antecedente-chave e sua relação com o nascimento do jazz inicial.',
    'Evolução do ritmo e da seção rítmica do jazz inicial ao bebop.',
    'A cultura das jam sessions e seu impacto na consolidação do jazz moderno.',
    'Composição e arranjos pensados para timbres e personalidades musicais específicas.',
    'Das marching bands às primeiras formações que definiram o som do jazz.',
    'Swing e combos clássicos na expansão internacional do gênero.',
    'Combos modernos e novas funções instrumentais no hard bop e no jazz modal.',
    'Procedimentos de improvisação: paráfrase, fórmulas, motivo, modalidade e liberdade.',
    'Relação entre jazz e entretenimento no processo de consolidação cultural.',
    'O canto jazz em sua primeira fase e seus principais referenciais históricos.',
    'Grandes vozes do swing e sua influência na evolução da voz como instrumento.',
  ],
};

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

function FloatPopup({ lesson, onClose, isPinned, position, hasPurchased, onPurchaseClick, copy }: FloatPopupProps) {
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
                  !lesson.isFree && !hasPurchased ? 'blur-md' : ''
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
                <p className="text-xs uppercase tracking-widest opacity-70">{copy.classPreview}</p>
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
        transform: 'translate(-50%, -100%)',
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
              <span className="text-xs font-semibold">{copy.premiumClickHint}</span>
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

export function CourseViewClient({ userName, hasPurchased: initialHasPurchased, courseId, lessonRoutesByTitle, lessonRoutesInOrder, lessonIdsInOrder, lessonTitlesInOrder }: CourseViewProps) {
  const { t, language } = useDashboardPreferences();
  const copy = {
    es: {
      classPrefix: 'Clase',
      processing: 'Procesando...',
      buyFullCourse: 'Comprar curso completo — €29.99',
      watched: 'visto',
      purchaseRequired: 'Compra requerida',
      available: 'Disponible',
      premium: 'Premium',
      close: 'Cerrar',
      backToDashboard: 'Volver al dashboard',
      premiumContent: 'Contenido premium',
      unlockLessonHint: 'Compra el curso para desbloquear esta lección',
      classPreview: 'Vista previa de clase',
      premiumClickHint: 'Premium — Haz clic para saber más',
      academyTitle: 'Academia Cultura del Jazz',
    },
    en: {
      classPrefix: 'Class',
      processing: 'Processing...',
      buyFullCourse: 'Buy full course — €29.99',
      watched: 'watched',
      purchaseRequired: 'Purchase required',
      available: 'Available',
      premium: 'Premium',
      close: 'Close',
      backToDashboard: 'Back to dashboard',
      premiumContent: 'Premium content',
      unlockLessonHint: 'Purchase the course to unlock this lesson',
      classPreview: 'Class preview',
      premiumClickHint: 'Premium — Click to learn more',
      academyTitle: 'Jazz Culture Academy',
    },
    fr: {
      classPrefix: 'Cours',
      processing: 'Traitement...',
      buyFullCourse: 'Acheter le cours complet — €29.99',
      watched: 'vu',
      purchaseRequired: 'Achat requis',
      available: 'Disponible',
      premium: 'Premium',
      close: 'Fermer',
      backToDashboard: 'Retour au tableau de bord',
      premiumContent: 'Contenu premium',
      unlockLessonHint: 'Achetez le cours pour débloquer cette leçon',
      classPreview: 'Aperçu du cours',
      premiumClickHint: 'Premium — Cliquez pour en savoir plus',
      academyTitle: 'Académie Culture du Jazz',
    },
    pt: {
      classPrefix: 'Aula',
      processing: 'Processando...',
      buyFullCourse: 'Comprar curso completo — €29.99',
      watched: 'assistido',
      purchaseRequired: 'Compra necessária',
      available: 'Disponível',
      premium: 'Premium',
      close: 'Fechar',
      backToDashboard: 'Voltar ao dashboard',
      premiumContent: 'Conteúdo premium',
      unlockLessonHint: 'Compre o curso para desbloquear esta aula',
      classPreview: 'Prévia da aula',
      premiumClickHint: 'Premium — Clique para saber mais',
      academyTitle: 'Academia Cultura do Jazz',
    },
  }[language];
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hasPurchased] = useState(initialHasPurchased);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [pinnedIndex, setPinnedIndex] = useState<number | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showUnlockAnimation, setShowUnlockAnimation] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [progressByLessonId, setProgressByLessonId] = useState<Record<string, number>>({});
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch('/api/dashboard/courses-progress')
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
  }, []);

  useEffect(() => {
    const purchaseStatus = searchParams.get('purchase');
    const source = searchParams.get('source');

    if (purchaseStatus === 'success' && source === 'dashboard' && hasPurchased) {
      setShowUnlockAnimation(true);
      router.replace('/dashboard');
    }
  }, [searchParams, hasPurchased, router]);

  const handleMouseEnter = useCallback((index: number, e: React.MouseEvent) => {
    if (hasPurchased) return;
    if (pinnedIndex !== null) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPopupPosition({ x: rect.left + rect.width / 2, y: rect.top });
    // Small delay to prevent flicker on fast mouse movement
    hoverTimerRef.current = setTimeout(() => {
      setHoveredIndex(index);
    }, 200);
  }, [hasPurchased, pinnedIndex]);

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
    try {
      const response = await axios.post('/api/checkout', {
        courseId,
        source: 'dashboard',
        language,
      });

      if (response.data?.url) {
        window.location.assign(response.data.url);
        return;
      }
      setIsPurchasing(false);
    } catch {
      setIsPurchasing(false);
    }
  }, [courseId, language]);

  const handleCardClick = useCallback((index: number) => {
    const lesson = lessonsData[index];
    const lessonRoute = lessonRoutesInOrder[index] || lessonRoutesByTitle[lesson.subtitle.toLowerCase().trim()];

    if (hasPurchased) {
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
  }, [courseId, hasPurchased, lessonRoutesByTitle, lessonRoutesInOrder, router]);

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
    subtitle: getLocalizedJazzSubtitle(index + 1, language) || lessonTitlesInOrder[index] || lesson.subtitle,
    description: getLocalizedJazzDescription(index + 1, language) || lesson.description,
    isFree: hasPurchased,
  }));

  const firstName = userName.split(' ')[0];

  return (
    <>
      <div className="space-y-3 sm:space-y-4">

        {/* Course title */}
        <div className="text-center space-y-2 px-1 sm:px-0">
          <p className="text-[11px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.28em] text-primary/80">
            {copy.academyTitle}
          </p>
          {!hasPurchased && (
            <button
              onClick={handlePurchaseClick}
              disabled={isPurchasing}
              className="mx-auto bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold py-2 px-5 rounded-xl transition-all duration-300 shadow-lg shadow-yellow-500/25 hover:shadow-yellow-500/40 inline-flex items-center justify-center gap-2"
            >
              {isPurchasing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {copy.processing}
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4" />
                  {copy.buyFullCourse}
                </>
              )}
            </button>
          )}
        </div>

        {/* Lessons Grid */}
        <div className="mt-[2.2dvh] sm:mt-[2.6dvh] rounded-2xl border border-primary/30 hover:border-primary/60 transition-colors bg-card/40 p-3.5 sm:p-4 min-h-[56dvh] lg:min-h-[60dvh]">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2 sm:gap-2.5">
          {lessons.map((lesson, index) => {
            const isLocked = !lesson.isFree && !hasPurchased;
            const mappedLessonId = lessonIdsInOrder[index];
            const progressPercent = mappedLessonId
              ? progressByLessonId[mappedLessonId] ?? 0
              : 0;
            
            return (
              <div
                key={lesson.id}
                className="relative"
                onMouseEnter={(e) => handleMouseEnter(index, e)}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  className={`group relative w-full rounded-2xl overflow-hidden border text-left will-change-transform transition-[transform,box-shadow,border-color,filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    hoveredIndex === index
                      ? 'shadow-2xl scale-[1.03] -translate-y-1 z-10'
                      : 'hover:shadow-xl hover:scale-[1.01] hover:-translate-y-0.5'
                  } ${hoveredIndex === index && !isLocked
                      ? 'ring-2 ring-primary/70 border-primary/70'
                      : hoveredIndex === index && isLocked
                      ? 'ring-2 ring-primary/40 border-primary/40'
                      : 'border-primary/30 hover:border-primary/60'}
                  }`}
                  onClick={() => handleCardClick(index)}
                >
                  {/* Image thumbnail */}
                  <div className="relative h-[6.5rem] sm:h-[7.5rem] w-full overflow-hidden">
                    <Image
                      src={lesson.image}
                      alt={lesson.subtitle}
                      fill
                      className={`object-cover transition-all duration-500 group-hover:scale-110 ${
                        isLocked ? 'blur-[6px] brightness-50' : ''
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
                  <div className={`p-2.5 sm:p-3.5 ${isLocked ? 'bg-gray-100 dark:bg-gray-800/80' : 'bg-gradient-to-br from-primary/95 to-primary/75'}`}>
                    <h3 className={`text-xs sm:text-sm font-bold leading-tight ${
                      isLocked
                        ? 'text-gray-500 dark:text-gray-400'
                        : 'text-primary-foreground'
                    }`}>
                      {lesson.title}
                    </h3>
                    <p className={`text-[10px] sm:text-xs mt-0.5 ${hoveredIndex === index ? 'line-clamp-none' : 'line-clamp-2'} leading-snug ${
                      isLocked
                        ? 'text-gray-400 dark:text-gray-500'
                        : 'text-primary-foreground/85'
                    }`}>
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
                        <span className={isLocked ? 'text-gray-400 dark:text-gray-500' : 'text-primary-foreground/85'}>
                          {progressPercent}% {copy.watched}
                        </span>
                        <span className={`inline-flex items-center gap-1 ${isLocked ? 'text-gray-400 dark:text-gray-500' : 'text-primary-foreground/85'}`}>
                          <Lock className="h-2.5 w-2.5" />
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
                {!hasPurchased && hoveredIndex === index && pinnedIndex === null && (
                  <FloatPopup
                    lesson={lesson}
                    onClose={handleClosePopup}
                    isPinned={false}
                    position={popupPosition}
                    hasPurchased={hasPurchased}
                    onPurchaseClick={handlePurchaseClick}
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
          onPurchaseClick={handlePurchaseClick}
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
    </>
  );
}
