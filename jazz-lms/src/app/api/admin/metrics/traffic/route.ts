import { NextResponse } from 'next/server';
import { ensureAdminApiPermission } from '@/lib/admin-api';
import { isRangeKey, resolveRange, type RangeKey } from '@/lib/admin/metrics-db';
import { getClarityTrafficOverview } from '@/lib/admin/metrics-clarity';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await ensureAdminApiPermission('analytics.read');
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const rangeParam = url.searchParams.get('range');
  const rangeKey: RangeKey = isRangeKey(rangeParam) ? rangeParam : '30d';
  const range = resolveRange(rangeKey);

  const traffic = await getClarityTrafficOverview(range);

  const serializedRange = {
    key: range.key,
    from: range.from.toISOString(),
    to: range.to.toISOString(),
    granularity: range.granularity,
  };

  if ('unavailable' in traffic) {
    return NextResponse.json(
      {
        ok: true,
        range: serializedRange,
        unavailable: true,
        reason: traffic.reason,
      },
      { headers: { 'Cache-Control': 'private, max-age=300' } }
    );
  }

  return NextResponse.json(
    { ok: true, range: serializedRange, data: traffic.data },
    { headers: { 'Cache-Control': 'private, max-age=300' } }
  );
}
