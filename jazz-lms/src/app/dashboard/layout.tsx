import { Sidebar } from '@/components/layout/sidebar';
import { DashboardHeader } from '@/components/layout/dashboard-header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Mock user for development (no Supabase auth check)
  const mockUser = {
    id: 'dev-user',
    email: 'user@jazzculture.com',
    user_metadata: {
      full_name: 'Jazz Student',
      avatar_url: '',
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-64">
        <DashboardHeader user={mockUser} />
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
