import { createBrowserClient } from '@supabase/ssr'
import { hasValidSupabasePublicConfig } from '@/lib/supabase-config'

type MinimalSupabase = {
  auth: {
    getUser: () => Promise<{ data: { user: null } }>
    getSession: () => Promise<{ data: { session: null } }>
    signOut: () => Promise<{ error: null }>
    signInWithPassword: () => Promise<{ data: { user: null; session: null }; error: Error }>
    signUp: () => Promise<{ data: { user: null; session: null }; error: Error }>
    signInWithOAuth: () => Promise<{ data: null; error: Error }>
    resetPasswordForEmail: () => Promise<{ data: null; error: Error }>
    updateUser: () => Promise<{ data: { user: null }; error: Error }>
    setSession: () => Promise<{ data: { session: null; user: null }; error: Error }>
    exchangeCodeForSession: () => Promise<{ data: { session: null; user: null }; error: Error }>
    onAuthStateChange: () => { data: { subscription: { unsubscribe: () => void } } }
  }
}

export function createClient(): any {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!hasValidSupabasePublicConfig(url, key)) {
    // Return a minimal stub so client-side code won't crash in local dev
    const stub: MinimalSupabase = {
      auth: {
        getUser: async () => ({ data: { user: null } }),
        getSession: async () => ({ data: { session: null } }),
        signOut: async () => ({ error: null }),
        signInWithPassword: async () => ({
          data: { user: null, session: null },
          error: new Error('Supabase is not configured. Set real NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY values (not placeholders).'),
        }),
        signUp: async () => ({
          data: { user: null, session: null },
          error: new Error('Supabase is not configured. Set real NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY values (not placeholders).'),
        }),
        signInWithOAuth: async () => ({
          data: null,
          error: new Error('Supabase is not configured. Set real NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY values (not placeholders).'),
        }),
        resetPasswordForEmail: async () => ({
          data: null,
          error: new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'),
        }),
        updateUser: async () => ({
          data: { user: null },
          error: new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'),
        }),
        setSession: async () => ({
          data: { session: null, user: null },
          error: new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'),
        }),
        exchangeCodeForSession: async () => ({
          data: { session: null, user: null },
          error: new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'),
        }),
        onAuthStateChange: () => ({
          data: {
            subscription: {
              unsubscribe: () => undefined,
            },
          },
        }),
      },
    }
    return stub
  }

  return createBrowserClient(url!, key!)
}
