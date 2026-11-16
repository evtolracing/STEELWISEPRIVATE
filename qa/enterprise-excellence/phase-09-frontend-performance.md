# Phase 9: front-end performance

Written by `qa/tools/phase9-docs.cjs` from the result files named in each section. All measurements were taken on a local machine against a local database whose name contains `qa`.

## The build

`npx vite build`: 277 script and style files, 4339 KB in all, 1322 KB compressed. Each screen is its own file and is fetched when first opened.

| Largest files | Size | Compressed |
|---|---:|---:|
| `MapComponent-19w3pgly.js` | 964 KB | 269 KB |
| `index-B_iKKlrh.js` | 785 KB | 249 KB |
| `safety-DA8xBrQ4.js` | 398 KB | 107 KB |
| `ManualPage-DHU_GDvv.js` | 179 KB | 57 KB |
| `POSPage-VJhLhZ4X.js` | 113 KB | 28 KB |
| `ModernOrderBoardPage-CutaEY-1.js` | 56 KB | 15 KB |
| `WorkCenterSelectPage-DT5NkzVK.js` | 41 KB | 13 KB |
| `RoleDashboardPage-B4lB71xw.js` | 40 KB | 10 KB |

The map component is fetched only by the screens that draw a map. The main file (the shell, the router and the interface library) is fetched once. No dependency was added in Phase 9.

## Main screens on the production build

`qa/tools/frontend-performance.cjs` against `vite preview` (2026-11-16T05:40:40.219Z), as an administrator, who sees every branch and so the most data; the median of three loads, each in a fresh browser with nothing cached.

| Screen | Heading on screen | Network quiet | API calls | Repeated calls | Longest block |
|---|---:|---:|---:|---|---:|
| `/` | 609 ms | 1105 ms | 3 | none | 160 ms |
| `/orders` | 626 ms | 1090 ms | 3 | none | 155 ms |
| `/orders/intake` | 772 ms | 1369 ms | 6 | 2x POST /pricing/tax-estimate | 175 ms |
| `/customers` | 647 ms | 1115 ms | 3 | none | 161 ms |
| `/units` | 599 ms | 1296 ms | 4 | none | 165 ms |
| `/heats` | 678 ms | 1377 ms | 3 | none | 191 ms |
| `/receiving` | 818 ms | 1123 ms | 4 | none | 195 ms |
| `/purchase-orders` | 659 ms | 1114 ms | 3 | none | 187 ms |
| `/work-orders` | 654 ms | 1129 ms | 3 | none | 191 ms |
| `/schedule` | 619 ms | 1124 ms | 4 | none | 364 ms |
| `/order-board` | 652 ms | 1151 ms | 3 | none | 1175 ms |
| `/production` | 925 ms | 1293 ms | 3 | none | 200 ms |
| `/qc` | 726 ms | 1120 ms | 6 | none | 171 ms |
| `/shopfloor` | 652 ms | 1154 ms | 7 | none | 167 ms |
| `/shipping` | 734 ms | 1155 ms | 3 | none | 179 ms |
| `/orders/invoices` | 612 ms | 1275 ms | 3 | none | 161 ms |
| `/orders/closeout` | 671 ms | 1426 ms | 3 | none | 150 ms |
| `/sales/rfq-inbox` | 597 ms | 1075 ms | 3 | none | 144 ms |
| `/pricing` | 674 ms | 1382 ms | 4 | none | 154 ms |
| `/admin/users` | 652 ms | 1157 ms | 5 | none | 174 ms |

Median: heading in 654 ms, quiet in 1154 ms. 76 API calls for 20 screens. The first block of 150 to 200 ms on every screen is the browser reading the main file.

This table was measured before the order board change below; the board row shows the fault as found.

## Faults found and fixed

| Fault | Before | After | Finding |
|---|---|---|---|
| The order board drew a card for each of 451 jobs at once | Page blocked for 1,175 ms | 488 to 512 ms over three loads: a column draws its 30 most urgent cards and offers the rest | V-026 |
| Every staff screen asked for the web shop preferences of a sample customer | 1 wasted call per page load | 0 | V-025 |
| The search asked for all orders and filtered nothing | Unfiltered first page | The server narrows; 5 rows per kind | V-019 |

## All screens on the development server

From the audit (not the production build, so slower than above): time until the network is quiet, at desktop size. Before: median 2465 ms, 95th percentile 3558 ms, slowest 6505 ms on 130 screens. Now: median 2533 ms, 95th percentile 3685 ms, slowest 5011 ms on 154 screens. The two runs are not a clean comparison: the later one opens 24 more record pages and ran with other work on the machine.

## Not fixed

- The order board, the production board and the schedule still receive every job or work centre from the server (V-027, Phase 11). At 85 branches an administrator's board will be slower than measured here.
- 38 effects do not list everything they read (B-024); none is a known source of a repeated call. One screen (`/orders/intake`) repeats a call on opening.

## Not verified

- A local machine and a local database. The host, a real network, a shop terminal and a phone are NOT VERIFIED.
- 85-branch scale data was not loaded for this measurement; the QA database holds 451 jobs.
- Memory over a long shift was not measured. A round of 24 screens in one tab ends with no page error and no failed call (scenario), which is not a memory measurement.

