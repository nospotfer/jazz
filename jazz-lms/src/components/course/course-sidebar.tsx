import { Chapter, Course, Lesson } from '@prisma/client';
import { CourseSidebarItem } from './course-sidebar-item';

interface CourseSidebarProps {
  course: Course & {
    chapters: (Chapter & {
      lessons: Lesson[];
    })[];
  };
  lessonId: string;
}

export const CourseSidebar = ({ course, lessonId }: CourseSidebarProps) => {
  return (
    <div className="w-full bg-card border border-border rounded-xl flex flex-col overflow-hidden min-h-[240px] lg:min-h-0 lg:h-full">
      <div className="p-4 sm:p-5 border-b border-border">
        <h1 className="font-semibold text-base sm:text-lg text-foreground break-words">{course.title}</h1>
      </div>
      <div className="flex flex-col w-full overflow-y-auto">
        {course.chapters.map((chapter) => (
          <CourseSidebarItem
            key={chapter.id}
            label={chapter.title}
            lessons={chapter.lessons}
            courseId={course.id}
            lessonId={lessonId}
          />
        ))}
      </div>
    </div>
  );
};
