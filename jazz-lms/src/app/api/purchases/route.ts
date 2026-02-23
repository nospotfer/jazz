import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const purchases = await db.purchase.findMany({
      where: {
        userId: user.id,
      },
      include: {
        course: {
          select: {
            title: true,
            price: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formatted = purchases.map((p) => ({
      id: p.id,
      courseTitle: p.course.title,
      amount: p.course.price || 0,
      date: p.createdAt.toISOString(),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.log('[PURCHASES_GET_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
