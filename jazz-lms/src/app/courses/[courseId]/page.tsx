import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { CourseEnrollButton } from '@/components/course/course-enroll-button';
import { BookOpen, Clock, CheckCircle } from 'lucide-react';

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
      chapters: {
        where: { isPublished: true },
        orderBy: { position: 'asc' },
        include: {
          lessons: {
            where: { isPublished: true },
            orderBy: { position: 'asc' },
          },
        },
      },
      purchases: {
        where: { userId: user.id },
      },
    },
  });

  if (!course) {
    return redirect('/dashboard');
  }

  const hasPurchased = course.purchases.length > 0;
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
                  {chapter.lessons.map((lesson) => (
                    <li
                      key={lesson.id}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground"
                    >
                      <CheckCircle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                      <span>{lesson.title}</span>
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
                {course.price ? `€${course.price.toFixed(2)}` : 'Free'}
              </p>
            </div>
            <CourseEnrollButton
              courseId={course.id}
              price={course.price || 0}
            />
            <div className="text-xs text-center text-muted-foreground">
              Secure payment powered by Stripe
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
