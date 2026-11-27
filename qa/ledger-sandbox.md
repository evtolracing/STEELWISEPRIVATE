# Finance ledger sandbox

Date: 2026-11-19. Scope: a sandbox mode for the finance ledger of the demonstration system, a full chart of accounts, an income statement and a balance sheet.

Readiness: **CONDITIONAL**. The code is tested on the QA database. It is fit for a demonstration. It is **not** fit to keep a real company's accounts, and no accountant has reviewed the chart or the posting rules.

## What was built

| Part | Where | What it does |
| --- | --- | --- |
| Full chart of accounts | `src/backend/src/lib/ledgerRules.js` | 103 accounts in place of 22: bank and cash, receivables and allowance, inventory and reserve, prepaids, property and equipment with accumulated depreciation, payables, accruals, payroll and tax liabilities, debt, equity, revenue with returns and discounts, cost of sales, operating expenses, other income and expense, income tax. Contra accounts carry their own normal side. |
| Statement sections | same file, `SECTIONS`, `sectionOf` | Each account falls in one section by type and code range, so a statement never needs a hand-kept list. |
| Income statement | `ledgerReports.incomeStatement` | Revenue, cost of goods sold, gross profit, operating expenses, operating income, other income and expense, income before tax, income tax, net income, for any date range. |
| Balance sheet | `ledgerReports.balanceSheet` | Current and long-term assets and liabilities and equity as of any date. Earnings of earlier years and net income of the current year are computed lines in equity. Reports whether it balances and the difference. |
| Sandbox start | `ledgerCutover.startSandbox`, `POST /api/ledger/sandbox/start` | One step for the owner, chief financial officer or super administrator: loads the chart, records every account and posting rule as approved by "SANDBOX: demonstration books, not approved by an accountant", runs the dry run, and opens the books. It needs the typed phrase `START SANDBOX BOOKS`. |
| Sandbox label | `routes/ledger.js` status, `FinancePage.jsx`, `FinanceBooks.jsx` | Books started this way are marked `sandbox: true` for good. A filled warning shows above every Finance tab, and each statement carries the notice. |
| Screens | `FinanceControl.jsx`, `FinanceBooks.jsx` | The sandbox start panel on "Start and stop", and the two statements under Reports. |
| Manual | `src/frontend/src/help/manualOperations.js` | A chapter section on sandbox books; the "what it is not" warning restated. |

No database change. No SQL Editor file is needed. The ordinary way of starting real books is unchanged, and it now refuses an approver name that begins with "sandbox".

## What it meets

| Practice | State | Evidence |
| --- | --- | --- |
| Double entry: every entry balances | Met | Phase 9.5 ledger suite, database CHECK constraints |
| Posted entries cannot be edited or deleted; corrections are reversing entries | Met | Phase 9.5 ledger suite |
| Accounting periods that open and close; no posting to a closed month | Met | Phase 9.5 ledger suite |
| Separation of duties on manual journal entries | Met | Phase 9.5 ledger suite; sandbox suite scenario on a journal entry |
| Audit trail of who did what | Met | `LEDGER_SANDBOX_STARTED` and the existing ledger audit events |
| Subledgers tie to control accounts (receivables, inventory, sales tax) | Met | Reconciliation checks in the sandbox suite |
| Chart of accounts in the usual five-part order with contra accounts | Met | `src/backend/test/ledgerChart.test.js` |
| Income statement in multiple-step form | Met | sandbox suite, browser suite |
| Balance sheet classified current and long-term, and in balance | Met | sandbox suite, browser suite |
| Statement of cash flows | **Not built** | |
| Statement of changes in equity | **Not built** | |
| Notes and disclosures | **Not built** | |

"Met" means the behaviour is tested here. It does not mean the books comply with US GAAP or any other framework. That judgement belongs to a licensed accountant.

## What is not in it

1. Supplier invoices and an accounts payable subledger. Account 2010 exists, and nothing posts to it by itself.
2. Bank feeds and bank reconciliation.
3. Depreciation runs, accruals and prepaid amortisation. They are journal entries a person posts.
4. Payroll.
5. Income tax calculation.
6. More than one currency.
7. A year-end closing entry. The balance sheet computes retained earnings instead.
8. Consolidation of more than one company.
9. Cash flow statement, statement of changes in equity, notes.
10. Review of the chart and of the 17 posting rules by an accountant. The chart is a common template for a steel service centre and nothing more.

## Tests run in this session, on the local QA database

| Check | Result |
| --- | --- |
| Backend unit tests (`npm test` in `src/backend`) | 283 of 283 pass |
| Phase 9.5 ledger scenarios (`qa/sim/phase95-ledger.mjs`) | 158 of 158 pass |
| Finance ledger sandbox (`qa/sim/ledger-sandbox.mjs`) | 7 of 7 pass, 59 checks |
| Finance ledger sandbox in a browser (`qa/sim/ledger-sandbox-ui.cjs`) | 5 of 5 pass, 27 checks |
| Phase 9.5 Finance screens (`qa/sim/phase95-ui.cjs`) | 13 of 13 pass, 67 checks |
| Lint, whole repository (ceiling 1,572 warnings, 0 errors) | 1,572 warnings, 0 errors |
| Frontend build | Builds |
| Whole gate script `qa/tools/run-gates.sh` | NOT VERIFIED in this session. The two new suites are added to it. |
| The hosted database and Vercel | NOT VERIFIED. Nothing was run against them. |

The browser check found one defect before it was committed: the sandbox warning showed on the Overview tab only. It now sits above the tabs, and the check fails without that.

## Gates A to J

| Gate | State |
| --- | --- |
| A Requirements | PASS for the request as scoped above; the items under "What is not in it" are outside it |
| B Code quality | PASS, lint within the ceiling |
| C Tests | PASS for the suites listed; whole gate script NOT VERIFIED |
| D Security | PASS: the start is limited to three roles, needs a typed phrase, and is audited. No full security review was made, so anything wider is NOT ASSESSED |
| E Data integrity | PASS on QA: statements agree with the trial balance and the balance sheet balances |
| F Performance | NOT ASSESSED |
| G Usability | PASS for the two statements and the banner at desktop and phone width |
| H Documentation | PASS: this file and the manual section |
| I Deployment | NOT VERIFIED until merged and deployed |
| J Owner acceptance | Open: the owner merges, and the owner starts the sandbox books himself |

## What the owner does

1. Say when to merge.
2. Make sure database updates 16 to 18 (the ledger tables) are applied on the hosted database. Without them the Finance screen cannot start any books.
3. After Vercel deploys, sign in as owner, chief financial officer or super administrator. An administrator login cannot start books.
4. Finance, "Start and stop", "Start sandbox books", type the phrase. This cannot be undone on that database.

## Finding AB-001, 2026-11-27: the start ran past the hosted time limit (P1, fixed, NOT VERIFIED on the hosted system)

**What happened.** With 4,313 pieces of stock on the hosted database, "Start sandbox books" was cut off twice by the hosting platform at its 30 second limit (runtime log, 23:20:20 and 23:21:36 UTC). The platform answered with `{ "error": { "code", "message" } }`, the Finance screen tried to show that object as text, and the page broke with React error 31.

**Was anything written.** The opening balances are posted inside one database transaction, so a start that is cut off keeps none of them. The chart of accounts and its sandbox approval are saved before that transaction and may be on the hosted database already; the start skips what is there. This was reasoned from the code and the logs. The hosted database itself was not looked at.

**Cause.** The start made one database round trip per account (about 240) and about a dozen per opening entry. On the QA database, which answers in under a millisecond, that took a second. On the hosted server every round trip costs tens of milliseconds.

**Fix.**
- `loadProposedChart` and the new `writeEntries` use a fixed number of statements however many accounts, branches and pieces there are. Each opening entry is still written as a draft and then posted, and the database's own checks still run on every one.
- Waiting for the invoice and stock tables is limited to 8 seconds and answers with a sentence, instead of waiting until the platform cuts the request off.
- The API client turns an error object from the platform into a sentence, for every screen, not only Finance.
- After a start that did not answer, the Finance screen reads the status again.
- The phrase is sent in capitals whatever way it was typed.

**Checks that fail without the fix.**

| Check | Before | After |
| --- | --- | --- |
| `qa/sim/ledger-start-speed.mjs`: the start through a database made 20 ms slow per message, 6,894 pieces, limit 15 s | 56.1 s, fails | 5.6 s, 9 of 9 pass |
| `qa/sim/ledger-sandbox-start-ui.cjs`: the platform's cut-off answer on the screen, then a real start from the screen | "Objects are not valid as a React child (found: object with keys {code, message})", fails | 20 of 20 pass |

Also run in this session: backend unit tests 520 of 520; finance ledger sandbox 7 of 7; sandbox browser checks 5 of 5; Phase 9.5 Finance screens 13 of 13; frontend build; lint of the changed files clean.

**Not clean, and not from this change.** Phase 9.5 ledger scenarios: 155 of 158. The three counter sale scenarios fail with "that product is not for sale", the same on the code before this fix. The QA database now holds the working inventory, which retires the demo products those scenarios sell. Whole-repository lint count and the whole gate script: NOT VERIFIED in this session.
