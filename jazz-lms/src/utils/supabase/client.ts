import { createBrowserClient } from '@supabase/ssr'
import { hasValidSupabasePublicConfig, normalizeSupabaseUrl } from '@/lib/supabase-config'

type SupabaseFlowType = 'pkce' | 'implicit'

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

export function createClient(options?: { flowType?: SupabaseFlowType }): any {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const normalizedUrl = normalizeSupabaseUrl(url)

  if (!hasValidSupabasePublicConfig(normalizedUrl ?? undefined, key)) {
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
          error: new Error('Supabase is not configured. Set real NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY values (not placeholders).'),
        }),
        updateUser: async () => ({
          data: { user: null },
          error: new Error('Supabase is not configured. Set real NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY values (not placeholders).'),
        }),
        setSession: async () => ({
          data: { session: null, user: null },
          error: new Error('Supabase is not configured. Set real NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY values (not placeholders).'),
        }),
        exchangeCodeForSession: async () => ({
          data: { session: null, user: null },
          error: new Error('Supabase is not configured. Set real NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY values (not placeholders).'),
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

  return createBrowserClient(normalizedUrl!, key!, {
    auth: {
      flowType: options?.flowType,
    },
  })
}
