import { createClient } from '@/utils/supabase/server';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import { hasPermission, isAdminRole } from '@/lib/admin/permissions';

const OWNER_EMAIL = process.env.ADMIN_OWNER_EMAIL || 'admin@neurofactory.net';

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

async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  const isOwner = isOwnerEmail(user.email);
  const desiredRole = isOwner ? 'SUPER_ADMIN' : 'USER';

  let dbUser = await db.user.findUnique({
    where: {
      email: user.email,
    },
  });

  if (!dbUser) {
    dbUser = await db.user.create({
      data: {
        id: user.id,
        email: user.email,
        role: desiredRole,
      },
    });
  } else if (isOwner && dbUser.role === 'USER') {
    dbUser = await db.user.update({
      where: {
        email: user.email,
      },
      data: {
        role: 'SUPER_ADMIN',
      },
    });
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
}

function isOwnerEmail(email: string) {
  return email.toLowerCase() === OWNER_EMAIL.toLowerCase();
}

export async function isAdmin(): Promise<boolean> {
  const ctx = await getAuthContext();
  if (!ctx) {
    return false;
  }

  const isOwner = isOwnerEmail(ctx.dbUser.email);
  const roleAllowed = isAdminRole(ctx.dbUser.role);

  return isOwner && roleAllowed;
}

export async function can(permission: Parameters<typeof hasPermission>[1]): Promise<boolean> {
  const ctx = await getAuthContext();

  if (!ctx) {
    return false;
  }

  if (!isOwnerEmail(ctx.dbUser.email)) {
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
