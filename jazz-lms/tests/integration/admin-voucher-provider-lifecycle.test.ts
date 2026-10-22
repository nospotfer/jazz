import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn(), delete: vi.fn(),
  deleteMany: vi.fn(), transaction: vi.fn(), sync: vi.fn(), disable: vi.fn(),
}));
vi.mock("@/lib/admin-api", () => ({ ensureAdminApiPermission: async () => ({ ok: true }) }));
vi.mock("@/lib/voucher-provider-sync", () => ({ ensureVoucherDiscountSynced: mocks.sync, removeVoucherDiscountSync: mocks.disable }));
vi.mock("@/lib/voucher-artists", () => ({ isLegacyVoucherCode: () => true }));
vi.mock("@/lib/db", () => ({ db: {
  voucherCode: { findUnique: mocks.findUnique, findMany: mocks.findMany, update: mocks.update },
  $transaction: mocks.transaction,
} }));

const voucher = {
  id: "voucher-1", code: "JAZZTEST", type: "DISCOUNT_PERCENT",
  discountPercent: 20, discountAmount: null, minOrderValue: 10,
  maxUses: 10, currentUses: 10, maxUsesPerUser: 2,
  isActive: true, expiresAt: null, metadata: {}, batchId: null, _count: { redemptions: 0 },
};
const request = (path: string, body: unknown, method = "POST") => new Request(`http://localhost${path}`, { method, body: JSON.stringify(body) });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.findUnique.mockResolvedValue(voucher);
  mocks.findMany.mockResolvedValue([voucher]);
  mocks.sync.mockResolvedValue({ ok: true, metadata: {} });
  mocks.disable.mockResolvedValue({ ok: true, metadata: {} });
  mocks.update.mockResolvedValue(voucher);
  mocks.transaction.mockImplementation(async (callback) => callback({
    voucherCode: { delete: mocks.delete, deleteMany: mocks.deleteMany },
  }));
});

describe("Admin provider voucher lifecycle", () => {
  test("does not toggle local state when remote activation fails", async () => {
    mocks.sync.mockResolvedValue({ ok: false, reason: "provider unavailable", metadata: {} });
    const { PATCH } = await import("@/app/api/admin/vouchers/[voucherId]/toggle/route");
    const response = await PATCH(request("/api/admin/vouchers/voucher-1/toggle", { isActive: true }, "PATCH"), { params: Promise.resolve({ voucherId: "voucher-1" }) });
    expect(response.status).toBe(503);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  test("does not delete local voucher if remote disable fails", async () => {
    mocks.disable.mockResolvedValue({ ok: false, reason: "shared provider code", metadata: {} });
    const { DELETE } = await import("@/app/api/admin/vouchers/[voucherId]/route");
    const response = await DELETE(new Request("http://localhost/api/admin/vouchers/voucher-1?force=true", { method: "DELETE" }), { params: Promise.resolve({ voucherId: "voucher-1" }) });
    expect(response.status).toBe(503);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  test("bulk delete preserves rows whose provider disable failed", async () => {
    mocks.findMany.mockResolvedValue([voucher, { ...voucher, id: "voucher-2", code: "JAZZFAIL" }]);
    mocks.disable.mockResolvedValueOnce({ ok: true, metadata: {} }).mockResolvedValueOnce({ ok: false, reason: "unavailable", metadata: {} });
    const { POST } = await import("@/app/api/admin/vouchers/bulk-delete/route");
    const response = await POST(request("/api/admin/vouchers/bulk-delete", { voucherIds: ["voucher-1", "voucher-2"], force: true }));
    expect(mocks.deleteMany).toHaveBeenCalledWith({ where: { id: { in: ["voucher-1"] } } });
    expect(await response.json()).toMatchObject({ success: false, deletedCount: 1, providerSyncWarnings: ["JAZZFAIL: unavailable"] });
  });

  test("legacy purge preserves provider failures", async () => {
    mocks.disable.mockResolvedValue({ ok: false, reason: "ownership review", metadata: {} });
    const { POST } = await import("@/app/api/admin/vouchers/purge-legacy/route");
    const response = await POST(request("/api/admin/vouchers/purge-legacy", { force: true }));
    expect(mocks.deleteMany).toHaveBeenCalledWith({ where: { id: { in: [] } } });
    expect(await response.json()).toMatchObject({ success: false, deletedCount: 0 });
  });

  test("resync preserves configured total limit and never adds a use to exhausted voucher", async () => {
    const { POST } = await import("@/app/api/admin/vouchers/resync-provider/route");
    const response = await POST(request("/api/admin/vouchers/resync-provider", {}));
    expect(response.status).toBe(200);
    expect(mocks.sync).toHaveBeenCalledWith(expect.objectContaining({
      maxUses: 10, maxUsesPerUser: 2, minOrderValue: 10, isActive: true,
    }));
  });

  test("resync passes inactive state so provider coupon remains disabled", async () => {
    mocks.findMany.mockResolvedValue([{ ...voucher, isActive: false }]);
    const { POST } = await import("@/app/api/admin/vouchers/resync-provider/route");
    await POST(request("/api/admin/vouchers/resync-provider", { onlyActive: false }));
    expect(mocks.sync).toHaveBeenCalledWith(expect.objectContaining({ isActive: false }));
  });
});
