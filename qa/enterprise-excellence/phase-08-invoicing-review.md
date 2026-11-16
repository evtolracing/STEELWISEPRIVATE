# Phase 8: invoice generation, payments and receivables

Date: 2026-11-16. Phase 8 of 12. Evidence is from this session, on a local database whose name contains `qa`. Nothing was run against the live database, no real shipment, invoice, payment or notice was made, and no printer, scanner or carrier system was used. Findings are in `findings-register.md` under N-001 to N-028.

## Invoice generation

| Rule | Verified by (`qa/sim/phase8-fulfillment.mjs`, group "Invoicing, payments and accounting sync") |
|---|---|
| Dispatch raises one invoice for exactly what left | "dispatch raises one invoice for exactly what left, in the same step" |
| A shipment is never invoiced twice | "a shipment is never invoiced twice"; database check "two live invoices for the same shipment" |
| Numbers run in sequence and are never repeated, also under load | "invoice numbers run one after another and are never repeated"; "six shipments dispatched at once get six different invoice numbers with no gap" (found N-022) |
| Tax follows each part shipped, and the parts add up to the order's tax to the cent | "tax follows each part shipped, and the parts add up to the tax on the order to the cent" |
| Freight is billed once, on the first shipment | see `phase-08-freight-calculations.md` |
| Payment terms on the order set the due date | "payment terms on the order set the due date" |
| An invoice is never edited | "an invoice is never edited: the only adjustments are a credit memo, a refund or a cancel before payment" |
| An invoice with nothing on it can be cancelled by a manager, and what it billed is billed again once | scenario of that name |
| The invoice shows its own history: issued, paid, credited, each with who | scenario of that name |

## Payments

A payment is a record a person types: amount, method, reference, date. No card or bank is charged by this product (NOT APPLICABLE as a payment-processing test, with evidence).

- Part payments add up; nobody can pay more than is owed; three full payments at the same moment are taken once.
- Amount, method and date are checked. **A date in the future is refused (N-007).**
- Only sales staff and managers of the invoice's branch take payments.

## Credit memos and refunds

- A credit memo is a manager's decision, needs a reason, and never exceeds what is left on the invoice, in total or by line, also when several are issued at once.
- **A typed amount over what is left is refused to the cent (N-021).** A rounding allowance of two cents applies only to a credit by line, where tax was worked out line by line.
- A credit memo cannot itself be credited, paid or cancelled.
- Credit on an invoice already paid is owed back to the customer until a refund is recorded against it.

## Receivables by age (new)

`GET /api/invoices/aging`, and "Owed by age" on the Invoices screen: what each customer owes, in five columns by whole days past due (not yet due, 1 to 30, 31 to 60, 61 to 90, over 90), read from the open invoices themselves. Paid and cancelled invoices are left out. Credit owed back to a customer is shown beside what they owe, not netted against it, because netting is an accounting policy nobody has set. Held to the reader's branches. The column rule is a pure function with unit tests at each edge.

At 85 branches with 16,856 open invoices the report answered in 6 to 8 ms on the local machine.

## Not built

Sending an invoice (email, PDF, portal notice): N-028. Statements, dunning, late fees, payment plans, write-offs: no rule exists and none was invented. Supplier invoice matching is K-012.
