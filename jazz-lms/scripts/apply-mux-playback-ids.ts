import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const LESSON_PLAYBACK_IDS = [
  'rZItzE4EBu4mLxAcVsNrTuH00kg4pFcpgrYYY7SkgVVM',
  'R5uBKi01LJHvyG02S8VcrgrTj7D65hPj00vWuonU602WIPM',
  'Xv01wg01NiO7XJ01mNcNOUigP2bbzKg9yPMfioUb01yh501g',
  'n5d01VwkLk1SFrpg5hIX75KuLy4a01huEdb4jxsRMbmOc',
  'jTqTQEHQYVur1n9yV8Qi7umKQQAwQSwZsEFjqO01bwcs',
  'wv8E5ZCIoskvQRecgAmbsNa1bdlC028esSMWBLaLDOIc',
  'hUPj7UP002FEkInqV7KZymac3Xtw7jgOgEas02Hqf802qo',
  'XoExWX224E956vkoYT4aUzas02Nh5LwDN2Vb9RvZk9oo',
  'VzmZBF4beO00XBk8kCKNOMycDKa7qCACyAkrvSlmAZZU',
  '6CZ00siRmC6CS5XCKKb1456WsAgb79r1FM8vq582jt8Q',
  'W3TU7l6QKpVH8669z4dC2Ra01RXdrcpQZo9KvjhFnWTg',
  'zq5RceaZeZwfAEOzV99P0200ZauD73mZVbJClXXCosVS00',
  'zdh5Ck5ECKeEcEXHYMd5O9aewYpYfxu01s3902FmYG02Ko',
  'CfwA3JmMRlPRSJ6KhKRC8F4dk3RudX8ygJCwf5R4Idc',
  'fQNep01k00VSgz01Blo24d7EBm8jB8YpwUa43HiYNxkOXk',
];

async function main() {
  const courseIdArg = process.argv[2];

  const allCourses = await prisma.course.findMany({
    include: {
      chapters: {
        include: {
          lessons: true,
        },
      },
    },
  });

  if (allCourses.length === 0) {
    throw new Error('No courses found. Seed your database first.');
  }

  const targetCourse = courseIdArg
    ? allCourses.find((course) => course.id === courseIdArg)
    : [...allCourses]
        .sort((a, b) => {
          const lessonCountA = a.chapters.reduce((acc, chapter) => acc + chapter.lessons.length, 0);
          const lessonCountB = b.chapters.reduce((acc, chapter) => acc + chapter.lessons.length, 0);
          return lessonCountB - lessonCountA;
        })
        .at(0);

  if (!targetCourse) {
    throw new Error('Target course was not found. Pass a courseId as first argument.');
  }

  const orderedLessons = targetCourse.chapters
    .sort((a, b) => a.position - b.position)
    .flatMap((chapter) => chapter.lessons.sort((a, b) => a.position - b.position));

  if (orderedLessons.length === 0) {
    throw new Error('Target course has no lessons.');
  }

  const updates = orderedLessons.slice(0, LESSON_PLAYBACK_IDS.length).map((lesson, index) =>
    prisma.lesson.update({
      where: { id: lesson.id },
      data: { videoUrl: LESSON_PLAYBACK_IDS[index] },
    })
  );

  await prisma.$transaction(updates);

  const assigned = Math.min(orderedLessons.length, LESSON_PLAYBACK_IDS.length);
  console.log(`Assigned Mux playback IDs to ${assigned} lesson(s) in course: ${targetCourse.title}`);

  if (orderedLessons.length < LESSON_PLAYBACK_IDS.length) {
    console.log(
      `Warning: course has only ${orderedLessons.length} lesson(s). Add ${
        LESSON_PLAYBACK_IDS.length - orderedLessons.length
      } more lesson(s) to use all mapped videos.`
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
