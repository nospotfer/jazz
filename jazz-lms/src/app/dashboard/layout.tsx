import { Sidebar } from '@/components/layout/sidebar';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { createClient } from '@/utils/supabase/server';
import { getCurrentUser } from '@/lib/admin';
import { isAdminRole } from '@/lib/admin/permissions';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import { DashboardPreferencesProvider } from '@/components/providers/dashboard-preferences-provider';
import { DashboardPaywallWrapper } from '@/components/dashboard/dashboard-paywall-wrapper';

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

  const firstCourse = await db.course.findFirst({
    where: { isPublished: true },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });

  const hasPaidCourse = firstCourse
    ? !!(await db.purchase.findUnique({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId: firstCourse.id,
          },
        },
      }))
    : false;

  return (
    <DashboardPreferencesProvider>
      <div className="h-[100dvh] overflow-hidden bg-background">
        <Sidebar />
        <div className="lg:pl-64 h-full flex flex-col">
          <DashboardHeader user={user} role={role} isAdmin={isAdmin} />
          <main className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-6 lg:p-8 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <DashboardPaywallWrapper hasPaidCourse={hasPaidCourse} courseId={firstCourse?.id ?? null}>
              {children}
            </DashboardPaywallWrapper>
          </main>
        </div>
      </div>
    </DashboardPreferencesProvider>
  );
}
