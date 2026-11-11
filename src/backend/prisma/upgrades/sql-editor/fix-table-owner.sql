-- STEELWISE fix: let the app write to tables created from the SQL Editor.
-- Paste all of this into Supabase > SQL Editor > New query and click Run.
--
-- Why: tables made in the SQL Editor belong to the editor's role, not the
-- role the app connects as. With Row Level Security on, the app can then
-- not write to them. This gives every table in the public schema the same
-- owner as the "User" table (which the app already uses). If a table's
-- owner can't be changed, it adds a policy that lets the app's role in.
-- Supabase's public API keys stay blocked. Safe to run more than once.

BEGIN;

DO $fix$
DECLARE
  app_role text;
  t record;
BEGIN
  SELECT tableowner INTO app_role FROM pg_tables WHERE schemaname = 'public' AND tablename = 'User';
  IF app_role IS NULL THEN
    RAISE EXCEPTION 'Table "User" not found in public schema';
  END IF;

  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tableowner <> app_role LOOP
    BEGIN
      EXECUTE format('ALTER TABLE public.%I OWNER TO %I', t.tablename, app_role);
      RAISE NOTICE 'Owner of % set to %', t.tablename, app_role;
    EXCEPTION WHEN OTHERS THEN
      EXECUTE format('DROP POLICY IF EXISTS steelwise_app ON public.%I', t.tablename);
      EXECUTE format('CREATE POLICY steelwise_app ON public.%I FOR ALL TO %I USING (true) WITH CHECK (true)', t.tablename, app_role);
      RAISE NOTICE 'Added app policy on %', t.tablename;
    END;
  END LOOP;
END $fix$;

COMMIT;

-- Check: every row below should show the same owner.
SELECT tablename, tableowner FROM pg_tables WHERE schemaname = 'public' ORDER BY tableowner, tablename;
