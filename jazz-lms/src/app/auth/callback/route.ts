import {
  isLocalOrigin,
  normalizeBaseOrigin,
  resolveServerAppOrigin,
} from "@/lib/app-origin";
import { normalizeLanguage } from "@/lib/language";
import { getRandomProfileAvatar } from "@/lib/profile-avatars";
import { syncUserWithDatabase } from "@/lib/sync-user";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

function readCookie(request: Request, cookieName: string): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const cookie = cookieHeader
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${cookieName}=`));

  if (!cookie) return null;

  const rawValue = cookie.slice(cookieName.length + 1);
  if (!rawValue) return null;

  try {
    return decodeURIComponent(rawValue);
  } catch {
    return rawValue;
  }
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = resolveServerAppOrigin(requestUrl.origin);
  const REGISTRATION_WELCOME_VALUE = "registration-free-first-class";
  const configuredOrigin = normalizeBaseOrigin(
    process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL,
  );
  const flowParam = requestUrl.searchParams.get("flow");
  const flowCookie = readCookie(request, "oauth_flow");
  const flow =
    flowParam === "register" || (!flowParam && flowCookie === "register")
      ? "register"
      : "login";
  const langCookie =
    readCookie(request, "oauth_lang") || readCookie(request, "jazz_lang");
  const selectedLanguage = normalizeLanguage(
    requestUrl.searchParams.get("lang") || langCookie,
  );
  const nextPathRaw =
    requestUrl.searchParams.get("next") || readCookie(request, "oauth_next");
  const sanitizedNextPath =
    nextPathRaw && nextPathRaw.startsWith("/") ? nextPathRaw : "/dashboard";
  const nextPath = (() => {
    if (flow !== "register") {
      return sanitizedNextPath;
    }

    const targetUrl = new URL(sanitizedNextPath, origin);
    if (targetUrl.pathname !== "/dashboard") {
      return sanitizedNextPath;
    }

    if (!targetUrl.searchParams.get("welcome")) {
      targetUrl.searchParams.set("welcome", REGISTRATION_WELCOME_VALUE);
    }

    return `${targetUrl.pathname}${targetUrl.search}`;
  })();

  if (
    process.env.NODE_ENV !== "production" &&
    configuredOrigin &&
    !isLocalOrigin(configuredOrigin)
  ) {
    console.warn(
      "[auth/callback] APP_URL or NEXT_PUBLIC_APP_URL is not localhost in development. Ignoring configured origin for callback redirect.",
      {
        configuredOrigin,
        requestOrigin: requestUrl.origin,
        resolvedOrigin: origin,
      },
    );
  }

  const copy = {
    es: {
      missingCode: "No se recibió el código de autenticación de Google.",
      exchangeFailed:
        "No se pudo completar el acceso con Google. Inténtalo de nuevo.",
      userLoadFailed:
        "No se pudo recuperar tu cuenta después del login con Google.",
    },
    en: {
      missingCode: "Google authentication code was not received.",
      exchangeFailed: "Unable to complete Google sign-in. Please try again.",
      userLoadFailed: "Unable to load your account after Google sign-in.",
    },
    fr: {
      missingCode: "Le code d’authentification Google n’a pas été reçu.",
      exchangeFailed: "Impossible de terminer la connexion Google. Réessayez.",
      userLoadFailed:
        "Impossible de récupérer votre compte après la connexion Google.",
    },
    pt: {
      missingCode: "No se recibió el código de autenticación de Google.",
      exchangeFailed:
        "No fue posible completar el inicio de sesión con Google. Inténtalo de nuevo.",
      userLoadFailed:
        "No fue posible cargar tu cuenta después del inicio de sesión con Google.",
    },
  }[selectedLanguage];

  const withLanguageCookie = (response: NextResponse) => {
    response.cookies.set("jazz_lang", selectedLanguage, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });

    response.cookies.set("oauth_flow", "", {
      path: "/",
      maxAge: 0,
      sameSite: "lax",
    });
    response.cookies.set("oauth_lang", "", {
      path: "/",
      maxAge: 0,
      sameSite: "lax",
    });
    response.cookies.set("oauth_next", "", {
      path: "/",
      maxAge: 0,
      sameSite: "lax",
    });

    return response;
  };

  const authErrorRedirect = (message: string) => {
    const target = `${origin}/auth?flow=${flow}&lang=${selectedLanguage}&oauth_error=${encodeURIComponent(message)}`;
    return withLanguageCookie(NextResponse.redirect(target));
  };

  if (!code) {
    return authErrorRedirect(copy.missingCode);
  }

  const supabase = createClient();
  let exchangeError: Error | null = null;

  try {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    exchangeError = error;
  } catch (error) {
    exchangeError =
      error instanceof Error
        ? error
        : new Error("Unknown OAuth exchange error");
  }

  if (exchangeError) {
    console.error("Error exchanging auth code for session:", exchangeError);
    return authErrorRedirect(copy.exchangeFailed);
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("Error loading authenticated user after OAuth:", userError);
    return authErrorRedirect(copy.userLoadFailed);
  }

  if (user.user_metadata?.avatar_mode !== "fixed") {
    const { error: updateUserError } = await supabase.auth.updateUser({
      data: {
        ...user.user_metadata,
        avatar_mode: "random",
        avatar_url: getRandomProfileAvatar(),
      },
    });

    if (updateUserError) {
      console.error("Error updating OAuth user metadata:", updateUserError);
    }
  }

  // Sincronizar usuário com o banco de dados
  try {
    await syncUserWithDatabase();
  } catch (error) {
    console.error("Error syncing user:", error);
  }

  // URL to redirect to after sign in process completes
  return withLanguageCookie(NextResponse.redirect(`${origin}${nextPath}`));
}
