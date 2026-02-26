'use client';

import Link from 'next/link';
import { Clock, Lock } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CANONICAL_JAZZ_CLASSES } from '@/lib/course-lessons';
import { useDashboardPreferences } from '@/components/providers/dashboard-preferences-provider';

export interface PurchasedVideoItem {
  lessonId: string;
  lessonTitle: string;
  courseId: string;
  courseTitle: string;
  chapterTitle: string;
  progressPercent: number;
  minutesRemaining: number;
  isCompleted: boolean;
  accessType: 'full-course' | 'single-video';
}

interface MyCoursesClientProps {
  videos: PurchasedVideoItem[];
}

export function MyCoursesClient({ videos }: MyCoursesClientProps) {
  const { t } = useDashboardPreferences();
  const searchParams = useSearchParams();

  const byTitle = new Map(
    videos.map((video) => [video.lessonTitle.toLowerCase(), video])
  );

  const classes = CANONICAL_JAZZ_CLASSES.map((item) => {
    const match = byTitle.get(item.subtitle.toLowerCase());
    const progress = match?.progressPercent ?? 0;
    const minutesRemaining = match?.minutesRemaining ?? 20;

    return {
      classNumber: item.classNumber,
      classLabel: item.classLabel,
      subtitle: item.subtitle,
      image: item.image,
      progressPercent: progress,
      minutesRemaining,
      lessonId: match?.lessonId,
      courseId: match?.courseId,
      chapterTitle: match?.chapterTitle,
      accessType: match?.accessType,
      isPurchased: Boolean(match),
      isCompleted: progress >= 100,
    };
  });

  const watchedVideos = classes.filter((video) => video.isCompleted);
  const inProgressVideos = classes.filter((video) => video.progressPercent > 0 && video.progressPercent < 100);
  const notStartedVideos = classes.filter((video) => video.progressPercent === 0);
  const activeView = searchParams.get('view');
  const filteredClasses =
    activeView === 'watched'
      ? watchedVideos
      : activeView === 'in-progress'
      ? inProgressVideos
      : classes;
  const completionRate = classes.length
    ? Math.round((watchedVideos.length / classes.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">
          {t('myCourses', 'My Courses')}
        </h1>
        <p className="text-muted-foreground mt-1">
          15 classes — Introduction to Jazz Music
        </p>
      </div>

      <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-3 sm:gap-4">
        <Link
          href="/dashboard/courses?view=watched"
          className={`rounded-xl border transition-colors bg-card p-4 block ${
            activeView === 'watched'
              ? 'border-primary/80 ring-1 ring-primary/40'
              : 'border-primary/40 hover:border-primary/70'
          }`}
        >
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('watched', 'Watched')}</p>
          <p className="mt-1 text-xl sm:text-2xl font-bold text-foreground">{watchedVideos.length}</p>
        </Link>
        <Link
          href="/dashboard/courses?view=in-progress"
          className={`rounded-xl border transition-colors bg-card p-4 block ${
            activeView === 'in-progress'
              ? 'border-primary/80 ring-1 ring-primary/40'
              : 'border-primary/40 hover:border-primary/70'
          }`}
        >
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('inProgress', 'In Progress')}</p>
          <p className="mt-1 text-xl sm:text-2xl font-bold text-foreground">{inProgressVideos.length}</p>
        </Link>
      </div>

      <div className="border-t border-white/25" />

      <div className="grid grid-cols-1 min-[380px]:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="rounded-xl border border-primary/40 hover:border-primary/70 transition-colors bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('notStarted', 'Not Started')}</p>
          <p className="mt-1 text-xl sm:text-2xl font-bold text-foreground">{notStartedVideos.length}</p>
        </div>
        <div className="rounded-xl border border-primary/40 hover:border-primary/70 transition-colors bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('totalClasses', 'Total Classes')}</p>
          <p className="mt-1 text-xl sm:text-2xl font-bold text-foreground">{classes.length}</p>
        </div>
        <div className="rounded-xl border border-primary/40 hover:border-primary/70 transition-colors bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('completionRate', 'Completion Rate')}</p>
          <p className="mt-1 text-xl sm:text-2xl font-bold text-foreground">{completionRate}%</p>
        </div>
      </div>

      <div className="border-t border-white/25" />

      {activeView && (
        <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-card px-3 py-2">
          <p className="text-xs sm:text-sm text-foreground">
            {activeView === 'watched'
              ? 'Showing watched videos'
              : 'Showing videos in progress'}
          </p>
          <Link
            href="/dashboard/courses"
            className="text-xs sm:text-sm text-primary hover:text-primary/80 transition-colors"
          >
            Show all classes
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        {filteredClasses.map((video) => (
          <VideoProgressCard key={video.classNumber} video={video} />
        ))}
      </div>
    </div>
  );
}

function VideoProgressCard({
  video,
}: {
  video: {
    classNumber: number;
    classLabel: string;
    subtitle: string;
    progressPercent: number;
    minutesRemaining: number;
    lessonId?: string;
    courseId?: string;
    chapterTitle?: string;
    accessType?: 'full-course' | 'single-video';
    isPurchased: boolean;
  };
}) {
  const { t } = useDashboardPreferences();
  const isClickable = Boolean(video.lessonId && video.courseId);
  const [showLockedFeedback, setShowLockedFeedback] = useState(false);

  useEffect(() => {
    if (!showLockedFeedback) {
      return;
    }

    const timer = window.setTimeout(() => {
      setShowLockedFeedback(false);
    }, 650);

    return () => window.clearTimeout(timer);
  }, [showLockedFeedback]);

  const card = (
    <div className={`h-full bg-card border rounded-xl p-3.5 sm:p-4 hover:shadow-2xl hover:shadow-primary/15 will-change-transform transition-[transform,box-shadow,border-color,filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.02] hover:-translate-y-1 ${
      showLockedFeedback
        ? 'border-red-500/80 shadow-[0_0_0_1px_rgba(239,68,68,0.65)] animate-locked-shake'
        : 'border-primary/40 hover:border-primary/70'
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-primary/90">{video.classLabel}</p>
          <h3 className="font-semibold text-foreground line-clamp-2 leading-tight mt-1">
            {video.subtitle}
          </h3>
        </div>
        <span className={`text-[10px] px-1.5 sm:px-2 py-1 rounded-full border ${
          video.isPurchased
            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
            : 'bg-muted text-muted-foreground border-border'
        }`}>
          {video.isPurchased
            ? t('unlocked', 'Unlocked')
            : t('locked', 'Locked')}
        </span>
      </div>

      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
        {video.chapterTitle ?? 'Introduction to Jazz Music'}
      </p>

      <div className="mt-4">
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-500"
            style={{ width: `${video.progressPercent}%` }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{video.progressPercent}% watched</span>
          <span className="text-muted-foreground inline-flex items-center gap-1">
            {video.isPurchased ? <Clock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
            {video.isPurchased ? `${video.minutesRemaining} ${t('minLeft', 'min left')}` : t('purchaseRequired', 'Purchase required')}
          </span>
        </div>
      </div>
    </div>
  );

  if (!isClickable) {
    return (
      <button
        type="button"
        onClick={() => setShowLockedFeedback(true)}
        className="block w-full text-left rounded-xl"
        aria-label={t('purchaseRequired', 'Purchase required')}
      >
        {card}
      </button>
    );
  }

  return (
    <Link
      href={`/courses/${video.courseId}/lessons/${video.lessonId}`}
      className="group block"
    >
      <div className="group-hover:scale-[1.02] group-hover:-translate-y-1 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform">
        {card}
      </div>
    </Link>
  );
}
