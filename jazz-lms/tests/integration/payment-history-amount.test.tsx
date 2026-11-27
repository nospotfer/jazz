// @vitest-environment jsdom

import PaymentPage from "@/app/dashboard/payment/page";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";

type SessionHint = { user: { id: string } } | null;
const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  language: "es",
  initialSession: true,
  ownerId: "fixture-owner-a" as string | null,
  listeners: new Set<(event: string, session: SessionHint) => void>(),
  unsubscribe: vi.fn(),
}));

vi.mock("axios", () => ({
  default: { get: mocks.get },
}));

vi.mock("@/components/providers/language-provider", () => ({
  useLanguage: () => ({ language: mocks.language }),
}));

vi.mock("@/utils/supabase/client", () => ({
  createClient: () => ({ auth: {
    onAuthStateChange: (listener: (event: string, session: SessionHint) => void) => {
      mocks.listeners.add(listener);
      const initialOwner = mocks.ownerId;
      if (mocks.initialSession) queueMicrotask(() => {
        if (mocks.listeners.has(listener)) listener("INITIAL_SESSION", initialOwner ? { user: { id: initialOwner } } : null);
      });
      return { data: { subscription: { unsubscribe: () => {
        mocks.listeners.delete(listener);
        mocks.unsubscribe();
      } } } };
    },
  } }),
}));

function emitAuth(event: string, ownerId: string | null) {
  mocks.ownerId = ownerId;
  for (const listener of mocks.listeners) listener(event, ownerId ? { user: { id: ownerId } } : null);
}

class PaymentRenderBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? (
      <div role="alert">Payment history failed to render</div>
    ) : this.props.children;
  }
}

const record = {
  itemType: "Curso",
  createdAt: "2026-01-15T10:00:00.000Z",
  currency: "EUR",
  amountMinor: null,
};

describe("Payment history recorded amounts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.get.mockReset();
    mocks.language = "es";
    mocks.initialSession = true;
    mocks.ownerId = "fixture-owner-a";
    mocks.listeners.clear();
  });

  test("renders an unknown amount without crashing or confusing it with recorded zero or a positive charge", async () => {
    mocks.get.mockResolvedValue({ data: [
      { ...record, id: "unknown", itemTitle: "Unrecorded course", amount: null },
      { ...record, id: "zero", itemTitle: "Zero-cost course", amount: 0, amountMinor: "0" },
      { ...record, id: "paid", itemTitle: "Paid course", amount: 24.9, amountMinor: "2490" },
    ] });

    render(<PaymentRenderBoundary><PaymentPage /></PaymentRenderBoundary>);

    const unknownTitle = await screen.findByText("Unrecorded course");
    const unknownRow = within(unknownTitle.parentElement!.parentElement!);
    expect(unknownRow.getByText("Importe no disponible")).toBeTruthy();
    expect(unknownRow.queryByText(/€/)).toBeNull();
    expect(screen.getByText("0,00 EUR")).toBeTruthy();
    expect(screen.getByText("24,90 EUR")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(mocks.get).toHaveBeenCalledTimes(1);
    expect(mocks.get.mock.calls[0]?.[0]).toBe("/api/purchases");
  });

  test("keeps the unknown amount localized after language changes without refetching or inventing a charge", async () => {
    mocks.get.mockResolvedValue({ data: [
      { ...record, id: "unknown", itemTitle: "Unrecorded course", amount: null },
    ] });

    const view = render(<PaymentRenderBoundary><PaymentPage /></PaymentRenderBoundary>);
    expect(await screen.findByText("Importe no disponible")).toBeTruthy();

    for (const [language, message] of [
      ["en", "Amount unavailable"],
      ["fr", "Montant indisponible"],
      ["pt", "Valor indisponível"],
    ]) {
      mocks.language = language;
      view.rerender(<PaymentRenderBoundary><PaymentPage /></PaymentRenderBoundary>);
      expect(screen.getByText(message)).toBeTruthy();
      expect(screen.queryByText(/€/)).toBeNull();
      expect(screen.queryByRole("alert")).toBeNull();
    }

    expect(mocks.get).toHaveBeenCalledTimes(1);
  });

  test("a successful empty response retains the real empty-history state", async () => {
    mocks.get.mockResolvedValue({ data: [] });
    render(<PaymentRenderBoundary><PaymentPage /></PaymentRenderBoundary>);
    expect(await screen.findByText("Aún no hay compras")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByRole("button", { name: "Reintentar" })).toBeNull();
    expect(mocks.get).toHaveBeenCalledTimes(1);
  });

  test.each([
    ["es", "No se pudo cargar tu historial de pagos.", "Reintentar", "Cargando pagos...", "Importe no disponible", "Aún no hay compras", "0,00 EUR", "24,90 EUR"],
    ["en", "Unable to load your payment history.", "Retry", "Loading payments...", "Amount unavailable", "No purchases yet", "EUR 0.00", "EUR 24.90"],
    ["fr", "Impossible de charger votre historique des paiements.", "Réessayer", "Chargement des paiements...", "Montant indisponible", "Aucun achat pour le moment", "0,00 EUR", "24,90 EUR"],
    ["pt", "Não foi possível carregar seu histórico de pagamentos.", "Tentar novamente", "Carregando pagamentos...", "Valor indisponível", "Ainda não há compras", "EUR 0,00", "EUR 24,90"],
  ])("keeps a failed request distinct from empty history and recovers recorded amounts after explicit retry (%s)", async (
    language, errorCopy, retryCopy, loadingCopy, unavailableCopy, emptyCopy, zeroMoney, paidMoney,
  ) => {
    mocks.language = language;
    const retry = Promise.withResolvers<{ data: unknown[] }>();
    mocks.get.mockRejectedValueOnce(new Error("Internal upstream failure detail"))
      .mockReturnValueOnce(retry.promise);
    render(<PaymentRenderBoundary><PaymentPage /></PaymentRenderBoundary>);

    const alert = await screen.findByRole("alert");
    expect(within(alert).getByText(errorCopy)).toBeTruthy();
    expect(screen.queryByText(emptyCopy)).toBeNull();
    expect(screen.queryByText("Internal upstream failure detail")).toBeNull();
    expect(mocks.get).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: retryCopy }));
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("status", { name: loadingCopy })).toBeTruthy();
    expect(screen.queryByText(emptyCopy)).toBeNull();
    expect(screen.queryByRole("button", { name: retryCopy })).toBeNull();
    expect(mocks.get).toHaveBeenCalledTimes(2);

    await act(async () => retry.resolve({ data: [
      { ...record, id: "unknown", itemTitle: "Unrecorded course", amount: null },
      { ...record, id: "zero", itemTitle: "Zero-cost course", amount: 0, amountMinor: "0" },
      { ...record, id: "paid", itemTitle: "Paid course", amount: 24.9, amountMinor: "2490" },
    ] }));

    expect(screen.getByText(unavailableCopy)).toBeTruthy();
    expect(screen.getByText(zeroMoney)).toBeTruthy();
    expect(screen.getByText(paidMoney)).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.queryByText(emptyCopy)).toBeNull();
    expect(mocks.get).toHaveBeenCalledTimes(2);
  });

  test("a successful empty retry clears the failure without automatic further attempts", async () => {
    mocks.get.mockRejectedValueOnce(new Error("Unavailable"))
      .mockResolvedValueOnce({ data: [] });
    render(<PaymentRenderBoundary><PaymentPage /></PaymentRenderBoundary>);
    await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("Aún no hay compras")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(mocks.get).toHaveBeenCalledTimes(2);
  });

  test.each(["response", "error"])("aborts an unmounted request and ignores its late %s while a fresh page loads", async (outcome) => {
    const obsolete = Promise.withResolvers<{ data: unknown[] }>();
    mocks.get.mockReturnValueOnce(obsolete.promise).mockResolvedValueOnce({ data: [
      { ...record, id: "current", itemTitle: "Current course", amount: 24.9, amountMinor: "2490" },
    ] });
    const previous = render(<PaymentRenderBoundary><PaymentPage /></PaymentRenderBoundary>);
    await waitFor(() => expect(mocks.get).toHaveBeenCalledTimes(1));
    const signal = mocks.get.mock.calls[0]?.[1]?.signal;
    previous.unmount();
    expect(signal).toBeInstanceOf(AbortSignal);
    expect(signal.aborted).toBe(true);

    render(<PaymentRenderBoundary><PaymentPage /></PaymentRenderBoundary>);
    await screen.findByText("Current course");
    await act(async () => {
      if (outcome === "response") obsolete.resolve({ data: [
        { ...record, id: "obsolete", itemTitle: "Obsolete course", amount: 80, amountMinor: "8000" },
      ] });
      else obsolete.reject(new Error("Old request failure"));
    });
    expect(screen.getByText("Current course")).toBeTruthy();
    expect(screen.queryByText("Obsolete course")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(mocks.get).toHaveBeenCalledTimes(2);
  });

  test("does not request history until the initial auth owner resolves", async () => {
    mocks.initialSession = false;
    mocks.get.mockResolvedValue({ data: [] });
    render(<PaymentRenderBoundary><PaymentPage /></PaymentRenderBoundary>);
    expect(mocks.get).not.toHaveBeenCalled();
    expect(screen.queryByText("Aún no hay compras")).toBeNull();
    act(() => emitAuth("INITIAL_SESSION", "fixture-owner-a"));
    await screen.findByText("Aún no hay compras");
    expect(mocks.get.mock.calls[0]?.[1]).toEqual(expect.objectContaining({
      params: { expectedUserId: "fixture-owner-a" }, signal: expect.any(AbortSignal),
    }));
  });

  test("changing owners aborts a pending history request and blocks its old response before the new one settles", async () => {
    const oldOwner = Promise.withResolvers<{ data: unknown[] }>();
    const newOwner = Promise.withResolvers<{ data: unknown[] }>();
    mocks.get.mockReturnValueOnce(oldOwner.promise).mockReturnValueOnce(newOwner.promise);
    render(<PaymentRenderBoundary><PaymentPage /></PaymentRenderBoundary>);
    await waitFor(() => expect(mocks.get).toHaveBeenCalledTimes(1));
    const oldSignal = mocks.get.mock.calls[0]?.[1]?.signal;

    act(() => emitAuth("SIGNED_IN", "fixture-owner-b"));
    await waitFor(() => expect(mocks.get).toHaveBeenCalledTimes(2));
    expect(oldSignal.aborted).toBe(true);
    expect(mocks.get.mock.calls[1]?.[1]?.params).toEqual({ expectedUserId: "fixture-owner-b" });
    await act(async () => oldOwner.resolve({ data: [
      { ...record, id: "old", itemTitle: "Previous owner course", amount: 80, amountMinor: "8000" },
    ] }));
    expect(screen.queryByText("Previous owner course")).toBeNull();
    expect(screen.getByRole("status", { name: "Cargando pagos..." })).toBeTruthy();

    await act(async () => newOwner.resolve({ data: [
      { ...record, id: "new", itemTitle: "Current owner course", amount: null },
    ] }));
    expect(screen.getByText("Current owner course")).toBeTruthy();
    expect(screen.queryByText("Previous owner course")).toBeNull();
  });

  test("changing owners clears already displayed history while the new request is pending", async () => {
    const next = Promise.withResolvers<{ data: unknown[] }>();
    mocks.get.mockResolvedValueOnce({ data: [
      { ...record, id: "old", itemTitle: "Previous owner course", amount: 80, amountMinor: "8000" },
    ] }).mockReturnValueOnce(next.promise);
    render(<PaymentRenderBoundary><PaymentPage /></PaymentRenderBoundary>);
    await screen.findByText("Previous owner course");
    act(() => emitAuth("SIGNED_IN", "fixture-owner-b"));
    expect(screen.queryByText("Previous owner course")).toBeNull();
    await act(async () => next.resolve({ data: [] }));
    expect(screen.getByText("Aún no hay compras")).toBeTruthy();
  });

  test("a late initial-session result cannot overwrite a newer signed-in owner", async () => {
    mocks.initialSession = false;
    const current = Promise.withResolvers<{ data: unknown[] }>();
    mocks.get.mockReturnValue(current.promise);
    render(<PaymentRenderBoundary><PaymentPage /></PaymentRenderBoundary>);
    act(() => emitAuth("SIGNED_IN", "fixture-owner-b"));
    act(() => emitAuth("INITIAL_SESSION", "fixture-owner-a"));
    expect(mocks.get).toHaveBeenCalledTimes(1);
    expect(mocks.get.mock.calls[0]?.[1]?.params).toEqual({ expectedUserId: "fixture-owner-b" });
    await act(async () => current.resolve({ data: [] }));
    expect(screen.getByText("Aún no hay compras")).toBeTruthy();
  });

  test("same-owner auth refresh updates neither history nor request count", async () => {
    mocks.get.mockResolvedValue({ data: [
      { ...record, id: "current", itemTitle: "Current owner course", amount: 0, amountMinor: "0" },
    ] });
    render(<PaymentRenderBoundary><PaymentPage /></PaymentRenderBoundary>);
    await screen.findByText("Current owner course");
    act(() => emitAuth("TOKEN_REFRESHED", "fixture-owner-a"));
    expect(screen.getByText("Current owner course")).toBeTruthy();
    expect(mocks.get).toHaveBeenCalledTimes(1);
  });

  test("signing out clears history and ignores an old request without unmounting", async () => {
    const pending = Promise.withResolvers<{ data: unknown[] }>();
    mocks.get.mockReturnValueOnce(pending.promise);
    render(<PaymentRenderBoundary><PaymentPage /></PaymentRenderBoundary>);
    await waitFor(() => expect(mocks.get).toHaveBeenCalledTimes(1));
    const signal = mocks.get.mock.calls[0]?.[1]?.signal;
    act(() => emitAuth("SIGNED_OUT", null));
    expect(signal.aborted).toBe(true);
    await act(async () => pending.resolve({ data: [
      { ...record, id: "old", itemTitle: "Previous owner course", amount: 80, amountMinor: "8000" },
    ] }));
    expect(screen.queryByText("Previous owner course")).toBeNull();
    expect(screen.queryByText("Aún no hay compras")).toBeNull();
    expect(screen.getByRole("button", { name: "Reintentar" })).toHaveProperty("disabled", true);
    expect(mocks.get).toHaveBeenCalledTimes(1);
  });

  test.each([
    { data: {} },
    { data: [{ ...record, id: "malformed", itemTitle: "Invalid course", amount: "not-a-number" }] },
  ])("a malformed successful response becomes a generic retryable error (%j)", async ({ data }) => {
    mocks.get.mockResolvedValue({ data });
    render(<PaymentRenderBoundary><PaymentPage /></PaymentRenderBoundary>);
    const alert = await screen.findByRole("alert");
    expect(within(alert).getByText("No se pudo cargar tu historial de pagos.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeTruthy();
    expect(screen.queryByText("Aún no hay compras")).toBeNull();
    expect(screen.queryByText("Invalid course")).toBeNull();
  });

  test("language changes localize a failed load without triggering another request", async () => {
    mocks.get.mockRejectedValue(new Error("Unavailable"));
    const view = render(<PaymentRenderBoundary><PaymentPage /></PaymentRenderBoundary>);
    await screen.findByRole("alert");
    mocks.language = "en";
    view.rerender(<PaymentRenderBoundary><PaymentPage /></PaymentRenderBoundary>);
    expect(screen.getByText("Unable to load your payment history.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Retry" })).toBeTruthy();
    expect(mocks.get).toHaveBeenCalledTimes(1);
  });
});
