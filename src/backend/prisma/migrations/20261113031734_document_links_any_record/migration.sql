-- DropForeignKey
ALTER TABLE "DocumentLink" DROP CONSTRAINT "document_coil_link";

-- CreateIndex
CREATE INDEX "DocumentLink_entityType_entityId_idx" ON "DocumentLink"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "DocumentLink_documentId_idx" ON "DocumentLink"("documentId");
