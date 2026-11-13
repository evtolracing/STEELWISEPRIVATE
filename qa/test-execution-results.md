# Test execution results

Generated 2026-11-13T23:09:47.724Z by `qa/tools/report.mjs` from the files in `qa/results/`. Nothing here is typed by hand.

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
| `r7-4001.json` | 4001 | 50 | 49 | 0 | 0 | 1 | 593 | 492 | 5 of 5 pass | 0 problems in 323 stock items and 56 orders |
| `r7-4002.json` | 4002 | 50 | 49 | 0 | 0 | 1 | 583 | 492 | 5 of 5 pass | 0 problems in 323 stock items and 112 orders |
| `r7-4003.json` | 4003 | 50 | 49 | 0 | 0 | 1 | 595 | 494 | 5 of 5 pass | 0 problems in 323 stock items and 168 orders |
| `r8-7001.json` | 7001 | 50 | 50 | 0 | 0 | 0 | 712 | 776 | 8 of 8 pass | 0 problems in 323 stock items and 59 orders |
| `r8-7002.json` | 7002 | 50 | 50 | 0 | 0 | 0 | 708 | 771 | 8 of 8 pass | 0 problems in 323 stock items and 118 orders |
| `r8-7003.json` | 7003 | 50 | 50 | 0 | 0 | 0 | 700 | 769 | 8 of 8 pass | 0 problems in 323 stock items and 177 orders |
| `final-8001.json` | 8001 | 50 | 50 | 0 | 0 | 0 | 714 | 784 | 8 of 8 pass | 0 problems in 323 stock items and 59 orders |
| `final-8002.json` | 8002 | 50 | 50 | 0 | 0 | 0 | 709 | 785 | 8 of 8 pass | 0 problems in 323 stock items and 118 orders |
| `final-8003.json` | 8003 | 50 | 50 | 0 | 0 | 0 | 711 | 788 | 8 of 8 pass | 0 problems in 323 stock items and 177 orders |

**Final consecutive cycles:** 3 cycles, 150 jobs: 150 passed, 0 failed, 0 blocked. 2134 API steps and 2357 checks. Seeds 8001, 8002, 8003.

### By category across the final cycles

| Category | Jobs | Pass | Fail | Blocked |
|---|---|---|---|---|
| standard-metals | 15 | 15 | 0 | 0 |
| entry-screen | 6 | 6 | 0 | 0 |
| multi-step-metals | 15 | 15 | 0 | 0 |
| plastics | 18 | 18 | 0 | 0 |
| pos-ecommerce | 15 | 15 | 0 | 0 |
| multi-location | 18 | 18 | 0 | 0 |
| transfers-receiving | 15 | 15 | 0 | 0 |
| rush-backorder-exception | 15 | 15 | 0 | 0 |
| partial-rework-return | 15 | 15 | 0 | 0 |
| mixed-division | 12 | 12 | 0 | 0 |
| quick-sale | 3 | 3 | 0 | 0 |
| quote-to-order | 3 | 3 | 0 | 0 |

### Simultaneous-request probes (last final cycle)

- Pass: 10 simultaneous orders all saved with distinct numbers. statuses 201,201,201,201,201,201,201,201,201,201; 10 distinct
- Pass: two reservations racing for the same stock: exactly one wins. statuses 201,409; available 2640
- Pass: two shipments racing for the same order line: exactly one is created. statuses 201,409
- Pass: one shipment dispatched three times at once: counted once. statuses 409,409,200; line shipped 3960 of 3960; on hand 6600 → 2640
- Pass: 10 simultaneous jobs all saved with distinct numbers. statuses 201,201,201,201,201,201,201,201,201,201
- Pass: one shipment invoiced three more times at once: billed once. statuses 409,409,409; 1 invoice(s), 3960 billed of 3960 shipped
- Pass: three full payments at once on one invoice: taken once. statuses 409,201,409; paid 2574 of 2574
- Pass: one return received three times at once: counted once, one credit. statuses 200,409,409; 1 credit memo(s); source coil on hand 2640 → 3630

The reconciliation also found 52 inconsistencies in the demo seed orders (created by the seed script, not by the app). Examples: SO-P1001: fully shipped but status is CONFIRMED; SO-P1003: fully shipped but status is CONFIRMED; SO-C2001 line 1: shipped 7 ≠ shipments that left 0.

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

Run 2026-11-13T22:59:51.952Z. 599 of 599 routes swept.

| Check | Result | Detail |
|---|---|---|
| No access without signing in | Pass | 559 routes tried with no token, 0 did not refuse (40 documented public or partner routes skipped) |
| Partner API needs a partner token | Pass | 60 calls, 0 let in |
| Forged and invalid sign-ins are refused | Pass | 5 cases, 0 problems |
| Customer logins are held to the store | Pass | 536 staff routes tried as a customer, 0 not refused |
| Customers and divisions cannot see each other | Pass | 31 checks, 0 problems |
| Staff roles and departments | Pass | 18 checks, 0 problems |
| Read routes do not crash on bad input | Pass | 792 reads, 0 server errors |
| Core write routes reject bad input cleanly | Pass | 38 bad requests, 0 not answered with a 4xx |
| Documents: upload, list, download, delete | Pass | 11 checks, 0 problems |
| Web checkout uses the system price, not the browser's | Pass | 4 checks, 0 problems |
| Platform safeguards: bounded lists, tracing, real figures, database rules | Pass | 33 checks, 0 problems |
| Error replies do not expose internals | Pass | 0 replies exposed internal detail |
| One customer, one price in every sales channel | Pass | 47 checks, 0 problems |
| Order entry screen follows the order rules | Pass | 43 checks, 0 problems |
| Stock items: lists, cost, edits, holds | Pass | 29 checks, 0 problems |
| Credit hold: over the limit waits for a manager | Pass | 22 checks, 0 problems |
| Heats, products and grades: checked input, right people, prices recorded | Pass | 47 checks, 0 problems |
| Receiving: a receipt is real stock, and an upload says what it saved | Pass | 32 checks, 0 problems |
| Shop floor records: who moved a job, and work orders that follow the rules | Pass | 50 checks, 0 problems |
| Shipping and money records: web order tax, shipments and who did what | Pass | 39 checks, 0 problems |

## Screen check

Run 2026-11-13T23:09:07.332Z as qa-admin@qa.test. Every route in the app's router was opened in a real browser (Chromium).

- Screens opened: 126
- OK: 126
- Screens that made at least one failing API call: 10

### API calls that failed while screens loaded

| Call | Screens |
|---|---|
| `GET /api/shipments/:id → 404` | `/logistics/shipments/:id`, `/shipping/:id` |
| `GET /api/heats/:id → 404` | `/heats/:id` |
| `GET /api/coils/:id/history → 404` | `/units/:id` |
| `GET /api/coils/:id → 404` | `/units/:id` |
| `GET /api/work-orders/:id → 404` | `/work-orders/:id` |
| `GET /api/qc/inspections/:id → 404` | `/qc/inspect/:id` |
| `GET /api/jobs/:id → 404` | `/jobs/:id` |
| `GET /api/jobs/:id/history → 404` | `/jobs/:id` |
| `GET /api/orders/intake/:id → 404` | `/orders/:id` |
| `GET /api/ecom/catalog/:id → 404` | `/shop/products/:id` |
| `GET /api/ecom/my-orders/:id → 404` | `/shop/orders/:id` |

Screens with an id in the address were opened with an id that does not exist, so a "not found" call on those is expected.

## Sales screens operated in a browser

Run 2026-11-13T23:02:55.899Z with `qa/sim/ui-sales.cjs`: Sales Rep Mobile, Sales Dashboard, Pricing and Credit Holds were used as a clerk and as a manager, and what they showed was compared with the database.

- Checks: 24
- Failed: 0

| Check | Result |
|---|---|
| mobile rep: customer search finds a real customer | Pass |
| mobile rep: product search lists real products with prices | Pass |
| mobile rep: the products shown are catalog products | Pass |
| mobile rep: the order is submitted and shows its real order number | Pass |
| mobile rep: the order is saved under the person who entered it | Pass |
| mobile rep: the saved order has the customer, a priced line and totals | Pass |
| mobile rep intake: no script errors | Pass |
| mobile rep: inventory lookup shows live stock | Pass |
| mobile rep inventory: no script errors | Pass |
| mobile rep: order list shows real orders, not samples | Pass |
| mobile rep orders: no script errors | Pass |
| mobile rep home: shows the signed-in person's own order count | Pass |
| sales dashboard: shows counted figures and says what is not available | Pass |
| sales dashboard: no script errors | Pass |
| pricing: lists real products and price levels, not samples | Pass |
| pricing: a clerk is not offered a way to change a list price | Pass |
| pricing: a manager can open the change-price box | Pass |
| pricing: no script errors | Pass |
| credit hold: a manager can set a credit limit on the customer | Pass |
| credit hold: the rep is told the order is on credit hold and why | Pass |
| credit hold: the held order is on the Credit holds list | Pass |
| credit hold: a clerk is not offered Release | Pass |
| credit hold: a manager releases it and it leaves the list | Pass |
| credit hold: the server agrees the order is no longer held | Pass |

## Stock screens operated in a browser

Run 2026-11-13T23:03:18.445Z with `qa/sim/ui-inventory.cjs`: stock items, heats and receiving were used as a clerk and as a manager, and what they showed was compared with the database.

- Checks: 22
- Failed: 0

| Check | Result |
|---|---|
| units: the list shows real stock items | Pass |
| units: search narrows the list on the server | Pass |
| units: an item opens with its own details | Pass |
| units: a clerk is not shown what the stock cost | Pass |
| units: no script errors | Pass |
| units: an item that does not exist says so instead of showing a sample | Pass |
| heats: the list shows real heats, not samples | Pass |
| heats: search narrows the list on the server | Pass |
| heats: a heat opens with its own mill and grade | Pass |
| heats: the stock items tab lists the items from this heat | Pass |
| heats: no script errors | Pass |
| heats: a heat that does not exist says so instead of showing a sample | Pass |
| heats: a manager adds a heat and lands on it | Pass |
| heats: an edit is saved and shown | Pass |
| receiving: no sample deliveries are shown | Pass |
| receiving: a heat that is not on file is said before saving | Pass |
| receiving: a heat on file fills in its grade | Pass |
| receiving: the form receives a real stock item and lists it | Pass |
| receiving: search filters the list and says when nothing matches | Pass |
| receiving: no script errors | Pass |
| units: an item is moved to another location and the move is in its history | Pass |
| units: the move screen has no script errors | Pass |

## Shop screens operated in a browser

Run 2026-11-13T23:02:35.639Z with `qa/sim/ui-shop.cjs`: the job, schedule, time tracking and work order screens were used as an operator and as a manager, and what they showed was compared with the server.

- Checks: 30
- Failed: 0

| Check | Result |
|---|---|
| job: the screen shows the real job, not a sample | Pass |
| job: the history names who started it and why | Pass |
| job: a status change is saved on the server | Pass |
| job: the change appears in the history with the reason | Pass |
| job: the change is still there after reloading | Pass |
| job: a move that is not allowed is refused with the reason | Pass |
| job: no script errors | Pass |
| job: a job that does not exist says so instead of showing a sample | Pass |
| schedule: shows the real work centers and makes no claim it cannot back | Pass |
| schedule: shows the job really scheduled today | Pass |
| schedule: a job on the schedule opens its own screen | Pass |
| schedule: no script errors | Pass |
| order board: clicking a job opens its screen | Pass |
| time tracking: opens without sample data | Pass |
| time tracking: no script errors | Pass |
| work orders: the list opens | Pass |
| work orders: the form carries no made-up scheduling tip | Pass |
| work orders: the form creates a real work order and opens it | Pass |
| work orders: the screen shows the real work order, not a sample | Pass |
| work orders: Start is saved on the server | Pass |
| work orders: more weight out than went in is refused with the reason | Pass |
| work orders: Complete is saved with a yield worked out by the server | Pass |
| work orders: the history names who did each step | Pass |
| work orders: a finished work order offers no more actions | Pass |
| work orders: no script errors | Pass |
| work orders: one that does not exist says so instead of showing a sample | Pass |
| the old sample operator screen now opens the real shop floor | Pass |
| /production-quality/dashboard: says it is a sample screen | Pass |
| /production-quality/ncr: says it is a sample screen | Pass |
| /boms: says it is a sample screen | Pass |

## Shipping and invoice screens operated in a browser

Run 2026-11-13T23:02:09.407Z with `qa/sim/ui-shipping.cjs`: a shipment was created, dispatched, delivered and cancelled as shipping staff, and a payment recorded as a manager; what the screens showed was compared with the server.

- Checks: 29
- Failed: 0

| Check | Result |
|---|---|
| shipping: the list is the real one, not the sample shipments | Pass |
| new shipment: an order that is not on file says so | Pass |
| new shipment: finding an order lists its lines and the customer | Pass |
| new shipment: it is saved on the server and its screen opens | Pass |
| shipment: the screen shows the order, customer, line and carrier | Pass |
| shipment: the history says who created it | Pass |
| shipment: truck and driver are saved and shown | Pass |
| shipment: dispatch asks before it takes stock and bills | Pass |
| shipment: with nothing reserved the dispatch is refused and the screen says to reserve the stock | Pass |
| shipment: the stock going out is reserved on the order | Pass |
| shipment: dispatch is saved, and the history names who dispatched | Pass |
| shipment: the invoice raised by the dispatch is shown with its total | Pass |
| shipment: once dispatched it cannot be cancelled or edited | Pass |
| shipment: delivery is saved with who signed for it | Pass |
| shipment: after reloading it is still delivered with three history rows | Pass |
| shipment screens: no script errors | Pass |
| shipping: search finds the shipment by carrier, on the server | Pass |
| shipping: a search with no match says so | Pass |
| shipment: cancelling one that has not left is saved and says nothing was billed | Pass |
| shipment: one that does not exist says so | Pass |
| the old sample shipment list now opens the real Shipping screen | Pass |
| an old shipment link opens the real shipment | Pass |
| invoice: it shows tax carried from the order and who issued it | Pass |
| invoice: a payment is saved and the history names who took it | Pass |
| invoice screen: no script errors | Pass |
| all orders: real orders are listed with no sample fallback | Pass |
| /freight/planner: says it is a sample screen and points to Shipping | Pass |
| /freight/tracking: says it is a sample screen and points to Shipping | Pass |
| /logistics/dispatch: says it is a sample screen and points to Shipping | Pass |

## Sample notices and invented figures checked in a browser

Run 2026-11-13T23:01:48.059Z with `qa/sim/ui-experience.cjs`.

- Checks: 22
- Failed: 0

| Check | Result |
|---|---|
| /safety: says it is a sample screen | Pass |
| /safety/incidents: says it is a sample screen | Pass |
| /safety/stop-work: says it is a sample screen | Pass |
| /maintenance/dashboard: says it is a sample screen | Pass |
| /maintenance/parts: says it is a sample screen | Pass |
| /provenance: says it is a sample screen | Pass |
| /executive/cockpit: says it is a sample screen | Pass |
| /executive/forecast: says it is a sample screen | Pass |
| /training/dashboard: says it is a sample screen | Pass |
| /contractors/active: says it is a sample screen | Pass |
| /customer-quality/claims: says it is a sample screen | Pass |
| /customer-quality/rma: says it is a sample screen | Pass |
| /qaqc: says it is a sample screen | Pass |
| /shipping: a real screen carries no sample notice | Pass |
| /orders/invoices: a real screen carries no sample notice | Pass |
| /schedule: a real screen carries no sample notice | Pass |
| /admin/users: a real screen carries no sample notice | Pass |
| order board: no invented assistant or AI claim on the board | Pass |
| role dashboard: opens | Pass |
| role dashboard: a failed figure is not replaced by an invented one | Pass |
| role dashboard: failed figures say they are not available | Pass |
| role dashboard: the assistant says it is not connected and invents nothing | Pass |

## Screen audit

144 screens: 5 STATIC, 77 REAL, 58 SAMPLE, LABELLED, 4 MIXED. 0 show made-up data with no notice. Full list in `qa/screen-audit.md`.

## Screen-to-server contract

287 distinct API calls are written in the screens; 83 have no matching server route. Full list in `qa/api-contract.md`.

## Unit tests

Run with `npm test` in `src/backend` (Node built-in test runner). The count and result are printed by the runner; see the pull request for the latest run.
