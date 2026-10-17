import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";

import { listDodoPaymentsForCustomer, retrieveDodoPayment } from "@/lib/payments/providers/dodo";

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
              customer: { customer_id: "cus_1", email: "x@y.com" },
            },
          ],
        }),
        { status: 200 },
      ),
    );
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({
      items: [{ customer_id: "cus_1", email: "x@y.com" }],
    }), { status: 200 }));

    const records = await listDodoPaymentsForCustomer({ email: "x@y.com" });

    expect(mockFetch).toHaveBeenCalled();
    expect(records).toHaveLength(1);
    expect(records[0]?.id).toBe("pay_listing_123");
    expect(records[0]?.payment_id).toBe("pay_listing_123");
    const [customerCall, paymentCall] = mockFetch.mock.calls;
    expect(new URL(String(customerCall[0])).pathname).toBe("/customers");
    expect(new URL(String(customerCall[0])).searchParams.get("email")).toBe("x@y.com");
    expect(new URL(String(paymentCall[0])).searchParams.get("customer_id")).toBe("cus_1");
    expect(new URL(String(paymentCall[0])).searchParams.has("customer_email")).toBe(false);
  });

  test("preserva id quando a Dodo retorna apenas id", async () => {
    const mockFetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [{ id: "pay_already_normalized", status: "succeeded", customer: { customer_id: "cus_1", email: "x@y.com" } }],
        }),
        { status: 200 },
      ),
    );
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({
      items: [{ customer_id: "cus_1", email: "x@y.com" }],
    }), { status: 200 }));

    const records = await listDodoPaymentsForCustomer({ email: "x@y.com" });
    expect(records[0]?.id).toBe("pay_already_normalized");
  });

  test("normalizes documented payment_id from payment detail", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      payment_id: "pay_detail", status: "succeeded",
    }), { status: 200 }));
    expect(await retrieveDodoPayment("pay_detail")).toEqual({
      payment_id: "pay_detail", id: "pay_detail", status: "succeeded",
    });
  });

  test.each([
    { status: 503, body: { error: 'unavailable' }, reason: 'list failed (503)' },
    { status: 200, body: { unexpected: true }, reason: 'invalid response' },
  ])('reports provider failures rather than an empty payment history', async ({ status, body, reason }) => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(body), { status }));
    await expect(listDodoPaymentsForCustomer({ email: 'buyer@example.test' })).rejects.toThrow(reason);
  });

  test("rejects unrelated customers and payments even if provider filters are ignored", async () => {
    const mockFetch = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: [
        { customer_id: "cus_1", email: "X@Y.COM" },
        { customer_id: "cus_other", email: "other@example.test" },
      ] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: [
        { payment_id: "pay_other_email", customer: { customer_id: "cus_1", email: "other@example.test" } },
        { payment_id: "pay_other_id", customer: { customer_id: "cus_other", email: "x@y.com" } },
        { payment_id: "pay_missing_owner" },
      ] }), { status: 200 }));
    expect(await listDodoPaymentsForCustomer({ email: "x@y.com" })).toEqual([]);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  test("paginates each matching customer with documented filters and de-duplicates payments", async () => {
    const requests: URL[] = [];
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
      const request = new URL(String(url));
      requests.push(request);
      if (request.pathname === "/customers") return new Response(JSON.stringify({ items: [
        { customer_id: "cus_1", email: "x@y.com" },
        { customer_id: "cus_2", email: "x@y.com" },
      ] }), { status: 200 });
      const customerId = request.searchParams.get("customer_id");
      const page = request.searchParams.get("page_number");
      return new Response(JSON.stringify({ items: page === "0" ? [{
        payment_id: `pay_${customerId}`, customer: { customer_id: customerId, email: "x@y.com" },
      }] : [] }), { status: 200 });
    });
    const records = await listDodoPaymentsForCustomer({ email: "x@y.com", pageSize: 1, sinceISO: "2026-10-01T00:00:00Z" });
    expect(records.map((payment) => payment.id)).toEqual(["pay_cus_1", "pay_cus_2"]);
    expect(requests).toHaveLength(5);
    for (const url of requests.filter((url) => url.pathname === "/payments")) {
      expect(url.searchParams.get("created_at_gte")).toBe("2026-10-01T00:00:00Z");
      expect(url.searchParams.has("customer_email")).toBe(false);
    }
  });
});
