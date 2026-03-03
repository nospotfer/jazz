import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const VALID_ADMIN_ROLES = ['SUPER_ADMIN', 'COURSE_ADMIN', 'CONTENT_CREATOR', 'MODERATOR'] as const;

function resolveAdminRole() {
  const requestedRole = (process.env.ADMIN_ROLE || 'SUPER_ADMIN').trim().toUpperCase();
  if (!VALID_ADMIN_ROLES.includes(requestedRole as (typeof VALID_ADMIN_ROLES)[number])) {
    throw new Error(
      `Invalid ADMIN_ROLE: ${requestedRole}. Valid roles: ${VALID_ADMIN_ROLES.join(', ')}`
    );
  }
  return requestedRole;
}

async function main() {
  console.log('🔧 Criando usuário administrador...\n');

  // Substitua este email pelo seu email que você usa no Supabase
  const adminEmail = process.env.ADMIN_EMAIL || 'seu-email@exemplo.com';
  
  // Você pode pegar o ID do seu usuário no Supabase Dashboard
  const adminId = process.env.ADMIN_USER_ID || 'admin-' + Date.now();
  const adminRole = resolveAdminRole();

  try {
    const admin = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        role: adminRole,
      },
      create: {
        id: adminId,
        email: adminEmail,
        role: adminRole,
      },
    });

    console.log('✅ Usuário administrador criado/atualizado:');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   ID: ${admin.id}\n`);
    
    console.log('⚠️  IMPORTANTE: Certifique-se de que este email corresponde');
    console.log('   ao email que você usa para fazer login no Supabase!\n');
  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
