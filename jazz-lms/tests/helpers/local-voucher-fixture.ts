import { readFileSync } from 'node:fs';
import { randomBytes, randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

export function loadLocalVoucherServices(configPath: string) {
  const values = Object.fromEntries(readFileSync(configPath, 'utf8').split(/\r?\n/)
    .filter((line) => line.includes('='))
    .map((line) => {
      const split = line.indexOf('=');
      return [line.slice(0, split), JSON.parse(line.slice(split + 1)) as string];
    }));
  const auth = new URL(values.API_URL);
  const database = new URL(values.DB_URL);
  if (auth.origin !== 'http://127.0.0.1:56121' || database.hostname !== '127.0.0.1' ||
    database.port !== '56122' || database.pathname !== '/postgres') {
    throw new Error('Voucher fixtures require the dedicated disposable loopback Supabase stack.');
  }
  const db = new PrismaClient({ datasources: { db: { url: values.DB_URL } } });
  const authAdmin = createClient(values.API_URL, values.SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return { db, authAdmin };
}

export async function createLocalVoucherFixture(configPath: string) {
  const services = loadLocalVoucherServices(configPath);
  const nonce = randomUUID();
  const email = `maintenance-voucher-ui-${nonce}@example.test`;
  const password = randomBytes(24).toString('base64url');
  const voucherId = `maintenance-voucher-ui-${nonce}`;
  const voucherCode = `MTF-${randomBytes(4).toString('hex').toUpperCase()}`;
  const courseId = 'maintenance-course';
  const created = await services.authAdmin.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { full_name: 'Synthetic voucher learner' },
  });
  if (created.error || !created.data.user) {
    await services.db.$disconnect();
    throw new Error('Disposable voucher account creation failed.');
  }
  const userId = created.data.user.id;
  const cleanup = async () => {
    if (!email.startsWith('maintenance-voucher-ui-') || !voucherId.startsWith('maintenance-voucher-ui-')) {
      throw new Error('Refusing cleanup outside this test fixture.');
    }
    try {
      const purchases = await services.db.purchase.findMany({ where: { userId }, select: { id: true } });
      const purchaseIds = purchases.map((row) => row.id);
      await services.db.voucherRedemption.deleteMany({ where: { voucherId, userId } });
      await services.db.discountApplied.deleteMany({ where: { purchaseId: { in: purchaseIds } } });
      await services.db.purchase.deleteMany({ where: { id: { in: purchaseIds }, userId } });
      await services.db.lessonQuizAttempt.deleteMany({ where: { userId } });
      await services.db.lessonQuizSummary.deleteMany({ where: { userId } });
      await services.db.lessonNote.deleteMany({ where: { userId } });
      await services.db.userProgress.deleteMany({ where: { userId } });
      await services.db.lessonPurchase.deleteMany({ where: { userId } });
      await services.db.voucherCode.deleteMany({ where: { id: voucherId } });
      await services.db.user.deleteMany({ where: { id: userId, email } });
      const deleted = await services.authAdmin.auth.admin.deleteUser(userId);
      if (deleted.error) throw new Error('Disposable auth account cleanup failed.');
    } finally { await services.db.$disconnect(); }
  };
  try {
    await services.db.user.create({ data: { id: userId, email, name: 'Synthetic voucher learner', role: 'USER', emailVerified: true } });
    await services.db.voucherCode.create({ data: {
      id: voucherId, code: voucherCode, type: 'FREE_ACCESS', courseId,
      maxUses: 1, maxUsesPerUser: 1, currentUses: 0, isActive: true,
      expiresAt: new Date(Date.now() + 3600_000),
      metadata: { maintenanceFixture: 'voucher-ui' },
    } });
    return { ...services, userId, email, password, voucherId, voucherCode, courseId, cleanup };
  } catch {
    await cleanup();
    throw new Error('Disposable voucher fixture setup failed.');
  }
}
