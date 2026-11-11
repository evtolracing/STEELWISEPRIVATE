-- CreateTable
CREATE TABLE "InventoryCatalogItem" (
    "materialCode" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryCatalogItem_pkey" PRIMARY KEY ("materialCode")
);

-- CreateTable
CREATE TABLE "InventorySite" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "parentId" TEXT,
    "data" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventorySite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryUnit" (
    "id" TEXT NOT NULL,
    "materialCode" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "rfidTagId" TEXT,
    "etchedId" TEXT,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryTransfer" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RfidScanEvent" (
    "id" TEXT NOT NULL,
    "rfidTagId" TEXT NOT NULL,
    "inventoryId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "RfidScanEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryAdjustment" (
    "id" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InventoryUnit_locationId_materialCode_idx" ON "InventoryUnit"("locationId", "materialCode");

-- CreateIndex
CREATE INDEX "InventoryUnit_rfidTagId_idx" ON "InventoryUnit"("rfidTagId");

-- CreateIndex
CREATE INDEX "InventoryUnit_etchedId_idx" ON "InventoryUnit"("etchedId");

-- CreateIndex
CREATE INDEX "InventoryTransfer_status_idx" ON "InventoryTransfer"("status");

-- CreateIndex
CREATE INDEX "RfidScanEvent_rfidTagId_occurredAt_idx" ON "RfidScanEvent"("rfidTagId", "occurredAt");

-- CreateIndex
CREATE INDEX "RfidScanEvent_inventoryId_idx" ON "RfidScanEvent"("inventoryId");

-- CreateIndex
CREATE INDEX "InventoryAdjustment_inventoryId_idx" ON "InventoryAdjustment"("inventoryId");
