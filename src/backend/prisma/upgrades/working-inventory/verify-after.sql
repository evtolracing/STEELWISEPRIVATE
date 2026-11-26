-- Working inventory: run this AFTER files 1 to 11 (2026-11-26). It changes nothing; it only reads.
-- What to expect: 13 categories of 100 products each plus about 98 supplies, all listed in the online store; stock at every
-- switched-on branch (JX 900, BC 743, PV 750, L2 971, CT 949 pieces when all five are on); every piece's balance adds up
-- (the "balances off" row is 0); every metal or plastic piece has a heat and a grade; 100 Steel Outlet pieces; machines at every branch.
SELECT 'products, ' || COALESCE(p.category, '?') AS what, count(*)::text AS how_many
FROM "Product" p JOIN "StoreListing" sl ON sl."productId" = p.id AND sl.visible
WHERE p."isActive" AND EXISTS (SELECT 1 FROM "Coil" c WHERE c."productId" = p.id AND c."coilNumber" ~ '^(JX|BC|PV|L2|CT)-2[56]-1[0-9]{5}$')
GROUP BY p.category
UNION ALL
SELECT 'pieces at ' || l.code, count(*)::text || ' pieces, ' || to_char(sum(i."qtyOnHand" * COALESCE(c."unitCost", 0)), 'FM$999,999,990') || ' at cost'
FROM "Coil" c JOIN "Inventory" i ON i."coilId" = c.id JOIN "Location" l ON l.id = c."locationId"
WHERE c."coilNumber" ~ '^(JX|BC|PV|L2|CT)-2[56]-1[0-9]{5}$' GROUP BY l.code
UNION ALL
SELECT 'balances off (must be 0)', count(*)::text FROM "Inventory" i JOIN "Coil" c ON c.id = i."coilId"
WHERE c."coilNumber" ~ '^(JX|BC|PV|L2|CT)-2[56]-1[0-9]{5}$' AND abs(i."qtyOnHand" - (i."qtyAvailable" + i."qtyAllocated" + i."qtyOnHold" + i."qtyInTransit")) > 0.001
UNION ALL
SELECT 'pieces with no heat or grade (must be 0)', count(*)::text FROM "Coil" c
WHERE c."coilNumber" ~ '^(JX|BC|PV|L2|CT)-2[56]-1[0-9]{5}$' AND c.form <> 'SUPPLY' AND (c."heatId" IS NULL OR c."gradeId" IS NULL)
UNION ALL
SELECT 'pieces with no cost (must be 0)', count(*)::text FROM "Coil" c
WHERE c."coilNumber" ~ '^(JX|BC|PV|L2|CT)-2[56]-1[0-9]{5}$' AND (c."unitCost" IS NULL OR c."unitCost" <= 0)
UNION ALL
SELECT 'pieces on hold', count(*)::text FROM "QCHold" h JOIN "Coil" c ON c.id = h."coilId" WHERE h.status = 'ACTIVE' AND c."coilNumber" ~ '^(JX|BC|PV|L2|CT)-2[56]-1[0-9]{5}$'
UNION ALL
SELECT 'Steel Outlet pieces', count(*)::text FROM "Remnant" WHERE id LIKE 'out-%'
UNION ALL
SELECT 'demo products still in the store (should be 0)', count(*)::text FROM "Product" p JOIN "StoreListing" sl ON sl."productId" = p.id AND sl.visible
WHERE p."isActive" AND p.sku IN ('HR-A36-PL', 'CR-1018-BR', 'SS-304-SH', 'AL-6061-PL', 'HR-A572-PL', 'HDPE-SH-NAT', 'UHMW-ROD-WH', 'WG-25', 'CUT-DISC-9', 'REM-A36-PL', 'HRC-A36-048', 'CRC-A36-060')
UNION ALL
SELECT 'machines at ' || l.code, count(w.*)::text || ': ' || COALESCE(string_agg(DISTINCT w.type, ', '), 'none')
FROM "Location" l LEFT JOIN "WorkCenter" w ON w."locationId" = l.id AND w."isActive" WHERE l.code IN ('JX', 'BC', 'PV', 'L2', 'CT') GROUP BY l.code
UNION ALL
SELECT 'operators at ' || l.code || ' (needed to run jobs on the shop floor)', count(o.*)::text
FROM "Location" l LEFT JOIN "Operator" o ON o."homeLocationId" = l.id AND o."isActive" WHERE l.code IN ('JX', 'BC', 'PV', 'L2', 'CT') GROUP BY l.code
ORDER BY 1;
