import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { syncUserWithDatabase } from '@/lib/sync-user'
import { getRandomProfileAvatar } from '@/lib/profile-avatars'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = createClient()
    await supabase.auth.exchangeCodeForSession(code)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user && user.user_metadata?.avatar_mode !== 'fixed') {
      await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          avatar_mode: 'random',
          avatar_url: getRandomProfileAvatar(),
        },
      })
    }
    
    // Sincronizar usuário com o banco de dados
    try {
      await syncUserWithDatabase()
    } catch (error) {
      console.error('Error syncing user:', error)
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${origin}/dashboard`)
}
