import { db } from '@/lib/db';
import { AnalyticsCard } from '@/components/admin/analytics-card';
import { requirePermission } from '@/lib/admin';
import Link from 'next/link';

export default async function AdminDashboard() {
  await requirePermission('admin.access');

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
    db.purchase.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        course: true,
      },
    }),
  ]);

  const totalRevenue = recentPurchases.reduce((total, purchase) => {
    return total + (purchase.course.price || 0);
  }, 0);

  const publicationRate = totalCourses > 0 ? `${Math.round((publishedCourses / totalCourses) * 100)}%` : '0%';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-jazz-dark dark:text-white">Dashboard Administrativo</h1>
        <p className="mt-1 text-sm text-muted-foreground">Visão geral de cursos, usuários e receita</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticsCard title="Total de Cursos" value={totalCourses} subtitle={`${publishedCourses} publicados`} icon="📚" />
        <AnalyticsCard title="Total de Usuários" value={totalUsers} subtitle="Usuários registrados" icon="👥" />
        <AnalyticsCard title="Total de Vendas" value={totalPurchases} subtitle="Compras concluídas" icon="🛒" />
        <AnalyticsCard title="Taxa de Publicação" value={publicationRate} subtitle="Cursos publicados" icon="📊" />
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-jazz-dark dark:text-white">Compras Recentes</h2>
          <p className="text-sm text-muted-foreground">Receita (5 últimas): R$ {totalRevenue.toFixed(2)}</p>
        </div>

        <div className="divide-y divide-border">
          {recentPurchases.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">Nenhuma compra realizada ainda</p>
            </div>
          ) : (
            recentPurchases.map((purchase) => (
              <div key={purchase.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-jazz-dark dark:text-white">{purchase.course.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">User ID: {purchase.userId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-jazz-accent font-semibold">
                      {purchase.course.price
                        ? `R$ ${purchase.course.price.toFixed(2)}`
                        : 'Grátis'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(purchase.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-jazz-dark dark:text-white mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/admin/courses/new" className="btn-primary text-center">
            ➕ Criar Novo Curso
          </Link>
          <Link href="/admin/users" className="btn-secondary text-center">
            👥 Gerenciar Usuários
          </Link>
          <Link href="/admin/stats" className="btn-secondary text-center">
            📊 Ver Relatórios
          </Link>
        </div>
      </div>
    </div>
  );
}
