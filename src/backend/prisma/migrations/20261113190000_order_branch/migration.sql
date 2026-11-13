-- The branch that owns an order (finding B-003, owner's decision 2 of 2026-11-13:
-- staff see and change only their own branch's records).
-- Adds one optional column. Nothing is removed or rewritten.
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "locationId" TEXT;
CREATE INDEX IF NOT EXISTS "Order_locationId_idx" ON "Order"("locationId");
DO $fk$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Order_locationId_fkey') THEN
    ALTER TABLE "Order" ADD CONSTRAINT "Order_locationId_fkey"
      FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$fk$;

-- Existing orders: the branch it shipped from if it has a shipment, otherwise the home
-- branch of the person who entered it. An order with neither stays without a branch and
-- is seen only by roles that see every branch, until someone assigns it.
UPDATE "Order" o SET "locationId" = s."fromLocationId"
  FROM (SELECT DISTINCT ON ("orderId") "orderId", "fromLocationId" FROM "Shipment" WHERE "orderId" IS NOT NULL ORDER BY "orderId", "createdAt") s
 WHERE s."orderId" = o.id AND o."locationId" IS NULL;
UPDATE "Order" o SET "locationId" = u."homeLocationId"
  FROM "User" u
 WHERE u.id = o."createdById" AND o."locationId" IS NULL AND u."homeLocationId" IS NOT NULL;
