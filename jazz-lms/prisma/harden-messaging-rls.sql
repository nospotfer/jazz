-- Separate production review gate: messaging is server-only.
-- Confirm the runtime Prisma role retains CRUD privileges and owns these tables
-- (without FORCE RLS), or has BYPASSRLS, before applying. Otherwise prepare a
-- reviewed server-only policy. Execute as the owner/an inheriting owner role.
-- This script touches only the two existing lowercase messaging tables.
BEGIN;

DO $messaging_hardening$
DECLARE
  target_name text;
  target_oid oid;
  target_owner oid;
  browser_role text;
  executor_is_superuser boolean;
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    RAISE EXCEPTION 'Messaging hardening requires a trusted table-owner role';
  END IF;
  SELECT rolsuper INTO executor_is_superuser FROM pg_roles WHERE rolname = current_user;

  FOREACH target_name IN ARRAY ARRAY['messagethread', 'message'] LOOP
    target_oid := to_regclass(format('public.%I', target_name));
    IF target_oid IS NULL THEN
      RAISE EXCEPTION 'Expected messaging table public.% is missing; review schema before hardening', target_name;
    END IF;
    SELECT relowner INTO target_owner FROM pg_class WHERE oid = target_oid AND relkind = 'r';
    IF target_owner IS NULL OR
       NOT (executor_is_superuser OR pg_has_role(current_user, target_owner, 'USAGE')) THEN
      RAISE EXCEPTION 'Messaging hardening requires ownership of public.%', target_name;
    END IF;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', target_name);
    EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM PUBLIC', target_name);
    FOREACH browser_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = browser_role) THEN
        EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM %I', target_name, browser_role);
        IF has_table_privilege(browser_role, target_oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
           OR has_any_column_privilege(browser_role, target_oid, 'SELECT,INSERT,UPDATE,REFERENCES') THEN
          RAISE EXCEPTION 'Role % still inherits privileges on public.%; review grants manually', browser_role, target_name;
        END IF;
      END IF;
    END LOOP;
  END LOOP;
END;
$messaging_hardening$;

COMMIT;
