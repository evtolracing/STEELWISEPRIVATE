-- Locations become records a person can manage (owner's request, 2026-11-22): contact details, hours, manager,
-- divisions, processes, and a mark for a real branch as opposed to a storage area inside one.
-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "addressLine2" TEXT,
ADD COLUMN     "deactivatedAt" TIMESTAMP(3),
ADD COLUMN     "divisions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "email" TEXT,
ADD COLUMN     "fax" TEXT,
ADD COLUMN     "hours" TEXT,
ADD COLUMN     "isBranch" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "managerId" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "processes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "sellsFrom" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "shipsFrom" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "squareFeet" INTEGER,
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'America/Detroit';

-- CreateIndex
CREATE INDEX "Location_managerId_idx" ON "Location"("managerId");

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Mark the real branches: a top-level warehouse or yard, or any top-level location that already has
-- orders, people, machines or plans. Storage areas inside a branch (racks, bins, floors) are not branches.
UPDATE "Location" l SET "isBranch" = true
WHERE l."parentId" IS NULL AND (
  l."type" IN ('WAREHOUSE', 'YARD')
  OR EXISTS (SELECT 1 FROM "Order" o WHERE o."locationId" = l."id")
  OR EXISTS (SELECT 1 FROM "User" u WHERE u."homeLocationId" = l."id")
  OR EXISTS (SELECT 1 FROM "UserLocation" ul WHERE ul."locationId" = l."id")
  OR EXISTS (SELECT 1 FROM "WorkCenter" w WHERE w."locationId" = l."id")
  OR EXISTS (SELECT 1 FROM "DispatchJob" d WHERE d."locationId" = l."id")
);
-- A location already switched off keeps the day it was found so.
UPDATE "Location" SET "deactivatedAt" = "updatedAt" WHERE "isActive" = false AND "deactivatedAt" IS NULL;
