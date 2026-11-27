import { safeErrorDiagnostic } from '@/lib/error-diagnostics';
import { expectedUserConsistencyResponse } from '@/lib/expected-user-consistency';
import { NextResponse } from 'next/server';

import { getUserJazzMedalProfile } from '@/lib/jazz-medal-progress';
import { normalizeLanguage } from '@/lib/language';
import { getServerUser } from '@/lib/server-user';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await getServerUser();

    const { searchParams } = new URL(request.url);
    const language = normalizeLanguage(searchParams.get('language'));

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mismatch = expectedUserConsistencyResponse(request, user.id);
    if (mismatch) return mismatch;

    const profile = await getUserJazzMedalProfile(user.id, language, user.email);
    return NextResponse.json(profile);
  } catch (error) {
    console.error('[dashboard:quiz-medals:profile]', safeErrorDiagnostic(error));
    return NextResponse.json({ error: 'Unable to load medal profile' }, { status: 500 });
  }
}
