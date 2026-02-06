-- CreateEnum
CREATE TYPE "RFQSourceType" AS ENUM ('EMAIL', 'PHONE', 'PORTAL', 'EDI', 'MANUAL', 'ECOMMERCE');

-- CreateEnum
CREATE TYPE "DropTagStatus" AS ENUM ('DRAFT', 'READY_TO_PRINT', 'PRINTED', 'APPLIED', 'SEALED', 'STAGED', 'LOADED', 'SHIPPED', 'DELIVERED', 'VOID');

-- CreateEnum
CREATE TYPE "DropTagListingStatus" AS ENUM ('DRAFT', 'READY', 'PRINTED', 'LOADED', 'DEPARTED', 'DELIVERED', 'CLOSED');

-- CreateEnum
CREATE TYPE "PackageStatus" AS ENUM ('OPEN', 'PACKING', 'READY_FOR_QC', 'QC_RELEASED', 'QC_HOLD', 'SEALED', 'STAGED', 'LOADED', 'SHIPPED', 'DELIVERED');

-- CreateEnum
CREATE TYPE "PackageQCStatus" AS ENUM ('PENDING', 'RELEASED', 'CONDITIONAL', 'HOLD', 'REJECTED');

-- CreateEnum
CREATE TYPE "IdentifierType" AS ENUM ('BARCODE', 'QR', 'RFID', 'ETCH', 'DATAMATRIX');

-- CreateTable
CREATE TABLE "CustomerPricingTier" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "tierCode" TEXT NOT NULL,
    "marginFloor" DECIMAL(65,30) NOT NULL,
    "marginTarget" DECIMAL(65,30) NOT NULL,
    "discountMaxPct" DECIMAL(65,30),
    "paymentTerms" TEXT,
    "freightTerms" TEXT,
    "creditLimit" DECIMAL(65,30),
    "creditRating" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveUntil" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerPricingTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingRecommendation" (
    "id" TEXT NOT NULL,
    "quoteLineId" TEXT,
    "rfqLineId" TEXT,
    "productCode" TEXT,
    "grade" TEXT,
    "form" TEXT,
    "dimensions" JSONB,
    "quantity" DECIMAL(65,30) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'LB',
    "materialCost" DECIMAL(65,30),
    "processingCost" DECIMAL(65,30),
    "laborCost" DECIMAL(65,30),
    "freightCost" DECIMAL(65,30),
    "yieldLossCost" DECIMAL(65,30),
    "packagingCost" DECIMAL(65,30),
    "overheadCost" DECIMAL(65,30),
    "totalCost" DECIMAL(65,30),
    "recommendedPrice" DECIMAL(65,30) NOT NULL,
    "minimumPrice" DECIMAL(65,30),
    "listPrice" DECIMAL(65,30),
    "marginPct" DECIMAL(65,30),
    "confidenceScore" DECIMAL(65,30),
    "customerId" TEXT,
    "customerTier" TEXT,
    "locationId" TEXT,
    "inventorySource" TEXT,
    "leadTimeDays" INTEGER,
    "alternatives" JSONB,
    "pricingModel" TEXT,
    "modelInputs" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PricingRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingOverride" (
    "id" TEXT NOT NULL,
    "quoteLineId" TEXT,
    "quoteId" TEXT,
    "originalPrice" DECIMAL(65,30) NOT NULL,
    "overridePrice" DECIMAL(65,30) NOT NULL,
    "originalMargin" DECIMAL(65,30),
    "overrideMargin" DECIMAL(65,30),
    "reason" TEXT NOT NULL,
    "justification" TEXT,
    "requestedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteAcceptance" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedBy" TEXT,
    "acceptedByEmail" TEXT,
    "customerPO" TEXT,
    "termsAccepted" BOOLEAN NOT NULL DEFAULT true,
    "signatureData" TEXT,
    "ipAddress" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteAcceptance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RFQSource" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "sourceType" "RFQSourceType" NOT NULL,
    "sourceChannel" TEXT,
    "rawContent" TEXT,
    "parsedData" JSONB,
    "parsingConfidence" DECIMAL(65,30),
    "parseErrors" JSONB,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RFQSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingAnalytics" (
    "id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "customerId" TEXT,
    "productCategory" TEXT,
    "locationId" TEXT,
    "quotesCreated" INTEGER NOT NULL DEFAULT 0,
    "quotesWon" INTEGER NOT NULL DEFAULT 0,
    "quotesLost" INTEGER NOT NULL DEFAULT 0,
    "winRate" DECIMAL(65,30),
    "avgMarginQuoted" DECIMAL(65,30),
    "avgMarginWon" DECIMAL(65,30),
    "avgResponseHours" DECIMAL(65,30),
    "avgCycleTimeDays" DECIMAL(65,30),
    "totalValueQuoted" DECIMAL(65,30),
    "totalValueWon" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DropTag" (
    "id" TEXT NOT NULL,
    "dropTagId" TEXT NOT NULL,
    "tenantId" TEXT,
    "packageId" TEXT NOT NULL,
    "shipmentId" TEXT,
    "listingId" TEXT,
    "orderId" TEXT NOT NULL,
    "orderLineId" TEXT NOT NULL,
    "jobId" TEXT,
    "customerId" TEXT NOT NULL,
    "customerPO" TEXT,
    "customerPartNo" TEXT,
    "division" TEXT NOT NULL,
    "form" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "specification" TEXT,
    "condition" TEXT,
    "dimensions" JSONB NOT NULL,
    "lengthInches" DECIMAL(65,30),
    "lengthFeet" DECIMAL(65,30),
    "heatNumber" TEXT,
    "lotId" TEXT,
    "inventoryLotId" TEXT,
    "supplierId" TEXT,
    "mtrDocId" TEXT,
    "cocDocId" TEXT,
    "pieces" INTEGER NOT NULL,
    "weightLbs" DECIMAL(65,30) NOT NULL,
    "uom" TEXT NOT NULL DEFAULT 'EA',
    "workCenters" TEXT[],
    "operationsSummary" TEXT,
    "completedAt" TIMESTAMP(3),
    "operatorIds" TEXT[],
    "bundleType" TEXT,
    "packagingNotes" TEXT,
    "specialInstructions" TEXT,
    "shipToAddress" JSONB,
    "routeStop" INTEGER,
    "requiredDate" TIMESTAMP(3),
    "status" "DropTagStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "reprintCount" INTEGER NOT NULL DEFAULT 0,
    "lastReprintReason" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "printedBy" TEXT,
    "printedAt" TIMESTAMP(3),
    "appliedBy" TEXT,
    "appliedAt" TIMESTAMP(3),
    "sealedAt" TIMESTAMP(3),
    "voidedBy" TEXT,
    "voidedAt" TIMESTAMP(3),
    "voidReason" TEXT,

    CONSTRAINT "DropTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DropTagListing" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "tenantId" TEXT,
    "shipmentId" TEXT NOT NULL,
    "originLocationId" TEXT NOT NULL,
    "routeId" TEXT,
    "loadId" TEXT,
    "stopSequence" JSONB NOT NULL,
    "totalPackages" INTEGER NOT NULL DEFAULT 0,
    "totalPieces" INTEGER NOT NULL DEFAULT 0,
    "totalWeightLbs" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "cocBundleId" TEXT,
    "mtrBundleId" TEXT,
    "packingListDocId" TEXT,
    "status" "DropTagListingStatus" NOT NULL DEFAULT 'DRAFT',
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "departedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "podDocId" TEXT,
    "podSignature" TEXT,
    "podSignedBy" TEXT,
    "podSignedAt" TIMESTAMP(3),

    CONSTRAINT "DropTagListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Package" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "tenantId" TEXT,
    "status" "PackageStatus" NOT NULL DEFAULT 'OPEN',
    "sealId" TEXT,
    "sealType" TEXT,
    "sealAppliedBy" TEXT,
    "sealAppliedAt" TIMESTAMP(3),
    "packageType" TEXT NOT NULL,
    "dimensions" JSONB,
    "tareWeightLbs" DECIMAL(65,30),
    "grossWeightLbs" DECIMAL(65,30),
    "netWeightLbs" DECIMAL(65,30),
    "currentLocationId" TEXT,
    "currentBinId" TEXT,
    "orderId" TEXT,
    "orderLineId" TEXT,
    "jobId" TEXT,
    "qcStatus" "PackageQCStatus" NOT NULL DEFAULT 'PENDING',
    "qcReleasedBy" TEXT,
    "qcReleasedAt" TIMESTAMP(3),
    "qcNotes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "packedAt" TIMESTAMP(3),
    "stagedAt" TIMESTAMP(3),
    "loadedAt" TIMESTAMP(3),
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackageItem" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "inventoryLotId" TEXT,
    "coilId" TEXT,
    "heatNumber" TEXT,
    "grade" TEXT NOT NULL,
    "form" TEXT NOT NULL,
    "dimensions" JSONB NOT NULL,
    "specification" TEXT,
    "condition" TEXT,
    "pieces" INTEGER NOT NULL,
    "weightLbs" DECIMAL(65,30) NOT NULL,
    "lengthFeet" DECIMAL(65,30),
    "pieceMarks" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PackageItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TagIdentifier" (
    "id" TEXT NOT NULL,
    "dropTagId" TEXT NOT NULL,
    "identifierType" "IdentifierType" NOT NULL,
    "identifierValue" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TagIdentifier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabelTemplate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "templateType" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "widthInches" DECIMAL(65,30) NOT NULL,
    "heightInches" DECIMAL(65,30) NOT NULL,
    "templateContent" TEXT NOT NULL,
    "barcodeType" TEXT NOT NULL DEFAULT 'QR',
    "barcodePosition" JSONB NOT NULL,
    "customerId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabelTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TraceEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventCategory" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "actorName" TEXT,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "previousState" TEXT,
    "newState" TEXT,
    "locationId" TEXT,
    "stationId" TEXT,
    "beforeSnapshot" JSONB,
    "afterSnapshot" JSONB,
    "metadata" JSONB,
    "correlationId" TEXT,
    "orderId" TEXT,
    "shipmentId" TEXT,
    "dropTagId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventHash" TEXT,
    "previousHash" TEXT,

    CONSTRAINT "TraceEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerTagRequirement" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "requireHeatNumber" BOOLEAN NOT NULL DEFAULT true,
    "requireMtrReference" BOOLEAN NOT NULL DEFAULT true,
    "requireCocReference" BOOLEAN NOT NULL DEFAULT true,
    "requirePieceMarks" BOOLEAN NOT NULL DEFAULT false,
    "requireCustomerPartNo" BOOLEAN NOT NULL DEFAULT false,
    "requireCustomerPO" BOOLEAN NOT NULL DEFAULT true,
    "requireSpecification" BOOLEAN NOT NULL DEFAULT true,
    "requireCountryOfOrigin" BOOLEAN NOT NULL DEFAULT false,
    "templateCode" TEXT,
    "barcodeType" TEXT,
    "includeQRCode" BOOLEAN NOT NULL DEFAULT true,
    "allowMixedHeat" BOOLEAN NOT NULL DEFAULT false,
    "allowMixedLength" BOOLEAN NOT NULL DEFAULT false,
    "requireCertPerHeat" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerTagRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomerPricingTier_customerId_key" ON "CustomerPricingTier"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "QuoteAcceptance_quoteId_key" ON "QuoteAcceptance"("quoteId");

-- CreateIndex
CREATE UNIQUE INDEX "RFQSource_rfqId_key" ON "RFQSource"("rfqId");

-- CreateIndex
CREATE UNIQUE INDEX "PricingAnalytics_period_customerId_productCategory_location_key" ON "PricingAnalytics"("period", "customerId", "productCategory", "locationId");

-- CreateIndex
CREATE UNIQUE INDEX "DropTag_dropTagId_key" ON "DropTag"("dropTagId");

-- CreateIndex
CREATE INDEX "DropTag_packageId_idx" ON "DropTag"("packageId");

-- CreateIndex
CREATE INDEX "DropTag_shipmentId_idx" ON "DropTag"("shipmentId");

-- CreateIndex
CREATE INDEX "DropTag_orderId_idx" ON "DropTag"("orderId");

-- CreateIndex
CREATE INDEX "DropTag_customerId_idx" ON "DropTag"("customerId");

-- CreateIndex
CREATE INDEX "DropTag_heatNumber_idx" ON "DropTag"("heatNumber");

-- CreateIndex
CREATE INDEX "DropTag_status_idx" ON "DropTag"("status");

-- CreateIndex
CREATE INDEX "DropTag_dropTagId_idx" ON "DropTag"("dropTagId");

-- CreateIndex
CREATE UNIQUE INDEX "DropTagListing_listingId_key" ON "DropTagListing"("listingId");

-- CreateIndex
CREATE INDEX "DropTagListing_shipmentId_idx" ON "DropTagListing"("shipmentId");

-- CreateIndex
CREATE INDEX "DropTagListing_originLocationId_idx" ON "DropTagListing"("originLocationId");

-- CreateIndex
CREATE INDEX "DropTagListing_status_idx" ON "DropTagListing"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Package_packageId_key" ON "Package"("packageId");

-- CreateIndex
CREATE INDEX "Package_status_idx" ON "Package"("status");

-- CreateIndex
CREATE INDEX "Package_orderId_idx" ON "Package"("orderId");

-- CreateIndex
CREATE INDEX "Package_currentLocationId_idx" ON "Package"("currentLocationId");

-- CreateIndex
CREATE INDEX "Package_packageId_idx" ON "Package"("packageId");

-- CreateIndex
CREATE INDEX "PackageItem_packageId_idx" ON "PackageItem"("packageId");

-- CreateIndex
CREATE INDEX "PackageItem_inventoryLotId_idx" ON "PackageItem"("inventoryLotId");

-- CreateIndex
CREATE INDEX "PackageItem_coilId_idx" ON "PackageItem"("coilId");

-- CreateIndex
CREATE INDEX "TagIdentifier_dropTagId_idx" ON "TagIdentifier"("dropTagId");

-- CreateIndex
CREATE UNIQUE INDEX "TagIdentifier_identifierType_identifierValue_key" ON "TagIdentifier"("identifierType", "identifierValue");

-- CreateIndex
CREATE UNIQUE INDEX "LabelTemplate_code_key" ON "LabelTemplate"("code");

-- CreateIndex
CREATE INDEX "LabelTemplate_code_idx" ON "LabelTemplate"("code");

-- CreateIndex
CREATE INDEX "LabelTemplate_customerId_idx" ON "LabelTemplate"("customerId");

-- CreateIndex
CREATE INDEX "LabelTemplate_templateType_idx" ON "LabelTemplate"("templateType");

-- CreateIndex
CREATE UNIQUE INDEX "TraceEvent_eventId_key" ON "TraceEvent"("eventId");

-- CreateIndex
CREATE INDEX "TraceEvent_resourceType_resourceId_idx" ON "TraceEvent"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "TraceEvent_eventType_idx" ON "TraceEvent"("eventType");

-- CreateIndex
CREATE INDEX "TraceEvent_actorUserId_idx" ON "TraceEvent"("actorUserId");

-- CreateIndex
CREATE INDEX "TraceEvent_orderId_idx" ON "TraceEvent"("orderId");

-- CreateIndex
CREATE INDEX "TraceEvent_shipmentId_idx" ON "TraceEvent"("shipmentId");

-- CreateIndex
CREATE INDEX "TraceEvent_correlationId_idx" ON "TraceEvent"("correlationId");

-- CreateIndex
CREATE INDEX "TraceEvent_occurredAt_idx" ON "TraceEvent"("occurredAt");

-- CreateIndex
CREATE INDEX "TraceEvent_dropTagId_idx" ON "TraceEvent"("dropTagId");

-- CreateIndex
CREATE INDEX "CustomerTagRequirement_customerId_idx" ON "CustomerTagRequirement"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerTagRequirement_customerId_key" ON "CustomerTagRequirement"("customerId");

-- AddForeignKey
ALTER TABLE "CustomerPricingTier" ADD CONSTRAINT "CustomerPricingTier_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DropTag" ADD CONSTRAINT "DropTag_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DropTag" ADD CONSTRAINT "DropTag_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DropTag" ADD CONSTRAINT "DropTag_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "DropTagListing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DropTag" ADD CONSTRAINT "DropTag_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DropTag" ADD CONSTRAINT "DropTag_orderLineId_fkey" FOREIGN KEY ("orderLineId") REFERENCES "OrderLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DropTag" ADD CONSTRAINT "DropTag_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DropTag" ADD CONSTRAINT "DropTag_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DropTagListing" ADD CONSTRAINT "DropTagListing_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DropTagListing" ADD CONSTRAINT "DropTagListing_originLocationId_fkey" FOREIGN KEY ("originLocationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_currentLocationId_fkey" FOREIGN KEY ("currentLocationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_orderLineId_fkey" FOREIGN KEY ("orderLineId") REFERENCES "OrderLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageItem" ADD CONSTRAINT "PackageItem_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagIdentifier" ADD CONSTRAINT "TagIdentifier_dropTagId_fkey" FOREIGN KEY ("dropTagId") REFERENCES "DropTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TraceEvent" ADD CONSTRAINT "TraceEvent_dropTagId_fkey" FOREIGN KEY ("dropTagId") REFERENCES "DropTag"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerTagRequirement" ADD CONSTRAINT "CustomerTagRequirement_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
