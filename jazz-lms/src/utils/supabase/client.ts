import { createBrowserClient } from '@supabase/ssr'

type MinimalSupabase = {
  auth: {
    getUser: () => Promise<{ data: { user: null } }>
    signOut: () => Promise<{ error: null }>
  }
}

export function createClient(): any {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    // Return a minimal stub so client-side code won't crash in local dev
    const stub: MinimalSupabase = {
      auth: {
        getUser: async () => ({ data: { user: null } }),
        signOut: async () => ({ error: null }),
      },
    }
    return stub
  }

  return createBrowserClient(url, key)
}
