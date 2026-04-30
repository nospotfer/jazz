import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";

import { listDodoPaymentsForCustomer } from "@/lib/payments/providers/dodo";

const ORIGINAL_ENV = { ...process.env };

describe("listDodoPaymentsForCustomer", () => {
  beforeEach(() => {
    process.env.DODO_PAYMENTS_API_KEY = "test_key";
    process.env.DODO_ENVIRONMENT = "test_mode";
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.restoreAllMocks();
  });

  test("normaliza payment_id retornado pela API de listagem para id", async () => {
    const mockFetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [
            {
              payment_id: "pay_listing_123",
              status: "succeeded",
              total_amount: 108,
              metadata: { courseId: "c1", userId: "u1" },
              customer_email: "x@y.com",
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const records = await listDodoPaymentsForCustomer({ email: "x@y.com" });

    expect(mockFetch).toHaveBeenCalled();
    expect(records).toHaveLength(1);
    expect(records[0]?.id).toBe("pay_listing_123");
    expect(records[0]?.payment_id).toBe("pay_listing_123");
  });

  test("preserva id quando a Dodo retorna apenas id", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [{ id: "pay_already_normalized", status: "succeeded" }],
        }),
        { status: 200 },
      ),
    );

    const records = await listDodoPaymentsForCustomer({ email: "x@y.com" });
    expect(records[0]?.id).toBe("pay_already_normalized");
  });
});
