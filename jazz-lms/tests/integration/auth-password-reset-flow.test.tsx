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
  useLanguage: () => ({ language: "en" }),
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
    expect(redirectOption).toContain("/auth/reset-password/callback");

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
});
