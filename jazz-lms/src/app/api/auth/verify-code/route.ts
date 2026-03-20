import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { db } from '@/lib/db';

const OWNER_EMAIL = (process.env.ADMIN_OWNER_EMAIL || 'admin@neurofactory.net').toLowerCase();
import { hasValidSupabaseServerConfig } from '@/lib/supabase-config';

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

    const { email, code } = await request.json();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!hasValidSupabaseServerConfig(url, anonKey, serviceRoleKey)) {
      return NextResponse.json(
        {
          error:
            'La autenticación no está configurada. Define NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY válidas en las variables de entorno.',
        },
        { status: 500 }
      );
    }

    if (!normalizedEmail || !code) {
      return NextResponse.json(
        { error: 'El correo y el código son obligatorios.' },
        { status: 400 }
      );
    }

    // Validate code format (must be numeric, at least 6 digits)
    const cleanCode = code.replace(/\D/g, '');
    if (cleanCode.length < 6) {
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

    const { error } = await supabase.auth.verifyOtp({
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

    const { data: userData } = await supabase.auth.admin.listUsers();
    const supaUser = userData?.users?.find((u) => u.email?.toLowerCase() === normalizedEmail);
    const fullName =
      typeof supaUser?.user_metadata?.full_name === 'string' ? supaUser.user_metadata.full_name : null;
    const role = normalizedEmail === OWNER_EMAIL ? 'SUPER_ADMIN' : 'USER';

    if (supaUser) {
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
    } else {
      await db.user.updateMany({
        where: { email: normalizedEmail },
        data: { emailVerified: true },
      });
    }

    return NextResponse.json({
      success: true,
      verified: true,
    });
  } catch (error) {
    console.error('Error verifying code:', error);
    return NextResponse.json(
      { error: 'No se pudo verificar el código.' },
      { status: 500 }
    );
  }
}
