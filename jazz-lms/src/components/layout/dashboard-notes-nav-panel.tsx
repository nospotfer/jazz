'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, Library } from 'lucide-react';

import { useDashboardPreferences } from '@/components/providers/dashboard-preferences-provider';
import { getLocalizedJazzSubtitle } from '@/lib/course-lessons';

interface CourseProgressVideo {
  lessonId: string;
  title: string;
  progressPercent: number;
  courseId: string;
  position?: number;
}

interface CourseProgressItem {
  id: string;
  title: string;
  videos: CourseProgressVideo[];
}

export function DashboardNotesNavPanel() {
  const { t, language } = useDashboardPreferences();
  const [videos, setVideos] = useState<CourseProgressVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNote, setSelectedNote] = useState<{ courseId: string; lessonId: string } | null>(null);
  const [noteContent, setNoteContent] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadCourses = () => {
      setLoading(true);
      fetch('/api/dashboard/courses-progress')
        .then((response) => response.json())
        .then((data) => {
          if (!isMounted) return;

          const nextCourses: CourseProgressItem[] = data.courses ?? [];
          const flattened = nextCourses.flatMap((course) =>
            course.videos.map((video) => ({ ...video, courseId: course.id }))
          );

          setVideos(flattened);
          setLoading(false);
        })
        .catch(() => {
          if (!isMounted) return;
          setLoading(false);
        });
    };

    const idleCallback = window.requestIdleCallback?.(() => {
      loadCourses();
    }, { timeout: 1000 });

    if (idleCallback !== undefined) {
      return () => {
        isMounted = false;
        window.cancelIdleCallback?.(idleCallback);
      };
    }

    const timeoutId = window.setTimeout(loadCourses, 300);
    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
    };
  }, []);

  const primaryCourseId = videos[0]?.courseId;
  const notesVideos = videos
    .filter((video) => video.courseId === primaryCourseId)
    .map((video, index) => ({
      lessonId: video.lessonId,
      courseId: video.courseId,
      classLabel: `${t('classLabel', 'Class')} ${index + 1}`,
      subtitle: getLocalizedJazzSubtitle(index + 1, language) || video.title,
      classNumber: index + 1,
    }));

  useEffect(() => {
    if (!notesVideos.length) {
      setSelectedNote(null);
      setNoteContent('');
      return;
    }

    setSelectedNote((current) => {
      if (current && notesVideos.some((video) => video.courseId === current.courseId && video.lessonId === current.lessonId)) {
        return current;
      }

      const first = notesVideos[0];
      return { courseId: first.courseId, lessonId: first.lessonId };
    });
  }, [notesVideos]);

  useEffect(() => {
    if (!selectedNote) return;

    const storageKey = `lesson-notes:${selectedNote.courseId}:${selectedNote.lessonId}`;
    const saved = window.localStorage.getItem(storageKey) || '';
    setNoteContent(saved);
  }, [selectedNote]);

  const onChangeSidebarNotes = (value: string) => {
    setNoteContent(value);
    if (!selectedNote) return;

    const storageKey = `lesson-notes:${selectedNote.courseId}:${selectedNote.lessonId}`;
    window.localStorage.setItem(storageKey, value);
  };

  return (
    <div className="mt-1 flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground bg-accent/30">
        <Library className="h-5 w-5 flex-shrink-0" />
        <span className="flex-1 text-left">{t('myNotes', 'My Notes')}</span>
        <ChevronDown className="h-4 w-4 flex-shrink-0 rotate-180" />
      </div>

      <div className="mt-1 ml-2 rounded-lg border border-primary/40 hover:border-primary/70 transition-colors overflow-hidden bg-card/60 flex flex-1 min-h-0 flex-col">
        {loading && (
          <p className="px-2.5 py-1.5 text-[11px] text-muted-foreground">{t('loading', 'Loading…')}</p>
        )}

        {!loading && (
          <>
            <div className="px-2.5 py-1.5 bg-primary/10 border-b border-primary/40">
              <span className="text-xs font-semibold text-primary tracking-wide uppercase">
                {t('introductionToJazzMusic', 'Introduction to Jazz Music')}
              </span>
            </div>
            {notesVideos.length === 0 && (
              <p className="px-2.5 py-1.5 text-xs text-muted-foreground border-b border-border/60">
                {t('noPurchasedCoursesYet', 'No purchased courses yet.')}
              </p>
            )}
            <div className="courses-scroll flex-1 min-h-0 overflow-y-auto pr-1">
              {notesVideos.map((video, index) => {
                const isClickable = Boolean(video.courseId && video.lessonId);
                const isSelected =
                  selectedNote?.courseId === video.courseId && selectedNote?.lessonId === video.lessonId;
                const content = (
                  <div
                    className={`px-2.5 py-2.5 transition-colors ${
                      index < notesVideos.length - 1 ? 'border-b border-border/60' : ''
                    } ${isClickable ? 'hover:bg-accent/40' : 'opacity-90'} ${isSelected ? 'bg-primary/10' : ''}`}
                  >
                    <p className="text-sm font-semibold text-foreground leading-tight">
                      {video.classLabel}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-tight mt-0.5">
                      {video.subtitle}
                    </p>
                  </div>
                );

                if (!isClickable) {
                  return <div key={video.lessonId}>{content}</div>;
                }

                return (
                  <button
                    type="button"
                    key={video.lessonId}
                    onClick={() => setSelectedNote({ courseId: video.courseId, lessonId: video.lessonId })}
                    className="w-full text-left"
                  >
                    {content}
                  </button>
                );
              })}
            </div>
            <div className="border-t border-primary/30 bg-background/80 p-2.5 space-y-2">
              <p className="text-[11px] uppercase tracking-wide text-primary font-semibold">
                {t('lessonNotes', 'Lesson notes')}
              </p>
              <textarea
                value={noteContent}
                onChange={(event) => onChangeSidebarNotes(event.target.value)}
                placeholder={t('writeNotesForSelectedClass', 'Write notes for selected class...')}
                className="w-full h-44 min-h-[11rem] resize-none rounded-md border border-border bg-background px-2.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}