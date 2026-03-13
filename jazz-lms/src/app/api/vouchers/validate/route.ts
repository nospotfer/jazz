import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { validateVoucherForCourse } from '@/lib/vouchers';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { code, courseId } = await req.json();

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const result = await validateVoucherForCourse({
      code,
      courseId,
      userId: user?.id,
    });

    if (!result.valid) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[VOUCHER_VALIDATE_ERROR]', error);
    return NextResponse.json(
      {
        valid: false,
        error: 'Server error',
        message: 'Erro ao validar voucher.',
      },
      { status: 500 }
    );
  }
}
