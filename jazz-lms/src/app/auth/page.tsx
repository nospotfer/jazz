'use client';
import { createClient } from '@/utils/supabase/client';
import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthChangeEvent } from '@supabase/supabase-js';

export default function AuthPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const REMEMBER_EMAIL_KEY = 'auth:rememberEmail';
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const urlEmail = params.get('email');
    if (params.get('tab') === 'register') {
      setActiveTab('register');
    }
    if (urlEmail) {
      setLoginEmail(urlEmail);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const rememberedEmail = window.localStorage.getItem(REMEMBER_EMAIL_KEY);
    if (rememberedEmail) {
      setLoginEmail(rememberedEmail);
      setRememberMe(true);
    } else {
      setRememberMe(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (isMounted && data.user) {
        router.replace('/dashboard');
      }
    };

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent) => {
      if (event === 'SIGNED_IN') {
        router.replace('/dashboard');
        router.refresh();
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  // Sign up state
  const [fullName, setFullName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerMessage, setRegisterMessage] = useState('');
  const [registerError, setRegisterError] = useState('');

  // Sign in state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const redirectTo = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    return `${window.location.origin}/auth/callback`;
  }, []);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const normalizedEmail = registerEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!fullName.trim()) {
      setRegisterError('Full name is required');
      return;
    }
    if (!emailRegex.test(normalizedEmail)) {
      setRegisterError('Enter a valid email');
      return;
    }
    if (registerPassword.length < 8) {
      setRegisterError('Password must be at least 8 characters');
      return;
    }

    setRegisterLoading(true);
    setRegisterError('');
    setRegisterMessage('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalizedEmail,
          password: registerPassword,
          fullName: fullName.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setRegisterError(data.error || 'Registration failed');
        return;
      }

      setRegisterMessage(data.message || 'Account created. Verify your email code to continue.');
      router.push(`/auth/verify?email=${encodeURIComponent(normalizedEmail)}`);
    } catch {
      setRegisterError('Registration failed. Please try again.');
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const normalizedEmail = loginEmail.trim().toLowerCase();
    if (!normalizedEmail || !loginPassword) {
      setLoginError('Email and password are required');
      return;
    }

    setLoginLoading(true);
    setLoginError('');

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: loginPassword,
      });

      if (signInError) {
        setLoginError(signInError.message || 'Unable to sign in');
        return;
      }

      if (typeof window !== 'undefined') {
        if (rememberMe) {
          window.localStorage.setItem(REMEMBER_EMAIL_KEY, normalizedEmail);
        } else {
          window.localStorage.removeItem(REMEMBER_EMAIL_KEY);
        }
      }

      router.replace('/dashboard');
      router.refresh();
    } catch {
      setLoginError('Unable to sign in. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoginError('');
    setRegisterError('');
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
  const helperClasses = 'text-xs text-[#9CA3AF] mt-1.5';

  const PasswordToggleIcon = ({ visible }: { visible: boolean }) => (
    visible ? (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 3l18 18" />
        <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
        <path d="M16.68 16.67A9.65 9.65 0 0 1 12 18c-5 0-9-6-9-6a16.7 16.7 0 0 1 3.33-3.88" />
        <path d="M9.88 5.1A9.7 9.7 0 0 1 12 5c5 0 9 6 9 6a16.6 16.6 0 0 1-1.67 2.39" />
      </svg>
    ) : (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )
  );

  const clearMessagesForTab = (tab: 'login' | 'register') => {
    setActiveTab(tab);
    setLoginError('');
    setRegisterError('');
    setRegisterMessage('');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-lg overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => clearMessagesForTab('login')}
            className={`flex-1 py-3.5 text-base font-semibold transition-colors ${
              activeTab === 'login'
                ? 'text-[#FBBF24] border-b-2 border-[#FBBF24] bg-card'
                : 'text-[#9CA3AF] hover:text-white bg-transparent'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => clearMessagesForTab('register')}
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
          <button
            type="button"
            onClick={handleGoogleAuth}
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
            {activeTab === 'register' ? 'Sign up with Google' : 'Sign in with Google'}
          </button>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#374151]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-card text-[#9CA3AF]">Or</span>
            </div>
          </div>

          {activeTab === 'register' ? (
            <form onSubmit={handleRegister} className="space-y-5">
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

              <div>
                <label htmlFor="registerEmail" className={labelClasses}>
                  Email
                </label>
                <input
                  id="registerEmail"
                  type="email"
                  placeholder="your@email.com"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  className={inputClasses}
                  required
                />
              </div>

              <div>
                <label htmlFor="registerPassword" className={labelClasses}>
                  Password
                </label>
                <div className="relative">
                  <input
                    id="registerPassword"
                    type={showRegisterPassword ? 'text' : 'password'}
                    placeholder="Your password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    className={`${inputClasses} pr-11`}
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-white transition-colors"
                    aria-label={showRegisterPassword ? 'Hide password' : 'Show password'}
                  >
                    <PasswordToggleIcon visible={showRegisterPassword} />
                  </button>
                </div>
                <p className={helperClasses}>Minimum 8 characters</p>
              </div>

              {registerError && (
                <p className="text-sm text-red-400 bg-red-900/20 border border-red-700/40 rounded-lg px-3 py-2">
                  {registerError}
                </p>
              )}
              {registerMessage && !registerError && (
                <p className="text-sm text-green-400 bg-green-900/20 border border-green-700/40 rounded-lg px-3 py-2">
                  {registerMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={registerLoading}
                className="w-full py-3 bg-[#FBBF24] hover:bg-[#F59E0B] text-black font-bold rounded-lg text-base disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {registerLoading ? 'Creating account...' : 'Create Account'}
              </button>

              <p className="text-center text-[#9CA3AF] text-sm mt-3">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => clearMessagesForTab('login')}
                  className="text-[#FBBF24] hover:text-[#F59E0B] font-medium"
                >
                  Sign in
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleSignIn} className="space-y-5">
              <div>
                <label htmlFor="loginEmail" className={labelClasses}>
                  Email
                </label>
                <input
                  id="loginEmail"
                  type="email"
                  placeholder="your@email.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className={inputClasses}
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="loginPassword" className="block text-sm font-medium text-[#D1D5DB]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => router.push(`/auth/forgot-password${loginEmail ? `?email=${encodeURIComponent(loginEmail.trim())}` : ''}`)}
                    className="text-sm text-[#FBBF24] hover:text-[#F59E0B] transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="relative">
                  <input
                    id="loginPassword"
                    type={showLoginPassword ? 'text' : 'password'}
                    placeholder="Your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className={`${inputClasses} pr-11`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-white transition-colors"
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                  >
                    <PasswordToggleIcon visible={showLoginPassword} />
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-[#D1D5DB] select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-[#4B5563] bg-[#1f2937] text-[#FBBF24] focus:ring-[#FBBF24]"
                />
                Remember me
              </label>

              {loginError && (
                <p className="text-sm text-red-400 bg-red-900/20 border border-red-700/40 rounded-lg px-3 py-2">
                  {loginError}
                </p>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3 bg-[#FBBF24] hover:bg-[#F59E0B] text-black font-bold rounded-lg text-base disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loginLoading ? 'Signing in...' : 'Sign In'}
              </button>

              <p className="text-center text-[#9CA3AF] text-sm mt-3">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => clearMessagesForTab('register')}
                  className="text-[#FBBF24] hover:text-[#F59E0B] font-medium"
                >
                  Sign up
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
