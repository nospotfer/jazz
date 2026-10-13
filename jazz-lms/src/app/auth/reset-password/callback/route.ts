import { resolveServerAppOrigin } from "@/lib/app-origin";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

function redirectToReset(origin: string, params?: Record<string, string>) {
  const target = new URL("/auth/reset-password", origin);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      target.searchParams.set(key, value);
    });
  }

  console.info("[auth/reset-password/callback] redirecting to reset page", {
    url: target.toString(),
    params: params || {},
  });

  return NextResponse.redirect(target.toString());
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = resolveServerAppOrigin(requestUrl.origin, request.headers.get('host'));
  const code = requestUrl.searchParams.get("code");

  console.info("[auth/reset-password/callback] received request", {
    hasCode: Boolean(code),
    origin,
  });

  if (!code) {
    // Legacy implicit recovery links can reach this URL with fragment tokens.
    // Fragments never reach the server; redirect without an error so the browser
    // retains them and the reset page can validate the actual recovery session.
    return redirectToReset(origin);
  }

  const supabase = createClient();

  try {
    console.info("[auth/reset-password/callback] attempting code exchange");
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.session) {
      console.error("[auth/reset-password/callback] exchange failed", {
        errorCode: error?.code,
      });
      return redirectToReset(origin, { reset_error: "exchange_failed" });
    }

    console.info("[auth/reset-password/callback] exchange successful", {
      hasSession: Boolean(data.session),
      userId: data.session?.user?.id,
    });
  } catch (error) {
    console.error(
      "[auth/reset-password/callback] unexpected exchange error",
      error instanceof Error ? error.message : String(error),
    );
    return redirectToReset(origin, { reset_error: "exchange_exception" });
  }

  return redirectToReset(origin, { recovery: "1" });
}
