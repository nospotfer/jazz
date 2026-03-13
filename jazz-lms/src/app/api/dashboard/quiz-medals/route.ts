import { NextResponse } from 'next/server';

import { getUserJazzMedalProgress } from '@/lib/jazz-medal-progress';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({
        platinumMedalCount: 0,
        totalRequiredPlatinumMedals: 15,
        remainingPlatinumMedals: 15,
        hasSupremeMedal: false,
        activeProfileMedal: 'NONE',
      }, { status: 401 });
    }

    const progress = await getUserJazzMedalProgress(user.id);
    return NextResponse.json(progress);
  } catch (error) {
    console.error('[dashboard:quiz-medals]', error);

    return NextResponse.json({
      platinumMedalCount: 0,
      totalRequiredPlatinumMedals: 15,
      remainingPlatinumMedals: 15,
      hasSupremeMedal: false,
      activeProfileMedal: 'NONE',
    }, { status: 500 });
  }
}