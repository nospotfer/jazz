import { db } from '@/lib/db';

export const getProgress = async (
  userId: string,
  courseId: string
): Promise<number> => {
  try {
    const publishedChapters = await db.chapter.findMany({
      where: {
        courseId: courseId,
        isPublished: true,
      },
      select: {
        lessons: {
          where: {
            isPublished: true,
          },
          select: {
            id: true,
          },
        },
      },
    });

    const publishedLessonIds = publishedChapters.flatMap((chapter) =>
      chapter.lessons.map((lesson) => lesson.id)
    );

    const validCompletedLessons = await db.userProgress.count({
      where: {
        userId: userId,
        lessonId: {
          in: publishedLessonIds,
        },
        isCompleted: true,
      },
    });

    const progressPercentage =
      (validCompletedLessons / publishedLessonIds.length) * 100;

    return progressPercentage;
  } catch (error) {
    console.log('[GET_PROGRESS]', error);
    return 0;
  }
};
