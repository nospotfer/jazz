CREATE OR REPLACE FUNCTION public.request_user_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT COALESCE(
    NULLIF(auth.jwt() ->> 'email', ''),
    NULLIF(current_setting('request.jwt.claim.email', true), '')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public."User" u
    WHERE (
      u.id = auth.uid()::text
      OR lower(u.email) = lower(COALESCE(public.request_user_email(), ''))
    )
      AND u.role IN ('SUPER_ADMIN', 'COURSE_ADMIN', 'CONTENT_CREATOR', 'MODERATOR')
  );
$$;

CREATE OR REPLACE FUNCTION public.has_course_access(target_course_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT
    public.is_admin_user()
    OR EXISTS (
      SELECT 1
      FROM public."Purchase" p
      WHERE p."courseId" = target_course_id
        AND p."userId" = auth.uid()::text
    );
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

ALTER TABLE IF EXISTS public."User" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_select_self_or_admin ON public."User";
CREATE POLICY user_select_self_or_admin
ON public."User"
FOR SELECT
USING (
  id = auth.uid()::text
  OR public.is_admin_user()
);

DROP POLICY IF EXISTS user_insert_self_or_admin ON public."User";
CREATE POLICY user_insert_self_or_admin
ON public."User"
FOR INSERT
WITH CHECK (
  (
    id = auth.uid()::text
    AND lower(email) = lower(COALESCE(public.request_user_email(), ''))
  )
  OR public.is_admin_user()
);

DROP POLICY IF EXISTS user_update_self_or_admin ON public."User";
CREATE POLICY user_update_self_or_admin
ON public."User"
FOR UPDATE
USING (
  id = auth.uid()::text
  OR public.is_admin_user()
)
WITH CHECK (
  id = auth.uid()::text
  OR public.is_admin_user()
);

DROP POLICY IF EXISTS user_delete_admin_only ON public."User";
CREATE POLICY user_delete_admin_only
ON public."User"
FOR DELETE
USING (public.is_admin_user());

ALTER TABLE IF EXISTS public."EmailVerification" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS email_verification_admin_only_select ON public."EmailVerification";
CREATE POLICY email_verification_admin_only_select
ON public."EmailVerification"
FOR SELECT
USING (public.is_admin_user());

DROP POLICY IF EXISTS email_verification_admin_only_insert ON public."EmailVerification";
CREATE POLICY email_verification_admin_only_insert
ON public."EmailVerification"
FOR INSERT
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS email_verification_admin_only_update ON public."EmailVerification";
CREATE POLICY email_verification_admin_only_update
ON public."EmailVerification"
FOR UPDATE
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS email_verification_admin_only_delete ON public."EmailVerification";
CREATE POLICY email_verification_admin_only_delete
ON public."EmailVerification"
FOR DELETE
USING (public.is_admin_user());

ALTER TABLE IF EXISTS public."Course" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS course_select_purchased_or_admin ON public."Course";
CREATE POLICY course_select_purchased_or_admin
ON public."Course"
FOR SELECT
USING (public.has_course_access(id));

DROP POLICY IF EXISTS course_admin_write ON public."Course";
CREATE POLICY course_admin_write
ON public."Course"
FOR ALL
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

ALTER TABLE IF EXISTS public."Chapter" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS chapter_select_purchased_or_admin ON public."Chapter";
CREATE POLICY chapter_select_purchased_or_admin
ON public."Chapter"
FOR SELECT
USING (public.has_course_access("courseId"));

DROP POLICY IF EXISTS chapter_admin_write ON public."Chapter";
CREATE POLICY chapter_admin_write
ON public."Chapter"
FOR ALL
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

ALTER TABLE IF EXISTS public."Lesson" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS lesson_select_purchased_or_admin ON public."Lesson";
CREATE POLICY lesson_select_purchased_or_admin
ON public."Lesson"
FOR SELECT
USING (
  public.is_admin_user()
  OR EXISTS (
    SELECT 1
    FROM public."Chapter" c
    WHERE c.id = "Lesson"."chapterId"
      AND public.has_course_access(c."courseId")
  )
);

DROP POLICY IF EXISTS lesson_admin_write ON public."Lesson";
CREATE POLICY lesson_admin_write
ON public."Lesson"
FOR ALL
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

ALTER TABLE IF EXISTS public."Attachment" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS attachment_select_purchased_or_admin ON public."Attachment";
CREATE POLICY attachment_select_purchased_or_admin
ON public."Attachment"
FOR SELECT
USING (
  public.is_admin_user()
  OR EXISTS (
    SELECT 1
    FROM public."Lesson" l
    JOIN public."Chapter" c ON c.id = l."chapterId"
    WHERE l.id = "Attachment"."lessonId"
      AND public.has_course_access(c."courseId")
  )
);

DROP POLICY IF EXISTS attachment_admin_write ON public."Attachment";
CREATE POLICY attachment_admin_write
ON public."Attachment"
FOR ALL
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

ALTER TABLE IF EXISTS public."Purchase" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS purchase_select_own_or_admin ON public."Purchase";
CREATE POLICY purchase_select_own_or_admin
ON public."Purchase"
FOR SELECT
USING (
  "userId" = auth.uid()::text
  OR public.is_admin_user()
);

DROP POLICY IF EXISTS purchase_insert_own_or_admin ON public."Purchase";
CREATE POLICY purchase_insert_own_or_admin
ON public."Purchase"
FOR INSERT
WITH CHECK (
  "userId" = auth.uid()::text
  OR public.is_admin_user()
);

DROP POLICY IF EXISTS purchase_update_own_or_admin ON public."Purchase";
CREATE POLICY purchase_update_own_or_admin
ON public."Purchase"
FOR UPDATE
USING (
  "userId" = auth.uid()::text
  OR public.is_admin_user()
)
WITH CHECK (
  "userId" = auth.uid()::text
  OR public.is_admin_user()
);

DROP POLICY IF EXISTS purchase_delete_admin_only ON public."Purchase";
CREATE POLICY purchase_delete_admin_only
ON public."Purchase"
FOR DELETE
USING (public.is_admin_user());

ALTER TABLE IF EXISTS public."UserProgress" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_progress_select_own_or_admin ON public."UserProgress";
CREATE POLICY user_progress_select_own_or_admin
ON public."UserProgress"
FOR SELECT
USING (
  "userId" = auth.uid()::text
  OR public.is_admin_user()
);

DROP POLICY IF EXISTS user_progress_insert_own_or_admin ON public."UserProgress";
CREATE POLICY user_progress_insert_own_or_admin
ON public."UserProgress"
FOR INSERT
WITH CHECK (
  "userId" = auth.uid()::text
  OR public.is_admin_user()
);

DROP POLICY IF EXISTS user_progress_update_own_or_admin ON public."UserProgress";
CREATE POLICY user_progress_update_own_or_admin
ON public."UserProgress"
FOR UPDATE
USING (
  "userId" = auth.uid()::text
  OR public.is_admin_user()
)
WITH CHECK (
  "userId" = auth.uid()::text
  OR public.is_admin_user()
);

DROP POLICY IF EXISTS user_progress_delete_own_or_admin ON public."UserProgress";
CREATE POLICY user_progress_delete_own_or_admin
ON public."UserProgress"
FOR DELETE
USING (
  "userId" = auth.uid()::text
  OR public.is_admin_user()
);

ALTER TABLE IF EXISTS public."LessonPurchase" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS lesson_purchase_select_own_or_admin ON public."LessonPurchase";
CREATE POLICY lesson_purchase_select_own_or_admin
ON public."LessonPurchase"
FOR SELECT
USING (
  "userId" = auth.uid()::text
  OR public.is_admin_user()
);

DROP POLICY IF EXISTS lesson_purchase_insert_own_or_admin ON public."LessonPurchase";
CREATE POLICY lesson_purchase_insert_own_or_admin
ON public."LessonPurchase"
FOR INSERT
WITH CHECK (
  "userId" = auth.uid()::text
  OR public.is_admin_user()
);

DROP POLICY IF EXISTS lesson_purchase_update_own_or_admin ON public."LessonPurchase";
CREATE POLICY lesson_purchase_update_own_or_admin
ON public."LessonPurchase"
FOR UPDATE
USING (
  "userId" = auth.uid()::text
  OR public.is_admin_user()
)
WITH CHECK (
  "userId" = auth.uid()::text
  OR public.is_admin_user()
);

DROP POLICY IF EXISTS lesson_purchase_delete_own_or_admin ON public."LessonPurchase";
CREATE POLICY lesson_purchase_delete_own_or_admin
ON public."LessonPurchase"
FOR DELETE
USING (
  "userId" = auth.uid()::text
  OR public.is_admin_user()
);

ALTER TABLE IF EXISTS public."LessonNote" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS lesson_note_select_owner_or_admin ON public."LessonNote";
CREATE POLICY lesson_note_select_owner_or_admin
ON public."LessonNote"
FOR SELECT
USING (
  "userId" = auth.uid()::text
  OR public.is_admin_user()
);

DROP POLICY IF EXISTS lesson_note_insert_owner_or_admin ON public."LessonNote";
CREATE POLICY lesson_note_insert_owner_or_admin
ON public."LessonNote"
FOR INSERT
WITH CHECK (
  "userId" = auth.uid()::text
  OR public.is_admin_user()
);

DROP POLICY IF EXISTS lesson_note_update_owner_or_admin ON public."LessonNote";
CREATE POLICY lesson_note_update_owner_or_admin
ON public."LessonNote"
FOR UPDATE
USING (
  "userId" = auth.uid()::text
  OR public.is_admin_user()
)
WITH CHECK (
  "userId" = auth.uid()::text
  OR public.is_admin_user()
);

DROP POLICY IF EXISTS lesson_note_delete_owner_or_admin ON public."LessonNote";
CREATE POLICY lesson_note_delete_owner_or_admin
ON public."LessonNote"
FOR DELETE
USING (
  "userId" = auth.uid()::text
  OR public.is_admin_user()
);

DO $$
BEGIN
  IF to_regclass('public.messagethread') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.messagethread ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS messagethread_select_participant_or_admin ON public.messagethread';
    EXECUTE '
      CREATE POLICY messagethread_select_participant_or_admin
      ON public.messagethread
      FOR SELECT
      USING (
        studentid = auth.uid()::text
        OR lower(studentemail) = lower(COALESCE(public.request_user_email(), ''''))
        OR public.is_admin_user()
      )
    ';

    EXECUTE 'DROP POLICY IF EXISTS messagethread_insert_participant_or_admin ON public.messagethread';
    EXECUTE '
      CREATE POLICY messagethread_insert_participant_or_admin
      ON public.messagethread
      FOR INSERT
      WITH CHECK (
        studentid = auth.uid()::text
        OR lower(studentemail) = lower(COALESCE(public.request_user_email(), ''''))
        OR public.is_admin_user()
      )
    ';

    EXECUTE 'DROP POLICY IF EXISTS messagethread_update_participant_or_admin ON public.messagethread';
    EXECUTE '
      CREATE POLICY messagethread_update_participant_or_admin
      ON public.messagethread
      FOR UPDATE
      USING (
        studentid = auth.uid()::text
        OR lower(studentemail) = lower(COALESCE(public.request_user_email(), ''''))
        OR public.is_admin_user()
      )
      WITH CHECK (
        studentid = auth.uid()::text
        OR lower(studentemail) = lower(COALESCE(public.request_user_email(), ''''))
        OR public.is_admin_user()
      )
    ';

    EXECUTE 'DROP POLICY IF EXISTS messagethread_delete_admin_only ON public.messagethread';
    EXECUTE '
      CREATE POLICY messagethread_delete_admin_only
      ON public.messagethread
      FOR DELETE
      USING (public.is_admin_user())
    ';
  END IF;

  IF to_regclass('public.message') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.message ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS message_select_participant_or_admin ON public.message';
    EXECUTE '
      CREATE POLICY message_select_participant_or_admin
      ON public.message
      FOR SELECT
      USING (
        public.is_admin_user()
        OR EXISTS (
          SELECT 1
          FROM public.messagethread t
          WHERE t.id = message.threadid
            AND (
              t.studentid = auth.uid()::text
              OR lower(t.studentemail) = lower(COALESCE(public.request_user_email(), ''''))
            )
        )
      )
    ';

    EXECUTE 'DROP POLICY IF EXISTS message_insert_participant_or_admin ON public.message';
    EXECUTE '
      CREATE POLICY message_insert_participant_or_admin
      ON public.message
      FOR INSERT
      WITH CHECK (
        public.is_admin_user()
        OR (
          senderid = auth.uid()::text
          AND EXISTS (
            SELECT 1
            FROM public.messagethread t
            WHERE t.id = message.threadid
              AND (
                t.studentid = auth.uid()::text
                OR lower(t.studentemail) = lower(COALESCE(public.request_user_email(), ''''))
              )
          )
        )
      )
    ';

    EXECUTE 'DROP POLICY IF EXISTS message_update_participant_or_admin ON public.message';
    EXECUTE '
      CREATE POLICY message_update_participant_or_admin
      ON public.message
      FOR UPDATE
      USING (
        public.is_admin_user()
        OR EXISTS (
          SELECT 1
          FROM public.messagethread t
          WHERE t.id = message.threadid
            AND (
              t.studentid = auth.uid()::text
              OR lower(t.studentemail) = lower(COALESCE(public.request_user_email(), ''''))
            )
        )
      )
      WITH CHECK (
        public.is_admin_user()
        OR EXISTS (
          SELECT 1
          FROM public.messagethread t
          WHERE t.id = message.threadid
            AND (
              t.studentid = auth.uid()::text
              OR lower(t.studentemail) = lower(COALESCE(public.request_user_email(), ''''))
            )
        )
      )
    ';

    EXECUTE 'DROP POLICY IF EXISTS message_delete_admin_only ON public.message';
    EXECUTE '
      CREATE POLICY message_delete_admin_only
      ON public.message
      FOR DELETE
      USING (public.is_admin_user())
    ';
  END IF;
END
$$;

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
    'Purchase',
    'UserProgress',
    'LessonPurchase',
    'LessonNote',
    'messagethread',
    'message'
  )
ORDER BY c.relname;
