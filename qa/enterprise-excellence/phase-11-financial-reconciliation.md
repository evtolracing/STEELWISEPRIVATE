# Phase 11: financial reconciliation

Date: 2026-11-18. Every figure here was measured in this session on one local machine (4 processors, 15.7 GB), against a local PostgreSQL 16 database whose name contains `qa`, with synthetic data only, the server copies connected as the least-privilege role `steelwise_runtime`, and a local stand-in for every outside service. Nothing was run against the live database, the host or any real partner, carrier, payment or accounting system. Anything not run is marked NOT VERIFIED.

No difference was forced to zero. Where something could not be reconciled because the product keeps no record to reconcile against, it is marked NOT VERIFIED with the reason.

## The reconciliations of prompt section 19

| Reconciliation | Result | How | Evidence |
|---|---|---|---|
| Accounts receivable to invoice and payment detail | agrees: books 80357.51, records 80357.51, difference 0.00 | RECEIVABLES check, and customer by customer in group 4 | cycle files; group 4 "the receivables of one customer in the books equal that customer's open invoices" |
| Inventory financial balance to valuation records | agrees: books 8653337.35, records 8653337.35, difference 0.00 | INVENTORY check, item by item | cycle files; group 8 "The stock value report equals the stock value the reconciliation reads from the books" |
| Material consumption to production costs | agrees within the inventory check; NOT VERIFIED as a reconciliation of its own | A completed work order moves cost from raw material to finished goods in one entry. The product keeps no separate production cost ledger to reconcile against | group 2; WORK_ORDER_COMPLETED events all posted |
| Finished goods to inventory valuation | agrees within the inventory check | Finished goods are stock items valued like any other | INVENTORY check |
| Scrap to write-offs | agrees | Each write-off posts at the item's cost; the inventory check would show any that did not | group 4 "damaged stock is written off and posts at the item's cost"; STOCK_SCRAPPED events all posted |
| Freight income to customer charges | NOT VERIFIED | The product posts no freight income: no approved rule exists. Nothing to reconcile | accounting policy, Phase 12 |
| Freight expense to source costs | NOT VERIFIED | The product records no carrier cost and posts none. Freight expense in the test books is manual entries only | accounting policy, Phase 12 |
| Credits to original transactions | agrees | Each credit is tied to its return and its invoice; a return is received, credited and refunded, each step posting once | group 4; job kind F traced end to end |
| Branch totals to enterprise totals | agrees | Revenue read by branch and by customer adds to the same total; eighty branches each post and the trial balance balances | group 8 "Revenue adds up to the same total whether it is read by branch or by customer"; REVENUE check |
| External accounting export batches to acknowledged records | agrees for the file export; NOT VERIFIED against a real accounting system | Every batch holds exactly the entries it counts; no entry is in two batches; a rejected batch is withdrawn and made again. No accounting system received anything | group 4 export scenarios; group 7 "An accounting export is being made when a server copy is killed" |

## Money, cycle 5

| Check | Books | Records | Difference |
|---|---:|---:|---:|
| RECEIVABLES | 80357.51 | 80357.51 | 0.00 |
| REVENUE | 969882.84 | 969882.84 | 0.00 |
| SALES_TAX | 3158.38 | 3158.38 | 0.00 |
| PAYMENTS | 893427.94 | 893427.94 | 0.00 |

Invariants: invoices paid beyond their total 0; shipments billed twice 0; invoice numbers used twice 0.

## Unexplained differences

None in any final cycle. Two were found on the way and explained, and neither was adjusted:

1. Second run of cycle 4: 4 shipments dispatched with no invoice after a server copy was killed. Cause known (dispatch and billing are two saves, H-006); listed by the product; closed by billing each shipment. Z-012.
2. Failure group after cycle 4: one invoice held two payments of the same keyed request. Cause found and fixed (Z-013). The duplicate was left in that database as it was; the database was then rebuilt for cycle 5.

## Gross margin

Revenue and cost of goods post from the same shipment, so margin by branch is the difference of two reconciled figures. A margin report compared line by line with the records was not made in this phase: NOT VERIFIED (V-037).
