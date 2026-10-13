import { safeErrorDiagnostic } from '@/lib/error-diagnostics';
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { db } from "@/lib/db";
import { hasValidSupabaseServerConfig } from "@/lib/supabase-config";
import { isValidEmailAddress } from "@/lib/email-validation";

function hasPlaceholder(value: string | undefined, placeholder: string) {
  return !value || value.includes(placeholder);
}

export async function POST(request: Request) {
  try {
    if (
      hasPlaceholder(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        "your-project.supabase.co",
      )
    ) {
      return NextResponse.json(
        {
          error:
            "La verificación por correo no está disponible temporalmente. Inténtalo más tarde.",
        },
        { status: 500 },
      );
    }

    if (
      hasPlaceholder(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, "your-anon-key")
    ) {
      return NextResponse.json(
        {
          error:
            "La verificación por correo no está disponible temporalmente. Inténtalo más tarde.",
        },
        { status: 500 },
      );
    }

    if (
      !process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY.includes("your-service-role-key")
    ) {
      return NextResponse.json(
        {
          error:
            "La verificación por correo no está disponible temporalmente. Inténtalo más tarde.",
        },
        { status: 500 },
      );
    }

    const { email } = await request.json();
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!hasValidSupabaseServerConfig(url, anonKey, serviceRoleKey)) {
      return NextResponse.json(
        {
          error:
            "La verificación por correo no está disponible temporalmente. Inténtalo más tarde.",
        },
        { status: 500 },
      );
    }

    if (!normalizedEmail) {
      return NextResponse.json(
        { error: "El correo es obligatorio." },
        { status: 400 },
      );
    }

    if (!isValidEmailAddress(normalizedEmail)) {
      return NextResponse.json(
        { error: "El formato del correo es inválido." },
        { status: 400 },
      );
    }

    // Check if email is already registered (has password set in Prisma)
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser && existingUser.emailVerified) {
      return NextResponse.json(
        { error: "Este correo ya está registrado. Inicia sesión en su lugar." },
        { status: 409 },
      );
    }

    // Use Supabase Admin client to send OTP via Supabase's built-in email
    const supabase = createClient(url!, serviceRoleKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // A known DB id gives an exact auth lookup regardless of directory size.
    // Unknown/auth-only accounts go through OTP without any directory scan.
    if (existingUser) {
      const { data, error } = await supabase.auth.admin.getUserById(existingUser.id);
      if (error || !data.user || data.user.email?.toLowerCase() !== normalizedEmail) {
        return NextResponse.json(
          { error: "No se pudo comprobar la cuenta. Inténtalo de nuevo más tarde." },
          { status: 503 },
        );
      }
      if (data.user.email_confirmed_at) {
        return NextResponse.json(
          { error: "Este correo ya está registrado. Inicia sesión en su lugar." },
          { status: 409 },
        );
      }
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: false,
      },
    });

    if (error) {
      if (error.code === "user_not_found") {
        return NextResponse.json({
          success: true,
          message: "Si tu cuenta está pendiente de verificación, recibirás un código en tu correo.",
        });
      }
      console.error("Supabase OTP error:", safeErrorDiagnostic(error));
      const isRateLimit = error.message?.toLowerCase().includes("rate limit");
      if (isRateLimit) {
        return NextResponse.json(
          {
            error:
              "Demasiados intentos. Espera unos minutos y vuelve a intentarlo.",
            retryAfterSeconds: 120,
          },
          { status: 429 },
        );
      }

      return NextResponse.json(
        { error: "No se pudo enviar el código de verificación. Inténtalo de nuevo más tarde." },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Código de verificación enviado a tu correo",
    });
  } catch (error) {
    console.error("Error sending verification code:", safeErrorDiagnostic(error));
    return NextResponse.json(
      { error: "No se pudo enviar el código de verificación" },
      { status: 500 },
    );
  }
}
