# Phase 3: concurrency results

Every test here sent real simultaneous requests to the server on the local QA database and then read the tables. "At once" means the requests were started together with `Promise.all` from one process; the server handled them on separate database connections. Results are in `qa/results/phase3-db.json`; the run before the corrections is kept in `qa/results/phase3-db-before-fixes.json`.

## 1. The twelve required tests

| # | Test | Executed | Result | What was checked in the database |
|---|---|---|---|---|
| 1 | Two users reserving the same stock | Yes | PASS | Two orders for the last 1000 lb: one 201, one 409; 1000 reserved, 0 available. Eight reservations of 300 lb against 1000 lb: exactly three succeed; 900 reserved, 100 available |
| 2 | Two users editing the same order | Yes | PASS for status; NOT PROTECTED for other fields | Confirm against cancel: one 200, one 409, the saved status is the winner's, one history line. Edits to other fields are last write wins (G-020, deferred to Phase 4) |
| 3 | Two work orders consuming the same material | Yes | NOT A PASS: both are accepted | Each gets its own number and history line; the item balance is unchanged. Nothing claims an item for a work order because processing moves no stock (G-008, M-016: REQUIRES BUSINESS DECISION) |
| 4 | Simultaneous inventory adjustments | In part | PASS for what exists | Stock adjustment does not exist on the real stock list (I-016). What does change a balance was raced: two receipts onto one item during three reservations (test 11), holds, transfers and returns. None lost an update |
| 5 | Concurrent transfer receipts | No | NOT EXECUTED | A transfer is one immediate step; there is no receipt (G-007). The nearest cases were run: the same transfer twice at once happens once; two transfers of one item to different branches at once: one wins, and the ledger ends where the item is |
| 6 | Concurrent order cancellations | Yes | PASS after correction | Cancel at the same moment as a reservation, 6 rounds: before the fix the cancelled order kept its reservation in 6 of 6; after, 0 of 6 (G-004). Cancel against confirm: one wins |
| 7 | Duplicate shipment confirmations | Yes | PASS | One shipment dispatched four times at once: one 200, three 409; stock down once; one movement |
| 8 | Concurrent pricing updates | Yes | PASS | Two managers change one list price at once: the saved price is one of the two, and each accepted change has its history line |
| 9 | Repeated invoice creation | Yes | PASS | The dispatched shipment invoiced three more times at once: one invoice, for the right amount |
| 10 | Simultaneous processing completion | Yes | PASS | Phase 2 integrity suite, still in the gates: two operators completing the last two operations of a job, 8 rounds; completion against cancellation, 4 rounds. Phase 3 adds: a work order completed twice is refused the second time and the first figures stand |
| 11 | Inventory receipt while reservations are pending | Yes | PASS | Three reservations of 200 lb and receipts of 500 lb and 250 lb on one 1000 lb item, all at once: all five accepted; 1750 on hand, 600 reserved, 1150 available; books in balance |
| 12 | Background reconciliation while transactions occur | In part | PASS | No background job exists (B-019). A reconciliation query over every stock row ran in a loop while 40 changes (reservations, receipts, cancellations, reads) ran at once: it never saw a row out of balance, in any sample |

Ten executed in whole or for the part that exists; one could not be executed (5); one executed and is not a pass (3).

## 2. Further tests

| Test | Result |
|---|---|
| One order line reserved from two items at once, 6 rounds | Before the fix: over-reserved in 6 of 6. After: 0 of 6 (G-004) |
| The same order sent three times at once with one request key | One order; the others are told to wait or given the first answer |
| A request key whose first request never finished | Told to wait while recent; taken over after 60 seconds; one order |
| The same item number received five times at once | One 201, four 409; one item, one movement |
| Five full payments at once on one invoice | One accepted; paid exactly once |
| Three part payments at once that together equal the balance | All accepted; total exact; no update lost |
| A return received four times at once | Counted once; one credit memo |
| A counter sale voided twice at once | One void; one credit memo; stock returned once |
| Eighty orders entered at the same moment, by two logins | Before the fix: 72 saved, 8 failed with a server error (G-017). After: 80 saved with 80 different numbers |

## 3. Defects found by these tests

| Finding | Severity | Status |
|---|---|---|
| G-004: a line reserved beyond its need; a cancelled order keeping stock | P1 | VERIFIED FIXED |
| G-017: document numbering fails under 80 simultaneous saves, and for good once a series has had enough rows deleted | P1 | VERIFIED FIXED |
| G-008: two work orders on one item | P2 | REQUIRES BUSINESS DECISION |
| G-020: edits to fields other than status are last write wins | P3 | DEFERRED to Phase 4 |

## 4. Deadlocks and lock waits

The PostgreSQL log for the whole session contains no "deadlock detected" line. The one place two kinds of request queue on the same row by design is the order row (reservation and cancellation); the wait is the length of one short transaction.

## 5. Limits of these tests

- One server process on one machine. On the host, requests are spread over many instances; the guards are all in the database (row locks, conditional updates, unique rules, serializable transactions), so they hold across instances, but that was not run.
- The largest burst was 80 writes and, separately, 400 reads. Sustained load over minutes was not run.
- A network failure between the server and the database was not simulated.
