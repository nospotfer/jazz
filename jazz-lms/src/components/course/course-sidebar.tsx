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
    <div className="h-full border-r flex flex-col overflow-y-auto shadow-sm w-80">
      <div className="p-8 flex flex-col border-b">
        <h1 className="font-semibold text-lg">{course.title}</h1>
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
