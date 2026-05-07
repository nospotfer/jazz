/**
 * Atualiza Lesson.videoUrl com novos playback IDs da Mux.
 * Idempotente: se o valor já está correto, não faz UPDATE.
 *
 * Uso:
 *   npx tsx scripts/update-mux-playback-ids.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface MuxAssetUpdate {
  classeLabel: string;
  lessonId: string;
  expectedTitleFragment: string;
  newPlaybackId: string;
  newAssetId: string;
}

const UPDATES: MuxAssetUpdate[] = [
  {
    classeLabel: "Classe 1 — La Esencia del Jazz",
    lessonId: "550e8400-e29b-41d4-a716-446655440005",
    expectedTitleFragment: "Esencia",
    newPlaybackId: "qVp00sifjJCQKujhDSPLiJNRiZF8H4OdFoC7u3of00gyU",
    newAssetId: "3HbuWvU02UM8IW41p94Z95gJ02k8CfBF8R1rOAujOq00ME",
  },
  {
    classeLabel: "Classe 3 — Gospel y Blues",
    lessonId: "550e8400-e29b-41d4-a716-446655440007",
    expectedTitleFragment: "Gospel",
    newPlaybackId: "iMs2GxXGyK5CjymZX395Yf7hzeY8OYe7FzD7Yi3Zcow",
    newAssetId: "EK74elgRSyAlZPZuSzFKARu00ep01LS4uIBkWCPik9K7s",
  },
  {
    classeLabel: "Classe 6 — El Ritmo",
    lessonId: "550e8400-e29b-41d4-a716-446655440008",
    expectedTitleFragment: "Ritmo",
    newPlaybackId: "wv8E5ZCIoskvQRecgAmbsNa1bdlC028esSMWBLaLDOIc",
    newAssetId: "RYCcKv3GhNvn013NmDSNR2UOnlzrD7P74hpqPaD02bNDk",
  },
  {
    classeLabel: "Classe 7 — Jamming and Blowing",
    lessonId: "550e8400-e29b-41d4-a716-446655440009",
    expectedTitleFragment: "Jamming",
    newPlaybackId: "hUPj7UP002FEkInqV7KZymac3Xtw7jgOgEas02Hqf802qo",
    newAssetId: "GPVIRHrpABGZrr4pcuAPKoi500uNCJfWHdYVEe7KKaC4s",
  },
  {
    classeLabel: "Classe 8 — Composicion Colaborativa",
    lessonId: "550e8400-e29b-41d4-a716-446655440010",
    expectedTitleFragment: "Colaborativa",
    newPlaybackId: "XoExWX224E956vkoYT4aUzas02Nh5LwDN2Vb9RvZk9oo",
    newAssetId: "QcuL7g7MlslLquLQ6INs01twMMvCZyyb1tAAR8WOYvGc",
  },
  {
    classeLabel: "Classe 9 — Instrumentos y Conjuntos",
    lessonId: "2ec5ccd7-d145-4ba8-93e5-dcdd9ccc7247",
    expectedTitleFragment: "Instrumentos",
    newPlaybackId: "VzmZBF4beO00XBk8kCKNOMycDKa7qCACyAkrvSlmAZZU",
    newAssetId: "VdzsuFCITMA00KoBRbNwOjy1JMlMo2BfTNnnog00mtohs",
  },
  {
    classeLabel: "Classe 10 — Pequenos Grupos",
    lessonId: "5b78b0a8-6dbc-468e-8451-daae249c0a7a",
    expectedTitleFragment: "Pequenos",
    newPlaybackId: "6CZ00siRmC6CS5XCKKb1456WsAgb79r1FM8vq582jt8Q",
    newAssetId: "Jh02oZHzssskm5VuXHa01NQnpQ8kvz01tdl63uO00HaYhxk",
  },
  {
    classeLabel: "Classe 14 — Cantar Jazz Parte 1",
    lessonId: "67d93311-4ec6-4746-a918-c2dc80589d01",
    expectedTitleFragment: "Bessie Smith",
    newPlaybackId: "CfwA3JmMRlPRSJ6KhKRC8F4dk3RudX8ygJCwf5R4Idc",
    newAssetId: "hcva00RZiEPEEWp8HDkeJnIyZstLexx8MvB1UKU6rjOk",
  },
  {
    classeLabel: "Classe 15 — Cantar Jazz Parte 2",
    lessonId: "b4ee5615-3b65-4f6b-8744-62597b5d8900",
    expectedTitleFragment: "Ella Fitzgerald",
    newPlaybackId: "fQNep01k00VSgz01Blo24d7EBm8jB8YpwUa43HiYNxkOXk",
    newAssetId: "XpndutMY1XEz4KkD53jEm5Er6CbXamaJ1VPJxrzH602Q",
  },
];

async function main() {
  let changed = 0;
  let skipped = 0;
  let missing = 0;
  let mismatched = 0;

  for (const u of UPDATES) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: u.lessonId },
      select: { id: true, title: true, videoUrl: true },
    });

    if (!lesson) {
      console.error(`MISSING | ${u.classeLabel} | lessonId=${u.lessonId}`);
      missing += 1;
      continue;
    }

    if (
      !lesson.title.toLowerCase().includes(u.expectedTitleFragment.toLowerCase())
    ) {
      console.error(
        `MISMATCH | ${u.classeLabel} | esperava titulo c/ "${u.expectedTitleFragment}" mas encontrei "${lesson.title}"`,
      );
      mismatched += 1;
      continue;
    }

    if (lesson.videoUrl === u.newPlaybackId) {
      console.log(
        `SKIP    | ${u.classeLabel} | ja esta com playback ${u.newPlaybackId} (asset ${u.newAssetId})`,
      );
      skipped += 1;
      continue;
    }

    await prisma.lesson.update({
      where: { id: u.lessonId },
      data: { videoUrl: u.newPlaybackId },
    });
    console.log(
      `UPDATE  | ${u.classeLabel} | ${lesson.videoUrl ?? "(vazio)"} -> ${u.newPlaybackId} (asset ${u.newAssetId})`,
    );
    changed += 1;
  }

  console.log(
    `\nResumo: ${changed} atualizadas | ${skipped} ja-corretas | ${mismatched} titulo divergente | ${missing} ausentes`,
  );

  if (mismatched > 0 || missing > 0) {
    process.exitCode = 1;
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
