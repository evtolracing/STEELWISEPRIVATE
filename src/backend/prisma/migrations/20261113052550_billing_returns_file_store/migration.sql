-- AlterTable
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
