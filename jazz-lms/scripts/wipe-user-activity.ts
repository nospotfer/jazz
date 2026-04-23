/**
 * WIPE USER ACTIVITY — cleans the database of all user-generated activity
 * while preserving content (courses, lessons, quizzes, translations) and
 * admin-configured resources (voucher codes, voucher batches, admin users).
 *
 * SAFETY:
 *   - This script MUST NOT be executed automatically. It requires
 *     `CONFIRM=WIPE-USER-ACTIVITY` in the environment to proceed.
 *   - Does NOT drop tables or run raw SQL. Uses Prisma deleteMany with
 *     a transaction so partial failures roll back.
 *   - Preserves admin users (role !== 'USER'); deletes regular users only
 *     when `DELETE_REGULAR_USERS=true` is set explicitly.
 *
 * USAGE (production):
 *   CONFIRM=WIPE-USER-ACTIVITY npx tsx scripts/wipe-user-activity.ts
 *
 *   # Also delete regular (non-admin) users:
 *   CONFIRM=WIPE-USER-ACTIVITY DELETE_REGULAR_USERS=true \
 *     npx tsx scripts/wipe-user-activity.ts
 *
 * PRESERVED (content + admin config):
 *   - Course, Chapter, Lesson
 *   - CourseTranslation, ChapterTranslation, LessonTranslation
 *   - Attachment (lesson attachments)
 *   - LessonQuizQuestion, LessonQuizOption (quiz bank)
 *   - VoucherCode, VoucherBatch (admin-defined)
 *   - User (admins only by default)
 *
 * WIPED (user activity):
 *   - Purchase, DiscountApplied, VoucherRedemption
 *   - UserProgress, LessonNote, LessonPurchase
 *   - LessonQuizAttemptAnswer, LessonQuizAttempt, LessonQuizSummary
 *   - PaymentWebhookEvent, EmailVerification
 *   - User (non-admin, only when DELETE_REGULAR_USERS=true)
 */

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
    // Order matters — delete children before parents to respect FK constraints
    // even though most relations are set to Cascade.

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
  });

  console.log('\nPost-wipe counts:');
  const after = await collectCounts();
  console.table(after);

  console.log('\nDone. Content, admin users, and voucher configuration preserved.');
}

async function collectCounts() {
  const [
    users,
    purchases,
    voucherRedemptions,
    discounts,
    userProgress,
    lessonNotes,
    lessonPurchases,
    quizAttempts,
    quizAttemptAnswers,
    quizSummaries,
    webhookEvents,
    emailVerifications,
    voucherCodes,
    voucherBatches,
    courses,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.purchase.count(),
    prisma.voucherRedemption.count(),
    prisma.discountApplied.count(),
    prisma.userProgress.count(),
    prisma.lessonNote.count(),
    prisma.lessonPurchase.count(),
    prisma.lessonQuizAttempt.count(),
    prisma.lessonQuizAttemptAnswer.count(),
    prisma.lessonQuizSummary.count(),
    prisma.paymentWebhookEvent.count(),
    prisma.emailVerification.count(),
    prisma.voucherCode.count(),
    prisma.voucherBatch.count(),
    prisma.course.count(),
  ]);

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
