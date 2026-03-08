'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/providers/language-provider';

export default function VerifyCodePage() {
  const router = useRouter();
  const { language } = useLanguage();
  const copy = {
    es: {
      invalidEmailCode: 'Introduce un correo y un código de verificación válidos',
      invalidCode: 'Código de verificación inválido',
      verified: '¡Correo verificado correctamente! Redirigiendo al inicio de sesión...',
      verifyFailed: 'No se pudo verificar el código',
      invalidEmailResend: 'Introduce un correo válido para reenviar el código',
      resendFailed: 'No se pudo reenviar el código',
      resendSuccess: 'Se envió un nuevo código de verificación a tu correo.',
      title: 'Verifica tu correo',
      subtitle: 'Te enviamos un código de verificación a tu correo. Introdúcelo abajo para activar tu cuenta.',
      email: 'Correo',
      emailPlaceholder: 'tu@correo.com',
      code: 'Código de verificación',
      codePlaceholder: 'Introduce el código',
      verifying: 'Verificando...',
      verifyButton: 'Verificar código',
      resending: 'Enviando...',
      resendButton: 'Reenviar código',
      backToLogin: 'Volver a iniciar sesión',
    },
    en: {
      invalidEmailCode: 'Enter a valid email and verification code',
      invalidCode: 'Invalid verification code',
      verified: 'Email verified successfully! Redirecting to sign in...',
      verifyFailed: 'Unable to verify the code',
      invalidEmailResend: 'Enter a valid email to resend the code',
      resendFailed: 'Unable to resend the code',
      resendSuccess: 'A new verification code was sent to your email.',
      title: 'Verify your email',
      subtitle: 'We sent a verification code to your email. Enter it below to activate your account.',
      email: 'Email',
      emailPlaceholder: 'you@email.com',
      code: 'Verification code',
      codePlaceholder: 'Enter the code',
      verifying: 'Verifying...',
      verifyButton: 'Verify code',
      resending: 'Sending...',
      resendButton: 'Resend code',
      backToLogin: 'Back to sign in',
    },
    fr: {
      invalidEmailCode: 'Entrez une adresse e-mail et un code de vérification valides',
      invalidCode: 'Code de vérification invalide',
      verified: 'E-mail vérifié avec succès ! Redirection vers la connexion...',
      verifyFailed: 'Impossible de vérifier le code',
      invalidEmailResend: 'Entrez une adresse e-mail valide pour renvoyer le code',
      resendFailed: 'Impossible de renvoyer le code',
      resendSuccess: 'Un nouveau code de vérification a été envoyé à votre e-mail.',
      title: 'Vérifiez votre e-mail',
      subtitle: 'Nous avons envoyé un code de vérification à votre e-mail. Saisissez-le ci-dessous pour activer votre compte.',
      email: 'E-mail',
      emailPlaceholder: 'vous@email.com',
      code: 'Code de vérification',
      codePlaceholder: 'Entrez le code',
      verifying: 'Vérification...',
      verifyButton: 'Vérifier le code',
      resending: 'Envoi...',
      resendButton: 'Renvoyer le code',
      backToLogin: 'Retour à la connexion',
    },
    pt: {
      invalidEmailCode: 'Digite um e-mail e um código de verificação válidos',
      invalidCode: 'Código de verificação inválido',
      verified: 'E-mail verificado com sucesso! Redirecionando para o login...',
      verifyFailed: 'Não foi possível verificar o código',
      invalidEmailResend: 'Digite um e-mail válido para reenviar o código',
      resendFailed: 'Não foi possível reenviar o código',
      resendSuccess: 'Um novo código de verificação foi enviado para seu e-mail.',
      title: 'Verifique seu e-mail',
      subtitle: 'Enviamos um código de verificação para seu e-mail. Digite-o abaixo para ativar sua conta.',
      email: 'E-mail',
      emailPlaceholder: 'voce@email.com',
      code: 'Código de verificação',
      codePlaceholder: 'Digite o código',
      verifying: 'Verificando...',
      verifyButton: 'Verificar código',
      resending: 'Enviando...',
      resendButton: 'Reenviar código',
      backToLogin: 'Voltar ao login',
    },
  }[language];

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
      setError(copy.invalidEmailCode);
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
        setError(data.error || copy.invalidCode);
        return;
      }

      setMessage(copy.verified);
      setTimeout(() => {
        router.push(`/auth?tab=login&email=${encodeURIComponent(normalizedEmail)}`);
      }, 1200);
    } catch {
      setError(copy.verifyFailed);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      setError(copy.invalidEmailResend);
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
        setError(data.error || copy.resendFailed);
        return;
      }

      setMessage(copy.resendSuccess);
    } catch {
      setError(copy.resendFailed);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-3 sm:p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-lg overflow-hidden">
        <div className="p-5 sm:p-8 space-y-5">
          <h1 className="text-xl sm:text-2xl font-bold text-white text-center">{copy.title}</h1>
          <p className="text-sm text-[#9CA3AF] text-center">
            {copy.subtitle}
          </p>

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label htmlFor="verifyEmail" className="block text-sm font-medium text-[#D1D5DB] mb-1.5">
                {copy.email}
              </label>
              <input
                id="verifyEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClasses}
                placeholder={copy.emailPlaceholder}
                required
              />
            </div>

            <div>
              <label htmlFor="verifyCode" className="block text-sm font-medium text-[#D1D5DB] mb-1.5">
                {copy.code}
              </label>
              <input
                id="verifyCode"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className={inputClasses}
                placeholder={copy.codePlaceholder}
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
              {submitting ? copy.verifying : copy.verifyButton}
            </button>
          </form>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <button
              type="button"
              onClick={handleResendCode}
              disabled={resending}
              className="text-sm text-[#FBBF24] hover:text-[#F59E0B] disabled:opacity-70 transition-colors"
            >
              {resending ? copy.resending : copy.resendButton}
            </button>
            <button
              type="button"
              onClick={() => router.push('/auth?tab=login')}
              className="text-sm text-[#9CA3AF] hover:text-white transition-colors"
            >
              {copy.backToLogin}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
