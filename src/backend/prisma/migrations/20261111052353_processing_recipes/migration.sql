-- CreateTable
CREATE TABLE "ProcessingRecipe" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "operationType" TEXT NOT NULL,
    "division" TEXT NOT NULL DEFAULT 'METALS',
    "workCenter" TEXT,
    "setupMinutes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "runMinutesPerUnit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minRunMinutes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "applicableMaterials" JSONB NOT NULL DEFAULT '[]',
    "applicableForms" JSONB NOT NULL DEFAULT '[]',
    "thicknessMin" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "thicknessMax" DOUBLE PRECISION NOT NULL DEFAULT 99,
    "toleranceClass" TEXT NOT NULL DEFAULT 'STANDARD',
    "pricePerUnit" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "priceUnit" TEXT NOT NULL DEFAULT 'EA',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcessingRecipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeRoutingTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "division" TEXT NOT NULL DEFAULT 'METALS',
    "steps" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecipeRoutingTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProcessingRecipe_code_key" ON "ProcessingRecipe"("code");

-- CreateIndex
CREATE INDEX "ProcessingRecipe_division_operationType_status_idx" ON "ProcessingRecipe"("division", "operationType", "status");
