'use client';

import Image from 'next/image';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Lock, X, Volume2, VolumeX, PlayCircle, Loader2, ShoppingCart, RotateCcw } from 'lucide-react';
import { UnlockAnimation } from './unlock-animation';
import { PurchaseSuccessModal } from './purchase-success-modal';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDashboardPreferences } from '@/components/providers/dashboard-preferences-provider';

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
    title: 'Class 1',
    subtitle: 'Introduction to Jazz Culture',
    description:
      'This first class presents a general introduction to Jazz Culture. It covers its historical and social origins, as well as the elements that distinguish it from other musical traditions. Rather than a detailed analysis, the purpose is to offer a panoramic view that allows recognizing the aesthetic and cultural foundations upon which Jazz will develop, preparing the ground to understand its later evolution.',
    image: '/images/clase1.jpg',
    isFree: true,
  },
  {
    id: 2,
    title: 'Class 2',
    subtitle: 'The Language of Jazz 1: Sonic Heterogeneity',
    description:
      'After the introduction to Jazz Culture in Class 1, we address sonic heterogeneity here. In the personalization of sound, an aesthetic principle of beauty can emerge through diverse sonorities, which breaks with the criteria of purity common in classical and popular music.',
    image: '/images/clase2.jpg',
    isFree: false,
  },
  {
    id: 3,
    title: 'Class 3',
    subtitle: 'The Language of Jazz 2: The Antecedents',
    description:
      'We consider the antecedents of African influence that emerged after the American Civil War. We focus on Spiritual Song or Gospel and the Blues, with direct examples of their impact on Jazz.',
    image: '/images/clase3.jpg',
    isFree: false,
  },
  {
    id: 4,
    title: 'Class 4',
    subtitle: 'The Language of Jazz 3: Improvisation',
    description:
      'Since improvisation is a central issue in language, we review the thematic forms whose characteristics relate to and partly predetermine improvisation, whether in the paraphrase, formulaic, motivic or modal variants.',
    image: '/images/clase4.jpg',
    isFree: false,
  },
  {
    id: 5,
    title: 'Class 5',
    subtitle: 'A Decisive Antecedent: Ragtime',
    description:
      'After addressing its probable origin, its development on piano and in the orchestra, as well as its treatment by classical music composers, the study focuses on the transgression of pianist Jelly Roll Morton.',
    image: '/images/clase5.jpg',
    isFree: false,
  },
  {
    id: 6,
    title: 'Class 6',
    subtitle: 'The Language of Jazz 4: Rhythm',
    description:
      'The rhythm in early jazz and the roles of the rhythm section instruments are analyzed. With the abandonment of ragtime influence, the four beats sound more uniformly.',
    image: '/images/clase6.jpg',
    isFree: false,
  },
  {
    id: 7,
    title: 'Class 7',
    subtitle: 'Jamming & Blowing',
    description:
      'After a brief reference to the concept\'s origin in Chicago, the class focuses on its consolidation in Kansas City and New York. The importance of this process for defining Jazz Culture is analyzed.',
    image: '/images/clase7.jpg',
    isFree: false,
  },
  {
    id: 8,
    title: 'Class 8',
    subtitle: 'Composition and Arrangement in Jazz',
    description:
      'The great jazz composers have never created in abstract, but always thinking of someone concrete. The case of Duke Ellington is examined, who wrote harmony based on the timbre of his soloists.',
    image: '/images/clase8.jpg',
    isFree: false,
  },
  {
    id: 9,
    title: 'Class 9',
    subtitle: 'From Marching Bands to the First Jazz Groups',
    description:
      'The initial formations are presented, from the marching bands of New Orleans to the first groups of Louis Armstrong. We analyze how these groups shaped the sound of early jazz.',
    image: '/images/clase9.jpg',
    isFree: false,
  },
  {
    id: 10,
    title: 'Class 10',
    subtitle: 'Swing and Classic Combos',
    description:
      'The class focuses on the great orchestras of the swing era, with figures such as Benny Goodman and the Hot Club of France Quintet. The importance of instrumental sections is studied.',
    image: '/images/clase10.jpg',
    isFree: false,
  },
  {
    id: 11,
    title: 'Class 11',
    subtitle: 'Modern Combos and Rhythm Section Instruments',
    description:
      'We address the evolution towards bop combos, hard bop and modal jazz, analyzing their flexibility and role in musical innovation.',
    image: '/images/clase11.jpg',
    isFree: false,
  },
  {
    id: 12,
    title: 'Class 12',
    subtitle: 'Improvisation',
    description:
      'The class begins with the study of improvisation, addressing its form and the reasons for thematic choice as a conditioning factor. Next, the main procedures are analyzed.',
    image: '/images/clase12.jpg',
    isFree: false,
  },
  {
    id: 13,
    title: 'Class 13',
    subtitle: 'Jazz and Entertainment',
    description:
      'Although today jazz is considered a unique musical culture with defined values and distinct from popular entertainment, in the 1920s its context was much more diverse.',
    image: '/images/clase13.jpg',
    isFree: false,
  },
  {
    id: 14,
    title: 'Class 14',
    subtitle: 'Singing Jazz 1',
    description:
      'Jazz, with its origins in vocal music, has in the vaudeville blues sung by women one of its main predecessors. Louis Armstrong is considered a key figure who influenced future vocalists.',
    image: '/images/clase14.jpg',
    isFree: false,
  },
  {
    id: 15,
    title: 'Class 15',
    subtitle: 'Singing Jazz 2',
    description:
      'The lesson explores the divas of swing, with a focus on Billie Holiday and Ella Fitzgerald, analyzing their style and interaction with other instruments.',
    image: '/images/clase15.jpg',
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
}

function FloatPopup({ lesson, onClose, isPinned, position, hasPurchased, onPurchaseClick }: FloatPopupProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

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
            aria-label="Close"
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
                      Premium Content
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Purchase the course to unlock this lesson
                    </p>
                  </div>
                </div>
              )}

              {!lesson.isFree && !hasPurchased && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                    onPurchaseClick();
                  }}
                  className="mt-4 w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg shadow-yellow-500/25 hover:shadow-yellow-500/40 flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Unlock Full Course — €29.99
                </button>
              )}
            </div>

            {/* Right - Preview Video (blurred for locked) */}
            <div className="relative bg-black min-h-[300px] lg:min-h-0">
              <video
                ref={videoRef}
                className={`absolute inset-0 w-full h-full object-cover ${
                  !lesson.isFree && !hasPurchased ? 'blur-md' : ''
                }`}
                autoPlay
                muted
                loop
                playsInline
              >
                <source src="/images/videojazz.mp4" type="video/mp4" />
              </video>
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
                <p className="text-xs uppercase tracking-widest opacity-70">Class Preview</p>
                <p className="text-sm font-semibold">{lesson.subtitle}</p>
              </div>
              {(lesson.isFree || hasPurchased) && (
                <button
                  onClick={toggleMute}
                  className="absolute bottom-4 right-4 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-colors"
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
              )}
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
              <span className="text-xs font-semibold">Premium — Click to learn more</span>
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
  isLocalTestMode: boolean;
}

export function CourseViewClient({ userName, hasPurchased: initialHasPurchased, courseId, lessonRoutesByTitle, lessonRoutesInOrder, lessonIdsInOrder, lessonTitlesInOrder, isLocalTestMode }: CourseViewProps) {
  const { t } = useDashboardPreferences();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hasPurchased] = useState(initialHasPurchased);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [pinnedIndex, setPinnedIndex] = useState<number | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showUnlockAnimation, setShowUnlockAnimation] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isResettingTestState, setIsResettingTestState] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [lockedClickPrimedIndex, setLockedClickPrimedIndex] = useState<number | null>(null);
  const [lockedFeedbackIndex, setLockedFeedbackIndex] = useState<number | null>(null);
  const [hasSeenPreviewOnce, setHasSeenPreviewOnce] = useState(false);
  const [progressByLessonId, setProgressByLessonId] = useState<Record<string, number>>({});
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (window.location.hostname === 'localhost') {
      localStorage.removeItem('jazz-course-purchased');
      sessionStorage.removeItem('jazz-course-purchased');
    }
  }, []);

  useEffect(() => {
    const previewKey = `jazz-class-preview-seen:${courseId ?? 'default'}`;
    const seen = window.localStorage.getItem(previewKey) === '1';
    setHasSeenPreviewOnce(seen);
  }, [courseId]);

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

  useEffect(() => {
    if (lockedClickPrimedIndex === null) {
      return;
    }

    const timer = window.setTimeout(() => {
      setLockedClickPrimedIndex(null);
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [lockedClickPrimedIndex]);

  useEffect(() => {
    if (lockedFeedbackIndex === null) {
      return;
    }

    const timer = window.setTimeout(() => {
      setLockedFeedbackIndex(null);
    }, 700);

    return () => window.clearTimeout(timer);
  }, [lockedFeedbackIndex]);

  const handleMouseEnter = useCallback((index: number, e: React.MouseEvent) => {
    if (hasPurchased || hasSeenPreviewOnce) return;
    if (pinnedIndex !== null) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPopupPosition({ x: rect.left + rect.width / 2, y: rect.top });
    // Small delay to prevent flicker on fast mouse movement
    hoverTimerRef.current = setTimeout(() => {
      setHoveredIndex(index);
    }, 200);
  }, [hasPurchased, hasSeenPreviewOnce, pinnedIndex]);

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
      });

      if (response.data?.url) {
        window.location.assign(response.data.url);
        return;
      }
      setIsPurchasing(false);
    } catch {
      setIsPurchasing(false);
    }
  }, [courseId]);

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

    if (!hasSeenPreviewOnce) {
      const previewKey = `jazz-class-preview-seen:${courseId ?? 'default'}`;
      window.localStorage.setItem(previewKey, '1');
      setHasSeenPreviewOnce(true);
      setLockedClickPrimedIndex(null);
      setPinnedIndex(index);
      setHoveredIndex(null);
      return;
    }

    if (lesson.isFree && lessonRoute) {
      router.push(lessonRoute);
      return;
    }
    
    if (!lesson.isFree && !hasPurchased) {
      if (lockedClickPrimedIndex === index) {
        setLockedFeedbackIndex(index);
        setLockedClickPrimedIndex(null);
        setPinnedIndex(null);
        setHoveredIndex(null);
        return;
      }

      handlePurchaseClick();
      return;
    }

    setLockedClickPrimedIndex(null);
    if (lessonRoute) {
      router.push(lessonRoute);
      return;
    }

    if (courseId) {
      router.push(`/courses/${courseId}`);
    }
  }, [courseId, hasPurchased, hasSeenPreviewOnce, handlePurchaseClick, lessonRoutesByTitle, lessonRoutesInOrder, lockedClickPrimedIndex, router]);

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

  const handleResetTestState = useCallback(async () => {
    if (!isLocalTestMode || isResettingTestState) return;

    setIsResettingTestState(true);
    try {
      await axios.post('/api/dev/reset-test-purchases');
      window.location.reload();
    } catch {
      setIsResettingTestState(false);
    }
  }, [isLocalTestMode, isResettingTestState]);

  // Get current lessons with backend-controlled lock status
  const lessons = lessonsData.map((lesson, index) => ({
    ...lesson,
    title: `Class ${index + 1}`,
    subtitle: lessonTitlesInOrder[index] || lesson.subtitle,
    isFree: hasPurchased ? true : lesson.isFree,
  }));

  const firstName = userName.split(' ')[0];

  return (
    <>
      <div className="space-y-3 sm:space-y-4">

        {/* Course title */}
        <div className="text-center space-y-2 px-1 sm:px-0">
          <p className="text-[11px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.28em] text-primary/80">
            Jazz Culture Academy
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
                  Processing...
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4" />
                  Purchase Full Course — €29.99
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
                  } ${lockedFeedbackIndex === index
                    ? 'border-red-500/80 ring-2 ring-red-500/70 shadow-[0_0_0_1px_rgba(239,68,68,0.65)] animate-locked-shake'
                    : hoveredIndex === index && !isLocked
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
                          {progressPercent}% watched
                        </span>
                        <span className={`inline-flex items-center gap-1 ${isLocked ? 'text-gray-400 dark:text-gray-500' : 'text-primary-foreground/85'}`}>
                          <Lock className="h-2.5 w-2.5" />
                          {isLocked ? 'Purchase required' : 'Available'}
                        </span>
                      </div>
                    </div>

                    {/* Small padlock indicator */}
                    {isLocked && (
                      <div className="flex items-center gap-1 mt-1">
                        <Lock className="h-3 w-3 text-yellow-500" />
                        <span className="text-[10px] text-yellow-600 dark:text-yellow-400 font-semibold">
                          Premium
                        </span>
                      </div>
                    )}
                  </div>
                </button>

                {/* Float popup on hover */}
                {!hasPurchased && !hasSeenPreviewOnce && hoveredIndex === index && pinnedIndex === null && lockedFeedbackIndex !== index && (
                  <FloatPopup
                    lesson={lesson}
                    onClose={handleClosePopup}
                    isPinned={false}
                    position={popupPosition}
                    hasPurchased={hasPurchased}
                    onPurchaseClick={handlePurchaseClick}
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
        />
      )}

      {isLocalTestMode && (
        <button
          type="button"
          onClick={handleResetTestState}
          disabled={isResettingTestState}
          title="Reset local test purchases"
          aria-label="Reset local test purchases"
          className="fixed bottom-2 right-2 z-40 h-7 w-7 rounded-full border border-border bg-card/50 text-muted-foreground opacity-25 hover:opacity-70 hover:bg-card transition-all disabled:opacity-20"
        >
          {isResettingTestState ? (
            <Loader2 className="h-3.5 w-3.5 mx-auto animate-spin" />
          ) : (
            <RotateCcw className="h-3.5 w-3.5 mx-auto" />
          )}
        </button>
      )}

      <UnlockAnimation
        isVisible={showUnlockAnimation}
        onComplete={handleUnlockAnimationComplete}
      />

      <PurchaseSuccessModal
        isVisible={showSuccessModal}
        onClose={handleSuccessModalClose}
      />
    </>
  );
}
