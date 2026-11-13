#!/usr/bin/env bash
# Runs the statements the branch screens and the reconciliation checks depend on against the
# scaled copy of the QA database and prints, for each, the plan's scan nodes and its time.
#   qa/perf/phase3-plans.sh [database] > qa/results/phase3-plans.txt
set -euo pipefail
DB="${1:-steelwise_qa_scale3}"
case "$DB" in *qa*) ;; *) echo "Refusing: not a QA database"; exit 1;; esac
export PGPASSWORD="${PGPASSWORD:-password}"
P="psql -U postgres -h localhost -d $DB -At"
B=$($P -c 'select "locationId" from "Order" where "locationId" is not null group by 1 order by count(*) desc limit 1')
I=$($P -c 'select "locationId" from "Inventory" group by 1 order by count(*) desc limit 1')
C=$($P -c 'select "buyerId" from "Order" group by 1 order by count(*) desc limit 1')
H=$($P -c 'select "heatId" from "Coil" group by 1 order by count(*) desc limit 1')
K=$($P -c 'select "coilId" from "MaterialMovement" group by 1 order by count(*) desc limit 1')
echo "database $DB: $($P -c 'select count(*) from "Order"') orders, $($P -c 'select count(*) from "OrderLine"') order lines, $($P -c 'select count(*) from "Coil"') stock items, $($P -c 'select count(*) from "Job"') jobs, $($P -c 'select count(*) from "Invoice"') invoices, $($P -c 'select count(*) from "MaterialMovement"') movements, $($P -c 'select count(*) from "Location"') branches"
run() { echo; echo "## $1"; $P -c "EXPLAIN (ANALYZE, BUFFERS) $2" | grep -E "Scan|Execution Time|Planning Time|Rows Removed|Sort Method" | sed 's/^ *//' | cut -c1-170 | head -14; }
run "one branch's newest 50 orders" "SELECT * FROM \"Order\" WHERE \"locationId\" IN ('$B') ORDER BY \"createdAt\" DESC LIMIT 50"
run "count of one branch's orders" "SELECT count(*) FROM \"Order\" WHERE \"locationId\" IN ('$B')"
run "one branch's confirmed orders" "SELECT * FROM \"Order\" WHERE \"locationId\" IN ('$B') AND status = 'CONFIRMED' ORDER BY \"createdAt\" DESC LIMIT 50"
run "one branch's invoices, newest 50 (through the order)" "SELECT i.* FROM \"Invoice\" i WHERE i.\"orderId\" IN (SELECT o.id FROM \"Order\" o WHERE o.\"locationId\" IN ('$B')) ORDER BY i.\"createdAt\" DESC LIMIT 50"
run "one branch's open jobs, counted (order branch, or work center branch, or creator's branch)" "SELECT count(*) FROM \"Job\" j LEFT JOIN \"Order\" o ON o.id = j.\"orderId\" LEFT JOIN \"WorkCenter\" w ON w.id = j.\"workCenterId\" LEFT JOIN \"User\" u ON u.id = j.\"createdById\" WHERE j.status IN ('SCHEDULED','IN_PROCESS','ORDERED') AND (o.\"locationId\" IN ('$B') OR w.\"locationId\" IN ('$B') OR (j.\"orderId\" IS NULL AND j.\"workCenterId\" IS NULL AND u.\"homeLocationId\" IN ('$B')))"
run "one branch's stock, newest 50" "SELECT * FROM \"Inventory\" WHERE \"locationId\" IN ('$I') ORDER BY \"updatedAt\" DESC LIMIT 50"
run "stock search by number, heat or grade (whole company)" "SELECT count(*) FROM \"Coil\" c LEFT JOIN \"Heat\" h ON h.id = c.\"heatId\" LEFT JOIN \"Grade\" g ON g.id = c.\"gradeId\" WHERE c.\"coilNumber\" ILIKE '%QA-1%' OR h.\"heatNumber\" ILIKE '%QA-1%' OR g.code ILIKE '%QA-1%'"
run "customer order history" "SELECT * FROM \"Order\" WHERE \"buyerId\" = '$C' ORDER BY \"createdAt\" DESC LIMIT 50"
run "traceability: every item from one heat" "SELECT * FROM \"Coil\" WHERE \"heatId\" = '$H'"
run "traceability: one item's movements" "SELECT * FROM \"MaterialMovement\" WHERE \"coilId\" = '$K' ORDER BY \"createdAt\""
run "reservations on one item" "SELECT sum(\"qtyAllocated\") FROM \"OrderLineAllocation\" WHERE \"coilId\" = '$K'"
run "invoice by shipment (duplicate invoice check)" "SELECT id FROM \"Invoice\" WHERE \"shipmentId\" = (SELECT id FROM \"Shipment\" LIMIT 1)"
run "reconciliation of every stock row against its reservations" "SELECT count(*) FROM \"Inventory\" i WHERE abs(i.\"qtyOnHand\" - (i.\"qtyAvailable\"+i.\"qtyAllocated\"+i.\"qtyOnHold\")) > 0.0001 OR abs(i.\"qtyAllocated\" - COALESCE((SELECT sum(a.\"qtyAllocated\") FROM \"OrderLineAllocation\" a WHERE a.\"coilId\"=i.\"coilId\"),0)) > 0.0001"
run "reconciliation of every invoice against its payments" "SELECT count(*) FROM \"Invoice\" i WHERE abs(i.\"paidAmount\" - COALESCE((SELECT sum(p.amount) FROM \"Payment\" p WHERE p.\"invoiceId\" = i.id),0)) > 0.005"
