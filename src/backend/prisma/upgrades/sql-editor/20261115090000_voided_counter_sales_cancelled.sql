-- STEELWISE database update for the Supabase SQL Editor.
-- Paste all of this into SQL Editor > New query and click Run.
-- It runs as one transaction: if anything fails, nothing changes.
-- Migrations already applied are skipped, so running it twice is safe.
-- Contains: 20261115090000_voided_counter_sales_cancelled

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

-- 20261115090000_voided_counter_sales_cancelled
DO $m_1a3ee2a6$
BEGIN
  IF EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20261115090000_voided_counter_sales_cancelled' AND "finished_at" IS NOT NULL) THEN
    RAISE NOTICE 'Skipping 20261115090000_voided_counter_sales_cancelled (already applied)';
    RETURN;
  END IF;
  EXECUTE $body_1a3ee2a6$-- A voided counter quick sale is a cancelled order (finding G-009).
-- Until now a void wrote "VOIDED: <reason>" into the order's notes and left the order COMPLETE,
-- so every report by order status counted the sale. From this change the void also sets the
-- status to CANCELLED; this statement does the same for sales voided before it.
-- Nothing is removed: the notes, the invoice, the credit memo and the refund all stay.
-- Running it a second time changes nothing.
UPDATE "Order"
SET "status" = 'CANCELLED', "updatedAt" = now()
WHERE "poReference" LIKE 'QS:%'
  AND "notes" LIKE '%VOIDED:%'
  AND "status" <> 'CANCELLED';
$body_1a3ee2a6$;
  INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
  VALUES (gen_random_uuid()::text, 'ac75c1f56c14d985b28ae8ea0ae387c2a5248d3cd69bb6f6460a2f65049a2285', now(), '20261115090000_voided_counter_sales_cancelled', 1);
END $m_1a3ee2a6$;

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
