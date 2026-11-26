-- Where a planner has put a job's card within its column of the Production Workflow board (owner, 2026-11-25).
-- One row per arranged job, in a table of its own: nothing else reads it, so the board works without it
-- (cards then keep the order of priority and due date). Safe to run again.
CREATE TABLE IF NOT EXISTS "JobBoardPosition" (
  "jobId" TEXT NOT NULL,
  "stage" TEXT NOT NULL,
  "position" DOUBLE PRECISION NOT NULL,
  "updatedById" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "JobBoardPosition_pkey" PRIMARY KEY ("jobId")
);
DO $$ BEGIN
  ALTER TABLE "JobBoardPosition" ADD CONSTRAINT "JobBoardPosition_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
