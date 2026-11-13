-- STEELWISE database update for the Supabase SQL Editor.
-- Paste all of this into SQL Editor > New query and click Run.
-- It runs as one transaction: if anything fails, nothing changes.
-- Migrations already applied are skipped, so running it twice is safe.
-- Contains: 20261113212000_quote_branch

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

-- 20261113212000_quote_branch
DO $m_300bc703$
BEGIN
  IF EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20261113212000_quote_branch' AND "finished_at" IS NOT NULL) THEN
    RAISE NOTICE 'Skipping 20261113212000_quote_branch (already applied)';
    RETURN;
  END IF;
  EXECUTE $body_300bc703$-- Phase 3: the branch that owns a quote and a request for quotation (finding C-009,
-- owner's decision 2 of 2026-11-13: staff see and change only their own branch's records).
-- Adds one optional column to each table. Nothing is removed or rewritten.
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "locationId" TEXT;
ALTER TABLE "RFQ" ADD COLUMN IF NOT EXISTS "locationId" TEXT;
CREATE INDEX IF NOT EXISTS "Quote_locationId_idx" ON "Quote"("locationId");
CREATE INDEX IF NOT EXISTS "RFQ_locationId_idx" ON "RFQ"("locationId");
DO $fk$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RFQ_locationId_fkey') THEN
    ALTER TABLE "RFQ" ADD CONSTRAINT "RFQ_locationId_fkey"
      FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Quote_locationId_fkey') THEN
    ALTER TABLE "Quote" ADD CONSTRAINT "Quote_locationId_fkey"
      FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$fk$;

-- Existing quotes: the home branch of the person who wrote it. Existing requests: the branch
-- of their first quote. One with neither stays unassigned, and an unassigned quote or request
-- is seen by every branch, so nothing disappears from anyone's list.
UPDATE "Quote" q SET "locationId" = u."homeLocationId"
  FROM "User" u
 WHERE u.id = q."createdById" AND q."locationId" IS NULL AND u."homeLocationId" IS NOT NULL;
UPDATE "RFQ" r SET "locationId" = q."locationId"
  FROM (SELECT DISTINCT ON ("rfqId") "rfqId", "locationId" FROM "Quote" WHERE "locationId" IS NOT NULL ORDER BY "rfqId", "createdAt") q
 WHERE q."rfqId" = r.id AND r."locationId" IS NULL;
$body_300bc703$;
  INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
  VALUES (gen_random_uuid()::text, '54268f98357298dd2ea5e37f7bfc1c9159e3727e3888008f60ecd0400ffd8771', now(), '20261113212000_quote_branch', 1);
END $m_300bc703$;

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
