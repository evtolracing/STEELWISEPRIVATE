-- What a person needs to do a plan step correctly: pieces, cut length, width, tolerance and instructions
-- (owner, 2026-11-24). One optional column on the step. Existing steps are left empty. Safe to run again.
ALTER TABLE "DispatchOperation" ADD COLUMN IF NOT EXISTS "details" JSONB;
