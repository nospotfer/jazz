'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { hasPermission } from '@/lib/admin/permissions';

type AdminSidebarProps = {
  role?: string | null;
};

type MenuItem = {
  href: string;
  label: string;
  permission: Parameters<typeof hasPermission>[1];
};

const MENU_ITEMS: MenuItem[] = [
  { href: '/admin', label: 'Dashboard', permission: 'admin.access' },
  { href: '/admin/courses', label: 'Courses', permission: 'courses.read' },
  { href: '/admin/users', label: 'Users', permission: 'users.read' },
  { href: '/admin/stats', label: 'Analytics', permission: 'analytics.read' },
];

export function AdminSidebar({ role }: AdminSidebarProps) {
  const pathname = usePathname();

  const visibleItems = MENU_ITEMS.filter((item) => hasPermission(role, item.permission));

  return (
    <aside className="w-72 shrink-0 border-r border-border bg-white dark:bg-card min-h-screen">
      <div className="px-6 py-6 border-b border-border">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Jazz LMS</p>
        <h1 className="mt-2 text-xl font-bold text-jazz-dark dark:text-white">Admin Dashboard</h1>
      </div>
      <nav className="p-4 space-y-2">
        {visibleItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-jazz-accent text-white'
                  : 'text-jazz-dark hover:bg-muted dark:text-white dark:hover:bg-muted/70'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 mt-auto pb-6">
        <Link
          href="/dashboard"
          className="block rounded-lg px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
        >
          ← Back to platform
        </Link>
      </div>
    </aside>
  );
}
