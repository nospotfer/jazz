import { randomUUID } from 'node:crypto';
import { Prisma, PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

const target = process.env.MAINTENANCE_DATABASE_URL;
const prefix = `maintenance-currency-schema-${randomUUID()}`;
const courseId = `${prefix}-course`, userId = `${prefix}-user`;
const purchaseIds = ['JPY', 'KWD', 'EUR', 'large', 'legacy', 'unknown'].map((suffix) => `${prefix}-${suffix}`);
let client: PrismaClient;

test('generated Purchase client represents exact payment facts as nullable strings without defaults', () => {
  const model = Prisma.dmmf.datamodel.models.find((item) => item.name === 'Purchase');
  expect(model).toBeDefined();
  for (const name of ['paymentCurrency', 'paymentAmountMinor']) {
    expect(model!.fields.find((field) => field.name === name)).toMatchObject({
      name, kind: 'scalar', type: 'String', isRequired: false, isList: false, hasDefaultValue: false,
    });
  }
});

describe.skipIf(!target)('exact payment currency schema on disposable PostgreSQL', () => {
  beforeAll(async () => {
    const url = new URL(target!);
    if (!['postgres:', 'postgresql:'].includes(url.protocol) || url.hostname !== '127.0.0.1' ||
        url.port !== '55432' || url.pathname !== '/jazz_maintenance' || url.username !== 'postgres' ||
        url.password || url.search || url.hash) {
      throw new Error('Currency schema tests require disposable 127.0.0.1:55432/jazz_maintenance');
    }
    client = new PrismaClient({ datasources: { db: { url: target! } }, log: [] });
    await client.course.create({ data: { id: courseId, title: 'Isolated exact payment currency schema', price: 80, isPublished: true } });
  });

  afterAll(async () => {
    if (!client) return;
    try {
      await client.$transaction(async (tx) => {
        await tx.purchase.deleteMany({ where: { id: { in: purchaseIds }, courseId } });
        await tx.course.deleteMany({ where: { id: courseId } });
      });
    } finally { await client.$disconnect(); }
  });

  test('both database columns are nullable TEXT without an invented default', async () => {
    const columns = await client.$queryRaw<Array<{ column_name: string; data_type: string; is_nullable: string; column_default: string | null }>>`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'Purchase'
        AND column_name IN ('paymentCurrency', 'paymentAmountMinor') ORDER BY column_name
    `;
    expect(columns).toEqual([
      { column_name: 'paymentAmountMinor', data_type: 'text', is_nullable: 'YES', column_default: null },
      { column_name: 'paymentCurrency', data_type: 'text', is_nullable: 'YES', column_default: null },
    ]);
  });

  test('JPY, three-decimal KWD and genuine zero roundtrip without float conversion or BigInt JSON', async () => {
    for (const [currency, minor, oldFloat] of [['JPY', '2990', 29.9], ['KWD', '1234', 1.23], ['EUR', '0', 0]] as const) {
      const id = `${prefix}-${currency}`;
      await client.purchase.create({ data: {
        id, userId: `${userId}-${currency}`, courseId, providerReferenceId: `${prefix}-payment-${currency}`,
        paymentCurrency: currency, paymentAmountMinor: minor, finalPrice: oldFloat,
      } });
      const purchase = await client.purchase.findUniqueOrThrow({ where: { id } });
      const encoded = JSON.parse(JSON.stringify(purchase));
      expect(encoded).toMatchObject({ paymentCurrency: currency, paymentAmountMinor: minor, finalPrice: oldFloat });
      // These legacy floats can be wrong for the observed currency. Persistence
      // must not mutate them or use them to reconstruct the exact minor text.
      expect(typeof purchase.paymentAmountMinor).toBe('string');
    }
  });

  test('a 64-digit canonical minor amount remains exact through Prisma and JSON', async () => {
    const minor = '9'.repeat(64), id = `${prefix}-large`;
    await client.purchase.create({ data: { id, userId: `${userId}-large`, courseId, paymentCurrency: 'USD', paymentAmountMinor: minor } });
    const purchase = await client.purchase.findUniqueOrThrow({ where: { id } });
    expect(JSON.parse(JSON.stringify(purchase))).toMatchObject({ paymentCurrency: 'USD', paymentAmountMinor: minor });
    expect(purchase.paymentAmountMinor).toHaveLength(64);
  });

  test('omitted exact facts remain NULL beside known legacy money without inference or default backfill', async () => {
    const id = `${prefix}-legacy`;
    await client.purchase.create({ data: {
      id, userId: `${userId}-legacy`, courseId, providerReferenceId: `${prefix}-legacy-reference`,
      originalPrice: 80, discountAmount: 0, finalPrice: 80,
    } });
    const purchase = await client.purchase.findUniqueOrThrow({ where: { id } });
    expect(purchase).toMatchObject({ paymentCurrency: null, paymentAmountMinor: null, originalPrice: 80, discountAmount: 0, finalPrice: 80 });
  });

  test('an observed raw amount can remain independent when its currency is unknown', async () => {
    const id = `${prefix}-unknown`;
    await client.purchase.create({ data: { id, userId: `${userId}-unknown`, courseId, paymentAmountMinor: '2990' } });
    const purchase = await client.purchase.findUniqueOrThrow({ where: { id } });
    expect(purchase).toMatchObject({ paymentCurrency: null, paymentAmountMinor: '2990', finalPrice: null });
  });
});
