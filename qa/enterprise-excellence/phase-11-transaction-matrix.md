# Phase 11: transaction matrix

Date: 2026-11-18. Every figure here was measured in this session on one local machine (4 processors, 15.7 GB), against a local PostgreSQL 16 database whose name contains `qa`, with synthetic data only, the server copies connected as the least-privilege role `steelwise_runtime`, and a local stand-in for every outside service. Nothing was run against the live database, the host or any real partner, carrier, payment or accounting system. Anything not run is marked NOT VERIFIED.

A transaction is counted as completed only when the server answered success. It is counted as reconciled only when the record it should have made was then found in the database (and, where it posts, in the books). "Retried" is resends after the product's own "busy, try again" answer or a lost connection; "recovered" is transactions that completed after at least one resend.

## Totals by cycle

| Cycle | Server copies | Attempted | Completed | Failed | Retried | Recovered | Reconciled | Counted but not found in the database |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| 1 Baseline | 3 | 5,185 | 5,185 | 0 | 0 | 0 | 5,185 |  |
| 2 Correction | 3 | 5,187 | 5,187 | 0 | 0 | 0 | 5,187 |  |
| 3 Full Revalidation | 3 | 5,185 | 5,185 | 0 | 0 | 0 | 5,185 |  |
| 4 Failure and Recovery | 3 | 5,185 | 5,185 | 0 | 20 | 9 | 5,185 |  |
| 5 Final Certification | 3 | 5,191 | 5,191 | 0 | 0 | 0 | 5,191 |  |

Required: at least 2,000 completed. Every cycle exceeds it.

## By category, cycle 5

| Category | Minimum | Attempted | Completed | Failed | Retried | Recovered | Reconciled | Minimum met |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Sales, quotes and orders | 300 | 650 | 650 | 0 | 0 | 0 | 650 | yes |
| Purchasing and receiving | 250 | 834 | 834 | 0 | 0 | 0 | 834 | yes |
| Inventory reservations and movements | 300 | 460 | 460 | 0 | 0 | 0 | 460 | yes |
| Manufacturing and processing | 300 | 615 | 615 | 0 | 0 | 0 | 615 | yes |
| Shipping and logistics | 250 | 960 | 960 | 0 | 0 | 0 | 960 | yes |
| Invoicing, payments and credits | 200 | 1,080 | 1,080 | 0 | 0 | 0 | 1,080 | yes |
| Ledger postings and reconciliation operations | 200 | 212 | 212 | 0 | 0 | 0 | 212 | yes |
| Transfers, returns and adjustments | 150 | 200 | 200 | 0 | 0 | 0 | 200 | yes |
| Ecommerce, POS and customer portal | 50 | 180 | 180 | 0 | 0 | 0 | 180 | yes |

## By category, every cycle (completed / failed)

| Category | Cycle 1 | Cycle 2 | Cycle 3 | Cycle 4 | Cycle 5 |
|---|---:|---:|---:|---:|---:|
| Sales, quotes and orders | 650 / 0 | 650 / 0 | 650 / 0 | 650 / 0 | 650 / 0 |
| Purchasing and receiving | 828 / 0 | 830 / 0 | 828 / 0 | 828 / 0 | 834 / 0 |
| Inventory reservations and movements | 460 / 0 | 460 / 0 | 460 / 0 | 460 / 0 | 460 / 0 |
| Manufacturing and processing | 615 / 0 | 615 / 0 | 615 / 0 | 615 / 0 | 615 / 0 |
| Shipping and logistics | 960 / 0 | 960 / 0 | 960 / 0 | 960 / 0 | 960 / 0 |
| Invoicing, payments and credits | 1,080 / 0 | 1,080 / 0 | 1,080 / 0 | 1,080 / 0 | 1,080 / 0 |
| Ledger postings and reconciliation operations | 212 / 0 | 212 / 0 | 212 / 0 | 212 / 0 | 212 / 0 |
| Transfers, returns and adjustments | 200 / 0 | 200 / 0 | 200 / 0 | 200 / 0 | 200 / 0 |
| Ecommerce, POS and customer portal | 180 / 0 | 180 / 0 | 180 / 0 | 180 / 0 | 180 / 0 |

## By kind of transaction, cycle 5

| Category | Transaction | Attempted | Completed | Failed |
|---|---|---:|---:|---:|
| Sales, quotes and orders | request for quote entered | 115 | 115 | 0 |
| Sales, quotes and orders | order confirmed | 305 | 305 | 0 |
| Sales, quotes and orders | quote priced | 115 | 115 | 0 |
| Sales, quotes and orders | quote accepted into an order | 115 | 115 | 0 |
| Purchasing and receiving | purchase order placed | 417 | 417 | 0 |
| Purchasing and receiving | goods received | 417 | 417 | 0 |
| Inventory reservations and movements | stock reserved | 420 | 420 | 0 |
| Inventory reservations and movements | material issued to a work order | 40 | 40 | 0 |
| Manufacturing and processing | job routed and scheduled | 115 | 115 | 0 |
| Manufacturing and processing | work order completed | 40 | 40 | 0 |
| Manufacturing and processing | step finished | 230 | 230 | 0 |
| Manufacturing and processing | inspection passed | 115 | 115 | 0 |
| Manufacturing and processing | job packed and staged for shipping | 115 | 115 | 0 |
| Shipping and logistics | shipment dispatched | 480 | 480 | 0 |
| Shipping and logistics | shipment delivered | 480 | 480 | 0 |
| Invoicing, payments and credits | invoice raised | 480 | 480 | 0 |
| Invoicing, payments and credits | payment taken | 480 | 480 | 0 |
| Invoicing, payments and credits | credit memo issued | 60 | 60 | 0 |
| Invoicing, payments and credits | refund paid | 60 | 60 | 0 |
| Ledger postings and reconciliation operations | journal entry posted by a second person | 200 | 200 | 0 |
| Ledger postings and reconciliation operations | reconciliation run | 12 | 12 | 0 |
| Transfers, returns and adjustments | stock count adjusted | 40 | 40 | 0 |
| Transfers, returns and adjustments | transfer sent | 50 | 50 | 0 |
| Transfers, returns and adjustments | transfer received | 50 | 50 | 0 |
| Transfers, returns and adjustments | return received and credited | 60 | 60 | 0 |
| Ecommerce, POS and customer portal | counter sale paid | 70 | 70 | 0 |
| Ecommerce, POS and customer portal | web order placed | 55 | 55 | 0 |
| Ecommerce, POS and customer portal | web order accepted into an order | 55 | 55 | 0 |

Result files: `qa/results/phase11-cycle-1.json`, `qa/results/phase11-cycle-2.json`, `qa/results/phase11-cycle-3.json`, `qa/results/phase11-cycle-4.json`, `qa/results/phase11-cycle-5.json`.
