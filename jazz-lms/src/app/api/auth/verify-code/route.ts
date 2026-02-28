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
        { error: 'Supabase URL is not configured in server environment.' },
        { status: 500 }
      );
    }

    if (hasPlaceholder(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'your-anon-key')) {
      return NextResponse.json(
        { error: 'Supabase anon key is not configured in server environment.' },
        { status: 500 }
      );
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY.includes('your-service-role-key')) {
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY is required for email verification flow.' },
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
            'Authentication is not configured. Set valid NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY in environment variables.',
        },
        { status: 500 }
      );
    }

    if (!normalizedEmail || !code) {
      return NextResponse.json(
        { error: 'Email and code are required' },
        { status: 400 }
      );
    }

    // Validate code format (must be numeric, at least 6 digits)
    const cleanCode = code.replace(/\D/g, '');
    if (cleanCode.length < 6) {
      return NextResponse.json(
        { error: 'Invalid verification code format' },
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
          { error: 'Verification code has expired. Please request a new one.' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'Invalid verification code. Please check and try again.' },
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
      { error: 'Failed to verify code' },
      { status: 500 }
    );
  }
}
