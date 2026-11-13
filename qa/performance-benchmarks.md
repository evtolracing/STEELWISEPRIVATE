# Performance benchmarks

Tool: `qa/perf/bench.mjs`. Data: a copy of the QA database multiplied by `qa/perf/scale-up.sql` to 100,233 stock items, 72,240 orders, 74,347 order lines, 72,541 jobs, 50,869 shipments, 37,625 invoices, across the 80 QA branches. One server process and the database on the same machine, so there is no network time in these figures. Each route was called 7 times in a row as an administrator.

Target used: a list or summary route answers in under 500 ms (median).

## Result

| | Before | After |
|---|---|---|
| Parameter-free read routes answering | 137 of 146 | 137 of 146 |
| Routes at or over 500 ms | 7, plus one that never answered | 1 (operations cockpit, about 1 s, see below) |
| Replies over 1 MB | 3 (largest 104 MB) | 2 (1.2 MB each, the job list) |
| Median of all route medians | 6 ms | 6 ms |
| 20 people opening the job list at once | all 20 failed after 30 s | all answered within 1.4 s |
| 20 people opening the order list at once | 0.45 s | 0.40 s |

| Route | Before | After |
|---|---|---|
| `/api/jobs` | 9,582 ms, 104 MB | 121 ms, 1.2 MB |
| `/api/material-tracking/staging` | 5,976 ms, 18 MB | 100 ms, 0.3 MB |
| `/api/v1/analytics/margin` | 7,735 ms | 23 ms |
| `/api/v1/analytics/rfq-funnel` | 2,548 ms | 23 ms |
| `/api/v1/shipping/summary` | 928 ms | 22 ms |
| One order with its lines | 20 ms | 9 ms |
| Jobs for one order | 12 ms | 6 ms |
| Orders page 1,200 (offset 60,000) | 59 ms | 57 ms |

Slowest routes after the changes, all inside the target: work-center utilization 350 ms, operations forecast 340 ms, jobs at risk 269 ms, invoices 213 ms.

## Not answered

Eight of the 146 routes need a parameter or are customer-only and are skipped (expected).

## Operations cockpit (E-023)

Before: no reply within 30 seconds on the scaled database. It loaded every job, order, stock item and shipment on each call.

After: it loads open jobs and today's activity and counts the rest in the database. Measured on the scaled database after spreading the copied jobs and shipments over 300 days of history (13,244 open jobs, 3,494 created today): 0.94 to 1.17 seconds, 0.47 MB. That is over the 0.5 second target. The remaining cost is the list of every hot job, which the page shows in full.

## Limits of this benchmark

- Same-machine timings. The hosted site adds network and cold-start time.
- Copied rows all carry recent dates, so "last 30 days" queries see every row. That is harsher than real life for date-windowed reports.
- Reads only. Write throughput was exercised only by the simulation's simultaneous-request probes (up to 10 at once).
- No soak or stress test.

Raw results: `qa/results/perf-before.json`, `qa/results/perf-after.json`.
