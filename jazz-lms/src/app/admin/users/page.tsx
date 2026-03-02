import { db } from '@/lib/db';
import { requirePermission } from '@/lib/admin';

export default async function AdminUsersPage() {
  await requirePermission('users.read');

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

  // Agrupar compras por usuario
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
        <h1 className="text-3xl font-bold text-jazz-dark dark:text-white">Gestión de usuarios</h1>
        <p className="text-sm text-muted-foreground mt-1">Visualiza cuentas, roles e historial de compras</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="text-3xl mb-2">👥</div>
          <div className="text-3xl font-bold text-jazz-accent">{users.length}</div>
          <div className="text-sm text-muted-foreground mt-1">Total de usuarios</div>
        </div>
        <div className="card">
          <div className="text-3xl mb-2">🔑</div>
          <div className="text-3xl font-bold text-jazz-accent">{users.filter((u) => u.role !== 'USER').length}</div>
          <div className="text-sm text-muted-foreground mt-1">Perfiles administrativos</div>
        </div>
        <div className="card">
          <div className="text-3xl mb-2">📚</div>
          <div className="text-3xl font-bold text-jazz-accent">{users.filter((u) => u.role === 'USER').length}</div>
          <div className="text-sm text-muted-foreground mt-1">Usuarios regulares</div>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-muted/40">
          <h2 className="text-xl font-bold text-jazz-dark dark:text-white">Todos los usuarios</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Cursos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Registro
                </th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    Aún no hay usuarios registrados
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const userCourses = userPurchases[user.id] || [];
                  return (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-jazz-dark dark:text-white font-medium">{user.email}</div>
                        <div className="text-xs text-muted-foreground">{user.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.role === 'USER' ? (
                          <span className="badge-warning">USER</span>
                        ) : (
                          <span className="badge-success">{user.role}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {userCourses.length} curso{userCourses.length !== 1 ? 's' : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString('es-ES')}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border border-jazz-accent/30 bg-jazz-accent/10 p-4">
        <h3 className="text-jazz-dark dark:text-white font-semibold mb-1">Acceso del propietario</h3>
        <p className="text-sm text-muted-foreground">
          El panel administrativo está bloqueado para el correo del propietario definido en ADMIN_OWNER_EMAIL.
        </p>
      </div>
    </div>
  );
}
