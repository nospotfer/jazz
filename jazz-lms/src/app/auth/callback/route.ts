import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { syncUserWithDatabase } from '@/lib/sync-user'
import { getRandomProfileAvatar } from '@/lib/profile-avatars'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin
  const flow = requestUrl.searchParams.get('flow') === 'register' ? 'register' : 'login'
  const nextPathRaw = requestUrl.searchParams.get('next')
  const nextPath = nextPathRaw && nextPathRaw.startsWith('/') ? nextPathRaw : '/dashboard'

  const authErrorRedirect = (message: string) =>
    NextResponse.redirect(
      `${origin}/auth?flow=${flow}&oauth_error=${encodeURIComponent(message)}`
    )

  if (!code) {
    return authErrorRedirect('No se recibió el código de autenticación de Google.')
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
    return authErrorRedirect('No se pudo completar el acceso con Google. Inténtalo de nuevo.')
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('Error loading authenticated user after OAuth:', userError)
    return authErrorRedirect('No se pudo recuperar tu cuenta después del login con Google.')
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
  return NextResponse.redirect(`${origin}${nextPath}`)
}
