# Phase 4: integration performance at 80 locations

## 1. Environment and data

| Item | Value |
|---|---|
| Machine | This session's container: 4 processors, local PostgreSQL 16, one server process. Not the host |
| Database | `steelwise_qa_scale3`: 85 branches, 72,240 orders, 74,347 order lines, 50,869 shipments, 37,625 invoices, 100,233 stock items, with SQL Editor files 6 to 10 applied |
| Tool | `qa/perf/phase4-load.mjs`; result `qa/results/phase4-load.json`; first measurement `qa/results/phase4-load-before.json` |
| Outside addresses | A local stand-in that answers at once, or after 200 ms where stated |

## 2. Workload assumptions

No production traffic figures exist and none were invented. The loads below were chosen to be clearly above one busy minute at 80 branches, so that a pass means headroom and a failure is visible.

| Assumption | Value | Reasoning |
|---|---|---|
| Branches | 80 (85 in the data) | The stated target |
| List screens loaded at the same instant | 80 | Every branch opening the same list in the same second: a worst case, not a typical one |
| Orders confirmed at the same instant | 80 | One per branch in the same second |
| Partner systems subscribed to an order's events | 1 to 3 | The customer's system; up to three subscriptions were active during the run |
| Events waiting after an outage | 500 for one subscriber | Several hours of one busy customer's events |
| Scheduled run | Up to 100 events and 20 s per call, every 5 minutes | The proposed host setting |

## 3. Lists, single and in a burst of 80

| Login | Request | Status | Size | p50 / p95 alone | 80 at once, wall | 80 at once, p95 | Failed |
|---|---|---:|---:|---:|---:|---:|---:|
| All branches | GET /api/orders?limit=50 | 200 | 95.9 KB | 36 / 40 ms | 1548 ms | 1523 ms | 0 |
| All branches | GET /api/orders?limit=50&view=summary | 200 | 40.6 KB | 32 / 35 ms | 1347 ms | 1341 ms | 0 |
| All branches | GET /api/orders?limit=50&offset=5000&view=summary | 200 | 39.2 KB | 36 / 44 ms | 1610 ms | 1606 ms | 0 |
| All branches | GET /api/inventory?limit=50 | 200 | 126.6 KB | 25 / 31 ms | 759 ms | 747 ms | 0 |
| All branches | GET /api/shipments?limit=50 | 200 | 58.0 KB | 35 / 41 ms | 728 ms | 715 ms | 0 |
| One branch | GET /api/orders?limit=50 | 200 | 119.3 KB | 19 / 21 ms | 506 ms | 491 ms | 0 |
| One branch | GET /api/orders?limit=50&view=summary | 200 | 42.2 KB | 15 / 17 ms | 351 ms | 344 ms | 0 |
| One branch | GET /api/shipments?limit=50 | 200 | 48.3 KB | 13 / 14 ms | 336 ms | 330 ms | 0 |
| Customer partner | GET /customer/orders?limit=50 | 200 | 22.0 KB | 18 / 24 ms | 406 ms | 399 ms | 0 |
| Customer partner | GET /customer/invoices?limit=50 | 200 | 19.6 KB | 23 / 27 ms | 758 ms | 753 ms | 0 |
| Customer partner | GET /customer/shipments?limit=50 | 200 | 23.7 KB | 24 / 26 ms | 673 ms | 662 ms | 0 |
| Carrier partner | GET /carrier/shipments?limit=50 | 200 | 0.1 KB | 7 / 8 ms | 170 ms | 164 ms | 0 |
| Administrator | GET /api/admin/integrations (10 at once) | 200 | 8.5 KB | 156 / 182 ms | 718 ms | 717 ms | 0 |

Reading it: a branch login's lists answer in under half a second even when 80 arrive together. An all-branch login's order list takes 1.3 to 1.6 seconds in that burst, because each request also counts all 72,000 orders for the total; eighty all-branch logins loading at the same instant is not a realistic load, and alone the request takes 36 ms. The summary view is less than half the size of the full list (G-014's acceptance was under 50 KB for 50 orders: 40.6 KB).

## 4. Two problems the measurement found, both corrected

| # | Found | Cause | Correction | Before | After |
|---|---|---|---|---|---|
| 1 | The new order summary was slower than the full list it was meant to replace | The line count was asked for as part of the list query, and the database counted the lines of every order, not of the 50 on the page | Lines are counted for the page's orders only | All-branch login: 60 / 63 ms alone, 2742 ms for 80 at once (first run, printed by the tool; that run stopped later at a fault in the test harness, so no file was saved) | 32 / 35 ms alone, 1347 ms for 80 at once |
| 2 | After 80 orders were confirmed at once, only about 12 of 160 events were sent; the rest waited for a scheduled run (H-019) | Every finished request started its own delivery run, and all of them reached for the same ten oldest rows; deliveries went out one at a time | One drain per server instance that runs until nothing is due; eight deliveries in flight at once; a 20 s budget for the scheduled run | All delivered only after 20.8 s and a scheduled run (`phase4-load-before.json`) | All 80 delivered 0.6 s after the burst, with no scheduled run |

## 5. What recording events costs the request

| 80 orders confirmed at once | Wall | p50 | p95 |
|---|---:|---:|---:|
| Customer with a subscribed system (an event row is written in the same transaction) | 493 ms | 319 ms | 431 ms |
| Customer with none | 315 ms | 227 ms | 312 ms |

About 120 ms more at the 95th percentile under an 80-way burst; 80 of 80 confirmed in both cases, 80 events recorded, 80 delivered, 80 calls received.

## 6. Catching up after an outage

| Backlog | Partner answers | Runs | Wall | Events a second | Delivered | Calls received | Distinct events |
|---|---|---:|---:|---:|---:|---:|---:|
| 500 | At once | 5 | 1.0 s | 489 | 500 | 500 | 500 |
| 200 | After 200 ms | 2 | 5.6 s | 36 | 200 | 200 | 200 |
| 500, four runs at the same moment | At once | 20 | 1.3 s | 392 | 500 | 500 | 500 |

Before the correction: 119 a second, and 5 a second with the slow partner (42 s for 200). Four overlapping runs sent each event exactly once.

At the proposed schedule (100 events per run, every 5 minutes) the scheduled run alone clears 1,200 events an hour. It only handles retries and leftovers: the first attempt is made right after each action.

## 7. Not measured

| Subject | Why |
|---|---|
| The host | No access. Function time limits, cold starts and the number of instances will change every figure here |
| Several server instances | One process was run. Correctness with overlapping delivery runs was tested; throughput was not |
| Sustained load over hours | Bursts only |
| Real partner addresses over the internet | A local stand-in |
| Email, text, payment, carrier and tax calls | Not connected |
| Report and dashboard queries | Phase 11 |

## 8. Capacity statement

On this machine, with the stated assumptions, the integration layer has headroom at 80 branches: no request failed, branch lists stay under half a second in a burst of 80, recording events adds about a tenth of a second to a confirmation under the same burst, and a 500-event backlog clears in about a second. This is not a statement about the host.
