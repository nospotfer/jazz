'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useLanguage } from '@/components/providers/language-provider';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { language } = useLanguage();
  const copy = {
    es: {
      tokenInvalid: 'Este enlace de restablecimiento es inválido o ha expirado. Solicita uno nuevo.',
      tokenValidationFailed: 'No se pudo validar el enlace de restablecimiento. Solicita uno nuevo.',
      minPassword: 'La contraseña debe tener al menos 8 caracteres',
      updateFailed: 'No se pudo actualizar la contraseña',
      updated: '¡Contraseña actualizada con éxito!',
      validatingLink: 'Validando enlace de restablecimiento...',
      invalidTitle: 'Enlace de restablecimiento inválido',
      requestNewLink: 'Solicitar nuevo enlace',
      backToLogin: 'Volver a iniciar sesión',
      createNewPassword: 'Crear nueva contraseña',
      newPassword: 'Nueva contraseña',
      passwordPlaceholder: 'Tu nueva contraseña',
      hidePassword: 'Ocultar contraseña',
      showPassword: 'Mostrar contraseña',
      minCharacters: 'Mínimo 8 caracteres',
      updating: 'Actualizando...',
      updatePassword: 'Actualizar contraseña',
    },
    en: {
      tokenInvalid: 'This reset link is invalid or has expired. Request a new one.',
      tokenValidationFailed: 'Unable to validate the reset link. Request a new one.',
      minPassword: 'Password must be at least 8 characters',
      updateFailed: 'Unable to update password',
      updated: 'Password updated successfully!',
      validatingLink: 'Validating reset link...',
      invalidTitle: 'Invalid reset link',
      requestNewLink: 'Request new link',
      backToLogin: 'Back to sign in',
      createNewPassword: 'Create a new password',
      newPassword: 'New password',
      passwordPlaceholder: 'Your new password',
      hidePassword: 'Hide password',
      showPassword: 'Show password',
      minCharacters: 'Minimum 8 characters',
      updating: 'Updating...',
      updatePassword: 'Update password',
    },
    fr: {
      tokenInvalid: 'Ce lien de réinitialisation est invalide ou expiré. Demandez-en un nouveau.',
      tokenValidationFailed: 'Impossible de valider le lien de réinitialisation. Demandez-en un nouveau.',
      minPassword: 'Le mot de passe doit contenir au moins 8 caractères',
      updateFailed: 'Impossible de mettre à jour le mot de passe',
      updated: 'Mot de passe mis à jour avec succès !',
      validatingLink: 'Validation du lien de réinitialisation...',
      invalidTitle: 'Lien de réinitialisation invalide',
      requestNewLink: 'Demander un nouveau lien',
      backToLogin: 'Retour à la connexion',
      createNewPassword: 'Créer un nouveau mot de passe',
      newPassword: 'Nouveau mot de passe',
      passwordPlaceholder: 'Votre nouveau mot de passe',
      hidePassword: 'Masquer le mot de passe',
      showPassword: 'Afficher le mot de passe',
      minCharacters: 'Minimum 8 caractères',
      updating: 'Mise à jour...',
      updatePassword: 'Mettre à jour le mot de passe',
    },
    pt: {
      tokenInvalid: 'Este link de redefinição é inválido ou expirou. Solicite um novo.',
      tokenValidationFailed: 'Não foi possível validar o link de redefinição. Solicite um novo.',
      minPassword: 'A senha deve ter pelo menos 8 caracteres',
      updateFailed: 'Não foi possível atualizar a senha',
      updated: 'Senha atualizada com sucesso!',
      validatingLink: 'Validando link de redefinição...',
      invalidTitle: 'Link de redefinição inválido',
      requestNewLink: 'Solicitar novo link',
      backToLogin: 'Voltar ao login',
      createNewPassword: 'Criar nova senha',
      newPassword: 'Nova senha',
      passwordPlaceholder: 'Sua nova senha',
      hidePassword: 'Ocultar senha',
      showPassword: 'Mostrar senha',
      minCharacters: 'Mínimo de 8 caracteres',
      updating: 'Atualizando...',
      updatePassword: 'Atualizar senha',
    },
  }[language];

  const [loadingToken, setLoadingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState('');

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const bootstrapRecoverySession = async () => {
      try {
        const query = new URLSearchParams(window.location.search);
        const authCode = query.get('code');
        let hasRecoveryCredential = false;

        if (authCode) {
          hasRecoveryCredential = true;
          const { error: codeError } = await supabase.auth.exchangeCodeForSession(authCode);
          if (codeError) {
            setTokenError(copy.tokenInvalid);
            setTokenValid(false);
            setLoadingToken(false);
            return;
          }
        } else {
          const hash = window.location.hash.startsWith('#')
            ? new URLSearchParams(window.location.hash.slice(1))
            : new URLSearchParams();

          const accessToken = hash.get('access_token');
          const refreshToken = hash.get('refresh_token');
          const hashErrorDescription = hash.get('error_description');

          if (hashErrorDescription) {
            setTokenError(copy.tokenInvalid);
            setTokenValid(false);
            setLoadingToken(false);
            return;
          }

          if (accessToken && refreshToken) {
            hasRecoveryCredential = true;
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) {
              setTokenError(copy.tokenInvalid);
              setTokenValid(false);
              setLoadingToken(false);
              return;
            }

            window.history.replaceState({}, '', window.location.pathname + window.location.search);
          }
        }

        if (!hasRecoveryCredential) {
          setTokenError(copy.tokenInvalid);
          setTokenValid(false);
          setLoadingToken(false);
          return;
        }

        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          setTokenError(copy.tokenInvalid);
          setTokenValid(false);
          setLoadingToken(false);
          return;
        }

        setTokenValid(true);
      } catch {
        setTokenError(copy.tokenValidationFailed);
        setTokenValid(false);
      } finally {
        setLoadingToken(false);
      }
    };

    bootstrapRecoverySession();
  }, [supabase, copy.tokenInvalid, copy.tokenValidationFailed]);

  const inputClasses =
    'w-full px-3 py-3 bg-[#1f2937] border border-[#374151] rounded-lg text-white placeholder-[#9CA3AF] text-base focus:outline-none focus:border-[#FBBF24] focus:ring-1 focus:ring-[#FBBF24] transition-colors';

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password.length < 8) {
      setError(copy.minPassword);
      return;
    }

    setSaving(true);
    setError('');

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message || copy.updateFailed);
        return;
      }

      setToastMessage(copy.updated);

      setTimeout(async () => {
        await supabase.auth.signOut();
        router.replace('/auth?tab=login');
      }, 1200);
    } catch {
      setError(copy.updateFailed);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-3 sm:p-4">
      {toastMessage && (
        <div className="fixed top-3 left-3 right-3 sm:left-auto sm:right-4 z-50 px-4 py-3 rounded-lg border border-green-700/50 bg-green-900/70 text-green-300 text-sm font-medium shadow-lg">
          {toastMessage}
        </div>
      )}

      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-lg overflow-hidden">
        <div className="p-5 sm:p-8 space-y-5">
          {loadingToken ? (
            <div className="text-center text-[#D1D5DB]">{copy.validatingLink}</div>
          ) : !tokenValid ? (
            <div className="space-y-4">
              <h1 className="text-xl sm:text-2xl font-bold text-white">{copy.invalidTitle}</h1>
              <p className="text-sm text-[#9CA3AF]">{tokenError}</p>
              <button
                type="button"
                onClick={() => router.push('/auth/forgot-password')}
                className="w-full py-3 bg-[#FBBF24] hover:bg-[#F59E0B] text-black font-bold rounded-lg text-base transition-colors"
              >
                {copy.requestNewLink}
              </button>
              <button
                type="button"
                onClick={() => router.push('/auth?tab=login')}
                className="w-full py-3 border border-[#4B5563] text-[#D1D5DB] hover:text-white hover:border-[#6B7280] rounded-lg text-base font-medium transition-colors"
              >
                {copy.backToLogin}
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-xl sm:text-2xl font-bold text-white">{copy.createNewPassword}</h1>

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-[#D1D5DB] mb-1.5">
                    {copy.newPassword}
                  </label>

                  <div className="relative">
                    <input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={copy.passwordPlaceholder}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${inputClasses} pr-11`}
                      minLength={8}
                      required
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-white transition-colors"
                      aria-label={showPassword ? copy.hidePassword : copy.showPassword}
                    >
                      {showPassword ? (
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
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-[#9CA3AF] mt-1.5">{copy.minCharacters}</p>
                </div>

                {error && (
                  <p className="text-sm text-red-400 bg-red-900/20 border border-red-700/40 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 bg-[#FBBF24] hover:bg-[#F59E0B] text-black font-bold rounded-lg text-base disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? copy.updating : copy.updatePassword}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
