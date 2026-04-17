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
} from '@/lib/admin/metrics-db';
import { getTrafficOverview } from '@/lib/admin/metrics-ga';
import { KpiCard } from '@/components/admin/analytics/kpi-card';
import { PeriodFilter } from '@/components/admin/analytics/period-filter';
import { RevenueChart } from '@/components/admin/analytics/revenue-chart';
import { EnrollmentsChart } from '@/components/admin/analytics/enrollments-chart';
import { CompletionChart } from '@/components/admin/analytics/completion-chart';
import { EmptyState } from '@/components/admin/analytics/empty-state';

export const dynamic = 'force-dynamic';
export const revalidate = 300;

const RANGE_LABELS: Record<RangeKey, string> = {
  '7d': 'últimos 7 dias',
  '30d': 'últimos 30 dias',
  '90d': 'últimos 90 dias',
  '12m': 'últimos 12 meses',
};

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });
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

  const hasAnyRevenue = revenue.some((r) => r.value > 0);
  const hasAnyEnrollments = enrollments.some((e) => e.total > 0);
  const hasAnyCompletion = completion.length > 0;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-[28px] font-bold leading-[40px] text-jazz-dark dark:text-white">
            Painel de Métricas
          </h1>
          <p className="mt-1 text-[18px] text-muted-foreground">
            Como está o Jazz LMS nos {RANGE_LABELS[rangeKey]}.
          </p>
        </div>
        <PeriodFilter current={rangeKey} />
      </header>

      <section
        aria-label="Indicadores principais"
        className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4"
      >
        <KpiCard
          label="Receita total"
          value={overview.revenue.value}
          format="currency"
          delta={overview.revenue.delta}
          icon="💰"
        />
        <KpiCard
          label="Matrículas"
          value={overview.enrollments.value}
          format="number"
          delta={overview.enrollments.delta}
          icon="🎟️"
        />
        <KpiCard
          label="Ticket médio"
          value={overview.averageTicket.value}
          format="currency"
          delta={overview.averageTicket.delta}
          icon="💳"
        />
        <KpiCard
          label="Novos alunos"
          value={overview.newStudents.value}
          format="number"
          delta={overview.newStudents.delta}
          icon="👤"
        />
        <KpiCard
          label="Taxa de conclusão"
          value={overview.completionRate.value}
          format="percent"
          delta={overview.completionRate.delta}
          icon="🎯"
        />
        <KpiCard
          label="Vouchers resgatados"
          value={overview.vouchersRedeemed.value}
          format="number"
          delta={overview.vouchersRedeemed.delta}
          icon="🏷️"
        />
        <KpiCard
          label="Medalhas conquistadas"
          value={overview.medalsEarned.value}
          format="number"
          delta={overview.medalsEarned.delta}
          icon="🏅"
        />
        {'unavailable' in traffic ? (
          <KpiCard
            label="Sessões no site"
            value={0}
            format="number"
            delta={null}
            icon="🌐"
            unavailable={{ reason: 'Integração com Google Analytics não configurada.' }}
          />
        ) : (
          <KpiCard
            label="Sessões no site"
            value={traffic.data.sessions}
            format="number"
            delta={null}
            icon="🌐"
          />
        )}
      </section>

      <section
        aria-labelledby="grafico-receita"
        className="rounded-xl border border-border bg-white p-5 dark:bg-card"
      >
        <h2
          id="grafico-receita"
          className="mb-3 text-[22px] font-semibold leading-[32px] text-jazz-dark dark:text-white"
        >
          Receita por{' '}
          {range.granularity === 'day' ? 'dia' : range.granularity === 'week' ? 'semana' : 'mês'}
        </h2>
        {hasAnyRevenue ? (
          <RevenueChart
            data={revenue.map((r) => ({ bucket: r.bucket, revenue: r.value }))}
            ariaLabel={`Receita ao longo dos ${RANGE_LABELS[rangeKey]}`}
          />
        ) : (
          <EmptyState
            title="Nenhuma receita no período"
            description="Selecione um período maior ou volte após novas matrículas."
          />
        )}
      </section>

      <section
        aria-labelledby="grafico-matriculas"
        className="rounded-xl border border-border bg-white p-5 dark:bg-card"
      >
        <h2
          id="grafico-matriculas"
          className="mb-3 text-[22px] font-semibold leading-[32px] text-jazz-dark dark:text-white"
        >
          Matrículas (pagas × vouchers)
        </h2>
        {hasAnyEnrollments ? (
          <EnrollmentsChart
            data={enrollments}
            ariaLabel={`Matrículas pagas e por voucher nos ${RANGE_LABELS[rangeKey]}`}
          />
        ) : (
          <EmptyState
            title="Nenhuma matrícula no período"
            description="Os dados aparecerão aqui a partir da primeira matrícula no intervalo escolhido."
          />
        )}
      </section>

      <section
        aria-labelledby="grafico-conclusao"
        className="rounded-xl border border-border bg-white p-5 dark:bg-card"
      >
        <h2
          id="grafico-conclusao"
          className="mb-3 text-[22px] font-semibold leading-[32px] text-jazz-dark dark:text-white"
        >
          Conclusão por curso
        </h2>
        {hasAnyCompletion ? (
          <CompletionChart
            data={completion}
            ariaLabel="Top cursos por taxa de conclusão no período"
          />
        ) : (
          <EmptyState
            title="Sem dados de conclusão"
            description="Não há progresso registrado nos cursos para o período selecionado."
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
            Top cursos no período
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-muted/30 text-[15px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Curso</th>
                <th className="px-5 py-3">Iniciadas</th>
                <th className="px-5 py-3">Concluídas</th>
                <th className="px-5 py-3">Conclusão</th>
              </tr>
            </thead>
            <tbody>
              {completion.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-6 text-center text-[17px] text-muted-foreground">
                    Nenhum curso com atividade no período.
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
                    <td className="px-5 py-3">{row.startedCount.toLocaleString('pt-BR')}</td>
                    <td className="px-5 py-3">{row.completedCount.toLocaleString('pt-BR')}</td>
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
        Receita apresentada em BRL. Ticket médio exclui matrículas gratuitas (vouchers 100%). Dados
        atualizados a cada 5 minutos. Receita total no período:{' '}
        <strong>{formatCurrency(overview.revenue.value)}</strong>.
      </footer>
    </div>
  );
}
