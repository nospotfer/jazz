"use client";
import { useLanguage } from "@/components/providers/language-provider";
import {
  isLocalOrigin,
  normalizeBaseOrigin,
  resolveClientAppOrigin,
} from "@/lib/app-origin";
import { languageToHtmlLang } from "@/lib/language";
import { isValidEmailAddress } from "@/lib/email-validation";
import { getRandomProfileAvatar } from "@/lib/profile-avatars";
import { hasValidSupabasePublicConfig } from "@/lib/supabase-config";
import { createClient } from "@/utils/supabase/client";
import type { AuthChangeEvent } from "@supabase/supabase-js";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

function PasswordToggleIcon({ visible }: { visible: boolean }) {
  return visible ? (
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
  );
}

export default function AuthPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const { language } = useLanguage();
  const REMEMBER_EMAIL_KEY = "auth:rememberEmail";
  const REGISTRATION_WELCOME_VALUE = "registration-free-first-class";
  const hasSupabaseConfig = hasValidSupabasePublicConfig(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [justRegistered, setJustRegistered] = useState(false);

  // Declare state before effects that consume its setters.
  const [fullName, setFullName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerMessage, setRegisterMessage] = useState("");
  const [registerError, setRegisterError] = useState("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const passwordSignInStarted = useRef(false);
  const passwordSignInPending = useRef(false);
  const authPageMounted = useRef(false);

  const copy = {
    es: {
      googleStartError: "No se pudo iniciar con Google. Inténtalo de nuevo.",
      fullNameRequired: "El nombre completo es obligatorio",
      invalidEmail: "Introduce un correo válido",
      passwordMin: "La contraseña debe tener al menos 8 caracteres",
      registerFailed: "El registro falló",
      registerSuccess:
        "Cuenta creada. Verifica el código enviado a tu correo para continuar.",
      registerFailedRetry: "El registro falló. Inténtalo de nuevo.",
      emailPasswordRequired: "Correo y contraseña son obligatorios",
      signInFailed: "No se pudo iniciar sesión",
      signInFailedRetry: "No se pudo iniciar sesión. Inténtalo de nuevo.",
      googleNotConfigured:
        "El inicio de sesión con Google no está disponible temporalmente. Inténtalo más tarde.",
      googleAuthFailed: "No se pudo iniciar con Google",
      tabLogin: "Iniciar sesión",
      tabRegister: "Registrarse",
      googleRedirecting: "Redirigiendo a Google...",
      googleRegister: "Registrarse con Google",
      googleLogin: "Iniciar sesión con Google",
      authMissingConfig:
        "El acceso no está disponible temporalmente. Inténtalo más tarde.",
      or: "O",
      fullName: "Nombre completo",
      fullNamePlaceholder: "Tu nombre completo",
      email: "Correo",
      emailPlaceholder: "tu@correo.com",
      password: "Contraseña",
      passwordPlaceholder: "Tu contraseña",
      hidePassword: "Ocultar contraseña",
      showPassword: "Mostrar contraseña",
      minChars: "Mínimo 8 caracteres",
      creatingAccount: "Creando cuenta...",
      createAccount: "Crear cuenta",
      haveAccount: "¿Ya tienes una cuenta?",
      loginLink: "Inicia sesión",
      forgotPassword: "¿Olvidaste tu contraseña?",
      rememberMe: "Recordarme",
      closeAuth: "Cerrar",
      signingIn: "Iniciando sesión...",
      signIn: "Iniciar sesión",
      noAccount: "¿No tienes una cuenta?",
      registerLink: "Regístrate",
    },
    en: {
      googleStartError: "Google sign-in failed. Please try again.",
      fullNameRequired: "Full name is required",
      invalidEmail: "Please enter a valid email",
      passwordMin: "Password must be at least 8 characters",
      registerFailed: "Registration failed",
      registerSuccess:
        "Account created. Verify the code sent to your email to continue.",
      registerFailedRetry: "Registration failed. Please try again.",
      emailPasswordRequired: "Email and password are required",
      signInFailed: "Unable to sign in",
      signInFailedRetry: "Unable to sign in. Please try again.",
      googleNotConfigured:
        "Google sign-in is temporarily unavailable. Please try again later.",
      googleAuthFailed: "Unable to sign in with Google",
      tabLogin: "Sign in",
      tabRegister: "Register",
      googleRedirecting: "Redirecting to Google...",
      googleRegister: "Sign up with Google",
      googleLogin: "Sign in with Google",
      authMissingConfig:
        "Sign-in is temporarily unavailable. Please try again later.",
      or: "OR",
      fullName: "Full name",
      fullNamePlaceholder: "Your full name",
      email: "Email",
      emailPlaceholder: "you@email.com",
      password: "Password",
      passwordPlaceholder: "Your password",
      hidePassword: "Hide password",
      showPassword: "Show password",
      minChars: "Minimum 8 characters",
      creatingAccount: "Creating account...",
      createAccount: "Create account",
      haveAccount: "Already have an account?",
      loginLink: "Sign in",
      forgotPassword: "Forgot your password?",
      rememberMe: "Remember me",
      closeAuth: "Close",
      signingIn: "Signing in...",
      signIn: "Sign in",
      noAccount: "Don’t have an account?",
      registerLink: "Sign up",
    },
    fr: {
      googleStartError: "La connexion Google a échoué. Réessayez.",
      fullNameRequired: "Le nom complet est requis",
      invalidEmail: "Veuillez saisir un e-mail valide",
      passwordMin: "Le mot de passe doit contenir au moins 8 caractères",
      registerFailed: "Échec de l’inscription",
      registerSuccess:
        "Compte créé. Vérifiez le code envoyé à votre e-mail pour continuer.",
      registerFailedRetry: "Échec de l’inscription. Réessayez.",
      emailPasswordRequired: "E-mail et mot de passe requis",
      signInFailed: "Impossible de se connecter",
      signInFailedRetry: "Impossible de se connecter. Réessayez.",
      googleNotConfigured:
        "La connexion avec Google est temporairement indisponible. Réessayez plus tard.",
      googleAuthFailed: "Impossible de se connecter avec Google",
      tabLogin: "Connexion",
      tabRegister: "Inscription",
      googleRedirecting: "Redirection vers Google...",
      googleRegister: "S’inscrire avec Google",
      googleLogin: "Se connecter avec Google",
      authMissingConfig:
        "La connexion est temporairement indisponible. Réessayez plus tard.",
      or: "OU",
      fullName: "Nom complet",
      fullNamePlaceholder: "Votre nom complet",
      email: "E-mail",
      emailPlaceholder: "vous@email.com",
      password: "Mot de passe",
      passwordPlaceholder: "Votre mot de passe",
      hidePassword: "Masquer le mot de passe",
      showPassword: "Afficher le mot de passe",
      minChars: "Minimum 8 caractères",
      creatingAccount: "Création du compte...",
      createAccount: "Créer un compte",
      haveAccount: "Vous avez déjà un compte ?",
      loginLink: "Se connecter",
      forgotPassword: "Mot de passe oublié ?",
      rememberMe: "Se souvenir de moi",
      closeAuth: "Fermer",
      signingIn: "Connexion en cours...",
      signIn: "Se connecter",
      noAccount: "Vous n’avez pas de compte ?",
      registerLink: "S’inscrire",
    },
    pt: {
      googleStartError: "Falha ao entrar com Google. Tente novamente.",
      fullNameRequired: "Nome completo é obrigatório",
      invalidEmail: "Digite um e-mail válido",
      passwordMin: "A senha deve ter pelo menos 8 caracteres",
      registerFailed: "Falha no cadastro",
      registerSuccess:
        "Conta criada. Verifique o código enviado para seu e-mail para continuar.",
      registerFailedRetry: "Falha no cadastro. Tente novamente.",
      emailPasswordRequired: "E-mail e senha são obrigatórios",
      signInFailed: "No fue posible iniciar sesión",
      signInFailedRetry: "No fue posible iniciar sesión. Tente novamente.",
      googleNotConfigured:
        "O acesso com Google está temporariamente indisponível. Tente novamente mais tarde.",
      googleAuthFailed: "No fue posible iniciar sesión com Google",
      tabLogin: "Entrar",
      tabRegister: "Cadastrar",
      googleRedirecting: "Redirecionando para o Google...",
      googleRegister: "Cadastrar com Google",
      googleLogin: "Entrar com Google",
      authMissingConfig:
        "O acesso está temporariamente indisponível. Tente novamente mais tarde.",
      or: "OU",
      fullName: "Nome completo",
      fullNamePlaceholder: "Seu nome completo",
      email: "E-mail",
      emailPlaceholder: "voce@email.com",
      password: "Senha",
      passwordPlaceholder: "Sua senha",
      hidePassword: "Ocultar senha",
      showPassword: "Mostrar senha",
      minChars: "Mínimo de 8 caracteres",
      creatingAccount: "Criando conta...",
      createAccount: "Crear cuenta",
      haveAccount: "Já tem uma conta?",
      loginLink: "Entrar",
      forgotPassword: "Esqueceu sua senha?",
      rememberMe: "Lembrar de mim",
      closeAuth: "Fechar",
      signingIn: "Entrando...",
      signIn: "Entrar",
      noAccount: "¿No tienes una cuenta?",
      registerLink: "Cadastre-se",
    },
  }[language];

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const oauthCode = params.get("code");

    if (oauthCode) {
      const callbackUrl = new URL("/auth/callback", window.location.origin);
      params.forEach((value, key) => {
        callbackUrl.searchParams.append(key, value);
      });
      window.location.replace(callbackUrl.toString());
      return;
    }

    const urlEmail = params.get("email");
    const tabParam = params.get("tab");
    const flowParam = params.get("flow");
    const justRegisteredParam = params.get("just_registered");
    const oauthError = params.get("oauth_error");

    setJustRegistered(justRegisteredParam === "1");

    if (tabParam === "register" || flowParam === "register") {
      setActiveTab("register");
    }
    const normalizedUrlEmail = urlEmail?.trim().toLowerCase();
    if (normalizedUrlEmail && isValidEmailAddress(normalizedUrlEmail)) {
      setLoginEmail(normalizedUrlEmail);
    }

    if (oauthError) {
      const targetTab: "login" | "register" =
        flowParam === "register" ? "register" : "login";
      const message = oauthError.trim() || copy.googleStartError;
      void supabase.auth.signOut();

      setActiveTab(targetTab);
      if (targetTab === "register") {
        setRegisterError(message);
      } else {
        setLoginError(message);
      }
    }
  }, [copy.googleStartError, supabase]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const rememberedEmail = window.localStorage.getItem(REMEMBER_EMAIL_KEY);
    const explicitEmail = new URLSearchParams(window.location.search)
      .get("email")?.trim().toLowerCase();
    if (rememberedEmail) {
      if (!explicitEmail || !isValidEmailAddress(explicitEmail)) {
        setLoginEmail(rememberedEmail);
      }
      setRememberMe(true);
    } else {
      setRememberMe(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    authPageMounted.current = true;

    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (isMounted && !passwordSignInStarted.current && data.session?.user) {
        const dashboardTarget = justRegistered
          ? `/dashboard?welcome=${REGISTRATION_WELCOME_VALUE}`
          : "/dashboard";
        router.replace(dashboardTarget);
      }
    };

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent) => {
      if (isMounted && event === "SIGNED_IN" && !passwordSignInStarted.current) {
        const dashboardTarget = justRegistered
          ? `/dashboard?welcome=${REGISTRATION_WELCOME_VALUE}`
          : "/dashboard";
        router.replace(dashboardTarget);
        router.refresh();
      }
    });

    return () => {
      isMounted = false;
      authPageMounted.current = false;
      subscription.unsubscribe();
    };
  }, [router, supabase, justRegistered]);

  const redirectTo = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    const appOrigin = resolveClientAppOrigin(window.location.origin);
    const callbackUrl = new URL("/auth/callback", appOrigin);
    return callbackUrl.toString();
  }, []);

  const dashboardTarget = justRegistered
    ? `/dashboard?welcome=${REGISTRATION_WELCOME_VALUE}`
    : "/dashboard";

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (typeof window === "undefined") return;

    const configuredOrigin = normalizeBaseOrigin(
      process.env.NEXT_PUBLIC_APP_URL,
    );
    const runtimeOrigin = window.location.origin;
    const resolvedOrigin = resolveClientAppOrigin(runtimeOrigin);

    if (configuredOrigin && !isLocalOrigin(configuredOrigin)) {
      console.warn(
        "[auth] NEXT_PUBLIC_APP_URL is not localhost in development. Falling back to a local runtime origin.",
        {
          configuredOrigin,
          runtimeOrigin,
          resolvedOrigin,
        },
      );
      return;
    }

    if (runtimeOrigin !== resolvedOrigin) {
      console.info("[auth] OAuth callback origin normalized in development.", {
        runtimeOrigin,
        resolvedOrigin,
      });
    }
  }, []);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const normalizedEmail = registerEmail.trim().toLowerCase();

    if (!fullName.trim()) {
      setRegisterError(copy.fullNameRequired);
      return;
    }
    if (!isValidEmailAddress(normalizedEmail)) {
      setRegisterError(copy.invalidEmail);
      return;
    }
    if (registerPassword.length < 8) {
      setRegisterError(copy.passwordMin);
      return;
    }

    setRegisterLoading(true);
    setRegisterError("");
    setRegisterMessage("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          password: registerPassword,
          fullName: fullName.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setRegisterError(data.error || copy.registerFailed);
        return;
      }

      setRegisterMessage(data.message || copy.registerSuccess);
      router.push(`/auth/verify?email=${encodeURIComponent(normalizedEmail)}${data.pendingRegistration ? '&pending=1' : ''}`);
    } catch {
      setRegisterError(copy.registerFailedRetry);
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (passwordSignInPending.current) return;

    const normalizedEmail = loginEmail.trim().toLowerCase();
    if (!normalizedEmail || !loginPassword) {
      setLoginError(copy.emailPasswordRequired);
      return;
    }

    // Once password login starts, only its handler may navigate. SIGNED_IN
    // can arrive both before setup settles and after a failed cookie sync.
    passwordSignInStarted.current = true;
    passwordSignInPending.current = true;
    setLoginLoading(true);
    setLoginError("");

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: loginPassword,
      });
      if (!authPageMounted.current) return;

      if (signInError) {
        void supabase.auth.signOut();
        setLoginError(signInError.message || copy.signInFailed);
        return;
      }

      // Ensure server-rendered routes can read the authenticated session
      // right after password login by syncing tokens into http cookies.
      const { data: sessionData } = await supabase.auth.getSession();
      if (!authPageMounted.current) return;
      const accessToken = sessionData.session?.access_token;
      const refreshToken = sessionData.session?.refresh_token;

      if (accessToken && refreshToken) {
        const sessionSyncResponse = await fetch("/api/auth/session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ accessToken, refreshToken }),
        });
        if (!authPageMounted.current) return;

        if (!sessionSyncResponse.ok) {
          setLoginError(copy.signInFailedRetry);
          return;
        }
      }

      const { data: signedInUserData } = await supabase.auth.getUser();
      if (!authPageMounted.current) return;
      const currentMetadata = signedInUserData.user?.user_metadata || {};
      if (currentMetadata.avatar_mode !== "fixed") {
        await supabase.auth.updateUser({
          data: {
            ...currentMetadata,
            avatar_mode: "random",
            avatar_url: getRandomProfileAvatar(),
          },
        });
      }
      if (!authPageMounted.current) return;

      if (typeof window !== "undefined") {
        if (rememberMe) {
          window.localStorage.setItem(REMEMBER_EMAIL_KEY, normalizedEmail);
        } else {
          window.localStorage.removeItem(REMEMBER_EMAIL_KEY);
        }
      }

      router.replace(dashboardTarget);
      router.refresh();
    } catch {
      if (authPageMounted.current) setLoginError(copy.signInFailedRetry);
    } finally {
      passwordSignInPending.current = false;
      if (authPageMounted.current) setLoginLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoginError("");
    setRegisterError("");

    if (!hasSupabaseConfig) {
      const message = copy.googleNotConfigured;
      if (activeTab === "register") {
        setRegisterError(message);
      } else {
        setLoginError(message);
      }
      return;
    }

    setGoogleLoading(true);

    try {
      await supabase.auth.signOut();

      const oauthFlow = activeTab === "register" ? "register" : "login";
      const oauthNextPath =
        oauthFlow === "register"
          ? `/dashboard?welcome=${REGISTRATION_WELCOME_VALUE}`
          : "/dashboard";
      // Keep OAuth context in short-lived cookies so callback can recover it
      // even when providers strip custom query params from redirect URLs.
      document.cookie = `oauth_flow=${encodeURIComponent(oauthFlow)}; path=/; max-age=600; samesite=lax; secure`;
      document.cookie = `oauth_lang=${encodeURIComponent(language)}; path=/; max-age=600; samesite=lax; secure`;
      document.cookie = `oauth_next=${encodeURIComponent(oauthNextPath)}; path=/; max-age=600; samesite=lax; secure`;

      const callbackUrl = new URL(
        redirectTo || `${window.location.origin}/auth/callback`,
      );

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl.toString(),
          skipBrowserRedirect: true,
          queryParams: {
            prompt: "select_account",
            hl: languageToHtmlLang(language),
            ui_locales: languageToHtmlLang(language),
          },
        },
      });

      if (error) {
        const message = error.message || copy.googleAuthFailed;
        if (activeTab === "register") {
          setRegisterError(message);
        } else {
          setLoginError(message);
        }
        return;
      }

      if (!data?.url) {
        const message = copy.googleAuthFailed;
        if (activeTab === "register") {
          setRegisterError(message);
        } else {
          setLoginError(message);
        }
        return;
      }

      window.location.assign(data.url);
    } catch {
      const message = copy.googleStartError;
      if (activeTab === "register") {
        setRegisterError(message);
      } else {
        setLoginError(message);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const inputClasses =
    "w-full px-3 py-3 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground text-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors";

  const labelClasses = "block text-sm font-medium text-foreground mb-1.5";
  const helperClasses = "text-xs text-muted-foreground mt-1.5";

  const clearMessagesForTab = (tab: "login" | "register") => {
    setActiveTab(tab);
    setLoginError("");
    setRegisterError("");
    setRegisterMessage("");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-3 sm:p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border bg-card/80">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
            aria-label={copy.closeAuth}
          >
            <X className="h-4 w-4" />
            {copy.closeAuth}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => clearMessagesForTab("login")}
            className={`flex-1 py-3 text-sm sm:text-base font-semibold transition-colors ${
              activeTab === "login"
                ? "text-primary border-b-2 border-primary bg-card"
                : "text-muted-foreground hover:text-foreground bg-transparent"
            }`}
          >
            {copy.tabLogin}
          </button>
          <button
            onClick={() => clearMessagesForTab("register")}
            className={`flex-1 py-3 text-sm sm:text-base font-semibold transition-colors ${
              activeTab === "register"
                ? "text-primary border-b-2 border-primary bg-card"
                : "text-muted-foreground hover:text-foreground bg-transparent"
            }`}
          >
            {copy.tabRegister}
          </button>
        </div>

        <div className="p-5 sm:p-8">
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={googleLoading || !hasSupabaseConfig}
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
            {googleLoading
              ? copy.googleRedirecting
              : activeTab === "register"
                ? copy.googleRegister
                : copy.googleLogin}
          </button>

          {!hasSupabaseConfig && (
            <p className="mb-4 text-sm text-red-300 bg-red-900/30 border border-red-700/40 rounded-lg px-3 py-2">
              {copy.authMissingConfig}
            </p>
          )}

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-card text-muted-foreground">{copy.or}</span>
            </div>
          </div>

          {activeTab === "register" ? (
            <form method="post" onSubmit={handleRegister} className="space-y-5">
              <div>
                <label htmlFor="fullName" className={labelClasses}>
                  {copy.fullName}
                </label>
                <input
                  id="fullName"
                  type="text"
                  name="fullName"
                  autoComplete="name"
                  placeholder={copy.fullNamePlaceholder}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={inputClasses}
                  required
                />
              </div>

              <div>
                <label htmlFor="registerEmail" className={labelClasses}>
                  {copy.email}
                </label>
                <input
                  id="registerEmail"
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder={copy.emailPlaceholder}
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  className={inputClasses}
                  required
                />
              </div>

              <div>
                <label htmlFor="registerPassword" className={labelClasses}>
                  {copy.password}
                </label>
                <div className="relative">
                  <input
                    id="registerPassword"
                    type={showRegisterPassword ? "text" : "password"}
                    name="newPassword"
                    autoComplete="new-password"
                    placeholder={copy.passwordPlaceholder}
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    className={`${inputClasses} pr-11`}
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={
                      showRegisterPassword
                        ? copy.hidePassword
                        : copy.showPassword
                    }
                  >
                    <PasswordToggleIcon visible={showRegisterPassword} />
                  </button>
                </div>
                <p className={helperClasses}>{copy.minChars}</p>
              </div>

              {registerError && (
                <p className="text-sm text-red-600 dark:text-red-400 bg-red-900/20 border border-red-700/40 rounded-lg px-3 py-2">
                  {registerError}
                </p>
              )}
              {registerMessage && !registerError && (
                <p className="text-sm text-green-700 dark:text-green-400 bg-green-900/20 border border-green-700/40 rounded-lg px-3 py-2">
                  {registerMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={registerLoading}
                className="w-full py-3 bg-[#FBBF24] hover:bg-[#F59E0B] text-black font-bold rounded-lg text-base disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {registerLoading ? copy.creatingAccount : copy.createAccount}
              </button>

              <p className="text-center text-muted-foreground text-sm mt-3">
                {copy.haveAccount}{" "}
                <button
                  type="button"
                  onClick={() => clearMessagesForTab("login")}
                  className="text-primary hover:text-primary/80 font-medium"
                >
                  {copy.loginLink}
                </button>
              </p>
            </form>
          ) : (
            <form method="post" onSubmit={handleSignIn} className="space-y-5">
              <div>
                <label htmlFor="loginEmail" className={labelClasses}>
                  {copy.email}
                </label>
                <input
                  id="loginEmail"
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder={copy.emailPlaceholder}
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className={inputClasses}
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="loginPassword"
                    className="block text-sm font-medium text-foreground"
                  >
                    {copy.password}
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/auth/forgot-password${loginEmail ? `?email=${encodeURIComponent(loginEmail.trim())}` : ""}`,
                      )
                    }
                    className="text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    {copy.forgotPassword}
                  </button>
                </div>

                <div className="relative">
                  <input
                    id="loginPassword"
                    type={showLoginPassword ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    placeholder={copy.passwordPlaceholder}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className={`${inputClasses} pr-11`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={
                      showLoginPassword ? copy.hidePassword : copy.showPassword
                    }
                  >
                    <PasswordToggleIcon visible={showLoginPassword} />
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-foreground select-none">
                <input
                  type="checkbox"
                  id="rememberMe"
                  name="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-input bg-background text-primary focus:ring-primary"
                />
                {copy.rememberMe}
              </label>

              {loginError && (
                <p className="text-sm text-red-600 dark:text-red-400 bg-red-900/20 border border-red-700/40 rounded-lg px-3 py-2">
                  {loginError}
                </p>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3 bg-[#FBBF24] hover:bg-[#F59E0B] text-black font-bold rounded-lg text-base disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loginLoading ? copy.signingIn : copy.signIn}
              </button>

              <p className="text-center text-muted-foreground text-sm mt-3">
                {copy.noAccount}{" "}
                <button
                  type="button"
                  onClick={() => clearMessagesForTab("register")}
                  className="text-primary hover:text-primary/80 font-medium"
                >
                  {copy.registerLink}
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
