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
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Minimal .env loader (no dotenv dep) — merges into process.env without clobber.
function loadEnvFile(path: string) {
  if (!existsSync(path)) return;
  const raw = readFileSync(path, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}
loadEnvFile(resolve(process.cwd(), '.env'));
loadEnvFile(resolve(process.cwd(), '.env.local'));

async function main() {
  if (process.env.CONFIRM !== 'WIPE-AUTH-USERS') {
    console.error('Refusing to run. Set CONFIRM=WIPE-AUTH-USERS to proceed.');
    process.exitCode = 1;
    return;
  }

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
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
