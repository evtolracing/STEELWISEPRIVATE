-- Clean-up before the real locations go into use (owner's decision, 2026-11-22: "Cancel and switch off, keep history").
-- 1. The 28 open test and demo orders found on the live site are cancelled, with their open jobs and open shipments.
-- 2. The 9 placeholder locations are switched off, with their machines. Open shipments leaving from them are cancelled.
-- 3. People whose home was a placeholder location move to Charlotte (CT), when CT is on file.
-- Nothing is deleted: every order, job, shipment, invoice, stock record and location stays on file.
-- Only the listed order numbers and location codes are touched, and only records made before this update was
-- written, so a real order that later takes one of these numbers is safe. Running it again changes nothing.

-- 1a. Orders.
UPDATE "Order" AS o
SET "status" = 'CANCELLED',
    "notes" = CASE WHEN o."notes" IS NULL OR o."notes" = '' THEN 'Cancelled: test data cleared before the real locations (2026-11-22).'
                   ELSE o."notes" || E'\nCancelled: test data cleared before the real locations (2026-11-22).' END,
    "updatedAt" = now()
WHERE o."orderNumber" IN (
        'SO-00001', 'SO-00002', 'SO-00003', 'SO-00004', 'SO-00005', 'SO-00006', 'SO-000001', 'SO-00008',
        'SO-00067', 'SO-00068', 'SO-00069', 'SO-00070', 'SO-00071', 'SO-00072', 'SO-00073', 'SO-00074', 'SO-00075', 'SO-00076',
        'SO-P1001', 'SO-P1002', 'SO-P1003', 'SO-P1004', 'SO-P1005',
        'SO-DEMO-001', 'SO-DEMO-002', 'SO-DEMO-003', 'SO-DEMO-004', 'SO-C2007')
  AND o."status" NOT IN ('COMPLETE', 'CANCELLED')
  AND o."createdAt" < TIMESTAMP '2026-11-22 21:30:00';

-- 1b. Open jobs of the orders cancelled above.
UPDATE "Job" AS j
SET "status" = 'CANCELLED',
    "notes" = CASE WHEN j."notes" IS NULL OR j."notes" = '' THEN 'Cancelled: test data cleared before the real locations (2026-11-22).'
                   ELSE j."notes" || E'\nCancelled: test data cleared before the real locations (2026-11-22).' END,
    "updatedAt" = now()
FROM "Order" o
WHERE j."orderId" = o."id"
  AND o."status" = 'CANCELLED' AND o."notes" LIKE '%Cancelled: test data cleared before the real locations (2026-11-22).%'
  AND j."status" NOT IN ('SHIPPED', 'COMPLETED', 'CANCELLED');

-- 1c and 2a. Open shipments of those orders, and open shipments leaving from a placeholder location.
UPDATE "Shipment" AS s
SET "status" = 'CANCELLED',
    "notes" = CASE WHEN s."notes" IS NULL OR s."notes" = '' THEN 'Cancelled: test data cleared before the real locations (2026-11-22).'
                   ELSE s."notes" || E'\nCancelled: test data cleared before the real locations (2026-11-22).' END,
    "updatedAt" = now()
WHERE s."status" IN ('PENDING', 'LOADING', 'IN_TRANSIT', 'EXCEPTION')
  AND s."createdAt" < TIMESTAMP '2026-11-22 21:30:00'
  AND (
    EXISTS (SELECT 1 FROM "Order" o WHERE o."id" = s."orderId" AND o."status" = 'CANCELLED'
              AND o."notes" LIKE '%Cancelled: test data cleared before the real locations (2026-11-22).%')
    OR EXISTS (SELECT 1 FROM "Location" l WHERE l."id" = s."fromLocationId"
              AND l."code" IN ('DEMO-DET', 'DEMO-GR', 'DEMO-JAX', 'DEMO-KZO', 'DET-A', 'DET-B', 'GR-YARD', 'JAX-WH', 'WH-MAIN')
              AND l."createdAt" < TIMESTAMP '2026-11-22 21:30:00')
  );

-- 2b. Machines at the placeholder locations.
UPDATE "WorkCenter" AS w
SET "isActive" = false, "updatedAt" = now()
FROM "Location" l
WHERE w."locationId" = l."id" AND w."isActive" = true
  AND l."code" IN ('DEMO-DET', 'DEMO-GR', 'DEMO-JAX', 'DEMO-KZO', 'DET-A', 'DET-B', 'GR-YARD', 'JAX-WH', 'WH-MAIN')
  AND l."createdAt" < TIMESTAMP '2026-11-22 21:30:00';

-- 3. People at a placeholder location move to Charlotte, when Charlotte is on file and switched on.
INSERT INTO "UserLocation" ("id", "userId", "locationId", "isPrimary")
SELECT gen_random_uuid()::text, x."userId", ct."id", bool_or(x."isPrimary")
FROM "UserLocation" x
JOIN "Location" l ON l."id" = x."locationId"
JOIN "Location" ct ON ct."code" = 'CT' AND ct."isActive" = true
WHERE l."code" IN ('DEMO-DET', 'DEMO-GR', 'DEMO-JAX', 'DEMO-KZO', 'DET-A', 'DET-B', 'GR-YARD', 'JAX-WH', 'WH-MAIN')
  AND l."createdAt" < TIMESTAMP '2026-11-22 21:30:00'
GROUP BY x."userId", ct."id"
ON CONFLICT ("userId", "locationId") DO NOTHING;

DELETE FROM "UserLocation" x
USING "Location" l
WHERE x."locationId" = l."id"
  AND l."code" IN ('DEMO-DET', 'DEMO-GR', 'DEMO-JAX', 'DEMO-KZO', 'DET-A', 'DET-B', 'GR-YARD', 'JAX-WH', 'WH-MAIN')
  AND l."createdAt" < TIMESTAMP '2026-11-22 21:30:00'
  AND EXISTS (SELECT 1 FROM "Location" ct WHERE ct."code" = 'CT' AND ct."isActive" = true);

UPDATE "User" AS u
SET "homeLocationId" = ct."id", "updatedAt" = now()
FROM "Location" l, "Location" ct
WHERE u."homeLocationId" = l."id" AND ct."code" = 'CT' AND ct."isActive" = true
  AND l."code" IN ('DEMO-DET', 'DEMO-GR', 'DEMO-JAX', 'DEMO-KZO', 'DET-A', 'DET-B', 'GR-YARD', 'JAX-WH', 'WH-MAIN')
  AND l."createdAt" < TIMESTAMP '2026-11-22 21:30:00';

-- 2c. The placeholder locations themselves.
UPDATE "Location"
SET "isActive" = false, "deactivatedAt" = now(), "updatedAt" = now(),
    "notes" = CASE WHEN "notes" IS NULL OR "notes" = '' THEN 'Switched off: placeholder from the test data (2026-11-22).'
                   ELSE "notes" || E'\nSwitched off: placeholder from the test data (2026-11-22).' END
WHERE "code" IN ('DEMO-DET', 'DEMO-GR', 'DEMO-JAX', 'DEMO-KZO', 'DET-A', 'DET-B', 'GR-YARD', 'JAX-WH', 'WH-MAIN')
  AND "isActive" = true
  AND "createdAt" < TIMESTAMP '2026-11-22 21:30:00';
