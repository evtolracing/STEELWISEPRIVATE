-- Phase 8: shipping, delivery and the cost of what is sold (findings N-004, N-015, N-017).
-- Adds three empty columns, one check and one index. Nothing is removed, and no existing row changes value.
--
-- 1. What one unit cost when it moved (N-017). Written from now on when material ships or comes back.
--    Movements already on file keep an empty cost: none is worked out after the fact.
ALTER TABLE "MaterialMovement" ADD COLUMN IF NOT EXISTS "unitCost" DECIMAL(18,6);

-- 2. Why a delivery has no name and no image (N-004).
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "noPodReason" TEXT;

-- 3. The branch a print job is for (N-015). Rows already on file stay visible to every branch.
ALTER TABLE "PrintQueueJob" ADD COLUMN IF NOT EXISTS "locationId" TEXT;
CREATE INDEX IF NOT EXISTS "PrintQueueJob_locationId_status_idx" ON "PrintQueueJob"("locationId", "status");

DO $p8$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MaterialMovement_unitCost_not_negative') THEN
    ALTER TABLE "MaterialMovement" ADD CONSTRAINT "MaterialMovement_unitCost_not_negative" CHECK ("unitCost" IS NULL OR "unitCost" >= 0);
  END IF;
END
$p8$;
