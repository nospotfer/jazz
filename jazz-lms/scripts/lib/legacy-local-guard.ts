type MutationOptions = { supabase?: boolean };
type Environment = Readonly<Record<string, string | undefined>>;
type LocalTarget = { databaseUrl: string; supabaseUrl?: string };

export class LegacyMutationBlockedError extends Error {
  constructor(reason: 'opt-in' | 'environment' | 'database' | 'supabase') {
    super(`Legacy mutation blocked: invalid ${reason}; only explicitly enabled disposable local targets are permitted.`);
    this.name = 'LegacyMutationBlockedError';
  }
}

/** Quarantine legacy tools; this deliberately has no production override. */
export function assertLegacyLocalMutationAllowed(options: MutationOptions = {}, env: Environment = process.env): LocalTarget {
  if (env.ENABLE_LOCAL_LEGACY_MUTATIONS !== '1') throw new LegacyMutationBlockedError('opt-in');
  if (!['development', 'test'].includes(env.NODE_ENV || '') ||
      env.VERCEL_ENV?.trim().toLowerCase() === 'production') {
    throw new LegacyMutationBlockedError('environment');
  }

  try {
    const database = new URL(env.DATABASE_URL || '');
    const isolatedTarget = (database.port === '55432' && database.pathname === '/jazz_maintenance') ||
      (database.port === '56122' && database.pathname === '/postgres');
    const parameters = [...database.searchParams.keys()];
    const allowedParameters = ['schema', 'connection_limit', 'pool_timeout', 'connect_timeout', 'statement_cache_size'];
    if (!['postgres:', 'postgresql:'].includes(database.protocol) ||
        !['localhost', '127.0.0.1'].includes(database.hostname) || !isolatedTarget || database.hash ||
        new Set(parameters).size !== parameters.length ||
        parameters.some((key) => !allowedParameters.includes(key)) ||
        (database.searchParams.has('schema') && database.searchParams.get('schema') !== 'public') ||
        parameters.some((key) => key !== 'schema' && !/^\d+$/.test(database.searchParams.get(key) || ''))) {
      throw new Error('Invalid disposable database');
    }
  } catch {
    throw new LegacyMutationBlockedError('database');
  }

  let supabaseUrl: string | undefined;
  if (options.supabase) {
    // Validate every configured alias so precedence changes cannot silently
    // select a different project. Do not print any URL or service key.
    const origins = [env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_URL].filter(Boolean);
    if (!origins.length) throw new LegacyMutationBlockedError('supabase');
    for (const value of origins) {
      try {
        const url = new URL(value!);
        if (url.protocol !== 'http:' || !['localhost', '127.0.0.1'].includes(url.hostname) ||
            url.port !== '56121' || url.pathname !== '/' || url.username || url.password || url.search || url.hash) {
          throw new Error('Invalid disposable Supabase');
        }
      } catch {
        throw new LegacyMutationBlockedError('supabase');
      }
    }
    supabaseUrl = origins[0];
  }
  // Keep provider selection fixed if Prisma subsequently loads ambient .env
  // variables that were absent when the guard checked the aliases.
  return { databaseUrl: env.DATABASE_URL!, supabaseUrl };
}
