import { PrismaClient } from "@prisma/client";
import { createMuxPlaybackTokens } from "@/lib/mux";

const db = new PrismaClient();

type IssueType = "playback" | "asset-edit";

interface ReportedIssue {
  classNumber: number;
  label: string;
  issue: string;
  type: IssueType;
}

const REPORTED_ISSUES: ReportedIssue[] = [
  {
    classNumber: 5,
    label: "Clase 5",
    issue: "Intro sem tema musical",
    type: "asset-edit",
  },
  {
    classNumber: 6,
    label: "Clase 6",
    issue: "Corte no trecho 'four beats'",
    type: "playback",
  },
  {
    classNumber: 12,
    label: "Clase 12",
    issue: "Erro Mux recorrente e exemplo de Coleman Hawkins citado",
    type: "playback",
  },
  {
    classNumber: 13,
    label: "Clase 13",
    issue: "Vídeo de Art Tatum ausente e artefato visual (turntable)",
    type: "asset-edit",
  },
  {
    classNumber: 14,
    label: "Clase 14",
    issue: "Corte no clipe High Society",
    type: "asset-edit",
  },
  {
    classNumber: 15,
    label: "Clase 15",
    issue: "Erro Mux recorrente com recuperação em refresh",
    type: "playback",
  },
];

function hasVideoTracks(m3u8: string) {
  const lines = m3u8.split("\n").map((line) => line.trim());
  const streamInf = lines.filter((line) => line.startsWith("#EXT-X-STREAM-INF"));
  const hasResolution = streamInf.some((line) => /RESOLUTION=\d+x\d+/i.test(line));
  const hasVideoCodec = streamInf.some((line) => /CODECS="[^"]*(avc1|hvc1|hev1|vp09|av01)/i.test(line));
  return hasResolution && hasVideoCodec;
}

async function checkPlayback(playbackId: string) {
  try {
    const tokens = createMuxPlaybackTokens(playbackId, 300);
    const response = await fetch(
      `https://stream.mux.com/${playbackId}.m3u8?token=${tokens.playbackToken}`,
    );

    if (!response.ok) {
      return `HTTP_${response.status}`;
    }

    const body = await response.text();
    return hasVideoTracks(body) ? "VIDEO_OK" : "NO_VIDEO_TRACK";
  } catch (error) {
    return `ERROR_${error instanceof Error ? error.message : "unknown"}`;
  }
}

async function main() {
  const lessons = await db.lesson.findMany({
    where: { isPublished: true },
    orderBy: [
      { chapter: { position: "asc" } },
      { position: "asc" },
    ],
    select: {
      id: true,
      title: true,
      videoUrl: true,
    },
    take: 15,
  });

  for (const report of REPORTED_ISSUES) {
    const lesson = lessons[report.classNumber - 1];

    if (!lesson) {
      console.log(`MISSING_LESSON | ${report.label} | ${report.issue}`);
      continue;
    }

    const playbackId = (lesson.videoUrl || "").trim();

    if (!playbackId) {
      console.log(
        `NO_PLAYBACK_ID | ${report.label} | lesson=${lesson.id} | ${report.issue}`,
      );
      continue;
    }

    if (report.type === "asset-edit") {
      console.log(
        `MANUAL_ASSET_REVIEW_REQUIRED | ${report.label} | lesson=${lesson.id} | playback=${playbackId} | ${report.issue}`,
      );
      continue;
    }

    const manifestStatus = await checkPlayback(playbackId);
    console.log(
      `${manifestStatus} | ${report.label} | lesson=${lesson.id} | playback=${playbackId} | ${report.issue}`,
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
