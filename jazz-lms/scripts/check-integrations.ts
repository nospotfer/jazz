import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { createSign } from "crypto";

let prisma: PrismaClient | undefined;

// Only messages constructed by this check may reach shared build/CI logs.
// Provider/Prisma/fetch exceptions can contain connection strings, signed URLs
// or arbitrary response details, so their messages and payloads stay private.
class IntegrationCheckError extends Error {}

function reportFailure(error: unknown) {
  console.error("CHECKUP_FAILED");
  console.error(error instanceof IntegrationCheckError
    ? error.message
    : "Unexpected integration error; private provider details omitted.");
  process.exitCode = 1;
}

const REQUIRED_ENV = [
  "DATABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_STORAGE_BUCKET",
  "DODO_PAYMENTS_API_KEY",
  "DODO_PRODUCT_ID",
  "DODO_BUSINESS_ID",
  "MUX_SIGNING_KEY_ID",
  "MUX_SIGNING_PRIVATE_KEY",
] as const;

const PLACEHOLDER_HINTS = [
  "your-project",
  "your-anon-key",
  "your-service-role-key",
  "your_mux_signing",
];

const MUX_PLAYBACK_ID_REGEX = /^[a-zA-Z0-9]{20,80}$/;

function toBase64Url(input: string) {
  return Buffer.from(input).toString("base64url");
}

function getMuxPrivateKey() {
  const raw = process.env.MUX_SIGNING_PRIVATE_KEY?.trim() || "";

  if (!raw) throw new IntegrationCheckError("MUX_SIGNING_PRIVATE_KEY is missing");

  if (
    raw.includes("BEGIN PRIVATE KEY") ||
    raw.includes("BEGIN RSA PRIVATE KEY")
  ) {
    return raw;
  }

  const decoded = Buffer.from(raw, "base64").toString("utf8");
  if (
    decoded.includes("BEGIN PRIVATE KEY") ||
    decoded.includes("BEGIN RSA PRIVATE KEY")
  ) {
    return decoded;
  }

  throw new IntegrationCheckError("MUX_SIGNING_PRIVATE_KEY format is invalid");
}

function isPlaceholder(value: string) {
  const normalized = value.toLowerCase();
  return PLACEHOLDER_HINTS.some((hint) => normalized.includes(hint));
}

function extractMuxPlaybackId(value?: string | null) {
  const raw = (value ?? "").trim();
  if (!raw) return "";
  if (MUX_PLAYBACK_ID_REGEX.test(raw)) return raw;

  try {
    const url = new URL(raw);
    const firstSegment = url.pathname.split("/").filter(Boolean).at(0) ?? "";
    const candidate = firstSegment.replace(/\.[a-z0-9]+$/i, "");
    if (MUX_PLAYBACK_ID_REGEX.test(candidate)) {
      return candidate;
    }
  } catch {
    // ignore non-URL value
  }

  const embedded = raw.match(/[a-zA-Z0-9]{20,80}/)?.[0] ?? "";
  return MUX_PLAYBACK_ID_REGEX.test(embedded) ? embedded : "";
}

function extractStoragePath(value: string, bucketName: string) {
  const rawValue = value.trim();

  if (!rawValue) return "";
  if (!rawValue.startsWith("http")) return rawValue;

  try {
    const url = new URL(rawValue);
    const pathSegments = url.pathname
      .split("/")
      .map((segment) => decodeURIComponent(segment));
    const objectSignIndex = pathSegments.findIndex(
      (segment) => segment === "sign",
    );
    const objectPublicIndex = pathSegments.findIndex(
      (segment) => segment === "public",
    );
    const markerIndex =
      objectSignIndex >= 0 ? objectSignIndex : objectPublicIndex;

    if (markerIndex >= 0 && pathSegments[markerIndex + 1] === bucketName) {
      return pathSegments.slice(markerIndex + 2).join("/");
    }

    const directPrefix = `${bucketName}/`;
    const decodedPath = decodeURIComponent(url.pathname);
    const prefixIndex = decodedPath.indexOf(directPrefix);

    if (prefixIndex >= 0) {
      return decodedPath.slice(prefixIndex + directPrefix.length);
    }
  } catch {
    return rawValue;
  }

  return rawValue;
}

function createMuxPlaybackToken(playbackId: string) {
  const keyId = process.env.MUX_SIGNING_KEY_ID;
  if (!keyId) throw new IntegrationCheckError("MUX_SIGNING_KEY_ID is missing");

  const header = {
    alg: "RS256",
    typ: "JWT",
    kid: keyId,
  };

  const payload = {
    aud: "v",
    sub: playbackId,
    exp: Math.floor(Date.now() / 1000) + 300,
  };

  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const signer = createSign("RSA-SHA256");
  signer.update(signingInput);
  signer.end();

  const signature = signer.sign(getMuxPrivateKey(), "base64url");
  return `${signingInput}.${signature}`;
}

async function main() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new IntegrationCheckError(`Missing env vars: ${missing.join(", ")}`);
  }

  const placeholders = REQUIRED_ENV.filter((key) =>
    isPlaceholder(process.env[key] || ""),
  );
  if (placeholders.length > 0) {
    throw new IntegrationCheckError(
      `Placeholder env vars detected: ${placeholders.join(", ")}`,
    );
  }

  prisma = new PrismaClient();
  const lessons = await prisma.lesson.findMany({
    include: { attachments: true },
    orderBy: [{ chapter: { position: "asc" } }, { position: "asc" }],
  });

  const publishedLessons = lessons.filter((lesson) => lesson.isPublished);
  const lessonCount = publishedLessons.length;
  const attachmentCount = lessons.reduce(
    (sum, lesson) => sum + lesson.attachments.length,
    0,
  );

  if (lessonCount < 1) {
    throw new IntegrationCheckError("No published lessons found");
  }

  if (attachmentCount < 1) {
    throw new IntegrationCheckError("No attachments found");
  }

  const lessonsWithVideo = publishedLessons.filter((lesson) =>
    Boolean(extractMuxPlaybackId(lesson.videoUrl)),
  );
  if (lessonsWithVideo.length < 1) {
    throw new IntegrationCheckError("No published lessons with valid Mux playback IDs found");
  }

  const sampleSize = Math.min(15, lessonsWithVideo.length);

  let muxOk = 0;
  for (const lesson of lessonsWithVideo.slice(0, sampleSize)) {
    const playbackId = extractMuxPlaybackId(lesson.videoUrl);
    if (!playbackId) {
      throw new IntegrationCheckError("Mux playback ID is invalid");
    }

    const token = createMuxPlaybackToken(playbackId);
    const url = `https://stream.mux.com/${playbackId}.m3u8?token=${token}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new IntegrationCheckError(
        `Mux manifest request failed: HTTP ${response.status}`,
      );
    }

    const content = await response.text();
    const lines = content.split("\n").map((line) => line.trim());
    const streamInfLines = lines.filter((line) =>
      line.startsWith("#EXT-X-STREAM-INF"),
    );
    const hasResolution = streamInfLines.some((line) =>
      /RESOLUTION=\d+x\d+/i.test(line),
    );
    const hasVideoCodec = streamInfLines.some((line) =>
      /CODECS="[^"]*(avc1|hvc1|hev1|vp09|av01)/i.test(line),
    );

    if (!hasResolution && !hasVideoCodec) {
      throw new IntegrationCheckError(
        "Mux manifest contains no video variant",
      );
    }

    muxOk += 1;
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  );

  const bucket = process.env.SUPABASE_STORAGE_BUCKET as string;
  const allAttachments = lessons.flatMap((lesson) => lesson.attachments);

  if (allAttachments.length === 0) {
    throw new IntegrationCheckError("No attachment found to validate Supabase storage");
  }
  let supabaseStorageOk = false;
  let lastSupabaseError = "Unknown Supabase storage validation error";

  for (const attachment of allAttachments.slice(0, 25)) {
    const storagePath = extractStoragePath(attachment.url, bucket);
    if (!storagePath || storagePath.includes("token=")) {
      lastSupabaseError = "Attachment storage path is invalid";
      continue;
    }

    const { data: signedData, error: signedError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(storagePath, 300);

    if (signedError || !signedData?.signedUrl) {
      lastSupabaseError = "Supabase signed URL could not be created";
      continue;
    }

    const fileResponse = await fetch(signedData.signedUrl, { method: "HEAD" });
    if (!fileResponse.ok) {
      lastSupabaseError = `Supabase file HEAD request failed: HTTP ${fileResponse.status}`;
      continue;
    }

    supabaseStorageOk = true;
    break;
  }

  if (!supabaseStorageOk) {
    throw new IntegrationCheckError(lastSupabaseError);
  }

  console.log("CHECKUP_OK");
  console.log(`Published lessons: ${lessonCount}`);
  console.log(`Attachments: ${attachmentCount}`);
  console.log(`Mux streams validated: ${muxOk}/${sampleSize}`);
  console.log("Supabase signed URL: OK");
  console.log("Dodo checkout env vars: present (provider not verified)");
}

export const integrationCheck = main()
  .catch(reportFailure)
  .finally(async () => {
    if (prisma) {
      try {
        await prisma.$disconnect();
      } catch {
        reportFailure(new IntegrationCheckError("Database cleanup failed; private provider details omitted."));
      }
    }
  });
