import { createBrowserClient } from '@supabase/ssr'

type MinimalSupabase = {
  auth: {
    getUser: () => Promise<{ data: { user: null } }>
    signOut: () => Promise<{ error: null }>
    signInWithPassword: () => Promise<{ data: { user: null; session: null }; error: Error }>
    signUp: () => Promise<{ data: { user: null; session: null }; error: Error }>
    signInWithOAuth: () => Promise<{ data: null; error: Error }>
  }
}

export function createClient(): any {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const storage = typeof window !== 'undefined' ? window.sessionStorage : undefined

  if (!url || !key) {
    // Return a minimal stub so client-side code won't crash in local dev
    const stub: MinimalSupabase = {
      auth: {
        getUser: async () => ({ data: { user: null } }),
        signOut: async () => ({ error: null }),
        signInWithPassword: async () => ({
          data: { user: null, session: null },
          error: new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'),
        }),
        signUp: async () => ({
          data: { user: null, session: null },
          error: new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'),
        }),
        signInWithOAuth: async () => ({
          data: null,
          error: new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'),
        }),
      },
    }
    return stub
  }

  return createBrowserClient(url, key, {
    auth: {
      storage,
    },
  })
}
