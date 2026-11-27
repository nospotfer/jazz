-- Approval gate: LMS tables are accessed by trusted Prisma/server routes.
-- Before production use, verify the actual Prisma connection role owns every
-- target table (without FORCE RLS) or has BYPASSRLS, and retains CRUD privileges.
-- Apply as the table owner, an inheriting owner role, or a superuser.
-- No auth/storage objects, shared-schema defaults, or other project tables change.
BEGIN;

DO $lms_hardening$
DECLARE
  target_name text;
  target_oid oid;
  target_owner oid;
  browser_role text;
  executor_is_superuser boolean;
  lms_tables constant text[] := ARRAY[
    'User', 'EmailVerification', 'Course', 'Chapter', 'Lesson',
    'CourseTranslation', 'ChapterTranslation', 'LessonTranslation', 'Attachment',
    'Purchase', 'VoucherBatch', 'VoucherCode', 'VoucherRedemption',
    'DiscountApplied', 'PaymentWebhookEvent', 'UserProgress', 'LessonPurchase',
    'LessonNote', 'LessonQuizQuestion', 'LessonQuizOption', 'LessonQuizAttempt',
    'LessonQuizAttemptAnswer', 'LessonQuizSummary'
  ];
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    RAISE EXCEPTION 'LMS hardening requires a trusted table-owner role';
  END IF;
  SELECT rolsuper INTO executor_is_superuser FROM pg_roles WHERE rolname = current_user;

  FOREACH target_name IN ARRAY lms_tables LOOP
    target_oid := to_regclass(format('public.%I', target_name));
    IF target_oid IS NULL THEN
      RAISE EXCEPTION 'Expected LMS table public.% is missing; review schema before hardening', target_name;
    END IF;
    SELECT relowner INTO target_owner FROM pg_class WHERE oid = target_oid AND relkind = 'r';
    IF target_owner IS NULL OR
       NOT (executor_is_superuser OR pg_has_role(current_user, target_owner, 'USAGE')) THEN
      RAISE EXCEPTION 'LMS hardening requires ownership of public.%', target_name;
    END IF;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', target_name);
    EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM PUBLIC', target_name);

    FOREACH browser_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = browser_role) THEN
        EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM %I', target_name, browser_role);
        -- Check effective grants too: inherited/shared roles can preserve access.
        -- Abort rather than mutating such roles outside this project's scope.
        IF has_table_privilege(browser_role, target_oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
           OR has_any_column_privilege(browser_role, target_oid, 'SELECT,INSERT,UPDATE,REFERENCES') THEN
          RAISE EXCEPTION 'Role % still inherits privileges on public.%; review grants manually', browser_role, target_name;
        END IF;
      END IF;
    END LOOP;
  END LOOP;
END;
$lms_hardening$;

COMMIT;
