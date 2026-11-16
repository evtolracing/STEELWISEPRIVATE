# Phase 3: the owner's decisions of 2026-11-13 and what was built from them

The Phase 3 report ended with six questions. The owner answered them the same day. This file records each answer in the owner's words, what was built, the evidence, and what the answer does not cover. Everything was run in this session on the local QA database; nothing was run against the live database.

Where another Phase 3 file describes one of these subjects as an open question, this file is the later word.

## The answers

| # | Question | The owner's answer | Finding | Status now |
|---|---|---|---|---|
| 1 | May an order ship when no stock is reserved for it? | "REFUSE" | G-019 (P1) | VERIFIED FIXED |
| 2 | When a piece is cut, what happens to the parent's weight and the scrap? May one item feed two open work orders? | "EVERYTHING ALWAYS HAS TO BE TRACKED HOWEVER THAT WORKS. IF THE SYSTEM WORKS RIGHT WITH ONE ITEM FILLING DIFFERENT WORK ORDERS THATS FINE IT COULD HAPPEN." | M-016 (P1), G-006, G-008 | VERIFIED FIXED |
| 3 | How should stock be corrected after a count? | "YOUR RECCOMENDATIONS" | I-016 (P1) | VERIFIED FIXED |
| 4 | Must invoice numbers have no gaps? | "NO NEVER SKIPPED OR REPEATED" | G-017 | VERIFIED FIXED |
| 5 | How many years of history must stay online? | "5 FOR NOW WITH WARNINGS TO ARCHIVE" | G-016 | VERIFIED FIXED |
| 6 | Backups and a tested restore | "BACKUPS LATER" | E-015 (P1) | ACCEPTED RISK WITH APPROVAL |

## 1. A shipment must come off reserved stock

**Rule.** At dispatch, every line on the shipment must have at least as much stock reserved as the shipment carries. If any line is short, the whole dispatch is refused with the line number, the quantity that is short and what to do: reserve the stock on the order first. Nothing is saved for any line.

**Why this closes the gap.** The stock item, and through it the heat, is recorded by the movement written when reserved stock leaves. With no reservation there was no movement, no item, no heat and no change to the balance, yet an invoice was raised.

**Where.** `src/backend/src/routes/shipments.js`, `consumeReserved`. The shop-floor Ship button on a job goes through the same step, so it follows the same rule.

**Evidence.** Scenario "a shipment with nothing reserved, or less reserved than it carries, is refused and changes nothing": nothing reserved is refused; half a pound short is refused; fully reserved goes and the movements name the item. The sweep's shipping section now also proves the refusal before it reserves and ships. The read-only check for dispatched shipment items not covered by stock movements is 0.

**What staff will notice.** A shipment that was accepted yesterday with nothing reserved is refused today. The message says why. Reserving is done on the order screen.

**Not covered.** A line that is a service or a charge and has no material cannot ship on a shipment at all under this rule. No such line type exists in order entry today. If one is added, it needs its own rule.

## 2. Cutting is always tracked

**Completing a work order** is now one transaction that:

1. takes the good weight and the scrap off the source item, with two movements (pieces, scrap) that name the work order;
2. creates each piece as a stock item with the source's heat, grade, owner, product and branch, its own balance, and a movement that says which item and work order it came from;
3. leaves whatever was not used on the source item, which stays available. An item with nothing left is marked consumed.

The request may list the pieces (weight, width, length, form, item number) or give one output weight, which becomes one piece. The work order screen asks for the good weight, the scrap and the number of pieces.

**Stock reserved for an order.** A work order can name the order line it is for. Stock reserved on the source item for that line is what gets cut, and the pieces stay reserved for the same line, so they can ship under rule 1. Reserved stock that became scrap is no longer reserved; the line then shows less reserved than ordered, and more must be reserved.

**One item, several work orders.** Allowed. A work order can be raised on an item that is available or reserved. Each work order takes only what is free (or reserved for its own line) at the moment it completes, under a lock on the item's balance. More than that is refused, with the quantities in the message, and nothing is saved.

**Remnants.** Recording a remnant against its parent takes the remnant's weight off the parent in the same transaction. A remnant heavier than what is free on the parent is refused.

**Where.** `src/backend/src/lib/stockChanges.js`, `routes/workOrders.js`, `lib/receiving.js`.

**Evidence.** Scenarios in group 3 and one in group 6: three pieces from a 2,000 lb item (source falls to 500 lb; pieces, scrap and remainder add to 2,000 lb; heat inherited); a completion over what is free refused with nothing saved; reserved stock cut for its order and shipped, with the heat traceable to the customer through the pieces; three work orders on one 4,000 lb item completed at the same moment (two fit, one refused, never below zero); a remnant reducing its parent. Three new read-only checks (movements match the work order, pieces weigh the output, pieces carry the source heat) are 0.

**Not covered, stated plainly.**

- The shop-floor job route (jobs and their operations) records who did what and when, not weights. Material for a job is tracked through the reservation it ships from: the shipment names the item and heat. A job does not record scrap or create pieces. If jobs should do what work orders now do, that is a manufacturing-phase change.
- A completed work order cannot be reversed. A mistake is corrected with a stock correction (rule 3), which is on record.
- The weight printed on a stock item's own record stays the weight it was received at. The quantity on hand is the balance. Screens that show both are unchanged.
- Cost of the pieces is not worked out. Cost columns are not maintained anywhere yet.

## 3. Stock corrections

**My recommendation, as built.**

- One action, **Correct quantity**, on the stock item screen and at `POST /api/inventory/adjust`.
- The person enters what is actually there (or a difference), picks a reason (count, damage, scrap, found stock, keying error) and must write what was found.
- The balance changes only through a movement that carries the person, the direction, the quantity and the note, plus a history line with before and after. A count that agrees writes a history line and no movement.
- **Who:** branch and company managers and the inventory manager, at their own branches. Everyone else is refused.
- **Limits:** stock that is reserved or on hold cannot be taken away (it has to be released first, so an order never loses its stock silently), and a balance cannot go below zero.

**Evidence.** Four scenarios in group 7 (count down, found stock, agreeing count, refusals, roles and branches, a correction racing a reservation and a shipment), unit tests, and a read-only check that no correction lacks a note or a person.

**Not built.** A cycle-count program: count sheets, a calendar of what to count, freezing a location during a count, and a second approval for large differences. Corrections are made one item at a time.

## 4. Invoice numbers are never skipped and never repeated

**How.** The last number of each series (invoices, credit memos) is one row in a new table, `DocumentCounter`. It is advanced inside the transaction that saves the document, at the moment the document is written. A save that is refused or fails gives its number back. Two saves at once cannot take the same number: the second waits and is run again.

**Counter sales** used their own numbers (`INV-QS-` and the order number), which skipped whenever order numbers did. They now take the next number of the one invoice series. A counter sale sent twice at once is held by a lock on the sale, instead of being written and then removed.

**Evidence.** Twelve invoices raised at the same moment take twelve numbers in a row. A credit memo that fails after taking its number, a refused credit and a request with nothing to bill take none. A counter sale sent three times at once is one sale with the next number. Read-only checks: each counter equals the highest number on file; no number is repeated.

**Limits.**

- Numbers issued before this change keep whatever gaps they have. They were not renumbered: an issued invoice number is a legal record.
- Orders, shipments, jobs and work orders keep the earlier rule: never repeated, may skip.
- A cancelled invoice keeps its number and stays on file as cancelled, so the series stays whole.
- New database file 9 must be applied before this code is deployed. Without the table an invoice cannot be numbered. A dispatch would still go; its invoice would then have to be raised from the invoices page once the file is in.

## 5. Five years of history, with a warning to archive

**How.** `GET /api/admin/retention` counts, for nine kinds of record, how many are older than five years and how many will be within six months, and returns a warning. Managers see it at the top of the user administration screen. The period is five years unless a setting (`retention.years`) says otherwise.

**It only warns.** Nothing is removed or moved. Archiving itself is not built: what is archived, where it goes and who approves it is a later decision.

**Evidence.** Scenario "history older than five years raises an archive warning, and nothing is removed", and unit tests for the dates.

## 6. Backups later

Recorded as the owner's decision. Until a backup is confirmed and a restore has been tested, a loss or corruption of the live database may not be recoverable. E-015 is ACCEPTED RISK WITH APPROVAL and stays in the risk register as a production blocker.

## Database file

| # | File for the owner | Content | Tested |
|---|---|---|---|
| 9 | `/mnt/project-files/database-updates/9-20261113220000_document_counters.sql` | One new table, `DocumentCounter`, started from the highest invoice and credit memo number on file. Nothing existing is changed | Run twice on the 85-branch copy: first run 0.16 s, series started at INV 116 and CM 9; second run changed nothing |

Apply files 6, 7, 8 and 9, in order, before merging.

## What the decisions did not change

- B-009 (P1): the second stock list and order hub are still not migrated. It needs a read-only export of the live stores.
- G-007: a transfer is still one immediate step with no in-transit stage.
- Performance was measured on a local machine.

These are why Phase 3 remains PARTIALLY COMPLETE. See `phase-03-report.md`.
