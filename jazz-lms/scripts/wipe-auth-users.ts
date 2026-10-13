/**
 * WIPE AUTH USERS — remove todos os usuarios do Supabase Auth exceto o(s)
 * admin(s) declarados. Complementa `wipe-user-activity.ts` que apenas
 * limpa tabelas do Prisma.
 *
 * SAFETY:
 *   - Requer CONFIRM=WIPE-AUTH-USERS.
 *   - Admin emails protegidos: controlados por ADMIN_EMAILS (CSV) ou
 *     fallback para admin@neurofactory.net.
 *   - Lista usuarios via service-role key e deleta um a um.
 *
 * USAGE:
 *   CONFIRM=WIPE-AUTH-USERS \
 *     ADMIN_EMAILS=admin@neurofactory.net \
 *     npx tsx scripts/wipe-auth-users.ts
 *
 * Requer envs:
 *   - SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import { assertLegacyLocalMutationAllowed } from './lib/legacy-local-guard';

// Supply the disposable local configuration explicitly; never auto-load an
// ambient project .env in this destructive Auth tool.
const localTarget = assertLegacyLocalMutationAllowed({ supabase: true });

async function main() {
  if (process.env.CONFIRM !== 'WIPE-AUTH-USERS') {
    console.error('Refusing to run. Set CONFIRM=WIPE-AUTH-USERS to proceed.');
    process.exitCode = 1;
    return;
  }

  const supabaseUrl = localTarget.supabaseUrl!;
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
    process.exitCode = 1;
    return;
  }

  const adminEmailsCsv = (process.env.ADMIN_EMAILS || 'admin@neurofactory.net').trim();
  const protectedEmails = new Set(
    adminEmailsCsv
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0)
  );

  console.log('Protected admin emails:');
  for (const email of protectedEmails) console.log(`  - ${email}`);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let page = 1;
  const perPage = 200;
  let totalListed = 0;
  let totalDeleted = 0;
  let totalKept = 0;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.error('listUsers failed:', error.message);
      process.exitCode = 1;
      return;
    }

    const users = data.users;
    if (users.length === 0) break;
    totalListed += users.length;

    for (const user of users) {
      const email = (user.email || '').toLowerCase();
      if (protectedEmails.has(email)) {
        totalKept += 1;
        console.log(`  KEEP  ${email}`);
        continue;
      }

      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
      if (deleteError) {
        console.error(`  FAIL  ${email || user.id}: ${deleteError.message}`);
      } else {
        totalDeleted += 1;
        console.log(`  DEL   ${email || user.id}`);
      }
    }

    if (users.length < perPage) break;
    page += 1;
  }

  console.log('');
  console.log(`Listed:  ${totalListed}`);
  console.log(`Deleted: ${totalDeleted}`);
  console.log(`Kept:    ${totalKept}`);
}

main().catch((error) => {
  console.error('Wipe auth users failed:', error);
  process.exitCode = 1;
});
