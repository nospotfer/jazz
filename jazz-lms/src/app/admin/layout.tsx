import { requireAdmin } from '@/lib/admin';
import { getCurrentUser } from '@/lib/admin';
import { AdminSidebar } from '@/components/admin/sidebar';
import { AdminHeader } from '@/components/admin/header';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-jazz-light dark:bg-jazz-dark">
      <div className="flex min-h-screen">
        <AdminSidebar role={user?.role} />
        <div className="flex-1 min-w-0">
          <AdminHeader />
          <main className="p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
