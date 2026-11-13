-- STEELWISE database update for the Supabase SQL Editor.
-- Paste all of this into SQL Editor > New query and click Run.
-- It runs as one transaction: if anything fails, nothing changes.
-- Migrations already applied are skipped, so running it twice is safe.
-- Contains: 20261113052550_billing_returns_file_store

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

-- 20261113052550_billing_returns_file_store
DO $m_59223900$
BEGIN
  IF EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20261113052550_billing_returns_file_store' AND "finished_at" IS NOT NULL) THEN
    RAISE NOTICE 'Skipping 20261113052550_billing_returns_file_store (already applied)';
    RETURN;
  END IF;
  EXECUTE $body_59223900$-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "creditOfInvoiceId" TEXT,
ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'INVOICE',
ADD COLUMN     "shipmentId" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "returnOfOrderId" TEXT;

-- AlterTable
ALTER TABLE "OrderLine" ADD COLUMN     "returnDisposition" TEXT,
ADD COLUMN     "returnOfLineId" TEXT;

-- CreateTable
CREATE TABLE "InvoiceLine" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "orderLineId" TEXT,
    "lineNumber" INTEGER NOT NULL,
    "description" TEXT,
    "quantity" DECIMAL(65,30) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'LB',
    "unitPrice" DECIMAL(65,30),
    "priceUnit" TEXT,
    "extendedPrice" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentBlob" (
    "documentId" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentBlob_pkey" PRIMARY KEY ("documentId")
);

-- CreateIndex
CREATE INDEX "InvoiceLine_invoiceId_idx" ON "InvoiceLine"("invoiceId");

-- CreateIndex
CREATE INDEX "InvoiceLine_orderLineId_idx" ON "InvoiceLine"("orderLineId");

-- CreateIndex
CREATE INDEX "Invoice_orderId_idx" ON "Invoice"("orderId");

-- CreateIndex
CREATE INDEX "Invoice_shipmentId_idx" ON "Invoice"("shipmentId");

-- CreateIndex
CREATE INDEX "Invoice_creditOfInvoiceId_idx" ON "Invoice"("creditOfInvoiceId");

-- CreateIndex
CREATE INDEX "Order_returnOfOrderId_idx" ON "Order"("returnOfOrderId");

-- CreateIndex
CREATE INDEX "OrderLine_returnOfLineId_idx" ON "OrderLine"("returnOfLineId");

-- AddForeignKey
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentBlob" ADD CONSTRAINT "DocumentBlob_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
$body_59223900$;
  INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
  VALUES (gen_random_uuid()::text, '3d4509cab14bfa53ffb7cb7ba9c8e2fc79f1ac0b0b27d9ef74789b8d95c23f91', now(), '20261113052550_billing_returns_file_store', 1);
END $m_59223900$;

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
