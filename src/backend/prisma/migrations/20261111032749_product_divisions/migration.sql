-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "GradeFamily" ADD VALUE 'ALUMINUM';
ALTER TYPE "GradeFamily" ADD VALUE 'NONFERROUS';
ALTER TYPE "GradeFamily" ADD VALUE 'PLASTIC';
ALTER TYPE "GradeFamily" ADD VALUE 'OTHER';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ProductForm" ADD VALUE 'ROD';
ALTER TYPE "ProductForm" ADD VALUE 'SUPPLY';

-- AlterEnum
ALTER TYPE "ProductType" ADD VALUE 'OTHER';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "division" TEXT NOT NULL DEFAULT 'METALS',
ADD COLUMN     "isRemnant" BOOLEAN NOT NULL DEFAULT false;
