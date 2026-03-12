import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureAdminApiPermission } from '@/lib/admin-api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function csvEscape(value: string | number | null) {
  if (value === null || value === undefined) {
    return '';
  }
  const stringValue = String(value);
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

export async function GET(req: Request) {
  try {
    const auth = await ensureAdminApiPermission('vouchers.read');
    if (!auth.ok) {
      return auth.response;
    }

    const url = new URL(req.url);
    const status = url.searchParams.get('status');

    const now = new Date();
    const where =
      status === 'active'
        ? {
            isActive: true,
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          }
        : status === 'expired'
        ? {
            OR: [{ expiresAt: { lt: now } }],
          }
        : undefined;

    const prisma = db as any;
    const vouchers = await prisma.voucherCode.findMany({
      where,
      include: {
        course: {
          select: { title: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const header = [
      'code',
      'type',
      'course',
      'discountPercent',
      'discountAmount',
      'minOrderValue',
      'maxUses',
      'currentUses',
      'maxUsesPerUser',
      'isActive',
      'expiresAt',
      'createdAt',
    ];

    const rows = vouchers.map((voucher: any) => [
      csvEscape(voucher.code),
      csvEscape(voucher.type),
      csvEscape(voucher.course?.title || 'ALL_COURSES'),
      csvEscape(voucher.discountPercent),
      csvEscape(voucher.discountAmount),
      csvEscape(voucher.minOrderValue),
      csvEscape(voucher.maxUses),
      csvEscape(voucher.currentUses),
      csvEscape(voucher.maxUsesPerUser),
      csvEscape(voucher.isActive),
      csvEscape(voucher.expiresAt?.toISOString() || null),
      csvEscape(voucher.createdAt.toISOString()),
    ]);

    const csv = [header.join(','), ...rows.map((row: string[]) => row.join(','))].join('\n');

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="vouchers-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error('[ADMIN_VOUCHERS_EXPORT_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Server error', message: 'Erro ao exportar vouchers.' },
      { status: 500 }
    );
  }
}
