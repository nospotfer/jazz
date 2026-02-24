'use client';

import Link from 'next/link';
import { BookOpen, ChevronDown, Clock } from 'lucide-react';
import { useState } from 'react';

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
  const [watchedOpen, setWatchedOpen] = useState(true);
  const [inProgressOpen, setInProgressOpen] = useState(true);

  const watchedVideos = videos.filter((video) => video.isCompleted);
  const inProgressVideos = videos.filter((video) => !video.isCompleted);
  const notStartedVideos = videos.filter((video) => video.progressPercent === 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">
            My Courses
          </h1>
          <p className="text-muted-foreground mt-1">
            {videos.length} purchased video{videos.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="text-sm text-muted-foreground text-left sm:text-right">
          <p>Single video price: €{singleVideoPrice.toFixed(2)}</p>
          <p>Bundle access unlocks all 15 videos.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Watched</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{watchedVideos.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">In Progress</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{inProgressVideos.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Not Started</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{notStartedVideos.length}</p>
        </div>
      </div>

      {videos.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground">
            No purchased videos yet
          </h2>
          <p className="text-muted-foreground mt-2">
            Buy the full course or a single video to see it here.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <section className="space-y-4">
            <button
              type="button"
              onClick={() => setWatchedOpen((prev) => !prev)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-card hover:bg-accent/40 transition-colors"
            >
              <span className="font-semibold text-foreground">
                Watched ({watchedVideos.length})
              </span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${watchedOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {watchedOpen && (
              watchedVideos.length === 0 ? (
                <p className="text-sm text-muted-foreground px-1">No watched videos yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {watchedVideos.map((video) => (
                    <VideoProgressCard key={video.lessonId} video={video} />
                  ))}
                </div>
              )
            )}
          </section>

          <section className="space-y-4">
            <button
              type="button"
              onClick={() => setInProgressOpen((prev) => !prev)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-card hover:bg-accent/40 transition-colors"
            >
              <span className="font-semibold text-foreground">
                In Progress ({inProgressVideos.length})
              </span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${inProgressOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {inProgressOpen && (
              inProgressVideos.length === 0 ? (
                <p className="text-sm text-muted-foreground px-1">No videos in progress.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {inProgressVideos.map((video) => (
                    <VideoProgressCard key={video.lessonId} video={video} />
                  ))}
                </div>
              )
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function VideoProgressCard({ video }: { video: PurchasedVideoItem }) {
  return (
    <Link
      href={`/courses/${video.courseId}/lessons/${video.lessonId}`}
      className="group block"
    >
      <div className="h-full bg-card border border-border rounded-xl p-4 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {video.lessonTitle}
          </h3>
          <span className={`text-[10px] px-2 py-1 rounded-full border ${
            video.accessType === 'single-video'
              ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
              : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
          }`}>
            {video.accessType === 'single-video' ? 'Single Video' : 'Full Course'}
          </span>
        </div>

        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
          {video.courseTitle} • {video.chapterTitle}
        </p>

        <div className="mt-4">
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${video.progressPercent}%` }}
            />
          </div>

          {!video.isCompleted && (
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{video.progressPercent}% watched</span>
              <span className="text-muted-foreground inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {video.minutesRemaining} min left
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
