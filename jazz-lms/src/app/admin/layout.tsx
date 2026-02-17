import { requireAdmin } from '@/lib/admin';
import Link from 'next/link';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/admin" className="text-xl font-bold text-yellow-500">
                🔐 Admin Intranet
              </Link>
              <div className="flex space-x-4">
                <Link
                  href="/admin"
                  className="text-gray-600 dark:text-gray-300 hover:text-yellow-500 transition px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/courses"
                  className="text-gray-600 dark:text-gray-300 hover:text-yellow-500 transition px-3 py-2 rounded-md text-sm font-medium"
                >
                  Cursos
                </Link>
                <Link
                  href="/admin/users"
                  className="text-gray-600 dark:text-gray-300 hover:text-yellow-500 transition px-3 py-2 rounded-md text-sm font-medium"
                >
                  Usuários
                </Link>
                <Link
                  href="/admin/stats"
                  className="text-gray-600 dark:text-gray-300 hover:text-yellow-500 transition px-3 py-2 rounded-md text-sm font-medium"
                >
                  Estatísticas
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition text-sm"
              >
                ← Voltar ao Site
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
