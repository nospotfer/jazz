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
    <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r flex flex-col overflow-y-auto shadow-sm max-h-[40dvh] lg:max-h-none lg:h-full">
      <div className="p-4 sm:p-6 lg:p-8 flex flex-col border-b">
        <h1 className="font-semibold text-base sm:text-lg break-words">{course.title}</h1>
      </div>
      <div className="flex flex-col w-full">
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
