-- CreateTable
CREATE TABLE "OnlineOrder" (
    "id" TEXT NOT NULL,
    "externalOrderId" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'ONLINE',
    "status" TEXT NOT NULL DEFAULT 'NEEDS_REVIEW',
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT,
    "customerId" TEXT,
    "items" JSONB NOT NULL DEFAULT '[]',
    "subtotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "shippingMethod" TEXT,
    "notes" TEXT,
    "holdReason" TEXT,
    "rejectReason" TEXT,
    "internalOrderId" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnlineOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OnlineOrder_externalOrderId_key" ON "OnlineOrder"("externalOrderId");

-- CreateIndex
CREATE INDEX "OnlineOrder_status_receivedAt_idx" ON "OnlineOrder"("status", "receivedAt");
