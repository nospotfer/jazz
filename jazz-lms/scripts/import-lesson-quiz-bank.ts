import { PrismaClient } from '@prisma/client';
import { CANONICAL_JAZZ_CLASSES } from '../src/lib/course-lessons';
import { LESSON_QUIZ_BANKS, buildLessonQuizSeedData } from '../prisma/quiz-seed-data';

const database = new PrismaClient();

function getArgValue(flag: string) {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return undefined;
  }

  return process.argv[index + 1];
}

async function resolveCourseId() {
  const courseId = getArgValue('--course-id') ?? process.env.QUIZ_COURSE_ID;
  if (courseId) {
    return courseId;
  }

  const title = process.env.QUIZ_COURSE_TITLE ?? 'La Cultura del Jazz';
  const course = await database.course.findFirst({
    where: {
      title: {
        equals: title,
        mode: 'insensitive',
      },
    },
    select: {
      id: true,
      title: true,
    },
  });

  if (!course) {
    throw new Error(
      `No course found for title "${title}". Pass --course-id or set QUIZ_COURSE_ID.`
    );
  }

  return course.id;
}

async function main() {
  const courseId = await resolveCourseId();

  const lessons = await database.lesson.findMany({
    where: {
      chapter: {
        courseId,
      },
    },
    orderBy: [
      {
        chapter: {
          position: 'asc',
        },
      },
      {
        position: 'asc',
      },
    ],
    select: {
      id: true,
      title: true,
      position: true,
      chapter: {
        select: {
          title: true,
          position: true,
        },
      },
    },
  });

  const lessonCount = Object.keys(LESSON_QUIZ_BANKS).length;
  if (lessons.length < lessonCount) {
    throw new Error(
      `Course has ${lessons.length} lessons, but the quiz bank expects at least ${lessonCount}.`
    );
  }

  const targetLessons = lessons.slice(0, lessonCount);

  for (let index = 0; index < targetLessons.length; index += 1) {
    const classNumber = index + 1;
    const lesson = targetLessons[index];
    const quizBank = LESSON_QUIZ_BANKS[classNumber];
    const canonical = CANONICAL_JAZZ_CLASSES.find(
      (entry) => entry.classNumber === classNumber
    );

    if (!quizBank || quizBank.length === 0) {
      throw new Error(`Missing quiz bank for class ${classNumber}.`);
    }

    await database.lessonQuizQuestion.deleteMany({
      where: {
        lessonId: lesson.id,
      },
    });

    await database.lesson.update({
      where: {
        id: lesson.id,
      },
      data: {
        quizQuestions: {
          create: buildLessonQuizSeedData(quizBank),
        },
      },
    });

    console.log(
      [
        `Imported class ${classNumber}`,
        canonical ? `(${canonical.subtitle})` : '',
        `into lesson "${lesson.title}"`,
        `in chapter "${lesson.chapter.title}"`,
        `with ${quizBank.length} questions.`,
      ]
        .filter(Boolean)
        .join(' ')
    );
  }

  console.log(`Imported quiz banks into ${targetLessons.length} lessons for course ${courseId}.`);
}

main()
  .catch((error) => {
    console.error('Failed to import lesson quiz banks:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await database.$disconnect();
  });