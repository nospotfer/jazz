/**
 * Read-only diagnostic script: lists every published lesson with its
 * Mux playback id (extracted from `lesson.videoUrl`) plus translations.
 *
 * Usage:
 *   npx tsx scripts/list-lessons-with-mux.ts > tmp/lessons-mux-map.csv
 *
 * Reads from the database referenced by DATABASE_URL in the current env.
 * Does NOT mutate any data.
 */

import { PrismaClient } from "@prisma/client";

import { extractMuxPlaybackId } from "../src/lib/mux-playback";

const prisma = new PrismaClient();

function csvEscape(value: string | null | undefined): string {
  const str = (value ?? "").toString();
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function main() {
  const courses = await prisma.course.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      translations: true,
      chapters: {
        orderBy: { position: "asc" },
        include: {
          translations: true,
          lessons: {
            orderBy: { position: "asc" },
            include: { translations: true },
          },
        },
      },
    },
  });

  const header = [
    "course_id",
    "course_title",
    "chapter_position",
    "chapter_title",
    "lesson_position",
    "lesson_id",
    "lesson_title_default",
    "lesson_title_es",
    "lesson_title_en",
    "lesson_title_fr",
    "lesson_title_pt",
    "lesson_published",
    "video_url",
    "playback_id",
    "playback_id_valid",
  ];
  process.stdout.write(header.join(",") + "\n");

  for (const course of courses) {
    const courseTitle = course.title;
    for (const chapter of course.chapters) {
      for (const lesson of chapter.lessons) {
        const translationByLang = new Map(
          lesson.translations.map((t) => [t.language, t.title]),
        );
        const playbackId = extractMuxPlaybackId(lesson.videoUrl);
        const row = [
          course.id,
          courseTitle,
          String(chapter.position),
          chapter.title,
          String(lesson.position),
          lesson.id,
          lesson.title,
          translationByLang.get("es") ?? "",
          translationByLang.get("en") ?? "",
          translationByLang.get("fr") ?? "",
          translationByLang.get("pt") ?? "",
          lesson.isPublished ? "true" : "false",
          lesson.videoUrl ?? "",
          playbackId,
          playbackId ? "true" : "false",
        ].map(csvEscape);
        process.stdout.write(row.join(",") + "\n");
      }
    }
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
