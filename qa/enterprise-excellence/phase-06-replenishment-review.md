# Phase 6: replenishment review

Date: 2026-11-15.

## 1. What existed

Nothing for material. Only spare parts carry a reorder point. The assistant on the v1 inventory screen prints the words "Create Reorder Request" as advice and creates nothing. There is no minimum, maximum, lead time or safety stock for any grade at any branch, on file or in code.

## 2. What was built: the supply position

`GET /api/purchase-orders/supply-position`, shown as the "Supply position" tab on the Purchase orders screen. One row per branch and grade, in pounds:

| Column | Meaning |
|---|---|
| On hand | Everything on the books at the branch |
| Free, reserved, on hold | How on hand is split |
| Sent, in transit | Shipped to another branch and not yet received there (still on this branch's books) |
| On order | Open purchase order lines, ordered less received, converted from CWT or tons |
| Coming by transfer | On open transfers to this branch |
| Open sales not reserved | Open sales order lines, ordered less shipped, less what is already reserved |
| Projected free | Free + on order + coming by transfer - open sales not reserved. Shown in red when below zero |

A person sees the branches they work at; a manager with every branch sees all. Asking for a branch that is not yours is "not found". Stock counted by the piece is left out, because pounds cannot be added to pieces.

Measured on the 85-branch copy (100,233 stock items): 271 ms median for an all-branch login.

## 3. What was deliberately not built

The system suggests nothing and creates no purchase order. A reorder point, an order-up-to level, a lead time and who sets them are business numbers that do not exist anywhere in the records, and inventing them is forbidden. The screen says so: "No reorder point is set for material, so nothing is suggested."

Finding K-010 is REQUIRES BUSINESS DECISION. Once the owner gives a rule (for example a minimum per grade and branch), the same query can flag rows below it.

## 4. Scenarios

| Scenario | Result |
|---|---|
| Placing a 9,000 lb order adds 9,000 on order; a 4,000 lb receipt moves 4,000 from on order to on hand; projected free follows the formula | PASS |
| A branch login sees its own branch only; another branch is not found; no suggestion field is returned | PASS |
| Browser: the tab shows rows for the signed-in branch only | PASS |
| A customer login is refused | PASS |
