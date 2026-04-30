/**
 * OpenReplay REST API client (server-side only).
 *
 * Lê dados reais do projeto OpenReplay para renderizar widgets dentro do
 * próprio admin (sem precisar abrir o painel externo).
 *
 * Configuração (env vars server-side, NÃO usar NEXT_PUBLIC_):
 *   OPENREPLAY_API_KEY      — Organization API Key (Preferences → Account)
 *   OPENREPLAY_PROJECT_ID   — id numérico do projeto (ex.: 16692)
 *   OPENREPLAY_API_URL      — opcional, default https://api.openreplay.com
 *
 * Falha sempre fail-safe: retorna `null` ou estrutura vazia em qualquer erro.
 */

import 'server-only';

type Session = {
  sessionID?: string;
  userID?: string | null;
  userBrowser?: string | null;
  userOs?: string | null;
  userDevice?: string | null;
  userCountry?: string | null;
  startTs?: number;
  duration?: number;
  pagesCount?: number;
  eventsCount?: number;
  errorsCount?: number;
};

export type WidgetData = {
  ok: boolean;
  reason?: 'unconfigured' | 'fetch_failed';
  trend: Array<{ label: string; count: number }>;
  topPages: Array<{ label: string; count: number }>;
  topUsers: Array<{ label: string; count: number }>;
  topBrowsers: Array<{ label: string; count: number }>;
  totalSessions: number;
  windowDays: number;
};

const EMPTY_DATA = (
  reason: 'unconfigured' | 'fetch_failed',
  windowDays: number,
): WidgetData => ({
  ok: false,
  reason,
  trend: [],
  topPages: [],
  topUsers: [],
  topBrowsers: [],
  totalSessions: 0,
  windowDays,
});

function getConfig() {
  const apiKey = (process.env.OPENREPLAY_API_KEY ?? '').trim();
  const projectId = (process.env.OPENREPLAY_PROJECT_ID ?? '').trim();
  const apiUrl = (process.env.OPENREPLAY_API_URL ?? 'https://api.openreplay.com').trim();
  if (!apiKey || !projectId) return null;
  return { apiKey, projectId, apiUrl };
}

export function isOpenReplayApiConfigured(): boolean {
  return getConfig() !== null;
}

async function fetchSessions(windowDays: number): Promise<Session[] | null> {
  const cfg = getConfig();
  if (!cfg) return null;

  const endTs = Date.now();
  const startTs = endTs - windowDays * 24 * 60 * 60 * 1000;

  // OpenReplay search endpoint. Página única com limite alto: suficiente
  // para sites pequenos. Em volumes maiores, paginar.
  const url = `${cfg.apiUrl}/api/v1/${cfg.projectId}/sessions/search`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: cfg.apiKey,
      },
      body: JSON.stringify({
        startTimestamp: startTs,
        endTimestamp: endTs,
        limit: 200,
        page: 1,
        sort: 'startTs',
        order: 'desc',
      }),
      // Cache curto a nível de fetch do Next; layer de cache acima também aplica
      next: { revalidate: 300 },
    });

    if (!res.ok) return null;
    const data = (await res.json()) as { sessions?: Session[]; data?: Session[] } | Session[];
    if (Array.isArray(data)) return data;
    return data.sessions ?? data.data ?? [];
  } catch {
    return null;
  }
}

function aggregate(sessions: Session[], windowDays: number): WidgetData {
  // Trend (sessões por dia)
  const trendMap = new Map<string, number>();
  const today = new Date();
  for (let i = windowDays - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(5, 10); // MM-DD
    trendMap.set(key, 0);
  }
  for (const s of sessions) {
    if (!s.startTs) continue;
    const d = new Date(s.startTs);
    const key = d.toISOString().slice(5, 10);
    if (trendMap.has(key)) trendMap.set(key, (trendMap.get(key) ?? 0) + 1);
  }
  const trend = Array.from(trendMap.entries()).map(([label, count]) => ({ label, count }));

  // Top users (usa userID quando presente; senão "Anónimo")
  const userCounts = new Map<string, number>();
  for (const s of sessions) {
    const key = s.userID && s.userID.trim() ? s.userID : 'Anónimo';
    userCounts.set(key, (userCounts.get(key) ?? 0) + 1);
  }
  const topUsers = Array.from(userCounts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Top browsers
  const browserCounts = new Map<string, number>();
  for (const s of sessions) {
    const key = (s.userBrowser ?? 'Desconocido').trim() || 'Desconocido';
    browserCounts.set(key, (browserCounts.get(key) ?? 0) + 1);
  }
  const topBrowsers = Array.from(browserCounts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Top pages: a API de sessions não traz URLs por sessão sem expansão.
  // Como aproximação inicial, usamos pagesCount agregado por SO/dispositivo.
  // Quando o usuário ativar a API de pageviews ou cards, trocamos por dados reais.
  const deviceCounts = new Map<string, number>();
  for (const s of sessions) {
    const key = (s.userDevice ?? 'desktop').toString();
    deviceCounts.set(key, (deviceCounts.get(key) ?? 0) + (s.pagesCount ?? 1));
  }
  const topPages = Array.from(deviceCounts.entries())
    .map(([label, count]) => ({ label: `Páginas en ${label}`, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    ok: true,
    trend,
    topPages,
    topUsers,
    topBrowsers,
    totalSessions: sessions.length,
    windowDays,
  };
}

/**
 * Busca dados reais agregados para os widgets.
 * Janela default: 7 dias.
 */
export async function getOpenReplayWidgetData(windowDays = 7): Promise<WidgetData> {
  if (!isOpenReplayApiConfigured()) return EMPTY_DATA('unconfigured', windowDays);
  const sessions = await fetchSessions(windowDays);
  if (sessions === null) return EMPTY_DATA('fetch_failed', windowDays);
  return aggregate(sessions, windowDays);
}
