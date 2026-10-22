import { safeErrorDiagnostic } from '@/lib/error-diagnostics';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { db } from '@/lib/db';
import { hasValidSupabaseServerConfig } from '@/lib/supabase-config';
import { isValidEmailAddress } from '@/lib/email-validation';

const OWNER_EMAIL = (process.env.ADMIN_OWNER_EMAIL || 'admin@neurofactory.net').toLowerCase();

function hasPlaceholder(value: string | undefined, placeholder: string) {
  return !value || value.includes(placeholder);
}

export async function POST(request: Request) {
  try {
    if (hasPlaceholder(process.env.NEXT_PUBLIC_SUPABASE_URL, 'your-project.supabase.co')) {
      return NextResponse.json(
        { error: 'La verificación por correo no está disponible temporalmente. Inténtalo más tarde.' },
        { status: 500 }
      );
    }

    if (hasPlaceholder(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'your-anon-key')) {
      return NextResponse.json(
        { error: 'La verificación por correo no está disponible temporalmente. Inténtalo más tarde.' },
        { status: 500 }
      );
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY.includes('your-service-role-key')) {
      return NextResponse.json(
        { error: 'La verificación por correo no está disponible temporalmente. Inténtalo más tarde.' },
        { status: 500 }
      );
    }

    const { email, code } = await request.json();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!hasValidSupabaseServerConfig(url, anonKey, serviceRoleKey)) {
      return NextResponse.json(
        {
          error:
            'La verificación por correo no está disponible temporalmente. Inténtalo más tarde.',
        },
        { status: 500 }
      );
    }

    if (!isValidEmailAddress(normalizedEmail) || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'El correo y el código son obligatorios.' },
        { status: 400 }
      );
    }

    // Do not transform malformed codes into a different token.
    const cleanCode = code.trim();
    if (!/^\d{6,10}$/.test(cleanCode)) {
      return NextResponse.json(
        { error: 'El formato del código de verificación es inválido.' },
        { status: 400 }
      );
    }

    // Verify OTP via Supabase
    const supabase = createClient(
      url!,
      serviceRoleKey!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: verification, error } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: cleanCode,
      type: 'email',
    });

    if (error) {
      const msg = error.message?.toLowerCase() || '';
      if (msg.includes('expired')) {
        return NextResponse.json(
          { error: 'El código de verificación ha expirado. Solicita uno nuevo.' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'El código de verificación es inválido. Revísalo e inténtalo de nuevo.' },
        { status: 400 }
      );
    }

    // Synchronize the exact identity whose OTP Supabase verified, rather than
    // trusting the input email or an unrelated first page of the user directory.
    const supaUser = verification?.user;
    if (!supaUser?.id || supaUser.email?.toLowerCase() !== normalizedEmail) {
      return NextResponse.json(
        { error: 'No se pudo comprobar la identidad verificada.' },
        { status: 401 },
      );
    }
    const fullName =
      typeof supaUser?.user_metadata?.full_name === 'string' ? supaUser.user_metadata.full_name : null;
    const role = normalizedEmail === OWNER_EMAIL ? 'SUPER_ADMIN' : 'USER';

    const updateData: { emailVerified: boolean; name?: string; role?: string } = {
      emailVerified: true,
    };

    if (fullName) {
      updateData.name = fullName;
    }

    if (role === 'SUPER_ADMIN') {
      updateData.role = 'SUPER_ADMIN';
    }

    await db.user.upsert({
      where: { email: normalizedEmail },
      create: {
        id: supaUser.id,
        email: normalizedEmail,
        name: fullName,
        emailVerified: true,
        role,
      },
      update: updateData,
    });

    return NextResponse.json({
      success: true,
      verified: true,
    });
  } catch (error) {
    console.error('Error verifying code:', safeErrorDiagnostic(error));
    return NextResponse.json(
      { error: 'No se pudo verificar el código.' },
      { status: 500 }
    );
  }
}
