'use client';

import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, Clock, Filter } from 'lucide-react';
import { useState } from 'react';

interface Course {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  progress: number;
  totalLessons: number;
  chaptersCount: number;
}

interface MyCoursesClientProps {
  courses: Course[];
}

export function MyCoursesClient({ courses }: MyCoursesClientProps) {
  const [filter, setFilter] = useState<'all' | 'in-progress' | 'completed'>(
    'all'
  );

  const filtered = courses.filter((c) => {
    if (filter === 'in-progress') return c.progress > 0 && c.progress < 100;
    if (filter === 'completed') return c.progress === 100;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">
            My Courses
          </h1>
          <p className="text-muted-foreground mt-1">
            {courses.length} course{courses.length !== 1 ? 's' : ''} enrolled
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {(['all', 'in-progress', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              {f === 'all'
                ? 'All'
                : f === 'in-progress'
                ? 'In Progress'
                : 'Completed'}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground">
            {courses.length === 0
              ? 'No courses enrolled yet'
              : 'No courses match this filter'}
          </h2>
          <p className="text-muted-foreground mt-2">
            {courses.length === 0
              ? 'Browse our catalog to find courses'
              : 'Try changing the filter'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((course) => (
            <Link
              key={course.id}
              href={`/courses/${course.id}/lessons/${course.id}`}
              className="group block"
            >
              <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                <div className="relative h-40 bg-gradient-to-br from-muted to-muted/50">
                  {course.imageUrl ? (
                    <Image
                      src={course.imageUrl}
                      alt={course.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <BookOpen className="h-12 w-12 text-muted-foreground/40" />
                    </div>
                  )}
                  {course.progress === 100 && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-md">
                      Completed
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {course.title}
                  </h3>
                  {course.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {course.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5" />
                      {course.chaptersCount} chapters
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {course.totalLessons} lessons
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium text-primary">
                        {course.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div
                        className="bg-primary h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
