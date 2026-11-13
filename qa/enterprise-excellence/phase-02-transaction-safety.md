# Phase 2: transaction and concurrency safety

What happens when a save has several steps, when two people act at once, when a request is repeated, and when steps arrive in the wrong order. Every result below was produced in this session on the local QA database (`steelwise_qa`), against a running server, and checked against the database rather than against the server's reply.

## 1. The patterns the code uses

| Pattern | Where | What it protects |
|---|---|---|
| One transaction for a multi-step save | Order entry, allocation, dispatch, invoice, payment, credit, return receipt, receiving, transfer, hold; since Phase 2: operation start, complete, reassign, job plan, staging ship, recipe change, login create, edit, delete and reset, counter sale with its stock, the claim of a void with its stock | A failure leaves nothing half-saved |
| Conditional update ("only if it is still as I read it") | Stock levels (`qtyAvailable >= n`), order, shipment, invoice, return and work order status; since Phase 2: job status, shelf stock | Two requests cannot both win |
| Row lock (`SELECT … FOR UPDATE`) | Since Phase 2: completing an operation locks its dispatch job and its job | Two completions are decided one after the other |
| Unique number with retry | `lib/numbering.js` | Simultaneous creates get distinct numbers |
| Natural request key | Counter sale id (`QS:<id>` on the order) | A repeated sale is recognised |
| Database rules | Stock never negative; on hand = available + reserved + held; foreign keys | The last line of defence, whatever the code does |

Isolation level is PostgreSQL's default (read committed). The patterns above are the ones that are correct at that level; no handler relies on serializable isolation. That is recorded for Phase 3.

## 2. The ten tests named in the Phase 2 instruction

| # | Test | Supported | Result | Evidence |
|---|---|:-:|---|---|
| 1 | Two users reserving the same material | Yes | PASS: exactly one wins, the balance is unchanged for the loser | Simulation probe, 3 seeds: statuses 201 and 409 |
| 2 | Duplicate order submissions | In part | Counter sale: PASS (one sale sent three times at once is one sale, each copy answered as that sale, with stock to spare and for the last piece). Staff order entry and web checkout: NOT PROTECTED on the server; a repeat creates a second order. Finding C-006, deferred to Phase 3 because it needs a table | `phase2-integrity` counter checks; code read; simulation "10 simultaneous orders all saved" |
| 3 | Simultaneous inventory adjustments | In part | The real stock list has no adjustment (I-016, the owner's rule is missing). The changes it does have were raced: three holds at once hold the quantity once; two transfers of one item at once are each recorded in order and the item is where the last put it; three counter sales of three from a shelf of seven: two succeed, one is refused, one piece left | `phase2-integrity` |
| 4 | Concurrent transfer receipts | No | NOT EXECUTED. A transfer on the real stock list is immediate: there is no in-transit state and no receipt to race. The second stock list has transfer statuses but is a JSON document with no database rule (B-009) and is to be retired or connected | Code read: `routes/inventory.js` |
| 5 | Repeated shipment confirmation | Yes | PASS: one shipment dispatched three times at once is counted once | Simulation probe: 409, 409, 200; line shipped equals ordered |
| 6 | Duplicate invoice generation | Yes | PASS: billed once | Simulation probe: 409, 409, 409 after the first; 1 invoice |
| 7 | Work order completion during cancellation | Yes | PASS, both kinds. Coil work order completed and cancelled at the same moment, 4 rounds: exactly one wins, the record matches the answer, one history line. Job cancelled while its last operation completes, 8 rounds: the job, its history and both answers agree. Operations of a cancelled job: refused, job stays cancelled | `phase2-integrity`. The job cases failed on the code before Phase 2 |
| 8 | Interrupted processing | In part | PASS for the case that can be produced without stopping the database: a counter sale that is refused for stock after its order, invoice and payment rows were written inside the transaction leaves no order (count unchanged) and no stock change. A plan refused part-way leaves the old plan. A refused reassign leaves the clock running. Stopping the server or the database in the middle of a transaction was NOT EXECUTED; the guarantee there is PostgreSQL's | `phase2-integrity` |
| 9 | Retried requests | Yes | PASS: repeated operation completion changes nothing; repeated counter sale takes nothing more; repeated void is refused and returns nothing more; a payment after the invoice is paid is refused | `phase2-integrity`; simulation probes for payment and return |
| 10 | Out-of-order events | Yes | PASS: a job that has not started cannot be completed; a shipment that has not left cannot be delivered; an operation of a cancelled job cannot start | `phase2-integrity` |

Also raced, beyond the ten: two operators finishing the last two operations of a job (8 rounds: the job reaches inspection every time, with one history line; before Phase 2 it never did); two people moving one job (8 rounds); three full payments on one invoice; one return received three times; ten simultaneous orders and ten simultaneous jobs with distinct numbers.

## 3. Multi-step saves outside a transaction

Discovery counts changing handlers that make two or more database writes with no transaction.

| | Count |
|---|---:|
| Phase 1 baseline | 16 |
| After Phase 2 | 5 |

The five that remain, each with its disposition:

| Handler | Why it remains |
|---|---|
| `POST /api/ops-cockpit/recommendations/accept` | C-013: what "accept" may do needs the owner's scheduling rules. Limited to three roles meanwhile |
| `POST /api/v1/partner/carrier/shipments/:id/pod` | C-002: the route cannot work as written and no carrier can reach it |
| `POST /api/demand-shaping/suggestions` | Reads a setting and writes a log of what was shown; nothing to keep consistent |
| `POST /api/assets/seed-from-work-centers` | A repeatable set-up import; a second run fills what a first left |
| `DELETE /api/v1/dispatch/work-center-types/:id` | A check for work centers that still use the type, followed by one write; the check is a guard, not a second write |

One further gap is not a handler count: voiding a counter sale claims the void and returns the stock in one transaction, then makes the credit memo and the refund in two more (C-010).

## 4. What was found and fixed in this area

| Finding | Before | After |
|---|---|---|
| C-005 | Two operators completing the last two operations at once: the job stayed in process in 8 of 8 rounds | Reaches inspection in 8 of 8, once |
| C-005 | Completing an operation of a cancelled job moved the job to "waiting for inspection" | Refused with 409; the job stays cancelled |
| C-005 | Two people moving a job at once both succeeded; history did not match | The second is told the job changed (409) or follows the first; history is a consistent chain |
| B-010 | A reassign to an operator who does not exist paused the running clock and then failed | Refused before anything is saved |
| B-010 | Starting an operation could save the operation without its time log | One transaction |
| B-025 | A counter sale changed no stock | Stock, order, invoice and payment in one transaction; refused when the shelf is short |

## 5. Not verified

- Behaviour when the database connection drops in the middle of a transaction.
- Any of this under load beyond a handful of simultaneous requests.
- Deadlock behaviour at volume. By reading: operation completion locks dispatch job then job, always in that order; dispatch and allocation use conditional updates and take no explicit locks.
- The live database's isolation settings. Not touched.
