import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import { createSign } from 'crypto';

const prisma = new PrismaClient();

const REQUIRED_ENV = [
  'DATABASE_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_STORAGE_BUCKET',
  'MUX_SIGNING_KEY_ID',
  'MUX_SIGNING_PRIVATE_KEY',
] as const;

const PLACEHOLDER_HINTS = [
  'your-project',
  'your-anon-key',
  'your-service-role-key',
  'your_mux_signing',
];

const MUX_PLAYBACK_ID_REGEX = /^[a-zA-Z0-9]{20,80}$/;

function toBase64Url(input: string) {
  return Buffer.from(input).toString('base64url');
}

function getMuxPrivateKey() {
  const raw = process.env.MUX_SIGNING_PRIVATE_KEY?.trim() || '';

  if (!raw) throw new Error('MUX_SIGNING_PRIVATE_KEY is missing');

  if (raw.includes('BEGIN PRIVATE KEY') || raw.includes('BEGIN RSA PRIVATE KEY')) {
    return raw;
  }

  const decoded = Buffer.from(raw, 'base64').toString('utf8');
  if (decoded.includes('BEGIN PRIVATE KEY') || decoded.includes('BEGIN RSA PRIVATE KEY')) {
    return decoded;
  }

  throw new Error('MUX_SIGNING_PRIVATE_KEY format is invalid');
}

function isPlaceholder(value: string) {
  const normalized = value.toLowerCase();
  return PLACEHOLDER_HINTS.some((hint) => normalized.includes(hint));
}

function extractMuxPlaybackId(value?: string | null) {
  const raw = (value ?? '').trim();
  if (!raw) return '';
  if (MUX_PLAYBACK_ID_REGEX.test(raw)) return raw;

  try {
    const url = new URL(raw);
    const firstSegment = url.pathname.split('/').filter(Boolean).at(0) ?? '';
    const candidate = firstSegment.replace(/\.[a-z0-9]+$/i, '');
    if (MUX_PLAYBACK_ID_REGEX.test(candidate)) {
      return candidate;
    }
  } catch {
    // ignore non-URL value
  }

  const embedded = raw.match(/[a-zA-Z0-9]{20,80}/)?.[0] ?? '';
  return MUX_PLAYBACK_ID_REGEX.test(embedded) ? embedded : '';
}

function extractStoragePath(value: string, bucketName: string) {
  const rawValue = value.trim();

  if (!rawValue) return '';
  if (!rawValue.startsWith('http')) return rawValue;

  try {
    const url = new URL(rawValue);
    const pathSegments = url.pathname.split('/').map((segment) => decodeURIComponent(segment));
    const objectSignIndex = pathSegments.findIndex((segment) => segment === 'sign');
    const objectPublicIndex = pathSegments.findIndex((segment) => segment === 'public');
    const markerIndex = objectSignIndex >= 0 ? objectSignIndex : objectPublicIndex;

    if (markerIndex >= 0 && pathSegments[markerIndex + 1] === bucketName) {
      return pathSegments.slice(markerIndex + 2).join('/');
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
  if (!keyId) throw new Error('MUX_SIGNING_KEY_ID is missing');

  const header = {
    alg: 'RS256',
    typ: 'JWT',
    kid: keyId,
  };

  const payload = {
    aud: 'v',
    sub: playbackId,
    exp: Math.floor(Date.now() / 1000) + 300,
  };

  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const signer = createSign('RSA-SHA256');
  signer.update(signingInput);
  signer.end();

  const signature = signer.sign(getMuxPrivateKey(), 'base64url');
  return `${signingInput}.${signature}`;
}

async function main() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing env vars: ${missing.join(', ')}`);
  }

  const placeholders = REQUIRED_ENV.filter((key) => isPlaceholder(process.env[key] || ''));
  if (placeholders.length > 0) {
    throw new Error(`Placeholder env vars detected: ${placeholders.join(', ')}`);
  }

  const lessons = await prisma.lesson.findMany({
    include: { attachments: true },
    orderBy: [
      { chapter: { position: 'asc' } },
      { position: 'asc' },
    ],
  });

  const publishedLessons = lessons.filter((lesson) => lesson.isPublished);
  const lessonCount = publishedLessons.length;
  const attachmentCount = lessons.reduce((sum, lesson) => sum + lesson.attachments.length, 0);

  if (lessonCount < 1) {
    throw new Error('No published lessons found');
  }

  if (attachmentCount < 1) {
    throw new Error('No attachments found');
  }

  const lessonsWithVideo = publishedLessons.filter((lesson) => Boolean(extractMuxPlaybackId(lesson.videoUrl)));
  if (lessonsWithVideo.length < 1) {
    throw new Error('No published lessons with valid Mux playback IDs found');
  }

  const sampleSize = Math.min(15, lessonsWithVideo.length);

  let muxOk = 0;
  for (const lesson of lessonsWithVideo.slice(0, sampleSize)) {
    const playbackId = extractMuxPlaybackId(lesson.videoUrl);
    if (!playbackId) {
      throw new Error(`Mux playback ID is invalid for lesson ${lesson.title}`);
    }

    const token = createMuxPlaybackToken(playbackId);
    const url = `https://stream.mux.com/${playbackId}.m3u8?token=${token}`;

    const response = await fetch(url, { method: 'HEAD' });
    if (response.ok) {
      muxOk += 1;
    } else {
      throw new Error(`Mux failed for lesson ${lesson.title}: HTTP ${response.status}`);
    }
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string
  );

  const bucket = process.env.SUPABASE_STORAGE_BUCKET as string;
  const firstAttachment = lessons.flatMap((lesson) => lesson.attachments).at(0);

  if (!firstAttachment) {
    throw new Error('No attachment found to validate Supabase storage');
  }

  const storagePath = extractStoragePath(firstAttachment.url, bucket);
  if (!storagePath || storagePath.includes('token=')) {
    throw new Error('Attachment storage path is invalid');
  }

  const { data: signedData, error: signedError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(storagePath, 300);

  if (signedError || !signedData?.signedUrl) {
    throw new Error(`Supabase signed URL failed: ${signedError?.message || 'no URL returned'}`);
  }

  const fileResponse = await fetch(signedData.signedUrl, { method: 'HEAD' });
  if (!fileResponse.ok) {
    throw new Error(`Supabase file HEAD failed: HTTP ${fileResponse.status}`);
  }

  console.log('CHECKUP_OK');
  console.log(`Published lessons: ${lessonCount}`);
  console.log(`Attachments: ${attachmentCount}`);
  console.log(`Mux streams validated: ${muxOk}/${sampleSize}`);
  console.log('Supabase signed URL: OK');
}

main()
  .catch((error) => {
    console.error('CHECKUP_FAILED');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
