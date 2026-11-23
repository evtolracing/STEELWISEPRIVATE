-- Gives back to stock what the cancelled test orders still had reserved. Follows
-- 20261122213000_retire_test_orders_and_demo_locations, which cancelled the orders but left their
-- reservations in place, so that stock stayed "reserved" for orders that will never ship.
-- Only reservations of orders carrying that clean-up's own note are touched. The reservation rows are removed,
-- exactly as the Cancel button removes them (routes/orders.js, releaseAllocations): a reservation is a hold on
-- stock, not a record of something that happened, and the database refuses a reservation of zero. Every order,
-- order line, stock record and piece stays on file. Running it again changes nothing.
WITH held AS (
  SELECT a."id", a."coilId", a."qtyAllocated"
  FROM "OrderLineAllocation" a
  JOIN "OrderLine" ol ON ol."id" = a."orderLineId"
  JOIN "Order" o ON o."id" = ol."orderId"
  WHERE a."qtyAllocated" > 0
    AND o."status" = 'CANCELLED'
    AND o."notes" LIKE '%Cancelled: test data cleared before the real locations (2026-11-22).%'
),
per_coil AS (
  SELECT "coilId", sum("qtyAllocated") AS qty FROM held GROUP BY "coilId"
),
-- The stock record: reserved goes down and available goes up by the same amount, never below zero reserved.
stock AS (
  UPDATE "Inventory" i
  SET "qtyAllocated" = i."qtyAllocated" - LEAST(p.qty, i."qtyAllocated"),
      "qtyAvailable" = i."qtyAvailable" + LEAST(p.qty, i."qtyAllocated"),
      "updatedAt" = now()
  FROM per_coil p
  WHERE i."coilId" = p."coilId"
  RETURNING i."coilId"
),
released AS (
  DELETE FROM "OrderLineAllocation" a USING held h WHERE a."id" = h."id"
  RETURNING a."coilId"
)
-- A piece marked as reserved goes back to available when no other order still holds any of it.
UPDATE "Coil" c
SET "status" = 'AVAILABLE', "updatedAt" = now()
WHERE c."status" = 'ALLOCATED'
  AND c."id" IN (SELECT "coilId" FROM per_coil)
  AND NOT EXISTS (
    SELECT 1 FROM "OrderLineAllocation" other
    WHERE other."coilId" = c."id" AND other."qtyAllocated" > 0
      AND other."id" NOT IN (SELECT "id" FROM held)
  );
