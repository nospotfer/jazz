import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { db } from '@/lib/db';
import { hasValidSupabaseServerConfig } from '@/lib/supabase-config';

const OWNER_EMAIL = (process.env.ADMIN_OWNER_EMAIL || 'admin@neurofactory.net').toLowerCase();

export async function POST(request: Request) {
  try {
    const { email, password, fullName } = await request.json();
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

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Email, password and full name are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if already fully registered in Prisma
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });
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
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (!supaUser) {
      return NextResponse.json(
        { error: 'Please verify your email first' },
        { status: 400 }
      );
    }

    if (!supaUser.email_confirmed_at) {
      return NextResponse.json(
        { error: 'Please verify your email code before creating the account' },
        { status: 400 }
      );
    }

    // Check if this Supabase user already has a password (already registered)
    if (supaUser.user_metadata?.full_name) {
      return NextResponse.json(
        { error: 'This email is already registered. Please sign in instead.' },
        { status: 409 }
      );
    }

    // Set password and metadata on the existing Supabase user
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      supaUser.id,
      {
        password,
        user_metadata: { full_name: fullName },
      }
    );

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    // Create/update user in Prisma DB
    const isOwner = email.toLowerCase() === OWNER_EMAIL;
    const role = isOwner ? 'SUPER_ADMIN' : 'USER';

    await db.user.upsert({
      where: { email },
      create: {
        id: supaUser.id,
        email,
        name: fullName,
        emailVerified: true,
        role,
      },
      update: {
        name: fullName,
        emailVerified: true,
        ...(isOwner && { role: 'SUPER_ADMIN' }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Account created successfully!',
    });
  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
