"use client";

import { useLanguage } from "@/components/providers/language-provider";
import { isValidEmailAddress } from "@/lib/email-validation";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const RESEND_COOLDOWN_SECONDS = 65;
const MAX_RESEND_RETRY_SECONDS = 3600;

function boundedRetrySeconds(value: unknown) {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0
    ? Math.min(value, MAX_RESEND_RETRY_SECONDS)
    : RESEND_COOLDOWN_SECONDS;
}

export default function VerifyCodePage() {
  const router = useRouter();
  const { language } = useLanguage();
  const copy = {
    es: {
      invalidEmailCode:
        "Introduce un correo y un código de verificación válidos",
      invalidCode: "Código de verificación inválido",
      verified:
        "¡Correo verificado correctamente! Redirigiendo al inicio de sesión...",
      verifyFailed: "No se pudo verificar el código",
      invalidEmailResend: "Introduce un correo válido para reenviar el código",
      resendFailed: "No se pudo reenviar el código",
      resendSuccess: "Se envió un nuevo código de verificación a tu correo.",
      title: "Verifica tu correo",
      subtitle:
        "Te enviamos un código de verificación a tu correo. Introdúcelo abajo para activar tu cuenta.",
      resumingRegistration:
        "Tu registro ya estaba pendiente. Verifica tu correo y usa la contraseña de tu registro inicial. Si no la recuerdas, restablécela desde el inicio de sesión.",
      email: "Correo",
      emailPlaceholder: "tu@correo.com",
      code: "Código de verificación",
      codePlaceholder: "Introduce el código",
      verifying: "Verificando...",
      verifyButton: "Verificar código",
      resending: "Enviando...",
      resendButton: "Reenviar código",
      resendWait: (seconds: number) =>
        `Puedes reenviar el código en ${seconds} ${seconds === 1 ? "segundo" : "segundos"}.`,
      backToLogin: "Volver a iniciar sesión",
    },
    en: {
      invalidEmailCode: "Enter a valid email and verification code",
      invalidCode: "Invalid verification code",
      verified: "Email verified successfully! Redirecting to sign in...",
      verifyFailed: "Unable to verify the code",
      invalidEmailResend: "Enter a valid email to resend the code",
      resendFailed: "Unable to resend the code",
      resendSuccess: "A new verification code was sent to your email.",
      title: "Verify your email",
      subtitle:
        "We sent a verification code to your email. Enter it below to activate your account.",
      resumingRegistration:
        "Your registration was already pending. Verify your email and sign in with your original password. If you forgot it, reset it from the sign-in page.",
      email: "Email",
      emailPlaceholder: "you@email.com",
      code: "Verification code",
      codePlaceholder: "Enter the code",
      verifying: "Verifying...",
      verifyButton: "Verify code",
      resending: "Sending...",
      resendButton: "Resend code",
      resendWait: (seconds: number) =>
        `You can resend the code in ${seconds} ${seconds === 1 ? "second" : "seconds"}.`,
      backToLogin: "Back to sign in",
    },
    fr: {
      invalidEmailCode:
        "Entrez une adresse e-mail et un code de vérification valides",
      invalidCode: "Code de vérification invalide",
      verified: "E-mail vérifié avec succès ! Redirection vers la connexion...",
      verifyFailed: "Impossible de vérifier le code",
      invalidEmailResend:
        "Entrez une adresse e-mail valide pour renvoyer le code",
      resendFailed: "Impossible de renvoyer le code",
      resendSuccess:
        "Un nouveau code de vérification a été envoyé à votre e-mail.",
      title: "Vérifiez votre e-mail",
      subtitle:
        "Nous avons envoyé un code de vérification à votre e-mail. Saisissez-le ci-dessous pour activer votre compte.",
      resumingRegistration:
        "Votre inscription était déjà en attente. Vérifiez votre e-mail et connectez-vous avec votre mot de passe initial. Si vous l’avez oublié, réinitialisez-le depuis la page de connexion.",
      email: "E-mail",
      emailPlaceholder: "vous@email.com",
      code: "Code de vérification",
      codePlaceholder: "Entrez le code",
      verifying: "Vérification...",
      verifyButton: "Vérifier le code",
      resending: "Envoi...",
      resendButton: "Renvoyer le code",
      resendWait: (seconds: number) =>
        `Vous pourrez renvoyer le code dans ${seconds} ${seconds === 1 ? "seconde" : "secondes"}.`,
      backToLogin: "Retour à la connexion",
    },
    pt: {
      invalidEmailCode: "Digite um e-mail e um código de verificação válidos",
      invalidCode: "Código de verificação inválido",
      verified: "E-mail verificado com sucesso! Redirecionando para o login...",
      verifyFailed: "Não foi possível verificar o código",
      invalidEmailResend: "Digite um e-mail válido para reenviar o código",
      resendFailed: "Não foi possível reenviar o código",
      resendSuccess:
        "Um novo código de verificação foi enviado para seu e-mail.",
      title: "Verifique seu e-mail",
      subtitle:
        "Enviamos um código de verificação para seu e-mail. Digite-o abaixo para ativar sua conta.",
      resumingRegistration:
        "Seu cadastro já estava pendente. Verifique seu e-mail e entre com a senha do cadastro inicial. Se você a esqueceu, redefina-a na página de login.",
      email: "E-mail",
      emailPlaceholder: "voce@email.com",
      code: "Código de verificação",
      codePlaceholder: "Digite o código",
      verifying: "Verificando...",
      verifyButton: "Verificar código",
      resending: "Enviando...",
      resendButton: "Reenviar código",
      resendWait: (seconds: number) =>
        `Você pode reenviar o código em ${seconds} ${seconds === 1 ? "segundo" : "segundos"}.`,
      backToLogin: "Voltar ao login",
    },
  }[language];

  const [email, setEmail] = useState("");
  const [resumingRegistration, setResumingRegistration] = useState(false);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [cooldownEndsAt, setCooldownEndsAt] = useState(0);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const actionPending = useRef(false);
  const resendDeadline = useRef(0);
  const mounted = useRef(false);
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (redirectTimer.current !== null) clearTimeout(redirectTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!cooldownEndsAt) return;
    const updateCountdown = () => {
      const seconds = Math.max(0, Math.ceil((cooldownEndsAt - Date.now()) / 1000));
      setCooldownSeconds(seconds);
      if (seconds === 0) {
        resendDeadline.current = 0;
        setCooldownEndsAt(0);
      }
    };
    const interval = setInterval(updateCountdown, 1000);
    updateCountdown();
    return () => clearInterval(interval);
  }, [cooldownEndsAt]);

  const startResendCooldown = (seconds: number) => {
    const deadline = Date.now() + seconds * 1000;
    resendDeadline.current = deadline;
    setCooldownEndsAt(deadline);
    setCooldownSeconds(seconds);
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    setResumingRegistration(params.get("pending") === "1");
    const emailParam = params.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, []);

  const inputClasses =
    "w-full px-3 py-3 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground text-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors";

  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (actionPending.current) return;

    const normalizedEmail = email.trim().toLowerCase();
    if (!isValidEmailAddress(normalizedEmail) || !/^\d{6,10}$/.test(code.trim())) {
      setError(copy.invalidEmailCode);
      return;
    }

    actionPending.current = true;
    setSubmitting(true);
    setError("");
    setMessage("");

    let verified = false;
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          code: code.trim(),
        }),
      });

      const data = await res.json();
      if (!mounted.current) return;
      if (!res.ok) {
        setError(data.error || copy.invalidCode);
        return;
      }

      verified = true;
      setVerificationComplete(true);
      setMessage(copy.verified);
      redirectTimer.current = setTimeout(() => {
        router.push(
          `/auth?tab=login&email=${encodeURIComponent(normalizedEmail)}&just_registered=1`,
        );
      }, 1200);
    } catch {
      if (mounted.current) setError(copy.verifyFailed);
    } finally {
      if (!verified) actionPending.current = false;
      if (mounted.current) setSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (actionPending.current || Date.now() < resendDeadline.current) return;
    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmailAddress(normalizedEmail)) {
      setError(copy.invalidEmailResend);
      return;
    }

    actionPending.current = true;
    setResending(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const data = await res.json().catch(() => null);
      if (!mounted.current) return;
      if (res.status === 429) {
        startResendCooldown(boundedRetrySeconds(data?.retryAfterSeconds));
      }
      if (!res.ok || !data) {
        setError(typeof data?.error === "string" ? data.error : copy.resendFailed);
        return;
      }

      startResendCooldown(RESEND_COOLDOWN_SECONDS);
      setMessage(copy.resendSuccess);
    } catch {
      if (mounted.current) setError(copy.resendFailed);
    } finally {
      actionPending.current = false;
      if (mounted.current) setResending(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-3 sm:p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-lg overflow-hidden">
        <div className="p-5 sm:p-8 space-y-5">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground text-center">
            {copy.title}
          </h1>
          <p className="text-sm text-muted-foreground text-center">
            {resumingRegistration ? copy.resumingRegistration : copy.subtitle}
          </p>

          <form method="post" onSubmit={handleVerify} className="space-y-4">
            <div>
              <label
                htmlFor="verifyEmail"
                className="block text-sm font-medium text-foreground mb-1.5"
              >
                {copy.email}
              </label>
              <input
                id="verifyEmail"
                type="email"
                name="email"
                autoComplete="email"
                disabled={submitting || resending || verificationComplete}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClasses}
                placeholder={copy.emailPlaceholder}
                required
              />
            </div>

            <div>
              <label
                htmlFor="verifyCode"
                className="block text-sm font-medium text-foreground mb-1.5"
              >
                {copy.code}
              </label>
              <input
                id="verifyCode"
                type="text"
                name="verificationCode"
                autoComplete="one-time-code"
                disabled={submitting || resending || verificationComplete}
                inputMode="numeric"
                pattern="[0-9]*"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className={inputClasses}
                placeholder={copy.codePlaceholder}
                minLength={6}
                required
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400 bg-red-900/20 border border-red-700/40 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            {message && !error && (
              <p role="status" className="text-sm text-green-700 dark:text-green-400 bg-green-900/20 border border-green-700/40 rounded-lg px-3 py-2">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || resending || verificationComplete}
              className="w-full py-3 bg-[#FBBF24] hover:bg-[#F59E0B] text-black font-bold rounded-lg text-base disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? copy.verifying : copy.verifyButton}
            </button>
          </form>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <button
              type="button"
              onClick={handleResendCode}
              disabled={submitting || resending || verificationComplete || cooldownSeconds > 0}
              aria-describedby={cooldownSeconds > 0 ? "resend-cooldown" : undefined}
              className="text-sm text-primary hover:text-primary/80 disabled:opacity-70 transition-colors"
            >
              {resending ? copy.resending : copy.resendButton}
            </button>
            <button
              type="button"
              onClick={() => router.push("/auth?tab=login")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {copy.backToLogin}
            </button>
          </div>
          {cooldownSeconds > 0 && (
            <p id="resend-cooldown" role="timer" aria-live="off" className="text-sm text-muted-foreground">
              {copy.resendWait(cooldownSeconds)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
