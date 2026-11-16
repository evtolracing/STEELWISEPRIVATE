# Phase 6: user experience and efficiency

Date: 2026-11-15. Screens are JavaScript and React with Material UI. Browser checks: `qa/sim/ui-phase6.cjs`, 14 checks, 0 failed.

## 1. New and changed screens

| Screen | What a person does | Steps before | Steps now |
|---|---|---|---|
| Purchase orders (new, beside Receiving in the menu) | Write an order, place it, see what has arrived on each line, close or cancel it | Not possible for a buyer | One dialog to write; one button each to place, close, cancel |
| Supply position (tab on Purchase orders) | See stock, what is coming and open demand per branch and grade before buying | Several screens and memory | One table, filter by branch or grade |
| Receiving | Receive against an open purchase order line | Type everything; nothing checked against the order | Press Receive on the line: grade, size, reference and line are filled; type the item number, heat and weight |
| Receiving, shelf goods | Receive gloves or blades by the piece | Not possible | Choose Shelf goods: pieces and product, no heat |
| Transfers (new) | See what is coming to my branch, receive it, record short, missing or damaged, settle, call back | No receipt step existed | Open the transfer, Receive; one row per item with quantity, condition and note |
| Stock item | Send to another branch | Moved instantly | "Send to another branch" with carrier and reference; the page then says it is in transit and Move is switched off |

## 2. Messages

Every refusal added in this phase is a sentence a warehouse person can act on, for example: "Stock item X is on its way to another branch. Reserve it after it is received", "Line 1 is counted in EA and stock item X in LB. Reserve stock counted in the line's unit", "Heat H is not on file. Add it under Heats first". Holds placed by the system list every reason.

## 3. A defect the browser check caught before release

The first run of the browser check showed "Nothing is on its way to your branch" although a transfer was on its way: the Transfers and Purchase orders screens read a wrapped list where the server sends the rows themselves. Both screens and the Receiving screen's open-line list now accept either shape. This never reached a commit.

## 4. Kept as they were

No screen was rebuilt. No dependency was added. The lint ceilings are unchanged (0 errors).

## 5. Left for the user experience phase

| Item | Finding |
|---|---|
| The stock list row does not say "in transit" (the item page and the Transfers screen do) | K-014, Phase 9 |
| The new screens use a plain fetch helper like their neighbours, not a shared data hook | B-014 |
| Keyboard-only use and screen reader names on the new dialogs: fields have labels; a full pass is Phase 9 | Phase 9 |
| Scanner-first receiving and picking | K-013, hardware not available |
