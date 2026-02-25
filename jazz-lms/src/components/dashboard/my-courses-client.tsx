'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight, Clock, Lock } from 'lucide-react';
import { useState } from 'react';
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
  singleVideoPrice: number;
}

export function MyCoursesClient({ videos, singleVideoPrice }: MyCoursesClientProps) {
  const { t } = useDashboardPreferences();
  const [page, setPage] = useState(0);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(CANONICAL_JAZZ_CLASSES.length / itemsPerPage);

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
  const completionRate = classes.length
    ? Math.round((watchedVideos.length / classes.length) * 100)
    : 0;

  const start = page * itemsPerPage;
  const visibleClasses = classes.slice(start, start + itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">
            {t('myCourses', 'My Courses')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('myCoursesSubtitle', '15 real classes, organized in pages of 5')}
          </p>
        </div>

        <div className="text-sm text-muted-foreground text-left sm:text-right">
          <p>Single video price: €{singleVideoPrice.toFixed(2)}</p>
          <p>Bundle access unlocks all 15 videos.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 min-[380px]:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="rounded-xl border border-primary/40 hover:border-primary/70 transition-colors bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('watched', 'Watched')}</p>
          <p className="mt-1 text-xl sm:text-2xl font-bold text-foreground">{watchedVideos.length}</p>
        </div>
        <div className="rounded-xl border border-primary/40 hover:border-primary/70 transition-colors bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('inProgress', 'In Progress')}</p>
          <p className="mt-1 text-xl sm:text-2xl font-bold text-foreground">{inProgressVideos.length}</p>
        </div>
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

      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl border border-primary/40 hover:border-primary/70 transition-colors bg-card px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">{t('courseClasses', 'Course Classes')}</p>
            <p className="text-xs text-muted-foreground">{t('showingFivePerPage', 'Showing 5 classes per page in official order')}</p>
          </div>
          <div className="text-xs text-muted-foreground">
            {t('page', 'Page')} {page + 1} {t('of', 'of')} {totalPages}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 sm:gap-4">
          {visibleClasses.map((video) => (
            <VideoProgressCard key={video.classNumber} video={video} />
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(0, prev - 1))}
            disabled={page === 0}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-primary/40 hover:border-primary/70 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            {t('previous', 'Previous')}
          </button>
          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
            disabled={page >= totalPages - 1}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-primary/40 hover:border-primary/70 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm text-foreground transition-colors"
          >
            {t('next', 'Next')}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
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

  const card = (
    <div className="h-full bg-card border border-primary/40 hover:border-primary/70 rounded-xl p-3.5 sm:p-4 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-primary/90">{video.classLabel}</p>
          <h3 className="font-semibold text-foreground line-clamp-2 leading-tight mt-1">
            {video.subtitle}
          </h3>
        </div>
        <span className={`text-[10px] px-1.5 sm:px-2 py-1 rounded-full border ${
          video.isPurchased
            ? video.accessType === 'single-video'
              ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
              : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
            : 'bg-muted text-muted-foreground border-border'
        }`}>
          {video.isPurchased
            ? video.accessType === 'single-video'
              ? 'Single'
              : 'Full'
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
    return card;
  }

  return (
    <Link
      href={`/courses/${video.courseId}/lessons/${video.lessonId}`}
      className="group block"
    >
      <div className="group-hover:scale-[1.01] transition-transform duration-200">
        {card}
      </div>
    </Link>
  );
}
