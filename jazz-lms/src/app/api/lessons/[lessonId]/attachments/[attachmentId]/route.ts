import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

const extractStoragePath = (value: string, bucketName: string) => {
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
};

export async function GET(
  request: NextRequest,
  { params }: { params: { lessonId: string; attachmentId: string } }
) {
  try {
    const bucket = process.env.SUPABASE_STORAGE_BUCKET;
    const ttlSeconds = Number(process.env.SIGNED_URL_TTL_SECONDS ?? 900);
    const adminOwnerEmail = (process.env.ADMIN_OWNER_EMAIL ?? '').toLowerCase();

    if (!bucket) {
      return NextResponse.json({ error: 'Storage bucket is not configured' }, { status: 500 });
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const attachment = await db.attachment.findFirst({
      where: {
        id: params.attachmentId,
        lessonId: params.lessonId,
      },
      include: {
        lesson: {
          include: {
            chapter: {
              select: {
                courseId: true,
              },
            },
          },
        },
      },
    });

    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    const isAdminOwner = (user.email ?? '').toLowerCase() === adminOwnerEmail;
    const courseId = attachment.lesson.chapter.courseId;

    const [hasFullCoursePurchase, hasLessonPurchase, courseWithLessons] = await Promise.all([
      db.purchase.findUnique({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId,
          },
        },
      }),
      db.lessonPurchase.findUnique({
        where: {
          userId_lessonId: {
            userId: user.id,
            lessonId: attachment.lessonId,
          },
        },
      }),
      db.course.findUnique({
        where: { id: courseId },
        include: {
          chapters: {
            where: { isPublished: true },
            orderBy: { position: 'asc' },
            include: {
              lessons: {
                where: { isPublished: true },
                orderBy: { position: 'asc' },
                select: { id: true },
              },
            },
          },
        },
      }),
    ]);

    const firstLessonInCourse = courseWithLessons?.chapters.flatMap((chapter) => chapter.lessons).at(0);
    const isFreePreview = firstLessonInCourse?.id === attachment.lessonId;
    const canAccess = Boolean(isAdminOwner || hasFullCoursePurchase || hasLessonPurchase || isFreePreview);

    if (!canAccess) {
      return NextResponse.json({ error: 'Purchase required' }, { status: 403 });
    }

    const storagePath = extractStoragePath(attachment.url, bucket);

    if (!storagePath || storagePath.includes('token=')) {
      return NextResponse.json({ error: 'Attachment path is invalid' }, { status: 422 });
    }

    const download = request.nextUrl.searchParams.get('download') === '1';
    const proxy = request.nextUrl.searchParams.get('proxy') === '1';
    const adminClient = createAdminClient();

    if (proxy) {
      const { data: fileData, error: fileError } = await adminClient.storage
        .from(bucket)
        .download(storagePath);

      if (fileError || !fileData) {
        return NextResponse.json(
          { error: fileError?.message ?? 'Failed to load attachment file' },
          { status: 500 }
        );
      }

      const buffer = Buffer.from(await fileData.arrayBuffer());

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'inline',
          'Cache-Control': 'no-store, private, max-age=0',
          Pragma: 'no-cache',
        },
      });
    }

    const { data, error } = await adminClient.storage
      .from(bucket)
      .createSignedUrl(storagePath, ttlSeconds, { download: download ? attachment.name : false });

    if (error || !data?.signedUrl) {
      return NextResponse.json(
        { error: error?.message ?? 'Failed to create signed URL' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        signedUrl: data.signedUrl,
        name: attachment.name,
        storagePath,
      },
      {
        headers: {
          'Cache-Control': 'no-store, private, max-age=0',
          Pragma: 'no-cache',
        },
      }
    );
  } catch (error) {
    console.error('[ATTACHMENT_SIGNED_URL_ROUTE_ERROR]', error);
    return NextResponse.json({ error: 'Failed to load attachment' }, { status: 500 });
  }
}