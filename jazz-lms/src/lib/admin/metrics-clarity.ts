/**
 * Cliente Microsoft Clarity — Data Export API para o Painel de Metricas.
 *
 * Substitui a integracao GA4 antiga para o KPI "Sesiones en el sitio".
 * Aproveita o token `CLARITY_DATA_EXPORT_TOKEN` ja configurado no Vercel.
 *
 * Principios:
 * - Server-only: nunca expor o JWT ao cliente.
 * - Falha graciosa: ausencia de env, erro HTTP ou timeout -> unavailable.
 * - Cache em memoria (5 min) para respeitar rate limits (10 requests/dia).
 *
 * Endpoint Clarity:
 *   GET https://www.clarity.ms/export-data/api/v1/project-live-insights?numOfDays=N
 *   Header: Authorization: Bearer <JWT>
 *
 * Nota importante: a Clarity Data Export API permite no maximo 3 dias
 * agregados por chamada e 10 chamadas por dia. Para ranges maiores
 * (30d/60d/90d/12m) retornamos a janela de 3 dias do Clarity com um
 * disclaimer na UI — o painel ja mostra "ultimos N dias" para o restante
 * dos KPIs, este cartao em particular tras traffic_live (ultimos 3d).
 */

import type { Range } from './metrics-db';

type Ok = {
  ok: true;
  data: {
    sessions: number;
    bots: number;
    distinctUsers: number;
    pagesPerSession: number;
    engagedSessions: number;
    windowDays: number;
  };
};

type Unavailable = {
  ok: true;
  unavailable: true;
  reason: 'missing_env' | 'api_error' | 'timeout' | 'rate_limited';
};

export type ClarityTrafficResult = Ok | Unavailable;

const CLARITY_API_URL = 'https://www.clarity.ms/export-data/api/v1/project-live-insights';
const CACHE_TTL_MS = 5 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;
const cache = new Map<string, { value: ClarityTrafficResult; expiresAt: number }>();

function cacheKey(windowDays: number): string {
  return `clarity:${windowDays}`;
}

function getToken(): string | null {
  const token = process.env.CLARITY_DATA_EXPORT_TOKEN;
  if (!token || token.trim().length === 0) return null;
  return token.trim();
}

function clampWindowDays(rangeKey: Range['key']): number {
  // Clarity Data Export API maximo: 3 dias.
  if (rangeKey === '7d') return 3;
  return 3;
}

type ClarityInformationRow = Record<string, string | number | undefined> & {
  totalSessionCount?: string | number;
  totalBotSessionCount?: string | number;
  distinctUserCount?: string | number;
  pagesPerSessionPercentage?: string | number;
  engagedSessions?: string | number;
};

type ClarityMetric = {
  metricName?: string;
  information?: ClarityInformationRow[];
};

function pickNumber(row: ClarityInformationRow | undefined, ...keys: string[]): number {
  if (!row) return 0;
  for (const key of keys) {
    const raw = row[key];
    if (raw === undefined || raw === null || raw === '') continue;
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

async function fetchClarityLiveInsights(windowDays: number): Promise<ClarityTrafficResult> {
  const token = getToken();
  if (!token) return { ok: true, unavailable: true, reason: 'missing_env' };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const url = `${CLARITY_API_URL}?numOfDays=${windowDays}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
      // Clarity API nao gosta de cache agressivo do fetch; desligamos.
      cache: 'no-store',
    });

    clearTimeout(timeoutId);

    if (response.status === 429) {
      return { ok: true, unavailable: true, reason: 'rate_limited' };
    }
    if (!response.ok) {
      console.error('[metrics-clarity] Clarity API non-2xx', response.status);
      return { ok: true, unavailable: true, reason: 'api_error' };
    }

    const payload = (await response.json()) as ClarityMetric[] | { error?: string };

    if (!Array.isArray(payload)) {
      console.error('[metrics-clarity] Unexpected payload shape', payload);
      return { ok: true, unavailable: true, reason: 'api_error' };
    }

    const trafficMetric = payload.find((m) => m.metricName === 'Traffic');
    const engagementMetric = payload.find((m) => m.metricName === 'EngagementTime');
    const pagesMetric = payload.find((m) => m.metricName === 'PagesPerSession');

    const trafficRow = trafficMetric?.information?.[0];
    const sessions = pickNumber(trafficRow, 'totalSessionCount');
    const bots = pickNumber(trafficRow, 'totalBotSessionCount');
    const distinctUsers = pickNumber(trafficRow, 'distinctUserCount');
    const pagesPerSession = pickNumber(pagesMetric?.information?.[0], 'pagesPerSessionPercentage', 'pagesPerSession');
    const engagedSessions = pickNumber(engagementMetric?.information?.[0], 'engagedSessions', 'totalTime');

    return {
      ok: true,
      data: {
        sessions,
        bots,
        distinctUsers,
        pagesPerSession,
        engagedSessions,
        windowDays,
      },
    };
  } catch (error) {
    clearTimeout(timeoutId);
    const aborted = error instanceof Error && error.name === 'AbortError';
    console.error('[metrics-clarity] fetch failed', error);
    return {
      ok: true,
      unavailable: true,
      reason: aborted ? 'timeout' : 'api_error',
    };
  }
}

export async function getClarityTrafficOverview(range: Range): Promise<ClarityTrafficResult> {
  const windowDays = clampWindowDays(range.key);
  const key = cacheKey(windowDays);
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value;

  const value = await fetchClarityLiveInsights(windowDays);
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}

/** Somente para testes. */
export function __clearMetricsClarityCache() {
  cache.clear();
}
