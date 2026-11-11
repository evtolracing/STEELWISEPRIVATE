-- STEELWISE database update for the Supabase SQL Editor.
-- Paste all of this into SQL Editor > New query and click Run.
-- It runs as one transaction: if anything fails, nothing changes.
-- Migrations already applied are skipped, so running it twice is safe.
-- Contains: 20261110221503_customer_addresses_and_executive, 20261111010902_orderhub_intake, 20261111012618_pos_sessions, 20261111021952_stop_work_events, 20261111022456_dispatch_divisions, 20261111022628_pipeline_runs

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
DO $m_644c6a08$
BEGIN
  IF EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20261110221503_customer_addresses_and_executive' AND "finished_at" IS NOT NULL) THEN
    RAISE NOTICE 'Skipping 20261110221503_customer_addresses_and_executive (already applied)';
    RETURN;
  END IF;
  EXECUTE $body_644c6a08$-- AlterTable
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
$body_644c6a08$;
  INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
  VALUES (gen_random_uuid()::text, 'df0f0666aaffd58edaac933a1d9a4c7aa7a4153d23ad4f93c1ef7eb58bb62fc1', now(), '20261110221503_customer_addresses_and_executive', 1);
END $m_644c6a08$;

-- 20261111010902_orderhub_intake
DO $m_374d28d9$
BEGIN
  IF EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20261111010902_orderhub_intake' AND "finished_at" IS NOT NULL) THEN
    RAISE NOTICE 'Skipping 20261111010902_orderhub_intake (already applied)';
    RETURN;
  END IF;
  EXECUTE $body_374d28d9$-- CreateTable
CREATE TABLE "IntakeContact" (
    "id" TEXT NOT NULL,
    "companyName" TEXT,
    "contactName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "billingAddress" TEXT,
    "shippingAddress" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntakeContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntakeRfq" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'EMAIL',
    "sourceRef" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "requestedByName" TEXT,
    "requestedByEmail" TEXT,
    "requestedDueDate" TEXT,
    "lines" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntakeRfq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntakeQuote" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT,
    "contactId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "validUntil" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "lines" JSONB NOT NULL DEFAULT '[]',
    "totalPrice" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntakeQuote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntakeOrder" (
    "id" TEXT NOT NULL,
    "contactId" TEXT,
    "quoteId" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'PHONE',
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "locationId" TEXT NOT NULL DEFAULT 'LOC-001',
    "division" TEXT,
    "requestedShipDate" TEXT,
    "promiseDate" TEXT,
    "lines" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntakeOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntakeJob" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderLineId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "division" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNING',
    "details" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntakeJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IntakeContact_email_key" ON "IntakeContact"("email");

-- CreateIndex
CREATE INDEX "IntakeContact_companyName_idx" ON "IntakeContact"("companyName");

-- CreateIndex
CREATE INDEX "IntakeRfq_status_createdAt_idx" ON "IntakeRfq"("status", "createdAt");

-- CreateIndex
CREATE INDEX "IntakeQuote_status_idx" ON "IntakeQuote"("status");

-- CreateIndex
CREATE INDEX "IntakeOrder_status_createdAt_idx" ON "IntakeOrder"("status", "createdAt");

-- CreateIndex
CREATE INDEX "IntakeJob_orderId_idx" ON "IntakeJob"("orderId");

-- CreateIndex
CREATE INDEX "IntakeJob_status_idx" ON "IntakeJob"("status");

-- AddForeignKey
ALTER TABLE "IntakeRfq" ADD CONSTRAINT "IntakeRfq_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "IntakeContact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntakeQuote" ADD CONSTRAINT "IntakeQuote_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "IntakeRfq"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntakeQuote" ADD CONSTRAINT "IntakeQuote_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "IntakeContact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntakeOrder" ADD CONSTRAINT "IntakeOrder_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "IntakeContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntakeOrder" ADD CONSTRAINT "IntakeOrder_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "IntakeQuote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntakeJob" ADD CONSTRAINT "IntakeJob_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "IntakeOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
$body_374d28d9$;
  INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
  VALUES (gen_random_uuid()::text, '4e2fa09e378985f1d3e23d18e19eca1c0c04b23082240857f216b4fc79a5dba1', now(), '20261111010902_orderhub_intake', 1);
END $m_374d28d9$;

-- 20261111012618_pos_sessions
DO $m_7b4ea28a$
BEGIN
  IF EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20261111012618_pos_sessions' AND "finished_at" IS NOT NULL) THEN
    RAISE NOTICE 'Skipping 20261111012618_pos_sessions (already applied)';
    RETURN;
  END IF;
  EXECUTE $body_7b4ea28a$-- CreateTable
CREATE TABLE "PosSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "terminalId" TEXT,
    "currentState" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "version" INTEGER NOT NULL DEFAULT 1,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PosSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PosSession_status_updatedAt_idx" ON "PosSession"("status", "updatedAt");
$body_7b4ea28a$;
  INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
  VALUES (gen_random_uuid()::text, '377d2f5bdf3dcc5e272bb031245bed232d5c8b8367c047b02d741393b5e221c8', now(), '20261111012618_pos_sessions', 1);
END $m_7b4ea28a$;

-- 20261111021952_stop_work_events
DO $m_555010cd$
BEGIN
  IF EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20261111021952_stop_work_events' AND "finished_at" IS NOT NULL) THEN
    RAISE NOTICE 'Skipping 20261111021952_stop_work_events (already applied)';
    RETURN;
  END IF;
  EXECUTE $body_555010cd$-- CreateTable
CREATE TABLE "StopWorkEvent" (
    "id" TEXT NOT NULL,
    "eventNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "scopeType" TEXT NOT NULL,
    "scopeId" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "initiatedAt" TIMESTAMP(3) NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StopWorkEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StopWorkAudit" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StopWorkAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StopWorkStep" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StopWorkStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StopWorkEvidence" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StopWorkEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StopWorkEvent_eventNumber_key" ON "StopWorkEvent"("eventNumber");

-- CreateIndex
CREATE INDEX "StopWorkEvent_status_idx" ON "StopWorkEvent"("status");

-- CreateIndex
CREATE INDEX "StopWorkEvent_initiatedAt_idx" ON "StopWorkEvent"("initiatedAt");

-- CreateIndex
CREATE INDEX "StopWorkAudit_eventId_performedAt_idx" ON "StopWorkAudit"("eventId", "performedAt");

-- CreateIndex
CREATE INDEX "StopWorkStep_eventId_idx" ON "StopWorkStep"("eventId");

-- CreateIndex
CREATE INDEX "StopWorkEvidence_eventId_idx" ON "StopWorkEvidence"("eventId");
$body_555010cd$;
  INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
  VALUES (gen_random_uuid()::text, '2f40b0d00f93f20d974320713c1b9b510757bab1b10ff1ac338d29c6eeca08c8', now(), '20261111021952_stop_work_events', 1);
END $m_555010cd$;

-- 20261111022456_dispatch_divisions
DO $m_3a0981aa$
BEGIN
  IF EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20261111022456_dispatch_divisions' AND "finished_at" IS NOT NULL) THEN
    RAISE NOTICE 'Skipping 20261111022456_dispatch_divisions (already applied)';
    RETURN;
  END IF;
  EXECUTE $body_3a0981aa$-- CreateTable
CREATE TABLE "DispatchDivision" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#666',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DispatchDivision_pkey" PRIMARY KEY ("id")
);
$body_3a0981aa$;
  INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
  VALUES (gen_random_uuid()::text, '0833be709a3e4bdaaa9c7184c629f4d56209e5d0e530ebc7edd2b3a099ab37fa', now(), '20261111022456_dispatch_divisions', 1);
END $m_3a0981aa$;

-- 20261111022628_pipeline_runs
DO $m_65b7e501$
BEGIN
  IF EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20261111022628_pipeline_runs' AND "finished_at" IS NOT NULL) THEN
    RAISE NOTICE 'Skipping 20261111022628_pipeline_runs (already applied)';
    RETURN;
  END IF;
  EXECUTE $body_65b7e501$-- CreateTable
CREATE TABLE "PipelineRun" (
    "id" TEXT NOT NULL,
    "currentStage" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PipelineRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PipelineRun_currentStage_idx" ON "PipelineRun"("currentStage");

-- CreateIndex
CREATE INDEX "PipelineRun_updatedAt_idx" ON "PipelineRun"("updatedAt");
$body_65b7e501$;
  INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
  VALUES (gen_random_uuid()::text, 'bec159fd57bef3160f9156b7a1633bbec3eceeab37ace51d61d071b057b6aded', now(), '20261111022628_pipeline_runs', 1);
END $m_65b7e501$;

-- Row Level Security on every table (blocks Supabase's public API keys;
-- the app connects as the table owner and is not affected).
DO $rls$
DECLARE t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND NOT rowsecurity LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END $rls$;

COMMIT;
