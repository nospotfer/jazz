import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/lib/db';
import { hasPermission, type Permission } from '@/lib/admin/permissions';

const OWNER_EMAIL = process.env.ADMIN_OWNER_EMAIL || 'admin@neurofactory.net';

export async function ensureAdminApiPermission(permission: Permission) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, error: 'Unauthorized', message: 'Nao autorizado.' },
        { status: 401 }
      ),
      userId: null,
    };
  }

  const isOwner = user.email.toLowerCase() === OWNER_EMAIL.toLowerCase();
  let role = 'USER';

  try {
    const dbUser = await db.user.findUnique({
      where: { email: user.email },
      select: { role: true },
    });

    role = dbUser?.role || role;
  } catch (error) {
    console.error('[admin-api] Database role lookup failed.', error);
  }

  const effectiveRole = isOwner && role === 'USER' ? 'SUPER_ADMIN' : role;
  if (!hasPermission(effectiveRole, permission)) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, error: 'Forbidden', message: 'Permissao insuficiente.' },
        { status: 403 }
      ),
      userId: user.id,
    };
  }

  return {
    ok: true as const,
    userId: user.id,
  };
}
