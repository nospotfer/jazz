import { db } from '@/lib/db';
import Link from 'next/link';

export default async function AdminDashboard() {
  // Estatísticas gerais
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

  const stats = [
    {
      title: 'Total de Cursos',
      value: totalCourses,
      subtitle: `${publishedCourses} publicados`,
      icon: '📚',
      link: '/admin/courses',
    },
    {
      title: 'Total de Usuários',
      value: totalUsers,
      subtitle: 'Usuários registrados',
      icon: '👥',
      link: '/admin/users',
    },
    {
      title: 'Total de Vendas',
      value: totalPurchases,
      subtitle: 'Compras realizadas',
      icon: '💰',
      link: '/admin/stats',
    },
    {
      title: 'Taxa de Publicação',
      value: totalCourses > 0 ? `${Math.round((publishedCourses / totalCourses) * 100)}%` : '0%',
      subtitle: 'Cursos publicados',
      icon: '📊',
      link: '/admin/courses',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Dashboard Administrativo</h1>
        <p className="text-gray-500 dark:text-gray-400">Visão geral do sistema e estatísticas principais</p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Link
            key={index}
            href={stat.link}
            className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800 hover:border-yellow-500 transition-all hover:shadow-lg hover:shadow-yellow-500/10"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-4xl">{stat.icon}</span>
              <span className="text-3xl font-bold text-yellow-500">
                {stat.value}
              </span>
            </div>
            <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-1">{stat.title}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{stat.subtitle}</p>
          </Link>
        ))}
      </div>

      {/* Compras Recentes */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Compras Recentes</h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {recentPurchases.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">Nenhuma compra realizada ainda</p>
            </div>
          ) : (
            recentPurchases.map((purchase) => (
              <div key={purchase.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-gray-900 dark:text-white font-semibold">{purchase.course.title}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">User ID: {purchase.userId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-yellow-500 font-semibold">
                      {purchase.course.price
                        ? `R$ ${purchase.course.price.toFixed(2)}`
                        : 'Grátis'}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                      {new Date(purchase.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/courses/new"
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-3 px-6 rounded-lg transition text-center"
          >
            ➕ Criar Novo Curso
          </Link>
          <Link
            href="/admin/users"
            className="bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold py-3 px-6 rounded-lg transition text-center border border-gray-300 dark:border-gray-700"
          >
            👥 Gerenciar Usuários
          </Link>
          <Link
            href="/admin/stats"
            className="bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold py-3 px-6 rounded-lg transition text-center border border-gray-300 dark:border-gray-700"
          >
            📊 Ver Relatórios
          </Link>
        </div>
      </div>
    </div>
  );
}
