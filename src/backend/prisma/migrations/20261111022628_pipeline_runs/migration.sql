-- CreateTable
CREATE TABLE "PipelineRun" (
    "id" TEXT NOT NULL,
    "currentStage" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PipelineRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PipelineRun_currentStage_idx" ON "PipelineRun"("currentStage");

-- CreateIndex
CREATE INDEX "PipelineRun_updatedAt_idx" ON "PipelineRun"("updatedAt");
