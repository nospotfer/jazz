import { PrismaClient } from '@prisma/client';
import { CANONICAL_JAZZ_CLASSES } from '../src/lib/course-lessons';

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

  const title = process.env.QUIZ_COURSE_TITLE ?? 'Introduction to Jazz Music';
  const course = await database.course.findFirst({
    where: {
      title: {
        equals: title,
        mode: 'insensitive',
      },
    },
    select: {
      id: true,
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
      chapter: {
        select: {
          title: true,
        },
      },
    },
  });

  if (lessons.length < CANONICAL_JAZZ_CLASSES.length) {
    throw new Error(
      `Course has ${lessons.length} lessons, but ${CANONICAL_JAZZ_CLASSES.length} canonical lessons are required.`
    );
  }

  const targetLessons = lessons.slice(0, CANONICAL_JAZZ_CLASSES.length);
  const languages: Array<'es' | 'en' | 'fr' | 'pt'> = ['es', 'en', 'fr', 'pt'];

  for (let index = 0; index < targetLessons.length; index += 1) {
    const lesson = targetLessons[index];
    const canonical = CANONICAL_JAZZ_CLASSES[index];

    await database.lesson.update({
      where: {
        id: lesson.id,
      },
      data: {
        title: canonical.subtitle,
        description: canonical.descriptions.es,
      },
    });

    for (const language of languages) {
      await database.lessonTranslation.upsert({
        where: {
          lessonId_language: {
            lessonId: lesson.id,
            language,
          },
        },
        update: {
          title: canonical.subtitles[language],
          description: canonical.descriptions[language],
        },
        create: {
          lessonId: lesson.id,
          language,
          title: canonical.subtitles[language],
          description: canonical.descriptions[language],
        },
      });
    }

    console.log(
      `Synced lesson ${index + 1} in chapter "${lesson.chapter.title}": "${lesson.title}" -> "${canonical.subtitle}".`
    );
  }

  console.log(`Synced metadata for ${targetLessons.length} lessons in course ${courseId}.`);
}

main()
  .catch((error) => {
    console.error('Failed to sync jazz lesson metadata:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await database.$disconnect();
  });