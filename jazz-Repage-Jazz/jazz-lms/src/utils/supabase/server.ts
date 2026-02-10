import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

type MinimalSupabase = {
  auth: {
    getUser: () => Promise<{ data: { user: null } }>
  }
}

export function createClient(): any {
  const cookieStore = cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    const stub: MinimalSupabase = {
      auth: {
        getUser: async () => ({ data: { user: null } }),
      },
    }
    return stub
  }

  return createServerClient(
    url,
    key,
    {
      cookies: {
        async get(name: string) {
          return (await cookieStore).get(name)?.value
        },
        async set(name: string, value: string, options: CookieOptions) {
          try {
            (await cookieStore).set({ name, value, ...options })
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (_) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        async remove(name: string, options: CookieOptions) {
          try {
            (await cookieStore).set({ name, value: '', ...options })
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (_) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
