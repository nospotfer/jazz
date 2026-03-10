'use client';

import { ChangeEvent, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

type CourseOption = {
  id: string;
  title: string;
  isPublished: boolean;
};

type VoucherItem = {
  id: string;
  code: string;
  type: 'FREE_ACCESS' | 'DISCOUNT_PERCENT' | 'DISCOUNT_FIXED';
  discountPercent: number | null;
  discountAmount: number | null;
  minOrderValue: number | null;
  maxUses: number | null;
  currentUses: number;
  maxUsesPerUser: number;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  course: { id: string; title: string } | null;
  _count: { redemptions: number };
  periodTag: 'este_mes' | 'ultimo_mes' | 'este_trimestre';
  batchName: string;
};

type Props = {
  courses: CourseOption[];
};

export function VouchersAdminClient({ courses }: Props) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive' | 'expired'>('all');
  const [period, setPeriod] = useState<'all' | 'este_mes' | 'ultimo_mes' | 'este_trimestre'>('all');
  const [selectedVoucherId, setSelectedVoucherId] = useState<string | null>(null);

  const [form, setForm] = useState({
    type: 'DISCOUNT_PERCENT',
    courseId: '',
    count: '20',
    discountPercent: '10',
    discountAmount: '',
    minOrderValue: '',
    maxUses: '1',
    maxUsesPerUser: '1',
    expiresInDays: '',
    prefix: 'EVENTO',
    batchName: 'Campaña Primavera',
  });

  const placeholderVouchers = useMemo<VoucherItem[]>(() => {
    const primaryCourse = courses[0] ?? null;
    const secondaryCourse = courses[1] ?? primaryCourse ?? null;

    return [
      {
        id: 'placeholder-1',
        code: 'EVENTO-ABRIL-001',
        type: 'DISCOUNT_PERCENT',
        discountPercent: 20,
        discountAmount: null,
        minOrderValue: 30,
        maxUses: 1,
        currentUses: 0,
        maxUsesPerUser: 1,
        isActive: true,
        expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        course: primaryCourse ? { id: primaryCourse.id, title: primaryCourse.title } : null,
        _count: { redemptions: 0 },
        periodTag: 'este_mes',
        batchName: 'Campaña Primavera',
      },
      {
        id: 'placeholder-2',
        code: 'EVENTO-ABRIL-002',
        type: 'FREE_ACCESS',
        discountPercent: null,
        discountAmount: null,
        minOrderValue: null,
        maxUses: 1,
        currentUses: 1,
        maxUsesPerUser: 1,
        isActive: true,
        expiresAt: null,
        createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
        course: secondaryCourse ? { id: secondaryCourse.id, title: secondaryCourse.title } : null,
        _count: { redemptions: 1 },
        periodTag: 'este_mes',
        batchName: 'Campaña Primavera',
      },
      {
        id: 'placeholder-3',
        code: 'VIP-MARZO-010',
        type: 'DISCOUNT_FIXED',
        discountPercent: null,
        discountAmount: 15,
        minOrderValue: 60,
        maxUses: 3,
        currentUses: 2,
        maxUsesPerUser: 1,
        isActive: true,
        expiresAt: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        course: null,
        _count: { redemptions: 2 },
        periodTag: 'ultimo_mes',
        batchName: 'Acción VIP',
      },
      {
        id: 'placeholder-4',
        code: 'INACTIVO-001',
        type: 'DISCOUNT_PERCENT',
        discountPercent: 10,
        discountAmount: null,
        minOrderValue: null,
        maxUses: 20,
        currentUses: 0,
        maxUsesPerUser: 1,
        isActive: false,
        expiresAt: null,
        createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
        course: primaryCourse ? { id: primaryCourse.id, title: primaryCourse.title } : null,
        _count: { redemptions: 0 },
        periodTag: 'este_trimestre',
        batchName: 'Pruebas Internas',
      },
      {
        id: 'placeholder-5',
        code: 'EXP-ENERO-005',
        type: 'DISCOUNT_PERCENT',
        discountPercent: 25,
        discountAmount: null,
        minOrderValue: 20,
        maxUses: 10,
        currentUses: 4,
        maxUsesPerUser: 1,
        isActive: true,
        expiresAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000).toISOString(),
        course: null,
        _count: { redemptions: 4 },
        periodTag: 'este_trimestre',
        batchName: 'Campaña Q1',
      },
    ];
  }, [courses]);

  const vouchers = useMemo(() => {
    return placeholderVouchers.filter((voucher) => {
      const matchesSearch =
        search.trim().length === 0 || voucher.code.toLowerCase().includes(search.toLowerCase());

      const expired = voucher.expiresAt ? new Date(voucher.expiresAt) < new Date() : false;
      const matchesStatus =
        status === 'all'
          ? true
          : status === 'active'
            ? voucher.isActive && !expired
            : status === 'inactive'
              ? !voucher.isActive
              : expired;

      const matchesPeriod = period === 'all' ? true : voucher.periodTag === period;

      return matchesSearch && matchesStatus && matchesPeriod;
    });
  }, [placeholderVouchers, search, status, period]);

  const stats = useMemo(() => {
    const active = placeholderVouchers.filter((voucher) => voucher.isActive).length;
    const used = placeholderVouchers.filter((voucher) => voucher.currentUses > 0).length;
    const expired = placeholderVouchers.filter(
      (voucher) => voucher.expiresAt && new Date(voucher.expiresAt) < new Date()
    ).length;

    return {
      total: placeholderVouchers.length,
      active,
      used,
      expired,
    };
  }, [placeholderVouchers]);

  const selectedVoucher = useMemo(
    () => placeholderVouchers.find((voucher) => voucher.id === selectedVoucherId) ?? null,
    [placeholderVouchers, selectedVoucherId]
  );

  const handleGenerate = () => {
    toast.info('Placeholder listo: la generación real de vouchers se conectará en la siguiente fase.');
  };

  const triggerPlaceholderAction = (actionName: string) => {
    toast.info(`Acción de placeholder: ${actionName}.`);
  };

  const statusLabel = useMemo(() => {
    return `Total: ${stats.total} · Activos: ${stats.active} · Usados: ${stats.used} · Expirados: ${stats.expired}`;
  }, [stats]);

  return (
    <div className="space-y-8 pb-4">
      <div>
        <h1 className="text-3xl font-bold text-jazz-dark dark:text-white">Vouchers</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Interfaz de administración lista para integrar generación, activación y canje de vouchers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="card border-t-green-500">
          <p className="text-xs text-muted-foreground">Total de vouchers</p>
          <p className="text-3xl font-bold mt-2">{stats.total}</p>
        </div>
        <div className="card border-t-blue-500">
          <p className="text-xs text-muted-foreground">Vouchers activos</p>
          <p className="text-3xl font-bold mt-2">{stats.active}</p>
        </div>
        <div className="card border-t-purple-500">
          <p className="text-xs text-muted-foreground">Vouchers usados</p>
          <p className="text-3xl font-bold mt-2">{stats.used}</p>
        </div>
        <div className="card border-t-yellow-500">
          <p className="text-xs text-muted-foreground">Vouchers expirados</p>
          <p className="text-3xl font-bold mt-2">{stats.expired}</p>
        </div>
      </div>

      <div className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Crear lote de vouchers</h2>
          <p className="text-xs text-muted-foreground">Formulario visual listo (modo placeholder)</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Tipo de voucher</label>
            <select
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={form.type}
              onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
            >
              <option value="FREE_ACCESS">FREE_ACCESS</option>
              <option value="DISCOUNT_PERCENT">DISCOUNT_PERCENT</option>
              <option value="DISCOUNT_FIXED">DISCOUNT_FIXED</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Curso (opcional)</label>
            <select
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={form.courseId}
              onChange={(event) => setForm((prev) => ({ ...prev, courseId: event.target.value }))}
            >
              <option value="">Todos los cursos</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Cantidad</label>
            <input
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              type="number"
              min={1}
              max={500}
              value={form.count}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, count: event.target.value }))}
            />
          </div>

          {form.type === 'DISCOUNT_PERCENT' ? (
            <div>
              <label className="text-xs text-muted-foreground">Descuento (%)</label>
              <input
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                type="number"
                min={1}
                max={100}
                value={form.discountPercent}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setForm((prev) => ({ ...prev, discountPercent: event.target.value }))
                }
              />
            </div>
          ) : null}

          {form.type === 'DISCOUNT_FIXED' ? (
            <div>
              <label className="text-xs text-muted-foreground">Descuento fijo (€)</label>
              <input
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                type="number"
                min={0.01}
                step={0.01}
                value={form.discountAmount}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setForm((prev) => ({ ...prev, discountAmount: event.target.value }))
                }
              />
            </div>
          ) : null}

          <div>
            <label className="text-xs text-muted-foreground">Pedido mínimo (€)</label>
            <input
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              type="number"
              min={0}
              step={0.01}
              value={form.minOrderValue}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, minOrderValue: event.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Límite total</label>
            <input
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              type="number"
              min={1}
              value={form.maxUses}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, maxUses: event.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Límite por usuario</label>
            <input
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              type="number"
              min={1}
              value={form.maxUsesPerUser}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setForm((prev) => ({ ...prev, maxUsesPerUser: event.target.value }))
              }
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Expira en (días)</label>
            <input
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              type="number"
              min={1}
              value={form.expiresInDays}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, expiresInDays: event.target.value }))}
              placeholder="Sin fecha límite"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Prefijo</label>
            <input
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={form.prefix}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, prefix: event.target.value.toUpperCase() }))}
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Nombre del lote</label>
            <input
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={form.batchName}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, batchName: event.target.value }))}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleGenerate}>
            Crear lote (placeholder)
          </Button>
          <Button variant="secondary" onClick={() => triggerPlaceholderAction('Exportar CSV')}>
            Exportar CSV (placeholder)
          </Button>
          <Button variant="secondary" onClick={() => triggerPlaceholderAction('Copiar códigos del lote')}>
            Copiar códigos (placeholder)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
        <div className="card space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Vouchers configurados</h2>
              <p className="text-xs text-muted-foreground">{statusLabel}</p>
            </div>
            <div className="flex gap-2">
              <input
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                placeholder="Buscar por código"
                value={search}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setSearch(event.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button variant={status === 'all' ? 'default' : 'secondary'} onClick={() => setStatus('all')}>Todos</Button>
            <Button variant={status === 'active' ? 'default' : 'secondary'} onClick={() => setStatus('active')}>Activos</Button>
            <Button variant={status === 'inactive' ? 'default' : 'secondary'} onClick={() => setStatus('inactive')}>Inactivos</Button>
            <Button variant={status === 'expired' ? 'default' : 'secondary'} onClick={() => setStatus('expired')}>Expirados</Button>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button variant={period === 'all' ? 'default' : 'secondary'} onClick={() => setPeriod('all')}>Periodo: todos</Button>
            <Button variant={period === 'este_mes' ? 'default' : 'secondary'} onClick={() => setPeriod('este_mes')}>Este mes</Button>
            <Button variant={period === 'ultimo_mes' ? 'default' : 'secondary'} onClick={() => setPeriod('ultimo_mes')}>Último mes</Button>
            <Button variant={period === 'este_trimestre' ? 'default' : 'secondary'} onClick={() => setPeriod('este_trimestre')}>Este trimestre</Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left">Código</th>
                  <th className="px-3 py-2 text-left">Tipo</th>
                  <th className="px-3 py-2 text-left">Curso</th>
                  <th className="px-3 py-2 text-left">Descuento</th>
                  <th className="px-3 py-2 text-left">Uso</th>
                  <th className="px-3 py-2 text-left">Expiración</th>
                  <th className="px-3 py-2 text-left">Estado</th>
                  <th className="px-3 py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {vouchers.length === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-center text-muted-foreground" colSpan={8}>
                      No hay vouchers para los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  vouchers.map((voucher) => {
                    const expired = voucher.expiresAt ? new Date(voucher.expiresAt) < new Date() : false;
                    const usageLabel = `${voucher.currentUses}/${voucher.maxUses ?? '∞'}`;

                    return (
                      <tr key={voucher.id} className="border-t border-border">
                        <td className="px-3 py-2 font-mono text-xs">{voucher.code}</td>
                        <td className="px-3 py-2 text-sm">{voucher.type}</td>
                        <td className="px-3 py-2 text-sm">{voucher.course?.title || 'Todos'}</td>
                        <td className="px-3 py-2 text-sm">
                          {voucher.type === 'DISCOUNT_PERCENT'
                            ? `${voucher.discountPercent ?? 0}%`
                            : voucher.type === 'DISCOUNT_FIXED'
                              ? `€ ${(voucher.discountAmount ?? 0).toFixed(2)}`
                              : '100%'}
                        </td>
                        <td className="px-3 py-2 text-sm">{usageLabel}</td>
                        <td className="px-3 py-2 text-sm">
                          {voucher.expiresAt ? new Date(voucher.expiresAt).toLocaleDateString('es-ES') : 'Sin fecha límite'}
                        </td>
                        <td className="px-3 py-2 text-sm">
                          {!voucher.isActive ? 'Inactivo' : expired ? 'Expirado' : 'Activo'}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setSelectedVoucherId(voucher.id)}
                            >
                              Ver detalle
                            </Button>
                            <Button
                              size="sm"
                              variant={voucher.isActive ? 'secondary' : 'default'}
                              onClick={() => triggerPlaceholderAction('Cambiar estado de voucher')}
                            >
                              {voucher.isActive ? 'Desactivar' : 'Activar'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold">Detalle lateral</h3>
            {selectedVoucher ? (
              <Button size="sm" variant="secondary" onClick={() => setSelectedVoucherId(null)}>
                Cerrar
              </Button>
            ) : null}
          </div>

          {selectedVoucher ? (
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Código</p>
                <p className="font-mono mt-1">{selectedVoucher.code}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Lote</p>
                <p className="mt-1">{selectedVoucher.batchName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Curso</p>
                <p className="mt-1">{selectedVoucher.course?.title ?? 'Todos los cursos'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Uso</p>
                <p className="mt-1">{selectedVoucher.currentUses}/{selectedVoucher.maxUses ?? '∞'} · Por usuario: {selectedVoucher.maxUsesPerUser}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Creado</p>
                <p className="mt-1">{new Date(selectedVoucher.createdAt).toLocaleDateString('es-ES')}</p>
              </div>
              <div className="pt-2 space-y-2">
                <Button className="w-full" onClick={() => triggerPlaceholderAction('Duplicar voucher')}>
                  Duplicar voucher (placeholder)
                </Button>
                <Button className="w-full" variant="secondary" onClick={() => triggerPlaceholderAction('Ver historial de canjes')}>
                  Historial de canjes (placeholder)
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
              Selecciona un voucher para ver su detalle lateral. Este bloque está preparado para conectarse al detalle real o modal en la siguiente fase.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
