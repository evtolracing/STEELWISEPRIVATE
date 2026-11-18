# Phase 10: financial posting integrity

The question for this document: can a business save and its journal entry ever part ways, under attack, under concurrency or when a process dies? Evidence from groups 4, 5 and 7 of the Phase 10 suite, on the QA ledger with test data.

## Rules that hold

| Rule | How it is held | Evidence |
|---|---|---|
| Every posted entry balances | Server rule, then a database guard that refuses an unbalanced post even when rows are written directly | group 4 "At the database, an unbalanced entry cannot be posted ..."; "Every posted entry in the books balances ..." |
| One entry per business event | Unique posting key (event kind, source type, source id) | group 4 "Each business event is in the books at most once"; group 7 receipts, dispatches, transfers at once |
| The entry is written in the save that makes the event | One transaction with a savepoint (Phase 9.5) | group 7 "The server killed in the middle of twenty dispatches ...": each dispatch is whole (shipment, stock movement, entry) or not there |
| A posted entry is never changed | Database guards; the application role cannot switch them off (file 17) | group 4 database scenarios, group 3 role scenarios |
| Corrections are reversals | Reverse by hand needs a reason; system entries are corrected through their record | group 4 reversal scenarios |
| Money never over-applied | Serializable transactions; money on one invoice takes turns (Y-020) | group 7: thirty payments of 10.00 on 100.00; six credit memos; ten payments and a credit on 50.00; twenty payments of 5.00 all recorded |
| Stock never below zero, never lost | Row-level guards in the stock services | group 7: two count adjustments at once both kept; two removals that exceed the stock never leave it below zero |
| Nothing posts while the books are stopped, and nothing is lost | Events kept; "record what is missing" posts each once | group 7 stop and resume |

## Found this phase

- **Y-020**: twenty payments on one invoice at the same moment answered 500 for some (every serializable retry used up). Nothing was half-saved, but the counter saw a server error. Fixed: turns per invoice, 12 attempts, and 409 BUSY if two server processes still overlap.
- **Y-021**: dispatch and billing are two saves (H-006). A crash between them left goods shipped with no invoice. The dispatch itself is whole (shipment, movement, cost-of-goods entry). The missing invoice was listed on the integrations report but raised nothing. Fixed: a check and an alert after 15 minutes; the invoice is raised once from the shipment. Making billing part of the dispatch save is not done: it would change what happens when billing is refused (a credit hold, a missing price), which is a business decision.

## Not verified

- Several server processes writing the same invoice: the database still serializes them, and the answer is 409 instead of 500; not run (Phase 11).
- Live data. Nothing in this phase touched the live books; they are not started (W-001).
