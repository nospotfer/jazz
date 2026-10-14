// @vitest-environment jsdom

import PaymentPage from "@/app/dashboard/payment/page";
import { render, screen, within } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  language: "es",
}));

vi.mock("axios", () => ({
  default: { get: mocks.get },
}));

vi.mock("@/components/providers/language-provider", () => ({
  useLanguage: () => ({ language: mocks.language }),
}));

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
};

describe("Payment history recorded amounts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.language = "es";
  });

  test("renders an unknown amount without crashing or confusing it with recorded zero or a positive charge", async () => {
    mocks.get.mockResolvedValue({ data: [
      { ...record, id: "unknown", itemTitle: "Unrecorded course", amount: null },
      { ...record, id: "zero", itemTitle: "Zero-cost course", amount: 0 },
      { ...record, id: "paid", itemTitle: "Paid course", amount: 24.9 },
    ] });

    render(<PaymentRenderBoundary><PaymentPage /></PaymentRenderBoundary>);

    const unknownTitle = await screen.findByText("Unrecorded course");
    const unknownRow = within(unknownTitle.parentElement!.parentElement!);
    expect(unknownRow.getByText("Importe no disponible")).toBeTruthy();
    expect(unknownRow.queryByText(/€/)).toBeNull();
    expect(screen.getByText("€0.00")).toBeTruthy();
    expect(screen.getByText("€24.90")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(mocks.get).toHaveBeenCalledTimes(1);
    expect(mocks.get).toHaveBeenCalledWith("/api/purchases");
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
});
