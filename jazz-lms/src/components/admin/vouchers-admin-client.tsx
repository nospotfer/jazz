'use client';

import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  getVoucherArtistByDiscount,
  getVoucherArtistByKey,
  VOUCHER_ARTIST_TIERS,
  type VoucherArtistTier,
} from '@/lib/voucher-artists';

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
  metadata: Record<string, unknown> | null;
  course: { id: string; title: string } | null;
  _count: { redemptions: number };
  batch: { id: string; name: string | null; codePrefix: string | null; createdAt: string } | null;
};

type VoucherStats = {
  generated: number;
  total: number;
  available: number;
  active: number;
  used: number;
  expired: number;
};

type Props = {
  courses: CourseOption[];
};

export function VouchersAdminClient({ courses }: Props) {
  const quickArtistTiers = [...VOUCHER_ARTIST_TIERS].sort((a, b) => a.discountPercent - b.discountPercent);
  const initialArtist = getVoucherArtistByDiscount(20);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive' | 'expired'>('all');
  const [usage, setUsage] = useState<'all' | 'used' | 'unused'>('all');
  const [filterArtistKey, setFilterArtistKey] = useState<string>('all');
  const [filterDiscountPercent, setFilterDiscountPercent] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [stats, setStats] = useState<VoucherStats>({
    generated: 0,
    total: 0,
    available: 0,
    active: 0,
    used: 0,
    expired: 0,
  });
  const [lastGeneratedCodes, setLastGeneratedCodes] = useState<string[]>([]);
  const [selectedVoucherIds, setSelectedVoucherIds] = useState<string[]>([]);

  const [form, setForm] = useState({
    type: 'DISCOUNT_PERCENT',
    courseId: '',
    count: '1',
    artistKey: initialArtist?.key || 'BESSIESMITH',
    discountPercent: String(initialArtist?.discountPercent || 20),
    discountAmount: '',
    minOrderValue: '0',
    maxUses: '1',
    maxUsesPerUser: '1',
    expiresInDays: '',
    prefix: 'JAZZ',
    batchName: '',
  });

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    if (status !== 'all') {
      params.set('status', status);
    }
    if (usage !== 'all') {
      params.set('usage', usage);
    }
    if (search.trim()) {
      params.set('search', search.trim());
    }
    if (filterArtistKey !== 'all') {
      params.set('artistKey', filterArtistKey);
    }
    if (filterDiscountPercent !== 'all') {
      params.set('discountPercent', filterDiscountPercent);
    }
    return params.toString();
  }, [filterArtistKey, filterDiscountPercent, search, status, usage]);

  const loadVouchers = useCallback(async () => {
    setIsLoading(true);
    try {
      const query = buildQuery();
      const response = await fetch(`/api/admin/vouchers${query ? `?${query}` : ''}`, {
        method: 'GET',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('No se pudieron cargar los vouchers.');
      }

      const data = await response.json();
      const list: VoucherItem[] = Array.isArray(data.vouchers) ? data.vouchers : [];

      setVouchers(list);
      setSelectedVoucherIds((prev) => prev.filter((id) => list.some((voucher) => voucher.id === id)));
      setStats({
        generated: Number(data.stats?.generated || data.stats?.total || 0),
        total: Number(data.stats?.total || 0),
        available: Number(data.stats?.available || 0),
        active: Number(data.stats?.active || 0),
        used: Number(data.stats?.used || 0),
        expired: Number(data.stats?.expired || 0),
      });
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar vouchers.');
      setVouchers([]);
      setStats({
        generated: 0,
        total: 0,
        available: 0,
        active: 0,
        used: 0,
        expired: 0,
      });
    } finally {
      setIsLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => {
    void loadVouchers();
  }, [loadVouchers]);

  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      const selectedArtist = getVoucherArtistByKey(form.artistKey);
      const payload = {
        type: form.type,
        courseId: form.courseId || null,
        count: Number(form.count || 1),
        artistKey: form.type === 'DISCOUNT_PERCENT' ? form.artistKey : null,
        discountPercent: form.type === 'DISCOUNT_PERCENT' ? Number(form.discountPercent || 0) : null,
        discountAmount: form.type === 'DISCOUNT_FIXED' ? Number(form.discountAmount || 0) : null,
        minOrderValue: Number(form.minOrderValue || 0),
        maxUses: Number(form.maxUses || 1),
        maxUsesPerUser: Number(form.maxUsesPerUser || 1),
        expiresInDays: form.expiresInDays ? Number(form.expiresInDays) : null,
        prefix: form.prefix,
        batchName:
          form.batchName ||
          (form.type === 'DISCOUNT_PERCENT' && selectedArtist ? selectedArtist.name : null),
      };

      const response = await fetch('/api/admin/vouchers/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data?.message || 'No se pudo crear el lote.');
      }

      const createdCodes: string[] = Array.isArray(data.vouchers)
        ? data.vouchers.map((voucher: { code: string }) => voucher.code)
        : [];

      setLastGeneratedCodes(createdCodes);
      toast.success(`Lote creado: ${Number(data.created || 0)} voucher(s).`);
      await loadVouchers();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo crear el lote.';
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuickBatch = async (tier: VoucherArtistTier) => {
    setIsGenerating(true);

    try {
      const response = await fetch('/api/admin/vouchers/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'DISCOUNT_PERCENT',
          courseId: form.courseId || null,
          count: 5,
          artistKey: tier.key,
          discountPercent: tier.discountPercent,
          discountAmount: null,
          minOrderValue: Number(form.minOrderValue || 0),
          maxUses: Number(form.maxUses || 1),
          maxUsesPerUser: Number(form.maxUsesPerUser || 1),
          expiresInDays: form.expiresInDays ? Number(form.expiresInDays) : null,
          prefix: form.prefix,
          batchName: tier.name,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data?.message || 'No se pudo crear el lote rápido.');
      }

      const createdCodes: string[] = Array.isArray(data.vouchers)
        ? data.vouchers.map((voucher: { code: string }) => voucher.code)
        : [];

      setLastGeneratedCodes(createdCodes);
      toast.success(`Atajo ${tier.name} ${tier.discountPercent}%: 5 vouchers creados.`);
      await loadVouchers();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo crear el lote rápido.';
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleVoucher = async (voucher: VoucherItem) => {
    try {
      const response = await fetch(`/api/admin/vouchers/${voucher.id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !voucher.isActive }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data?.message || 'No se pudo cambiar el estado.');
      }

      toast.success(voucher.isActive ? 'Voucher desactivado.' : 'Voucher activado.');
      await loadVouchers();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo cambiar el estado.';
      toast.error(message);
    }
  };

  const toggleVoucherSelection = (voucherId: string) => {
    setSelectedVoucherIds((prev) =>
      prev.includes(voucherId) ? prev.filter((id) => id !== voucherId) : [...prev, voucherId]
    );
  };

  const toggleAllVisible = () => {
    const visibleIds = sortedVouchers.map((voucher) => voucher.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedVoucherIds.includes(id));

    if (allSelected) {
      setSelectedVoucherIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
      return;
    }

    setSelectedVoucherIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  };

  const handleDeleteVoucher = async (voucher: VoucherItem) => {
    const confirmed = window.confirm(`¿Eliminar voucher ${voucher.code}?`);
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/vouchers/${voucher.id}?force=true`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data?.message || 'No se pudo eliminar el voucher.');
      }

      setSelectedVoucherIds((prev) => prev.filter((id) => id !== voucher.id));
      toast.success(data.message || 'Voucher eliminado.');
      await loadVouchers();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo eliminar el voucher.';
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedVoucherIds.length) {
      toast.info('Selecciona al menos un voucher.');
      return;
    }

    const confirmed = window.confirm(`¿Eliminar ${selectedVoucherIds.length} voucher(s) seleccionados?`);
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch('/api/admin/vouchers/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voucherIds: selectedVoucherIds,
          force: true,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data?.message || 'No se pudieron eliminar los vouchers seleccionados.');
      }

      setSelectedVoucherIds([]);
      toast.success(data.message || 'Eliminación completada.');
      await loadVouchers();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudieron eliminar los vouchers seleccionados.';
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteBatch = async (batchId: string, batchName: string | null) => {
    const label = batchName || batchId;
    const confirmed = window.confirm(`¿Eliminar lote ${label}? Se borrarán también vouchers usados.`);
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch('/api/admin/vouchers/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ batchId, force: true }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data?.message || 'No se pudo eliminar el lote.');
      }

      setSelectedVoucherIds([]);
      toast.success(data.message || 'Lote procesado.');
      await loadVouchers();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo eliminar el lote.';
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (status !== 'all') {
        params.set('status', status);
      }
      if (usage !== 'all') {
        params.set('usage', usage);
      }
      if (search.trim()) {
        params.set('search', search.trim());
      }
      if (filterArtistKey !== 'all') {
        params.set('artistKey', filterArtistKey);
      }
      if (filterDiscountPercent !== 'all') {
        params.set('discountPercent', filterDiscountPercent);
      }

      const query = params.toString();
      const response = await fetch(`/api/admin/vouchers/export${query ? `?${query}` : ''}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('No se pudo exportar el CSV.');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vouchers-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('CSV exportado.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo exportar el CSV.';
      toast.error(message);
    } finally {
      setIsExporting(false);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatus('all');
    setUsage('all');
    setFilterArtistKey('all');
    setFilterDiscountPercent('all');
  };

  const copyLastGeneratedCodes = async () => {
    if (!lastGeneratedCodes.length) {
      toast.info('Todavía no hay códigos nuevos para copiar.');
      return;
    }

    try {
      await navigator.clipboard.writeText(lastGeneratedCodes.join('\n'));
      toast.success('Códigos copiados al portapapeles.');
    } catch {
      toast.error('No se pudo copiar al portapapeles.');
    }
  };

  const statusLabel = useMemo(() => {
    return `Generados: ${stats.generated} · Disponibles: ${stats.available} · Usados: ${stats.used} · Expirados: ${stats.expired}`;
  }, [stats]);

  const sortedVouchers = useMemo(() => {
    return [...vouchers].sort((a, b) => {
      const aPercent =
        a.type === 'DISCOUNT_PERCENT' ? (a.discountPercent ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER;
      const bPercent =
        b.type === 'DISCOUNT_PERCENT' ? (b.discountPercent ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER;

      if (aPercent !== bPercent) {
        return aPercent - bPercent;
      }

      return a.code.localeCompare(b.code, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [vouchers]);

  const allVisibleSelected =
    sortedVouchers.length > 0 && sortedVouchers.every((voucher) => selectedVoucherIds.includes(voucher.id));

  return (
    <div className="space-y-8 pb-4">
      <div>
        <h1 className="text-3xl font-bold text-jazz-dark dark:text-white">Vouchers</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Panel simple para crear, activar y probar descuentos en el sandbox.
        </p>
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Información general</h2>
            <p className="text-xs text-muted-foreground mt-1">{statusLabel}</p>
          </div>
          <Button variant="secondary" onClick={clearFilters}>
            Limpiar filtros
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-4">
          <div className="rounded-md border border-border p-4">
            <p className="text-xs text-muted-foreground">Vouchers gerados</p>
            <p className="text-3xl font-bold mt-2">{stats.generated}</p>
          </div>
          <div className="rounded-md border border-border p-4">
            <p className="text-xs text-muted-foreground">Vouchers disponíveis</p>
            <p className="text-3xl font-bold mt-2">{stats.available}</p>
          </div>
          <div className="rounded-md border border-border p-4">
            <p className="text-xs text-muted-foreground">Vouchers usados</p>
            <p className="text-3xl font-bold mt-2">{stats.used}</p>
          </div>
          <div className="rounded-md border border-border p-4">
            <p className="text-xs text-muted-foreground">Vouchers expirados</p>
            <p className="text-3xl font-bold mt-2">{stats.expired}</p>
          </div>
        </div>
      </div>

      <div className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Crear lote de vouchers</h2>
          <p className="text-xs text-muted-foreground">Solo campos esenciales para pruebas rápidas.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Tipo</label>
            <select
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={form.type}
              onChange={(event) =>
                setForm((prev) => {
                  const nextType = event.target.value;
                  const selectedArtist = getVoucherArtistByKey(prev.artistKey);
                  return {
                    ...prev,
                    type: nextType,
                    discountAmount: nextType === 'DISCOUNT_FIXED' ? prev.discountAmount : '',
                    discountPercent:
                      nextType === 'DISCOUNT_PERCENT' && selectedArtist
                        ? String(selectedArtist.discountPercent)
                        : prev.discountPercent,
                  };
                })
              }
            >
              <option value="DISCOUNT_PERCENT">Descuento (%)</option>
              <option value="DISCOUNT_FIXED">Descuento fijo (€)</option>
              <option value="FREE_ACCESS">Acceso gratis</option>
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
            <label className="text-xs text-muted-foreground">Cantidad de códigos</label>
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
              <label className="text-xs text-muted-foreground">Artista</label>
              <select
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={form.artistKey}
                onChange={(event) => {
                  const artist = getVoucherArtistByKey(event.target.value);
                  setForm((prev) => ({
                    ...prev,
                    artistKey: event.target.value,
                    discountPercent: artist ? String(artist.discountPercent) : prev.discountPercent,
                    batchName: artist ? artist.name : prev.batchName,
                  }));
                }}
              >
                {VOUCHER_ARTIST_TIERS.map((artist) => (
                  <option key={artist.key} value={artist.key}>
                    {artist.name} · {artist.discountPercent}%
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {form.type === 'DISCOUNT_PERCENT' ? (
            <div>
              <label className="text-xs text-muted-foreground">Descuento (%)</label>
              <input
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                type="number"
                min={1}
                max={100}
                value={form.discountPercent}
                readOnly
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
            <label className="text-xs text-muted-foreground">Compra mínima (€)</label>
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
            <label className="text-xs text-muted-foreground">Usos por código</label>
            <input
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              type="number"
              min={1}
              value={form.maxUses}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, maxUses: event.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Usos por persona</label>
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
            <label className="text-xs text-muted-foreground">Prefijo (solo tipo no percentual)</label>
            <input
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={form.prefix}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, prefix: event.target.value.toUpperCase() }))}
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Nombre del lote (opcional)</label>
            <input
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={form.batchName}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, batchName: event.target.value }))}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? 'Creando...' : 'Crear lote'}
          </Button>
          <Button variant="secondary" onClick={copyLastGeneratedCodes}>
            Copiar últimos códigos
          </Button>
        </div>

        <div className="rounded-md border border-border p-3">
          <p className="text-xs text-muted-foreground mb-2">
            Atajos rápidos (5 vouchers por clic: 10,20,30,...,100 con nombre de artista)
          </p>
          <div className="flex flex-wrap gap-2">
            {quickArtistTiers.map((tier) => (
              <Button
                key={tier.key}
                size="sm"
                variant="secondary"
                disabled={isGenerating}
                onClick={() => void handleQuickBatch(tier)}
              >
                {tier.discountPercent}% · {tier.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Vouchers configurados</h2>
            <p className="text-xs text-muted-foreground">Listado simple con acciones básicas.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Button
              variant="destructive"
              onClick={handleDeleteSelected}
              disabled={isDeleting || selectedVoucherIds.length === 0}
            >
              Eliminar seleccionados ({selectedVoucherIds.length})
            </Button>
            <Button variant="secondary" onClick={handleExport} disabled={isExporting}>
              {isExporting ? 'Exportando...' : 'Exportar CSV'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
          <input
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            placeholder="Buscar por código"
            value={search}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setSearch(event.target.value)}
          />
          <select
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={status}
            onChange={(event) => setStatus(event.target.value as 'all' | 'active' | 'inactive' | 'expired')}
          >
            <option value="all">Estado: todos</option>
            <option value="active">Estado: activos</option>
            <option value="inactive">Estado: inactivos</option>
            <option value="expired">Estado: expirados</option>
          </select>
          <select
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={usage}
            onChange={(event) => setUsage(event.target.value as 'all' | 'used' | 'unused')}
          >
            <option value="all">Uso: todos</option>
            <option value="used">Uso: usados</option>
            <option value="unused">Uso: no usados</option>
          </select>
          <select
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={filterArtistKey}
            onChange={(event) => {
              const nextArtist = event.target.value;
              const artist = getVoucherArtistByKey(nextArtist);
              setFilterArtistKey(nextArtist);
              setFilterDiscountPercent(artist ? String(artist.discountPercent) : 'all');
            }}
          >
            <option value="all">Artista: todos</option>
            {VOUCHER_ARTIST_TIERS.map((artist) => (
              <option key={artist.key} value={artist.key}>
                {artist.name}
              </option>
            ))}
          </select>
          <select
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={filterDiscountPercent}
            onChange={(event) => {
              const nextValue = event.target.value;
              setFilterDiscountPercent(nextValue);
              if (nextValue === 'all') {
                setFilterArtistKey('all');
                return;
              }

              const artist = getVoucherArtistByDiscount(Number(nextValue));
              setFilterArtistKey(artist ? artist.key : 'all');
            }}
          >
            <option value="all">Descuento: todos</option>
            {quickArtistTiers.map((tier) => (
              <option key={tier.key} value={tier.discountPercent}>
                {tier.discountPercent}%
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <Button onClick={loadVouchers}>Aplicar filtros</Button>
          <Button variant="secondary" onClick={clearFilters}>Restablecer</Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px]">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleAllVisible}
                      className="h-4 w-4"
                    />
                  </th>
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
                {isLoading ? (
                  <tr>
                    <td className="px-3 py-6 text-center text-muted-foreground" colSpan={9}>
                      Cargando vouchers...
                    </td>
                  </tr>
                ) : sortedVouchers.length === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-center text-muted-foreground" colSpan={9}>
                      No hay vouchers creados todavía. Crea el primer lote para empezar.
                    </td>
                  </tr>
                ) : (
                  sortedVouchers.map((voucher) => {
                    const expired = voucher.expiresAt ? new Date(voucher.expiresAt) < new Date() : false;
                    const usageLabel = `${voucher.currentUses}/${voucher.maxUses ?? '∞'}`;

                    return (
                      <tr key={voucher.id} className="border-t border-border">
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={selectedVoucherIds.includes(voucher.id)}
                            onChange={() => toggleVoucherSelection(voucher.id)}
                          />
                        </td>
                        <td className="px-3 py-2 font-mono text-xs">{voucher.code}</td>
                        <td className="px-3 py-2 text-sm">
                          {voucher.type === 'DISCOUNT_PERCENT'
                            ? 'Descuento (%)'
                            : voucher.type === 'DISCOUNT_FIXED'
                              ? 'Descuento fijo (€)'
                              : 'Acceso gratis'}
                        </td>
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
                              variant={voucher.isActive ? 'secondary' : 'default'}
                              disabled={isDeleting}
                              onClick={() => void handleToggleVoucher(voucher)}
                            >
                              {voucher.isActive ? 'Desactivar' : 'Activar'}
                            </Button>
                            {voucher.batch?.id ? (
                              <Button
                                size="sm"
                                variant="secondary"
                                disabled={isDeleting}
                                onClick={() => void handleDeleteBatch(voucher.batch!.id, voucher.batch!.name)}
                              >
                                Eliminar lote
                              </Button>
                            ) : null}
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={isDeleting}
                              onClick={() => void handleDeleteVoucher(voucher)}
                            >
                              Eliminar
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
    </div>
  );
}
