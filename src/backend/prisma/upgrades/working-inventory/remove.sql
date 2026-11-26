-- Working inventory: REMOVAL. Run this only to take the working inventory back out (2026-11-26). Safe to run twice.
-- It refuses to run once the sandbox books have started, because the books then count this stock.
-- What it does, and does not do:
-- - Every piece of the working inventory that is not reserved and not on the road is taken off the shelf: its balance goes to zero
--   with an adjustment line in its history, its hold (if any) is released, and it leaves the stock lists. History is never deleted.
--   Pieces that are reserved or on the road are left; the last row of this file's output counts them.
-- - Its products are switched off and hidden in the online store. Its Steel Outlet pieces are deleted unless reserved.
-- - The machines it added are switched off. Producers, grades, heats and kinds of work stay: they are reference records.
-- - The demo items the clean-up took off are NOT brought back.
DO $guard$
BEGIN
  IF EXISTS (SELECT 1 FROM "AppSetting" WHERE "key" = 'ledger.activation' AND ("value"->>'active')::boolean IS TRUE) THEN
    RAISE EXCEPTION 'The books are already started, so the working inventory is part of them. Nothing was removed.';
  END IF;
END
$guard$;

BEGIN;
WITH ours AS (
  SELECT c.id, c."coilNumber", c."locationId", i."qtyOnHand", i.unit, c."unitCost"
  FROM "Coil" c JOIN "Inventory" i ON i."coilId" = c.id
  WHERE c."coilNumber" ~ '^(JX|BC|PV|L2|CT)-2[56]-1[0-9]{5}$'
    AND EXISTS (SELECT 1 FROM "MaterialMovement" m WHERE m."coilId" = c.id AND m."movementType" = 'RECEIVE' AND m.notes = 'Opening stock: working inventory loaded 2026-11-26.')
    AND i."qtyOnHand" > 0 AND i."qtyAllocated" = 0 AND i."qtyInTransit" = 0
),
moved AS (
  INSERT INTO "MaterialMovement" ("id", "coilId", "movementType", "fromLocationId", "qtyMoved", "unit", "reasonCode", "notes", "unitCost", "createdAt", "createdById")
  SELECT gen_random_uuid()::text, o.id, 'ADJUST'::"MovementType", o."locationId", o."qtyOnHand", o.unit, 'WORKING_INVENTORY_REMOVED',
         'Working inventory taken back out.', o."unitCost", now(), (SELECT id FROM "User" ORDER BY "createdAt", id LIMIT 1)
  FROM ours o RETURNING "coilId"
),
released AS (
  UPDATE "QCHold" h SET "status" = 'RELEASED', "updatedAt" = now() FROM ours o WHERE h."coilId" = o.id AND h."status" = 'ACTIVE' RETURNING h.id
),
zeroed AS (
  UPDATE "Inventory" i SET "qtyOnHand" = 0, "qtyAvailable" = 0, "qtyOnHold" = 0, "status" = 'RETIRED', "lastMovement" = now(), "updatedAt" = now()
  FROM ours o WHERE i."coilId" = o.id RETURNING i."coilId"
)
UPDATE "Coil" c SET "status" = 'CONSUMED', "updatedAt" = now()
FROM ours o WHERE c.id = o.id AND (SELECT count(*) FROM moved) >= 0 AND (SELECT count(*) FROM zeroed) >= 0 AND (SELECT count(*) FROM released) >= 0;

UPDATE "StoreListing" sl SET "visible" = false, "updatedAt" = now()
FROM "Product" p WHERE p.id = sl."productId" AND sl.visible
  AND EXISTS (SELECT 1 FROM "Coil" c WHERE c."productId" = p.id AND c."coilNumber" ~ '^(JX|BC|PV|L2|CT)-2[56]-1[0-9]{5}$');
UPDATE "Product" p SET "isActive" = false, "updatedAt" = now()
WHERE p."isActive" AND EXISTS (SELECT 1 FROM "Coil" c WHERE c."productId" = p.id AND c."coilNumber" ~ '^(JX|BC|PV|L2|CT)-2[56]-1[0-9]{5}$');
DELETE FROM "Remnant" WHERE id LIKE 'out-%' AND "reserved" = false;
UPDATE "WorkCenter" SET "isActive" = false, "updatedAt" = now() WHERE "isActive" AND code ~ '^(JX|BC|PV|L2|CT)-[A-Z]+-[0-9]{2}$';
INSERT INTO "AuditLog" ("id", "category", "eventType", "severity", "resourceType", "action", "details", "timestamp")
VALUES (gen_random_uuid()::text, 'DATA', 'WORKING_INVENTORY_REMOVED', 'INFO', 'Coil', 'UPDATE', jsonb_build_object('note', 'Working inventory taken back out.'), now());
COMMIT;

SELECT 'pieces left because they are reserved or on the road' AS what, count(*) AS how_many
FROM "Coil" c JOIN "Inventory" i ON i."coilId" = c.id
WHERE c."coilNumber" ~ '^(JX|BC|PV|L2|CT)-2[56]-1[0-9]{5}$' AND i."qtyOnHand" > 0;
