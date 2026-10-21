import { safeErrorDiagnostic } from '@/lib/error-diagnostics';
import { cache } from 'react';

import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import { hasPermission, isAdminRole } from '@/lib/admin/permissions';
import { getServerUser } from '@/lib/server-user';

type AuthContext = {
  user: {
    id: string;
    email: string;
  };
  dbUser: {
    id: string;
    email: string;
    role: string;
  };
};

const getAuthContext = cache(async (): Promise<AuthContext | null> => {
  const user = await getServerUser();

  if (!user?.id || !user.email) {
    return null;
  }

  try {
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, role: true },
    });

    // Permission checks only read an existing role for this verified identity.
    // Account provisioning and role changes belong to separate explicit flows.
    if (!dbUser || dbUser.id !== user.id || dbUser.email.toLowerCase() !== user.email.toLowerCase()) {
      return null;
    }

    return {
      user: {
        id: user.id,
        email: user.email,
      },
      dbUser: {
        id: dbUser.id,
        email: dbUser.email,
        role: dbUser.role,
      },
    };
  } catch (error) {
    console.error('[admin:getAuthContext] Database role lookup failed. Access denied.', safeErrorDiagnostic(error));
    return null;
  }
});

export async function isAdmin(): Promise<boolean> {
  const ctx = await getAuthContext();
  if (!ctx) {
    return false;
  }

  return isAdminRole(ctx.dbUser.role);
}

export async function can(permission: Parameters<typeof hasPermission>[1]): Promise<boolean> {
  const ctx = await getAuthContext();

  if (!ctx) {
    return false;
  }

  return hasPermission(ctx.dbUser.role, permission);
}

export async function requirePermission(permission: Parameters<typeof hasPermission>[1]) {
  const allowed = await can(permission);

  if (!allowed) {
    redirect('/dashboard');
  }
}

export async function requireAdmin() {
  const allowed = await can('admin.access');

  if (!allowed) {
    redirect('/dashboard');
  }
}

export async function getCurrentUser() {
  const ctx = await getAuthContext();

  if (!ctx) {
    return null;
  }

  return ctx.dbUser;
}
