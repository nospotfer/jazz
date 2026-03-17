import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { db } from '@/lib/db';
import { hasValidSupabaseServerConfig, normalizeSupabaseUrl } from '@/lib/supabase-config';
import { checkRateLimit, createRateLimitHeaders } from '@/lib/rate-limit';

function hasPlaceholder(value: string | undefined, placeholder: string) {
  return !value || value.includes(placeholder);
}

export async function POST(request: Request) {
  try {
    if (hasPlaceholder(process.env.NEXT_PUBLIC_SUPABASE_URL, 'your-project.supabase.co')) {
      return NextResponse.json(
        { error: 'La URL de Supabase no está configurada en el entorno del servidor.' },
        { status: 500 }
      );
    }

    if (hasPlaceholder(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'your-anon-key')) {
      return NextResponse.json(
        { error: 'La clave pública de Supabase no está configurada en el entorno del servidor.' },
        { status: 500 }
      );
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY.includes('your-service-role-key')) {
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY es obligatoria para la verificación por correo.' },
        { status: 500 }
      );
    }

    const { email } = await request.json();
    const normalizedEmail = String(email || '').trim().toLowerCase();

    const ipLimit = checkRateLimit(request, {
      bucket: 'auth-send-code-ip',
      maxRequests: 20,
      windowMs: 60_000,
    });

    if (!ipLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Demasiados intentos. Espera un momento antes de solicitar un nuevo código.',
          retryAfterSeconds: ipLimit.retryAfterSeconds,
        },
        {
          status: 429,
          headers: createRateLimitHeaders(ipLimit, 60_000),
        }
      );
    }

    const emailLimit = checkRateLimit(request, {
      bucket: 'auth-send-code-email',
      identifier: normalizedEmail || 'missing-email',
      maxRequests: 5,
      windowMs: 10 * 60_000,
    });

    if (!emailLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Este correo alcanzó el límite de solicitudes. Intenta nuevamente en unos minutos.',
          retryAfterSeconds: emailLimit.retryAfterSeconds,
        },
        {
          status: 429,
          headers: createRateLimitHeaders(emailLimit, 10 * 60_000),
        }
      );
    }

    const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!hasValidSupabaseServerConfig(url ?? undefined, anonKey, serviceRoleKey)) {
      return NextResponse.json(
        {
          error:
            'La autenticación no está configurada. Define NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY válidas en las variables de entorno.',
        },
        { status: 500 }
      );
    }

    if (!normalizedEmail) {
      return NextResponse.json({ error: 'El correo es obligatorio.' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: 'El formato del correo es inválido.' },
        { status: 400 }
      );
    }

    // Check if email is already registered (has password set in Prisma)
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser && existingUser.emailVerified) {
      return NextResponse.json(
        { error: 'Este correo ya está registrado. Inicia sesión en su lugar.' },
        { status: 409 }
      );
    }

    // Use Supabase Admin client to send OTP via Supabase's built-in email
    const supabase = createClient(
      url!,
      serviceRoleKey!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Also check Supabase Auth for fully registered users (with password)
    const { data: userData } = await supabase.auth.admin.listUsers();
    const existingSupaUser = userData?.users?.find((u) => u.email?.toLowerCase() === normalizedEmail);
    if (!existingSupaUser) {
      return NextResponse.json(
        { error: 'No se encontró la cuenta. Primero crea tu cuenta.' },
        { status: 404 }
      );
    }

    if (existingSupaUser.email_confirmed_at) {
      return NextResponse.json(
        { error: 'Este correo ya está registrado. Inicia sesión en su lugar.' },
        { status: 409 }
      );
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: false,
      },
    });

    if (error) {
      console.error('Supabase OTP error:', error);
      const isRateLimit = error.message?.toLowerCase().includes('rate limit');
      if (isRateLimit) {
        return NextResponse.json(
          {
            error: 'Demasiados intentos. Espera unos minutos y vuelve a intentarlo.',
            retryAfterSeconds: 120,
          },
          { status: 429 }
        );
      }

      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Código de verificación enviado a tu correo',
    });
  } catch (error) {
    console.error('Error sending verification code:', error);
    return NextResponse.json(
      { error: 'No se pudo enviar el código de verificación' },
      { status: 500 }
    );
  }
}
