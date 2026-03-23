DO $$
BEGIN
  IF to_regclass('public."User"') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS user_select_self_or_admin ON public."User"';
    EXECUTE 'DROP POLICY IF EXISTS user_insert_self_or_admin ON public."User"';
    EXECUTE 'DROP POLICY IF EXISTS user_update_self_or_admin ON public."User"';
    EXECUTE 'DROP POLICY IF EXISTS user_delete_admin_only ON public."User"';
    EXECUTE 'ALTER TABLE public."User" DISABLE ROW LEVEL SECURITY';
  END IF;

  IF to_regclass('public."EmailVerification"') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS email_verification_admin_only_select ON public."EmailVerification"';
    EXECUTE 'DROP POLICY IF EXISTS email_verification_admin_only_insert ON public."EmailVerification"';
    EXECUTE 'DROP POLICY IF EXISTS email_verification_admin_only_update ON public."EmailVerification"';
    EXECUTE 'DROP POLICY IF EXISTS email_verification_admin_only_delete ON public."EmailVerification"';
    EXECUTE 'ALTER TABLE public."EmailVerification" DISABLE ROW LEVEL SECURITY';
  END IF;

  IF to_regclass('public."Course"') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS course_select_purchased_or_admin ON public."Course"';
    EXECUTE 'DROP POLICY IF EXISTS course_admin_write ON public."Course"';
    EXECUTE 'ALTER TABLE public."Course" DISABLE ROW LEVEL SECURITY';
  END IF;

  IF to_regclass('public."Chapter"') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS chapter_select_purchased_or_admin ON public."Chapter"';
    EXECUTE 'DROP POLICY IF EXISTS chapter_admin_write ON public."Chapter"';
    EXECUTE 'ALTER TABLE public."Chapter" DISABLE ROW LEVEL SECURITY';
  END IF;

  IF to_regclass('public."Lesson"') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS lesson_select_purchased_or_admin ON public."Lesson"';
    EXECUTE 'DROP POLICY IF EXISTS lesson_admin_write ON public."Lesson"';
    EXECUTE 'ALTER TABLE public."Lesson" DISABLE ROW LEVEL SECURITY';
  END IF;

  IF to_regclass('public."Attachment"') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS attachment_select_purchased_or_admin ON public."Attachment"';
    EXECUTE 'DROP POLICY IF EXISTS attachment_admin_write ON public."Attachment"';
    EXECUTE 'ALTER TABLE public."Attachment" DISABLE ROW LEVEL SECURITY';
  END IF;

  IF to_regclass('public."Purchase"') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS purchase_select_own_or_admin ON public."Purchase"';
    EXECUTE 'DROP POLICY IF EXISTS purchase_insert_own_or_admin ON public."Purchase"';
    EXECUTE 'DROP POLICY IF EXISTS purchase_update_own_or_admin ON public."Purchase"';
    EXECUTE 'DROP POLICY IF EXISTS purchase_delete_admin_only ON public."Purchase"';
    EXECUTE 'ALTER TABLE public."Purchase" DISABLE ROW LEVEL SECURITY';
  END IF;

  IF to_regclass('public."UserProgress"') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS user_progress_select_own_or_admin ON public."UserProgress"';
    EXECUTE 'DROP POLICY IF EXISTS user_progress_insert_own_or_admin ON public."UserProgress"';
    EXECUTE 'DROP POLICY IF EXISTS user_progress_update_own_or_admin ON public."UserProgress"';
    EXECUTE 'DROP POLICY IF EXISTS user_progress_delete_own_or_admin ON public."UserProgress"';
    EXECUTE 'ALTER TABLE public."UserProgress" DISABLE ROW LEVEL SECURITY';
  END IF;

  IF to_regclass('public."LessonPurchase"') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS lesson_purchase_select_own_or_admin ON public."LessonPurchase"';
    EXECUTE 'DROP POLICY IF EXISTS lesson_purchase_insert_own_or_admin ON public."LessonPurchase"';
    EXECUTE 'DROP POLICY IF EXISTS lesson_purchase_update_own_or_admin ON public."LessonPurchase"';
    EXECUTE 'DROP POLICY IF EXISTS lesson_purchase_delete_own_or_admin ON public."LessonPurchase"';
    EXECUTE 'ALTER TABLE public."LessonPurchase" DISABLE ROW LEVEL SECURITY';
  END IF;

  IF to_regclass('public."LessonNote"') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS lesson_note_select_owner_or_admin ON public."LessonNote"';
    EXECUTE 'DROP POLICY IF EXISTS lesson_note_insert_owner_or_admin ON public."LessonNote"';
    EXECUTE 'DROP POLICY IF EXISTS lesson_note_update_owner_or_admin ON public."LessonNote"';
    EXECUTE 'DROP POLICY IF EXISTS lesson_note_delete_owner_or_admin ON public."LessonNote"';
    EXECUTE 'ALTER TABLE public."LessonNote" DISABLE ROW LEVEL SECURITY';
  END IF;

  IF to_regclass('public.messagethread') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS messagethread_select_participant_or_admin ON public.messagethread';
    EXECUTE 'DROP POLICY IF EXISTS messagethread_insert_participant_or_admin ON public.messagethread';
    EXECUTE 'DROP POLICY IF EXISTS messagethread_update_participant_or_admin ON public.messagethread';
    EXECUTE 'DROP POLICY IF EXISTS messagethread_delete_admin_only ON public.messagethread';
    EXECUTE 'ALTER TABLE public.messagethread DISABLE ROW LEVEL SECURITY';
  END IF;

  IF to_regclass('public.message') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS message_select_participant_or_admin ON public.message';
    EXECUTE 'DROP POLICY IF EXISTS message_insert_participant_or_admin ON public.message';
    EXECUTE 'DROP POLICY IF EXISTS message_update_participant_or_admin ON public.message';
    EXECUTE 'DROP POLICY IF EXISTS message_delete_admin_only ON public.message';
    EXECUTE 'ALTER TABLE public.message DISABLE ROW LEVEL SECURITY';
  END IF;
END
$$;

DO $$
BEGIN
  IF to_regclass('public."CourseTranslation"') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS course_translation_select_purchased_or_admin ON public."CourseTranslation"';
    EXECUTE 'DROP POLICY IF EXISTS course_translation_admin_write ON public."CourseTranslation"';
    EXECUTE 'ALTER TABLE public."CourseTranslation" DISABLE ROW LEVEL SECURITY';
  END IF;

  IF to_regclass('public."ChapterTranslation"') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS chapter_translation_select_purchased_or_admin ON public."ChapterTranslation"';
    EXECUTE 'DROP POLICY IF EXISTS chapter_translation_admin_write ON public."ChapterTranslation"';
    EXECUTE 'ALTER TABLE public."ChapterTranslation" DISABLE ROW LEVEL SECURITY';
  END IF;

  IF to_regclass('public."LessonTranslation"') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS lesson_translation_select_purchased_or_admin ON public."LessonTranslation"';
    EXECUTE 'DROP POLICY IF EXISTS lesson_translation_admin_write ON public."LessonTranslation"';
    EXECUTE 'ALTER TABLE public."LessonTranslation" DISABLE ROW LEVEL SECURITY';
  END IF;

  IF to_regclass('public."VoucherCode"') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS voucher_code_select_active_authenticated_or_admin ON public."VoucherCode"';
    EXECUTE 'DROP POLICY IF EXISTS voucher_code_admin_insert ON public."VoucherCode"';
    EXECUTE 'DROP POLICY IF EXISTS voucher_code_admin_update ON public."VoucherCode"';
    EXECUTE 'DROP POLICY IF EXISTS voucher_code_admin_delete ON public."VoucherCode"';
    EXECUTE 'ALTER TABLE public."VoucherCode" DISABLE ROW LEVEL SECURITY';
  END IF;

  IF to_regclass('public."VoucherBatch"') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS voucher_batch_admin_select ON public."VoucherBatch"';
    EXECUTE 'DROP POLICY IF EXISTS voucher_batch_admin_insert ON public."VoucherBatch"';
    EXECUTE 'DROP POLICY IF EXISTS voucher_batch_admin_update ON public."VoucherBatch"';
    EXECUTE 'DROP POLICY IF EXISTS voucher_batch_admin_delete ON public."VoucherBatch"';
    EXECUTE 'ALTER TABLE public."VoucherBatch" DISABLE ROW LEVEL SECURITY';
  END IF;

  IF to_regclass('public."VoucherRedemption"') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS voucher_redemption_select_own_or_admin ON public."VoucherRedemption"';
    EXECUTE 'DROP POLICY IF EXISTS voucher_redemption_insert_own_or_admin ON public."VoucherRedemption"';
    EXECUTE 'DROP POLICY IF EXISTS voucher_redemption_update_own_or_admin ON public."VoucherRedemption"';
    EXECUTE 'DROP POLICY IF EXISTS voucher_redemption_delete_admin_only ON public."VoucherRedemption"';
    EXECUTE 'ALTER TABLE public."VoucherRedemption" DISABLE ROW LEVEL SECURITY';
  END IF;

  IF to_regclass('public."DiscountApplied"') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS discount_applied_select_own_or_admin ON public."DiscountApplied"';
    EXECUTE 'DROP POLICY IF EXISTS discount_applied_admin_insert ON public."DiscountApplied"';
    EXECUTE 'DROP POLICY IF EXISTS discount_applied_admin_update ON public."DiscountApplied"';
    EXECUTE 'DROP POLICY IF EXISTS discount_applied_admin_delete ON public."DiscountApplied"';
    EXECUTE 'ALTER TABLE public."DiscountApplied" DISABLE ROW LEVEL SECURITY';
  END IF;

  IF to_regclass('public."LessonQuizQuestion"') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS lesson_quiz_question_select_course_access_or_admin ON public."LessonQuizQuestion"';
    EXECUTE 'DROP POLICY IF EXISTS lesson_quiz_question_admin_write ON public."LessonQuizQuestion"';
    EXECUTE 'ALTER TABLE public."LessonQuizQuestion" DISABLE ROW LEVEL SECURITY';
  END IF;

  IF to_regclass('public."LessonQuizOption"') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS lesson_quiz_option_select_course_access_or_admin ON public."LessonQuizOption"';
    EXECUTE 'DROP POLICY IF EXISTS lesson_quiz_option_admin_write ON public."LessonQuizOption"';
    EXECUTE 'ALTER TABLE public."LessonQuizOption" DISABLE ROW LEVEL SECURITY';
  END IF;

  IF to_regclass('public."LessonQuizAttempt"') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS lesson_quiz_attempt_select_own_or_admin ON public."LessonQuizAttempt"';
    EXECUTE 'DROP POLICY IF EXISTS lesson_quiz_attempt_insert_own_or_admin ON public."LessonQuizAttempt"';
    EXECUTE 'DROP POLICY IF EXISTS lesson_quiz_attempt_update_own_or_admin ON public."LessonQuizAttempt"';
    EXECUTE 'DROP POLICY IF EXISTS lesson_quiz_attempt_delete_admin_only ON public."LessonQuizAttempt"';
    EXECUTE 'ALTER TABLE public."LessonQuizAttempt" DISABLE ROW LEVEL SECURITY';
  END IF;

  IF to_regclass('public."LessonQuizAttemptAnswer"') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS lesson_quiz_attempt_answer_select_own_or_admin ON public."LessonQuizAttemptAnswer"';
    EXECUTE 'DROP POLICY IF EXISTS lesson_quiz_attempt_answer_insert_own_or_admin ON public."LessonQuizAttemptAnswer"';
    EXECUTE 'DROP POLICY IF EXISTS lesson_quiz_attempt_answer_update_own_or_admin ON public."LessonQuizAttemptAnswer"';
    EXECUTE 'DROP POLICY IF EXISTS lesson_quiz_attempt_answer_delete_admin_only ON public."LessonQuizAttemptAnswer"';
    EXECUTE 'ALTER TABLE public."LessonQuizAttemptAnswer" DISABLE ROW LEVEL SECURITY';
  END IF;

  IF to_regclass('public."LessonQuizSummary"') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS lesson_quiz_summary_select_own_or_admin ON public."LessonQuizSummary"';
    EXECUTE 'DROP POLICY IF EXISTS lesson_quiz_summary_insert_own_or_admin ON public."LessonQuizSummary"';
    EXECUTE 'DROP POLICY IF EXISTS lesson_quiz_summary_update_own_or_admin ON public."LessonQuizSummary"';
    EXECUTE 'DROP POLICY IF EXISTS lesson_quiz_summary_delete_admin_only ON public."LessonQuizSummary"';
    EXECUTE 'ALTER TABLE public."LessonQuizSummary" DISABLE ROW LEVEL SECURITY';
  END IF;

  IF to_regclass('public._prisma_migrations') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS prisma_migrations_admin_only_select ON public._prisma_migrations';
    EXECUTE 'DROP POLICY IF EXISTS prisma_migrations_admin_only_insert ON public._prisma_migrations';
    EXECUTE 'DROP POLICY IF EXISTS prisma_migrations_admin_only_update ON public._prisma_migrations';
    EXECUTE 'DROP POLICY IF EXISTS prisma_migrations_admin_only_delete ON public._prisma_migrations';
    EXECUTE 'ALTER TABLE public._prisma_migrations DISABLE ROW LEVEL SECURITY';
  END IF;
END
$$;

DROP FUNCTION IF EXISTS public.has_course_access(text);
DROP FUNCTION IF EXISTS public.is_admin_user();
DROP FUNCTION IF EXISTS public.request_user_email();

SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname IN (
    'User',
    'EmailVerification',
    'Course',
    'Chapter',
    'Lesson',
    'Attachment',
    'CourseTranslation',
    'ChapterTranslation',
    'LessonTranslation',
    'Purchase',
    'UserProgress',
    'LessonPurchase',
    'LessonNote',
    'VoucherCode',
    'VoucherBatch',
    'VoucherRedemption',
    'DiscountApplied',
    'LessonQuizQuestion',
    'LessonQuizOption',
    'LessonQuizAttempt',
    'LessonQuizAttemptAnswer',
    'LessonQuizSummary',
    'messagethread',
    'message',
    '_prisma_migrations'
  )
ORDER BY c.relname;
