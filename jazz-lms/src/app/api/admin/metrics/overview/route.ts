import { NextResponse } from 'next/server';
import { ensureAdminApiPermission } from '@/lib/admin-api';
import { getOverview, isRangeKey, resolveRange, type RangeKey } from '@/lib/admin/metrics-db';
import { getTrafficOverview } from '@/lib/admin/metrics-ga';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await ensureAdminApiPermission('analytics.read');
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const rangeParam = url.searchParams.get('range');
  const rangeKey: RangeKey = isRangeKey(rangeParam) ? rangeParam : '30d';
  const range = resolveRange(rangeKey);

  const [metrics, traffic] = await Promise.all([getOverview(range), getTrafficOverview(range)]);

  return NextResponse.json(
    {
      ok: true,
      range: {
        key: range.key,
        from: range.from.toISOString(),
        to: range.to.toISOString(),
        previousFrom: range.previousFrom.toISOString(),
        previousTo: range.previousTo.toISOString(),
        granularity: range.granularity,
      },
      generatedAt: new Date().toISOString(),
      data: {
        ...metrics,
        traffic:
          'unavailable' in traffic
            ? { unavailable: true as const, reason: traffic.reason }
            : {
                value: traffic.data.sessions,
                users: traffic.data.users,
              },
      },
    },
    { headers: { 'Cache-Control': 'private, max-age=300' } }
  );
}
