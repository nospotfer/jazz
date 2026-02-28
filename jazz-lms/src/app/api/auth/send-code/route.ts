import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { db } from '@/lib/db';
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

    const { email } = await request.json();
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

    if (!normalizedEmail) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if email is already registered (has password set in Prisma)
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser && existingUser.emailVerified) {
      return NextResponse.json(
        { error: 'This email is already registered. Please sign in instead.' },
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
        { error: 'Account not found. Please create your account first.' },
        { status: 404 }
      );
    }

    if (existingSupaUser.email_confirmed_at) {
      return NextResponse.json(
        { error: 'This email is already registered. Please sign in instead.' },
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
            error: 'Too many attempts. Please wait a few minutes and try again.',
            retryAfterSeconds: 120,
          },
          { status: 429 }
        );
      }

      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email',
    });
  } catch (error) {
    console.error('Error sending verification code:', error);
    return NextResponse.json(
      { error: 'Failed to send verification code' },
      { status: 500 }
    );
  }
}
