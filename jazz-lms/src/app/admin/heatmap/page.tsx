import Link from 'next/link';
import { requirePermission } from '@/lib/admin';

export const dynamic = 'force-dynamic';

const TRACKED_ROUTES = [
  '/ (landing pública)',
  '/auth (login y registro — campos sensibles enmascarados)',
  '/courses, /courses/[id] (catálogo y detalle)',
  '/dashboard (área del estudiante)',
  '/dashboard/courses/[id] (lección/player)',
  '/dashboard/pdf-view, /dashboard/notes (material)',
];

const EXCLUDED_ROUTES = [
  '/admin/* (todo el panel administrativo)',
  '/api/* (endpoints internos)',
  'Campos de contraseña y datos de pago',
];

const PRIVACY_RULES = [
  'Inputs de contraseña son enmascarados por el tracker.',
  'Emails ofuscados (obscureTextEmails: true).',
  'Respeta la cabecera Do Not Track del navegador.',
  'iFrames no son capturados (captureIFrames: false).',
];

function StatusBadge({ status }: { status: 'active' | 'disabled' | 'unconfigured' }) {
  const config = {
    active: {
      label: 'Activo',
      className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    },
    disabled: {
      label: 'Desactivado',
      className: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    },
    unconfigured: {
      label: 'No configurado',
      className: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    },
  }[status];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}

function EnvCheck({ name, present }: { name: string; present: boolean }) {
  return (
    <li className="flex items-center justify-between rounded-md border border-border bg-background/50 px-3 py-2 text-sm">
      <code className="font-mono text-jazz-dark dark:text-white">{name}</code>
      <span aria-label={present ? 'configurado' : 'no configurado'}>
        {present ? (
          <span className="text-emerald-400">✅ configurada</span>
        ) : (
          <span className="text-rose-400">❌ no configurada</span>
        )}
      </span>
    </li>
  );
}

export default async function AdminHeatmapPage() {
  await requirePermission('analytics.read');

  const enabledFlag = process.env.NEXT_PUBLIC_OPENREPLAY_ENABLED === 'true';
  const projectKey = (process.env.NEXT_PUBLIC_OPENREPLAY_PROJECT_KEY ?? '').trim();
  const ingestUrl = (process.env.NEXT_PUBLIC_OPENREPLAY_INGEST_URL ?? '').trim();
  const dashboardUrl = (process.env.NEXT_PUBLIC_OPENREPLAY_DASHBOARD_URL ?? '').trim();

  const hasKey = projectKey.length > 0;
  const status: 'active' | 'disabled' | 'unconfigured' = !hasKey
    ? 'unconfigured'
    : enabledFlag
      ? 'active'
      : 'disabled';

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-[28px] font-bold leading-[40px] text-jazz-dark dark:text-white">
            Heatmap — OpenReplay
          </h1>
          <p className="mt-1 text-[18px] text-muted-foreground">
            Session replay y análisis de comportamiento para las rutas públicas y de estudiantes.
          </p>
        </div>
        <StatusBadge status={status} />
      </header>

      <section className="rounded-xl border border-border bg-white p-5 dark:bg-card">
        <h2 className="mb-3 text-[22px] font-semibold leading-[32px] text-jazz-dark dark:text-white">
          Estado
        </h2>
        {status === 'active' && (
          <p className="text-muted-foreground">
            OpenReplay está activo y registrando sesiones públicas. Las rutas{' '}
            <code>/admin/*</code> y <code>/api/*</code> están excluidas.
          </p>
        )}
        {status === 'disabled' && (
          <p className="text-muted-foreground">
            La integración está configurada pero deshabilitada por la variable{' '}
            <code>NEXT_PUBLIC_OPENREPLAY_ENABLED</code>. Configúrala como <code>true</code> en
            Vercel para empezar a registrar sesiones.
          </p>
        )}
        {status === 'unconfigured' && (
          <p className="text-muted-foreground">
            OpenReplay no está configurado. Define{' '}
            <code>NEXT_PUBLIC_OPENREPLAY_PROJECT_KEY</code> en Vercel para habilitarlo.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-border bg-white p-5 dark:bg-card">
        <h2 className="mb-3 text-[22px] font-semibold leading-[32px] text-jazz-dark dark:text-white">
          Rutas rastreadas
        </h2>
        <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
          {TRACKED_ROUTES.map((route) => (
            <li key={route}>{route}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-border bg-white p-5 dark:bg-card">
        <h2 className="mb-3 text-[22px] font-semibold leading-[32px] text-jazz-dark dark:text-white">
          Rutas excluidas
        </h2>
        <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
          {EXCLUDED_ROUTES.map((route) => (
            <li key={route}>{route}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-border bg-white p-5 dark:bg-card">
        <h2 className="mb-3 text-[22px] font-semibold leading-[32px] text-jazz-dark dark:text-white">
          Privacidad y enmascaramiento
        </h2>
        <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
          {PRIVACY_RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-border bg-white p-5 dark:bg-card">
        <h2 className="mb-3 text-[22px] font-semibold leading-[32px] text-jazz-dark dark:text-white">
          Dashboard de OpenReplay
        </h2>
        {dashboardUrl ? (
          <Link
            href={dashboardUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-md bg-jazz-gold px-4 py-2 text-sm font-medium text-jazz-dark hover:bg-jazz-gold/90"
          >
            Abrir dashboard ↗
          </Link>
        ) : (
          <p className="text-muted-foreground">
            URL del dashboard no configurada. Define{' '}
            <code>NEXT_PUBLIC_OPENREPLAY_DASHBOARD_URL</code> en Vercel para mostrar el enlace
            directo aquí.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-border bg-white p-5 dark:bg-card">
        <h2 className="mb-3 text-[22px] font-semibold leading-[32px] text-jazz-dark dark:text-white">
          Configuración (variables de entorno)
        </h2>
        <ul className="space-y-2">
          <EnvCheck name="NEXT_PUBLIC_OPENREPLAY_ENABLED" present={enabledFlag} />
          <EnvCheck name="NEXT_PUBLIC_OPENREPLAY_PROJECT_KEY" present={hasKey} />
          <EnvCheck name="NEXT_PUBLIC_OPENREPLAY_INGEST_URL" present={ingestUrl.length > 0} />
          <EnvCheck
            name="NEXT_PUBLIC_OPENREPLAY_DASHBOARD_URL"
            present={dashboardUrl.length > 0}
          />
        </ul>
        <p className="mt-3 text-sm text-muted-foreground">
          Tras editar las variables en Vercel, redepliega el proyecto para que el cliente las
          use.
        </p>
      </section>
    </div>
  );
}
