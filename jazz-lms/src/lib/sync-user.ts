import { createClient } from '@/utils/supabase/server';
import { db } from '@/lib/db';

/**
 * Sincroniza um usuário do Supabase com o banco de dados Prisma
 * Cria o usuário se não existir
 */
export async function syncUserWithDatabase() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return null;
  }

  // Verificar se o usuário já existe no banco
  let dbUser = await db.user.findUnique({
    where: {
      email: user.email,
    },
  });

  // Se não existir, criar
  if (!dbUser) {
    dbUser = await db.user.create({
      data: {
        id: user.id,
        email: user.email,
        role: 'USER', // Por padrão, todos os novos usuários são USER
      },
    });
  }

  return dbUser;
}
