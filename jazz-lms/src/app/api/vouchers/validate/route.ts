import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { validateVoucherForCourse } from '@/lib/vouchers';
import { checkRateLimit, createRateLimitHeaders } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { code, courseId } = await req.json();

    const ipLimit = checkRateLimit(req, {
      bucket: 'voucher-validate-ip',
      maxRequests: 30,
      windowMs: 60_000,
    });

    if (!ipLimit.allowed) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Too many attempts',
          message: 'Muitas tentativas de validação. Aguarde e tente novamente.',
          retryAfterSeconds: ipLimit.retryAfterSeconds,
        },
        {
          status: 429,
          headers: createRateLimitHeaders(ipLimit, 60_000),
        }
      );
    }

    const codeLimit = checkRateLimit(req, {
      bucket: 'voucher-validate-code',
      identifier: String(code || 'missing-code').trim().toLowerCase(),
      maxRequests: 10,
      windowMs: 5 * 60_000,
    });

    if (!codeLimit.allowed) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Too many attempts',
          message: 'Código temporariamente bloqueado por excesso de tentativas.',
          retryAfterSeconds: codeLimit.retryAfterSeconds,
        },
        {
          status: 429,
          headers: createRateLimitHeaders(codeLimit, 5 * 60_000),
        }
      );
    }

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
