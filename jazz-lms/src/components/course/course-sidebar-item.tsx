'use client';
import { cn } from '@/lib/utils';
import { Lesson } from '@prisma/client';
import { PlayCircle } from 'lucide-react';
import Link from 'next/link';

interface CourseSidebarItemProps {
  label: string;
  lessons: Lesson[];
  courseId: string;
  lessonId: string;
}

export const CourseSidebarItem = ({
  label,
  lessons,
  courseId,
  lessonId,
}: CourseSidebarItemProps) => {
  return (
    <div className="flex flex-col">
      <div className="px-4 sm:px-8 py-3 sm:py-4">
        <p className="font-semibold text-sm sm:text-base text-foreground break-words">{label}</p>
      </div>
      <div className="flex flex-col">
        {lessons.map((lesson) => (
          <Link
            href={`/courses/${courseId}/lessons/${lesson.id}`}
            key={lesson.id}
          >
            <div
              className={cn(
                'flex items-center gap-x-2 text-muted-foreground text-sm font-medium pl-4 sm:pl-8 transition-all hover:text-foreground hover:bg-accent/60',
                lesson.id === lessonId &&
                  'text-primary bg-primary/10 hover:bg-primary/10 hover:text-primary'
              )}
            >
              <div className="flex items-center gap-x-2 py-3 sm:py-4 min-w-0">
                <PlayCircle
                  size={16}
                  className={cn(
                    'text-muted-foreground',
                    lesson.id === lessonId && 'text-primary'
                  )}
                />
                <span className="truncate">{lesson.title}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
