-- STEELWISE fix: let the app use every table while Supabase's public API
-- stays blocked. Paste all of this into Supabase > SQL Editor > New query
-- and click Run. Safe to run more than once.
--
-- Row Level Security is on for every table. This adds one policy per
-- table that allows any database role EXCEPT Supabase's public API roles
-- (anon and authenticated). The app's own connection is let in whatever
-- its role is called; requests made with the anon key still see nothing.

BEGIN;

DO $fix$
DECLARE t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
    EXECUTE format('DROP POLICY IF EXISTS steelwise_app ON public.%I', t.tablename);
    EXECUTE format(
      'CREATE POLICY steelwise_app ON public.%I FOR ALL TO PUBLIC '
      'USING (current_user NOT IN (''anon'', ''authenticated'')) '
      'WITH CHECK (current_user NOT IN (''anon'', ''authenticated''))',
      t.tablename);
  END LOOP;
END $fix$;

COMMIT;

-- Check: every table should be listed with rls_on = true and has_policy = true.
SELECT t.tablename, t.tableowner, t.rowsecurity AS rls_on,
       EXISTS (SELECT 1 FROM pg_policies p WHERE p.schemaname = 'public' AND p.tablename = t.tablename AND p.policyname = 'steelwise_app') AS has_policy
FROM pg_tables t WHERE t.schemaname = 'public' ORDER BY t.tablename;
