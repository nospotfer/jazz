'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function VerifyCodePage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, []);

  const inputClasses =
    'w-full px-3 py-3 bg-[#1f2937] border border-[#374151] rounded-lg text-white placeholder-[#9CA3AF] text-base focus:outline-none focus:border-[#FBBF24] focus:ring-1 focus:ring-[#FBBF24] transition-colors';

  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || code.trim().length < 6) {
      setError('Enter a valid email and verification code');
      return;
    }

    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalizedEmail,
          code: code.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid verification code');
        return;
      }

      setMessage('Email verified successfully! Redirecting to sign in...');
      setTimeout(() => {
        router.push(`/auth?tab=login&email=${encodeURIComponent(normalizedEmail)}`);
      }, 1200);
    } catch {
      setError('Failed to verify code');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      setError('Enter a valid email to resend the code');
      return;
    }

    setResending(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to resend code');
        return;
      }

      setMessage('A new verification code was sent to your email.');
    } catch {
      setError('Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-lg overflow-hidden">
        <div className="p-8 space-y-5">
          <h1 className="text-2xl font-bold text-white text-center">Verify your email</h1>
          <p className="text-sm text-[#9CA3AF] text-center">
            We sent a verification code to your email. Enter it below to activate your account.
          </p>

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label htmlFor="verifyEmail" className="block text-sm font-medium text-[#D1D5DB] mb-1.5">
                Email
              </label>
              <input
                id="verifyEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClasses}
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="verifyCode" className="block text-sm font-medium text-[#D1D5DB] mb-1.5">
                Verification code
              </label>
              <input
                id="verifyCode"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className={inputClasses}
                placeholder="Enter code"
                minLength={6}
                required
              />
            </div>

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

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-[#FBBF24] hover:bg-[#F59E0B] text-black font-bold rounded-lg text-base disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleResendCode}
              disabled={resending}
              className="text-sm text-[#FBBF24] hover:text-[#F59E0B] disabled:opacity-70 transition-colors"
            >
              {resending ? 'Sending...' : 'Resend code'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/auth?tab=login')}
              className="text-sm text-[#9CA3AF] hover:text-white transition-colors"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
