-- Phase 3: the branch that owns a quote and a request for quotation (finding C-009,
-- owner's decision 2 of 2026-11-13: staff see and change only their own branch's records).
-- Adds one optional column to each table. Nothing is removed or rewritten.
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "locationId" TEXT;
ALTER TABLE "RFQ" ADD COLUMN IF NOT EXISTS "locationId" TEXT;
CREATE INDEX IF NOT EXISTS "Quote_locationId_idx" ON "Quote"("locationId");
CREATE INDEX IF NOT EXISTS "RFQ_locationId_idx" ON "RFQ"("locationId");
DO $fk$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RFQ_locationId_fkey') THEN
    ALTER TABLE "RFQ" ADD CONSTRAINT "RFQ_locationId_fkey"
      FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Quote_locationId_fkey') THEN
    ALTER TABLE "Quote" ADD CONSTRAINT "Quote_locationId_fkey"
      FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$fk$;

-- Existing quotes: the home branch of the person who wrote it. Existing requests: the branch
-- of their first quote. One with neither stays unassigned, and an unassigned quote or request
-- is seen by every branch, so nothing disappears from anyone's list.
UPDATE "Quote" q SET "locationId" = u."homeLocationId"
  FROM "User" u
 WHERE u.id = q."createdById" AND q."locationId" IS NULL AND u."homeLocationId" IS NOT NULL;
UPDATE "RFQ" r SET "locationId" = q."locationId"
  FROM (SELECT DISTINCT ON ("rfqId") "rfqId", "locationId" FROM "Quote" WHERE "locationId" IS NOT NULL ORDER BY "rfqId", "createdAt") q
 WHERE q."rfqId" = r.id AND r."locationId" IS NULL;
