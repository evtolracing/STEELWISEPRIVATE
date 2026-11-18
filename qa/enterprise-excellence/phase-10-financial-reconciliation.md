# Phase 10: inventory-to-ledger and receivables reconciliation

Group 5 of the Phase 10 suite (`qa/sim/phase10/g5-recon.mjs`, 30 scenarios). After each kind of business event the books are reconciled (`POST /api/ledger/reconciliations`) and three checks must say MATCH: the books balance, stock in the books equals the stock records at cost, receivables in the books equal what the invoices say is owed. Every posted entry must balance too.

## Events reconciled one by one

Receipt against a purchase order; receipts at the far branches QA-L10, QA-L40 and QA-L80; a shipment invoiced; a part payment; an overpayment (refused, posts nothing); a credit memo; the rest paid and a credit refunded; a count that finds more stock; damage written off; a transfer shipped and received (in transit on the road, at the receiving branch after); a work order completed; a cost corrected on stock on hand (revalued once); ten receipts across ten branches at once; a counter sale; an invoice cancelled before any payment; a credit larger than what is still owed (credit owed back, shown apart). The books agree at the start of the group, after each event, and at the end.

## Reports agree with the books

The inventory report and the trial balance give the same stock value; the receivables report and the trial balance give the same receivables; a branch manager's inventory report holds only their branch and agrees for it; every costed stock item has its value in the books within a cent; stock on the road is in the books as in transit and agrees.

## A record changed outside the product

- Stock changed directly in the database shows as an INVENTORY difference, raises `LEDGER_RECONCILIATION_DIFFERENCE`, and no entry is made to hide it.
- An invoice amount changed directly shows as a RECEIVABLES difference by customer, and is not corrected.
- A stock row whose quantities do not add up fails the system check; a count that cannot run is never reported as passing.

## What a reconciliation does not do

It reads and compares. It never writes an entry to make the books agree. A difference is for a person, with the detail by item or customer.

## Gaps stated

- Shipped goods that were never invoiced are not revenue in the books (correctly). They are listed, and after 15 minutes fail the check "shipped goods invoiced" (Y-021).
- Supplier invoices are not in the product, so goods received and not invoiced stay in their clearing account (W-009).
