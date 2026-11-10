-- AlterTable
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
