# Phase 8: accounting integration, general ledger, valuation and cost of goods

Date: 2026-11-16. Phase 8 of 12. Evidence is from this session, on a local database whose name contains `qa`. Nothing was run against the live database, no real shipment, invoice, payment or notice was made, and no printer, scanner or carrier system was used. Findings are in `findings-register.md` under N-001 to N-028.

## Finding: there is none (N-025)

The schema and the code were searched for a chart of accounts, a journal, a posting period, an accounting connection, a tax-authority report and a bank connection. None exists. Invoices, payments, credit memos and refunds are the only financial records, and they are complete and consistent with shipments (see `phase-08-financial-reconciliation.md`).

`qa/sim/phase8-fulfillment.mjs` records this with evidence as NOT APPLICABLE in three scenarios: "there is no accounting system connected: nothing is posted to a ledger", "no card or bank payment is processed: a payment is a record a person types", "overhead, freight cost, landed cost allocation and cost of goods posting are not built".

## What the instruction forbids, and what was therefore not done

- "Do not assume COGS is recognized at shipment unless the documented system requires it." No document says when cost of goods is recognised, so nothing recognises it. The product records the cost of what left (a fact), on the stock movement, at the moment it left. Whether that becomes cost of goods at shipment, at invoice or at delivery is the owner's accounting policy.
- "Change established accounting policies" and "fabricate financial adjustments": no account mapping, no accrual, no adjustment and no write-off was created.
- "Silently alter inventory valuation": dispatch does not change the cost on a stock item (verified: "shipping does not change the value on the stock item"), and a later change to an item's cost does not change what a past sale cost.

## What exists that an accounting system could read

- Invoices and credit memos with lines, tax, freight, due date, branch and customer.
- Payments and refunds with method, reference and date.
- Receivables by age.
- For each shipment movement, the quantity and the unit cost on the day it left (from database file 14 onward).
- The customer webhook (Phase 4) announces invoices to a subscribed system in the same save.

## Decisions for the owner

1. Which accounting system, if any, the product should post to, and whether it posts or the accountant imports.
2. The chart of accounts and the mapping of sales, tax, freight, receivables, inventory and cost of goods.
3. When cost of goods is recognised.
4. Whether overhead and freight cost are part of cost.
5. Period close: whether an invoice or payment may be dated into a closed month.

Until these are decided this area stays REQUIRES BUSINESS DECISION and gate D is met only for the records that exist.
