import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'
import { NextResponse } from 'next/server'
import { hasValidSupabasePublicConfig } from '@/lib/supabase-config'

function applyLocalNoStoreHeaders(request: NextRequest, response: NextResponse) {
  const isLocalhost = request.nextUrl.hostname === 'localhost' || request.nextUrl.hostname === '127.0.0.1'

  if (!isLocalhost) {
    return response
  }

  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  return response
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isAuthResetPasswordPath = pathname.startsWith('/auth/reset-password')
  const isRootPath = pathname === '/'
  const needsAuthProcessing =
    isRootPath ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/admin')

  if (!needsAuthProcessing) {
    return applyLocalNoStoreHeaders(request, NextResponse.next())
  }

  const { response, user } = await updateSession(request)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const hasSupabaseConfig = hasValidSupabasePublicConfig(url, anonKey)

  if (!hasSupabaseConfig) {
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/auth', request.url))
    }
    return applyLocalNoStoreHeaders(request, response)
  }

  if (pathname.startsWith('/dashboard') || pathname.startsWith('/auth') || isRootPath) {
    if (!user) {
      if (pathname.startsWith('/dashboard')) {
        return NextResponse.redirect(new URL('/auth', request.url))
      }
    } else if ((pathname.startsWith('/auth') && !isAuthResetPasswordPath) || isRootPath) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  if (!pathname.startsWith('/admin')) {
    return applyLocalNoStoreHeaders(request, response)
  }

  if (!hasSupabaseConfig) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (!user?.email) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return applyLocalNoStoreHeaders(request, response)
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml|woff|woff2|ttf|otf|pdf|mp4|webm)$).*)',
  ],
}
