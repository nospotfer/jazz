import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { hasValidSupabasePublicConfig, normalizeSupabaseUrl } from '@/lib/supabase-config'

type ServerSupabaseClient = ReturnType<typeof createServerClient>

export function createClient(): ServerSupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const normalizedUrl = normalizeSupabaseUrl(url)

  if (!hasValidSupabasePublicConfig(normalizedUrl ?? undefined, key)) {
    const stub = {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        updateUser: async () => ({
          data: { user: null },
          error: new Error('Supabase is not configured. Set real NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY values (not placeholders).'),
        }),
        exchangeCodeForSession: async () => ({
          data: { session: null, user: null },
          error: new Error('Supabase is not configured. Set real NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY values (not placeholders).'),
        }),
      },
    }
    return stub as unknown as ServerSupabaseClient
  }

  return createServerClient(
    normalizedUrl!,
    key!,
    {
      cookies: {
        async getAll() {
          const cookieStore = await cookies()
          return cookieStore.getAll()
        },
        async setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            const cookieStore = await cookies()
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set({ name, value, ...options })
            })
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
