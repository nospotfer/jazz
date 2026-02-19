import { db } from '@/lib/db';
import { requirePermission } from '@/lib/admin';

export default async function AdminStatsPage() {
  await requirePermission('analytics.read');

  const [courses, purchases, users, userProgress] = await Promise.all([
    db.course.findMany({
      include: {
        chapters: {
          include: {
            lessons: true,
          },
        },
        purchases: true,
      },
    }),
    db.purchase.findMany({
      include: {
        course: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
    db.user.findMany(),
    db.userProgress.findMany(),
  ]);

  // Calcular receita total
  const totalRevenue = purchases.reduce((acc, purchase) => {
    return acc + (purchase.course.price || 0);
  }, 0);

  // Curso mais vendido
  const courseSales = purchases.reduce((acc, purchase) => {
    const courseId = purchase.courseId;
    if (!acc[courseId]) {
      acc[courseId] = {
        course: purchase.course,
        count: 0,
        revenue: 0,
      };
    }
    acc[courseId].count += 1;
    acc[courseId].revenue += purchase.course.price || 0;
    return acc;
  }, {} as Record<string, { course: any; count: number; revenue: number }>);

  const topCourses = Object.values(courseSales)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Taxa de conclusão
  const totalLessons = courses.reduce((acc, course) => {
    return (
      acc +
      course.chapters.reduce((chAcc, chapter) => chAcc + chapter.lessons.length, 0)
    );
  }, 0);

  const completedLessons = userProgress.filter((p) => p.isCompleted).length;
  const completionRate = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  // Vendas por mês (últimos 6 meses)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const salesByMonth = purchases
    .filter((p) => new Date(p.createdAt) >= sixMonthsAgo)
    .reduce((acc, purchase) => {
      const month = new Date(purchase.createdAt).toLocaleDateString('pt-BR', {
        month: 'short',
        year: 'numeric',
      });
      if (!acc[month]) {
        acc[month] = { count: 0, revenue: 0 };
      }
      acc[month].count += 1;
      acc[month].revenue += purchase.course.price || 0;
      return acc;
    }, {} as Record<string, { count: number; revenue: number }>);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-jazz-dark dark:text-white mb-2">Estatísticas e Relatórios</h1>
        <p className="text-muted-foreground">Análise detalhada do desempenho da plataforma</p>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card border-t-green-500">
          <div className="text-3xl mb-2">💰</div>
          <div className="text-3xl font-bold text-green-600">
            R$ {totalRevenue.toFixed(2)}
          </div>
          <div className="text-muted-foreground text-sm mt-1">Receita Total</div>
        </div>

        <div className="card border-t-blue-500">
          <div className="text-3xl mb-2">🛒</div>
          <div className="text-3xl font-bold text-blue-600">{purchases.length}</div>
          <div className="text-muted-foreground text-sm mt-1">Total de Vendas</div>
        </div>

        <div className="card border-t-purple-500">
          <div className="text-3xl mb-2">📊</div>
          <div className="text-3xl font-bold text-purple-600">
            {completionRate.toFixed(1)}%
          </div>
          <div className="text-muted-foreground text-sm mt-1">Taxa de Conclusão</div>
        </div>

        <div className="card">
          <div className="text-3xl mb-2">✅</div>
          <div className="text-3xl font-bold text-jazz-accent">{completedLessons}</div>
          <div className="text-muted-foreground text-sm mt-1">Lições Completadas</div>
        </div>
      </div>

      {/* Top Cursos */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Top 5 Cursos Mais Vendidos</h2>
        </div>
        <div className="p-6">
          {topCourses.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">Nenhuma venda realizada ainda</p>
          ) : (
            <div className="space-y-4">
              {topCourses.map((item, index) => (
                <div
                  key={item.course.id}
                  className="flex items-center justify-between bg-gray-100 dark:bg-gray-800/50 rounded-lg p-4 hover:bg-gray-200 dark:hover:bg-gray-800 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold text-yellow-500">#{index + 1}</div>
                    <div>
                      <h3 className="text-gray-900 dark:text-white font-semibold">{item.course.title}</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">{item.count} vendas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-bold">
                      R$ {item.revenue.toFixed(2)}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 text-sm">receita</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Vendas por Mês */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Vendas dos Últimos 6 Meses</h2>
        </div>
        <div className="p-6">
          {Object.keys(salesByMonth).length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              Nenhuma venda nos últimos 6 meses
            </p>
          ) : (
            <div className="space-y-3">
              {Object.entries(salesByMonth).map(([month, data]) => (
                <div
                  key={month}
                  className="flex items-center justify-between bg-gray-100 dark:bg-gray-800/50 rounded-lg p-4"
                >
                  <div className="font-semibold text-gray-900 dark:text-white capitalize">{month}</div>
                  <div className="flex items-center gap-6">
                    <div className="text-gray-500 dark:text-gray-400">
                      <span className="text-gray-900 dark:text-white font-semibold">{data.count}</span> vendas
                    </div>
                    <div className="text-green-400 font-bold">
                      R$ {data.revenue.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">📚 Resumo de Cursos</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>Total de cursos:</span>
              <span className="text-gray-900 dark:text-white font-semibold">{courses.length}</span>
            </div>
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>Cursos publicados:</span>
              <span className="text-gray-900 dark:text-white font-semibold">
                {courses.filter((c) => c.isPublished).length}
              </span>
            </div>
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>Total de lições:</span>
              <span className="text-gray-900 dark:text-white font-semibold">{totalLessons}</span>
            </div>
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>Ticket médio:</span>
              <span className="text-gray-900 dark:text-white font-semibold">
                R${' '}
                {purchases.length > 0 ? (totalRevenue / purchases.length).toFixed(2) : '0.00'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">👥 Resumo de Usuários</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>Total de usuários:</span>
              <span className="text-gray-900 dark:text-white font-semibold">{users.length}</span>
            </div>
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>Administradores:</span>
              <span className="text-gray-900 dark:text-white font-semibold">
                {users.filter((u) => u.role !== 'USER').length}
              </span>
            </div>
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>Usuários ativos:</span>
              <span className="text-gray-900 dark:text-white font-semibold">
                {new Set(purchases.map((p) => p.userId)).size}
              </span>
            </div>
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>Taxa de conversão:</span>
              <span className="text-gray-900 dark:text-white font-semibold">
                {users.length > 0
                  ? ((new Set(purchases.map((p) => p.userId)).size / users.length) * 100).toFixed(
                      1
                    )
                  : '0'}
                %
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
