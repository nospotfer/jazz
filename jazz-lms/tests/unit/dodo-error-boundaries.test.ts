import { safeErrorDiagnostic, safeErrorReason } from "@/lib/error-diagnostics";
import {
  createDodoCheckout,
  createDodoDiscount,
  disableDodoDiscount,
  retrieveDodoPayment,
} from "@/lib/payments/providers/dodo";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const marker = "isolated-private-error-marker";
const privateDetails = {
  email: `${marker}@example.invalid`,
  url: `https://checkout.example.invalid/session?token=${marker}`,
  authorization: `Bearer ${marker}`,
};
const checkout = {
  productId: "fixture-product", email: "buyer@example.invalid",
  returnUrl: "https://app.example.invalid/return", metadata: {},
};
const discount = {
  code: "FIXTURE10", type: "percentage" as const, amount: 1000,
  voucherId: "fixture-voucher", productIds: ["fixture-product"],
};

beforeEach(() => {
  vi.stubEnv("DODO_PAYMENTS_API_KEY", "fixture-api-key");
  vi.stubEnv("DODO_ENVIRONMENT", "test_mode");
  vi.stubEnv("DODO_API_BASE_URL", "https://test.dodopayments.com");
  vi.stubEnv("DODO_PRODUCT_ID", "fixture-product");
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Unexpected isolated fetch")));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

function response(message: string, status: number) {
  return new Response(JSON.stringify({ message, ...privateDetails }), { status });
}

describe("Dodo diagnostic boundaries", () => {
  test.each([
    ["generic provider failure", "", 422],
    ["discount not found", ": invalid discount", 400],
    ["discount_usage_limit_reached", ": discount usage limit", 409],
    ["discount invalid and maximum redemptions reached", ": discount usage limit", 409],
  ])("retains the checkout decision for %s without copying the body", async (message, hint, status) => {
    vi.mocked(fetch).mockResolvedValueOnce(response(message as string, status as number));
    const error = await createDodoCheckout(checkout).catch(value => value);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe(`Dodo checkout create failed (${status})${hint}`);
    expect(error.status).toBe(status);
    expect(JSON.stringify(safeErrorDiagnostic(error))).not.toContain(marker);
    expect(fetch).toHaveBeenCalledOnce();
  });

  test("payment retrieval exposes only its operation/status", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(response("provider unavailable", 503));
    const error = await retrieveDodoPayment("fixture-payment").catch(value => value);
    expect(error.message).toBe("Dodo payment retrieve failed (503)");
    expect(safeErrorDiagnostic(error)).toEqual({ category: "service_unavailable", status: 503 });
    expect(fetch).toHaveBeenCalledOnce();
  });

  test("discount failure reasons are safe to persist in voucher metadata", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(response("invalid product", 400));
    const result = await createDodoDiscount(discount);
    expect(result).toEqual({ ok: false, reason: "Dodo discount create failed (400)" });
    expect(JSON.stringify(result)).not.toContain(marker);
    expect(fetch).toHaveBeenCalledOnce();
  });

  test.each(["create", "remove"])("%s discount transport errors omit arbitrary exception details", async operation => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error(JSON.stringify(privateDetails)));
    const result = operation === "create" ? await createDodoDiscount(discount)
      : await disableDodoDiscount({ code: discount.code, voucherId: discount.voucherId });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe(operation === "create"
      ? "Dodo discount request failed" : "Dodo discount removal failed");
    expect(JSON.stringify(result)).not.toContain(marker);
  });

  test("arbitrary thrown fields cannot become diagnostics while known database status survives", () => {
    const error = Object.assign(new Error(JSON.stringify(privateDetails)), {
      name: marker, code: "P2028", cause: privateDetails,
    });
    expect(safeErrorDiagnostic(error)).toEqual({ category: "database_unavailable", code: "P2028" });
    expect(safeErrorReason(error)).toBe("database_unavailable (P2028)");
    const hostile = { get name() { throw new Error(marker); } };
    for (const value of [privateDetails, marker, hostile, { name: marker, code: marker, status: marker }]) {
      expect(() => safeErrorDiagnostic(value)).not.toThrow();
      expect(JSON.stringify(safeErrorDiagnostic(value))).not.toContain(marker);
      expect(safeErrorReason(value)).not.toContain(marker);
    }
  });

  test("changing accessors cannot replace validated code/status with private values", () => {
    let codeReads = 0;
    const code = { get code() { return codeReads++ === 0 ? "P2028" : marker; } };
    expect(safeErrorDiagnostic(code)).toEqual({ category: "database_unavailable", code: "P2028" });
    expect(codeReads).toBe(1);
    let statusReads = 0;
    const status = { get status() { return statusReads++ === 0 ? 503 : marker; } };
    expect(safeErrorDiagnostic(status)).toEqual({ category: "service_unavailable", status: 503 });
    expect(statusReads).toBe(1);
  });
});
