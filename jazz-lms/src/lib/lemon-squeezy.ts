import crypto from 'crypto';

const LEMON_API_BASE = 'https://api.lemonsqueezy.com/v1';

export type LemonDiscountAmountType = 'percent' | 'fixed';

export type LemonDiscountInput = {
  storeId: string;
  variantId?: string | null;
  name: string;
  code: string;
  amount: number;
  amountType: LemonDiscountAmountType;
  maxRedemptions?: number | null;
  expiresAt?: Date | string | null;
};

type LemonApiDiscountRecord = {
  type?: string;
  id?: string;
  attributes?: {
    code?: string;
    status?: string;
  };
};

function readRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}`);
  }

  return value;
}

function readOptionalEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : null;
}

export function isLemonConfigured() {
  return Boolean(
    readOptionalEnv('LEMON_SQUEEZY_API_KEY') &&
      readOptionalEnv('LEMON_SQUEEZY_STORE_ID') &&
      readOptionalEnv('LEMON_SQUEEZY_VARIANT_ID')
  );
}

function getHeaders() {
  return {
    Accept: 'application/vnd.api+json',
    'Content-Type': 'application/vnd.api+json',
    Authorization: `Bearer ${readRequiredEnv('LEMON_SQUEEZY_API_KEY')}`,
  };
}

async function parseJsonApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Lemon API failed (${response.status}): ${body}`);
  }

  return (await response.json()) as T;
}

export type LemonCheckoutInput = {
  storeId: string;
  variantId: string;
  email: string;
  successUrl: string;
  customData: Record<string, string>;
  discountCode?: string;
};

export async function createLemonCheckout(input: LemonCheckoutInput): Promise<string> {
  const response = await fetch(`${LEMON_API_BASE}/checkouts`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            email: input.email,
            custom: input.customData,
            ...(input.discountCode
              ? {
                  discount_code: input.discountCode,
                }
              : {}),
          },
          checkout_options: {
            embed: false,
            media: false,
            logo: true,
          },
          product_options: {
            redirect_url: input.successUrl,
            receipt_button_text: 'Voltar ao curso',
            receipt_link_url: input.successUrl,
          },
        },
        relationships: {
          store: {
            data: {
              type: 'stores',
              id: input.storeId,
            },
          },
          variant: {
            data: {
              type: 'variants',
              id: input.variantId,
            },
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Lemon checkout create failed (${response.status}): ${body}`);
  }

  const json = (await response.json()) as {
    data?: {
      attributes?: {
        url?: string;
      };
    };
  };

  const checkoutUrl = json?.data?.attributes?.url;
  if (!checkoutUrl) {
    throw new Error('Lemon checkout response missing url');
  }

  return checkoutUrl;
}

export async function createLemonDiscount(input: LemonDiscountInput): Promise<{ id: string; code: string }> {
  const amount = Number.isFinite(input.amount) ? Math.max(0, Math.round(input.amount)) : 0;

  const payload: any = {
    data: {
      type: 'discounts',
      attributes: {
        name: input.name,
        code: input.code,
        amount,
        amount_type: input.amountType,
        is_limited_to_products: Boolean(input.variantId),
        is_limited_redemptions:
          Number.isFinite(Number(input.maxRedemptions)) && Number(input.maxRedemptions) > 0,
        ...(Number.isFinite(Number(input.maxRedemptions)) && Number(input.maxRedemptions) > 0
          ? {
              max_redemptions: Number(input.maxRedemptions),
            }
          : {}),
        ...(input.expiresAt
          ? {
              expires_at:
                typeof input.expiresAt === 'string' ? input.expiresAt : new Date(input.expiresAt).toISOString(),
            }
          : {}),
      },
      relationships: {
        store: {
          data: {
            type: 'stores',
            id: input.storeId,
          },
        },
        ...(input.variantId
          ? {
              variants: {
                data: [
                  {
                    type: 'variants',
                    id: input.variantId,
                  },
                ],
              },
            }
          : {}),
      },
    },
  };

  const response = await fetch(`${LEMON_API_BASE}/discounts`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  const json = await parseJsonApiResponse<{ data?: LemonApiDiscountRecord }>(response);
  const id = json?.data?.id;
  const code = json?.data?.attributes?.code;

  if (!id || !code) {
    throw new Error('Lemon discount response missing id/code');
  }

  return { id, code };
}

export async function retrieveLemonDiscount(discountId: string): Promise<{ id: string; code: string } | null> {
  const response = await fetch(`${LEMON_API_BASE}/discounts/${discountId}`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (response.status === 404) {
    return null;
  }

  const json = await parseJsonApiResponse<{ data?: LemonApiDiscountRecord }>(response);
  const id = json?.data?.id;
  const code = json?.data?.attributes?.code;

  if (!id || !code) {
    return null;
  }

  return { id, code };
}

export async function findLemonDiscountByCode(storeId: string, code: string): Promise<{ id: string; code: string } | null> {
  const safeCode = code.trim().toUpperCase();

  for (let page = 1; page <= 10; page += 1) {
    const params = new URLSearchParams({
      'filter[store_id]': storeId,
      'page[number]': String(page),
      'page[size]': '100',
    });

    const response = await fetch(`${LEMON_API_BASE}/discounts?${params.toString()}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    const json = await parseJsonApiResponse<{
      data?: LemonApiDiscountRecord[];
      meta?: { page?: { currentPage?: number; lastPage?: number } };
    }>(response);

    const records = Array.isArray(json?.data) ? json.data : [];
    const found = records.find((record) => record?.attributes?.code?.trim().toUpperCase() === safeCode);

    if (found?.id && found?.attributes?.code) {
      return { id: found.id, code: found.attributes.code };
    }

    const currentPage = Number(json?.meta?.page?.currentPage ?? page);
    const lastPage = Number(json?.meta?.page?.lastPage ?? page);

    if (!Number.isFinite(lastPage) || currentPage >= lastPage) {
      break;
    }
  }

  return null;
}

export async function deleteLemonDiscount(discountId: string): Promise<void> {
  const response = await fetch(`${LEMON_API_BASE}/discounts/${discountId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (response.status === 404) {
    return;
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Lemon discount delete failed (${response.status}): ${body}`);
  }
}

export function verifyLemonSignature(payload: string, signature: string | null | undefined): boolean {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET?.trim();
  if (!secret || !signature) {
    return false;
  }

  const digest = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const incoming = signature.trim().toLowerCase();

  if (digest.length !== incoming.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(incoming));
}

export function getLemonConfig() {
  return {
    apiKey: readOptionalEnv('LEMON_SQUEEZY_API_KEY'),
    storeId: readOptionalEnv('LEMON_SQUEEZY_STORE_ID'),
    productId: readOptionalEnv('LEMON_SQUEEZY_PRODUCT_ID'),
    variantId: readOptionalEnv('LEMON_SQUEEZY_VARIANT_ID'),
  };
}
