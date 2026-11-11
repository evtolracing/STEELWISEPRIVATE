-- CreateTable
CREATE TABLE "Remnant" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "spec" TEXT,
    "form" TEXT NOT NULL,
    "family" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'DROP',
    "condition" TEXT NOT NULL DEFAULT 'A',
    "thickness" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "width" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "length" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "uom" TEXT NOT NULL DEFAULT 'IN',
    "estimatedWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pricePerLb" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "location" TEXT NOT NULL,
    "locationName" TEXT,
    "heatNumber" TEXT,
    "parentJobId" TEXT,
    "cutDate" TIMESTAMP(3),
    "receivedDate" TIMESTAMP(3),
    "qtyAvailable" INTEGER NOT NULL DEFAULT 1,
    "reserved" BOOLEAN NOT NULL DEFAULT false,
    "reservedFor" TEXT,
    "reservedAt" TIMESTAMP(3),
    "imageUrl" TEXT,
    "notes" TEXT,
    "division" TEXT NOT NULL DEFAULT 'OUTLET',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Remnant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Remnant_sku_key" ON "Remnant"("sku");

-- CreateIndex
CREATE INDEX "Remnant_grade_form_idx" ON "Remnant"("grade", "form");

-- CreateIndex
CREATE INDEX "Remnant_location_idx" ON "Remnant"("location");

-- CreateIndex
CREATE INDEX "Remnant_cutDate_idx" ON "Remnant"("cutDate");
