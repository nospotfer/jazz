import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'
import { NextResponse } from 'next/server'
import { hasValidSupabasePublicConfig } from '@/lib/supabase-config'
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_COOKIE_KEY,
  normalizeLanguage,
  type SupportedLanguage,
} from '@/lib/language'

const LANGUAGE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

type LanguageCookieState = {
  language: SupportedLanguage
  shouldPersist: boolean
}

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

function resolveLanguageCookieState(request: NextRequest): LanguageCookieState {
  const currentCookie = request.cookies.get(LANGUAGE_COOKIE_KEY)?.value

  if (currentCookie) {
    const normalizedCookie = normalizeLanguage(currentCookie)
    const normalizedRaw = currentCookie.toLowerCase().trim().replace(/_/g, '-')
    const shouldPersist = normalizedRaw !== normalizedCookie

    return {
      language: normalizedCookie,
      shouldPersist,
    }
  }

  return {
    language: DEFAULT_LANGUAGE,
    shouldPersist: true,
  }
}

function applyLanguageCookie(response: NextResponse, cookieState: LanguageCookieState) {
  if (!cookieState.shouldPersist) {
    return response
  }

  response.cookies.set(LANGUAGE_COOKIE_KEY, cookieState.language, {
    path: '/',
    maxAge: LANGUAGE_COOKIE_MAX_AGE,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })

  return response
}

export async function proxy(request: NextRequest) {
  const languageCookieState = resolveLanguageCookieState(request)

  if (languageCookieState.shouldPersist) {
    request.cookies.set({
      name: LANGUAGE_COOKIE_KEY,
      value: languageCookieState.language,
    })
  }

  const finalizeResponse = (response: NextResponse, withNoStoreHeaders = false) => {
    const responseWithLanguage = applyLanguageCookie(response, languageCookieState)
    if (!withNoStoreHeaders) {
      return responseWithLanguage
    }

    return applyLocalNoStoreHeaders(request, responseWithLanguage)
  }

  const pathname = request.nextUrl.pathname
  const isRootPath = pathname === '/'
  const needsAuthProcessing =
    isRootPath ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/admin')

  if (!needsAuthProcessing) {
    return finalizeResponse(NextResponse.next(), true)
  }

  const { response, user } = await updateSession(request)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const hasSupabaseConfig = hasValidSupabasePublicConfig(url, anonKey)

  if (!hasSupabaseConfig) {
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
      return finalizeResponse(NextResponse.redirect(new URL('/auth', request.url)))
    }
    return finalizeResponse(response, true)
  }

  if (pathname.startsWith('/dashboard') || isRootPath) {
    if (!user) {
      if (pathname.startsWith('/dashboard')) {
        return finalizeResponse(NextResponse.redirect(new URL('/auth', request.url)))
      }
    } else if (isRootPath) {
      return finalizeResponse(NextResponse.redirect(new URL('/dashboard', request.url)))
    }
  }

  if (!pathname.startsWith('/admin')) {
    return finalizeResponse(response, true)
  }

  if (!hasSupabaseConfig) {
    return finalizeResponse(NextResponse.redirect(new URL('/dashboard', request.url)))
  }

  if (!user?.email) {
    return finalizeResponse(NextResponse.redirect(new URL('/dashboard', request.url)))
  }

  return finalizeResponse(response, true)
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
