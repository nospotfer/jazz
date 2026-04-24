import { unstable_cache } from 'next/cache';

export const CLARITY_EXPORT_DIMENSIONS = [
  'Browser',
  'Device',
  'Country/Region',
  'OS',
  'Source',
  'Medium',
  'Campaign',
  'Channel',
  'URL',
  'Page Title',
  'Referrer URL',
] as const;

export type ClarityExportDimension = (typeof CLARITY_EXPORT_DIMENSIONS)[number];

export type ClarityExportRow = Record<string, string | number | undefined>;

export type ClarityExportMetric = {
  metricName: string;
  information: ClarityExportRow[];
};

type Ok = {
  ok: true;
  data: {
    windowDays: 1 | 2 | 3;
    dimensions: ClarityExportDimension[];
    metrics: ClarityExportMetric[];
    fetchedAt: string;
  };
};

type Unavailable = {
  ok: true;
  unavailable: true;
  reason: 'missing_env' | 'api_error' | 'timeout' | 'rate_limited';
};

export type ClarityLiveInsightsResult = Ok | Unavailable;

const CLARITY_API_URL = 'https://www.clarity.ms/export-data/api/v1/project-live-insights';
const CLARITY_CACHE_TTL_SECONDS = 300;
const FETCH_TIMEOUT_MS = 10000;

function getToken(): string | null {
  const token = process.env.CLARITY_DATA_EXPORT_TOKEN;
  if (!token || token.trim().length === 0) return null;
  return token.trim();
}

function normalizeWindowDays(raw: number): 1 | 2 | 3 {
  if (raw <= 1) return 1;
  if (raw >= 3) return 3;
  return 2;
}

export function parseClarityDimensions(values: Array<string | null | undefined>): ClarityExportDimension[] {
  const allowed = new Set<string>(CLARITY_EXPORT_DIMENSIONS);
  const seen = new Set<string>();
  const result: ClarityExportDimension[] = [];

  for (const value of values) {
    if (!value) continue;
    if (!allowed.has(value)) continue;
    if (seen.has(value)) continue;
    seen.add(value);
    result.push(value as ClarityExportDimension);
    if (result.length >= 3) break;
  }

  return result;
}

async function fetchClarityInsightsUncached(
  windowDays: 1 | 2 | 3,
  dimensions: ClarityExportDimension[],
): Promise<ClarityLiveInsightsResult> {
  const token = getToken();
  if (!token) return { ok: true, unavailable: true, reason: 'missing_env' };

  const params = new URLSearchParams();
  params.set('numOfDays', String(windowDays));
  dimensions.forEach((dimension, index) => {
    params.set(`dimension${index + 1}`, dimension);
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(`${CLARITY_API_URL}?${params.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 429) {
      return { ok: true, unavailable: true, reason: 'rate_limited' };
    }
    if (!response.ok) {
      console.error('[clarity-live-insights] non-2xx', response.status);
      return { ok: true, unavailable: true, reason: 'api_error' };
    }

    const payload = (await response.json()) as Array<{
      metricName?: string;
      information?: ClarityExportRow[];
    }>;

    if (!Array.isArray(payload)) {
      console.error('[clarity-live-insights] invalid payload', payload);
      return { ok: true, unavailable: true, reason: 'api_error' };
    }

    const metrics: ClarityExportMetric[] = payload
      .filter((item) => typeof item?.metricName === 'string')
      .map((item) => ({
        metricName: item.metricName || 'Unknown',
        information: Array.isArray(item.information) ? item.information : [],
      }));

    return {
      ok: true,
      data: {
        windowDays,
        dimensions,
        metrics,
        fetchedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    clearTimeout(timeoutId);
    const isTimeout = error instanceof Error && error.name === 'AbortError';
    console.error('[clarity-live-insights] fetch failed', error);
    return {
      ok: true,
      unavailable: true,
      reason: isTimeout ? 'timeout' : 'api_error',
    };
  }
}

export async function getClarityLiveInsights(options?: {
  windowDays?: number;
  dimensions?: ClarityExportDimension[];
}): Promise<ClarityLiveInsightsResult> {
  const windowDays = normalizeWindowDays(options?.windowDays ?? 3);
  const dimensions = (options?.dimensions ?? []).slice(0, 3);
  const dimsKey = dimensions.length > 0 ? dimensions.join('|') : 'none';

  const cached = unstable_cache(
    () => fetchClarityInsightsUncached(windowDays, dimensions),
    ['clarity-live-insights', String(windowDays), dimsKey],
    {
      revalidate: CLARITY_CACHE_TTL_SECONDS,
      tags: ['admin-metrics', 'clarity-live-insights'],
    },
  );

  return cached();
}