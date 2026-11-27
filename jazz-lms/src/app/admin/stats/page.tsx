import Link from 'next/link';
import { requirePermission } from '@/lib/admin';
import {
  getCompletionByCourse,
  getEnrollmentsTimeseries,
  getOverview,
  getRevenueTimeseries,
  isRangeKey,
  resolveRange,
  type RangeKey,
  type CurrencyMetric,
} from '@/lib/admin/metrics-db';
import { formatPaymentAmount } from '@/lib/payment-money';
import { getTrafficOverview } from '@/lib/admin/metrics-ga';
import { KpiCard } from '@/components/admin/analytics/kpi-card';
import { PeriodFilter } from '@/components/admin/analytics/period-filter';
import { RefreshMetricsButton } from '@/components/admin/analytics/refresh-metrics-button';
import { RevenueChart } from '@/components/admin/analytics/revenue-chart';
import { EnrollmentsChart } from '@/components/admin/analytics/enrollments-chart';
import { CompletionChart } from '@/components/admin/analytics/completion-chart';
import { EmptyState } from '@/components/admin/analytics/empty-state';

export const dynamic = 'force-dynamic';
export const revalidate = 300;

const RANGE_LABELS: Record<RangeKey, string> = {
  '7d': 'últimos 7 días',
  '30d': 'últimos 30 días',
  '60d': 'últimos 60 días',
  '90d': 'últimos 90 días',
  '12m': 'últimos 12 meses',
};

function CurrencyMetricCards({ label, metric, icon }: { label: string; metric: CurrencyMetric; icon: string }) {
  if (metric.byCurrency.length === 0) return <KpiCard label={label} value={0} format="number" delta={null} icon={icon}
    unavailable={{ reason: 'Sin importes con moneda verificada en este período.' }} />;
  return metric.byCurrency.map((total) => <KpiCard key={total.currency} label={`${label} (${total.currency})`}
    value={0} format="number" delta={total.delta} icon={icon}
    comparisonUnavailable={total.comparisonUnavailable}
    formattedValue={formatPaymentAmount(total.amountMinor, total.currency, 'es-ES') ?? 'No disponible'} />);
}

export default async function AdminStatsPage({
  searchParams,
}: {
  searchParams?: Promise<{ range?: string }>;
}) {
  await requirePermission('analytics.read');

  const params = (await searchParams) ?? {};
  const rangeKey: RangeKey = isRangeKey(params.range) ? params.range : '30d';
  const range = resolveRange(rangeKey);

  const [overview, revenue, enrollments, completion, traffic] = await Promise.all([
    getOverview(range),
    getRevenueTimeseries(range),
    getEnrollmentsTimeseries(range),
    getCompletionByCourse(range),
    getTrafficOverview(range),
  ]);

  const hasAnyEnrollments = enrollments.some((e) => e.total > 0);
  const hasAnyCompletion = completion.length > 0;

  return (
    <div className="min-w-0 space-y-8">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-[28px] font-bold leading-[40px] text-jazz-dark dark:text-white">
            Panel de Métricas
          </h1>
          <p className="mt-1 text-[18px] text-muted-foreground">
            Cómo está el Jazz LMS en los {RANGE_LABELS[rangeKey]}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <PeriodFilter current={rangeKey} />
          <RefreshMetricsButton />
        </div>
      </header>

      <section
        aria-label="Indicadores principales"
        className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4"
      >
        <CurrencyMetricCards label="Cobros registrados" metric={overview.revenue} icon="💰" />
        <KpiCard
          label="Inscripciones"
          value={overview.enrollments.value}
          format="number"
          delta={overview.enrollments.delta}
          icon="🎟️"
        />
        <CurrencyMetricCards label="Ticket promedio" metric={overview.averageTicket} icon="💳" />
        <KpiCard
          label="Nuevos estudiantes"
          value={overview.newStudents.value}
          format="number"
          delta={overview.newStudents.delta}
          icon="👤"
        />
        <KpiCard
          label="Tasa de finalización"
          value={overview.completionRate.value}
          format="percent"
          delta={overview.completionRate.delta}
          icon="🎯"
        />
        <KpiCard
          label="Cupones canjeados"
          value={overview.vouchersRedeemed.value}
          format="number"
          delta={overview.vouchersRedeemed.delta}
          icon="🏷️"
        />
        <KpiCard
          label="Medallas conseguidas"
          value={overview.medalsEarned.value}
          format="number"
          delta={overview.medalsEarned.delta}
          icon="🏅"
        />
        {'unavailable' in traffic ? (
          <KpiCard
            label="Sesiones en el sitio"
            value={0}
            format="number"
            delta={null}
            icon="🌐"
            unavailable={{
              reason:
                traffic.reason === 'missing_env'
                  ? 'GA4 no configurado (faltan GA4_PROPERTY_ID, GA4_SERVICE_ACCOUNT_EMAIL o GA4_PRIVATE_KEY).'
                  : traffic.reason === 'timeout'
                    ? 'GA4: tiempo de espera agotado. Intenta más tarde.'
                    : 'No se pudo obtener datos de GA4.',
            }}
          />
        ) : (
          <KpiCard
            label="Sesiones en el sitio"
            value={traffic.data.sessions}
            format="number"
            delta={null}
            icon="🌐"
          />
        )}
      </section>

      <section
        aria-labelledby="grafico-ingresos"
        className="rounded-xl border border-border bg-white p-5 dark:bg-card"
      >
        <h2
          id="grafico-ingresos"
          className="mb-3 text-[22px] font-semibold leading-[32px] text-jazz-dark dark:text-white"
        >
          Cobros registrados por{' '}
          {range.granularity === 'day' ? 'día' : range.granularity === 'week' ? 'semana' : 'mes'}
        </h2>
        {revenue.series.length > 0 ? (
          revenue.series.map((series) => <div key={series.currency} className="mt-5 min-w-0">
            <h3 className="font-semibold">{series.currency}</h3>
            {series.points.every((point) => point.value !== null) ? <RevenueChart
              currency={series.currency}
              data={series.points.map((point) => ({ bucket: point.bucket, revenue: point.value! }))}
              ariaLabel={`Cobros en ${series.currency} a lo largo de los ${RANGE_LABELS[rangeKey]}`}
            /> : <p className="text-muted-foreground">Gráfico no disponible: el importe supera la precisión numérica del gráfico. El total exacto se muestra arriba.</p>}
          </div>)
        ) : (
          <EmptyState
            title="Sin cobros con moneda verificada en el período"
            description="Los registros sin importe o moneda verificados se excluyen de los totales."
          />
        )}
      </section>

      <section
        aria-labelledby="grafico-inscripciones"
        className="rounded-xl border border-border bg-white p-5 dark:bg-card"
      >
        <h2
          id="grafico-inscripciones"
          className="mb-3 text-[22px] font-semibold leading-[32px] text-jazz-dark dark:text-white"
        >
          Inscripciones (pagadas × cupones)
        </h2>
        {hasAnyEnrollments ? (
          <EnrollmentsChart
            data={enrollments}
            ariaLabel={`Inscripciones pagadas y por cupón en los ${RANGE_LABELS[rangeKey]}`}
          />
        ) : (
          <EmptyState
            title="Sin inscripciones en el período"
            description="Los datos aparecerán aquí a partir de la primera inscripción en el intervalo elegido."
          />
        )}
      </section>

      <section
        aria-labelledby="grafico-finalizacion"
        className="rounded-xl border border-border bg-white p-5 dark:bg-card"
      >
        <h2
          id="grafico-finalizacion"
          className="mb-3 text-[22px] font-semibold leading-[32px] text-jazz-dark dark:text-white"
        >
          Finalización por curso
        </h2>
        {hasAnyCompletion ? (
          <CompletionChart
            data={completion}
            ariaLabel="Cursos destacados por tasa de finalización en el período"
          />
        ) : (
          <EmptyState
            title="Sin datos de finalización"
            description="No hay progreso registrado en los cursos para el período seleccionado."
          />
        )}
      </section>

      <section
        aria-labelledby="tabela-top-cursos"
        className="rounded-xl border border-border bg-white dark:bg-card"
      >
        <div className="border-b border-border px-5 py-4">
          <h2
            id="tabela-top-cursos"
            className="text-[22px] font-semibold leading-[32px] text-jazz-dark dark:text-white"
          >
            Cursos destacados del período
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-muted/30 text-[15px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Curso</th>
                <th className="px-5 py-3">Iniciadas</th>
                <th className="px-5 py-3">Completadas</th>
                <th className="px-5 py-3">Finalización</th>
              </tr>
            </thead>
            <tbody>
              {completion.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-6 text-center text-[17px] text-muted-foreground">
                    Ningún curso con actividad en el período.
                  </td>
                </tr>
              ) : (
                completion.map((row) => (
                  <tr key={row.courseId} className="border-t border-border text-[17px]">
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/courses`}
                        className="text-jazz-dark hover:underline dark:text-white"
                      >
                        {row.courseTitle}
                      </Link>
                    </td>
                    <td className="px-5 py-3">{row.startedCount.toLocaleString('es-ES')}</td>
                    <td className="px-5 py-3">{row.completedCount.toLocaleString('es-ES')}</td>
                    <td className="px-5 py-3 font-semibold">
                      {Math.round(row.completionRate * 100)}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="pt-4 text-[14px] text-muted-foreground">
        Totales separados por moneda, sin conversión. {overview.revenue.unavailableCount} registros excluidos
        por falta de importe o moneda verificados. Son importes cobrados, sin desglose de impuestos o reembolsos.
        El ticket promedio excluye importes cero y se redondea a la unidad mínima de cada moneda.
        Datos actualizados cada 5 minutos.
      </footer>
    </div>
  );
}
