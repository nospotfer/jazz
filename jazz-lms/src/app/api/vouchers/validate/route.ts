import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { validateVoucherForCourse } from '@/lib/vouchers';
import { checkRateLimit, createRateLimitHeaders } from '@/lib/rate-limit';
import { Prisma } from '@prisma/client';

export const runtime = 'nodejs';

function isDatabaseUnavailableError(error: unknown): boolean {
  if (
    error instanceof Prisma.PrismaClientInitializationError
    || error instanceof Prisma.PrismaClientRustPanicError
  ) {
    return true;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return ['P1001', 'P1002', 'P1008', 'P1017'].includes(error.code);
  }

  const message = error instanceof Error ? error.message.toLowerCase() : '';
  return (
    message.includes('database')
    || message.includes('connection')
    || message.includes('connect')
    || message.includes('timeout')
    || message.includes('pool')
  );
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const code =
      typeof payload?.code === 'string' && payload.code.trim().length > 0
        ? payload.code.trim()
        : null;
    const courseId =
      typeof payload?.courseId === 'string' && payload.courseId.trim().length > 0
        ? payload.courseId.trim()
        : null;

    if (!code || !courseId) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Missing parameters',
          message: 'Código e curso são obrigatórios para validar voucher.',
        },
        { status: 400 }
      );
    }

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
    if (isDatabaseUnavailableError(error)) {
      console.error('[VOUCHER_VALIDATE_DB_UNAVAILABLE]', error);
      return NextResponse.json(
        {
          valid: false,
          error: 'Service unavailable',
          message: 'Validação de voucher temporariamente indisponível.',
        },
        { status: 503 }
      );
    }

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
