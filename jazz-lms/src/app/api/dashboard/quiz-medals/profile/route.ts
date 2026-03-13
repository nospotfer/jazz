import { NextResponse } from 'next/server';

import { getUserJazzMedalProfile } from '@/lib/jazz-medal-progress';
import { normalizeLanguage } from '@/lib/language';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { searchParams } = new URL(request.url);
    const language = normalizeLanguage(searchParams.get('language'));

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await getUserJazzMedalProfile(user.id, language);
    return NextResponse.json(profile);
  } catch (error) {
    console.error('[dashboard:quiz-medals:profile]', error);
    return NextResponse.json({ error: 'Unable to load medal profile' }, { status: 500 });
  }
}