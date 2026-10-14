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
  { href: '/admin', label: 'Panel', permission: 'admin.access' },
  { href: '/admin/courses', label: 'Cursos', permission: 'courses.read' },
  { href: '/admin/users', label: 'Usuarios', permission: 'users.read' },
  { href: '/admin/stats', label: 'Métricas', permission: 'analytics.read' },
  { href: '/admin/heatmap', label: 'Heatmap', permission: 'analytics.read' },
  { href: '/admin/vouchers', label: 'Vouchers', permission: 'vouchers.read' },
];

export function AdminSidebar({ role }: AdminSidebarProps) {
  const pathname = usePathname();

  const visibleItems = MENU_ITEMS.filter((item) => hasPermission(role, item.permission));

  const navigation = (className: string) => (
      <nav aria-label="Navegación administrativa" className={className}>
        {visibleItems.map((item) => {
          const active =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-11 min-w-0 items-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${
                active
                  ? 'bg-jazz-accent text-jazz-dark'
                  : 'text-jazz-dark hover:bg-muted dark:text-white dark:hover:bg-muted/70'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
  );
  const returnLink = (
        <Link
          href="/dashboard"
          className="flex min-h-11 min-w-0 items-center rounded-lg px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
        >
          ← Volver a la plataforma
        </Link>
  );

  return (
    <aside className="flex w-full min-w-0 shrink-0 flex-col border-b border-border bg-white dark:bg-card lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r">
      <div className="border-b border-border px-4 py-4 lg:px-6 lg:py-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Jazz LMS</p>
        <h2 className="mt-2 break-words text-lg font-bold text-jazz-dark dark:text-white lg:text-xl">Panel de administración</h2>
      </div>
      <details className="p-2 lg:hidden">
        <summary className="min-h-11 cursor-pointer rounded-lg px-4 py-3 text-sm font-medium text-jazz-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary dark:text-white">
          Navegación administrativa
        </summary>
        {navigation('grid grid-cols-2 gap-2 p-2')}
        <div className="p-2">{returnLink}</div>
      </details>
      <div className="hidden lg:block">
        {navigation('space-y-2 p-4')}
      </div>
      <div className="mt-auto hidden px-4 pb-6 lg:block">{returnLink}</div>
    </aside>
  );
}
