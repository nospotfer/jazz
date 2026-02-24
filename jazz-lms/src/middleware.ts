import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { hasValidSupabasePublicConfig } from '@/lib/supabase-config'

export async function middleware(request: NextRequest) {
  const response = await updateSession(request)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const hasSupabaseConfig = hasValidSupabasePublicConfig(url, anonKey)

  const pathname = request.nextUrl.pathname

  if (pathname.startsWith('/dashboard')) {
    if (!hasSupabaseConfig) {
      return NextResponse.redirect(new URL('/auth', request.url))
    }

    const supabase = createServerClient(
      url!,
      anonKey!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/auth', request.url))
    }
  }

  if (!pathname.startsWith('/admin')) {
    return response
  }

  if (!hasSupabaseConfig) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  const supabase = createServerClient(
    url!,
    anonKey!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const ownerEmail = (process.env.ADMIN_OWNER_EMAIL || 'admin@neurofactory.net').toLowerCase()
  const userEmail = user?.email?.toLowerCase()

  if (!userEmail || userEmail !== ownerEmail) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
