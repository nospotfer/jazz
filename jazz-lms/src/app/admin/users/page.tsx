import { db } from '@/lib/db';

export default async function AdminUsersPage() {
  const users = await db.user.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });

  const purchases = await db.purchase.findMany({
    include: {
      course: true,
    },
  });

  // Agrupar compras por usuário
  const userPurchases = purchases.reduce((acc, purchase) => {
    if (!acc[purchase.userId]) {
      acc[purchase.userId] = [];
    }
    acc[purchase.userId].push(purchase);
    return acc;
  }, {} as Record<string, typeof purchases>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Gerenciamento de Usuários</h1>
        <p className="text-gray-500 dark:text-gray-400">Visualize e gerencie todos os usuários da plataforma</p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <div className="text-3xl mb-2">👥</div>
          <div className="text-3xl font-bold text-yellow-500">{users.length}</div>
          <div className="text-gray-500 dark:text-gray-400 text-sm mt-1">Total de Usuários</div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <div className="text-3xl mb-2">🔑</div>
          <div className="text-3xl font-bold text-yellow-500">
            {users.filter((u) => u.role === 'ADMIN').length}
          </div>
          <div className="text-gray-500 dark:text-gray-400 text-sm mt-1">Administradores</div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <div className="text-3xl mb-2">📚</div>
          <div className="text-3xl font-bold text-yellow-500">
            {users.filter((u) => u.role === 'USER').length}
          </div>
          <div className="text-gray-500 dark:text-gray-400 text-sm mt-1">Usuários Regulares</div>
        </div>
      </div>

      {/* Lista de Usuários */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Todos os Usuários</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cursos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cadastro
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    Nenhum usuário cadastrado ainda
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const userCourses = userPurchases[user.id] || [];
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white font-medium">{user.email}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{user.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.role === 'ADMIN' ? (
                          <span className="bg-yellow-500/20 text-yellow-400 text-xs font-semibold px-3 py-1 rounded-full">
                            🔑 ADMIN
                          </span>
                        ) : (
                          <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold px-3 py-1 rounded-full">
                            👤 USER
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {userCourses.length} curso{userCourses.length !== 1 ? 's' : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Informação importante */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="text-yellow-500 font-semibold mb-1">Gerenciamento de Roles</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Para promover um usuário a admin, você precisa atualizar o campo 'role' diretamente no banco de dados.
              Use o Prisma Studio ou execute: <code className="bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">npx prisma studio</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
