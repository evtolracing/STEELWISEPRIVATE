-- CreateTable
CREATE TABLE "PrintQueueJob" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "jobId" TEXT,
    "payload" JSONB NOT NULL,
    "skipReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "printedAt" TIMESTAMP(3),
    "skippedAt" TIMESTAMP(3),

    CONSTRAINT "PrintQueueJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PrintQueueJob_status_createdAt_idx" ON "PrintQueueJob"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PrintQueueJob_jobId_type_status_idx" ON "PrintQueueJob"("jobId", "type", "status");
