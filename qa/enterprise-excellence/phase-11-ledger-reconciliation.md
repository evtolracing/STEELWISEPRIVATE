# Phase 11: ledger reconciliation

Date: 2026-11-18. Every figure here was measured in this session on one local machine (4 processors, 15.7 GB), against a local PostgreSQL 16 database whose name contains `qa`, with synthetic data only, the server copies connected as the least-privilege role `steelwise_runtime`, and a local stand-in for every outside service. Nothing was run against the live database, the host or any real partner, carrier, payment or accounting system. Anything not run is marked NOT VERIFIED.

The reconciliation is the product's own (`POST /api/ledger/reconciliations`). It compares the books with the business records item by item and never makes an entry. A difference is named and kept; nothing in the product or in the tests adjusts one away. No difference was forced to zero in this phase.

## End of day, by cycle

| Cycle | Trial balance | Debits | Credits | Reconciliation clean | Ledger events failed or waiting |
|---|---|---:|---:|---|---:|
| 1 Baseline | balances | 11966335.30 | 11966335.30 | yes | 0 |
| 2 Correction | balances | 12082235.50 | 12082235.50 | yes | 0 |
| 3 Full Revalidation | balances | 11974381.94 | 11974381.94 | yes | 0 |
| 4 Failure and Recovery | balances | 11919987.09 | 11919987.09 | yes | 0 |
| 5 Final Certification | balances | 12074697.59 | 12074697.59 | yes | 0 |

## The ten checks, cycle 5

| Check | Books | Records | Difference |
|---|---:|---:|---:|
| BOOKS_BALANCE | 12074697.59 | 12074697.59 | 0.00 |
| RECEIVABLES | 80357.51 | 80357.51 | 0.00 |
| INVENTORY | 8653337.35 | 8653337.35 | 0.00 |
| IN_TRANSIT | 0.00 | 0.00 | 0.00 |
| REVENUE | 969882.84 | 969882.84 | 0.00 |
| SALES_TAX | 3158.38 | 3158.38 | 0.00 |
| PAYMENTS | 893427.94 | 893427.94 | 0.00 |
| EVENTS |  |  | no items |
| COMPLETENESS |  |  | no items |
| SHIPPED_NOT_BILLED |  |  | no items |

## The ten checks after the failure-and-recovery day (cycle 4)

| Check | Books | Records | Difference |
|---|---:|---:|---:|
| BOOKS_BALANCE | 11919987.09 | 11919987.09 | 0.00 |
| RECEIVABLES | 92734.04 | 92734.04 | 0.00 |
| INVENTORY | 8601370.90 | 8601370.90 | 0.00 |
| IN_TRANSIT | 0.00 | 0.00 | 0.00 |
| REVENUE | 947323.84 | 947323.84 | 0.00 |
| SALES_TAX | 2390.17 | 2390.17 | 0.00 |
| PAYMENTS | 857724.20 | 857724.20 | 0.00 |
| EVENTS |  |  | no items |
| COMPLETENESS |  |  | no items |
| SHIPPED_NOT_BILLED |  |  | no items |

## The ten verifications of prompt section 18

| # | Verification | Result | Evidence |
|---|---|---|---|
| 1 | Every posted entry balances | pass | invariant "posted entries that do not balance" = 0 in every cycle; group 4 "After all of this, every posted entry in the books still holds the rules" |
| 2 | No duplicate postings | pass | invariant "business records with two ledger events of one kind" = 0; group 4 double post, double payment, double reversal scenarios |
| 3 | Source references intact | pass | every job traced from its order to its ledger events; group 4 per-branch posting scenarios |
| 4 | Accounting periods respected | pass | group 4 "Last month is closed by four requests at the same moment, and an entry dated in it is refused", "The month still running is closed by four requests at the same moment" |
| 5 | Location attribution | pass | group 4 "goods received post once, at cost, to the branch"; group 5 "the branch manager's books stop at the branch". Division: the product has no division dimension in the books (one company, branches) |
| 6 | Reversals preserve history | pass | group 4 "A posted entry is reversed by four requests at the same moment"; the database refuses any change to a posted line for the application role |
| 7 | Financial permissions | pass | group 4 "The person who wrote an entry cannot post it, on any server copy"; group 5 "people without a finance role cannot take money or touch the books", "An auditor reads the books under load and can change nothing" |
| 8 | Reporting totals reconcile | pass | group 4 "The finance reports agree with the reconciliation"; group 8 revenue by branch and by customer, stock value against the books |
| 9 | Posting failures recoverable | pass | group 4 "A posting rule that loses its approval stops posting; the payment is kept, held by name, and posts once when approved"; group 7 posting during a kill and a restart |
| 10 | No financial transaction disappears silently | pass | group 7 "After every failure, no business record was saved without its posting"; the COMPLETENESS and SHIPPED_NOT_BILLED checks |

## What posts, and what does not

Business events that posted in the day: invoice issued, stock shipped (cost of goods), payment recorded, credit issued, refund recorded, return restocked, stock received, stock adjusted, stock scrapped, transfer shipped, transfer received, work order completed. Manual entries were used for freight expense and deposits.

The product posts **no** separate work-in-progress, **no** freight income and **no** carrier freight cost automatically: there is no approved accounting rule for them. Processed material moves from raw material to finished goods when its work order completes; remnants stay in raw material stock. These are accounting policy decisions for the accountant (Phase 12), not defects found here.

## Ledger scenarios

From the final run on a rebuilt database (`qa/results/phase11-scenarios.json`).

| Scenario | Result | Checks |
|---|---|---:|
| Large processing branch QA-L30: goods received post once, at cost, to the branch | pass | 8 |
| Large processing branch QA-L30: a sale posts its invoice and its cost of goods, each once and for the right amount | pass | 10 |
| Large processing branch QA-L30: two tellers each take half of one invoice at the same moment | pass | 4 |
| Large processing branch QA-L30: the whole invoice is paid twice at the same moment | pass | 4 |
| Large processing branch QA-L30: a return is received, credited and refunded, and each step posts once | pass | 6 |
| Large processing branch QA-L30: damaged stock is written off and posts at the item's cost | pass | 4 |
| Large processing branch QA-L30: a transfer to another branch posts in transit on the way and stock on arrival | pass | 13 |
| Large processing branch QA-L30: six sales are dispatched at the same moment and every one posts once | pass | 5 |
| Large processing branch QA-L30: the receivables of one customer in the books equal that customer's open invoices | pass | 4 |
| Medium service center QA-L11: goods received post once, at cost, to the branch | pass | 8 |
| Medium service center QA-L11: a sale posts its invoice and its cost of goods, each once and for the right amount | pass | 10 |
| Medium service center QA-L11: two tellers each take half of one invoice at the same moment | pass | 4 |
| Medium service center QA-L11: the whole invoice is paid twice at the same moment | pass | 4 |
| Medium service center QA-L11: a return is received, credited and refunded, and each step posts once | pass | 6 |
| Medium service center QA-L11: damaged stock is written off and posts at the item's cost | pass | 4 |
| Medium service center QA-L11: a transfer to another branch posts in transit on the way and stock on arrival | pass | 13 |
| Medium service center QA-L11: six sales are dispatched at the same moment and every one posts once | pass | 5 |
| Medium service center QA-L11: the receivables of one customer in the books equal that customer's open invoices | pass | 4 |
| Small distribution branch QA-L15: goods received post once, at cost, to the branch | pass | 8 |
| Small distribution branch QA-L15: a sale posts its invoice and its cost of goods, each once and for the right amount | pass | 10 |
| Small distribution branch QA-L15: two tellers each take half of one invoice at the same moment | pass | 4 |
| Small distribution branch QA-L15: the whole invoice is paid twice at the same moment | pass | 4 |
| Small distribution branch QA-L15: a return is received, credited and refunded, and each step posts once | pass | 6 |
| Small distribution branch QA-L15: damaged stock is written off and posts at the item's cost | pass | 4 |
| Small distribution branch QA-L15: a transfer to another branch posts in transit on the way and stock on arrival | pass | 13 |
| Small distribution branch QA-L15: six sales are dispatched at the same moment and every one posts once | pass | 5 |
| Small distribution branch QA-L15: the receivables of one customer in the books equal that customer's open invoices | pass | 4 |
| Warehouse-heavy branch QA-L47: goods received post once, at cost, to the branch | pass | 8 |
| Warehouse-heavy branch QA-L47: a sale posts its invoice and its cost of goods, each once and for the right amount | pass | 10 |
| Warehouse-heavy branch QA-L47: two tellers each take half of one invoice at the same moment | pass | 4 |
| Warehouse-heavy branch QA-L47: the whole invoice is paid twice at the same moment | pass | 4 |
| Warehouse-heavy branch QA-L47: a return is received, credited and refunded, and each step posts once | pass | 6 |
| Warehouse-heavy branch QA-L47: damaged stock is written off and posts at the item's cost | pass | 4 |
| Warehouse-heavy branch QA-L47: a transfer to another branch posts in transit on the way and stock on arrival | pass | 13 |
| Warehouse-heavy branch QA-L47: six sales are dispatched at the same moment and every one posts once | pass | 5 |
| Warehouse-heavy branch QA-L47: the receivables of one customer in the books equal that customer's open invoices | pass | 4 |
| Sales-focused branch QA-L48: goods received post once, at cost, to the branch | pass | 8 |
| Sales-focused branch QA-L48: a sale posts its invoice and its cost of goods, each once and for the right amount | pass | 10 |
| Sales-focused branch QA-L48: two tellers each take half of one invoice at the same moment | pass | 4 |
| Sales-focused branch QA-L48: the whole invoice is paid twice at the same moment | pass | 4 |
| Sales-focused branch QA-L48: a return is received, credited and refunded, and each step posts once | pass | 6 |
| Sales-focused branch QA-L48: damaged stock is written off and posts at the item's cost | pass | 4 |
| Sales-focused branch QA-L48: a transfer to another branch posts in transit on the way and stock on arrival | pass | 13 |
| Sales-focused branch QA-L48: six sales are dispatched at the same moment and every one posts once | pass | 5 |
| Sales-focused branch QA-L48: the receivables of one customer in the books equal that customer's open invoices | pass | 4 |
| One draft entry is posted by four requests at the same moment | pass | 2 |
| The person who wrote an entry cannot post it, on any server copy | pass | 2 |
| A posted entry is reversed by four requests at the same moment | pass | 2 |
| Forty manual entries are written and posted at the same moment | pass | 4 |
| Eighty branches each post an entry at the same moment | pass | 2 |
| The trial balance is read twelve times while thirty entries are being posted | pass | 2 |
| The month still running is closed by four requests at the same moment | pass | 2 |
| Last month is closed by four requests at the same moment, and an entry dated in it is refused | pass | 4 |
| Two exports for the accountant are made at the same moment | pass | 5 |
| An export the accountant's system rejected is marked failed, withdrawn, and made again | pass | 5 |
| The reconciliation is run four times at the same moment | pass | 4 |
| The books are reconciled while twenty sales are being shipped and paid | pass | 7 |
| A stock record changed outside the product is named as a difference and is not adjusted away | pass | 15 |
| A posting rule that loses its approval stops posting; the payment is kept, held by name, and posts once when approved | pass | 12 |
| The search for business records with no posting is run three times at the same moment | pass | 3 |
| The application's own database role cannot change or remove a posted entry, even under load | pass | 4 |
| After all of this, every posted entry in the books still holds the rules | pass | 10 |
| The finance reports agree with the reconciliation | pass | 4 |
