import { requirePermission } from '@/lib/admin';
import {
  getClarityLiveInsights,
  parseClarityDimensions,
  type ClarityExportDimension,
  type ClarityExportMetric,
  type ClarityExportRow,
} from '@/lib/admin/clarity-live-insights';
import { ClarityMirrorControls } from '@/components/admin/analytics/clarity-mirror-controls';
import { EmptyState } from '@/components/admin/analytics/empty-state';

export const dynamic = 'force-dynamic';
export const revalidate = 300;

const CLARITY_PROJECT_ID = 'wgmaqx3k1n';
const MAX_TABLE_ROWS = 30;

function normalizeWindowDays(value: string | undefined): 1 | 2 | 3 {
  if (value === '1') return 1;
  if (value === '2') return 2;
  return 3;
}

function parseNumeric(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function formatNumber(value: number, key?: string): string {
  const lowerKey = (key || '').toLowerCase();
  if (lowerKey.includes('percentage') || lowerKey.includes('rate')) {
    return `${value.toLocaleString('es-ES', { maximumFractionDigits: 2 })}%`;
  }

  return value.toLocaleString('es-ES', {
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  });
}

function normalizeMetricName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function findMetric(metrics: ClarityExportMetric[], name: string): ClarityExportMetric | null {
  const target = normalizeMetricName(name);
  return metrics.find((metric) => normalizeMetricName(metric.metricName) === target) ?? null;
}

function getTotalFromMetric(metric: ClarityExportMetric | null, preferredKeys: string[]): number {
  if (!metric || metric.information.length === 0) return 0;
  const row = metric.information[0];

  for (const key of preferredKeys) {
    const value = parseNumeric(row[key]);
    if (value !== null) return value;
  }

  for (const [key, rawValue] of Object.entries(row)) {
    if (key.toLowerCase().includes('count') || key.toLowerCase().includes('session')) {
      const value = parseNumeric(rawValue);
      if (value !== null) return value;
    }
  }

  return 0;
}

function buildColumns(rows: ClarityExportRow[], dimensions: ClarityExportDimension[]): {
  dimensions: string[];
  numeric: string[];
} {
  const dimensionColumns = dimensions.filter((dimension) =>
    rows.some((row) => row[dimension] !== undefined && String(row[dimension]).trim() !== ''),
  );

  const dimensionSet = new Set<string>(dimensionColumns);
  const numericSet = new Set<string>();

  rows.forEach((row) => {
    Object.entries(row).forEach(([key, value]) => {
      if (dimensionSet.has(key)) return;
      if (parseNumeric(value) !== null) {
        numericSet.add(key);
      }
    });
  });

  return {
    dimensions: dimensionColumns,
    numeric: Array.from(numericSet).slice(0, 8),
  };
}

export default async function AdminHeatmapPage({
  searchParams,
}: {
  searchParams?: Promise<{
    numOfDays?: string;
    d1?: string;
    d2?: string;
    d3?: string;
  }>;
}) {
  await requirePermission('analytics.read');

  const params = (await searchParams) ?? {};
  const windowDays = normalizeWindowDays(params.numOfDays);
  const dimensions = parseClarityDimensions([params.d1, params.d2, params.d3]);
  const effectiveDimensions = dimensions.length > 0 ? dimensions : (['URL'] as ClarityExportDimension[]);

  const insights = await getClarityLiveInsights({
    windowDays,
    dimensions: effectiveDimensions,
  });

  const isUnavailable = 'unavailable' in insights;
  const metrics = isUnavailable ? [] : insights.data.metrics;

  const trafficMetric = findMetric(metrics, 'Traffic');
  const engagementMetric = findMetric(metrics, 'Engagement Time');
  const pagesPerSessionMetric = findMetric(metrics, 'Pages Per Session');

  const sessions = getTotalFromMetric(trafficMetric, ['totalSessionCount']);
  const bots = getTotalFromMetric(trafficMetric, ['totalBotSessionCount']);
  const distinctUsers = getTotalFromMetric(trafficMetric, ['distinctUserCount', 'distantUserCount']);
  const engagedSessions = getTotalFromMetric(engagementMetric, ['engagedSessions']);
  const pagesPerSession = getTotalFromMetric(pagesPerSessionMetric, ['pagesPerSession', 'pagesPerSessionPercentage']);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-[28px] font-bold leading-[40px] text-jazz-dark dark:text-white">
          Heatmap Mirror — Microsoft Clarity
        </h1>
        <p className="mt-1 text-[18px] text-muted-foreground">
          Vista interna dentro del Jazz LMS con los datos reales exportados por Clarity
          para no salir del panel.
        </p>
      </header>

      <ClarityMirrorControls
        currentWindowDays={windowDays}
        currentDimensions={effectiveDimensions}
      />

      <section
        aria-label="Resumen en vivo"
        className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4"
      >
        <div className="rounded-xl border border-border bg-white p-5 dark:bg-card">
          <p className="text-[15px] text-muted-foreground">Sesiones</p>
          <p className="mt-2 text-[28px] font-bold text-jazz-dark dark:text-white">
            {isUnavailable ? '—' : formatNumber(sessions)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white p-5 dark:bg-card">
          <p className="text-[15px] text-muted-foreground">Usuarios únicos</p>
          <p className="mt-2 text-[28px] font-bold text-jazz-dark dark:text-white">
            {isUnavailable ? '—' : formatNumber(distinctUsers)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white p-5 dark:bg-card">
          <p className="text-[15px] text-muted-foreground">Sesiones de bot</p>
          <p className="mt-2 text-[28px] font-bold text-jazz-dark dark:text-white">
            {isUnavailable ? '—' : formatNumber(bots)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white p-5 dark:bg-card">
          <p className="text-[15px] text-muted-foreground">Sesiones con engagement</p>
          <p className="mt-2 text-[28px] font-bold text-jazz-dark dark:text-white">
            {isUnavailable ? '—' : formatNumber(engagedSessions)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white p-5 dark:bg-card">
          <p className="text-[15px] text-muted-foreground">Páginas por sesión</p>
          <p className="mt-2 text-[28px] font-bold text-jazz-dark dark:text-white">
            {isUnavailable ? '—' : formatNumber(pagesPerSession, 'pagesPerSession')}
          </p>
        </div>
      </section>

      {isUnavailable ? (
        <section
          aria-label="Estado de la integración"
          className="rounded-xl border border-yellow-300 bg-yellow-50 p-5 text-[15px] text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-200"
        >
          <p className="font-semibold">Integración con Clarity no disponible</p>
          <p className="mt-1">
            {insights.reason === 'missing_env'
              ? 'Falta la variable CLARITY_DATA_EXPORT_TOKEN en Vercel.'
              : insights.reason === 'rate_limited'
                ? 'Se alcanzó el límite diario de la API de Clarity (10 llamadas/día). Los datos vuelven mañana.'
                : 'No se pudieron obtener los datos en vivo desde Clarity para esta vista interna.'}
          </p>
        </section>
      ) : (
        <section className="space-y-6" aria-label="Métricas detalladas de Clarity">
          {metrics.length === 0 ? (
            <EmptyState
              title="Sin métricas exportables"
              description="Clarity no devolvió datos para esta combinación de ventana y dimensiones."
            />
          ) : (
            metrics.map((metric) => {
              const rows = metric.information.slice(0, MAX_TABLE_ROWS);
              const columns = buildColumns(rows, effectiveDimensions);

              return (
                <article
                  key={metric.metricName}
                  className="rounded-xl border border-border bg-white dark:bg-card"
                >
                  <header className="border-b border-border px-5 py-4">
                    <h2 className="text-[20px] font-semibold text-jazz-dark dark:text-white">
                      {metric.metricName}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Top {rows.length} filas exportadas por Clarity.
                    </p>
                  </header>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                        <tr>
                          {columns.dimensions.map((dimension) => (
                            <th key={dimension} className="px-4 py-3 font-semibold">
                              {dimension}
                            </th>
                          ))}
                          {columns.numeric.map((column) => (
                            <th key={column} className="px-4 py-3 font-semibold">
                              {column}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.length === 0 ? (
                          <tr>
                            <td
                              colSpan={Math.max(1, columns.dimensions.length + columns.numeric.length)}
                              className="px-4 py-5 text-sm text-muted-foreground"
                            >
                              Sin filas para esta métrica.
                            </td>
                          </tr>
                        ) : (
                          rows.map((row, index) => (
                            <tr key={`${metric.metricName}-${index}`} className="border-t border-border/70 text-sm">
                              {columns.dimensions.map((dimension) => (
                                <td key={dimension} className="px-4 py-3 align-top text-foreground">
                                  {String(row[dimension] ?? '—')}
                                </td>
                              ))}
                              {columns.numeric.map((column) => {
                                const value = parseNumeric(row[column]);
                                return (
                                  <td key={column} className="px-4 py-3 align-top font-medium text-jazz-dark dark:text-white">
                                    {value === null ? '—' : formatNumber(value, column)}
                                  </td>
                                );
                              })}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </article>
              );
            })
          )}
        </section>
      )}

      <section
        aria-label="Cómo interpretar los datos"
        className="rounded-xl border border-border bg-white p-5 text-[15px] text-muted-foreground dark:bg-card"
      >
        <h2 className="mb-2 text-[18px] font-semibold text-jazz-dark dark:text-white">
          Notas de este mirror interno
        </h2>
        <ul className="list-inside list-disc space-y-1">
          <li>
            Proyecto conectado: <span className="font-mono">{CLARITY_PROJECT_ID}</span>.
          </li>
          <li>
            Datos 100% reales desde Clarity Data Export API con un máximo de 3 días
            y hasta 10 solicitudes por día.
          </li>
          <li>
            Esta página muestra métricas y desgloses exportables por dimensiones.
            Los datos están cacheados por 5 minutos para evitar límites de cuota.
          </li>
        </ul>

        {!isUnavailable ? (
          <details className="mt-4 rounded-md border border-border bg-background/50 p-3">
            <summary className="cursor-pointer text-sm font-semibold text-jazz-dark dark:text-white">
              Ver payload JSON crudo (idéntico a la exportación)
            </summary>
            <pre className="mt-3 max-h-[360px] overflow-auto rounded-md bg-black/90 p-3 text-xs text-green-300">
              {JSON.stringify(
                {
                  windowDays,
                  dimensions: effectiveDimensions,
                  fetchedAt: insights.data.fetchedAt,
                  metrics: insights.data.metrics,
                },
                null,
                2,
              )}
            </pre>
          </details>
        ) : null}
      </section>
    </div>
  );
}
