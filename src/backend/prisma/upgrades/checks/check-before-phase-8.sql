-- STEELWISE, Phase 8: a read-only look at live records the new shipping rules will refuse or print blank.
-- It changes nothing. Run it in the SQL Editor after files 6 to 14, and send the result.
-- Every count of 0 means nothing to do. A count above 0 is not an error: it is a list of things to
-- put right (or to know about) before the first shift on the new code.
SELECT 1 AS n, 'Shipments on the dock whose reserved stock stands at another branch (dispatch will be refused until it is transferred or shipped from there)' AS what,
  (SELECT count(DISTINCT s.id) FROM "Shipment" s JOIN "ShipmentItem" i ON i."shipmentId" = s.id JOIN "OrderLineAllocation" a ON a."orderLineId" = i."orderLineId" JOIN "Inventory" v ON v."coilId" = a."coilId"
    WHERE s.status::text IN ('PENDING','LOADING') AND v."locationId" <> s."fromLocationId") AS count
UNION ALL SELECT 2, 'Shipments on the dock for a customer whose account is closed (dispatch will be refused)',
  (SELECT count(*) FROM "Shipment" s JOIN "Order" o ON o.id = s."orderId" JOIN "Organization" c ON c.id = o."buyerId" WHERE s.status::text IN ('PENDING','LOADING') AND c."isActive" = false)
UNION ALL SELECT 3, 'Shipments on the dock for an order that is cancelled (they can be cancelled by hand; new cancellations do this themselves)',
  (SELECT count(*) FROM "Shipment" s JOIN "Order" o ON o.id = s."orderId" WHERE s.status::text IN ('PENDING','LOADING') AND o.status::text = 'CANCELLED')
UNION ALL SELECT 4, 'Branches with no street address or city on file (packing lists and bills of lading will print a blank for the shipper address)',
  (SELECT count(*) FROM "Location" WHERE "isActive" = true AND (COALESCE("addressLine1",'') = '' OR COALESCE(city,'') = ''))
UNION ALL SELECT 5, 'Open sales orders with no ship-to address (papers will print a blank for it)',
  (SELECT count(*) FROM "Order" WHERE "orderType"::text = 'SO' AND status::text IN ('CONFIRMED','PARTIAL') AND (COALESCE("shipToAddress",'') = '' OR COALESCE("shipToCity",'') = ''))
UNION ALL SELECT 6, 'Shipments on the road now (each will need a receiver name, or a reason for none, when marked delivered)',
  (SELECT count(*) FROM "Shipment" WHERE status::text IN ('IN_TRANSIT','EXCEPTION'))
UNION ALL SELECT 7, 'Shipments on the road or delivered with no invoice (listed for billing on the Integrations screen)',
  (SELECT count(*) FROM "Shipment" s WHERE s.status::text IN ('IN_TRANSIT','DELIVERED','EXCEPTION') AND EXISTS (SELECT 1 FROM "ShipmentItem" i WHERE i."shipmentId" = s.id) AND NOT EXISTS (SELECT 1 FROM "Invoice" v WHERE v."shipmentId" = s.id AND v.status::text <> 'CANCELLED'))
UNION ALL SELECT 8, 'Print jobs waiting with no branch (every branch will see them until they are printed or skipped)',
  (SELECT count(*) FROM "PrintQueueJob" WHERE status = 'PENDING' AND "locationId" IS NULL)
UNION ALL SELECT 9, 'Stock items with no cost on file (orders shipped from them will show "cost not on file" instead of a margin)',
  (SELECT count(*) FROM "Coil" c JOIN "Inventory" v ON v."coilId" = c.id WHERE v."qtyOnHand" > 0 AND c."unitCost" IS NULL)
UNION ALL SELECT 10, 'Stock items whose cost per unit is more than 100 times the middle cost for stock kept in the same unit (a purchase price typed in the wrong unit, for example per hundredweight as per pound)',
  (SELECT count(*) FROM "Coil" c JOIN "Inventory" v ON v."coilId" = c.id
    JOIN (SELECT v2.unit, percentile_cont(0.5) WITHIN GROUP (ORDER BY c2."unitCost") AS mid FROM "Coil" c2 JOIN "Inventory" v2 ON v2."coilId" = c2.id WHERE c2."unitCost" > 0 GROUP BY v2.unit) m ON m.unit = v.unit
    WHERE c."unitCost" > 100 * m.mid AND m.mid > 0)
ORDER BY 1;
