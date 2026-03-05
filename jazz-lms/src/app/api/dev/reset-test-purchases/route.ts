import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/lib/db';
import { isLocalTestRequest } from '@/lib/test-mode';

export async function POST(req: Request) {
  try {
    if (!isLocalTestRequest(req)) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const [deletedPurchases, deletedProgress, deletedLessonPurchases] = await db.$transaction([
      db.purchase.deleteMany({
        where: { userId: user.id },
      }),
      db.userProgress.deleteMany({
        where: { userId: user.id },
      }),
      db.lessonPurchase.deleteMany({
        where: { userId: user.id },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      deletedPurchases: deletedPurchases.count,
      deletedProgress: deletedProgress.count,
      deletedLessonPurchases: deletedLessonPurchases.count,
    });
  } catch (error) {
    console.error('[DEV_RESET_TEST_PURCHASES_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
