-- STEELWISE database update for the Supabase SQL Editor.
-- Paste all of this into SQL Editor > New query and click Run.
-- It runs as one transaction: if anything fails, nothing changes.
-- Migrations already applied are skipped, so running it twice is safe.
-- Contains: 20261122090000_location_details

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

-- 20261122090000_location_details
DO $m_bbc63a1f$
BEGIN
  IF EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20261122090000_location_details' AND "finished_at" IS NOT NULL) THEN
    RAISE NOTICE 'Skipping 20261122090000_location_details (already applied)';
    RETURN;
  END IF;
  EXECUTE $body_bbc63a1f$-- Locations become records a person can manage (owner's request, 2026-11-22): contact details, hours, manager,
-- divisions, processes, and a mark for a real branch as opposed to a storage area inside one.
-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "addressLine2" TEXT,
ADD COLUMN     "deactivatedAt" TIMESTAMP(3),
ADD COLUMN     "divisions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "email" TEXT,
ADD COLUMN     "fax" TEXT,
ADD COLUMN     "hours" TEXT,
ADD COLUMN     "isBranch" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "managerId" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "processes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "sellsFrom" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "shipsFrom" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "squareFeet" INTEGER,
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'America/Detroit';

-- CreateIndex
CREATE INDEX "Location_managerId_idx" ON "Location"("managerId");

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Mark the real branches: a top-level warehouse or yard, or any top-level location that already has
-- orders, people, machines or plans. Storage areas inside a branch (racks, bins, floors) are not branches.
UPDATE "Location" l SET "isBranch" = true
WHERE l."parentId" IS NULL AND (
  l."type" IN ('WAREHOUSE', 'YARD')
  OR EXISTS (SELECT 1 FROM "Order" o WHERE o."locationId" = l."id")
  OR EXISTS (SELECT 1 FROM "User" u WHERE u."homeLocationId" = l."id")
  OR EXISTS (SELECT 1 FROM "UserLocation" ul WHERE ul."locationId" = l."id")
  OR EXISTS (SELECT 1 FROM "WorkCenter" w WHERE w."locationId" = l."id")
  OR EXISTS (SELECT 1 FROM "DispatchJob" d WHERE d."locationId" = l."id")
);
-- A location already switched off keeps the day it was found so.
UPDATE "Location" SET "deactivatedAt" = "updatedAt" WHERE "isActive" = false AND "deactivatedAt" IS NULL;
$body_bbc63a1f$;
  INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
  VALUES (gen_random_uuid()::text, 'fd9a3366e8f5aa6ce9c0208c5197c8134e55ff2f204d3a7d8e93dfcc2771a149', now(), '20261122090000_location_details', 1);
END $m_bbc63a1f$;

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
