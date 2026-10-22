import { safeErrorDiagnostic } from '@/lib/error-diagnostics';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hasPermission, type Permission } from '@/lib/admin/permissions';
import { getServerUser } from '@/lib/server-user';

export async function ensureAdminApiPermission(permission: Permission) {
  const user = await getServerUser();

  if (!user?.id || !user.email) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, error: 'Unauthorized', message: 'No autorizado.' },
        { status: 401 }
      ),
      userId: null,
    };
  }

  let role: string | null = null;

  try {
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, role: true },
    });

    if (dbUser?.id === user.id && dbUser.email.toLowerCase() === user.email.toLowerCase()) {
      role = dbUser.role;
    }
  } catch (error) {
    console.error('[admin-api] Database role lookup failed.', safeErrorDiagnostic(error));
  }

  if (!hasPermission(role, permission)) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, error: 'Forbidden', message: 'Permiso insuficiente.' },
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
