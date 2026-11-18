# Phase 11: customer job traceability

Date: 2026-11-18. Every figure here was measured in this session on one local machine (4 processors, 15.7 GB), against a local PostgreSQL 16 database whose name contains `qa`, with synthetic data only, the server copies connected as the least-privilege role `steelwise_runtime`, and a local stand-in for every outside service. Nothing was run against the live database, the host or any real partner, carrier, payment or accounting system. Anything not run is marked NOT VERIFIED.

A customer job is traced end to end when, after the run, the database holds for that job every record its kind requires, linked to each other: the order, its reservation, the work (for processed material), the shipment and its stock movement, the invoice, the payment or the credit and refund, and the ledger events of each. A job that completed but could not be traced would be counted as not traced.

## By cycle

| Cycle | Planned | Completed | Traced end to end | Failed | Closed by billing the shipment again |
|---|---:|---:|---:|---:|---:|
| 1 Baseline | 545 | 545 | 545 | 0 | 0 |
| 2 Correction | 545 | 545 | 545 | 0 | 0 |
| 3 Full Revalidation | 545 | 545 | 545 | 0 | 0 |
| 4 Failure and Recovery | 545 | 545 | 545 | 0 | 2 |
| 5 Final Certification | 545 | 545 | 545 | 0 | 0 |

Required: at least 500 traced. Every cycle exceeds it.

## By kind, cycle 5

| Kind | Planned | Completed | Traced | Failed | Median time for the whole job | P95 |
|---|---:|---:|---:|---:|---:|---:|
| A. Stock sale | 185 | 185 | 185 | 0 | 2,101 ms | 4,814 ms |
| B. Processed-material sale | 115 | 115 | 115 | 0 | 2,685 ms | 7,586 ms |
| C. Ecommerce order | 55 | 55 | 55 | 0 | 158 ms | 892 ms |
| D. Counter (POS) sale | 70 | 70 | 70 | 0 | 263 ms | 817 ms |
| E. Partial shipment | 60 | 60 | 60 | 0 | 2,346 ms | 8,993 ms |
| F. Return and credit | 60 | 60 | 60 | 0 | 3,525 ms | 5,870 ms |

## One job of each kind, step by step

Taken from `qa/results/phase11-cycle-5-jobs.json`, which holds every job of the run with every step, who did it, which server copy answered, the answer and the time.

**A. Stock sale: C5-A-0029 at QA-L23**

| Step | Role | Answer | Time | Server copy |
|---|---|---:|---:|---:|
| order written | SALES_REP | 201 | 54 ms | 1 |
| order confirmed | SALES_REP | 200 | 83 ms | 2 |
| stock reserved | INVENTORY_MANAGER | 201 | 73 ms | 2 |
| shipment put together | SHIPPING_COORDINATOR | 201 | 71 ms | 2 |
| shipment dispatched | SHIPPING_COORDINATOR | 200 | 276 ms | 2 |
| invoice opened | CSR | 200 | 15 ms | 3 |
| shipment delivered | SHIPPING_COORDINATOR | 200 | 24 ms | 3 |

**B. Processed-material sale: C5-B-0275 at QA-L03**

| Step | Role | Answer | Time | Server copy |
|---|---|---:|---:|---:|
| request for quote entered | ESTIMATOR | 201 | 56 ms | 3 |
| quote priced | ESTIMATOR | 201 | 94 ms | 3 |
| quote sent | ESTIMATOR | 200 | 51 ms | 2 |
| quote accepted into an order | CSR | 201 | 58 ms | 3 |
| stock reserved | INVENTORY_MANAGER | 201 | 43 ms | 2 |
| job opened | SCHEDULER | 201 | 40 ms | 3 |
| job routed and scheduled | SCHEDULER | 200 | 89 ms | 1 |
| step started | OPERATOR_SAW | 200 | 84 ms | 3 |
| step finished | OPERATOR_SAW | 200 | 48 ms | 1 |
| step started | OPERATOR_SAW | 200 | 102 ms | 2 |
| step finished | OPERATOR_SAW | 200 | 70 ms | 2 |
| inspection opened | QC_INSPECTOR | 201 | 53 ms | 1 |
| inspection passed | QC_INSPECTOR | 200 | 74 ms | 3 |
| job packed and staged for shipping | SHIPPING_COORDINATOR | 200 | 55 ms | 1 |
| shipment put together | SHIPPING_COORDINATOR | 201 | 36 ms | 3 |
| shipment dispatched | SHIPPING_COORDINATOR | 200 | 234 ms | 2 |
| invoice opened | CSR | 200 | 17 ms | 1 |
| shipment delivered | SHIPPING_COORDINATOR | 200 | 21 ms | 1 |
| payment taken | CSR | 201 | 48 ms | 3 |
| job cost read | BRANCH_MANAGER | 200 | 26 ms | 3 |

**C. Ecommerce order: C5-C-0305 at QA-L01**

| Step | Role | Answer | Time | Server copy |
|---|---|---:|---:|---:|
| web order placed | CUSTOMER_BUYER | 200 | 44 ms | 1 |
| web order accepted into an order | CSR | 200 | 69 ms | 3 |
| buyer sees the order in the portal | CUSTOMER_BUYER | 200 | 34 ms | 1 |

**D. Counter (POS) sale: C5-D-0357 at QA-L18**

| Step | Role | Answer | Time | Server copy |
|---|---|---:|---:|---:|
| counter sale paid | CSR | 201 | 232 ms | 3 |

**E. Partial shipment: C5-E-0431 at QA-L33**

| Step | Role | Answer | Time | Server copy |
|---|---|---:|---:|---:|
| order written | SALES_REP | 201 | 31 ms | 1 |
| order confirmed | SALES_REP | 200 | 48 ms | 3 |
| stock reserved | INVENTORY_MANAGER | 201 | 52 ms | 2 |
| shipment put together | SHIPPING_COORDINATOR | 201 | 44 ms | 3 |
| shipment dispatched | SHIPPING_COORDINATOR | 200 | 338 ms | 1 |
| invoice opened | CSR | 200 | 18 ms | 1 |
| shipment delivered | SHIPPING_COORDINATOR | 200 | 20 ms | 1 |
| shipment put together | SHIPPING_COORDINATOR | 201 | 44 ms | 3 |
| shipment dispatched | SHIPPING_COORDINATOR | 200 | 219 ms | 1 |
| invoice opened | CSR | 200 | 13 ms | 3 |
| shipment delivered | SHIPPING_COORDINATOR | 200 | 63 ms | 1 |
| payment taken | CSR | 201 | 87 ms | 3 |
| payment taken | CSR | 201 | 58 ms | 1 |

**F. Return and credit: C5-F-0544 at QA-L20**

| Step | Role | Answer | Time | Server copy |
|---|---|---:|---:|---:|
| order written | SALES_REP | 201 | 78 ms | 2 |
| order confirmed | SALES_REP | 200 | 77 ms | 3 |
| stock reserved | INVENTORY_MANAGER | 201 | 71 ms | 1 |
| shipment put together | SHIPPING_COORDINATOR | 201 | 35 ms | 1 |
| shipment dispatched | SHIPPING_COORDINATOR | 200 | 221 ms | 1 |
| invoice opened | CSR | 200 | 31 ms | 2 |
| shipment delivered | SHIPPING_COORDINATOR | 200 | 26 ms | 2 |
| payment taken | CSR | 201 | 71 ms | 2 |
| return opened | CSR | 201 | 75 ms | 2 |
| return received and credited | RECEIVING_CLERK | 200 | 184 ms | 2 |
| refund paid | BRANCH_MANAGER | 201 | 89 ms | 3 |

## Jobs that needed recovery

- Cycle 1 (Baseline): 0 failed, 0 closed by billing the shipment again.
- Cycle 2 (Correction): 0 failed, 0 closed by billing the shipment again.
- Cycle 3 (Full Revalidation): 0 failed, 0 closed by billing the shipment again.
- Cycle 4 (Failure and Recovery): 0 failed, 2 closed by billing the shipment again.
- Cycle 5 (Final Certification): 0 failed, 0 closed by billing the shipment again.

In the failure-and-recovery cycle a server copy was killed after it had saved a dispatch and before it billed it. The dock's repeat was answered "already IN_TRANSIT", and the invoice was raised from the shipment by the product's own recovery path (H-006, Y-021). The job is then traced like any other. See Z-012.
