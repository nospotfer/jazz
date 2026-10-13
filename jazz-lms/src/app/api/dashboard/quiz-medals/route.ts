import { safeErrorDiagnostic } from '@/lib/error-diagnostics';
import { NextResponse } from 'next/server';

import { getUserJazzMedalProgress } from '@/lib/jazz-medal-progress';
import { getServerUser } from '@/lib/server-user';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getServerUser();

    if (!user) {
      return NextResponse.json({
        platinumMedalCount: 0,
        totalRequiredPlatinumMedals: 15,
        remainingPlatinumMedals: 15,
        hasSupremeMedal: false,
        activeProfileMedal: 'NONE',
      }, { status: 401 });
    }

    const progress = await getUserJazzMedalProgress(user.id, user.email);
    return NextResponse.json(progress);
  } catch (error) {
    console.error('[dashboard:quiz-medals]', safeErrorDiagnostic(error));

    return NextResponse.json({
      platinumMedalCount: 0,
      totalRequiredPlatinumMedals: 15,
      remainingPlatinumMedals: 15,
      hasSupremeMedal: false,
      activeProfileMedal: 'NONE',
    }, { status: 500 });
  }
}