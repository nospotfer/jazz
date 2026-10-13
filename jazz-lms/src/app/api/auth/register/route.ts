import { safeErrorDiagnostic } from '@/lib/error-diagnostics';
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { db } from "@/lib/db";
import { hasValidSupabaseServerConfig } from "@/lib/supabase-config";
import { isValidEmailAddress } from "@/lib/email-validation";

const OWNER_EMAIL = (
  process.env.ADMIN_OWNER_EMAIL || "admin@neurofactory.net"
).toLowerCase();

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
            "El registro no está disponible temporalmente. Inténtalo más tarde.",
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
            "El registro no está disponible temporalmente. Inténtalo más tarde.",
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
            "El registro no está disponible temporalmente. Inténtalo más tarde.",
        },
        { status: 500 },
      );
    }

    const { email, password, fullName } = await request.json();
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
            "El registro no está disponible temporalmente. Inténtalo más tarde.",
        },
        { status: 500 },
      );
    }

    if (!normalizedEmail || typeof password !== "string" || typeof fullName !== "string" || !fullName.trim()) {
      return NextResponse.json(
        { error: "Correo, contraseña y nombre completo son obligatorios." },
        { status: 400 },
      );
    }

    if (!isValidEmailAddress(normalizedEmail)) {
      return NextResponse.json(
        { error: "El formato del correo es inválido." },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres." },
        { status: 400 },
      );
    }

    // Resolve local identity before doing any provider mutation. If the
    // database is unavailable, fail closed instead of creating an orphan.
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser && existingUser.emailVerified) {
      return NextResponse.json(
        { error: "Este correo ya está registrado. Inicia sesión en su lugar." },
        { status: 409 },
      );
    }

    // The service-role client must never change an existing account's password
    // or profile before the requester proves ownership of its email address.
    const supabase = createClient(url!, serviceRoleKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Resolve a known account directly. Scanning the first page of listUsers
    // misses accounts after the first 50 and exposes unnecessary directory data.
    let supaUser = null;
    if (existingUser) {
      const { data, error } = await supabase.auth.admin.getUserById(existingUser.id);
      if (error || !data.user || data.user.email?.toLowerCase() !== normalizedEmail) {
        return NextResponse.json(
          { error: "No se pudo comprobar la cuenta. Inténtalo de nuevo más tarde." },
          { status: 503 },
        );
      }
      supaUser = data.user;
    }

    if (supaUser?.email_confirmed_at) {
      return NextResponse.json(
        { error: "Este correo ya está registrado. Inicia sesión en su lugar." },
        { status: 409 },
      );
    }

    let userId = supaUser?.id;
    let pendingRegistration = Boolean(supaUser);

    if (!supaUser) {
      const { data: createdUser, error: createError } =
        await supabase.auth.admin.createUser({
          email: normalizedEmail,
          password,
          user_metadata: { full_name: fullName.trim() },
          email_confirm: false,
        });

      if (createError?.code === "email_exists" || createError?.code === "user_already_exists") {
        // An auth-only account can exist after an interrupted registration.
        // Resume by email verification without replacing its initial password.
        pendingRegistration = true;
      } else if (createError || !createdUser.user) {
        console.error("[AUTH_REGISTER_CREATE_FAILED]", safeErrorDiagnostic(createError));
        return NextResponse.json(
          {
            error: "No se pudo crear la cuenta. Inténtalo de nuevo más tarde.",
          },
          { status: 400 },
        );
      } else {
        userId = createdUser.user.id;
      }
    }

    // Persist only new accounts. Retried registration must not replace an
    // existing pending user's profile, verification state or role.
    if (!pendingRegistration && userId) {
      const isOwner = normalizedEmail === OWNER_EMAIL;
      await db.user.upsert({
        where: { email: normalizedEmail },
        create: {
          id: userId,
          email: normalizedEmail,
          name: fullName.trim(),
          emailVerified: false,
          role: isOwner ? "SUPER_ADMIN" : "USER",
        },
        update: {},
      });
    }

    // Send verification only; existing credentials stay unchanged.
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: false,
      },
    });

    if (otpError) {
      console.error("[AUTH_REGISTER_OTP_FAILED]", safeErrorDiagnostic(otpError));
      return NextResponse.json(
        {
          error: "No se pudo enviar el código de verificación. Inténtalo de nuevo más tarde.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      pendingRegistration,
      message: pendingRegistration
        ? "Verifica tu correo y usa la contraseña de tu registro inicial. Si no la recuerdas, restablécela desde el inicio de sesión."
        : "Cuenta creada. Introduce el código de verificación enviado a tu correo.",
    });
  } catch (error) {
    console.error("Error registering user:", safeErrorDiagnostic(error));
    return NextResponse.json(
      { error: "No se pudo crear la cuenta" },
      { status: 500 },
    );
  }
}
