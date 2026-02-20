import { createClient } from '@/utils/supabase/server';
import { db } from '@/lib/db';

const OWNER_EMAIL = (process.env.ADMIN_OWNER_EMAIL || 'admin@neurofactory.net').toLowerCase();

/**
 * Sincroniza um usuário do Supabase com o banco de dados Prisma.
 * - Cria o registro se não existir.
 * - Se o e-mail bater com ADMIN_OWNER_EMAIL, promove automaticamente para SUPER_ADMIN.
 */
export async function syncUserWithDatabase() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return null;
  }

  const isOwner = user.email.toLowerCase() === OWNER_EMAIL;
  const defaultRole = isOwner ? 'SUPER_ADMIN' : 'USER';

  // Verificar se o usuário já existe no banco
  let dbUser = await db.user.findUnique({
    where: {
      email: user.email,
    },
  });

  if (!dbUser) {
    // Criar com a role correta (SUPER_ADMIN para o dono, USER para os demais)
    dbUser = await db.user.create({
      data: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || null,
        emailVerified: true,
        role: defaultRole,
      },
    });
  } else {
    // Update name if missing and available from metadata
    const updates: Record<string, unknown> = {};
    if (!dbUser.name && user.user_metadata?.full_name) {
      updates.name = user.user_metadata.full_name;
    }
    if (!dbUser.emailVerified) {
      updates.emailVerified = true;
    }
    if (isOwner && dbUser.role === 'USER') {
      updates.role = 'SUPER_ADMIN';
    }
    if (Object.keys(updates).length > 0) {
      dbUser = await db.user.update({
        where: { email: user.email },
        data: updates,
      });
    }
  }

  return dbUser;
}
