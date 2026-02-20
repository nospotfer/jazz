import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
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
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { error } = await supabase.auth.verifyOtp({
      email,
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
