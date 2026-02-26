'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CANONICAL_JAZZ_CLASSES } from '@/lib/course-lessons';
import { useDashboardPreferences } from '@/components/providers/dashboard-preferences-provider';

const COMPLETION_ALERT_KEY = 'jazz_completion_alert_pending';
const COMPLETION_ALERT_EVENT = 'jazz-completion-alert-changed';
const COMPLETION_ALERT_ACK_KEY = 'jazz_completion_alert_acknowledged';

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
  isLocalTestMode?: boolean;
}

export function MyCoursesClient({ videos, isLocalTestMode = false }: MyCoursesClientProps) {
  const { t } = useDashboardPreferences();
  const searchParams = useSearchParams();
  const [testCompletionRate, setTestCompletionRate] = useState<number | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionAlertPending, setCompletionAlertPending] = useState(false);

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
  const completionRate = classes.length
    ? Math.round((watchedVideos.length / classes.length) * 100)
    : 0;
  const effectiveCompletionRate = testCompletionRate ?? completionRate;

  const completionAttentionActive = effectiveCompletionRate >= 100 && completionAlertPending;

  useEffect(() => {
    if (effectiveCompletionRate < 100) {
      window.localStorage.removeItem(COMPLETION_ALERT_KEY);
      window.localStorage.removeItem(COMPLETION_ALERT_ACK_KEY);
      if (completionAlertPending) {
        setCompletionAlertPending(false);
      }
      window.dispatchEvent(new Event(COMPLETION_ALERT_EVENT));
      return;
    }

    const isPending = window.localStorage.getItem(COMPLETION_ALERT_KEY) === '1';
    const isAcknowledged = window.localStorage.getItem(COMPLETION_ALERT_ACK_KEY) === '1';

    if (isPending) {
      if (!completionAlertPending) {
        setCompletionAlertPending(true);
      }
      return;
    }

    if (!isAcknowledged) {
      window.localStorage.setItem(COMPLETION_ALERT_KEY, '1');
      setCompletionAlertPending(true);
      window.dispatchEvent(new Event(COMPLETION_ALERT_EVENT));
    } else if (completionAlertPending) {
      setCompletionAlertPending(false);
    }
  }, [effectiveCompletionRate, completionAlertPending]);

  const viewConfig: Record<string, { label: string; count: number; videos: typeof classes }> = {
    watched: {
      label: t('watched', 'Watched'),
      count: watchedVideos.length,
      videos: watchedVideos,
    },
    'in-progress': {
      label: t('inProgress', 'In Progress'),
      count: inProgressVideos.length,
      videos: inProgressVideos,
    },
    'not-started': {
      label: t('notStarted', 'Not Started'),
      count: notStartedVideos.length,
      videos: notStartedVideos,
    },
    total: {
      label: t('totalClasses', 'Total Classes'),
      count: classes.length,
      videos: classes,
    },
    completion: {
      label: t('completionRate', 'Completion Rate'),
      count: effectiveCompletionRate,
      videos: [],
    },
  };

  const selectedView = activeView && viewConfig[activeView] ? viewConfig[activeView] : null;

  return (
    <div className="space-y-6">
      <div className="relative inline-block">
        <h1 className="text-2xl font-serif font-bold text-foreground">
          {t('myCourses', 'My Courses')}
        </h1>
        <p className="text-muted-foreground mt-1">
          15 classes — Introduction to Jazz Music
        </p>
      </div>

      <div className="grid grid-cols-1 min-[380px]:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
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
        <Link
          href="/dashboard/courses?view=not-started"
          className={`rounded-xl border transition-colors bg-card p-4 block ${
            activeView === 'not-started'
              ? 'border-primary/80 ring-1 ring-primary/40'
              : 'border-primary/40 hover:border-primary/70'
          }`}
        >
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('notStarted', 'Not Started')}</p>
          <p className="mt-1 text-xl sm:text-2xl font-bold text-foreground">{notStartedVideos.length}</p>
        </Link>
        <Link
          href="/dashboard/courses?view=total"
          className={`rounded-xl border transition-colors bg-card p-4 block ${
            activeView === 'total'
              ? 'border-primary/80 ring-1 ring-primary/40'
              : 'border-primary/40 hover:border-primary/70'
          }`}
        >
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('totalClasses', 'Total Classes')}</p>
          <p className="mt-1 text-xl sm:text-2xl font-bold text-foreground">{classes.length}</p>
        </Link>
        <Link
          href="/dashboard/courses?view=completion"
          className={`relative rounded-xl border transition-colors bg-card p-4 block ${
            activeView === 'completion'
              ? 'border-primary/80 ring-1 ring-primary/40'
              : 'border-primary/40 hover:border-primary/70'
          }`}
        >
          {completionAttentionActive && (
            <span className="absolute -top-1.5 -right-1.5 h-2.5 w-2.5 rounded-full bg-yellow-400 shadow-[0_0_0_3px_rgba(250,204,21,0.25)] animate-pulse" />
          )}
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('completionRate', 'Completion Rate')}</p>
          <p className="mt-1 text-xl sm:text-2xl font-bold text-foreground">{effectiveCompletionRate}%</p>
        </Link>
      </div>

      <div className="border-t border-white/25" />

      {selectedView && activeView !== 'completion' && (
        <div className="space-y-3 rounded-xl border border-primary/30 bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-foreground">
              {selectedView.label} — {selectedView.count}
            </p>
            <Link
              href="/dashboard/courses"
              className="text-xs sm:text-sm text-primary hover:text-primary/80 transition-colors"
            >
              Close
            </Link>
          </div>

          {selectedView.videos.length === 0 ? (
            <p className="text-xs text-muted-foreground">No videos in this selection yet.</p>
          ) : (
            <div className="space-y-2.5">
              {selectedView.videos.map((video) => (
                <div
                  key={`selection-${video.classNumber}`}
                  className="rounded-lg border border-primary/20 bg-card/60 px-3 py-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-primary/90">{video.classLabel}</p>
                      <p className="text-sm font-medium text-foreground leading-tight">{video.subtitle}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{video.progressPercent}%</span>
                  </div>
                  <div className="mt-2 w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-500"
                      style={{ width: `${video.progressPercent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedView && activeView === 'completion' && (
        <div className="space-y-3 rounded-xl border border-primary/30 bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-foreground">
              {selectedView.label} — {effectiveCompletionRate}%
            </p>
            <Link
              href="/dashboard/courses"
              className="text-xs sm:text-sm text-primary hover:text-primary/80 transition-colors"
            >
              Close
            </Link>
          </div>

          <button
            type="button"
            onClick={() => {
              if (effectiveCompletionRate >= 100) {
                setShowCompletionModal(true);
              }
            }}
            className={`w-full rounded-xl border px-4 py-5 text-left transition-all duration-500 ${
              effectiveCompletionRate >= 100
                ? completionAttentionActive
                  ? 'border-emerald-400/90 bg-emerald-500/10 hover:bg-emerald-500/15 animate-pulse ring-2 ring-emerald-400/70'
                  : 'border-emerald-500/70 bg-emerald-500/10 hover:bg-emerald-500/15'
                : 'border-primary/30 bg-card/60'
            }`}
            aria-label="Course completion progress"
          >
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Course Progress</p>
            <div className="w-full bg-muted rounded-full h-5 overflow-hidden">
              <div
                className="bg-emerald-500 h-5 rounded-full transition-all duration-700"
                style={{ width: `${effectiveCompletionRate}%` }}
              />
            </div>
            <p className="mt-2 text-sm font-medium text-foreground">{effectiveCompletionRate}% completed</p>
          </button>
        </div>
      )}

      {showCompletionModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-scale-in"
          onClick={() => {
            setShowCompletionModal(false);
            setCompletionAlertPending(false);
            window.localStorage.removeItem(COMPLETION_ALERT_KEY);
            window.localStorage.setItem(COMPLETION_ALERT_ACK_KEY, '1');
            window.dispatchEvent(new Event(COMPLETION_ALERT_EVENT));
          }}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-emerald-500/50 bg-card shadow-2xl p-6 sm:p-7 animate-fade-scale-in"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="text-center">
              <div className="text-5xl leading-none">🎷</div>
              <p className="mt-4 text-xl font-serif font-bold text-foreground">Congratulations!</p>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                You completed the full Jazz course. You can now confidently discuss jazz with friends, family, and everyone around you.
              </p>
              <div className="mt-4 flex flex-col items-center gap-1 text-emerald-500">
                <CheckCircle2 className="h-7 w-7" />
                <span className="text-xs font-medium uppercase tracking-wide">Course Verified</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowCompletionModal(false);
                  setCompletionAlertPending(false);
                  window.localStorage.removeItem(COMPLETION_ALERT_KEY);
                  window.localStorage.setItem(COMPLETION_ALERT_ACK_KEY, '1');
                  window.dispatchEvent(new Event(COMPLETION_ALERT_EVENT));
                }}
                className="mt-6 inline-flex items-center justify-center rounded-lg bg-emerald-500 text-black font-semibold px-4 py-2 hover:bg-emerald-400 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {isLocalTestMode && (
        <button
          type="button"
          onClick={() => {
            setTestCompletionRate(100);
            setCompletionAlertPending(true);
            window.localStorage.removeItem(COMPLETION_ALERT_ACK_KEY);
            window.localStorage.setItem(COMPLETION_ALERT_KEY, '1');
            window.dispatchEvent(new Event(COMPLETION_ALERT_EVENT));
          }}
          title="Complete course progress for local testing"
          aria-label="Complete course progress for local testing"
          className="fixed bottom-2 right-2 z-40 h-7 w-7 rounded-full border border-border bg-card/50 text-muted-foreground opacity-25 hover:opacity-70 hover:bg-card transition-all"
        >
          <RotateCcw className="h-3.5 w-3.5 mx-auto" />
        </button>
      )}
    </div>
  );
}
