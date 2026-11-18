# Phase 11: concurrency results

Date: 2026-11-18. Every figure here was measured in this session on one local machine (4 processors, 15.7 GB), against a local PostgreSQL 16 database whose name contains `qa`, with synthetic data only, the server copies connected as the least-privilege role `steelwise_runtime`, and a local stand-in for every outside service. Nothing was run against the live database, the host or any real partner, carrier, payment or accounting system. Anything not run is marked NOT VERIFIED.

## Progressive levels

The same work is run with more and more customer jobs in flight. Each level is a quarter of the day.

### Cycle 1, Baseline (3 server copies)

| Jobs in flight | Work items | Seconds | Requests | Requests per second | Peak requests in flight | All requests P50 | P95 | P99 | Dispatch P50 | Dispatch P95 | Dispatch P99 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|---|---|
| 8 | 222 | 16.6 | 1,781 | 107.2 | 11 | 29 ms | 283 ms | 1,098 ms | not split out in this run |  |  |
| 16 | 222 | 14.5 | 1,729 | 118.9 | 18 | 37 ms | 670 ms | 2,212 ms | not split out in this run |  |  |
| 32 | 222 | 15 | 1,795 | 119.8 | 34 | 45 ms | 961 ms | 6,952 ms | not split out in this run |  |  |
| 48 | 221 | 15.3 | 1,711 | 112.2 | 50 | 46 ms | 2,367 ms | 6,253 ms | not split out in this run |  |  |

### Cycle 2, Correction (3 server copies)

| Jobs in flight | Work items | Seconds | Requests | Requests per second | Peak requests in flight | All requests P50 | P95 | P99 | Dispatch P50 | Dispatch P95 | Dispatch P99 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 8 | 222 | 13.7 | 1,788 | 130.8 | 11 | 35 ms | 241 ms | 435 ms | 254 ms | 667 ms | 730 ms |
| 16 | 222 | 11.9 | 1,730 | 145.8 | 18 | 39 ms | 644 ms | 1,364 ms | 954 ms | 1,599 ms | 1,766 ms |
| 32 | 222 | 12.5 | 1,800 | 144.5 | 35 | 50 ms | 1,688 ms | 3,273 ms | 2,249 ms | 3,731 ms | 4,004 ms |
| 48 | 221 | 12.5 | 1,715 | 136.9 | 51 | 50 ms | 2,732 ms | 4,787 ms | 3,203 ms | 5,262 ms | 5,749 ms |

### Cycle 3, Full Revalidation (3 server copies)

| Jobs in flight | Work items | Seconds | Requests | Requests per second | Peak requests in flight | All requests P50 | P95 | P99 | Dispatch P50 | Dispatch P95 | Dispatch P99 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 8 | 222 | 15.1 | 1,814 | 120.3 | 11 | 38 ms | 256 ms | 530 ms | 283 ms | 697 ms | 796 ms |
| 16 | 222 | 13 | 1,733 | 132.9 | 18 | 45 ms | 622 ms | 1,565 ms | 916 ms | 1,913 ms | 2,184 ms |
| 32 | 222 | 12.6 | 1,801 | 142.8 | 35 | 56 ms | 1,696 ms | 3,140 ms | 2,230 ms | 3,480 ms | 3,748 ms |
| 48 | 221 | 13.1 | 1,712 | 130.2 | 51 | 51 ms | 2,958 ms | 4,706 ms | 3,511 ms | 4,966 ms | 5,107 ms |

### Cycle 5, Final Certification (3 server copies)

| Jobs in flight | Work items | Seconds | Requests | Requests per second | Peak requests in flight | All requests P50 | P95 | P99 | Dispatch P50 | Dispatch P95 | Dispatch P99 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 8 | 222 | 15.5 | 1,814 | 117.2 | 11 | 39 ms | 262 ms | 525 ms | 288 ms | 696 ms | 1,129 ms |
| 16 | 222 | 14.2 | 1,753 | 123.8 | 19 | 48 ms | 706 ms | 1,621 ms | 1,107 ms | 1,865 ms | 2,147 ms |
| 32 | 222 | 13.7 | 1,814 | 132.2 | 35 | 58 ms | 1,457 ms | 3,888 ms | 2,359 ms | 4,617 ms | 5,097 ms |
| 48 | 221 | 13.4 | 1,718 | 128.2 | 50 | 52 ms | 3,299 ms | 4,714 ms | 3,559 ms | 5,175 ms | 5,395 ms |

Reading: ordinary requests stay fast at every level. The dispatch, which writes the invoice, is the one step that slows as more jobs are in flight, because invoices are written one at a time for the whole company (Z-006).

## By role, while the work ran (cycle 5)

| Who reads what | Requests | P50 | P95 | P99 |
|---|---:|---:|---:|---:|
| branch manager: invoices list | 71 | 22 ms | 54 ms | 167 ms |
| branch manager: orders list | 71 | 20 ms | 57 ms | 114 ms |
| branch manager: shipments list | 71 | 21 ms | 54 ms | 126 ms |
| branch manager: stock list | 71 | 24 ms | 66 ms | 94 ms |
| executive: KPIs | 34 | 15 ms | 54 ms | 182 ms |
| executive: cockpit | 34 | 14 ms | 38 ms | 73 ms |
| executive: company dashboard | 34 | 20 ms | 72 ms | 123 ms |
| executive: inventory value | 34 | 43 ms | 97 ms | 154 ms |
| finance: receivables | 52 | 30 ms | 72 ms | 180 ms |
| finance: revenue by branch | 52 | 21 ms | 74 ms | 152 ms |
| finance: trial balance (end of day) | 1 | 15 ms | 15 ms | 15 ms |
| finance: trial balance | 52 | 25 ms | 61 ms | 117 ms |
| operations: cockpit | 34 | 46 ms | 92 ms | 200 ms |
| sales: dashboard | 34 | 30 ms | 68 ms | 335 ms |

Sign-in: 818 people, 24 at a time, in 25.2 s; P50 725 ms, P95 974 ms, P99 1,122 ms; 0 failed.

## What happened in the database (every cycle)

| Cycle | Deadlocks | Transactions rolled back | Committed | Most sessions waiting for a lock at once | Most sessions open |
|---|---:|---:|---:|---:|---:|
| 1 Baseline | 0 | 3,269 | 99,073 | 15 | 29 |
| 2 Correction | 0 | 230 | 99,934 | 5 | 30 |
| 3 Full Revalidation | 0 | 220 | 99,962 | 5 | 30 |
| 4 Failure and Recovery | 0 | 206 | 100,736 | 6 | 31 |
| 5 Final Certification | 0 | 204 | 100,787 | 5 | 30 |

## Concurrency scenarios

From the final run on a rebuilt database (`qa/results/phase11-scenarios.json`).

### Sales, inventory and purchasing concurrency

| Scenario | Result | Checks |
|---|---|---:|
| Large processing branch QA-L10: six orders reach for the last 1,000 lb of a lot at the same moment | pass | 4 |
| Large processing branch QA-L10: one order is confirmed by four people at the same moment | pass | 3 |
| Large processing branch QA-L10: the same receipt is keyed four times at the same moment | pass | 4 |
| Large processing branch QA-L10: twelve orders are entered at the same moment by the branch's sellers | pass | 3 |
| Large processing branch QA-L10: an order is cancelled at the moment its stock is being reserved | pass | 3 |
| Large processing branch QA-L10: more is reserved than the lot has | pass | 3 |
| Large processing branch QA-L10: another branch tries to reserve this branch's stock while both are selling | pass | 3 |
| Large processing branch QA-L10: a purchase order is placed by four people at the same moment | pass | 2 |
| Large processing branch QA-L10: the same reservation is sent five times at the same moment | pass | 4 |
| Medium service center QA-L02: six orders reach for the last 1,000 lb of a lot at the same moment | pass | 4 |
| Medium service center QA-L02: one order is confirmed by four people at the same moment | pass | 3 |
| Medium service center QA-L02: the same receipt is keyed four times at the same moment | pass | 4 |
| Medium service center QA-L02: twelve orders are entered at the same moment by the branch's sellers | pass | 3 |
| Medium service center QA-L02: an order is cancelled at the moment its stock is being reserved | pass | 3 |
| Medium service center QA-L02: more is reserved than the lot has | pass | 3 |
| Medium service center QA-L02: another branch tries to reserve this branch's stock while both are selling | pass | 3 |
| Medium service center QA-L02: a purchase order is placed by four people at the same moment | pass | 2 |
| Medium service center QA-L02: the same reservation is sent five times at the same moment | pass | 4 |
| Small distribution branch QA-L06: six orders reach for the last 1,000 lb of a lot at the same moment | pass | 4 |
| Small distribution branch QA-L06: one order is confirmed by four people at the same moment | pass | 3 |
| Small distribution branch QA-L06: the same receipt is keyed four times at the same moment | pass | 4 |
| Small distribution branch QA-L06: twelve orders are entered at the same moment by the branch's sellers | pass | 3 |
| Small distribution branch QA-L06: an order is cancelled at the moment its stock is being reserved | pass | 3 |
| Small distribution branch QA-L06: more is reserved than the lot has | pass | 3 |
| Small distribution branch QA-L06: another branch tries to reserve this branch's stock while both are selling | pass | 3 |
| Small distribution branch QA-L06: a purchase order is placed by four people at the same moment | pass | 2 |
| Small distribution branch QA-L06: the same reservation is sent five times at the same moment | pass | 4 |
| Warehouse-heavy branch QA-L37: six orders reach for the last 1,000 lb of a lot at the same moment | pass | 4 |
| Warehouse-heavy branch QA-L37: one order is confirmed by four people at the same moment | pass | 3 |
| Warehouse-heavy branch QA-L37: the same receipt is keyed four times at the same moment | pass | 4 |
| Warehouse-heavy branch QA-L37: twelve orders are entered at the same moment by the branch's sellers | pass | 3 |
| Warehouse-heavy branch QA-L37: an order is cancelled at the moment its stock is being reserved | pass | 3 |
| Warehouse-heavy branch QA-L37: more is reserved than the lot has | pass | 3 |
| Warehouse-heavy branch QA-L37: another branch tries to reserve this branch's stock while both are selling | pass | 3 |
| Warehouse-heavy branch QA-L37: a purchase order is placed by four people at the same moment | pass | 2 |
| Warehouse-heavy branch QA-L37: the same reservation is sent five times at the same moment | pass | 4 |
| Sales-focused branch QA-L28: six orders reach for the last 1,000 lb of a lot at the same moment | pass | 4 |
| Sales-focused branch QA-L28: one order is confirmed by four people at the same moment | pass | 3 |
| Sales-focused branch QA-L28: the same receipt is keyed four times at the same moment | pass | 4 |
| Sales-focused branch QA-L28: twelve orders are entered at the same moment by the branch's sellers | pass | 3 |
| Sales-focused branch QA-L28: an order is cancelled at the moment its stock is being reserved | pass | 3 |
| Sales-focused branch QA-L28: more is reserved than the lot has | pass | 3 |
| Sales-focused branch QA-L28: another branch tries to reserve this branch's stock while both are selling | pass | 3 |
| Sales-focused branch QA-L28: a purchase order is placed by four people at the same moment | pass | 2 |
| Sales-focused branch QA-L28: the same reservation is sent five times at the same moment | pass | 4 |
| Large processing branch QA-L30: a quote is accepted by three people at the same moment | pass | 3 |
| Medium service center QA-L03: a quote is accepted by three people at the same moment | pass | 3 |
| Sales-focused branch QA-L18: a quote is accepted by three people at the same moment | pass | 3 |

### Manufacturing, scheduling and quality

| Scenario | Result | Checks |
|---|---|---:|
| Large processing branch QA-L10: two operators start the same step at the same moment | pass | 2 |
| Large processing branch QA-L10: a step is finished four times at the same moment | pass | 4 |
| Large processing branch QA-L10: a step that was never started is marked finished | pass | 2 |
| Large processing branch QA-L10: two inspectors open the inspection of one job at the same moment | pass | 2 |
| Large processing branch QA-L10: an inspection is passed three times at the same moment | pass | 3 |
| Large processing branch QA-L10: the dock tries to ship a job that has not been inspected | pass | 3 |
| Large processing branch QA-L10: the schedule is run three times at the same moment | pass | 3 |
| Large processing branch QA-L10: a coil work order is started three times at the same moment | pass | 3 |
| Large processing branch QA-L10: a coil work order is completed three times at the same moment | pass | 4 |
| Large processing branch QA-L10: a finished job is traced from the customer's invoice back to the heat | pass | 6 |
| Large processing branch QA-L40: two operators start the same step at the same moment | pass | 2 |
| Large processing branch QA-L40: a step is finished four times at the same moment | pass | 4 |
| Large processing branch QA-L40: a step that was never started is marked finished | pass | 2 |
| Large processing branch QA-L40: two inspectors open the inspection of one job at the same moment | pass | 2 |
| Large processing branch QA-L40: an inspection is passed three times at the same moment | pass | 3 |
| Large processing branch QA-L40: the dock tries to ship a job that has not been inspected | pass | 3 |
| Large processing branch QA-L40: the schedule is run three times at the same moment | pass | 3 |
| Large processing branch QA-L40: a coil work order is started three times at the same moment | pass | 3 |
| Large processing branch QA-L40: a coil work order is completed three times at the same moment | pass | 4 |
| Large processing branch QA-L40: a finished job is traced from the customer's invoice back to the heat | pass | 6 |
| Medium service center QA-L01: two operators start the same step at the same moment | pass | 2 |
| Medium service center QA-L01: a step is finished four times at the same moment | pass | 4 |
| Medium service center QA-L01: a step that was never started is marked finished | pass | 2 |
| Medium service center QA-L01: two inspectors open the inspection of one job at the same moment | pass | 2 |
| Medium service center QA-L01: an inspection is passed three times at the same moment | pass | 3 |
| Medium service center QA-L01: the dock tries to ship a job that has not been inspected | pass | 3 |
| Medium service center QA-L01: the schedule is run three times at the same moment | pass | 3 |
| Medium service center QA-L01: a coil work order is started three times at the same moment | pass | 3 |
| Medium service center QA-L01: a coil work order is completed three times at the same moment | pass | 4 |
| Medium service center QA-L01: a finished job is traced from the customer's invoice back to the heat | pass | 6 |
| Medium service center QA-L22: two operators start the same step at the same moment | pass | 2 |
| Medium service center QA-L22: a step is finished four times at the same moment | pass | 4 |
| Medium service center QA-L22: a step that was never started is marked finished | pass | 2 |
| Medium service center QA-L22: two inspectors open the inspection of one job at the same moment | pass | 2 |
| Medium service center QA-L22: an inspection is passed three times at the same moment | pass | 3 |
| Medium service center QA-L22: the dock tries to ship a job that has not been inspected | pass | 3 |
| Medium service center QA-L22: the schedule is run three times at the same moment | pass | 3 |
| Medium service center QA-L22: a coil work order is started three times at the same moment | pass | 3 |
| Medium service center QA-L22: a coil work order is completed three times at the same moment | pass | 4 |
| Medium service center QA-L22: a finished job is traced from the customer's invoice back to the heat | pass | 6 |

### Shipping, logistics and invoicing

| Scenario | Result | Checks |
|---|---|---:|
| Large processing branch QA-L60: one shipment is dispatched four times at the same moment | pass | 6 |
| Large processing branch QA-L60: a delivery is confirmed four times at the same moment | pass | 3 |
| Large processing branch QA-L60: two shipments are made for the same pounds at the same moment | pass | 2 |
| Large processing branch QA-L60: a shipment is billed five times at the same moment | pass | 3 |
| Large processing branch QA-L60: an order is cancelled at the moment its shipment is dispatched | pass | 4 |
| Large processing branch QA-L60: twelve shipments are dispatched at the same moment | pass | 4 |
| Large processing branch QA-L60: a delivery is confirmed for a shipment that has not left | pass | 2 |
| Medium service center QA-L21: one shipment is dispatched four times at the same moment | pass | 6 |
| Medium service center QA-L21: a delivery is confirmed four times at the same moment | pass | 3 |
| Medium service center QA-L21: two shipments are made for the same pounds at the same moment | pass | 2 |
| Medium service center QA-L21: a shipment is billed five times at the same moment | pass | 3 |
| Medium service center QA-L21: an order is cancelled at the moment its shipment is dispatched | pass | 4 |
| Medium service center QA-L21: twelve shipments are dispatched at the same moment | pass | 4 |
| Medium service center QA-L21: a delivery is confirmed for a shipment that has not left | pass | 2 |
| Small distribution branch QA-L25: one shipment is dispatched four times at the same moment | pass | 6 |
| Small distribution branch QA-L25: a delivery is confirmed four times at the same moment | pass | 3 |
| Small distribution branch QA-L25: two shipments are made for the same pounds at the same moment | pass | 2 |
| Small distribution branch QA-L25: a shipment is billed five times at the same moment | pass | 3 |
| Small distribution branch QA-L25: an order is cancelled at the moment its shipment is dispatched | pass | 4 |
| Small distribution branch QA-L25: twelve shipments are dispatched at the same moment | pass | 4 |
| Small distribution branch QA-L25: a delivery is confirmed for a shipment that has not left | pass | 2 |
| Warehouse-heavy branch QA-L66: one shipment is dispatched four times at the same moment | pass | 6 |
| Warehouse-heavy branch QA-L66: a delivery is confirmed four times at the same moment | pass | 3 |
| Warehouse-heavy branch QA-L66: two shipments are made for the same pounds at the same moment | pass | 2 |
| Warehouse-heavy branch QA-L66: a shipment is billed five times at the same moment | pass | 3 |
| Warehouse-heavy branch QA-L66: an order is cancelled at the moment its shipment is dispatched | pass | 4 |
| Warehouse-heavy branch QA-L66: twelve shipments are dispatched at the same moment | pass | 4 |
| Warehouse-heavy branch QA-L66: a delivery is confirmed for a shipment that has not left | pass | 2 |
| Sales-focused branch QA-L78: one shipment is dispatched four times at the same moment | pass | 6 |
| Sales-focused branch QA-L78: a delivery is confirmed four times at the same moment | pass | 3 |
| Sales-focused branch QA-L78: two shipments are made for the same pounds at the same moment | pass | 2 |
| Sales-focused branch QA-L78: a shipment is billed five times at the same moment | pass | 3 |
| Sales-focused branch QA-L78: an order is cancelled at the moment its shipment is dispatched | pass | 4 |
| Sales-focused branch QA-L78: twelve shipments are dispatched at the same moment | pass | 4 |
| Sales-focused branch QA-L78: a delivery is confirmed for a shipment that has not left | pass | 2 |
