'use client';
import MuxPlayer from '@mux/mux-player-react';
import { Button } from '../ui/button';
import { CheckCircle, Download, Music2, Youtube, NotebookPen } from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';
import { Chapter, Course, Lesson, Attachment } from '@prisma/client';
import { useEffect, useMemo, useState } from 'react';
import { useConfettiStore } from '@/hooks/use-confetti-store';
import { toast } from 'sonner';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { DEFAULT_LESSON_DURATION_MINUTES } from '@/lib/pricing';
import { DashboardPreferencesProvider } from '@/components/providers/dashboard-preferences-provider';
import { getCanonicalJazzClass } from '@/lib/course-lessons';

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
}

export const CoursePlayer = ({
  course,
  lesson,
  lessonId,
  initialIsCompleted,
  initialProgressPercent,
}: CoursePlayerProps) => {
  const [isReady, setIsReady] = useState(false);
  const [lastSavedPercent, setLastSavedPercent] = useState(initialProgressPercent);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(initialIsCompleted);
  const [notes, setNotes] = useState('');
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

  const notesStorageKey = useMemo(
    () => `lesson-notes:${course.id}:${lesson.id}`,
    [course.id, lesson.id]
  );

  useEffect(() => {
    const saved = window.localStorage.getItem(notesStorageKey) || '';
    setNotes(saved);
  }, [notesStorageKey]);

  const saveNotes = (value: string) => {
    setNotes(value);
    window.localStorage.setItem(notesStorageKey, value);
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
    if (isCompleted) return;

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
    if (isCompleting || isCompleted) return;

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
    if (isCompleting) return;

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
    if (isCompleted) return;

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
    if (isCompleted) {
      await resetLessonCompletion();
      return;
    }

    await completeLesson();
  };

  return (
    <DashboardPreferencesProvider>
      <div className="h-[100dvh] overflow-hidden bg-background">
        <Sidebar />

        <div className="lg:pl-64 h-full overflow-y-auto p-3 sm:p-4 lg:p-6">
          <div className="mx-auto grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_400px] gap-4 lg:gap-5 min-h-full">
            <div className="min-w-0 flex flex-col gap-4">
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="relative aspect-[16/8.7]">
                  <MuxPlayer
                    playbackId={lesson.videoUrl || ''}
                    accentColor="#d4af37"
                    onCanPlay={() => setIsReady(true)}
                    onEnded={(event) => onEnded(event as unknown as Event)}
                    onTimeUpdate={onTimeUpdate}
                    autoPlay
                  />
                </div>
                <div className="p-4 sm:p-5 border-t border-border flex flex-col gap-3">
                  <h2 className="text-xl sm:text-2xl font-bold font-serif text-foreground break-words">
                    {classLabel}
                  </h2>
                  <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-3">
                    {lesson.attachments.length > 0 && (
                      <a
                        href={lesson.attachments[0].url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="w-full sm:w-auto"
                      >
                        <Button className="w-full sm:w-auto" variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </Button>
                      </a>
                    )}
                    <Button
                      type="button"
                      onClick={onMarkAsComplete}
                      disabled={isCompleting}
                      className="w-full sm:w-auto"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {isCompleting
                        ? 'Saving...'
                        : isCompleted
                        ? 'Completed (Click to reset)'
                        : 'Mark as Complete'}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
                <p className="text-base sm:text-lg font-semibold text-foreground mb-3 flex items-center gap-2.5">
                  <Music2 className="h-5 w-5 text-primary" />
                  Listen on music platforms
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {musicLinks.map((platform) => (
                    <a
                      key={platform.label}
                      href={platform.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md border border-border bg-background hover:bg-accent text-base text-foreground transition-colors"
                    >
                      {platform.label === 'YouTube' ? (
                        <Youtube className="h-5 w-5 text-primary" />
                      ) : (
                        <Music2 className="h-5 w-5 text-primary" />
                      )}
                      <span>{platform.label}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <aside className="bg-card border border-primary/30 rounded-xl p-5 sm:p-6 flex flex-col min-h-[460px]">
              <p className="text-base sm:text-lg font-semibold text-foreground mb-3 flex items-center gap-2.5">
                <NotebookPen className="h-5 w-5 text-primary" />
                Lesson notes
              </p>
              <textarea
                value={notes}
                onChange={(event) => saveNotes(event.target.value)}
                placeholder="Write your notes for this lesson..."
                className="flex-1 min-h-[340px] w-full resize-none rounded-lg bg-background border-2 border-border p-4 text-base leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50"
              />
              <p className="mt-3 text-sm text-muted-foreground">
                Saved automatically on this device.
              </p>
            </aside>
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
