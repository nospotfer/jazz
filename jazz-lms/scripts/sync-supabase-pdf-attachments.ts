import { AttachmentKind, LanguageCode, PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const db = new PrismaClient();

const SUPPORTED_LANGUAGES: LanguageCode[] = ['es', 'en', 'fr', 'pt'];
const EXPECTED_CLASS_COUNT = 15;
const EXPECTED_AUX_COUNT = 2;

const normalizeName = (path: string) => path.split('/').at(-1)?.replace(/\.pdf$/i, '')?.trim() ?? path;

const stripDiacritics = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const normalizeStoragePath = (prefix: string, name: string) => {
  const cleanedPrefix = prefix.trim().replace(/^\/+|\/+$/g, '');
  if (!cleanedPrefix) return name;
  return `${cleanedPrefix}/${name}`;
};

const getArgValue = (flag: string) => {
  const directArg = process.argv.find((arg) => arg.startsWith(`${flag}=`));
  if (directArg) {
    return directArg.split('=')[1] ?? '';
  }

  const flagIndex = process.argv.findIndex((arg) => arg === flag);
  if (flagIndex >= 0) {
    return process.argv[flagIndex + 1] ?? '';
  }

  return '';
};

const detectLanguage = (input: string): LanguageCode | null => {
  const normalized = stripDiacritics(input);

  if (/\baula\b/.test(normalized) || /informacao auxiliar/.test(normalized) || /(pt-br|ptbr|portugues|portuguese|brazilian)/.test(normalized)) {
    return 'pt';
  }

  if (/\bcours\b/.test(normalized) || /\bclasse\b/.test(normalized) || /information auxiliaire/.test(normalized) || /(francais|francese|french)/.test(normalized)) {
    return 'fr';
  }

  if (/\bclass\b/.test(normalized) || /auxiliary information/.test(normalized) || /(english|ingles|ingless)/.test(normalized)) {
    return 'en';
  }

  if (/\bclase\b/.test(normalized) || /apuntes auxiliares/.test(normalized) || /(espanol|español|castellano|spanish)/.test(normalized)) {
    return 'es';
  }

  return null;
};

const detectClassNumber = (input: string) => {
  const normalized = stripDiacritics(input);
  const match = normalized.match(/(?:clase|class|classe|cours|aula)\s*(\d{1,2})/i);
  if (!match) return null;

  const value = Number(match[1]);
  if (!Number.isInteger(value) || value <= 0) return null;
  return value;
};

const detectAuxOrder = (input: string) => {
  const normalized = stripDiacritics(input);
  if (!/(auxiliar|auxiliares|auxiliary|auxiliaire|support)/i.test(normalized)) {
    return null;
  }

  const match = normalized.match(
    /(?:auxiliar|auxiliares|auxiliary|auxiliaire|support)(?:\s+[a-z]+){0,3}\s*(\d{1,2})/i
  );
  if (!match) return 1;

  const value = Number(match[1]);
  if (!Number.isInteger(value) || value <= 0) return 1;
  return value;
};

async function listPdfPaths(options: {
  bucket: string;
  prefix: string;
  supabase: ReturnType<typeof createClient>;
}) {
  const { bucket, prefix, supabase } = options;
  const output: string[] = [];
  const queue = [prefix.trim().replace(/^\/+|\/+$/g, '')];

  while (queue.length > 0) {
    const current = queue.shift() ?? '';
    let offset = 0;
    const limit = 100;

    while (true) {
      const { data, error } = await supabase.storage.from(bucket).list(current, {
        limit,
        offset,
        sortBy: { column: 'name', order: 'asc' },
      });

      if (error) {
        throw new Error(`Failed listing storage path "${current || '/'}": ${error.message}`);
      }

      if (!data || data.length === 0) {
        break;
      }

      for (const entry of data) {
        const fullPath = normalizeStoragePath(current, entry.name);
        const isFolder = !entry.metadata;

        if (isFolder) {
          queue.push(fullPath);
          continue;
        }

        if (/\.pdf$/i.test(entry.name)) {
          output.push(fullPath);
        }
      }

      if (data.length < limit) {
        break;
      }

      offset += limit;
    }
  }

  return output;
}

type DetectedPdf = {
  storagePath: string;
  language: LanguageCode;
  kind: AttachmentKind;
  classNumber?: number;
  auxOrder?: number;
};

const detectPdfMetadata = (storagePath: string): DetectedPdf | null => {
  const filename = storagePath.split('/').at(-1) ?? storagePath;
  const language = detectLanguage(storagePath);

  if (!language) {
    return null;
  }

  const auxOrder = detectAuxOrder(filename);
  if (auxOrder !== null) {
    return {
      storagePath,
      language,
      kind: 'AUXILIARY',
      auxOrder,
    };
  }

  const classNumber = detectClassNumber(filename);
  if (!classNumber) {
    return null;
  }

  return {
    storagePath,
    language,
    kind: 'CLASS',
    classNumber,
  };
};

async function main() {
  const courseId = getArgValue('--course-id');
  const storagePrefix = getArgValue('--storage-prefix');
  const bucket = (process.env.SUPABASE_STORAGE_BUCKET || '').trim();
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  if (!bucket || !supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_STORAGE_BUCKET, NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const rawStoragePaths = await listPdfPaths({
    bucket,
    prefix: storagePrefix,
    supabase,
  });

  const detected = rawStoragePaths
    .map((path) => detectPdfMetadata(path))
    .filter((item): item is DetectedPdf => Boolean(item));

  if (detected.length === 0) {
    throw new Error('No recognizable multilingual PDFs were found in Supabase storage.');
  }

  const lessons = await db.lesson.findMany({
    where: courseId
      ? {
          chapter: {
            courseId,
          },
        }
      : undefined,
    include: {
      chapter: {
        select: {
          position: true,
        },
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
  });

  if (lessons.length === 0) {
    console.log(courseId ? `No lessons found for course ${courseId}. Aborting.` : 'No lessons found. Aborting.');
    return;
  }

  if (!courseId && lessons.length > EXPECTED_CLASS_COUNT) {
    console.log(
      `Found ${lessons.length} lessons without --course-id. Use --course-id to avoid syncing the wrong course.`
    );
    return;
  }

  const classPdfs = detected.filter((item) => item.kind === 'CLASS');
  const auxiliaryPdfs = detected.filter((item) => item.kind === 'AUXILIARY');

  console.log(`Detected ${classPdfs.length} class PDFs and ${auxiliaryPdfs.length} auxiliary PDFs from storage.`);

  const targetLessons = lessons.slice(0, EXPECTED_CLASS_COUNT);
  console.log(`Syncing ${targetLessons.length} classes${courseId ? ` for course ${courseId}` : ''}`);

  for (let index = 0; index < targetLessons.length; index += 1) {
    const lesson = targetLessons[index];
    const classNumber = index + 1;

    if (!lesson) {
      console.log(`Skipping class ${classNumber}: lesson not found in database.`);
      continue;
    }

    for (const language of SUPPORTED_LANGUAGES) {
      const file = classPdfs.find(
        (item) => item.language === language && item.classNumber === classNumber
      );

      if (!file) {
        console.log(`Missing class PDF for class ${classNumber}, language ${language}.`);
        continue;
      }

      await db.attachment.upsert({
        where: {
          lessonId_language_documentKey: {
            lessonId: lesson.id,
            language,
            documentKey: 'class-note',
          },
        },
        update: {
          name: normalizeName(file.storagePath),
          url: file.storagePath,
          kind: 'CLASS',
        },
        create: {
          lessonId: lesson.id,
          name: normalizeName(file.storagePath),
          url: file.storagePath,
          language,
          kind: 'CLASS',
          documentKey: 'class-note',
        },
      });

      console.log(`Class ${classNumber} [${language}] synced -> ${file.storagePath}`);
    }
  }

  const firstLesson = targetLessons[0];
  if (firstLesson) {
    for (const language of SUPPORTED_LANGUAGES) {
      for (let order = 1; order <= EXPECTED_AUX_COUNT; order += 1) {
        const file = auxiliaryPdfs.find(
          (item) => item.language === language && item.auxOrder === order
        );

        if (!file) {
          console.log(`Missing auxiliary PDF ${order} for language ${language}.`);
          continue;
        }

        const documentKey = `aux-${order}`;
        await db.attachment.upsert({
          where: {
            lessonId_language_documentKey: {
              lessonId: firstLesson.id,
              language,
              documentKey,
            },
          },
          update: {
            name: normalizeName(file.storagePath),
            url: file.storagePath,
            kind: 'AUXILIARY',
          },
          create: {
            lessonId: firstLesson.id,
            name: normalizeName(file.storagePath),
            url: file.storagePath,
            language,
            kind: 'AUXILIARY',
            documentKey,
          },
        });

        console.log(`Auxiliary ${order} [${language}] synced -> ${file.storagePath}`);
      }
    }
  }
}

main()
  .catch((error) => {
    console.error('Failed to sync attachments:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });