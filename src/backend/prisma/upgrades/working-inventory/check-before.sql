-- Working inventory: run this BEFORE the inventory files (2026-11-26). It changes nothing; it only reads.
-- Each row answers one question. The inventory files can be run when:
--   books_started is "no" (the stock files refuse to load once the sandbox books have started),
--   the five branches are all on file and switched on (a switched-off branch gets no stock or machines),
--   and weight_per_foot_column is "yes" (run file 1, product_weight_per_foot, first).
-- The demo rows tell you what the clean-up (file 11) will leave alone because it is reserved, in a job or on the road.
SELECT 'books_started' AS question,
       CASE WHEN EXISTS (SELECT 1 FROM "AppSetting" WHERE "key" = 'ledger.activation' AND ("value"->>'active')::boolean IS TRUE) THEN 'YES: do not run the stock files' ELSE 'no' END AS answer
UNION ALL
SELECT 'branch ' || b.code, COALESCE((SELECT CASE WHEN l."isActive" THEN 'on file, switched on: ' || l.name ELSE 'on file but SWITCHED OFF: gets nothing' END FROM "Location" l WHERE l.code = b.code), 'NOT ON FILE: gets nothing')
FROM (VALUES ('JX'), ('BC'), ('PV'), ('L2'), ('CT')) AS b(code)
UNION ALL
SELECT 'weight_per_foot_column', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Product' AND column_name = 'weightPerFtLb') THEN 'yes' ELSE 'NO: run product_weight_per_foot first' END
UNION ALL
SELECT 'working inventory already loaded (pieces)', count(*)::text FROM "Coil" WHERE "coilNumber" ~ '^(JX|BC|PV|L2|CT)-2[56]-1[0-9]{5}$'
UNION ALL
SELECT 'demo stock that will be taken off the shelf', count(*)::text
FROM "Coil" c JOIN "Inventory" i ON i."coilId" = c.id
WHERE (c."coilNumber" LIKE 'DEMO-%' OR c."coilNumber" LIKE 'COIL-%') AND c."status" IN ('AVAILABLE', 'HOLD') AND i."qtyOnHand" > 0 AND i."qtyAllocated" = 0 AND i."qtyInTransit" = 0
  AND NOT EXISTS (SELECT 1 FROM "OrderLineAllocation" a WHERE a."coilId" = c.id) AND NOT EXISTS (SELECT 1 FROM "WorkOrder" w WHERE w."sourceCoilId" = c.id)
UNION ALL
SELECT 'demo stock left as it is (reserved, in a job or on the road): ' || c."coilNumber", 'on hand ' || i."qtyOnHand" || ', reserved ' || i."qtyAllocated" || ', on the road ' || i."qtyInTransit"
FROM "Coil" c JOIN "Inventory" i ON i."coilId" = c.id
WHERE (c."coilNumber" LIKE 'DEMO-%' OR c."coilNumber" LIKE 'COIL-%') AND i."qtyOnHand" > 0
  AND (i."qtyAllocated" > 0 OR i."qtyInTransit" > 0 OR EXISTS (SELECT 1 FROM "OrderLineAllocation" a WHERE a."coilId" = c.id) OR EXISTS (SELECT 1 FROM "WorkOrder" w WHERE w."sourceCoilId" = c.id))
UNION ALL
SELECT 'branch ' || l.code || ' machines already set up', count(w.*)::text FROM "Location" l LEFT JOIN "WorkCenter" w ON w."locationId" = l.id AND w."isActive" WHERE l.code IN ('JX', 'BC', 'PV', 'L2', 'CT') GROUP BY l.code
ORDER BY 1;
