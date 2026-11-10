-- Converts list columns created by the old schema (Postgres arrays such as
-- text[]) to jsonb, which is what the schema now uses so it also works on
-- MySQL. Existing values are kept: {a,b} becomes ["a","b"] and NULL becomes [].
--
-- Safe to run more than once: it only touches columns that are still arrays.
-- Run it on a backed-up database, before applying the rest of the diff.
-- See docs/DATABASE_MIGRATIONS.md.
DO $$
DECLARE
  col record;
BEGIN
  FOR col IN
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND data_type = 'ARRAY'
    ORDER BY table_name, column_name
  LOOP
    RAISE NOTICE 'Converting %.% to jsonb', col.table_name, col.column_name;
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I DROP DEFAULT', col.table_name, col.column_name);
    EXECUTE format(
      'ALTER TABLE public.%I ALTER COLUMN %I TYPE jsonb USING COALESCE(to_jsonb(%I), ''[]''::jsonb)',
      col.table_name, col.column_name, col.column_name
    );
    EXECUTE format('UPDATE public.%I SET %I = ''[]''::jsonb WHERE %I IS NULL', col.table_name, col.column_name, col.column_name);
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I SET DEFAULT ''[]''::jsonb', col.table_name, col.column_name);
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I SET NOT NULL', col.table_name, col.column_name);
  END LOOP;
END $$;
