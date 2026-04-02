import { Sidebar } from '@/components/layout/sidebar';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { getCurrentUser } from '@/lib/admin';
import { isAdminRole } from '@/lib/admin/permissions';
import { redirect } from 'next/navigation';
import { DashboardPreferencesProvider } from '@/components/providers/dashboard-preferences-provider';
import { DashboardPaywallWrapper } from '@/components/dashboard/dashboard-paywall-wrapper';
import { DashboardLocalTestReset } from '@/components/dashboard/dashboard-local-test-reset';
import { getServerUser } from '@/lib/server-user';
import { getFirstPublishedCourseId, hasAnyCoursePurchase } from '@/lib/dashboard-server-data';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerUser();

  if (!user || !user.email) {
    redirect('/auth');
  }

  const [dbUser, firstCourseId, hasPaidCourse] = await Promise.all([
    getCurrentUser(),
    getFirstPublishedCourseId(),
    hasAnyCoursePurchase(user.id),
  ]);
  const role = dbUser?.role ?? null;
  const isAdmin = isAdminRole(role);
  const hasPaidCourseOrAdmin = hasPaidCourse || isAdmin;
  const dashboardHeaderUser = {
    id: user.id,
    email: user.email,
    user_metadata: {
      full_name: user.user_metadata?.full_name,
      avatar_mode: user.user_metadata?.avatar_mode,
      avatar_url: user.user_metadata?.avatar_url,
    },
  };

  return (
    <DashboardPreferencesProvider>
      <div className="h-[100dvh] overflow-hidden bg-background">
        <DashboardLocalTestReset />
        <Sidebar />
        <div className="lg:pl-64 h-full flex flex-col">
          <DashboardHeader user={dashboardHeaderUser} role={role} isAdmin={isAdmin} />
          <main className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-6 lg:p-8 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <DashboardPaywallWrapper
              hasPaidCourse={hasPaidCourseOrAdmin}
              courseId={firstCourseId}
            >
              {children}
            </DashboardPaywallWrapper>
          </main>
        </div>
      </div>
    </DashboardPreferencesProvider>
  );
}
