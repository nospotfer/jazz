import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureAdminApiPermission } from '@/lib/admin-api';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const auth = await ensureAdminApiPermission('vouchers.read');
    if (!auth.ok) {
      return auth.response;
    }

    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const usage = url.searchParams.get('usage');
    const search = (url.searchParams.get('search') || '').trim();

    const now = new Date();

    const where: any = {};

    if (search) {
      where.code = { contains: search, mode: 'insensitive' };
    }

    if (status === 'active') {
      where.isActive = true;
      where.OR = [{ expiresAt: null }, { expiresAt: { gt: now } }];
    }

    if (status === 'inactive') {
      where.isActive = false;
    }

    if (status === 'expired') {
      where.expiresAt = { lt: now };
    }

    if (usage === 'used') {
      where.currentUses = { gt: 0 };
    }

    if (usage === 'unused') {
      where.currentUses = 0;
    }

    const prisma = db as any;
    const [vouchers, total, usedCount, activeCount, expiredCount] = await Promise.all([
      prisma.voucherCode.findMany({
        where,
        include: {
          course: {
            select: { id: true, title: true },
          },
          batch: {
            select: { id: true, name: true, codePrefix: true, createdAt: true },
          },
          _count: {
            select: {
              redemptions: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 300,
      }),
      prisma.voucherCode.count(),
      prisma.voucherCode.count({ where: { currentUses: { gt: 0 } } }),
      prisma.voucherCode.count({
        where: {
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
      }),
      prisma.voucherCode.count({
        where: {
          expiresAt: { lt: now },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        total,
        used: usedCount,
        active: activeCount,
        expired: expiredCount,
      },
      vouchers,
    });
  } catch (error) {
    console.error('[ADMIN_VOUCHERS_LIST_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Server error', message: 'Erro ao listar vouchers.' },
      { status: 500 }
    );
  }
}
