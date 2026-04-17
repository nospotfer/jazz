import { NextResponse } from 'next/server';
import { ensureAdminApiPermission } from '@/lib/admin-api';
import { getRevenueTimeseries, isRangeKey, resolveRange, type RangeKey } from '@/lib/admin/metrics-db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await ensureAdminApiPermission('analytics.read');
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const rangeParam = url.searchParams.get('range');
  const rangeKey: RangeKey = isRangeKey(rangeParam) ? rangeParam : '30d';
  const range = resolveRange(rangeKey);

  const data = await getRevenueTimeseries(range);

  return NextResponse.json(
    {
      ok: true,
      range: {
        key: range.key,
        from: range.from.toISOString(),
        to: range.to.toISOString(),
        granularity: range.granularity,
      },
      generatedAt: new Date().toISOString(),
      data: data.map((b) => ({ bucket: b.bucket, revenue: b.value })),
    },
    { headers: { 'Cache-Control': 'private, max-age=300' } }
  );
}
