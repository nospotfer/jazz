import { Sidebar } from '@/components/layout/sidebar';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { createClient } from '@/utils/supabase/server';
import { getCurrentUser } from '@/lib/admin';
import { isAdminRole } from '@/lib/admin/permissions';
import { redirect } from 'next/navigation';
import { DashboardPreferencesProvider } from '@/components/providers/dashboard-preferences-provider';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  const dbUser = await getCurrentUser();
  const role = dbUser?.role ?? null;
  const isAdmin = isAdminRole(role);

  return (
    <DashboardPreferencesProvider>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <div className="lg:pl-64">
          <DashboardHeader user={user} role={role} isAdmin={isAdmin} />
          <main className="p-3 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </DashboardPreferencesProvider>
  );
}
