// @vitest-environment jsdom

import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const routerPush = vi.fn();
  const routerReplace = vi.fn();

  const supabaseAuth = {
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
    signOut: vi.fn(),
    setSession: vi.fn(),
    verifyOtp: vi.fn(),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    getUser: vi.fn(),
  };

  return {
    language: "en" as "en" | "es" | "fr" | "pt",
    routerPush,
    routerReplace,
    supabaseAuth,
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mocks.routerPush,
    replace: mocks.routerReplace,
  }),
}));

vi.mock("@/components/providers/language-provider", () => ({
  useLanguage: () => ({ language: mocks.language }),
}));

vi.mock("@/utils/supabase/client", () => ({
  createClient: () => ({
    auth: mocks.supabaseAuth,
  }),
}));

describe("Password reset QA flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    mocks.language = "en";
    window.sessionStorage.clear();

    mocks.supabaseAuth.resetPasswordForEmail.mockResolvedValue({ error: null });
    mocks.supabaseAuth.updateUser.mockResolvedValue({ error: null });
    mocks.supabaseAuth.signOut.mockResolvedValue({ error: null });
    mocks.supabaseAuth.setSession.mockResolvedValue({ error: null });
    mocks.supabaseAuth.verifyOtp.mockResolvedValue({ error: null });
    mocks.supabaseAuth.getSession.mockResolvedValue({
      data: {
        session: null,
      },
    });
    mocks.supabaseAuth.getUser.mockResolvedValue({
      data: {
        user: null,
      },
    });
    mocks.supabaseAuth.onAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    });

    window.history.replaceState({}, "", "/auth");
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  test("opens forgot password from auth screen", async () => {
    const AuthPage = (await import("@/app/auth/page")).default;
    render(<AuthPage />);

    fireEvent.click(
      screen.getByRole("button", { name: /forgot your password\?/i }),
    );

    expect(mocks.routerPush).toHaveBeenCalledWith("/auth/forgot-password");
  });

  test("forgot password requires a valid email", async () => {
    const ForgotPasswordPage = (await import("@/app/auth/forgot-password/page")).default;
    render(<ForgotPasswordPage />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "abc@def" },
    });
    fireEvent.submit(screen.getByRole("button", { name: /send reset link/i }).closest("form")!);

    expect(await screen.findByText(/enter a valid email/i)).toBeTruthy();
    expect(mocks.supabaseAuth.resetPasswordForEmail).not.toHaveBeenCalled();
  });

  test("forgot password sends reset email and shows inbox confirmation", async () => {
    const ForgotPasswordPage = (await import("@/app/auth/forgot-password/page")).default;
    render(<ForgotPasswordPage />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "student@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(mocks.supabaseAuth.resetPasswordForEmail).toHaveBeenCalledTimes(1);
    });

    const redirectOption = mocks.supabaseAuth.resetPasswordForEmail.mock.calls[0][1]
      ?.redirectTo as string;
    expect(new URL(redirectOption).pathname).toBe("/auth/reset-password/callback");

    expect(await screen.findByText(/check your inbox!/i)).toBeTruthy();
  });

  test("reset page validates mismatch and updates password without errors", async () => {
    mocks.supabaseAuth.getSession.mockResolvedValue({
      data: {
        session: {
          access_token: "a",
        },
      },
    });

    window.history.replaceState(
      {},
      "",
      "/auth/reset-password?access_token=fake-access&refresh_token=fake-refresh",
    );

    const ResetPasswordPage = (await import("@/app/auth/reset-password/page")).default;
    render(<ResetPasswordPage />);

    expect(await screen.findByRole("heading", { name: /create a new password/i })).toBeTruthy();

    fireEvent.change(screen.getByLabelText(/^new password$/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: "different123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /update password/i }));

    expect(await screen.findByText(/passwords do not match/i)).toBeTruthy();
    expect(mocks.supabaseAuth.updateUser).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() => {
      expect(mocks.supabaseAuth.updateUser).toHaveBeenCalledWith({
        password: "password123",
      });
    });

    expect(await screen.findByText(/password updated successfully!/i)).toBeTruthy();

    await waitFor(() => {
      expect(mocks.supabaseAuth.signOut).toHaveBeenCalledTimes(1);
    }, { timeout: 2500 });
    expect(mocks.routerReplace).toHaveBeenCalledWith("/auth?tab=login");
  });

  test("reset page has explicit sign-out button", async () => {
    mocks.supabaseAuth.getSession.mockResolvedValue({
      data: {
        session: {
          access_token: "a",
        },
      },
    });

    window.history.replaceState(
      {},
      "",
      "/auth/reset-password?access_token=fake-access&refresh_token=fake-refresh",
    );

    const ResetPasswordPage = (await import("@/app/auth/reset-password/page")).default;
    render(<ResetPasswordPage />);

    const logoutButton = await screen.findByRole("button", { name: /sign out/i });
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(mocks.supabaseAuth.signOut).toHaveBeenCalledTimes(1);
    });
    expect(mocks.routerReplace).toHaveBeenCalledWith("/auth?tab=login");
  });

  test('a forged callback hint cannot display an authenticated reset form', async () => {
    window.history.replaceState({}, '', '/auth/reset-password?recovery=1');
    const ResetPasswordPage = (await import('@/app/auth/reset-password/page')).default;
    render(<ResetPasswordPage />);
    expect(await screen.findByRole('heading', { name: /invalid reset link/i })).toBeTruthy();
    expect(screen.queryByLabelText(/^new password$/i)).toBeNull();
    expect(mocks.supabaseAuth.getUser).toHaveBeenCalledOnce();
  });

  test('consumed implicit credentials are removed from the URL', async () => {
    mocks.supabaseAuth.getSession.mockResolvedValue({ data: { session: { access_token: 'fixture' } } });
    window.history.replaceState({}, '', '/auth/reset-password?lang=en#access_token=fixture&refresh_token=fixture-refresh&type=recovery');
    const ResetPasswordPage = (await import('@/app/auth/reset-password/page')).default;
    render(<ResetPasswordPage />);
    expect(await screen.findByLabelText(/^new password$/i)).toBeTruthy();
    expect(window.location.hash).toBe('');
    expect(window.location.search).toBe('?lang=en');
  });

  describe("Recovery diagnostic privacy", () => {
    const privateDetail = "synthetic-private-recovery-detail@example.invalid";

    function captureDiagnostics() {
      const logs = ["info", "warn", "error"].map((level) =>
        vi.spyOn(console, level as "info" | "warn" | "error").mockImplementation(() => {}),
      );
      const network = vi.fn(() => { throw new Error("Unexpected recovery-test network access"); });
      vi.stubGlobal("fetch", network);
      return () => {
        expect(network).not.toHaveBeenCalled();
        return JSON.stringify(logs.flatMap((log) => log.mock.calls));
      };
    }

    test("URL error descriptions stay out of recovery diagnostics", async () => {
      const diagnostics = captureDiagnostics();
      window.history.replaceState({}, "", `/auth/reset-password#error_description=${encodeURIComponent(privateDetail)}`);
      const ResetPasswordPage = (await import("@/app/auth/reset-password/page")).default;
      render(<ResetPasswordPage />);
      expect(await screen.findByRole("heading", { name: /invalid reset link/i })).toBeTruthy();
      expect(diagnostics()).toContain("hash-error");
      expect(diagnostics()).not.toContain(privateDetail);
      expect(document.body.textContent).not.toContain(privateDetail);
      expect(mocks.supabaseAuth.updateUser).not.toHaveBeenCalled();
    });

    test("untrusted recovery types stay out of recovery diagnostics", async () => {
      const diagnostics = captureDiagnostics();
      mocks.supabaseAuth.getSession.mockResolvedValue({ data: { session: { access_token: "synthetic-access" } } });
      window.history.replaceState({}, "", `/auth/reset-password#access_token=synthetic-access&refresh_token=synthetic-refresh&type=${encodeURIComponent(privateDetail)}`);
      const ResetPasswordPage = (await import("@/app/auth/reset-password/page")).default;
      render(<ResetPasswordPage />);
      expect(await screen.findByLabelText(/^new password$/i)).toBeTruthy();
      expect(diagnostics()).toContain("set-session-success");
      expect(diagnostics()).not.toContain(privateDetail);
    });

    test("OTP errors retain finite status without private provider prose", async () => {
      const diagnostics = captureDiagnostics();
      mocks.supabaseAuth.verifyOtp.mockResolvedValue({ error: { message: privateDetail, status: 422 } });
      mocks.supabaseAuth.getSession.mockResolvedValue({ data: { session: { access_token: "synthetic-existing-session" } } });
      window.history.replaceState({}, "", "/auth/reset-password?token_hash=synthetic-credential&type=recovery");
      const ResetPasswordPage = (await import("@/app/auth/reset-password/page")).default;
      render(<ResetPasswordPage />);
      expect(await screen.findByLabelText(/^new password$/i)).toBeTruthy();
      expect(mocks.supabaseAuth.verifyOtp).toHaveBeenCalledWith({ type: "recovery", token_hash: "synthetic-credential" });
      expect(diagnostics()).toContain("verify-otp-failed");
      expect(diagnostics()).not.toContain(privateDetail);
      expect(diagnostics()).toContain('"status":422');
      expect(mocks.supabaseAuth.updateUser).not.toHaveBeenCalled();
    });

    test("session errors retain finite status without private provider prose", async () => {
      const diagnostics = captureDiagnostics();
      mocks.supabaseAuth.setSession.mockResolvedValue({ error: { message: privateDetail, status: 400 } });
      window.history.replaceState({}, "", "/auth/reset-password#access_token=synthetic-access&refresh_token=synthetic-refresh&type=recovery");
      const ResetPasswordPage = (await import("@/app/auth/reset-password/page")).default;
      render(<ResetPasswordPage />);
      expect(await screen.findByRole("heading", { name: /invalid reset link/i })).toBeTruthy();
      expect(diagnostics()).toContain("set-session-failed");
      expect(diagnostics()).not.toContain(privateDetail);
      expect(diagnostics()).toContain('"status":400');
      expect(mocks.supabaseAuth.updateUser).not.toHaveBeenCalled();
    });

    test.each([
      ["en", "Unable to update password"],
      ["es", "No se pudo actualizar la contraseña"],
      ["fr", "Impossible de mettre à jour le mot de passe"],
      ["pt", "Não foi possível atualizar a senha"],
    ] as const)("provider update failures use localized %s copy without private prose", async (language, expectedCopy) => {
      const diagnostics = captureDiagnostics();
      mocks.language = language;
      mocks.supabaseAuth.getUser.mockResolvedValue({ data: { user: { id: "synthetic-user" } }, error: null });
      mocks.supabaseAuth.updateUser.mockResolvedValue({ error: { message: privateDetail, status: 422 } });
      window.history.replaceState({}, "", "/auth/reset-password?recovery=1");
      const ResetPasswordPage = (await import("@/app/auth/reset-password/page")).default;
      render(<ResetPasswordPage />);
      await waitFor(() => expect(document.getElementById("newPassword")).toBeTruthy());
      const input = document.getElementById("newPassword")!;
      fireEvent.change(input, { target: { value: "synthetic-password-123" } });
      fireEvent.change(document.getElementById("confirmPassword")!, { target: { value: "synthetic-password-123" } });
      fireEvent.submit(input.closest("form")!);
      expect(await screen.findByText(expectedCopy)).toBeTruthy();
      expect(mocks.supabaseAuth.updateUser).toHaveBeenCalledOnce();
      expect(mocks.supabaseAuth.signOut).not.toHaveBeenCalled();
      expect(document.body.textContent).not.toContain(privateDetail);
      expect(diagnostics()).not.toContain(privateDetail);
    });
  });
});
