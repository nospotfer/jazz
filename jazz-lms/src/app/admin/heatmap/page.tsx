import Link from 'next/link';
import { requirePermission } from '@/lib/admin';
import {
  getOpenReplayWidgetData,
  isOpenReplayApiConfigured,
  type WidgetData,
} from '@/lib/analytics/openreplay-api';

export const dynamic = 'force-dynamic';

const WINDOW_DAYS = 7;

function buildWidgetUrl(dashboardUrl: string, path: string): string {
  if (!dashboardUrl) return '';
  try {
    const base = new URL(dashboardUrl);
    const existing = base.pathname.replace(/\/$/, '');
    base.pathname = `${existing}${path}`;
    return base.toString();
  } catch {
    return dashboardUrl;
  }
}

function maxCount(items: Array<{ count: number }>): number {
  return items.reduce((acc, item) => Math.max(acc, item.count), 0);
}

function BarRow({
  label,
  count,
  max,
  sub,
}: {
  label: string;
  count: number;
  max: number;
  sub?: string;
}) {
  const pct = max > 0 ? Math.max(2, Math.round((count / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <p
          className="truncate text-sm text-jazz-dark dark:text-white"
          title={label}
        >
          {label}
        </p>
        {sub ? (
          <p className="truncate text-[11px] text-muted-foreground">{sub}</p>
        ) : null}
      </div>
      <div className="relative h-2 w-24 overflow-hidden rounded-full bg-muted">
        <div
          className="absolute inset-y-0 left-0 bg-jazz-gold"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 text-right text-sm font-medium text-jazz-dark dark:text-white">
        {count}
      </span>
    </div>
  );
}

function TrendChart({ data }: { data: WidgetData['trend'] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin datos suficientes.</p>;
  }
  const max = maxCount(data);
  return (
    <div className="flex h-32 items-end gap-1">
      {data.map((point) => {
        const h = max > 0 ? Math.max(4, Math.round((point.count / max) * 100)) : 4;
        return (
          <div
            key={point.label}
            className="flex flex-1 flex-col items-center gap-1"
            title={`${point.label}: ${point.count}`}
          >
            <div
              className="w-full rounded-sm bg-jazz-gold transition-all"
              style={{ height: `${h}%` }}
            />
            <span className="text-[10px] text-muted-foreground">{point.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function ListWidget({
  items,
  emptyLabel,
}: {
  items: Array<{ label: string; count: number; sub?: string }>;
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }
  const max = maxCount(items);
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <BarRow
          key={item.label}
          label={item.label}
          count={item.count}
          max={max}
          sub={item.sub}
        />
      ))}
    </div>
  );
}

function WidgetCard({
  title,
  icon,
  children,
  deepLink,
  deepLinkLabel = 'Ver detalle ↗',
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  deepLink?: string;
  deepLinkLabel?: string;
}) {
  return (
    <article className="flex flex-col gap-3 rounded-xl border border-border bg-white p-5 dark:bg-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span aria-hidden className="text-xl">
            {icon}
          </span>
          <h3 className="text-[18px] font-semibold text-jazz-dark dark:text-white">{title}</h3>
        </div>
        {deepLink ? (
          <Link
            href={deepLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-jazz-gold hover:underline"
          >
            {deepLinkLabel}
          </Link>
        ) : null}
      </div>
      <div className="flex-1">{children}</div>
    </article>
  );
}

export default async function AdminHeatmapPage() {
  await requirePermission('analytics.read');

  const dashboardUrl = (process.env.NEXT_PUBLIC_OPENREPLAY_DASHBOARD_URL ?? '').trim();
  const apiConfigured = isOpenReplayApiConfigured();
  const data = await getOpenReplayWidgetData(WINDOW_DAYS);
  const fetchFailed = apiConfigured && data.reason === 'fetch_failed';
  const noActivityYet = data.ok && data.totalUsers === 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-[28px] font-bold leading-[40px] text-jazz-dark dark:text-white">
            Heatmap & Analytics
          </h1>
          <p className="mt-1 text-[16px] text-muted-foreground">
            Datos en tiempo real de OpenReplay (últimos {WINDOW_DAYS} días).
          </p>
        </div>
        {dashboardUrl ? (
          <Link
            href={dashboardUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-md bg-jazz-gold px-4 py-2 text-sm font-medium text-jazz-dark hover:bg-jazz-gold/90"
          >
            Abrir panel completo ↗
          </Link>
        ) : null}
      </header>

      {!apiConfigured ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-200">
          <p className="font-semibold">Datos en vivo no disponibles todavía.</p>
          <p className="mt-1 text-amber-100/90">
            Configura en Vercel: <code>OPENREPLAY_API_KEY</code> (Organization API Key) y{' '}
            <code>OPENREPLAY_PROJECT_ID</code>. Luego redespliega.
          </p>
        </div>
      ) : null}

      {fetchFailed ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-200">
          <p className="font-semibold">No se pudieron cargar los datos de OpenReplay.</p>
          <p className="mt-1">
            Verifica que la API Key sea una Organization API Key válida y que el proyecto{' '}
            <code>{process.env.OPENREPLAY_PROJECT_ID}</code> exista.
          </p>
        </div>
      ) : null}

      {!fetchFailed && noActivityYet ? (
        <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-5 text-sm text-sky-100">
          <p className="font-semibold">Aún no hay sesiones grabadas.</p>
          <p className="mt-1">
            El tracker está activo, pero todavía ningún visitante ha generado una sesión completa
            en este proyecto. Las métricas se llenarán automáticamente en cuanto haya tráfico.
          </p>
        </div>
      ) : null}

      <section aria-label="Resumen" className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-white p-5 dark:bg-card">
          <p className="text-sm text-muted-foreground">
            Usuarios únicos ({WINDOW_DAYS} días)
          </p>
          <p className="mt-1 text-[36px] font-bold leading-none text-jazz-dark dark:text-white">
            {data.totalUsers}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white p-5 dark:bg-card">
          <p className="text-sm text-muted-foreground">Proyecto</p>
          <p className="mt-1 truncate text-lg font-semibold text-jazz-dark dark:text-white">
            {data.project?.name ?? '—'}
          </p>
          <p className="text-xs text-muted-foreground">
            ID {data.project?.projectId ?? '—'} · {data.project?.platform ?? '—'}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white p-5 dark:bg-card">
          <p className="text-sm text-muted-foreground">Sample rate</p>
          <p className="mt-1 text-[24px] font-bold text-jazz-dark dark:text-white">
            {data.project?.sampleRate ?? 0}%
          </p>
          <p className="text-xs text-muted-foreground">
            Payloads: {data.project?.saveRequestPayloads ? 'sí' : 'no'}
          </p>
        </div>
      </section>

      <section aria-label="Widgets" className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <WidgetCard
          title="Tendencia de usuarios"
          icon="📈"
          deepLink={buildWidgetUrl(dashboardUrl, '/metrics')}
        >
          <TrendChart data={data.trend} />
        </WidgetCard>

        <WidgetCard
          title="Embudo de conversión"
          icon="🔻"
          deepLink={buildWidgetUrl(dashboardUrl, '/funnels')}
          deepLinkLabel="Configurar ↗"
        >
          <p className="text-sm text-muted-foreground">
            Define los pasos del embudo en OpenReplay y los datos aparecerán aquí.
          </p>
        </WidgetCard>

        <WidgetCard
          title="Mapas de calor"
          icon="🔥"
          deepLink={buildWidgetUrl(dashboardUrl, '/heatmaps')}
          deepLinkLabel="Ver heatmaps ↗"
        >
          <p className="text-sm text-muted-foreground">
            Los mapas de calor se generan por página individual en el panel de OpenReplay.
          </p>
        </WidgetCard>

        <WidgetCard
          title="Países principales"
          icon="🌍"
          deepLink={buildWidgetUrl(dashboardUrl, '/metrics')}
        >
          <ListWidget items={data.topCountries} emptyLabel="Sin datos suficientes." />
        </WidgetCard>

        <WidgetCard
          title="Usuarios recientes"
          icon="👥"
          deepLink={buildWidgetUrl(dashboardUrl, '/metrics')}
        >
          <ListWidget items={data.topUsers} emptyLabel="Sin datos suficientes." />
        </WidgetCard>

        <WidgetCard
          title="Sesiones activas"
          icon="🎬"
          deepLink={dashboardUrl}
          deepLinkLabel="Ver sesiones ↗"
        >
          <p className="text-sm text-muted-foreground">
            La API pública de OpenReplay no expone listado agregado de sesiones. Abre el panel
            para ver y reproducir sesiones individuales.
          </p>
        </WidgetCard>
      </section>
    </div>
  );
}
