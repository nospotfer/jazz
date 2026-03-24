import { requirePermission } from "@/lib/admin";
import { db } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function AdminVoucherDetailPage({
  params,
}: {
  params: Promise<{ voucherId: string }>;
}) {
  await requirePermission("vouchers.read");
  const { voucherId } = await params;

  const prisma = db as any;
  const voucher = await prisma.voucherCode.findUnique({
    where: { id: voucherId },
    include: {
      course: {
        select: { id: true, title: true },
      },
      batch: {
        select: { id: true, name: true, codePrefix: true, createdAt: true },
      },
      redemptions: {
        include: {
          purchase: {
            select: {
              id: true,
              originalPrice: true,
              finalPrice: true,
              discountAmount: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          redeemedAt: "desc",
        },
      },
    },
  });

  if (!voucher) {
    notFound();
  }

  const userIds: string[] = Array.from(
    new Set(
      voucher.redemptions.map((redemption: any) => String(redemption.userId)),
    ),
  );
  const users = userIds.length
    ? await db.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true, name: true },
      })
    : [];
  const usersMap = new Map(users.map((user) => [user.id, user]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Voucher</p>
          <h1 className="text-3xl font-bold font-mono">{voucher.code}</h1>
        </div>
        <Link href="/admin/vouchers" className="btn-secondary">
          ← Volver
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-xs text-muted-foreground">Tipo</p>
          <p className="text-lg font-semibold mt-1">{voucher.type}</p>
        </div>
        <div className="card">
          <p className="text-xs text-muted-foreground">Uso</p>
          <p className="text-lg font-semibold mt-1">
            {voucher.currentUses}/{voucher.maxUses ?? "∞"}
          </p>
        </div>
        <div className="card">
          <p className="text-xs text-muted-foreground">Expiración</p>
          <p className="text-lg font-semibold mt-1">
            {voucher.expiresAt
              ? new Date(voucher.expiresAt).toLocaleString()
              : "Sin fecha límite"}
          </p>
        </div>
      </div>

      <div className="card space-y-2">
        <h2 className="text-xl font-semibold">Configuración</h2>
        <p className="text-sm text-muted-foreground">
          Curso: {voucher.course?.title || "Todos los cursos"}
        </p>
        <p className="text-sm text-muted-foreground">
          Lote: {voucher.batch?.name || "Sin lote"}
        </p>
        <p className="text-sm text-muted-foreground">
          Descuento:{" "}
          {voucher.type === "DISCOUNT_PERCENT"
            ? `${voucher.discountPercent ?? 0}%`
            : voucher.type === "DISCOUNT_FIXED"
              ? `€ ${(voucher.discountAmount ?? 0).toFixed(2)}`
              : "100%"}
        </p>
        <p className="text-sm text-muted-foreground">
          Pedido mínimo:{" "}
          {voucher.minOrderValue
            ? `€ ${voucher.minOrderValue.toFixed(2)}`
            : "No definido"}
        </p>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Uso por alumno</h2>
        {voucher.redemptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aún no hay usos registrados.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px]">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left">Fecha</th>
                  <th className="px-3 py-2 text-left">Alumno</th>
                  <th className="px-3 py-2 text-left">Email</th>
                  <th className="px-3 py-2 text-left">Purchase ID</th>
                  <th className="px-3 py-2 text-left">Precio original</th>
                  <th className="px-3 py-2 text-left">Descuento</th>
                  <th className="px-3 py-2 text-left">Precio final</th>
                </tr>
              </thead>
              <tbody>
                {voucher.redemptions.map((redemption: any) => {
                  const user = usersMap.get(redemption.userId);
                  return (
                    <tr key={redemption.id} className="border-t border-border">
                      <td className="px-3 py-2 text-sm">
                        {new Date(redemption.redeemedAt).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-sm">
                        {user?.name || "Sin nombre"}
                      </td>
                      <td className="px-3 py-2 text-sm">
                        {user?.email || redemption.userId}
                      </td>
                      <td className="px-3 py-2 text-xs font-mono">
                        {redemption.purchase?.id || "-"}
                      </td>
                      <td className="px-3 py-2 text-sm">
                        {redemption.purchase?.originalPrice !== null &&
                        redemption.purchase?.originalPrice !== undefined
                          ? `€ ${redemption.purchase.originalPrice.toFixed(2)}`
                          : "-"}
                      </td>
                      <td className="px-3 py-2 text-sm">
                        {redemption.purchase?.discountAmount !== null &&
                        redemption.purchase?.discountAmount !== undefined
                          ? `€ ${redemption.purchase.discountAmount.toFixed(2)}`
                          : "-"}
                      </td>
                      <td className="px-3 py-2 text-sm">
                        {redemption.purchase?.finalPrice !== null &&
                        redemption.purchase?.finalPrice !== undefined
                          ? `€ ${redemption.purchase.finalPrice.toFixed(2)}`
                          : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
