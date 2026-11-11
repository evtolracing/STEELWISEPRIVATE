-- CreateTable
CREATE TABLE "StoreListing" (
    "productId" TEXT NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "family" TEXT,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "leadTimeDays" INTEGER,
    "minOrderQty" INTEGER NOT NULL DEFAULT 1,
    "thicknessOptions" JSONB,
    "widthOptions" JSONB,
    "lengthOptions" JSONB,
    "allowCutToSize" BOOLEAN,
    "allowProcessing" BOOLEAN,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreListing_pkey" PRIMARY KEY ("productId")
);

-- AddForeignKey
ALTER TABLE "StoreListing" ADD CONSTRAINT "StoreListing_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
