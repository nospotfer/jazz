/**
 * Cliente do Google Analytics 4 Data API para o Painel de Metricas.
 *
 * Princípios:
 * - Server-only: nunca expor credenciais ao cliente.
 * - Falha graciosa: ausencia de env ou erro da API nao quebra a UI.
 * - Cache em memoria (5 min) para reduzir custo e quota.
 */

import type { Range } from './metrics-db';

type Ok = {
  ok: true;
  data: {
    sessions: number;
    users: number;
    topPages: Array<{ path: string; views: number }>;
    sources: Array<{ source: string; sessions: number }>;
  };
};

type Unavailable = {
  ok: true;
  unavailable: true;
  reason: 'missing_env' | 'api_error' | 'timeout';
};

export type TrafficResult = Ok | Unavailable;

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { value: TrafficResult; expiresAt: number }>();

function cacheKey(range: Range): string {
  return `${range.key}:${range.from.toISOString()}:${range.to.toISOString()}`;
}

function getEnv(): { propertyId: string; clientEmail: string; privateKey: string } | null {
  const propertyId = process.env.GA4_PROPERTY_ID;
  const clientEmail = process.env.GA4_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GA4_PRIVATE_KEY;
  if (!propertyId || !clientEmail || !rawKey) return null;
  // Envs salvas no Vercel vem com \n escapado.
  const privateKey = rawKey.replace(/\\n/g, '\n');
  return { propertyId, clientEmail, privateKey };
}

function formatGaDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

async function fetchTrafficFromGa4(range: Range): Promise<TrafficResult> {
  const env = getEnv();
  if (!env) return { ok: true, unavailable: true, reason: 'missing_env' };

  try {
    // Import dinamico: evita carregar o client em ambientes sem credenciais.
    const { BetaAnalyticsDataClient } = await import('@google-analytics/data');
    const client = new BetaAnalyticsDataClient({
      credentials: {
        client_email: env.clientEmail,
        private_key: env.privateKey,
      },
    });

    const startDate = formatGaDate(range.from);
    const endDate = formatGaDate(range.to);

    const [summaryResp] = await client.runReport({
      property: env.propertyId,
      dateRanges: [{ startDate, endDate }],
      metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
    });

    const sessions = Number(summaryResp.rows?.[0]?.metricValues?.[0]?.value ?? 0);
    const users = Number(summaryResp.rows?.[0]?.metricValues?.[1]?.value ?? 0);

    const [pagesResp] = await client.runReport({
      property: env.propertyId,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 10,
    });
    const topPages = (pagesResp.rows ?? []).map((row) => ({
      path: row.dimensionValues?.[0]?.value ?? 'unknown',
      views: Number(row.metricValues?.[0]?.value ?? 0),
    }));

    const [sourcesResp] = await client.runReport({
      property: env.propertyId,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'sessionSource' }],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 10,
    });
    const sources = (sourcesResp.rows ?? []).map((row) => ({
      source: row.dimensionValues?.[0]?.value ?? 'unknown',
      sessions: Number(row.metricValues?.[0]?.value ?? 0),
    }));

    return { ok: true, data: { sessions, users, topPages, sources } };
  } catch (error) {
    console.error('[metrics-ga] GA4 Data API failed, returning unavailable.', error);
    return { ok: true, unavailable: true, reason: 'api_error' };
  }
}

export async function getTrafficOverview(range: Range): Promise<TrafficResult> {
  const key = cacheKey(range);
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value;

  const value = await fetchTrafficFromGa4(range);
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}

/** Apenas para testes. */
export function __clearMetricsGaCache() {
  cache.clear();
}
