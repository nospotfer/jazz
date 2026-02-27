import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { db } from '@/lib/db';
import { hasValidSupabaseServerConfig } from '@/lib/supabase-config';

const OWNER_EMAIL = (process.env.ADMIN_OWNER_EMAIL || 'admin@neurofactory.net').toLowerCase();

export async function POST(request: Request) {
  try {
    const { email, password, fullName } = await request.json();
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

    if (!normalizedEmail || !password || !fullName) {
      return NextResponse.json(
        { error: 'Email, password and full name are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check if already verified in Prisma
    let existingUser = null;
    try {
      existingUser = await db.user.findUnique({
        where: { email: normalizedEmail },
      });
    } catch (err) {
      console.warn('Prisma user lookup failed, continuing with Supabase-only checks:', err);
    }
    if (existingUser && existingUser.emailVerified) {
      return NextResponse.json(
        { error: 'This email is already registered. Please sign in instead.' },
        { status: 409 }
      );
    }

    // Use Supabase Admin to update password on the OTP-created user
    const supabase = createClient(
      url!,
      serviceRoleKey!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Find user by email in Supabase Auth
    const { data: userData } = await supabase.auth.admin.listUsers();
    const supaUser = userData?.users?.find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    if (supaUser?.email_confirmed_at) {
      return NextResponse.json(
        { error: 'This email is already registered. Please sign in instead.' },
        { status: 409 }
      );
    }

    let userId = supaUser?.id;

    if (!supaUser) {
      const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
        email: normalizedEmail,
        password,
        user_metadata: { full_name: fullName.trim() },
        email_confirm: false,
      });

      if (createError || !createdUser.user) {
        return NextResponse.json(
          { error: createError?.message || 'Failed to create auth user' },
          { status: 400 }
        );
      }

      userId = createdUser.user.id;
    } else {
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        supaUser.id,
        {
          password,
          user_metadata: { full_name: fullName.trim() },
        }
      );

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 });
      }

      userId = supaUser.id;
    }

    // Send verification code after account creation/update
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: false,
      },
    });

    if (otpError) {
      return NextResponse.json(
        { error: otpError.message || 'Failed to send verification code' },
        { status: 400 }
      );
    }

    // Create/update user in Prisma DB as unverified
    const isOwner = normalizedEmail === OWNER_EMAIL;
    const role = isOwner ? 'SUPER_ADMIN' : 'USER';

    await db.user.upsert({
      where: { email: normalizedEmail },
      create: {
        id: userId!,
        email: normalizedEmail,
        name: fullName.trim(),
        emailVerified: false,
        role,
      },
      update: {
        name: fullName.trim(),
        emailVerified: false,
        ...(isOwner && { role: 'SUPER_ADMIN' }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Account created. Enter the verification code sent to your email.',
    });
  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
