-- STEELWISE database update for the Supabase SQL Editor.
-- Paste all of this into SQL Editor > New query and click Run.
-- It runs as one transaction: if anything fails, nothing changes.
-- Migrations already applied are skipped, so running it twice is safe.
-- Contains: 20261111043052_remnants

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

-- 20261111043052_remnants
DO $m_a5fa56c7$
BEGIN
  IF EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20261111043052_remnants' AND "finished_at" IS NOT NULL) THEN
    RAISE NOTICE 'Skipping 20261111043052_remnants (already applied)';
    RETURN;
  END IF;
  EXECUTE $body_a5fa56c7$-- CreateTable
CREATE TABLE "Remnant" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "spec" TEXT,
    "form" TEXT NOT NULL,
    "family" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'DROP',
    "condition" TEXT NOT NULL DEFAULT 'A',
    "thickness" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "width" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "length" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "uom" TEXT NOT NULL DEFAULT 'IN',
    "estimatedWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pricePerLb" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "location" TEXT NOT NULL,
    "locationName" TEXT,
    "heatNumber" TEXT,
    "parentJobId" TEXT,
    "cutDate" TIMESTAMP(3),
    "receivedDate" TIMESTAMP(3),
    "qtyAvailable" INTEGER NOT NULL DEFAULT 1,
    "reserved" BOOLEAN NOT NULL DEFAULT false,
    "reservedFor" TEXT,
    "reservedAt" TIMESTAMP(3),
    "imageUrl" TEXT,
    "notes" TEXT,
    "division" TEXT NOT NULL DEFAULT 'OUTLET',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Remnant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Remnant_sku_key" ON "Remnant"("sku");

-- CreateIndex
CREATE INDEX "Remnant_grade_form_idx" ON "Remnant"("grade", "form");

-- CreateIndex
CREATE INDEX "Remnant_location_idx" ON "Remnant"("location");

-- CreateIndex
CREATE INDEX "Remnant_cutDate_idx" ON "Remnant"("cutDate");
$body_a5fa56c7$;
  INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
  VALUES (gen_random_uuid()::text, 'af3d2ce953f54d58dbcb6e510abf6c312fa583207bd4043ec95593e65e4d18f2', now(), '20261111043052_remnants', 1);
END $m_a5fa56c7$;

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
