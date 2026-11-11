-- STEELWISE database update for the Supabase SQL Editor.
-- Paste all of this into SQL Editor > New query and click Run.
-- It runs as one transaction: if anything fails, nothing changes.
-- Migrations already applied are skipped, so running it twice is safe.
-- Contains: 20261111010902_orderhub_intake

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

-- 20261111010902_orderhub_intake
DO $m_3356909d$
BEGIN
  IF EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20261111010902_orderhub_intake' AND "finished_at" IS NOT NULL) THEN
    RAISE NOTICE 'Skipping 20261111010902_orderhub_intake (already applied)';
    RETURN;
  END IF;
  EXECUTE $body_3356909d$-- CreateTable
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
$body_3356909d$;
  INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
  VALUES (gen_random_uuid()::text, '4e2fa09e378985f1d3e23d18e19eca1c0c04b23082240857f216b4fc79a5dba1', now(), '20261111010902_orderhub_intake', 1);
END $m_3356909d$;

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
