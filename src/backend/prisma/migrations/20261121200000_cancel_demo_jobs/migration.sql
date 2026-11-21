-- Cancel the jobs left over from the hidden Alro demo (owner's decision, 2026-11-21).
-- They are J-DEMO-001 to J-DEMO-010 and J-C2007: no route, no branch of their own, never worked,
-- yet marked Scheduled (one In process), so every board counted them as open work.
-- Only those numbers are touched, and only while they are still open and have no plan, no time
-- on the clock and nothing shipped. Their orders are left as they are. Running it again changes nothing.
UPDATE "Job" AS j
SET "status" = 'CANCELLED',
    "notes" = CASE WHEN j."notes" IS NULL OR j."notes" = '' THEN 'Cancelled: left over from the demo data (2026-11-21).'
                   ELSE j."notes" || E'\nCancelled: left over from the demo data (2026-11-21).' END,
    "updatedAt" = now()
WHERE (j."jobNumber" LIKE 'J-DEMO-%' OR j."jobNumber" = 'J-C2007')
  AND j."status" NOT IN ('SHIPPED', 'COMPLETED', 'CANCELLED')
  AND NOT EXISTS (SELECT 1 FROM "DispatchJob" d WHERE d."jobId" = j."id");
