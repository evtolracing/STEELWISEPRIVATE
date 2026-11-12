-- AlterTable
ALTER TABLE "User" ADD COLUMN     "customerId" TEXT;

-- CreateIndex
CREATE INDEX "User_customerId_idx" ON "User"("customerId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
