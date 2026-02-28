import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

const CLASS_PDF_PATHS = [
  'Clase 1_ La Esencia del Jazz - Apuntes.pdf',
  'Clase 2_ El Lenguaje del Jazz_ Heterogeneidad Sonora - Apuntes.pdf',
  'Clase 3_ Gospel y Blues_ Las Raices Profundas - Apuntes.pdf',
  'Clase 4_ Las Formas del Jazz_ Blues y Baladas - Apuntes.pdf',
  'Clase 5_ Un Antecedente Decisivo_ El Ragtime - Apuntes.pdf',
  'Clase 6_ El Ritmo_ El Corazon del Jazz - Apuntes.pdf',
  'Clase 7_ Jamming and Blowing_ El Placer de Improvisar - Apuntes.pdf',
  'Clase 8_ La Composicion Colaborativa_ Ellington, Basie y Monk - Apuntes.pdf',
  'Clase 9_ Instrumentos y Conjuntos (La Orquesta)  - Apuntes.pdf',
  'Clase 10_ Los Pequenos Grupos y el Mundo de los Solistas - Apuntes.pdf',
  'Clase 11_ La Seccion Ritmica_ El Motor del Grupo  - Apuntes.pdf',
  'Clase 12_ La Improvisacion en el Jazz - Apuntes.pdf',
  'Clase 13_ Jazz y Entertainment_ Arte o Espectaculo_ - Apuntes.pdf',
  'Clase 14_ Cantar Jazz (Parte 1)_ De Bessie Smith a Billie Holiday - Apuntes.pdf',
  'Clase 15_ Cantar Jazz (Parte 2)_ De Ella Fitzgerald a Sarah Vaughan - Apuntes.pdf',
];

const AUXILIARY_PDFS = [
  'Apuntes Auxiliares 1 - Anos relevantes del Periodo Clasico de la Historia del Jazz.pdf',
  'Apuntes Auxiliares 2 - Anos relevantes del Periodo Moderno de la Historia del Jazz.pdf',
];

const normalizeName = (path: string) => path.replace(/\.pdf$/i, '');

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

async function main() {
  const includeAuxiliary = process.argv.includes('--include-aux');
  const courseId = getArgValue('--course-id');

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
      attachments: {
        orderBy: {
          createdAt: 'asc',
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

  if (!courseId && lessons.length > CLASS_PDF_PATHS.length) {
    console.log(
      `Found ${lessons.length} lessons without --course-id. Use --course-id to avoid syncing the wrong course.`
    );
    return;
  }

  console.log(
    `Syncing ${Math.min(lessons.length, CLASS_PDF_PATHS.length)} classes${courseId ? ` for course ${courseId}` : ''}`
  );

  for (let index = 0; index < CLASS_PDF_PATHS.length; index += 1) {
    const lesson = lessons[index];
    const storagePath = CLASS_PDF_PATHS[index];

    if (!lesson) {
      console.log(`Skipping class ${index + 1}: lesson not found in database.`);
      continue;
    }

    const attachmentName = normalizeName(storagePath);
    const firstAttachment = lesson.attachments[0];

    if (firstAttachment) {
      await db.attachment.update({
        where: { id: firstAttachment.id },
        data: {
          name: attachmentName,
          url: storagePath,
        },
      });

      if (lesson.attachments.length > 1) {
        const extraAttachmentIds = lesson.attachments.slice(1).map((attachment) => attachment.id);
        await db.attachment.deleteMany({
          where: {
            id: { in: extraAttachmentIds },
          },
        });
      }
    } else {
      await db.attachment.create({
        data: {
          lessonId: lesson.id,
          name: attachmentName,
          url: storagePath,
        },
      });
    }

    console.log(`Class ${index + 1} synced -> ${storagePath}`);
  }

  if (includeAuxiliary && lessons[0]) {
    for (const auxiliaryPath of AUXILIARY_PDFS) {
      await db.attachment.create({
        data: {
          lessonId: lessons[0].id,
          name: normalizeName(auxiliaryPath),
          url: auxiliaryPath,
        },
      });
      console.log(`Auxiliary attached to class 1 -> ${auxiliaryPath}`);
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