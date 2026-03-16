import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { syncUserWithDatabase } from '@/lib/sync-user'
import { getRandomProfileAvatar } from '@/lib/profile-avatars'
import { normalizeLanguage } from '@/lib/language'

function normalizeBaseOrigin(value?: string | null): string | null {
  if (!value) return null

  try {
    const url = new URL(value)
    return `${url.protocol}//${url.host}`
  } catch {
    return null
  }
}

function isLocalOrigin(origin?: string | null): boolean {
  if (!origin) return false

  try {
    const { hostname } = new URL(origin)
    return hostname === 'localhost' || hostname === '127.0.0.1'
  } catch {
    return false
  }
}

function resolveServerAppOrigin(requestOrigin: string): string {
  const isDevelopment = process.env.NODE_ENV !== 'production'
  const configuredOrigin = normalizeBaseOrigin(process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL)

  if (isDevelopment) {
    if (isLocalOrigin(requestOrigin)) {
      return requestOrigin
    }

    if (configuredOrigin && isLocalOrigin(configuredOrigin)) {
      return configuredOrigin
    }

    return 'http://localhost:3000'
  }

  return configuredOrigin || requestOrigin
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const providerErrorCode = requestUrl.searchParams.get('error')?.trim().toLowerCase() || ''
  const providerErrorDescriptionRaw = requestUrl.searchParams.get('error_description')?.trim() || ''
  const origin = resolveServerAppOrigin(requestUrl.origin)
  const configuredOrigin = normalizeBaseOrigin(process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL)
  const flow = requestUrl.searchParams.get('flow') === 'register' ? 'register' : 'login'
  const selectedLanguage = normalizeLanguage(requestUrl.searchParams.get('lang'))
  const nextPathRaw = requestUrl.searchParams.get('next')
  const nextPath = nextPathRaw && nextPathRaw.startsWith('/') ? nextPathRaw : '/dashboard'

  if (process.env.NODE_ENV !== 'production' && configuredOrigin && !isLocalOrigin(configuredOrigin)) {
    console.warn('[auth/callback] APP_URL or NEXT_PUBLIC_APP_URL is not localhost in development. Ignoring configured origin for callback redirect.', {
      configuredOrigin,
      requestOrigin: requestUrl.origin,
      resolvedOrigin: origin,
    })
  }

  const copy = {
    es: {
      missingCode: 'No se recibió el código de autenticación de Google.',
      exchangeFailed: 'No se pudo completar el acceso con Google. Inténtalo de nuevo.',
      userLoadFailed: 'No se pudo recuperar tu cuenta después del login con Google.',
      oauthClientDisabled: 'Google OAuth está deshabilitado para esta app. Contacta al administrador para reactivarlo en Google Cloud Console.',
      oauthAccessDenied: 'Acceso con Google cancelado o denegado.',
    },
    en: {
      missingCode: 'Google authentication code was not received.',
      exchangeFailed: 'Unable to complete Google sign-in. Please try again.',
      userLoadFailed: 'Unable to load your account after Google sign-in.',
      oauthClientDisabled: 'Google OAuth is disabled for this app. Ask an admin to re-enable the client in Google Cloud Console.',
      oauthAccessDenied: 'Google access was canceled or denied.',
    },
    fr: {
      missingCode: 'Le code d’authentification Google n’a pas été reçu.',
      exchangeFailed: 'Impossible de terminer la connexion Google. Réessayez.',
      userLoadFailed: 'Impossible de récupérer votre compte après la connexion Google.',
      oauthClientDisabled: 'Google OAuth est désactivé pour cette application. Demandez à un administrateur de réactiver le client dans Google Cloud Console.',
      oauthAccessDenied: 'L’accès Google a été annulé ou refusé.',
    },
    pt: {
      missingCode: 'O código de autenticação do Google não foi recebido.',
      exchangeFailed: 'Não foi possível concluir o login com Google. Tente novamente.',
      userLoadFailed: 'Não foi possível carregar sua conta após o login com Google.',
      oauthClientDisabled: 'O cliente OAuth do Google está desativado para este app. Peça ao administrador para reativá-lo no Google Cloud Console.',
      oauthAccessDenied: 'O acesso com Google foi cancelado ou negado.',
    },
  }[selectedLanguage]

  const resolveProviderErrorMessage = () => {
    if (!providerErrorCode) {
      return providerErrorDescriptionRaw || copy.missingCode
    }

    if (providerErrorCode === 'disabled_client' || providerErrorDescriptionRaw.toLowerCase().includes('disabled_client')) {
      return copy.oauthClientDisabled
    }

    if (providerErrorCode === 'access_denied') {
      return copy.oauthAccessDenied
    }

    return providerErrorDescriptionRaw || copy.missingCode
  }

  const withLanguageCookie = (response: NextResponse) => {
    response.cookies.set('jazz_lang', selectedLanguage, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    })

    return response
  }

  const authErrorRedirect = (message: string, errorCode?: string) => {
    const codeSegment = errorCode ? `&oauth_error_code=${encodeURIComponent(errorCode)}` : ''
    const target = `${origin}/auth?flow=${flow}&lang=${selectedLanguage}&oauth_error=${encodeURIComponent(message)}${codeSegment}`
    return withLanguageCookie(NextResponse.redirect(target))
  }

  if (!code) {
    return authErrorRedirect(resolveProviderErrorMessage(), providerErrorCode || undefined)
  }

  const supabase = createClient()
  let exchangeError: Error | null = null

  try {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    exchangeError = error
  } catch (error) {
    exchangeError = error instanceof Error ? error : new Error('Unknown OAuth exchange error')
  }

  if (exchangeError) {
    console.error('Error exchanging auth code for session:', exchangeError)
    return authErrorRedirect(copy.exchangeFailed)
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('Error loading authenticated user after OAuth:', userError)
    return authErrorRedirect(copy.userLoadFailed)
  }

  if (user.user_metadata?.avatar_mode !== 'fixed') {
    const { error: updateUserError } = await supabase.auth.updateUser({
      data: {
        ...user.user_metadata,
        avatar_mode: 'random',
        avatar_url: getRandomProfileAvatar(),
      },
    })

    if (updateUserError) {
      console.error('Error updating OAuth user metadata:', updateUserError)
    }
  }

  // Sincronizar usuário com o banco de dados
  try {
    await syncUserWithDatabase()
  } catch (error) {
    console.error('Error syncing user:', error)
  }

  // URL to redirect to after sign in process completes
  return withLanguageCookie(NextResponse.redirect(`${origin}${nextPath}`))
}
