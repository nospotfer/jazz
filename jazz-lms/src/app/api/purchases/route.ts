import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse('No autorizado', { status: 401 });
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
      itemType: 'Curso',
      itemTitle: p.course.title,
      amount: p.course.price || 0,
      createdAt: p.createdAt.toISOString(),
      currency: 'EUR',
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.log('[PURCHASES_GET_ERROR]', error);
    return new NextResponse('Error interno del servidor', { status: 500 });
  }
}
