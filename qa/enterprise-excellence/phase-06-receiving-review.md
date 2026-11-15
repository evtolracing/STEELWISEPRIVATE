# Phase 6: receiving review

Date: 2026-11-15. Group "Receiving and putaway" in `qa/sim/phase6-inventory.mjs`: 15 scenarios, all pass.

## 1. The receipt

One form (Receiving screen, `POST /api/inventory/receipts`) and the spreadsheet upload both go through `lib/receiving.js`, in one database transaction: the item, its balance, the movement and, since this phase, the purchase order line and any hold are saved together or not at all.

| Rule | Check |
|---|---|
| Item number is unique | Second receipt refused; one item, one movement |
| Weight above zero; a known branch; a heat for metal | Each refused with nothing saved |
| The heat must be on file, and the grade must be the heat's | Unknown heat refused with "add it under Heats first"; a second grade on a heat refused |
| A person receives only at their own branch | Branch login refused at another branch |
| Receiving is warehouse work | Receiving clerk accepted; sales login 403 |
| The movement names the person | `createdById` checked |
| Shelf goods by the piece (C-011) | Form SUPPLY: whole pieces, a product in the catalog, no heat or grade, counted in EA |
| A piece cut from a parent | Takes its weight from the parent, keeps heat and grade, names the parent |
| Against a purchase order line (I-007) | See the purchasing review |
| A mismatch is held, not refused | Out-of-tolerance thickness held; inside the line's tolerance not held; a sales login cannot release, a manager can |
| The upload says what it saved | One good row saved, one bad row named and not saved |
| Recent receipts are per branch | Another branch's receipt is not listed |

## 2. Putaway

A bin is typed at receipt and can be changed on the item (saved, shown in the stock list, balance unchanged: PASS). There is no bin master, no directed putaway and no capacity rule (K-009, the owner's decision).

## 3. The screen

Open purchase order lines for the person's branch are listed above the receipts with ordered and received. "Receive" on a line opens the form with the grade, size, supplier reference and line already filled. Shelf goods switch the form to pieces and a product. The reply shows the hold reason when the material was held. Browser checks: the open line is listed, choosing it fills the receipt, no script errors.

## 4. Cost

A receipt records no cost, even when the purchase order line has a price, and a cost sent in the request is ignored (scenario "receiving does not create a cost": PASS as a statement of today's behaviour). This is finding K-007 and waits for the owner's costing rule.

## 5. Not verified

Label printing and scanning at the dock: no hardware in this environment (K-013). Receiving against live purchase orders: none exist yet.
