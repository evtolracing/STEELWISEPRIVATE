# Phase 9.5: ledger architecture

Date: 2026-11-16. What was built, where it is, and the rules it keeps. Stack unchanged: Node and Express, PostgreSQL through Prisma, React and Material UI in JavaScript and JSX. No TypeScript.

## Shape

It is a subledger inside the existing product, not a separate accounting system. Business code is unchanged except for one added call per event. The ledger has one writer (the posting engine) and nothing else inserts journal rows.

```
business save (invoice, payment, movement, transfer, work order, cost change)
   │  same database transaction
   ▼
ledger.record(tx, eventKind, sourceType, sourceId)        src/backend/src/services/ledger.js
   │  1. is the ledger active?  no → returns, nothing written
   │  2. already recorded?      yes → returns the same event (one event per business record)
   │  3. SAVEPOINT
   │  4. facts read from the business records               factsFor()
   │  5. rule turns facts into lines by PURPOSE             src/backend/src/lib/ledgerRules.js (no database)
   │  6. purposes resolved to approved accounts             accountsByKey()   (no fallback)
   │  7. entry written as DRAFT with lines, then POSTED     writeEntry()
   │        database triggers check balance, period, immutability
   │  8. event row set to POSTED with the entry
   ▼
on any failure in 4 to 7: ROLLBACK TO SAVEPOINT, event row set to FAILED or RECONCILIATION_REQUIRED
with the reason. The business save continues and commits.
```

A failure of the ledger never undoes or blocks the business event, and never leaves half an entry. The one exception is a conflict between two saves at the same moment (a serialization failure or deadlock): that is passed up so the whole business save is run again by the retry it already had.

## Files

| File | Role |
|---|---|
| `src/backend/prisma/migrations/20261117090000_financial_ledger/migration.sql` | Ten tables, the entry number sequence, three functions, four triggers |
| `src/backend/src/lib/ledgerRules.js` | The proposed chart and mappings; every posting rule as a pure function; money arithmetic; manual line validation; day and period helpers |
| `src/backend/src/services/ledger.js` | Activation state, the posting engine, reversal, retry, manual entries, periods, chart and mapping changes, approval |
| `src/backend/src/services/ledgerCutover.js` | Dry run, activation with opening balances, resume |
| `src/backend/src/services/ledgerReports.js` | Trial balance, account activity, revenue, gross margin, receivables, sales tax, inventory, scrap, monthly activity, exceptions, "not recorded", reconciliation, export |
| `src/backend/src/services/ledgerAssistant.js` | What the assistant may read, by role |
| `src/backend/src/routes/ledger.js` | The API under `/api/ledger`, with the role checks |
| `src/frontend/src/pages/Finance/*.jsx` | The Finance screen (four files) |

Calls added to existing code (one line each, inside the existing transaction): `services/billing.js` (invoice, credit, payment, refund, invoice cancel), `routes/shipments.js` (shipment), `lib/receiving.js` and `routes/inventory.js` (receipt), `lib/stockChanges.js` (adjustment, scrap, work order), `lib/transfers.js` (transfer sent, received, shortage, cancel), `routes/quickSale.js` (counter sale and void), `routes/returns.js` (restock, scrap), `routes/coils.js` (cost change).

## Tables

| Table | Holds | Key rules |
|---|---|---|
| `LedgerAccount` | The chart | Unique code; approval name and time |
| `LedgerMapping` | Purpose to account | One row per purpose; approval name and time |
| `LedgerPeriod` | Calendar months | Unique year and month; OPEN or CLOSED; who closed, who reopened, why |
| `LedgerEvent` | One row per business event the ledger was told about | Unique on event kind, source type and source id. This is what makes posting happen once |
| `JournalEntry` | Entry header | Unique entry number; DRAFT or POSTED; kind SYSTEM, MANUAL, REVERSAL or OPENING; `reversesEntryId` unique, so an entry is reversed once |
| `JournalLine` | Lines | Debit or credit, never both, never negative, never zero (`JournalLine_one_side`); account; branch, division, customer, supplier, product, stock item, tax state |
| `LedgerExternalAccount` | Account names in an outside accounting product | Per provider |
| `LedgerExportBatch`, `LedgerExportItem` | Export files and which entries each holds | An entry is in one live batch per provider |
| `LedgerReconciliation` | Each reconciliation run and its result | Never changed after it is written |

The on/off state is one row in the existing `AppSetting` table (`ledger.activation`): active or not, the cutover date, the time zone, who approved the policies and when, the dry run it was activated from, who activated.

## Rules kept by the database itself

These hold even if application code is wrong, because they are triggers and constraints (migration `20261117090000_financial_ledger`):

| Rule | How |
|---|---|
| An entry is created as a draft and then posted | Insert with status POSTED is refused |
| A posted entry balances and has at least two lines | Checked when status becomes POSTED: `LEDGER_UNBALANCED`, `LEDGER_TOO_FEW_LINES`; `totalDebit` is set from the lines |
| An entry is posted only into an open period, and into the period its date falls in | `LEDGER_PERIOD_CLOSED`, `LEDGER_WRONG_PERIOD`; the trigger takes a shared lock on the period row, so closing waits for postings in flight |
| A posted entry is never changed or deleted, and neither are its lines | `LEDGER_IMMUTABLE` on update and delete |
| The journal cannot be emptied | `TRUNCATE` is refused by its own trigger |
| A line has exactly one side and a positive amount | Check constraint |
| An entry is reversed at most once | Unique `reversesEntryId` |
| A business event is recorded at most once | Unique key on `LedgerEvent` |

A database superuser can switch triggers off (`session_replication_role`). The QA reset uses exactly that, on a local QA database only. Who holds that right on the live database is a Phase 10 item (W-014).

## Statuses of an event

| Status | Meaning | What happens next |
|---|---|---|
| POSTED | Its entry is in the books | Nothing |
| NOT_POSTED | Nothing to post, with the reason (a zero-value movement; undone before it posted; settled by a person) | Nothing |
| FAILED | A fact or an approval was missing (no mapping, mapping not approved, account not active) | Fix the cause, then "post again" |
| RECONCILIATION_REQUIRED | Real, but needs a person: no cost on file, closed period, intercompany transfer, an event undone that predates the books | Enter the cost and post again, choose a posting date, or settle it with a note |
| REVERSED | Its business event was undone and a reversal entry was posted | Nothing |

## Corrections

History is never edited. A business event that is undone (invoice cancelled, transfer called back, counter sale voided) posts a reversal entry in the same save. A manual entry is corrected by "reverse", which writes the mirror entry with a reason. An entry that came from a business event cannot be reversed by hand: undo the event.

## Manual entries

Written as a draft by one finance user and posted by another (the server refuses the same person). A memo is required. Control accounts are refused unless the request carries the named approval. A draft dated in a closed period, or before the books began, is refused.

## Time and dates

The books keep days, not moments. An event's day is its own date counted in the time zone chosen at activation. The choice is required at activation and is recorded (W-003: it cannot be changed afterwards without an accountant's decision on the days already posted).

## Numbers

Entry numbers come from a database sequence: unique and increasing, with a gap wherever a save was rolled back (W-004). Invoice numbers, which are gapless by the owner's earlier decision, are unaffected.

## Scale

One entry per event, written in the event's own transaction, indexed by period, date, source, account and branch. Measured behaviour with 80 branches is in `phase-09-5-regression-results.md`. Invoices of one numbering series now take turns inside a server process (W-021), which removed a pile-up found by the load test.
