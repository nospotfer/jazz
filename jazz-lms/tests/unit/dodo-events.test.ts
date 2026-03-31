import { describe, expect, test } from "vitest";

import { extractDodoPricing } from "@/lib/payments/providers/dodo-events";

describe("extractDodoPricing", () => {
  test("converts integer provider amounts from minor units", () => {
    const pricing = extractDodoPricing({
      data: {
        payment: {
          amount: 2990,
        },
      },
    });

    expect(pricing).toEqual({
      subtotalAmount: 29.9,
      totalAmount: 29.9,
      discountAmount: 0,
    });
  });

  test("converts low-value integer provider amounts from minor units", () => {
    const pricing = extractDodoPricing({
      data: {
        payment: {
          amount: 990,
        },
      },
    });

    expect(pricing).toEqual({
      subtotalAmount: 9.9,
      totalAmount: 9.9,
      discountAmount: 0,
    });
  });

  test("converts integer string provider amounts from minor units", () => {
    const pricing = extractDodoPricing({
      data: {
        payment: {
          amount: "1000",
        },
      },
    });

    expect(pricing).toEqual({
      subtotalAmount: 10,
      totalAmount: 10,
      discountAmount: 0,
    });
  });

  test("keeps metadata originalPrice as major units when provider subtotal is missing", () => {
    const pricing = extractDodoPricing({
      data: {
        payment: {
          amount: 990,
        },
        metadata: {
          originalPrice: "29",
        },
      },
    });

    expect(pricing).toEqual({
      subtotalAmount: 29,
      totalAmount: 9.9,
      discountAmount: 19.1,
    });
  });
});
