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
        <p className="font-semibold text-sm sm:text-base break-words">{label}</p>
      </div>
      <div className="flex flex-col">
        {lessons.map((lesson) => (
          <Link
            href={`/courses/${courseId}/lessons/${lesson.id}`}
            key={lesson.id}
          >
            <div
              className={cn(
                'flex items-center gap-x-2 text-slate-500 text-sm font-[500] pl-4 sm:pl-8 transition-all hover:text-slate-600 hover:bg-slate-300/20',
                lesson.id === lessonId &&
                  'text-slate-700 bg-slate-200/60 hover:bg-slate-200/60 hover:text-slate-700'
              )}
            >
              <div className="flex items-center gap-x-2 py-3 sm:py-4 min-w-0">
                <PlayCircle
                  size={16}
                  className={cn(
                    'text-slate-500',
                    lesson.id === lessonId && 'text-slate-700'
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
