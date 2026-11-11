-- CreateTable
CREATE TABLE "StopWorkEvent" (
    "id" TEXT NOT NULL,
    "eventNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "scopeType" TEXT NOT NULL,
    "scopeId" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "initiatedAt" TIMESTAMP(3) NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StopWorkEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StopWorkAudit" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StopWorkAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StopWorkStep" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StopWorkStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StopWorkEvidence" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StopWorkEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StopWorkEvent_eventNumber_key" ON "StopWorkEvent"("eventNumber");

-- CreateIndex
CREATE INDEX "StopWorkEvent_status_idx" ON "StopWorkEvent"("status");

-- CreateIndex
CREATE INDEX "StopWorkEvent_initiatedAt_idx" ON "StopWorkEvent"("initiatedAt");

-- CreateIndex
CREATE INDEX "StopWorkAudit_eventId_performedAt_idx" ON "StopWorkAudit"("eventId", "performedAt");

-- CreateIndex
CREATE INDEX "StopWorkStep_eventId_idx" ON "StopWorkStep"("eventId");

-- CreateIndex
CREATE INDEX "StopWorkEvidence_eventId_idx" ON "StopWorkEvidence"("eventId");
