import { requirePermission } from '@/lib/admin';
import { getClarityTrafficOverview } from '@/lib/admin/metrics-clarity';
import { resolveRange } from '@/lib/admin/metrics-db';

export const dynamic = 'force-dynamic';
export const revalidate = 300;

const CLARITY_PROJECT_ID = 'wgmaqx3k1n';
const CLARITY_DASHBOARD_URL = `https://clarity.microsoft.com/projects/view/${CLARITY_PROJECT_ID}`;

function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-ES').format(Math.round(value));
}

export default async function AdminHeatmapPage() {
  await requirePermission('analytics.read');

  // Usamos 7d como janela nominal — o clamp do Clarity restringe para 3 dias.
  const range = resolveRange('7d');
  const traffic = await getClarityTrafficOverview(range);

  const isUnavailable = 'unavailable' in traffic;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-[28px] font-bold leading-[40px] text-jazz-dark dark:text-white">
          Heatmap — Microsoft Clarity
        </h1>
        <p className="mt-1 text-[18px] text-muted-foreground">
          Grabaciones de sesión y mapas de calor de toda el área pública del sitio
          (la administración está excluida por diseño).
        </p>
      </header>

      <section
        aria-label="Acceso al panel de Clarity"
        className="rounded-xl border border-border bg-white p-6 dark:bg-card"
      >
        <h2 className="text-[22px] font-semibold leading-[32px] text-jazz-dark dark:text-white">
          Panel oficial de Clarity
        </h2>
        <p className="mt-2 text-[16px] text-muted-foreground">
          El dashboard completo — heatmaps, grabaciones, insights, filtros — vive
          en clarity.microsoft.com. Usa la cuenta Microsoft vinculada al proyecto
          <span className="mx-1 font-mono text-[15px]">{CLARITY_PROJECT_ID}</span>
          para iniciar sesión.
        </p>
        <div className="mt-4">
          <a
            href={CLARITY_DASHBOARD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[48px] items-center gap-2 rounded-md bg-jazz-accent px-5 text-[17px] font-semibold text-jazz-dark transition hover:bg-jazz-accent/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-jazz-accent focus-visible:ring-offset-2"
          >
            <span aria-hidden="true">🔥</span>
            Abrir Clarity en una nueva pestaña
          </a>
        </div>
      </section>

      <section
        aria-label="Resumen en vivo"
        className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4"
      >
        <div className="rounded-xl border border-border bg-white p-5 dark:bg-card">
          <p className="text-[15px] text-muted-foreground">Sesiones (últimos 3 días)</p>
          <p className="mt-2 text-[28px] font-bold text-jazz-dark dark:text-white">
            {isUnavailable ? '—' : formatNumber(traffic.data.sessions)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white p-5 dark:bg-card">
          <p className="text-[15px] text-muted-foreground">Usuarios únicos</p>
          <p className="mt-2 text-[28px] font-bold text-jazz-dark dark:text-white">
            {isUnavailable ? '—' : formatNumber(traffic.data.distinctUsers)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white p-5 dark:bg-card">
          <p className="text-[15px] text-muted-foreground">Sesiones de bot</p>
          <p className="mt-2 text-[28px] font-bold text-jazz-dark dark:text-white">
            {isUnavailable ? '—' : formatNumber(traffic.data.bots)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white p-5 dark:bg-card">
          <p className="text-[15px] text-muted-foreground">Sesiones con engagement</p>
          <p className="mt-2 text-[28px] font-bold text-jazz-dark dark:text-white">
            {isUnavailable ? '—' : formatNumber(traffic.data.engagedSessions)}
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
            {traffic.reason === 'missing_env'
              ? 'Falta la variable CLARITY_DATA_EXPORT_TOKEN en Vercel.'
              : traffic.reason === 'rate_limited'
                ? 'Se alcanzó el límite diario de la API de Clarity (10 llamadas/día). Los datos vuelven mañana.'
                : 'No se pudieron obtener los datos en vivo desde Clarity. El panel oficial sigue disponible.'}
          </p>
        </section>
      ) : null}

      <section
        aria-label="Cómo interpretar los datos"
        className="rounded-xl border border-border bg-white p-5 text-[15px] text-muted-foreground dark:bg-card"
      >
        <h2 className="mb-2 text-[18px] font-semibold text-jazz-dark dark:text-white">
          Notas sobre los datos
        </h2>
        <ul className="list-inside list-disc space-y-1">
          <li>
            La API de Clarity Data Export expone como máximo los últimos 3 días y
            permite 10 solicitudes diarias.
          </li>
          <li>
            El área <span className="font-mono">/admin</span> del sitio está
            excluida del script — las métricas reflejan sólo al público real.
          </li>
          <li>
            Para grabaciones y heatmaps visuales entra en el panel oficial con el
            botón de arriba.
          </li>
        </ul>
      </section>
    </div>
  );
}
