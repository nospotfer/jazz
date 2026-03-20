DO $$
BEGIN
  IF to_regclass('public."CourseTranslation"') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public."CourseTranslation" ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS course_translation_select_purchased_or_admin ON public."CourseTranslation"';
    EXECUTE '
      CREATE POLICY course_translation_select_purchased_or_admin
      ON public."CourseTranslation"
      FOR SELECT
      USING (public.has_course_access("courseId"))
    ';

    EXECUTE 'DROP POLICY IF EXISTS course_translation_admin_write ON public."CourseTranslation"';
    EXECUTE '
      CREATE POLICY course_translation_admin_write
      ON public."CourseTranslation"
      FOR ALL
      USING (public.is_admin_user())
      WITH CHECK (public.is_admin_user())
    ';
  END IF;

  IF to_regclass('public."ChapterTranslation"') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public."ChapterTranslation" ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS chapter_translation_select_purchased_or_admin ON public."ChapterTranslation"';
    EXECUTE '
      CREATE POLICY chapter_translation_select_purchased_or_admin
      ON public."ChapterTranslation"
      FOR SELECT
      USING (
        public.is_admin_user()
        OR EXISTS (
          SELECT 1
          FROM public."Chapter" c
          WHERE c.id = "ChapterTranslation"."chapterId"
            AND public.has_course_access(c."courseId")
        )
      )
    ';

    EXECUTE 'DROP POLICY IF EXISTS chapter_translation_admin_write ON public."ChapterTranslation"';
    EXECUTE '
      CREATE POLICY chapter_translation_admin_write
      ON public."ChapterTranslation"
      FOR ALL
      USING (public.is_admin_user())
      WITH CHECK (public.is_admin_user())
    ';
  END IF;

  IF to_regclass('public."LessonTranslation"') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public."LessonTranslation" ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS lesson_translation_select_purchased_or_admin ON public."LessonTranslation"';
    EXECUTE '
      CREATE POLICY lesson_translation_select_purchased_or_admin
      ON public."LessonTranslation"
      FOR SELECT
      USING (
        public.is_admin_user()
        OR EXISTS (
          SELECT 1
          FROM public."Lesson" l
          JOIN public."Chapter" c ON c.id = l."chapterId"
          WHERE l.id = "LessonTranslation"."lessonId"
            AND public.has_course_access(c."courseId")
        )
      )
    ';

    EXECUTE 'DROP POLICY IF EXISTS lesson_translation_admin_write ON public."LessonTranslation"';
    EXECUTE '
      CREATE POLICY lesson_translation_admin_write
      ON public."LessonTranslation"
      FOR ALL
      USING (public.is_admin_user())
      WITH CHECK (public.is_admin_user())
    ';
  END IF;

  IF to_regclass('public."VoucherCode"') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public."VoucherCode" ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS voucher_code_select_active_authenticated_or_admin ON public."VoucherCode"';
    EXECUTE '
      CREATE POLICY voucher_code_select_active_authenticated_or_admin
      ON public."VoucherCode"
      FOR SELECT
      USING (
        public.is_admin_user()
        OR (
          auth.role() = ''authenticated''
          AND "isActive" = true
          AND ("expiresAt" IS NULL OR "expiresAt" > now())
        )
      )
    ';

    EXECUTE 'DROP POLICY IF EXISTS voucher_code_admin_insert ON public."VoucherCode"';
    EXECUTE '
      CREATE POLICY voucher_code_admin_insert
      ON public."VoucherCode"
      FOR INSERT
      WITH CHECK (public.is_admin_user())
    ';

    EXECUTE 'DROP POLICY IF EXISTS voucher_code_admin_update ON public."VoucherCode"';
    EXECUTE '
      CREATE POLICY voucher_code_admin_update
      ON public."VoucherCode"
      FOR UPDATE
      USING (public.is_admin_user())
      WITH CHECK (public.is_admin_user())
    ';

    EXECUTE 'DROP POLICY IF EXISTS voucher_code_admin_delete ON public."VoucherCode"';
    EXECUTE '
      CREATE POLICY voucher_code_admin_delete
      ON public."VoucherCode"
      FOR DELETE
      USING (public.is_admin_user())
    ';
  END IF;

  IF to_regclass('public."VoucherBatch"') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public."VoucherBatch" ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS voucher_batch_admin_select ON public."VoucherBatch"';
    EXECUTE '
      CREATE POLICY voucher_batch_admin_select
      ON public."VoucherBatch"
      FOR SELECT
      USING (public.is_admin_user())
    ';

    EXECUTE 'DROP POLICY IF EXISTS voucher_batch_admin_insert ON public."VoucherBatch"';
    EXECUTE '
      CREATE POLICY voucher_batch_admin_insert
      ON public."VoucherBatch"
      FOR INSERT
      WITH CHECK (public.is_admin_user())
    ';

    EXECUTE 'DROP POLICY IF EXISTS voucher_batch_admin_update ON public."VoucherBatch"';
    EXECUTE '
      CREATE POLICY voucher_batch_admin_update
      ON public."VoucherBatch"
      FOR UPDATE
      USING (public.is_admin_user())
      WITH CHECK (public.is_admin_user())
    ';

    EXECUTE 'DROP POLICY IF EXISTS voucher_batch_admin_delete ON public."VoucherBatch"';
    EXECUTE '
      CREATE POLICY voucher_batch_admin_delete
      ON public."VoucherBatch"
      FOR DELETE
      USING (public.is_admin_user())
    ';
  END IF;

  IF to_regclass('public."VoucherRedemption"') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public."VoucherRedemption" ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS voucher_redemption_select_own_or_admin ON public."VoucherRedemption"';
    EXECUTE '
      CREATE POLICY voucher_redemption_select_own_or_admin
      ON public."VoucherRedemption"
      FOR SELECT
      USING (
        "userId" = auth.uid()::text
        OR public.is_admin_user()
      )
    ';

    EXECUTE 'DROP POLICY IF EXISTS voucher_redemption_insert_own_or_admin ON public."VoucherRedemption"';
    EXECUTE '
      CREATE POLICY voucher_redemption_insert_own_or_admin
      ON public."VoucherRedemption"
      FOR INSERT
      WITH CHECK (
        "userId" = auth.uid()::text
        OR public.is_admin_user()
      )
    ';

    EXECUTE 'DROP POLICY IF EXISTS voucher_redemption_update_own_or_admin ON public."VoucherRedemption"';
    EXECUTE '
      CREATE POLICY voucher_redemption_update_own_or_admin
      ON public."VoucherRedemption"
      FOR UPDATE
      USING (
        "userId" = auth.uid()::text
        OR public.is_admin_user()
      )
      WITH CHECK (
        "userId" = auth.uid()::text
        OR public.is_admin_user()
      )
    ';

    EXECUTE 'DROP POLICY IF EXISTS voucher_redemption_delete_admin_only ON public."VoucherRedemption"';
    EXECUTE '
      CREATE POLICY voucher_redemption_delete_admin_only
      ON public."VoucherRedemption"
      FOR DELETE
      USING (public.is_admin_user())
    ';
  END IF;

  IF to_regclass('public."DiscountApplied"') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public."DiscountApplied" ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS discount_applied_select_own_or_admin ON public."DiscountApplied"';
    EXECUTE '
      CREATE POLICY discount_applied_select_own_or_admin
      ON public."DiscountApplied"
      FOR SELECT
      USING (
        public.is_admin_user()
        OR EXISTS (
          SELECT 1
          FROM public."Purchase" p
          WHERE p.id = "DiscountApplied"."purchaseId"
            AND p."userId" = auth.uid()::text
        )
      )
    ';

    EXECUTE 'DROP POLICY IF EXISTS discount_applied_admin_insert ON public."DiscountApplied"';
    EXECUTE '
      CREATE POLICY discount_applied_admin_insert
      ON public."DiscountApplied"
      FOR INSERT
      WITH CHECK (public.is_admin_user())
    ';

    EXECUTE 'DROP POLICY IF EXISTS discount_applied_admin_update ON public."DiscountApplied"';
    EXECUTE '
      CREATE POLICY discount_applied_admin_update
      ON public."DiscountApplied"
      FOR UPDATE
      USING (public.is_admin_user())
      WITH CHECK (public.is_admin_user())
    ';

    EXECUTE 'DROP POLICY IF EXISTS discount_applied_admin_delete ON public."DiscountApplied"';
    EXECUTE '
      CREATE POLICY discount_applied_admin_delete
      ON public."DiscountApplied"
      FOR DELETE
      USING (public.is_admin_user())
    ';
  END IF;

  IF to_regclass('public."LessonQuizQuestion"') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public."LessonQuizQuestion" ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS lesson_quiz_question_select_course_access_or_admin ON public."LessonQuizQuestion"';
    EXECUTE '
      CREATE POLICY lesson_quiz_question_select_course_access_or_admin
      ON public."LessonQuizQuestion"
      FOR SELECT
      USING (
        public.is_admin_user()
        OR EXISTS (
          SELECT 1
          FROM public."Lesson" l
          JOIN public."Chapter" c ON c.id = l."chapterId"
          WHERE l.id = "LessonQuizQuestion"."lessonId"
            AND public.has_course_access(c."courseId")
        )
      )
    ';

    EXECUTE 'DROP POLICY IF EXISTS lesson_quiz_question_admin_write ON public."LessonQuizQuestion"';
    EXECUTE '
      CREATE POLICY lesson_quiz_question_admin_write
      ON public."LessonQuizQuestion"
      FOR ALL
      USING (public.is_admin_user())
      WITH CHECK (public.is_admin_user())
    ';
  END IF;

  IF to_regclass('public."LessonQuizOption"') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public."LessonQuizOption" ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS lesson_quiz_option_select_course_access_or_admin ON public."LessonQuizOption"';
    EXECUTE '
      CREATE POLICY lesson_quiz_option_select_course_access_or_admin
      ON public."LessonQuizOption"
      FOR SELECT
      USING (
        public.is_admin_user()
        OR EXISTS (
          SELECT 1
          FROM public."LessonQuizQuestion" q
          JOIN public."Lesson" l ON l.id = q."lessonId"
          JOIN public."Chapter" c ON c.id = l."chapterId"
          WHERE q.id = "LessonQuizOption"."questionId"
            AND public.has_course_access(c."courseId")
        )
      )
    ';

    EXECUTE 'DROP POLICY IF EXISTS lesson_quiz_option_admin_write ON public."LessonQuizOption"';
    EXECUTE '
      CREATE POLICY lesson_quiz_option_admin_write
      ON public."LessonQuizOption"
      FOR ALL
      USING (public.is_admin_user())
      WITH CHECK (public.is_admin_user())
    ';
  END IF;

  IF to_regclass('public."LessonQuizAttempt"') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public."LessonQuizAttempt" ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS lesson_quiz_attempt_select_own_or_admin ON public."LessonQuizAttempt"';
    EXECUTE '
      CREATE POLICY lesson_quiz_attempt_select_own_or_admin
      ON public."LessonQuizAttempt"
      FOR SELECT
      USING (
        "userId" = auth.uid()::text
        OR public.is_admin_user()
      )
    ';

    EXECUTE 'DROP POLICY IF EXISTS lesson_quiz_attempt_insert_own_or_admin ON public."LessonQuizAttempt"';
    EXECUTE '
      CREATE POLICY lesson_quiz_attempt_insert_own_or_admin
      ON public."LessonQuizAttempt"
      FOR INSERT
      WITH CHECK (
        "userId" = auth.uid()::text
        OR public.is_admin_user()
      )
    ';

    EXECUTE 'DROP POLICY IF EXISTS lesson_quiz_attempt_update_own_or_admin ON public."LessonQuizAttempt"';
    EXECUTE '
      CREATE POLICY lesson_quiz_attempt_update_own_or_admin
      ON public."LessonQuizAttempt"
      FOR UPDATE
      USING (
        "userId" = auth.uid()::text
        OR public.is_admin_user()
      )
      WITH CHECK (
        "userId" = auth.uid()::text
        OR public.is_admin_user()
      )
    ';

    EXECUTE 'DROP POLICY IF EXISTS lesson_quiz_attempt_delete_admin_only ON public."LessonQuizAttempt"';
    EXECUTE '
      CREATE POLICY lesson_quiz_attempt_delete_admin_only
      ON public."LessonQuizAttempt"
      FOR DELETE
      USING (public.is_admin_user())
    ';
  END IF;

  IF to_regclass('public."LessonQuizAttemptAnswer"') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public."LessonQuizAttemptAnswer" ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS lesson_quiz_attempt_answer_select_own_or_admin ON public."LessonQuizAttemptAnswer"';
    EXECUTE '
      CREATE POLICY lesson_quiz_attempt_answer_select_own_or_admin
      ON public."LessonQuizAttemptAnswer"
      FOR SELECT
      USING (
        public.is_admin_user()
        OR EXISTS (
          SELECT 1
          FROM public."LessonQuizAttempt" a
          WHERE a.id = "LessonQuizAttemptAnswer"."attemptId"
            AND a."userId" = auth.uid()::text
        )
      )
    ';

    EXECUTE 'DROP POLICY IF EXISTS lesson_quiz_attempt_answer_insert_own_or_admin ON public."LessonQuizAttemptAnswer"';
    EXECUTE '
      CREATE POLICY lesson_quiz_attempt_answer_insert_own_or_admin
      ON public."LessonQuizAttemptAnswer"
      FOR INSERT
      WITH CHECK (
        public.is_admin_user()
        OR EXISTS (
          SELECT 1
          FROM public."LessonQuizAttempt" a
          WHERE a.id = "LessonQuizAttemptAnswer"."attemptId"
            AND a."userId" = auth.uid()::text
        )
      )
    ';

    EXECUTE 'DROP POLICY IF EXISTS lesson_quiz_attempt_answer_update_own_or_admin ON public."LessonQuizAttemptAnswer"';
    EXECUTE '
      CREATE POLICY lesson_quiz_attempt_answer_update_own_or_admin
      ON public."LessonQuizAttemptAnswer"
      FOR UPDATE
      USING (
        public.is_admin_user()
        OR EXISTS (
          SELECT 1
          FROM public."LessonQuizAttempt" a
          WHERE a.id = "LessonQuizAttemptAnswer"."attemptId"
            AND a."userId" = auth.uid()::text
        )
      )
      WITH CHECK (
        public.is_admin_user()
        OR EXISTS (
          SELECT 1
          FROM public."LessonQuizAttempt" a
          WHERE a.id = "LessonQuizAttemptAnswer"."attemptId"
            AND a."userId" = auth.uid()::text
        )
      )
    ';

    EXECUTE 'DROP POLICY IF EXISTS lesson_quiz_attempt_answer_delete_admin_only ON public."LessonQuizAttemptAnswer"';
    EXECUTE '
      CREATE POLICY lesson_quiz_attempt_answer_delete_admin_only
      ON public."LessonQuizAttemptAnswer"
      FOR DELETE
      USING (public.is_admin_user())
    ';
  END IF;

  IF to_regclass('public."LessonQuizSummary"') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public."LessonQuizSummary" ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS lesson_quiz_summary_select_own_or_admin ON public."LessonQuizSummary"';
    EXECUTE '
      CREATE POLICY lesson_quiz_summary_select_own_or_admin
      ON public."LessonQuizSummary"
      FOR SELECT
      USING (
        "userId" = auth.uid()::text
        OR public.is_admin_user()
      )
    ';

    EXECUTE 'DROP POLICY IF EXISTS lesson_quiz_summary_insert_own_or_admin ON public."LessonQuizSummary"';
    EXECUTE '
      CREATE POLICY lesson_quiz_summary_insert_own_or_admin
      ON public."LessonQuizSummary"
      FOR INSERT
      WITH CHECK (
        "userId" = auth.uid()::text
        OR public.is_admin_user()
      )
    ';

    EXECUTE 'DROP POLICY IF EXISTS lesson_quiz_summary_update_own_or_admin ON public."LessonQuizSummary"';
    EXECUTE '
      CREATE POLICY lesson_quiz_summary_update_own_or_admin
      ON public."LessonQuizSummary"
      FOR UPDATE
      USING (
        "userId" = auth.uid()::text
        OR public.is_admin_user()
      )
      WITH CHECK (
        "userId" = auth.uid()::text
        OR public.is_admin_user()
      )
    ';

    EXECUTE 'DROP POLICY IF EXISTS lesson_quiz_summary_delete_admin_only ON public."LessonQuizSummary"';
    EXECUTE '
      CREATE POLICY lesson_quiz_summary_delete_admin_only
      ON public."LessonQuizSummary"
      FOR DELETE
      USING (public.is_admin_user())
    ';
  END IF;

  IF to_regclass('public._prisma_migrations') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS prisma_migrations_admin_only_select ON public._prisma_migrations';
    EXECUTE '
      CREATE POLICY prisma_migrations_admin_only_select
      ON public._prisma_migrations
      FOR SELECT
      USING (public.is_admin_user())
    ';

    EXECUTE 'DROP POLICY IF EXISTS prisma_migrations_admin_only_insert ON public._prisma_migrations';
    EXECUTE '
      CREATE POLICY prisma_migrations_admin_only_insert
      ON public._prisma_migrations
      FOR INSERT
      WITH CHECK (public.is_admin_user())
    ';

    EXECUTE 'DROP POLICY IF EXISTS prisma_migrations_admin_only_update ON public._prisma_migrations';
    EXECUTE '
      CREATE POLICY prisma_migrations_admin_only_update
      ON public._prisma_migrations
      FOR UPDATE
      USING (public.is_admin_user())
      WITH CHECK (public.is_admin_user())
    ';

    EXECUTE 'DROP POLICY IF EXISTS prisma_migrations_admin_only_delete ON public._prisma_migrations';
    EXECUTE '
      CREATE POLICY prisma_migrations_admin_only_delete
      ON public._prisma_migrations
      FOR DELETE
      USING (public.is_admin_user())
    ';
  END IF;
END
$$;
