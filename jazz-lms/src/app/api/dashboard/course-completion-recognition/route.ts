import { NextResponse } from 'next/server';

import { getUserCourseCompletionRecognition } from '@/lib/jazz-medal-progress';
import { createClient } from '@/utils/supabase/server';

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

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(defaultResponse, { status: 401 });
    }

    const recognition = await getUserCourseCompletionRecognition(user.id);
    return NextResponse.json(recognition);
  } catch (error) {
    console.error('[dashboard:course-completion-recognition]', error);
    return NextResponse.json(defaultResponse, { status: 500 });
  }
}
