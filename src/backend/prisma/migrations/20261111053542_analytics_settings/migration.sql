-- CreateTable
CREATE TABLE "AppSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "DemandSuggestionEvent" (
    "id" TEXT NOT NULL,
    "suggestionId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "savingsAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "source" TEXT,
    "branchKey" TEXT,
    "orderId" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemandSuggestionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DemandSuggestionEvent_createdAt_idx" ON "DemandSuggestionEvent"("createdAt");

-- CreateIndex
CREATE INDEX "DemandSuggestionEvent_suggestionId_idx" ON "DemandSuggestionEvent"("suggestionId");
