-- CreateTable
CREATE TABLE "PriceLevel" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "multiplier" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceLevel_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "SalesTaxRate" (
    "state" TEXT NOT NULL,
    "rate" DECIMAL(65,30) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesTaxRate_pkey" PRIMARY KEY ("state")
);

-- CreateTable
CREATE TABLE "ProcessingOperation" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "division" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 0,
    "pricePerOp" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "priceUnit" TEXT NOT NULL DEFAULT 'EA',
    "machines" JSONB NOT NULL DEFAULT '[]',
    "params" JSONB NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcessingOperation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessingTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "division" TEXT NOT NULL,
    "steps" JSONB NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcessingTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProcessingOperation_code_key" ON "ProcessingOperation"("code");

-- CreateIndex
CREATE INDEX "ProcessingOperation_division_type_idx" ON "ProcessingOperation"("division", "type");

-- CreateIndex
CREATE INDEX "ProcessingTemplate_division_idx" ON "ProcessingTemplate"("division");
