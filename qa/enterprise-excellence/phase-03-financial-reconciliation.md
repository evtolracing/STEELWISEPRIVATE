# Phase 3: financial reconciliation

Whether orders, invoices, payments, credits and refunds agree with each other and with what was shipped. Run in this session on the local QA database. No amount was changed to make a total agree.

## 1. How money is kept

- An **order** carries subtotal, tax, freight and total. Each **line** carries a unit price (up to four places), a price unit and an extended price in cents.
- An **invoice** is raised by the dispatch of a shipment, for what that shipment carried. Each part shipment is billed its share of tax and freight (`buildInvoice` in `services/billing.js`), so that the invoices of an order add up to the order's figures exactly. The scenario in section 5 proves the sum to the cent.
- A **credit memo** is an invoice with negative amounts that points at the invoice it credits.
- A **payment** belongs to one invoice. A refund is a negative payment on a credit memo.
- Every money action goes through `services/billing.js`, in a serializable transaction that is retried if it overlaps another.
- Prices are copied onto the order line when the order is entered. A later change to a list price or a customer price does not touch an existing order (the price change itself is recorded with who made it).

## 2. What the database now enforces

| Rule | Since |
|---|---|
| Invoice total = subtotal + tax + freight | Phase 3 |
| Order total = subtotal + tax + freight; none of the three negative | Phase 3 |
| Unit price and extended price on an order line not negative; discount 0 to 100 | Phase 3 |
| A payment is not zero | Phase 3 |
| An invoice's shipment, a credit memo's invoice and an invoice line's order line must exist, and cannot be deleted once referenced | Phase 3 |
| Paid amount not above the total | Workstream 5 |
| Invoice number, order number and shipment number unique | Before |

Scenario "the database refuses money that does not add up, whoever writes it" writes eight violations straight to the database; each is refused.

## 3. Exact amounts (G-001)

Before this phase a JavaScript number written to a decimal column was stored with every binary digit: a tax of 9.38 was stored as 9.380000000000001. Twelve columns and eight of 62 invoices in the QA database were affected. Since the fix every number bound for a decimal column is sent as an exact decimal string, and amounts of money are rounded to the cent first. The check over every numeric column returns 0 after three simulation seeds and the Phase 3 scenarios.

Rounding as observed in the scenarios, unchanged by this phase: an extended price is quantity times price rounded to the cent, line by line (1137 lb at 0.8125 is 923.81); tax is computed on the order subtotal and rounded once (8.25% of 923.81 is 76.21); the invoices for part shipments add up to the order's tax and freight with nothing left over. This phase did not change any rounding rule.

## 4. Reconciliation checks

`qa/tools/db-facts.mjs`, read-only, after the simulation and again after the scenarios.

| Check | Result |
|---|---:|
| Invoice total differs from subtotal + tax + freight | 0 |
| Invoices paid more than their total | 0 |
| Invoice paid amount differs from its payments, outside the demo seed | 0 (1 demo seed invoice) |
| Invoice subtotal differs from its lines | 2, both demo seed invoices written with no lines (B-022) |
| Order subtotal differs from its lines, orders that are not draft | 0 |
| Order lines invoiced more than shipped | 0 |
| Tax invoiced on an order is more than the order's tax | 0 |
| Credit memos larger than the invoice they credit | 0 |
| Two live invoices for the same shipment | 0 |
| Amounts stored with digits beyond the cent | 0 |
| Invoices and credit memos with no record of who raised them, outside the demo seed | 0 |

The simulation's reconciliation of every order, invoice and payment reports 0 problems on all three seeds.

## 5. What the scenarios proved

| Scenario | Figures checked in the database |
|---|---|
| Order to invoice | 1137 lb at 0.8125 = 923.81; tax at 8.25% = 76.21; freight 45.00; total 1045.02. Stored to the cent, tied to its shipment and order line; the four-place unit price is kept |
| Two part shipments | 333 lb then 667 lb of 1000 at 0.777 with 7.25% tax and 60.00 freight: subtotals add to 777.00, tax to 56.33, freight to 60.00, and the two totals to the order total |
| Payments | 200.10 then 388.20 on 588.30: paid in full. One cent over is refused; a fraction of a cent is refused; a paid invoice takes no more; each payment has a history line |
| Credit and refund | 100 of 400 credited: memo of -267.50 pointing at the invoice. More than is left on the line is refused; a memo cannot be credited; a refund one cent over is refused; the exact refund settles it |
| Bad totals | An order whose total is not the sum of its parts is refused or corrected, never saved wrong; negative price and zero quantity are refused with a plain answer |
| All or nothing | An order with one bad line saves no order and no line. A credit whose last step is forced to fail leaves no memo, no refund, no history line, and undoes the step before it |
| Quote to order | 1250 lb at 47.35 per hundredweight is 591.88 on the quote and on the order |
| Counter sale void | Voided twice at once: one credit memo, money nets to zero, shelf stock returned once (C-010, now one transaction) |
| At the same moment | Five full payments at once: one taken. Three part payments that fit: all taken, total exact. One shipment invoiced four times: one invoice. One return received four times: one credit memo |

## 6. Gaps

| Gap | Evidence | Finding | Status |
|---|---|---|---|
| A shipment with nothing reserved is invoiced although no stock left the books | Scenario | G-019 | REQUIRES BUSINESS DECISION |
| A voided counter sale is known only by text in the order notes; the order stays complete | Code read | G-009 | DEFERRED to the sales module |
| Document numbers can skip (never repeat) | By design of the numbering, more so since G-017 | G-017 note | The owner decides if invoices must have no gaps |
| Cost of goods and margin by job | Cost columns are not maintained | I-series | Not built |
| Currency | One currency; the column exists and is not used in any calculation | None | Not applicable today |
| Tax by jurisdiction | One rate per order, supplied by the customer's tax status and the entry screen | S-series | Sales module |
| Purchase orders, vendor invoices, payables | Not built | I-007 | REQUIRES BUSINESS DECISION |
| Reported figures against the records | Dashboards are not compared with the tables they summarise | Phase 2, scenario 20 | Reporting phase |

## 7. Historical data in the live database

The fix for G-001 applies to rows written from now on. Rows already saved keep the digits they were saved with. Nothing in the SQL Editor files changes an amount.

If the owner wants historical amounts cleaned, the plan would be: (1) on a restored copy, count the rows per column where the value differs from itself rounded to the cent; (2) confirm that every difference is below one hundredth of a cent, which is what the cause predicts; (3) list the invoices where rounding changes whether paid equals total; (4) with the owner's written approval, round in one transaction per table, keeping a table of the old values. None of this has been done and none of it will be done without that approval.
