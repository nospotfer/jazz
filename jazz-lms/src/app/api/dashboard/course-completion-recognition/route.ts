import { safeErrorDiagnostic } from '@/lib/error-diagnostics';
import { expectedUserConsistencyResponse } from '@/lib/expected-user-consistency';
import { NextResponse } from 'next/server';

import { getUserCourseCompletionRecognition } from '@/lib/jazz-medal-progress';
import { getServerUser } from '@/lib/server-user';

export const dynamic = 'force-dynamic';

const defaultResponse = {
  isEligible: false,
  completedLessons: 0,
  totalLessons: 0,
  completionPercent: 0,
  quizzesWithMedalCount: 0,
  scorePercent: 0,
  medal: 'NONE' as const,
};

export async function GET(request: Request) {
  try {
    const user = await getServerUser();

    if (!user) {
      return NextResponse.json(defaultResponse, { status: 401 });
    }

    const mismatch = expectedUserConsistencyResponse(request, user.id);
    if (mismatch) return mismatch;

    const recognition = await getUserCourseCompletionRecognition(user.id, user.email);
    return NextResponse.json(recognition);
  } catch (error) {
    console.error('[dashboard:course-completion-recognition]', safeErrorDiagnostic(error));
    return NextResponse.json(defaultResponse, { status: 500 });
  }
}
