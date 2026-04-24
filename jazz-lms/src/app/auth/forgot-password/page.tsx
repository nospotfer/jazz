"use client";

import { useLanguage } from "@/components/providers/language-provider";
import { resolveClientAppOrigin } from "@/lib/app-origin";
import { createClient } from "@/utils/supabase/client";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient({ flowType: "implicit" }), []);
  const { language } = useLanguage();
  const copy = {
    es: {
      invalidEmail: "Introduce un correo válido",
      requestFailed:
        "No fue posible enviar el enlace ahora. Inténtalo de nuevo en unos minutos.",
      requestRateLimited:
        "Has solicitado enlaces muy rápido. Espera un poco y vuelve a intentarlo.",
      title: "Restablece tu contraseña",
      subtitle:
        "Introduce el correo asociado a tu cuenta y te enviaremos un enlace para restablecer tu contraseña.",
      email: "Correo",
      emailPlaceholder: "tu@correo.com",
      sending: "Enviando...",
      sendResetLink: "Enviar enlace de restablecimiento",
      backToLogin: "Volver a iniciar sesión",
      closeAuth: "Fechar",
      inboxTitle: "¡Revisa tu bandeja de entrada!",
      inboxDesc:
        "Si existe una cuenta con ese correo, hemos enviado un enlace para restablecer la contraseña. Revisa también la carpeta de spam por si acaso.",
    },
    en: {
      invalidEmail: "Enter a valid email",
      requestFailed:
        "Unable to send the link right now. Please try again in a few minutes.",
      requestRateLimited:
        "You requested reset links too quickly. Please wait a moment and try again.",
      title: "Reset your password",
      subtitle:
        "Enter the email linked to your account and we’ll send you a password reset link.",
      email: "Email",
      emailPlaceholder: "you@email.com",
      sending: "Sending...",
      sendResetLink: "Send reset link",
      backToLogin: "Back to sign in",
      closeAuth: "Close",
      inboxTitle: "Check your inbox!",
      inboxDesc:
        "If an account exists for that email, we sent a password reset link. Please also check your spam folder.",
    },
    fr: {
      invalidEmail: "Entrez une adresse e-mail valide",
      requestFailed:
        "Impossible d’envoyer le lien pour le moment. Réessayez dans quelques minutes.",
      requestRateLimited:
        "Vous avez demandé des liens trop rapidement. Patientez un instant puis réessayez.",
      title: "Réinitialisez votre mot de passe",
      subtitle:
        "Entrez l’e-mail associé à votre compte et nous vous enverrons un lien de réinitialisation.",
      email: "E-mail",
      emailPlaceholder: "vous@email.com",
      sending: "Envoi...",
      sendResetLink: "Envoyer le lien de réinitialisation",
      backToLogin: "Retour à la connexion",
      closeAuth: "Fermer",
      inboxTitle: "Vérifiez votre boîte de réception !",
      inboxDesc:
        "Si un compte existe avec cet e-mail, nous avons envoyé un lien de réinitialisation. Vérifiez aussi votre dossier spam.",
    },
    pt: {
      invalidEmail: "Digite um e-mail válido",
      requestFailed:
        "No fue posible enviar el enlace ahora. Inténtalo de nuevo en unos minutos.",
      requestRateLimited:
        "Has solicitado enlaces demasiado rápido. Espera un momento y vuelve a intentarlo.",
      title: "Redefina sua senha",
      subtitle:
        "Digite o e-mail associado à sua conta e enviaremos um link para redefinir sua senha.",
      email: "E-mail",
      emailPlaceholder: "voce@email.com",
      sending: "Enviando...",
      sendResetLink: "Enviar link de redefinição",
      backToLogin: "Voltar ao login",
      closeAuth: "Fechar",
      inboxTitle: "Confira sua caixa de entrada!",
      inboxDesc:
        "Se houver uma conta com esse e-mail, enviamos um link para redefinir a senha. Confira também a pasta de spam.",
    },
  }[language === 'pt' ? 'es' : language];

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const resetRedirectTo = useMemo(() => {
    if (typeof window === "undefined")
      return "/auth/reset-password/callback";
    const appOrigin = resolveClientAppOrigin(window.location.origin);
    const callbackUrl = new URL("/auth/reset-password/callback", appOrigin);
    return callbackUrl.toString();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const emailFromUrl = params.get("email");
    if (emailFromUrl) {
      setEmail(emailFromUrl);
    }
  }, []);

  const inputClasses =
    "w-full px-3 py-3 bg-[#1f2937] border border-[#374151] rounded-lg text-white placeholder-[#9CA3AF] text-base focus:outline-none focus:border-[#FBBF24] focus:ring-1 focus:ring-[#FBBF24] transition-colors";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      setError(copy.invalidEmail);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        normalizedEmail,
        {
          redirectTo: resetRedirectTo,
        },
      );

      if (resetError) {
        const isRateLimited =
          (typeof (resetError as { status?: number }).status === "number" &&
            (resetError as { status?: number }).status === 429) ||
          /rate|too many|retry/i.test(resetError.message || "");

        setError(isRateLimited ? copy.requestRateLimited : copy.requestFailed);
        setSent(false);
        return;
      }

      setSent(true);
    } catch {
      setError(copy.requestFailed);
      setSent(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-3 sm:p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border bg-card/80">
          <button
            type="button"
            onClick={() => router.push("/auth?tab=login")}
            className="inline-flex items-center gap-2 text-sm text-[#FBBF24] hover:text-[#F59E0B] transition-colors"
            aria-label={copy.closeAuth}
          >
            <X className="h-4 w-4" />
            {copy.closeAuth}
          </button>
        </div>

        <div className="p-5 sm:p-8">
          {!sent ? (
            <>
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                {copy.title}
              </h1>
              <p className="text-sm text-[#9CA3AF] mt-2 mb-6">
                {copy.subtitle}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-[#D1D5DB] mb-1.5"
                  >
                    {copy.email}
                  </label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder={copy.emailPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClasses}
                    required
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-400 bg-red-900/20 border border-red-700/40 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#FBBF24] hover:bg-[#F59E0B] text-black font-bold rounded-lg text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? copy.sending : copy.sendResetLink}
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/auth?tab=login")}
                  className="w-full py-3 border border-[#4B5563] text-[#D1D5DB] hover:text-white hover:border-[#6B7280] rounded-lg text-sm sm:text-base font-medium transition-colors"
                >
                  {copy.backToLogin}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center space-y-5">
              <div className="w-14 h-14 rounded-full bg-[#FBBF24]/20 border border-[#FBBF24]/40 flex items-center justify-center mx-auto">
                <svg
                  className="w-7 h-7 text-[#FBBF24]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m3 7 9 6 9-6" />
                </svg>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white">
                  {copy.inboxTitle}
                </h2>
                <p className="text-sm text-[#9CA3AF] mt-2">{copy.inboxDesc}</p>
              </div>

              <button
                type="button"
                onClick={() => router.push("/auth?tab=login")}
                className="w-full py-3 bg-[#FBBF24] hover:bg-[#F59E0B] text-black font-bold rounded-lg text-base transition-colors"
              >
                {copy.backToLogin}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
