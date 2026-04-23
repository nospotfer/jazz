/**
 * Agregacoes Prisma para o Painel de Metricas (Admin).
 *
 * Todas as funcoes sao server-only, puras em relacao ao request e
 * retornam shapes tipados prontos para as rotas /api/admin/metrics/*.
 *
 * Regras:
 * - Periodo P = intervalo em UTC comecando 00:00 do dia inicial.
 * - Periodo P-1 = mesmo tamanho de P, imediatamente anterior.
 * - Matricula paga = Purchase com finalPrice > 0.
 * - Ticket medio ignora matriculas gratuitas (voucher 100%).
 */

import { unstable_cache } from 'next/cache';
import { db } from '@/lib/db';

// Admin metrics cache: 5 minutes, keyed by range. Matches the footer
// promise shown on the Panel de Métricas ("actualizados cada 5 minutos").
const METRICS_CACHE_TTL_SECONDS = 300;
const METRICS_CACHE_TAG = 'admin-metrics';

function buildCacheKey(prefix: string, range: Range): string[] {
  return [
    prefix,
    range.key,
    range.from.toISOString(),
    range.to.toISOString(),
  ];
}

export type RangeKey = '7d' | '30d' | '60d' | '90d' | '12m';
export type Granularity = 'day' | 'week' | 'month';

export type Range = {
  key: RangeKey;
  from: Date;
  to: Date;
  previousFrom: Date;
  previousTo: Date;
  granularity: Granularity;
};

const VALID_RANGES: RangeKey[] = ['7d', '30d', '60d', '90d', '12m'];

export function isRangeKey(value: unknown): value is RangeKey {
  return typeof value === 'string' && (VALID_RANGES as string[]).includes(value);
}

/**
 * Resolve a RangeKey para um intervalo concreto em UTC.
 * Exportado para permitir testes determinísticos via `now` injetavel.
 */
export function resolveRange(key: RangeKey, now: Date = new Date()): Range {
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  // +1 dia para incluir o dia corrente inteiro.
  to.setUTCDate(to.getUTCDate() + 1);

  const from = new Date(to);
  let granularity: Granularity = 'day';

  switch (key) {
    case '7d':
      from.setUTCDate(from.getUTCDate() - 7);
      granularity = 'day';
      break;
    case '30d':
      from.setUTCDate(from.getUTCDate() - 30);
      granularity = 'day';
      break;
    case '60d':
      from.setUTCDate(from.getUTCDate() - 60);
      granularity = 'day';
      break;
    case '90d':
      from.setUTCDate(from.getUTCDate() - 90);
      granularity = 'week';
      break;
    case '12m':
      from.setUTCMonth(from.getUTCMonth() - 12);
      granularity = 'month';
      break;
  }

  const diffMs = to.getTime() - from.getTime();
  const previousTo = new Date(from);
  const previousFrom = new Date(from.getTime() - diffMs);

  return { key, from, to, previousFrom, previousTo, granularity };
}

/**
 * Calcula delta percentual (0..1) entre atual e anterior.
 * - null quando o periodo anterior nao existe ou tem zero (usuario interpreta como "Novo").
 */
export function computeDelta(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null;
  if (previous === 0) return null;
  return (current - previous) / previous;
}

type TimeseriesBucket = { bucket: string; value: number };

/**
 * Bucketiza uma lista de eventos (com campo Date) pela granularidade desejada.
 * Usado internamente e exportado para testes.
 */
export function bucketize<T>(
  items: T[],
  getDate: (item: T) => Date,
  getValue: (item: T) => number,
  range: Range
): TimeseriesBucket[] {
  const buckets = new Map<string, number>();

  const addBucket = (key: string, value: number) => {
    buckets.set(key, (buckets.get(key) ?? 0) + value);
  };

  const bucketKey = (date: Date): string => {
    if (range.granularity === 'day') {
      return date.toISOString().slice(0, 10); // YYYY-MM-DD
    }
    if (range.granularity === 'week') {
      const startOfWeek = new Date(date);
      const day = startOfWeek.getUTCDay();
      startOfWeek.setUTCDate(startOfWeek.getUTCDate() - day);
      return startOfWeek.toISOString().slice(0, 10);
    }
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
  };

  // Semeia todos os buckets do intervalo para evitar "buracos" no grafico.
  const cursor = new Date(range.from);
  while (cursor < range.to) {
    addBucket(bucketKey(cursor), 0);
    if (range.granularity === 'day') cursor.setUTCDate(cursor.getUTCDate() + 1);
    else if (range.granularity === 'week') cursor.setUTCDate(cursor.getUTCDate() + 7);
    else cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  for (const item of items) {
    addBucket(bucketKey(getDate(item)), getValue(item));
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([bucket, value]) => ({ bucket, value }));
}

// -------------------------------------------------------------
// Agregacoes — Receita / Matriculas
// -------------------------------------------------------------

async function sumRevenueBetween(from: Date, to: Date): Promise<number> {
  const result = await db.purchase.aggregate({
    where: { createdAt: { gte: from, lt: to } },
    _sum: { finalPrice: true },
  });
  return result._sum.finalPrice ?? 0;
}

async function countPurchasesBetween(from: Date, to: Date): Promise<number> {
  return db.purchase.count({ where: { createdAt: { gte: from, lt: to } } });
}

async function countPaidPurchasesBetween(from: Date, to: Date): Promise<number> {
  return db.purchase.count({
    where: { createdAt: { gte: from, lt: to }, finalPrice: { gt: 0 } },
  });
}

async function sumPaidRevenueBetween(from: Date, to: Date): Promise<number> {
  const result = await db.purchase.aggregate({
    where: { createdAt: { gte: from, lt: to }, finalPrice: { gt: 0 } },
    _sum: { finalPrice: true },
  });
  return result._sum.finalPrice ?? 0;
}

async function countNewUsersBetween(from: Date, to: Date): Promise<number> {
  return db.user.count({ where: { createdAt: { gte: from, lt: to } } });
}

async function countVouchersRedeemedBetween(from: Date, to: Date): Promise<number> {
  return db.voucherRedemption.count({ where: { redeemedAt: { gte: from, lt: to } } });
}

async function countMedalsEarnedBetween(from: Date, to: Date): Promise<number> {
  return db.lessonQuizSummary.count({
    where: {
      bestMedal: { not: 'NONE' },
      lastAttemptAt: { gte: from, lt: to },
    },
  });
}

async function completionCountsBetween(from: Date, to: Date): Promise<{
  started: number;
  completed: number;
}> {
  const [started, completed] = await Promise.all([
    db.userProgress.count({ where: { createdAt: { gte: from, lt: to } } }),
    db.userProgress.count({
      where: {
        isCompleted: true,
        updatedAt: { gte: from, lt: to },
      },
    }),
  ]);
  return { started, completed };
}

// -------------------------------------------------------------
// API publica do helper
// -------------------------------------------------------------

export type OverviewMetrics = {
  revenue: { value: number; delta: number | null };
  enrollments: { value: number; delta: number | null };
  averageTicket: { value: number; delta: number | null };
  newStudents: { value: number; delta: number | null };
  completionRate: { value: number; delta: number | null };
  vouchersRedeemed: { value: number; delta: number | null };
  medalsEarned: { value: number; delta: number | null };
};

export async function getOverview(range: Range): Promise<OverviewMetrics> {
  const cached = unstable_cache(
    () => getOverviewUncached(range),
    buildCacheKey('admin-metrics:overview', range),
    { revalidate: METRICS_CACHE_TTL_SECONDS, tags: [METRICS_CACHE_TAG] },
  );
  return cached();
}

async function getOverviewUncached(range: Range): Promise<OverviewMetrics> {
  const [
    revenueCurrent,
    revenuePrev,
    enrollmentsCurrent,
    enrollmentsPrev,
    paidRevenueCurrent,
    paidCountCurrent,
    paidRevenuePrev,
    paidCountPrev,
    newStudentsCurrent,
    newStudentsPrev,
    completionCurrent,
    completionPrev,
    vouchersCurrent,
    vouchersPrev,
    medalsCurrent,
    medalsPrev,
  ] = await Promise.all([
    sumRevenueBetween(range.from, range.to),
    sumRevenueBetween(range.previousFrom, range.previousTo),
    countPurchasesBetween(range.from, range.to),
    countPurchasesBetween(range.previousFrom, range.previousTo),
    sumPaidRevenueBetween(range.from, range.to),
    countPaidPurchasesBetween(range.from, range.to),
    sumPaidRevenueBetween(range.previousFrom, range.previousTo),
    countPaidPurchasesBetween(range.previousFrom, range.previousTo),
    countNewUsersBetween(range.from, range.to),
    countNewUsersBetween(range.previousFrom, range.previousTo),
    completionCountsBetween(range.from, range.to),
    completionCountsBetween(range.previousFrom, range.previousTo),
    countVouchersRedeemedBetween(range.from, range.to),
    countVouchersRedeemedBetween(range.previousFrom, range.previousTo),
    countMedalsEarnedBetween(range.from, range.to),
    countMedalsEarnedBetween(range.previousFrom, range.previousTo),
  ]);

  const ticketCurrent = paidCountCurrent > 0 ? paidRevenueCurrent / paidCountCurrent : 0;
  const ticketPrev = paidCountPrev > 0 ? paidRevenuePrev / paidCountPrev : 0;

  const completionCurrentRate =
    completionCurrent.started > 0 ? completionCurrent.completed / completionCurrent.started : 0;
  const completionPrevRate =
    completionPrev.started > 0 ? completionPrev.completed / completionPrev.started : 0;

  return {
    revenue: {
      value: revenueCurrent,
      delta: computeDelta(revenueCurrent, revenuePrev),
    },
    enrollments: {
      value: enrollmentsCurrent,
      delta: computeDelta(enrollmentsCurrent, enrollmentsPrev),
    },
    averageTicket: {
      value: ticketCurrent,
      delta: computeDelta(ticketCurrent, ticketPrev),
    },
    newStudents: {
      value: newStudentsCurrent,
      delta: computeDelta(newStudentsCurrent, newStudentsPrev),
    },
    completionRate: {
      value: completionCurrentRate,
      delta: computeDelta(completionCurrentRate, completionPrevRate),
    },
    vouchersRedeemed: {
      value: vouchersCurrent,
      delta: computeDelta(vouchersCurrent, vouchersPrev),
    },
    medalsEarned: {
      value: medalsCurrent,
      delta: computeDelta(medalsCurrent, medalsPrev),
    },
  };
}

export async function getRevenueTimeseries(range: Range): Promise<TimeseriesBucket[]> {
  const cached = unstable_cache(
    () => getRevenueTimeseriesUncached(range),
    buildCacheKey('admin-metrics:revenue', range),
    { revalidate: METRICS_CACHE_TTL_SECONDS, tags: [METRICS_CACHE_TAG] },
  );
  return cached();
}

async function getRevenueTimeseriesUncached(range: Range): Promise<TimeseriesBucket[]> {
  const rows = await db.purchase.findMany({
    where: { createdAt: { gte: range.from, lt: range.to } },
    select: { createdAt: true, finalPrice: true },
  });
  return bucketize(
    rows,
    (r) => r.createdAt,
    (r) => r.finalPrice ?? 0,
    range
  );
}

export type EnrollmentBucket = { bucket: string; paid: number; voucher: number; total: number };

export async function getEnrollmentsTimeseries(range: Range): Promise<EnrollmentBucket[]> {
  const cached = unstable_cache(
    () => getEnrollmentsTimeseriesUncached(range),
    buildCacheKey('admin-metrics:enrollments', range),
    { revalidate: METRICS_CACHE_TTL_SECONDS, tags: [METRICS_CACHE_TAG] },
  );
  return cached();
}

async function getEnrollmentsTimeseriesUncached(range: Range): Promise<EnrollmentBucket[]> {
  const rows = await db.purchase.findMany({
    where: { createdAt: { gte: range.from, lt: range.to } },
    select: { createdAt: true, finalPrice: true, voucherId: true },
  });

  const paidBuckets = bucketize(
    rows.filter((r) => (r.finalPrice ?? 0) > 0),
    (r) => r.createdAt,
    () => 1,
    range
  );
  const voucherBuckets = bucketize(
    rows.filter((r) => r.voucherId != null && (r.finalPrice ?? 0) === 0),
    (r) => r.createdAt,
    () => 1,
    range
  );

  const byKey = new Map<string, EnrollmentBucket>();
  for (const b of paidBuckets) byKey.set(b.bucket, { bucket: b.bucket, paid: b.value, voucher: 0, total: b.value });
  for (const b of voucherBuckets) {
    const existing = byKey.get(b.bucket);
    if (existing) {
      existing.voucher = b.value;
      existing.total = existing.paid + b.value;
    } else {
      byKey.set(b.bucket, { bucket: b.bucket, paid: 0, voucher: b.value, total: b.value });
    }
  }
  return Array.from(byKey.values()).sort((a, b) => (a.bucket < b.bucket ? -1 : 1));
}

export type CompletionByCourse = {
  courseId: string;
  courseTitle: string;
  startedCount: number;
  completedCount: number;
  completionRate: number;
};

export async function getCompletionByCourse(range: Range): Promise<CompletionByCourse[]> {
  const cached = unstable_cache(
    () => getCompletionByCourseUncached(range),
    buildCacheKey('admin-metrics:completion', range),
    { revalidate: METRICS_CACHE_TTL_SECONDS, tags: [METRICS_CACHE_TAG] },
  );
  return cached();
}

async function getCompletionByCourseUncached(range: Range): Promise<CompletionByCourse[]> {
  // Busca progresso no periodo e junta via aula->capitulo->curso.
  const rows = await db.userProgress.findMany({
    where: {
      OR: [
        { createdAt: { gte: range.from, lt: range.to } },
        { isCompleted: true, updatedAt: { gte: range.from, lt: range.to } },
      ],
    },
    select: {
      isCompleted: true,
      createdAt: true,
      updatedAt: true,
      lesson: {
        select: {
          chapter: {
            select: {
              course: { select: { id: true, title: true } },
            },
          },
        },
      },
    },
  });

  const map = new Map<string, CompletionByCourse>();
  for (const row of rows) {
    const course = row.lesson?.chapter?.course;
    if (!course) continue;
    const entry =
      map.get(course.id) ??
      ({
        courseId: course.id,
        courseTitle: course.title,
        startedCount: 0,
        completedCount: 0,
        completionRate: 0,
      } satisfies CompletionByCourse);

    if (row.createdAt >= range.from && row.createdAt < range.to) {
      entry.startedCount += 1;
    }
    if (row.isCompleted && row.updatedAt >= range.from && row.updatedAt < range.to) {
      entry.completedCount += 1;
    }
    map.set(course.id, entry);
  }

  const list = Array.from(map.values()).map((e) => ({
    ...e,
    completionRate: e.startedCount > 0 ? e.completedCount / e.startedCount : 0,
  }));
  return list.sort((a, b) => b.startedCount - a.startedCount).slice(0, 10);
}
