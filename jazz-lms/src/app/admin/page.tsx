import { db } from '@/lib/db';
import { AnalyticsCard } from '@/components/admin/analytics-card';
import { can, requirePermission } from '@/lib/admin';
import Link from 'next/link';

function getRecordedAmount(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : null;
}

const amountFormatter = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default async function AdminDashboard() {
  await requirePermission('admin.access');
  const canReadFinancialRecords = await can('analytics.read');

  const [
    totalCourses,
    totalUsers,
    totalPurchases,
    publishedCourses,
    recentPurchases,
  ] = await Promise.all([
    db.course.count(),
    db.user.count(),
    db.purchase.count(),
    db.course.count({ where: { isPublished: true } }),
    canReadFinancialRecords ? db.purchase.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        createdAt: true,
        finalPrice: true,
        course: { select: { title: true } },
      },
    }) : Promise.resolve([]),
  ]);

  const purchaseRecords = recentPurchases.map((purchase) => ({
    purchase,
    recordedAmount: getRecordedAmount(purchase.finalPrice),
  }));
  const knownAmounts = purchaseRecords
    .map(({ recordedAmount }) => recordedAmount)
    .filter((amount): amount is number => amount !== null);
  const knownTotal = knownAmounts.reduce((total, amount) => total + amount, 0);
  const unavailableCount = purchaseRecords.length - knownAmounts.length;
  const knownSummary = knownAmounts.length === 0
    ? 'Sin importes conocidos'
    : Number.isFinite(knownTotal)
      ? amountFormatter.format(knownTotal)
      : 'Suma no disponible';

  const publicationRate = totalCourses > 0 ? `${Math.round((publishedCourses / totalCourses) * 100)}%` : '0%';

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h1 className="break-words text-2xl font-bold text-jazz-dark dark:text-white sm:text-3xl">Panel administrativo</h1>
        <p className="mt-1 text-sm text-muted-foreground">Vista general de cursos, usuarios y compras registradas</p>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 sm:gap-6">
        <AnalyticsCard title="Total de cursos" value={totalCourses} subtitle={`${publishedCourses} publicados`} icon="📚" />
        <AnalyticsCard title="Total de usuarios" value={totalUsers} subtitle="Usuarios registrados" icon="👥" />
        <AnalyticsCard title="Registros de compra" value={totalPurchases} subtitle="Incluye accesos gratuitos" icon="🛒" />
        <AnalyticsCard title="Tasa de publicación" value={publicationRate} subtitle="Cursos publicados" icon="📊" />
      </div>

      {canReadFinancialRecords && <div className="card min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h2 className="text-lg font-semibold text-jazz-dark dark:text-white">Compras recientes</h2>
          <div className="min-w-0 max-w-full break-words text-sm text-muted-foreground">
            <p>Suma conocida (últimos 5 registros): {knownSummary}</p>
            <p>{unavailableCount} {unavailableCount === 1 ? 'importe no disponible' : 'importes no disponibles'}</p>
          </div>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">Moneda e impuestos no verificados.</p>

        <div className="divide-y divide-border">
          {recentPurchases.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">Aún no se ha realizado ninguna compra</p>
            </div>
          ) : (
            purchaseRecords.map(({ purchase, recordedAmount }) => (
              <div key={purchase.id} className="min-w-0 py-4 first:pt-0 last:pb-0">
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="break-words font-semibold text-jazz-dark dark:text-white">{purchase.course.title}</h3>
                    <p className="mt-1 break-all text-sm text-muted-foreground">ID de usuario: {purchase.userId}</p>
                  </div>
                  <div className="min-w-0 max-w-full sm:text-right">
                    <p className="break-words text-jazz-accent font-semibold">
                      Importe registrado: {recordedAmount === null ? 'No disponible' : amountFormatter.format(recordedAmount)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(purchase.createdAt).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>}

      <div className="card min-w-0">
        <h2 className="text-lg font-semibold text-jazz-dark dark:text-white mb-4">Acciones rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/admin/courses/new" className="btn-primary flex min-h-11 min-w-0 items-center justify-center text-center">
            ➕ Crear nuevo curso
          </Link>
          <Link href="/admin/users" className="btn-secondary flex min-h-11 min-w-0 items-center justify-center text-center">
            👥 Gestionar usuarios
          </Link>
          <Link href="/admin/stats" className="btn-secondary flex min-h-11 min-w-0 items-center justify-center text-center">
            📊 Ver informes
          </Link>
        </div>
      </div>
    </div>
  );
}
