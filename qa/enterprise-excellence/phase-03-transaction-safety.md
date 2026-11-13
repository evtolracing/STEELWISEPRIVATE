# Phase 3: transaction safety

Where each multi-step operation begins and ends, what it locks, what happens when it fails part-way, and what stops a repeated request from doing the work twice. Read from the code and proved against the local QA database in this session. Phase 2's audit of the shop-floor, login and counter-sale handlers (`phase-02-transaction-safety.md`) still stands and is not repeated.

## 1. Settings

| Setting | Value | Note |
|---|---|---|
| Default isolation level | Read committed | PostgreSQL default; read from the database |
| Money actions (invoice, payment, credit, refund) | Serializable, retried up to 6 times when the database reports an overlap | `services/billing.js`, `lib/numbering.js` (`retryOverlap`) |
| Adding an item to a shipment | Serializable | `routes/shipments.js` |
| Everything else | Read committed with conditional updates or row locks, below | |
| Deadlocks observed | 0 in the PostgreSQL log across every run of this session, including the 80-at-once and 40-change bursts | Locks are always taken in the same order: order row, then stock rows; dispatch job, then job |
| Transactions held open across a call to an outside service | None found in the handlers read in Phases 2 and 3 | The 45 route files examined by tool only in Phase 2 were not re-read for this |

## 2. Transaction boundaries of the stock and money operations

| Operation | One transaction covers | Guard against simultaneous use | Failure part-way | Proof |
|---|---|---|---|---|
| Receipt | Item, balance, movement | Unique item number | Nothing saved | Unknown heat: 0 rows added. Five identical receipts at once: one item |
| Receive more onto an item | Balance and movement | Increment in the database | Nothing saved | Wrong branch, zero and negative: unchanged |
| Reservation | Lock on the order row; status and open quantity read inside; balance; reservation row; history line | Order row lock; conditional update on available quantity | Nothing saved | **Changed in Phase 3 (G-004).** Line over-reserved in 6 of 6 rounds before, 0 after |
| Order status change | Status, release of reservations on cancel, line statuses, credit hold record, history line | Conditional on the status the editor saw; waits for a reservation in progress through the order row | Nothing saved | Confirm against cancel: one 200, one 409, one history line |
| Order creation | Order and all its lines in one insert | Unique order number; request key if sent | Nothing saved | An order with one bad line: 0 orders, 0 lines |
| Dispatch | Shipment status, consumption of reservations, movements, line and order quantities and statuses, invoice | Conditional on shipment status | Nothing saved | A hold on the second of two lines: first line rolled back, no movement, no invoice. Four dispatches at once: one |
| Transfer | Balance branch, item branch, movement | Conditional on the branch the item is at | Nothing saved | Same transfer twice at once: one. Two destinations at once: one, and the ledger ends where the item is |
| Hold and release | Item status, balance, hold record | Conditional on status and on available quantity | Nothing saved | Second hold refused; identity holds |
| Invoice | Number, invoice, lines, history | Serializable; existing invoice for the shipment returned | Nothing saved | Asked three more times: one invoice |
| Payment | Payment row, paid amount, status, history | Serializable | Nothing saved | Five full payments at once: one. Three part payments: all three, exact total |
| Credit memo | Number, memo, lines, history, and any steps the caller passes in | Serializable | Nothing saved, including the caller's steps | **Changed in Phase 3 (C-010).** Forced failure after the memo: 0 memos, 0 refunds, 0 history lines, earlier step undone |
| Void of a counter sale | Claim, stock return, credit memo, refund | The claim is a conditional update | Nothing saved | **Changed in Phase 3.** Two voids at once: one |
| Return receipt | Return status, balance, movement, credit memo | Conditional on return status | Nothing saved | Four at once: one |
| Work order move | Status and weights | Conditional on status | The history line is a second write | Complete twice: refused |
| Numbered documents | Number chosen and row inserted | Unique number in the database | Retried with another number | **Changed in Phase 3 (G-017).** 80 at once: 72 saved before, 80 after |

## 3. Idempotency

| Operation | Protection | Proof |
|---|---|---|
| Any changing request that carries an `Idempotency-Key` header | **New in Phase 3 (C-006).** `RequestKey` table, unique on (user and route, key). The first request claims the key; a repeat while it is running is told to wait (409); a repeat afterwards gets the first answer back, marked `Idempotency-Replayed: true`; the same key with a different body is refused (422); a refused request is not remembered, so it can be corrected and sent again; a claim that never finished is taken over after 60 seconds; keys are removed after 24 hours | Four scenarios. Three identical orders at once: one order |
| Screens | `src/frontend/src/api/requestKey.js` sends a key for every request that creates a document or moves stock (orders, order intake, web checkout, reservations, quotes and their acceptance, shipments, dispatch and delivery, invoices, payments, credits, refunds, returns and their receipt, stock receipts, uploads, transfers, work orders, jobs), and reuses it while the request is unanswered | Lint and build pass; the five browser suites pass. No browser test asserts the header itself: NOT VERIFIED at that level |
| Counter sale | By sale id (Phase 2) | Phase 2 integrity |
| Dispatch, delivery, invoice, payment, return receipt, operation completion, void | By state: the second request finds the work done and is refused or given the existing record | Scenarios above |
| Receipt | By unique item number | Five at once: one |
| Transfer | By the branch the item is at | Twice at once: one |
| Reservation | **Not idempotent.** The same reservation sent twice reserves twice if the line and stock allow it; a request key from the screen prevents it | The screens send a key. A caller that sends none is not protected |
| Order creation without a key | Not protected: two identical requests are two orders | By design of an opt-in key. The screens always send one |
| Partner API and webhooks | Not examined in this phase | Phase 4 |

## 4. Retries and recovery

- A transaction the database reports as overlapping another is run again (up to 6 times for money, up to 40 number attempts for a numbered document). Nothing else is retried by the server.
- There are no background jobs, queues or schedulers (B-018, B-019), so there is nothing that runs later and could run twice. This also means nothing repairs a request that the client never retries.
- A dropped database connection in the middle of a transaction was NOT EXECUTED as a test. The forced-failure scenario proves the same property (PostgreSQL rolls back an unfinished transaction) by throwing inside the transaction.
- The server does not suppress database errors: a failed write surfaces as a 4xx with a plain reason when it is a rule, and a 500 with a request id when it is not. The baseline probe finds 0 server errors on 275 changing routes sent an empty body.

## 5. Known weak points

| Weak point | Finding | Status |
|---|---|---|
| Edits to fields other than status are last write wins | G-020 | DEFERRED to Phase 4 |
| A work order's history line is written after its status, not with it | Phase 2, B-010 remainder | Dispositioned in Phase 2 |
| Five handlers that save in several steps with no transaction | B-010 | Each dispositioned in Phase 2; none touches stock or money |
| A duplicate counter sale is removed by deleting rows, including its history lines | G-011 | DEFERRED to Phase 10 |
| The operations cockpit moves jobs in several writes | C-013 | Deferred; waits on scheduling rules |
