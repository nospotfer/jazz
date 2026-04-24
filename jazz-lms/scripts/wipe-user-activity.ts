import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ADMIN_ROLES = new Set([
  'SUPER_ADMIN',
  'COURSE_ADMIN',
  'CONTENT_CREATOR',
  'MODERATOR',
]);

async function main() {
  if (process.env.CONFIRM !== 'WIPE-USER-ACTIVITY') {
    console.error('Refusing to run. Set CONFIRM=WIPE-USER-ACTIVITY to proceed.');
    console.error('This action deletes ALL user activity from the database.');
    process.exitCode = 1;
    return;
  }

  const deleteRegularUsers = process.env.DELETE_REGULAR_USERS === 'true';

  console.log('Pre-flight counts:');
  const before = await collectCounts();
  console.table(before);

  console.log('\nStarting wipe (transaction)...');

  await prisma.$transaction(async (tx) => {

    // Quiz activity (children → parent)
    await tx.lessonQuizAttemptAnswer.deleteMany({});
    await tx.lessonQuizAttempt.deleteMany({});
    await tx.lessonQuizSummary.deleteMany({});

    // Progress & engagement
    await tx.userProgress.deleteMany({});
    await tx.lessonNote.deleteMany({});
    await tx.lessonPurchase.deleteMany({});

    // Payment / voucher activity (children → parent)
    await tx.discountApplied.deleteMany({});
    await tx.voucherRedemption.deleteMany({});
    await tx.purchase.deleteMany({});

    // Ancillary activity
    await tx.paymentWebhookEvent.deleteMany({});
    await tx.emailVerification.deleteMany({});

    // Regenerate voucher usage counters — after redemptions/purchases wiped.
    await tx.voucherCode.updateMany({ data: { currentUses: 0 } });

    if (deleteRegularUsers) {
      const deletedUsers = await tx.user.deleteMany({
        where: {
          NOT: {
            role: { in: Array.from(ADMIN_ROLES) },
          },
        },
      });
      console.log(`  - deleted ${deletedUsers.count} regular users`);
    } else {
      console.log('  - kept all User records (set DELETE_REGULAR_USERS=true to wipe them)');
    }
  }, { timeout: 120_000, maxWait: 10_000 });

  console.log('\nPost-wipe counts:');
  const after = await collectCounts();
  console.table(after);

  console.log('\nDone. Content, admin users, and voucher configuration preserved.');
  console.log(
    '\nNOTE: the admin panel caches metrics for 5 minutes (tag `admin-metrics`).'
  );
  console.log(
    '      Click "Refrescar" at /admin/stats to see empty numbers immediately,'
  );
  console.log(
    '      or wait up to 5 minutes for the cache to expire naturally.'
  );
}

async function collectCounts() {
  // Sequential counts to avoid saturating Supabase session-mode pool.
  const users = await prisma.user.count();
  const purchases = await prisma.purchase.count();
  const voucherRedemptions = await prisma.voucherRedemption.count();
  const discounts = await prisma.discountApplied.count();
  const userProgress = await prisma.userProgress.count();
  const lessonNotes = await prisma.lessonNote.count();
  const lessonPurchases = await prisma.lessonPurchase.count();
  const quizAttempts = await prisma.lessonQuizAttempt.count();
  const quizAttemptAnswers = await prisma.lessonQuizAttemptAnswer.count();
  const quizSummaries = await prisma.lessonQuizSummary.count();
  const webhookEvents = await prisma.paymentWebhookEvent.count();
  const emailVerifications = await prisma.emailVerification.count();
  const voucherCodes = await prisma.voucherCode.count();
  const voucherBatches = await prisma.voucherBatch.count();
  const courses = await prisma.course.count();

  return {
    User: users,
    Purchase: purchases,
    VoucherRedemption: voucherRedemptions,
    DiscountApplied: discounts,
    UserProgress: userProgress,
    LessonNote: lessonNotes,
    LessonPurchase: lessonPurchases,
    LessonQuizAttempt: quizAttempts,
    LessonQuizAttemptAnswer: quizAttemptAnswers,
    LessonQuizSummary: quizSummaries,
    PaymentWebhookEvent: webhookEvents,
    EmailVerification: emailVerifications,
    'VoucherCode (kept)': voucherCodes,
    'VoucherBatch (kept)': voucherBatches,
    'Course (kept)': courses,
  };
}

main()
  .catch((error) => {
    console.error('Wipe failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
