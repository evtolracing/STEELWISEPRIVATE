-- Phase 7, the owner's decisions of 2026-11-15 (findings L-020, L-021, L-022, L-024, L-026, L-028, K-007).
-- Adds columns, checks and indexes only. Nothing is removed, and no existing row changes value.
--
-- 1. A coil work order can name the job it was raised for (L-024), so a job knows its material, scrap and yield.
ALTER TABLE "WorkOrder" ADD COLUMN IF NOT EXISTS "jobId" TEXT;
CREATE INDEX IF NOT EXISTS "WorkOrder_jobId_idx" ON "WorkOrder"("jobId");

-- 2. A rework step names the failed inspection it answers (L-020).
ALTER TABLE "DispatchOperation" ADD COLUMN IF NOT EXISTS "reworkOfInspectionId" TEXT;
CREATE INDEX IF NOT EXISTS "DispatchOperation_reworkOfInspectionId_idx" ON "DispatchOperation"("reworkOfInspectionId");

-- 3. Every job is inspected unless its routing says otherwise (L-021). Existing routings keep inspection on.
ALTER TABLE "BomRecipe" ADD COLUMN IF NOT EXISTS "inspectionRequired" BOOLEAN NOT NULL DEFAULT true;

-- 4. Rules and rates per kind of work center (L-022, L-026, L-028). All off or empty until someone sets them.
ALTER TABLE "WorkCenterType" ADD COLUMN IF NOT EXISTS "certificationRequired" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "WorkCenterType" ADD COLUMN IF NOT EXISTS "allowsConcurrentSteps" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "WorkCenterType" ADD COLUMN IF NOT EXISTS "hourlyRate" DECIMAL(12,2);
ALTER TABLE "WorkCenterType" ADD COLUMN IF NOT EXISTS "inspectionChecklist" JSONB;

DO $p7$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WorkOrder_jobId_fkey') THEN
    ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DispatchOperation_reworkOfInspectionId_fkey') THEN
    ALTER TABLE "DispatchOperation" ADD CONSTRAINT "DispatchOperation_reworkOfInspectionId_fkey" FOREIGN KEY ("reworkOfInspectionId") REFERENCES "JobInspection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WorkCenterType_hourlyRate_not_negative') THEN
    ALTER TABLE "WorkCenterType" ADD CONSTRAINT "WorkCenterType_hourlyRate_not_negative" CHECK ("hourlyRate" IS NULL OR "hourlyRate" >= 0);
  END IF;
END
$p7$;
