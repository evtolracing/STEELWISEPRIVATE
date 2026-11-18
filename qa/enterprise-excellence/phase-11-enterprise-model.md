# Phase 11: the 80-location enterprise model

Date: 2026-11-18. Every figure here was measured in this session on one local machine (4 processors, 15.7 GB), against a local PostgreSQL 16 database whose name contains `qa`, with synthetic data only, the server copies connected as the least-privilege role `steelwise_runtime`, and a local stand-in for every outside service. Nothing was run against the live database, the host or any real partner, carrier, payment or accounting system. Anything not run is marked NOT VERIFIED.

Every figure in this model is an assumption made for the simulation, written down so it can be read and challenged. None is a real volume of the business. The model is code: `qa/sim/phase11/model.mjs`. It is built on the QA fixture branches QA-L01 to QA-L80 and gives each one a tier.

## Branches

80 branches in 16 states: 8 large processing branch, 20 medium service center, 24 small distribution branch, 12 warehouse-heavy branch, 10 sales-focused branch, 6 outlet store. By material: 36 metals, 11 plastics, 22 mixed, 11 outlet.

| Tier | Branches | Hours | Share of the day's jobs (weight) | Machines | Operators | Stock lots received at opening | Customer accounts | What it does |
|---|---:|---|---:|---:|---:|---:|---:|---|
| Large processing branch | 8 | two shifts, 16 hours | 3 | 3 | 4 | 7 | 6 | stock, processed, partial, return, web, transfer, workOrder |
| Medium service center | 20 | one long shift, 10 hours | 1.6 | 2 | 2 | 5 | 4 | stock, processed, partial, return, web, transfer, workOrder |
| Small distribution branch | 24 | one shift, 8 hours | 1 | 0 | 0 | 3 | 3 | stock, partial, return, web, counter, transfer |
| Warehouse-heavy branch | 12 | two shifts, 16 hours | 0.7 | 0 | 0 | 6 | 1 | stock, transfer |
| Sales-focused branch | 10 | one shift, 9 hours | 1 | 0 | 0 | 2 | 6 | stock, partial, return, web, counter |
| Outlet store | 6 | one shift, 8 hours, six days | 0.6 | 0 | 0 | 0 | 2 | counter, web |

## People

750 employee logins and 68 customer logins (818 sign-ins at the start of the day). Per branch by tier:

| Tier | SALES_REP | CSR | ESTIMATOR | BUYER | RECEIVING_CLERK | INVENTORY_MANAGER | SCHEDULER | OPERATOR_SAW | QC_INSPECTOR | SHIPPING_COORDINATOR | BRANCH_MANAGER |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Large processing branch | 2 | 2 | 1 | 1 | 1 | 1 | 1 | 3 | 1 | 2 | 1 |
| Medium service center | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 2 | 1 | 1 | 1 |
| Small distribution branch | 1 | 1 | 0 | 1 | 1 | 1 | 0 | 0 | 0 | 1 | 1 |
| Warehouse-heavy branch | 0 | 1 | 0 | 1 | 2 | 1 | 0 | 0 | 0 | 2 | 1 |
| Sales-focused branch | 2 | 1 | 1 | 1 | 1 | 1 | 0 | 0 | 0 | 1 | 1 |
| Outlet store | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |

Head office, not tied to a branch: 2 CFO, 2 EXECUTIVE, 1 COO, 2 CREDIT_MANAGER, 1 AUDITOR, 1 DATA_ANALYST, 1 SALES_DIRECTOR.

Logins by role in the run: SALES_REP 80, CSR 94, ESTIMATOR 38, BUYER 74, RECEIVING_CLERK 86, INVENTORY_MANAGER 74, SCHEDULER 28, OPERATOR_SAW 64, QC_INSPECTOR 28, SHIPPING_COORDINATOR 94, BRANCH_MANAGER 80, CUSTOMER_BUYER 68, CFO 2, EXECUTIVE 2, COO 1, CREDIT_MANAGER 2, AUDITOR 1, DATA_ANALYST 1, SALES_DIRECTOR 1.

## Customers, suppliers, products

284 customer accounts, 12 suppliers, 64 work centers, 72 certified operators, 320 stock lots received before the day starts, grades 1018, A36, 304SS, 6061-T6, HDPE, UHMW.

## What the model does not represent

- Divisions as separate legal entities: the product has one company with branches; a division is a kind of material at a branch.
- Real carriers, payment processors, tax services and accounting products: each is a local stand-in.
- Physical machines: a work center is a record. No machine performance was tested.
- A whole year: the model is one working day, run five times.
