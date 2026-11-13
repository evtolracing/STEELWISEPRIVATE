# Test execution results

Generated 2026-11-13T05:13:15.067Z by `qa/tools/report.mjs` from the files in `qa/results/`. Nothing here is typed by hand.

All runs were against the local QA database `steelwise_qa` (80 test branches, 280 work centers, 323 stock items, 16 test customers). No production system was touched.

## Simulation cycles, in the order they ran

| Run | Seed | Jobs | Pass | Fail | Error | Blocked | API steps | Checks | Simultaneous-request probes | Whole-database reconciliation |
|---|---|---|---|---|---|---|---|---|---|---|
| `baseline-1001.json` | 1001 | 50 | 3 | 46 | 0 | 1 | 59 | 45 | 0 of 10 orders saved | not run |
| `r2-1001.json` | 1001 | 50 | 46 | 3 | 0 | 1 | 567 | 476 | 10 of 10 orders saved | not run |
| `r3-1002.json` | 1002 | 50 | 49 | 0 | 0 | 1 | 592 | 491 | 5 of 5 pass | 49 problems in 323 stock items and 172 orders |
| `r4-1003.json` | 1003 | 50 | 49 | 0 | 0 | 1 | 582 | 491 | 5 of 5 pass | 0 problems in 323 stock items and 195 orders |
| `r5-2001.json` | 2001 | 50 | 49 | 0 | 0 | 1 | 586 | 490 | 5 of 5 pass | 0 problems in 323 stock items and 254 orders |
| `r5-2002.json` | 2002 | 50 | 49 | 0 | 0 | 1 | 596 | 490 | 5 of 5 pass | 0 problems in 323 stock items and 310 orders |
| `r5-2003.json` | 2003 | 50 | 49 | 0 | 0 | 1 | 583 | 492 | 5 of 5 pass | 0 problems in 323 stock items and 366 orders |
| `r6-3001.json` | 3001 | 50 | 49 | 0 | 0 | 1 | 590 | 489 | 5 of 5 pass | 0 problems in 323 stock items and 423 orders |
| `r6-3002.json` | 3002 | 50 | 49 | 0 | 0 | 1 | 594 | 493 | 5 of 5 pass | 0 problems in 323 stock items and 479 orders |
| `r6-3003.json` | 3003 | 50 | 49 | 0 | 0 | 1 | 586 | 484 | 5 of 5 pass | 0 problems in 323 stock items and 535 orders |
| `final-4001.json` | 4001 | 50 | 49 | 0 | 0 | 1 | 593 | 492 | 5 of 5 pass | 0 problems in 323 stock items and 56 orders |
| `final-4002.json` | 4002 | 50 | 49 | 0 | 0 | 1 | 583 | 492 | 5 of 5 pass | 0 problems in 323 stock items and 112 orders |
| `final-4003.json` | 4003 | 50 | 49 | 0 | 0 | 1 | 595 | 494 | 5 of 5 pass | 0 problems in 323 stock items and 168 orders |

**Final consecutive cycles:** 3 cycles, 150 jobs: 147 passed, 0 failed, 3 blocked. 1771 API steps and 1478 checks. Seeds 4001, 4002, 4003.

Blocked jobs are not passes. They are jobs the app has no way to perform:

- S4001-46 (partial-rework-return): No API to receive a customer return (Order type RETURN exists, but no endpoint creates or processes one).
- S4002-46 (partial-rework-return): No API to receive a customer return (Order type RETURN exists, but no endpoint creates or processes one).
- S4003-46 (partial-rework-return): No API to receive a customer return (Order type RETURN exists, but no endpoint creates or processes one).

### By category across the final cycles

| Category | Jobs | Pass | Fail | Blocked |
|---|---|---|---|---|
| standard-metals | 24 | 24 | 0 | 0 |
| multi-step-metals | 18 | 18 | 0 | 0 |
| plastics | 18 | 18 | 0 | 0 |
| pos-ecommerce | 15 | 15 | 0 | 0 |
| multi-location | 18 | 18 | 0 | 0 |
| transfers-receiving | 15 | 15 | 0 | 0 |
| rush-backorder-exception | 15 | 15 | 0 | 0 |
| partial-rework-return | 15 | 12 | 0 | 3 |
| mixed-division | 12 | 12 | 0 | 0 |

### Simultaneous-request probes (last final cycle)

- Pass: 10 simultaneous orders all saved with distinct numbers. statuses 201,201,201,201,201,201,201,201,201,201; 10 distinct
- Pass: two reservations racing for the same stock: exactly one wins. statuses 201,409; available 6400
- Pass: two shipments racing for the same order line: exactly one is created. statuses 201,409
- Pass: one shipment dispatched three times at once: counted once. statuses 200,409,409; line shipped 9600 of 9600; on hand 16000 → 6400
- Pass: 10 simultaneous jobs all saved with distinct numbers. statuses 201,201,201,201,201,201,201,201,201,201

### Known open defects re-checked every cycle

- D-014: Counter quick sale cannot add an item or take payment. Still present (500 {"error":"Failed to add item"}).
- D-015: No way to record a customer return. Still present (POST /api/returns → 404).
- D-016: No way to create an invoice or record a payment. Still present (POST /api/invoices → 404).

The reconciliation also found 49 inconsistencies in the demo seed orders (created by the seed script, not by the app). Examples: SO-P1001: fully shipped but status is CONFIRMED; SO-P1003: fully shipped but status is CONFIRMED; SO-C2001 line 1: shipped 7 ≠ shipments that left 0.

## What the baseline run found before any repair

- Step failed in 39 job(s): create sales order. Example: `S1001-01: 500 {"error":"Failed to create order"}`
- Step failed in 2 job(s): POS: add item. Example: `S1001-24: 500 {"error":"Failed to add item"}`
- Step failed in 2 job(s): POS: take cash payment. Example: `S1001-24: 500 {"error":"Failed to process payment"}`
- Step failed in 1 job(s): receive more of an existing item. Example: `S1001-32: 500 {"error":"Failed to receive inventory"}`
- Step failed in 1 job(s): reject a negative receipt. Example: `S1001-33: 500 {"error":"Failed to receive inventory"}`
- Step failed in 1 job(s): transfer whole item between branches. Example: `S1001-34: 500 {"error":"Failed to transfer inventory"}`
- Step failed in 1 job(s): reject a transfer from the wrong branch. Example: `S1001-35: 500 {"error":"Failed to transfer inventory"}`
- Step failed in 1 job(s): reject a partial transfer of a single tracked item. Example: `S1001-36: 500 {"error":"Failed to transfer inventory"}`
- Check failed in 2 job(s): POS total includes the items. Example: `S1001-24: total 0`
- Check failed in 1 job(s): receipt adds exactly the received qty. Example: `S1001-32: 11000 → 11000`
- Check failed in 1 job(s): receipt recorded against the signed-in user. Example: `S1001-32: createdById undefined`

## Security, isolation and robustness sweep

Run 2026-11-13T05:12:57.333Z. 581 of 581 routes swept.

| Check | Result | Detail |
|---|---|---|
| No access without signing in | Pass | 542 routes tried with no token, 0 did not refuse (39 documented public or partner routes skipped) |
| Partner API needs a partner token | Pass | 60 calls, 0 let in |
| Forged and invalid sign-ins are refused | Pass | 5 cases, 0 problems |
| Customer logins are held to the store | Pass | 519 staff routes tried as a customer, 0 not refused |
| Customers cannot see each other | Pass | 7 checks, 0 problems |
| Staff roles | Pass | 0 problems, 1 observation(s) needing a policy decision |
| Read routes do not crash on bad input | FINDINGS | 753 reads, 7 server errors |
| Core write routes reject bad input cleanly | Pass | 38 bad requests, 0 not answered with a 4xx |
| Documents: upload, list, download, delete | Pass | 11 checks, 0 problems |
| Web checkout prices are checked against the system price | Pass | 3 checks, 0 problems |
| Error replies do not expose internals | Pass | 0 replies exposed internal detail |

### Staff roles

- Observation: A saw-operator login edited a sales order through the API → 200. Screens are limited by role, but the API lets any signed-in staff member use any staff route.

### Read routes do not crash on bad input

- /api/rfqs/:id → 500 {"error":"Failed to fetch RFQ"} [rfqs.js]
- /api/rfqs/:id (hostile filter) → 500 {"error":"Failed to fetch RFQ"} [rfqs.js]
- /api/quotes → 500 {"error":"Failed to fetch quotes"} [quotes.js]
- /api/quotes/:id → 500 {"error":"Failed to fetch quote"} [quotes.js]
- /api/quotes/:id (hostile filter) → 500 {"error":"Failed to fetch quote"} [quotes.js]
- /api/pos/quick-sale/:saleId/receipt → 500 {"error":"Failed to get receipt"} [pos.js]
- /api/pos/quick-sale/:saleId/receipt (hostile filter) → 500 {"error":"Failed to get receipt"} [pos.js]

## Screen check

Run 2026-11-13T03:19:54.640Z as qa-admin@qa.test. Every route in the app's router was opened in a real browser (Chromium).

- Screens opened: 120
- OK: 120
- Screens that made at least one failing API call: 7

### API calls that failed while screens loaded

| Call | Screens |
|---|---|
| `GET /api/heats/:id → 404` | `/heats/:id` |
| `GET /api/coils/:id → 404` | `/units/:id` |
| `GET /api/work-orders/:id → 404` | `/work-orders/:id` |
| `GET /api/qc/inspections/:id → 404` | `/qc/inspect/:id` |
| `GET /api/orders/intake/:id → 404` | `/orders/:id` |
| `GET /api/ecom/catalog/:id → 404` | `/shop/products/:id` |
| `GET /api/ecom/my-orders/:id → 404` | `/shop/orders/:id` |

Screens with an id in the address were opened with an id that does not exist, so a "not found" call on those is expected.

## Screen-to-server contract

332 distinct API calls are written in the screens; 152 have no matching server route. Full list in `qa/api-contract.md`.

## Unit tests

Run with `npm test` in `src/backend` (Node built-in test runner). The count and result are printed by the runner; see the pull request for the latest run.
