# Phase 6: interbranch transfer reconciliation

Date: 2026-11-15. Finding G-007. Group "Interbranch transfers": 17 scenarios, all pass, plus 6 transfer scenarios under "Concurrency, security and recovery".

## 1. Before

A transfer was one step. The item was at the destination the moment the sender pressed the button, so material on a truck was counted on the receiver's shelf and could be sold there. There was no receipt, so a shortage, damage or loss on the road could not be recorded.

## 2. Now

| Step | Who | Balance | Record |
|---|---|---|---|
| Send (one or up to 100 items, all from one branch) | The sending branch | The item stays on the sender's books. Its free quantity moves to "in transit". Reservations and holds stay as they are and travel with it | `StockTransfer` (number TRF-, carrier, reference, who, when), a line per item, audit row |
| On the road | Nobody | Cannot be reserved, held, corrected, cut, shipped to a customer or sent again. Each refusal says why | |
| Receive | The receiving branch only | The item and its balance move to the receiving branch; in transit goes back to free | TRANSFER movement per item with both branches and the person; line condition and quantity |
| Short, missing or damaged | The receiver says what was found, with a note | The whole item is held (DISPUTE or DAMAGE). Nothing is written off by the dock | Hold with the reason |
| Settle | Manager or inventory manager at the receiving branch | "Really missing": the missing quantity comes off, once. "Turned up": nothing changes. The hold is released | ADJUST movement (TRANSFER_SHORT_DOWN), audit row |
| Call back | The sending branch, with a reason, before receipt | In transit goes back to free at the sender | Cancelled transfer; no movement |

The database holds the rules that matter: the two branches differ; the status is one of three; quantities are not negative; and on hand = available + reserved + on hold + in transit for every balance (the identity check was replaced to include the new bucket).

## 3. The fifteen transfer tests

| # | Test | Result |
|---|---|---|
| 1 | Three items sent: numbered, in transit, still at the sender, no movement yet | PASS |
| 2 | In transit: hold, correction, second send refused | PASS |
| 3 | Received in full: at the other branch, on sale, one movement each | PASS |
| 4 | Short: held whole; confirming takes the missing weight off | PASS |
| 5 | Shortage turns up: nothing taken off; second settlement refused | PASS |
| 6 | Never arrived: taken off entirely, item used up | PASS |
| 7 | Damaged: held as damage | PASS |
| 8 | Received twice: booked in once | PASS |
| 9 | The sender cannot receive its own transfer | PASS |
| 10 | Sender can call back; receiver cannot; a cancelled transfer cannot be received | PASS |
| 11 | Only a manager or inventory manager settles | PASS |
| 12 | A reserved item travels with its reservation and ships from the new branch | PASS |
| 13 | An item on hold travels on hold | PASS |
| 14 | Each branch sees its own incoming and outgoing transfers only | PASS |
| 15 | Two branches' items, own branch, unknown branch, same item twice: refused | PASS |
| 16 | More than shipped, an item not on the transfer, a short line with no note: refused | PASS |
| 17 | The old one-item address ships; the v1 transfer writes are retired | PASS |

Simultaneous and failure cases: two receivers at once, one books it in; receipt and call-back at once, exactly one happens; one item to two branches at once, one transfer; two settlements at once, one applied; a save that fails part way (forced by a database fault) leaves the stock exactly as it was, and the retry succeeds; the same send repeated with one key ships once.

## 4. Reconciliation

Run after every scenario group and by `qa/tools/db-facts.mjs` after the whole suite. Each is the number of rows that break the rule:

| Check | Result |
|---|---|
| Stock in transit that is not on an open transfer, or an open transfer whose stock is not in transit | 0 |
| Stock on an open transfer that is not at the sending branch | 0 |
| An item on more than one open transfer | 0 |
| Received transfers with no TRANSFER movement for an item on them | 0 |
| Transfer lines received more than shipped, or a good line not received whole | 0 |
| Balance identity including in transit | 0 |
| Last transfer of an item did not end where the item now is | 0 |

Company stock on hand is unchanged by a send, a receipt and a call-back; it changes only when a manager confirms a shortage.

## 5. Not built

Transfer requests and approval before sending, freight cost on a transfer, and a transfer price between branches. None has a rule on file. Value in transit cannot be stated until costing is decided (K-007).
