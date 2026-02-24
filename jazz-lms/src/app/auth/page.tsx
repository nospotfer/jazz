'use client';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClient } from '@/utils/supabase/client';
import { useMemo, useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { hasValidSupabasePublicConfig } from '@/lib/supabase-config';

export default function AuthPage() {
  const supabase = createClient();
  const router = useRouter();
  const hasSupabaseConfig = hasValidSupabasePublicConfig(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'register') {
      setActiveTab('register');
    }
  }, []);

  // Register form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<NodeJS.Timeout | null>(null);

  const redirectTo = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    return `${window.location.origin}/auth/callback`;
  }, []);

  const startCooldown = () => {
    setCooldown(60);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startCooldownWithSeconds = (seconds: number) => {
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    setCooldown(seconds);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendCode = async () => {
    if (!email) {
      setError('Enter your email first');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Enter a valid email');
      return;
    }

    setSendingCode(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          const retryAfter = Number(data.retryAfterSeconds || 120);
          startCooldownWithSeconds(retryAfter);
        }
        if (res.status === 409) {
          // Email already registered — offer to switch to login
          setError(data.error || 'This email is already registered.');
          return;
        }
        setError(data.error || 'Failed to send code');
        return;
      }

      setCodeSent(true);
      setMessage('Verification code sent! Check your email inbox.');
      startCooldown();
    } catch {
      setError('Failed to send verification code');
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length < 8) {
      setError('Enter the verification code (minimum 8 digits)');
      return;
    }

    setVerifyingCode(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid verification code');
        return;
      }

      setEmailVerified(true);
      setMessage('Email verified! Now complete your registration.');
    } catch {
      setError('Failed to verify code');
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }
    if (!emailVerified) {
      setError('Please verify your email first');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      // 1. Set password + save to Prisma via server route
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName: fullName.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
        return;
      }

      // 2. Sign in with the new password (client-side to set session cookie)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setMessage('Account created! Please sign in.');
        setTimeout(() => setActiveTab('login'), 2000);
        return;
      }

      setMessage('Account created! Redirecting...');
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    });
  };

  const inputClasses =
    'w-full px-3 py-3 bg-[#1f2937] border border-[#374151] rounded-lg text-white placeholder-[#9CA3AF] text-base focus:outline-none focus:border-[#FBBF24] focus:ring-1 focus:ring-[#FBBF24] transition-colors';

  const labelClasses = 'block text-sm font-medium text-[#D1D5DB] mb-1.5';

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-lg overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => { setActiveTab('login'); setError(''); setMessage(''); }}
            className={`flex-1 py-3.5 text-base font-semibold transition-colors ${
              activeTab === 'login'
                ? 'text-[#FBBF24] border-b-2 border-[#FBBF24] bg-card'
                : 'text-[#9CA3AF] hover:text-white bg-transparent'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setActiveTab('register'); setError(''); setMessage(''); }}
            className={`flex-1 py-3.5 text-base font-semibold transition-colors ${
              activeTab === 'register'
                ? 'text-[#FBBF24] border-b-2 border-[#FBBF24] bg-card'
                : 'text-[#9CA3AF] hover:text-white bg-transparent'
            }`}
          >
            Sign Up
          </button>
        </div>

        <div className="p-8">
          {!hasSupabaseConfig && (
            <p className="mb-4 text-sm text-red-300 bg-red-900/30 border border-red-700/40 rounded-lg px-3 py-2">
              Authentication is not configured. Set valid NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your local env.
            </p>
          )}

          {/* ========== LOGIN TAB ========== */}
          {activeTab === 'login' && (
            <Auth
              supabaseClient={supabase}
              redirectTo={redirectTo}
              providers={['google']}
              view="sign_in"
              showLinks={false}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: '#FBBF24',
                      brandAccent: '#F59E0B',
                      inputBackground: '#1f2937',
                      inputBorder: '#374151',
                      inputBorderHover: '#FBBF24',
                      inputBorderFocus: '#FBBF24',
                      inputText: '#ffffff',
                      inputPlaceholder: '#9CA3AF',
                      messageText: '#D1D5DB',
                      messageTextDanger: '#FCA5A5',
                      anchorTextColor: '#FBBF24',
                      anchorTextHoverColor: '#F59E0B',
                    },
                    space: {
                      inputPadding: '12px',
                      buttonPadding: '12px',
                    },
                    fontSizes: {
                      baseButtonSize: '16px',
                      baseInputSize: '16px',
                      baseLabelSize: '15px',
                      baseBodySize: '15px',
                    },
                    radii: {
                      borderRadiusButton: '8px',
                      inputBorderRadius: '8px',
                    },
                  },
                },
              }}
            />
          )}

          {/* ========== REGISTER TAB ========== */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-5">
              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className={labelClasses}>
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  placeholder="Your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={inputClasses}
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className={labelClasses}>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailVerified) {
                      setEmailVerified(false);
                      setCodeSent(false);
                      setVerificationCode('');
                    }
                  }}
                  disabled={emailVerified}
                  className={`${inputClasses} ${emailVerified ? 'opacity-60 cursor-not-allowed' : ''}`}
                  required
                />
              </div>

              {/* Email Verification */}
              <div>
                <label className={labelClasses}>
                  Email Verification
                  {emailVerified && (
                    <span className="ml-2 text-green-400 text-xs font-normal">✓ Verified</span>
                  )}
                </label>

                {!emailVerified && !codeSent && (
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={sendingCode}
                    className="w-full py-3 bg-[#FBBF24] hover:bg-[#F59E0B] text-black font-semibold rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {sendingCode ? 'Sending...' : 'Send Verification Code'}
                  </button>
                )}

                {!emailVerified && codeSent && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        minLength={8}
                        placeholder="Enter verification code"
                        value={verificationCode}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          setVerificationCode(val);
                        }}
                        className={`${inputClasses} flex-1`}
                      />
                      <button
                        type="button"
                        onClick={handleVerifyCode}
                        disabled={verifyingCode || verificationCode.length < 8}
                        className="px-5 py-3 bg-[#FBBF24] hover:bg-[#F59E0B] text-black font-semibold rounded-lg text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {verifyingCode ? '...' : 'Verify'}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handleSendCode}
                      disabled={sendingCode || cooldown > 0}
                      className="text-sm text-[#FBBF24] hover:text-[#F59E0B] disabled:text-[#6B7280] disabled:cursor-not-allowed transition-colors"
                    >
                      {sendingCode
                        ? 'Sending...'
                        : cooldown > 0
                        ? `Resend code in ${cooldown}s`
                        : 'Resend code'}
                    </button>
                  </div>
                )}

                {emailVerified && (
                  <div className="flex items-center gap-2 mt-1 py-2 px-3 bg-green-900/30 border border-green-700/50 rounded-lg">
                    <span className="text-green-400 text-sm">✓ Email verified successfully</span>
                  </div>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className={labelClasses}>
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClasses}
                  minLength={6}
                  required
                />
              </div>

              {/* Error / Message */}
              {error && (
                <p className="text-sm text-red-400 bg-red-900/20 border border-red-700/40 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
              {message && !error && (
                <p className="text-sm text-green-400 bg-green-900/20 border border-green-700/40 rounded-lg px-3 py-2">
                  {message}
                </p>
              )}

              {/* Register Button */}
              <button
                type="submit"
                disabled={loading || !emailVerified}
                className="w-full py-3 bg-[#FBBF24] hover:bg-[#F59E0B] text-black font-bold rounded-lg text-base disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#374151]"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-card text-[#9CA3AF]">Or</span>
                </div>
              </div>

              {/* Google Sign Up */}
              <button
                type="button"
                onClick={handleGoogleSignUp}
                className="w-full flex items-center justify-center gap-3 py-3 bg-white hover:bg-gray-100 text-gray-800 font-semibold rounded-lg text-base transition-colors border border-gray-300"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign up with Google
              </button>

              {/* Already have account link */}
              <p className="text-center text-[#9CA3AF] text-sm mt-3">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setActiveTab('login'); setError(''); setMessage(''); }}
                  className="text-[#FBBF24] hover:text-[#F59E0B] font-medium"
                >
                  Sign in
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
