import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

describe('POST /api/admin/vouchers/generate', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function makeReq(body: Record<string, unknown>) {
    return new Request('http://localhost:3000/api/admin/vouchers/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  }

  test('creates more than 100 DISCOUNT_PERCENT vouchers in a single batch', async () => {
    const artist = {
      name: 'Peggy Lee',
      key: 'PEGGYLEE',
      shortKey: 'PEG',
      discountPercent: 10,
    };

    const txBatchCreate = vi.fn().mockResolvedValue({ id: 'batch-1' });
    const txVoucherCreate = vi.fn().mockImplementation(async (args: any) => ({
      id: args.data.id,
      code: args.data.code,
      expiresAt: args.data.expiresAt,
      type: args.data.type,
    }));

    const voucherFindMany = vi.fn().mockResolvedValue([
      { code: 'PEG1099ABC' },
      { code: 'PEG1001AAA' },
    ]);

    const voucherUpdate = vi.fn().mockResolvedValue({});

    vi.doMock('@/lib/admin-api', () => ({
      ensureAdminApiPermission: vi.fn().mockResolvedValue({ ok: true, userId: 'admin-1' }),
    }));

    vi.doMock('@/lib/voucher-artists', () => ({
      VOUCHER_ARTIST_TIERS: [artist],
      getVoucherArtistByKey: vi.fn((key: string | null | undefined) =>
        key === artist.key ? artist : null
      ),
      getVoucherArtistByDiscount: vi.fn((discount: number | null | undefined) =>
        discount === artist.discountPercent ? artist : null
      ),
    }));

    vi.doMock('@/lib/voucher-provider-sync', () => ({
      ensureVoucherDiscountSynced: vi.fn().mockResolvedValue({
        ok: true,
        metadata: { synced: true },
      }),
    }));

    vi.doMock('@/lib/db', () => ({
      db: {
        voucherCode: {
          findMany: voucherFindMany,
          update: voucherUpdate,
        },
        $transaction: vi.fn(async (callback: any) =>
          callback({
            voucherBatch: { create: txBatchCreate },
            voucherCode: { create: txVoucherCreate },
          })
        ),
      },
    }));

    const { POST } = await import('@/app/api/admin/vouchers/generate/route');
    const response = await POST(
      makeReq({
        type: 'DISCOUNT_PERCENT',
        count: 150,
        artistKey: artist.key,
        discountPercent: artist.discountPercent,
        maxUses: 1,
        maxUsesPerUser: 1,
      })
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.created).toBe(150);
    expect(txBatchCreate).toHaveBeenCalledTimes(1);
    expect(txVoucherCreate).toHaveBeenCalledTimes(150);
    expect(voucherFindMany).toHaveBeenCalledTimes(1);
    expect(voucherUpdate).toHaveBeenCalledTimes(150);
  });
});
