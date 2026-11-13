# Test execution results

Generated 2026-11-13T07:20:06.073Z by `qa/tools/report.mjs` from the files in `qa/results/`. Nothing here is typed by hand.

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
| `final-8001.json` | 8001 | 50 | 50 | 0 | 0 | 0 | 715 | 783 | 8 of 8 pass | 0 problems in 323 stock items and 59 orders |
| `final-8002.json` | 8002 | 50 | 50 | 0 | 0 | 0 | 699 | 778 | 8 of 8 pass | 0 problems in 323 stock items and 118 orders |
| `final-8003.json` | 8003 | 50 | 50 | 0 | 0 | 0 | 693 | 770 | 8 of 8 pass | 0 problems in 323 stock items and 177 orders |

**Final consecutive cycles:** 3 cycles, 150 jobs: 150 passed, 0 failed, 0 blocked. 2107 API steps and 2331 checks. Seeds 8001, 8002, 8003.

### By category across the final cycles

| Category | Jobs | Pass | Fail | Blocked |
|---|---|---|---|---|
| standard-metals | 21 | 21 | 0 | 0 |
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
- Pass: two reservations racing for the same stock: exactly one wins. statuses 201,409; available 4800
- Pass: two shipments racing for the same order line: exactly one is created. statuses 201,409
- Pass: one shipment dispatched three times at once: counted once. statuses 200,409,409; line shipped 7200 of 7200; on hand 12000 → 4800
- Pass: 10 simultaneous jobs all saved with distinct numbers. statuses 201,201,201,201,201,201,201,201,201,201
- Pass: one shipment invoiced three more times at once: billed once. statuses 409,409,409; 1 invoice(s), 7200 billed of 7200 shipped
- Pass: three full payments at once on one invoice: taken once. statuses 201,409,409; paid 4680 of 4680
- Pass: one return received three times at once: counted once, one credit. statuses 409,200,409; 1 credit memo(s); source coil on hand 4800 → 6600

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

Run 2026-11-13T07:19:09.906Z. 574 of 574 routes swept.

| Check | Result | Detail |
|---|---|---|
| No access without signing in | Pass | 535 routes tried with no token, 0 did not refuse (39 documented public or partner routes skipped) |
| Partner API needs a partner token | Pass | 60 calls, 0 let in |
| Forged and invalid sign-ins are refused | Pass | 5 cases, 0 problems |
| Customer logins are held to the store | Pass | 512 staff routes tried as a customer, 0 not refused |
| Customers and divisions cannot see each other | Pass | 31 checks, 0 problems |
| Staff roles and departments | Pass | 18 checks, 0 problems |
| Read routes do not crash on bad input | Pass | 750 reads, 0 server errors |
| Core write routes reject bad input cleanly | Pass | 38 bad requests, 0 not answered with a 4xx |
| Documents: upload, list, download, delete | Pass | 11 checks, 0 problems |
| Web checkout uses the system price, not the browser's | Pass | 4 checks, 0 problems |
| Platform safeguards: bounded lists, tracing, real figures, database rules | Pass | 31 checks, 0 problems |
| Error replies do not expose internals | Pass | 0 replies exposed internal detail |

## Screen check

Run 2026-11-13T06:55:02.306Z as qa-admin@qa.test. Every route in the app's router was opened in a real browser (Chromium).

- Screens opened: 123
- OK: 123
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

352 distinct API calls are written in the screens; 155 have no matching server route. Full list in `qa/api-contract.md`.

## Unit tests

Run with `npm test` in `src/backend` (Node built-in test runner). The count and result are printed by the runner; see the pull request for the latest run.
