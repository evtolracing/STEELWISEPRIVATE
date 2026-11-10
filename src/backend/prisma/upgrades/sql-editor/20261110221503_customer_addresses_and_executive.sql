-- STEELWISE database update for the Supabase SQL Editor.
-- Paste all of this into SQL Editor > New query and click Run.
-- It runs as one transaction: if anything fails, nothing changes.
-- Migrations already applied are skipped, so running it twice is safe.
-- Contains: 20261110221503_customer_addresses_and_executive

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

-- 20261110221503_customer_addresses_and_executive
DO $m_45bbbc7a$
BEGIN
  IF EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20261110221503_customer_addresses_and_executive' AND "finished_at" IS NOT NULL) THEN
    RAISE NOTICE 'Skipping 20261110221503_customer_addresses_and_executive (already applied)';
    RETURN;
  END IF;
  EXECUTE $body_45bbbc7a$-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "parentId" TEXT,
ADD COLUMN     "paymentTerms" TEXT,
ADD COLUMN     "taxExempt" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "addressType" TEXT NOT NULL DEFAULT 'SHIPPING',
    "addressName" TEXT,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'USA',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "shared" BOOLEAN NOT NULL DEFAULT false,
    "allDivisions" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimulationScenario" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdById" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "changes" JSONB NOT NULL DEFAULT '[]',
    "baseline" JSONB,
    "results" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SimulationScenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForecastSnapshot" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "horizon" TEXT NOT NULL,
    "createdById" TEXT,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForecastSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecutiveDecision" (
    "id" TEXT NOT NULL,
    "decisionNumber" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "decisionMaker" TEXT,
    "role" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "scenarioId" TEXT,
    "predictedOutcome" JSONB,
    "actualOutcome" JSONB,
    "variance" JSONB,
    "conditions" JSONB NOT NULL DEFAULT '[]',
    "aiRecommendation" TEXT,
    "aiConfidence" INTEGER,
    "outcomeRecordedAt" TIMESTAMP(3),
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExecutiveDecision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Address_organizationId_addressType_idx" ON "Address"("organizationId", "addressType");

-- CreateIndex
CREATE INDEX "SimulationScenario_createdById_idx" ON "SimulationScenario"("createdById");

-- CreateIndex
CREATE INDEX "ForecastSnapshot_category_createdAt_idx" ON "ForecastSnapshot"("category", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExecutiveDecision_decisionNumber_key" ON "ExecutiveDecision"("decisionNumber");

-- CreateIndex
CREATE INDEX "ExecutiveDecision_type_decidedAt_idx" ON "ExecutiveDecision"("type", "decidedAt");

-- CreateIndex
CREATE INDEX "ExecutiveDecision_status_idx" ON "ExecutiveDecision"("status");

-- CreateIndex
CREATE INDEX "Organization_parentId_idx" ON "Organization"("parentId");

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
$body_45bbbc7a$;
  INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
  VALUES (gen_random_uuid()::text, 'df0f0666aaffd58edaac933a1d9a4c7aa7a4153d23ad4f93c1ef7eb58bb62fc1', now(), '20261110221503_customer_addresses_and_executive', 1);
END $m_45bbbc7a$;

COMMIT;
