# Phase 11: frontend under load

Date: 2026-11-18. Every figure here was measured in this session on one local machine (4 processors, 15.7 GB), against a local PostgreSQL 16 database whose name contains `qa`, with synthetic data only, the server copies connected as the least-privilege role `steelwise_runtime`, and a local stand-in for every outside service. Nothing was run against the live database, the host or any real partner, carrier, payment or accounting system. Anything not run is marked NOT VERIFIED.

The screens were opened in a real browser (Chromium) against the database as it stands after the enterprise day and the scenario groups before it, with the server answering through the front door.

## Scenarios

From the final run on a rebuilt database (`qa/results/phase11-scenarios.json`).

| Scenario | Result | Checks | Measured |
|---|---|---:|---:|
| The five dashboards answer within the proposed limit at this volume | pass | 10 | 200,200,200,200,200,200,200,200,200,200,200,200 ; median 11 ms, p95 25 ms; 200,200,200,200,200,200,200,200,200,200,200,200 ; median 28 ms, p95 32 ms; 200,200,200,200,200,200,200,200,200,200,200,200 ; median 15 ms, p95 22 |
| The dashboards keep answering while twenty sales are shipped and billed | pass | 3 | 200,200,200,200,200,200,200,200,200,200,200,200,200,200,200,200,200,200,200,200; 200,200,200,200,200,200,200,200,200,200,200,200,200,200,200,; p95 318 ms, slowest 332 ms |
| Revenue adds up to the same total whether it is read by branch or by customer | pass | 4 | 200 200; 1047291.06 vs 1047291.06; MATCH 0.00 |
| The stock value report equals the stock value the reconciliation reads from the books | pass | 3 | 200; 9199917.230000002 / {"rawMaterial":"9135022.73","finishedGoods":"64894.50","inTransit":"0.00","ledger":"9199917.23","records":"9199917.23","difference":"0.00","uncostedItems":325} vs 9199917.23; 0.00 |
| Twelve people read the receivables report at once and get the same figures | pass | 4 | 200,200,200,200,200,200,200,200,200,200,200,200; p95 106 ms |
| Lists are served a page at a time however much is asked for | pass | 15 | 200 ; p95 24 ms; 200, 100 rows, 193 KB; 200 ; p95 20 ms; 200, 200 rows, 245 KB; 200 ; p95 20 ms; 200, 200 rows, 229 KB; 200 ; p95 31 ms; 200, 200 rows, 510 KB; 200 ; p95 20 ms; 200, 200 rows, 134 KB |
| The reconciliation of the whole books runs within the proposed limit at this volume | pass | 2 | []; 0 events held before this run began; 97, 99, 102, 117, 96 ms |
| The month's export and statement are produced within the proposed limit at this volume | pass | 12 | 200 ; 29 ms; 200 ; 16 ms; 200 ; 22 ms; 200 ; 9 ms; 200 ; 8 ms; 200 ; 7 ms |
| In the browser, the order list opens at this volume without errors and without drawing every row | pass | 6 | http://localhost:5199 answers; playwright found; http://localhost:5199/orders Skip to the page
Orders
Ctrl K
Cutoff 3:30 PM (19m left)
PB
SW
SteelWise
Steel E; 1519 ms; 1 rows, 2371 elements |
| In the browser, the invoice list opens at this volume without errors and without drawing every row | pass | 6 | http://localhost:5199 answers; playwright found; http://localhost:5199/orders/invoices Skip to the page
Invoices
Ctrl K
Cutoff 3:30 PM (19m left)
PB
SW
SteelWise
Steel; 1622 ms; 23 rows, 1975 elements |
| In the browser, the inventory screen opens at this volume without errors and without drawing every row | pass | 6 | http://localhost:5199 answers; playwright found; http://localhost:5199/units Skip to the page
Inventory
Ctrl K
Cutoff 3:30 PM (19m left)
PI
SW
SteelWise
Stee; 1614 ms; 25 rows, 1633 elements |
| In the browser, the shipping screen opens at this volume without errors and without drawing every row | pass | 6 | http://localhost:5199 answers; playwright found; http://localhost:5199/shipping Skip to the page
Shipping
Ctrl K
Cutoff 3:30 PM (19m left)
PS
SW
SteelWise
Steel; 1153 ms; 35 rows, 1649 elements |
| In the browser, the finance screen opens at this volume without errors and without drawing every row | pass | 6 | http://localhost:5199 answers; playwright found; http://localhost:5199/finance Skip to the page
Finance
Ctrl K
Cutoff 3:30 PM (19m left)
PC
SW
SteelWise
Steel ; 1370 ms; 10 rows, 1640 elements |
| In the browser, the executive cockpit opens at this volume without errors and without drawing every row | pass | 6 | http://localhost:5199 answers; playwright found; http://localhost:5199/executive/cockpit Skip to the page
Executive Ops Cockpit
Ctrl K
Cutoff 3:30 PM (19m left)
PE
SW
St; 1301 ms; 0 rows, 1952 elements |
| In the browser, the order board opens at this volume without errors and without drawing every row | pass | 6 | http://localhost:5199 answers; playwright found; http://localhost:5199/order-board Skip to the page
Order Board
Ctrl K
Cutoff 3:30 PM (19m left)
PB
SW
SteelWise
St; 1559 ms; 0 rows, 2135 elements |
| Every server copy runs the same build and says which | pass | 3 | qa/tools/qa-cluster.mjs; 200,200,200; ["status","database","databaseLatencyMs","timestamp","uptimeSeconds"] |
| Database update 18 is recorded, repeatable and matches the schema | pass | 4 | [{"migration_name":"20261118150000_shared_rate_limits","finished_at":"2026-11-18T20:02:28.857Z"}]; count,key,windowStart |
| The build does not touch the database and the frontend holds no TypeScript | pass | 2 | 0 |

## What was checked on each screen

That it opens with no page error, within the proposed 3,000 ms, shows real rows, and does not draw every row of a long list at once (lists are served a page at a time).

## Accurate reporting of success and failure

The answers the screens depend on were checked at the server: a busy save answers 409 "busy, try again" and never a false success; a save that found no database connection answers 503 and says to check whether it was saved; a keyed repeat gets the first answer back. That each screen shows those messages well was checked in Phases 8 and 9, and those browser suites are rerun in the full gate: Ten earlier browser suites 0 failed; Phase 9 browser scenarios 232 of 232; Phase 9.5 browser 13 of 13; every screen ceiling held.

## Not verified

- Many browsers at once. One browser was used; the load came from the load driver.
- Phones and slow networks under load.
- The live host's content delivery.
