-- STEELWISE database update for the Supabase SQL Editor.
-- Paste all of this into SQL Editor > New query and click Run.
-- It runs as one transaction: if anything fails, nothing changes.
-- Migrations already applied are skipped, so running it twice is safe.
-- Contains: 20261113220000_document_counters

BEGIN;

CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id"                  VARCHAR(36) PRIMARY KEY NOT NULL,
    "checksum"            VARCHAR(64) NOT NULL,
    "finished_at"         TIMESTAMPTZ,
    "migration_name"      VARCHAR(255) NOT NULL,
    "logs"                TEXT,
    "rolled_back_at"      TIMESTAMPTZ,
    "started_at"          TIMESTAMPTZ NOT NULL DEFAULT now(),
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0
);

-- 20261113220000_document_counters
DO $m_680d2629$
BEGIN
  IF EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20261113220000_document_counters' AND "finished_at" IS NOT NULL) THEN
    RAISE NOTICE 'Skipping 20261113220000_document_counters (already applied)';
    RETURN;
  END IF;
  EXECUTE $body_680d2629$-- Owner decision of 2026-11-13: invoice and credit memo numbers are never skipped and never repeated.
-- One new table that holds the last number used in each series. It is read and advanced inside the
-- same transaction that saves the invoice, so a save that fails gives its number back.
-- Nothing existing is changed. Numbers already issued keep whatever gaps they have.
CREATE TABLE IF NOT EXISTS "DocumentCounter" (
    "series" TEXT NOT NULL,
    "lastNumber" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentCounter_pkey" PRIMARY KEY ("series")
);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DocumentCounter_lastNumber_check') THEN
    ALTER TABLE "DocumentCounter" ADD CONSTRAINT "DocumentCounter_lastNumber_check" CHECK ("lastNumber" >= 0);
  END IF;
END $$;
-- Each series starts from the highest number already on file.
INSERT INTO "DocumentCounter" ("series", "lastNumber", "updatedAt")
SELECT v.p,
       COALESCE((SELECT MAX(substring(i."invoiceNumber" from '[0-9]+$')::bigint)
                   FROM "Invoice" i
                  WHERE i."invoiceNumber" ~ ('^' || v.p || '-[0-9]{1,9}$')), 0),
       CURRENT_TIMESTAMP
  FROM (VALUES ('INV'), ('CM')) AS v(p)
ON CONFLICT ("series") DO NOTHING;
$body_680d2629$;
  INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
  VALUES (gen_random_uuid()::text, '63e835ffa90e3f0610408b1513f7b3b4ad340e75386821f48819cc646eb46143', now(), '20261113220000_document_counters', 1);
END $m_680d2629$;

-- Row Level Security on every table (blocks Supabase's public API keys).
DO $rls$
DECLARE t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND NOT rowsecurity LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END $rls$;

-- Let the app in on every table; keep Supabase's anon/authenticated out.
DO $app$
DECLARE t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS steelwise_app ON public.%I', t.tablename);
    EXECUTE format(
      'CREATE POLICY steelwise_app ON public.%I FOR ALL TO PUBLIC '
      'USING (current_user NOT IN (''anon'', ''authenticated'')) '
      'WITH CHECK (current_user NOT IN (''anon'', ''authenticated''))',
      t.tablename);
  END LOOP;
END $app$;

COMMIT;
