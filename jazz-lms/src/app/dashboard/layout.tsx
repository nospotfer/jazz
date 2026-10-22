import { Sidebar } from '@/components/layout/sidebar';
import { PrivateOwnerBoundary } from '@/components/auth/private-owner-boundary';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { getCurrentUser } from '@/lib/admin';
import { isAdminRole } from '@/lib/admin/permissions';
import { redirect } from 'next/navigation';
import { DashboardPreferencesProvider } from '@/components/providers/dashboard-preferences-provider';
import { DashboardPaywallWrapper } from '@/components/dashboard/dashboard-paywall-wrapper';
import { DashboardLocalTestReset } from '@/components/dashboard/dashboard-local-test-reset';
import { DashboardPurchaseAutoReconcile } from '@/components/dashboard/dashboard-purchase-auto-reconcile';
import { CheckoutSessionGuard } from '@/components/dashboard/checkout-session-guard';
import { getServerUser } from '@/lib/server-user';
import { getFirstPublishedCourseSummary, hasAnyCoursePurchase } from '@/lib/dashboard-server-data';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerUser();

  if (!user || !user.email) {
    redirect('/auth');
  }

  const [dbUser, firstCourse, hasPaidCourse] = await Promise.all([
    getCurrentUser(),
    getFirstPublishedCourseSummary(),
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
      <PrivateOwnerBoundary expectedUserId={user.id}>
      <div className="h-[100dvh] overflow-hidden bg-background">
        <DashboardLocalTestReset />
        {process.env.NEXT_PUBLIC_RECOVERY_ACCESS !== 'true' && <CheckoutSessionGuard currentUserId={user.id} />}
        <DashboardPurchaseAutoReconcile />
        <Sidebar currentUserId={user.id} />
        <div className="lg:pl-64 h-full flex flex-col">
          <DashboardHeader user={dashboardHeaderUser} role={role} isAdmin={isAdmin} />
          <main className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-6 lg:p-8 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <DashboardPaywallWrapper
              key={firstCourse?.id ?? 'unavailable-course'}
              hasPaidCourse={hasPaidCourseOrAdmin}
              courseId={firstCourse?.id ?? null}
              coursePrice={firstCourse?.price ?? null}
            >
              {children}
            </DashboardPaywallWrapper>
          </main>
        </div>
      </div>
      </PrivateOwnerBoundary>
    </DashboardPreferencesProvider>
  );
}
