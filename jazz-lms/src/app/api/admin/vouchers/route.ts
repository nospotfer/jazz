import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureAdminApiPermission } from '@/lib/admin-api';
import { getVoucherArtistByKey } from '@/lib/voucher-artists';

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
    const artistKeyParam = url.searchParams.get('artistKey');
    const discountPercentParam = url.searchParams.get('discountPercent');

    const now = new Date();
    const filters: any[] = [];

    if (search) {
      filters.push({
        code: { contains: search, mode: 'insensitive' },
      });
    }

    const artist = getVoucherArtistByKey(artistKeyParam);
    if (artist) {
      filters.push({
        code: { startsWith: artist.key },
      });
    }

    const discountPercent = discountPercentParam ? Number(discountPercentParam) : null;
    if (discountPercent !== null && Number.isFinite(discountPercent) && discountPercent > 0) {
      filters.push({
        discountPercent,
      });
    }

    if (status === 'active') {
      filters.push({
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      });
    }

    if (status === 'inactive') {
      filters.push({
        isActive: false,
      });
    }

    if (status === 'expired') {
      filters.push({
        expiresAt: { lt: now },
      });
    }

    if (usage === 'used') {
      filters.push({
        currentUses: { gt: 0 },
      });
    }

    if (usage === 'unused') {
      filters.push({
        currentUses: 0,
      });
    }

    const where = filters.length > 0 ? { AND: filters } : {};

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
