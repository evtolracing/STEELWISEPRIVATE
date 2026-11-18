# Phase 10: tenant, division and branch isolation

STEELWISE is one company with many branches, selling to customer accounts that may have divisions. Isolation therefore means three boundaries:

| Boundary | Mechanism | Where |
|---|---|---|
| Branch | Branch-scoped Prisma client on branch-owned models; each staff login holds a set of branches, or all | `src/backend/src/lib/branchScope.js` |
| Customer account and division | Store and account routes read by the login's own account; a division login sees its division only | `routes/ecom.js`, `routes/portal.js` and the enterprise account routes |
| Partner | Every partner read and event filtered by the partner's organization and scopes | `routes/partner/` |

## Tested (group 2, 31 scenarios; `qa/sim/phase10/g2-isolation.mjs`)

Set-up: customer A (QA-C01) has an order at branch QA-L01, shipped and invoiced, with a PDF on the order and a posted journal entry.

- A manager of QA-L02 cannot open the order, the invoice, the shipment, the order's document list, the document download or the journal entry of QA-L01; the QA-L01 manager can (six scenarios).
- A QA-L02 sales rep cannot open the QA-L01 order or shipment.
- Lists, search and the books of a QA-L02 manager hold nothing of QA-L01; naming another branch in a books query is refused or limited.
- A QA-L02 manager cannot change the QA-L01 order, record a payment, cancel or credit its invoice, attach a document to it, or delete its document.
- Branch managers cannot export the books or run a reconciliation.
- Customer B cannot open A's order, shipments or documents through the store, does not see A's order in the portal or the export, cannot download A's document by id, and cannot attach a document to A's order.
- A division login sees its own division, not its sister or the parent account.
- A customer login cannot read staff records by guessing ids.
- A partner of customer B cannot read customer A's order; partner and staff tokens do not cross; a partner without the scope is refused.
- The assistant gives a sales rep no ledger figures and a branch manager only their branch.
- Each of the 80 branches answers its own manager's trial balance and the branch figures add up to the company.

## Fixed this phase

**Y-016**: documents had no branch check. A document is now visible where its linked record is: the record is looked up through the branch-scoped client. A document with no link, or linked to a record that is not branch-owned, stays visible to staff as before. Applied to the list, the entity list, open, download, delete and upload.

## Not covered

- The dispatch board lists (V-028) are not in these scenarios.
- A table-by-table audit of tenant id columns (E-019): Phase 11.
- Row-level security in the database protects the public API roles (Phase 9.5, 172 of 172 tables); the application's own role sees all rows by design and relies on the layers above.
