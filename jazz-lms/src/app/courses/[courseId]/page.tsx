import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { headers } from 'next/headers';
import { CourseEnrollButton } from '@/components/course/course-enroll-button';
import { BookOpen, Clock, CheckCircle } from 'lucide-react';
import { LessonEnrollButton } from '@/components/course/lesson-enroll-button';
import { isLocalhostHost } from '@/lib/test-mode';
import {
  DEFAULT_FULL_COURSE_PRICE_EUR,
  LESSON_UNIT_PRICE_EUR,
  totalSingleLessonsPrice,
} from '@/lib/pricing';

export default async function CourseDetailPage({
  params,
}: {
  params: { courseId: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/auth');
  }

  const course = await db.course.findUnique({
    where: {
      id: params.courseId,
      isPublished: true,
    },
    include: {
      purchases: {
        where: { userId: user.id },
      },
      chapters: {
        where: { isPublished: true },
        orderBy: { position: 'asc' },
        include: {
          lessons: {
            where: { isPublished: true },
            orderBy: { position: 'asc' },
            include: {
              lessonPurchases: {
                where: { userId: user.id },
              },
            },
          },
        },
      },
    },
  });

  if (!course) {
    return redirect('/dashboard');
  }

  const hasPurchased = course.purchases.length > 0;
  const hasTestAccess = isLocalhostHost(headers().get('host'));
  const hasAccess = hasPurchased || hasTestAccess;
  const totalLessons = course.chapters.reduce(
    (acc, chapter) => acc + chapter.lessons.length,
    0
  );

  // If already purchased, redirect to first lesson
  if (hasPurchased) {
    const firstLesson = course.chapters[0]?.lessons[0];
    if (firstLesson) {
      return redirect(
        `/courses/${course.id}/lessons/${firstLesson.id}`
      );
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-foreground">
            {course.title}
          </h1>
          {course.description && (
            <p className="text-lg text-muted-foreground mt-4 max-w-2xl">
              {course.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-4 mt-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              {course.chapters.length} chapter{course.chapters.length !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {totalLessons} lesson{totalLessons !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Course content */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-serif font-semibold text-foreground">
            Course Content
          </h2>
          <div className="space-y-4">
            {course.chapters.map((chapter, chapterIndex) => (
              <div
                key={chapter.id}
                className="bg-card border border-border rounded-xl overflow-hidden"
              >
                <div className="px-4 py-3 bg-muted/50 border-b border-border">
                  <h3 className="font-semibold text-foreground">
                    Chapter {chapterIndex + 1}: {chapter.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {chapter.lessons.length} lesson{chapter.lessons.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <ul className="divide-y divide-border">
                  {chapter.lessons.map((lesson, lessonIndex) => (
                    <li
                      key={lesson.id}
                      className="flex items-center justify-between gap-3 px-4 py-3 text-sm text-muted-foreground"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <CheckCircle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                        <span className="truncate">{lesson.title}</span>
                      </div>

                      {!hasAccess && !(chapterIndex === 0 && lessonIndex === 0) && (
                        lesson.lessonPurchases.length > 0 ? (
                          <span className="text-xs px-2 py-1 rounded-md bg-green-500/10 text-green-600 border border-green-600/20">
                            Purchased
                          </span>
                        ) : (
                          <LessonEnrollButton
                            courseId={course.id}
                            lessonId={lesson.id}
                            price={LESSON_UNIT_PRICE_EUR}
                          />
                        )
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar - Purchase card */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 bg-card border border-border rounded-xl p-6 space-y-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">
                €{(course.price || DEFAULT_FULL_COURSE_PRICE_EUR).toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                15 single videos cost €{totalSingleLessonsPrice.toFixed(2)} in total
              </p>
            </div>
            {!hasAccess ? (
              <>
                <CourseEnrollButton
                  courseId={course.id}
                  price={course.price || DEFAULT_FULL_COURSE_PRICE_EUR}
                />
                <div className="text-xs text-center text-muted-foreground">
                  Secure payment powered by Stripe
                </div>
              </>
            ) : (
              <div className="text-xs text-center rounded-lg border border-green-600/20 bg-green-500/10 text-green-600 px-3 py-2">
                Test mode (localhost): course unlocked for configuration.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
