# Phase 9.5: ledger security review

Date: 2026-11-16. Evidence is `qa/sim/phase95-ledger.mjs`, group "Concurrency, authorization and failure recovery" (20 scenarios), `qa/sim/phase95-ui.cjs`, the baseline probe and the access coverage check, all on a local QA database. This is an engineering review of what was built. The full security phase is Phase 10; the items handed to it are at the end.

## Who may do what

Every check is on the server. The screen hides what a person cannot do, and the server refuses it whether or not the screen is used.

| Action | Owner, super administrator | CFO | Administrator | Executive, auditor | Branch manager | Everyone else |
|---|---|---|---|---|---|---|
| Read company reports, journal, chart, months, reconciliations, exports | Yes | Yes | Yes | Yes | No | No |
| Read reports of own branches (trial balance, account activity, revenue, margin, inventory, scrap, monthly) and entries with a line at an own branch | Yes | Yes | Yes | Yes | Yes | No |
| Receivables, sales tax, exceptions | Yes | Yes | Yes | Yes | No | No |
| Load the chart, change accounts and mappings, record approval | Yes | Yes | Yes | No | No | No |
| Write, post, reverse a manual entry; delete a draft | Yes | Yes | Yes | No | No | No |
| Close and reopen a month | Yes | Yes | Yes | No | No | No |
| Post an event again, settle an event, record what is missing, reconcile | Yes | Yes | Yes | No | No | No |
| Create and settle an export | Yes | Yes | Yes | No | No | No |
| Dry run | Yes | Yes | Yes | No | No | No |
| Start, stop and resume posting; the work-in-progress setting | Yes | Yes | No | No | No | No |
| Adjust a control account by a manual entry | Yes | Yes | No | No | No | No |

Two layers enforce this. The access gate (`lib/roleAccess.js`) now has a department rule for `/api/ledger`: no department may change it, and the read-only roles can change nothing anywhere. The route file (`routes/ledger.js`) then narrows managers and leadership to the roles in the table. `qa/tools/access-coverage.mjs`: 0 changing routes with no rule.

Tested:

- "People with no business in the books get nothing: sales, credit, inventory, shop floor, analyst, a customer, a supplier, and no login at all"
- "The auditor and the executive read every report and can change nothing"
- "A branch manager is limited to the branch reports: no receivables, tax, exceptions, chart, periods, reconciliation or export, and no changes"
- "An administrator keeps the books but cannot start, stop or reconfigure them; only the owner, a super administrator or the CFO can"
- "A branch manager reads the books of their own branch only" (another branch's entry answers 404, not 403, so its existence is not confirmed)

## Separation of duties

| Rule | Enforced where | Tested by |
|---|---|---|
| The person who writes a manual entry cannot post it | Server, `postDraft` | Manual entry scenarios; mutation E2 |
| The person who closed a month cannot reopen it, while another finance user exists | Server, `reopenPeriod` | "Reopening a closed month needs a reason and a different person"; mutation E9 |
| Keeping the books and starting or stopping them are different permissions | Route guards | "An administrator keeps the books but cannot start, stop or reconfigure them" |
| The accountant's approval is recorded by name, and who recorded it is logged | `approve`, audit log | Set-up scenarios |

Not enforced, and stated: a company with a single finance user. Then that one person can reopen a month they closed (the rule yields so the books are not locked forever). The one-person case for manual entries is not relaxed: a second finance user is required to post. Recorded as W-015.

## Immutability

| Attempt | Result | Tested by |
|---|---|---|
| Edit a posted entry through the API | There is no address for it; `PUT` and `PATCH` answer 405 | "A posted entry cannot be edited or deleted through the server" |
| Delete a posted entry through the API | 409 | same |
| `UPDATE`, `DELETE`, add a line, move a line, by direct SQL | Refused by trigger `LEDGER_IMMUTABLE` | "A posted entry cannot be changed by direct SQL either" |
| `TRUNCATE` the journal | Refused by its own trigger | same |
| Insert an entry already posted; an unbalanced entry; one line; a line with both sides | Refused by trigger or check constraint | "The database itself refuses an entry that does not balance, has one line, is written as posted, or has a line on both sides" |
| Write into a closed month by direct SQL | Refused | "Nothing can be written into a closed month: not by the screen, not by a second person, not by direct SQL" |

Limit: a database superuser can disable triggers. See W-014 below.

## Input handling

"Garbage in: malformed, hostile and oversized requests are refused with a reason, never a server error, and change nothing" covers: text where a number belongs, negative and zero amounts, three decimal places, amounts too large for the column, an account that is not a string, lists where an object belongs, a grouping key of `__proto__`, bad dates, bad paging, ids that are not ids.

Three defects were found by these scenarios and by the unit tests, and fixed in this phase:

| Finding | What | Fix |
|---|---|---|
| W-016 | A report grouped by `__proto__` or `constructor` reached an inherited property instead of being refused | `Object.hasOwn` check; mutation E12 |
| W-017 | Text that is not a number in an amount or a cost made the decimal library throw, which would have surfaced as a server error | A safe parser: bad text is "not a number" and is refused; unit mutation |
| W-018 | The approvals address answered a server error when sent an object where a list belongs | Validation; 400 |

The export file quotes cells that a spreadsheet would run as a formula.

## Audit

Every change writes an audit row in the same transaction, category FINANCIAL, with the person: chart loaded, account added or changed, mapping changed, approval recorded, dry run, activated, stopped, resumed, setting changed, entry drafted, posted, reversed, draft deleted, month closed, month reopened, event settled, missing events recorded, external account set, export created, downloaded, settled. Every report read is logged with the reader and the scope (`LEDGER_REPORT_READ`). Tested: "Every change to the books is in the audit log with the person, and every report read is logged with the reader's role".

Not logged: reading the journal list and a single entry (W-019, P3).

## The assistant

Read only, by construction: `services/ledgerAssistant.js` calls the same report functions as the Finance screen and nothing else. It has no path to post, approve, reverse or export.

- Finance roles, executive, auditor: company figures.
- Branch manager: own branches only; no receivables, no tax.
- Everyone else: no figure at all, and the assistant is instructed to say that ledger reports are for the finance team.
- Every read and every refusal is in the audit log (`LEDGER_AI_READ`, outcome READ or REFUSED, role, scope).
- The assistant is told never to call gross margin on material a profit or a P&L, and not to estimate.

Tested with the AI provider replaced by a local stand-in, so that what is sent to the model can be read: "The assistant reads the ledger for the people who may, within their scope, and can change nothing; every read and refusal is logged"; mutation E11.

Limit: what the model then says with those figures cannot be proven by a test. The control is on what it is given.

## Financial data exposure

- Cost and margin were already limited to managers, the inventory manager and buyers (Phase 6). The ledger is narrower: finance, executive, auditor, and a branch manager for own branches.
- Ledger tables have Row Level Security on with the same policy as every other table, so the hosting provider's public API keys cannot read them. Database file 16 applies it. Tested on a copy with those roles present: the `anon` role sees 0 of 22 accounts and an update as `authenticated` changes 0 rows.
- The status address tells a branch manager only whether the books are started, not who approved or what is blocked.

## Handed to Phase 10

| Item | Finding |
|---|---|
| Who holds database superuser or table-owner rights on the live database, since those can disable the immutability triggers. A separate application role without them is the fix; it is a hosting change and the owner's | W-014 |
| Backup and restore proven with the ledger tables, including that a restored journal still balances | W-020 |
| Recovery when the server stops between the business commit and nothing else: by design there is nothing in between (one transaction), to be confirmed by a kill test | Phase 10 |
| Review of the ledger's audit rows for completeness and retention | W-019 |
| Single finance user: whether the reopen rule may yield | W-015 |
| Penetration-style test of `/api/ledger` beyond the inputs tried here | Phase 10 |
| Encryption at rest and field-level protection for financial data | Hosting; Phase 10 |
