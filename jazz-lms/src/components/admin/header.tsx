import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export async function AdminHeader() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  const email = user.email ?? 'Usuario desconocido';

  return (
    <header className="border-b border-border bg-white/90 dark:bg-card/90 backdrop-blur px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Panel de control</p>
          <h2 className="text-lg font-semibold text-jazz-dark dark:text-white">Área administrativa</h2>
        </div>
        <div className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground">
          {email}
        </div>
      </div>
    </header>
  );
}
