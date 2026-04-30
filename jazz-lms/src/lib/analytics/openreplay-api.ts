/**
 * OpenReplay REST API client (server-side only) — v2.
 *
 * Configuração (env vars server-side, NÃO usar NEXT_PUBLIC_):
 *   OPENREPLAY_API_KEY      — Organization API Key (Preferences → Account)
 *   OPENREPLAY_PROJECT_ID   — id numérico do projeto (ex.: 16692)
 *   OPENREPLAY_API_URL      — opcional, default https://api.openreplay.com
 *
 * A API pública v2 não expõe agregados de sessões cross-user; apenas:
 *   - lista de projetos
 *   - busca de usuários do projeto (com total)
 *   - sessões de um usuário específico
 * Por isso os widgets agregam o que é factível com esses endpoints.
 */

import 'server-only';

type ProjectInfo = {
  projectId: number;
  projectKey: string;
  name: string;
  platform?: string;
  sampleRate?: number;
  saveRequestPayloads?: boolean;
};

type UserRow = {
  $user_id?: string;
  $email?: string;
  $name?: string;
  $country?: string;
  $last_seen?: number;
  $first_event_at?: number;
};

export type WidgetData = {
  ok: boolean;
  reason?: 'unconfigured' | 'fetch_failed';
  project: ProjectInfo | null;
  totalUsers: number;
  trend: Array<{ label: string; count: number }>;
  topUsers: Array<{ label: string; count: number; sub?: string }>;
  topCountries: Array<{ label: string; count: number }>;
  windowDays: number;
};

const EMPTY = (
  reason: WidgetData['reason'] | undefined,
  windowDays: number,
): WidgetData => ({
  ok: !reason,
  reason,
  project: null,
  totalUsers: 0,
  trend: [],
  topUsers: [],
  topCountries: [],
  windowDays,
});

function getConfig() {
  const apiKey = (process.env.OPENREPLAY_API_KEY ?? '').trim();
  const projectId = (process.env.OPENREPLAY_PROJECT_ID ?? '').trim();
  const apiUrl = (process.env.OPENREPLAY_API_URL ?? 'https://api.openreplay.com').trim();
  if (!apiKey || !projectId) return null;
  return { apiKey, projectId: Number(projectId), apiUrl };
}

export function isOpenReplayApiConfigured(): boolean {
  return getConfig() !== null;
}

async function v2<T>(
  path: string,
  init?: RequestInit & { body?: string },
): Promise<T | null> {
  const cfg = getConfig();
  if (!cfg) return null;
  try {
    const res = await fetch(`${cfg.apiUrl}/v2${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${cfg.apiKey}`,
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
      next: { revalidate: 900 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: T };
    return (json.data ?? null) as T | null;
  } catch {
    return null;
  }
}

async function getProject(): Promise<ProjectInfo | null> {
  const cfg = getConfig();
  if (!cfg) return null;
  const list = await v2<ProjectInfo[]>('/public/projects', { method: 'GET' });
  if (!list) return null;
  return list.find((p) => p.projectId === cfg.projectId) ?? list[0] ?? null;
}

type UsersSearchResponse = { total: number; users: UserRow[] };

async function searchUsers(
  projectKey: string,
  body: Record<string, unknown>,
): Promise<UsersSearchResponse | null> {
  return v2<UsersSearchResponse>(`/public/${projectKey}/users`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function getOpenReplayWidgetData(windowDays = 7): Promise<WidgetData> {
  if (!isOpenReplayApiConfigured()) return EMPTY('unconfigured', windowDays);

  const project = await getProject();
  if (!project) return EMPTY('fetch_failed', windowDays);

  const endTs = Date.now();
  const startTs = endTs - windowDays * 86_400_000;

  // Busca principal: até 200 usuários ativos na janela.
  // sortBy/columns têm validação restrita na API; deixamos default.
  const main = await searchUsers(project.projectKey, {
    startTimestamp: startTs,
    endTimestamp: endTs,
    limit: 200,
    page: 1,
    sortOrder: 'desc',
  });

  if (!main) {
    // Conexão até a API ok (project foi obtido), mas users falhou.
    return { ...EMPTY(undefined, windowDays), project, ok: true };
  }

  const users = main.users ?? [];
  const totalUsers = main.total ?? users.length;

  // Top usuários (até 5)
  const topUsers = users.slice(0, 5).map((u) => {
    const id = u.$user_id ?? u.$email ?? '(anónimo)';
    const sub = u.$last_seen
      ? new Date(u.$last_seen).toLocaleString('es-ES', {
          dateStyle: 'short',
          timeStyle: 'short',
        })
      : undefined;
    return { label: id, count: 1, sub };
  });

  // Top países
  const countryMap = new Map<string, number>();
  for (const u of users) {
    const c = (u.$country ?? '').trim() || '—';
    countryMap.set(c, (countryMap.get(c) ?? 0) + 1);
  }
  const topCountries = Array.from(countryMap.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Tendência: usuários ativos por dia (uma chamada por dia, só lê o total).
  // Em janelas grandes seria caro; com 7 dias e revalidate=900 fica ok.
  const trend: WidgetData['trend'] = [];
  for (let i = windowDays - 1; i >= 0; i--) {
    const dayEnd = new Date();
    dayEnd.setHours(23, 59, 59, 999);
    dayEnd.setDate(dayEnd.getDate() - i);
    const dayStart = new Date(dayEnd);
    dayStart.setHours(0, 0, 0, 0);

    const day = await searchUsers(project.projectKey, {
      startTimestamp: dayStart.getTime(),
      endTimestamp: dayEnd.getTime(),
      limit: 1,
      page: 1,
    });
    trend.push({
      label: `${dayStart.getMonth() + 1}/${dayStart.getDate()}`,
      count: day?.total ?? 0,
    });
  }

  return {
    ok: true,
    project,
    totalUsers,
    trend,
    topUsers,
    topCountries,
    windowDays,
  };
}
