import { createClient } from '@/utils/supabase/server';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';

export async function isAdmin(): Promise<boolean> {
  const supabase = createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const dbUser = await db.user.findUnique({
    where: {
      email: user.email,
    },
  });

  return dbUser?.role === 'ADMIN';
}

export async function requireAdmin() {
  const admin = await isAdmin();
  
  if (!admin) {
    redirect('/dashboard');
  }
}

export async function getCurrentUser() {
  const supabase = createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const dbUser = await db.user.findUnique({
    where: {
      email: user.email,
    },
  });

  return dbUser;
}
