import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { retrieveDodoReconciliationSnapshot } from "@/lib/payments/dodo-reconciliation";
import {
  listDodoPaymentsForCustomer,
  retrieveDodoPayment,
} from "@/lib/payments/providers/dodo";

const email = "isolated-pagination-private-marker@example.invalid";
const customerId = "cus_isolated_private_marker";
const paymentId = "pay_isolated_private_marker";
const customer = { customer_id: customerId, email };
const payment = {
  payment_id: paymentId,
  status: "succeeded",
  total_amount: 8000,
  customer,
};

const readers = [
  {
    name: "customer payment list",
    run: (signal: AbortSignal) => listDodoPaymentsForCustomer({ email, signal }),
  },
  {
    name: "payment detail",
    run: (signal: AbortSignal) => retrieveDodoPayment(paymentId, { signal }),
  },
  {
    name: "reconciliation snapshot",
    run: (signal: AbortSignal) => retrieveDodoReconciliationSnapshot(payment, { signal }),
  },
];

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

function requestSignal(options?: RequestInit): AbortSignal {
  expect(options?.signal).toBeInstanceOf(AbortSignal);
  return options!.signal!;
}

function pendingUntilAbort(signal: AbortSignal): Promise<never> {
  return new Promise((_, reject) => {
    if (signal.aborted) {
      reject(signal.reason);
      return;
    }
    signal.addEventListener("abort", () => reject(signal.reason), { once: true });
  });
}

async function expectIncomplete(result: Promise<unknown>) {
  const error = await result.catch((value: unknown) => value);
  expect(error).toBeInstanceOf(Error);
  expect(error).toMatchObject({ name: "DodoPaginationIncompleteError" });
  const message = (error as Error).message;
  expect(message.length).toBeGreaterThan(0);
  expect(message.length).toBeLessThan(200);
  for (const privateValue of [email, customerId, paymentId]) {
    expect(message).not.toContain(privateValue);
  }
}

beforeEach(() => {
  vi.stubEnv("DODO_PAYMENTS_API_KEY", "isolated-mocked-api-key");
  vi.stubEnv("DODO_ENVIRONMENT", "test_mode");
  vi.stubEnv("DODO_API_BASE_URL", "https://test.dodopayments.com");
  // Every request must be explicitly handled by a closed mock. No provider I/O.
  vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockRejectedValue(
    new Error("Unexpected isolated Dodo read"),
  ));
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Dodo read cancellation", () => {
  test.each(readers)("$name rejects a pre-aborted caller without fetching", async ({ run }) => {
    const controller = new AbortController();
    const reason = new DOMException("Isolated caller cancelled", "AbortError");
    controller.abort(reason);

    await expect(run(controller.signal)).rejects.toBe(reason);
    expect(fetch).not.toHaveBeenCalled();
  });

  test.each(readers)("$name cancels an outstanding fetch using the caller signal", async ({ run }) => {
    const controller = new AbortController();
    const reason = new DOMException("Isolated caller cancelled", "AbortError");
    let transportSignal: AbortSignal | undefined;
    vi.mocked(fetch).mockImplementation((_url, options) => {
      transportSignal = requestSignal(options);
      return pendingUntilAbort(transportSignal);
    });
    const result = run(controller.signal);
    const rejected = expect(result).rejects.toBe(reason);

    controller.abort(reason);
    await rejected;
    expect(transportSignal?.aborted).toBe(true);
    expect(fetch).toHaveBeenCalledOnce();
  });

  test.each(readers)("$name does not convert a cancelled JSON body into null", async ({ run }) => {
    const controller = new AbortController();
    const reason = new DOMException("Isolated body cancelled", "AbortError");
    let beginBody!: () => void;
    const bodyStarted = new Promise<void>((resolve) => { beginBody = resolve; });
    vi.mocked(fetch).mockImplementation(async (_url, options) => {
      const signal = requestSignal(options);
      const response = new Response(null, { status: 200 });
      vi.spyOn(response, "json").mockImplementation(() => {
        beginBody();
        return pendingUntilAbort(signal);
      });
      return response;
    });
    const result = run(controller.signal);
    const rejected = expect(result).rejects.toBe(reason);

    await bodyStarted;
    controller.abort(reason);
    await rejected;
    expect(fetch).toHaveBeenCalledOnce();
  });

  for (const name of ["AbortError", "TimeoutError"]) {
    test.each(readers)(`$name rethrows a native ${name} from JSON reading`, async ({ run }) => {
      const reason = new DOMException("Isolated native body rejection", name);
      const response = new Response(null, { status: 200 });
      vi.spyOn(response, "json").mockRejectedValue(reason);
      vi.mocked(fetch).mockResolvedValueOnce(response);
      const controller = new AbortController();

      await expect(run(controller.signal)).rejects.toBe(reason);
      expect(controller.signal.aborted).toBe(false);
      expect(fetch).toHaveBeenCalledOnce();
    });
  }

  test.each(readers)("$name checks cancellation after receiving a response", async ({ run }) => {
    const controller = new AbortController();
    const reason = new DOMException("Cancelled as headers arrived", "AbortError");
    const response = jsonResponse({ items: [customer], ...payment });
    const readBody = vi.spyOn(response, "json");
    vi.mocked(fetch).mockImplementationOnce(async () => {
      controller.abort(reason);
      return response;
    });

    await expect(run(controller.signal)).rejects.toBe(reason);
    expect(readBody).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledOnce();
  });

  test.each(readers)("$name retains the 12-second timeout while its JSON body is pending", async ({ run }) => {
    vi.useFakeTimers();
    const controller = new AbortController();
    let transportSignal!: AbortSignal;
    let beginBody!: () => void;
    const bodyStarted = new Promise<void>((resolve) => { beginBody = resolve; });
    vi.mocked(fetch).mockImplementationOnce(async (_url, options) => {
      transportSignal = requestSignal(options);
      const response = new Response(null, { status: 200 });
      vi.spyOn(response, "json").mockImplementation(() => {
        beginBody();
        return pendingUntilAbort(transportSignal);
      });
      return response;
    });
    const result = run(controller.signal);
    const rejected = expect(result).rejects.toMatchObject({ name: "AbortError" });
    await bodyStarted;

    await vi.advanceTimersByTimeAsync(11_999);
    expect(transportSignal.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await rejected;
    expect(transportSignal.aborted).toBe(true);
    expect(controller.signal.aborted).toBe(false);
    expect(fetch).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  test.each(["customers", "payments"])("does not fetch another page after %s body completion cancels the caller", async (resource) => {
    const controller = new AbortController();
    const reason = new DOMException("Cancelled at page boundary", "AbortError");
    const requests: URL[] = [];
    vi.mocked(fetch).mockImplementation(async (url) => {
      const request = new URL(String(url));
      requests.push(request);
      if (request.pathname !== `/${resource}`) return jsonResponse({ items: [customer] });
      const response = new Response(null, { status: 200 });
      vi.spyOn(response, "json").mockImplementation(async () => {
        controller.abort(reason);
        return { items: Array.from({ length: resource === "customers" ? 100 : 2 }, () => (
          resource === "customers" ? customer : payment
        )) };
      });
      return response;
    });

    await expect(listDodoPaymentsForCustomer({ email, pageSize: 2, signal: controller.signal }))
      .rejects.toBe(reason);
    expect(requests).toHaveLength(resource === "customers" ? 1 : 2);
    expect(requests.filter((url) => url.pathname === `/${resource}`)).toHaveLength(1);
  });
});

describe("Dodo read pagination completeness", () => {
  test("rejects a full tenth customer page without requesting an eleventh or any payments", async () => {
    const requests: URL[] = [];
    vi.mocked(fetch).mockImplementation(async (url) => {
      const request = new URL(String(url));
      requests.push(request);
      expect(request.pathname).toBe("/customers");
      return jsonResponse({ items: Array.from({ length: 100 }, () => customer) });
    });

    await expectIncomplete(listDodoPaymentsForCustomer({ email }));
    expect(requests).toHaveLength(10);
    expect(requests.map((url) => url.searchParams.get("page_number")))
      .toEqual(Array.from({ length: 10 }, (_, page) => String(page)));
  });

  test("rejects a full tenth payment page instead of returning accumulated payments", async () => {
    const requests: URL[] = [];
    vi.mocked(fetch).mockImplementation(async (url) => {
      const request = new URL(String(url));
      requests.push(request);
      if (request.pathname === "/customers") return jsonResponse({ items: [customer] });
      expect(request.pathname).toBe("/payments");
      const page = request.searchParams.get("page_number");
      return jsonResponse({ items: Array.from({ length: 3 }, (_, index) => ({
        ...payment, payment_id: `${paymentId}_${page}_${index}`,
      })) });
    });

    await expectIncomplete(listDodoPaymentsForCustomer({ email, pageSize: 3 }));
    const paymentRequests = requests.filter((url) => url.pathname === "/payments");
    expect(requests).toHaveLength(11);
    expect(paymentRequests.map((url) => url.searchParams.get("page_number")))
      .toEqual(Array.from({ length: 10 }, (_, page) => String(page)));
  });

  test("accepts a short tenth customer page and returns the complete matching history", async () => {
    const requests: URL[] = [];
    vi.mocked(fetch).mockImplementation(async (url) => {
      const request = new URL(String(url));
      requests.push(request);
      if (request.pathname === "/payments") return jsonResponse({ items: [payment] });
      const lastPage = request.searchParams.get("page_number") === "9";
      return jsonResponse({ items: Array.from({ length: lastPage ? 99 : 100 }, () => customer) });
    });

    expect(await listDodoPaymentsForCustomer({ email, pageSize: 2 }))
      .toEqual([{ ...payment, id: paymentId }]);
    expect(requests.filter((url) => url.pathname === "/customers")).toHaveLength(10);
    expect(requests.filter((url) => url.pathname === "/payments")).toHaveLength(1);
  });

  test("accepts a short tenth payment page without truncating earlier pages", async () => {
    const requests: URL[] = [];
    vi.mocked(fetch).mockImplementation(async (url) => {
      const request = new URL(String(url));
      requests.push(request);
      if (request.pathname === "/customers") return jsonResponse({ items: [customer] });
      const page = request.searchParams.get("page_number");
      return jsonResponse({ items: Array.from({ length: page === "9" ? 1 : 3 }, (_, index) => ({
        ...payment, payment_id: `${paymentId}_${page}_${index}`,
      })) });
    });

    const records = await listDodoPaymentsForCustomer({ email, pageSize: 3 });
    expect(records).toHaveLength(28);
    expect(records[0].id).toBe(`${paymentId}_0_0`);
    expect(records.at(-1)?.id).toBe(`${paymentId}_9_0`);
    expect(requests.filter((url) => url.pathname === "/payments")).toHaveLength(10);
    expect(requests).toHaveLength(11);
  });
});

describe("Dodo reads without cancellation options", () => {
  test("preserves list owner filtering, payment-id normalization and de-duplication", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ items: [
        customer,
        { customer_id: "cus_unrelated", email: "other@example.invalid" },
      ] }))
      .mockResolvedValueOnce(jsonResponse({ items: [
        payment,
        payment,
        { ...payment, payment_id: "pay_wrong_customer", customer: { ...customer, customer_id: "cus_unrelated" } },
        { ...payment, payment_id: "pay_wrong_email", customer: { ...customer, email: "other@example.invalid" } },
      ] }));

    expect(await listDodoPaymentsForCustomer({ email, pageSize: 10 }))
      .toEqual([{ ...payment, id: paymentId }]);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  test("preserves payment detail 404 and non-JSON null results", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ error: "not found" }, 404))
      .mockResolvedValueOnce(new Response("not JSON", { status: 200 }));

    expect(await retrieveDodoPayment(paymentId)).toBeNull();
    expect(await retrieveDodoPayment(paymentId)).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  test("preserves a grantable snapshot and a missing-detail null without options", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(payment))
      .mockResolvedValueOnce(new Response(null, { status: 404 }));

    expect(await retrieveDodoReconciliationSnapshot(payment)).toEqual({
      type: "payment.succeeded",
      data: { payment: { ...payment, id: paymentId } },
    });
    expect(await retrieveDodoReconciliationSnapshot(payment)).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
