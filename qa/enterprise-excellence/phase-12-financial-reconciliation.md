# Phase 12: financial reconciliation certification

Date: 2026-11-19. Release candidate RC-2 (RC-1 is commit `9e12319`, the merge of Phase 11; RC-2 is RC-1 plus the corrections of this phase, listed in `phase-12-release-baseline.md`). Everything here was run in this session on one local machine against a local PostgreSQL 16 database whose name contains `qa`, with synthetic data only. Nothing was run against the live system, and nothing here is a statement about it.

**Real reconciliation evidence, of test data.** Every figure below was read from the QA database after the certification run, by the product's own reconciliation and independently by SQL. No adjustment was made to make anything agree, and none was fabricated. There is **no reconciliation of live data**: this session has no access to it, and the ledger is not running there.

## Result: 6 of 6 scenarios pass

| ID | Scenario | Result | Checks |
|---|---|---|---|
| RC-01 | Reconciliation 1: the books balance, by SQL and by the product | pass | 4 |
| RC-02 | Reconciliation 2: receivables in the ledger equal the open invoices, customer by customer | pass | 4 |
| RC-03 | Reconciliation 3: inventory in the ledger equals stock on hand at cost, branch by branch | pass | 6 |
| RC-04 | Reconciliation 4: revenue in the ledger equals the invoices issued | pass | 3 |
| RC-05 | Reconciliation 5: every business event since the ledger began is in the books or held by name | pass | 6 |
| RC-06 | Reconciliation 6: the reconciliation itself is honest: it reports a planted difference and corrects nothing | pass | 4 |

## Figures

- no figures were recorded by the run

## Checks, with what was measured

### RC-01: Reconciliation 1: the books balance, by SQL and by the product

- pass: total debits equal total credits to the cent (15215471.35 / 15215471.35)
- pass: no single posted entry is out of balance
- pass: the trial balance says the same ({"debit":"15215471.35","credit":"15215471.35"})
- pass: the product's own check agrees ({"key":"BOOKS_BALANCE","title":"Debits equal credits, in total and in every entry","status":"MATCH","ledger":")

### RC-02: Reconciliation 2: receivables in the ledger equal the open invoices, customer by customer

- pass: the report's ledger figure is the account balance (242385.65 / 242385.65)
- pass: the report shows no difference between ledger and records ({"owed":"246725.65","creditOwedBack":"4340.00","records":"242385.65","ledger":"242385.65","difference":"0.00"})
- pass: the reconciliation says the same ({"key":"RECEIVABLES","title":"Accounts receivable: the books beside the open invoices and credits","status":"M)
- pass: the customers add up to the total (101 customers)

### RC-03: Reconciliation 3: inventory in the ledger equals stock on hand at cost, branch by branch

- pass: the report answers (200)
- pass: the reconciliation finds no inventory difference ({"key":"INVENTORY","title":"Stock value: the books beside quantity on hand at cost, item by item","status":"MA)
- pass: goods on the road agree ({"key":"IN_TRANSIT","title":"Stock in transit between branches","status":"MATCH","ledger":"700.00","records":")
- pass: the branches add up to the total (163 branches)
- pass: no stock figure is below zero (0)
- pass: on hand equals available plus reserved plus held plus in transit on every item (0)

### RC-04: Reconciliation 4: revenue in the ledger equals the invoices issued

- pass: no revenue difference (0.00)
- pass: revenue by branch, by customer and by product give one total (1175767.71 1175767.71 1175767.71)
- pass: cost of sales in the margin report is the cost-of-sales account (677776.23)

### RC-05: Reconciliation 5: every business event since the ledger began is in the books or held by name

- pass: no event of this run is failed, pending or held (0)
- pass: the exceptions report answers and counts the same open events as the table (3)
- pass: no business event has two entries (0)
- pass: every posted event points at an entry that exists (0)
- pass: invoice INV-001773 of this run is posted once
- pass: invoice INV-001774 of this run is posted once

### RC-06: Reconciliation 6: the reconciliation itself is honest: it reports a planted difference and corrects nothing

- pass: with 100 lb added behind the ledger's back, the inventory check fails (["INVENTORY","EVENTS"])
- pass: and names the size of the difference (-95.00)
- pass: it changed nothing: the planted figure is still there
- pass: put back, the inventory check is as it was (0.00 / 0.00)

## The enterprise day (Phase 11 run in the gate)

Trial balance: debits 14,217,738.73, credits 14,217,738.73. Reconciliation clean:

| Check | Books | Records | Difference |
|---|---|---|---|
| BOOKS_BALANCE | 14,217,738.73 | 14,217,738.73 | 0.00 |
| RECEIVABLES | 170,558.83 | 170,558.83 | 0.00 |
| INVENTORY | 9,395,592.42 | 9,395,592.42 | 0.00 |
| IN_TRANSIT | 700.00 | 700.00 | 0.00 |
| REVENUE | 1,067,397.09 | 1,067,397.09 | 0.00 |
| SALES_TAX | 3,119.15 | 3,119.15 | 0.00 |
| PAYMENTS | 989,714.29 | 989,714.29 | 0.00 |

## Unexplained discrepancies

None on the QA data: every check is zero or every difference is an item held by name with its reason (a transfer of an item with no cost, a receipt with no purchase order), which the product lists and an accountant settles. A deliberately planted 100 lb difference was found, named by item, and removed.

Material discrepancies on live data: **unknown**. It cannot be certified and is not.

## Dashboards and reports against the records (section 17)

7 of 7 scenarios pass.

| ID | Scenario | Result | Checks |
|---|---|---|---|
| DB-01 | Dashboard 1: the home dashboard for head office equals the records | pass | 5 |
| DB-02 | Dashboard 2: the home dashboard for a branch manager holds only that branch | pass | 4 |
| DB-03 | Dashboard 3: the operations cockpit counts what is in the tables | pass | 6 |
| DB-04 | Dashboard 4: the sales dashboard equals the quotes on file | pass | 3 |
| DB-05 | Dashboard 5: material tracking counts equal the tables | pass | 3 |
| DB-06 | Dashboard 6: the finance reports agree with each other and with the ledger tables | pass | 5 |
| DB-07 | Dashboard 7: a sample screen's data is labelled as sample, and no real screen is fed invented figures | pass | 2 |
