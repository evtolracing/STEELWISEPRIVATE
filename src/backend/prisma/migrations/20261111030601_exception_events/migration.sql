-- CreateTable
CREATE TABLE "ExceptionEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'INFO',
    "locationId" TEXT,
    "workCenterId" TEXT,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedBy" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExceptionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExceptionEvent_locationId_occurredAt_idx" ON "ExceptionEvent"("locationId", "occurredAt");

-- CreateIndex
CREATE INDEX "ExceptionEvent_acknowledged_occurredAt_idx" ON "ExceptionEvent"("acknowledged", "occurredAt");
