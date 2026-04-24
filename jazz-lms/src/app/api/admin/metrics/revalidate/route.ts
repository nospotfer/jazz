import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { ensureAdminApiPermission } from '@/lib/admin-api';

export const dynamic = 'force-dynamic';

export async function POST() {
  const auth = await ensureAdminApiPermission('analytics.read');
  if (!auth.ok) return auth.response;

  revalidateTag('admin-metrics', 'max');

  return NextResponse.json({ ok: true, revalidatedAt: new Date().toISOString() });
}
